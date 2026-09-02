import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { adminUnlocked?: boolean };

function sessionConfig() {
  const secret =
    process.env["ADMIN_SESSION_SECRET"] ||
    createHash("sha256")
      .update(`zenthi-admin-gate:${process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? ""}`)
      .digest("hex");
  return {
    password: secret,
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

// Reads the passcode with the service-role client; the table is unreadable by anon/authenticated.
async function loadPasscode(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_config")
    .select("passcode")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data?.passcode) return null;
  return data.passcode;
}

export async function readGateState() {
  const session = await useSession<GateSession>(sessionConfig());
  const passcode = await loadPasscode();
  return { configured: !!passcode, unlocked: !!session.data.adminUnlocked };
}

export async function attemptUnlock(passcode: string) {
  const expected = await loadPasscode();
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
