import { db } from "@/db";
import { participants } from "@/db/schema/participant";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return Response.json({ error: "eventId required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(participants)
    .where(eq(participants.eventId, eventId));

  return Response.json(data);
}

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
