import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fromZod, jsonError } from "@/lib/api";
import {
  clearGmailConfig,
  getGmailPublicStatus,
  saveGmailConfig,
} from "@/lib/gmail-settings";

const saveSchema = z.object({
  user: z.string().email("Enter a valid Gmail address"),
  notifyTo: z.string().email("Enter a valid recipient email"),
  appPassword: z.string().optional().default(""),
  clearPassword: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const status = await getGmailPublicStatus();
    return NextResponse.json({ gmail: status });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load Gmail settings", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const input = saveSchema.parse(body);

    if (!input.appPassword && !input.clearPassword) {
      const current = await getGmailPublicStatus();
      if (!current.hasPassword) {
        return jsonError(
          "App password is required the first time you connect Gmail",
        );
      }
    }

    const status = await saveGmailConfig({
      user: input.user,
      notifyTo: input.notifyTo,
      appPassword: input.appPassword ?? "",
      clearPassword: input.clearPassword,
    });

    return NextResponse.json({ gmail: status, ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return fromZod(err);
    console.error(err);
    return jsonError("Failed to save Gmail settings", 500);
  }
}

export async function DELETE() {
  try {
    const status = await clearGmailConfig();
    return NextResponse.json({ gmail: status, ok: true });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to clear Gmail settings", 500);
  }
}
