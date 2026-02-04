"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import Preview from "../../../../../components/certificate/Preview"; 
import ElementForm from "../../../../../components/certificate/ElementForm"; 
import { useCertificateEditor, CertificateElement } from "@/store/certificateEditor.store";

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

export default function TemplatesPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const {
    setElements,
    elements,
    backgroundImage,
    setBackgroundImage,
    addElement: addToStore,
  } = useCertificateEditor();

  // Load template
  useEffect(() => {
    fetch(`/api/certificate-templates?eventId=${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setElements(data[0].elements);
          setBackgroundImage(data[0].backgroundImage);
        } else {
          // Default setup jika kosong
          if (elements.length === 0) {
            setElements([
              {
                id: "participant_name",
                text: "Nama Peserta",
                x: 1000, // Asumsi lebar gambar ~2000px, taruh di tengah
                y: 600,
                fontSize: 90, // <--- DIPERBESAR (Standar Cetak)
                fontFamily: "Arial",
                fontWeight: "bold", 
                fontStyle: "normal", 
                color: "#000000",
              },
            ]);
          }
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, setBackgroundImage, setElements]);

  const saveTemplate = async () => {
    // ... (kode save sama seperti sebelumnya)
    try {
      const res = await fetch("/api/certificate-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, backgroundImage, elements }),
      });
      if (res.ok) alert("Template berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan template");
    }
  };

  // --- LOGIC MENAMBAH ELEMENT BARU ---
  const addElement = (type: "nomor" | "tanggal" | "mentor" | "text") => {
    
    // Default Y position (agak ke bawah dikit tiap nambah)
    // Kita asumsikan resolusi gambar tinggi, jadi loncatannya 100px
    const startY = 800; 
    const gap = 100;
    
    const baseElement: CertificateElement = {
      id: "",
      text: "",
      x: 1000, // Tengah canvas (asumsi lebar 2000px)
      y: startY + (elements.length * gap),
      fontSize: 60, // <--- UKURAN DEFAULT DIPERBESAR
      fontFamily: "Arial",
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#000000",
    };

    switch (type) {
      case "nomor":
        baseElement.id = "certificate_number";
        baseElement.text = "No. 123/SERTIF/2026";
        baseElement.fontSize = 50; // Nomor biasanya lebih kecil dikit dari Nama
        break;
      case "tanggal":
        baseElement.id = "issue_date";
        baseElement.text = "01 Januari 2026";
        baseElement.fontSize = 45; 
        break;
      case "mentor":
        baseElement.id = generateId("mentor");
        baseElement.text = "Nama Mentor";
        baseElement.fontSize = 60;
        break;
      default: // Text bebas
        baseElement.id = generateId("text");
        baseElement.text = "Teks Tambahan";
        baseElement.fontSize = 50;
        break;
    }

    addToStore(baseElement);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Kolom Kiri: Canvas Preview */}
      <div className="lg:col-span-2 border rounded-lg p-4 bg-gray-50 flex justify-center items-start min-h-[500px] overflow-auto">
         {/* Tambahkan overflow-auto agar jika gambar kegedean bisa discroll, atau biarkan fit container */}
        <Preview />
      </div>

      {/* Kolom Kanan: Tools */}
      <div className="flex flex-col gap-6">
        
        {/* Tombol Tambah Element */}
        <div className="bg-white p-4 rounded shadow border">
          <h3 className="font-bold mb-3 text-gray-700 text-sm uppercase">Tambah Elemen</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addElement("nomor")}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-bold border border-blue-200 transition"
            >
              + No. Sertifikat
            </button>
            <button
              onClick={() => addElement("tanggal")}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-bold border border-blue-200 transition"
            >
              + Tanggal
            </button>
            <button
              onClick={() => addElement("mentor")}
              className="px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 text-xs font-bold border border-green-200 transition"
            >
              + Mentor / TTD
            </button>
            <button
              onClick={() => addElement("text")}
              className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs font-bold border border-gray-200 transition"
            >
              + Teks Bebas
            </button>
          </div>
        </div>

        {/* Editor Properti */}
        <div className="bg-white p-4 rounded shadow border flex-grow">
           <h3 className="font-bold mb-3 text-gray-700 text-sm uppercase">Edit Properti</h3>
           <ElementForm />
        </div>

        <button
          onClick={saveTemplate}
          className="mt-auto bg-black text-white w-full py-3 rounded-lg hover:bg-gray-800 transition font-bold shadow-lg"
        >
          Simpan Template
        </button>
      </div>
    </div>
  );
}