import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json({ error: message, details }, { status });
}

export function fromZod(error: ZodError) {
  return jsonError("Validation failed", 400, error.flatten());
}
