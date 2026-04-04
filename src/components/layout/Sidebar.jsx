// components/layout/Sidebar.jsx
// Vertical navigation sidebar. Collapses to bottom bar on mobile.

import styles from "./Sidebar.module.css";

// Import the image
import logoImage from "../../assets/bs.jpg"; // Adjust the path based on your folder structure

const NAV_ITEMS = [
  { id: "pos", icon: "⊞", label: "POS" },
  { id: "orders", icon: "📋", label: "Orders" },
  { id: "menu", icon: "🍽", label: "Menu" },
  { id: "cats", icon: "🏷", label: "Categ." },
  { id: "reports", icon: "📊", label: "Reports" },
];

const Sidebar = ({ active, setActive }) => (
  <>
    {/* Desktop sidebar */}
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>
          <img
            src={logoImage}
            alt="B's Coffee Shop"
            className={styles.logoImg}
          />
        </span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={active === item.id}
            onClick={() => setActive(item.id)}
          />
        ))}
      </nav>

      <div className={styles.spacer} />

      <div className={styles.avatarWrap} title="Cashier">
        <div className={styles.avatar}>B's</div>
      </div>
    </aside>

    {/* Mobile bottom bar */}
    <nav className={styles.mobileBar}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`${styles.mobileBtn} ${active === item.id ? styles.mobileBtnActive : ""}`}
          onClick={() => setActive(item.id)}
          aria-label={item.label}
        >
          <span className={styles.mobileIcon}>{item.icon}</span>
          <span className={styles.mobileLabel}>{item.label}</span>
        </button>
      ))}
    </nav>
  </>
);

const NavButton = ({ item, isActive, onClick }) => (
  <button
    className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ""}`}
    onClick={onClick}
    title={item.label}
    aria-label={item.label}
    aria-current={isActive ? "page" : undefined}
  >
    {isActive && <span className={styles.activePill} aria-hidden="true" />}
    <span className={styles.navIcon}>{item.icon}</span>
    <span className={styles.navLabel}>{item.label}</span>
  </button>
);

export default Sidebar;
