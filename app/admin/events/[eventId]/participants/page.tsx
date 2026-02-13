"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Participant = {
  certificateId?: string | null;
  id: string;
  name: string;
  email: string;
};

export default function ParticipantsPage() {
  const { eventId } = useParams<{ eventId: string }>();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const loadParticipants = async () => {
    try {
      const res = await fetch(`/api/participants?eventId=${eventId}`);
      if (!res.ok) {
        console.error("Failed to load participants");
        return;
      }
      const data = await res.json();
      setParticipants(data);
    } catch (error) {
      console.error("Load participants error:", error);
    }
  };

  // Load participants on mount
  useEffect(() => {
    let ignore = false;
    
    async function fetchParticipants() {
      try {
        const res = await fetch(`/api/participants?eventId=${eventId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore) {
          setParticipants(data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    }
    
    fetchParticipants();
    
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

  // Generate certificates in bulk
  const generateCertificates = async () => {
    if (selectedIds.length === 0) {
      alert("Pilih minimal 1 participant terlebih dahulu");
      return;
    }

    if (!confirm(`Generate sertifikat untuk ${selectedIds.length} peserta?`)) {
      return;
    }

    try {
      setIsGenerating(true);

      const res = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          participantIds: selectedIds,
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
        `✅ ${data.total} sertifikat berhasil dibuat!\n\nKlik tombol "View / Download" untuk melihat sertifikat.`
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
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-6 mb-6 border-2 border-dashed border-purple-200">
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
          onClick={generateCertificates}
          disabled={selectedIds.length === 0 || isGenerating}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition shadow-md flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="animate-spin">⏳</span> Generating...
            </>
          ) : (
            <>
              <span>🎓</span> Generate Certificates ({selectedIds.length})
            </>
          )}
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