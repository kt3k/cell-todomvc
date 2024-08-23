import { type Context, register } from "jsr:@kt3k/cell";
import { Todo, TodoCollection } from "./todo-models.ts";

type Filter = "all" | "completed" | "uncompleted";

register(TodoApp, "todoapp");

function TodoApp({ el, on, query }: Context) {
  el.dataset.framework = "cell";
  const todos = TodoCollection.restore();
  // The id of the next todo item
  let id = todos.maxId() + 1;
  // The current filter
  let filter: Filter = "all";

  globalThis.onhashchange = () => {
    onChangeFilter();
  };
  onChangeFilter();
  query<HTMLInputElement>(".new-todo")!.focus();
  updateTodo();

  on("keypress", ".new-todo", (e) => {
    if (e.which !== 13) {
      // If not a Enter, ignore the event
      return;
    }
    const newInput = query<HTMLInputElement>(".new-todo")!;
    const title = query<HTMLInputElement>(".new-todo")?.value?.trim();
    if (!title) {
      return;
    }

    newInput.value = "";
    todos.add(new Todo(`${id++}`, title, false));
    updateTodo();
  });

  on("click", ".toggle", (e) => {
    todos.getById((e.target as Element).parentElement!.parentElement!.id)
      ?.toggle();
    updateTodo();
  });

  on("click", ".toggle-all", (e) => {
    if ((e.target as any).checked) {
      todos.completeAll();
    } else {
      todos.uncompleteAll();
    }
    updateTodo();
  });

  on("click", ".destroy", (e) => {
    const toRemove = todos.getById(
      (e.target as Element).parentElement!.parentElement!.id,
    )!;
    todos.remove(toRemove);
    updateTodo();
  });

  on("click", ".clear-completed", () => {
    todos.completed().forEach((todo) => {
      todos.remove(todo);
    });
    updateTodo();
  });

  on("dblclick", ".todo > .view > label", (e: MouseEvent) => {
    const todoItem = (e.target as Element).parentElement!.parentElement!;
    const todo = todos.getById(todoItem.id)!;
    todoItem.classList.add("editing");
    const editInput = todoItem.querySelector<HTMLInputElement>(".edit")!;
    editInput.value = todo.title;
    editInput.focus();
  });

  const onEdit = (e: KeyboardEvent) => {
    // deno-lint-ignore no-explicit-any
    const input: HTMLInputElement = e.target as any;
    if (e.which === 13 /* ENTER */) {
      input.blur();
    } else if (e.which === 27 /* ESC */) {
      input.value = todos.getById(input.parentElement!.id)!.title;
      input.blur();
    }
  };

  on("keypress", ".edit", onEdit);
  on("keydown", ".edit", onEdit);

  on("focusout", ".edit", (e) => {
    const input = e.target as HTMLInputElement;
    const value = input.value.trim();
    const todoItem = input.parentElement!;
    if (value) {
      todos.getById(todoItem.id)!.title = value;
      todoItem.classList.remove("editing");
    } else {
      todos.remove(todos.getById(todoItem.id)!);
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
    query('a[href="#/all"]')!.classList.toggle("selected", filter === "all");
    query('a[href="#/active"]')!.classList.toggle(
      "selected",
      filter === "uncompleted",
    );
    query('a[href="#/completed"]')!.classList.toggle(
      "selected",
      filter === "completed",
    );
    updateTodo();
  }

  function updateTodo() {
    todos.save();
    const uncompleted = todos.uncompleted();
    const completed = todos.completed();
    const todoList = query(".todo-list")!;
    query(".todo-count strong")!.textContent = `${uncompleted.length}`;
    query(".todo-count .plural")!.classList.toggle(
      "hidden",
      uncompleted.length === 1,
    );
    query(".main")!.classList.toggle("hidden", todos.length === 0);
    query(".footer")!.classList.toggle("hidden", todos.length === 0);
    query(".toggle-all")!.classList.toggle("hidden", todos.length === 0);
    query('label[for="toggle-all"]')!.classList.toggle(
      "hidden",
      todos.length === 0,
    );
    query<HTMLInputElement>(".toggle-all")!.checked = uncompleted.length === 0;
    query(".clear-completed")!.classList.toggle(
      "hidden",
      completed.length === 0,
    );
    if (
      filter === "all" &&
      todos.length === todoList.children.length
    ) {
      // Doesn't replace the list items.
      todos.forEach((todo) => {
        const li = todoList.querySelector(`[id="${todo.id}"]`)!;
        li.classList.toggle("completed", todo.completed);
        li.querySelector("label")!.textContent = todo.title;
        li.querySelector<HTMLInputElement>(".toggle")!.checked = todo.completed;
      });
    } else {
      // TODO(kt3k): This replace the entire list items.
      // The performance can be improved by reusing reusable list items.
      const visibleItems = filter === "uncompleted"
        ? uncompleted
        : filter === "completed"
        ? completed
        : todos;
      todoList.innerHTML = "";
      visibleItems.forEach((todo) => {
        const li = document.createElement("li");
        li.innerHTML = `
        <div class="view">
          <input class="toggle" type="checkbox" ${
          todo.completed ? "checked" : ""
        }/>
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
