import { validateTask } from "../utils/validators.js";
import { addTask, updateTask, deleteTask, getTasks } from "../modules/data.js";
import { setTasks, setSelectedTaskId, getState } from "../state.js";
import { renderTaskTable } from "./render.js";

const clearErrors = (form) => {
  form.querySelectorAll(".form-error").forEach((node) => {
    if (node.id !== "formError") {
      node.textContent = "";
    }
  });
  form.querySelectorAll(".input-error").forEach((node) => node.classList.remove("input-error"));
};

const showErrors = (form, errors) => {
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.querySelector(`#${field}`);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add("input-error");
  });
};

const getFormValues = (form) => {
  return {
    title: form.taskTitle.value.trim(),
    client: form.taskClient.value.trim(),
    deadline: form.taskDeadline.value,
    budget: form.taskBudget.value,
    status: form.taskStatus.value
  };
};

const resetForm = (form) => {
  form.reset();
  setSelectedTaskId(null);
  const formMode = document.getElementById("formMode");
  if (formMode) formMode.textContent = "Create new task";
};

const bindTaskForm = () => {
  const form = document.getElementById("taskForm");
  const formError = document.getElementById("formError");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(form);
    if (formError) formError.textContent = "";

    const values = getFormValues(form);
    const errors = validateTask({
      title: values.title,
      client: values.client,
      deadline: values.deadline,
      budget: values.budget,
      status: values.status
    });

    if (Object.keys(errors).length) {
      showErrors(form, errors);
      return;
    }

    try {
      const { selectedTaskId, currentUser } = getState();
      let updatedTasks = [];
      if (selectedTaskId) {
        updatedTasks = updateTask(selectedTaskId, values);
      } else {
        updatedTasks = addTask(values, currentUser);
      }
      setTasks(updatedTasks);
      renderTaskTable(updatedTasks, currentUser);
      resetForm(form);
    } catch (error) {
      if (formError) formError.textContent = error.message;
    }
  });

  const cancelButton = document.getElementById("cancelEdit");
  if (cancelButton) {
    cancelButton.addEventListener("click", () => {
      resetForm(form);
    });
  }
};

const bindTaskActions = (currentUser) => {
  const tbody = document.getElementById("tasksTableBody");
  const form = document.getElementById("taskForm");
  const formMode = document.getElementById("formMode");
  const formError = document.getElementById("formError");
  if (!tbody || !form) return;

  tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute("data-action");
    const id = target.getAttribute("data-id");
    if (!action || !id) return;

    if (formError) formError.textContent = "";

    if (action === "edit") {
      const tasks = getTasks();
      const task = tasks.find((item) => item.id === id);
      if (!task) return;
      form.taskTitle.value = task.title;
      form.taskClient.value = task.client;
      form.taskDeadline.value = task.deadline;
      form.taskBudget.value = task.budget;
      form.taskStatus.value = task.status;
      setSelectedTaskId(task.id);
      if (formMode) formMode.textContent = "Edit task";
      window.scrollTo({ top: form.offsetTop, behavior: "smooth" });
    }

    if (action === "delete") {
      try {
        const updated = deleteTask(id);
        setTasks(updated);
        renderTaskTable(updated, currentUser);
      } catch (error) {
        if (formError) formError.textContent = error.message;
      }
    }
  });
};

export { bindTaskForm, bindTaskActions, resetForm };
