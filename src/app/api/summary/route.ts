import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [isNull(transactions.deletedAt)];
    if (from) conditions.push(gte(transactions.occurredAt, new Date(from)));
    if (to) conditions.push(lte(transactions.occurredAt, new Date(to)));

    const rows = await db
      .select({
        amountCents: transactions.amountCents,
        type: transactions.type,
        categoryId: transactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions));

    let incomeCents = 0;
    let expenseCents = 0;
    const byCategory = new Map<
      string,
      { name: string; color: string; type: string; totalCents: number }
    >();

    for (const row of rows) {
      if (row.type === "income") incomeCents += row.amountCents;
      else expenseCents += row.amountCents;

      const prev = byCategory.get(row.categoryId) ?? {
        name: row.categoryName,
        color: row.categoryColor,
        type: row.type,
        totalCents: 0,
      };
      prev.totalCents += row.amountCents;
      byCategory.set(row.categoryId, prev);
    }

    return NextResponse.json({
      summary: {
        incomeCents,
        expenseCents,
        balanceCents: incomeCents - expenseCents,
        transactionCount: rows.length,
        byCategory: Array.from(byCategory.values()).sort(
          (a, b) => b.totalCents - a.totalCents,
        ),
      },
    });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load summary", 500);
  }
}
