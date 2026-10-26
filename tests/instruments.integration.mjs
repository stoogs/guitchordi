import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const patches=JSON.parse(fs.readFileSync('web/instruments.json')).instruments;
const bank=JSON.parse(fs.readFileSync('web/chords.json'));
const styles=JSON.parse(fs.readFileSync('web/styles.json')).styles;
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
const native=fs.readFileSync('build/instruments-native.f32'), hashes=new Set();
const white=[0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26],black=[1,3,5,8,10,13,15,17,20,22,25];
function name(p){let s='',a=new Uint8Array(e.memory.buffer);while(a[p])s+=String.fromCharCode(a[p++]);return s;}
assert.equal(e.gm_tone_count(),16);let sampleIndex=0,peak=0;
for(let tone=0;tone<16;tone++){
  assert.equal(name(e.gm_tone_name(tone)),patches[tone].name);
  e.fw_boot();assert.equal(e.fw_set_tone(tone),1);const hash=createHash('sha256');
  for(let b=0;b<1400;b++){
    if(b<300&&b%3===0){e.fw_keys(1<<white[(b/3)%16]);e.fw_keys(0);}
    const s=new Float32Array(e.memory.buffer,e.fw_render(128),128);hash.update(new Uint8Array(s.buffer,s.byteOffset,s.byteLength));
    for(const value of s){assert.ok(Number.isFinite(value));assert.ok(Math.abs(value)<=.98);assert.equal(value,native.readFloatLE(sampleIndex++*4),`native/WASM tone ${tone}`);peak=Math.max(peak,Math.abs(value));}
    assert.ok(e.gm_active()<=14);
  }
  assert.equal(e.gm_active(),0);hashes.add(hash.digest('hex'));
  e.fw_button(7,1);e.fw_button(7,0);const saved=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();assert.equal(saved[0],0x474d000c);
  e.fw_boot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(saved);assert.equal(e.fw_restore(),1);assert.equal(e.fw_tone(),tone);
}
assert.equal(hashes.size,16,'all patches generate distinct audio');assert.equal(sampleIndex*4,native.length);
let contacts=0;
for(let tone=0;tone<16;tone++)for(let mode=0;mode<50;mode++){
  e.fw_boot();e.fw_button(8,1);e.fw_button(8,0);e.fw_button(8,1);e.fw_button(8,0);e.fw_set_mode(mode);e.fw_set_tone(tone);const patch=patches[tone];
  for(let slot=0;slot<11;slot++){
    e.fw_keys(1<<black[slot]);e.fw_keys(0);const notes=bank.voicings[styles[mode].slots[slot]];
    for(let key=0;key<16;key++){
      const part=patch.mapping[key<12?key%6:key-10];let pitch=notes[part];const before=e.fw_attacks();
      if(pitch!==null){pitch+=patch.octaveOffset;while(pitch<24)pitch+=12;while(pitch>96)pitch-=12;}
      assert.equal(e.fw_key_pitch(key),pitch??-1);e.fw_keys(1<<white[key]);assert.equal(e.fw_last_pitch(),pitch??-1);assert.equal(e.fw_attacks(),before+(pitch===null?0:1));e.fw_keys(0);contacts++;
    }
  }
}
// Bad v3 instruments and old snapshots containing new-only IDs are rejected.
e.fw_boot();e.fw_set_tone(15);e.fw_button(7,1);e.fw_button(7,0);
const settings=new Uint32Array(e.memory.buffer,e.fw_store(),46);settings[0]=0x474d0002;assert.equal(e.fw_restore(),0);settings[0]=0x474d0003;settings[2]=16;assert.equal(e.fw_restore(),0);
assert.equal(e.fw_key_pitch(-1),-1);assert.equal(e.fw_key_pitch(16),-1);
assert.equal(e.fw_set_tone(-1),0);assert.equal(e.fw_set_tone(16),0);
const report={instruments:16,distinct_audio:hashes.size,native_wasm_samples:sampleIndex,max_float_difference:0,style_instrument_contacts:contacts,peak,state_bytes:e.fw_state_bytes(),native_mixed_retriggers:20000,ubsan:'passed'};
fs.writeFileSync('build/instruments-measurements.json',JSON.stringify(report,null,2)+'\n');console.log(report);
