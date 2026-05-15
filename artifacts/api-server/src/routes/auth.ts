import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function publicUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, username: u.username, displayName: u.displayName, isAdmin: u.isAdmin };
}

/* GET /api/auth/me */
router.get("/auth/me", async (req, res) => {
  if (!req.session?.userId) { res.json({ user: null }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
    res.json({ user: user ? publicUser(user) : null });
  } catch (err) {
    req.log.error({ err }, "GET /auth/me failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* POST /api/auth/login */
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  if (!username || !password) { res.status(400).json({ error: "Gebruikersnaam en wachtwoord vereist" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.toLowerCase().trim()));
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Onjuiste gebruikersnaam of wachtwoord" });
      return;
    }
    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "POST /auth/login failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* POST /api/auth/logout */
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* POST /api/auth/setup — only allowed when no users exist yet (bootstrap) */
router.post("/auth/setup", async (req, res) => {
  try {
    const existing = await db.select().from(usersTable);
    if (existing.length > 0) { res.status(403).json({ error: "Setup al voltooid" }); return; }
    const { username, displayName, password } = req.body as { username: string; displayName: string; password: string };
    if (!username || !displayName || !password) { res.status(400).json({ error: "Alle velden vereist" }); return; }
    if (password.length < 4) { res.status(400).json({ error: "Wachtwoord minimaal 4 tekens" }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ id: uid(), username: username.toLowerCase().trim(), displayName: displayName.trim(), passwordHash, isAdmin: true }).returning();
    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "POST /auth/setup failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* GET /api/auth/users — list all users (admin only) */
router.get("/auth/users", requireAuth, async (req, res) => {
  try {
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
    if (!current?.isAdmin) { res.status(403).json({ error: "Geen toegang" }); return; }
    const users = await db.select().from(usersTable);
    res.json(users.map(publicUser));
  } catch (err) {
    req.log.error({ err }, "GET /auth/users failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* POST /api/auth/users — create user (admin only) */
router.post("/auth/users", requireAuth, async (req, res) => {
  try {
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
    if (!current?.isAdmin) { res.status(403).json({ error: "Geen toegang" }); return; }
    const { username, displayName, password } = req.body as { username: string; displayName: string; password: string };
    if (!username || !displayName || !password) { res.status(400).json({ error: "Alle velden vereist" }); return; }
    if (password.length < 4) { res.status(400).json({ error: "Wachtwoord minimaal 4 tekens" }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ id: uid(), username: username.toLowerCase().trim(), displayName: displayName.trim(), passwordHash, isAdmin: false }).returning();
    res.status(201).json(publicUser(user));
  } catch (err) {
    req.log.error({ err }, "POST /auth/users failed");
    res.status(500).json({ error: "Database error" });
  }
});

/* DELETE /api/auth/users/:id — delete user (admin only, cannot delete self) */
router.delete("/auth/users/:id", requireAuth, async (req, res) => {
  try {
    const [current] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
    if (!current?.isAdmin) { res.status(403).json({ error: "Geen toegang" }); return; }
    if (req.params.id === req.session.userId) { res.status(400).json({ error: "Kan eigen account niet verwijderen" }); return; }
    await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "DELETE /auth/users failed");
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
