import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { notify } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return jsonError("Transaction not found", 404);
    if (!existing.suggestedCategoryId) {
      return jsonError("No suggestion to accept", 400);
    }

    const [suggested] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, existing.suggestedCategoryId))
      .limit(1);

    if (!suggested) return jsonError("Suggested category missing", 404);

    const [row] = await db
      .update(transactions)
      .set({
        categoryId: suggested.id,
        type: suggested.type,
        contradictionScore: null,
        suggestedCategoryId: null,
        contradictionReason: null,
      })
      .where(eq(transactions.id, id))
      .returning();

    await notify("suggestion_accepted", {
      transactionId: row.id,
      description: row.description,
      suggestedCategory: suggested.name,
    });

    return NextResponse.json({ transaction: row });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to accept suggestion", 500);
  }
}
