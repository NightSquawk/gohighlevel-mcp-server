# Security Policy

## Supported Versions

Only the latest release published to npm as
[`@nightsquawktech/gohighlevel-mcp-server`](https://www.npmjs.com/package/@nightsquawktech/gohighlevel-mcp-server)
is supported. Please upgrade before reporting an issue to confirm it still
reproduces on the current release.

## Reporting a Vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.

Instead, report it privately using one of these channels:

- **GitHub Security Advisories:** use the
  ["Report a vulnerability"](https://github.com/NightSquawk/gohighlevel-mcp-server/security/advisories/new)
  button under this repository's Security tab.
- **Email:** hello@nightsquawk.tech with a description of the issue, steps
  to reproduce, and any relevant logs (redact your `GHL_API_TOKEN` and other
  secrets before sending).

We aim to acknowledge reports within 5 business days. Once a fix is
available, it will be released to npm and, where applicable, credited in
the release notes with the reporter's permission.

## Scope

This is a self-hosted MCP server that runs locally (via `npx`) or in a
client-managed process; it does not operate a multi-tenant hosted service.
In-scope issues include (non-exhaustively):

- Credential or token leakage (e.g. the `GHL_API_TOKEN` reaching logs,
  error output, or an unintended API call).
- Destructive GoHighLevel operations (delete, merge) executing without the
  `confirm` gate.
- Dependency vulnerabilities in the published package that are reachable
  through this server's normal usage.

Out of scope: vulnerabilities in GoHighLevel's own API/platform, or in the
MCP client (Claude Desktop, Cursor, etc.) invoking this server.
