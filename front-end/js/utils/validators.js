const isEmail = (value) => {
  return /\S+@\S+\.\S+/.test(value);
};

const isNotEmpty = (value) => {
  return String(value || "").trim().length > 0;
};

const isPositiveNumber = (value) => {
  const number = Number(value);
  return !Number.isNaN(number) && number >= 0;
};

const isValidDate = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const validateTask = (task) => {
  const errors = {};
  if (!isNotEmpty(task.title)) {
    errors.taskTitle = "Title is required.";
  }
  if (!isNotEmpty(task.client)) {
    errors.taskClient = "Client is required.";
  }
  if (!isValidDate(task.deadline)) {
    errors.taskDeadline = "Deadline is invalid.";
  }
  if (!isPositiveNumber(task.budget)) {
    errors.taskBudget = "Budget must be a positive number.";
  }
  if (!isNotEmpty(task.status)) {
    errors.taskStatus = "Status is required.";
  }
  return errors;
};

const validateLogin = ({ email, password }) => {
  const errors = {};
  if (!isEmail(email)) {
    errors.email = "Enter a valid email.";
  }
  if (!isNotEmpty(password)) {
    errors.password = "Password is required.";
  }
  return errors;
};

export { isEmail, isNotEmpty, isPositiveNumber, isValidDate, validateTask, validateLogin };
