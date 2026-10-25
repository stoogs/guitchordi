export const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
export const KEYS = Object.freeze(Array.from({ length: 16 }, (_, key) => Object.freeze({
  key, string: key < 12 ? key % 6 : key - 10,
  zone: key < 6 ? 'soft' : key < 12 ? 'normal' : 'accent',
  strength: key < 6 ? 0.36 : key < 12 ? 0.72 : 1,
})));
export const LOCK_HOLD_MS = 5000;

export function validateBank(bank) {
  if (bank.schemaVersion !== 1 || !Array.isArray(bank.slots) || bank.slots.length !== 11 ||
      JSON.stringify(bank.stringOrder) !== JSON.stringify(STRING_LABELS)) throw new Error('Invalid chord bank header');
  for (const name of bank.slots) {
    const notes = bank.voicings?.[name];
    if (!Array.isArray(notes) || notes.length !== 6 || notes.some(n => n !== null &&
      (!Number.isInteger(n) || n < 0 || n > 127))) throw new Error(`Invalid six-string voicing: ${name}`);
  }
  return bank;
}

// Pure input model: timestamps and output sink are supplied by the platform adapter.
export class Instrument {
  constructor(bank, emit = () => {}) {
    this.bank = structuredClone(validateBank(bank));
    this.emit = emit;
    this.selected = 1;
    this.locked = false;
    this.lockStart = null;
    this.contacts = new Map();
    this.held = new Map();
  }
  get chord() { return this.bank.slots[this.selected]; }
  get notes() { return this.bank.voicings[this.chord]; }
  select(slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot >= 11) throw new Error('Invalid slot');
    if (!this.locked) this.selected = slot;
  }
  assign(slot, chord) {
    if (this.locked) return;
    const candidate = structuredClone(this.bank);
    candidate.slots[slot] = chord;
    this.bank = validateBank(candidate);
  }
  beginLock(now) { if (this.lockStart === null) this.lockStart = now; }
  cancelLock() { this.lockStart = null; }
  tick(now) {
    if (this.lockStart !== null && now - this.lockStart >= LOCK_HOLD_MS) {
      this.locked = !this.locked;
      this.cancelLock();
      return true;
    }
    return false;
  }
  contact(id, key, now, velocity = 1) {
    if (key !== null && (!Number.isInteger(key) || !KEYS[key])) throw new Error('Invalid key');
    if (this.contacts.get(id) === key) return;
    this.release(id, now);
    if (key === null) return;
    this.contacts.set(id, key);
    // Two fingers on one physical key are one activation until both leave.
    if ([...this.contacts.entries()].some(([other, value]) => other !== id && value === key)) return;
    const mapped = KEYS[key];
    const event = { key, string: mapped.string, zone: mapped.zone, chord: this.chord,
      pitch: this.notes[mapped.string], intensity: mapped.strength * Math.max(0, Math.min(1, velocity)),
      timestamp: now, type: this.notes[mapped.string] === null ? 'muted' : 'note_on' };
    this.held.set(key, event);
    this.emit(event);
  }
  release(id, now) {
    const key = this.contacts.get(id);
    this.contacts.delete(id);
    if (key === undefined || [...this.contacts.values()].includes(key)) return;
    const event = this.held.get(key);
    this.held.delete(key);
    if (event?.type === 'note_on') this.emit({ ...event, type: 'note_off', timestamp: now });
  }
  releaseAll(now) {
    for (const id of [...this.contacts.keys()]) this.release(id, now);
    this.cancelLock();
  }
}
