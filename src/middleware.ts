import { NextRequest, NextResponse } from "next/server";

const COOKIE = "bytex_ledger_auth";

export function middleware(req: NextRequest) {
  const pin = process.env.LEDGER_PIN;
  if (!pin) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const unlocked = req.cookies.get(COOKIE)?.value === "1";
  if (unlocked) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "PIN required", code: "PIN_REQUIRED" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
