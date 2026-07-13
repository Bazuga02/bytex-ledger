export type Category = {
  id: string;
  name: string;
  type: string;
  color: string;
};

export type LedgerTransaction = {
  id: string;
  amountCents: number;
  type: string;
  categoryId: string;
  description: string;
  occurredAt: string;
  contradictionScore: number | null;
  suggestedCategoryId: string | null;
  contradictionReason: string | null;
  createdAt: string;
  categoryName: string;
  categoryColor: string;
  categoryType: string;
};

export type Summary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  transactionCount: number;
  byCategory: {
    name: string;
    color: string;
    type: string;
    totalCents: number;
  }[];
};

export type ReplayPoint = {
  date: string;
  netCents: number;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  byCategory: Record<string, { color: string; cents: number }>;
};

export type NotificationRow = {
  id: string;
  channel: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
};
