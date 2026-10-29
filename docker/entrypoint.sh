#!/bin/sh
set -eu
node /app/docker/validate.mjs
# exec gives the gateway PID 1; its shutdown handler terminates child servers.
# /dev/null avoids a closed inherited stdin shutting down the gateway.
exec node /gateway/node_modules/supergateway/dist/index.js \
  --stdio "node /app/dist/index.js" \
  --outputTransport streamableHttp --stateful --sessionTimeout 300000 \
  --host 0.0.0.0 --port 8000 --streamableHttpPath /mcp \
  --apiKeyFile "$SUPERGATEWAY_API_KEY_FILE" \
  --healthEndpoint /healthz --healthCheck server --logLevel info </dev/null
