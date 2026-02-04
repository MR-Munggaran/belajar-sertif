"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { clearUser } = useAuthStore();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow flex flex-col">
        <div className="p-4 font-bold text-lg">Admin Panel</div>

        <nav className="flex flex-col gap-2 p-4">
          <Link href="/admin/events">Events</Link>
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 mt-auto bg-red-500 text-white py-2 rounded"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
