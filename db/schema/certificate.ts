import { pgTable, uuid, varchar, jsonb } from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id").notNull(),
  templateId: uuid("template_id").notNull(),
  fileUrl: varchar("file_url", { length: 500 }),
  
  // NEW: Menyimpan page IDs yang di-generate untuk certificate ini
  // Format: ["page_1", "page_2"] atau null (berarti semua pages)
  generatedPageIds: jsonb("generated_page_ids").$type<string[] | null>().default(null),
});

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;