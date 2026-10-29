import test from 'node:test';
import assert from 'node:assert/strict';
import { registerContactTools } from '../dist/tools/contacts.js';
import { SearchContactsSchema } from '../dist/schemas/contacts.js';

function fixture(raw) {
  const tools = new Map();
  const requests = [];
  const server = { registerTool(name, definition, handler) { tools.set(name, { definition, handler }); } };
  const client = { defaultLocationId: 'loc', async post(url, body) { requests.push({ url, body }); return raw; } };
  registerContactTools(server, client);
  return { tool: tools.get('ghl_search_contacts'), requests };
}

test('remote page traversal is distinct from local result slicing', async () => {
  const { tool, requests } = fixture({ contacts: [{ id: 'a', searchAfter: [123, 'a'] }], total: 2 });
  const result = await tool.handler(SearchContactsSchema.parse({ page: 1, pageLimit: 1, limit: 1, response_format: 'json' }));
  assert.equal(requests[0].body.page, 1);
  assert.ok(!('startAfterId' in requests[0].body));
  assert.equal(result.structuredContent.has_more, false);
  assert.equal(result.structuredContent.server_has_more, true);
  assert.deepEqual(result.structuredContent.next_search_after, [123, 'a']);
});

test('cursor is forwarded without coercing its timestamp or ID', async () => {
  const { tool, requests } = fixture({ contacts: [], total: 2 });
  const result = await tool.handler(SearchContactsSchema.parse({ search_after: [123, 'a'], pageLimit: 1 }));
  assert.deepEqual(requests[0].body.searchAfter, [123, 'a']);
  assert.ok(!('page' in requests[0].body));
  assert.equal(result.structuredContent.server_has_more, false);
});

test('rejects ambiguous remote pagination before making a request', async () => {
  const { tool, requests } = fixture({ contacts: [], total: 2 });
  const result = await tool.handler(SearchContactsSchema.parse({ page: 2, search_after: ['a'] }));
  assert.equal(result.isError, true);
  assert.equal(requests.length, 0);
});
