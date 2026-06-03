import { z } from "zod";
import { ConfirmSchema, ExtraSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

const OpportunityBodyShape = {
  name: z.string().min(1).optional(),
  contactId: z.string().min(1).optional(),
  pipelineId: z.string().min(1).optional(),
  pipelineStageId: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  monetaryValue: z.number().optional(),
  assignedTo: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  extra: ExtraSchema
};

export const SearchOpportunitiesSchema = z
  .object({
    location_id: LocationIdSchema,
    q: z.string().optional(),
    pipeline_id: z.string().min(1).optional(),
    pipeline_stage_id: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    assigned_to: z.string().min(1).optional(),
    campaignId: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
    order: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
    startAfter: z.union([z.string().min(1), z.number()]).optional(),
    startAfterId: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    server_limit: z.number().int().min(1).max(100).default(20).describe("GoHighLevel server-side limit query parameter."),
    page: z.number().int().min(1).optional(),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const GetPipelinesSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const OpportunityIdSchema = z
  .object({
    opportunity_id: IdSchema.describe("Opportunity ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateOpportunitySchema = z
  .object({
    location_id: LocationIdSchema,
    ...OpportunityBodyShape,
    name: z.string().min(1).describe("Opportunity name."),
    contactId: z.string().min(1).describe("Contact ID."),
    pipelineId: z.string().min(1).describe("Pipeline ID."),
    pipelineStageId: z.string().min(1).describe("Pipeline stage ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateOpportunitySchema = z
  .object({
    opportunity_id: IdSchema.describe("Opportunity ID."),
    ...OpportunityBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateOpportunityStatusSchema = z
  .object({
    opportunity_id: IdSchema.describe("Opportunity ID."),
    status: z.string().min(1).describe("New opportunity status."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteOpportunitySchema = z
  .object({
    opportunity_id: IdSchema.describe("Opportunity ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type SearchOpportunitiesInput = z.infer<typeof SearchOpportunitiesSchema>;
export type GetPipelinesInput = z.infer<typeof GetPipelinesSchema>;
export type OpportunityIdInput = z.infer<typeof OpportunityIdSchema>;
export type CreateOpportunityInput = z.infer<typeof CreateOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof UpdateOpportunitySchema>;
export type UpdateOpportunityStatusInput = z.infer<typeof UpdateOpportunityStatusSchema>;
export type DeleteOpportunityInput = z.infer<typeof DeleteOpportunitySchema>;
