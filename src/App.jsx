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

// ── Coffee cup SVG icon ───────────────────────────────────────────────────────
function CoffeeCupIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 0 18px rgba(200,169,126,0.18))" }}
    >
      {/* Steam wisps */}
      <path
        d="M28 14 Q25 10 28 6 Q31 2 28 -2"
        stroke="#c8a97e" strokeWidth="1.5" strokeLinecap="round" fill="none"
        style={{ animation: "brewSteam1 2.1s ease-in-out infinite", opacity: 0.7 }}
      />
      <path
        d="M40 14 Q43 10 40 6 Q37 2 40 -2"
        stroke="#c8a97e" strokeWidth="1.5" strokeLinecap="round" fill="none"
        style={{ animation: "brewSteam2 2.5s ease-in-out infinite 0.3s", opacity: 0.5 }}
      />
      <path
        d="M52 14 Q49 10 52 6 Q55 2 52 -2"
        stroke="#c8a97e" strokeWidth="1.5" strokeLinecap="round" fill="none"
        style={{ animation: "brewSteam3 1.9s ease-in-out infinite 0.6s", opacity: 0.6 }}
      />
      {/* Cup body */}
      <path
        d="M14 26 L18 62 Q18.5 66 22 66 L58 66 Q61.5 66 62 62 L66 26 Z"
        fill="#1c1917" stroke="#c8a97e" strokeWidth="1.2" strokeOpacity="0.5"
      />
      {/* Coffee liquid */}
      <path
        d="M18 36 L20 62 Q20.2 64.5 22 64.5 L58 64.5 Q59.8 64.5 60 62 L62 36 Z"
        fill="#3d2a1e"
      />
      {/* Crema */}
      <ellipse cx="40" cy="36" rx="22" ry="5" fill="#c8a97e" opacity="0.25" />
      <ellipse cx="40" cy="36" rx="14" ry="2.5" fill="#c8a97e" opacity="0.15" />
      {/* Rim */}
      <rect x="12" y="22" width="56" height="7" rx="3.5"
        fill="#1c1917" stroke="#c8a97e" strokeWidth="1" strokeOpacity="0.6"
      />
      {/* Handle */}
      <path
        d="M62 36 Q76 36 76 46 Q76 56 62 56"
        stroke="#c8a97e" strokeWidth="3" strokeLinecap="round" fill="none" strokeOpacity="0.7"
      />
      <path
        d="M62 36 Q72 36 72 46 Q72 56 62 56"
        stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      {/* Saucer */}
      <ellipse cx="40" cy="69" rx="30" ry="5"
        fill="#1c1917" stroke="#c8a97e" strokeWidth="1" strokeOpacity="0.4"
      />
      <ellipse cx="40" cy="68" rx="20" ry="2.5" fill="#c8a97e" opacity="0.08" />
    </svg>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <>
      <style>{`
        @keyframes brewSteam1 {
          0%,100% { transform: translateY(0) scaleX(1); opacity: .7; }
          50%      { transform: translateY(-8px) scaleX(1.3); opacity: .25; }
        }
        @keyframes brewSteam2 {
          0%,100% { transform: translateY(0) scaleX(1); opacity: .5; }
          50%      { transform: translateY(-10px) scaleX(.7); opacity: .15; }
        }
        @keyframes brewSteam3 {
          0%,100% { transform: translateY(0) scaleX(1); opacity: .6; }
          50%      { transform: translateY(-7px) scaleX(1.1); opacity: .2; }
        }
        @keyframes brewBar {
          0%   { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes brewFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes brewDot1 { 0%,80%,100%{opacity:.2} 20%{opacity:1} }
        @keyframes brewDot2 { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
        @keyframes brewDot3 { 0%,80%,100%{opacity:.2} 60%{opacity:1} }
        .brew-screen {
          height: 100vh;
          background: #0e0c0a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          animation: brewFade .5s ease forwards;
        }
        .brew-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .brew-wordmark {
          margin-top: 20px;
          text-align: center;
        }
        .brew-title {
          font-size: 22px;
          font-weight: 600;
          color: #f5f0e8;
          letter-spacing: .04em;
        }
        .brew-title span { color: #c8a97e; }
        .brew-subtitle {
          font-size: 11px;
          color: #6b5f4e;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .brew-bar-track {
          margin-top: 28px;
          width: 160px;
          height: 2px;
          background: #2a2420;
          border-radius: 2px;
          overflow: hidden;
        }
        .brew-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #c8a97e, #e8c99e);
          border-radius: 2px;
          transform-origin: left;
          animation: brewBar 2.4s cubic-bezier(.4,0,.2,1) forwards;
        }
        .brew-dots {
          margin-top: 16px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .brew-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c8a97e;
          opacity: .2;
        }
        .brew-dot:nth-child(1) { animation: brewDot1 1.4s infinite; }
        .brew-dot:nth-child(2) { animation: brewDot2 1.4s infinite; }
        .brew-dot:nth-child(3) { animation: brewDot3 1.4s infinite; }
        .brew-label {
          margin-top: 10px;
          font-size: 12px;
          color: #4a3f33;
          letter-spacing: .06em;
        }
      `}</style>

      <div className="brew-screen">
        <div className="brew-inner">
          <CoffeeCupIcon />

          <div className="brew-wordmark">
            <div className="brew-title">Brew<span>POS</span></div>
            <div className="brew-subtitle">Point of Sale</div>
          </div>

          <div className="brew-bar-track">
            <div className="brew-bar-fill" />
          </div>

          <div className="brew-dots">
            <div className="brew-dot" />
            <div className="brew-dot" />
            <div className="brew-dot" />
          </div>

          <div className="brew-label">Loading your POS…</div>
        </div>
      </div>
    </>
  );
}

// ── Inner app (needs AppContext) ──────────────────────────────────────────────
function AppInner() {
  const { ready } = useApp();
  const [activePage, setActivePage] = useState("pos");

  if (!ready) return <LoadingScreen />;

  const Page = PAGES[activePage];

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