FROM oven/bun:1.1-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

FROM base AS dev-install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM dev-install AS build
COPY . .
RUN bun run build

FROM base AS production
ENV NODE_ENV=production

COPY --from=install /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle

RUN addgroup -g 1001 -S bunuser && \
    adduser -S bunuser -u 1001 && \
    chown -R bunuser:bunuser /app

USER bunuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["bun", "run", "start"]
