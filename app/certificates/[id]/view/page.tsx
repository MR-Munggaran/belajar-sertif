"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CanvasEditor from "@/components/certificate/CanvasEditor"; 
import { useCertificateEditor } from "@/store/certificateEditor.store";
import jsPDF from "jspdf"; // IMPORT INI

interface ParticipantData {
  id: string;
  name: string;
  email: string;
  eventId: string;
}

export default function CertificateViewPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
  
  const { setElements, setBackgroundImage } = useCertificateEditor();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/certificates/${id}/detail`); 
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        
        if(data) {
           setParticipant(data.participant);
           if (data.template) {
             setElements(data.template.elements);
             setBackgroundImage(data.template.backgroundImage);
           }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, setElements, setBackgroundImage]);

  // --- FUNGSI DOWNLOAD PNG (GAMBAR) ---
  const handleDownloadPNG = () => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const link = document.createElement('a');
      link.download = `Sertifikat-${participant?.name || 'file'}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  // --- FUNGSI DOWNLOAD PDF (BARU) ---
  const handleDownloadPDF = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // 1. Ambil gambar dari canvas
    const imgData = canvas.toDataURL("image/png");

    // 2. Setup ukuran PDF sesuai ukuran Canvas
    // 'l' = landscape, 'px' = satuan pixel
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "l" : "p",
      unit: "px",
      format: [canvas.width, canvas.height], 
    });

    // 3. Masukkan gambar ke PDF (full size)
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    // 4. Save
    pdf.save(`Sertifikat-${participant?.name || 'file'}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading Certificate...</span>
      </div>
    );
  }

  if (!participant) {
    return <div className="text-center mt-10">Data sertifikat tidak ditemukan.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Selamat, {participant.name}!</h1>
        <p className="text-gray-600 mb-4">Berikut adalah sertifikat kelulusan Anda.</p>
        
        <div className="flex gap-3 justify-center">
          {/* TOMBOL PNG */}
          <button 
            onClick={handleDownloadPNG} 
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded shadow transition-colors"
          >
            Download Gambar (PNG)
          </button>

          {/* TOMBOL PDF */}
          <button 
            onClick={handleDownloadPDF} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded shadow transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>
      
      {/* Container Canvas */}
      <div className="border shadow-2xl rounded-lg overflow-hidden bg-white max-w-4xl w-full">
        <CanvasEditor 
          readonly={true} 
          previewData={{
             name: participant.name,
             email: participant.email,
             certNumber: `NO. ${id.substring(0,8).toUpperCase()}` 
          }} 
        />
      </div>
    </div>
  );
}