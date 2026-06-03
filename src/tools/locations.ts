import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import { GetLocationSchema, ListUsersSchema, type GetLocationInput } from "../schemas/locations.js";
import { formatResponse, makeToolResponse, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerLocationTools(server: McpServer, client: GoHighLevelClient): void {
  server.registerTool(
    "ghl_get_location",
    {
      title: "Get GoHighLevel Location",
      description: "Get one GoHighLevel location/sub-account with GET /locations/{locationId}.",
      inputSchema: GetLocationSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ location_id, response_format }: GetLocationInput) => {
      try {
        const location = await client.get<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}`);
        const data = { location };
        const markdown = ["# GoHighLevel Location", "", summarizeRecord(location, ["id", "name", "businessName", "email", "phone", "timezone"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  registerCollectionReadTool(server, client, {
    name: "ghl_list_users",
    title: "List GoHighLevel Users",
    description: "List users for a location with GET /users/?locationId={locationId}.",
    inputSchema: ListUsersSchema.shape,
    path: () => "/users/",
    query: (params) => ({ locationId: resolveLocationId(client, params.location_id) }),
    preferredFields: ["id", "name", "firstName", "lastName", "email", "phone", "role"],
    heading: "GoHighLevel Users",
    collectionLabel: "users"
  });
}

function resolveLocationId(client: GoHighLevelClient, locationId: unknown): string {
  return typeof locationId === "string" && locationId.length > 0 ? locationId : client.defaultLocationId;
}
