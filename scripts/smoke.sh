#!/bin/sh
set -eu
base="${1:-http://localhost:8768}"
for asset in / /app.mjs /core.mjs /audio.mjs /buffer-worker.mjs /pluck.mjs /upstream-audio.mjs /phys-worklet.mjs /dsp/phys.wasm /upstream-source/clipper-phys/README.md /chords.json /style.css; do
  curl --fail --silent --show-error "$base$asset" > /dev/null
done
curl --fail --silent --show-error --head "$base/app.mjs" | tr -d '\r' | grep -qi '^Content-Type: application/javascript'
printf 'HTTP smoke passed: %s (page and all application assets)\n' "$base"
