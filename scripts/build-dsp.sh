#!/bin/sh
set -eu
mkdir -p build
emcc -O3 -fwrapv -fno-strict-aliasing dsp/engine.c -lm --no-entry \
  -sSTANDALONE_WASM=1 -sINITIAL_MEMORY=1048576 -sSTACK_SIZE=65536 \
  -sALLOW_MEMORY_GROWTH=0 -sFILESYSTEM=0 -sMALLOC=none \
  -sEXPORTED_FUNCTIONS='["_gm_reset","_gm_note_on","_gm_render","_gm_active","_gm_steals","_gm_state_bytes","_gm_clips"]' \
  -o build/phys.wasm
