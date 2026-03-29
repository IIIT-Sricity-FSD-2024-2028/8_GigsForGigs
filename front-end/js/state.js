import storage from "./services/storage.js";

const CURRENT_USER_KEY = "gfg_current_user";

const state = {
  currentUser: null,
  tasks: [],
  activeView: "list",
  selectedTaskId: null
};

const subscribers = new Set();

const notify = () => {
  subscribers.forEach((callback) => callback({ ...state }));
};

const setState = (partial) => {
  Object.assign(state, partial);
  notify();
};

const getState = () => ({ ...state });

const subscribe = (callback) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

const loadCurrentUser = () => {
  const stored = storage.get(CURRENT_USER_KEY, null);
  if (stored) {
    state.currentUser = stored;
  }
  return state.currentUser;
};

const setCurrentUser = (user) => {
  state.currentUser = user;
  if (user) {
    storage.set(CURRENT_USER_KEY, user);
  } else {
    storage.remove(CURRENT_USER_KEY);
  }
  notify();
};

const setTasks = (tasks) => {
  state.tasks = tasks;
  notify();
};

const setSelectedTaskId = (taskId) => {
  state.selectedTaskId = taskId;
  notify();
};

const setActiveView = (view) => {
  state.activeView = view;
  notify();
};

export {
  getState,
  setState,
  subscribe,
  loadCurrentUser,
  setCurrentUser,
  setTasks,
  setSelectedTaskId,
  setActiveView
};
