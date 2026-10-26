#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Build an experimental FM-1 app/loader, optionally package with verified SDK inputs.
No flashing, USB discovery or device writes are performed.
"""
import argparse
import atexit
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[1]
VENDOR=ROOT/'third_party/fm1-platform'
OUT=ROOT/'build/fm1'
IMAGE='debian:bookworm-slim@sha256:7ff6ba31527b9e336162fa061746c366c4b2032f4d2cff2078bea43f78efe3f8'

def main():
    global OUT
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--package',action='store_true',help='also require and verify the three SDK blobs')
    ap.add_argument('--emulator-diagnostic',action='store_true',help='separate NON-HARDWARE build: LCD BAUD 4 for build-67 emulator')
    a=ap.parse_args()
    if a.emulator_diagnostic:
        OUT=ROOT/'build/fm1-emulator-diagnostic'
    os.chdir(ROOT)
    toolchain=Path(os.environ.get('JIELI_TOOLCHAIN',ROOT/'build/toolchain/jieli-linux-toolchains-20260730.1'))
    if not (toolchain/'pi32v2/bin/clang').exists():
        raise SystemExit('Missing JieLi toolchain; see docs/firmware-build.md')
    os.environ['JIELI_TOOLCHAIN']=str(toolchain.resolve())
    os.environ['JIELI_DOCKER_IMAGE']=IMAGE
    sys.path.insert(0,str(VENDOR/'tools'))
    spec=importlib.util.spec_from_file_location('fm1_reference_build',VENDOR/'tools/build.py')
    b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
    def cleanup():
        if b._BUILDER:
            subprocess.run(['docker','stop',b._BUILDER],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    atexit.register(cleanup)
    b.SRC=ROOT;b.FW=VENDOR/'firmware';b.OUT=OUT;b.LDR=OUT/'loader';b.GEN=ROOT/'build/generated'
    OUT.mkdir(parents=True,exist_ok=True)
    # Never leave a previous package looking like the result of a failed new build.
    package=OUT/'guitchordi-experimental.fwsc'
    package.unlink(missing_ok=True)
    subprocess.run([sys.executable,'scripts/generate-firmware-bank.py'],check=True)
    subprocess.run([sys.executable,'scripts/generate-fm1-usb.py'],check=True)
    common=['-target','pi32v2','-mcpu=r3','-mfprev1','-ffp-contract=off','-fwrapv',
            '-fno-strict-aliasing','-ffreestanding','-fno-builtin','-ffunction-sections',
            '-fdata-sections','-Wall','-Wno-unused-function','-DGM_FM1=1','-Ibuild/generated',
            '-Ithird_party/fm1-platform/firmware/hal',
            '-I/opt/jieli/pi32v2/include' if b.use_docker() else '-I'+str(toolchain/'pi32v2/include')]
    units=['third_party/fm1-platform/firmware/crt0.S',
           'third_party/fm1-platform/firmware/hal/fm1_vec.S',
           'third_party/fm1-platform/firmware/hal/fm1_isr.S',
           'firmware/fm1/main.c','firmware/app.c','dsp/engine.c']
    if a.emulator_diagnostic:
        common += ['-DLCD_BAUD=4u']
    objs=[]
    for i,src in enumerate(units):
        obj=OUT/f'{i}.o';objs.append(obj)
        flags=[] if src.endswith('.S') else [*common,'-O2' if src=='dsp/engine.c' else '-Os']
        b.tc('cc',*flags,'-c',src,'-o',obj)
    elf=OUT/'guitchordi.elf'
    b.tc('pi32v2/bin/ld','--gc-sections','-e','_start','-T','firmware/fm1/app.ld',
         '-Map',str((OUT/'guitchordi.map').relative_to(ROOT)),*objs,'-o',elf)
    syms=b.tc('common/bin/objdump','-t',elf)
    dis=b.tc('common/bin/objdump','-d',elf)
    hdr=b.tc('common/bin/objdump','-h',elf)
    rt=b.tc('common/bin/objdump','-d','-j','.ram_text',elf)
    (OUT/'symbols.txt').write_text(syms);(OUT/'disassembly.txt').write_text(dis);(OUT/'sections.txt').write_text(hdr)
    def sym(n):
        m=re.search(r'^([0-9a-f]+) .*\s'+re.escape(n)+r'$',syms,re.M)
        if not m: raise SystemExit('Missing linker symbol '+n)
        return int(m[1],16)
    image=bytearray()
    for section,load in [('.text',b.APP_XIP),('.ram_text',sym('_rt_load')),('.c1_text',sym('_c1_load')),('.data',sym('_data_load'))]:
        path=OUT/(section[1:]+'.bin');path.unlink(missing_ok=True)
        b.tc('common/bin/objcopy','-O','binary','-j',section,elf,path)
        blob=path.read_bytes() if path.exists() else b''
        if not blob:continue
        offset=load-b.APP_XIP
        if offset<len(image):raise SystemExit('Overlapping load sections')
        image+=b'\xff'*(offset-len(image))+blob
    image+=b'\xff'*(-len(image)%4)
    app=OUT/'guitchordi.bin';app.write_bytes(image)
    errors,notes=b.check(image,syms,dis,rt)
    for note in notes: print('check:',note)
    if errors:raise SystemExit('\n'.join(errors))
    b.CFLAGS += ['-Ithird_party/fm1-platform/firmware/hal','-Ithird_party/fm1-platform/firmware/src']
    identity=re.search(r'#define GM_FIRMWARE_ID "(FM-1_[0-9]+)"',
                       (ROOT/'firmware/fm1/identity.h').read_text()).group(1)
    # Brand only the loader identity in an isolated generated platform tree.
    generated=ROOT/'build/generated/gm-platform'
    shutil.copytree(VENDOR/'firmware',generated,dirs_exist_ok=True)
    loader_source=generated/'loader/loader.c'
    original=loader_source.read_text()
    needle='#define FELUCCA_ID "ota-FM-1_900"'
    if original.count(needle)!=1: raise SystemExit('Pinned loader identity definition changed')
    loader_source.write_text(original.replace(needle,'#define FELUCCA_ID "ota-'+identity+'"'))
    b.FW=generated
    loader=b.build_loader()
    report={'status':'compiled-unverified-on-device','app_bytes':len(image),'app_sha256':hashlib.sha256(image).hexdigest(),
            'ram_data_bss_bytes':sym('_bss_end')-0x1c08000,'pool_bytes':sym('_pool_end')-sym('_pool_start'),
            'loader_bytes':len(loader),'package':None,'toolchain':'20260730.1','docker_image':IMAGE,
            'physical_tested':False,'limitations':['USB MIDI update transport integrated; enumeration/update/recovery unverified on hardware', 'FM-1_982 is provisional and not reserved with the Hub', 'No USB performance MIDI or USB audio','SAVE snapshot is RAM-only; no flash persistence',
            'Default panel map not calibrated on a device','14-voice performance and 128-frame I2S deadline unmeasured',
            'Recovery entry and boot-loop fallback compiled but untested on hardware']}
    report['identity']=identity
    report['loader_identity']='ota-'+identity
    report['identity_reserved']=False
    report['emulator_diagnostic']=a.emulator_diagnostic
    report['lcd_baud']=4 if a.emulator_diagnostic else 0
    report['audio_output']={'format':'signed 24-bit value in int32 word; no extra left shift',
                            'bringup_digital_peak_limit':629144,'startup_master':0,
                            'adc_timeout_mutes':True,'hardware_audio_verified':False}
    if a.package:
        sdk=Path(os.environ.get('AC79_SDK',ROOT/'build/ac79-sdk'))
        b.fm1pkg_make.SDK=sdk
        for rel,sha in b.SDK_SHA256.items():
            data=b.fm1pkg_make.sdk_file(rel)
            if hashlib.sha256(data).hexdigest()!=sha:raise SystemExit('SDK hash mismatch: '+rel)
        pkg=b.fm1pkg_make.ufw(b.fm1pkg_make.flash_image(image,b.fm1pkg_make.KEY),loader,identity)
        package.write_bytes(pkg);report['package']={'path':str(package.relative_to(ROOT)),'bytes':len(pkg),'sha256':hashlib.sha256(pkg).hexdigest()}
    (OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
    print('Build only: no device accessed. This candidate requires hardware bring-up before release.')

if __name__=='__main__':main()
