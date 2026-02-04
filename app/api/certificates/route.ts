import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  if (!participantId) {
    return Response.json({ error: "participantId required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(certificates)
    .where(eq(certificates.participantId, participantId));

  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const [certificate] = await db
    .insert(certificates)
    .values({
      participantId: body.participantId,
      templateId: body.templateId,
      fileUrl: body.fileUrl, // hasil PDF / image
    })
    .returning();

  return Response.json(certificate);
}
