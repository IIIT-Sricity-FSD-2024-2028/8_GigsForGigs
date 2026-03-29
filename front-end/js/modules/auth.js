import { getCollection } from "../services/mockDB.js";
import { setCurrentUser, getState } from "../state.js";

const login = (email, password) => {
  const users = getCollection("users");
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) {
    throw new Error("Invalid credentials.");
  }
  setCurrentUser({ id: user.id, name: user.name, role: user.role, email: user.email });
  return user;
};

const logout = () => {
  setCurrentUser(null);
};

const getCurrentUser = () => {
  return getState().currentUser;
};

const requireAuth = () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
  }
  return user;
};

const roleLabel = (role) => {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "User";
};

export { login, logout, getCurrentUser, requireAuth, roleLabel };
