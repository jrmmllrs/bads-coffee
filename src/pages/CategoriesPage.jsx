/**
 * pages/CategoriesPage.jsx
 * Manage menu categories with icon picker, color picker, OR custom image upload.
 */

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { ConfirmDialog } from "../components/ui/index.jsx";
import ImageUpload from "../components/ui/Imageupload.jsx";
import styles from "./CategoriesPage.module.css";

const ICON_OPTIONS = [
  "☕",
  "🍵",
  "🥤",
  "🥐",
  "🍰",
  "🧁",
  "🥞",
  "🍩",
  "🍪",
  "🧇",
  "🥗",
  "🥪",
  "🌮",
  "🍜",
  "🍱",
  "🧃",
  "🍶",
  "🍹",
  "🥛",
  "🫖",
  "🍺",
  "🧋",
  "🫐",
  "🍓",
];
const COLOR_OPTIONS = [
  "#c8a97e",
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
  "#34d399",
  "#f87171",
  "#fbbf24",
  "#22d3ee",
  "#e879f9",
  "#a3e635",
];
const EMPTY_FORM = { name: "", icon: "☕", color: "#c8a97e", image: null };

// ── Shared visual renderer (emoji OR uploaded image) ──────────────────────────
export function CatVisual({ cat, size = 46, radius = "var(--radius-md)" }) {
  if (cat.image) {
    return (
      <img
        src={cat.image}
        alt={cat.name}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: (cat.color || "#c8a97e") + "22",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.48,
        flexShrink: 0,
      }}
    >
      {cat.icon || "☕"}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { categories, menuItems, addCategory, updateCategory, deleteCategory } =
    useApp();

  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [iconMode, setIconMode] = useState("emoji"); // "emoji" | "image"

  const openAdd = () => {
    setEditCat(null);
    setForm(EMPTY_FORM);
    setIconMode("emoji");
    setShowModal(true);
  };
  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ ...cat, image: cat.image || null });
    setIconMode(cat.image ? "image" : "emoji");
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const payload =
      iconMode === "image"
        ? { ...form, icon: form.icon || "☕" } // keep fallback emoji
        : { ...form, image: null }; // clear image when using emoji
    if (editCat) await updateCategory(payload);
    else await addCategory(payload);
    setShowModal(false);
  };

  const tryDelete = (cat) => {
    if (menuItems.some((i) => i.category === cat.name)) {
      alert(
        `Cannot delete "${cat.name}" — it's used by menu items. Reassign them first.`,
      );
      return;
    }
    setDeleteTarget(cat);
  };

  return (
    <div className="page-wrapper">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Categories</h2>
          <p className={styles.subtitle}>
            Organise your menu items into groups
          </p>
        </div>
        <Button variant="primary" onClick={openAdd}>
          + New Category
        </Button>
      </div>

      <div className={styles.grid}>
        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.category === cat.name).length;
          return (
            <CategoryCard
              key={cat.id}
              cat={cat}
              itemCount={count}
              onEdit={() => openEdit(cat)}
              onDelete={() => tryDelete(cat)}
            />
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editCat ? "Edit Category" : "New Category"}
        width={460}
      >
        <div className={styles.formBody}>
          <Input
            label="Name"
            placeholder="Category name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Mode toggle */}
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={`${styles.modeTab} ${iconMode === "emoji" ? styles.modeTabActive : ""}`}
              onClick={() => setIconMode("emoji")}
            >
              😊 Emoji
            </button>
            <button
              type="button"
              className={`${styles.modeTab} ${iconMode === "image" ? styles.modeTabActive : ""}`}
              onClick={() => setIconMode("image")}
            >
              🖼 Upload Image
            </button>
          </div>

          {/* Emoji mode */}
          {iconMode === "emoji" && (
            <>
              <div className={styles.pickerSection}>
                <span className={styles.pickerLabel}>Icon</span>
                <div className={styles.iconGrid}>
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`${styles.iconBtn} ${form.icon === ic ? styles.iconBtnActive : ""}`}
                      onClick={() => setForm({ ...form, icon: ic })}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.pickerSection}>
                <span className={styles.pickerLabel}>Color</span>
                <div className={styles.colorRow}>
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      className={`${styles.colorDot} ${form.color === col ? styles.colorDotActive : ""}`}
                      style={{ background: col }}
                      onClick={() => setForm({ ...form, color: col })}
                      aria-label={`Color ${col}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Image mode */}
          {iconMode === "image" && (
            <div className={styles.pickerSection}>
              <span className={styles.pickerLabel}>Category Image</span>
              <div className={styles.imageRow}>
                <ImageUpload
                  value={form.image}
                  onChange={(img) => setForm({ ...form, image: img })}
                  size={90}
                  shape="square"
                  placeholder="🖼"
                />
                <p className={styles.imageHint}>
                  Click the box to upload.
                  <br />
                  JPG, PNG, WebP · max 2 MB.
                  <br />
                  Replaces the emoji icon.
                </p>
              </div>
            </div>
          )}

          {/* Live preview */}
          <div className={styles.preview}>
            <CatVisual
              cat={{ ...form, image: iconMode === "image" ? form.image : null }}
              size={48}
            />
            <div>
              <div className={styles.previewName}>{form.name || "Preview"}</div>
              <div
                className={styles.previewBar}
                style={{ background: form.color }}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              {editCat ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteCategory(deleteTarget.id, deleteTarget.name)}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This category will be permanently deleted."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CategoryCard({ cat, itemCount, onEdit, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLeft}>
        <CatVisual cat={cat} size={46} />
        <div>
          <div className={styles.catName}>{cat.name}</div>
          <div className={styles.catCount}>
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      <div className={styles.catBar} style={{ background: cat.color }} />
      <div className={styles.cardActions}>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
