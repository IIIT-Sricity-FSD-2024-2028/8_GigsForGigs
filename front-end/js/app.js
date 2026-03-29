import { initializeDB, getCollection } from "./services/mockDB.js";
import { loadCurrentUser, setTasks, getState } from "./state.js";
import { login, logout, roleLabel } from "./modules/auth.js";
import { renderTaskTable, renderUserProfile, renderLandingActions } from "./ui/render.js";
import { bindTaskForm, bindTaskActions, resetForm } from "./ui/forms.js";
import { guardRoute } from "./router.js";
import { validateLogin } from "./utils/validators.js";
import { can } from "./modules/data.js";

const initLogin = () => {
  const form = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (loginError) loginError.textContent = "";

    const values = {
      email: form.email.value.trim(),
      password: form.password.value
    };

    const errors = validateLogin(values);
    form.querySelectorAll(".form-error").forEach((node) => {
      if (node.id !== "loginError") {
        node.textContent = "";
      }
    });

    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([key, message]) => {
        const errorEl = form.querySelector(`[data-error-for="${key}"]`);
        if (errorEl) errorEl.textContent = message;
      });
      return;
    }

    try {
      login(values.email, values.password);
      window.location.href = "dashboard.html";
    } catch (error) {
      if (loginError) loginError.textContent = error.message;
    }
  });
};

const initDashboard = () => {
  const { currentUser } = getState();
  const tasks = getCollection("tasks");
  setTasks(tasks);
  renderTaskTable(tasks, currentUser);
  renderUserProfile(currentUser, roleLabel(currentUser?.role));
  bindTaskForm();
  bindTaskActions(currentUser);

  const addButton = document.getElementById("addTaskButton");
  const formSection = document.getElementById("taskFormSection");
  const form = document.getElementById("taskForm");
  const canCreate = currentUser && can(currentUser.role, "create");
  if (addButton && canCreate) {
    addButton.addEventListener("click", () => {
      resetForm(document.getElementById("taskForm"));
      window.scrollTo({ top: document.getElementById("taskFormSection").offsetTop, behavior: "smooth" });
    });
  }
  if (!canCreate) {
    if (addButton) addButton.classList.add("hidden");
    if (formSection) formSection.classList.add("hidden");
  }

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logout();
      window.location.href = "login.html";
    });
  }

  const searchInput = document.getElementById("taskSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const query = event.target.value.toLowerCase();
      const filtered = getState().tasks.filter((task) => {
        return task.title.toLowerCase().includes(query) || task.client.toLowerCase().includes(query);
      });
      renderTaskTable(filtered, currentUser);
    });
  }
};

const initLanding = () => {
  const { currentUser } = getState();
  renderLandingActions(currentUser);
};

const initApp = async () => {
  await initializeDB();
  loadCurrentUser();

  const page = document.body.dataset.page;
  guardRoute(page);

  if (page === "login") {
    initLogin();
  }

  if (page === "dashboard") {
    initDashboard();
  }

  if (page === "landing") {
    initLanding();
  }
};

document.addEventListener("DOMContentLoaded", initApp);
