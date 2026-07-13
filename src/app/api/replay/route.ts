import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { categories, transactions } from "@/lib/db/schema";

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const now = new Date();
    const defaultFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const from = searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : defaultFrom;
    const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;

    const rows = await db
      .select({
        amountCents: transactions.amountCents,
        type: transactions.type,
        occurredAt: transactions.occurredAt,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          isNull(transactions.deletedAt),
          gte(transactions.occurredAt, from),
          lte(transactions.occurredAt, to),
        ),
      )
      .orderBy(asc(transactions.occurredAt));

    // Build contiguous daily series
    const start = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
    );
    const end = new Date(
      Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()),
    );

    const byDay = new Map<
      string,
      {
        netCents: number;
        incomeCents: number;
        expenseCents: number;
        byCategory: Record<string, { color: string; cents: number }>;
      }
    >();

    for (
      let d = new Date(start);
      d <= end;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      byDay.set(dayKey(d), {
        netCents: 0,
        incomeCents: 0,
        expenseCents: 0,
        byCategory: {},
      });
    }

    for (const row of rows) {
      const key = dayKey(new Date(row.occurredAt));
      const bucket = byDay.get(key);
      if (!bucket) continue;
      if (row.type === "income") {
        bucket.incomeCents += row.amountCents;
        bucket.netCents += row.amountCents;
      } else {
        bucket.expenseCents += row.amountCents;
        bucket.netCents -= row.amountCents;
      }
      const cat = bucket.byCategory[row.categoryName] ?? {
        color: row.categoryColor,
        cents: 0,
      };
      cat.cents += row.amountCents;
      bucket.byCategory[row.categoryName] = cat;
    }

    let running = 0;
    let maxSwing = 0;
    let spikeDay: string | null = null;
    const points = Array.from(byDay.entries()).map(([date, data]) => {
      running += data.netCents;
      const swing = Math.abs(data.netCents);
      if (swing > maxSwing) {
        maxSwing = swing;
        spikeDay = date;
      }
      return {
        date,
        netCents: data.netCents,
        incomeCents: data.incomeCents,
        expenseCents: data.expenseCents,
        balanceCents: running,
        byCategory: data.byCategory,
      };
    });

    return NextResponse.json({
      from: dayKey(start),
      to: dayKey(end),
      spikeDay,
      points,
    });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load replay data", 500);
  }
}
