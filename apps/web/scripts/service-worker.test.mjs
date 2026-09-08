import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";

const source = await readFile(new URL("./service-worker.js", import.meta.url), "utf8");
function worker({
  windows = [{ id: "one" }],
  failNetwork = false,
  failCacheRead = false,
  failCacheWrite = false,
} = {}) {
  const handlers = {};
  const cached = new Map();
  const state = { skipped: false, claimed: false, messages: [], fetched: [], deleted: [] };
  const cache = {
    addAll: async (paths) =>
      paths.forEach((path) => cached.set(path, new Response("offline shell"))),
    match: async (request) => cached.get(typeof request === "string" ? request : request.url),
    put: async (request, response) => {
      if (failCacheWrite) throw new Error("quota");
      return cached.set(request.url, response);
    },
    keys: async () =>
      [...cached.keys()].map((url) => ({ url: new URL(url, "https://selvam.test").href })),
    delete: async (request) => cached.delete(request.url),
  };
  runInNewContext(source, {
    URL,
    Response,
    self: {
      location: { origin: "https://selvam.test" },
      addEventListener: (name, handler) => {
        handlers[name] = handler;
      },
      skipWaiting: async () => {
        state.skipped = true;
      },
      clients: {
        matchAll: async () => windows,
        claim: async () => {
          state.claimed = true;
        },
      },
    },
    caches: {
      open: async () => {
        if (failCacheRead) throw new Error("storage unavailable");
        return cache;
      },
      match: async (path) => cached.get(path),
      keys: async () => ["other-app", "selvam-static-old", "selvam-static-__BUILD_VERSION__"],
      delete: async (key) => state.deleted.push(key),
    },
    fetch: async (request) => {
      state.fetched.push(request.url);
      if (failNetwork) throw new Error("offline");
      const response = new Response("public asset");
      Object.defineProperty(response, "type", { value: "basic" });
      return response;
    },
  });
  async function dispatch(name, properties = {}) {
    let response;
    let completion;
    handlers[name]({
      ...properties,
      respondWith: (result) => {
        response = result;
      },
      waitUntil: (result) => {
        completion = result;
      },
    });
    await completion;
    return response ? await response : undefined;
  }
  return { dispatch, state, cached };
}
const request = (path, extra = {}) => ({
  url: new URL(path, "https://selvam.test").href,
  method: "GET",
  mode: "cors",
  ...extra,
});

test("install caches only the explicit public shell and never forces an update", async () => {
  const w = worker();
  await w.dispatch("install");
  assert.deepEqual(
    [...w.cached.keys()].sort(),
    [
      "/offline.html",
      "/favicon/web-app-manifest-192x192.png",
      "/favicon/web-app-manifest-512x512.png",
      "/favicon/maskable-512.png",
    ].sort(),
  );
  assert.equal(w.state.skipped, false);
});
test("financial APIs, RSC, mutations and third-party requests bypass the worker", async () => {
  const w = worker();
  for (const req of [
    request("/api/portfolio/export"),
    request("/dashboard?_rsc=123"),
    request("/api/portfolio/imports", { method: "POST" }),
    request("https://other.test/_next/static/a.js"),
    request("/api/google-drive/documents/123/download"),
  ]) {
    assert.equal(await w.dispatch("fetch", { request: req }), undefined);
  }
  assert.equal(w.state.fetched.length, 0);
  assert.equal(w.cached.size, 0);
});
test("navigation stays network-only and offline navigation gets a generic shell", async () => {
  const online = worker();
  assert.equal(
    await (
      await online.dispatch("fetch", { request: request("/dashboard", { mode: "navigate" }) })
    ).text(),
    "public asset",
  );
  assert.equal(online.cached.size, 0);
  const offline = worker({ failNetwork: true });
  await offline.dispatch("install");
  assert.equal(
    await (
      await offline.dispatch("fetch", { request: request("/dashboard/twin", { mode: "navigate" }) })
    ).text(),
    "offline shell",
  );
});
test("public framework assets are reused from cache", async () => {
  const w = worker();
  const req = request("/_next/static/chunks/example.js");
  await w.dispatch("fetch", { request: req });
  await w.dispatch("fetch", { request: req });
  assert.equal(w.state.fetched.length, 1);
});
test("updates are blocked with another window and accepted only from the sole client", async () => {
  for (const windows of [[{ id: "one" }, { id: "two" }], [{ id: "other" }]]) {
    const w = worker({ windows });
    await w.dispatch("message", {
      data: { type: "APPLY_UPDATE" },
      source: { id: "one", postMessage: (message) => w.state.messages.push(message) },
    });
    assert.equal(w.state.skipped, false);
    assert.equal(w.state.messages[0].type, "UPDATE_BLOCKED");
  }
  const w = worker();
  await w.dispatch("message", { data: { type: "APPLY_UPDATE" }, source: { id: "one" } });
  assert.equal(w.state.skipped, true);
});
test("activation removes only this app's old caches", async () => {
  const w = worker();
  await w.dispatch("activate");
  assert.deepEqual(w.state.deleted, ["selvam-static-old"]);
  assert.equal(w.state.claimed, true);
});

test("cache read and quota failures do not break online assets", async () => {
  for (const options of [{ failCacheRead: true }, { failCacheWrite: true }]) {
    const w = worker(options);
    const response = await w.dispatch("fetch", {
      request: request("/_next/static/chunks/example.js"),
    });
    assert.equal(await response.text(), "public asset");
    assert.equal(w.state.fetched.length, 1);
  }
});
