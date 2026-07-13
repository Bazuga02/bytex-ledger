import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { listNotifications, notify } from "@/lib/notifications";

export async function GET() {
  try {
    const rows = await listNotifications(40);
    return NextResponse.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    return jsonError("Failed to load notifications", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await notify("test", {
      message: body.message ?? "Manual test from Bytex Ledger",
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return jsonError("Failed to send test notification", 500);
  }
}
