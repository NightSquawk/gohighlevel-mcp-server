// Uses synthetic credentials only; never calls upstream API tools.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const local = process.argv[2] === '--local';
const image = process.argv[2];
assert(image, 'Usage: node docker/smoke.mjs IMAGE | --local');
const required = ["GHL_API_TOKEN", "GHL_LOCATION_ID"];
const environment = { ...process.env, ...Object.fromEntries(required.map(name =>
  [name, name.endsWith('BASE_URL') ? 'https://api.invalid' : 'synthetic-smoke-only'])) };
delete environment.SUPERGATEWAY_API_KEY;
const directory = mkdtempSync(join(tmpdir(), 'nst-mcp-smoke-'));
const key = randomBytes(32).toString('hex');
const secret = join(directory, 'key');
const empty = join(directory, 'empty');
writeFileSync(secret, key, { mode: 0o444 });
writeFileSync(empty, '', { mode: 0o444 });
chmodSync(directory, 0o755);
const name = `nst-mcp-smoke-${process.pid}`;
let child;
let base;
function docker(args, check = true) {
  const result = spawnSync('docker', args, { encoding: 'utf8', env: environment, timeout: 45000 });
  if (check) assert.equal(result.status, 0, `docker ${args[0]} failed (exit ${result.status})`);
  return result;
}
const envArgs = required.flatMap(name => ['--env', name]);
try {
  // Startup rejects unset, empty, unreadable inbound keys, even with upstream env set.
  for (const file of [undefined, empty, join(directory, 'missing')]) {
    const result = spawnSync(process.execPath, ['docker/validate.mjs'], {
      env: { ...environment, SUPERGATEWAY_API_KEY_FILE: file ?? '' },
      encoding: 'utf8', timeout: 5000,
    });
    assert.notEqual(result.status, 0, 'invalid key configuration must fail closed');
  }
  const missingUpstream = { ...environment, SUPERGATEWAY_API_KEY_FILE: secret };
  delete missingUpstream[required[0]];
  assert.notEqual(spawnSync(process.execPath, ['docker/validate.mjs'], {
    env: missingUpstream, encoding: 'utf8', timeout: 5000,
  }).status, 0, 'missing upstream variable must fail startup');

  if (local) {
    // Pick an OS-assigned unused port without assuming a global test port.
    const { createServer } = await import('node:net');
    const probe = createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    base = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['docker/node_modules/supergateway/dist/index.js',
      '--stdio', 'node dist/index.js', '--outputTransport', 'streamableHttp', '--stateful',
      '--host', '127.0.0.1', '--port', String(port), '--apiKeyFile', secret,
      '--healthEndpoint', '/healthz', '--healthCheck', 'server', '--logLevel', 'none'],
      { env: { ...environment, SUPERGATEWAY_API_KEY_FILE: secret }, stdio: 'ignore' });
  } else {
    // Confirm the image's own entrypoint also rejects absent/empty key mounts.
    for (const mount of [[], ['--mount', `type=bind,src=${empty},dst=/run/secrets/mcp_api_key,readonly`]]) {
      const result = docker(['run', '--rm', ...envArgs, ...mount, image], false);
      assert(result.status !== null && result.status !== 0, 'image must exit on bad key configuration');
    }
    docker(['run', '--detach', '--name', name, '--publish', '127.0.0.1::8000',
      ...envArgs, '--mount', `type=bind,src=${secret},dst=/run/secrets/mcp_api_key,readonly`, image]);
    assert.equal(docker(['inspect', '--format', '{{.Config.User}}', name]).stdout.trim(), 'node');
    const mapping = docker(['port', name, '8000/tcp']).stdout.trim();
    base = `http://${mapping}`;
  }
  let ready = false;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try { ready = (await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(12000) })).ok; }
    catch { /* wait for startup */ }
    if (ready) break;
    await delay(500);
  }
  assert(ready, 'server health must initialize/ping successfully');
  const request = (body, authorization, session) => fetch(`${base}/mcp`, {
    method: 'POST', headers: {
      'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      ...(authorization ? { Authorization: authorization } : {}),
      ...(session ? { 'Mcp-Session-Id': session, 'MCP-Protocol-Version': '2024-11-05' } : {}),
    }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
  });
  const initialize = { jsonrpc: '2.0', id: 1, method: 'initialize', params: {
    protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'container-smoke', version: '1' },
  } };
  assert.equal((await request(initialize)).status, 401);
  assert.equal((await request(initialize, 'Bearer incorrect')).status, 401);
  const decode = async response => {
    assert(response.ok, `MCP HTTP status ${response.status}`);
    const text = await response.text();
    const data = response.headers.get('content-type')?.includes('text/event-stream')
      ? text.split(/\r?\n/).find(line => line.startsWith('data: '))?.slice(6) : text;
    return JSON.parse(data);
  };
  const initialized = await request(initialize, `Bearer ${key}`);
  const session = initialized.headers.get('mcp-session-id');
  assert((await decode(initialized)).result?.serverInfo, 'initialize result missing');
  const notified = await request({ jsonrpc: '2.0', method: 'notifications/initialized' }, `Bearer ${key}`, session);
  assert(notified.ok);
  const listed = await decode(await request({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }, `Bearer ${key}`, session));
  assert(listed.result?.tools?.length > 0, 'tools/list must expose server tools');
  if (!local) {
    docker(['stop', '--time', '20', name]);
    assert.equal(docker(['inspect', '--format', '{{.State.ExitCode}}', name]).stdout.trim(), '0', 'shutdown must be graceful');
  }
  console.log(`PASS: fail-closed startup, server health, 401 auth, initialize and ${listed.result.tools.length} tools${local ? ' (host transport)' : ', non-root container and shutdown'}`);
} finally {
  if (child) {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
      await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(10000)]);
    }
  }
  if (!local) docker(['rm', '--force', name], false);
  rmSync(directory, { recursive: true, force: true });
}
