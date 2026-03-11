/**
 * pages/OrdersPage.jsx
 * Order history with expand/collapse, filters, delete, export.
 */

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import { Badge, EmptyState, ConfirmDialog } from "../components/ui/index.jsx";
import {
  formatDate,
  formatTime,
  formatOrderId,
  isToday,
  isWithinDays,
} from "../utils/formatters";
import styles from "./OrdersPage.module.css";

const PAY_FILTERS  = ["All", "Cash", "Wallet"];
const DATE_FILTERS = [
  ["all",   "All Time"  ],
  ["today", "Today"     ],
  ["week",  "This Week" ],
];

export default function OrdersPage() {
  const { orders, deleteOrder, clearAllOrders } = useApp();

  const [payFilter,    setPayFilter]    = useState("All");
  const [dateFilter,   setDateFilter]   = useState("all");
  const [expandedId,   setExpandedId]   = useState(null);
  const [showClearDlg, setShowClearDlg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = orders.filter((o) => {
    const matchPay  = payFilter === "All" || o.paymentMethod === payFilter;
    const matchDate =
      dateFilter === "today" ? isToday(o.timestamp)
      : dateFilter === "week" ? isWithinDays(o.timestamp, 7)
      : true;
    return matchPay && matchDate;
  });

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder     = filtered.length ? totalRevenue / filtered.length : 0;

  const exportJSON = () => {
    const a = document.createElement("a");
    a.href =
      "data:application/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(orders, null, 2));
    a.download = `orders-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Order History</h2>
          <p className={styles.subtitle}>
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} · ₱{totalRevenue.toFixed(2)} revenue
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={exportJSON}>↓ Export JSON</Button>
          <Button variant="danger" size="sm" onClick={() => setShowClearDlg(true)}>Clear All</Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Orders</span>
          <span className={styles.statValue}>{filtered.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Revenue</span>
          <span className={`${styles.statValue} ${styles.statAccent}`}>₱{totalRevenue.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Average Order</span>
          <span className={styles.statValue}>₱{avgOrder.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Cash / Wallet</span>
          <span className={styles.statValue}>
            {orders.filter((o) => o.paymentMethod === "Cash").length}
            <span className={styles.statSlash}> / </span>
            {orders.filter((o) => o.paymentMethod !== "Cash").length}
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {PAY_FILTERS.map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${payFilter === f ? styles.filterActive : ""}`}
              onClick={() => setPayFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {DATE_FILTERS.map(([v, l]) => (
            <button
              key={v}
              className={`${styles.filterBtn} ${dateFilter === v ? styles.filterActive : ""}`}
              onClick={() => setDateFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="No orders found" message="Try changing your filters" />
        ) : (
          filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onDelete={() => setDeleteTarget(order)}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteOrder(deleteTarget.id)}
        title="Delete this order?"
        message={`Order ${deleteTarget ? formatOrderId(deleteTarget.id) : ""} will be permanently deleted.`}
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        isOpen={showClearDlg}
        onClose={() => setShowClearDlg(false)}
        onConfirm={clearAllOrders}
        title="Clear all orders?"
        message={`This will permanently delete all ${orders.length} orders. This cannot be undone.`}
        confirmLabel="Delete All"
        danger
      />
    </div>
  );
}

function payMeta(method) {
  if (method === "Cash")   return { icon: "💵", bg: "#dcfce7", badge: "cash"   };
  if (method === "Wallet") return { icon: "📱", bg: "#fef3c7", badge: "wallet" };
  return                          { icon: "💳", bg: "#dbeafe", badge: "card"   };
}

function OrderCard({ order, isExpanded, onToggle, onDelete }) {
  const { icon, bg, badge } = payMeta(order.paymentMethod);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.card}>

      {/* Summary row */}
      <div
        className={styles.cardRow}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className={styles.payIcon} style={{ background: bg }}>
          {icon}
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.cardId}>{formatOrderId(order.id)}</span>
          <span className={styles.cardDate}>
            {formatDate(order.timestamp)}, {formatTime(order.timestamp)}
          </span>
        </div>

        <Badge variant={badge}>{order.paymentMethod}</Badge>

        <span className={styles.cardItems}>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <span className={styles.cardTotal}>₱{order.total.toFixed(2)}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}>▼</span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className={styles.detail}>
          <div className={styles.detailInner}>

            <div className={styles.itemList}>
              {order.items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemQty}>×{item.quantity}</span>
                  <span className={styles.itemTotal}>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className={styles.subtotals}>
              {[["Subtotal", order.subtotal], ["Tax (10%)", order.tax]].map(([l, v]) => (
                <div key={l} className={styles.subtotalRow}>
                  <span>{l}</span>
                  <span>₱{v.toFixed(2)}</span>
                </div>
              ))}
              <div className={`${styles.subtotalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>₱{order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.detailActions}>
              <Button variant="danger" size="sm" onClick={onDelete}>Delete Order</Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}