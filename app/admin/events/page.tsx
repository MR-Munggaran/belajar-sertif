"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function EventsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then(setEvents);
  }, []);

  const createEvent = async () => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
      }),
    });

    const event = await res.json();
    setEvents((prev) => [...prev, event]);
    setTitle("");
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Events</h1>

      {/* CREATE */}
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-64"
          placeholder="Event name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          onClick={createEvent}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Create
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {events.map((e) => (
          <div
            key={e.id}
            className="bg-white p-4 rounded shadow flex justify-between"
          >
            <span>{e.title}</span>
            <Link
              href={`/admin/events/${e.id}/templates`}
              className="text-blue-600"
            >
              Manage
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
