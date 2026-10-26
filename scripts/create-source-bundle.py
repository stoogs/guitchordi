#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Archive the public build context with its source, inputs, notices and hashes.
Run inside Docker's source stage, or locally with explicit root and output paths.
No Git metadata, build binaries, downloads, backups or environment files are read.
"""
import gzip, hashlib, io, sys, tarfile
from pathlib import Path
root=Path(sys.argv[1]).resolve();out=Path(sys.argv[2]).resolve()
dirs=['firmware','dsp','web','scripts','tests','third_party','docs','site','.github']
files=['README.md','LICENSE','NOTICES.md','package.json','Dockerfile','compose.yaml',
       'nginx.conf','nginx.simulator.conf','.dockerignore','.gitignore','.gitattributes','brief.md']
paths=[root/f for f in files]
for directory in dirs:paths.extend(p for p in (root/directory).rglob('*') if p.is_file() and not p.is_symlink() and '__pycache__' not in p.parts)
for required in files:
    if not (root/required).is_file():raise SystemExit('Missing source input: '+required)
paths=sorted(set(paths));out.parent.mkdir(parents=True,exist_ok=True)
manifest=''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(root).as_posix()+'\n' for p in paths)
with out.open('wb') as raw,gzip.GzipFile(filename='',mode='wb',fileobj=raw,mtime=0) as gz,tarfile.open(fileobj=gz,mode='w') as tar:
    for name,data in [(p.relative_to(root).as_posix(),p.read_bytes()) for p in paths]+[('SOURCE-MANIFEST.sha256',manifest.encode())]:
        info=tarfile.TarInfo('guitchordi/'+name);info.size=len(data);info.mode=0o755 if name.endswith(('.sh','.py')) else 0o644;info.mtime=0
        tar.addfile(info,io.BytesIO(data))
out.with_name(out.name+'.sha256').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n')
print(f'Source bundle: {len(paths)} files; {out}')
