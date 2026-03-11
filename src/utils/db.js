/**
 * utils/db.js
 * IndexedDB abstraction layer — no external dependencies.
 *
 * Stores:
 *   "menu"       → menu items
 *   "orders"     → completed orders
 *   "categories" → item categories
 */

const DB_NAME    = "CoffeeShopPOS";
const DB_VERSION = 2;

// ── Open / Upgrade ────────────────────────────────────────────────────────────
export const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("menu")) {
        const ms = db.createObjectStore("menu", { keyPath: "id" });
        ms.createIndex("category", "category");
      }
      if (!db.objectStoreNames.contains("orders")) {
        const os = db.createObjectStore("orders", { keyPath: "id" });
        os.createIndex("timestamp", "timestamp");
      }
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", { keyPath: "id" });
      }
    };
  });

// ── Low-level helpers ─────────────────────────────────────────────────────────
const withStore = async (store, mode, fn) => {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

export const dbGetAll = async (store) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

export const dbCount = async (store) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
};

export const dbClear = async (store) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
};

export const dbPut    = (store, item) => withStore(store, "readwrite", (s) => s.put(item));
export const dbAdd    = (store, item) => withStore(store, "readwrite", (s) => s.add(item));
export const dbDelete = (store, id)   => withStore(store, "readwrite", (s) => s.delete(id));

// ── Seed data ─────────────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 1, name: "Coffee",   icon: "☕", color: "#c8a97e" },
  { id: 2, name: "Tea",      icon: "🍵", color: "#4ade80" },
  { id: 3, name: "Drinks",   icon: "🥤", color: "#60a5fa" },
  { id: 4, name: "Pastries", icon: "🥐", color: "#f472b6" },
];

export const DEFAULT_MENU = [
  { id: 1,  name: "Espresso",        category: "Coffee",   price: 2.50, available: true },
  { id: 2,  name: "Americano",       category: "Coffee",   price: 3.00, available: true },
  { id: 3,  name: "Latte",           category: "Coffee",   price: 3.50, available: true },
  { id: 4,  name: "Cappuccino",      category: "Coffee",   price: 3.50, available: true },
  { id: 5,  name: "Mocha",           category: "Coffee",   price: 4.00, available: true },
  { id: 6,  name: "Hot Chocolate",   category: "Drinks",   price: 3.00, available: true },
  { id: 7,  name: "Green Tea",       category: "Tea",      price: 2.50, available: true },
  { id: 8,  name: "Croissant",       category: "Pastries", price: 2.50, available: true },
  { id: 9,  name: "Choco Muffin",    category: "Pastries", price: 2.50, available: true },
  { id: 10, name: "Blueberry Scone", category: "Pastries", price: 2.75, available: true },
];

// ── Init DB (seed if empty) ────────────────────────────────────────────────────
export const initDatabase = async () => {
  const [menuCount, catCount] = await Promise.all([
    dbCount("menu"),
    dbCount("categories"),
  ]);
  if (menuCount === 0) for (const item of DEFAULT_MENU)      await dbAdd("menu",       item);
  if (catCount  === 0) for (const cat  of DEFAULT_CATEGORIES) await dbAdd("categories", cat);
};
