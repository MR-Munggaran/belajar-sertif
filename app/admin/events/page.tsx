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
     const loadEvents = async () => {
      const r = await fetch("/api/events");
      const data = await r.json();
      setEvents(data);
    };
    loadEvents()
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate("");
    setEditingId(null);
  };

  const createEvent = async () => {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date }),
    });

    resetForm();
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

    resetForm();
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
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800">
          Event Management
        </h1>
        <p className="text-slate-500 mt-1">
          Create and manage your events
        </p>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-700 mb-4">
          {editingId ? "Edit Event" : "Create New Event"}
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Event title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-6">
          {editingId ? (
            <>
              <button
                onClick={updateEvent}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg"
              >
                Update Event
              </button>
              <button
                onClick={resetForm}
                className="text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={createEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
            >
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {events.map((e) => (
          <div
            key={e.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <p className="text-lg font-medium text-slate-800">
                {e.title}
              </p>
              <p className="text-sm text-slate-500">
                {e.description || "No description"}
              </p>
              {e.date && (
                <p className="text-xs text-slate-400 mt-1">
                  📅 {e.date}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href={`/admin/events/${e.id}/participants`}
                className="text-blue-600 hover:underline"
              >
                Participants
              </Link>

              <Link
                href={`/admin/events/${e.id}/templates`}
                className="text-emerald-600 hover:underline"
              >
                Certificate
              </Link>

              <button
                onClick={() => startEdit(e)}
                className="text-amber-600 hover:underline"
              >
                Edit
              </button>

              <button
                onClick={() => deleteEvent(e.id)}
                className="text-red-600 hover:underline"
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
