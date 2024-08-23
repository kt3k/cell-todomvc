// https://jsr.io/@kt3k/cell/0.3.6/util.ts
var READY_STATE_CHANGE = "readystatechange";
var p;
function documentReady(doc = document) {
  p ??= new Promise((resolve) => {
    const checkReady = () => {
      if (doc.readyState === "complete") {
        resolve();
        doc.removeEventListener(READY_STATE_CHANGE, checkReady);
      }
    };
    doc.addEventListener(READY_STATE_CHANGE, checkReady);
    checkReady();
  });
  return p;
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
  if (typeof DEBUG_IGNORE === "object" && DEBUG_IGNORE?.has(event))
    return;
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

// https://jsr.io/@kt3k/cell/0.3.6/mod.ts
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
      el.addEventListener(`__unmount__:${name}`, () => {
        el.classList.remove(initClass);
      }, { once: true });
      const on = (type, selector, options, handler) => {
        if (typeof selector === "function") {
          handler = selector;
          selector = void 0;
          options = void 0;
        } else if (typeof options === "function" && typeof selector === "string") {
          handler = options;
          options = void 0;
        } else if (typeof options === "function" && typeof selector === "object") {
          handler = options;
          options = selector;
          selector = void 0;
        }
        if (typeof handler !== "function") {
          throw new Error(
            `Cannot add event listener: The handler must be a function, but ${typeof handler} is given`
          );
        }
        addEventListener(name, el, type, handler, selector, options);
      };
      const onOutside = (type, handler) => {
        assertEventType(type);
        assertEventHandler(handler);
        const listener = (e) => {
          if (el !== e.target && !el.contains(e.target)) {
            logEvent({
              module: "outside",
              color: "#39cccc",
              e,
              component: name
            });
            handler(e);
          }
        };
        document.addEventListener(type, listener);
        el.addEventListener(`__unmount__:${name}`, () => {
          document.removeEventListener(type, listener);
        }, { once: true });
      };
      const context = {
        el,
        on,
        onOutside,
        query: (s) => el.querySelector(s),
        queryAll: (s) => el.querySelectorAll(s)
      };
      const html = component(context);
      if (typeof html === "string") {
        el.innerHTML = html;
      } else if (html && typeof html.then === "function") {
        html.then((html2) => {
          if (typeof html2 === "string") {
            el.innerHTML = html2;
          }
        });
      }
    }
  };
  initializer.sel = `.${name}:not(.${initClass})`;
  registry[name] = initializer;
  if (document.readyState === "complete") {
    mount();
  } else {
    documentReady().then(() => {
      mount(name);
    });
  }
}
function assertEventHandler(handler) {
  assert(
    typeof handler === "function",
    `Cannot add an event listener: The event handler must be a function, ${typeof handler} (${handler}) is given`
  );
}
function assertEventType(type) {
  assert(
    typeof type === "string",
    `Cannot add an event listener: The event type must be a string, ${typeof type} (${type}) is given`
  );
}
function addEventListener(name, el, type, handler, selector, options) {
  assertEventType(type);
  assertEventHandler(handler);
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
    el.removeEventListener(type, listener, options);
  }, { once: true });
  el.addEventListener(type, listener, options);
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
    ;
    [].map.call(
      (el || document).querySelectorAll(registry[className].sel),
      registry[className]
    );
  });
}

// src/todo-models.ts
var Todo = class {
  constructor(id, title, completed) {
    this.id = id;
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
  getById(id) {
    return this.todos.find((todo) => todo.id === id);
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
        ({ id, title, completed }) => new Todo(id, title, completed)
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
register(TodoApp, "todoapp");
function TodoApp({ el, on, query }) {
  el.dataset.framework = "cell";
  const todos = TodoCollection.restore();
  let id = todos.maxId() + 1;
  let filter = "all";
  globalThis.onhashchange = () => {
    onChangeFilter();
  };
  onChangeFilter();
  query(".new-todo").focus();
  updateTodo();
  on("keypress", ".new-todo", (e) => {
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
  });
  on("click", ".toggle", (e) => {
    todos.getById(e.target.parentElement.parentElement.id)?.toggle();
    updateTodo();
  });
  on("click", ".toggle-all", (e) => {
    if (e.target.checked) {
      todos.completeAll();
    } else {
      todos.uncompleteAll();
    }
    updateTodo();
  });
  on("click", ".destroy", (e) => {
    const toRemove = todos.getById(
      e.target.parentElement.parentElement.id
    );
    todos.remove(toRemove);
    updateTodo();
  });
  on("click", ".clear-completed", () => {
    todos.completed().forEach((todo) => {
      todos.remove(todo);
    });
    updateTodo();
  });
  on("dblclick", ".todo > .view > label", (e) => {
    const todoItem = e.target.parentElement.parentElement;
    const todo = todos.getById(todoItem.id);
    todoItem.classList.add("editing");
    const editInput = todoItem.querySelector(".edit");
    editInput.value = todo.title;
    editInput.focus();
  });
  const onEdit = (e) => {
    const input = e.target;
    if (e.which === 13) {
      input.blur();
    } else if (e.which === 27) {
      input.value = todos.getById(input.parentElement.id).title;
      input.blur();
    }
  };
  on("keypress", ".edit", onEdit);
  on("keydown", ".edit", onEdit);
  on("focusout", ".edit", (e) => {
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
  });
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
/*! Cell v0.3.6 | Copyright 2024 Yoshiya Hinosawa and Capsule contributors | MIT license */
