"use client";

import { useCertificateEditor } from "@/store/certificateEditor.store";

const FONT_OPTIONS = [
  { label: "Arial (Sans)", value: "Arial" },
  { label: "Times New Roman (Serif)", value: "Times New Roman" },
  { label: "Courier New (Mono)", value: "Courier New" },
  { label: "Great Vibes (Signature)", value: "Great Vibes" },
  { label: "Cinzel (Classic)", value: "Cinzel" },
  { label: "Lato (Modern)", value: "Lato" },
];

export default function ElementForm() {
  const elements = useCertificateEditor((state) => state.elements);
  const updateElement = useCertificateEditor((state) => state.updateElement);
  const draggingId = useCertificateEditor((state) => state.draggingId);

  const activeElement = elements.find((el) => el.id === draggingId);

  if (!activeElement) {
    return (
        <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
            <span className="text-2xl mb-2">👆</span>
            <p className="text-sm font-medium">Klik teks di canvas</p>
            <p className="text-xs">untuk mengedit properti</p>
        </div>
    );
  }

  // Type-safe wrapper
  const handleChange = (key: keyof typeof activeElement, value: string | number) => {
    if (draggingId) {
        updateElement(draggingId, { [key]: value });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">
      
      {/* Label Edit */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Edit Properti</span>
        <span className="text-[10px] text-gray-400 font-mono">ID: {activeElement.id.slice(0,6)}</span>
      </div>

      {/* Input Text */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Konten Teks</label>
        <textarea
          rows={2}
          value={activeElement.text}
          onChange={(e) => handleChange("text", e.target.value)}
          className="w-full border border-gray-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
          {/* Font Family */}
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Font</label>
            <select
              value={activeElement.fontFamily}
              onChange={(e) => handleChange("fontFamily", e.target.value)}
              className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Size (px)</label>
            <input
              type="number"
              min={10}
              max={1000}
              value={activeElement.fontSize}
              onChange={(e) => handleChange("fontSize", Number(e.target.value))}
              className="w-full border border-gray-200 p-2 rounded-lg text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Warna</label>
            <div className="flex items-center gap-2 border border-gray-200 p-1.5 rounded-lg bg-white h-[38px]">
                <input
                    type="color"
                    value={activeElement.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="w-6 h-6 cursor-pointer rounded border-none p-0"
                />
                <span className="text-xs text-gray-500 font-mono uppercase truncate">{activeElement.color}</span>
            </div>
          </div>
      </div>

      {/* Style Toggle Buttons */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Style</label>
        <div className="flex gap-2">
            <button
                onClick={() => handleChange("fontWeight", activeElement.fontWeight === "bold" ? "normal" : "bold")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                activeElement.fontWeight === "bold" 
                    ? "bg-slate-800 text-white border-slate-800" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
                Bold
            </button>
            <button
                onClick={() => handleChange("fontStyle", activeElement.fontStyle === "italic" ? "normal" : "italic")}
                className={`flex-1 py-2 rounded-lg text-sm italic border transition-all ${
                activeElement.fontStyle === "italic" 
                    ? "bg-slate-800 text-white border-slate-800" 
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
                Italic
            </button>
        </div>
      </div>
    </div>
  );
}