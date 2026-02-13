"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CanvasEditor from "@/components/certificate/CanvasEditor";
import { useCertificateEditor } from "@/store/certificateEditor.store";
import type { CertificatePage } from "@/db/schema/certificateTemplate";
import jsPDF from "jspdf";

interface ParticipantData {
  id: string;
  name: string;
  email: string;
  eventId: string;
}

interface CertificateData {
  certificate: {
    id: string;
    participantId: string;
    templateId: string;
  };
  participant: ParticipantData;
  template: {
    id: string;
    pages: CertificatePage[];
    eventId: string;
  };
}

export default function CertificateViewPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CertificateData | null>(null);

  const { loadTemplate } = useCertificateEditor();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/certificates/${id}/detail`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Gagal mengambil data");
        }

        const fetchedData: CertificateData = await res.json();

        if (fetchedData.template && fetchedData.template.pages) {
          // Load template ke store
          loadTemplate(fetchedData.template.pages);
        }

        setData(fetchedData);
      } catch (err) {
        console.error("Load error:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id, loadTemplate]);

  // --- FUNGSI DOWNLOAD PNG (GAMBAR) ---
  const handleDownloadPNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("Canvas tidak ditemukan");
      return;
    }

    try {
      const link = document.createElement("a");
      link.download = `Sertifikat-${data?.participant.name || "file"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download PNG error:", error);
      alert("Gagal download PNG");
    }
  };

  // --- FUNGSI DOWNLOAD PDF ---
  const handleDownloadPDF = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("Canvas tidak ditemukan");
      return;
    }

    try {
      // 1. Ambil gambar dari canvas dengan kualitas maksimal
      const imgData = canvas.toDataURL("image/png", 1.0);

      // 2. Setup ukuran PDF sesuai ukuran Canvas
      const orientation = canvas.width > canvas.height ? "l" : "p";

      // Konversi pixel ke mm (96 DPI standard)
      const widthMm = (canvas.width * 25.4) / 96;
      const heightMm = (canvas.height * 25.4) / 96;

      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: [widthMm, heightMm],
        compress: true,
      });

      // 3. Masukkan gambar ke PDF (full size)
      pdf.addImage(imgData, "PNG", 0, 0, widthMm, heightMm, undefined, "FAST");

      // 4. Save
      pdf.save(`Sertifikat-${data?.participant.name || "file"}.pdf`);
    } catch (error) {
      console.error("Download PDF error:", error);
      alert("Gagal download PDF");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat sertifikat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Data not found state
  if (!data || !data.participant) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
          <div className="text-gray-400 text-5xl mb-4">📄</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sertifikat Tidak Ditemukan
          </h2>
          <p className="text-gray-600">
            Data sertifikat tidak tersedia atau sudah dihapus.
          </p>
        </div>
      </div>
    );
  }

  const participant = data.participant;
  const certificateNumber = `NO. ${id.substring(0, 8).toUpperCase()}`;
  const certificateDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4">
      {/* Header Card */}
      <div className="mb-6 text-center max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Selamat, {participant.name}!
          </h1>
          <p className="text-gray-600 mb-1">
            Berikut adalah sertifikat kelulusan Anda.
          </p>
          <p className="text-sm text-gray-500">
            {certificateNumber} • {certificateDate}
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDownloadPNG}
            className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span>🖼️</span>
            Download PNG
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span>📄</span>
            Download PDF
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="border-4 border-white shadow-2xl rounded-xl overflow-hidden bg-white max-w-5xl w-full">
        <CanvasEditor
          readonly={true}
          previewData={{
            name: participant.name,
            email: participant.email,
            certNumber: certificateNumber,
            date: certificateDate,
          }}
        />
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 Tip: Klik tombol &quot;Download PDF&quot; untuk mendapatkan sertifikat dalam format PDF</p>
        <p className="text-xs mt-2">Certificate ID: {id}</p>
      </div>
    </div>
  );
}