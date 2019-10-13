import React, {
  useEffect,
  useState,
  useMemo,
  memo,
  useRef,
  useCallback
} from "react";
import { createAdd, createRemove, createSet, createToggle } from "./actions";
import reducer from "./reducers";

function bindActionCreates(actionCreators, dispatch) {
  const ret = {};

  for (let key in actionCreators) {
    ret[key] = function(...args) {
      const actionCreator = actionCreators[key];
      const action = actionCreator(...args);
      dispatch(action);
    };
  }

  return ret;
}

const Control = memo(function Control(props) {
  const { addTodo } = props;
  const intputRef = useRef();

  const onSubmit = e => {
    e.preventDefault();

    const newText = intputRef.current.value;

    if (newText.length === 0) {
      return;
    }

    addTodo(newText);

    intputRef.current.value = "";
  };

  return (
    <div className="control">
      <h1>todos</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          ref={intputRef}
          className="new-todo"
          placeholder="what needs to be done?"
        />
      </form>
    </div>
  );
});

const TodoItem = memo(function TodoItem(props) {
  const {
    todo: { id, text, complete },
    removeTodo,
    toggleTodo
  } = props;

  const onChange = () => {
    toggleTodo(id);
  };
  const onRemove = () => {
    removeTodo(id);
  };
  return (
    <li className="Todo-item">
      <input type="checkbox" onChange={onChange} checked={complete} />
      <label className={complete ? "complete" : ""}> {text}</label>
      <button onClick={onRemove}>&#xd7;</button>
    </li>
  );
});

const Todos = memo(function Todos(props) {
  const { todos, removeTodo, toggleTodo } = props;

  return (
    <ul>
      {todos.map(todo => {
        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            removeTodo={removeTodo}
            toggleTodo={toggleTodo}
          />
        );
      })}
    </ul>
  );
});

const LS_KEY = "_$_todo";
let store = {
  todos: [],
  incrementCount: 0
};

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [incrementCount, setIncrementCount] = useState(0);

  useEffect(() => {
    Object.assign(store, {
      todos,
      incrementCount
    });
  }, [todos, incrementCount]);

  const addTodo = useCallback(todo => {
    setTodos(todos => [...todos, todo]);
  }, []);

  const removeTodo = useCallback(id => {
    setTodos(todos =>
      todos.filter(todo => {
        return todo.id !== id;
      })
    );
  }, []);

  const toggleTodo = useCallback(id => {
    setTodos(todos =>
      todos.map(todo => {
        return todo.id === id
          ? {
              ...todo,
              complete: !todo.complete
            }
          : todo;
      })
    );
  }, []);

  const dispatch = action => {
    console.log("runnung dispatch");
    console.log(action);
    const setters = {
      todos: setTodos,
      incrementCount: setIncrementCount
    };

    if ("function" === typeof action) {
      action(dispatch, () => store);
      return;
    }

    const newState = reducer(store, action);

    for (let key in newState) {
      setters[key](newState[key]);
    }
  };

  useEffect(() => {
    const todos = JSON.parse(
      localStorage.getItem(LS_KEY) || JSON.stringify([])
    );
    dispatch(createSet(todos));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(todos));
  }, [todos]);

  return (
    <div className="todo-list">
      <Control
        {...bindActionCreates(
          {
            addTodo: createAdd
          },
          dispatch
        )}
      />
      <Todos
        {...bindActionCreates(
          {
            removeTodo: createRemove,
            toggleTodo: createToggle
          },
          dispatch
        )}
        todos={todos}
      />
    </div>
  );
}

export default TodoList;
