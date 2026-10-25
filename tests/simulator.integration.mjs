import fs from 'node:fs';
import assert from 'node:assert/strict';
const module = await WebAssembly.compile(fs.readFileSync('build/simulator.wasm'));
assert.deepEqual(WebAssembly.Module.imports(module), []);
const e = new WebAssembly.Instance(module, {}).exports; e._initialize();
// Splash is silent, animated, bounded in time, and never holds up a real input.
e.fw_boot();assert.equal(e.fw_boot_screen(),1);
const splash=new Uint16Array(e.memory.buffer,e.fw_frame(),240*240).slice();
e.fw_master(59);assert.equal(e.fw_boot_screen(),1,'ADC calibration cannot skip the splash');
for(let i=0;i<40;i++){const pcm=new Float32Array(e.memory.buffer,e.fw_render(128),128);assert.ok(pcm.every(x=>x===0));}
assert.ok(new Uint16Array(e.memory.buffer,e.fw_frame(),240*240).some((x,i)=>x!==splash[i]),'wave animation advances');
assert.equal(e.fw_attacks(),0);for(let i=0;i<720;i++)e.fw_render(128);assert.equal(e.fw_boot_screen(),0,'automatic transition after 2.2 seconds');
for(const input of [()=>e.fw_keys(1),()=>e.fw_button(1,1),()=>e.fw_encoder(0,1)]){e.fw_boot();input();assert.equal(e.fw_boot_screen(),0,'first physical input skips splash');}
e.fw_boot();e.fw_keys(1);assert.equal(e.fw_attacks(),1,'first playing contact still sounds immediately');
fixtureBoot();
function fixtureBoot(){e.fw_boot();e.fw_set_mode(0);e.fw_set_tone(0);e.fw_keys(1<<3);e.fw_keys(0);}
const native = fs.readFileSync('build/simulator-native.f32'); let peak = 0, diff = 0;
for (let b = 0; b < 1200; b++) {
  if (b===20) e.fw_keys(1); if(b===30) e.fw_keys(1<<4); if(b===40)e.fw_keys(0);
  if(b===50)e.fw_encoder(1,1);
  if(b===60)e.fw_keys(1<<26); if(b===70)e.fw_keys(0);
  if(b===80)e.fw_button(0,1); if(b===81)e.fw_button(0,0);
  if(b===90)e.fw_encoder(5,25);
  if(b===100)e.fw_keys(1<<11); if(b===110)e.fw_keys(0);
  const audio = new Float32Array(e.memory.buffer,e.fw_render(128),128);
  for(let i=0;i<128;i++){assert.ok(Number.isFinite(audio[i]));peak=Math.max(peak,Math.abs(audio[i]));diff=Math.max(diff,Math.abs(audio[i]-native.readFloatLE((b*128+i)*4)));}
}
assert.ok(peak>0.01); assert.equal(diff,0); assert.equal(e.fw_attacks(),4);
assert.ok(new Uint16Array(e.memory.buffer,e.fw_frame(),240*240).some(x=>x!==0));
function advance(ms){let n=Math.round(ms*44.1);while(n){const count=Math.min(n,128);e.fw_render(count);n-=count;}}
e.fw_button(2,1);advance(2999);assert.equal(e.fw_locked(),0);advance(2);assert.equal(e.fw_locked(),1);advance(5100);assert.equal(e.fw_locked(),1);e.fw_button(2,0);
e.fw_keys(1<<1);e.fw_keys(0);assert.equal(e.fw_selected(),1);
e.fw_button(7,1);e.fw_button(7,0);
const saved=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();
fixtureBoot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(saved);assert.equal(e.fw_restore(),1);assert.equal(e.fw_locked(),1);
e.fw_panic();assert.equal(e.gm_active(),0);
fixtureBoot();
const white=[0,2,4,6,7,9,11,12,14,16,18,19,21,23,24,26];
const expected=[43,47,50,55,59,67,43,47,50,55,59,67,50,55,59,67];
for(let i=0;i<16;i++){e.fw_keys(1<<white[i]);assert.equal(e.fw_last_key(),i);assert.equal(e.fw_last_pitch(),expected[i]);e.fw_keys(0);}
assert.equal(e.fw_attacks(),16);
for(let i=0;i<1000;i++){e.fw_keys(1);e.fw_keys(0);const s=new Float32Array(e.memory.buffer,e.fw_render(128),128);assert.ok(s.every(Number.isFinite));assert.ok(e.gm_active()<=14);}
assert.equal(e.fw_attacks(),1016);

const styles=JSON.parse(fs.readFileSync('web/styles.json')).styles;
const voicings=JSON.parse(fs.readFileSync('web/chords.json')).voicings;
function name(pointer){const bytes=new Uint8Array(e.memory.buffer);let result='';while(bytes[pointer])result+=String.fromCharCode(bytes[pointer++]);return result;}
assert.equal(e.fw_mode_count(),50);
const blacks=[1,3,5,8,10,13,15,17,20,22,25];
fixtureBoot();
for(let mode=0;mode<50;mode++){
  const before=e.fw_attacks();assert.equal(e.fw_set_mode(mode),1);assert.equal(e.fw_attacks(),before,'style change creates no attack');
  assert.equal(name(e.fw_mode_name(mode)),styles[mode].name);
  for(let slot=0;slot<11;slot++){
    assert.equal(name(e.fw_slot_name(slot)),styles[mode].slots[slot]);
    const notes=voicings[styles[mode].slots[slot]];
    notes.forEach((pitch,string)=>assert.equal(e.fw_slot_pitch(slot,string),pitch??-1));
    e.fw_keys(1<<blacks[slot]);e.fw_keys(0);
    for(let key=0;key<16;key++){
      const string=key<12?key%6:key-10,before=e.fw_attacks(),pitch=notes[string];
      e.fw_keys(1<<white[key]);assert.equal(e.fw_last_pitch(),pitch??-1);
      assert.equal(e.fw_attacks(),before+(pitch===null?0:1));e.fw_keys(0);
      const audio=new Float32Array(e.memory.buffer,e.fw_render(128),128);assert.ok(audio.every(Number.isFinite));assert.ok(e.gm_active()<=14);
    }
  }
}
fixtureBoot();e.fw_set_mode(26);e.fw_button(7,1);e.fw_button(7,0);
const modeSave=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();
fixtureBoot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(modeSave);assert.equal(e.fw_restore(),1);assert.equal(e.fw_mode(),26);
// Legacy v1 snapshots retain their original eleven voicing IDs and custom tone.
const legacy=new Uint32Array([0x474d0001,1,1,75,100,12,12,0,0,1,2,3,4,5,6,7,8,9,10,0,0]);
fixtureBoot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(legacy);assert.equal(e.fw_restore(),1);assert.equal(e.fw_mode(),0);assert.equal(e.fw_tone(),1);assert.equal(name(e.fw_slot_name(0)),'C');
e.fw_button(2,1);advance(3001);e.fw_button(2,0);assert.equal(e.fw_locked(),1);assert.equal(e.fw_set_mode(2),0);assert.equal(e.fw_mode(),0);
assert.equal(e.fw_set_mode(-1),0);assert.equal(e.fw_set_mode(50),0);
console.log(JSON.stringify({styles_tested:50,slots_tested:550,white_contacts_tested:8800,native_wasm_max_float_difference:diff,peak,attacks:4,framebuffer:'240x240 RGB565 from C',state_bytes:e.fw_state_bytes(),lock:'ENV 3s once per hold',storage:'validated restore'},null,2));
