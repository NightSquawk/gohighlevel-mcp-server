# GoHighLevel MCP Server

[![npm version](https://img.shields.io/npm/v/@nightsquawktech/gohighlevel-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/gohighlevel-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@nightsquawktech/gohighlevel-mcp-server)](https://www.npmjs.com/package/@nightsquawktech/gohighlevel-mcp-server)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/NightSquawk/gohighlevel-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/NightSquawk/gohighlevel-mcp-server)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](https://github.com/NightSquawk/gohighlevel-mcp-server/blob/v1.0.0/LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

An MCP (Model Context Protocol) server for **GoHighLevel**, connecting your CRM to AI tools. 56 curated tools over the GoHighLevel API v2, built to fill the gaps the official HighLevel MCP leaves open: full custom-field CRUD, contact delete, and a guarded duplicate-contact merge.

## Quick start

### Claude

[![Download for Claude Desktop](https://img.shields.io/badge/Claude_Desktop-Download_.mcpb-D97757?style=flat-square)](https://github.com/NightSquawk/gohighlevel-mcp-server/releases/download/mcpb-v0.1.0/gohighlevel-mcp-server-0.1.0.mcpb)

**bash (macOS/Linux):**

```bash
GHL_API_TOKEN="pit-your-private-integration-token"
GHL_LOCATION_ID="your-location-id"

claude mcp add gohighlevel \
  --env GHL_API_TOKEN="$GHL_API_TOKEN" \
  --env GHL_LOCATION_ID="$GHL_LOCATION_ID" \
  -- npx -y @nightsquawktech/gohighlevel-mcp-server
```

**PowerShell (Windows):**

```powershell
$GHL_API_TOKEN = "pit-your-private-integration-token"
$GHL_LOCATION_ID = "your-location-id"

claude mcp add gohighlevel `
  --env "GHL_API_TOKEN=$GHL_API_TOKEN" `
  --env "GHL_LOCATION_ID=$GHL_LOCATION_ID" `
  -- npx -y @nightsquawktech/gohighlevel-mcp-server
```

### Cursor

[![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=gohighlevel&config=eyJjb21tYW5kIjogIm5weCIsICJhcmdzIjogWyIteSIsICJAbmlnaHRzcXVhd2t0ZWNoL2dvaGlnaGxldmVsLW1jcC1zZXJ2ZXIiXSwgImVudiI6IHsiR0hMX0FQSV9UT0tFTiI6ICJwaXQteW91ci1wcml2YXRlLWludGVncmF0aW9uLXRva2VuIiwgIkdITF9MT0NBVElPTl9JRCI6ICJ5b3VyLWxvY2F0aW9uLWlkIiwgIkdITF9CQVNFX1VSTCI6ICJodHRwczovL3NlcnZpY2VzLmxlYWRjb25uZWN0b3JocS5jb20iLCAiR0hMX0FQSV9WRVJTSU9OIjogIjIwMjEtMDctMjgiLCAiR0hMX1RJTUVPVVRfTVMiOiAiMzAwMDAifX0%3D)

Or put the [mcp.json](#mcpjson) block in `.cursor/mcp.json`, then verify with:

```bash
agent mcp list
```

(The Cursor CLI manages configured servers but has no `mcp add`; install is via the button or `mcp.json`.)

### VS Code

[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=gohighlevel&config=%7B%22command%22%3A%20%22npx%22%2C%20%22args%22%3A%20%5B%22-y%22%2C%20%22%40nightsquawktech/gohighlevel-mcp-server%22%5D%2C%20%22env%22%3A%20%7B%22GHL_API_TOKEN%22%3A%20%22pit-your-private-integration-token%22%2C%20%22GHL_LOCATION_ID%22%3A%20%22your-location-id%22%2C%20%22GHL_BASE_URL%22%3A%20%22https%3A//services.leadconnectorhq.com%22%2C%20%22GHL_API_VERSION%22%3A%20%222021-07-28%22%2C%20%22GHL_TIMEOUT_MS%22%3A%20%2230000%22%7D%7D)

**bash (macOS/Linux):**

```bash
GHL_API_TOKEN="pit-your-private-integration-token"
GHL_LOCATION_ID="your-location-id"

code --add-mcp '{"name":"gohighlevel","command":"npx","args":["-y","@nightsquawktech/gohighlevel-mcp-server"],"env":{"GHL_API_TOKEN":"'"$GHL_API_TOKEN"'","GHL_LOCATION_ID":"'"$GHL_LOCATION_ID"'"}}'
```

**PowerShell (Windows):**

```powershell
$GHL_API_TOKEN = "pit-your-private-integration-token"
$GHL_LOCATION_ID = "your-location-id"

$config = @{
  name = "gohighlevel"
  command = "npx"
  args = @("-y", "@nightsquawktech/gohighlevel-mcp-server")
  env = @{
    GHL_API_TOKEN = $GHL_API_TOKEN
    GHL_LOCATION_ID = $GHL_LOCATION_ID
  }
} | ConvertTo-Json -Compress

code --add-mcp $config
```

### Codex

**bash (macOS/Linux):**

```bash
GHL_API_TOKEN="pit-your-private-integration-token"
GHL_LOCATION_ID="your-location-id"

codex mcp add gohighlevel \
  --env GHL_API_TOKEN="$GHL_API_TOKEN" \
  --env GHL_LOCATION_ID="$GHL_LOCATION_ID" \
  -- npx -y @nightsquawktech/gohighlevel-mcp-server
```

**PowerShell (Windows):**

```powershell
$GHL_API_TOKEN = "pit-your-private-integration-token"
$GHL_LOCATION_ID = "your-location-id"

codex mcp add gohighlevel `
  --env "GHL_API_TOKEN=$GHL_API_TOKEN" `
  --env "GHL_LOCATION_ID=$GHL_LOCATION_ID" `
  -- npx -y @nightsquawktech/gohighlevel-mcp-server
```

Or add it to `~/.codex/config.toml` under `[mcp_servers.gohighlevel]`.

### mcp.json

Every environment variable the server reads, with recommended values:

```json
{
  "mcpServers": {
    "gohighlevel": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/gohighlevel-mcp-server"],
      "env": {
        "GHL_API_TOKEN": "pit-your-private-integration-token",
        "GHL_LOCATION_ID": "your-location-id",
        "GHL_BASE_URL": "https://services.leadconnectorhq.com",
        "GHL_API_VERSION": "2021-07-28",
        "GHL_TIMEOUT_MS": "30000"
      }
    }
  }
}
```

File locations: `.mcp.json` in your project root (Claude Code), `claude_desktop_config.json` (Claude Desktop), `.cursor/mcp.json` (Cursor).

## Configuration

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `GHL_API_TOKEN` | yes | | Private Integration token (`pit-...`) from Settings > Private Integrations, or an OAuth sub-account access token |
| `GHL_LOCATION_ID` | yes | | Default GoHighLevel sub-account/location ID; individual calls can override it |
| `GHL_BASE_URL` | no | `https://services.leadconnectorhq.com` | GoHighLevel API v2 base URL |
| `GHL_API_VERSION` | no | `2021-07-28` | `Version` header sent on every request |
| `GHL_TIMEOUT_MS` | no | `30000` | HTTP timeout for API requests, minimum 1000 |

## Security & write safety

GoHighLevel credentials: create a dedicated Private Integration in Settings > Private Integrations and grant only the scopes you need (for example `contacts.readonly`, `contacts.write`, `locations/customFields.write`, `opportunities.readonly`). Dropping a `.write` scope from the token makes that domain hard read-only no matter what the tools attempt.

This server is a read/write CRM surface: of its **56 tools**, 22 are read-only, 22 create or update records, and 12 are destructive (deletes, tag/workflow removal, contact merge, outbound message send).

- Every destructive tool refuses to call the API unless the request includes **`confirm: true`**; without it the tool returns an error and nothing is sent to GoHighLevel.
- `ghl_send_message` (outbound SMS/email to real contacts) is confirm-gated for the same reason.
- `ghl_merge_contacts_delete_loser` previews by default: it reads both contacts, checks the loser for notes, tasks, conversations, and opportunities, and refuses to delete a loser with any history even when confirmed.
- Create and update tools execute directly (no confirm flag); their descriptions instruct the model not to run against live data without explicit approval, but the API call itself is not blocked. Scope the token accordingly.
- All requests go directly from your machine to your GoHighLevel instance; nothing passes through third parties.

> [!IMPORTANT]
> The `confirm: true` gate is a guardrail, not a security boundary. The env vars in your MCP config are real credentials, and an AI agent with shell access can bypass the MCP tools and call the GoHighLevel API directly with them. If you need hard read-only, enforce it at the source: grant the Private Integration token only `.readonly` scopes.

## Tools

```
ghl_list_custom_fields             List custom fields for a location
ghl_get_custom_field               Get one custom field
ghl_create_custom_field            Create a custom field
ghl_update_custom_field            Update a custom field
ghl_delete_custom_field            Delete a custom field (confirm: true)
ghl_list_custom_fields_v2          List Custom Fields V2 fields/folders by object key
ghl_get_custom_field_v2            Get a Custom Fields V2 field or folder by ID
ghl_create_custom_field_v2         Create a Custom Fields V2 field
ghl_update_custom_field_v2         Update a Custom Fields V2 field
ghl_delete_custom_field_v2         Delete a Custom Fields V2 field (confirm: true)
ghl_create_custom_field_folder     Create a Custom Fields V2 folder
ghl_update_custom_field_folder     Rename a Custom Fields V2 folder
ghl_delete_custom_field_folder     Delete a Custom Fields V2 folder (confirm: true)

ghl_list_custom_values             List custom values for a location
ghl_get_custom_value               Get one custom value
ghl_create_custom_value            Create a custom value
ghl_update_custom_value            Update a custom value
ghl_delete_custom_value            Delete a custom value (confirm: true)

ghl_search_contacts                Search contacts with server-side filters
ghl_get_contact                    Get one contact
ghl_create_contact                 Create a contact
ghl_update_contact                 Update a contact
ghl_upsert_contact                 Create or update a contact in one call
ghl_delete_contact                 Delete a contact (confirm: true)
ghl_merge_contacts_delete_loser    Guarded duplicate merge: preview, then delete loser and copy its email to survivor (confirm: true)
ghl_add_contact_tags               Add tags to a contact
ghl_remove_contact_tags            Remove tags from a contact (confirm: true)
ghl_add_contact_to_workflow        Add a contact to a workflow
ghl_remove_contact_from_workflow   Remove a contact from a workflow (confirm: true)
ghl_get_contact_notes              List notes on a contact
ghl_create_contact_note            Create a note on a contact
ghl_get_contact_tasks              List tasks on a contact
ghl_create_contact_task            Create a task on a contact

ghl_list_tags                      List tags for a location
ghl_get_tag                        Get one tag
ghl_create_tag                     Create a location tag
ghl_update_tag                     Rename a location tag
ghl_delete_tag                     Delete a location tag (confirm: true)

ghl_search_opportunities           Search opportunities with server-side filters
ghl_get_pipelines                  List opportunity pipelines and stages
ghl_get_opportunity                Get one opportunity
ghl_create_opportunity             Create an opportunity
ghl_update_opportunity             Update an opportunity
ghl_update_opportunity_status      Set opportunity status (open/won/lost/abandoned)
ghl_delete_opportunity             Delete an opportunity (confirm: true)

ghl_search_conversations           Search conversations
ghl_get_conversation_messages      List messages in a conversation
ghl_send_message                   Send an outbound SMS/email/message (confirm: true)

ghl_list_calendars                 List calendars for a location
ghl_get_calendar_events            List calendar events
ghl_get_free_slots                 Get free booking slots for a calendar
ghl_create_appointment             Create an appointment
ghl_update_appointment             Update an appointment
ghl_delete_appointment             Delete a calendar event (confirm: true)

ghl_get_location                   Get the location/sub-account details
ghl_list_users                     List users for a location
```

All tools return both text and `structuredContent`; read tools support `response_format: "markdown" | "json"` plus `limit`/`offset` pagination.

## API coverage

56 operations covered across the GoHighLevel API v2 (`services.leadconnectorhq.com`).

| Category | Operations |
|---|---|
| Custom fields (v1 + V2 + folders) | 13 |
| Custom values | 5 |
| Contacts (incl. notes, tasks, tags, workflows, merge) | 15 |
| Tags | 5 |
| Opportunities & pipelines | 7 |
| Conversations & messages | 3 |
| Calendars & appointments | 6 |
| Locations & users | 2 |

<details>
<summary><strong>Custom fields</strong> (13 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/locations/{locationId}/customFields` | `ghl_list_custom_fields` |
| GET | `/locations/{locationId}/customFields/{id}` | `ghl_get_custom_field` |
| POST | `/locations/{locationId}/customFields` | `ghl_create_custom_field` |
| PUT | `/locations/{locationId}/customFields/{id}` | `ghl_update_custom_field` |
| DELETE | `/locations/{locationId}/customFields/{id}` | `ghl_delete_custom_field` |
| GET | `/custom-fields/object-key/{objectKey}` | `ghl_list_custom_fields_v2` |
| GET | `/custom-fields/{id}` | `ghl_get_custom_field_v2` |
| POST | `/custom-fields/` | `ghl_create_custom_field_v2` |
| PUT | `/custom-fields/{id}` | `ghl_update_custom_field_v2` |
| DELETE | `/custom-fields/{id}` | `ghl_delete_custom_field_v2` |
| POST | `/custom-fields/folder` | `ghl_create_custom_field_folder` |
| PUT | `/custom-fields/folder/{id}` | `ghl_update_custom_field_folder` |
| DELETE | `/custom-fields/folder/{id}` | `ghl_delete_custom_field_folder` |

</details>

<details>
<summary><strong>Custom values</strong> (5 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/locations/{locationId}/customValues` | `ghl_list_custom_values` |
| GET | `/locations/{locationId}/customValues/{id}` | `ghl_get_custom_value` |
| POST | `/locations/{locationId}/customValues` | `ghl_create_custom_value` |
| PUT | `/locations/{locationId}/customValues/{id}` | `ghl_update_custom_value` |
| DELETE | `/locations/{locationId}/customValues/{id}` | `ghl_delete_custom_value` |

</details>

<details>
<summary><strong>Contacts</strong> (15 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| POST | `/contacts/search` | `ghl_search_contacts` |
| GET | `/contacts/{contactId}` | `ghl_get_contact` |
| POST | `/contacts/` | `ghl_create_contact` |
| PUT | `/contacts/{contactId}` | `ghl_update_contact` |
| POST | `/contacts/upsert` | `ghl_upsert_contact` |
| DELETE | `/contacts/{contactId}` | `ghl_delete_contact` |
| GET, DELETE, PUT | `/contacts/{contactId}` (composite) | `ghl_merge_contacts_delete_loser` |
| POST | `/contacts/{contactId}/tags` | `ghl_add_contact_tags` |
| DELETE | `/contacts/{contactId}/tags` | `ghl_remove_contact_tags` |
| POST | `/contacts/{contactId}/workflow/{workflowId}` | `ghl_add_contact_to_workflow` |
| DELETE | `/contacts/{contactId}/workflow/{workflowId}` | `ghl_remove_contact_from_workflow` |
| GET | `/contacts/{contactId}/notes` | `ghl_get_contact_notes` |
| POST | `/contacts/{contactId}/notes` | `ghl_create_contact_note` |
| GET | `/contacts/{contactId}/tasks` | `ghl_get_contact_tasks` |
| POST | `/contacts/{contactId}/tasks` | `ghl_create_contact_task` |

The merge tool composes preflight reads (`GET /contacts/{contactId}` on both contacts, `GET /contacts/{contactId}/notes`, `GET /contacts/{contactId}/tasks`, `GET /conversations/search`, `GET /opportunities/search`) before `DELETE /contacts/{loserId}` and `PUT /contacts/{survivorId}`.

</details>

<details>
<summary><strong>Tags</strong> (5 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/locations/{locationId}/tags` | `ghl_list_tags` |
| GET | `/locations/{locationId}/tags/{tagId}` | `ghl_get_tag` |
| POST | `/locations/{locationId}/tags` | `ghl_create_tag` |
| PUT | `/locations/{locationId}/tags/{tagId}` | `ghl_update_tag` |
| DELETE | `/locations/{locationId}/tags/{tagId}` | `ghl_delete_tag` |

</details>

<details>
<summary><strong>Opportunities & pipelines</strong> (7 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/opportunities/search` | `ghl_search_opportunities` |
| GET | `/opportunities/pipelines` | `ghl_get_pipelines` |
| GET | `/opportunities/{id}` | `ghl_get_opportunity` |
| POST | `/opportunities/` | `ghl_create_opportunity` |
| PUT | `/opportunities/{id}` | `ghl_update_opportunity` |
| PUT | `/opportunities/{id}/status` | `ghl_update_opportunity_status` |
| DELETE | `/opportunities/{id}` | `ghl_delete_opportunity` |

</details>

<details>
<summary><strong>Conversations & messages</strong> (3 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/conversations/search` | `ghl_search_conversations` |
| GET | `/conversations/{conversationId}/messages` | `ghl_get_conversation_messages` |
| POST | `/conversations/messages` | `ghl_send_message` |

</details>

<details>
<summary><strong>Calendars & appointments</strong> (6 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/calendars/` | `ghl_list_calendars` |
| GET | `/calendars/events` | `ghl_get_calendar_events` |
| GET | `/calendars/{calendarId}/free-slots` | `ghl_get_free_slots` |
| POST | `/calendars/events/appointments` | `ghl_create_appointment` |
| PUT | `/calendars/events/appointments/{eventId}` | `ghl_update_appointment` |
| DELETE | `/calendars/events/{eventId}` | `ghl_delete_appointment` |

</details>

<details>
<summary><strong>Locations & users</strong> (2 operations)</summary>

| Method | Path | Tool |
|---|---|---|
| GET | `/locations/{locationId}` | `ghl_get_location` |
| GET | `/users/` | `ghl_list_users` |

</details>

## Contributing

Contributions and issues are welcome. Please open an issue first before submitting a PR.

## License

AGPL-3.0: free for personal and open-source use. Organizations that cannot comply with the AGPL can purchase a commercial license, and hosted/managed versions are available. See [COMMERCIAL.md](https://github.com/NightSquawk/gohighlevel-mcp-server/blob/v1.0.0/COMMERCIAL.md) or contact hello@nightsquawk.tech.

### Copyright

For copyright concerns or takedown requests, contact hello@nightsquawk.tech.
