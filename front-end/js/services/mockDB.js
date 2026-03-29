import storage from "./storage.js";

const DB_KEY = "gfg_db_v1";

const fallbackData = () => ({
  users: [
    { id: "u1", name: "Avery Admin", email: "admin@gigs.com", password: "Admin123", role: "super_admin" },
    { id: "u2", name: "Morgan Manager", email: "manager@gigs.com", password: "Manager123", role: "admin" },
    { id: "u3", name: "Casey User", email: "user@gigs.com", password: "User123", role: "user" }
  ],
  tasks: [
    { id: "t1", title: "Logo refresh Q4", client: "Bright Labs", deadline: "2026-04-15", budget: 1200, status: "active", createdBy: "u1" },
    { id: "t2", title: "API documentation", client: "DevWorks", deadline: "2026-04-10", budget: 850, status: "pending", createdBy: "u2" },
    { id: "t3", title: "Mobile app UI audit", client: "Nova Bank", deadline: "2026-04-20", budget: 2200, status: "completed", createdBy: "u1" }
  ]
});

const getDB = () => storage.get(DB_KEY, null);

const saveDB = (db) => {
  storage.set(DB_KEY, db);
};

const initializeDB = async () => {
  const existing = getDB();
  if (existing) {
    return existing;
  }

  let data = null;
  try {
    const response = await fetch("mock.json", { cache: "no-store" });
    if (response.ok) {
      data = await response.json();
    }
  } catch (error) {
    data = null;
  }

  if (!data) {
    data = fallbackData();
  }

  saveDB(data);
  return data;
};

const getCollection = (name) => {
  const db = getDB() || fallbackData();
  return Array.isArray(db[name]) ? db[name] : [];
};

const setCollection = (name, items) => {
  const db = getDB() || fallbackData();
  db[name] = items;
  saveDB(db);
};

export { initializeDB, getCollection, setCollection };
