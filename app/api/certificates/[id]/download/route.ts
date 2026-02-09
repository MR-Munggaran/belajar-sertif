import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: { id?: string } } 
) {
  if (!params.id) {
    return new Response("Certificate ID is required", { status: 400 });
  }

  const certId = params.id;

  const [cert] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, certId));

  if (!cert) {
    return new Response("Certificate not found", { status: 404 });
  }

    if (!cert.fileUrl) {
    return new Response("Certificate file not available", { status: 404 });
    }

    const filePath = path.join(
    process.cwd(),
    "public",
    cert.fileUrl
    );


  if (!fs.existsSync(filePath)) {
    return new Response("PDF not generated yet", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${certId}.pdf"`,
    },
  });
}
