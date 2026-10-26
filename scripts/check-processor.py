#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Bounded local CPU-emulator evidence capture. Never discovers physical devices.
Requires the independently downloaded build-67 emulator. Diagnostics are NOT hardware builds.
"""
import argparse,hashlib,json,os,re,struct,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__)
p.add_argument('--diagnostic',action='store_true')
p.add_argument('--emulator',type=Path,help='explicit alternative emulator binary (research build)')
p.add_argument('--package',type=Path,help='explicit package for a regression comparison; does not modify build artifacts')
p.add_argument('--emulator-label',default='upstream-build-67',help='provenance label recorded in evidence')
p.add_argument('--label',required=True)
p.add_argument('--idle',action='store_true',help='35 guest seconds of boot/idle only; does not qualify note playback')
p.add_argument('--recovery',action='store_true',help='virtual both-octave hold; checks mailbox request only, not ROM recovery')
p.add_argument('--check-audio-output',action='store_true',help='capture during the note and verify signed 24-bit words and quiet bring-up ceiling')
a=p.parse_args()
if a.idle and a.recovery: p.error('choose idle or recovery')
if a.check_audio_output and (a.idle or a.recovery): p.error('audio output check requires note playback')
if a.emulator and a.emulator_label=='upstream-build-67': p.error('custom emulator requires an explicit provenance label')
out=ROOT/'build/fm1-emulator'/a.label
if out.exists():raise SystemExit('Evidence label exists; choose a fresh label')
out.mkdir(parents=True)
folder=ROOT/('build/fm1-emulator-diagnostic' if a.diagnostic else 'build/fm1')
exe=a.emulator.resolve() if a.emulator else ROOT/'build/fm1-emulator/build-67/emulator'
package=a.package.resolve() if a.package else folder/'guitchordi-experimental.fwsc'
env={k:v for k,v in os.environ.items() if not k.startswith('FM1_POC_')}
env.update(FM1_POC_STATE_DIR=str(out),FM1_POC_CAPTURE_NS='10000000000',
 FM1_POC_SNAPSHOT_NS='3000000000,6000000000,7500000000,9000000000',
 FM1_POC_INPUT='7000000000:z:1,8000000000:z:0')
if a.idle:
 env.update(FM1_POC_CAPTURE_NS='35000000000',FM1_POC_SNAPSHOT_NS='5000000000,15000000000,25000000000,34000000000',FM1_POC_INPUT='')
if a.recovery:
 env.update(FM1_POC_CAPTURE_NS='9000000000',FM1_POC_SNAPSHOT_NS='',FM1_POC_INPUT='2000000000:x:1,2000000000:v:1,8000000000:x:0,8000000000:v:0')
if a.check_audio_output:
 env.update(FM1_POC_CAPTURE_NS='7750000000',FM1_POC_SNAPSHOT_NS='3000000000,6000000000,7500000000,7700000000')
cmd=[str(exe),'--qemu','-M','fm1-poc','-smp','2','-accel','tcg,thread=single','-icount','shift=3,align=off,sleep=off','-display','none','-serial','none','-monitor','none','-nodefaults','-no-user-config','-kernel',str(package),'-append','application']
try:
 r=subprocess.run(cmd,env=env,capture_output=True,timeout=55)
 stderr=r.stderr.decode(errors='replace');code=r.returncode
except subprocess.TimeoutExpired as e:
 stderr=(e.stderr or b'').decode(errors='replace');code='wall-timeout'
(out/'stderr.txt').write_text(stderr)
state=json.loads((out/'state.json').read_text()) if (out/'state.json').exists() else {}
snaps=[json.loads(x) for x in (out/'snapshots.jsonl').read_text().splitlines()] if (out/'snapshots.jsonl').exists() else []
passed=('requested capture' in stderr and len(snaps)==4 and all(x['visible'] for x in snaps)
 and snaps[-1]['audio_completions']>snaps[0]['audio_completions']
 and snaps[-1]['lcd_commands']>snaps[0]['lcd_commands']
 and (a.idle or snaps[2]['audio_nonzero_words']>snaps[1]['audio_nonzero_words']))
if a.recovery:
 mem=(out/'state.sram').read_bytes() if (out/'state.sram').exists() else b''
 passed=mem[0x7fd80:0x7fd8f]==b'usb_update_mode'
audio_check=None
if a.check_audio_output:
 raw=(out/'state.alnk').read_bytes() if (out/'state.alnk').exists() else b''
 words=struct.unpack('<'+'i'*(len(raw)//4),raw) if raw and len(raw)%8==0 else ()
 decoded=[((v&0xffffff)^0x800000)-0x800000 for v in words]
 audio_check=dict(words=len(words),peak=max(map(abs,decoded),default=0),
   signed_24_bit=all(a==b for a,b in zip(words,decoded)),
   stereo_matches=all(words[i]==words[i+1] for i in range(0,len(words),2)),
   digital_ceiling=629144)
 passed=passed and bool(words) and audio_check['signed_24_bit'] and audio_check['stereo_matches'] and 0<audio_check['peak']<=629144
report=dict(passed=passed,scope="recovery-request-only" if a.recovery else "boot-idle-only" if a.idle else "boot-and-note",diagnostic=a.diagnostic,physical_tested=False,
 package_sha256=hashlib.sha256(package.read_bytes()).hexdigest(),
 emulator_sha256=hashlib.sha256(exe.read_bytes()).hexdigest(),
 emulator_revision='519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34',emulator_label=a.emulator_label,
 command=cmd,returncode=code,stderr=stderr,snapshots=snaps,
 reason=state.get('reason'),limitations=['No physical timing/USB/recovery proof','Diagnostic builds use LCD BAUD 4; this run records whether that override applies', 'Custom emulator changes are local research, not upstream or hardware validation'])
if audio_check is not None: report['audio_output_check']=audio_check
(out/'result.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(0 if passed else 1)
