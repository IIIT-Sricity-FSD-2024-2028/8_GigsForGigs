import { formatCurrency, formatDate } from "../utils/helpers.js";
import { statusBadgeClass, statusLabel } from "./components.js";
import { can } from "../modules/data.js";

const renderTaskTable = (tasks, currentUser) => {
  const tbody = document.getElementById("tasksTableBody");
  const emptyState = document.getElementById("emptyState");
  if (!tbody || !emptyState) return;

  tbody.innerHTML = "";

  if (!tasks.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  tasks.forEach((task) => {
    const row = document.createElement("tr");
    const allowUpdate = currentUser && can(currentUser.role, "update");
    const allowDelete = currentUser && can(currentUser.role, "delete");

    const titleCell = document.createElement("td");
    titleCell.textContent = task.title;

    const clientCell = document.createElement("td");
    clientCell.textContent = task.client;

    const deadlineCell = document.createElement("td");
    deadlineCell.textContent = formatDate(task.deadline);

    const budgetCell = document.createElement("td");
    budgetCell.textContent = formatCurrency(task.budget);

    const statusCell = document.createElement("td");
    const statusSpan = document.createElement("span");
    statusSpan.className = statusBadgeClass(task.status);
    statusSpan.textContent = statusLabel(task.status);
    statusCell.appendChild(statusSpan);

    const actionsCell = document.createElement("td");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "actions-cell";

    if (allowUpdate) {
      const editButton = document.createElement("button");
      editButton.className = "btn btn-outline";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.dataset.action = "edit";
      editButton.dataset.id = task.id;
      actionsWrap.appendChild(editButton);
    }

    if (allowDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-outline";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.id = task.id;
      actionsWrap.appendChild(deleteButton);
    }

    actionsCell.appendChild(actionsWrap);

    row.appendChild(titleCell);
    row.appendChild(clientCell);
    row.appendChild(deadlineCell);
    row.appendChild(budgetCell);
    row.appendChild(statusCell);
    row.appendChild(actionsCell);

    tbody.appendChild(row);
  });
};

const renderUserProfile = (user, roleLabel) => {
  const nameEl = document.getElementById("userName");
  const roleEl = document.getElementById("userRole");
  const initialsEl = document.getElementById("userInitials");
  const roleChip = document.getElementById("roleChip");

  if (nameEl) nameEl.textContent = user?.name || "Guest";
  if (roleEl) roleEl.textContent = roleLabel || "User";
  if (initialsEl && user?.name) {
    initialsEl.textContent = user.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (roleChip) roleChip.textContent = `Role: ${roleLabel || "User"}`;
};

const renderLandingActions = (currentUser) => {
  const actions = document.getElementById("landingActions");
  if (!actions) return;
  if (currentUser) {
    actions.innerHTML = `<a href="dashboard.html" class="btn btn-primary-blue">Go to Dashboard</a>`;
  }
};

export { renderTaskTable, renderUserProfile, renderLandingActions };
