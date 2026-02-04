import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const participants = pgTable("participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
});
