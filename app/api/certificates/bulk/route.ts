import { db } from "@/db";
import { participants } from "@/db/schema/participant";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { eventId, templateId } = await req.json();

  const [template] = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.id, templateId));

  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }

  const users = await db
    .select()
    .from(participants)
    .where(eq(participants.eventId, eventId));

  const results = [];

  for (const user of users) {
    const certId = randomUUID();

    await db.insert(certificates).values({
      id: certId,
      participantId: user.id,
      templateId: template.id,
      fileUrl: `/certificates/${certId}.pdf`,
    });

    results.push({
      certificateId: certId,
      participant: user,
      template,
    });
  }

  return Response.json({
    total: results.length,
    data: results,
  });
}
