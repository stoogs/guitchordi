#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
python3 - <<'PY'
from pathlib import Path
import sys
sys.path.insert(0,'third_party/fm1-platform/tools')
import fm1pkg_make as p
p.SDK=Path('build/ac79-sdk')
app=Path('build/fm1/guitchordi.bin').read_bytes()
loader=Path('build/fm1/loader/ota.bin').read_bytes()
Path('build/fm1/old-test.fwsc').write_bytes(p.ufw(p.flash_image(app[:16000],p.KEY),loader,'FM-1_900'))
PY
docker run --rm -v "$root:/src" -w /src \
  emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
  bash -lc 'cc -O2 third_party/fm1-platform/tests/ota_test.c -o build/fm1/ota-test && build/fm1/ota-test build/fm1/guitchordi-experimental.fwsc && cc -O2 third_party/fm1-platform/tests/ldr_test.c -o build/fm1/loader-test && build/fm1/loader-test build/fm1/old-test.fwsc build/fm1/guitchordi-experimental.fwsc'

python3 scripts/check-loader-interruption.py
docker run --rm -v "$root:/src" -w /src \
  emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
  bash -lc 'cc -O2 -fsanitize=undefined -fno-sanitize-recover=all -Ithird_party/fm1-platform/tests build/fm1/loader-interruption-test.c -o build/fm1/loader-interruption-test && build/fm1/loader-interruption-test build/fm1/old-test.fwsc build/fm1/guitchordi-experimental.fwsc'
