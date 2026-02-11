import { pgTable, uuid, jsonb, text } from "drizzle-orm/pg-core";

export type CertificateElement = {
  id: string;
  type: "static" | "field";
  field?: "participant.name" | "participant.email" | "certificate.number" | "certificate.date"; 
  text?: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string; 
  fontStyle: string;  
  underline: boolean; 
  color: string;
  rotation?: number;
  width?: number;
  height?: number;
};

export const certificateTemplates = pgTable("certificate_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull(),
  backgroundImage: text("background_image").notNull(),
  elements: jsonb("elements").$type<CertificateElement[]>().notNull(),
});