import { readFileSync } from 'node:fs';
// Never interpolate a credential or file contents into errors.
const required = ["GHL_API_TOKEN", "GHL_LOCATION_ID"];
for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required`);
}
const file = process.env.SUPERGATEWAY_API_KEY_FILE;
if (!file?.trim()) throw new Error('SUPERGATEWAY_API_KEY_FILE is required');
let keys;
try { keys = readFileSync(file, 'utf8'); }
catch { throw new Error('Gateway API key file must be readable by UID 1000'); }
if (!keys.trim()) throw new Error('Gateway API key file must contain a key');
