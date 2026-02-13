import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { participants } from "@/db/schema/participant";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // PERBAIKAN: Await params sebelum akses id
    const params = await props.params;
    const certId = params.id;

    // 1. Ambil Data Sertifikat
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certId))
      .limit(1);

    if (!cert) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // 2. Ambil Data Peserta
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, cert.participantId))
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // 3. Ambil Data Template
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, cert.eventId))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 4. Return Data Gabungan
    return NextResponse.json({
      certificate: cert,
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        eventId: participant.eventId,
      },
      template: {
        id: template.id,
        pages: template.pages,
        eventId: template.eventId,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}