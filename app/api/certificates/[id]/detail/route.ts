import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { participants } from "@/db/schema/participant";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  // Perbaikan Tipe Data: params adalah Promise
  props: { params: Promise<{ id: string }> }
) {
  // PERBAIKAN UTAMA: Await params sebelum akses id
  const params = await props.params;
  const certId = params.id;

  try {
    // 1. Ambil Data Sertifikat
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certId));

    if (!cert) {
      return Response.json({ error: "Certificate not found" }, { status: 404 });
    }

    // 2. Ambil Data Peserta
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, cert.participantId));

    if (!participant) {
      return Response.json({ error: "Participant not found" }, { status: 404 });
    }

    // 3. Ambil Data Template
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, cert.templateId));

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // 4. Return Data Gabungan
    return Response.json({
      certificate: cert,
      participant,
      template,
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}