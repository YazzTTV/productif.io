import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const state = {
  token: "token-a",
  userId: "a",
  online: false,
  storage: new Map<string, string>(),
  sent: [] as { path: string; token: string; body: any }[],
};
(globalThis as any).__studyTest = state;
const dir = await mkdtemp(path.join(tmpdir(), "study-queue-"));
await build({
  entryPoints: ["mobile-app-new/lib/studyAnalysis.ts"],
  outfile: path.join(dir, "queue.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  logLevel: "silent",
  plugins: [
    {
      name: "test-native-adapters",
      setup(b) {
        b.onResolve(
          {
            filter:
              /^(react-native|react|expo-crypto|@react-native-async-storage\/async-storage)$/,
          },
          (args) => ({ path: args.path, namespace: "mock" }),
        );
        b.onResolve({ filter: /^\.\/api$|^\.\/analytics$/ }, (args) => ({
          path: args.path,
          namespace: "mock",
        }));
        b.onLoad({ filter: /.*/, namespace: "mock" }, (args) => {
          const codes: Record<string, string> = {
            react: "export const useEffect=()=>{};",
            "react-native":
              "export const AppState={currentState:'active',addEventListener:()=>({remove(){}})};",
            "expo-crypto":
              "export const CryptoDigestAlgorithm={SHA256:'sha'};export const digestStringAsync=async(_,x)=>x;export const randomUUID=()=>String(Math.random());",
            "@react-native-async-storage/async-storage":
              "const s=globalThis.__studyTest;export default {getItem:async k=>s.storage.get(k)||null,setItem:async(k,v)=>{s.storage.set(k,v)}};",
            "./api":
              "const s=globalThis.__studyTest;export const authService={checkAuth:async()=>({id:s.userId})};export const getAuthToken=async()=>s.token;export const getApiBaseUrl=()=> 'http://test.invalid/api';",
            "./analytics": "export const trackEvent=async()=>{};",
          };
          return { contents: codes[args.path], loader: "js" };
        });
      },
    },
  ],
});
const queue = createRequire(import.meta.url)(path.join(dir, "queue.cjs")) as {
  beginStudySession(
    source: "focus" | "exam",
    id: string,
    minutes: number,
    taskId?: string,
  ): Promise<void>;
  changeStudySession(
    source: "focus" | "exam",
    action: "stopped",
  ): Promise<unknown>;
  queueStudyCheckin(
    type: string,
    value: number,
    sessionId?: string,
  ): Promise<void>;
  flushStudyQueue(): Promise<number>;
};
test("offline persistence, successful sync and account isolation", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (!state.online) throw new Error("offline");
    state.sent.push({
      path: String(url),
      token: (options?.headers as any).Authorization,
      body: JSON.parse(String(options?.body)),
    });
    return new Response("{}", { status: 200 });
  };
  try {
    {
      await queue.beginStudySession("focus", "one", 25, "task-a");
      await queue.changeStudySession("focus", "stopped");
      await queue.queueStudyCheckin("focus", 8, "one");
      await queue.flushStudyQueue();
      const before = JSON.parse(state.storage.get("@study-ledger-v1:a")!);
      assert.equal(before.sessions[0].dirty, true);
      assert.equal(before.checkins.length, 1);
      state.online = true;
      await queue.flushStudyQueue();
      await queue.flushStudyQueue();
      const after = JSON.parse(state.storage.get("@study-ledger-v1:a")!);
      assert.equal(after.sessions[0].dirty, false);
      assert.equal(after.checkins.length, 0);
      assert.ok(state.sent[0].path.endsWith("/sessions"));
      assert.ok(state.sent.at(-1)?.path.endsWith("/checkins"));
    }
    {
      const n = state.sent.length;
      await queue.flushStudyQueue();
      assert.equal(state.sent.length, n);
    }
    {
      state.online = false;
      await queue.beginStudySession("exam", "only-a", 25);
      await queue.changeStudySession("exam", "stopped");
      await queue.flushStudyQueue();
      state.token = "token-b";
      state.userId = "b";
      state.online = true;
      const n = state.sent.length;
      await queue.flushStudyQueue();
      assert.equal(state.sent.length, n);
      await queue.beginStudySession("focus", "only-b", 25);
      await queue.changeStudySession("focus", "stopped");
      await queue.flushStudyQueue();
      await queue.flushStudyQueue();
      assert.ok(
        state.sent
          .slice(n)
          .every(
            (x) => x.token === "Bearer token-b" && x.body.clientId === "only-b",
          ),
      );
      state.token = "token-a";
      state.userId = "a";
      await queue.flushStudyQueue();
      assert.ok(
        state.sent.some(
          (x) => x.body.clientId === "only-a" && x.token === "Bearer token-a",
        ),
      );
    }
    {
      state.token = "";
      await assert.rejects(queue.queueStudyCheckin("mood", 7));
    }
  } finally {
    globalThis.fetch = originalFetch;
    delete (globalThis as any).__studyTest;
    await rm(dir, { recursive: true, force: true });
  }
});
