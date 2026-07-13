import { config } from "dotenv";

config({ path: ".env.local" });

async function seedDemo() {
  const { eq, isNull } = await import("drizzle-orm");
  const { db } = await import("./index");
  const { categories, transactions, notifications } = await import("./schema");
  const { scoreContradiction } = await import("../contradictions");

  // Soft-delete existing demo noise
  await db
    .update(transactions)
    .set({ deletedAt: new Date() })
    .where(isNull(transactions.deletedAt));

  // Clear notification log so the UI matches the fresh ledger
  await db.delete(notifications);

  const cats = await db.select().from(categories);
  const byName = (name: string) => {
    const c = cats.find((x) => x.name === name);
    if (!c) throw new Error(`Missing category: ${name}`);
    return c;
  };

  const entries: {
    name: string;
    amountRupees: number;
    type: "income" | "expense";
    description: string;
    dayOffset: number; // days before today (UTC)
    hour: number;
  }[] = [
    {
      name: "Salary",
      amountRupees: 85000,
      type: "income",
      description: "July salary — Globex Corp",
      dayOffset: 12,
      hour: 9,
    },
    {
      name: "Rent",
      amountRupees: 22000,
      type: "expense",
      description: "Apartment rent — July",
      dayOffset: 11,
      hour: 10,
    },
    {
      name: "Utilities",
      amountRupees: 1850,
      type: "expense",
      description: "Electricity + broadband",
      dayOffset: 10,
      hour: 14,
    },
    {
      name: "Food",
      amountRupees: 420,
      type: "expense",
      description: "Groceries — Nature's Basket",
      dayOffset: 8,
      hour: 11,
    },
    {
      name: "Transport",
      amountRupees: 280,
      type: "expense",
      description: "Uber to client office",
      dayOffset: 7,
      hour: 9,
    },
    {
      name: "Freelance",
      amountRupees: 18500,
      type: "income",
      description: "Invoice #2293 — landing page redesign",
      dayOffset: 6,
      hour: 16,
    },
    {
      name: "Food",
      amountRupees: 890,
      type: "expense",
      description: "Team lunch — Cafe Mocha",
      dayOffset: 5,
      hour: 13,
    },
    {
      name: "Entertainment",
      amountRupees: 649,
      type: "expense",
      description: "Movie night — two tickets",
      dayOffset: 4,
      hour: 20,
    },
    {
      name: "Shopping",
      amountRupees: 2499,
      type: "expense",
      description: "Headphones — Amazon",
      dayOffset: 3,
      hour: 15,
    },
    {
      name: "Health",
      amountRupees: 350,
      type: "expense",
      description: "Pharmacy — vitamins",
      dayOffset: 2,
      hour: 18,
    },
    {
      name: "Transport",
      amountRupees: 145,
      type: "expense",
      description: "Metro + auto home",
      dayOffset: 1,
      hour: 19,
    },
    {
      name: "Food",
      amountRupees: 560,
      type: "expense",
      description: "Dinner — Zomato",
      dayOffset: 0,
      hour: 21,
    },
  ];

  const now = new Date();

  for (const entry of entries) {
    const cat = byName(entry.name);
    const occurredAt = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - entry.dayOffset,
        entry.hour,
        15,
        0,
      ),
    );

    const contradiction = scoreContradiction(
      entry.description,
      cat,
      cats,
    );

    await db.insert(transactions).values({
      amountCents: Math.round(entry.amountRupees * 100),
      type: entry.type,
      categoryId: cat.id,
      description: entry.description,
      occurredAt,
      contradictionScore: contradiction.score,
      suggestedCategoryId: contradiction.suggestedCategoryId,
      contradictionReason: contradiction.reason,
    });

    console.log(
      `+ ${entry.type} ${entry.amountRupees} → ${entry.name}: ${entry.description}`,
    );
  }

  console.log(`Seeded ${entries.length} sensible demo transactions.`);
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
