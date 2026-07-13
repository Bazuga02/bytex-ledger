/** Money helpers — store integer minor units (paise) to avoid float drift. */

export function rupeesToCents(rupees: number): number {
  return Math.round(rupees * 100);
}

export function centsToRupees(cents: number): number {
  return cents / 100;
}

export function formatINR(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const rupees = abs / 100;
  return (
    sign +
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(rupees)
  );
}

export function parseOccurredAt(value: string): Date {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  return d;
}
