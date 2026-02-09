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

  const loadParticipants = async () => {
    const res = await fetch(`/api/participants?eventId=${eventId}`);
    if (!res.ok) return;
    setParticipants(await res.json());
  };

  // --- PERBAIKAN DI SINI ---
  const openCertificateView = (certificateId: string) => {
    // Langsung buka halaman View di tab baru
    // Di halaman inilah proses generate PDF (jspdf) yang kita buat sebelumnya berjalan
    window.open(`/certificates/${certificateId}/view`, "_blank");
  };

  useEffect(() => {
    let ignore = false;
    async function fetchParticipants() {
      const res = await fetch(`/api/participants?eventId=${eventId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!ignore) {
        setParticipants(data);
      }
    }
    fetchParticipants();
    return () => {
      ignore = true;
    };
  }, [eventId]);

  const createParticipant = async () => {
    const res = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, name, email }),
    });
    if (!res.ok) {
      alert("Gagal menambah participant");
      return;
    }
    setName("");
    setEmail("");
    loadParticipants();
  };

  const deleteParticipant = async (id: string) => {
    if (!confirm("Yakin hapus peserta ini?")) return;
    await fetch("/api/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadParticipants();
  };

  const uploadCSV = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("eventId", eventId);
    const res = await fetch("/api/participants/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      alert("Upload CSV gagal");
      return;
    }
    loadParticipants();
  };

  const generateCertificates = async () => {
    if (selectedIds.length === 0) {
      alert("Pilih participant terlebih dahulu");
      return;
    }
    const res = await fetch("/api/certificates/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        participantIds: selectedIds,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Gagal generate sertifikat");
      return;
    }

    const data = await res.json();
    alert(`${data.total} sertifikat berhasil dibuat. Silakan klik tombol 'View / Download' pada tabel.`);
    setSelectedIds([]);
    loadParticipants(); // Refresh list agar tombol download muncul
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Participants</h1>

      {/* CREATE */}
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={createParticipant}
          className="bg-blue-600 text-white px-4"
        >
          Add
        </button>
      </div>

      {/* CSV */}
      <div className="mb-6 p-4 border border-dashed rounded bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">Upload CSV (Format: name,email)</p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files && uploadCSV(e.target.files[0])}
          />
      </div>

      {/* BULK GENERATE */}
      <button
        onClick={generateCertificates}
        className="mb-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition"
      >
        Generate Certificates for Selected ({selectedIds.length})
      </button>

      {/* LIST */}
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-white p-3 rounded shadow hover:shadow-md transition"
          >
            <label className="flex items-center gap-3 cursor-pointer">
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
                className="w-4 h-4"
              />
              <div className="flex flex-col">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.email}</span>
              </div>
            </label>

            <div className="flex gap-3 items-center">
              {p.certificateId ? (
                // TOMBOL UNTUK MEMBUKA HALAMAN VIEW & DOWNLOAD
                <button
                  onClick={() => openCertificateView(p.certificateId!)}
                  className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100 transition"
                >
                  View / Download
                </button>
              ) : (
                <span className="text-gray-400 text-xs italic">
                  Belum generate
                </span>
              )}

              <button
                onClick={() => deleteParticipant(p.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Hapus Peserta"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
        {participants.length === 0 && (
            <div className="text-center py-8 text-gray-500">Belum ada peserta.</div>
        )}
      </div>
    </div>
  );
}