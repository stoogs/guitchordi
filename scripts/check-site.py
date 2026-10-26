#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Check generated Pages URLs, WASM and matching source without a web server."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,tarfile
ROOT=Path(__file__).resolve().parents[1];out=(ROOT/'dist').resolve()
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src') and value:self.links.append(value)
checked=0
for file in out.rglob('*.html'):
 parser=Links();parser.feed(file.read_text())
 for link in parser.links:
  u=urlsplit(link)
  if u.scheme or u.netloc or not u.path:continue
  assert not u.path.startswith('/'),f'Root URL breaks Pages subpath: {file}: {link}'
  target=(file.parent/unquote(u.path)).resolve()
  assert target.is_relative_to(out),f'Escaping site link: {file}: {link}'
  if target.is_dir():target=target/'index.html'
  assert target.is_file(),f'Broken local link: {file}: {link}'
  checked+=1
assert (out/'emu/firmware.wasm').read_bytes()[:4]==b'\x00asm'
assert not list(out.rglob('*.fwsc')),'Unqualified device firmware must not be published'
assert not list(out.rglob('*backup*.bin')),'Device backup in site'
info=json.loads((out/'build-info.json').read_text())
source=out/'upstream-source/guitchordi-source.tar.gz'
assert hashlib.sha256(source.read_bytes()).hexdigest()==info['source_archive_sha256']
with tarfile.open(source) as archive:
 names=archive.getnames();assert 'guitchordi/site/index.html' in names
 assert not any('/device-backups/' in n or '/.env' in n or '/build/' in n for n in names)
 assert 'guitchordi/firmware/app.c' in names and 'guitchordi/LICENSE' in names
print(f'Static Pages checks passed: {checked} local HTML links, WASM, source checksum and private-file exclusions')
