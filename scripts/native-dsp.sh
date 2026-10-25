#!/bin/sh
set -eu
mkdir -p build/audio
cc -O2 -fwrapv -fno-strict-aliasing -std=c11 -Wall -Wextra -Wno-unused-function \
  dsp/engine.c dsp/render.c -lm -o build/render-phys
for tone in 0 1 2; do
  build/render-phys "build/audio/phys-strum-$tone.wav" 6 "$tone" 0
  for voices in 6 12 14; do
    build/render-phys "build/audio/bench-$voices-$tone.wav" "$voices" "$tone" 1
  done
done
