import { useState } from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import { Badge, EmptyState, ConfirmDialog } from "../components/ui/index.jsx";
import {
  formatDate, formatTime, formatOrderId, isToday, isWithinDays,
} from "../utils/formatters";
import styles from "./OrdersPage.module.css";

const PAY_FILTERS            = [["all","All"],["Cash","Cash"],["Wallet","Wallet"]];
const DATE_FILTERS           = [["all","All time"],["today","Today"],["week","This week"]];
const STATUS_FILTERS         = [["All","All"],["Complete","Complete"],["Pending","Pending"]];
const PAYMENT_STATUS_FILTERS = [["All","All"],["Paid","Paid"],["Unpaid","Unpaid"]];

export default function OrdersPage() {
  const {
    orders, menuItems,
    deleteOrder, clearAllOrders, updateOrder,
    updateOrderStatus, updatePaymentStatus,
  } = useApp();

  const [payFilter,      setPayFilter]      = useState("all");
  const [dateFilter,     setDateFilter]     = useState("all");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [paymentFilter,  setPaymentFilter]  = useState("All");
  const [expandedId,     setExpandedId]     = useState(null);
  const [showClearDlg,   setShowClearDlg]   = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [markPaidTarget, setMarkPaidTarget] = useState(null);
  const [editTarget,     setEditTarget]     = useState(null);

  const filtered = orders.filter((o) => {
    const matchPay     = payFilter === "all" || o.paymentMethod === payFilter;
    const matchDate    =
      dateFilter === "today" ? isToday(o.timestamp)
      : dateFilter === "week" ? isWithinDays(o.timestamp, 7)
      : true;
    const matchStatus  = statusFilter === "All" || (o.status ?? "Pending") === statusFilter;
    const matchPayment = paymentFilter === "All" || (o.paymentStatus ?? "Unpaid") === paymentFilter;
    return matchPay && matchDate && matchStatus && matchPayment;
  });

  const totalRevenue  = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder      = filtered.length ? totalRevenue / filtered.length : 0;
  const pendingCount  = orders.filter((o) => (o.status ?? "Pending") === "Pending").length;
  const unpaidCount   = orders.filter((o) => (o.paymentStatus ?? "Unpaid") === "Unpaid").length;

  const exportJSON = () => {
    const a = document.createElement("a");
    a.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
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
          <Button variant="ghost" size="sm" onClick={exportJSON}>↓ Export</Button>
          <Button variant="danger" size="sm" onClick={() => setShowClearDlg(true)}>Clear all</Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Revenue</span>
          <span className={`${styles.statValue} ${styles.statBlue}`}>₱{totalRevenue.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Avg order</span>
          <span className={styles.statValue}>₱{avgOrder.toFixed(2)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pending</span>
          <span className={`${styles.statValue} ${styles.statAmber}`}>{pendingCount}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Unpaid</span>
          <span className={`${styles.statValue} ${styles.statRed}`}>{unpaidCount}</span>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filterBar}>
        <span className={styles.filterBarLabel}>Filter</span>

        <SegmentedControl options={DATE_FILTERS}           value={dateFilter}    onChange={setDateFilter}    />
        <div className={styles.filterDivider} />
        <SegmentedControl options={PAY_FILTERS}            value={payFilter}     onChange={setPayFilter}     />
        <div className={styles.filterDivider} />
        <SegmentedControl options={STATUS_FILTERS}         value={statusFilter}  onChange={setStatusFilter}  colorMap={{ Complete: "green", Pending: "amber" }} />
        <div className={styles.filterDivider} />
        <SegmentedControl options={PAYMENT_STATUS_FILTERS} value={paymentFilter} onChange={setPaymentFilter} colorMap={{ Paid: "blue", Unpaid: "red" }} />
      </div>

      {/* ── Banners ── */}
      {pendingCount > 0 && statusFilter !== "Complete" && (
        <div className={`${styles.banner} ${styles.bannerAmber}`}>
          <span className={`${styles.bannerDot} ${styles.bannerDotAmber}`} />
          <span><strong>{pendingCount}</strong> order{pendingCount !== 1 ? "s" : ""} awaiting fulfilment</span>
        </div>
      )}
      {unpaidCount > 0 && paymentFilter !== "Paid" && (
        <div className={`${styles.banner} ${styles.bannerRed}`}>
          <span className={`${styles.bannerDot} ${styles.bannerDotRed}`} />
          <span><strong>{unpaidCount}</strong> order{unpaidCount !== 1 ? "s" : ""} awaiting payment</span>
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
              onMarkPaid={() => setMarkPaidTarget(order)}
              onEdit={() => setEditTarget(order)}
            />
          ))
        )}
      </div>

      {/* ── Dialogs ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { deleteOrder(deleteTarget.id); setDeleteTarget(null); }}
        title="Delete this order?"
        message={`Order ${deleteTarget ? formatOrderId(deleteTarget.id) : ""} will be permanently deleted.`}
        confirmLabel="Delete"
        danger
      />
      <ConfirmDialog
        isOpen={showClearDlg}
        onClose={() => setShowClearDlg(false)}
        onConfirm={() => { clearAllOrders(); setShowClearDlg(false); }}
        title="Clear all orders?"
        message={`This will permanently delete all ${orders.length} orders. This cannot be undone.`}
        confirmLabel="Delete All"
        danger
      />
      <ConfirmDialog
        isOpen={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={() => { updateOrderStatus(completeTarget.id, "Complete"); setCompleteTarget(null); }}
        title="Mark order as complete?"
        message={`Order ${completeTarget ? formatOrderId(completeTarget.id) : ""} will be marked as completed.`}
        confirmLabel="Mark Complete"
      />
      <ConfirmDialog
        isOpen={!!markPaidTarget}
        onClose={() => setMarkPaidTarget(null)}
        onConfirm={() => { updatePaymentStatus(markPaidTarget.id, "Paid"); setMarkPaidTarget(null); }}
        title="Mark order as paid?"
        message={`Order ${markPaidTarget ? formatOrderId(markPaidTarget.id) : ""} will be marked as paid.`}
        confirmLabel="Mark as Paid"
      />

      {/* ── Edit Modal ── */}
      {editTarget && (
        <EditOrderModal
          order={editTarget}
          menuItems={menuItems}
          onClose={() => setEditTarget(null)}
          onSave={async (updated) => {
            await updateOrder(updated);
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── SegmentedControl ───────────────────────────────────────── */

function SegmentedControl({ options, value, onChange, colorMap = {} }) {
  return (
    <div className={styles.seg}>
      {options.map(([val, label]) => {
        const isActive = value === val;
        const color = colorMap[val];
        return (
          <button
            key={val}
            className={[
              styles.segBtn,
              isActive ? styles.segBtnActive : "",
              isActive && color ? styles[`segBtnActive_${color}`] : "",
            ].join(" ")}
            onClick={() => onChange(val)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────── */

function payMeta(method) {
  if (method === "Cash")   return { icon: "💵", bg: "#dcfce7", badge: "cash"   };
  if (method === "Wallet") return { icon: "📱", bg: "#fef3c7", badge: "wallet" };
  return                          { icon: "💳", bg: "#dbeafe", badge: "card"   };
}

/* ─── OrderCard ─────────────────────────────────────────────── */

function OrderCard({ order, isExpanded, onToggle, onDelete, onMarkComplete, onMarkPaid, onEdit }) {
  const { icon, bg, badge } = payMeta(order.paymentMethod);
  const itemCount     = order.items.reduce((s, i) => s + i.quantity, 0);
  const status        = order.status ?? "Pending";
  const paymentStatus = order.paymentStatus ?? "Unpaid";
  const isPending     = status === "Pending";
  const isUnpaid      = paymentStatus === "Unpaid";
  const customerName  = order.customerName ?? "Guest";

  return (
    <div className={[
      styles.card,
      isPending ? styles.cardPending : styles.cardComplete,
    ].join(" ")}>

      <div className={`${styles.statusStripe} ${isPending ? styles.stripePending : styles.stripeComplete}`} />

      {/* Summary row */}
      <div
        className={styles.cardRow}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className={styles.payIcon} style={{ background: bg }}>{icon}</div>

        <div className={styles.cardMeta}>
          <span className={styles.cardId}>{formatOrderId(order.id)}</span>
          <span className={styles.cardSub}>
            👤 {customerName}
            {" · "}
            {formatDate(order.timestamp)}, {formatTime(order.timestamp)}
            {" · "}
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className={styles.cardBadges}>
          <Badge variant={badge}>{order.paymentMethod}</Badge>
          <span className={`${styles.statusBadge} ${isPending ? styles.statusBadgePending : styles.statusBadgeComplete}`}>
            {isPending ? "⏳ Pending" : "✓ Complete"}
          </span>
          <span className={`${styles.statusBadge} ${isUnpaid ? styles.statusBadgeUnpaid : styles.statusBadgePaid}`}>
            {isUnpaid ? "Unpaid" : "💳 Paid"}
          </span>
        </div>

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
              <div className={`${styles.subtotalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>₱{order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.detailActions}>
              <div className={styles.detailActionsLeft}>
                {isPending && (
                  <Button variant="primary" size="sm" onClick={onMarkComplete}>✓ Complete</Button>
                )}
                {isUnpaid && (
                  <Button variant="primary" size="sm" onClick={onMarkPaid}>💳 Mark paid</Button>
                )}
              </div>
              <div className={styles.detailActionsRight}>
                <Button variant="ghost" size="sm" onClick={onEdit}>✏️ Edit</Button>
                <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* ─── EditOrderModal ─────────────────────────────────────────── */

function EditOrderModal({ order, menuItems, onClose, onSave }) {
  const [items,         setItems]         = useState(order.items.map((i) => ({ ...i })));
  const [customerName,  setCustomerName]  = useState(order.customerName ?? "Guest");
  const [paymentMethod, setPaymentMethod] = useState(order.paymentMethod);
  const [status,        setStatus]        = useState(order.status ?? "Pending");
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus ?? "Unpaid");
  const [saving,        setSaving]        = useState(false);
  const [tab,           setTab]           = useState("items");

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total    = subtotal; // no tax

  const setQty = (id, qty) => {
    if (qty <= 0) setItems((prev) => prev.filter((i) => i.id !== id));
    else setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const addMenuItem = (menuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id);
      if (existing) return prev.map((i) => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const handleSave = async () => {
    if (!items.length) return;
    setSaving(true);
    await onSave({ ...order, items, customerName, paymentMethod, status, paymentStatus, subtotal, total });
    setSaving(false);
  };

  const addableItems = menuItems.filter(
    (m) => m.available && !items.find((i) => i.id === m.id)
  );

  return (
    <div className={styles.modalBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Modal header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Edit Order</h3>
            <p className={styles.modalSubtitle}>
              {formatOrderId(order.id)} · {order.customerName ?? "Guest"}
            </p>
          </div>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className={styles.modalTabs}>
          {[["items", "🧾 Items"], ["settings", "⚙️ Settings"]].map(([key, label]) => (
            <button
              key={key}
              className={`${styles.modalTab} ${tab === key ? styles.modalTabActive : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>

          {/* ── Items tab ── */}
          {tab === "items" && (
            <div className={styles.modalSection}>
              <p className={styles.modalSectionLabel}>Current items</p>
              {items.length === 0 ? (
                <p className={styles.modalEmpty}>No items — add some below.</p>
              ) : (
                <div className={styles.editItemList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.editItemRow}>
                      <span className={styles.editItemName}>{item.name}</span>
                      <span className={styles.editItemPrice}>₱{item.price.toFixed(2)}</span>
                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} onClick={() => setQty(item.id, item.quantity - 1)}>−</button>
                        <span className={styles.qtyVal}>{item.quantity}</span>
                        <button className={styles.qtyBtn} onClick={() => setQty(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <span className={styles.editItemTotal}>₱{(item.price * item.quantity).toFixed(2)}</span>
                      <button className={styles.removeBtn} onClick={() => setQty(item.id, 0)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {addableItems.length > 0 && (
                <>
                  <p className={styles.modalSectionLabel} style={{ marginTop: "1rem" }}>Add from menu</p>
                  <div className={styles.menuGrid}>
                    {addableItems.map((m) => (
                      <button key={m.id} className={styles.menuAddBtn} onClick={() => addMenuItem(m)}>
                        <span className={styles.menuAddName}>{m.name}</span>
                        <span className={styles.menuAddPrice}>₱{m.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className={styles.modalTotals}>
                <div className={`${styles.modalTotalRow} ${styles.modalGrandTotal}`}>
                  <span>Total</span><span>₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Settings tab ── */}
          {tab === "settings" && (
            <div className={styles.modalSection}>

              <p className={styles.modalSectionLabel}>Customer name</p>
              <input
                className={styles.modalInput}
                type="text"
                placeholder="Enter customer name…"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                maxLength={50}
              />

              <p className={styles.modalSectionLabel} style={{ marginTop: "1.25rem" }}>Payment method</p>
              <div className={styles.toggleGroup}>
                {[["Cash", "💵 Cash"], ["Wallet", "📱 Wallet"]].map(([val, label]) => (
                  <button
                    key={val}
                    className={`${styles.toggleBtn} ${paymentMethod === val ? styles.toggleBtnActive : ""}`}
                    onClick={() => setPaymentMethod(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className={styles.modalSectionLabel} style={{ marginTop: "1.25rem" }}>Fulfilment status</p>
              <div className={styles.toggleGroup}>
                {[["Pending", "⏳ Pending", "amber"], ["Complete", "✓ Complete", "green"]].map(([val, label, color]) => (
                  <button
                    key={val}
                    className={[
                      styles.toggleBtn,
                      status === val ? styles.toggleBtnActive : "",
                      status === val ? styles[`toggleBtnActive_${color}`] : "",
                    ].join(" ")}
                    onClick={() => setStatus(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className={styles.modalSectionLabel} style={{ marginTop: "1.25rem" }}>Payment status</p>
              <div className={styles.toggleGroup}>
                {[["Unpaid", "✗ Unpaid", "red"], ["Paid", "💳 Paid", "blue"]].map(([val, label, color]) => (
                  <button
                    key={val}
                    className={[
                      styles.toggleBtn,
                      paymentStatus === val ? styles.toggleBtnActive : "",
                      paymentStatus === val ? styles[`toggleBtnActive_${color}`] : "",
                    ].join(" ")}
                    onClick={() => setPaymentStatus(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className={styles.modalFooter}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving || items.length === 0}
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>

      </div>
    </div>
  );
}