/**
 * pages/ReportsPage.jsx
 * Analytics with a global date filter — all stats, breakdown, and charts
 * update together based on the selected period.
 * Includes integrated Expenses tracking with add/edit/delete + profit view.
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

const EXPENSE_CATEGORIES = [
  { label: "Ingredients & Supplies", value: "Ingredients", icon: "🥬", color: "#16a34a" },
  { label: "Utilities & Rent",       value: "Utilities",   icon: "💡", color: "#f59e0b" },
  { label: "Staff & Labor",          value: "Staff",       icon: "👥", color: "#6366f1" },
  { label: "Equipment",              value: "Equipment",   icon: "🔧", color: "#0ea5e9" },
  { label: "Other",                  value: "Other",       icon: "📦", color: "#a78bfa" },
];

const EMPTY_FORM = { name: "", amount: "", category: "Ingredients", date: "", notes: "" };

const fmt   = (n) => `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
};

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

function filterExpenses(expenses, dateFilter, customFrom, customTo) {
  if (dateFilter === "today")  return expenses.filter((e) => isToday(e.date));
  if (dateFilter === "week")   return expenses.filter((e) => isWithinDays(e.date, 7));
  if (dateFilter === "month")  return expenses.filter((e) => isWithinDays(e.date, 30));
  if (dateFilter === "all")    return expenses;
  if (dateFilter === "custom") {
    const from = customFrom ? new Date(customFrom).setHours(0,0,0,0)    : null;
    const to   = customTo   ? new Date(customTo).setHours(23,59,59,999) : null;
    return expenses.filter((e) => {
      const t = new Date(e.date).getTime();
      if (from && t < from) return false;
      if (to   && t > to)   return false;
      return true;
    });
  }
  return expenses;
}

// ── Expense Modal ─────────────────────────────────────────────────────────────
function ExpenseModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { ...initial, amount: String(initial.amount), date: initial.date?.split("T")[0] || today() }
      : { ...EMPTY_FORM, date: today() }
  );
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim())                                    return setError("Expense name is required.");
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) return setError("Enter a valid amount greater than 0.");
    setError("");
    onSave({ ...form, amount: parseFloat(form.amount), date: form.date ? new Date(form.date).toISOString() : new Date().toISOString() });
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:460,
        boxShadow:"0 20px 60px rgba(0,0,0,.2)", display:"flex", flexDirection:"column", gap:14 }}>
        <h2 style={{ margin:0, fontSize:17, fontWeight:700, color:"#111827", fontFamily:"'DM Sans',sans-serif" }}>
          {initial ? "Edit Expense" : "Add Expense"}
        </h2>

        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8,
            padding:"9px 13px", color:"#dc2626", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
            {error}
          </div>
        )}

        <label style={modalLabel}>
          Expense Name *
          <input style={modalInput} value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Rice sack, Electricity bill…" />
        </label>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <label style={modalLabel}>
            Amount (₱) *
            <input style={modalInput} type="number" min="0" step="0.01"
              value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" />
          </label>
          <label style={modalLabel}>
            Date
            <input style={modalInput} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </label>
        </div>

        <label style={modalLabel}>
          Category
          <select style={modalInput} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
        </label>

        <label style={modalLabel}>
          Notes (optional)
          <textarea style={{ ...modalInput, resize:"vertical", minHeight:64 }}
            value={form.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Any additional details…" />
        </label>

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={btnPrimary}   onClick={handleSave}>{initial ? "Save Changes" : "Add Expense"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ icon, title, message, onConfirm, onClose, danger }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"32px 28px", width:"100%",
        maxWidth:360, textAlign:"center", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>{icon}</div>
        <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>{title}</h3>
        <p style={{ margin:"0 0 20px", color:"#6b7280", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{message}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimary, background: danger ? "#dc2626" : "#111827" }} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { orders, menuItems, expenses = [], addExpense, updateExpense, deleteExpense, clearAllExpenses } = useApp();

  const [dateFilter, setDateFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  // Expense UI state
  const [expModal,      setExpModal]      = useState(null);   // null | "add" | expense object
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [confirmClear,  setConfirmClear]  = useState(false);
  const [expSearch,     setExpSearch]     = useState("");
  const [expCategory,   setExpCategory]   = useState("All");

  const filtered = useMemo(
    () => filterOrders(orders, dateFilter, customFrom, customTo),
    [orders, dateFilter, customFrom, customTo],
  );

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, dateFilter, customFrom, customTo),
    [expenses, dateFilter, customFrom, customTo],
  );

  // ── Order aggregates ──
  const totalRevenue  = filtered.reduce((s, o) => s + o.total, 0);
  const paidRevenue   = filtered.filter((o) => o.paymentStatus === "Paid").reduce((s, o) => s + o.total, 0);
  const avgOrder      = filtered.length ? totalRevenue / filtered.length : 0;

  const cashOrds      = filtered.filter((o) => o.paymentMethod === "Cash");
  const walletOrds    = filtered.filter((o) => o.paymentMethod === "Wallet");
  const cashPct       = filtered.length ? Math.round((cashOrds.length / filtered.length) * 100) : 0;
  const walletPct     = filtered.length ? Math.round((walletOrds.length / filtered.length) * 100) : 0;
  const cashRevenue   = cashOrds.reduce((s, o) => s + o.total, 0);
  const walletRevenue = walletOrds.reduce((s, o) => s + o.total, 0);

  const itemCounts = {};
  filtered.forEach((o) => o.items.forEach((i) => {
    itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
  }));
  const popular = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPop  = popular[0]?.[1] || 1;

  const catRevenue = {};
  filtered.forEach((o) => o.items.forEach((i) => {
    const m   = menuItems.find((x) => x.name === i.name);
    const cat = m?.category || "Other";
    catRevenue[cat] = (catRevenue[cat] || 0) + i.price * i.quantity;
  }));
  const catEntries = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]);
  const maxCat     = catEntries[0]?.[1] || 1;

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

  // ── Expense aggregates ──
  const totalExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit     = paidRevenue - totalExpenses;

  const expCategoryTotals = useMemo(() => {
    const map = {};
    EXPENSE_CATEGORIES.forEach((c) => { map[c.value] = 0; });
    filteredExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return map;
  }, [filteredExpenses]);

  const visibleExpenses = useMemo(() => {
    return filteredExpenses.filter((e) => {
      if (expCategory !== "All" && e.category !== expCategory) return false;
      if (expSearch) {
        const s = expSearch.toLowerCase();
        if (!e.name.toLowerCase().includes(s) && !(e.notes || "").toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [filteredExpenses, expCategory, expSearch]);

  const filterLabel  = DATE_FILTERS.find((f) => f.id === dateFilter)?.label || "All Time";
  const profitColor  = netProfit >= 0 ? "#16a34a" : "#dc2626";
  const profitBg     = netProfit >= 0 ? "#dcfce7" : "#fef2f2";

  // ── Handlers ──
  const handleExpSave = async (form) => {
    if (expModal === "add") await addExpense(form);
    else                    await updateExpense({ ...expModal, ...form });
    setExpModal(null);
  };

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
          <button key={f.id}
            className={`${styles.filterBtn} ${dateFilter === f.id ? styles.filterActive : ""}`}
            onClick={() => setDateFilter(f.id)}>
            <span>{f.icon}</span> {f.label}
          </button>
        ))}
      </div>

      {/* ── Custom range ── */}
      {dateFilter === "custom" && (
        <div className={styles.customRange}>
          <div className={styles.customField}>
            <label className={styles.customLabel}>From</label>
            <input type="date" className={styles.dateInput} value={customFrom}
              max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
          </div>
          <span className={styles.customSep}>→</span>
          <div className={styles.customField}>
            <label className={styles.customLabel}>To</label>
            <input type="date" className={styles.dateInput} value={customTo}
              min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
          {(customFrom || customTo) && (
            <button className={styles.clearRange}
              onClick={() => { setCustomFrom(""); setCustomTo(""); }}>Clear</button>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className={styles.statGrid}>
        <StatCard label="Orders"    value={filtered.length}               sub={filterLabel}  color="var(--accent)" icon="🧾" />
        <StatCard label="Revenue"   value={`₱${totalRevenue.toFixed(2)}`} sub="total sales"  color="var(--blue)"   icon="💰" />
        <StatCard label="Avg Order" value={`₱${avgOrder.toFixed(2)}`}     sub="per order"    color="var(--pink)"   icon="📈" />
      </div>

      {/* ── Profit Summary ── */}
      <div className={styles.breakdownCard}>
        <h3 className={styles.cardTitle}>Revenue & Profit · {filterLabel}</h3>
        <div className={styles.breakdownGrid}>
          <BreakdownRow icon="💰" iconBg="rgba(37,99,235,0.10)"  label="Total Revenue"   sub="Sum of all orders"         value={fmt(totalRevenue)}  color="#2563eb" big />
          <div className={styles.breakdownDivider} />
          <BreakdownRow icon="✅" iconBg="rgba(22,163,74,0.10)"  label="Paid Revenue"    sub="From paid orders only"     value={fmt(paidRevenue)}   color="#16a34a" />
          <div className={styles.breakdownDivider} />
          <BreakdownRow icon="🧾" iconBg="rgba(239,68,68,0.10)"  label="Total Expenses"  sub={`${filteredExpenses.length} record${filteredExpenses.length !== 1 ? "s" : ""} this period`} value={fmt(totalExpenses)} color="#ef4444" />
          <div className={styles.breakdownDivider} />
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0" }}>
            <div style={{ width:42, height:42, borderRadius:10, background: profitBg,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {netProfit >= 0 ? "📈" : "📉"}
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, color:"#111827" }}>
                Net Profit
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#9ca3af" }}>
                Paid Revenue − Expenses
              </span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:20, fontWeight:700, color: profitColor }}>
                {fmt(netProfit)}
              </span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:700,
                color: profitColor, background: profitBg, padding:"2px 10px", borderRadius:20 }}>
                {netProfit >= 0 ? "Profitable" : "At a Loss"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className={styles.chartsRow}>
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
                  <div className={styles.bar}
                    style={{ height: `${Math.max((d.value / maxDay) * 100, d.value > 0 ? 4 : 0)}%` }} />
                  <span className={styles.barLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Payment Methods</h3>
          {filtered.length === 0 ? (
            <EmptyState icon="💳" message="No orders in this period" />
          ) : (
            <div className={styles.paymentChart}>
              <div className={styles.donut}
                style={{ background: `conic-gradient(#16a34a 0% ${cashPct}%, #f59e0b ${cashPct}% 100%)` }} />
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
              ))}
        </div>
        <div className={styles.chartCard}>
          <h3 className={styles.cardTitle}>Revenue by Category</h3>
          {catEntries.length === 0
            ? <EmptyState icon="📂" message="No data in this period" />
            : catEntries.map(([cat, val]) => (
                <BarRow key={cat} label={cat} value={val} max={maxCat} valueLabel={`₱${val.toFixed(2)}`} color="#2563eb" />
              ))}
        </div>
      </div>

      {/* ── Expenses by Category breakdown ── */}
      <div className={styles.chartCard} style={{ marginTop: 0 }}>
        <h3 className={styles.cardTitle}>Expenses by Category · {filterLabel}</h3>
        {filteredExpenses.length === 0 ? (
          <EmptyState icon="🧾" message="No expenses in this period" />
        ) : (
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {EXPENSE_CATEGORIES.map((cat) => {
              const amt = expCategoryTotals[cat.value] || 0;
              const pct = totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0;
              return (
                <div key={cat.value} style={{ flex:"1 1 130px", background: cat.color + "10",
                  borderRadius:10, padding:"12px 14px", borderTop:`3px solid ${cat.color}` }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{cat.icon}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:cat.color, fontFamily:"'DM Mono',monospace" }}>
                    {fmt(amt)}
                  </div>
                  <div style={{ fontSize:11, color:"#6b7280", marginTop:2, fontFamily:"'DM Sans',sans-serif" }}>
                    {cat.label}
                  </div>
                  <div style={{ marginTop:8, background:"#e5e7eb", borderRadius:4, height:4 }}>
                    <div style={{ width:`${pct}%`, background:cat.color, borderRadius:4, height:4, transition:"width .5s" }} />
                  </div>
                  <div style={{ fontSize:10, color:"#9ca3af", marginTop:3, fontFamily:"'DM Sans',sans-serif" }}>
                    {pct.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Expenses List ── */}
      <div className={styles.chartCard} style={{ marginTop: 0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:10, marginBottom:14 }}>
          <h3 className={styles.cardTitle} style={{ margin:0 }}>Expense Records · {filterLabel}</h3>
          <button style={btnPrimary} onClick={() => setExpModal("add")}>+ Add Expense</button>
        </div>

        {/* Expense filters */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
          <input style={filterInput} placeholder="🔍 Search…" value={expSearch}
            onChange={(e) => setExpSearch(e.target.value)} />
          <select style={filterInput} value={expCategory} onChange={(e) => setExpCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          {expenses.length > 0 && (
            <button style={{ ...btnSecondary, marginLeft:"auto", color:"#dc2626", borderColor:"#fecaca" }}
              onClick={() => setConfirmClear(true)}>
              Clear All
            </button>
          )}
        </div>

        {visibleExpenses.length === 0 ? (
          <EmptyState icon="🧾" message={expenses.length === 0 ? "No expenses yet — add one to get started." : "No expenses match your filters."} />
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {visibleExpenses.map((exp) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.value === exp.category) || EXPENSE_CATEGORIES[4];
              return (
                <div key={exp.id} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
                  padding:"12px 14px", background:"#f9fafb", borderRadius:10,
                  border:"1px solid #f3f4f6" }}>
                  <div style={{ width:36, height:36, borderRadius:8, background: cat.color + "18",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:16, flexShrink:0 }}>
                    {cat.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, color:"#111827", fontSize:14,
                      fontFamily:"'DM Sans',sans-serif" }}>{exp.name}</div>
                    <div style={{ fontSize:11, color:"#9ca3af", marginTop:2,
                      fontFamily:"'DM Sans',sans-serif", display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span>{fmtDate(exp.date)}</span>
                      <span style={{ color: cat.color, fontWeight:600 }}>{cat.icon} {cat.label}</span>
                      {exp.notes && <span>· {exp.notes}</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontWeight:700,
                    fontSize:15, color:"#ef4444", whiteSpace:"nowrap" }}>
                    {fmt(exp.amount)}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={iconBtn} title="Edit"   onClick={() => setExpModal(exp)}>✏️</button>
                    <button style={iconBtn} title="Delete" onClick={() => setDeleteTarget(exp)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(expModal === "add" || (expModal && typeof expModal === "object")) && (
        <ExpenseModal initial={expModal === "add" ? null : expModal} onSave={handleExpSave} onClose={() => setExpModal(null)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          icon="🗑️" danger
          title="Delete Expense?"
          message={`"${deleteTarget.name}" (${fmt(deleteTarget.amount)}) will be permanently removed.`}
          onConfirm={async () => { await deleteExpense(deleteTarget.id, deleteTarget.name); setDeleteTarget(null); }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          icon="⚠️" danger
          title="Clear All Expenses?"
          message={`This will permanently delete all ${expenses.length} expense records.`}
          onConfirm={async () => { await clearAllExpenses(); setConfirmClear(false); }}
          onClose={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BreakdownRow({ icon, iconBg, label, sub, value, color, big }) {
  return (
    <div className={`${styles.breakdownItem} ${big ? styles.breakdownTotal : ""}`}>
      <div className={styles.breakdownIcon} style={{ background: iconBg }}>{icon}</div>
      <div className={styles.breakdownInfo}>
        <span className={styles.breakdownLabel}>{label}</span>
        <span className={styles.breakdownSub}>{sub}</span>
      </div>
      <span className={styles.breakdownValue} style={{ color, fontSize: big ? 20 : undefined }}>{value}</span>
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

// ── Shared inline styles ──────────────────────────────────────────────────────
const modalLabel = {
  display:"flex", flexDirection:"column", gap:5,
  fontSize:13, fontWeight:600, color:"#374151", fontFamily:"'DM Sans',sans-serif",
};
const modalInput = {
  border:"1.5px solid #e5e7eb", borderRadius:8, padding:"9px 12px",
  fontSize:14, color:"#111827", background:"#f9fafb", outline:"none",
  fontFamily:"'DM Sans',sans-serif",
};
const filterInput = {
  border:"1px solid #e0e3e8", borderRadius:8, padding:"7px 11px",
  fontSize:13, color:"#111827", background:"#fff", outline:"none",
  fontFamily:"'DM Sans',sans-serif",
};
const btnPrimary = {
  background:"#e8521a", color:"#fff", border:"none", borderRadius:8,
  padding:"9px 16px", fontWeight:600, fontSize:13, cursor:"pointer",
  fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
};
const btnSecondary = {
  background:"#fff", color:"#374151", border:"1.5px solid #e5e7eb", borderRadius:8,
  padding:"9px 16px", fontWeight:600, fontSize:13, cursor:"pointer",
  fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
};
const iconBtn = {
  background:"transparent", border:"none", borderRadius:6,
  padding:"4px 5px", cursor:"pointer", fontSize:14, lineHeight:1,
};