import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { adminUnlocked?: boolean };

function sessionConfig() {
  return {
    password: process.env["ADMIN_SESSION_SECRET"]!,
    name: "zenthi-admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function passcodeMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function readGateState() {
  const session = await useSession<GateSession>(sessionConfig());
  return { configured: !!process.env["ADMIN_PASSCODE"], unlocked: !!session.data.adminUnlocked };
}

export async function attemptUnlock(passcode: string) {
  const expected = process.env["ADMIN_PASSCODE"];
  if (!expected) return { ok: false as const, configured: false as const };
  if (!passcodeMatches(passcode, expected)) return { ok: false as const, configured: true as const };
  const session = await useSession<GateSession>(sessionConfig());
  await session.update({ adminUnlocked: true });
  return { ok: true as const, configured: true as const };
}

export async function clearGate() {
  const session = await useSession<GateSession>(sessionConfig());
  await session.clear();
}

export async function requireAdminUnlocked() {
  const session = await useSession<GateSession>(sessionConfig());
  if (!session.data.adminUnlocked) throw new Error("Admin passcode required.");
}
