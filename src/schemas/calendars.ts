import { z } from "zod";
import { ConfirmSchema, ExtraSchema, IdSchema, LimitSchema, LocationIdSchema, OffsetSchema, ResponseFormatSchema } from "./common.js";

export const ListCalendarsSchema = z
  .object({
    location_id: LocationIdSchema,
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export const CalendarEventsSchema = z
  .object({
    location_id: LocationIdSchema,
    calendarId: z.string().min(1).optional(),
    groupId: z.string().min(1).optional(),
    contactId: z.string().min(1).optional(),
    startTime: z.union([z.string().min(1), z.number().int().nonnegative()]).optional().describe("Start time in milliseconds, as number or string."),
    endTime: z.union([z.string().min(1), z.number().int().nonnegative()]).optional().describe("End time in milliseconds, as number or string."),
    limit: LimitSchema,
    offset: OffsetSchema,
    response_format: ResponseFormatSchema,
    extra_query: ExtraSchema
  })
  .strict();

export const FreeSlotsSchema = z
  .object({
    calendar_id: IdSchema.describe("Calendar ID."),
    startDate: z.union([z.string().min(1), z.number().int().nonnegative()]).describe("Start date/time in milliseconds, as number or string."),
    endDate: z.union([z.string().min(1), z.number().int().nonnegative()]).describe("End date/time in milliseconds, as number or string."),
    timezone: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    response_format: ResponseFormatSchema,
    extra_query: ExtraSchema
  })
  .strict();

const AppointmentBodyShape = {
  calendarId: z.string().min(1).optional(),
  locationId: z.string().min(1).optional(),
  contactId: z.string().min(1).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  appointmentStatus: z.string().min(1).optional(),
  assignedUserId: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  ignoreDateRange: z.boolean().optional(),
  toNotify: z.boolean().optional(),
  extra: ExtraSchema
};

export const CreateAppointmentSchema = z
  .object({
    ...AppointmentBodyShape,
    calendarId: z.string().min(1).describe("Calendar ID."),
    locationId: z.string().min(1).optional().describe("Optional location ID. Defaults to GHL_LOCATION_ID when omitted."),
    contactId: z.string().min(1).describe("Contact ID."),
    startTime: z.string().min(1).describe("Appointment start time."),
    response_format: ResponseFormatSchema
  })
  .strict();

export const UpdateAppointmentSchema = z
  .object({
    appointment_id: IdSchema.describe("Appointment/event ID."),
    ...AppointmentBodyShape,
    response_format: ResponseFormatSchema
  })
  .strict();

export const DeleteAppointmentSchema = z
  .object({
    event_id: IdSchema.describe("Calendar event ID."),
    confirm: ConfirmSchema,
    response_format: ResponseFormatSchema
  })
  .strict();

export type ListCalendarsInput = z.infer<typeof ListCalendarsSchema>;
export type CalendarEventsInput = z.infer<typeof CalendarEventsSchema>;
export type FreeSlotsInput = z.infer<typeof FreeSlotsSchema>;
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
export type DeleteAppointmentInput = z.infer<typeof DeleteAppointmentSchema>;
