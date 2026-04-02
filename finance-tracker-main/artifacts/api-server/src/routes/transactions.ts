import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth-middleware";

const router: IRouter = Router();

router.use(requireAuth as any);

function mapTransaction(t: any) {
  return {
    id: t.id,
    userId: t.userId,
    amount: parseFloat(t.amount),
    type: t.type,
    category: t.category,
    date: t.date,
    notes: t.notes ?? undefined,
    createdAt: t.createdAt?.toISOString(),
  };
}

// GET /api/transactions/categories — must be before /:id routes
router.get("/categories", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const rows = await db
    .selectDistinct({ category: transactionsTable.category })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(transactionsTable.category);

  return res.json({ categories: rows.map((r) => r.category) });
});

// GET /api/transactions
router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { category, type, dateFrom, dateTo, month } = req.query as Record<string, string>;

  const conditions = [eq(transactionsTable.userId, userId)];

  if (category) conditions.push(eq(transactionsTable.category, category));
  if (type && (type === "income" || type === "expense")) {
    conditions.push(eq(transactionsTable.type, type));
  }
  if (month) {
    // month format: YYYY-MM
    const [year, mon] = month.split("-");
    const from = `${year}-${mon}-01`;
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
    const to = `${year}-${mon}-${String(lastDay).padStart(2, "0")}`;
    conditions.push(gte(transactionsTable.date, from));
    conditions.push(lte(transactionsTable.date, to));
  } else {
    if (dateFrom) conditions.push(gte(transactionsTable.date, dateFrom));
    if (dateTo) conditions.push(lte(transactionsTable.date, dateTo));
  }

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(sql`${transactionsTable.date} DESC, ${transactionsTable.createdAt} DESC`);

  return res.json({ transactions: rows.map(mapTransaction), total: rows.length });
});

// POST /api/transactions
router.post("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { amount, type, category, date, notes } = req.body;

  if (!amount || !type || !category || !date) {
    return res.status(400).json({ error: "amount, type, category, and date are required" });
  }

  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "type must be income or expense" });
  }

  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  const [transaction] = await db
    .insert(transactionsTable)
    .values({ userId, amount: String(parseFloat(amount)), type, category, date, notes: notes || null })
    .returning();

  return res.status(201).json(mapTransaction(transaction));
});

// GET /api/transactions/:id
router.get("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .limit(1);

  if (!transaction) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  return res.json(mapTransaction(transaction));
});

// PUT /api/transactions/:id
router.put("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);
  const { amount, type, category, date, notes } = req.body;

  if (!amount || !type || !category || !date) {
    return res.status(400).json({ error: "amount, type, category, and date are required" });
  }

  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "type must be income or expense" });
  }

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({ amount: String(parseFloat(amount)), type, category, date, notes: notes || null })
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .returning();

  return res.json(mapTransaction(updated));
});

// DELETE /api/transactions/:id
router.delete("/:id", async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params.id);

  const [existing] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  await db
    .delete(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));

  return res.json({ message: "Transaction deleted" });
});

export default router;
