import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tempReportsTable = pgTable("temp_reports", {
  id: text("id").primaryKey(),
  week: text("week").notNull(),
  paraaf: text("paraaf").notNull().default(""),
  date: text("date").notNull(),
  time: text("time").notNull(),
  rows: jsonb("rows").notNull(),
  overallStatus: text("overall_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTempReportSchema = createInsertSchema(tempReportsTable).omit({ createdAt: true });
export type InsertTempReport = z.infer<typeof insertTempReportSchema>;
export type TempReportRow = typeof tempReportsTable.$inferSelect;

export const cleanReportsTable = pgTable("clean_reports", {
  id: text("id").primaryKey(),
  freq: text("freq").notNull(),
  datum: text("datum").notNull(),
  door: text("door").notNull().default(""),
  time: text("time").notNull(),
  rows: jsonb("rows").notNull(),
  overallStatus: text("overall_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCleanReportSchema = createInsertSchema(cleanReportsTable).omit({ createdAt: true });
export type InsertCleanReport = z.infer<typeof insertCleanReportSchema>;
export type CleanReportRow = typeof cleanReportsTable.$inferSelect;

export const deliveryReportsTable = pgTable("delivery_reports", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  supplier: text("supplier").notNull(),
  productType: text("product_type").notNull(),
  temperature: text("temperature").notNull(),
  visualCheck: text("visual_check").notNull(),
  visualNote: text("visual_note").notNull().default(""),
  bbdCheck: text("bbd_check").notNull(),
  employee: text("employee").notNull().default(""),
  rejected: text("rejected").notNull().default("no"),
  overallStatus: text("overall_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDeliveryReportSchema = createInsertSchema(deliveryReportsTable).omit({ createdAt: true });
export type InsertDeliveryReport = z.infer<typeof insertDeliveryReportSchema>;
export type DeliveryReportRow = typeof deliveryReportsTable.$inferSelect;
