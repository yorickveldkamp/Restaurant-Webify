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
