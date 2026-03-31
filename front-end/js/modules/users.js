import { getCollection } from "../services/mockDB.js";

const getUsers = () => {
  return getCollection("users");
};

const getUserById = (userId) => {
  return getUsers().find((user) => user.id === userId) || null;
};

export { getUsers, getUserById };
