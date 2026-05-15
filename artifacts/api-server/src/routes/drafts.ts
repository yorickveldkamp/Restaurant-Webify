import { Router } from "express";
import { db, draftsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/drafts", async (req, res) => {
  try {
    const rows = await db.select().from(draftsTable);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "GET /drafts failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/drafts/:key", async (req, res) => {
  try {
    const key = String(req.params.key);
    const [row] = await db.select().from(draftsTable).where(eq(draftsTable.key, key));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "GET /drafts/:key failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.put("/drafts/:key", async (req, res) => {
  try {
    const key = String(req.params.key);
    const { data, updatedBy } = req.body as { data: unknown; updatedBy?: string };
    if (data === undefined || data === null) { res.status(400).json({ error: "Missing data" }); return; }
    const [row] = await db
      .insert(draftsTable)
      .values({ key, data, updatedBy: updatedBy ?? "", updatedAt: new Date() })
      .onConflictDoUpdate({
        target: draftsTable.key,
        set: { data, updatedBy: updatedBy ?? "", updatedAt: new Date() },
      })
      .returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "PUT /drafts/:key failed");
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/drafts/:key", async (req, res) => {
  try {
    await db.delete(draftsTable).where(eq(draftsTable.key, String(req.params.key)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "DELETE /drafts/:key failed");
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
