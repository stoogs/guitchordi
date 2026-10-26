#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
docker run --rm -v "$root:/src" -w /src \
 emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
 sh -c 'cc -O2 -ffp-contract=off -fwrapv -fno-strict-aliasing -Ibuild/generated firmware/app.c dsp/engine.c tests/easter_egg_host.c -lm -o build/easter-egg-host && build/easter-egg-host build/easter-egg-native.f32 && cc -O1 -g -ffp-contract=off -fwrapv -fno-strict-aliasing -fsanitize=undefined -fno-sanitize-recover=all -Ibuild/generated firmware/app.c dsp/engine.c tests/easter_egg_host.c -lm -o build/easter-egg-sanitized && build/easter-egg-sanitized build/easter-egg-sanitized.f32'
node tests/easter-egg.integration.mjs
