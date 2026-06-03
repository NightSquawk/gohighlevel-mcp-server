import axios from "axios";

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      const detail = formatErrorData(error.response.data);

      if (status === 401 || status === 403) {
        return `GoHighLevel denied the request (${status}). The token is likely missing a required Private Integration scope, or the locationId is wrong.${detail}`;
      }

      if (status === 404) {
        return `GoHighLevel resource not found (404). Check the ID and that locationId matches the resource's sub-account.${detail}`;
      }

      if (status === 422) {
        return `GoHighLevel rejected the payload (422). Check required fields and dataType enum values.${detail}`;
      }

      if (status === 429) {
        return `GoHighLevel rate limited the request (429). Burst limit is about 100 requests per 10 seconds and about 200k/day per resource. Back off and retry.${detail}`;
      }

      return `GoHighLevel API request failed (${status}).${detail}`;
    }

    if (error.code === "ECONNABORTED") {
      return "GoHighLevel API request timed out. Increase GHL_TIMEOUT_MS or narrow the query.";
    }

    if (error.code) {
      return `GoHighLevel API connection failed (${error.code}). Check GHL_BASE_URL and network access.`;
    }
  }

  return `Unexpected GoHighLevel error: ${error instanceof Error ? error.message : String(error)}`;
}

function formatErrorData(data: unknown): string {
  if (data === undefined || data === null) {
    return "";
  }

  if (typeof data === "string") {
    return ` Response: ${scrubSensitive(data)}`;
  }

  try {
    return ` Response: ${scrubSensitive(JSON.stringify(data))}`;
  } catch {
    return "";
  }
}

function scrubSensitive(value: string): string {
  return value.replace(/Bearer\s+[\w.-]+/gi, "Bearer [redacted]");
}
