// Repeatable audition reel and signal checks. Run after test:instruments.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const patches=JSON.parse(fs.readFileSync('web/instruments.json')).instruments;
const e=new WebAssembly.Instance(await WebAssembly.compile(fs.readFileSync('build/simulator.wasm')),{}).exports;e._initialize();
const rate=44100,dir='build/audio-review';fs.mkdirSync(dir,{recursive:true});
function render(tone,level,single=false){
  e.fw_boot();e.fw_set_tone(tone);e.fw_encoder(3,level-50);
  const audio=new Float32Array(rate*4),keys=[11,12,14,16,18,19];let next=0,peak=0,energy=0;
  for(let offset=0;offset<audio.length;offset+=128){
    if(single){if(!offset){e.fw_keys(1<<keys[0]);e.fw_keys(0);}}
    else while(next<6 && offset>=next*rate*.065){e.fw_keys(1<<keys[next++]);e.fw_keys(0);}
    const count=Math.min(128,audio.length-offset),s=new Float32Array(e.memory.buffer,e.fw_render(count),count);audio.set(s,offset);
    for(const x of s){assert.ok(Number.isFinite(x)&&Math.abs(x)<=.980001);peak=Math.max(peak,Math.abs(x));energy+=x*x;}
  }
  assert.equal(e.gm_active(),0);assert.ok(peak>.0001);
  return {audio,peak,rms:Math.sqrt(energy/audio.length),clips:e.gm_clips()};
}
function wav(path,parts){const count=parts.reduce((n,p)=>n+p.length,0),b=Buffer.alloc(44+count*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);let i=44;for(const p of parts)for(const x of p){b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),i);i+=2;}fs.writeFileSync(path,b);}
const report=[],reel=[];
for(let tone=0;tone<16;tone++){
  const sweeps=[0,25,50,75,100].map(level=>({level,...render(tone,level)}));
  assert.ok(sweeps[0].rms<sweeps[2].rms*.7,`${patches[tone].name}: soft end must be softer`);
  assert.ok(sweeps.every(s=>s.clips===0),`${patches[tone].name}: six-note sweep clips`);
  if(tone===11 || tone===12) {
    assert.ok(Math.abs(sweeps[4].rms/sweeps[2].rms-1.15)<.00001,'clean upper range gain');
    for(let i=0;i<sweeps[2].audio.length;i++)assert.ok(Math.abs(sweeps[4].audio[i]-sweeps[2].audio[i]*1.15)<.000001,'clean upper range must preserve waveform');
  }
  const normal=sweeps[2];reel.push(normal.audio);wav(`${dir}/${patches[tone].id}.wav`,[normal.audio]);
  report.push({instrument:patches[tone].name,startSeconds:tone*4,sweeps:sweeps.map(({audio,...r})=>r)});
}
const bow=render(12,50,true).audio,start=rate*.4;let xy=0,xx=0,yy=0;
// Actual pitch for normal key 7 (G-bank low part mapped to D4): fw_key_pitch owns register.
e.fw_boot();e.fw_set_tone(12);const pitch=e.fw_key_pitch(6),period=Math.round(rate/(440*2**((pitch-69)/12)));
for(let i=0;i<4096;i++){const x=bow[Math.floor(start)+i],y=bow[Math.floor(start)+i+period];xy+=x*y;xx+=x*x;yy+=y*y;}
const periodicity=xy/Math.sqrt(xx*yy);assert.ok(periodicity>.98,`bow pitch periodicity ${periodicity}`);
wav(`${dir}/all-16-instruments.wav`,reel);
wav(`${dir}/steel-intensity-0-25-50-75-100.wav`,[0,25,50,75,100].map(level=>render(4,level).audio));
fs.writeFileSync(`${dir}/measurements.json`,JSON.stringify({bow_periodicity:periodicity,report},null,2)+'\n');
console.log(JSON.stringify({instruments:16,intensity_levels:5,all_six_note_sweeps_unclipped:true,bow_periodicity:periodicity,reel:`${dir}/all-16-instruments.wav`},null,2));
