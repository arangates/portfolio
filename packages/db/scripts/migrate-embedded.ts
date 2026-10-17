import { getOrInitEmbeddedDb } from "../src/embedded";

console.log("Migrating sovereign embedded PGlite database...");
const start = Date.now();
await getOrInitEmbeddedDb({ dataDir: process.env.PGLITE_DATA_DIR });
const duration = Date.now() - start;

console.log(`Embedded PGlite migrations successfully applied in ${duration}ms!`);
