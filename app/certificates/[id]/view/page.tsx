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
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { loadTemplate, pages, setActivePage } = useCertificateEditor();

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

  // Change active page when navigating
  useEffect(() => {
    if (pages && pages.length > 0 && pages[currentPageIndex]) {
      setActivePage(pages[currentPageIndex].id);
    }
  }, [currentPageIndex, pages, setActivePage]);

  // --- FUNGSI DOWNLOAD PNG (Current Page Only) ---
  const handleDownloadPNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("Canvas tidak ditemukan");
      return;
    }

    try {
      const link = document.createElement("a");
      const pageNum = currentPageIndex + 1;
      link.download = `Sertifikat-${data?.participant.name || "file"}-Page${pageNum}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download PNG error:", error);
      alert("Gagal download PNG");
    }
  };

  // --- FUNGSI DOWNLOAD PDF (Multi-Page Support) ---
  const handleDownloadPDF = async () => {
    if (!data || !pages || pages.length === 0) {
      alert("Data tidak tersedia");
      return;
    }

    try {
      // Create jsPDF instance
      let pdf: jsPDF | null = null;

      // Loop through each page
      for (let i = 0; i < pages.length; i++) {
        // Change to the page
        setCurrentPageIndex(i);
        setActivePage(pages[i].id);

        // Wait for canvas to render
        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = document.querySelector("canvas");
        if (!canvas) continue;

        // Get canvas image
        const imgData = canvas.toDataURL("image/png", 1.0);

        // Setup PDF dimensions
        const orientation = canvas.width > canvas.height ? "l" : "p";
        const widthMm = (canvas.width * 25.4) / 96;
        const heightMm = (canvas.height * 25.4) / 96;

        if (i === 0) {
          // Create PDF on first page
          pdf = new jsPDF({
            orientation: orientation,
            unit: "mm",
            format: [widthMm, heightMm],
            compress: true,
          });
        } else {
          // Add new page for subsequent pages
          pdf!.addPage([widthMm, heightMm], orientation);
        }

        // Add image to current page
        pdf!.addImage(imgData, "PNG", 0, 0, widthMm, heightMm, undefined, "FAST");
      }

      // Save PDF
      if (pdf) {
        pdf.save(`Sertifikat-${data.participant.name}.pdf`);
        alert(`✅ PDF berhasil di-download dengan ${pages.length} halaman!`);
      }

      // Reset to first page
      setCurrentPageIndex(0);
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

  const totalPages = pages?.length || 1;

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
          {totalPages > 1 && (
            <p className="text-xs text-blue-600 mt-2">
              📄 Sertifikat ini memiliki {totalPages} halaman
            </p>
          )}
        </div>

        {/* Download Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleDownloadPNG}
            className="bg-gray-700 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span>🖼️</span>
            Download PNG (Halaman {currentPageIndex + 1})
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <span>📄</span>
            Download PDF {totalPages > 1 && `(${totalPages} hal)`}
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

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center gap-4 bg-white px-6 py-3 rounded-xl shadow-md">
          <button
            onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            ← Previous
          </button>
          
          <span className="text-sm font-medium text-gray-700">
            Halaman {currentPageIndex + 1} dari {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === totalPages - 1}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg font-medium transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 Tip: Download PDF akan menyimpan semua halaman dalam 1 file</p>
        <p className="text-xs mt-2">Certificate ID: {id}</p>
      </div>
    </div>
  );
}