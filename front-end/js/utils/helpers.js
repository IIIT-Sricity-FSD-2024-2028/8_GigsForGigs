const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
};

const generateId = (prefix = "id") => {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "GF";
};

export { formatCurrency, formatDate, generateId, getInitials };
