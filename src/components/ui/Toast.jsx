/**
 * components/ui/Toast.jsx
 * Global toast notification — reads from AppContext.
 */

import { useApp } from "../../context/AppContext";
import styles from "./Toast.module.css";

const Toast = () => {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className={`${styles.toast} ${styles[toast.type]} animate-slide-up`} role="status" aria-live="polite">
      <span className={styles.icon}>{toast.type === "error" ? "✕" : "✓"}</span>
      <span className={styles.message}>{toast.message}</span>
    </div>
  );
};

export default Toast;
