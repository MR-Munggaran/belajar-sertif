import { db } from "@/db";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import type { CertificatePage } from "@/db/schema/certificateTemplate";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function saveFileLocally(file: File): Promise<string> {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`Format file ${file.name} tidak didukung.`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Ukuran file ${file.name} terlalu besar (max 5MB).`);
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

// GET - Ambil template berdasarkan eventId
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

    const templates = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, eventId));

    return NextResponse.json(templates);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Buat template baru
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const eventId = formData.get("eventId") as string;
    const pagesString = formData.get("pages") as string;
    const templateId = formData.get("templateId") as string | null;

    if (!eventId || !pagesString) {
      return NextResponse.json(
        { error: "eventId dan pages wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Parse struktur JSON pages
    const pages: CertificatePage[] = JSON.parse(pagesString);

    // 2. Proses setiap page untuk cek upload background baru
    const updatedPages = await Promise.all(
      pages.map(async (page) => {
        const fileKey = `bg_file_${page.id}`;
        const file = formData.get(fileKey) as File | null;

        if (file && file.size > 0) {
          // Upload file baru dan dapatkan URL
          const imageUrl = await saveFileLocally(file);
          return { ...page, backgroundImage: imageUrl };
        }

        // Jika tidak ada file baru, pertahankan background yang ada
        return page;
      })
    );

    // 3. Jika templateId ada, berarti ini UPDATE
    if (templateId) {
      const [updatedTemplate] = await db
        .update(certificateTemplates)
        .set({
          pages: updatedPages,
          updatedAt: new Date(),
        })
        .where(eq(certificateTemplates.id, templateId))
        .returning();

      return NextResponse.json(updatedTemplate);
    }

    // 4. Jika tidak ada templateId, berarti INSERT baru
    const [newTemplate] = await db
      .insert(certificateTemplates)
      .values({
        eventId,
        pages: updatedPages,
      })
      .returning();

    return NextResponse.json(newTemplate);
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Update template (Alternative approach)
export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    const templateId = formData.get("templateId") as string;
    const pagesString = formData.get("pages") as string;

    if (!templateId || !pagesString) {
      return NextResponse.json(
        { error: "templateId dan pages wajib diisi" },
        { status: 400 }
      );
    }

    // 1. Parse JSON pages
    const pages: CertificatePage[] = JSON.parse(pagesString);

    // 2. Proses background baru jika ada
    const updatedPages = await Promise.all(
      pages.map(async (page) => {
        const fileKey = `bg_file_${page.id}`;
        const file = formData.get(fileKey) as File | null;

        if (file && file.size > 0) {
          const imageUrl = await saveFileLocally(file);
          return { ...page, backgroundImage: imageUrl };
        }

        return page;
      })
    );

    // 3. Update database
    const [updatedTemplate] = await db
      .update(certificateTemplates)
      .set({
        pages: updatedPages,
        updatedAt: new Date(),
      })
      .where(eq(certificateTemplates.id, templateId))
      .returning();

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus template
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId wajib diisi" },
        { status: 400 }
      );
    }

    await db
      .delete(certificateTemplates)
      .where(eq(certificateTemplates.id, templateId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}