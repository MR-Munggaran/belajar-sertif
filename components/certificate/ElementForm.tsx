"use client";

import { useCertificateEditor, useActiveElement } from "@/store/certificateEditor.store";
import { useGoogleFonts } from "@/hooks/useGoogleFonts";
import { loadFont } from "@/utils/loadFont";
import { useEffect, useMemo, useState } from "react";
import type { ElementStyle } from "@/db/schema/certificateTemplate";

export default function ElementForm() {
  const [fontSearch, setFontSearch] = useState("");

  // Get active element dan actions dari store
  const activeElement = useActiveElement();
  const draggingId = useCertificateEditor((s) => s.draggingId);
  const updateElementStyle = useCertificateEditor((s) => s.updateElementStyle);
  const updateElementContent = useCertificateEditor((s) => s.updateElementContent);
  const updateElementRotation = useCertificateEditor((s) => s.updateElementRotation);
  const removeElement = useCertificateEditor((s) => s.removeElement);

  const FONT_OPTIONS = useGoogleFonts();

  // Filter fonts berdasarkan search
  const filteredFonts = useMemo(() => {
    if (!fontSearch) return FONT_OPTIONS;
    return FONT_OPTIONS.filter((f) =>
      f.label.toLowerCase().includes(fontSearch.toLowerCase())
    );
  }, [FONT_OPTIONS, fontSearch]);

  // Load font saat element berubah
  useEffect(() => {
    if (activeElement?.style.fontFamily) {
      loadFont(activeElement.style.fontFamily);
    }
  }, [activeElement?.style.fontFamily]);

  // Jika tidak ada element yang dipilih
  if (!activeElement || !draggingId) {
    return (
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
        <div className="text-gray-400 text-sm mb-2">📝</div>
        <p className="text-xs text-gray-500">
          Pilih element di canvas untuk mengedit properties
        </p>
      </div>
    );
  }

  // Handler untuk update style
  const handleStyleChange = <K extends keyof ElementStyle>(
    key: K,
    value: ElementStyle[K]
  ) => {
    updateElementStyle(draggingId, { [key]: value });
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <h3 className="font-bold text-[11px] text-gray-500 uppercase tracking-wider mb-1">
          Properties
        </h3>
        <p className="text-[10px] text-gray-400">
          {activeElement.type === "field" ? "🔤 Dynamic Field" : "📝 Static Text"}
        </p>
      </div>

      {/* Content Editor */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">
          Konten Teks
        </label>
        <textarea
          value={activeElement.content}
          onChange={(e) => updateElementContent(draggingId, e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="Masukkan teks..."
        />
        {activeElement.type === "field" && (
          <p className="text-[10px] text-blue-600 mt-1">
            💡 Field: {activeElement.field}
          </p>
        )}
      </div>

      {/* Font Family */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">
          Font Family
        </label>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Cari font..."
          value={fontSearch}
          onChange={(e) => setFontSearch(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-lg text-xs mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Font Selector */}
        <select
          value={activeElement.style.fontFamily}
          onChange={(e) => {
            const newFont = e.target.value;
            loadFont(newFont);
            handleStyleChange("fontFamily", newFont);
          }}
          className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ fontFamily: activeElement.style.fontFamily }}
        >
          {filteredFonts.map((font) => (
            <option 
              key={font.value} 
              value={font.value}
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">
          Ukuran Font: {activeElement.style.fontSize}px
        </label>
        <input
          type="range"
          min="8"
          max="120"
          value={activeElement.style.fontSize}
          onChange={(e) => handleStyleChange("fontSize", Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Font Weight & Style */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            handleStyleChange(
              "fontWeight",
              activeElement.style.fontWeight === "bold" ? "normal" : "bold"
            )
          }
          className={`p-2 rounded-lg border font-bold text-xs transition ${
            activeElement.style.fontWeight === "bold"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          B Bold
        </button>

        <button
          onClick={() =>
            handleStyleChange(
              "fontStyle",
              activeElement.style.fontStyle === "italic" ? "normal" : "italic"
            )
          }
          className={`p-2 rounded-lg border italic text-xs transition ${
            activeElement.style.fontStyle === "italic"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
          }`}
        >
          I Italic
        </button>
      </div>

      {/* Underline */}
      <button
        onClick={() =>
          handleStyleChange("underline", !activeElement.style.underline)
        }
        className={`w-full p-2 rounded-lg border underline text-xs font-bold transition ${
          activeElement.style.underline
            ? "bg-blue-500 text-white border-blue-500"
            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
        }`}
      >
        U Underline
      </button>

      {/* Text Align */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">
          Text Align
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => handleStyleChange("textAlign", align)}
              className={`p-2 rounded-lg border text-xs font-bold transition ${
                activeElement.style.textAlign === align
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {align === "left" && "⬅️"}
              {align === "center" && "↔️"}
              {align === "right" && "➡️"}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">
          Warna Teks
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={activeElement.style.color}
            onChange={(e) => handleStyleChange("color", e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={activeElement.style.color}
            onChange={(e) => handleStyleChange("color", e.target.value)}
            className="flex-1 border border-gray-300 p-2 rounded-lg text-xs font-mono"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Rotation */}
      {activeElement.rotation !== undefined && (
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">
            Rotasi: {activeElement.rotation}°
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={activeElement.rotation}
            onChange={(e) => updateElementRotation(draggingId, Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Delete Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => removeElement(draggingId)}
          className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2"
        >
          <span>🗑️</span> Hapus Element
        </button>
      </div>

    </div>
  );
}