import { z } from "zod";
import { LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const GetLocationSchema = z
  .object({
    location_id: LocationIdSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const ListUsersSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type GetLocationInput = z.infer<typeof GetLocationSchema>;
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
