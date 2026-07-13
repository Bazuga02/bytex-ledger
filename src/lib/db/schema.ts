import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // income | expense
  color: text("color").notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  amountCents: integer("amount_cents").notNull(),
  type: text("type").notNull(), // income | expense
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  description: text("description").notNull().default(""),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  contradictionScore: integer("contradiction_score"),
  suggestedCategoryId: uuid("suggested_category_id").references(
    () => categories.id,
  ),
  contradictionReason: text("contradiction_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  channel: text("channel").notNull(), // gmail | in_app
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull(), // sent | failed | logged
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Key/value app settings (e.g. Gmail SMTP configured from the UI). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
