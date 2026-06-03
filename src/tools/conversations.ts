import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  ConversationMessagesSchema,
  SearchConversationsSchema,
  SendMessageSchema,
  type SendMessageInput
} from "../schemas/conversations.js";
import { formatResponse, makeToolResponse, mergeExtra, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerConversationTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_search_conversations",
    title: "Search GoHighLevel Conversations",
    description: "Search conversations with GET /conversations/search.",
    inputSchema: SearchConversationsSchema.shape,
    path: () => "/conversations/search",
    query: (params) => ({
      ...omitUndefined({
        locationId: resolveLocationId(client, params.location_id),
        contactId: params.contactId,
        assignedTo: params.assignedTo,
        lastMessageType: params.lastMessageType
      }),
      ...((params.extra_query as Record<string, unknown> | undefined) ?? {})
    }),
    preferredFields: ["id", "contactId", "fullName", "lastMessageBody", "lastMessageType", "unreadCount"],
    heading: "GoHighLevel Conversations",
    collectionLabel: "conversations"
  });

  registerCollectionReadTool(server, client, {
    name: "ghl_get_conversation_messages",
    title: "Get GoHighLevel Conversation Messages",
    description: "List messages for a conversation with GET /conversations/{conversationId}/messages.",
    inputSchema: ConversationMessagesSchema.shape,
    path: (params) => `/conversations/${encodeURIComponent(String(params.conversation_id))}/messages`,
    query: (params) => (params.extra_query as Record<string, unknown> | undefined) ?? undefined,
    preferredFields: ["id", "messageId", "type", "direction", "body", "message", "dateAdded"],
    heading: "GoHighLevel Conversation Messages",
    collectionLabel: "messages"
  });

  server.registerTool(
    "ghl_send_message",
    {
      title: "Send GoHighLevel Message",
      description: "Send an outward-facing message with POST /conversations/messages. Requires confirm: true and owner approval before live execution.",
      inputSchema: SendMessageSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: SendMessageInput) => {
      const guard = requireConfirm(params.confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.post<unknown>("/conversations/messages", mergeExtra({
          type: params.type,
          contactId: params.contactId,
          conversationId: params.conversationId,
          message: params.message,
          attachments: params.attachments,
          subject: params.subject,
          fromEmail: params.fromEmail,
          toEmail: params.toEmail
        }, params.extra));
        const data = { result };
        const markdown = ["# Sent GoHighLevel Message", "", summarizeRecord(result, ["id", "messageId", "status", "conversationId", "contactId"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
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
