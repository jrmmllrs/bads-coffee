import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { initDatabase, dbGetAll, dbAdd, dbPut, dbDelete, dbClear } from "../utils/db";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [ready,         setReady]         = useState(false);
  const [menuItems,     setMenuItems]     = useState([]);
  const [orders,        setOrders]        = useState([]);
  const [categories,    setCategories]    = useState([]);
  const [currentOrder,  setCurrentOrder]  = useState([]);
  const [toast,         setToast]         = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    const [menu, ords, cats] = await Promise.all([
      dbGetAll("menu"), dbGetAll("orders"), dbGetAll("categories"),
    ]);
    setMenuItems(menu.sort((a, b) => a.id - b.id));
    setOrders(ords.sort((a, b) => b.id - a.id));
    setCategories(cats);
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

  // ── Order cart state ──
  const addToOrder = (item) => {
    setCurrentOrder((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) setCurrentOrder((prev) => prev.filter((i) => i.id !== itemId));
    else setCurrentOrder((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: qty } : i));
  };
  const clearCurrentOrder = () => setCurrentOrder([]);

  const subtotal = currentOrder.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total    = subtotal; // no tax

  const completeOrder = async (paymentMethod, customerName = "Guest") => {
    if (!currentOrder.length) return;
    const order = {
      id: Date.now(),
      items: [...currentOrder],
      subtotal,
      total,
      timestamp: new Date().toISOString(),
      paymentMethod,
      customerName,
      status: "Pending",
      paymentStatus: "Unpaid",
    };
    await dbAdd("orders", order);
    await refresh();
    setCurrentOrder([]);
    showToast(`Order placed for ${customerName}! Total ₱${total.toFixed(2)}`);
    return order;
  };

  // ── Update entire order (edit) ──
  const updateOrder = async (updatedOrder) => {
    const items    = updatedOrder.items.filter((i) => i.quantity > 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total    = subtotal; // no tax
    const saved    = { ...updatedOrder, items, subtotal, total };
    await dbPut("orders", saved);
    await refresh();
    showToast("Order updated ✓");
    return saved;
  };

  // ── Flip fulfillment status ──
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

  // ── Flip payment status ──
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

  return (
    <AppContext.Provider value={{
      ready, menuItems, orders, categories,
      currentOrder, subtotal, total, toast,
      addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
      addCategory, updateCategory, deleteCategory,
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