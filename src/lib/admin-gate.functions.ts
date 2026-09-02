import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAdminGateState = createServerFn({ method: "GET" }).handler(async () => {
  const { readGateState } = await import("./admin-gate.server");
  return readGateState();
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ passcode: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { attemptUnlock } = await import("./admin-gate.server");
    return attemptUnlock(data.passcode);
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { clearGate } = await import("./admin-gate.server");
  await clearGate();
  return { ok: true as const };
});
