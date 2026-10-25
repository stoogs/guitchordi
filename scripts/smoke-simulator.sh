#!/bin/sh
set -eu
base="${1:-http://localhost:8769}"
for asset in / /app.mjs /worklet.mjs /visuals.mjs /style.css /firmware.wasm /styles.json /instruments.json /manual/ /manual/Guitchordi-Manual.pdf /manual/images/01-overview.png /manual/images/02-instruments.png /manual/images/03-violin-zones.png /manual/images/04-lock-save.png /upstream-source/clipper-phys/README.md /upstream-source/application/app.c; do
  curl --fail --silent --show-error "$base$asset" > /dev/null
done
curl --fail --silent --show-error --head "$base/app.mjs" | tr -d '\r' | grep -qi '^Content-Type: application/javascript'
printf 'Firmware simulator HTTP smoke passed: %s\n' "$base"
