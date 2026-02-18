import { db } from "@/db";
import { events } from "@/db/schema/event";
import { users } from "@/db/schema/user";
import { eq } from "drizzle-orm";

export async function GET() {
  const data = await db.select().from(events);
  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);

  if (!admin) {
    return Response.json(
      { error: "Admin user not found" },
      { status: 400 }
    );
  }

  // FIX: Convert string date ke Date object, atau null jika kosong
  const dateValue = body.date ? new Date(body.date) : null;

  const [event] = await db
    .insert(events)
    .values({
      title: body.title,
      description: body.description ?? null,
      date: dateValue,
      createdBy: admin.id,
    })
    .returning();

  return Response.json(event);
}

export async function PUT(req: Request) {
  const { id, title, description, date } = await req.json();

  // FIX: Convert string date ke Date object, atau null jika kosong
  const dateValue = date ? new Date(date) : null;

  const [event] = await db
    .update(events)
    .set({ title, description, date: dateValue })
    .where(eq(events.id, id))
    .returning();

  return Response.json(event);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  await db.delete(events).where(eq(events.id, id));
  return Response.json({ success: true });
}