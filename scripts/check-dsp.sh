#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
docker run --rm -v "$root:/src" -w /src \
  emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
  bash -lc 'sh scripts/build-dsp.sh && sh scripts/native-dsp.sh > build/native-benchmarks.jsonl && cc -O1 -g -fwrapv -fno-strict-aliasing -fsanitize=undefined -fno-sanitize-recover=all dsp/engine.c dsp/render.c -lm -o build/render-sanitized && for tone in 0 1 2; do build/render-sanitized build/sanitized-$tone.wav 14 "$tone" 1; done'
node tests/dsp.integration.mjs
python3 scripts/measure-dsp.py
