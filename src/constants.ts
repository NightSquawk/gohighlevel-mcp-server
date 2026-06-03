export const SERVER_NAME = "gohighlevel-mcp-server";
export const SERVER_VERSION = "0.1.0";

export const ENV = {
  apiToken: "GHL_API_TOKEN",
  locationId: "GHL_LOCATION_ID",
  baseUrl: "GHL_BASE_URL",
  apiVersion: "GHL_API_VERSION",
  timeoutMs: "GHL_TIMEOUT_MS"
} as const;

export const DEFAULT_BASE_URL = "https://services.leadconnectorhq.com";
export const DEFAULT_API_VERSION = "2021-07-28";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const RESPONSE_CHARACTER_LIMIT = 25_000;
