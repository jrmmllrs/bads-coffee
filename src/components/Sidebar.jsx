const NAV = [
  { id: "pos", icon: "⊞", label: "POS" },
  { id: "orders", icon: "📋", label: "Orders" },
  { id: "menu", icon: "🍽", label: "Menu" },
  { id: "categories", icon: "🏷", label: "Categories" },
  { id: "reports", icon: "📊", label: "Reports" },
];

export default function Sidebar({ active, setActive }) {
  return (
    <aside style={{
      width: 80,
      background: "#0f0f1a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 0",
      gap: 4,
      flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ marginBottom: 24, fontSize: 28 }}>☕</div>
      {NAV.map((n) => (
        <button
          key={n.id}
          onClick={() => setActive(n.id)}
          title={n.label}
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            border: "none",
            background: active === n.id ? "rgba(255,255,255,0.12)" : "transparent",
            color: active === n.id ? "#fff" : "rgba(255,255,255,0.4)",
            fontSize: 22,
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <span>{n.icon}</span>
          <span style={{ fontSize: 9, fontFamily: "'DM Sans', sans-serif", letterSpacing: 0.5 }}>
            {n.label}
          </span>
          {active === n.id && (
            <span style={{
              position: "absolute",
              left: -1,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 24,
              background: "#c8a97e",
              borderRadius: "0 4px 4px 0",
            }} />
          )}
        </button>
      ))}
    </aside>
  );
}
