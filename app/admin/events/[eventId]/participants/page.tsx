"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Participant = {
  id: string;
  name: string;
  email: string;
};

export default function ParticipantsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const loadParticipants = async () => {
    const r = await fetch(`/api/participants?eventId=${eventId}`);
    const data = await r.json();
    setParticipants(data);
  };

    useEffect(() => {
    const fetchData = async () => {
        const r = await fetch(`/api/participants?eventId=${eventId}`);
        const data = await r.json();
        setParticipants(data);
    };

    fetchData();
    }, [eventId]);

  const createParticipant = async () => {
    await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, name, email }),
    });

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

    await fetch("/api/participants/upload", {
      method: "POST",
      body: form,
    });

    loadParticipants();
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

      {/* CSV UPLOAD */}
      <div className="mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              uploadCSV(e.target.files[0]);
            }
          }}
        />
      </div>

      {/* LIST */}
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex justify-between bg-white p-3 rounded shadow"
          >
            <div>
              {p.name} — {p.email}
            </div>

            <button
              onClick={() => deleteParticipant(p.id)}
              className="text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
