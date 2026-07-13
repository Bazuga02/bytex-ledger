import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { fromZod, jsonError } from "@/lib/api";
import { scoreContradiction } from "@/lib/contradictions";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";
import { formatINR, parseOccurredAt, rupeesToCents } from "@/lib/money";
import {
  largeExpenseThresholdCents,
  notify,
} from "@/lib/notifications";
import { updateTransactionSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const input = updateTransactionSchema.parse(body);

    const [existing] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .limit(1);

    if (!existing) return jsonError("Transaction not found", 404);

    const allCats = await db.select().from(categories);
    const nextType = input.type ?? existing.type;
    const nextCategoryId = input.categoryId ?? existing.categoryId;
    const nextDescription =
      input.description !== undefined
        ? input.description
        : existing.description;

    const selected = allCats.find((c) => c.id === nextCategoryId);
    if (!selected) return jsonError("Category not found", 404);
    if (selected.type !== nextType) {
      return jsonError(
        `Category “${selected.name}” is for ${selected.type}, not ${nextType}`,
      );
    }

    const contradiction = scoreContradiction(
      nextDescription ?? "",
      selected,
      allCats,
    );

    const amountCents =
      input.amount !== undefined
        ? rupeesToCents(input.amount)
        : existing.amountCents;
    const occurredAt =
      input.occurredAt !== undefined
        ? parseOccurredAt(input.occurredAt)
        : existing.occurredAt;

    const [row] = await db
      .update(transactions)
      .set({
        amountCents,
        type: nextType,
        categoryId: nextCategoryId,
        description: nextDescription,
        occurredAt,
        contradictionScore: contradiction.score,
        suggestedCategoryId: contradiction.suggestedCategoryId,
        contradictionReason: contradiction.reason,
      })
      .where(eq(transactions.id, id))
      .returning();

    if (
      nextType === "expense" &&
      amountCents >= largeExpenseThresholdCents() &&
      amountCents !== existing.amountCents
    ) {
      await notify("large_expense", {
        transactionId: row.id,
        formattedAmount: formatINR(amountCents),
        description: row.description,
        category: selected.name,
      });
    }

    if (
      contradiction.suggestedCategoryId &&
      contradiction.score &&
      contradiction.suggestedCategoryId !== existing.suggestedCategoryId
    ) {
      const suggested = allCats.find(
        (c) => c.id === contradiction.suggestedCategoryId,
      );
      await notify("contradiction_flagged", {
        transactionId: row.id,
        description: row.description,
        category: selected.name,
        suggestedCategory: suggested?.name,
        score: contradiction.score,
      });
    }

    return NextResponse.json({ transaction: row });
  } catch (err) {
    if (err instanceof ZodError) return fromZod(err);
    if (err instanceof Error && err.message === "Invalid date") {
      return jsonError("Invalid occurredAt date");
    }
    console.error(err);
    return jsonError("Failed to update transaction", 500);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const [row] = await db
      .update(transactions)
      .set({ deletedAt: new Date() })
      .where(and(eq(transactions.id, id), isNull(transactions.deletedAt)))
      .returning();

    if (!row) return jsonError("Transaction not found", 404);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to delete transaction", 500);
  }
}
