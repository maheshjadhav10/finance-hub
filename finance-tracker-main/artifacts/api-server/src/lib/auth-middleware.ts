import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
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
    return res.status(401).json({ error: "Session expired or invalid" });
  }

  req.userId = session.userId;
  next();
}
