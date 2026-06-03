import { RESPONSE_CHARACTER_LIMIT } from "../constants.js";
import type { PaginatedItems, ResponseFormat, ToolResponse } from "../types.js";

export function paginate<T>(items: T[], limit: number, offset: number): PaginatedItems<T> {
  const pageItems = items.slice(offset, offset + limit);
  const hasMore = offset + pageItems.length < items.length;

  return {
    total: items.length,
    count: pageItems.length,
    offset,
    items: pageItems,
    has_more: hasMore,
    ...(hasMore ? { next_offset: offset + pageItems.length } : {})
  };
}

export function makeToolResponse<T extends Record<string, unknown>>(data: T, text: string, isError = false): ToolResponse<T> {
  const responseText = text.length > RESPONSE_CHARACTER_LIMIT
    ? `${text.slice(0, RESPONSE_CHARACTER_LIMIT)}\n\nResponse truncated at ${RESPONSE_CHARACTER_LIMIT} characters. Use filters or a smaller limit.`
    : text;

  return {
    content: [{ type: "text", text: responseText }],
    structuredContent: data,
    ...(isError ? { isError: true } : {})
  };
}

export function formatResponse<T>(format: ResponseFormat, data: T, markdown: string): string {
  return format === "json" ? JSON.stringify(data, null, 2) : markdown;
}

export function summarizeRecord(record: unknown, preferredFields: string[]): string {
  if (!record || typeof record !== "object") {
    return String(record);
  }

  const source = record as Record<string, unknown>;
  const fields = preferredFields
    .filter((field) => source[field] !== undefined && source[field] !== null && source[field] !== "")
    .map((field) => `${field}: ${String(source[field])}`);

  return fields.length > 0 ? fields.join(", ") : JSON.stringify(record);
}

export function omitUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

export function mergeExtra(input: Record<string, unknown>, extra: Record<string, unknown> | undefined): Record<string, unknown> {
  return {
    ...omitUndefined(input),
    ...(extra ?? {})
  };
}

export function requireConfirm(confirm: boolean): string | null {
  return confirm === true ? null : "This is a destructive GoHighLevel operation. Re-run with confirm: true to call the API.";
}
