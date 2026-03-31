import { getCollection, setCollection } from "../services/mockDB.js";
import { getState } from "../state.js";
import { generateId } from "../utils/helpers.js";

const PERMISSIONS = {
  super_admin: ["create", "update", "delete", "view"],
  admin: ["create", "update", "view"],
  user: ["view"]
};

const can = (role, action) => {
  return PERMISSIONS[role]?.includes(action);
};

const ensurePermission = (action) => {
  const { currentUser } = getState();
  if (!currentUser || !can(currentUser.role, action)) {
    throw new Error("Unauthorized action.");
  }
};

const getTasks = () => {
  return getCollection("tasks");
};

const addTask = (task) => {
  ensurePermission("create");
  const { currentUser } = getState();
  const tasks = getTasks();
  const newTask = {
    id: generateId("task"),
    createdBy: currentUser?.id || "system",
    ...task
  };
  const updated = [newTask, ...tasks];
  setCollection("tasks", updated);
  return updated;
};

const updateTask = (taskId, updates) => {
  ensurePermission("update");
  const tasks = getTasks();
  const updated = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
  setCollection("tasks", updated);
  return updated;
};

const deleteTask = (taskId) => {
  ensurePermission("delete");
  const tasks = getTasks();
  const updated = tasks.filter((task) => task.id !== taskId);
  setCollection("tasks", updated);
  return updated;
};

export { getTasks, addTask, updateTask, deleteTask, can };
