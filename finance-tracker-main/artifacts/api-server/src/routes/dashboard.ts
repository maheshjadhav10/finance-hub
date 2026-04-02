import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
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

// GET /api/dashboard
router.get("/", async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const all = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of all) {
    const amt = parseFloat(t.amount as string);
    if (t.type === "income") totalIncome += amt;
    else totalExpense += amt;
  }

  const recent = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(sql`${transactionsTable.date} DESC, ${transactionsTable.createdAt} DESC`)
    .limit(5);

  return res.json({
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    balance: Math.round((totalIncome - totalExpense) * 100) / 100,
    recentTransactions: recent.map(mapTransaction),
  });
});

// GET /api/dashboard/monthly
router.get("/monthly", async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const rows = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(transactionsTable.date);

  // Build monthly summary for last 12 months
  const now = new Date();
  const months: { key: string; label: string }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { year: "numeric", month: "short" });
    months.push({ key, label });
  }

  const summary = months.map(({ key, label }) => {
    const matching = rows.filter((r) => r.date.startsWith(key));
    let income = 0;
    let expense = 0;
    for (const t of matching) {
      const amt = parseFloat(t.amount as string);
      if (t.type === "income") income += amt;
      else expense += amt;
    }
    return {
      month: label,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      balance: Math.round((income - expense) * 100) / 100,
    };
  });

  return res.json({ summary });
});

export default router;
