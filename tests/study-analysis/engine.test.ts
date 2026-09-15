import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudyAnalysis,
  unionMilliseconds,
  windowFor,
  disjointSegments,
  type StudyInput,
} from "../../lib/study-analysis/engine";
import {
  sessionSchema,
  checkinSchema,
} from "../../lib/study-analysis/validation";
import { createRequire } from "node:module";
import type { TrackedSession } from "../../mobile-app-new/lib/studySessionCore";
const { transitionSession, recordedSeconds } = createRequire(import.meta.url)(
  "../../mobile-app-new/lib/studySessionCore",
) as typeof import("../../mobile-app-new/lib/studySessionCore");
const now = Date.parse("2026-09-15T16:00:00Z");
function fixture(): StudyInput {
  return {
    now,
    days: 7,
    timezone: "America/Toronto",
    joinedAt: now - 40 * 86400000,
    sessions: [],
    legacyCount: 0,
    tasks: [],
    subjects: [],
    checkins: [],
    habits: [],
    history: [],
  };
}
function tracked(): TrackedSession {
  return {
    clientId: "test",
    source: "focus",
    startedAt: now - 3600000,
    endedAt: null,
    plannedSeconds: 1500,
    status: "active",
    segments: [],
    revision: 1,
    dirty: true,
    openSince: now - 3600000,
  };
}
test("empty account has no fabricated time, moods, completion or comparison", () => {
  const a = buildStudyAnalysis(fixture());
  assert.equal(a.summary.seconds, 0);
  assert.equal(a.summary.activeDays, 0);
  assert.equal(a.summary.previousSeconds, null);
  assert.equal(a.moods[0].average, null);
  assert.equal(a.facts[0].kind, "start");
});
test("25 minutes remains 1500 seconds and overlaps never double count", () => {
  const f = fixture();
  f.sessions = [
    {
      clientId: "1",
      source: "focus",
      startedAt: now - 1800000,
      status: "completed",
      plannedSeconds: 1500,
      segments: [{ start: now - 1800000, end: now - 300000 }],
    },
  ];
  assert.equal(buildStudyAnalysis(f).summary.seconds, 1500);
  f.sessions.push({ ...f.sessions[0], clientId: "2" });
  assert.equal(buildStudyAnalysis(f).summary.seconds, 1500);
});
test("union clips boundaries", () =>
  assert.equal(
    unionMilliseconds(
      [
        { start: 0, end: 100 },
        { start: 50, end: 200 },
        { start: 300, end: 400 },
      ],
      75,
      350,
    ),
    175,
  ));
test("overlapping different tasks cannot inflate subject totals", () => {
  const s = disjointSegments([
    { start: 0, end: 100, taskId: "a" },
    { start: 50, end: 150, taskId: "b" },
  ]);
  assert.deepEqual(s, [
    { start: 0, end: 50, taskId: "a" },
    { start: 50, end: 100 },
    { start: 100, end: 150, taskId: "b" },
  ]);
});
test("midnight is split in user timezone", () => {
  const f = fixture();
  f.sessions = [
    {
      clientId: "1",
      source: "exam",
      startedAt: Date.parse("2026-09-15T03:50:00Z"),
      status: "completed",
      plannedSeconds: 1200,
      segments: [
        {
          start: Date.parse("2026-09-15T03:50:00Z"),
          end: Date.parse("2026-09-15T04:10:00Z"),
        },
      ],
    },
  ];
  const a = buildStudyAnalysis(f);
  assert.equal(a.daily.at(-1)?.seconds, 600);
  assert.equal(a.daily.at(-2)?.seconds, 600);
});
test("DST windows use local midnight and local comparable time", () => {
  const w = windowFor(Date.parse("2026-03-09T16:00:00Z"), 7, "America/Toronto");
  assert.equal(new Date(w.start).toISOString(), "2026-03-03T05:00:00.000Z");
  assert.equal(
    new Date(w.previousEnd).toISOString(),
    "2026-03-02T17:00:00.000Z",
  );
});
test("old completed tasks stay undated and are excluded from period completions", () => {
  const f = fixture();
  f.tasks = [
    {
      id: "t",
      title: "Old",
      subjectId: null,
      completed: true,
      completedAt: null,
      estimatedMinutes: null,
      scheduledFor: null,
    },
  ];
  assert.equal(buildStudyAnalysis(f).summary.completedTasks, 0);
  assert.equal(buildStudyAnalysis(f).coverage.unknownCompletions, 1);
});
test("habit does not accrue missed days before creation", () => {
  const f = fixture();
  f.habits = [
    {
      id: "h",
      name: "Read",
      createdAt: now - 86400000,
      daysOfWeek: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      entries: [{ date: "2026-09-15", completed: true }],
    },
  ];
  assert.equal(buildStudyAnalysis(f).habits[0].expected, 2);
  assert.equal(buildStudyAnalysis(f).habits[0].percent, 50);
});
test("missing mood day remains null, zero is never substituted", () => {
  const f = fixture();
  f.checkins = [{ type: "mood", value: 8, timestamp: now - 1000 }];
  const a = buildStudyAnalysis(f);
  assert.equal(a.moods.find((m) => m.type === "mood")?.daily[0].value, null);
  assert.equal(a.moods.find((m) => m.type === "mood")?.average, 8);
});
test("partial account does not compare against before registration", () => {
  const f = fixture();
  f.joinedAt = now - 86400000;
  const a = buildStudyAnalysis(f);
  assert.equal(a.coverage.partial, true);
  assert.equal(a.coverage.comparisonAvailable, false);
});
test("stopped sessions contribute actual time", () => {
  let s = tracked();
  s = transitionSession(s, "stopped", s.startedAt + 600000);
  assert.equal(recordedSeconds(s), 600);
  assert.equal(s.status, "stopped");
});
test("pause and restart excludes paused time and terminal transitions are idempotent", () => {
  let s = tracked();
  const t = s.startedAt;
  s = transitionSession(s, "pause", t + 300000);
  s = transitionSession(s, "resume", t + 600000);
  s = transitionSession(s, "completed", t + 900000);
  assert.equal(recordedSeconds(s), 600);
  assert.deepEqual(transitionSession(s, "completed", t + 1000000), s);
});
test("restored timer never counts beyond planned duration", () => {
  const s = transitionSession(tracked(), "unknown", now);
  assert.equal(recordedSeconds(s), 1500);
});
test("task switches split time attribution", () => {
  let s = { ...tracked(), taskId: "a" };
  const t = s.startedAt;
  s = transitionSession(s, "task", t + 100000, "b") as typeof s;
  s = transitionSession(s, "stopped", t + 200000) as typeof s;
  assert.equal(s.segments[0].taskId, "a");
  assert.equal(s.segments[1].taskId, "b");
});
test("session validation rejects impossible time, overlaps and extra fields", () => {
  const { dirty, openSince, taskId, ...s } = transitionSession(
    {
      ...tracked(),
      startedAt: Date.now() - 3600000,
      openSince: Date.now() - 3600000,
    },
    "completed",
    Date.now(),
  );
  assert.equal(sessionSchema.safeParse(s).success, true);
  assert.equal(
    sessionSchema.safeParse({
      ...s,
      segments: [
        { start: s.startedAt, end: now },
        { start: s.startedAt, end: now },
      ],
    }).success,
    false,
  );
  assert.equal(
    sessionSchema.safeParse({ ...s, userId: "other" }).success,
    false,
  );
  assert.equal(sessionSchema.safeParse({ ...s, endedAt: null }).success, false);
});
test("check-in validation rejects out-of-scale, fractional and unknown types", () => {
  const c = {
    clientId: "c",
    type: "mood",
    value: 8,
    timestamp: Date.now() - 1000,
  };
  assert.equal(checkinSchema.safeParse(c).success, true);
  for (const value of [0, 11, 2.5, "8"])
    assert.equal(checkinSchema.safeParse({ ...c, value }).success, false);
  assert.equal(
    checkinSchema.safeParse({ ...c, type: "diagnosis" }).success,
    false,
  );
});
test("no time pattern from insufficient observations", () => {
  const f = fixture();
  f.sessions = [
    {
      clientId: "1",
      source: "focus",
      startedAt: now - 100000,
      status: "completed",
      plannedSeconds: 60,
      segments: [],
    },
  ];
  assert.equal(
    buildStudyAnalysis(f).timePatterns.some((g) => g.available),
    false,
  );
  assert.equal(buildStudyAnalysis(f).moodAssociation.available, false);
});
test("known subject deadline provides actionable evidence without claiming mastery", () => {
  const f = fixture();
  f.subjects = [
    { id: "s", name: "Bio", coefficient: 2, deadline: now + 86400000 },
  ];
  f.tasks = [
    {
      id: "t",
      title: "Chapter",
      subjectId: "s",
      completed: false,
      completedAt: null,
      estimatedMinutes: 25,
      scheduledFor: null,
    },
  ];
  const a = buildStudyAnalysis(f);
  assert.equal(a.facts[0].kind, "deadline");
  assert.equal(a.facts[0].taskId, "t");
  assert.equal(a.subjects[0].nextTaskTitle, "Chapter");
});

test("frequent checkpoints stay compact and preserve the duration cap", () => {
  let s = { ...tracked(), plannedSeconds: 86400 };
  for (let i = 1; i <= 2000; i++)
    s = transitionSession(s, "task", s.startedAt + i * 60000);
  s = transitionSession(s, "completed", s.startedAt + 2000 * 60000);
  assert.equal(s.segments.length, 1);
  assert.equal(recordedSeconds(s), 86400);
});

test("an old account with newly instrumented sessions has no invented comparison", () => {
  const f = fixture();
  f.collectionStartedAt = now - 8 * 86400000;
  assert.equal(buildStudyAnalysis(f).summary.previousSeconds, null);
  f.collectionStartedAt = now - 30 * 86400000;
  assert.equal(buildStudyAnalysis(f).summary.previousSeconds, 0);
});
