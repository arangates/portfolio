FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web ./apps/web
COPY apps/fumadocs/package.json ./apps/fumadocs/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter web build

FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /repo/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web ./apps/web
COPY --from=build /repo/apps/web/public ./apps/web/.next/standalone/apps/web/public
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/standalone/apps/web/.next/static
COPY --from=build /repo/packages ./packages
COPY docker/start.sh ./start.sh
RUN chmod +x ./start.sh && chown -R node:node /repo
USER node
EXPOSE 3001
CMD ["./start.sh"]
