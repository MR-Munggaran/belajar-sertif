import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { participants } from "@/db/schema/participant";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { CertificatePage } from "@/db/schema/certificateTemplate";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // FIX 1: Await params (wajib di Next.js 15+)
    const { id: certificateId } = await params;

    console.log("Fetching certificate:", certificateId);

    // 1. Ambil certificate
    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certificateId))
      .limit(1);

    if (!certificate) {
      console.log("Certificate not found for id:", certificateId);
      return NextResponse.json(
        { error: "Certificate tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Ambil participant
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, certificate.participantId))
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant tidak ditemukan" },
        { status: 404 }
      );
    }

    // 3. Ambil template
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.id, certificate.templateId))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    // 4. Filter pages berdasarkan generatedPageIds
    let filteredPages: CertificatePage[] = template.pages || [];

    // FIX 2: Safer type checking untuk generatedPageIds
    const generatedPageIds = certificate.generatedPageIds;
    if (
      generatedPageIds &&
      Array.isArray(generatedPageIds) &&
      generatedPageIds.length > 0
    ) {
      filteredPages = template.pages.filter((page: CertificatePage) =>
        (generatedPageIds as string[]).includes(page.id)
      );
      filteredPages.sort((a, b) => a.pageNumber - b.pageNumber);
    }

    return NextResponse.json({
      certificate: {
        id: certificate.id,
        participantId: certificate.participantId,
        templateId: certificate.templateId,
      },
      participant,
      template: {
        id: template.id,
        pages: filteredPages,
        eventId: template.eventId,
      },
    });
  } catch (error) {
    console.error("Get certificate detail error:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil detail certificate",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}