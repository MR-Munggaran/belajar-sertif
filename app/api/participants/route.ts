import { db } from "@/db";
import { participants } from "@/db/schema/participant";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET - Ambil participants berdasarkan eventId
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId wajib diisi" },
        { status: 400 }
      );
    }

    const allParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.eventId, eventId))
      .orderBy(participants.createdAt);

    return NextResponse.json(allParticipants);
  } catch (error) {
    console.error("GET participants error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Tambah participant baru
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.eventId || !body.name || !body.email) {
      return NextResponse.json(
        { error: "eventId, name, dan email wajib diisi" },
        { status: 400 }
      );
    }

    const [participant] = await db
      .insert(participants)
      .values({
        eventId: body.eventId,
        name: body.name,
        email: body.email,
      })
      .returning();

    return NextResponse.json(participant);
  } catch (error) {
    console.error("POST participant error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus participant
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "id wajib diisi" },
        { status: 400 }
      );
    }

    await db.delete(participants).where(eq(participants.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE participant error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}