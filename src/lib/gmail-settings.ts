import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";

export type GmailConfig = {
  user: string;
  appPassword: string;
  notifyTo: string;
  source: "ui" | "env" | "none";
};

const KEYS = {
  user: "gmail_user",
  password: "gmail_app_password",
  notifyTo: "notify_email_to",
} as const;

async function readSettingMap(): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(settings)
    .where(inArray(settings.key, Object.values(KEYS)));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getGmailConfig(): Promise<GmailConfig> {
  const map = await readSettingMap();
  const uiUser = map[KEYS.user]?.trim() ?? "";
  const uiPass = map[KEYS.password]?.trim() ?? "";
  const uiTo = map[KEYS.notifyTo]?.trim() ?? "";

  if (uiUser && uiPass && uiTo) {
    return {
      user: uiUser,
      appPassword: uiPass,
      notifyTo: uiTo,
      source: "ui",
    };
  }

  const envUser = process.env.GMAIL_USER?.trim() ?? "";
  const envPass = process.env.GMAIL_APP_PASSWORD?.trim() ?? "";
  const envTo = process.env.NOTIFY_EMAIL_TO?.trim() ?? "";

  if (envUser && envPass && envTo) {
    return {
      user: envUser,
      appPassword: envPass,
      notifyTo: envTo,
      source: "env",
    };
  }

  return { user: "", appPassword: "", notifyTo: "", source: "none" };
}

export async function getGmailPublicStatus() {
  const config = await getGmailConfig();
  const map = await readSettingMap();
  return {
    configured: config.source !== "none",
    source: config.source,
    user: map[KEYS.user] || (config.source === "env" ? config.user : ""),
    notifyTo:
      map[KEYS.notifyTo] || (config.source === "env" ? config.notifyTo : ""),
    hasPassword: Boolean(
      map[KEYS.password] || (config.source === "env" && config.appPassword),
    ),
    envFallback: config.source === "env",
  };
}

async function upsertSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function saveGmailConfig(input: {
  user: string;
  appPassword: string;
  notifyTo: string;
  clearPassword?: boolean;
}) {
  const user = input.user.trim();
  const notifyTo = input.notifyTo.trim();
  const password = input.appPassword.trim();

  await upsertSetting(KEYS.user, user);
  await upsertSetting(KEYS.notifyTo, notifyTo);

  if (input.clearPassword) {
    await upsertSetting(KEYS.password, "");
  } else if (password) {
    await upsertSetting(KEYS.password, password);
  }

  return getGmailPublicStatus();
}

export async function clearGmailConfig() {
  for (const key of Object.values(KEYS)) {
    await db.delete(settings).where(eq(settings.key, key));
  }
  return getGmailPublicStatus();
}
