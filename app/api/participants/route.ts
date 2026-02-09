import { db } from "@/db";
import { participants } from "@/db/schema/participant";
import { certificates } from "@/db/schema/certificate"; // <--- TAMBAHAN IMPORT
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return Response.json({ error: "eventId required" }, { status: 400 });
  }

  // PERBAIKAN: Gunakan Left Join untuk mengambil ID Sertifikat (jika ada)
  const data = await db
    .select({
      id: participants.id,
      name: participants.name,
      email: participants.email,
      eventId: participants.eventId,
      certificateId: certificates.id, // <--- Ini yang dibutuhkan Frontend
    })
    .from(participants)
    .leftJoin(certificates, eq(certificates.participantId, participants.id))
    .where(eq(participants.eventId, eventId));

  return Response.json(data);
}

// --- BAGIAN POST DAN DELETE DI BAWAH TETAP SAMA ---

export async function POST(req: Request) {
  const body = await req.json();

  const [participant] = await db
    .insert(participants)
    .values({
      eventId: body.eventId,
      name: body.name,
      email: body.email,
    })
    .returning();

  return Response.json(participant);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  await db.delete(participants).where(eq(participants.id, id));
  return Response.json({ success: true });
}