#!/usr/bin/env python3
"""Download hash-pinned build dependencies into build/. Never installs or flashes."""
from pathlib import Path
import hashlib
import subprocess
import tarfile

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'build'
TOOL='jieli-linux-toolchains-20260730.1'
TOOL_SHA='a1545cddbc451a06bac43eb5cd96d831470c42a97c5c0b1f98879a20fc7647bd'
SDK_REV='d179b4484759423312073f5fbb232501aa491047'
SDK_FILES={
 'uboot.boot':'4e3b4c220dc96641cb5a723f41e68ce41d5261ae9434bb33fbd7f2c59976ded4',
 'cfg_tool.bin':'276579954f076886a6a7694f65dc71c034a63a2c204b76749065c0ac7b010d1b',
 'cfg/eq_cfg_hw.bin':'41167491bffed4651750719c973d2758adeb9021a5670d02d6a53c85ed80ea7d'}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else ''
def fetch(path,urls,sha):
 if digest(path)==sha:return
 path.parent.mkdir(parents=True,exist_ok=True)
 tmp=path.with_name(path.name+'.download')
 for url in urls:
  print('Downloading',url,flush=True)
  r=subprocess.run(['curl','-fLsS','--connect-timeout','8','--max-time','120',url,'-o',str(tmp)])
  if r.returncode==0 and digest(tmp)==sha:
   tmp.replace(path);return
 tmp.unlink(missing_ok=True)
 raise SystemExit('No hash-verified download for '+str(path))
def main():
 archive=CACHE/'toolchain'/(TOOL+'.tar.xz')
 fetch(archive,['https://jl-update.oss-cn-shenzhen.aliyuncs.com/'+TOOL+'.tar.xz'],TOOL_SHA)
 if not (archive.parent/TOOL/'pi32v2/bin/clang').exists():
  with tarfile.open(archive) as tf:tf.extractall(archive.parent,filter='data')
 for rel,sha in SDK_FILES.items():
  path=CACHE/'ac79-sdk/cpu/wl82/tools'/rel
  fetch(path,[
   'https://gitee.com/Jieli-Tech/fw-AC79_AIoT_SDK/raw/AC79NN_SDK_V1.2.1_2023-12-13/cpu/wl82/tools/'+rel,
   'https://raw.githubusercontent.com/amitv87/fw-AC79_AIoT_SDK/'+SDK_REV+'/cpu/wl82/tools/'+rel],sha)
 fetch(CACHE/'ac79-sdk/LICENSE',['https://raw.githubusercontent.com/amitv87/fw-AC79_AIoT_SDK/'+SDK_REV+'/LICENSE'],'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4')
 print('Toolchain and three SDK inputs verified. Run npm run build:fm1. No device accessed.')
if __name__=='__main__':main()
