import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
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
import { createTransactionSchema } from "@/lib/validations";

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
        id: transactions.id,
        amountCents: transactions.amountCents,
        type: transactions.type,
        categoryId: transactions.categoryId,
        description: transactions.description,
        occurredAt: transactions.occurredAt,
        contradictionScore: transactions.contradictionScore,
        suggestedCategoryId: transactions.suggestedCategoryId,
        contradictionReason: transactions.contradictionReason,
        createdAt: transactions.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryType: categories.type,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.occurredAt), desc(transactions.createdAt));

    return NextResponse.json({ transactions: rows });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load transactions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = createTransactionSchema.parse(body);

    const allCats = await db.select().from(categories);
    const selected = allCats.find((c) => c.id === input.categoryId);
    if (!selected) return jsonError("Category not found", 404);
    if (selected.type !== input.type) {
      return jsonError(
        `Category “${selected.name}” is for ${selected.type}, not ${input.type}`,
      );
    }

    const contradiction = scoreContradiction(
      input.description ?? "",
      selected,
      allCats,
    );

    const amountCents = rupeesToCents(input.amount);
    const occurredAt = parseOccurredAt(input.occurredAt);

    const [row] = await db
      .insert(transactions)
      .values({
        amountCents,
        type: input.type,
        categoryId: input.categoryId,
        description: input.description ?? "",
        occurredAt,
        contradictionScore: contradiction.score,
        suggestedCategoryId: contradiction.suggestedCategoryId,
        contradictionReason: contradiction.reason,
      })
      .returning();

    if (
      input.type === "expense" &&
      amountCents >= largeExpenseThresholdCents()
    ) {
      await notify("large_expense", {
        transactionId: row.id,
        formattedAmount: formatINR(amountCents),
        description: row.description,
        category: selected.name,
      });
    }

    if (contradiction.suggestedCategoryId && contradiction.score) {
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

    return NextResponse.json({ transaction: row }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return fromZod(err);
    if (err instanceof Error && err.message === "Invalid date") {
      return jsonError("Invalid occurredAt date");
    }
    console.error(err);
    return jsonError("Failed to create transaction", 500);
  }
}
