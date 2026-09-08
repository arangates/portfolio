import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const source = await readFile(new URL("./service-worker.js", import.meta.url), "utf8");
// Every build changes the worker, including releases that only modify application code.
const version = `${Date.now()}-${createHash("sha256").update(source).digest("hex").slice(0, 10)}`;
await writeFile(
  new URL("../public/sw.js", import.meta.url),
  source.replaceAll("__BUILD_VERSION__", version),
);
