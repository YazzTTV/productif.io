import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export type Segment = { start: number; end: number; taskId?: string };
export type StudyInput = {
  now: number;
  days: number;
  timezone: string;
  joinedAt: number;
  collectionStartedAt?: number | null;
  sessions: {
    clientId: string;
    source: string;
    startedAt: number;
    status: string;
    segments: Segment[];
    plannedSeconds: number;
  }[];
  legacyCount: number;
  tasks: {
    id: string;
    title: string;
    subjectId: string | null;
    completed: boolean;
    completedAt: number | null;
    estimatedMinutes: number | null;
    scheduledFor: number | null;
  }[];
  subjects: {
    id: string;
    name: string;
    coefficient: number;
    deadline: number | null;
  }[];
  checkins: {
    type: string;
    value: number;
    timestamp: number;
    sessionId?: string | null;
  }[];
  habits: {
    id: string;
    name: string;
    createdAt: number;
    daysOfWeek: string[];
    entries: { date: string; completed: boolean }[];
  }[];
  history: {
    taskId: string;
    kind: string;
    createdAt: number;
    previousDate: number | null;
    nextDate: number | null;
  }[];
};
export function dayShift(key: string, n: number) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}
export function windowFor(now: number, days: number, timezone: string) {
  const today = formatInTimeZone(now, timezone, "yyyy-MM-dd");
  const startKey = dayShift(today, 1 - days),
    previousKey = dayShift(startKey, -days);
  const start = +fromZonedTime(`${startKey}T00:00:00`, timezone);
  const previousStart = +fromZonedTime(`${previousKey}T00:00:00`, timezone);
  // Same local time on the last day of the previous period (not a whole extra day).
  const localTime = formatInTimeZone(now, timezone, "HH:mm:ss.SSS");
  const previousEnd = +fromZonedTime(
    `${dayShift(today, -days)}T${localTime}`,
    timezone,
  );
  return { today, startKey, start, end: now, previousStart, previousEnd };
}
export function unionMilliseconds(
  intervals: Segment[],
  start = -Infinity,
  end = Infinity,
) {
  const sorted = intervals
    .map((s) => ({
      start: Math.max(start, s.start),
      end: Math.min(end, s.end),
    }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
  let total = 0,
    last = -Infinity;
  for (const s of sorted) {
    total += Math.max(0, s.end - Math.max(last, s.start));
    last = Math.max(last, s.end);
  }
  return total;
}
// Split overlapping activity once. Conflicting task attribution remains unassigned.
export function disjointSegments(input: Segment[]): Segment[] {
  const edges = input
    .flatMap((s, id) => [
      { at: s.start, id, start: true },
      { at: s.end, id, start: false },
    ])
    .sort((a, b) => a.at - b.at);
  const active = new Set<number>(),
    result: Segment[] = [];
  let previous = edges[0]?.at ?? 0;
  for (let i = 0; i < edges.length; ) {
    const at = edges[i].at;
    if (at > previous && active.size) {
      const ids = new Set([...active].map((id) => input[id].taskId));
      const taskId = ids.size === 1 ? [...ids][0] : undefined;
      result.push({ start: previous, end: at, ...(taskId ? { taskId } : {}) });
    }
    while (i < edges.length && edges[i].at === at) {
      const e = edges[i++];
      if (e.start) active.add(e.id);
      else active.delete(e.id);
    }
    previous = at;
  }
  return result;
}
export function buildStudyAnalysis(input: StudyInput) {
  const { now, days, timezone, tasks, subjects, checkins, habits, history } =
    input;
  const w = windowFor(now, days, timezone);
  const segments = disjointSegments(input.sessions.flatMap((s) => s.segments));
  const keys = Array.from({ length: days }, (_, i) => dayShift(w.startKey, i));
  const daily = keys.map((date) => {
    const a = +fromZonedTime(`${date}T00:00:00`, timezone),
      b = Math.min(
        now,
        +fromZonedTime(`${dayShift(date, 1)}T00:00:00`, timezone),
      );
    return {
      date,
      seconds: Math.round(unionMilliseconds(segments, a, b) / 1000),
      checkins: checkins.filter((c) => c.timestamp >= a && c.timestamp < b),
    };
  });
  const current = input.sessions.filter(
    (s) => s.startedAt >= w.start && s.startedAt <= now,
  );
  const seconds = Math.round(unionMilliseconds(segments, w.start, now) / 1000);
  const previousSeconds = Math.round(
    unionMilliseconds(segments, w.previousStart, w.previousEnd) / 1000,
  );
  // Registration predates this instrumentation for existing users. A recent
  // first recording must not turn unmeasured history into a zero baseline.
  const collectionStartedAt =
    input.collectionStartedAt ??
    Math.min(...input.sessions.map((s) => s.startedAt));
  const partial = input.joinedAt > w.start || collectionStartedAt > w.start;
  const comparisonAvailable =
    input.joinedAt <= w.previousStart && collectionStartedAt <= w.previousStart;
  const completedTasks = tasks.filter(
    (t) =>
      t.completed &&
      t.completedAt !== null &&
      t.completedAt >= w.start &&
      t.completedAt <= now,
  );
  const subjectRows = subjects
    .map((s) => {
      const list = tasks.filter((t) => t.subjectId === s.id);
      const ids = new Set(list.map((t) => t.id));
      const attributed = segments.filter((x) => x.taskId && ids.has(x.taskId));
      const remaining = list.filter((t) => !t.completed);
      return {
        ...s,
        total: list.length,
        completed: list.filter((t) => t.completed).length,
        remaining: remaining.length,
        seconds: Math.round(unionMilliseconds(attributed, w.start, now) / 1000),
        estimatedRemainingMinutes:
          remaining.length &&
          remaining.every((t) => t.estimatedMinutes !== null)
            ? remaining.reduce((a, t) => a + (t.estimatedMinutes || 0), 0)
            : null,
        nextTaskId: remaining[0]?.id ?? null,
        nextTaskTitle: remaining[0]?.title ?? null,
      };
    })
    .sort(
      (a, b) =>
        (a.deadline ?? Infinity) - (b.deadline ?? Infinity) ||
        b.coefficient - a.coefficient,
    );
  const moods = ["focus", "energy", "mood", "stress", "motivation"].map(
    (type) => {
      const rows = checkins.filter(
        (c) => c.type === type && c.timestamp >= w.start && c.timestamp <= now,
      );
      return {
        type,
        count: rows.length,
        average: rows.length
          ? Math.round(
              (rows.reduce((a, c) => a + c.value, 0) / rows.length) * 10,
            ) / 10
          : null,
        daily: daily.map((d) => {
          const values = d.checkins.filter((c) => c.type === type);
          return {
            date: d.date,
            value: values.length
              ? Math.round(
                  (values.reduce((a, c) => a + c.value, 0) / values.length) *
                    10,
                ) / 10
              : null,
          };
        }),
      };
    },
  );
  const habitRows = habits.map((h) => {
    const due = keys.filter(
      (k) =>
        k >= formatInTimeZone(h.createdAt, timezone, "yyyy-MM-dd") &&
        h.daysOfWeek.includes(
          formatInTimeZone(
            +fromZonedTime(`${k}T12:00:00`, timezone),
            timezone,
            "EEEE",
          ).toLowerCase(),
        ),
    );
    const done = due.filter((k) =>
      h.entries.some((e) => e.date === k && e.completed),
    );
    return {
      id: h.id,
      name: h.name,
      completed: done.length,
      expected: due.length,
      percent: due.length ? Math.round((done.length / due.length) * 100) : null,
    };
  });
  const delayed = tasks
    .filter((t) => !t.completed)
    .map((t) => ({
      ...t,
      reports: history.filter(
        (h) =>
          h.taskId === t.id &&
          h.kind === "scheduled" &&
          h.previousDate !== null &&
          h.nextDate !== null &&
          h.nextDate > h.previousDate &&
          h.createdAt >= w.start,
      ).length,
    }))
    .filter((t) => t.reports >= 2);
  const estimates = tasks
    .filter(
      (t) =>
        t.completed &&
        t.completedAt !== null &&
        t.completedAt >= w.start &&
        t.estimatedMinutes &&
        segments.some((s) => s.taskId === t.id),
    )
    .map((t) => ({
      id: t.id,
      title: t.title,
      estimatedMinutes: t.estimatedMinutes!,
      actualMinutes: Math.round(
        unionMilliseconds(segments.filter((s) => s.taskId === t.id)) / 60000,
      ),
    }));
  // Comparisons use completed observations, show sample sizes and never infer causality.
  const groups = [
    { key: "morning", from: 6, to: 12 },
    { key: "afternoon", from: 12, to: 18 },
    { key: "evening", from: 18, to: 24 },
  ].map((g) => {
    const rows = current.filter((s) => {
      const hour = Number(formatInTimeZone(s.startedAt, timezone, "H"));
      return (
        hour >= g.from &&
        hour < g.to &&
        ["completed", "stopped"].includes(s.status)
      );
    });
    const distinctDays = new Set(
      rows.map((s) => formatInTimeZone(s.startedAt, timezone, "yyyy-MM-dd")),
    ).size;
    return {
      key: g.key,
      count: rows.length,
      days: distinctDays,
      completed: rows.filter((s) => s.status === "completed").length,
      available: rows.length >= 5 && distinctDays >= 3,
    };
  });
  const durationPatterns = [
    { key: "short", min: 0, max: 25 * 60 },
    { key: "medium", min: 25 * 60, max: 45 * 60 },
    { key: "long", min: 45 * 60, max: Infinity },
  ].map((g) => {
    const rows = current.filter(
      (s) =>
        s.plannedSeconds > g.min &&
        s.plannedSeconds <= g.max &&
        ["completed", "stopped"].includes(s.status),
    );
    const distinctDays = new Set(
      rows.map((s) => formatInTimeZone(s.startedAt, timezone, "yyyy-MM-dd")),
    ).size;
    return {
      key: g.key,
      count: rows.length,
      completed: rows.filter((s) => s.status === "completed").length,
      available: rows.length >= 5 && distinctDays >= 3,
    };
  });
  const linked = current
    .filter((s) => ["completed", "stopped"].includes(s.status))
    .flatMap((s) => {
      const focus = checkins.filter(
        (c) => c.sessionId === s.clientId && c.type === "focus",
      );
      const energy = checkins.filter(
        (c) => c.sessionId === s.clientId && c.type === "energy",
      );
      if (!focus.length || !energy.length) return [];
      return [
        {
          day: formatInTimeZone(s.startedAt, timezone, "yyyy-MM-dd"),
          focus: focus[focus.length - 1].value,
          energy: energy[energy.length - 1].value,
        },
      ];
    });
  const high = linked.filter((x) => x.energy >= 7),
    low = linked.filter((x) => x.energy <= 4);
  const distinctLinkedDays = new Set(linked.map((x) => x.day)).size;
  const moodAssociation = {
    count: linked.length,
    days: distinctLinkedDays,
    available:
      linked.length >= 20 &&
      distinctLinkedDays >= 14 &&
      high.length >= 5 &&
      low.length >= 5,
    highCount: high.length,
    lowCount: low.length,
    highFocus: high.length
      ? Math.round((high.reduce((n, x) => n + x.focus, 0) / high.length) * 10) /
        10
      : null,
    lowFocus: low.length
      ? Math.round((low.reduce((n, x) => n + x.focus, 0) / low.length) * 10) /
        10
      : null,
  };
  const facts: {
    id: string;
    kind: string;
    values: Record<string, string | number>;
    taskId?: string;
    action: "focus" | "tasks" | "plan";
  }[] = [];
  const urgent = subjectRows.find(
    (s) =>
      s.remaining > 0 &&
      s.deadline !== null &&
      s.deadline >= now &&
      s.deadline - now <= 14 * 86400000,
  );
  if (urgent)
    facts.push({
      id: `subject-${urgent.id}`,
      kind: "deadline",
      values: {
        name: urgent.name,
        remaining: urgent.remaining,
        date: formatInTimeZone(urgent.deadline!, timezone, "yyyy-MM-dd"),
      },
      taskId: urgent.nextTaskId ?? undefined,
      action: "focus",
    });
  if (delayed.length)
    facts.push({
      id: `report-${delayed[0].id}`,
      kind: "reports",
      values: { title: delayed[0].title, count: delayed[0].reports },
      taskId: delayed[0].id,
      action: "plan",
    });
  const long = current.filter(
    (s) =>
      s.plannedSeconds > 45 * 60 && ["completed", "stopped"].includes(s.status),
  );
  if (
    long.length >= 5 &&
    new Set(
      long.map((s) => formatInTimeZone(s.startedAt, timezone, "yyyy-MM-dd")),
    ).size >= 3 &&
    long.filter((s) => s.status === "stopped").length >= 3
  )
    facts.push({
      id: "shorter-session",
      kind: "duration",
      values: {
        stopped: long.filter((s) => s.status === "stopped").length,
        total: long.length,
      },
      action: "focus",
    });
  if (!facts.length)
    facts.push({
      id: "next-session",
      kind: seconds ? "progress" : "start",
      values: {
        minutes: Math.round(seconds / 60),
        tasks: completedTasks.length,
      },
      action: "focus",
    });
  return {
    version: 1,
    generatedAt: new Date(now).toISOString(),
    timezone,
    days,
    period: { start: w.startKey, end: w.today },
    coverage: {
      partial,
      comparisonAvailable,
      legacySessions: input.legacyCount,
      unknownCompletions: tasks.filter(
        (t) => t.completed && t.completedAt === null,
      ).length,
      checkins: checkins.filter(
        (c) => c.timestamp >= w.start && c.timestamp <= now,
      ).length,
    },
    summary: {
      seconds,
      unassignedSeconds: Math.round(
        unionMilliseconds(
          segments.filter((s) => !s.taskId),
          w.start,
          now,
        ) / 1000,
      ),
      previousSeconds: comparisonAvailable ? previousSeconds : null,
      completedTasks: completedTasks.length,
      activeDays: daily.filter((d) => d.seconds > 0).length,
      sessions: current.length,
      completedSessions: current.filter((s) => s.status === "completed").length,
      stoppedSessions: current.filter((s) => s.status === "stopped").length,
      unknownSessions: current.filter(
        (s) => !["completed", "stopped"].includes(s.status),
      ).length,
    },
    daily: daily.map(({ checkins, ...d }) => d),
    subjects: subjectRows,
    moods,
    habits: habitRows,
    organization: {
      delayed,
      estimates,
      plannedTasks: tasks.filter(
        (t) =>
          t.scheduledFor !== null &&
          t.scheduledFor >= w.start &&
          t.scheduledFor <= now,
      ).length,
      plannedTasksWithSession: tasks.filter(
        (t) =>
          t.scheduledFor !== null &&
          t.scheduledFor >= w.start &&
          t.scheduledFor <= now &&
          segments.some(
            (s) => s.taskId === t.id && s.end > w.start && s.start < now,
          ),
      ).length,
    },
    timePatterns: groups,
    durationPatterns,
    moodAssociation,
    facts: facts.slice(0, 3),
  };
}
export type StudyAnalysis = ReturnType<typeof buildStudyAnalysis>;
