#!/usr/bin/env python3
"""Stage an offline, hash-checked device-test folder. Never discovers or writes devices."""
from pathlib import Path
import hashlib,json,shutil,subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'build/device-prep'
REV='54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3'
STOCK='db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a'
LOADER='d41da6126760c9d66660bcc0cac8d27d221806c5e369a8036921efe68dca5376'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def fetch(name,url,expected=None):
 path=OUT/name;path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists() or (expected and sha(path)!=expected):
  temp=path.with_suffix('.download')
  subprocess.run(['curl','-fLsS','--connect-timeout','10','--max-time','120',url,'-o',str(temp)],check=True)
  if expected and sha(temp)!=expected:
   observed=sha(temp);temp.unlink();raise SystemExit(f'Hash mismatch: {name}; expected {expected}, observed {observed}')
  temp.replace(path)
 return {'path':name,'sha256':sha(path),'source':url,'expected_sha256':expected}
def main():
 OUT.mkdir(parents=True,exist_ok=True)
 report=json.loads((ROOT/'build/fm1/report.json').read_text())
 if report.get('emulator_diagnostic'):raise SystemExit('Diagnostic build cannot be staged for a physical device')
 candidate=ROOT/report['package']['path']
 if sha(candidate)!=report['package']['sha256']:raise SystemExit('Candidate differs from build report')
 shutil.copy2(candidate,OUT/candidate.name)
 files=[{'path':candidate.name,'sha256':sha(candidate),'source':'local build; not qualified on hardware'}]
 errors=[]
 def attempt(*args):
  try:files.append(fetch(*args))
  except (SystemExit,subprocess.CalledProcessError) as error:errors.append(str(error))
 attempt('FM-1-stock-V15.fwsc','https://raw.githubusercontent.com/m-vave/fm1_open/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/firmware/FM-1_015.fwsc',STOCK)
 attempt('wl82loader.bin','https://raw.githubusercontent.com/kagaimiq/jl-uboot-tool/c32b28e7a04f873f526ba929cb1bae9f05442fe9/data/loaderblobs/usb/wl82loader.bin',LOADER)
 for name,expected in {'fm1_install.py':'31c602665a5b6b86cd9da17797c80613f5a645261f8b3be020955e34cb0226ee','fm1_rescue.py':'fc8687107535049b7ac7a7257eb63ae571c75049d0c64bd5f23beba167e7fbaa'}.items():
  attempt('reference-tools/'+name,f'https://raw.githubusercontent.com/charlesvestal/fm1-x0x/{REV}/tools/{name}',expected)
 (OUT/'reference-tools').mkdir(exist_ok=True)
 shutil.copy2(ROOT/'third_party/fm1-platform/LICENSE',OUT/'reference-tools/LICENSE')
 shutil.copy2(ROOT/'docs/first-device-test.md',OUT/'READ-ME-FIRST.md')
 manifest={'status':'PREPARATION ONLY — NOT CLEARED TO FLASH','physical_tested':False,'reference_revision':REV,'files':files,'preparation_errors':errors,'build_report':report,'hardware_checks_pending':['Exact FM-1 identity and current firmware','Per-device backup','Recovery mode detected and restoration route proven','USB updater compatibility and outgoing update: hardware not tested','Initial audio and real-time deadline measurements']}
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 print('Staged:',OUT);
 for error in errors:print('BLOCKED:',error)
 print('No USB or device operation performed. Review READ-ME-FIRST.md before any hardware step.')
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
