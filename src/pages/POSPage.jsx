/**
 * pages/POSPage.jsx
 * Clean POS — horizontal category pills, product grid, cash-only cart panel.
 */

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ItemVisual } from "./MenuPage";
import styles from "./POSPage.module.css";

const PAY_METHODS = [
  { id: "Cash",   icon: "💵", label: "Cash"     },
  { id: "Wallet", icon: "📱", label: "E-Wallet" },
];

let orderCounter = 3;

export default function POSPage() {
  const {
    menuItems, categories,
    currentOrder, subtotal, tax, total,
    addToOrder, updateQuantity, clearCurrentOrder, completeOrder,
  } = useApp();

  const [selCat,    setSelCat]    = useState("All");
  const [showPanel, setShowPanel] = useState(false);
  const [payMethod, setPayMethod] = useState("Cash");
  const [orderNo]                 = useState(() => String(++orderCounter).padStart(3, "0"));

  const today     = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
  const allCats   = ["All", ...categories.map((c) => c.name)];
  const filtered  = selCat === "All" ? menuItems : menuItems.filter((i) => i.category === selCat);
  const itemCount = currentOrder.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.page}>

      {/* ── Left: menu ── */}
      <div className={styles.main}>

        {/* Category pills + mobile badge */}
        <div className={styles.catBar}>
          <div className={styles.catPills}>
            {allCats.map((c) => (
              <button
                key={c}
                className={`${styles.catBtn} ${selCat === c ? styles.catActive : ""}`}
                onClick={() => setSelCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <button className={styles.mobileBadge} onClick={() => setShowPanel(true)}>
            🛒 {itemCount > 0 && <span className={styles.badgeDot}>{itemCount}</span>}
            <span>₱{total.toFixed(2)}</span>
          </button>
        </div>

        {/* Product grid */}
        <div className={styles.menu}>
          <div className={styles.grid}>
            {filtered.map((item) => {
              const cat     = categories.find((c) => c.name === item.category);
              const inOrder = currentOrder.some((o) => o.id === item.id);
              return (
                <MenuCard
                  key={item.id}
                  item={item}
                  cat={cat}
                  inOrder={inOrder}
                  onAdd={addToOrder}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: cart panel ── */}
      <aside className={`${styles.panel} ${showPanel ? styles.panelOpen : ""}`}>

        <button className={styles.panelClose} onClick={() => setShowPanel(false)}>✕ Close</button>

        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Cart Items</span>
          <div className={styles.orderMeta}>
            <span className={styles.orderNo}>Order No. #{orderNo}</span>
            <span className={styles.orderDate}>{today}</span>
          </div>
        </div>

        <div className={styles.orderList}>
          {currentOrder.length === 0
            ? <div className={styles.empty}><span>🛒</span><p>Tap items to add</p></div>
            : currentOrder.map((item) => (
                <OrderRow key={item.id} item={item} onQtyChange={updateQuantity} />
              ))
          }
        </div>

        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span className={styles.totalRowValue}>₱{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax (10%)</span>
            <span className={styles.totalRowValue}>₱{tax.toFixed(2)}</span>
          </div>
          <hr className={styles.totalDivider} />
          <div className={styles.totalBigRow}>
            <span className={styles.totalBigLabel}>Total</span>
            <span className={styles.totalBigValue}>₱{total.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.paySection}>
          <div className={styles.payLabel}>Payment Method</div>
          <div className={styles.payMethods}>
            {PAY_METHODS.map((m) => (
              <button
                key={m.id}
                className={`${styles.payMethodBtn} ${payMethod === m.id ? styles.payMethodActive : ""}`}
                onClick={() => setPayMethod(m.id)}
              >
                <span className={styles.payMethodIcon}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.payBtns}>
          <button
            className={styles.placeOrderBtn}
            onClick={() => completeOrder(payMethod)}
            disabled={!currentOrder.length}
          >
            Place Order
          </button>
          <button className={styles.cancelBtn} onClick={clearCurrentOrder}>
            Cancel Order
          </button>
        </div>
      </aside>

      {showPanel && <div className={styles.backdrop} onClick={() => setShowPanel(false)} />}
    </div>
  );
}

function MenuCard({ item, cat, inOrder, onAdd }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className={[
        styles.menuCard,
        !item.available ? styles.cardDisabled : "",
        pressed         ? styles.cardPressed  : "",
        inOrder         ? styles.menuCardSelected : "",
      ].join(" ")}
      onClick={() => {
        if (!item.available) return;
        onAdd(item);
        setPressed(true);
        setTimeout(() => setPressed(false), 150);
      }}
      disabled={!item.available}
    >
      <div className={styles.cardImageWrap}>
        <ItemVisual item={item} cat={cat} size={110} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardName}>{item.name}</div>
        <span className={styles.cardPrice}>₱{item.price.toFixed(2)}</span>
        {!item.available && <div className={styles.unavailable}>Unavailable</div>}
      </div>
    </button>
  );
}

function OrderRow({ item, onQtyChange }) {
  return (
    <div className={styles.orderRow}>
      <div className={styles.rowInfo}>
        <div className={styles.rowName}>{item.name}</div>
        <div className={styles.rowPrice}>₱{(item.price * item.quantity).toFixed(2)}</div>
      </div>
      <div className={styles.qty}>
        <button className={styles.qtyBtn} onClick={() => onQtyChange(item.id, item.quantity - 1)}>−</button>
        <span className={styles.qtyVal}>{item.quantity}</span>
        <button className={styles.qtyBtn} onClick={() => onQtyChange(item.id, item.quantity + 1)}>+</button>
      </div>
      <button className={styles.deleteBtn} onClick={() => onQtyChange(item.id, 0)} title="Remove">🗑</button>
    </div>
  );
}