import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  CreateOpportunitySchema,
  DeleteOpportunitySchema,
  GetPipelinesSchema,
  OpportunityIdSchema,
  SearchOpportunitiesSchema,
  UpdateOpportunitySchema,
  UpdateOpportunityStatusSchema,
  type CreateOpportunityInput,
  type DeleteOpportunityInput,
  type OpportunityIdInput,
  type UpdateOpportunityInput,
  type UpdateOpportunityStatusInput
} from "../schemas/opportunities.js";
import { formatResponse, makeToolResponse, mergeExtra, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerOpportunityTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_search_opportunities",
    title: "Search GoHighLevel Opportunities",
    description: "Search opportunities with GET /opportunities/search using GoHighLevel server-side filters.",
    inputSchema: SearchOpportunitiesSchema.shape,
    path: () => "/opportunities/search",
    query: (params) => omitUndefined({
      location_id: resolveLocationId(client, params.location_id),
      q: params.q,
      pipeline_id: params.pipeline_id,
      pipeline_stage_id: params.pipeline_stage_id,
      status: params.status,
      assigned_to: params.assigned_to,
      campaignId: params.campaignId,
      id: params.id,
      order: params.order,
      endDate: params.endDate,
      startAfter: params.startAfter,
      startAfterId: params.startAfterId,
      date: params.date,
      country: params.country,
      limit: params.server_limit,
      page: params.page
    }),
    preferredFields: ["id", "name", "contactId", "pipelineId", "pipelineStageId", "status", "monetaryValue"],
    heading: "GoHighLevel Opportunities",
    collectionLabel: "opportunities"
  });

  registerCollectionReadTool(server, client, {
    name: "ghl_get_pipelines",
    title: "Get GoHighLevel Pipelines",
    description: "List opportunity pipelines with GET /opportunities/pipelines?locationId={locationId}.",
    inputSchema: GetPipelinesSchema.shape,
    path: () => "/opportunities/pipelines",
    query: (params) => ({ locationId: resolveLocationId(client, params.location_id) }),
    preferredFields: ["id", "name", "stages"],
    heading: "GoHighLevel Pipelines",
    collectionLabel: "pipelines"
  });

  server.registerTool(
    "ghl_get_opportunity",
    {
      title: "Get GoHighLevel Opportunity",
      description: "Get one opportunity with GET /opportunities/{id}.",
      inputSchema: OpportunityIdSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ opportunity_id, response_format }: OpportunityIdInput) => {
      try {
        const opportunity = await client.get<unknown>(`/opportunities/${encodeURIComponent(opportunity_id)}`);
        const data = { opportunity };
        const markdown = ["# GoHighLevel Opportunity", "", summarizeRecord(opportunity, ["id", "name", "contactId", "pipelineId", "pipelineStageId", "status", "monetaryValue"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_opportunity",
    {
      title: "Create GoHighLevel Opportunity",
      description: "Create an opportunity with POST /opportunities/. Rule 8: do not run against live data without owner approval.",
      inputSchema: CreateOpportunitySchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateOpportunityInput) => {
      try {
        const opportunity = await client.post<unknown>("/opportunities/", opportunityBody(client, params, true));
        const data = { opportunity };
        const markdown = ["# Created GoHighLevel Opportunity", "", summarizeRecord(opportunity, ["id", "name", "contactId", "pipelineId", "pipelineStageId", "status", "monetaryValue"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_opportunity",
    {
      title: "Update GoHighLevel Opportunity",
      description: "Update an opportunity with PUT /opportunities/{id}. Rule 8: do not run against live data without owner approval.",
      inputSchema: UpdateOpportunitySchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateOpportunityInput) => {
      try {
        const body = opportunityBody(client, params, false);
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one opportunity property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const opportunity = await client.put<unknown>(`/opportunities/${encodeURIComponent(params.opportunity_id)}`, body);
        const data = { opportunity };
        const markdown = ["# Updated GoHighLevel Opportunity", "", summarizeRecord(opportunity, ["id", "name", "contactId", "pipelineId", "pipelineStageId", "status", "monetaryValue"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_opportunity_status",
    {
      title: "Update GoHighLevel Opportunity Status",
      description: "Update opportunity status with PUT /opportunities/{id}/status. Rule 8: do not run against live data without owner approval.",
      inputSchema: UpdateOpportunityStatusSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ opportunity_id, status, response_format }: UpdateOpportunityStatusInput) => {
      try {
        const opportunity = await client.put<unknown>(`/opportunities/${encodeURIComponent(opportunity_id)}/status`, { status });
        const data = { opportunity };
        const markdown = ["# Updated GoHighLevel Opportunity Status", "", summarizeRecord(opportunity, ["id", "name", "status"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_opportunity",
    {
      title: "Delete GoHighLevel Opportunity",
      description: "Delete an opportunity with DELETE /opportunities/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteOpportunitySchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ opportunity_id, confirm, response_format }: DeleteOpportunityInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/opportunities/${encodeURIComponent(opportunity_id)}`);
        const data = { opportunity_id, result };
        const markdown = ["# Deleted GoHighLevel Opportunity", "", `Deleted opportunity ${opportunity_id}.`].join("\n");
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

function opportunityBody(
  client: GoHighLevelClient,
  params: CreateOpportunityInput | UpdateOpportunityInput,
  includeLocationId: boolean
): Record<string, unknown> {
  return mergeExtra({
    ...(includeLocationId ? { locationId: resolveLocationId(client, "location_id" in params ? params.location_id : undefined) } : {}),
    name: params.name,
    contactId: params.contactId,
    pipelineId: params.pipelineId,
    pipelineStageId: params.pipelineStageId,
    status: params.status,
    monetaryValue: params.monetaryValue,
    assignedTo: params.assignedTo,
    source: params.source
  }, params.extra);
}
