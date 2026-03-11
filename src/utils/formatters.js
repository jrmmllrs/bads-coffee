/**
 * utils/formatters.js
 * Pure helper functions for formatting values in the UI.
 */

/** Format a number as USD currency string: 3.5 → "$3.50" */
export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

/** Format an ISO timestamp into a readable locale string */
export const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });

/** Format an ISO timestamp into time only: "02:45 PM" */
export const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString("en-US", {
    hour:   "2-digit",
    minute: "2-digit",
  });

/** Format an ISO timestamp as short datetime: "Jan 5, 02:45 PM" */
export const formatDateTime = (isoString) =>
  `${formatDate(isoString)}, ${formatTime(isoString)}`;

/** Get last N chars of an order ID for display: "Order #abc123" */
export const formatOrderId = (id, length = 6) =>
  `#${String(id).slice(-length).toUpperCase()}`;

/** Check if an ISO timestamp is from today */
export const isToday = (isoString) =>
  new Date(isoString).toDateString() === new Date().toDateString();

/** Check if an ISO timestamp is within the last N days */
export const isWithinDays = (isoString, days) =>
  Date.now() - new Date(isoString).getTime() < days * 86_400_000;

/** Compute percentage safely (avoid divide by zero) */
export const pct = (part, total) =>
  total === 0 ? 0 : Math.round((part / total) * 100);
