import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jsonError } from "@/lib/api";

const COOKIE = "bytex_ledger_auth";

export async function GET() {
  const pin = process.env.LEDGER_PIN;
  if (!pin) {
    return NextResponse.json({ required: false, unlocked: true });
  }
  const jar = await cookies();
  const unlocked = jar.get(COOKIE)?.value === "1";
  return NextResponse.json({ required: true, unlocked });
}

export async function POST(req: NextRequest) {
  const pin = process.env.LEDGER_PIN;
  if (!pin) {
    return NextResponse.json({ ok: true, required: false });
  }
  const body = await req.json().catch(() => ({}));
  if (String(body.pin ?? "") !== pin) {
    return jsonError("Incorrect PIN", 401);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
