"use client";

import CanvasEditor from "./CanvasEditor";

export default function Preview() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold mb-2">Certificate Preview</h2>
      <CanvasEditor 
        readonly={true} 
        previewData={{ 
          name: "Budi Santoso", 
          email: "budi@mail.com",
          certNumber: "NO/123/X/2026"
        }} 
      />
    </div>
  );
}
