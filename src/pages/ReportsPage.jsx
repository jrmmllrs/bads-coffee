/**
 * pages/ReportsPage.jsx
 * Analytics with a global date filter — all stats, breakdown, and charts
 * update together based on the selected period.
 */

import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { StatCard, EmptyState } from "../components/ui/index.jsx";
import { isToday, isWithinDays } from "../utils/formatters";
import styles from "./ReportsPage.module.css";

const DATE_FILTERS = [
  { id: "today",  label: "Today",      icon: "📅" },
  { id: "week",   label: "This Week",  icon: "📆" },
  { id: "month",  label: "This Month", icon: "🗓" },
  { id: "all",    label: "All Time",   icon: "♾"  },
  { id: "custom", label: "Custom",     icon: "✏️" },
];

function filterOrders(orders, dateFilter, customFrom, customTo) {
  if (dateFilter === "today")  return orders.filter((o) => isToday(o.timestamp));
  if (dateFilter === "week")   return orders.filter((o) => isWithinDays(o.timestamp, 7));
  if (dateFilter === "month")  return orders.filter((o) => isWithinDays(o.timestamp, 30));
  if (dateFilter === "all")    return orders;
  if (dateFilter === "custom") {
    const from = customFrom ? new Date(customFrom).setHours(0,0,0,0)    : null;
    const to   = customTo   ? new Date(customTo).setHours(23,59,59,999) : null;
    return orders.filter((o) => {
      const t = new Date(o.timestamp).getTime();
      if (from && t < from) return false;
      if (to   && t > to)   return false;
      return true;
    });
  }
  return orders;
}

export default function ReportsPage() {
  const { orders, menuItems } = useApp();

  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  const filtered = useMemo(
    () => filterOrders(orders, dateFilter, customFrom, customTo),
    [orders, dateFilter, customFrom, customTo],
  );

  // ── Aggregates ──
  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder     = filtered.length ? totalRevenue / filtered.length : 0;

  // Payment split (Cash + Wallet)
  const cashOrds      = filtered.filter((o) => o.paymentMethod === "Cash");
  const walletOrds    = filtered.filter((o) => o.paymentMethod === "Wallet");
  const cashPct       = filtered.length ? Math.round((cashOrds.length / filtered.length) * 100) : 0;
  const walletPct     = filtered.length ? Math.round((walletOrds.length / filtered.length) * 100) : 0;
  const cashRevenue   = cashOrds.reduce((s, o) => s + o.total, 0);
  const walletRevenue = walletOrds.reduce((s, o) => s + o.total, 0);

  // Popular items
  const itemCounts = {};
  filtered.forEach((o) => o.items.forEach((i) => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
  }));
  const popular = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPop  = popular[0]?.[1] || 1;

  // Revenue by category
  const catRevenue = {};
  filtered.forEach((o) => o.items.forEach((i) => {
    const m   = menuItems.find((x) => x.name === i.name);
    const cat = m?.category || "Other";
    catRevenue[cat] = (catRevenue[cat] || 0) + i.price * i.quantity;
  }));
  const catEntries = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);
  const maxCat     = catEntries[0]?.[1] || 1;

  // Bar chart
  const chartDays = dateFilter === "today" ? 1 : dateFilter === "week" ? 7 : dateFilter === "month" ? 30 : 7;
  const chartBars = Math.min(chartDays, 14);
  const chartData = Array.from({ length: chartBars }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (chartBars - 1 - i));
    d.setHours(0, 0, 0, 0);
    const dayStr = d.toDateString();
    const v = filtered
      .filter((o) => new Date(o.timestamp).toDateString() === dayStr)
      .reduce((s, o) => s + o.total, 0);
    return {
      label: chartBars <= 7
        ? d.toLocaleDateString("en", { weekday: "short" })
        : d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: v,
    };
  });
  const maxDay = Math.max(...chartData.map((d) => d.value), 1);

  const filterLabel = DATE_FILTERS.find((f) => f.id === dateFilter)?.label || "All Time";

  return (
    <div className="page-wrapper">

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Reports & Analytics</h2>
        <span className={styles.filteredCount}>
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} · {filterLabel}
        </span>
      </div>

      {/* ── Filter pills ── */}
      <div className={styles.filterBar}>
        {DATE_FILTERS.map((f) => (
          <button
            key={f.id}
            className={`${styles.filterBtn} ${dateFilter === f.id ? styles.filterActive : ""}`}
            onClick={() => setDateFilter(f.id)}
          >
            <span>{f.icon}</span> {f.label}
          </button>
        ))}
      </div>

      {/* ── Custom range ── */}
      {dateFilter === "custom" && (
        <div className={styles.customRange}>
          <div className={styles.customField}>
            <label className={styles.customLabel}>From</label>
            <input
              type="date"
              className={styles.dateInput}
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <span className={styles.customSep}>→</span>
          <div className={styles.customField}>
            <label className={styles.customLabel}>To</label>
            <input
              type="date"
              className={styles.dateInput}
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
          {(customFrom || customTo) && (
            <button className={styles.clearRange} onClick={() => { setCustomFrom(""); setCustomTo(""); }}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
        <StatCard label="Orders"    value={filtered.length}               sub={filterLabel} color="var(--accent)" icon="🧾" />
        <StatCard label="Revenue"   value={`₱${totalRevenue.toFixed(2)}`} sub="total sales" color="var(--blue)"   icon="💰" />
        <StatCard label="Avg Order" value={`₱${avgOrder.toFixed(2)}`}     sub="per order"   color="var(--pink)"   icon="📈" />
      </div>

      {/* ── Revenue Breakdown ── */}
      <div className={styles.breakdownCard}>
        <h3 className={styles.cardTitle}>Revenue Breakdown · {filterLabel}</h3>
        <div className={styles.breakdownGrid}>
          <BreakdownRow
            icon="💰"
            iconBg="rgba(37,99,235,0.10)"
            label="Total Revenue"
            sub="Sum of all orders"
            value={`₱${totalRevenue.toFixed(2)}`}
            color="#2563eb"
            big
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>

        {/* Bar chart */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>
            Sales · {dateFilter === "today" ? "Today" : `Last ${chartBars} Days`}
          </h3>
          {filtered.length === 0 ? (
            <EmptyState icon="📊" message="No orders in this period" />
          ) : (
            <div className={styles.barChart}>
              {chartData.map((d, i) => (
                <div key={i} className={styles.barCol}>
                  <span className={styles.barLabel2}>{d.value > 0 ? `₱${d.value.toFixed(0)}` : ""}</span>
                  <div
                    className={styles.bar}
                    style={{ height: `${Math.max((d.value / maxDay) * 100, d.value > 0 ? 4 : 0)}%` }}
                  />
                  <span className={styles.barLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment split */}
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Payment Methods</h3>
          {filtered.length === 0 ? (
            <EmptyState icon="💳" message="No orders in this period" />
          ) : (
            <div className={styles.paymentChart}>
              <div
                className={styles.donut}
                style={{ background: `conic-gradient(#16a34a 0% ${cashPct}%, #f59e0b ${cashPct}% 100%)` }}
              />
              <div className={styles.paymentLegend}>
                {[
                  ["💵 Cash",     cashOrds.length,   cashPct,   "#16a34a", cashRevenue  ],
                  ["📱 E-Wallet", walletOrds.length, walletPct, "#f59e0b", walletRevenue],
                ].map(([l, c, p, col, rev]) => (
                  <div key={l} className={styles.legendRow}>
                    <span className={styles.legendDot} style={{ background: col }} />
                    <div className={styles.legendInfo}>
                      <span className={styles.legendLabel}>{l}</span>
                      <span className={styles.legendSub}>{c} orders ({p}%)</span>
                    </div>
                    <span className={styles.legendVal} style={{ color: col }}>₱{rev.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className={styles.bottomRow}>
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Top Items Sold</h3>
          {popular.length === 0
            ? <EmptyState icon="🍽" message="No data in this period" />
            : popular.map(([name, count]) => (
                <BarRow key={name} label={name} value={count} max={maxPop} valueLabel={`${count} sold`} color="#e8521a" />
              ))
          }
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Revenue by Category</h3>
          {catEntries.length === 0
            ? <EmptyState icon="📂" message="No data in this period" />
            : catEntries.map(([cat, val]) => (
                <BarRow key={cat} label={cat} value={val} max={maxCat} valueLabel={`₱${val.toFixed(2)}`} color="#2563eb" />
              ))
          }
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ icon, iconBg, label, sub, value, color, big }) {
  return (
    <div className={`${styles.breakdownItem} ${big ? styles.breakdownTotal : ""}`}>
      <div className={styles.breakdownIcon} style={{ background: iconBg }}>{icon}</div>
      <div className={styles.breakdownInfo}>
        <span className={styles.breakdownLabel}>{label}</span>
        <span className={styles.breakdownSub}>{sub}</span>
      </div>
      <span className={styles.breakdownValue} style={{ color, fontSize: big ? 20 : undefined }}>
        {value}
      </span>
    </div>
  );
}

function BarRow({ label, value, max, valueLabel, color }) {
  return (
    <div className={styles.barRow}>
      <div className={styles.barRowTop}>
        <span className={styles.barRowLabel}>{label}</span>
        <span className={styles.barRowVal} style={{ color }}>{valueLabel}</span>
      </div>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    </div>
  );
}