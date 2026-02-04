"use client";

import { useParams } from "next/navigation";

export default function CertificatesPage() {
  const { eventId } = useParams();

  const generateCertificates = async () => {
    await fetch("/api/certificates/bulk", {
      method: "POST",
      body: JSON.stringify({
        eventId,
        templateId: "template-id", // ambil dari API nanti
      }),
    });

    alert("Certificates generated");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Certificates</h1>

      <button
        onClick={generateCertificates}
        className="bg-purple-600 text-white px-6 py-3 rounded"
      >
        Bulk Generate Certificates
      </button>
    </div>
  );
}
