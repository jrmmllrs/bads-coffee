/**
 * components/ui/Badge.jsx
 * Small pill badge for status labels, tags, etc.
 */
export const Badge = ({ children, variant = "default" }) => {
  const colors = {
    default: { bg: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" },
    success: { bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
    error:   { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
    warning: { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
    cash:    { bg: "rgba(22,163,74,0.18)",   color: "#4ade80" },
    card:    { bg: "rgba(37,99,235,0.18)",   color: "#60a5fa" },
    accent:  { bg: "rgba(200,169,126,0.18)", color: "#c8a97e" },
  };
  const { bg, color } = colors[variant] || colors.default;
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      padding:       "3px 10px",
      borderRadius:  9999,
      fontSize:      11,
      fontWeight:    600,
      fontFamily:    "var(--font-sans)",
      background:    bg,
      color,
      whiteSpace:    "nowrap",
    }}>
      {children}
    </span>
  );
};

/**
 * components/ui/StatCard.jsx
 * Metric card used in the Reports page.
 */
export const StatCard = ({ label, value, sub, color = "var(--accent)", icon }) => (
  <div style={{
    background:   "rgba(255,255,255,0.04)",
    border:       "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding:      "20px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    </div>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
    {sub && <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--text-muted)" }}>{sub}</div>}
  </div>
);

/**
 * components/ui/EmptyState.jsx
 * Shown when a list has no items.
 */
export const EmptyState = ({ icon = "📭", title, message }) => (
  <div style={{
    textAlign:   "center",
    padding:     "60px 24px",
    color:       "var(--text-muted)",
    fontFamily:  "var(--font-sans)",
  }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    {title   && <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{title}</div>}
    {message && <div style={{ fontSize: 13 }}>{message}</div>}
  </div>
);

/**
 * components/ui/ConfirmDialog.jsx
 * Inline confirmation before destructive actions.
 */
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirm", danger = false }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16, backdropFilter: "blur(6px)" }}>
      <div className="animate-scale-in" style={{ background: "var(--bg-elevated)", border: `1px solid ${danger ? "rgba(248,113,113,0.25)" : "var(--border-hover)"}`, borderRadius: "var(--radius-xl)", padding: 28, width: "100%", maxWidth: 360, boxShadow: "var(--shadow-lg)" }}>
        <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: 18, marginBottom: 10 }}>{title}</h3>
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-hover)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-sans)", fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ flex: 1, padding: "11px", borderRadius: "var(--radius-md)", border: "none", background: danger ? "var(--red)" : "var(--accent)", color: danger ? "#fff" : "#0d0d18", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
