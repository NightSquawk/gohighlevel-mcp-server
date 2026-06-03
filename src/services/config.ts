import { DEFAULT_API_VERSION, DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS, ENV } from "../constants.js";
import type { GhlConfig } from "../types.js";

export function loadConfig(): GhlConfig {
  const apiToken = process.env[ENV.apiToken]?.trim();
  const locationId = process.env[ENV.locationId]?.trim();
  const baseUrl = process.env[ENV.baseUrl]?.trim() || DEFAULT_BASE_URL;
  const apiVersion = process.env[ENV.apiVersion]?.trim() || DEFAULT_API_VERSION;
  const timeoutRaw = process.env[ENV.timeoutMs]?.trim();

  if (!apiToken) {
    throw new Error(
      `${ENV.apiToken} is required. Create a Private Integration in GoHighLevel Settings > Private Integrations, grant the required scopes, and copy the pit-... token.`
    );
  }

  if (!locationId) {
    throw new Error(`${ENV.locationId} is required. Use the target GoHighLevel sub-account/location ID.`);
  }

  const timeoutMs = timeoutRaw ? Number.parseInt(timeoutRaw, 10) : DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) {
    throw new Error(`${ENV.timeoutMs} must be an integer of at least 1000 milliseconds.`);
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiToken,
    apiVersion,
    locationId,
    timeoutMs
  };
}
