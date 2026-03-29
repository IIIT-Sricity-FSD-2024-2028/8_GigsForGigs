import { getCurrentUser } from "./modules/auth.js";

const guardRoute = (page) => {
  const user = getCurrentUser();
  if (page === "dashboard" && !user) {
    window.location.href = "login.html";
  }
  if (page === "login" && user) {
    window.location.href = "dashboard.html";
  }
};

export { guardRoute };
