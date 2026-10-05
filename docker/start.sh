#!/bin/sh
set -eu

node /repo/packages/db/scripts/migrate.mjs
cd /repo/apps/web/.next/standalone/apps/web
exec node server.js
