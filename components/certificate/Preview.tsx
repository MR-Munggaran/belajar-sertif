"use client";

import { useState } from "react";
import CanvasEditor from "./CanvasEditor";

interface PreviewData {
  name: string;
  email?: string;
  certNumber?: string;
  date?: string;
}

export default function Preview() {
  const [previewData, setPreviewData] = useState<PreviewData>({
    name: "Budi Santoso",
    email: "budi@mail.com",
    certNumber: "NO/123/X/2026",
    date: "Jakarta, 04 Februari 2026",
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <span>👁️</span> Certificate Preview
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Preview tampilan sertifikat dengan data sample
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              isEditing
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-300 hover:border-blue-400"
            }`}
          >
            {isEditing ? "✓ Selesai" : "✏️ Edit Data"}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-gray-50 border-b border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Nama Peserta
              </label>
              <input
                type="text"
                value={previewData.name}
                onChange={(e) =>
                  setPreviewData({ ...previewData, name: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={previewData.email}
                onChange={(e) =>
                  setPreviewData({ ...previewData, email: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                No. Sertifikat
              </label>
              <input
                type="text"
                value={previewData.certNumber}
                onChange={(e) =>
                  setPreviewData({ ...previewData, certNumber: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Tanggal
              </label>
              <input
                type="text"
                value={previewData.date}
                onChange={(e) =>
                  setPreviewData({ ...previewData, date: e.target.value })
                }
                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Canvas Preview */}
      <div className="p-4 bg-gray-50">
        <div className="bg-white rounded-lg shadow-inner border border-gray-200 overflow-hidden">
          <CanvasEditor readonly={true} previewData={previewData} />
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Mode: Read-only
            </span>
            <span>Data: Sample Preview</span>
          </div>
          <span className="text-[10px] text-gray-400">
            💡 Tip: Edit data untuk melihat perubahan real-time
          </span>
        </div>
      </div>
    </div>
  );
}