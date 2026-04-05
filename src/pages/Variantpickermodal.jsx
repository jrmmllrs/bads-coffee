/**
 * components/ui/VariantPickerModal.jsx
 * Shows when a menu item has variants — lets cashier pick size/flavor/add-ons
 * before adding to cart.
 */

import { useState, useEffect } from "react";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import styles from "./Variantpickermodal.module.css";

export default function VariantPickerModal({ item, isOpen, onClose, onConfirm }) {
  const [selections, setSelections] = useState({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!item) return;
    const defaults = {};
    (item.variants || []).forEach((group) => {
      if (group.type === "single") {
        defaults[group.id] = group.options[0]?.id ?? null;
      } else {
        defaults[group.id] = [];
      }
    });
    setSelections(defaults);
    setQty(1);
  }, [item]);

  if (!item) return null;

  const groups = item.variants || [];

  const extraCost = groups.reduce((sum, group) => {
    if (group.type === "single") {
      const chosen = group.options.find((o) => o.id === selections[group.id]);
      return sum + (chosen?.priceModifier || 0);
    } else {
      const chosenIds = selections[group.id] || [];
      return sum + group.options
        .filter((o) => chosenIds.includes(o.id))
        .reduce((s, o) => s + (o.priceModifier || 0), 0);
    }
  }, 0);

  const unitPrice  = item.price + extraCost;
  const totalPrice = unitPrice * qty;

  const handleSingle = (groupId, optionId) => {
    setSelections((prev) => ({ ...prev, [groupId]: optionId }));
  };

  const handleMulti = (groupId, optionId) => {
    setSelections((prev) => {
      const current  = prev[groupId] || [];
      const group    = groups.find((g) => g.id === groupId);
      const maxSelect = group?.maxSelect ?? Infinity;
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const isValid = groups.every((group) => {
    if (!group.required) return true;
    if (group.type === "single") return !!selections[group.id];
    return (selections[group.id] || []).length > 0;
  });

  const handleConfirm = () => {
    const variantSummary = groups.map((group) => {
      if (group.type === "single") {
        const opt = group.options.find((o) => o.id === selections[group.id]);
        return opt
          ? { groupName: group.name, selected: [opt.name], priceModifier: opt.priceModifier || 0 }
          : null;
      } else {
        const opts = group.options.filter((o) => (selections[group.id] || []).includes(o.id));
        return opts.length
          ? {
              groupName: group.name,
              selected: opts.map((o) => o.name),
              priceModifier: opts.reduce((s, o) => s + (o.priceModifier || 0), 0),
            }
          : null;
      }
    }).filter(Boolean);

    onConfirm({
      ...item,
      price:         unitPrice,
      basePrice:     item.price,
      variantSummary,
      variantKey:    `${item.id}_${JSON.stringify(selections)}`,
      quantity:      qty,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div className={styles.body}>

        {/* Price header */}
        <div className={styles.itemHeader}>
          <span className={styles.basePrice}>Base ₱{item.price.toFixed(2)}</span>
          {extraCost > 0 && <span className={styles.extraBadge}>+₱{extraCost.toFixed(2)} extras</span>}
        </div>

        {/* Variant groups */}
        {groups.map((group) => (
          <div key={group.id} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupName}>{group.name}</span>
              <div className={styles.groupMeta}>
                {group.required && <span className={styles.requiredBadge}>Required</span>}
                {group.type === "multi" && group.maxSelect && (
                  <span className={styles.maxBadge}>Max {group.maxSelect}</span>
                )}
              </div>
            </div>

            <div className={styles.options}>
              {group.options.map((opt) => {
                const isSelected = group.type === "single"
                  ? selections[group.id] === opt.id
                  : (selections[group.id] || []).includes(opt.id);

                return (
                  <button
                    key={opt.id}
                    className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
                    onClick={() =>
                      group.type === "single"
                        ? handleSingle(group.id, opt.id)
                        : handleMulti(group.id, opt.id)
                    }
                  >
                    <span className={styles.optionCheck}>
                      {group.type === "single"
                        ? (isSelected ? "●" : "○")
                        : (isSelected ? "☑" : "☐")}
                    </span>
                    <span className={styles.optionName}>{opt.name}</span>
                    {opt.priceModifier !== 0 && (
                      <span className={styles.optionPrice}>
                        {opt.priceModifier > 0 ? "+" : ""}₱{opt.priceModifier.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div className={styles.qtyRow}>
          <span className={styles.qtyLabel}>Quantity</span>
          <div className={styles.qtyControl}>
            <button className={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className={styles.qtyVal}>{qty}</span>
            <button className={styles.qtyBtn} onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValue}>₱{totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={!isValid}>
              Add to Order
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}