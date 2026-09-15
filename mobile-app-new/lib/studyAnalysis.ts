import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { AppState } from "react-native";
import { useEffect } from "react";
import { authService, getAuthToken, getApiBaseUrl } from "./api";
import { trackEvent } from "./analytics";
import {
  transitionSession,
  recordedSeconds,
  closeSegment,
  type TrackedSession,
} from "./studySessionCore";
export type { StudyAnalysis } from "../../lib/study-analysis/engine";

type Checkin = {
  clientId: string;
  sessionId?: string;
  type: string;
  value: number;
  timestamp: number;
};
type Store = { sessions: TrackedSession[]; checkins: Checkin[] };
const ownerKey = "@study-owner-v1";
let serial: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = serial.then(fn, fn);
  serial = run.catch(() => {});
  return run;
}
async function identity() {
  const token = await getAuthToken();
  if (!token) return null;
  const fingerprint = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    token,
  );
  const saved = JSON.parse((await AsyncStorage.getItem(ownerKey)) || "null");
  if (saved?.fingerprint === fingerprint)
    return { userId: saved.userId as string, token };
  const user = await authService.checkAuth();
  if (!user || token !== (await getAuthToken())) return null;
  await AsyncStorage.setItem(
    ownerKey,
    JSON.stringify({ fingerprint, userId: user.id }),
  );
  return { userId: user.id, token };
}
const key = (id: string) => `@study-ledger-v1:${id}`;
async function read(id: string): Promise<Store> {
  return JSON.parse(
    (await AsyncStorage.getItem(key(id))) || '{"sessions":[],"checkins":[]}',
  );
}
async function write(id: string, s: Store) {
  await AsyncStorage.setItem(key(id), JSON.stringify(s));
}
export async function beginStudySession(
  source: "focus" | "exam",
  id: string,
  minutes: number,
  taskId?: string,
  serverSessionId?: string | null,
  recommendationId?: string,
) {
  await locked(async () => {
    const owner = await identity();
    if (!owner) return;
    const store = await read(owner.userId);
    if (store.sessions.some((s) => s.clientId === id)) return;
    const now = Date.now();
    store.sessions = store.sessions.map((s) =>
      s.source === source && !s.endedAt
        ? transitionSession(s, "unknown", now)
        : s,
    );
    store.sessions.push({
      clientId: id,
      source,
      serverSessionId,
      startedAt: now,
      endedAt: null,
      plannedSeconds: Math.round(minutes * 60),
      status: "active",
      segments: [],
      revision: 1,
      openSince: now,
      taskId: validTask(taskId),
      dirty: true,
      recommendationId,
    });
    await write(owner.userId, store);
    if (recommendationId)
      void trackEvent("analysis_session_started", {
        recommendation_id: recommendationId,
      });
  });
  void flushStudyQueue();
}
function validTask(id?: string) {
  return id && !["default", "error"].includes(id) ? id : undefined;
}
export async function changeStudySession(
  source: "focus" | "exam",
  action: "pause" | "resume" | "completed" | "stopped" | "unknown" | "task",
  taskId?: string,
) {
  const result = await locked(async () => {
    const owner = await identity();
    if (!owner) return null;
    const store = await read(owner.userId);
    const idx = store.sessions.findLastIndex(
      (s) => s.source === source && !s.endedAt,
    );
    if (idx < 0) return null;
    const next = transitionSession(
      store.sessions[idx],
      action,
      Date.now(),
      validTask(taskId),
    );
    store.sessions[idx] = next;
    await write(owner.userId, store);
    if (action === "completed" && next.recommendationId)
      void trackEvent("analysis_session_completed", {
        recommendation_id: next.recommendationId,
      });
    return { clientId: next.clientId, seconds: recordedSeconds(next) };
  });
  void flushStudyQueue();
  return result;
}
export async function activeStudySession(source: "focus" | "exam") {
  const owner = await identity();
  if (!owner) return null;
  const store = await read(owner.userId);
  return (
    store.sessions.findLast((s) => s.source === source && !s.endedAt) || null
  );
}
export async function queueStudyCheckin(
  type: string,
  value: number,
  sessionId?: string,
) {
  await locked(async () => {
    const owner = await identity();
    if (!owner) throw new Error("Connexion requise");
    const store = await read(owner.userId);
    const clientId = sessionId ? `${sessionId}:${type}` : Crypto.randomUUID();
    store.checkins = store.checkins.filter((c) => c.clientId !== clientId);
    store.checkins.push({
      clientId,
      sessionId,
      type,
      value,
      timestamp: Date.now(),
    });
    await write(owner.userId, store);
  });
  void flushStudyQueue();
}
let flushing: Promise<number> | null = null;
export function flushStudyQueue(): Promise<number> {
  if (flushing) return flushing;
  flushing = (async () => {
    const owner = await identity();
    if (!owner) return 0;
    const snapshot = await locked(async () => {
      const store = await read(owner.userId),
        now = Date.now();
      store.sessions = store.sessions.map((s) => {
        if (s.endedAt || s.status !== "active") return s;
        const closed = closeSegment(s, now);
        const exhausted = recordedSeconds(closed) >= s.plannedSeconds;
        const expectedEnd =
          (s.openSince ?? now) +
          Math.max(0, s.plannedSeconds - recordedSeconds(s)) * 1000;
        return transitionSession(
          s,
          exhausted && now > expectedEnd + 300000 ? "unknown" : "task",
          now,
          s.taskId,
        );
      });
      await write(owner.userId, store);
      return store;
    });
    const send = async (path: string, body: unknown) => {
      if ((await getAuthToken()) !== owner.token)
        throw new Error("Account changed");
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), 8000);
      try {
        const r = await fetch(`${getApiBaseUrl()}/study-analysis/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${owner.token}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!r.ok) throw new Error(`Sync ${r.status}`);
      } finally {
        clearTimeout(timer);
      }
    };
    for (const s of snapshot.sessions.filter((s) => s.dirty)) {
      const { openSince, taskId, dirty, ...body } = s;
      await send("sessions", body);
      await locked(async () => {
        const latest = await read(owner.userId);
        const row = latest.sessions.find((x) => x.clientId === s.clientId);
        if (row?.revision === s.revision) row.dirty = false;
        latest.sessions = latest.sessions.filter(
          (x) =>
            x.dirty || !x.endedAt || Date.now() - x.endedAt < 30 * 86400000,
        );
        await write(owner.userId, latest);
      });
    }
    for (const c of snapshot.checkins) {
      await send("checkins", c);
      await locked(async () => {
        const latest = await read(owner.userId);
        latest.checkins = latest.checkins.filter(
          (x) => x.clientId !== c.clientId || x.timestamp !== c.timestamp,
        );
        await write(owner.userId, latest);
      });
    }
    const latest = await read(owner.userId);
    return (
      latest.sessions.filter((s) => s.dirty).length + latest.checkins.length
    );
  })()
    .catch((error) => {
      console.warn(
        "[Study] Sync deferred:",
        error instanceof Error ? error.message : "unknown",
      );
      return 1;
    })
    .finally(() => {
      flushing = null;
    });
  return flushing;
}
export function useStudySync() {
  useEffect(() => {
    void flushStudyQueue();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void flushStudyQueue();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void flushStudyQueue();
    }, 60000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
}
