import { z } from "zod";
import { ConfirmSchema, ExtraSchema, IdSchema, LimitSchema, LocationIdSchema, NonEmptyStringArraySchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

const CustomFieldsSchema = z.array(z.record(z.unknown())).optional().describe("GoHighLevel customFields array, usually objects with id/key and value.");

const ContactBodyShape = {
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address1: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  website: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  assignedTo: z.string().min(1).optional(),
  dnd: z.boolean().optional(),
  tags: z.array(z.string().min(1)).optional(),
  customFields: CustomFieldsSchema,
  extra: ExtraSchema
};

export const SearchContactsSchema = z
  .object({
    location_id: LocationIdSchema,
    query: z.string().min(1).optional().describe("Optional search text."),
    filters: z.array(z.record(z.unknown())).optional().describe("Optional GoHighLevel contact search filters."),
    pageLimit: z.number().int().min(1).max(100).default(20).describe("GoHighLevel server-side page size."),
    start_after_id: z.string().min(1).optional().describe("Optional GoHighLevel startAfterId cursor."),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const ContactIdSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateContactSchema = z
  .object({
    location_id: LocationIdSchema,
    ...ContactBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateContactSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    ...ContactBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpsertContactSchema = z
  .object({
    location_id: LocationIdSchema,
    ...ContactBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteContactSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const ContactTagsSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    tags: NonEmptyStringArraySchema.describe("Tag names to add or remove."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const RemoveContactTagsSchema = ContactTagsSchema.extend({
  confirm: ConfirmSchema
}).strict();

export const ContactWorkflowSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    workflow_id: IdSchema.describe("Workflow ID."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const RemoveContactWorkflowSchema = ContactWorkflowSchema.extend({
  confirm: ConfirmSchema
}).strict();

export const ContactCollectionSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateContactNoteSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    body: z.string().min(1).describe("Note body."),
    userId: z.string().min(1).optional().describe("Optional GoHighLevel user ID associated with the note."),
    extra: ExtraSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CreateContactTaskSchema = z
  .object({
    contact_id: IdSchema.describe("Contact ID."),
    title: z.string().min(1).describe("Task title."),
    body: z.string().min(1).optional().describe("Optional task body/description."),
    dueDate: z.string().min(1).optional().describe("Optional due date/time in GoHighLevel's accepted format."),
    assignedTo: z.string().min(1).optional().describe("Optional user ID to assign the task to."),
    completed: z.boolean().optional(),
    extra: ExtraSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type SearchContactsInput = z.infer<typeof SearchContactsSchema>;
export type ContactIdInput = z.infer<typeof ContactIdSchema>;
export type CreateContactInput = z.infer<typeof CreateContactSchema>;
export type UpdateContactInput = z.infer<typeof UpdateContactSchema>;
export type UpsertContactInput = z.infer<typeof UpsertContactSchema>;
export type DeleteContactInput = z.infer<typeof DeleteContactSchema>;
export type ContactTagsInput = z.infer<typeof ContactTagsSchema>;
export type RemoveContactTagsInput = z.infer<typeof RemoveContactTagsSchema>;
export type ContactWorkflowInput = z.infer<typeof ContactWorkflowSchema>;
export type RemoveContactWorkflowInput = z.infer<typeof RemoveContactWorkflowSchema>;
export type ContactCollectionInput = z.infer<typeof ContactCollectionSchema>;
export type CreateContactNoteInput = z.infer<typeof CreateContactNoteSchema>;
export type CreateContactTaskInput = z.infer<typeof CreateContactTaskSchema>;
