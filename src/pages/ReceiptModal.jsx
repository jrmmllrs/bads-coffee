/**
 * components/ui/ReceiptModal.jsx
 * On-screen receipt preview with thermal-style layout.
 * Triggered after a successful order is placed.
 * Prints via window.print() using @media print CSS.
 */

import { useRef } from "react";
import styles from "./ReceiptModal.module.css";

export default function ReceiptModal({ order, onClose }) {
  const receiptRef = useRef(null);

  if (!order) return null;

  const handlePrint = () => window.print();

  const date = new Date(order.timestamp);
  const dateStr = date.toLocaleDateString("en-PH", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const orderId = String(order.id).slice(-6).toUpperCase();

  return (
    <>
      {/* ── Backdrop ── */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* ── Modal shell (screen only) ── */}
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Receipt Preview</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {/* ── Receipt paper ── */}
          <div className={styles.receipt} ref={receiptRef} id="receipt-print">

            {/* Top serrated edge */}
            <div className={styles.tearedTop} />

            <div className={styles.receiptInner}>

              {/* Header */}
              <div className={styles.receiptHeader}>
                <div className={styles.shopName}>B's Cafe</div>
                <div className={styles.shopTagline}>Brewed with love</div>
                <div className={styles.shopAddress}>Rosales, Pangasinan</div>
              </div>

              <div className={styles.dividerDash} />

              {/* Order meta */}
              <div className={styles.metaGrid}>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Order</span>
                  <span className={styles.metaVal}>#{orderId}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Date</span>
                  <span className={styles.metaVal}>{dateStr}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Time</span>
                  <span className={styles.metaVal}>{timeStr}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Payment</span>
                  <span className={styles.metaVal}>{order.paymentMethod}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Status</span>
                  <span className={`${styles.metaVal} ${
                    (order.status ?? "Complete") === "Complete"
                      ? styles.statusComplete
                      : styles.statusPending
                  }`}>
                    {order.status ?? "Complete"}
                  </span>
                </div>
              </div>

              <div className={styles.dividerDash} />

              {/* Items */}
              <div className={styles.itemsHeader}>
                <span>ITEM</span>
                <span>QTY</span>
                <span>AMOUNT</span>
              </div>

              <div className={styles.itemsList}>
                {order.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemQty}>×{item.quantity}</span>
                    <span className={styles.itemAmt}>
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.dividerDash} />

              {/* Totals */}
              <div className={styles.totalsBlock}>
                <div className={styles.totalLine}>
                  <span>Subtotal</span>
                  <span>₱{order.subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.totalLine}>
                  <span>Tax (10%)</span>
                  <span>₱{order.tax.toFixed(2)}</span>
                </div>
                <div className={styles.grandTotalLine}>
                  <span>TOTAL</span>
                  <span>₱{order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.dividerDash} />

              {/* Footer */}
              <div className={styles.receiptFooter}>
                <div className={styles.thankYou}>Thank you for visiting!</div>
                <div className={styles.footerSub}>Please come again 🙏</div>
                {/* Barcode-style decoration */}
                <div className={styles.barcode}>
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={styles.bar}
                      style={{ height: `${[14,20,10,18,24,10,16,22,12,20,14,18,10,24,16,20,12,18,14,22,10,16,24,12,20,14,18,10,22,16,12,20,14,18,24,10][i % 36]}px` }}
                    />
                  ))}
                </div>
                <div className={styles.barcodeText}>{orderId}</div>
              </div>
            </div>

            {/* Bottom serrated edge */}
            <div className={styles.tearedBottom} />
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className={styles.modalActions}>
          <button className={styles.printBtn} onClick={handlePrint}>
            <PrintIcon /> Print Receipt
          </button>
          <button className={styles.closeActionBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}

function PrintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="12" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 12V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 7V3h6v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="10" r="1" fill="currentColor"/>
    </svg>
  );
}