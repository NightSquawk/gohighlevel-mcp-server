import { z } from "zod";
import { ConfirmSchema, ExtraSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const SearchConversationsSchema = z
  .object({
    location_id: LocationIdSchema,
    contactId: z.string().min(1).optional(),
    assignedTo: z.string().min(1).optional(),
    lastMessageType: z.string().min(1).optional(),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema,
    extra_query: ExtraSchema
  })
  .strict();

export const ConversationMessagesSchema = z
  .object({
    conversation_id: IdSchema.describe("Conversation ID."),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema,
    extra_query: ExtraSchema
  })
  .strict();

export const SendMessageSchema = z
  .object({
    confirm: ConfirmSchema,
    type: z.string().min(1).describe("Message channel/type accepted by GoHighLevel, such as SMS or Email."),
    contactId: z.string().min(1).optional().describe("Contact ID. One of contactId or conversationId is usually required."),
    conversationId: z.string().min(1).optional().describe("Conversation ID. One of contactId or conversationId is usually required."),
    message: z.string().min(1).describe("Outbound message body."),
    attachments: z.array(z.string().min(1)).optional(),
    subject: z.string().min(1).optional(),
    fromEmail: z.string().email().optional(),
    toEmail: z.string().email().optional(),
    extra: ExtraSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type SearchConversationsInput = z.infer<typeof SearchConversationsSchema>;
export type ConversationMessagesInput = z.infer<typeof ConversationMessagesSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
