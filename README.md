# @nightsquawktech/gohighlevel-mcp-server

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/NightSquawk/gohighlevel-mcp-server/badge)](https://scorecard.dev/viewer/?uri=github.com/NightSquawk/gohighlevel-mcp-server)

Stdio MCP server for curated GoHighLevel API v2 coverage. It is intended to run beside the official hosted HighLevel MCP and fill the gaps that server does not expose:

- create, update, and delete custom fields
- delete contacts
- guarded duplicate-contact merge workaround for records that are safe to hard-delete

This implementation covers all phases in `SCOPE.md`: custom fields, custom values, contacts, opportunities, tags, conversations, calendars, locations/users, contact notes/tasks, and Custom Fields V2/folders. Destructive and outbound tools (deletes, merges, message sends) require an explicit `confirm: true` parameter and should only be run with explicit human approval.

## Custom Field API Fork

The P1 custom-field write tools use the current location-scoped endpoints:

- `PUT /locations/{locationId}/customFields/{id}`
- `DELETE /locations/{locationId}/customFields/{id}`

The newer `/custom-fields/{id}` V2 API is documented separately and says it only supports Custom Objects and Company/Business today. It is implemented as separate V2/folder tools instead of replacing the location-scoped contact/opportunity custom-field tools.

## Setup

Configure your MCP client to run the server with `npx`:

```json
{
  "mcpServers": {
    "gohighlevel": {
      "command": "npx",
      "args": ["-y", "@nightsquawktech/gohighlevel-mcp-server"],
      "env": {
        "GHL_API_TOKEN": "pit-...",
        "GHL_LOCATION_ID": "<location id>",
        "GHL_API_VERSION": "2021-07-28"
      }
    }
  }
}
```

## Environment

- `GHL_API_TOKEN` required. Private Integration Token or OAuth sub-account access token.
- `GHL_LOCATION_ID` required. Default sub-account/location ID.
- `GHL_BASE_URL` optional, default `https://services.leadconnectorhq.com`.
- `GHL_API_VERSION` optional, default `2021-07-28`.
- `GHL_TIMEOUT_MS` optional, default `30000`.

Required Private Integration scopes for the full server roadmap:

- `locations/customFields.readonly`, `locations/customFields.write`
- `locations/customValues.readonly`, `locations/customValues.write`
- `contacts.readonly`, `contacts.write`
- `opportunities.readonly`, `opportunities.write`
- `conversations.readonly`, `conversations.write`
- `conversations/message.readonly`, `conversations/message.write`
- `calendars.readonly`, `calendars.write`
- `calendars/events.readonly`, `calendars/events.write`
- `locations.readonly`, `locations.write`
- `workflows.readonly`

## Tools

- `ghl_list_custom_fields`
- `ghl_get_custom_field`
- `ghl_create_custom_field`
- `ghl_update_custom_field`
- `ghl_delete_custom_field` requires `confirm: true`
- `ghl_list_custom_values`
- `ghl_get_custom_value`
- `ghl_create_custom_value`
- `ghl_update_custom_value`
- `ghl_delete_custom_value` requires `confirm: true`
- `ghl_search_contacts`
- `ghl_get_contact`
- `ghl_create_contact`
- `ghl_update_contact`
- `ghl_upsert_contact`
- `ghl_delete_contact` requires `confirm: true`
- `ghl_merge_contacts_delete_loser` previews by default; requires `confirm: true`, deletes the loser only after zero-history preflight checks, then updates the survivor email
- `ghl_add_contact_tags`
- `ghl_remove_contact_tags` requires `confirm: true`
- `ghl_add_contact_to_workflow`
- `ghl_remove_contact_from_workflow` requires `confirm: true`
- `ghl_get_contact_notes`
- `ghl_create_contact_note`
- `ghl_get_contact_tasks`
- `ghl_create_contact_task`
- `ghl_search_opportunities`
- `ghl_get_pipelines`
- `ghl_get_opportunity`
- `ghl_create_opportunity`
- `ghl_update_opportunity`
- `ghl_update_opportunity_status`
- `ghl_delete_opportunity` requires `confirm: true`
- `ghl_list_tags`
- `ghl_get_tag`
- `ghl_create_tag`
- `ghl_update_tag`
- `ghl_delete_tag` requires `confirm: true`
- `ghl_search_conversations`
- `ghl_get_conversation_messages`
- `ghl_send_message` requires `confirm: true`
- `ghl_list_calendars`
- `ghl_get_calendar_events`
- `ghl_get_free_slots`
- `ghl_create_appointment`
- `ghl_update_appointment`
- `ghl_delete_appointment` requires `confirm: true`
- `ghl_get_location`
- `ghl_list_users`
- `ghl_list_custom_fields_v2`
- `ghl_get_custom_field_v2`
- `ghl_create_custom_field_v2`
- `ghl_update_custom_field_v2`
- `ghl_delete_custom_field_v2` requires `confirm: true`
- `ghl_create_custom_field_folder`
- `ghl_update_custom_field_folder`
- `ghl_delete_custom_field_folder` requires `confirm: true`

All tools return both text content and `structuredContent`. Read tools support `response_format: "markdown" | "json"`.

## Verification

Read-only smoke tests:

```powershell
$h = @{
  Authorization = "Bearer $env:GHL_API_TOKEN"
  Version = $env:GHL_API_VERSION ?? "2021-07-28"
  Accept = "application/json"
}
Invoke-RestMethod "https://services.leadconnectorhq.com/locations/$env:GHL_LOCATION_ID/customFields" -Headers $h
Invoke-RestMethod "https://services.leadconnectorhq.com/locations/$env:GHL_LOCATION_ID/customValues" -Headers $h
Invoke-RestMethod "https://services.leadconnectorhq.com/locations/$env:GHL_LOCATION_ID/tags" -Headers $h
Invoke-RestMethod "https://services.leadconnectorhq.com/contacts/search" -Method Post -Headers $h -ContentType "application/json" -Body (@{ locationId = $env:GHL_LOCATION_ID; pageLimit = 1 } | ConvertTo-Json)
Invoke-RestMethod "https://services.leadconnectorhq.com/opportunities/pipelines?locationId=$env:GHL_LOCATION_ID" -Headers $h
Invoke-RestMethod "https://services.leadconnectorhq.com/calendars/?locationId=$env:GHL_LOCATION_ID" -Headers $h
Invoke-RestMethod "https://services.leadconnectorhq.com/users/?locationId=$env:GHL_LOCATION_ID" -Headers $h
```

Owner-approved write/delete test plan:

1. Create a disposable custom value, read it back, update its `value`, then delete it with `confirm: true`.
2. Create a disposable custom field named with a clear test prefix, read it back, update its placeholder, then delete it with `confirm: true`.
3. Pick or create a disposable contact, add a disposable tag, remove the tag with `confirm: true`, then delete the contact with `confirm: true` only if the owner approves contact deletion.
4. Add a disposable contact to a safe test workflow, then remove it with `confirm: true`.
5. Create/update/upsert a disposable contact, then verify no production contact was modified.
6. Create a disposable opportunity in a test pipeline/stage, update it, update its status, then delete it with `confirm: true`.
7. Send a message only to an owner-approved test contact/channel with `confirm: true`.
8. Create/update/delete a disposable appointment on a test calendar with `confirm: true` for delete.
9. Create/update/delete a disposable Custom Fields V2 field and folder only under an owner-approved test object key, with `confirm: true` for deletes.
10. Create a disposable contact note and task only on an owner-approved test contact.
11. For each destructive tool, first call it without `confirm: true` and verify it returns an MCP error without calling GoHighLevel.
12. For `ghl_merge_contacts_delete_loser`, first run `confirm: false` against an owner-approved duplicate pair and verify the preview shows the loser email, survivor email, and zero notes/tasks/conversations/opportunities/history-check errors. For the destructive test, use only disposable contacts: create a survivor and loser, set the loser's email, verify no history exists, run with `confirm: true`, verify the loser is gone and the survivor has the copied email. Separately verify the guard by adding a note/task to a disposable loser and confirming the merge is skipped without deletion.

Use stderr only for logs. Never commit `.env` or real tokens.

## Development

```sh
npm install
npm run dev
npm run build
```

## License

Licensed under the [GNU AGPL v3.0](./LICENSE). Free for personal and open-source use.

Organizations that cannot comply with the AGPL can purchase a commercial license. See [COMMERCIAL.md](./COMMERCIAL.md) or contact hello@nightsquawk.tech.
