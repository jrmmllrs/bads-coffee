/**
 * components/ui/Input.jsx
 * Reusable labelled input / select / textarea.
 */

import styles from "./Input.module.css";

export const Input = ({
  label,
  error,
  hint,
  className = "",
  ...props
}) => (
  <div className={`${styles.field} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <input className={`${styles.input} ${error ? styles.hasError : ""}`} {...props} />
    {error && <span className={styles.error}>{error}</span>}
    {!error && hint && <span className={styles.hint}>{hint}</span>}
  </div>
);

export const Select = ({
  label,
  error,
  children,
  className = "",
  ...props
}) => (
  <div className={`${styles.field} ${className}`}>
    {label && <label className={styles.label}>{label}</label>}
    <select className={`${styles.input} ${error ? styles.hasError : ""}`} {...props}>
      {children}
    </select>
    {error && <span className={styles.error}>{error}</span>}
  </div>
);

export default Input;
