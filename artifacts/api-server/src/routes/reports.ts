import { Router } from "express";
import { db, tempReportsTable, cleanReportsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router = Router();

/* ── Temperature reports ────────────────────────────── */

router.get("/reports/temp", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(tempReportsTable)
      .orderBy(desc(tempReportsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "GET /reports/temp failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/reports/temp", async (req, res) => {
  try {
    const { id, week, paraaf, date, time, rows, overallStatus } = req.body as {
      id: string; week: string; paraaf: string; date: string;
      time: string; rows: unknown; overallStatus: string | null;
    };
    if (!id || !week || !date || !time) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [inserted] = await db
      .insert(tempReportsTable)
      .values({ id, week, paraaf: paraaf ?? "", date, time, rows, overallStatus: overallStatus ?? null })
      .returning();
    res.status(201).json(inserted);
  } catch (err) {
    req.log.error({ err }, "POST /reports/temp failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/reports/temp/:id", async (req, res) => {
  try {
    await db.delete(tempReportsTable).where(eq(tempReportsTable.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "DELETE /reports/temp failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* ── Cleaning reports ───────────────────────────────── */

router.get("/reports/clean", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(cleanReportsTable)
      .orderBy(desc(cleanReportsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "GET /reports/clean failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/reports/clean", async (req, res) => {
  try {
    const { id, freq, datum, door, time, rows, overallStatus } = req.body as {
      id: string; freq: string; datum: string; door: string;
      time: string; rows: unknown; overallStatus: string | null;
    };
    if (!id || !freq || !datum || !time) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [inserted] = await db
      .insert(cleanReportsTable)
      .values({ id, freq, datum, door: door ?? "", time, rows, overallStatus: overallStatus ?? null })
      .returning();
    res.status(201).json(inserted);
  } catch (err) {
    req.log.error({ err }, "POST /reports/clean failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/reports/clean/:id", async (req, res) => {
  try {
    await db.delete(cleanReportsTable).where(eq(cleanReportsTable.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "DELETE /reports/clean failed");
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
