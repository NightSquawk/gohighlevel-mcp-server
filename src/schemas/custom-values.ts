import { z } from "zod";
import { ConfirmSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const ListCustomValuesSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const GetCustomValueSchema = z
  .object({
    location_id: LocationIdSchema,
    custom_value_id: IdSchema.describe("Custom value ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateCustomValueSchema = z
  .object({
    location_id: LocationIdSchema,
    name: z.string().min(1).describe("Custom value name."),
    value: z.string().describe("Custom value content."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateCustomValueSchema = z
  .object({
    location_id: LocationIdSchema,
    custom_value_id: IdSchema.describe("Custom value ID."),
    name: z.string().min(1).optional(),
    value: z.string().optional(),
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteCustomValueSchema = z
  .object({
    location_id: LocationIdSchema,
    custom_value_id: IdSchema.describe("Custom value ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type ListCustomValuesInput = z.infer<typeof ListCustomValuesSchema>;
export type GetCustomValueInput = z.infer<typeof GetCustomValueSchema>;
export type CreateCustomValueInput = z.infer<typeof CreateCustomValueSchema>;
export type UpdateCustomValueInput = z.infer<typeof UpdateCustomValueSchema>;
export type DeleteCustomValueInput = z.infer<typeof DeleteCustomValueSchema>;
