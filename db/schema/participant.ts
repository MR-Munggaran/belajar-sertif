import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  // Removed certificateId - not in your schema
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;