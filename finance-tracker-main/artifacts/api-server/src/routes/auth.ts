import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

function setSessionCookie(res: any, token: string) {
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
  });
}

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (existing.length > 0) {
    return res.status(400).json({ error: "Username already taken" });
  }

  const existingEmail = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existingEmail.length > 0) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({ username, email, passwordHash })
    .returning();

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessionsTable).values({
    sessionToken: token,
    userId: user.id,
    expiresAt,
  });

  setSessionCookie(res, token);

  return res.status(201).json({
    user: { id: user.id, username: user.username, email: user.email },
    message: "Registered successfully",
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessionsTable).values({
    sessionToken: token,
    userId: user.id,
    expiresAt,
  });

  setSessionCookie(res, token);

  return res.json({
    user: { id: user.id, username: user.username, email: user.email },
    message: "Logged in successfully",
  });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies?.session_token;

  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, token));
    res.clearCookie("session_token");
  }

  return res.json({ message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.session_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.sessionToken, token))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.delete(sessionsTable).where(eq(sessionsTable.sessionToken, token));
    }
    res.clearCookie("session_token");
    return res.status(401).json({ error: "Session expired" });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  return res.json({ id: user.id, username: user.username, email: user.email });
});

export default router;
