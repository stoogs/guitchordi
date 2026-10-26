import fs from 'node:fs';
import assert from 'node:assert/strict';
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
const button=n=>{e.fw_button(n,1);e.fw_button(n,0);};
function advance(ms){let n=Math.round(ms*44.1);while(n){let count=Math.min(n,128);const a=new Float32Array(e.memory.buffer,e.fw_render(count),count);assert.ok(a.every(x=>Number.isFinite(x)&&Math.abs(x)<=.980001));assert.ok(e.gm_active()<=14);n-=count;}}
function snapshot(){button(7);return Array.from(new Uint32Array(e.memory.buffer,e.fw_store(),46));}
function capture(mode,vel,key){e.fw_boot();button(8);button(8);e.fw_set_tone(0);for(let i=0;i<mode;i++)button(8);button(5);e.fw_encoder(4,-100);e.fw_encoder(6,vel-80);button(1);assert.equal(e.fw_velocity(),50,'attack strength does not change tone intensity');e.fw_keys(1<<key);const pcm=[];for(let i=0;i<8;i++)pcm.push(...new Float32Array(e.memory.buffer,e.fw_render(128),128));return pcm;}
const energy=a=>a.reduce((sum,x)=>sum+x*x,0);
for(const mode of [1,2]){
 const soft=capture(mode,80,0),normal=capture(mode,80,11),accent=capture(mode,80,21);
 assert.ok(energy(soft)<energy(normal));assert.ok(energy(normal)<energy(accent));
 assert.ok(energy(capture(mode,40,11))<energy(normal));
 assert.ok(energy(capture(mode,100,11))>energy(normal));
}
assert.deepEqual(capture(0,1,11),capture(0,100,11),'Freeplay zones unchanged by rhythm velocity');
assert.deepEqual(capture(2,80,1),capture(2,80,11),'Arp and normal strum key use the same 80% attack');
for(const mode of [1,2]){capture(mode,100,1);advance(500);}
e.fw_boot();assert.equal(e.fw_rhythm_velocity(),80);const factory=snapshot();
button(5);e.fw_encoder(6,-100);assert.equal(e.fw_rhythm_velocity(),1);e.fw_encoder(6,100);assert.equal(e.fw_rhythm_velocity(),100);const loud=snapshot();e.fw_boot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(loud);assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_velocity(),100);
const store=new Uint32Array(e.memory.buffer,e.fw_store(),46);store[45]=101;assert.equal(e.fw_restore(),0);assert.equal(e.fw_rhythm_velocity(),100);store.set(loud);store[0]=0x474d000a;assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_velocity(),80,'v10 migration defaults to 80');
// Deliberately change all setting groups and a chord slot, then lock it.
e.fw_boot();button(8);button(8);e.fw_set_mode(26);e.fw_set_tone(13);button(4);e.fw_encoder(2,1);button(1);e.fw_encoder(6,2);e.fw_encoder(3,30);e.fw_encoder(4,4);e.fw_encoder(5,15);e.fw_master(33);button(8);e.fw_encoder(0,60);e.fw_encoder(3,3);e.fw_encoder(4,5);e.fw_encoder(5,-3);e.fw_encoder(6,15);button(8);e.fw_encoder(3,4);e.fw_encoder(4,-3);e.fw_encoder(5,-1);e.fw_encoder(6,8);button(5);e.fw_encoder(3,1);e.fw_encoder(4,5);e.fw_encoder(5,3);e.fw_encoder(6,-20);button(1);e.fw_button(2,1);advance(3001);e.fw_button(2,0);assert.equal(e.fw_locked(),1);const custom=snapshot();
e.fw_button(5,1);advance(2998);assert.equal(e.fw_factory_reset_menu(),0);e.fw_button(5,0);assert.deepEqual(snapshot(),custom,'short hold never resets');
e.fw_button(5,1);advance(3001);assert.equal(e.fw_factory_reset_menu(),1);const attacks=e.fw_attacks();
e.fw_keys((1<<1)|(1<<11));e.fw_encoder(1,2);e.fw_encoder(0,12);e.fw_set_tone(2);e.fw_set_mode(1);e.fw_master(90);button(8);advance(200);assert.equal(e.fw_attacks(),attacks,'confirmation blocks performance');assert.equal(e.fw_bpm(),150);assert.equal(e.fw_tone(),13);assert.equal(e.fw_volume(),33);
button(6);assert.equal(e.fw_factory_reset_menu(),0);assert.deepEqual(snapshot(),custom,'HOME cancels without changing settings');advance(3200);assert.equal(e.fw_factory_reset_menu(),0,'same GLO hold cannot reopen');e.fw_button(5,0);
e.fw_button(5,1);advance(3001);assert.equal(e.fw_factory_reset_menu(),1);const writes=e.fw_store_version();button(1);assert.equal(e.fw_store_version(),writes+1,'confirmed reset publishes a fresh browser save');assert.deepEqual(Array.from(store),factory,'every saved setting and chord slot restored');assert.equal(e.fw_locked(),0);assert.equal(e.fw_factory_reset_menu(),0);advance(3200);assert.equal(e.fw_factory_reset_menu(),0,'confirming while GLO held cannot retrigger');
button(8);e.fw_keys((1<<1)|(1<<11));advance(100);assert.equal(e.fw_attacks(),attacks,'held keys must release after reset');e.fw_keys(0);e.fw_keys(1<<1);advance(60);assert.ok(e.fw_attacks()>attacks);e.fw_button(5,0);
console.log('Velocity: manual zones, automatic attack, limits, migration, SAVE passed. Factory reset: hold threshold, input blocking, cancel, all defaults, save, held controls passed.');
