import { db } from "@/db";
import { certificates } from "@/db/schema/certificate";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const certId = params.id;

  // Cek apakah sertifikat ada
  const [cert] = await db
    .select()
    .from(certificates)
    .where(eq(certificates.id, certId));

  if (!cert) {
    return new Response("Certificate not found", { status: 404 });
  }

  // Redirect user ke halaman view untuk dirender oleh React Canvas
  // Gunakan URL absolut atau relative path
  return redirect(`/certificates/${certId}/view`);
}