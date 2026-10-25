import { Instrument, KEYS, STRING_LABELS } from './core.mjs';
import { TemporaryAudio } from './audio.mjs';
import { UpstreamAudio } from './upstream-audio.mjs';

const $ = id => document.getElementById(id);
let audio = new UpstreamAudio();
const backends = { upstream: audio };
let lastEvent = null, eventCount = 0, lastDispatchMs = 0, peakDispatchMs = 0, framePending = false;
const noteName = note => note === null ? '×' : ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][note % 12] + (Math.floor(note / 12) - 1);
const bank = await fetch('./chords.json').then(response => {
  if (!response.ok) throw new Error('Cannot load chord bank');
  return response.json();
});
const instrument = new Instrument(bank, event => {
  const start = performance.now();
  audio.handle(event);
  if (event.type === 'note_on') {
    lastDispatchMs = performance.now() - start;
    peakDispatchMs = Math.max(peakDispatchMs, lastDispatchMs);
  }
  lastEvent = event; eventCount++;
  render();
});
const stringButtons = KEYS.map(mapped => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = `string ${mapped.zone}`; button.dataset.key = mapped.key;
  button.innerHTML = `<span>${STRING_LABELS[mapped.string]}</span><small>${mapped.key + 1}</small>`;
  button.setAttribute('aria-label', `${mapped.zone} string ${STRING_LABELS[mapped.string]}, key ${mapped.key + 1}`);
  // Native keyboard activation for focused buttons (physical keyboard uses the adapter below).
  button.onclick = event => { if (event.detail === 0) { contact(`accessible-${mapped.key}`, mapped.key); instrument.release(`accessible-${mapped.key}`, performance.now()); render(); } };
  $('strings').append(button); return button;
});
const chordButtons = bank.slots.map((name, slot) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'chord';
  button.onclick = () => { instrument.select(slot); render(); };
  $('chords').append(button);
  const label = document.createElement('label'); label.textContent = `Slot ${slot + 1}`;
  const select = document.createElement('select');
  for (const chord of Object.keys(bank.voicings)) select.add(new Option(chord, chord));
  select.value = name;
  select.onchange = () => { instrument.assign(slot, select.value); render(); };
  label.append(select); $('slots').append(label);
  return button;
});
async function enable() {
  try {
    audio.tone = $('tone').value;
    audio.setVolume(Number($('master').value) / 100);
    audio.setResonance(Number($('res').value) / 100);
    $('status').textContent = 'Preparing audio…';
    await audio.enable(Object.values(bank.voicings).flat());
    $('status').textContent = `Ready · 14 voices · ${audio.label ?? 'TEMP WEB AUDIO'}`;
  }
  catch (error) { $('status').textContent = `Audio failed: ${error.message}`; }
}
$('enable').onclick = enable;
$('engine').onchange = async event => {
  const select = event.target;
  select.disabled = true;
  try {
    resetInputs(); audio.silence();
    if (audio.ctx) await audio.ctx.suspend();
    audio = backends[select.value] ??= new TemporaryAudio();
    audio.tone = $('tone').value;
    audio.setVolume(Number($('master').value) / 100);
    audio.setResonance(Number($('res').value) / 100);
    await enable();
  } finally { select.disabled = false; }
};
function contact(id, key) {
  // Start/resume from the actual user gesture. First attack may await audio unlock.
  if (!audio.ready || audio.ctx?.state !== 'running') { enable(); return; }
  instrument.contact(id, key, performance.now(), Number($('velocity').value) / 100);
  render();
}
const pointers = new Set();
const keyAt = event => {
  const element = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-key]');
  return element && $('strings').contains(element) ? Number(element.dataset.key) : null;
};
$('strings').onpointerdown = event => {
  if (event.button !== 0) return;
  event.preventDefault();
  if (isEditing(document.activeElement)) document.activeElement.blur();
  pointers.add(event.pointerId);
  $('strings').setPointerCapture(event.pointerId);
  contact(`pointer-${event.pointerId}`, keyAt(event));
};
$('strings').onpointermove = event => {
  if (pointers.has(event.pointerId)) contact(`pointer-${event.pointerId}`, keyAt(event));
};
function releasePointer(event) {
  pointers.delete(event.pointerId); instrument.release(`pointer-${event.pointerId}`, performance.now()); render();
}
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) $('strings').addEventListener(event, releasePointer);
const stringCodes = ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','KeyZ','KeyX','KeyC','KeyV','KeyB'];
const chordCodes = ['KeyQ','KeyW','KeyE','KeyR','KeyT','KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft'];
const isEditing = target => target.matches('input, select, textarea, [contenteditable=true]');
window.onkeydown = event => {
  if (isEditing(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.code === 'Space' && event.target.tagName === 'BUTTON') return;
  const key = stringCodes.indexOf(event.code), chord = chordCodes.indexOf(event.code);
  if (key < 0 && chord < 0 && event.code !== 'Space') return;
  event.preventDefault(); if (event.repeat) return;
  if (key >= 0) contact(`keyboard-${event.code}`, key);
  else if (chord >= 0) instrument.select(chord);
  else instrument.beginLock(performance.now());
  render();
};
window.onkeyup = event => {
  instrument.release(`keyboard-${event.code}`, performance.now());
  if (event.code === 'Space') instrument.cancelLock();
  render();
};
function resetInputs() { pointers.clear(); instrument.releaseAll(performance.now()); render(); }
window.addEventListener('blur', resetInputs);
document.addEventListener('visibilitychange', () => { if (document.hidden) resetInputs(); });
$('lock').onpointerdown = event => {
  if (event.button !== 0) return;
  event.preventDefault(); $('lock').setPointerCapture(event.pointerId); instrument.beginLock(performance.now());
};
for (const event of ['pointerup','pointercancel','lostpointercapture']) $('lock').addEventListener(event, () => { instrument.cancelLock(); render(); });
$('lock').onkeydown = event => {
  if (['Space','Enter'].includes(event.code)) { event.preventDefault(); if (!event.repeat) instrument.beginLock(performance.now()); }
};
$('lock').onkeyup = () => { instrument.cancelLock(); render(); };
$('lock').onblur = () => { instrument.cancelLock(); render(); };
$('tone').onchange = event => { audio.tone = event.target.value; };
for (const [id, setter] of [['master', value => audio.setVolume(value)], ['res', value => audio.setResonance(value)], ['velocity', () => {}]]) {
  $(id).oninput = event => { const value = Number(event.target.value); $({master:'masternum',res:'resnum',velocity:'velocitynum'}[id]).textContent = `${value}%`; setter(value / 100); };
}
$('stop').onclick = () => { resetInputs(); audio.silence(); };
// Batch UI changes once per animation frame; diagnostics never block an attack.
function render() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => { framePending = false; draw(); });
}
function text(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
function draw() {
  chordButtons.forEach((button, slot) => {
    if (button.textContent !== instrument.bank.slots[slot]) button.textContent = instrument.bank.slots[slot];
    button.disabled = instrument.locked;
    button.setAttribute('aria-pressed', slot === instrument.selected);
  });
  document.querySelectorAll('#slots select').forEach(select => { select.disabled = instrument.locked; });
  const pressed = new Set(instrument.contacts.values());
  stringButtons.forEach((button, key) => button.classList.toggle('hit', pressed.has(key)));
  text('voicing', `${instrument.chord} · ${instrument.notes.map((note, string) => `${STRING_LABELS[string]}:${noteName(note)}`).join(' | ')}`);
  text('lockstatus', instrument.locked ? `Locked to ${instrument.chord}` : 'Unlocked');
  $('lock').classList.toggle('active', instrument.locked);
  text('lock', instrument.lockStart === null ? 'Hold 5 seconds to toggle chord lock' : `Keep holding… ${Math.max(0, 5 - (performance.now() - instrument.lockStart) / 1000).toFixed(1)}s`);
}
function diagnostics() {
  let signal = '';
  if (audio.meter) {
    audio.meter.getFloatTimeDomainData(audio.meterSamples);
    let peak = 0;
    for (const sample of audio.meterSamples) peak = Math.max(peak, Math.abs(sample));
    signal = ` · output peak ${peak.toFixed(4)}`;
  }
  if (audio.error) text('status', audio.error);
  $('diagnostics').textContent = `Engine: ${audio.label ?? 'TEMP WEB AUDIO'} · ${audio.ctx?.state ?? 'not started'}\nEvents: ${eventCount} · active audio voices: ${audio.activeVoices ?? audio.voices.size}/${audio.maxVoices} · held keys: ${instrument.held.size}\nAttack scheduling: ${lastDispatchMs.toFixed(3)} ms · session peak ${peakDispatchMs.toFixed(3)} ms (excludes device/output latency)\nVoice steals: ${audio.steals} · attacks: ${audio.attacks} · cached sounds: ${audio.buffers.size}\n${audio.stats ? `DSP: ${audio.stats.stateBytes} bytes state · ${audio.stats.clips} limited samples · ${audio.stats.rejected} rejected events · ${audio.stats.blocks} blocks${signal}` : 'Cached original JS plucks'}\nVelocity: simulated slider × zone; no hardware measurement\nLast event: ${lastEvent ? JSON.stringify(lastEvent) : 'none'}`;
}
setInterval(() => {
  if (instrument.tick(performance.now()) || instrument.lockStart !== null) render();
  diagnostics();
}, 200);
render();
