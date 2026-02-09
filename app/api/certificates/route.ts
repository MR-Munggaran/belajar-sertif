import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const participantId = searchParams.get("participantId");

  if (!participantId) {
    return Response.json(
      { error: "participantId required" },
      { status: 400 }
    );
  }

  const [certificate] = await db
    .select({
      certificateId: certificates.id,
    })
    .from(certificates)
    .where(eq(certificates.participantId, participantId))
    .limit(1);

  return Response.json({
    certificateId: certificate?.certificateId ?? null,
  });
}


export async function POST(req: Request) {
  const body = await req.json();

  if (!body.participantId || !body.templateId) {
    return Response.json(
      { error: "participantId & templateId required" },
      { status: 400 }
    );
  }

  const [certificate] = await db
    .insert(certificates)
    .values({
      participantId: body.participantId,
      templateId: body.templateId,
      fileUrl: body.fileUrl ?? null,
    })
    .returning({
      id: certificates.id,
      participantId: certificates.participantId,
    });

  return Response.json(certificate);
}
