"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CanvasEditor from "@/components/certificate/CanvasEditor";
import ElementForm from "@/components/certificate/ElementForm";
import { useCertificateEditor } from "@/store/certificateEditor.store";
import type { CertificateElement } from "@/db/schema/certificateTemplate";
import { PaperSize } from "@/utils/paperSizes";

// Helper ID Generator
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export default function TemplatesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  // State Lokal
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PENTING: Menyimpan file mentah untuk upload per Page ID
  // Format: { "page_1": File, "page_123": File }
  const [backgroundFiles, setBackgroundFiles] = useState<Record<string, File>>({});

  // Ambil State & Actions dari Store
  const {
    // State
    paperSize,
    orientation,
    canvasSize,
    pages,
    activePageId,

    // Actions
    setPaperSize,
    setOrientation,
    setActivePage,
    addPage,
    removePage,
    setBackgroundImage,
    loadTemplate,
    addElement: addToStore,
    reset,
  } = useCertificateEditor();

  // 1. LOAD TEMPLATE DARI SERVER
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        reset(); // Reset store ke default

        const res = await fetch(`/api/certificate-templates?eventId=${eventId}`);

        if (!res.ok) {
          console.error("API Error:", res.status, res.statusText);
          setIsLoading(false);
          return;
        }

        const text = await res.text();
        const data = text ? JSON.parse(text) : [];

        if (data && data.length > 0) {
          const template = data[0];
          setTemplateId(template.id);

          // Load ke store dengan validasi
          if (template.pages && Array.isArray(template.pages)) {
            loadTemplate(template.pages);
          } else {
            console.warn("Template tidak memiliki pages yang valid");
          }
        }
      } catch (error) {
        console.error("Gagal memuat template:", error);
        alert("Gagal memuat template. Silakan refresh halaman.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [eventId, reset, loadTemplate]);

  // 2. HANDLE UPLOAD BACKGROUND (PER PAGE)
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Harap upload file gambar (JPG/PNG/WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (max 5MB).");
      return;
    }

    // A. Simpan File Mentah ke State Lokal (dikaitkan dengan activePageId)
    setBackgroundFiles((prev) => ({
      ...prev,
      [activePageId]: file,
    }));

    // B. Buat Preview URL untuk ditampilkan di Canvas (Store)
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setBackgroundImage(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 3. SAVE TEMPLATE
  const saveTemplate = async () => {
    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("eventId", eventId);

      // Kirim templateId jika ada (untuk update)
      if (templateId) {
        formData.append("templateId", templateId);
      }

      // 1. Kirim JSON Structure (Pages)
      formData.append("pages", JSON.stringify(pages));

      // 2. Kirim File Backgrounds
      Object.entries(backgroundFiles).forEach(([pageId, file]) => {
        formData.append(`bg_file_${pageId}`, file);
      });

      // 3. POST request (backend handle insert/update based on templateId)
      const res = await fetch("/api/certificate-templates", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan template");
      }

      const result = await res.json();
      setTemplateId(result.id);

      // Bersihkan state file mentah
      setBackgroundFiles({});

      alert("✅ Template berhasil disimpan!");
    } catch (error) {
      console.error("Save error:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan server");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. ADD ELEMENT
  const addElement = (type: "nomor" | "tanggal" | "mentor" | "text" | "name") => {
    const { width, height } = canvasSize;
    const centerX = width / 2;
    const centerY = height / 2;
    const autoFontSize = Math.max(12, Math.floor(width * 0.025));

    // Base Element dengan Struktur Nested
    const newElement: CertificateElement = {
      id: generateId(type),
      type: "static",
      content: "Teks Baru",
      position: {
        x: centerX,
        y: centerY,
      },
      style: {
        fontSize: autoFontSize,
        fontFamily: "Roboto",
        fontWeight: "normal",
        fontStyle: "normal",
        underline: false,
        color: "#000000",
        textAlign: "center",
      },
      rotation: 0,
    };

    // Customisasi berdasarkan Tipe
    switch (type) {
      case "name":
        newElement.type = "field";
        newElement.field = "participant.name";
        newElement.content = "{Nama Peserta}";
        newElement.style.fontSize = Math.floor(autoFontSize * 2);
        newElement.style.fontWeight = "bold";
        newElement.position.y = centerY - autoFontSize * 3;
        break;

      case "nomor":
        newElement.type = "field";
        newElement.field = "certificate.number";
        newElement.content = "No. {123/SERTIF/2026}";
        newElement.style.fontSize = Math.floor(autoFontSize * 0.8);
        newElement.position.y = centerY - autoFontSize * 5;
        break;

      case "tanggal":
        newElement.type = "field";
        newElement.field = "certificate.date";
        newElement.content = "Jakarta, 04 Februari 2026";
        newElement.position.y = centerY + autoFontSize * 4;
        break;

      case "mentor":
        newElement.content = "Nama Mentor";
        newElement.style.fontWeight = "bold";
        newElement.position.y = centerY + autoFontSize * 6;
        break;
    }

    addToStore(newElement);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-screen max-h-screen bg-gray-50 overflow-hidden">
      {/* --- WORKSPACE (KIRI) --- */}
      <div className="lg:col-span-9 flex flex-col h-full relative border-r border-gray-200">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm z-20">
          <div className="flex items-center gap-4">
            {/* Paper Size Selector */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                Size
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="text-sm font-bold text-gray-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0 p-0"
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>

            <div className="w-px h-6 bg-gray-200"></div>

            {/* Orientation Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setOrientation("portrait")}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  orientation === "portrait"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Portrait
              </button>
              <button
                onClick={() => setOrientation("landscape")}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  orientation === "landscape"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Landscape
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            {canvasSize.width} x {canvasSize.height} px
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-200/50 overflow-auto flex items-center justify-center p-8 relative">
          <CanvasEditor />
        </div>

        {/* Bottom Bar: Page Navigation */}
        <div className="h-16 bg-white border-t border-gray-200 flex items-center px-4 gap-3 overflow-x-auto z-20">
          {pages.map((page, index) => (
            <div key={page.id} className="relative group">
              <button
                onClick={() => setActivePage(page.id)}
                className={`
                  px-4 py-2 text-xs font-bold rounded-lg border flex flex-col items-center justify-center min-w-[80px] transition-all
                  ${
                    activePageId === page.id
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-200"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }
                `}
              >
                <span>Halaman {index + 1}</span>
              </button>

              {/* Delete Page Button */}
              {pages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Hapus halaman ${index + 1}?`)) {
                      removePage(page.id);
                    }
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-sm z-30"
                  title="Hapus Halaman"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addPage}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition hover:scale-110"
            title="Tambah Halaman Baru"
          >
            +
          </button>
        </div>
      </div>

      {/* --- TOOLS SIDEBAR (KANAN) --- */}
      <div className="lg:col-span-3 flex flex-col bg-white shadow-xl z-30 border-l border-gray-200 h-full">
        <div className="p-5 flex flex-col gap-5 h-full overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-gray-800">Editor Sertifikat</h2>
            <p className="text-xs text-gray-500">
              Sesuaikan template sertifikat event.
            </p>
          </div>

          {/* 1. Background Tool */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[11px] text-gray-500 uppercase tracking-wider">
                Background
              </h3>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                Halaman Aktif
              </span>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleUploadBackground}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:text-blue-600 transition text-xs font-bold shadow-sm flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-110 transition">🖼️</span>
              {backgroundFiles[activePageId] ? "Ganti File" : "Upload Gambar"}
            </button>
            {backgroundFiles[activePageId] && (
              <div className="mt-2 text-[10px] text-green-600 flex items-center gap-1">
                ✓ File siap diupload:{" "}
                <span className="truncate max-w-[150px] font-medium">
                  {backgroundFiles[activePageId].name}
                </span>
              </div>
            )}
          </div>

          {/* 2. Elements Tool */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold mb-3 text-[11px] text-gray-500 uppercase tracking-wider">
              Tambah Elemen
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => addElement("name")} className="btn-tool">
                🔤 Nama Peserta
              </button>
              <button onClick={() => addElement("nomor")} className="btn-tool">
                🔢 No. Sertif
              </button>
              <button onClick={() => addElement("tanggal")} className="btn-tool">
                📅 Tanggal
              </button>
              <button onClick={() => addElement("mentor")} className="btn-tool">
                ✍️ Penanda Tangan
              </button>
              <button
                onClick={() => addElement("text")}
                className="btn-tool col-span-2 text-center justify-center"
              >
                📝 Teks Statis
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* 3. Properties Form */}
          <div className="flex-grow">
            <ElementForm />
          </div>

          {/* Save Button */}
          <div className="pt-4 mt-auto">
            <button
              onClick={saveTemplate}
              disabled={isSaving}
              className="bg-gray-900 text-white w-full py-3.5 rounded-xl hover:bg-black transition font-bold shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95 transform duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin">⏳</span> Menyimpan...
                </>
              ) : (
                <>
                  <span>💾</span> Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-tool {
          @apply p-2.5 text-[11px] font-semibold bg-white border border-gray-200 rounded-lg text-gray-600 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 hover:shadow-md text-left flex items-center gap-1.5;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}