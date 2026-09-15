import { z } from "zod";

const stamp = z
  .number()
  .int()
  .min(Date.UTC(2020, 0, 1))
  .refine((n) => n <= Date.now() + 300_000, "Future timestamp");
export const segmentSchema = z
  .object({ start: stamp, end: stamp, taskId: z.string().max(120).optional() })
  .strict();
export const sessionSchema = z
  .object({
    clientId: z.string().min(1).max(120),
    source: z.enum(["focus", "exam"]),
    serverSessionId: z.string().max(120).nullable().optional(),
    startedAt: stamp,
    endedAt: stamp.nullable(),
    plannedSeconds: z.number().int().min(60).max(86400),
    status: z.enum(["active", "paused", "completed", "stopped", "unknown"]),
    segments: z.array(segmentSchema).max(1000),
    revision: z.number().int().min(1).max(1000000),
    recommendationId: z.string().max(120).nullable().optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    let end = s.startedAt;
    for (const x of s.segments) {
      if (
        x.start < end ||
        x.end <= x.start ||
        x.end > (s.endedAt ?? Date.now() + 300000)
      )
        ctx.addIssue({
          code: "custom",
          message: "Invalid or overlapping segments",
        });
      end = x.end;
    }
    if (
      (s.endedAt !== null &&
        (s.endedAt < end || s.endedAt - s.startedAt > 7 * 86400000)) ||
      (["completed", "stopped", "unknown"].includes(s.status) &&
        s.endedAt === null)
    )
      ctx.addIssue({ code: "custom", message: "Invalid session end" });
    if (
      s.segments.reduce((n, x) => n + x.end - x.start, 0) >
      s.plannedSeconds * 1000 + 2000
    )
      ctx.addIssue({
        code: "custom",
        message: "Active duration exceeds planned duration",
      });
  });
export const checkinSchema = z
  .object({
    clientId: z.string().min(1).max(120),
    sessionId: z.string().max(120).optional(),
    type: z.enum(["focus", "mood", "stress", "energy", "motivation"]),
    value: z.number().int().min(1).max(10),
    timestamp: stamp,
  })
  .strict();
export function validTimezone(input: string | null): string {
  const zone = input || "UTC";
  new Intl.DateTimeFormat("en", { timeZone: zone }).format();
  return zone;
}
