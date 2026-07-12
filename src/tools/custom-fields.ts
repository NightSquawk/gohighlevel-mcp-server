import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  CreateCustomFieldSchema,
  CreateCustomFieldFolderSchema,
  CreateCustomFieldV2Schema,
  DeleteCustomFieldSchema,
  DeleteCustomFieldFolderSchema,
  DeleteCustomFieldV2Schema,
  GetCustomFieldSchema,
  GetCustomFieldV2Schema,
  ListCustomFieldsSchema,
  ListCustomFieldsV2Schema,
  UpdateCustomFieldFolderSchema,
  UpdateCustomFieldSchema,
  UpdateCustomFieldV2Schema,
  type CreateCustomFieldInput,
  type CreateCustomFieldFolderInput,
  type CreateCustomFieldV2Input,
  type DeleteCustomFieldInput,
  type DeleteCustomFieldFolderInput,
  type DeleteCustomFieldV2Input,
  type GetCustomFieldInput,
  type GetCustomFieldV2Input,
  type UpdateCustomFieldFolderInput,
  type UpdateCustomFieldInput,
  type UpdateCustomFieldV2Input
} from "../schemas/custom-fields.js";
import { formatResponse, makeToolResponse, mergeExtra, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerCustomFieldTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_list_custom_fields",
    title: "List GoHighLevel Custom Fields",
    description: "List custom fields for a GoHighLevel location from /locations/{locationId}/customFields.",
    inputSchema: ListCustomFieldsSchema.shape,
    path: (params) => `/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customFields`,
    preferredFields: ["id", "name", "fieldKey", "dataType", "model", "placeholder"],
    heading: "GoHighLevel Custom Fields",
    collectionLabel: "custom fields"
  });

  server.registerTool(
    "ghl_get_custom_field",
    {
      title: "Get GoHighLevel Custom Field",
      description: "Get one custom field for a GoHighLevel location from /locations/{locationId}/customFields/{id}.",
      inputSchema: GetCustomFieldSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ location_id, field_id, response_format }: GetCustomFieldInput) => {
      try {
        const customField = await client.get<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/customFields/${encodeURIComponent(field_id)}`);
        const data = { customField };
        const markdown = ["# GoHighLevel Custom Field", "", summarizeRecord(customField, ["id", "name", "fieldKey", "dataType", "model"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_custom_field",
    {
      title: "Create GoHighLevel Custom Field",
      description: "Create a custom field for a GoHighLevel location. Write operation: do not run against live data without explicit approval.",
      inputSchema: CreateCustomFieldSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateCustomFieldInput) => {
      try {
        const body = customFieldBody(params);
        const customField = await client.post<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customFields`, body);
        const data = { customField };
        const markdown = ["# Created GoHighLevel Custom Field", "", summarizeRecord(customField, ["id", "name", "fieldKey", "dataType", "model"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_custom_field",
    {
      title: "Update GoHighLevel Custom Field",
      description: "Update a custom field through the current location-scoped API: PUT /locations/{locationId}/customFields/{id}. Write operation: do not run against live data without explicit approval.",
      inputSchema: UpdateCustomFieldSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateCustomFieldInput) => {
      try {
        const body = customFieldBody(params);
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one custom field property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const customField = await client.put<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, params.location_id))}/customFields/${encodeURIComponent(params.field_id)}`, body);
        const data = { customField };
        const markdown = ["# Updated GoHighLevel Custom Field", "", summarizeRecord(customField, ["id", "name", "fieldKey", "dataType", "model"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_custom_field",
    {
      title: "Delete GoHighLevel Custom Field",
      description: "Delete a custom field from /locations/{locationId}/customFields/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteCustomFieldSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ location_id, field_id, confirm, response_format }: DeleteCustomFieldInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/locations/${encodeURIComponent(resolveLocationId(client, location_id))}/customFields/${encodeURIComponent(field_id)}`);
        const data = { field_id, result };
        const markdown = ["# Deleted GoHighLevel Custom Field", "", `Deleted custom field ${field_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  registerCollectionReadTool(server, client, {
    name: "ghl_list_custom_fields_v2",
    title: "List GoHighLevel Custom Fields V2 By Object Key",
    description: "List Custom Fields V2 fields/folders by object key with GET /custom-fields/object-key/{objectKey}. Supports Custom Objects and Company/Business per HighLevel docs.",
    inputSchema: ListCustomFieldsV2Schema.shape,
    path: (params) => `/custom-fields/object-key/${encodeURIComponent(String(params.objectKey))}`,
    query: (params) => ({ locationId: resolveLocationId(client, params.location_id) }),
    preferredFields: ["id", "name", "fieldKey", "objectKey", "dataType", "parentId"],
    heading: "GoHighLevel Custom Fields V2",
    collectionLabel: "custom fields v2"
  });

  server.registerTool(
    "ghl_get_custom_field_v2",
    {
      title: "Get GoHighLevel Custom Field Or Folder V2",
      description: "Get a Custom Fields V2 field or folder by ID with GET /custom-fields/{id}.",
      inputSchema: GetCustomFieldV2Schema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ id, response_format }: GetCustomFieldV2Input) => {
      try {
        const customField = await client.get<unknown>(`/custom-fields/${encodeURIComponent(id)}`);
        const data = { customField };
        const markdown = ["# GoHighLevel Custom Field V2", "", summarizeRecord(customField, ["id", "name", "fieldKey", "objectKey", "dataType", "parentId"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_custom_field_v2",
    {
      title: "Create GoHighLevel Custom Field V2",
      description: "Create a Custom Fields V2 field with POST /custom-fields/. Write operation: do not run against live data without explicit approval.",
      inputSchema: CreateCustomFieldV2Schema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateCustomFieldV2Input) => {
      try {
        const customField = await client.post<unknown>("/custom-fields/", customFieldV2Body(client, params));
        const data = { customField };
        const markdown = ["# Created GoHighLevel Custom Field V2", "", summarizeRecord(customField, ["id", "name", "fieldKey", "objectKey", "dataType", "parentId"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_custom_field_v2",
    {
      title: "Update GoHighLevel Custom Field V2",
      description: "Update a Custom Fields V2 field with PUT /custom-fields/{id}. Write operation: do not run against live data without explicit approval.",
      inputSchema: UpdateCustomFieldV2Schema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateCustomFieldV2Input) => {
      try {
        const body = customFieldV2Body(client, params);
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one Custom Fields V2 property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const customField = await client.put<unknown>(`/custom-fields/${encodeURIComponent(params.id)}`, body);
        const data = { customField };
        const markdown = ["# Updated GoHighLevel Custom Field V2", "", summarizeRecord(customField, ["id", "name", "fieldKey", "objectKey", "dataType", "parentId"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_custom_field_v2",
    {
      title: "Delete GoHighLevel Custom Field V2",
      description: "Delete a Custom Fields V2 field with DELETE /custom-fields/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteCustomFieldV2Schema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ id, confirm, response_format }: DeleteCustomFieldV2Input) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/custom-fields/${encodeURIComponent(id)}`);
        const data = { id, result };
        const markdown = ["# Deleted GoHighLevel Custom Field V2", "", `Deleted Custom Fields V2 field ${id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_custom_field_folder",
    {
      title: "Create GoHighLevel Custom Field Folder",
      description: "Create a Custom Fields V2 folder with POST /custom-fields/folder. Write operation: do not run against live data without explicit approval.",
      inputSchema: CreateCustomFieldFolderSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ location_id, objectKey, name, parentId, extra, response_format }: CreateCustomFieldFolderInput) => {
      try {
        const folder = await client.post<unknown>("/custom-fields/folder", mergeExtra({
          locationId: resolveLocationId(client, location_id),
          objectKey,
          name,
          parentId
        }, extra));
        const data = { folder };
        const markdown = ["# Created GoHighLevel Custom Field Folder", "", summarizeRecord(folder, ["id", "name", "objectKey", "locationId"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_custom_field_folder",
    {
      title: "Update GoHighLevel Custom Field Folder",
      description: "Update a Custom Fields V2 folder name with PUT /custom-fields/folder/{id}. Write operation: do not run against live data without explicit approval.",
      inputSchema: UpdateCustomFieldFolderSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ folder_id, name, response_format }: UpdateCustomFieldFolderInput) => {
      try {
        const folder = await client.put<unknown>(`/custom-fields/folder/${encodeURIComponent(folder_id)}`, {
          locationId: client.defaultLocationId,
          name
        });
        const data = { folder };
        const markdown = ["# Updated GoHighLevel Custom Field Folder", "", summarizeRecord(folder, ["id", "name", "objectKey", "locationId"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_custom_field_folder",
    {
      title: "Delete GoHighLevel Custom Field Folder",
      description: "Delete a Custom Fields V2 folder with DELETE /custom-fields/folder/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteCustomFieldFolderSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ folder_id, confirm, response_format }: DeleteCustomFieldFolderInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/custom-fields/folder/${encodeURIComponent(folder_id)}`);
        const data = { folder_id, result };
        const markdown = ["# Deleted GoHighLevel Custom Field Folder", "", `Deleted Custom Fields V2 folder ${folder_id}.`].join("\n");
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

function customFieldBody(params: CreateCustomFieldInput | UpdateCustomFieldInput): Record<string, unknown> {
  return omitUndefined({
    name: params.name,
    dataType: params.dataType,
    placeholder: params.placeholder,
    position: params.position,
    model: params.model,
    options: params.options,
    acceptedFormat: params.acceptedFormat,
    isMultipleFile: params.isMultipleFile,
    maxNumberOfFiles: params.maxNumberOfFiles,
    textBoxListOptions: params.textBoxListOptions
  });
}

function customFieldV2Body(client: GoHighLevelClient, params: CreateCustomFieldV2Input | UpdateCustomFieldV2Input): Record<string, unknown> {
  return mergeExtra({
    locationId: params.locationId ?? client.defaultLocationId,
    name: params.name,
    objectKey: params.objectKey,
    dataType: params.dataType,
    description: params.description,
    placeholder: params.placeholder,
    parentId: params.parentId,
    showInForms: params.showInForms,
    options: params.options,
    acceptedFormats: params.acceptedFormats,
    allowCustomOption: params.allowCustomOption,
    maxFileLimit: params.maxFileLimit
  }, params.extra);
}
