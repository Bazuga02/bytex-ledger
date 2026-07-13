import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

async function seed() {
  // Dynamic import after env is loaded so db client sees DATABASE_URL
  const { db } = await import("./index");
  const { categories } = await import("./schema");

  const SEED_CATEGORIES = [
    { name: "Salary", type: "income", color: "#2F6F4E" },
    { name: "Freelance", type: "income", color: "#3D8B6E" },
    { name: "Investments", type: "income", color: "#1F4D3A" },
    { name: "Other Income", type: "income", color: "#5A9A7A" },
    { name: "Food", type: "expense", color: "#C45C26" },
    { name: "Transport", type: "expense", color: "#2B6CB0" },
    { name: "Rent", type: "expense", color: "#6B4C9A" },
    { name: "Utilities", type: "expense", color: "#0E7490" },
    { name: "Shopping", type: "expense", color: "#B45309" },
    { name: "Entertainment", type: "expense", color: "#BE185D" },
    { name: "Health", type: "expense", color: "#047857" },
    { name: "Other Expense", type: "expense", color: "#57534E" },
  ] as const;

  for (const cat of SEED_CATEGORIES) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, cat.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(categories).values(cat);
      console.log(`Seeded category: ${cat.name}`);
    } else {
      console.log(`Skip existing: ${cat.name}`);
    }
  }
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
