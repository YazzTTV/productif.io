export type StudySegment = { start: number; end: number; taskId?: string };
export type TrackedSession = {
  clientId: string;
  source: "focus" | "exam";
  serverSessionId?: string | null;
  startedAt: number;
  endedAt: number | null;
  plannedSeconds: number;
  status: "active" | "paused" | "completed" | "stopped" | "unknown";
  segments: StudySegment[];
  revision: number;
  recommendationId?: string;
  openSince?: number;
  taskId?: string;
  dirty: boolean;
};
export function closeSegment(s: TrackedSession, now: number): TrackedSession {
  const used = s.segments.reduce((a, x) => a + x.end - x.start, 0);
  const end = Math.min(
    now,
    (s.openSince ?? now) + Math.max(0, s.plannedSeconds * 1000 - used),
  );
  const segments = [...s.segments];
  if (s.openSince !== undefined && end > s.openSince) {
    const last = segments.at(-1);
    // Foreground checkpoints must not grow the payload every minute.
    if (last && last.end === s.openSince && last.taskId === s.taskId)
      segments[segments.length - 1] = { ...last, end };
    else
      segments.push({
        start: s.openSince,
        end,
        ...(s.taskId ? { taskId: s.taskId } : {}),
      });
  }
  return { ...s, segments, openSince: undefined };
}
export function transitionSession(
  s: TrackedSession,
  action: "pause" | "resume" | "completed" | "stopped" | "unknown" | "task",
  now: number,
  taskId?: string,
): TrackedSession {
  if (["completed", "stopped", "unknown"].includes(s.status)) return s;
  let next = closeSegment(s, now);
  if (action === "resume") next = { ...next, status: "active", openSince: now };
  else if (action === "pause") next.status = "paused";
  else if (action === "task")
    next = {
      ...next,
      taskId,
      openSince: s.status === "active" ? now : undefined,
    };
  else
    next = {
      ...next,
      status: action,
      endedAt: Math.max(now, next.segments.at(-1)?.end ?? s.startedAt),
    };
  return { ...next, revision: s.revision + 1, dirty: true };
}
export function recordedSeconds(s: TrackedSession) {
  return Math.round(s.segments.reduce((a, x) => a + x.end - x.start, 0) / 1000);
}
