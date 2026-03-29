const statusBadgeClass = (status) => {
  if (status === "active") return "badge-active-task";
  if (status === "completed") return "badge-completed-task";
  return "badge-pending-task";
};

const statusLabel = (status) => {
  if (status === "active") return "Active";
  if (status === "completed") return "Completed";
  return "Pending";
};

export { statusBadgeClass, statusLabel };
