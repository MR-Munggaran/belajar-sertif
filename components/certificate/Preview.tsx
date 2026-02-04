"use client";

import CanvasEditor from "./CanvasEditor";

export default function Preview() {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="font-bold mb-2">Certificate Preview</h2>
      <CanvasEditor />
    </div>
  );
}
