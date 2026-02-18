"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Participant = {
  id: string;
  name: string;
  email: string;
};

type ParticipantWithCert = Participant & {
  certificateId?: string | null;
};

type CertificatePage = {
  id: string;
  pageNumber: number;
  backgroundImage: string | null;
  paperSize?: "A4" | "Letter";
  orientation?: "portrait" | "landscape";
};

type CertificateTemplate = {
  id: string;
  pages: CertificatePage[];
};

export default function ParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [participants, setParticipants] = useState<ParticipantWithCert[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // NEW: Template & Page Selection
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [showPageSelector, setShowPageSelector] = useState(false);

  const loadParticipants = async () => {
    try {
      if (!eventId) return;
      const res = await fetch(`/api/participants?eventId=${eventId}`);
      if (!res.ok) {
        console.error("Failed to load participants");
        return;
      }
      const data = await res.json();
      
      // Fetch certificates untuk setiap participant
      const participantsWithCerts = await Promise.all(
        data.map(async (p: Participant) => {
          try {
            const certRes = await fetch(`/api/certificates/by-participant?participantId=${p.id}`);
            if (certRes.ok) {
              const cert = await certRes.json();
              return { ...p, certificateId: cert.id };
            }
          } catch (err) {
            // Participant belum punya certificate
          }
          return { ...p, certificateId: null };
        })
      );
      
      setParticipants(participantsWithCerts);
    } catch (error) {
      console.error("Load participants error:", error);
    }
  };

  // Load participants & template on mount
  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        if (!eventId) return;
        
        // Load participants
        const res = await fetch(`/api/participants?eventId=${eventId}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!ignore) {
          const participantsWithCerts = await Promise.all(
            data.map(async (p: Participant) => {
              try {
                const certRes = await fetch(`/api/certificates/by-participant?participantId=${p.id}`);
                if (certRes.ok) {
                  const cert = await certRes.json();
                  return { ...p, certificateId: cert.id };
                }
              } catch (err) {
                // Participant belum punya certificate
              }
              return { ...p, certificateId: null };
            })
          );
          
          setParticipants(participantsWithCerts);
        }

        // Load template
        const tmplRes = await fetch(`/api/certificate-templates?eventId=${eventId}`);
        if (tmplRes.ok) {
          const tmplData = await tmplRes.json();
          if (tmplData && tmplData.length > 0 && !ignore) {
            const tmpl = tmplData[0];
            setTemplate(tmpl);
            
            // Default: select all pages
            if (tmpl.pages && tmpl.pages.length > 0) {
              setSelectedPageIds(tmpl.pages.map((p: CertificatePage) => p.id));
            }
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [eventId]);

  // Open certificate view in new tab
  const openCertificateView = (certificateId: string) => {
    window.open(`/certificates/${certificateId}/view`, "_blank");
  };

  // Create new participant
  const createParticipant = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Nama dan email wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name: name.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Gagal menambah participant");
        return;
      }

      setName("");
      setEmail("");
      loadParticipants();
    } catch (error) {
      console.error("Create participant error:", error);
      alert("Terjadi kesalahan saat menambah participant");
    }
  };

  // Delete participant
  const deleteParticipant = async (id: string) => {
    if (!confirm("Yakin hapus peserta ini?")) return;

    try {
      const res = await fetch("/api/participants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        alert("Gagal menghapus participant");
        return;
      }

      loadParticipants();
    } catch (error) {
      console.error("Delete participant error:", error);
      alert("Terjadi kesalahan saat menghapus participant");
    }
  };

  // Upload CSV
  const uploadCSV = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("eventId", eventId);

    try {
      const res = await fetch("/api/participants/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Upload CSV gagal");
        return;
      }

      const result = await res.json();
      alert(`Berhasil upload ${result.count || 0} participants`);
      loadParticipants();
    } catch (error) {
      console.error("Upload CSV error:", error);
      alert("Terjadi kesalahan saat upload CSV");
    }
  };

  // Open page selector modal
  const openPageSelector = () => {
    if (!template || !template.pages || template.pages.length === 0) {
      alert("Template belum memiliki halaman. Silakan buat template terlebih dahulu.");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Pilih minimal 1 participant terlebih dahulu");
      return;
    }

    setShowPageSelector(true);
  };

  // Generate certificates with selected pages
  const generateCertificates = async () => {
    if (selectedPageIds.length === 0) {
      alert("Pilih minimal 1 halaman untuk di-generate");
      return;
    }

    try {
      setIsGenerating(true);
      setShowPageSelector(false);

      const res = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          participantIds: selectedIds,
          pageIds: selectedPageIds, // Kirim page IDs yang dipilih
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Generate error:", errorData);
        alert(errorData.error || "Gagal generate sertifikat");
        return;
      }

      const data = await res.json();
      alert(
        `✅ ${data.total} sertifikat berhasil dibuat dengan ${selectedPageIds.length} halaman!\n\nKlik tombol "View / Download" untuk melihat sertifikat.`
      );

      setSelectedIds([]); // Clear selection
      loadParticipants(); // Refresh list
    } catch (error) {
      console.error("Generate certificates error:", error);
      alert("Terjadi kesalahan saat generate sertifikat");
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle page selection
  const togglePageSelection = (pageId: string) => {
    setSelectedPageIds(prev =>
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  // Select all pages
  const selectAllPages = () => {
    if (!template) return;
    
    if (selectedPageIds.length === template.pages.length) {
      setSelectedPageIds([]);
    } else {
      setSelectedPageIds(template.pages.map(p => p.id));
    }
  };

  // Select all participants
  const selectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map((p) => p.id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Page Selector Modal */}
      {showPageSelector && template && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold mb-2">📄 Pilih Halaman Sertifikat</h2>
              <p className="text-blue-100 text-sm">
                Pilih halaman mana saja yang ingin di-generate untuk {selectedIds.length} peserta
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={selectAllPages}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedPageIds.length === template.pages.length
                    ? "❌ Deselect All"
                    : "✅ Select All Pages"}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedPageIds.length} dari {template.pages.length} halaman dipilih
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {template.pages.map((page) => (
                  <label
                    key={page.id}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedPageIds.includes(page.id)
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPageIds.includes(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="absolute top-3 right-3 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    
                    <div className="flex flex-col">
                      <div className="text-lg font-bold text-gray-800 mb-2">
                        Halaman {page.pageNumber}
                      </div>
                      
                      {/* Page Preview (jika ada background) */}
                      {page.backgroundImage ? (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                          <img
                            src={page.backgroundImage}
                            alt={`Page ${page.pageNumber}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-gray-400">
                          <span className="text-4xl">📄</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>📏 {page.paperSize || "A4"}</div>
                        <div>🔄 {page.orientation || "landscape"}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {selectedPageIds.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Pilih minimal 1 halaman untuk melanjutkan
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowPageSelector(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                Batal
              </button>
              <button
                onClick={generateCertificates}
                disabled={selectedPageIds.length === 0 || isGenerating}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold transition flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span> Generating...
                  </>
                ) : (
                  <>
                    <span>🎓</span> Generate {selectedIds.length} Sertifikat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Participants Management
        </h1>
        <p className="text-gray-600">
          Kelola peserta event dan generate sertifikat
        </p>
      </div>

      {/* Create Participant Form */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Tambah Participant Baru
        </h2>
        <div className="flex gap-3">
          <input
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createParticipant()}
          />
          <input
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createParticipant()}
          />
          <button
            onClick={createParticipant}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition shadow-md"
          >
            ➕ Tambah
          </button>
        </div>
      </div>

      {/* CSV Upload */}
      <div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-6 mb-6 border-2 border-dashed border-purple-200">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          📤 Upload CSV (Bulk Import)
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Format CSV: <code className="bg-white px-2 py-1 rounded">name,email</code>
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files && uploadCSV(e.target.files[0])}
          className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer"
        />
      </div>

      {/* Template Info */}
      {template && template.pages && template.pages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-900">📑 Template Info</h3>
              <p className="text-sm text-blue-700">
                Template memiliki <strong>{template.pages.length} halaman</strong>. 
                Anda dapat memilih halaman mana saja yang ingin di-generate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedIds.length === participants.length
              ? "❌ Deselect All"
              : "✅ Select All"}
          </button>
          <span className="text-sm text-gray-600">
            {selectedIds.length} dari {participants.length} dipilih
          </span>
        </div>

        <button
          onClick={openPageSelector}
          disabled={selectedIds.length === 0 || isGenerating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition shadow-md flex items-center gap-2"
        >
          <span>🎓</span> Generate Certificates ({selectedIds.length})
        </button>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="font-bold text-gray-800">Daftar Participants</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {participants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">👥</div>
              <p className="text-lg font-medium">Belum ada peserta</p>
              <p className="text-sm">Tambahkan peserta atau upload CSV</p>
            </div>
          ) : (
            participants.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 transition"
              >
                <label className="flex items-center gap-4 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={(e) =>
                      setSelectedIds((prev) =>
                        e.target.checked
                          ? [...prev, p.id]
                          : prev.filter((id) => id !== p.id)
                      )
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-sm text-gray-500">{p.email}</span>
                  </div>
                </label>

                <div className="flex gap-3 items-center">
                  {p.certificateId ? (
                    <button
                      onClick={() => openCertificateView(p.certificateId!)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 font-medium text-sm transition flex items-center gap-2"
                    >
                      <span>👁️</span> View / Download
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm italic px-4">
                      Belum generate
                    </span>
                  )}

                  <button
                    onClick={() => deleteParticipant(p.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                    title="Hapus Peserta"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}