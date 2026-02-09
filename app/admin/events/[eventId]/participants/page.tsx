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

  const downloadCertificate = (certificateId: string) => {
    window.open(`/api/certificates/${certificateId}/download`, "_blank");
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
      const text = await res.text(); // ⬅️ penting
      console.error(text);
      alert("Gagal generate sertifikat");
      return;
    }

    const data = await res.json();
    alert(`${data.total} sertifikat berhasil dibuat`);
    setSelectedIds([]);
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
      <input
        type="file"
        accept=".csv"
        className="mb-6"
        onChange={(e) => e.target.files && uploadCSV(e.target.files[0])}
      />

      {/* BULK GENERATE */}
      <button
        onClick={generateCertificates}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded"
      >
        Generate Selected Certificates
      </button>

      {/* LIST */}
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex justify-between items-center bg-white p-3 rounded shadow"
          >
            <label className="flex items-center gap-3">
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
              />
              {p.name} — {p.email}
            </label>

            <div className="flex gap-3">
              {p.certificateId ? (
                <button
                  onClick={() => downloadCertificate(p.certificateId!)}
                  className="text-blue-600"
                >
                  Download
                </button>
              ) : (
                <span className="text-gray-400 text-sm">
                  Belum ada sertifikat
                </span>
              )}

              <button
                onClick={() => deleteParticipant(p.id)}
                className="text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
