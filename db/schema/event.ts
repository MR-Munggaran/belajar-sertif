import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date"),
  createdBy: uuid("created_by").notNull(),
});
