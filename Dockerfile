# Build the checked-out source, never an npm release of this server.
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS gateway
WORKDIR /gateway
COPY docker/package.json docker/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    SUPERGATEWAY_API_KEY_FILE=/run/secrets/mcp_api_key
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=gateway /gateway /gateway
COPY docker/entrypoint.sh docker/validate.mjs ./docker/
COPY LICENSE COMMERCIAL.md ./
USER node
EXPOSE 8000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=15s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "/app/docker/entrypoint.sh"]
