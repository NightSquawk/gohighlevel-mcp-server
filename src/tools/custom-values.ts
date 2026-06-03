import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  CreateCustomValueSchema,
  DeleteCustomValueSchema,
  GetCustomValueSchema,
  ListCustomValuesSchema,
  UpdateCustomValueSchema,
  type CreateCustomValueInput,
  type DeleteCustomValueInput,
  type GetCustomValueInput,
  type UpdateCustomValueInput
} from "../schemas/custom-values.js";
import { formatResponse, makeToolResponse, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerCustomValueTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_list_custom_values",
    title: "List GoHighLevel Custom Values",
    description: "List custom values for a GoHighLevel location from /locations/{locationId}/customValues.",
    inputSchema: ListCustomValuesSchema.shape,
    path: (params) => `/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customValues`,
    preferredFields: ["id", "name", "value", "fieldKey"],
    heading: "GoHighLevel Custom Values",
    collectionLabel: "custom values"
  });

  server.registerTool(
    "ghl_get_custom_value",
    {
      title: "Get GoHighLevel Custom Value",
      description: "Get one custom value from /locations/{locationId}/customValues/{id}.",
      inputSchema: GetCustomValueSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ location_id, custom_value_id, response_format }: GetCustomValueInput) => {
      try {
        const customValue = await client.get<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/customValues/${encodeURIComponent(custom_value_id)}`);
        const data = { customValue };
        const markdown = ["# GoHighLevel Custom Value", "", summarizeRecord(customValue, ["id", "name", "value", "fieldKey"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_custom_value",
    {
      title: "Create GoHighLevel Custom Value",
      description: "Create a custom value for a GoHighLevel location. Rule 8: do not run against live data without owner approval.",
      inputSchema: CreateCustomValueSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateCustomValueInput) => {
      try {
        const customValue = await client.post<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customValues`, {
          name: params.name,
          value: params.value
        });
        const data = { customValue };
        const markdown = ["# Created GoHighLevel Custom Value", "", summarizeRecord(customValue, ["id", "name", "value", "fieldKey"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_custom_value",
    {
      title: "Update GoHighLevel Custom Value",
      description: "Update a custom value from /locations/{locationId}/customValues/{id}. Rule 8: do not run against live data without owner approval.",
      inputSchema: UpdateCustomValueSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateCustomValueInput) => {
      try {
        const body = omitUndefined({ name: params.name, value: params.value });
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one custom value property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const customValue = await client.put<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customValues/${encodeURIComponent(params.custom_value_id)}`, body);
        const data = { customValue };
        const markdown = ["# Updated GoHighLevel Custom Value", "", summarizeRecord(customValue, ["id", "name", "value", "fieldKey"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_custom_value",
    {
      title: "Delete GoHighLevel Custom Value",
      description: "Delete a custom value from /locations/{locationId}/customValues/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteCustomValueSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ location_id, custom_value_id, confirm, response_format }: DeleteCustomValueInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/customValues/${encodeURIComponent(custom_value_id)}`);
        const data = { custom_value_id, result };
        const markdown = ["# Deleted GoHighLevel Custom Value", "", `Deleted custom value ${custom_value_id}.`].join("\n");
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
