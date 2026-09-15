import { prisma } from "@/lib/prisma";
import { buildStudyAnalysis, windowFor, type Segment } from "./engine";

export async function loadStudyAnalysis(
  user: { id: string; createdAt: Date },
  days: number,
  timezone: string,
) {
  const now = Date.now(),
    w = windowFor(now, days, timezone);
  const start = new Date(w.previousStart);
  const [
    sessions,
    tasks,
    subjects,
    checkins,
    oldCheckins,
    habits,
    history,
    legacy,
    firstRecorded,
  ] = await Promise.all([
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        startedAt: {
          gte: new Date(w.previousStart - 7 * 86400000),
          lte: new Date(now),
        },
      },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        subjectId: true,
        completed: true,
        completedAt: true,
        estimatedMinutes: true,
        scheduledFor: true,
      },
    }),
    prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, coefficient: true, deadline: true },
    }),
    prisma.studyCheckIn.findMany({
      where: { userId: user.id, timestamp: { gte: start, lte: new Date(now) } },
    }),
    prisma.behaviorCheckIn.findMany({
      where: { userId: user.id, timestamp: { gte: start, lte: new Date(now) } },
    }),
    prisma.habit.findMany({
      where: { userId: user.id },
      include: {
        entries: { where: { date: { gte: start, lte: new Date(now) } } },
      },
    }),
    prisma.taskHistory.findMany({
      where: { userId: user.id, createdAt: { gte: start, lte: new Date(now) } },
    }),
    prisma.deepWorkSession.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(w.start), lte: new Date(now) },
      },
      select: { id: true },
    }),
    prisma.studySession.findFirst({
      where: { userId: user.id },
      orderBy: { startedAt: "asc" },
      select: { startedAt: true },
    }),
  ]);
  const recorded = new Set(
    sessions.map((s) => s.serverSessionId).filter(Boolean),
  );
  return buildStudyAnalysis({
    now,
    days,
    timezone,
    joinedAt: +user.createdAt,
    collectionStartedAt: firstRecorded ? +firstRecorded.startedAt : null,
    sessions: sessions.map((s) => ({
      ...s,
      startedAt: +s.startedAt,
      segments: s.segments as Segment[],
    })),
    tasks: tasks.map((t) => ({
      ...t,
      completedAt: t.completedAt ? +t.completedAt : null,
      scheduledFor: t.scheduledFor ? +t.scheduledFor : null,
    })),
    subjects: subjects.map((s) => ({
      ...s,
      deadline: s.deadline ? +s.deadline : null,
    })),
    checkins: [...checkins, ...oldCheckins].map((c) => ({
      ...c,
      timestamp: +c.timestamp,
    })),
    habits: habits.map((h) => ({
      ...h,
      createdAt: +h.createdAt,
      entries: h.entries.map((e) => ({
        ...e,
        date: e.date.toISOString().slice(0, 10),
      })),
    })),
    history: history.map((h) => ({
      ...h,
      createdAt: +h.createdAt,
      previousDate: h.previousDate ? +h.previousDate : null,
      nextDate: h.nextDate ? +h.nextDate : null,
    })),
    legacyCount: legacy.filter((s) => !recorded.has(s.id)).length,
  });
}
