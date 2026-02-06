"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef } from "react"; // <--- Tambah useRef
import Preview from "../../../../../components/certificate/Preview"; 
import ElementForm from "../../../../../components/certificate/ElementForm"; 
import { useCertificateEditor, CertificateElement } from "@/store/certificateEditor.store";

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export default function TemplatesPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    elements,
    backgroundImage,
    setBackgroundImage,
    setElements,
    addElement: addToStore,
    canvasSize,
  } = useCertificateEditor();

  // 1. Load Data Template
  useEffect(() => {
    fetch(`/api/certificate-templates?eventId=${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setElements(data[0].elements || []);
          setBackgroundImage(data[0].backgroundImage || null);
        }
      })
      .catch((err) => console.error("Gagal load template:", err));
  }, [eventId, setBackgroundImage, setElements]);

  // --- LOGIC UPLOAD BACKGROUND BARU ---
  const handleUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi tipe file
      if (!file.type.startsWith("image/")) {
        alert("Harap upload file gambar (JPG/PNG).");
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          // Set hasil bacaan (Base64) ke store sebagai background
          setBackgroundImage(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const saveTemplate = async () => {
    try {
      const res = await fetch("/api/certificate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, backgroundImage, elements }),
      });
      if (res.ok) alert("Template berhasil disimpan!");
      else alert("Gagal menyimpan template");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan");
    }
  };

  const addElement = (type: "nomor" | "tanggal" | "mentor" | "text" | "name") => {
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const autoFontSize = Math.max(20, Math.floor(canvasSize.width * 0.03)); 
    const stackOffset = elements.length * 20;

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
    };

    switch (type) {
      case "name":
        baseElement.text = "Input Your Name";
        baseElement.fontSize = Math.floor(autoFontSize * 0.8);
        baseElement.y = centerY - (autoFontSize * 3);
        break;
      case "nomor":
        baseElement.text = "No. 123/SERTIF/2026";
        baseElement.fontSize = Math.floor(autoFontSize * 0.8);
        baseElement.y = centerY - (autoFontSize * 3);
        break;
      case "tanggal":
        baseElement.text = "Jakarta, 04 Februari 2026";
        baseElement.fontSize = Math.floor(autoFontSize * 0.7);
        baseElement.y = canvasSize.height * 0.8; 
        break;
      case "mentor":
        baseElement.text = "Nama Mentor";
        baseElement.fontWeight = "bold";
        baseElement.y = canvasSize.height * 0.75;
        break;
      default: 
        baseElement.text = "Teks Baru";
        break;
    }
    addToStore(baseElement);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-screen max-h-screen">
      {/* Kolom Kiri: Canvas Preview */}
      <div className="lg:col-span-9 bg-gray-200 rounded-xl flex items-center justify-center p-4 border shadow-inner overflow-hidden relative">
         <Preview />
      </div>

      {/* Kolom Kanan: Tools */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto pr-1">
        
        {/* --- PANEL UPLOAD BACKGROUND --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
           <h3 className="font-bold mb-3 text-gray-800 text-xs uppercase tracking-wide">Background</h3>
           
           {/* Hidden Input File */}
           <input 
             type="file" 
             accept="image/*" 
             ref={fileInputRef} 
             onChange={handleUploadBackground} 
             className="hidden" 
           />

           <button 
             onClick={triggerFileInput}
             className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-semibold"
           >
             📁 Upload Gambar Template
           </button>
           <p className="text-[10px] text-gray-400 mt-2 text-center">Format: JPG/PNG. Otomatis menyesuaikan ukuran.</p>
        </div>

        {/* Panel Tambah Element */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold mb-3 text-gray-800 text-xs uppercase tracking-wide">Add Components</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => addElement("name")} className="p-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border rounded transition text-left">
             🔤 Name
            </button>
            <button onClick={() => addElement("nomor")} className="p-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border rounded transition text-left">
              🔢 No. Sertifikat
            </button>
            <button onClick={() => addElement("tanggal")} className="p-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border rounded transition text-left">
              📅 Tanggal
            </button>
            <button onClick={() => addElement("mentor")} className="p-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border rounded transition text-left">
              ✍️ Tanda Tangan
            </button>
            <button onClick={() => addElement("text")} className="p-2 text-xs bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border rounded transition text-left">
              🔤 Teks Bebas
            </button>
          </div>
        </div>

        {/* Panel Edit */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grow">
           <ElementForm />
        </div>

        <button
          onClick={saveTemplate}
          className="bg-black text-white w-full py-3 rounded-xl hover:bg-gray-800 transition font-bold shadow-lg text-sm"
        >
          Simpan Template
        </button>
      </div>
    </div>
  );
}