# Container deployment

Classification: PUBLIC

Build locally with `docker build -t gohighlevel-mcp .` from the repository root. Node 24 builds the checked-out source using `npm ci`; a separate locked dependency tree pins unmodified Supergateway 4.2.1. No credentials or client configuration belong in build arguments or source. The runtime runs as UID/GID 1000. Native HTTP servers elsewhere do not need this bridge.

The gateway manifest overrides its pinned upstream SDK dependencies to patched versions (MCP SDK 1.32.0, client/server/core 2.3.0, Node adapter 2.1.0, Hono Node adapter 2.1.3, and Zod 4.6.7) while retaining Supergateway 4.2.1. These overrides address HTTP request-limit, validation-memory and session-isolation advisories. Recheck them when upgrading Supergateway; the container smoke suite must pass before publishing. Production application dependencies are installed in a separate clean build stage rather than pruning the development tree.

## Runtime configuration

Required upstream environment variables: `GHL_API_TOKEN`, `GHL_LOCATION_ID`. Inject them only at runtime through Coolify secrets/environment. See the root README for API account setup and optional variables.

Mount a read-only secret file at `/run/secrets/mcp_api_key` (or set `SUPERGATEWAY_API_KEY_FILE` to its mounted path). It must be readable by UID 1000 and contain a strong random inbound gateway key, one per line for rotation. Provision it through your secret manager; do not commit it. Missing, empty or unreadable files stop startup. The gateway key is separate from the upstream API credential. Use only this file interface; leave `SUPERGATEWAY_API_KEY` unset.

Build this checkout: it includes local 0.1.1 pagination fixes absent from npm 0.1.0. Commit/review those source changes together with a release before publishing an image. This Dockerfile never downloads the published GHL server.

## Coolify and Cloudflare MCP Portal

After publication, select `ghcr.io/nightsquawk/gohighlevel-mcp-server:sha-<full-commit>` in a Coolify Docker image service (or build this Dockerfile). Prefer a digest for rollout/rollback. Private GHCR images require registry pull credentials configured separately in Coolify; CI publishes with its repository GITHUB_TOKEN and needs no PAT.

Configure the runtime variables and read-only key mount, internal port **8000**, HTTPS hostname and health path `/healthz`. Allow at least 15 seconds for a health check and 20 seconds shutdown grace. Keep the container port on the private proxy network; do not publish it directly to the Internet. Configure streaming and disable proxy response buffering; keep one replica or use sticky routing for stateful sessions.

Register `https://<service-hostname>/mcp` as a Streamable HTTP upstream in the accepted Cloudflare MCP Portal. Select bearer authentication (`auth_type: bearer`) and store the raw gateway key in `auth_credentials`; Cloudflare sends `Authorization: Bearer <gateway-key>`. Restrict who may use the portal. Verify this header reaches the origin before enabling users. The origin checks it regardless of portal policy. If Cloudflare Access also protects the origin, the portal must additionally send valid service-token headers `CF-Access-Client-Id` and `CF-Access-Client-Secret`; Use the JSON `headers` form of `auth_credentials` containing all three headers, including `Authorization`. Access authentication and gateway authentication are independent.

Unauthenticated or incorrect-key MCP requests must return 401. `/healthz` is intentionally unauthenticated: it initializes/pings a temporary stdio process, returns 503 when that fails, and does not prove live upstream API access or authorization. Do not expose health diagnostics through a public route. Never use this endpoint to execute API writes during testing.

## Build and publication

`.github/workflows/container.yml` builds and runs the no-real-credentials smoke suite for PRs and pushes. PR validation has no registry login, secrets or package-write permission. Publication runs only after validation on default-branch pushes, default-branch manual dispatch, or matching `v<package-version>` tags whose commits are on the default branch. Tags use a full `sha-<commit>` and, on version releases, the exact version. `latest` follows the default branch and stable releases; prerelease tags never move it. No image deploys automatically. Repository Actions/package policy must permit `packages: write`; initial package visibility is controlled in GHCR settings.

For host-only transport verification after `npm ci`, `npm run build` and `npm ci --prefix docker`, run `node docker/smoke.mjs --local`; this cannot verify the image entrypoint, filesystem permissions or container shutdown.

Run `node docker/smoke.mjs <local-image>` after building. It uses synthetic API credentials and performs initialize/tools/list only, tests authentication and startup rejection, and cleans up containers and temporary keys. CI checks Linux/amd64; other architectures are not yet validated.

## See also

- [Server setup and API variables](../README.md)
- [Supergateway upstream usage](https://github.com/supercorp-ai/supergateway#stdio--streamable-http)
- [Cloudflare MCP portals and upstream authentication](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
