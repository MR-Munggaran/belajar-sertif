import { db } from "@/db";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import type { CertificateElement } from "@/db/schema/certificateTemplate";
import { eq, and } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import crypto from "crypto";

type UpdateTemplateData = {
  backgroundImage?: string;
  elements?: CertificateElement[];
};

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function saveFileLocally(file: File): Promise<string> {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar (Maksimal 5MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split(".").pop() || "png";
  const filename = `${crypto.randomUUID()}.${extension}`;

  const uploadDir = path.join(process.cwd(), "public/uploads/certificates");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return `/uploads/certificates/${filename}`;
}

/* ---------------- GET ---------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(certificateTemplates)
    .where(eq(certificateTemplates.eventId, eventId));

  return NextResponse.json(data);
}

/* ---------------- POST ---------------- */

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const eventId = formData.get("eventId") as string;
    const file = formData.get("backgroundImage") as File | null;
    const elementsString = formData.get("elements") as string;

    if (!eventId || !file) {
      return NextResponse.json(
        { error: "Event ID dan Background Image wajib diisi" },
        { status: 400 }
      );
    }

    let elements: CertificateElement[] = [];

    if (elementsString) {
      elements = JSON.parse(elementsString) as CertificateElement[];
    }

    const imageUrl = await saveFileLocally(file);

    const [template] = await db
      .insert(certificateTemplates)
      .values({
        eventId,
        backgroundImage: imageUrl,
        elements,
      })
      .returning();

    return NextResponse.json(template);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/* ---------------- PUT ---------------- */

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const id = formData.get("id") as string;
    const eventId = formData.get("eventId") as string;
    const file = formData.get("backgroundImage") as File | null;
    const elementsString = formData.get("elements") as string;

    if (!id || !eventId) {
      return NextResponse.json(
        { error: "ID dan Event ID required" },
        { status: 400 }
      );
    }

    const updateData: UpdateTemplateData = {};

    if (file && file.size > 0) {
      const imageUrl = await saveFileLocally(file);
      updateData.backgroundImage = imageUrl;
    }

    if (elementsString) {
      updateData.elements = JSON.parse(elementsString) as CertificateElement[];
    }

    const [updated] = await db
      .update(certificateTemplates)
      .set(updateData)
      .where(
        and(
          eq(certificateTemplates.id, id),
          eq(certificateTemplates.eventId, eventId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
