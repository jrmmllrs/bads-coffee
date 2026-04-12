/**
 * context/AppContext.jsx
 * Full app state — variant-aware cart + expenses tracking.
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { initDatabase, dbGetAll, dbAdd, dbPut, dbDelete, dbClear } from "../utils/db";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [ready,        setReady]        = useState(false);
  const [menuItems,    setMenuItems]    = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [expenses,     setExpenses]     = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [toast,        setToast]        = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    const [menu, ords, cats, exps] = await Promise.all([
      dbGetAll("menu"),
      dbGetAll("orders"),
      dbGetAll("categories"),
      dbGetAll("expenses"),
    ]);
    setMenuItems(menu.sort((a, b) => a.id - b.id));
    setOrders(ords.sort((a, b) => b.id - a.id));
    setCategories(cats);
    setExpenses(exps.sort((a, b) => b.id - a.id));
  }, []);

  useEffect(() => {
    initDatabase().then(refresh).then(() => setReady(true));
  }, [refresh]);

  // ── Menu CRUD ──
  const addMenuItem = async (item) => {
    await dbAdd("menu", { ...item, id: Date.now(), available: true });
    await refresh();
    showToast(`"${item.name}" added to menu`);
  };
  const updateMenuItem = async (item) => {
    await dbPut("menu", item);
    await refresh();
    showToast(`"${item.name}" updated`);
  };
  const deleteMenuItem = async (id, name) => {
    await dbDelete("menu", id);
    await refresh();
    showToast(`"${name}" removed`, "error");
  };
  const toggleItemAvailability = async (item) => {
    const updated = { ...item, available: !item.available };
    await dbPut("menu", updated);
    await refresh();
    showToast(`"${item.name}" is now ${updated.available ? "available" : "hidden"}`);
  };

  // ── Category CRUD ──
  const addCategory = async (cat) => {
    await dbAdd("categories", { ...cat, id: Date.now() });
    await refresh();
    showToast(`"${cat.name}" category created`);
  };
  const updateCategory = async (cat) => {
    await dbPut("categories", cat);
    await refresh();
    showToast(`Category updated`);
  };
  const deleteCategory = async (id, name) => {
    await dbDelete("categories", id);
    await refresh();
    showToast(`"${name}" deleted`, "error");
  };

  // ── Expenses CRUD ──
  /**
   * Expense shape:
   * {
   *   id: number (Date.now()),
   *   name: string,
   *   amount: number,
   *   category: string,   // "Ingredients" | "Utilities" | "Staff" | "Equipment" | "Other"
   *   date: string,       // ISO date string
   *   notes?: string,
   * }
   */
  const addExpense = async (expense) => {
    const record = { ...expense, id: Date.now(), date: expense.date || new Date().toISOString() };
    await dbAdd("expenses", record);
    await refresh();
    showToast(`Expense "${expense.name}" added`);
  };

  const updateExpense = async (expense) => {
    await dbPut("expenses", expense);
    await refresh();
    showToast(`Expense "${expense.name}" updated`);
  };

  const deleteExpense = async (id, name) => {
    await dbDelete("expenses", id);
    await refresh();
    showToast(`"${name}" deleted`, "error");
  };

  const clearAllExpenses = async () => {
    await dbClear("expenses");
    await refresh();
    showToast("All expenses cleared", "error");
  };

  // ── Derived expense totals ──
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // ── Order cart state ──
  const addToOrder = (item) => {
    setCurrentOrder((prev) => {
      const matchKey = item.variantKey || String(item.id);
      const existing = prev.find((i) => (i.variantKey || String(i.id)) === matchKey);
      if (existing) {
        return prev.map((i) =>
          (i.variantKey || String(i.id)) === matchKey
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const updateQuantity = (variantKey, qty) => {
    if (qty <= 0) {
      setCurrentOrder((prev) =>
        prev.filter((i) => (i.variantKey || String(i.id)) !== variantKey)
      );
    } else {
      setCurrentOrder((prev) =>
        prev.map((i) =>
          (i.variantKey || String(i.id)) === variantKey ? { ...i, quantity: qty } : i
        )
      );
    }
  };

  const clearCurrentOrder = () => setCurrentOrder([]);

  const subtotal = currentOrder.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total    = subtotal;

  const completeOrder = async (paymentMethod, customerName = "Guest") => {
    if (!currentOrder.length) return;
    const order = {
      id:            Date.now(),
      items:         [...currentOrder],
      subtotal,
      total,
      timestamp:     new Date().toISOString(),
      paymentMethod,
      customerName,
      status:        "Pending",
      paymentStatus: "Unpaid",
    };
    await dbAdd("orders", order);
    await refresh();
    setCurrentOrder([]);
    showToast(`Order placed for ${customerName}! Total ₱${total.toFixed(2)}`);
    return order;
  };

  const updateOrder = async (updatedOrder) => {
    const items    = updatedOrder.items.filter((i) => i.quantity > 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total    = subtotal;
    const saved    = { ...updatedOrder, items, subtotal, total };
    await dbPut("orders", saved);
    await refresh();
    showToast("Order updated ✓");
    return saved;
  };

  const updateOrderStatus = async (id, newStatus) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    await dbPut("orders", { ...order, status: newStatus });
    await refresh();
    showToast(
      newStatus === "Complete" ? "Order marked as complete ✓" : "Order moved back to pending",
      newStatus === "Complete" ? "success" : "info"
    );
  };

  const updatePaymentStatus = async (id, newPaymentStatus) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    await dbPut("orders", { ...order, paymentStatus: newPaymentStatus });
    await refresh();
    showToast(
      newPaymentStatus === "Paid" ? "Order marked as paid 💳" : "Order marked as unpaid",
      newPaymentStatus === "Paid" ? "success" : "info"
    );
  };

  const deleteOrder = async (id) => {
    await dbDelete("orders", id);
    await refresh();
    showToast("Order deleted", "error");
  };

  const clearAllOrders = async () => {
    await dbClear("orders");
    await refresh();
    showToast("All orders cleared", "error");
  };

  // ── Derived revenue & profit ──
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <AppContext.Provider value={{
      ready, menuItems, orders, categories, expenses,
      currentOrder, subtotal, total, toast,
      totalExpenses, totalRevenue, netProfit,
      addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
      addCategory, updateCategory, deleteCategory,
      addExpense, updateExpense, deleteExpense, clearAllExpenses,
      addToOrder, updateQuantity, clearCurrentOrder, completeOrder,
      deleteOrder, clearAllOrders,
      updateOrder, updateOrderStatus, updatePaymentStatus,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
};