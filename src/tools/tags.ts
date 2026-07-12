import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  CreateTagSchema,
  DeleteTagSchema,
  GetTagSchema,
  ListTagsSchema,
  UpdateTagSchema,
  type CreateTagInput,
  type DeleteTagInput,
  type GetTagInput,
  type UpdateTagInput
} from "../schemas/tags.js";
import { formatResponse, makeToolResponse, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerTagTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_list_tags",
    title: "List GoHighLevel Tags",
    description: "List tags for a GoHighLevel location from /locations/{locationId}/tags.",
    inputSchema: ListTagsSchema.shape,
    path: (params) => `/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/tags`,
    preferredFields: ["id", "name"],
    heading: "GoHighLevel Tags",
    collectionLabel: "tags"
  });

  server.registerTool(
    "ghl_get_tag",
    {
      title: "Get GoHighLevel Tag",
      description: "Get one tag from /locations/{locationId}/tags/{id}.",
      inputSchema: GetTagSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ location_id, tag_id, response_format }: GetTagInput) => {
      try {
        const tag = await client.get<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/tags/${encodeURIComponent(tag_id)}`);
        const data = { tag };
        const markdown = ["# GoHighLevel Tag", "", summarizeRecord(tag, ["id", "name"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_tag",
    {
      title: "Create GoHighLevel Tag",
      description: "Create a location tag. Write operation: do not run against live data without explicit approval.",
      inputSchema: CreateTagSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ location_id, name, response_format }: CreateTagInput) => {
      try {
        const tag = await client.post<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/tags`, { name });
        const data = { tag };
        const markdown = ["# Created GoHighLevel Tag", "", summarizeRecord(tag, ["id", "name"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_tag",
    {
      title: "Update GoHighLevel Tag",
      description: "Update a location tag. Write operation: do not run against live data without explicit approval.",
      inputSchema: UpdateTagSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ location_id, tag_id, name, response_format }: UpdateTagInput) => {
      try {
        const tag = await client.put<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/tags/${encodeURIComponent(tag_id)}`, { name });
        const data = { tag };
        const markdown = ["# Updated GoHighLevel Tag", "", summarizeRecord(tag, ["id", "name"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_tag",
    {
      title: "Delete GoHighLevel Tag",
      description: "Delete a location tag. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteTagSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ location_id, tag_id, confirm, response_format }: DeleteTagInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/tags/${encodeURIComponent(tag_id)}`);
        const data = { tag_id, result };
        const markdown = ["# Deleted GoHighLevel Tag", "", `Deleted tag ${tag_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );
}

function resolveLocationId(client: GoHighLevelClient, locationId: unknown): string {
  return typeof locationId === "string" && locationId.length > 0 ? locationId : client.defaultLocationId;
}
