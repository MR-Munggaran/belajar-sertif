import { db } from "@/db";
import { participants } from "@/db/schema/participant";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { certificates } from "@/db/schema/certificate";
import { eq, inArray, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { eventId, participantIds } = await req.json();

  if (!eventId || !Array.isArray(participantIds) || participantIds.length === 0) {
    return Response.json(
      { error: "eventId & participantIds required" },
      { status: 400 }
    );
  }

  const [template] = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.eventId, eventId));

  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  const users = await db
    .select()
    .from(participants)
    .where(inArray(participants.id, participantIds));

  if (users.length === 0) {
    return Response.json(
      { error: "Participants not found" },
      { status: 404 }
    );
  }

  const exists = await db
    .select()
    .from(certificates)
    .where(
      and(
        inArray(certificates.participantId, participantIds),
        eq(certificates.templateId, template.id)
      )
    );

  const existingIds = new Set(exists.map(e => e.participantId));

  const payload = users
    .filter(u => !existingIds.has(u.id))
    .map(u => {
      const certId = randomUUID();
      return {
        id: certId,
        participantId: u.id,
        templateId: template.id,
        fileUrl: `/certificates/${certId}.pdf`,
      };
    });

  if (payload.length === 0) {
    return Response.json({
      message: "All selected participants already have certificates",
    });
  }

  await db.insert(certificates).values(payload);

  return Response.json({
    total: payload.length,
    generated: payload.map(p => p.participantId),
    skipped: [...existingIds],
  });
}
