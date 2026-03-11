/**
 * components/ui/Button.jsx
 * Reusable button with variant, size, and loading state support.
 *
 * Variants: primary | secondary | danger | ghost | outline
 * Sizes:    sm | md | lg
 */

import styles from "./Button.module.css";

const Button = ({
  children,
  variant  = "primary",
  size     = "md",
  fullWidth = false,
  loading  = false,
  disabled = false,
  onClick,
  type     = "button",
  className = "",
  ...rest
}) => {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    loading   ? styles.loading   : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={loading ? styles.loadingText : ""}>{children}</span>
    </button>
  );
};

export default Button;
