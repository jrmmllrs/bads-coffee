import { useApp } from "../context/AppContext";

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: toast.type === "error" ? "#ef4444" : "#1a1a2e",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 12,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span>{toast.type === "error" ? "✕" : "✓"}</span>
      {toast.message}
      <style>{`@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}
