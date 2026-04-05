/**
 * pages/MenuPage.jsx
 * Full CRUD for menu items — with image upload, emoji, and variant builder.
 */

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import { EmptyState, ConfirmDialog } from "../components/ui/index.jsx";
import ImageUpload from "../components/ui/Imageupload.jsx";
import VariantBuilder from "./Variantbuilder.jsx";
import { CatVisual } from "./CategoriesPage";
import styles from "./MenuPage.module.css";

const EMPTY_FORM = {
  name:      "",
  category:  "Coffee",
  price:     "",
  available: true,
  image:     null,
  variants:  [],   // array of variant groups
};

export default function MenuPage() {
  const {
    menuItems, categories,
    addMenuItem, updateMenuItem, deleteMenuItem, toggleItemAvailability,
  } = useApp();

  const [editItem,     setEditItem]     = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [showModal,    setShowModal]    = useState(false);
  const [filterCat,    setFilterCat]    = useState("All");
  const [search,       setSearch]       = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const allCats  = ["All", ...categories.map((c) => c.name)];
  const filtered = menuItems.filter((i) => {
    const matchCat    = filterCat === "All" || i.category === filterCat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAdd  = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, image: item.image || null, variants: item.variants || [] });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.price) return;
    const item = { ...form, price: parseFloat(form.price) };
    if (editItem) await updateMenuItem(item);
    else          await addMenuItem(item);
    setShowModal(false);
  };

  return (
    <div className="page-wrapper">

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Menu Management</h2>
          <p className={styles.subtitle}>{menuItems.length} total items</p>
        </div>
        <Button variant="primary" onClick={openAdd}>+ Add Item</Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <Input
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.catFilters}>
          {allCats.map((c) => (
            <button
              key={c}
              className={`${styles.catBtn} ${filterCat === c ? styles.catActive : ""}`}
              onClick={() => setFilterCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.length === 0
          ? <EmptyState icon="🔍" title="No items found" message="Try adjusting your filters" />
          : filtered.map((item) => {
              const cat = categories.find((c) => c.name === item.category);
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  cat={cat}
                  onEdit={() => openEdit(item)}
                  onToggle={() => toggleItemAvailability(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              );
            })
        }
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editItem ? "Edit Menu Item" : "Add New Item"}
      >
        <div className={styles.formBody}>

          {/* Image upload */}
          <div className={styles.imageSection}>
            <div className={styles.imageUploadWrap}>
              <ImageUpload
                value={form.image}
                onChange={(img) => setForm({ ...form, image: img })}
                size={80}
                shape="square"
                placeholder="🍽"
              />
              <div className={styles.imageUploadInfo}>
                <span className={styles.imageUploadTitle}>Item Photo</span>
                <span className={styles.imageUploadHint}>
                  Optional · replaces category emoji<br />
                  JPG, PNG, WebP · max 2 MB
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Item Name"
            placeholder="e.g. Vanilla Latte"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Base Price (₱)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </Select>

          {/* Variant Builder */}
          <VariantBuilder
            variants={form.variants}
            onChange={(variants) => setForm({ ...form, variants })}
          />

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
            />
            <span>Available on POS</span>
          </label>

          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMenuItem(deleteTarget.id, deleteTarget.name)}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This item will be permanently removed from your menu."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

/* ── Item card ── */
function ItemCard({ item, cat, onEdit, onToggle, onDelete }) {
  const hasVariants = item.variants && item.variants.length > 0;
  return (
    <div className={`${styles.card} ${!item.available ? styles.cardInactive : ""}`}>
      <div className={styles.cardTop}>
        <ItemVisual item={item} cat={cat} size={44} />
        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{item.name}</span>
          <span className={styles.cardCategory}>{item.category}</span>
          {hasVariants && (
            <span className={styles.variantBadge}>
              {item.variants.length} variant group{item.variants.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className={styles.cardPrice}>₱{item.price.toFixed(2)}</span>
      </div>
      <div className={styles.cardActions}>
        <Button variant="ghost"   size="sm" onClick={onEdit}>Edit</Button>
        <Button variant={item.available ? "success" : "secondary"} size="sm" onClick={onToggle}>
          {item.available ? "Active" : "Hidden"}
        </Button>
        <Button variant="danger"  size="sm" onClick={onDelete}>✕</Button>
      </div>
    </div>
  );
}

/** Shows item's own image if present, otherwise falls through to category visual */
export function ItemVisual({ item, cat, size = 40 }) {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.name}
        style={{
          width:      size,
          height:     size,
          borderRadius: "var(--radius-sm)",
          objectFit:  "cover",
          flexShrink: 0,
          display:    "block",
        }}
      />
    );
  }
  if (cat) return <CatVisual cat={cat} size={size} />;
  return <span style={{ fontSize: size * 0.6 }}>🍽</span>;
}