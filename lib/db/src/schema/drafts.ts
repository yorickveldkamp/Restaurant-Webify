import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const draftsTable = pgTable("drafts", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  updatedBy: text("updated_by").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DraftRow = typeof draftsTable.$inferSelect;
