/**
 * components/ui/ImageUpload.jsx
 * Reusable image uploader.
 * - Accepts image files, converts to base64
 * - Shows preview with remove button
 * - Falls back gracefully if no image
 *
 * Props:
 *   value      — current base64 string (or null)
 *   onChange   — called with base64 string or null
 *   size       — preview size in px (default 80)
 *   shape      — "square" | "circle" (default "square")
 *   placeholder — emoji/text to show when empty
 */

import { useRef } from "react";
import styles from "../ui/ImageUpload.module.css";

const ImageUpload = ({
  value,
  onChange,
  size       = 80,
  shape      = "square",
  placeholder = "📷",
}) => {
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const borderRadius = shape === "circle"
    ? "50%"
    : "var(--radius-md)";

  return (
    <div className={styles.wrapper}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFile}
      />

      {/* Preview / Upload trigger */}
      <div
        className={`${styles.dropzone} ${value ? styles.hasImage : ""}`}
        style={{ width: size, height: size, borderRadius, flexShrink: 0 }}
        onClick={() => inputRef.current?.click()}
        title={value ? "Click to change image" : "Click to upload image"}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className={styles.preview}
              style={{ borderRadius }}
            />
            {/* Hover overlay */}
            <div className={styles.overlay} style={{ borderRadius }}>
              <span className={styles.overlayIcon}>✎</span>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>{placeholder}</span>
            <span className={styles.emptyLabel}>Upload</span>
          </div>
        )}
      </div>

      {/* Remove button */}
      {value && (
        <button
          className={styles.removeBtn}
          onClick={handleRemove}
          type="button"
          title="Remove image"
          aria-label="Remove image"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ImageUpload;