import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET - Ambil certificate berdasarkan participantId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const participantId = searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId wajib diisi" },
        { status: 400 }
      );
    }

    const [certificate] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.participantId, participantId))
      .limit(1);

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(certificate);
  } catch (error) {
    console.error("Get certificate by participant error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}