#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Build a static Pages site and its matching WASM source. No firmware downloads,
device operations, API credentials or deployment are part of this command."""
import argparse,hashlib,json,re,shutil,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
IMAGE='emscripten/emsdk:4.0.17@sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825'
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--skip-wasm-build',action='store_true',help='local layout iteration only: reuse build/simulator.wasm')
a=p.parse_args()
if not a.skip_wasm_build:
 subprocess.run(['docker','run','--rm','-v',f'{ROOT}:/src','-w','/src',IMAGE,'sh','scripts/build-simulator.sh'],check=True)
wasm=ROOT/'build/simulator.wasm'
if not wasm.is_file():raise SystemExit('Missing browser WASM; run the default build first')
out=ROOT/'dist'
if out.exists():shutil.rmtree(out)
shutil.copytree(ROOT/'site',out)
assets=out/'assets'
for src,dest in [('docs/guitchordi-boot-screen.png','boot-screen.png'),('docs/guitchordi-chord-guide-preview.png','chord-guide.png')]:shutil.copy2(ROOT/src,assets/dest)
shutil.copytree(ROOT/'web/emu',out/'emu',ignore=shutil.ignore_patterns('manual'))
shutil.copytree(ROOT/'web/emu/manual',out/'manual',ignore=shutil.ignore_patterns('Guitchordi-Manual.pdf'))
shutil.copy2(wasm,out/'emu/firmware.wasm')
for name in ['styles.json','instruments.json']:shutil.copy2(ROOT/'web'/name,out/'emu'/name)
source=out/'upstream-source'
source.mkdir()
for src,dest in [('firmware','application'),('dsp','adapter'),('third_party/clipper-phys','clipper-phys')]:shutil.copytree(ROOT/src,source/dest)
for name in ['LICENSE','NOTICES.md']:shutil.copy2(ROOT/name,source/name)
# Rebase root-relative links so /guitchordi/ works without an nginx rewrite.
def rebase(text,prefix):
 return re.sub(r'(href|src)="/(?!/)([^"]*)"',lambda m:f'{m[1]}="{prefix}{m[2]}"',text)
for target,prefix in [(out/'licenses.html','./'),(out/'emu/licenses.html','../')]:target.write_text(rebase((ROOT/'web/licenses.html').read_text(),prefix))
p=out/'emu/index.html';p.write_text(rebase(p.read_text(),'../'))
p=out/'manual/index.html';p.write_text(p.read_text().replace('href="../"','href="../emu/"'))
(out/'.nojekyll').touch()
subprocess.run([sys.executable,str(ROOT/'scripts/create-source-bundle.py'),str(ROOT),str(source/'guitchordi-source.tar.gz')],check=True)
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
(out/'build-info.json').write_text(json.dumps({'kind':'static website + C/WASM browser instrument','wasm_sha256':sha(out/'emu/firmware.wasm'),'source_archive_sha256':sha(source/'guitchordi-source.tar.gz'),'device_firmware_included':False,'fresh_wasm_build':not a.skip_wasm_build},indent=2)+'\n')
print(f'GitHub Pages site ready: {out}\nNo firmware release or deployment performed.')
