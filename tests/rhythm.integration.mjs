import fs from 'node:fs';
import assert from 'node:assert/strict';
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
function advance(ms){let n=Math.round(ms*44.1);while(n){const count=Math.min(128,n);const a=new Float32Array(e.memory.buffer,e.fw_render(count),count);assert.ok(a.every(x=>Number.isFinite(x)&&Math.abs(x)<=.980001));assert.ok(e.gm_active()<=14);n-=count;}}
e.fw_boot();assert.equal(e.fw_bpm(),90,'factory tempo');assert.equal(e.fw_tone(),3);assert.equal(e.fw_play_mode(),1);assert.equal(e.fw_running(),0);assert.equal(e.fw_velocity(),60);assert.equal(e.fw_mode(),16);assert.equal(e.fw_selected(),0);assert.deepEqual([0,1,2,3].map(i=>e.fw_rhythm_param(i)),[0,9,4,10]);
function boot(mode){e.fw_boot();button(8);button(8);e.fw_set_mode(0);e.fw_set_tone(0);e.fw_keys(1<<3);e.fw_keys(0);e.fw_encoder(0,30);for(let i=0;i<mode;i++)button(8);}
function button(n){e.fw_button(n,1);e.fw_button(n,0);}
// First use invites one complete stroke without starting audio at boot.
e.fw_keys(1<<1);e.fw_keys(0);advance(60);
assert.equal(e.fw_attacks(),6,'factory Strum chord tap completes six notes');
assert.ok(e.gm_active()>0);assert.equal(e.fw_running(),0);
const chord=1<<3;
boot(0);const stable=e.fw_render(128);e.fw_keys(chord);advance(1000);assert.equal(e.fw_attacks(),0);
boot(1);e.fw_keys(chord);assert.equal(e.fw_attacks(),1);advance(80);assert.equal(e.fw_attacks(),6);assert.equal(e.fw_render(128),stable,'one stable output buffer across modes');
advance(165);assert.equal(e.fw_attacks(),6);advance(8);assert.ok(e.fw_attacks()>6);
e.fw_keys(0);advance(100);const released=e.fw_attacks();advance(1000);assert.equal(e.fw_attacks(),released);assert.equal(e.fw_running(),0);
// A quick tap completes exactly one six-part strum, without latching repeats.
boot(1);e.fw_keys(chord);e.fw_keys(0);advance(1000);assert.equal(e.fw_attacks(),6);
boot(2);e.fw_keys(chord);advance(249);assert.equal(e.fw_attacks(),1);advance(2);assert.equal(e.fw_attacks(),2);e.fw_keys(0);advance(1000);assert.equal(e.fw_attacks(),2);
boot(2);e.fw_encoder(5,-4);e.fw_keys(chord);advance(80);assert.equal(e.gm_active(),0,'25% gate releases before next step');
boot(2);e.fw_encoder(5,-1);e.fw_keys(chord);advance(200);assert.equal(e.gm_active(),1,'100% gate keeps note alive to step end');
boot(2);e.fw_encoder(6,12);e.fw_keys(chord);advance(399);assert.equal(e.fw_attacks(),1);advance(2);assert.equal(e.fw_attacks(),2);advance(100);assert.equal(e.fw_attacks(),3,'swing pair preserves beat length');
const firsts=[43,67,43,67,43];
for(let pattern=0;pattern<6;pattern++){boot(2);e.fw_encoder(3,pattern);e.fw_keys(chord);if(pattern<5)assert.equal(e.fw_last_pitch(),firsts[pattern]);advance(1200);e.fw_keys(0);}
for(let pattern=0;pattern<6;pattern++){boot(1);e.fw_encoder(3,pattern);e.fw_keys(chord);e.fw_keys(0);advance(600);assert.equal(e.fw_attacks(),6);}
// FREE retains natural tails beyond the step, and stop still cancels automatic voices.
for(const mode of [1,2]){boot(mode);assert.equal(e.fw_rhythm_param(2),4);e.fw_keys(chord);e.fw_keys(0);advance(500);assert.ok(e.gm_active()>0,'FREE rings after step and chord release');button(8);advance(40);assert.equal(e.gm_active(),0,'mode switch fades free automatic notes');}
boot(2);e.fw_encoder(5,-1);e.fw_keys(chord);e.fw_keys(0);advance(500);assert.equal(e.gm_active(),0,'100% still ends at step boundary');
// PLAY cancels queued notes and cannot restart from an already-held chord.
boot(1);e.fw_keys(chord);button(10);const stopped=e.fw_attacks();for(let i=0;i<20;i++){e.fw_keys(chord);advance(50);}assert.equal(e.fw_attacks(),stopped);e.fw_keys(0);e.fw_keys(chord);assert.ok(e.fw_attacks()>stopped);
boot(1);e.fw_keys(chord);button(8);button(8);const changed=e.fw_attacks();advance(1000);assert.equal(e.fw_attacks(),changed,'mode change clears future events');
boot(2);e.fw_encoder(0,40);assert.equal(e.fw_bpm(),160);assert.equal(e.fw_play_mode(),2);button(1);assert.equal(e.fw_tempo_edit(),0);e.fw_encoder(3,4);e.fw_encoder(4,3);e.fw_encoder(5,-1);e.fw_encoder(6,7);button(7);
const saved=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();assert.equal(saved[0],0x474d000c);boot(0);new Uint32Array(e.memory.buffer,e.fw_store(),46).set(saved);assert.equal(e.fw_restore(),1);assert.equal(e.fw_play_mode(),2);assert.equal(e.fw_bpm(),160);assert.deepEqual([0,1,2,3].map(i=>e.fw_rhythm_param(i)),[4,12,3,7]);assert.equal(e.fw_running(),0,'SAVE never starts playing on reload');
const store=new Uint32Array(e.memory.buffer,e.fw_store(),46);store[35]=18;assert.equal(e.fw_restore(),0);assert.equal(e.fw_rhythm_param(1),12);store[0]=0x474d0005;assert.equal(e.fw_restore(),1);assert.equal(e.fw_play_mode(),0);assert.equal(e.fw_bpm(),90);
// v6 rhythmic saves retain exactly the old division meanings.
for(let old=0;old<6;old++){store.set(saved);store[0]=0x474d0006;store[35]=old;store[39]=old;store[36]=3;store[37]=2;assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_param(1),[3,6,9,11,12,14][old]);}
// SELECT is always tempo, ARP cycles all three modes, LFO is reserved.
boot(0);e.fw_encoder(0,1);assert.equal(e.fw_bpm(),121);assert.equal(e.fw_play_mode(),0);button(3);assert.equal(e.fw_tempo_edit(),0);for(const mode of [1,2,0,1]){button(8);assert.equal(e.fw_play_mode(),mode);}e.fw_encoder(0,-100);assert.equal(e.fw_bpm(),40);e.fw_encoder(0,100);e.fw_encoder(0,100);assert.equal(e.fw_bpm(),240);
// All straight/dotted/triplet divisions have correct sample timing, including slowest tempo.
for(const bpm of [40,120,240])for(let div=0;div<18;div++){
 boot(2);e.fw_encoder(0,bpm-120);if(bpm===240)e.fw_encoder(0,20);e.fw_encoder(4,div-9);e.fw_keys(chord);
 const frames=Math.floor(44100*60/bpm*(div%3===1?6:div%3===2?8/3:4)/(2**Math.floor(div/3)));
 let remaining=frames-1;while(remaining){const n=Math.min(128,remaining);e.fw_render(n);remaining-=n;}assert.equal(e.fw_attacks(),1,`early tick ${bpm}/${div}`);e.fw_render(3);assert.equal(e.fw_attacks(),2,`missing tick ${bpm}/${div}`);
}
// Strum and Arp maintain independent parameter banks.
boot(1);e.fw_encoder(3,2);e.fw_encoder(6,3);button(8);e.fw_encoder(3,4);button(8);button(8);assert.equal(e.fw_rhythm_param(0),2);assert.equal(e.fw_rhythm_param(3),13);button(8);assert.equal(e.fw_rhythm_param(0),4);assert.equal(e.fw_rhythm_param(3),0);
// Chord pulses select only sounding parts and retain gate/stop/SAVE semantics.
for(const slot of [0,1,2])for(const pattern of [6,7,8]){
 boot(2);e.fw_keys(1<<[1,3,5][slot]);e.fw_keys(0);button(10);
 const count=Array.from({length:6},(_,i)=>e.fw_slot_pitch(slot,i)).filter(p=>p>=0).length;
 e.fw_encoder(3,pattern);e.fw_encoder(5,-4);
 const before=e.fw_attacks();e.fw_keys(1<<[1,3,5][slot]);e.fw_keys(0);
 const expected=pattern===6?Math.ceil(count/2):pattern===7?Math.ceil(count*2/3):count;
 assert.equal(e.fw_attacks()-before,expected);assert.equal(e.gm_active(),expected);
 advance(90);assert.equal(e.gm_active(),0,'group percentage gate releases all notes');
 button(7);const groupSave=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();
 e.fw_boot();new Uint32Array(e.memory.buffer,e.fw_store(),46).set(groupSave);assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_param(0),pattern);assert.equal(e.fw_running(),0);
 const groupStore=new Uint32Array(e.memory.buffer,e.fw_store(),46);groupStore[38]=9;assert.equal(e.fw_restore(),0);groupStore.set(groupSave);groupStore[0]=0x474d000b;assert.equal(e.fw_restore(),0,'old schema rejects new pattern IDs');
}
// Existing v11 saves with the original pattern range still restore unchanged.
boot(2);e.fw_encoder(3,5);button(7);const legacy11=new Uint32Array(e.memory.buffer,e.fw_store(),46);legacy11[0]=0x474d000b;assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_param(0),5);
// The three lane starts glow; silent contacts remain dark; pressing wins.
e.fw_boot();assert.deepEqual([0,11,21].map(k=>e.fw_key_brightness(k)),[80,80,80]);
assert.deepEqual([2,4,6,7,9,12,14,16,18,19,23,24,26].map(k=>e.fw_key_brightness(k)),Array(13).fill(0));
e.fw_keys(1);assert.equal(e.fw_key_brightness(0),255);e.fw_keys(0);
boot(0);e.fw_keys(1<<1);e.fw_keys(0);assert.equal(e.fw_key_brightness(0),0);assert.equal(e.fw_key_brightness(11),0);assert.equal(e.fw_key_brightness(21),80);
// FX is a reversible page toggle; it leaves mode, rhythm and playback intact.
boot(2);e.fw_keys(chord);const fxAttacks=e.fw_attacks();button(0);assert.equal(e.fw_page(),2);button(0);assert.equal(e.fw_page(),0);assert.equal(e.fw_play_mode(),2);assert.equal(e.fw_attacks(),fxAttacks);assert.equal(e.fw_running(),1);
// Sweep duration is independent of repeat tempo and percentage gate; no humanity for exact timing.
for(const tempo of [60,180])for(const gate of [0,3,4]){
 boot(1);e.fw_encoder(0,tempo-120);button(5);e.fw_encoder(4,-2);button(1);assert.equal(e.fw_page(),0);
 e.fw_encoder(6,10);e.fw_encoder(5,gate-4);e.fw_keys(chord);e.fw_keys(0);
 advance(49);assert.equal(e.fw_attacks(),3);advance(52);assert.equal(e.fw_attacks(),6,'100 ms sweep regardless of BPM/gate');
}
// Very fast repetition fits a long requested sweep into each step without dangling queued notes.
boot(1);e.fw_encoder(0,100);e.fw_encoder(0,100);e.fw_encoder(4,8);e.fw_encoder(6,8);e.fw_keys(chord);advance(200);e.fw_keys(0);advance(50);assert.equal(e.fw_running(),0);
// Percentage gates can release into audible tails; FREE remains natural either way.
for(const tails of [0,1]){
 boot(2);button(5);e.fw_encoder(3,tails);button(1);e.fw_encoder(5,-4);e.fw_keys(chord);e.fw_keys(0);advance(200);assert.equal(e.gm_active()>0,!!tails);advance(500);assert.equal(e.gm_active(),0);
 boot(2);button(5);e.fw_encoder(3,tails);button(1);e.fw_keys(chord);e.fw_keys(0);advance(500);assert.ok(e.gm_active()>0);button(10);advance(10);assert.equal(e.gm_active(),0);
}
// Global settings and the independent sweep survive SAVE; old humanity moves into GLO.
boot(1);e.fw_encoder(6,4);button(5);e.fw_encoder(3,1);e.fw_encoder(4,5);button(1);button(7);
const feelSaved=new Uint32Array(e.memory.buffer,e.fw_store(),46).slice();boot(0);new Uint32Array(e.memory.buffer,e.fw_store(),46).set(feelSaved);assert.equal(e.fw_restore(),1);assert.equal(e.fw_gate_tails(),1);assert.equal(e.fw_humanity(),70);assert.equal(e.fw_rhythm_param(3),14);
const feelStore=new Uint32Array(e.memory.buffer,e.fw_store(),46);feelStore[42]=2;assert.equal(e.fw_restore(),0);feelStore.set(feelSaved);feelStore[0]=0x474d0007;feelStore[37]=9;assert.equal(e.fw_restore(),1);assert.equal(e.fw_humanity(),90);assert.equal(e.fw_rhythm_param(3),10);assert.equal(e.fw_gate_tails(),0);
// v8 sweep values migrate 25 ms steps to 5 ms steps, including both endpoints.
for(const old of [0,2,10]){feelStore.set(feelSaved);feelStore[0]=0x474d0008;feelStore[37]=old;assert.equal(e.fw_restore(),1);assert.equal(e.fw_rhythm_param(3),old*5);}
boot(1);e.fw_encoder(6,-100);assert.equal(e.fw_rhythm_param(3),0);for(let step=1;step<=50;step++){e.fw_encoder(6,1);assert.equal(e.fw_rhythm_param(3),step);}e.fw_encoder(6,1);assert.equal(e.fw_rhythm_param(3),50);
// ENV: gradual colour, three-second threshold, only one toggle per hold.
boot(0);e.fw_button(2,1);advance(1500);assert.equal(e.fw_lock_progress(),500);assert.equal(e.fw_locked(),0);const mid=new Uint16Array(e.memory.buffer,e.fw_frame(),240*240)[12*240+214];advance(1499);assert.equal(e.fw_locked(),0);advance(2);assert.equal(e.fw_locked(),1);const full=new Uint16Array(e.memory.buffer,e.fw_frame(),240*240)[12*240+214];assert.notEqual(mid,full);advance(3100);assert.equal(e.fw_locked(),1);e.fw_button(2,0);
// Fastest dense strum + all patterns/divisions/gates stays bounded.
for(let mode=1;mode<=2;mode++)for(let pattern=0;pattern<(mode===2?9:6);pattern++)for(let division=0;division<18;division++)for(let gate=0;gate<5;gate++){
 boot(mode);button(3);e.fw_encoder(0,100);e.fw_encoder(0,100);button(1);e.fw_encoder(3,pattern);e.fw_encoder(4,division-9);e.fw_encoder(5,gate-4);e.fw_keys(chord);advance(100);button(10);advance(10);
}
console.log(JSON.stringify({modes:3,strum_patterns:6,arp_patterns:9,divisions:18,gate_options:[25,50,75,100,'FREE'],configuration_cases:1350,sample_timing:'passed',release_stop_mode_change:'passed',storage:'v12 + legacy migration passed',lock:'3-second colour ramp passed'},null,2));
const native=fs.readFileSync('build/rhythm-native.f32');let sample=0,maxDifference=0;
const blacks=[1,3,5,8,10,13,15,17,20,22,25];
for(let mode=1;mode<=2;mode++){
 boot(mode);e.fw_encoder(0,40);let mask=0;
 for(let block=0;block<1600;block++){
  if(block%120===0)mask=1<<blacks[Math.floor(block/120)%11];if(block%120===90)mask=0;e.fw_keys(mask);
  if(block&&block%200===0){e.fw_encoder(3,1);e.fw_encoder(4,1);e.fw_encoder(5,-1);e.fw_encoder(6,1);}
  if(block===700){button(0);e.fw_encoder(6,1);button(6);}if(block===900)button(10);
  const a=new Float32Array(e.memory.buffer,e.fw_render(128),128);
  for(const x of a){maxDifference=Math.max(maxDifference,Math.abs(x-native.readFloatLE(sample++*4)));assert.ok(Number.isFinite(x));}
 }
}
assert.equal(maxDifference,0);assert.equal(sample*4,native.length);console.log({native_wasm_samples:sample,max_float_difference:maxDifference});
