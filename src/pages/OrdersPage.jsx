/**
 * pages/OrdersPage.jsx
 * Order history with Complete / Pending status, expand/collapse,
 * filters, delete, export, and mark-complete action.
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

const PAY_FILTERS  = ["All", "Cash", "E Wallet"];
const DATE_FILTERS = [
  ["all",   "All Time" ],
  ["today", "Today"    ],
  ["week",  "This Week"],
];
const STATUS_FILTERS = ["All", "Complete", "Pending"];

export default function OrdersPage() {
  const { orders, deleteOrder, clearAllOrders, updateOrderStatus } = useApp();

  const [payFilter,      setPayFilter]      = useState("All");
  const [dateFilter,     setDateFilter]     = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [expandedId,     setExpandedId]     = useState(null);
  const [showClearDlg,   setShowClearDlg]   = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);

  const filtered = orders.filter((o) => {
    const matchPay    = payFilter === "All" || o.paymentMethod === payFilter;
    const matchDate   =
      dateFilter === "today" ? isToday(o.timestamp)
      : dateFilter === "week" ? isWithinDays(o.timestamp, 7)
      : true;
    const matchStatus =
      statusFilter === "All" || (o.status ?? "Complete") === statusFilter;
    return matchPay && matchDate && matchStatus;
  });

  const totalRevenue  = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder      = filtered.length ? totalRevenue / filtered.length : 0;
  const pendingCount  = orders.filter((o) => (o.status ?? "Complete") === "Pending").length;
  const completeCount = orders.filter((o) => (o.status ?? "Complete") === "Complete").length;

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
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            {" · "}₱{totalRevenue.toFixed(2)} revenue
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
          <span className={`${styles.statValue} ${styles.statAccent}`}>
            ₱{totalRevenue.toFixed(2)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Average Order</span>
          <span className={styles.statValue}>₱{avgOrder.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Cash / E Wallet</span>
          <span className={styles.statValue}>
            {orders.filter((o) => o.paymentMethod === "Cash").length}
            <span className={styles.statSlash}> / </span>
            {orders.filter((o) => o.paymentMethod !== "Cash").length}
          </span>
        </div>
        {/* NEW — status split */}
        <div className={`${styles.statCard} ${styles.statCardComplete}`}>
          <span className={styles.statLabel}>Completed</span>
          <span className={`${styles.statValue} ${styles.statComplete}`}>
            {completeCount}
          </span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardPending}`}>
          <span className={styles.statLabel}>Pending</span>
          <span className={`${styles.statValue} ${styles.statPending}`}>
            {pendingCount}
          </span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filters}>
        {/* Payment */}
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

        {/* Date */}
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

        {/* Status — NEW */}
        <div className={styles.filterGroup}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              className={`
                ${styles.filterBtn}
                ${statusFilter === f ? styles.filterActive : ""}
                ${f === "Complete" && statusFilter === f ? styles.filterComplete : ""}
                ${f === "Pending"  && statusFilter === f ? styles.filterPending  : ""}
              `}
              onClick={() => setStatusFilter(f)}
            >
              {f === "Complete" && <span className={styles.dot} style={{ background: "var(--clr-complete)" }} />}
              {f === "Pending"  && <span className={styles.dot} style={{ background: "var(--clr-pending)"  }} />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pending banner ── */}
      {pendingCount > 0 && statusFilter !== "Complete" && (
        <div className={styles.pendingBanner}>
          <span className={styles.pendingBannerDot} />
          <span>
            <strong>{pendingCount}</strong> order{pendingCount !== 1 ? "s" : ""} awaiting fulfilment
          </span>
        </div>
      )}

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
              onMarkComplete={() => setCompleteTarget(order)}
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
      <ConfirmDialog
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={() => updateOrderStatus(completeTarget.id, "Complete")}
        title="Mark order as complete?"
        message={`Order ${completeTarget ? formatOrderId(completeTarget.id) : ""} will be marked as completed.`}
        confirmLabel="Mark Complete"
      />
    </div>
  );
}

/* ─── helpers ──────────────────────────────────────────────── */

function payMeta(method) {
  if (method === "Cash")   return { icon: "💵", bg: "#dcfce7", badge: "cash"   };
  if (method === "Wallet") return { icon: "📱", bg: "#fef3c7", badge: "wallet" };
  return                          { icon: "💳", bg: "#dbeafe", badge: "card"   };
}

/* ─── OrderCard ─────────────────────────────────────────────── */

function OrderCard({ order, isExpanded, onToggle, onDelete, onMarkComplete }) {
  const { icon, bg, badge } = payMeta(order.paymentMethod);
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  // Default existing orders (no status field) to "Complete"
  const status    = order.status ?? "Complete";
  const isPending = status === "Pending";

  return (
    <div className={`${styles.card} ${isPending ? styles.cardPending : styles.cardComplete}`}>

      {/* Status stripe */}
      <div className={`${styles.statusStripe} ${isPending ? styles.stripePending : styles.stripeComplete}`} />

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

        {/* Status badge — NEW */}
        <span className={`${styles.statusBadge} ${isPending ? styles.statusBadgePending : styles.statusBadgeComplete}`}>
          {isPending ? "⏳ Pending" : "✓ Complete"}
        </span>

        <span className={styles.cardItems}>{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <span className={styles.cardTotal}>₱{order.total.toFixed(2)}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}>▼</span>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className={styles.detail}>
          <div className={styles.detailInner}>

            {/* Pending notice */}
            {isPending && (
              <div className={styles.pendingNotice}>
                <span>⚠️</span>
                <span>This order is still <strong>pending</strong> — waiting for fulfilment or payment confirmation.</span>
              </div>
            )}

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
              {isPending && (
                <Button variant="primary" size="sm" onClick={onMarkComplete}>
                  ✓ Mark as Complete
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={onDelete}>
                Delete Order
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}