  "use client";

  import { useCertificateEditor } from "@/store/certificateEditor.store";
  import { useGoogleFonts } from "@/hooks/useGoogleFonts";
  import { loadFont } from "@/utils/loadFont";
  import { useEffect, useMemo, useState } from "react";

  export default function ElementForm() {
    const [fontOpen, setFontOpen] = useState(false);
    const [fontSearch, setFontSearch] = useState("");

    const activePageId = useCertificateEditor((state) => state.activePageId);
    const pages = useCertificateEditor((state) => state.pages);

    
    // const elements = useCertificateEditor((state) => state.elements);
    const updateElement = useCertificateEditor((state) => state.updateElement);
    const draggingId = useCertificateEditor((state) => state.draggingId);
    const removeElement = useCertificateEditor((state) => state.removeElement);

    const activePage = pages.find(p => p.id === activePageId);
    const activeElement = activePage?.elements.find((el) => el.id === draggingId);
  
    const FONT_OPTIONS = useGoogleFonts();


    const filteredFonts = useMemo(() => {
      return FONT_OPTIONS.filter((f) =>
        f.label.toLowerCase().includes(fontSearch.toLowerCase())
      );
    }, [FONT_OPTIONS, fontSearch]);

    useEffect(() => {
      if (activeElement?.fontFamily) {
        loadFont(activeElement.fontFamily);
      }
    }, [activeElement?.fontFamily]);

    if (!activeElement) {
      return (
        <div className="h-40 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
          <span className="text-2xl mb-2">👆</span>
          <p className="text-sm font-medium">Klik teks di canvas</p>
          <p className="text-xs">untuk mengedit properti</p>
        </div>
      );
    }
    

    const handleChange = (
      key: keyof typeof activeElement,
      value: string | number | boolean
    ) => {
      if (draggingId) {
        updateElement(draggingId, { [key]: value });
      }
    };

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-200">

        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Edit Properti
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            ID: {activeElement.id.slice(0, 6)}
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Konten Teks
          </label>
          <textarea
            rows={2}
            value={activeElement.text}
            onChange={(e) => handleChange("text", e.target.value)}
            className="w-full border border-gray-200 p-2.5 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Font Size
          </label>

          <div className="flex items-center gap-2">
            {/* minus */}
            <button
              type="button"
              onClick={() =>
                handleChange("fontSize", Math.max(1, activeElement.fontSize - 1))
              }
              className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
            >
              −
            </button>

            {/* input size */}
            <input
              type="number"
              value={activeElement.fontSize}
              onChange={(e) =>
                handleChange("fontSize", Number(e.target.value))
              }
              className="w-full border border-gray-200 p-2 rounded-lg text-sm text-center"
            />

            {/* plus */}
            <button
              type="button"
              onClick={() =>
                handleChange("fontSize", activeElement.fontSize + 1)
              }
              className="px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        <div className="col-span-2 relative">
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Font
          </label>

          {/* button dropdown */}
          <button
            type="button"
            onClick={() => setFontOpen(!fontOpen)}
            className="w-full border border-gray-200 p-2 rounded-lg text-sm bg-white text-left"
            style={{ fontFamily: activeElement.fontFamily }}
          >
            {activeElement.fontFamily}
          </button>

          {fontOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              
              {/* search inside dropdown */}
              <input
                placeholder="Search font..."
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                className="w-full p-2 border-b text-sm outline-none"
              />

              {filteredFonts.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    handleChange("fontFamily", font.value);
                    setFontOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
            Style
          </label>

          <div className="flex gap-2">
            {/* Bold */}
            <button
              type="button"
              onClick={() =>
                handleChange(
                  "fontWeight",
                  activeElement.fontWeight === "bold" ? "normal" : "bold"
                )
              }
              className={`px-3 py-1 rounded border text-sm font-bold ${
                activeElement.fontWeight === "bold"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() =>
                handleChange(
                  "fontStyle",
                  activeElement.fontStyle === "italic" ? "normal" : "italic"
                )
              }
              className={`px-3 py-1 rounded border italic ${
                activeElement.fontStyle === "italic"
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              I
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() =>
                handleChange("underline", !activeElement.underline)
              }
              className={`px-3 py-1 rounded border underline ${
                activeElement.underline
                  ? "bg-blue-500 text-white"
                  : "bg-white"
              }`}
            >
              U
            </button>
          </div>
        </div>
        <button
          onClick={() => draggingId && removeElement(draggingId)}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-600 text-white"
        >
          🗑 Hapus Element
        </button>
      </div>
    );
  }
