import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GoHighLevelClient } from "../services/gohighlevel-client.js";
import { formatApiError } from "../services/errors.js";
import {
  ContactIdSchema,
  ContactCollectionSchema,
  ContactTagsSchema,
  ContactWorkflowSchema,
  CreateContactNoteSchema,
  CreateContactSchema,
  CreateContactTaskSchema,
  DeleteContactSchema,
  MergeContactsDeleteLoserSchema,
  RemoveContactTagsSchema,
  RemoveContactWorkflowSchema,
  SearchContactsSchema,
  type ContactIdInput,
  type ContactCollectionInput,
  type ContactTagsInput,
  type ContactWorkflowInput,
  type CreateContactInput,
  type CreateContactNoteInput,
  type CreateContactTaskInput,
  type DeleteContactInput,
  type MergeContactsDeleteLoserInput,
  type RemoveContactTagsInput,
  type RemoveContactWorkflowInput,
  type SearchContactsInput,
  type UpdateContactInput,
  type UpsertContactInput,
  UpdateContactSchema,
  UpsertContactSchema
} from "../schemas/contacts.js";
import { formatResponse, makeToolResponse, mergeExtra, omitUndefined, requireConfirm, summarizeRecord } from "./format.js";
import { extractItems, registerCollectionReadTool } from "./read-tools.js";

export function registerContactTools(server: McpServer, client: GoHighLevelClient): void {
  registerCollectionReadTool(server, client, {
    name: "ghl_search_contacts",
    title: "Search GoHighLevel Contacts",
    description: "Search contacts with POST /contacts/search. This is the preferred read path over deprecated GET /contacts/.",
    inputSchema: SearchContactsSchema.shape,
    method: "post",
    path: () => "/contacts/search",
    body: (params) => omitUndefined({
      locationId: resolveLocationId(client, params.location_id),
      query: params.query,
      filters: params.filters,
      pageLimit: params.pageLimit,
      startAfterId: params.start_after_id
    }),
    preferredFields: ["id", "contactName", "firstName", "lastName", "email", "phone"],
    heading: "GoHighLevel Contacts",
    collectionLabel: "contacts"
  });

  server.registerTool(
    "ghl_get_contact",
    {
      title: "Get GoHighLevel Contact",
      description: "Get one GoHighLevel contact from /contacts/{contactId}.",
      inputSchema: ContactIdSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ contact_id, response_format }: ContactIdInput) => {
      try {
        const contact = await client.get<unknown>(`/contacts/${encodeURIComponent(contact_id)}`);
        const data = { contact };
        const markdown = ["# GoHighLevel Contact", "", summarizeRecord(contact, ["id", "contactName", "firstName", "lastName", "email", "phone"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_create_contact",
    {
      title: "Create GoHighLevel Contact",
      description: "Create a contact with POST /contacts/. Rule 8: do not run against live data without owner approval.",
      inputSchema: CreateContactSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: CreateContactInput) => {
      try {
        const contact = await client.post<unknown>("/contacts/", contactBody(client, params));
        const data = { contact };
        const markdown = ["# Created GoHighLevel Contact", "", summarizeRecord(contact, ["id", "contactName", "firstName", "lastName", "email", "phone"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_update_contact",
    {
      title: "Update GoHighLevel Contact",
      description: "Update a contact with PUT /contacts/{contactId}. Rule 8: do not run against live data without owner approval.",
      inputSchema: UpdateContactSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpdateContactInput) => {
      try {
        const body = contactBody(client, params, false);
        if (Object.keys(body).length === 0) {
          const data = { error: "At least one contact property must be provided for update." };
          return makeToolResponse(data, data.error, true);
        }

        const contact = await client.put<unknown>(`/contacts/${encodeURIComponent(params.contact_id)}`, body);
        const data = { contact };
        const markdown = ["# Updated GoHighLevel Contact", "", summarizeRecord(contact, ["id", "contactName", "firstName", "lastName", "email", "phone"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_upsert_contact",
    {
      title: "Upsert GoHighLevel Contact",
      description: "Create or update a contact with POST /contacts/upsert. Rule 8: do not run against live data without owner approval.",
      inputSchema: UpsertContactSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async (params: UpsertContactInput) => {
      try {
        const contact = await client.post<unknown>("/contacts/upsert", contactBody(client, params));
        const data = { contact };
        const markdown = ["# Upserted GoHighLevel Contact", "", summarizeRecord(contact, ["id", "contactName", "firstName", "lastName", "email", "phone"])].join("\n");
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_delete_contact",
    {
      title: "Delete GoHighLevel Contact",
      description: "Delete one GoHighLevel contact from /contacts/{contactId}. Requires confirm: true and owner approval before live execution.",
      inputSchema: DeleteContactSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, confirm, response_format }: DeleteContactInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/contacts/${encodeURIComponent(contact_id)}`);
        const data = { contact_id, result };
        const markdown = ["# Deleted GoHighLevel Contact", "", `Deleted contact ${contact_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_merge_contacts_delete_loser",
    {
      title: "Merge GoHighLevel Contacts By Deleting Loser",
      description: "Preview or execute a guarded contact merge workaround: read both contacts, check loser history, delete loser, then update survivor with loser email. Requires confirm: true to execute.",
      inputSchema: MergeContactsDeleteLoserSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async (params: MergeContactsDeleteLoserInput) => {
      try {
        if (params.survivor_contact_id === params.loser_contact_id) {
          const data = { error: "survivor_contact_id and loser_contact_id must be different." };
          return makeToolResponse(data, data.error, true);
        }

        const [survivorRaw, loserRaw] = await Promise.all([
          client.get<unknown>(`/contacts/${encodeURIComponent(params.survivor_contact_id)}`),
          client.get<unknown>(`/contacts/${encodeURIComponent(params.loser_contact_id)}`)
        ]);
        const survivor = unwrapContact(survivorRaw);
        const loser = unwrapContact(loserRaw);
        const loserEmail = stringField(loser, "email");
        const survivorEmail = stringField(survivor, "email");
        const history = await getLoserHistory(client, params.loser_contact_id);
        const hasHistory = history.notes.count > 0
          || history.tasks.count > 0
          || history.conversations.count > 0
          || history.opportunities.count > 0
          || history.errors.length > 0;

        const plan = {
          survivor_contact_id: params.survivor_contact_id,
          loser_contact_id: params.loser_contact_id,
          operation: "delete_loser_then_update_survivor_email",
          loser_email: loserEmail,
          survivor_current_email: survivorEmail,
          history,
          will_delete_loser: params.confirm === true && !hasHistory,
          will_update_survivor_email: params.confirm === true && !hasHistory && !!loserEmail,
          history_policy: "skip_if_loser_has_notes_tasks_conversations_opportunities_or_check_errors",
          caveat: "This is not GoHighLevel's native UI merge. Deleting the loser does not preserve loser history."
        };

        if (!loserEmail) {
          const data = { error: "Loser contact has no email to copy.", plan };
          return makeToolResponse(data, formatResponse(params.response_format, data, data.error), true);
        }

        if (params.expected_loser_email && params.expected_loser_email.toLowerCase() !== loserEmail.toLowerCase()) {
          const data = { error: "Loser email did not match expected_loser_email.", plan };
          return makeToolResponse(data, formatResponse(params.response_format, data, data.error), true);
        }

        if (params.confirm !== true) {
          const data = { executed: false, reason: "Preview only. Re-run with confirm: true to execute delete-then-update.", plan };
          const markdown = mergeMarkdown(data.executed, data.reason, plan);
          return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
        }

        if (hasHistory) {
          const data = { error: "Loser contact has history or history checks failed; merge skipped without deleting.", plan };
          return makeToolResponse(data, formatResponse(params.response_format, data, data.error), true);
        }

        const deleteResult = await client.del<unknown>(`/contacts/${encodeURIComponent(params.loser_contact_id)}`);
        let updateResult: unknown;
        try {
          updateResult = await client.put<unknown>(`/contacts/${encodeURIComponent(params.survivor_contact_id)}`, { email: loserEmail });
        } catch (updateError) {
          const data = {
            error: formatApiError(updateError),
            executed: true,
            loser_deleted: true,
            survivor_updated: false,
            deleteResult,
            plan
          };
          return makeToolResponse(data, formatResponse(params.response_format, data, data.error), true);
        }

        const data = {
          executed: true,
          loser_deleted: true,
          survivor_updated: true,
          survivor_contact_id: params.survivor_contact_id,
          loser_contact_id: params.loser_contact_id,
          deleteResult,
          updateResult,
          plan
        };
        const markdown = mergeMarkdown(true, "Deleted loser and updated survivor email.", plan);
        return makeToolResponse(data, formatResponse(params.response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_add_contact_tags",
    {
      title: "Add GoHighLevel Contact Tags",
      description: "Add tags to a contact with POST /contacts/{contactId}/tags. Rule 8: do not run against live data without owner approval.",
      inputSchema: ContactTagsSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, tags, response_format }: ContactTagsInput) => {
      try {
        const result = await client.post<unknown>(`/contacts/${encodeURIComponent(contact_id)}/tags`, { tags });
        const data = { contact_id, tags, result };
        const markdown = ["# Added GoHighLevel Contact Tags", "", `Added ${tags.length} tags to contact ${contact_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_remove_contact_tags",
    {
      title: "Remove GoHighLevel Contact Tags",
      description: "Remove tags from a contact with DELETE /contacts/{contactId}/tags. Requires confirm: true and owner approval before live execution.",
      inputSchema: RemoveContactTagsSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, tags, confirm, response_format }: RemoveContactTagsInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/contacts/${encodeURIComponent(contact_id)}/tags`, undefined, { tags });
        const data = { contact_id, tags, result };
        const markdown = ["# Removed GoHighLevel Contact Tags", "", `Removed ${tags.length} tags from contact ${contact_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_add_contact_to_workflow",
    {
      title: "Add GoHighLevel Contact To Workflow",
      description: "Add a contact to a workflow with POST /contacts/{contactId}/workflow/{workflowId}. Rule 8: do not run against live data without owner approval.",
      inputSchema: ContactWorkflowSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, workflow_id, response_format }: ContactWorkflowInput) => {
      try {
        const result = await client.post<unknown>(`/contacts/${encodeURIComponent(contact_id)}/workflow/${encodeURIComponent(workflow_id)}`, {});
        const data = { contact_id, workflow_id, result };
        const markdown = ["# Added GoHighLevel Contact To Workflow", "", `Added contact ${contact_id} to workflow ${workflow_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  server.registerTool(
    "ghl_remove_contact_from_workflow",
    {
      title: "Remove GoHighLevel Contact From Workflow",
      description: "Remove a contact from a workflow with DELETE /contacts/{contactId}/workflow/{workflowId}. Requires confirm: true and owner approval before live execution.",
      inputSchema: RemoveContactWorkflowSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, workflow_id, confirm, response_format }: RemoveContactWorkflowInput) => {
      const guard = requireConfirm(confirm);
      if (guard) {
        const data = { error: guard };
        return makeToolResponse(data, data.error, true);
      }

      try {
        const result = await client.del<unknown>(`/contacts/${encodeURIComponent(contact_id)}/workflow/${encodeURIComponent(workflow_id)}`);
        const data = { contact_id, workflow_id, result };
        const markdown = ["# Removed GoHighLevel Contact From Workflow", "", `Removed contact ${contact_id} from workflow ${workflow_id}.`].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  registerCollectionReadTool(server, client, {
    name: "ghl_get_contact_notes",
    title: "Get GoHighLevel Contact Notes",
    description: "List notes for a contact from /contacts/{contactId}/notes.",
    inputSchema: ContactCollectionSchema.shape,
    path: (params) => `/contacts/${encodeURIComponent(String(params.contact_id))}/notes`,
    preferredFields: ["id", "body", "userId", "dateAdded"],
    heading: "GoHighLevel Contact Notes",
    collectionLabel: "notes"
  });

  server.registerTool(
    "ghl_create_contact_note",
    {
      title: "Create GoHighLevel Contact Note",
      description: "Create a note for a contact with POST /contacts/{contactId}/notes. Rule 8: do not run against live data without owner approval.",
      inputSchema: CreateContactNoteSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, body, userId, extra, response_format }: CreateContactNoteInput) => {
      try {
        const note = await client.post<unknown>(`/contacts/${encodeURIComponent(contact_id)}/notes`, mergeExtra({ body, userId }, extra));
        const data = { note };
        const markdown = ["# Created GoHighLevel Contact Note", "", summarizeRecord(note, ["id", "body", "userId", "dateAdded"])].join("\n");
        return makeToolResponse(data, formatResponse(response_format, data, markdown));
      } catch (error) {
        const data = { error: formatApiError(error) };
        return makeToolResponse(data, data.error, true);
      }
    }
  );

  registerCollectionReadTool(server, client, {
    name: "ghl_get_contact_tasks",
    title: "Get GoHighLevel Contact Tasks",
    description: "List tasks for a contact from /contacts/{contactId}/tasks.",
    inputSchema: ContactCollectionSchema.shape,
    path: (params) => `/contacts/${encodeURIComponent(String(params.contact_id))}/tasks`,
    preferredFields: ["id", "title", "body", "dueDate", "assignedTo", "completed"],
    heading: "GoHighLevel Contact Tasks",
    collectionLabel: "tasks"
  });

  server.registerTool(
    "ghl_create_contact_task",
    {
      title: "Create GoHighLevel Contact Task",
      description: "Create a task for a contact with POST /contacts/{contactId}/tasks. Rule 8: do not run against live data without owner approval.",
      inputSchema: CreateContactTaskSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true
      }
    },
    async ({ contact_id, title, body, dueDate, assignedTo, completed, extra, response_format }: CreateContactTaskInput) => {
      try {
        const task = await client.post<unknown>(`/contacts/${encodeURIComponent(contact_id)}/tasks`, mergeExtra({ title, body, dueDate, assignedTo, completed }, extra));
        const data = { task };
        const markdown = ["# Created GoHighLevel Contact Task", "", summarizeRecord(task, ["id", "title", "body", "dueDate", "assignedTo", "completed"])].join("\n");
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

function contactBody(
  client: GoHighLevelClient,
  params: CreateContactInput | UpdateContactInput | UpsertContactInput,
  includeLocationId = true
): Record<string, unknown> {
  return mergeExtra({
    ...(includeLocationId ? { locationId: resolveLocationId(client, "location_id" in params ? params.location_id : undefined) } : {}),
    firstName: params.firstName,
    lastName: params.lastName,
    name: params.name,
    email: params.email,
    phone: params.phone,
    address1: params.address1,
    city: params.city,
    state: params.state,
    country: params.country,
    postalCode: params.postalCode,
    companyName: params.companyName,
    website: params.website,
    source: params.source,
    assignedTo: params.assignedTo,
    dnd: params.dnd,
    tags: params.tags,
    customFields: params.customFields
  }, params.extra);
}

function unwrapContact(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object") {
    const source = raw as Record<string, unknown>;
    if (source.contact && typeof source.contact === "object") {
      return source.contact as Record<string, unknown>;
    }
    return source;
  }

  return {};
}

function stringField(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

type HistoryCheck = {
  count: number;
  checked: boolean;
};

type LoserHistory = {
  notes: HistoryCheck;
  tasks: HistoryCheck;
  conversations: HistoryCheck;
  opportunities: HistoryCheck;
  errors: string[];
};

async function getLoserHistory(client: GoHighLevelClient, loserContactId: string): Promise<LoserHistory> {
  const history: LoserHistory = {
    notes: { count: 0, checked: false },
    tasks: { count: 0, checked: false },
    conversations: { count: 0, checked: false },
    opportunities: { count: 0, checked: false },
    errors: []
  };

  await setHistoryCount(history, "notes", async () => client.get<unknown>(`/contacts/${encodeURIComponent(loserContactId)}/notes`));
  await setHistoryCount(history, "tasks", async () => client.get<unknown>(`/contacts/${encodeURIComponent(loserContactId)}/tasks`));
  await setHistoryCount(history, "conversations", async () => client.get<unknown>("/conversations/search", {
    locationId: client.defaultLocationId,
    contactId: loserContactId,
    limit: 1
  }));
  await setHistoryCount(history, "opportunities", async () => client.get<unknown>("/opportunities/search", {
    location_id: client.defaultLocationId,
    contact_id: loserContactId,
    limit: 1
  }));

  return history;
}

async function setHistoryCount(
  history: LoserHistory,
  key: keyof Omit<LoserHistory, "errors">,
  read: () => Promise<unknown>
): Promise<void> {
  try {
    const raw = await read();
    history[key] = {
      count: extractItems(raw).length,
      checked: true
    };
  } catch (error) {
    history.errors.push(`${key}: ${formatApiError(error)}`);
  }
}

function mergeMarkdown(executed: boolean, reason: string, plan: Record<string, unknown>): string {
  const history = plan.history as LoserHistory;
  return [
    "# GoHighLevel Contact Merge Workaround",
    "",
    `- Executed: ${executed}`,
    `- Result: ${reason}`,
    `- Survivor: ${String(plan.survivor_contact_id)}`,
    `- Loser: ${String(plan.loser_contact_id)}`,
    `- Loser email to copy: ${String(plan.loser_email ?? "")}`,
    `- Loser notes: ${history.notes.count}`,
    `- Loser tasks: ${history.tasks.count}`,
    `- Loser conversations: ${history.conversations.count}`,
    `- Loser opportunities: ${history.opportunities.count}`,
    `- History check errors: ${history.errors.length}`,
    "",
    "Caveat: this is delete-the-loser then update-the-survivor, not native GoHighLevel UI merge."
  ].join("\n");
}
