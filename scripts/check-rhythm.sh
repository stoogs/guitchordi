#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
docker run --rm -v "$root:/src" -w /src \
 emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
 bash -lc 'sh scripts/build-simulator.sh && cc -O2 -ffp-contract=off -fwrapv -fno-strict-aliasing -Ibuild/generated firmware/app.c dsp/engine.c tests/rhythm_host.c -o build/rhythm-host && build/rhythm-host build/rhythm-native.f32 && cc -O1 -g -ffp-contract=off -fwrapv -fno-strict-aliasing -fsanitize=undefined -fno-sanitize-recover=all -Ibuild/generated firmware/app.c dsp/engine.c tests/rhythm_host.c -o build/rhythm-sanitized && build/rhythm-sanitized build/rhythm-sanitized.f32'
node tests/rhythm.integration.mjs
