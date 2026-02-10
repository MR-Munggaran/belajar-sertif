import { db } from "@/db";
import { certificateTemplates } from "@/db/schema/certificateTemplate";
import { eq, and } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import crypto from "crypto";

// --- 1. Tipe Data ---
type CanvasElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
};

// Partial memungkinkan properti opsional untuk update
type UpdateTemplateData = {
  backgroundImage?: string;
  elements?: CanvasElement[];
};

// --- 2. Konfigurasi ---
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- 3. Helper Upload ---
async function saveFileLocally(file: File): Promise<string> {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Ukuran file terlalu besar (Maksimal 5MB).");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // Handle kemungkinan extension undefined
  const extension = file.name.split('.').pop() || "png"; 
  const filename = `${crypto.randomUUID()}.${extension}`;
  
  const uploadDir = path.join(process.cwd(), "public/uploads/certificates");

  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return `/uploads/certificates/${filename}`;
}

// --- 4. Route Handlers ---

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: "Event ID required" }, { status: 400 });
  }

  try {
    const data = await db
      .select()
      .from(certificateTemplates)
      .where(eq(certificateTemplates.eventId, eventId));

    return NextResponse.json(data);
  } catch (error) {
    // Error handling tanpa 'any'
    console.error("Database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Type casting eksplisit (bukan any)
    const eventId = formData.get("eventId") as string;
    const file = formData.get("backgroundImage") as File | null;
    const elementsString = formData.get("elements") as string;

    if (!eventId || !file) {
      return NextResponse.json(
        { error: "Event ID dan Background Image wajib diisi" }, 
        { status: 400 }
      );
    }

    let elements: CanvasElement[] = [];
    if (elementsString) {
      try {
        // JSON.parse mengembalikan 'any', kita cast langsung ke tipe kita
        elements = JSON.parse(elementsString) as CanvasElement[];
      } catch (e) {
        // Variable 'e' di catch block tipe defaultnya adalah unknown
        return NextResponse.json({ error: "Format data elemen tidak valid (Invalid JSON)" }, { status: 400 });
      }
    }

    const imageUrl = await saveFileLocally(file);

    const [template] = await db
      .insert(certificateTemplates)
      .values({
        eventId: eventId,
        backgroundImage: imageUrl,
        elements: elements,
      })
      .returning();

    return NextResponse.json(template);

  } catch (error) {
    // PENANGANAN ERROR TANPA 'ANY'
    let errorMessage = "Gagal memproses data server";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    console.error("Create error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();
    
    const id = formData.get("id") as string;
    const eventId = formData.get("eventId") as string;
    const file = formData.get("backgroundImage") as File | null;
    const elementsString = formData.get("elements") as string;

    if (!id || !eventId) {
      return NextResponse.json({ error: "ID dan Event ID required" }, { status: 400 });
    }

    const updateData: UpdateTemplateData = {};

    if (file && file.size > 0) {
      try {
        const imageUrl = await saveFileLocally(file);
        updateData.backgroundImage = imageUrl;
      } catch (err) {
        // Narrowing tipe error
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Gagal upload file" }, { status: 400 });
      }
    }

    if (elementsString) {
      try {
        updateData.elements = JSON.parse(elementsString) as CanvasElement[];
      } catch (e) {
         return NextResponse.json({ error: "Invalid JSON elements" }, { status: 400 });
      }
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
      return NextResponse.json({ error: "Template tidak ditemukan atau akses ditolak" }, { status: 404 });
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Gagal update data" }, { status: 500 });
  }
}