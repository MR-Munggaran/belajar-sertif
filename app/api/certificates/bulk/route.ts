import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { participants } from "@/db/schema/participant";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { CertificatePage } from "@/db/schema/certificateTemplate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, participantIds, pageIds } = body;

    // Validasi input
    if (!eventId || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: "eventId dan participantIds wajib diisi" },
        { status: 400 }
      );
    }

    if (participantIds.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 participant harus dipilih" },
        { status: 400 }
      );
    }

    // 1. Ambil template berdasarkan eventId
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, eventId))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: "Template tidak ditemukan untuk event ini" },
        { status: 404 }
      );
    }

    // 2. Filter pages berdasarkan pageIds (jika ada)
    let pagesToGenerate: CertificatePage[] = template.pages || [];
    let selectedPageIds: string[] | null = null;
    
    if (pageIds && Array.isArray(pageIds) && pageIds.length > 0) {
      // Filter hanya halaman yang dipilih
      pagesToGenerate = template.pages.filter((page: CertificatePage) => 
        pageIds.includes(page.id)
      );
      
      // Sort by pageNumber untuk menjaga urutan
      pagesToGenerate.sort((a, b) => a.pageNumber - b.pageNumber);
      
      // Simpan page IDs yang dipilih
      selectedPageIds = pageIds;
    }

    if (pagesToGenerate.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada halaman yang dipilih atau template kosong" },
        { status: 400 }
      );
    }

    // 3. Ambil data participants
    const participantsList = await db
      .select()
      .from(participants)
      .where(inArray(participants.id, participantIds));

    if (participantsList.length === 0) {
      return NextResponse.json(
        { error: "Participants tidak ditemukan" },
        { status: 404 }
      );
    }

    // 4. Generate certificates untuk setiap participant
    const createdCertificates = [];

    for (const participant of participantsList) {
      // Cek apakah sudah ada certificate
      const [existingCert] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.participantId, participant.id))
        .limit(1);

      if (existingCert) {
        // Update certificate dengan page selection
        const [updated] = await db
          .update(certificates)
          .set({
            templateId: template.id,
            generatedPageIds: selectedPageIds,
          })
          .where(eq(certificates.id, existingCert.id))
          .returning();

        createdCertificates.push(updated);
      } else {
        // Buat certificate baru
        const [newCert] = await db
          .insert(certificates)
          .values({
            participantId: participant.id,
            templateId: template.id,
            fileUrl: null,
            generatedPageIds: selectedPageIds,
          })
          .returning();

        createdCertificates.push(newCert);
      }
    }

    return NextResponse.json({
      success: true,
      total: createdCertificates.length,
      generatedPages: pagesToGenerate.length,
      pageNumbers: pagesToGenerate.map((p: CertificatePage) => p.pageNumber),
      certificates: createdCertificates,
    });
  } catch (error) {
    console.error("Bulk certificate generation error:", error);
    return NextResponse.json(
      {
        error: "Gagal generate certificates",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}