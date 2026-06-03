import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { registerCalendarTools } from "./calendars.js";
import { registerContactTools } from "./contacts.js";
import { registerConversationTools } from "./conversations.js";
import { registerCustomFieldTools } from "./custom-fields.js";
import { registerCustomValueTools } from "./custom-values.js";
import { registerLocationTools } from "./locations.js";
import { registerOpportunityTools } from "./opportunities.js";
import { registerTagTools } from "./tags.js";

export function registerTools(server: McpServer, client: GoHighLevelClient): void {
  registerCustomFieldTools(server, client);
  registerCustomValueTools(server, client);
  registerContactTools(server, client);
  registerTagTools(server, client);
  registerOpportunityTools(server, client);
  registerConversationTools(server, client);
  registerCalendarTools(server, client);
  registerLocationTools(server, client);
}
