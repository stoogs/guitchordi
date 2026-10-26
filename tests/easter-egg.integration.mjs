import fs from 'node:fs';
import assert from 'node:assert/strict';
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
function render(frames,held=false){while(frames>0){const n=Math.min(frames,128);if(held)e.fw_button(10,1);e.fw_render(n);frames-=n;}}
e.fw_boot();e.fw_button(10,1);render(5*44100-1,true);assert.equal(e.fw_easter_egg(),0);assert.equal(e.fw_attacks(),0);
render(1,true);assert.equal(e.fw_easter_egg(),1);render(6*44100,true);assert.ok(e.fw_attacks()>90);
e.fw_button(10,0);e.fw_button(10,1);assert.equal(e.fw_easter_egg(),0);assert.equal(e.gm_active(),0);render(6*44100,true);assert.equal(e.fw_easter_egg(),0);
e.fw_button(10,0);e.fw_button(10,1);render(5*44100,true);assert.equal(e.fw_easter_egg(),1);e.fw_button(10,0);
e.fw_master(0);render(128);assert.ok(new Float32Array(e.memory.buffer,e.fw_render(128),128).every(x=>x===0));
e.fw_boot();e.fw_button(10,1);render(5*44100,true);e.fw_button(10,0);
const native=fs.readFileSync('build/easter-egg-native.f32');let peak=0;
for(let block=0;block<5000;block++){
 const p=new Float32Array(e.memory.buffer,e.fw_render(128),128);
 for(let i=0;i<128;i++){
  assert.ok(Number.isFinite(p[i]) && Math.abs(p[i])<=.98);
  assert.equal(p[i],native.readFloatLE((block*128+i)*4));peak=Math.max(peak,Math.abs(p[i]));
 }
}
assert.ok(peak>.001 && e.gm_active()<=14);e.fw_panic();assert.equal(e.fw_easter_egg(),0);
console.log('Easter egg WASM: hold/stop/mute passed; 640,000 samples match native exactly; voice cap retained');
