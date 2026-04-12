/**
 * utils/db.js
 * IndexedDB abstraction layer — no external dependencies.
 *
 * Stores:
 *   "menu"       → menu items
 *   "orders"     → completed orders
 *   "categories" → item categories
 *   "expenses"   → expense records        ← NEW
 */

const DB_NAME    = "CoffeeShopPOS";
const DB_VERSION = 10;   // ← was 9, bumped to 10 to register the new store

// ── Seed data ─────────────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 1, name: "Coffee",     icon: "☕", color: "#c8a97e" },
  { id: 2, name: "Non-Coffee", icon: "🍵", color: "#4ade80" },
  { id: 3, name: "Snacks",     icon: "🥤", color: "#60a5fa" },
];

export const DEFAULT_MENU = [
  { id: 1,  name: "Classic Americano",    category: "Coffee",     price: 60,  available: true },
  { id: 2,  name: "Vanilla Drip Ice",     category: "Coffee",     price: 90,  available: true },
  { id: 3,  name: "Ice Latte",            category: "Coffee",     price: 90,  available: true },
  { id: 4,  name: "Hazel Bliss",          category: "Coffee",     price: 90,  available: true },
  { id: 5,  name: "Salted Caramel",       category: "Coffee",     price: 90,  available: true },
  { id: 6,  name: "Caramel Macchiato",    category: "Coffee",     price: 90,  available: true },
  { id: 7,  name: "Spanish Latte",        category: "Coffee",     price: 90,  available: true },
  { id: 8,  name: "Dark Mocha",           category: "Coffee",     price: 90,  available: true },
  { id: 9,  name: "Matcha",               category: "Non-Coffee", price: 90,  available: true },
  { id: 10, name: "Strawberry Cloud",     category: "Non-Coffee", price: 90,  available: true },
  { id: 11, name: "Berry Matcha Cloud",   category: "Non-Coffee", price: 90,  available: true },
  { id: 12, name: "Dark Chocolate Rush",  category: "Non-Coffee", price: 90,  available: true },
  { id: 13, name: "French Fries",         category: "Snacks",     price: 50,  available: true },
  { id: 14, name: "Nachos",               category: "Snacks",     price: 90,  available: true },
];

// ── Open / Upgrade ────────────────────────────────────────────────────────────
export const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Create stores if they don't exist yet
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
      // ↓ NEW — safe to add; the guard means existing stores are untouched
      if (!db.objectStoreNames.contains("expenses")) {
        db.createObjectStore("expenses", { keyPath: "id" });
      }

      // Re-seed menu + categories every time the version bumps.
      // Orders are intentionally preserved across upgrades.
      const tx = e.target.transaction;

      const menuStore = tx.objectStore("menu");
      menuStore.clear();
      for (const item of DEFAULT_MENU) menuStore.put(item);

      const catStore = tx.objectStore("categories");
      catStore.clear();
      for (const cat of DEFAULT_CATEGORIES) catStore.put(cat);

      // expenses store is NOT seeded — starts empty, user fills it in.
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

// ── Init DB (openDB handles seeding via onupgradeneeded) ──────────────────────
export const initDatabase = async () => {
  await openDB();   // triggers onupgradeneeded → re-seeds if version changed
};