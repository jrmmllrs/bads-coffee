/**
 * App.jsx
 * Root component. Wraps everything in AppProvider and renders
 * the sidebar + current page based on active navigation state.
 */

import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/layout/Sidebar";
import Toast from "./components/ui/Toast";

// Pages
import POSPage        from "./pages/POSPage";
import OrdersPage     from "./pages/OrdersPage";
import MenuPage       from "./pages/MenuPage";
import CategoriesPage from "./pages/CategoriesPage";
import ReportsPage    from "./pages/ReportsPage";

import "./styles/globals.css";

// Page registry — maps nav ID → component
const PAGES = {
  pos:     POSPage,
  orders:  OrdersPage,
  menu:    MenuPage,
  cats:    CategoriesPage,
  reports: ReportsPage,
};

// ── Inner app (needs AppContext) ──────────────────────────────────────────────
function AppInner() {
  const { ready } = useApp();
  const [activePage, setActivePage] = useState("pos");

  const Page = PAGES[activePage];

  if (!ready) {
    return (
      <div style={{
        height: "100vh", background: "#0d0d18",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16, fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ fontSize: 52 }}>☕</div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Loading your POS…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar active={activePage} setActive={setActivePage} />
      <main className="main-content">
        <Page />
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
