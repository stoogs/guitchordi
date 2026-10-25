import test from 'node:test';
import assert from 'node:assert/strict';
import { TemporaryAudio, MAX_VOICES } from '../web/audio.mjs';
import { renderPluck, TONES } from '../web/pluck.mjs';
import { TestAudioContext, TestWorker } from './helpers/audio-context.mjs';
globalThis.AudioContext = TestAudioContext;
globalThis.Worker = TestWorker;
const attack = pitch => ({ type: 'note_on', pitch, intensity: 0.72 });

test('rapid attacks reuse prepared audio with no buffer/filter/gain allocations', async () => {
  const audio = new TemporaryAudio(); await audio.enable([40, 43, 67]);
  assert.equal(audio.ctx.options.latencyHint, 'interactive');
  assert.equal(audio.buffers.size, 9);
  const initialAllocations = { ...audio.ctx.allocations };
  for (let i = 0; i < 1000; i++) { audio.ctx.currentTime = i / 1000; audio.handle(attack([40,43,67][i % 3])); }
  assert.deepEqual(audio.ctx.allocations, initialAllocations);
  assert.equal(audio.voices.size, 14); assert.equal(MAX_VOICES, 14);
  assert.equal(audio.steals, 986);
  // Count every underlying sounding source, including stolen sources awaiting their scheduled stop.
  for (let ms = 0; ms < 1005; ms++) {
    const at = (ms + 0.5) / 1000;
    const sounding = audio.ctx.sources.filter(source => source.begin <= at && (source.end ?? Infinity) > at);
    assert.ok(sounding.length <= 14, `${sounding.length} sources at ${at}s`);
  }
});
test('late ended callback cannot remove a replacement; silence cancels all lanes', async () => {
  const audio = new TemporaryAudio(); await audio.enable([40]);
  for (let i = 0; i < 15; i++) audio.handle(attack(40));
  const first = audio.ctx.sources[0]; first.onended();
  assert.equal(audio.voices.size, 14);
  audio.silence(); assert.equal(audio.voices.size, 0);
  assert.ok(audio.lanes.every(lane => lane.source === null && lane.gain.gain.value === 0));
  audio.ctx.sources[14].onended(); assert.equal(audio.voices.size, 0);
  audio.handle(attack(40)); assert.equal(audio.voices.size, 1);
});
test('release, mute and unprepared pitches create no sources or deferred attacks', async () => {
  const audio = new TemporaryAudio(); audio.handle(attack(40)); assert.equal(audio.attacks, 0);
  await audio.enable([40]);
  audio.handle({ ...attack(40), type: 'note_off' });
  audio.handle({ ...attack(null), type: 'muted' }); audio.handle(attack(41));
  assert.equal(audio.ctx.sources.length, 0);
});
test('all tone families produce finite non-silent samples with tapered endpoints', () => {
  for (const tone of TONES) for (const pitch of [40, 55, 67]) {
    let seed = 1;
    const samples = renderPluck(pitch, tone, () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; });
    assert.equal(Math.abs(samples[0]), 0);
    let energy = 0, peak = 0;
    for (const value of samples) { assert.ok(Number.isFinite(value)); energy += value * value; peak = Math.max(peak, Math.abs(value)); }
    assert.ok(energy > 1 && peak < 1.1, `${tone} ${pitch}: energy ${energy}, peak ${peak}`);
    assert.ok(Math.abs(samples.at(-1)) < 0.001);
  }
});
