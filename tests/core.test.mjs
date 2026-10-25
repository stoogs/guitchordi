import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Instrument, KEYS, validateBank } from '../web/core.mjs';
const bank = JSON.parse(readFileSync(new URL('../web/chords.json', import.meta.url)));
function setup() { const events = []; const model = new Instrument(bank, event => events.push(event)); return { model, events }; }

test('all 16 keys map exactly to 6 soft + 6 normal + 4 treble strings', () => {
  assert.deepEqual(KEYS.map(key => key.string), [0,1,2,3,4,5,0,1,2,3,4,5,2,3,4,5]);
  assert.deepEqual(KEYS.map(key => key.zone), [...Array(6).fill('soft'), ...Array(6).fill('normal'), ...Array(4).fill('accent')]);
  const { model, events } = setup();
  for (let key = 0; key < 16; key++) { model.contact('finger', key, key); model.release('finger', key + 0.5); }
  assert.equal(events.filter(event => event.type === 'note_on').length, 16);
  assert.equal(events.filter(event => event.type === 'note_off').length, 16);
  for (const event of events) assert.equal(event.pitch, bank.voicings.G[KEYS[event.key].string]);
});
test('both sweep directions and skipped keys create only explicit attacks', () => {
  const { model, events } = setup();
  for (const key of [0,2,5,4,1,0]) model.contact('finger', key, key);
  assert.deepEqual(events.filter(event => event.type === 'note_on').map(event => event.key), [0,2,5,4,1,0]);
});
test('staying on a key does not repeat; leaving and re-entering retriggers', () => {
  const { model, events } = setup();
  model.contact('finger', 0, 0); model.contact('finger', 0, 1);
  model.contact('finger', null, 2); model.contact('finger', 0, 3);
  assert.deepEqual(events.map(event => event.type), ['note_on','note_off','note_on']);
});
test('muted strings never emit note_on or note_off', () => {
  const { model, events } = setup(); model.select(2);
  for (const key of [0,1,6,7]) { model.contact('finger', key, key); model.release('finger', key + 1); }
  assert.equal(events.length, 4); assert.ok(events.every(event => event.type === 'muted'));
});
test('chord change does not attack or retune ringing notes; release retains original pitch', () => {
  const { model, events } = setup();
  model.contact('finger', 0, 0); model.select(4);
  assert.equal(events.length, 1); model.release('finger', 2);
  assert.equal(events[1].pitch, 43);
  model.contact('finger', 0, 3); assert.equal(events[2].pitch, 40);
});
test('lock requires five continuous seconds, toggles once, blocks selection and edits', () => {
  const { model } = setup();
  model.beginLock(0); assert.equal(model.tick(4999), false);
  model.cancelLock(); model.beginLock(6000); model.tick(10999); assert.equal(model.locked, false);
  assert.equal(model.tick(11000), true); assert.equal(model.locked, true);
  model.tick(20000); model.select(0); model.assign(1, 'D'); assert.equal(model.chord, 'G');
  model.beginLock(21000); model.tick(26000); assert.equal(model.locked, false);
});
test('releaseAll handles simultaneous input, cancellation and overlapping contacts', () => {
  const { model, events } = setup();
  model.contact('one', 0, 0); model.contact('two', 0, 1); model.release('one', 2);
  assert.equal(events.length, 1); model.contact('three', 5, 3);
  model.beginLock(4); model.releaseAll(5);
  assert.equal(model.held.size, 0); assert.equal(model.contacts.size, 0); assert.equal(model.lockStart, null);
  assert.equal(events.filter(event => event.type === 'note_off').length, 2);
});
test('rapid retriggers and intensity layers remain deterministic', () => {
  const { model, events } = setup();
  for (let i = 0; i < 100; i++) { model.contact('finger', 2, i, 0.5); model.release('finger', i + 0.1); }
  assert.equal(events.filter(event => event.type === 'note_on').length, 100);
  assert.equal(events[0].intensity, 0.18);
  model.contact('finger', 8, 101, 0.5); assert.equal(events.at(-1).intensity, 0.36);
  model.contact('finger', 12, 102, 0.5); assert.equal(events.at(-1).intensity, 0.5);
});
test('bank schema rejects incomplete voicings and allows runtime slot reassignment', () => {
  const invalid = structuredClone(bank); invalid.voicings.C = [60];
  assert.throws(() => validateBank(invalid));
  const { model } = setup(); model.assign(1, 'Am'); assert.equal(model.chord, 'Am');
  assert.equal(bank.slots[1], 'G'); assert.throws(() => model.contact('finger', 16, 0));
});
