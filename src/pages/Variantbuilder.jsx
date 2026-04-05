/**
 * components/ui/VariantBuilder.jsx
 * Embedded inside the Add/Edit Menu Item modal.
 * Lets the admin define variant groups (Size, Flavor, Add-ons, etc.)
 * with options and price modifiers.
 */

import { useState } from "react";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import styles from "./Variantbuilder.module.css";

const newGroup = () => ({
  id:        `grp_${Date.now()}`,
  name:      "",
  type:      "single",   // "single" | "multi"
  required:  true,
  maxSelect: 1,
  options:   [],
});

const newOption = () => ({
  id:            `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name:          "",
  priceModifier: 0,
});

export default function VariantBuilder({ variants = [], onChange }) {
  const [collapsed, setCollapsed] = useState({});

  const updateGroup = (groupId, patch) => {
    onChange(variants.map((g) => g.id === groupId ? { ...g, ...patch } : g));
  };

  const removeGroup = (groupId) => {
    onChange(variants.filter((g) => g.id !== groupId));
  };

  const addOption = (groupId) => {
    onChange(variants.map((g) =>
      g.id === groupId ? { ...g, options: [...g.options, newOption()] } : g
    ));
  };

  const updateOption = (groupId, optionId, patch) => {
    onChange(variants.map((g) =>
      g.id === groupId
        ? { ...g, options: g.options.map((o) => o.id === optionId ? { ...o, ...patch } : o) }
        : g
    ));
  };

  const removeOption = (groupId, optionId) => {
    onChange(variants.map((g) =>
      g.id === groupId
        ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
        : g
    ));
  };

  const toggleCollapse = (groupId) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className={styles.root}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionTitle}>Variants / Add-ons</span>
        <span className={styles.sectionHint}>Size, flavor, toppings, etc.</span>
      </div>

      {variants.length === 0 && (
        <div className={styles.empty}>No variants yet. Add a group below.</div>
      )}

      {variants.map((group) => (
        <div key={group.id} className={styles.group}>

          {/* Group header row */}
          <div className={styles.groupHeader}>
            <button
              className={styles.collapseBtn}
              onClick={() => toggleCollapse(group.id)}
              title={collapsed[group.id] ? "Expand" : "Collapse"}
            >
              {collapsed[group.id] ? "▶" : "▼"}
            </button>
            <input
              className={styles.groupNameInput}
              placeholder="Group name (e.g. Size, Add-ons)"
              value={group.name}
              onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            />
            <button
              className={styles.removeGroupBtn}
              onClick={() => removeGroup(group.id)}
              title="Remove group"
            >
              ✕
            </button>
          </div>

          {/* Group settings */}
          {!collapsed[group.id] && (
            <div className={styles.groupBody}>
              <div className={styles.groupSettings}>
                <label className={styles.settingRow}>
                  <span className={styles.settingLabel}>Type</span>
                  <select
                    className={styles.settingSelect}
                    value={group.type}
                    onChange={(e) => updateGroup(group.id, { type: e.target.value })}
                  >
                    <option value="single">Single choice (radio)</option>
                    <option value="multi">Multiple choice (checkbox)</option>
                  </select>
                </label>

                <label className={styles.settingRow}>
                  <span className={styles.settingLabel}>Required</span>
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={(e) => updateGroup(group.id, { required: e.target.checked })}
                    className={styles.settingCheck}
                  />
                </label>

                {group.type === "multi" && (
                  <label className={styles.settingRow}>
                    <span className={styles.settingLabel}>Max picks</span>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className={styles.settingNumber}
                      value={group.maxSelect || 1}
                      onChange={(e) => updateGroup(group.id, { maxSelect: parseInt(e.target.value) || 1 })}
                    />
                  </label>
                )}
              </div>

              {/* Options */}
              <div className={styles.optionsList}>
                {group.options.length === 0 && (
                  <div className={styles.noOptions}>No options yet. Add one below.</div>
                )}
                {group.options.map((opt) => (
                  <div key={opt.id} className={styles.optionRow}>
                    <input
                      className={styles.optionNameInput}
                      placeholder="Option name (e.g. Large)"
                      value={opt.name}
                      onChange={(e) => updateOption(group.id, opt.id, { name: e.target.value })}
                    />
                    <div className={styles.optionPriceWrap}>
                      <span className={styles.optionPricePrefix}>+₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={styles.optionPriceInput}
                        placeholder="0.00"
                        value={opt.priceModifier === 0 ? "" : opt.priceModifier}
                        onChange={(e) =>
                          updateOption(group.id, opt.id, {
                            priceModifier: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <button
                      className={styles.removeOptBtn}
                      onClick={() => removeOption(group.id, opt.id)}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                className={styles.addOptionBtn}
                onClick={() => addOption(group.id)}
              >
                + Add Option
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        className={styles.addGroupBtn}
        onClick={() => onChange([...variants, newGroup()])}
      >
        + Add Variant Group
      </button>
    </div>
  );
}