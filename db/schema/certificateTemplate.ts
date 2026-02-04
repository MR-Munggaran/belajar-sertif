import { pgTable, uuid, jsonb, text } from "drizzle-orm/pg-core";

export const certificateTemplates = pgTable("certificate_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  backgroundImage: text("background_image").notNull(),
  elements: jsonb("elements").$type<{
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
  }[]>(),

});
