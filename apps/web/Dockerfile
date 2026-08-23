FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Container image construction must remain database-independent. Production
# deployments apply Prisma migrations separately from the application build.
RUN pnpm --filter @tinlance/web exec prisma generate && pnpm --filter @tinlance/web exec next build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# The runtime only needs Node.js. Removing npm/yarn/corepack from the final image
# reduces the supply-chain attack surface and avoids shipping unused package managers.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v1.22.22 \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
