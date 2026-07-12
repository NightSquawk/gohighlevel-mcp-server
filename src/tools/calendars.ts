import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  CalendarEventsSchema,
  CreateAppointmentSchema,
  DeleteAppointmentSchema,
  FreeSlotsSchema,
  ListCalendarsSchema,
  UpdateAppointmentSchema,
  type CreateAppointmentInput,
  type DeleteAppointmentInput,
  type FreeSlotsInput,
  type UpdateAppointmentInput
} from "../schemas/calendars.js";
import { formatResponse, makeToolResponse, mergeExtra, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { registerCollectionReadTool } from "./read-tools.js";

export function registerCalendarTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_list_calendars",
    title: "List GoHighLevel Calendars",
    description: "List calendars with GET /calendars/?locationId={locationId}.",
    inputSchema: ListCalendarsSchema.shape,
    path: () => "/calendars/",
    query: (params) => ({ locationId: resolveLocationId(client, params.location_id) }),
    preferredFields: ["id", "name", "calendarType", "isActive"],
    heading: "GoHighLevel Calendars",
    collectionLabel: "calendars"
  });

  registerCollectionReadTool(server, client, {
    name: "ghl_get_calendar_events",
    title: "Get GoHighLevel Calendar Events",
    description: "List calendar events with GET /calendars/events.",
    inputSchema: CalendarEventsSchema.shape,
    path: () => "/calendars/events",
    query: (params) => ({
      ...omitUndefined({
        locationId: resolveLocationId(client, params.location_id),
        calendarId: params.calendarId,
        groupId: params.groupId,
        contactId: params.contactId,
        startTime: params.startTime,
        endTime: params.endTime
      }),
      ...((params.extra_query as Record<string, unknown> | undefined) ?? {})
    }),
    preferredFields: ["id", "title", "calendarId", "contactId", "startTime", "endTime", "appointmentStatus"],
    heading: "GoHighLevel Calendar Events",
    collectionLabel: "events"
  });

  server.registerTool(
    "ghl_get_free_slots",
    {
      title: "Get GoHighLevel Free Slots",
      description: "Get free slots for a calendar with GET /calendars/{id}/free-slots.",
      inputSchema: FreeSlotsSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: FreeSlotsInput) => {
      try {
        const freeSlots = await client.get<Record<string, unknown>>(`/calendars/${encodeURIComponent(params.calendar_id)}/free-slots`, {
          ...omitUndefined({
            startDate: params.startDate,
            endDate: params.endDate,
            timezone: params.timezone,
            userId: params.userId
          }),
          ...(params.extra_query ?? {})
        });
        const data = { freeSlots };
        const markdown = ["# GoHighLevel Free Slots", "", summarizeRecord(freeSlots, ["traceId", "slots", "freeSlots"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_appointment",
    {
      title: "Create GoHighLevel Appointment",
      description: "Create an appointment with POST /calendars/events/appointments. Write operation: do not run against live data without explicit approval.",
      inputSchema: CreateAppointmentSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateAppointmentInput) => {
      try {
        const appointment = await client.post<unknown>("/calendars/events/appointments", appointmentBody(client, params, true));
        const data = { appointment };
        const markdown = ["# Created GoHighLevel Appointment", "", summarizeRecord(appointment, ["id", "title", "calendarId", "contactId", "startTime", "appointmentStatus"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_appointment",
    {
      title: "Update GoHighLevel Appointment",
      description: "Update an appointment with PUT /calendars/events/appointments/{id}. Write operation: do not run against live data without explicit approval.",
      inputSchema: UpdateAppointmentSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateAppointmentInput) => {
      try {
        const body = appointmentBody(client, params, false);
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one appointment property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const appointment = await client.put<unknown>(`/calendars/events/appointments/${encodeURIComponent(params.appointment_id)}`, body);
        const data = { appointment };
        const markdown = ["# Updated GoHighLevel Appointment", "", summarizeRecord(appointment, ["id", "title", "calendarId", "contactId", "startTime", "appointmentStatus"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_appointment",
    {
      title: "Delete GoHighLevel Appointment",
      description: "Delete a calendar event with DELETE /calendars/events/{id}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteAppointmentSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ event_id, confirm, response_format }: DeleteAppointmentInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/calendars/events/${encodeURIComponent(event_id)}`);
        const data = { event_id, result };
        const markdown = ["# Deleted GoHighLevel Appointment", "", `Deleted event ${event_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
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

function appointmentBody(
  client: GoHighLevelClient,
  params: CreateAppointmentInput | UpdateAppointmentInput,
  includeLocationId: boolean
): Record<string, unknown> {
  return mergeExtra({
    calendarId: params.calendarId,
    ...(includeLocationId ? { locationId: params.locationId ?? client.defaultLocationId } : { locationId: params.locationId }),
    contactId: params.contactId,
    startTime: params.startTime,
    endTime: params.endTime,
    title: params.title,
    appointmentStatus: params.appointmentStatus,
    assignedUserId: params.assignedUserId,
    address: params.address,
    ignoreDateRange: params.ignoreDateRange,
    toNotify: params.toNotify
  }, params.extra);
}
