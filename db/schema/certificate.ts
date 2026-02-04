import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  participantId: uuid("participant_id").notNull(),
  templateId: uuid("template_id").notNull(),
  fileUrl: text("file_url"),
});
