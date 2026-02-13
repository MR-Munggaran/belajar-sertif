import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { participants } from "@/db/schema/participant";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { eq, inArray, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, participantIds } = body;

    if (!eventId || !participantIds || !Array.isArray(participantIds)) {
      return NextResponse.json(
        { error: "eventId dan participantIds (array) wajib diisi" },
        { status: 400 }
      );
    }

    if (participantIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 participant" },
        { status: 400 }
      );
    }

    // 1. Cek apakah template sudah dibuat untuk event ini
    const [template] = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, eventId))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { error: "Template sertifikat belum dibuat untuk event ini" },
        { status: 404 }
      );
    }

    // 2. Ambil data participants yang dipilih
    const selectedParticipants = await db
      .select()
      .from(participants)
      .where(
        and(
          inArray(participants.id, participantIds),
          eq(participants.eventId, eventId)
        )
      );

    if (selectedParticipants.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada participant yang valid" },
        { status: 404 }
      );
    }

    // 3. Generate certificates untuk setiap participant
    const generatedCerts = [];

    for (const participant of selectedParticipants) {
      // Cek apakah sudah punya sertifikat
      const [existing] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.participantId, participant.id))
        .limit(1);

      if (existing) {
        // Jika sudah ada, update templateId
        const [updated] = await db
          .update(certificates)
          .set({
            templateId: template.id,
          })
          .where(eq(certificates.id, existing.id))
          .returning();

        generatedCerts.push(updated);
      } else {
        // Buat sertifikat baru
        const [newCert] = await db
          .insert(certificates)
          .values({
            participantId: participant.id,
            templateId: template.id,
          })
          .returning();

        generatedCerts.push(newCert);
      }
    }

    return NextResponse.json({
      success: true,
      total: generatedCerts.length,
      certificates: generatedCerts,
      message: `${generatedCerts.length} sertifikat berhasil dibuat`,
    });
  } catch (error) {
    console.error("Bulk generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}