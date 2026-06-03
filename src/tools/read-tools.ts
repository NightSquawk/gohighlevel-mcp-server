import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import type { ResponseFormat } from "../types.js";
import { formatResponse, makeToolResponse, paginate, summarizeRecord } from "./format.js";

type ToolParams = Record<string, unknown>;

type CollectionReadOptions = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodTypeAny>;
  path: (params: ToolParams) => string;
  query?: (params: ToolParams) => Record<string, unknown> | undefined;
  body?: (params: ToolParams) => Record<string, unknown> | undefined;
  method?: "get" | "post";
  preferredFields: string[];
  heading: string;
  collectionLabel: string;
};

type CollectionParams = {
  limit: number;
  offset: number;
  response_format: ResponseFormat;
};

export function registerCollectionReadTool(
  server: McpServer,
  client: GoHighLevelClient,
  options: CollectionReadOptions
): void {
  server.registerTool(
    options.name,
    {
      title: options.title,
      description: options.description,
      inputSchema: options.inputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: ToolParams) => {
      try {
        const paging = params as CollectionParams;
        const raw = options.method === "post"
          ? await client.post<Record<string, unknown>>(options.path(params), options.body?.(params))
          : await client.get<Record<string, unknown>>(options.path(params), options.query?.(params));
        const items = extractItems(raw);
        const data = {
          server_total: extractServerTotal(raw),
          traceId: extractTraceId(raw),
          ...paginate(items, paging.limit, paging.offset)
        };
        const totalText = data.server_total === undefined
          ? `${data.total} ${options.collectionLabel}`
          : `${data.server_total} ${options.collectionLabel} reported by GoHighLevel, ${data.total} received`;
        const markdown = [
          `# ${options.heading}`,
          "",
          `Showing ${data.count} of ${totalText}.`,
          "",
          ...data.items.map((item) => `- ${summarizeRecord(item, options.preferredFields)}`)
        ].join("\n");

        return makeToolResponse(data, formatResponse(paging.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );
}

export function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === "object") {
    const source = raw as Record<string, unknown>;
    for (const key of ["customFields", "customValues", "contacts", "tags", "pipelines", "opportunities", "conversations", "messages", "calendars", "users", "fields", "folders", "events", "appointments", "slots", "freeSlots", "notes", "tasks", "results", "items", "data", "rows"]) {
      if (Array.isArray(source[key])) {
        return source[key];
      }
    }
  }

  return raw === undefined || raw === null ? [] : [raw];
}

export function extractTraceId(raw: unknown): unknown {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>).traceId : undefined;
}

function extractServerTotal(raw: unknown): number | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const value = (raw as Record<string, unknown>).total;
  return typeof value === "number" ? value : undefined;
}
