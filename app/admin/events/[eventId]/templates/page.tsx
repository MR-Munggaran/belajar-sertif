"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CanvasEditor from "@/components/certificate/CanvasEditor"; 
import ElementForm from "@/components/certificate/ElementForm"; 
import { useCertificateEditor, CertificateElement } from "@/store/certificateEditor.store";
import { PaperSize } from "@/utils/paperSizes"; // Pastikan file ini ada (lihat step 1 jawaban sebelumnya)

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export default function TemplatesPage() {
  const params = useParams();
  const [templateId, setTemplateId] = useState<string | null>(null);
  const eventId = params.eventId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  // 1. AMBIL STATE LENGKAP DARI STORE BARU
  const {
    // State Global
    paperSize,
    orientation,
    canvasSize,
    
    // State Multi-page
    pages,
    activePageId,

    // Actions
    setPaperSize,
    setOrientation,
    setActivePage,
    addPage,
    removePage,
    
    // Actions untuk Page Aktif
    setBackgroundImage,
    setElements,
    addElement: addToStore,
    reset
  } = useCertificateEditor();

  // 2. LOAD TEMPLATE (Adaptasi ke struktur data baru)
  useEffect(() => {
    // Reset store saat pertama kali masuk
    reset();

    fetch(`/api/certificate-templates?eventId=${eventId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.length > 0) {
          const template = data[0];
          setTemplateId(template.id);
          
          // Jika data dari backend sudah support multi-page
          if (template.pages && Array.isArray(template.pages)) {
             // Kita butuh action 'setAllPages' di store idealnya, 
             // tapi disini kita simulasi load page 1 dulu manual
             // (Untuk implementasi full, update store agar punya method `loadTemplate(data)`)
             const firstPage = template.pages[0];
             setElements(firstPage.elements);
             setBackgroundImage(firstPage.backgroundImage);
             if (template.paperSize) setPaperSize(template.paperSize);
             if (template.orientation) setOrientation(template.orientation);
          } 
          // Fallback untuk data legacy (single page)
          else {
             setElements(template.elements || []);
             setBackgroundImage(template.backgroundImage || null);
          }
        }
      });
  }, [eventId, reset, setBackgroundImage, setElements, setPaperSize, setOrientation]);

// 3. HANDLE UPLOAD BACKGROUND
const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
      alert("Harap upload file gambar (JPG/PNG).");
      return;
    }

    // A. SIMPAN FILE MENTAH UNTUK DIKIRIM KE SERVER
    setBackgroundFile(file);

    // B. SIMPAN PREVIEW UNTUK DITAMPILKAN DI CANVAS
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setBackgroundImage(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }
};

// 4. SAVE TEMPLATE (FIXED)
const saveTemplate = async () => {
  const isUpdate = Boolean(templateId);

  // A. GUNAKAN FORM DATA
  const formData = new FormData();

  // Masukkan data dasar
  formData.append("eventId", eventId);
  
  if (isUpdate && templateId) {
    formData.append("id", templateId);
  }

  // Masukkan File Gambar (Hanya jika ada file baru yang diupload)
  if (backgroundFile) {
    formData.append("backgroundImage", backgroundFile);
  }
  formData.append("elements", JSON.stringify(pages)); 

  try {
    const res = await fetch("/api/certificate-templates", {
      method: isUpdate ? "PUT" : "POST",
      // PENTING: JANGAN SET 'Content-Type': 'application/json'
      // Browser akan otomatis set 'multipart/form-data; boundary=...'
      body: formData,
    });

    if (res.ok) {
      const result = await res.json();
      alert(isUpdate ? "Template diperbarui!" : "Template dibuat!");
      // Reset file state agar tidak terkirim lagi jika save ulang tanpa ganti bg
      setBackgroundFile(null); 
    } else {
      const err = await res.json();
      alert(`Gagal menyimpan template: ${err.error}`);
    }
  } catch (error) {
    console.error("Save error:", error);
    alert("Terjadi kesalahan koneksi");
  }
};

  // 5. ADD ELEMENT (DYNAMIC CENTER)
  const addElement = (type: "nomor" | "tanggal" | "mentor" | "text" | "name") => {
    const currentWidth = canvasSize.width;
    const currentHeight = canvasSize.height;

    const centerX = currentWidth / 2;
    const centerY = currentHeight / 2;
    // Ukuran font responsif terhadap ukuran kertas
    const autoFontSize = Math.max(12, Math.floor(currentWidth * 0.025)); 
    const stackOffset = Math.random() * 20; // Supaya tidak menumpuk persis

    const baseElement: CertificateElement = {
      id: generateId(type),
      text: "",
      x: centerX,
      y: centerY + stackOffset,
      fontSize: autoFontSize,
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      underline: false,
      color: "#000000",
      type: "static",
    };

    switch (type) {
      case "name":
        baseElement.type = "field"; 
        baseElement.field = "participant.name"; 
        baseElement.text = "{Nama Peserta}"; 
        baseElement.fontSize = Math.floor(autoFontSize * 2); // Nama biasanya besar
        baseElement.fontWeight = "bold";
        baseElement.y = centerY - (autoFontSize * 3);
        break;
      
      case "nomor":
        baseElement.type = "field";
        baseElement.field = "certificate.number";
        baseElement.text = "No. {123/SERTIF/2026}";
        baseElement.fontSize = Math.floor(autoFontSize * 0.8);
        baseElement.y = centerY - (autoFontSize * 5);
        break;
        
      case "tanggal":
        baseElement.type = "field"; // Bisa jadi field otomatis
        baseElement.field = "certificate.date";
        baseElement.text = "Jakarta, 04 Februari 2026";
        break;
        
      case "mentor":
        baseElement.text = "Nama Mentor";
        baseElement.fontWeight = "bold";
        break;
        
      default: 
        baseElement.text = "Teks Baru";
        break;
    }
    addToStore(baseElement);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 h-screen max-h-screen bg-gray-50">
      
      {/* --- KOLOM KIRI & TENGAH: WORKSPACE --- */}
      <div className="lg:col-span-9 flex flex-col h-full relative border-r border-gray-200">
        
        {/* 1. TOP BAR: Paper Settings */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
           <div className="flex items-center gap-6">
              {/* Paper Size */}
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Paper Size</label>
                <select 
                  value={paperSize} 
                  onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                  className="text-sm font-bold text-gray-700 bg-transparent border-none outline-none cursor-pointer hover:text-blue-600 focus:ring-0 p-0"
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div className="w-px h-8 bg-gray-200"></div>

              {/* Orientation */}
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                 <button 
                   onClick={() => setOrientation("portrait")}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${orientation === 'portrait' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Portrait
                 </button>
                 <button 
                   onClick={() => setOrientation("landscape")}
                   className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${orientation === 'landscape' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Landscape
                 </button>
              </div>
           </div>

           <div className="text-xs text-gray-400 font-mono">
             {canvasSize.width} x {canvasSize.height} px
           </div>
        </div>

        {/* 2. CANVAS AREA */}
        <div className="flex-1 bg-gray-100/80 overflow-hidden flex flex-col relative">
           <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
              {/* Komponen Canvas Editor */}
              <CanvasEditor />
           </div>

           {/* 3. BOTTOM BAR: Page Navigation */}
           <div className="h-14 bg-white border-t border-gray-200 flex items-center px-4 gap-2 overflow-x-auto z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              {pages.map((page, index) => (
                <div key={page.id} className="group flex items-center relative">
                  <button
                    onClick={() => setActivePage(page.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-md border flex items-center gap-2 transition whitespace-nowrap
                      ${activePageId === page.id 
                        ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  >
                    Halaman {index + 1}
                  </button>
                  
                  {/* Delete Button (Muncul saat hover & jika bukan satu-satunya page) */}
                  {pages.length > 1 && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); removePage(page.id); }} 
                        className={`absolute -top-2 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-600`}
                        title="Hapus Halaman"
                     >
                       ✕
                     </button>
                  )}
                </div>
              ))}
              
              <button 
                onClick={addPage}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md transition transform hover:scale-105"
                title="Tambah Halaman Baru"
              >
                <span className="text-lg font-bold mb-0.5">+</span>
              </button>
           </div>
        </div>
      </div>

      {/* --- KOLOM KANAN: TOOLS --- */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-full bg-white shadow-xl z-20 overflow-y-auto p-5">
        
        {/* Panel Upload Background (Untuk Active Page) */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
           <h3 className="font-bold mb-3 text-gray-800 text-[10px] uppercase tracking-wider">Background (Halaman Ini)</h3>
           <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef} 
             onChange={handleUploadBackground} 
             className="hidden" 
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition text-xs font-bold shadow-sm flex items-center justify-center gap-2"
           >
             <span>🖼️</span> Ganti Background
           </button>
        </div>

        {/* Panel Tambah Element */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-bold mb-3 text-gray-800 text-[10px] uppercase tracking-wider">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addElement("name")} className="btn-tool-modern">
             🔤 Name
            </button>
            <button onClick={() => addElement("nomor")} className="btn-tool-modern">
              🔢 No. Sertif
            </button>
            <button onClick={() => addElement("tanggal")} className="btn-tool-modern">
              📅 Tanggal
            </button>
            <button onClick={() => addElement("mentor")} className="btn-tool-modern">
              ✍️ Ttd
            </button>
            <button onClick={() => addElement("text")} className="btn-tool-modern col-span-2">
              📝 Teks Bebas
            </button>
          </div>
        </div>

        {/* Panel Edit Properties */}
        <div className="grow flex flex-col">
           <div className="border-t border-gray-100 my-2"></div>
           <ElementForm />
        </div>

        {/* Tombol Simpan */}
        <button
          onClick={saveTemplate}
          className="bg-gray-900 text-white w-full py-3.5 rounded-xl hover:bg-black transition font-bold shadow-lg text-sm mt-auto flex items-center justify-center gap-2"
        >
          <span>💾</span> Simpan Project
        </button>
      </div>

      {/* Style Helper untuk Button Tool */}
      <style jsx>{`
        .btn-tool-modern {
          @apply p-2.5 text-xs font-medium bg-white border border-gray-200 rounded-lg text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600 hover:shadow-md text-left flex items-center gap-2;
        }
      `}</style>
    </div>
  );
}