import { z } from "zod";
import { ConfirmSchema, ExtraSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const CustomFieldDataTypeSchema = z.enum([
  "TEXT",
  "LARGE_TEXT",
  "NUMERICAL",
  "PHONE",
  "MONETORY",
  "CHECKBOX",
  "SINGLE_OPTIONS",
  "MULTIPLE_OPTIONS",
  "FLOAT",
  "TEXTBOX_LIST",
  "DATE",
  "TEXTAREA",
  "RADIO",
  "FILE_UPLOAD",
  "SIGNATURE"
]);

export const CustomFieldModelSchema = z.enum(["contact", "opportunity"]).optional();

const CustomFieldBodyShape = {
  name: z.string().min(1).optional().describe("Custom field display name."),
  dataType: CustomFieldDataTypeSchema.optional().describe("GoHighLevel custom field type. Note the documented MONETORY spelling."),
  placeholder: z.string().min(1).optional(),
  position: z.number().int().min(0).optional(),
  model: CustomFieldModelSchema,
  options: z.array(z.string().min(1)).optional(),
  acceptedFormat: z.string().min(1).optional(),
  isMultipleFile: z.boolean().optional(),
  maxNumberOfFiles: z.number().int().positive().optional(),
  textBoxListOptions: z.array(z.object({
    label: z.string().min(1),
    prefillValue: z.string().optional()
  }).strict()).optional()
};

export const ListCustomFieldsSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const GetCustomFieldSchema = z
  .object({
    location_id: LocationIdSchema,
    field_id: IdSchema.describe("Custom field ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateCustomFieldSchema = z
  .object({
    location_id: LocationIdSchema,
    ...CustomFieldBodyShape,
    name: z.string().min(1).describe("Custom field display name."),
    dataType: CustomFieldDataTypeSchema.describe("GoHighLevel custom field type. Note the documented MONETORY spelling."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateCustomFieldSchema = z
  .object({
    location_id: LocationIdSchema,
    field_id: IdSchema.describe("Custom field ID."),
    ...CustomFieldBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteCustomFieldSchema = z
  .object({
    location_id: LocationIdSchema,
    field_id: IdSchema.describe("Custom field ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const ListCustomFieldsV2Schema = z
  .object({
    location_id: LocationIdSchema,
    objectKey: z.string().min(1).describe("Object key, for example custom_objects.pet or business."),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const GetCustomFieldV2Schema = z
  .object({
    id: IdSchema.describe("Custom Fields V2 field or folder ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

const CustomFieldV2BodyShape = {
  locationId: z.string().min(1).optional().describe("Optional explicit location ID. Defaults to GHL_LOCATION_ID."),
  name: z.string().min(1).optional(),
  objectKey: z.string().min(1).optional(),
  dataType: CustomFieldDataTypeSchema.optional(),
  description: z.string().min(1).optional(),
  placeholder: z.string().min(1).optional(),
  parentId: z.string().min(1).optional(),
  showInForms: z.boolean().optional(),
  options: z.array(z.record(z.unknown())).optional(),
  acceptedFormats: z.string().min(1).optional(),
  allowCustomOption: z.boolean().optional(),
  maxFileLimit: z.number().int().positive().optional(),
  extra: ExtraSchema
};

export const CreateCustomFieldV2Schema = z
  .object({
    ...CustomFieldV2BodyShape,
    locationId: z.string().min(1).optional().describe("Optional explicit location ID. Defaults to GHL_LOCATION_ID."),
    name: z.string().min(1).describe("Custom field name."),
    objectKey: z.string().min(1).describe("Object key, for example custom_objects.pet or business."),
    dataType: CustomFieldDataTypeSchema.describe("GoHighLevel custom field type."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateCustomFieldV2Schema = z
  .object({
    id: IdSchema.describe("Custom Fields V2 field ID."),
    ...CustomFieldV2BodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteCustomFieldV2Schema = z
  .object({
    id: IdSchema.describe("Custom Fields V2 field ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateCustomFieldFolderSchema = z
  .object({
    location_id: LocationIdSchema,
    objectKey: z.string().min(1).describe("Object key for the folder."),
    name: z.string().min(1).describe("Folder name."),
    parentId: z.string().min(1).optional(),
    extra: ExtraSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateCustomFieldFolderSchema = z
  .object({
    folder_id: IdSchema.describe("Custom field folder ID."),
    name: z.string().min(1).describe("New folder name."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteCustomFieldFolderSchema = z
  .object({
    folder_id: IdSchema.describe("Custom field folder ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type ListCustomFieldsInput = z.infer<typeof ListCustomFieldsSchema>;
export type GetCustomFieldInput = z.infer<typeof GetCustomFieldSchema>;
export type CreateCustomFieldInput = z.infer<typeof CreateCustomFieldSchema>;
export type UpdateCustomFieldInput = z.infer<typeof UpdateCustomFieldSchema>;
export type DeleteCustomFieldInput = z.infer<typeof DeleteCustomFieldSchema>;
export type ListCustomFieldsV2Input = z.infer<typeof ListCustomFieldsV2Schema>;
export type GetCustomFieldV2Input = z.infer<typeof GetCustomFieldV2Schema>;
export type CreateCustomFieldV2Input = z.infer<typeof CreateCustomFieldV2Schema>;
export type UpdateCustomFieldV2Input = z.infer<typeof UpdateCustomFieldV2Schema>;
export type DeleteCustomFieldV2Input = z.infer<typeof DeleteCustomFieldV2Schema>;
export type CreateCustomFieldFolderInput = z.infer<typeof CreateCustomFieldFolderSchema>;
export type UpdateCustomFieldFolderInput = z.infer<typeof UpdateCustomFieldFolderSchema>;
export type DeleteCustomFieldFolderInput = z.infer<typeof DeleteCustomFieldFolderSchema>;
