// https://jsr.io/@kt3k/cell/0.1.3/util.ts
var READY_STATE_CHANGE = "readystatechange";
var p;
function documentReady() {
  return p = p || new Promise((resolve) => {
    const doc = document;
    const checkReady = () => {
      if (doc.readyState === "complete") {
        resolve();
        doc.removeEventListener(READY_STATE_CHANGE, checkReady);
      }
    };
    doc.addEventListener(READY_STATE_CHANGE, checkReady);
    checkReady();
  });
}
var boldColor = (color) => `color: ${color}; font-weight: bold;`;
var defaultEventColor = "#f012be";
function logEvent({
  component,
  e,
  module,
  color
}) {
  if (typeof __DEV__ === "boolean" && !__DEV__)
    return;
  const event = e.type;
  console.groupCollapsed(
    `${module}> %c${event}%c on %c${component}`,
    boldColor(color || defaultEventColor),
    "",
    boldColor("#1a80cc")
  );
  console.log(e);
  if (e.target) {
    console.log(e.target);
  }
  console.groupEnd();
}

// https://jsr.io/@kt3k/cell/0.1.3/mod.ts
var registry = {};
function assert(assertion, message) {
  if (!assertion) {
    throw new Error(message);
  }
}
function assertComponentNameIsValid(name) {
  assert(typeof name === "string", "The name should be a string");
  assert(
    !!registry[name],
    `The component of the given name is not registered: ${name}`
  );
}
function register(component, name) {
  assert(
    typeof name === "string" && !!name,
    "Component name must be a non-empty string"
  );
  assert(
    !registry[name],
    `The component of the given name is already registered: ${name}`
  );
  const initClass = `${name}-\u{1F48A}`;
  const initializer = (el) => {
    if (!el.classList.contains(initClass)) {
      el.classList.add(name);
      el.classList.add(initClass);
      el.addEventListener(`__ummount__:${name}`, () => {
        el.classList.remove(initClass);
      }, { once: true });
      const on = new Proxy(() => {
      }, {
        // simple event handler (like on.click = (e) => {})
        set(_, type, value) {
          addEventListener(name, el, type, value);
          return true;
        },
        get(_, outside) {
          if (outside === "outside") {
            return new Proxy({}, {
              set(_2, type, value) {
                assert(
                  typeof value === "function",
                  `Event handler must be a function, ${typeof value} (${value}) is given`
                );
                const listener = (e) => {
                  if (el !== e.target && !el.contains(e.target)) {
                    logEvent({
                      module: "outside",
                      color: "#39cccc",
                      e,
                      component: name
                    });
                    value(e);
                  }
                };
                document.addEventListener(type, listener);
                el.addEventListener(`__unmount__:${name}`, () => {
                  document.removeEventListener(type, listener);
                }, { once: true });
                return true;
              }
            });
          }
          return null;
        },
        // event delegation handler (like on(".button").click = (e) => {}))
        apply(_target, _thisArg, args) {
          const selector = args[0];
          assert(
            typeof selector === "string",
            "Delegation selector must be a string. ${typeof selector} is given."
          );
          return new Proxy({}, {
            set(_, type, value) {
              addEventListener(
                name,
                el,
                type,
                // deno-lint-ignore no-explicit-any
                value,
                selector
              );
              return true;
            }
          });
        }
      });
      const pub = (type, data) => {
        document.querySelectorAll(`.sub\\:${type}`).forEach((el2) => {
          el2.dispatchEvent(
            new CustomEvent(type, { bubbles: false, detail: data })
          );
        });
      };
      const sub = (type) => el.classList.add(`sub:${type}`);
      const context = {
        el,
        on,
        pub,
        sub,
        query: (s) => el.querySelector(s),
        queryAll: (s) => el.querySelectorAll(s)
      };
      const html = component(context);
      if (typeof html === "string") {
        el.innerHTML = html;
      }
    }
  };
  initializer.sel = `.${name}:not(.${initClass})`;
  registry[name] = initializer;
  documentReady().then(() => {
    mount(name);
  });
}
function addEventListener(name, el, type, handler, selector) {
  assert(
    typeof handler === "function",
    `Event handler must be a function, ${typeof handler} (${handler}) is given`
  );
  const listener = (e) => {
    if (!selector || [].some.call(
      el.querySelectorAll(selector),
      (node) => node === e.target || node.contains(e.target)
    )) {
      logEvent({
        module: "\u{1F48A}",
        color: "#e0407b",
        e,
        component: name
      });
      handler(e);
    }
  };
  el.addEventListener(`__unmount__:${name}`, () => {
    el.removeEventListener(type, listener);
  }, { once: true });
  el.addEventListener(type, listener);
}
function mount(name, el) {
  let classNames;
  if (!name) {
    classNames = Object.keys(registry);
  } else {
    assertComponentNameIsValid(name);
    classNames = [name];
  }
  classNames.map((className) => {
    [].map.call(
      (el || document).querySelectorAll(registry[className].sel),
      registry[className]
    );
  });
}

// src/todo-models.ts
var Todo = class {
  constructor(id2, title, completed) {
    this.id = id2;
    this.title = title;
    this.completed = completed;
  }
  toggle() {
    this.completed = !this.completed;
  }
};
var KEY = "cell-todomvc";
var TodoCollection = class _TodoCollection {
  constructor(todos = []) {
    this.todos = todos;
  }
  getById(id2) {
    return this.todos.find((todo) => todo.id === id2);
  }
  remove(toRemove) {
    this.todos = this.todos.filter((todo) => todo.id !== toRemove.id);
  }
  add(todo) {
    this.todos.push(todo);
  }
  get length() {
    return this.todos.length;
  }
  has(test) {
    return this.todos.some((todo) => todo.id === test.id);
  }
  completed() {
    return new _TodoCollection(this.todos.filter((todo) => todo.completed));
  }
  uncompleted() {
    return new _TodoCollection(this.todos.filter((todo) => !todo.completed));
  }
  completeAll() {
    this.todos.forEach((todo) => {
      todo.completed = true;
    });
  }
  uncompleteAll() {
    this.todos.forEach((todo) => {
      todo.completed = false;
    });
  }
  forEach(f) {
    this.todos.forEach(f);
  }
  toJSON() {
    return JSON.stringify(this.todos);
  }
  static fromJson(json) {
    return new _TodoCollection(
      JSON.parse(json).map(
        ({ id: id2, title, completed }) => new Todo(id2, title, completed)
      )
    );
  }
  save() {
    localStorage.setItem(KEY, this.toJSON());
  }
  static restore() {
    return _TodoCollection.fromJson(localStorage.getItem(KEY) || "[]");
  }
  maxId() {
    return Math.max(0, ...this.todos.map((todo) => +todo.id));
  }
};

// src/todoapp.ts
var id = 0;
var filter = "all";
register(TodoApp, "todoapp");
function TodoApp({ el, on, query }) {
  el.dataset.framework = "cell";
  const todos = TodoCollection.restore();
  id = todos.maxId() + 1;
  globalThis.onhashchange = () => {
    onChangeFilter();
  };
  onChangeFilter();
  query(".new-todo").focus();
  updateTodo();
  on(".new-todo").keypress = (e) => {
    if (e.which !== 13) {
      return;
    }
    const newInput = query(".new-todo");
    const title = query(".new-todo")?.value?.trim();
    if (!title) {
      return;
    }
    newInput.value = "";
    todos.add(new Todo(`${id++}`, title, false));
    updateTodo();
  };
  on(".toggle").click = (e) => {
    todos.getById(e.target.parentElement.parentElement.id)?.toggle();
    updateTodo();
  };
  on(".toggle-all").click = (e) => {
    if (e.target.checked) {
      todos.completeAll();
    } else {
      todos.uncompleteAll();
    }
    updateTodo();
  };
  on(".destroy").click = (e) => {
    const toRemove = todos.getById(
      e.target.parentElement.parentElement.id
    );
    todos.remove(toRemove);
    updateTodo();
  };
  on(".clear-completed").click = () => {
    todos.completed().forEach((todo) => {
      todos.remove(todo);
    });
    updateTodo();
  };
  on(".todo > .view > label").dblclick = (e) => {
    const todoItem = e.target.parentElement.parentElement;
    const todo = todos.getById(todoItem.id);
    todoItem.classList.add("editing");
    const editInput = todoItem.querySelector(".edit");
    editInput.value = todo.title;
    editInput.focus();
  };
  on(".edit").keypress = on(".edit").keydown = (e) => {
    const input = e.target;
    if (e.which === 13) {
      input.blur();
    } else if (e.which === 27) {
      input.value = todos.getById(input.parentElement.id).title;
      input.blur();
    }
  };
  on(".edit").focusout = (e) => {
    const input = e.target;
    const value = input.value.trim();
    const todoItem = input.parentElement;
    if (value) {
      todos.getById(todoItem.id).title = value;
      todoItem.classList.remove("editing");
    } else {
      todos.remove(todos.getById(todoItem.id));
      todoItem.classList.remove("editing");
    }
    updateTodo();
  };
  function onChangeFilter() {
    const { hash } = location;
    if (hash === "#/active") {
      filter = "uncompleted";
    } else if (hash === "#/completed") {
      filter = "completed";
    } else {
      filter = "all";
    }
    query('a[href="#/all"]').classList.toggle("selected", filter === "all");
    query('a[href="#/active"]').classList.toggle(
      "selected",
      filter === "uncompleted"
    );
    query('a[href="#/completed"]').classList.toggle(
      "selected",
      filter === "completed"
    );
    updateTodo();
  }
  function updateTodo() {
    todos.save();
    const uncompleted = todos.uncompleted();
    const completed = todos.completed();
    const todoList = query(".todo-list");
    query(".todo-count strong").textContent = `${uncompleted.length}`;
    query(".todo-count .plural").classList.toggle(
      "hidden",
      uncompleted.length === 1
    );
    query(".main").classList.toggle("hidden", todos.length === 0);
    query(".footer").classList.toggle("hidden", todos.length === 0);
    query(".toggle-all").classList.toggle("hidden", todos.length === 0);
    query('label[for="toggle-all"]').classList.toggle(
      "hidden",
      todos.length === 0
    );
    query(".toggle-all").checked = uncompleted.length === 0;
    query(".clear-completed").classList.toggle(
      "hidden",
      completed.length === 0
    );
    if (filter === "all" && todos.length === todoList.children.length) {
      todos.forEach((todo) => {
        const li = todoList.querySelector(`[id="${todo.id}"]`);
        li.classList.toggle("completed", todo.completed);
        li.querySelector("label").textContent = todo.title;
        li.querySelector(".toggle").checked = todo.completed;
      });
    } else {
      const visibleItems = filter === "uncompleted" ? uncompleted : filter === "completed" ? completed : todos;
      todoList.innerHTML = "";
      visibleItems.forEach((todo) => {
        const li = document.createElement("li");
        li.innerHTML = `
        <div class="view">
          <input class="toggle" type="checkbox" ${todo.completed ? "checked" : ""}/>
          <label>${todo.title}</label>
          <button class="destroy"></button>
        </div>
        <input class="edit" type="text" />
      `;
        li.id = todo.id;
        li.classList.add("todo");
        li.classList.toggle("completed", todo.completed);
        todoList.appendChild(li);
      });
    }
  }
}
/*! Cell v0.1.3 | Copyright 2024 Yoshiya Hinosawa and Capsule contributors | MIT license */
