import { test, after } from "node:test";
import assert from "node:assert/strict";
// Deliberately refuse every non-local database. No dotenv loading in this test.
const db = process.env.STUDY_TEST_DATABASE_URL;
if (
  !db ||
  !/^postgres(?:ql)?:\/\/[^@]+@127\.0\.0\.1:55439\/productif_study_test(?:\?|$)/.test(
    db,
  )
)
  throw new Error(
    "Set STUDY_TEST_DATABASE_URL to the isolated local test database",
  );
process.env.DATABASE_URL = db;
process.env.JWT_SECRET = "isolated-study-analysis-test-secret";
process.env.OPENAI_API_KEY = "";
const { prisma } = await import("../../lib/prisma");
const { sign } = await import("../../lib/jwt");
const { NextRequest } = await import("next/server");
const sessions = await import("../../app/api/study-analysis/sessions/route");
const checkins = await import("../../app/api/study-analysis/checkins/route");
const analysis = await import("../../app/api/study-analysis/route");
const explain = await import("../../app/api/study-analysis/explain/route");
const now = Date.now();
const user = await prisma.user.create({
  data: {
    name: "Analysis test",
    email: `study-${now}@example.invalid`,
    password: "unused",
    createdAt: new Date(now - 30 * 86400000),
  },
});
const other = await prisma.user.create({
  data: {
    name: "Other",
    email: `other-${now}@example.invalid`,
    password: "unused",
  },
});
const token = await sign({
  userId: user.id,
  email: user.email,
  tokenVersion: 0,
});
const task = await prisma.task.create({
  data: { title: "Only mine", userId: user.id },
});
const foreign = await prisma.task.create({
  data: { title: "Other user", userId: other.id },
});
function req(path: string, body?: unknown, authenticated = true) {
  return new NextRequest(`http://localhost/api/study-analysis${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authenticated ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const sample = {
  clientId: "api-session",
  source: "focus",
  startedAt: now - 1500000,
  endedAt: now,
  plannedSeconds: 1500,
  status: "completed",
  segments: [{ start: now - 1500000, end: now, taskId: task.id }],
  revision: 2,
};
after(async () => {
  await prisma.task.deleteMany({
    where: { userId: { in: [user.id, other.id] } },
  });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
  await prisma.$disconnect();
});
test("unauthenticated read/write rejected", async () => {
  assert.equal((await analysis.GET(req("", undefined, false))).status, 401);
  assert.equal(
    (await sessions.POST(req("/sessions", sample, false))).status,
    401,
  );
});
test("same session sync replay is idempotent and stale writes cannot overwrite", async () => {
  for (let i = 0; i < 2; i++)
    assert.equal((await sessions.POST(req("/sessions", sample))).status, 200);
  await sessions.POST(
    req("/sessions", { ...sample, revision: 1, segments: [] }),
  );
  const rows = await prisma.studySession.findMany({
    where: { userId: user.id },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].revision, 2);
  assert.equal((rows[0].segments as unknown[]).length, 1);
});
test("concurrent first writes keep the latest revision", async () => {
  await Promise.all(
    [1, 3, 2].map((revision) =>
      sessions.POST(
        req("/sessions", { ...sample, clientId: "concurrent", revision }),
      ),
    ),
  );
  assert.equal(
    (
      await prisma.studySession.findUniqueOrThrow({
        where: { userId_clientId: { userId: user.id, clientId: "concurrent" } },
      })
    ).revision,
    3,
  );
});
test("foreign task is never attributed", async () => {
  await sessions.POST(
    req("/sessions", {
      ...sample,
      clientId: "foreign-attribution",
      segments: [{ start: now - 60000, end: now, taskId: foreign.id }],
    }),
  );
  const row = await prisma.studySession.findUniqueOrThrow({
    where: {
      userId_clientId: { userId: user.id, clientId: "foreign-attribution" },
    },
  });
  assert.equal((row.segments as { taskId?: string }[])[0].taskId, undefined);
});
test("foreign server session link rejected", async () => {
  assert.equal(
    (
      await sessions.POST(
        req("/sessions", { ...sample, serverSessionId: "not-owned" }),
      )
    ).status,
    400,
  );
});
test("invalid, demo, future and oversized session data rejected", async () => {
  for (const b of [
    { ...sample, clientId: "exam_demo_1" },
    { ...sample, plannedSeconds: 10 },
    { ...sample, startedAt: Date.now() + 86400000 },
    { ...sample, segments: [{ start: now - 3600000, end: now }] },
  ])
    assert.equal((await sessions.POST(req("/sessions", b))).status, 400);
});
test("check-in must follow its session and repeated rating does not duplicate", async () => {
  const c = {
    clientId: "rating",
    sessionId: "missing",
    type: "focus",
    value: 8,
    timestamp: now,
  };
  assert.equal((await checkins.POST(req("/checkins", c))).status, 409);
  for (const value of [8, 9])
    assert.equal(
      (
        await checkins.POST(
          req("/checkins", { ...c, sessionId: "api-session", value }),
        )
      ).status,
      200,
    );
  const rows = await prisma.studyCheckIn.findMany({
    where: { userId: user.id },
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].value, 9);
});
test("free history access enforced and invalid timezone rejected", async () => {
  assert.equal((await analysis.GET(req("?days=30"))).status, 403);
  assert.equal((await analysis.GET(req("?days=999"))).status, 400);
  assert.equal((await analysis.GET(req("?timezone=not-a-zone"))).status, 400);
});
test("summary uses real data, does not reveal foreign tasks, and deduplicates overlapping clocks", async () => {
  const r = await analysis.GET(req("?days=7&timezone=America%2FToronto"));
  assert.equal(r.status, 200);
  const a = await r.json();
  assert.equal(a.summary.seconds, 1500);
  assert.equal(a.moods.find((m: any) => m.type === "focus").average, 9);
  assert.equal(JSON.stringify(a).includes(foreign.title), false);
});
test("deterministic assistant fallback works without external AI", async () => {
  const r = await explain.POST(
    req("/explain", {
      days: 7,
      timezone: "UTC",
      language: "fr",
      includeJournal: false,
    }),
  );
  assert.equal(r.status, 200);
  const a = await r.json();
  assert.equal(a.generated, false);
  assert.ok(a.response.length);
  assert.ok(a.facts.length);
});
test("stale facts cannot be invented by a client", async () => {
  const r = await explain.POST(
    req("/explain", {
      days: 7,
      timezone: "UTC",
      language: "fr",
      factId: "invented",
    }),
  );
  assert.equal(r.status, 409);
});
