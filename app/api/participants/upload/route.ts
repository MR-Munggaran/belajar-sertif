import { db } from "@/db";
import { participants } from "@/db/schema/participant";

type InsertParticipant = {
  eventId: string;
  name: string;
  email: string | null;
};


export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file") as File;
    const eventId = form.get("eventId") as string;

    const text = await file.text();
    const rows = text.split("\n").slice(1);

    const values: InsertParticipant[] = rows
    .map((row) => {
        const [name, email] = row.split(",");
        if (!name) return null;

        return {
        eventId,
        name: name.trim(),
        email: email?.trim() || null,
        };
    })
    .filter((v): v is InsertParticipant => v !== null);


    if (values.length > 0) {
    await db.insert(participants).values(values);
    }

    return Response.json({ inserted: values.length });
}
