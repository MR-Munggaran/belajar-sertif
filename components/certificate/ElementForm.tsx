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
    return <div className="p-4 text-gray-500 text-sm bg-gray-50 rounded text-center border border-dashed">Klik elemen pada canvas untuk mengedit.</div>;
  }

  // PERBAIKAN DI SINI:
  // Mengganti 'any' dengan 'string | number' agar sesuai dengan properti elemen
  const handleChange = (key: string, value: string | number) => {
    if (draggingId) {
        // Kita menggunakan casting 'as any' pada object key sementara 
        // atau membiarkannya karena value sudah didefinisikan aman.
        // Opsi paling aman dan sederhana untuk linter:
        updateElement(draggingId, { [key]: value });
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Text */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Teks</label>
        <input
          type="text"
          value={activeElement.text}
          onChange={(e) => handleChange("text", e.target.value)}
          className="w-full border p-2 rounded mt-1 text-sm"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Font Family</label>
        <select
          value={activeElement.fontFamily}
          onChange={(e) => handleChange("fontFamily", e.target.value)}
          className="w-full border p-2 rounded mt-1 text-sm"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Styling */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Size</label>
          <input
            type="number"
            value={activeElement.fontSize}
            onChange={(e) => handleChange("fontSize", Number(e.target.value))}
            className="w-full border p-2 rounded mt-1 text-sm"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => handleChange("fontWeight", activeElement.fontWeight === "bold" ? "normal" : "bold")}
            className={`w-10 h-10 border rounded font-bold transition-colors ${
              activeElement.fontWeight === "bold" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
            }`}
            title="Bold"
          >
            B
          </button>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => handleChange("fontStyle", activeElement.fontStyle === "italic" ? "normal" : "italic")}
            className={`w-10 h-10 border rounded italic transition-colors ${
              activeElement.fontStyle === "italic" ? "bg-black text-white" : "bg-white text-black hover:bg-gray-100"
            }`}
            title="Italic"
          >
            I
          </button>
        </div>
      </div>
      
      {/* Color */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Warna</label>
        <div className="flex gap-2 mt-1 items-center">
            <input
            type="color"
            value={activeElement.color}
            onChange={(e) => handleChange("color", e.target.value)}
            className="w-10 h-10 cursor-pointer border rounded p-0 overflow-hidden"
            />
            <span className="text-xs text-gray-500">{activeElement.color}</span>
        </div>
      </div>
    </div>
  );
}