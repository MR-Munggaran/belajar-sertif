import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id").notNull(),
  templateId: uuid("template_id").notNull(),
  fileUrl: varchar("file_url", { length: 500 }), // If you have this field
  // Removed eventId, issuedAt, createdAt, updatedAt - not in your schema
});

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;