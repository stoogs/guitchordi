import fs from 'node:fs';
import assert from 'node:assert/strict';
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
const blacks=[1,3,5,8,10,13,15,17,20,22,25];
const choose=slot=>{e.fw_keys(0);e.fw_keys(1<<blacks[slot]);e.fw_keys(0);};
e.fw_boot();assert.equal(e.fw_suggestion(-1),-1);assert.equal(e.fw_suggestion(11),-1);assert.equal(e.fw_key_brightness(27),0);
assert.equal(e.fw_set_mode(2),1);choose(0);
assert.equal(e.fw_suggestion(0),0);assert.equal(e.fw_suggestion(3),3,'Fmaj9 → C13 smooth');assert.equal(e.fw_suggestion(7),1,'Fmaj9 → D7b9 is a tension choice');assert.equal(e.fw_suggestion(8),2);
assert.deepEqual([3,8,7].map(i=>e.fw_key_brightness(blacks[i])),[192,80,20]);
choose(3);assert.equal(e.fw_suggestion(0),3);assert.equal(e.fw_suggestion_reason(0),1,'C13 resolves to Fmaj9');
choose(7);assert.equal(e.fw_suggestion(2),3);assert.equal(e.fw_suggestion_reason(2),1,'D7b9 resolves to Gm9');
const before=Array.from({length:11},(_,i)=>e.fw_suggestion(i));e.fw_encoder(4,12);e.fw_encoder(6,4);assert.deepEqual(Array.from({length:11},(_,i)=>e.fw_suggestion(i)),before,'global transposition and voicing preserve harmonic classes');
// Editing a slot invalidates the cache and uses its actual replacement chord.
choose(0);const unedited=Array.from({length:11},(_,i)=>e.fw_suggestion(i));e.fw_button(4,1);e.fw_button(4,0);e.fw_encoder(2,100);const edited=Array.from({length:11},(_,i)=>e.fw_suggestion(i));assert.notDeepEqual(edited,unedited);e.fw_button(1,1);e.fw_button(1,0);
let comparisons=0;const counts=[0,0,0,0];
for(let mode=0;mode<50;mode++){
 e.fw_boot();e.fw_set_mode(mode);
 for(let from=0;from<11;from++){
  choose(from);
  for(let to=0;to<11;to++){
   const level=e.fw_suggestion(to),reason=e.fw_suggestion_reason(to);assert.ok(level>=0&&level<=3);assert.ok(reason>=0&&reason<=5);
   assert.equal(level===0,to===from);assert.equal(e.fw_key_brightness(blacks[to]),to===from?255:level===3?192:level===2?80:20);counts[level]++;comparisons++;
  }
 }
 assert.equal(e.fw_attacks(),0,'hints never trigger sound');
}
assert.ok(counts.slice(1).every(n=>n>0));
console.log({harmony_comparisons:comparisons,levels:counts,resolutions:'C13 → Fmaj9 and D7b9 → Gm9 passed',edited_slots:'passed',audio_side_effects:'none'});
