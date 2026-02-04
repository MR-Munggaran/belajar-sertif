import { db } from "@/db";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return Response.json({ error: "eventId required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.eventId, eventId));

  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const [template] = await db
    .insert(certificateTemplates)
    .values({
      eventId: body.eventId,
      backgroundImage: body.backgroundImage,
      elements: body.elements, // JSON dari canvas
    })
    .returning();

  return Response.json(template);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const [updated] = await db
    .update(certificateTemplates)
    .set({
      backgroundImage: body.backgroundImage,
      elements: body.elements,
    })
    .where(eq(certificateTemplates.id, body.id))
    .returning();

  return Response.json(updated);
}
