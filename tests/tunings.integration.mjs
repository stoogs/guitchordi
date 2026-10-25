import fs from 'node:fs';
import assert from 'node:assert/strict';
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
const bank=JSON.parse(fs.readFileSync('web/chords.json')).voicings;
const standard=JSON.parse(fs.readFileSync('build/generated/chord-shapes.json'));
const presets=JSON.parse(fs.readFileSync('docs/tuning-presets.json')).presets;
const pcs=notes=>[...new Set(notes.filter(n=>n>=0).map(n=>n%12))].sort((a,b)=>a-b);
const button=n=>{e.fw_button(n,1);e.fw_button(n,0);};
const name=p=>{const bytes=new Uint8Array(e.memory.buffer);let s='';while(bytes[p])s+=String.fromCharCode(bytes[p++]);return s;};
e.fw_boot();assert.equal(e.fw_tuning(),0);assert.equal(e.fw_tuning_count(),14);assert.equal(e.fw_open_pitch(-1),-1);
button(7);const original=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();assert.equal(original[0],0x474d000b);
let shapes=0,contacts=0;
for(let tuning=0;tuning<presets.length;tuning++){
 assert.equal(name(e.fw_tuning_name(tuning)),presets[tuning].name);
 for(const [chord,notes] of Object.entries(bank))for(let shape=0;shape<6;shape++){
  const store=new Uint32Array(e.memory.buffer,e.fw_store(),46);store.set(original);store[1]=0;store[8]=Object.keys(bank).indexOf(chord);store[21]=shape;store[44]=tuning;assert.equal(e.fw_restore(),1);
  assert.equal(name(e.fw_slot_name(0)),chord);assert.equal(e.fw_tuning(),tuning);
  const sounding=Array.from({length:6},(_,i)=>e.fw_slot_pitch(0,i));assert.deepEqual(pcs(sounding),pcs(notes.map(n=>n??-1)));
  if(!tuning)assert.deepEqual(sounding,standard[chord][shape],'standard shapes unchanged');
  else {
   const frets=sounding.map((p,i)=>p<0?-1:p-presets[tuning].midi[i]);assert.ok(frets.every(f=>f>=-1&&f<=23));
   const stopped=frets.filter(f=>f>0);assert.ok(!stopped.length||Math.max(...stopped)-Math.min(...stopped)<=4);assert.ok(new Set(stopped).size<=4);
  }
  for(let part=0;part<6;part++){assert.equal(e.fw_open_pitch(part),presets[tuning].midi[part]);assert.equal(e.fw_key_pitch(part),sounding[part]);contacts++;}
  assert.equal(e.fw_attacks(),0,'selecting tuning or shape never plays');shapes++;
 }
}
// A named D chord can actually use the low D string in Drop D and all-open Open D.
for(const [tuning,expected] of [[1,38],[3,38]]){
 const store=new Uint32Array(e.memory.buffer,e.fw_store(),46);store.set(original);store[8]=Object.keys(bank).indexOf('D');store[44]=tuning;assert.equal(e.fw_restore(),1);assert.equal(e.fw_slot_pitch(0,0),expected);
 if(tuning===3)assert.deepEqual(Array.from({length:6},(_,i)=>e.fw_slot_pitch(0,i)),presets[3].midi);
}
// GLO K3 is tuning, only while unlocked, and remains independent of style/instrument.
e.fw_boot();button(5);e.fw_encoder(5,1);assert.equal(e.fw_tuning(),1);button(1);e.fw_set_tone(11);e.fw_set_mode(2);assert.equal(e.fw_tuning(),1);assert.equal(e.fw_attacks(),0);
button(5);e.fw_encoder(5,2);button(7);const saved=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();e.fw_boot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(saved);assert.equal(e.fw_restore(),1);assert.equal(e.fw_tuning(),3);
const store=new Uint32Array(e.memory.buffer,e.fw_store(),46);store[44]=14;assert.equal(e.fw_restore(),0);assert.equal(e.fw_tuning(),3);store.set(saved);store[0]=0x474d0009;assert.equal(e.fw_restore(),1);assert.equal(e.fw_tuning(),0,'v9 migrates to standard');
e.fw_button(2,1);for(let n=0;n<1034;n++)e.fw_render(128);e.fw_button(2,0);assert.equal(e.fw_locked(),1);button(5);e.fw_encoder(5,5);assert.equal(e.fw_tuning(),0);
console.log({tunings:presets.length,chords:Object.keys(bank).length,shapes_checked:shapes,part_checks:contacts,standard_parity:'exact',drop_d_bass:'D2',open_d:'all open',storage_lock_independence:'passed'});
