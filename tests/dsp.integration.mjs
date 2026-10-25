import assert from 'node:assert/strict';
import fs from 'node:fs';
const bytes = fs.readFileSync('build/phys.wasm');
const module = await WebAssembly.compile(bytes);
assert.deepEqual(WebAssembly.Module.imports(module), [], 'standalone engine must need no host imports');
const api = new WebAssembly.Instance(module, {}).exports;
api._initialize();
const memoryBytes = api.memory.buffer.byteLength;
const pitches = [43,47,50,55,59,67];
const parity = [];
for (let tone = 0; tone < 3; tone++) {
  api.gm_reset();
  const wav = fs.readFileSync(`build/audio/phys-strum-${tone}.wav`);
  let next = 0, maxDifference = 0, squareError = 0;
  const frames = 44100 * 6;
  for (let position = 0; position < frames;) {
    while (next < 6 && position >= next * Math.floor(44100 * 45 / 1000)) {
      assert.equal(api.gm_note_on(next, pitches[next], 0.72, tone), 1); next++;
    }
    const count = Math.min(128, frames - position);
    const samples = new Float32Array(api.memory.buffer, api.gm_render(count), count);
    for (let i = 0; i < count; i++) {
      assert.ok(Number.isFinite(samples[i]));
      // Native renderer multiplies in float32 then truncates to PCM16.
      const pcm = Math.trunc(Math.fround(samples[i] * 32767));
      const error = pcm - wav.readInt16LE(44 + (position + i) * 2);
      maxDifference = Math.max(maxDifference, Math.abs(error)); squareError += error * error;
    }
    position += count;
  }
  assert.ok(maxDifference <= 1, `tone ${tone}: native/WASM difference ${maxDifference} PCM units`);
  assert.equal(api.gm_clips(), 0);
  parity.push({ tone, max_pcm_difference: maxDifference, rms_pcm_difference: Math.sqrt(squareError / frames) });
}
api.gm_reset();
assert.equal(api.gm_note_on(-1, 40, 1, 0), 0);
assert.equal(api.gm_note_on(0, 40, NaN, 0), 0);
assert.equal(api.gm_note_on(0, 40, 1, 16), 0);
for (let i = 0; i < 1000; i++) {
  assert.equal(api.gm_note_on(i % 6, pitches[i % 6], 0.72, i % 3), 1);
  const samples = new Float32Array(api.memory.buffer, api.gm_render(128), 128);
  assert.ok(samples.every(Number.isFinite));
  assert.ok(api.gm_active() <= 14);
}
assert.ok(api.gm_steals() > 900);
assert.equal(api.memory.buffer.byteLength, memoryBytes, 'no heap growth under rapid retriggering');
api.gm_reset(); assert.equal(api.gm_active(), 0);
// A nearly-expired stolen voice must still play the new real attack.
for (let i = 0; i < 14; i++) api.gm_note_on(i % 6, pitches[i % 6], 1, 0);
for (let left = 79380 - 10; left > 0;) { const n = Math.min(128, left); api.gm_render(n); left -= n; }
api.gm_note_on(0, 43, 1, 0); api.gm_render(128);
assert.equal(api.gm_active(), 1);
const result = { wasm_bytes: bytes.length, wasm_memory_bytes: memoryBytes,
  voice_state_bytes: api.gm_state_bytes(), parity, rapid_attacks: 1000, voice_cap: 14 };
fs.writeFileSync('build/dsp-parity.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
