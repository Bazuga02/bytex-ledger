import { z } from "zod";

export const transactionTypeSchema = z.enum(["income", "expense"]);

export const createTransactionSchema = z.object({
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than zero")
    .finite(),
  type: transactionTypeSchema,
  categoryId: z.string().uuid("Invalid category"),
  description: z.string().max(500).default(""),
  occurredAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
