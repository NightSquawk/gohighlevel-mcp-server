import { z } from "zod";

export const ResponseFormatSchema = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Output format: markdown for human-readable summaries, json for structured output.");

export const LimitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(25)
  .describe("Maximum number of items to return from the local page.");

export const OffsetSchema = z
  .number()
  .int()
  .min(0)
  .default(0)
  .describe("Number of items to skip locally after receiving the API response.");

export const LocationIdSchema = z
  .string()
  .min(1)
  .optional()
  .describe("Optional GoHighLevel location ID override. Defaults to GHL_LOCATION_ID.");

export const ConfirmSchema = z
  .boolean()
  .describe("Required for destructive tools. The API call is made only when confirm is explicitly true.");

export const IdSchema = z.string().min(1).describe("GoHighLevel opaque resource ID.");

export const NonEmptyStringArraySchema = z.array(z.string().min(1)).min(1);

export const ExtraSchema = z
  .record(z.unknown())
  .optional()
  .describe("Optional additional GoHighLevel fields to pass through when the API supports fields not modeled by this tool.");
