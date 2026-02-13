import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";

// 1. Definisi Position
export type Position = {
  x: number;
  y: number;
};

// 2. Definisi Style Element
export type ElementStyle = {
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  underline: boolean;
  color: string;
  textAlign: "left" | "center" | "right";
};

// 3. Struktur Element
export type CertificateElement = {
  id: string;
  type: "static" | "field"; // Text biasa atau variabel (nama, no sertifikat)
  label?: string; // e.g., "no_sert" (untuk identifikasi mudah)
  field?: string; // e.g., "participant.name", "certificate.number", "certificate.date"
  content: string; // Text yang tampil
  position: Position; // Grouping posisi
  style: ElementStyle; // Grouping style
  rotation?: number;
  width?: number;
  height?: number;
};

// 4. Struktur Page (Setiap page punya background sendiri)
export type CertificatePage = {
  id: string;
  pageNumber: number;
  backgroundImage: string | null; // URL Background per halaman
  elements: CertificateElement[];
};

// 5. Tabel Database
export const certificateTemplates = pgTable("certificate_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  // Simpan sebagai array of pages agar urutan halaman terjaga
  pages: jsonb("pages").$type<CertificatePage[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type NewCertificateTemplate = typeof certificateTemplates.$inferInsert;