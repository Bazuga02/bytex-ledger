import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.type), asc(categories.name));
    return NextResponse.json({ categories: rows });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load categories", 500);
  }
}
