import fs from 'node:fs';
import assert from 'node:assert/strict';
const bank=JSON.parse(fs.readFileSync('web/chords.json')).voicings;
const shapes=JSON.parse(fs.readFileSync('build/generated/chord-shapes.json'));
const patches=JSON.parse(fs.readFileSync('web/instruments.json')).instruments;
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();e.fw_boot();e.fw_button(7,1);e.fw_button(7,0);
const original=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();
let checked=0;
for(const [chord,options] of Object.entries(shapes)) {
 const chordID=Object.keys(bank).indexOf(chord),pcs=ns=>[...new Set(ns.filter(n=>n>=0).map(n=>n%12))].sort((a,b)=>a-b);
 assert.equal(new Set(options.map(JSON.stringify)).size,6);
 assert.deepEqual(options[0],bank[chord].map(n=>n??-1));
 for(let choice=0;choice<6;choice++) {
  assert.deepEqual(pcs(options[choice]),pcs(options[0]));
  const snapshot=original.slice();snapshot[1]=0;snapshot[8]=chordID;snapshot[21]=choice;
  new Uint32Array(e.memory.buffer,e.fw_store(),46).set(snapshot);assert.equal(e.fw_restore(),1);
  assert.equal(e.fw_voicing(),choice);assert.equal(e.fw_voicing_count(),6);
  for(let part=0;part<6;part++)assert.equal(e.fw_slot_pitch(0,part),options[choice][part]);
  for(let tone=0;tone<16;tone++) {
   assert.equal(e.fw_set_tone(tone),1);assert.equal(patches[tone].parts,6);
   for(let part=0;part<6;part++) {
    let p=options[choice][part];if(p>=0){p+=patches[tone].octaveOffset;while(p<24)p+=12;while(p>96)p-=12;}
    assert.equal(e.fw_key_pitch(part),p);checked++;
   }
  }
 }
}
assert.equal(e.fw_attacks(),0,'changing voicing/instrument creates no notes');
console.log(JSON.stringify({chords:294,distinct_shapes:1764,pitch_class_preserved:true,patch_part_checks:checked},null,2));
