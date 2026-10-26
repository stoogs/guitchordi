#!/bin/sh
set -eu
root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$root"
docker run --rm -v "$root:/src" -w /src \
  emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
  bash -lc 'cc -O2 -fsanitize=undefined,float-cast-overflow -fno-sanitize-recover=all tests/fm1-audio-output-test.c -o build/fm1/audio-output-test && build/fm1/audio-output-test'
python3 - <<'PY'
from pathlib import Path
import sys, json, hashlib
sys.path.insert(0,'third_party/fm1-platform/tools')
import fm1pkg_make as p
p.SDK=Path('build/ac79-sdk')
report=json.loads(Path('build/fm1/report.json').read_text())
assert not report['emulator_diagnostic'], 'Do not qualify a diagnostic as hardware'
raw=Path(report['package']['path']).read_bytes()
assert hashlib.sha256(raw).hexdigest()==report['package']['sha256']
identity=''.join(chr((raw[i*48+47]-i-1)&255) for i in range(20) if raw[i*48+47]!=0x7d)
assert identity==report['identity']
app=Path('build/fm1/guitchordi.bin').read_bytes()
assert (identity+'\0').encode() in app
assert ('ota-'+identity+'\0').encode() in Path('build/fm1/loader/loader.bin').read_bytes()
stock=Path('build/device-prep/FM-1-stock-V15.fwsc')
if stock.exists():
 assert hashlib.sha256(stock.read_bytes()).hexdigest()=='db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a'
print('Compiled app/package/loader identity and artifact hashes verified:',identity)
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

# Test our board integration and USB framing, not only the retained core.
python3 scripts/generate-fm1-usb.py
python3 scripts/check-update-integration.py
docker run --rm -v "$root:/src" -w /src \
  emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825 \
  bash -lc 'cc -O2 -fsanitize=undefined -fno-sanitize-recover=all -Itests/fm1-stubs tests/fm1-usb-test.c -o build/fm1/usb-test && build/fm1/usb-test && cc -O2 -fsanitize=undefined -fno-sanitize-recover=all -Itests/fm1-stubs build/fm1/update-integration-test.c -o build/fm1/update-integration-test && build/fm1/update-integration-test build/fm1/guitchordi-experimental.fwsc && if [ -f build/device-prep/FM-1-stock-V15.fwsc ]; then build/fm1/update-integration-test build/device-prep/FM-1-stock-V15.fwsc; else echo "Stock outgoing-update test skipped: run prepare:device first"; fi'
