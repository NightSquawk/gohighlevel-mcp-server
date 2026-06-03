import { z } from "zod";
import { ConfirmSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const ListTagsSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const GetTagSchema = z
  .object({
    location_id: LocationIdSchema,
    tag_id: IdSchema.describe("Tag ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateTagSchema = z
  .object({
    location_id: LocationIdSchema,
    name: z.string().min(1).describe("Tag name."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateTagSchema = z
  .object({
    location_id: LocationIdSchema,
    tag_id: IdSchema.describe("Tag ID."),
    name: z.string().min(1).describe("New tag name."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteTagSchema = z
  .object({
    location_id: LocationIdSchema,
    tag_id: IdSchema.describe("Tag ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type ListTagsInput = z.infer<typeof ListTagsSchema>;
export type GetTagInput = z.infer<typeof GetTagSchema>;
export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;
export type DeleteTagInput = z.infer<typeof DeleteTagSchema>;
