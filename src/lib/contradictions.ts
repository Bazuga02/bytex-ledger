/**
 * Contradiction Guard — lexicon + confidence scoring.
 * Suggests a category when description tokens strongly imply a different one.
 */

export type CategoryRef = {
  id: string;
  name: string;
  type: string;
};

/** Token → preferred category name (expense unless noted). */
const LEXICON: Record<string, string> = {
  // Transport
  uber: "Transport",
  ola: "Transport",
  lyft: "Transport",
  rapido: "Transport",
  metro: "Transport",
  petrol: "Transport",
  diesel: "Transport",
  fuel: "Transport",
  parking: "Transport",
  cab: "Transport",
  auto: "Transport",
  flight: "Transport",
  irctc: "Transport",
  // Food
  swiggy: "Food",
  zomato: "Food",
  starbucks: "Food",
  cafe: "Food",
  coffee: "Food",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  grocery: "Food",
  groceries: "Food",
  mcdonald: "Food",
  mcdonalds: "Food",
  pizza: "Food",
  restaurant: "Food",
  // Rent
  rent: "Rent",
  landlord: "Rent",
  lease: "Rent",
  // Utilities
  electricity: "Utilities",
  waterbill: "Utilities",
  wifi: "Utilities",
  internet: "Utilities",
  broadband: "Utilities",
  gasbill: "Utilities",
  airtel: "Utilities",
  jio: "Utilities",
  // Shopping
  amazon: "Shopping",
  flipkart: "Shopping",
  myntra: "Shopping",
  clothes: "Shopping",
  // Entertainment
  netflix: "Entertainment",
  spotify: "Entertainment",
  movie: "Entertainment",
  cinema: "Entertainment",
  concert: "Entertainment",
  // Health
  pharmacy: "Health",
  hospital: "Health",
  doctor: "Health",
  clinic: "Health",
  medicine: "Health",
  // Income
  salary: "Salary",
  payroll: "Salary",
  stipend: "Salary",
  freelance: "Freelance",
  invoice: "Freelance",
  dividend: "Investments",
  interest: "Investments",
};

const THRESHOLD = 50;

function tokenize(description: string): string[] {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export type ContradictionResult = {
  score: number | null;
  suggestedCategoryId: string | null;
  reason: string | null;
};

export function scoreContradiction(
  description: string,
  selectedCategory: CategoryRef,
  allCategories: CategoryRef[],
): ContradictionResult {
  const tokens = tokenize(description);
  if (tokens.length === 0) {
    return { score: null, suggestedCategoryId: null, reason: null };
  }

  const votes = new Map<string, { count: number; tokens: string[] }>();

  for (const token of tokens) {
    const implied = LEXICON[token];
    if (!implied) continue;
    const entry = votes.get(implied) ?? { count: 0, tokens: [] };
    entry.count += 1;
    entry.tokens.push(token);
    votes.set(implied, entry);
  }

  if (votes.size === 0) {
    return { score: null, suggestedCategoryId: null, reason: null };
  }

  let bestName = "";
  let bestCount = 0;
  let bestTokens: string[] = [];
  for (const [name, data] of votes) {
    if (data.count > bestCount) {
      bestName = name;
      bestCount = data.count;
      bestTokens = data.tokens;
    }
  }

  const suggested = allCategories.find(
    (c) => c.name.toLowerCase() === bestName.toLowerCase(),
  );
  if (!suggested) {
    return { score: null, suggestedCategoryId: null, reason: null };
  }

  // Type mismatch (income category on expense tokens) is a strong signal
  const typeMismatch =
    suggested.type !== selectedCategory.type ? 25 : 0;
  // Single strong token (e.g. "uber") is enough to clear the threshold
  const nameMismatch =
    suggested.id !== selectedCategory.id ? 50 + bestCount * 15 : 0;
  const score = Math.min(100, nameMismatch + typeMismatch);

  if (score < THRESHOLD || suggested.id === selectedCategory.id) {
    return { score: null, suggestedCategoryId: null, reason: null };
  }

  return {
    score,
    suggestedCategoryId: suggested.id,
    reason: `Description mentions "${bestTokens.join(", ")}", which usually maps to ${suggested.name} (not ${selectedCategory.name}).`,
  };
}

export { THRESHOLD as CONTRADICTION_THRESHOLD };
