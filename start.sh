#!/bin/sh
set -eu

if command -v node >/dev/null 2>&1; then
  exec node server.mjs
fi

BUNDLED_NODE="${HOME}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
if [ -x "${BUNDLED_NODE}" ]; then
  exec "${BUNDLED_NODE}" server.mjs
fi

printf '%s\n' 'Node.js 18 or newer is required to run this site.' >&2
exit 1
