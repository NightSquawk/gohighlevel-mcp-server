# gohighlevel-mcp-server — Build Scope & Context

> **Audience:** the implementing agent that will build this MCP server from scratch.
> **Status:** Greenfield. Only `src/` exists (empty). Nothing else has been written yet.
> **Owner:** Kevin Reyes (NightSquawk Tech). Single-tenant, self-hosted alongside the
> official GoHighLevel MCP.

---

## 1. Why this server exists

NightSquawk Tech already connects the **official GoHighLevel hosted MCP**
(`https://services.leadconnectorhq.com/mcp/`). That server is a fixed, curated tool set
of ~30 tools and has two hard limitations we keep hitting:

1. **It cannot create / update / delete custom fields** — it only exposes
   `locations_get-custom-fields` (read).
2. **It cannot delete contacts** — `contacts_*` has get/create/update/upsert/tags but no delete.

It also has **no generic API-passthrough tool** (unlike the Stripe MCP's `stripe_api_execute`),
so there is no escape hatch to reach those routes.

The underlying **GoHighLevel REST API v2 supports all of these operations.** This was confirmed
live: a `GET /locations/{locationId}/customFields` call with the existing Private Integration
Token returned 7 fields successfully. So we are building our own server to provide **broad,
curated coverage** of the GHL v2 API — prioritizing the gaps the official MCP leaves open.

**Decisions already made by the owner (do not re-litigate):**
- **Coverage breadth:** *Broad curated coverage* — implement a wide swath of GHL v2 endpoints as
  individual curated tools, not just the two gaps. Build in priority order (Section 7).
- **Delete safety:** Every destructive tool (any DELETE) takes a **required `confirm: boolean`
  that must be explicitly `true`**, in addition to the `destructiveHint` annotation. If
  `confirm` is not `true`, the tool returns an error without calling the API.

---

## 2. Reference implementation — COPY ITS PATTERNS EXACTLY

A sibling server was just built to NightSquawk's house style and best practices. **Study it first
and mirror its structure, conventions, and idioms.** Do not invent a new architecture.

**Reference path:** `D:\Syncthing\RemoteSync\GitHub\Other\tacticalrmm-mcp-server`

### 2.1 File/folder layout to replicate

```
gohighlevel-mcp-server/
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example
├── README.md
└── src/
    ├── index.ts                     # entry: McpServer + StdioServerTransport, loadConfig, client, registerTools
    ├── constants.ts                 # SERVER_NAME, SERVER_VERSION, ENV map, DEFAULT_TIMEOUT_MS, RESPONSE_CHARACTER_LIMIT, defaults
    ├── types.ts                     # Config, Method, ResponseFormat, PaginatedItems, ToolResponse
    ├── services/
    │   ├── config.ts                # loadConfig() with strict validation + clear error messages
    │   ├── gohighlevel-client.ts    # axios wrapper (see §4 — MUST support GET/POST/PUT/DELETE)
    │   └── errors.ts                # formatApiError() with GHL-specific status handling
    ├── schemas/
    │   ├── common.ts                # ResponseFormatSchema, LimitSchema, OffsetSchema, + shared (LocationIdSchema, ConfirmSchema)
    │   ├── custom-fields.ts
    │   ├── custom-values.ts
    │   ├── contacts.ts
    │   ├── opportunities.ts
    │   ├── conversations.ts
    │   ├── tags.ts
    │   ├── calendars.ts
    │   └── locations.ts
    └── tools/
        ├── index.ts                 # registerTools() aggregator — calls each register*Tools()
        ├── format.ts                # paginate, makeToolResponse, formatResponse, summarizeRecord (copy verbatim, retune wording)
        ├── read-tools.ts            # generic registerCollectionReadTool factory (copy + adapt)
        ├── custom-fields.ts
        ├── custom-values.ts
        ├── contacts.ts
        ├── opportunities.ts
        ├── conversations.ts
        ├── tags.ts
        ├── calendars.ts
        └── locations.ts
```

### 2.2 Conventions carried over from the reference (non-negotiable)

- **ESM project.** `package.json` has `"type": "module"`. **All relative imports use the `.js`
  extension** (e.g. `import { loadConfig } from "./services/config.js"`), even though the source
  is `.ts`. `tsconfig` uses `module`/`moduleResolution` = `Node16`, `target` ES2022, `strict: true`.
- **Dependencies:** `@modelcontextprotocol/sdk` (^1.26+), `axios` (^1.13+), `zod` (^3.25, **stay on
  zod 3 — the SDK's `inputSchema: Schema.shape` pattern depends on it**). Dev: `typescript`, `tsx`,
  `rimraf`, `@types/node`.
- **Scripts:** `build` (`tsc`), `start` (`node dist/index.js`), `dev` (`tsx src/index.ts`),
  `clean` (`rimraf dist`). `bin` points at `./dist/index.js`. `engines.node >= 20`.
- **Tool registration:** `server.registerTool(name, { title, description, inputSchema, annotations }, handler)`.
  `inputSchema` is a **zod object's `.shape`** (not the schema itself).
- **Every tool handler is wrapped in `try/catch`.** On error → `formatApiError(error)` →
  `makeToolResponse(data, text, /*isError*/ true)`. Never let an exception escape a handler.
- **Dual output:** every response returns both `content: [{type:"text", text}]` and
  `structuredContent` (the raw data object). Use `makeToolResponse()`.
- **`response_format` param** on read tools: `"markdown"` (default, human summary) or `"json"`.
- **Local pagination** via `paginate()` + `LimitSchema`/`OffsetSchema` for list tools that return
  arrays. (GHL also has server-side pagination — see §4.3; expose both where it matters.)
- **Response truncation** at `RESPONSE_CHARACTER_LIMIT` (25_000) via `makeToolResponse()`.
- **All zod object schemas are `.strict()`.**
- **Annotations** on every tool: `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`.
- **Logging:** startup banner to `console.error` only (stdout is the MCP transport). **Never log
  the token or full request bodies.**
- **Tool naming:** `ghl_<verb>_<noun>` snake_case, e.g. `ghl_create_custom_field`,
  `ghl_delete_contact`, `ghl_list_custom_fields`. (Reference uses `tacticalrmm_*`; we use `ghl_*`.)

---

## 3. Authentication & configuration

### 3.1 Env vars (define in `constants.ts` `ENV` map, validate in `config.ts`)

| Env var | Required | Default | Notes |
|---|---|---|---|
| `GHL_API_TOKEN` | **yes** | — | Private Integration Token (`pit-...`) **or** OAuth Sub-Account access token. Sent as `Authorization: Bearer <token>`. |
| `GHL_LOCATION_ID` | **yes** | — | Default sub-account/location ID. Used when a tool's `location_id` param is omitted. NightSquawk's own location: see `~/.claude.json` (do **not** hardcode). |
| `GHL_BASE_URL` | no | `https://services.leadconnectorhq.com` | API root. |
| `GHL_API_VERSION` | no | `2021-07-28` | Sent as the `Version` header on **every** request. GHL requires it. |
| `GHL_TIMEOUT_MS` | no | `30000` | Min 1000. |

`config.ts` must throw clear, actionable errors when `GHL_API_TOKEN` or `GHL_LOCATION_ID` are
missing (mirror the reference's wording style, e.g. *"GHL_API_TOKEN is required. Create a Private
Integration in GHL: Settings → Private Integrations, grant the scopes in §3.3, and copy the
`pit-...` token."*).

### 3.2 Required request headers (set in the axios client)

```
Authorization: Bearer <GHL_API_TOKEN>
Version: <GHL_API_VERSION>          # e.g. 2021-07-28  — REQUIRED by GHL
Accept: application/json
Content-Type: application/json
```

> ⚠️ The official GHL MCP also passes a `locationId` header, but the **REST API expects locationId
> in the path, query, or body depending on the endpoint** (see §5), *not* as a global header. Pass
> it per-endpoint as documented, defaulting to `GHL_LOCATION_ID`.

### 3.3 PIT scopes the token must have

The existing token already has read scopes (custom-field read was verified live). For the full
build the Private Integration must be granted (owner action in GHL UI):

- `locations/customFields.readonly` ✅ (confirmed) + `locations/customFields.write`
- `locations/customValues.readonly` + `locations/customValues.write`
- `contacts.readonly` + `contacts.write` (delete contact needs write)
- `opportunities.readonly` + `opportunities.write`
- `conversations.readonly` + `conversations.write` + `conversations/message.readonly|write`
- `calendars.readonly` + `calendars.write` + `calendars/events.readonly|write`
- `locations.readonly` + `locations.write` (tags)
- `workflows.readonly`

**A 401/403 at runtime almost always means a missing scope, not a bad token** — the error handler
(§6) should say exactly that.

---

## 4. The HTTP client (`services/gohighlevel-client.ts`)

The reference client only implements `GET` and `PATCH`. **Ours must add `POST`, `PUT`, `DELETE`.**
Otherwise keep the same shape: a class wrapping one configured `axios` instance, with a private
`request<T>(method, path, {data, params})` and thin verb helpers.

### 4.1 Required methods

```ts
get<T>(path, params?)            // GET
post<T>(path, body?)             // POST
put<T>(path, body?)              // PUT
del<T>(path, params?, body?)     // DELETE  (some GHL deletes take a query/body)
```

### 4.2 Path handling

- **Do NOT copy the reference's trailing-slash `normalizePath`.** That behavior is correct for
  TacticalRMM (Django enforces trailing slashes) but should not be assumed here — every verified GHL
  call in §4.3/§5 succeeded **without** a trailing slash on the resource (the `/calendars/` root is
  the exception, and that one is explicit in the path). Default to **no** trailing slash: ensure a
  single leading `/` and pass the path through unchanged. `baseURL` should have no trailing slash.
- URL-encode all path params (`encodeURIComponent`) — contact/field IDs are opaque strings.

### 4.3 Pagination & response envelopes (verified live)

GHL wraps list results in a **named collection key** plus a `traceId` (no bare arrays). These
envelopes were confirmed live with the current token:

| Endpoint | Envelope (top-level keys) | Collection key |
|---|---|---|
| `GET /locations/{id}/customFields` | `{ customFields, ... }` ✅ | `customFields` |
| `GET /locations/{id}/customValues` | `{ customValues, traceId }` ✅ | `customValues` |
| `GET /locations/{id}/tags` | `{ tags, traceId }` ✅ | `tags` |
| `GET /opportunities/pipelines` | `{ pipelines, traceId }` ✅ | `pipelines` |
| `POST /contacts/search` | `{ contacts, total, traceId }` ✅ | `contacts` (use `total` for server count) |
| `GET /calendars/` | `{ calendars, traceId }` ✅ | `calendars` |

Extend the reference's `extractItems()` to pull these named keys (in addition to its
`results`/`items`/`data`/`rows` fallbacks). Keep local `paginate()` for ergonomics, but for large
collections (contacts, opportunities) also pass GHL's native `limit`/`startAfterId`/`page` params
through so the agent can page server-side. `contacts/search` returns `total` — surface it in the
summary instead of the local page count.

---

## 5. GHL v2 API endpoint reference

**Base:** `https://services.leadconnectorhq.com` · **Version header:** `2021-07-28`
**Docs:** https://marketplace.gohighlevel.com/docs/ (Stoplight; JS-rendered — schemas must be
read in-browser or confirmed via live calls; see §8).

> ✅ = confirmed working live with the current token. Everything else is from the v2 API surface and
> **must be verified** (exact body field names, response envelope) before/while implementing — see §8.

### 5.1 Custom Fields — location-scoped (PRIORITY: this is gap #1)

| Tool | Method | Path |
|---|---|---|
| `ghl_list_custom_fields` | GET | `/locations/{locationId}/customFields` ✅ |
| `ghl_get_custom_field` | GET | `/locations/{locationId}/customFields/{id}` |
| `ghl_create_custom_field` | POST | `/locations/{locationId}/customFields` (doc-confirmed) |
| `ghl_update_custom_field` | PUT | `/locations/{locationId}/customFields/{id}` (⚠️ see fork below) |
| `ghl_delete_custom_field` | DELETE | `/locations/{locationId}/customFields/{id}` ⚠️destructive (⚠️ see fork below) |

> **⚠️ ARCHITECTURE FORK — resolve before building P1.** `list`/`get`/`create` on the
> location-scoped path are confirmed (`list` ✅ live, `create` doc-confirmed). **`update` and
> `delete` on that same `/locations/{id}/customFields/{id}` path are extrapolated, not confirmed.**
> GHL may require the **Custom Fields V2 API** (`PUT`/`DELETE /custom-fields/{id}`) for mutation.
> Verify which API owns update/delete *first* — if it's V2-only, the V2 endpoints (§5.1 note)
> move up from P3 into P1, and the custom-field tools should target V2 for write paths. Do not
> build the update/delete tools until this is settled.

Create body (verify field names against live docs):
```jsonc
{
  "name": "string",                 // required
  "dataType": "TEXT",               // required; enum below
  "placeholder": "string",
  "position": 0,
  "model": "contact",               // "contact" | "opportunity"
  "options": ["A", "B"],            // for SINGLE_OPTIONS/MULTIPLE_OPTIONS/RADIO/CHECKBOX
  "acceptedFormat": ".pdf",         // FILE_UPLOAD only
  "isMultipleFile": false,          // FILE_UPLOAD only
  "maxNumberOfFiles": 1,            // FILE_UPLOAD only
  "textBoxListOptions": [{ "label": "x", "prefillValue": "y" }] // TEXTBOX_LIST only
}
```
`dataType` enum (verify): `TEXT, LARGE_TEXT, NUMERICAL, PHONE, MONETORY, CHECKBOX, SINGLE_OPTIONS,
MULTIPLE_OPTIONS, FLOAT, TEXTBOX_LIST, DATE, TEXTAREA, RADIO, FILE_UPLOAD, SIGNATURE`.
(Note GHL's documented misspelling `MONETORY`.)

> **Also exists:** a newer **Custom Fields V2 API** under `/custom-fields/...` that adds *folders*
> and object-model grouping (`POST /custom-fields/`, `GET/PUT/DELETE /custom-fields/{id}`,
> `POST /custom-fields/folder`). Build the location-scoped set first (verified surface). Add V2 +
> folder tools in P3 only if folder management is needed.

### 5.2 Custom Values — location-scoped (PRIORITY)

| Tool | Method | Path |
|---|---|---|
| `ghl_list_custom_values` | GET | `/locations/{locationId}/customValues` ✅ (envelope `{customValues,traceId}`) |
| `ghl_get_custom_value` | GET | `/locations/{locationId}/customValues/{id}` |
| `ghl_create_custom_value` | POST | `/locations/{locationId}/customValues` |
| `ghl_update_custom_value` | PUT | `/locations/{locationId}/customValues/{id}` |
| `ghl_delete_custom_value` | DELETE | `/locations/{locationId}/customValues/{id}` ⚠️destructive |

Body: `{ "name": "string", "value": "string" }`.

### 5.3 Contacts (PRIORITY: delete is gap #2)

| Tool | Method | Path | Notes |
|---|---|---|---|
| `ghl_get_contact` | GET | `/contacts/{contactId}` | |
| `ghl_search_contacts` | POST | `/contacts/search` ✅ | envelope `{contacts, total, traceId}`. body: `{ locationId, query?, filters?, pageLimit }`. Prefer over deprecated `GET /contacts/`. |
| `ghl_create_contact` | POST | `/contacts/` | body includes `locationId` |
| `ghl_update_contact` | PUT | `/contacts/{contactId}` | |
| `ghl_upsert_contact` | POST | `/contacts/upsert` | dedupe by email/phone |
| `ghl_delete_contact` | DELETE | `/contacts/{contactId}` | ⚠️destructive **← official MCP gap** |
| `ghl_add_contact_tags` | POST | `/contacts/{contactId}/tags` | body `{ tags: [...] }` |
| `ghl_remove_contact_tags` | DELETE | `/contacts/{contactId}/tags` | body `{ tags: [...] }` |
| `ghl_add_contact_to_workflow` | POST | `/contacts/{contactId}/workflow/{workflowId}` | |
| `ghl_remove_contact_from_workflow` | DELETE | `/contacts/{contactId}/workflow/{workflowId}` | |
| `ghl_get_contact_notes` / `ghl_create_contact_note` | GET/POST | `/contacts/{contactId}/notes` | P3 |
| `ghl_get_contact_tasks` / `ghl_create_contact_task` | GET/POST | `/contacts/{contactId}/tasks` | P3 |

### 5.4 Opportunities

| Tool | Method | Path |
|---|---|---|
| `ghl_search_opportunities` | GET | `/opportunities/search?location_id={locationId}&...` |
| `ghl_get_opportunity` | GET | `/opportunities/{id}` |
| `ghl_get_pipelines` | GET | `/opportunities/pipelines?locationId={locationId}` ✅ (envelope `{pipelines,traceId}`) |
| `ghl_create_opportunity` | POST | `/opportunities/` |
| `ghl_update_opportunity` | PUT | `/opportunities/{id}` |
| `ghl_update_opportunity_status` | PUT | `/opportunities/{id}/status` |
| `ghl_delete_opportunity` | DELETE | `/opportunities/{id}` ⚠️destructive |

### 5.5 Conversations & Messages

| Tool | Method | Path |
|---|---|---|
| `ghl_search_conversations` | GET | `/conversations/search?locationId={locationId}&...` |
| `ghl_get_conversation_messages` | GET | `/conversations/{conversationId}/messages` |
| `ghl_send_message` | POST | `/conversations/messages` | body `{ type, contactId, message, ... }` |

> Sending a message is an **outward-facing action** (a real SMS/email leaves the system). Mark it
> `destructiveHint: true` and require `confirm: true` even though it isn't a DELETE.

### 5.6 Tags (location-scoped)

| Tool | Method | Path |
|---|---|---|
| `ghl_list_tags` | GET | `/locations/{locationId}/tags` ✅ (envelope `{tags,traceId}`) |
| `ghl_get_tag` | GET | `/locations/{locationId}/tags/{id}` |
| `ghl_create_tag` | POST | `/locations/{locationId}/tags` |
| `ghl_update_tag` | PUT | `/locations/{locationId}/tags/{id}` |
| `ghl_delete_tag` | DELETE | `/locations/{locationId}/tags/{id}` ⚠️destructive |

### 5.7 Calendars (P3)

| Tool | Method | Path |
|---|---|---|
| `ghl_list_calendars` | GET | `/calendars/?locationId={locationId}` ✅ (envelope `{calendars,traceId}`) |
| `ghl_get_calendar_events` | GET | `/calendars/events?locationId={locationId}&...` |
| `ghl_get_free_slots` | GET | `/calendars/{id}/free-slots?...` |
| `ghl_create_appointment` | POST | `/calendars/events/appointments` |
| `ghl_update_appointment` | PUT | `/calendars/events/appointments/{id}` |
| `ghl_delete_appointment` | DELETE | `/calendars/events/{id}` ⚠️destructive |

### 5.8 Locations / Users (read, P3)

| Tool | Method | Path |
|---|---|---|
| `ghl_get_location` | GET | `/locations/{locationId}` |
| `ghl_list_users` | GET | `/users/?locationId={locationId}` |

---

## 6. Error handling (`services/errors.ts`)

Adapt the reference's `formatApiError` for GHL. Status-specific guidance:

- **401 / 403** → *"GoHighLevel denied the request (status). The token is likely missing a required
  scope — check Private Integration scopes (see scopes list) — or the locationId is wrong."* Include
  the response body (GHL returns `{ message, error, statusCode }` or `{ msg }`).
- **404** → *"GoHighLevel resource not found (404). Check the ID and that locationId matches the
  resource's sub-account."*
- **422** → *"GoHighLevel rejected the payload (422). Check required fields / dataType enum."* Echo
  the validation detail.
- **429** → *"GoHighLevel rate limited (429). Burst limit is ~100 req / 10s and ~200k/day per
  resource. Back off and retry."*
- Timeout (`ECONNABORTED`) and connection errors → mirror reference wording with GHL env var names.

Always append the response body (stringified, see reference's `formatErrorData`) — but **scrub the
`Authorization` header**; never echo it.

---

## 7. Build order (priority phases)

Build and verify phase by phase; commit after each.

- **P1 — The gaps + their domains (do first):**
  Custom Fields (5.1, all CRUD), Custom Values (5.2, all CRUD), Contacts delete + tags + workflow
  (the write/delete parts of 5.3). Plus the supporting reads (`list`/`get`) so each domain is
  self-verifiable without the official MCP.
- **P2 — Core CRM:** Contacts full (search/get/create/update/upsert), Opportunities (5.4), Tags (5.6).
- **P3 — Extended:** Conversations (5.5), Calendars (5.7), Locations/Users (5.8), Custom Fields V2 +
  folders, contact notes/tasks.

The `confirm: true` guard applies to **all** DELETE tools and to `ghl_send_message` from P1 onward.

---

## 8. Verification (do this — don't assume schemas)

The marketplace docs are JS-rendered and WebFetch can't read the detailed schemas. Verify against
reality instead:

1. **Live read first.** With the token in `.env`, hit each GET endpoint and inspect the real
   response envelope before writing the markdown summarizer / `extractItems` key. The custom-fields
   list is the known-good anchor:
   ```powershell
   $h = @{ Authorization = "Bearer $env:GHL_API_TOKEN"; Version = "2021-07-28"; Accept = "application/json" }
   Invoke-RestMethod "https://services.leadconnectorhq.com/locations/$env:GHL_LOCATION_ID/customFields" -Headers $h
   ```
2. **Confirm write-body field names** for create/update custom field & custom value against the
   Stoplight docs in a browser (or by trial create→read→delete in a safe way). Do **not** ship a
   create tool whose body schema you haven't confirmed round-trips.
3. **Destructive tests are owner-gated.** Per **NightSquawk Rule 8 (GoHighLevel — Ask to Write)**,
   do not run create/update/delete against the live location without explicit owner go-ahead. Build
   the tools, unit-shape them, and hand the owner a short "test plan" of exact calls to approve.
4. **`build` must pass** (`npm run build`) with zero TS errors before declaring done.

---

## 9. Deliverables (definition of done for the build)

- [ ] All files in §2.1 present; `npm install && npm run build` succeeds.
- [ ] P1 tools implemented, registered, annotated, and `confirm`-guarded where destructive.
- [ ] `.env.example` lists every env var from §3.1 (no real secrets).
- [ ] `.gitignore` excludes `node_modules/`, `dist/`, `.env`, `.env.*` (keep `!.env.example`).
- [ ] `README.md`: what it is, the two gaps it fills vs the official MCP, env setup, scope list,
      MCP registration snippet (below), and the §8 verification/test plan.
- [ ] Live GET smoke test passes for at least custom-fields, custom-values, contacts, tags.
- [ ] Owner-approved test plan for the write/delete tools (not executed without sign-off).

### MCP registration snippet (for `~/.claude.json` or project `.mcp.json`)

```jsonc
"gohighlevel": {
  "command": "node",
  "args": ["D:/Syncthing/RemoteSync/GitHub/Other/gohighlevel-mcp-server/dist/index.js"],
  "env": {
    "GHL_API_TOKEN": "pit-...",            // do not commit
    "GHL_LOCATION_ID": "<location id>",
    "GHL_API_VERSION": "2021-07-28"
  }
}
```

> Name the server `gohighlevel` (distinct from the official `highlevel`) so both can run side by
> side: use the official `highlevel` MCP for everything it already covers, and `gohighlevel` for
> the gaps / curated writes.

---

## 10. Guardrails & house rules

- **Rule 1 (No sensitive data in outputs):** never log or echo the token; scrub auth headers in
  errors; `.env` is gitignored; `.env.example` carries placeholders only.
- **Rule 8 (GoHighLevel — Ask to Write):** all create/update/delete/send tools are owner-gated for
  live execution. The `confirm: true` param is a code-level backstop, not a substitute for the rule.
- **Single tenant:** defaults to one `GHL_LOCATION_ID`, but every location-scoped tool accepts an
  optional `location_id` override param so it can target other sub-accounts later.
- **Don't duplicate the reference's bugs:** the trailing-slash `normalizePath` is correct for
  TacticalRMM and **wrong for GHL** — see §4.2.
