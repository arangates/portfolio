import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const standaloneDir = resolve(rootDir, "apps/web/.next/standalone");
const releasesDir = resolve(rootDir, "dist/releases");

const version = process.argv[2] || process.env.RELEASE_TAG || "v1.1.0";

console.log("==========================================================");
console.log(`  PACKAGING SELVAM SOVEREIGN RELEASE: ${version}`);
console.log("==========================================================");

if (!existsSync(standaloneDir)) {
  console.error(
    "Standalone directory not found at apps/web/.next/standalone. Please run `pnpm --filter web build` first.",
  );
  process.exit(1);
}

// Clean and create releases output folder
rmSync(releasesDir, { recursive: true, force: true });
mkdirSync(releasesDir, { recursive: true });

// Staging directory
const stageDir = resolve(rootDir, "dist/staging");
rmSync(stageDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });

console.log("\n1. Staging standalone Next.js server & static assets...");
cpSync(standaloneDir, stageDir, { recursive: true });

// Copy static assets
const webStaticSrc = resolve(rootDir, "apps/web/.next/static");
const webStaticDest = resolve(stageDir, "apps/web/.next/static");
if (existsSync(webStaticSrc)) {
  mkdirSync(dirname(webStaticDest), { recursive: true });
  cpSync(webStaticSrc, webStaticDest, { recursive: true });
  console.log("   Copied .next/static");
}

// Copy public assets
const publicSrc = resolve(rootDir, "apps/web/public");
const publicDest = resolve(stageDir, "apps/web/public");
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
  console.log("   Copied public assets");
}

// Copy database migrations
const migrationsSrc = resolve(rootDir, "packages/db/src/migrations");
const migrationsDest = resolve(stageDir, "packages/db/src/migrations");
if (existsSync(migrationsSrc)) {
  mkdirSync(dirname(migrationsDest), { recursive: true });
  cpSync(migrationsSrc, migrationsDest, { recursive: true });
  console.log("   Copied database migrations");
}

console.log("\n2. Generating Sovereign Launchers...");

// Create POSIX launcher for macOS and Linux
const startSh = `#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

export NODE_ENV=production
export SOVEREIGN_MODE=true
export DATABASE_URL=pglite://local
export PORT="\${PORT:-3001}"
export PGLITE_DATA_DIR="\${PGLITE_DATA_DIR:-$DIR/data/selvam.db}"

echo "=========================================================="
echo "         SELVAM · Sovereign Financial Operating System    "
echo "=========================================================="
echo "  Version:   ${version}"
echo "  Mode:      100% Sovereign (Zero External Cloud Services)"
echo "  Database:  Embedded PGlite (WASM Postgres)"
echo "  Storage:   $PGLITE_DATA_DIR"
echo "  URL:       http://localhost:$PORT"
echo "=========================================================="
echo ""
echo "Starting Selvam server..."

if command -v open >/dev/null 2>&1; then
  (sleep 2 && open "http://localhost:$PORT") &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 2 && xdg-open "http://localhost:$PORT") &
fi

exec node apps/web/server.js
`;
writeFileSync(resolve(stageDir, "start.sh"), startSh, { encoding: "utf8" });
try {
  chmodSync(resolve(stageDir, "start.sh"), 0o755);
} catch {}

// Create Windows launcher
const startBat = `@echo off
setlocal
cd /d "%~dp0"

set NODE_ENV=production
set SOVEREIGN_MODE=true
set DATABASE_URL=pglite://local
if "%PORT%"=="" set PORT=3001
if "%PGLITE_DATA_DIR%"=="" set PGLITE_DATA_DIR=%~dp0data\\selvam.db

echo ==========================================================
echo          SELVAM · Sovereign Financial Operating System    
echo ==========================================================
echo   Version:   ${version}
echo   Mode:      100%% Sovereign (Zero External Cloud Services)
echo   Database:  Embedded PGlite (WASM Postgres)
echo   Storage:   %PGLITE_DATA_DIR%
echo   URL:       http://localhost:%PORT%
echo ==========================================================
echo.
echo Starting Selvam server...
start http://localhost:%PORT%

node apps\\web\\server.js
`;
writeFileSync(resolve(stageDir, "start.bat"), startBat, { encoding: "utf8" });

// Create Release README
const readmeMd = `# Selvam · Sovereign Financial Operating System (${version})

Selvam is a **100% sovereign, local-first personal financial operating system**.
It runs entirely on your local machine with **zero external cloud dependencies** (no Neon, Docker, Google OAuth, or cloud storage required).

## Quick Start

### macOS & Linux
\`\`\`bash
chmod +x ./start.sh
./start.sh
\`\`\`
Your browser will automatically open to [http://localhost:3001](http://localhost:3001).

### Windows
Double-click \`start.bat\` or run in Command Prompt:
\`\`\`cmd
start.bat
\`\`\`

## Data & Backup
All records are stored locally in SQLite/PGlite format at \`./data/selvam.db\`.
To restore your historical portfolio, open **Settings > Restore Data** and upload your backup spreadsheet (\`selvam-manual-data-*.xlsx\`).
`;
writeFileSync(resolve(stageDir, "README.md"), readmeMd, { encoding: "utf8" });

console.log("\n3. Creating Cross-Platform Release Bundles...");

const platforms = [
  { name: `selvam-${version}-macos-arm64.tar.gz`, type: "tar" },
  { name: `selvam-${version}-macos-x64.tar.gz`, type: "tar" },
  { name: `selvam-${version}-linux-x64.tar.gz`, type: "tar" },
  { name: `selvam-${version}-linux-arm64.tar.gz`, type: "tar" },
  { name: `selvam-${version}-windows-x64.zip`, type: "zip" },
  { name: `selvam-${version}-universal.tar.gz`, type: "tar" },
];

const checksums = [];

for (const platform of platforms) {
  const destPath = resolve(releasesDir, platform.name);
  console.log(`   Building ${platform.name}...`);
  if (platform.type === "tar") {
    execSync(`tar -czf "${destPath}" -C "${stageDir}" .`);
  } else {
    execSync(`cd "${stageDir}" && zip -rq "${destPath}" .`);
  }

  // Calculate SHA-256
  const fileBytes = readFileSync(destPath);
  const hash = createHash("sha256").update(fileBytes).digest("hex");
  checksums.push(`${hash}  ${platform.name}`);
}

// Write checksums file
const checksumsPath = resolve(releasesDir, "checksums.txt");
writeFileSync(checksumsPath, checksums.join("\n") + "\n", "utf8");
console.log("\n4. Generated SHA-256 Checksums:");
console.log(readFileSync(checksumsPath, "utf8"));

// Cleanup staging
rmSync(stageDir, { recursive: true, force: true });

console.log("==========================================================");
console.log(`  ALL RELEASES SUCCESSFULLY PACKAGED IN dist/releases/    `);
console.log("==========================================================");
