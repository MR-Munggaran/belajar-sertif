"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadEvents = async () => {
    const r = await fetch("/api/events");
    const data = await r.json();
    setEvents(data);
  };

  useEffect(() => {
    const fetchData = async () => {
      const r = await fetch("/api/events");
      const data = await r.json();
      setEvents(data);
    };

    fetchData();
  }, []);

  const createEvent = async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date }),
    });

    setTitle("");
    setDescription("");
    setDate("");
    loadEvents();
  };

  const updateEvent = async () => {
    await fetch("/api/events/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        title,
        description,
        date,
      }),
    });

    setEditingId(null);
    setTitle("");
    setDescription("");
    setDate("");
    loadEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete event?")) return;

    await fetch("/api/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    loadEvents();
  };

  const startEdit = (e: Event) => {
    setEditingId(e.id);
    setTitle(e.title);
    setDescription(e.description ?? "");
    setDate(e.date ?? "");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Events</h1>

      {/* FORM */}
      <div className="flex flex-col gap-2 mb-6 max-w-md">
        <input
          className="border p-2 rounded"
          placeholder="Event name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          className="border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {editingId ? (
          <button
            onClick={updateEvent}
            className="bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Update
          </button>
        ) : (
          <button
            onClick={createEvent}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        )}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {events.map((e) => (
          <div
            key={e.id}
            className="bg-white p-4 rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{e.title}</p>
              <p className="text-sm text-gray-500">{e.description}</p>
            </div>

            <div className="flex gap-4">
              <Link
                href={`/admin/events/${e.id}/participants`}
                className="text-blue-600"
              >
                Participants
              </Link>

              <Link
                href={`/admin/events/${e.id}/templates`}
                className="text-green-600"
              >
                Certificate
              </Link>

              <button
                onClick={() => startEdit(e)}
                className="text-yellow-600"
              >
                Edit
              </button>

              <button
                onClick={() => deleteEvent(e.id)}
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
