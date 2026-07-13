import nodemailer from "nodemailer";
import { desc } from "drizzle-orm";
import { db } from "./db";
import { notifications } from "./db/schema";
import { getGmailConfig } from "./gmail-settings";

export type NotifyEvent =
  | "large_expense"
  | "contradiction_flagged"
  | "test"
  | "suggestion_accepted";

type NotifyPayload = Record<string, unknown>;

function subjectFor(eventType: NotifyEvent): string {
  switch (eventType) {
    case "large_expense":
      return "Bytex Ledger — Large expense";
    case "contradiction_flagged":
      return "Bytex Ledger — Category contradiction";
    case "suggestion_accepted":
      return "Bytex Ledger — Suggestion accepted";
    case "test":
      return "Bytex Ledger — Test notification";
    default:
      return `Bytex Ledger — ${eventType}`;
  }
}

async function sendGmail(subject: string, text: string): Promise<boolean> {
  const config = await getGmailConfig();
  if (config.source === "none") return false;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });

    await transporter.sendMail({
      from: `Bytex Ledger <${config.user}>`,
      to: config.notifyTo,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error("Gmail send failed:", err);
    return false;
  }
}

function formatMessage(eventType: NotifyEvent, payload: NotifyPayload): string {
  switch (eventType) {
    case "large_expense":
      return `Large expense: ${payload.formattedAmount} — ${payload.description || "(no description)"} [${payload.category}]`;
    case "contradiction_flagged":
      return `Contradiction: "${payload.description}" under ${payload.category} — suggested ${payload.suggestedCategory} (score ${payload.score})`;
    case "suggestion_accepted":
      return `Category corrected to ${payload.suggestedCategory} for "${payload.description}"`;
    case "test":
      return `Bytex Ledger test notification: ${payload.message ?? "ok"}`;
    default:
      return `Bytex Ledger: ${eventType}`;
  }
}

export async function notify(
  eventType: NotifyEvent,
  payload: NotifyPayload,
): Promise<{ channel: string; status: string; id: string }> {
  const message = formatMessage(eventType, payload);
  const config = await getGmailConfig();
  const emailReady = config.source !== "none";
  let channel = "in_app";
  let status = "logged";

  if (emailReady) {
    const ok = await sendGmail(subjectFor(eventType), message);
    channel = "gmail";
    status = ok ? "sent" : "failed";
    if (!ok) {
      await db.insert(notifications).values({
        channel: "in_app",
        eventType,
        payload: { ...payload, message, gmailFailed: true },
        status: "logged",
      });
    }
  }

  const [row] = await db
    .insert(notifications)
    .values({
      channel,
      eventType,
      payload: { ...payload, message },
      status,
    })
    .returning();

  return { channel, status, id: row.id };
}

export async function listNotifications(limit = 30) {
  return db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export function largeExpenseThresholdCents(): number {
  const raw = process.env.LARGE_EXPENSE_THRESHOLD_CENTS;
  const n = raw ? Number(raw) : 100_000;
  return Number.isFinite(n) && n > 0 ? n : 100_000;
}
