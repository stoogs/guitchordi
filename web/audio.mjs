// Original temporary Web Audio backend; no upstream DSP code.
export const MAX_VOICES = 14;
const STEAL_FADE = 0.003;
export class TemporaryAudio {
  constructor() {
    this.voices = new Set(); this.lanes = []; this.buffers = new Map();
    this.tone = 'wood'; this.volume = 0.6; this.resonance = 0.12;
    this.maxVoices = MAX_VOICES; this.steals = 0; this.attacks = 0; this.ready = false;
  }
  prepare(pitches) {
    if (this.preparing) return this.preparing;
    this.preparing = new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./buffer-worker.mjs', import.meta.url), { type: 'module' });
      const fail = error => { worker.terminate(); reject(new Error(error)); };
      worker.onerror = event => fail(event.message || 'Audio buffer worker failed');
      worker.onmessage = ({ data }) => {
        if (data.error) return fail(data.error);
        if (data.done) { worker.terminate(); this.ready = true; resolve(); return; }
        const buffer = this.ctx.createBuffer(1, data.samples.length, data.sampleRate);
        buffer.copyToChannel(data.samples, 0);
        this.buffers.set(`${data.tone}:${data.pitch}`, buffer);
      };
      worker.postMessage([...new Set(pitches.filter(pitch => pitch !== null))]);
    });
    return this.preparing;
  }
  async enable(pitches) {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume * 0.38;
      const limiter = this.ctx.createDynamicsCompressor();
      this.master.connect(limiter).connect(this.ctx.destination);
      this.wet = this.ctx.createGain(); this.wet.gain.value = this.resonance * 0.35;
      this.wet.connect(this.master);
      this.reverb = this.ctx.createConvolver();
      // Shorter mono shared room, intentionally cheaper than the original stereo 1.3s tail.
      const length = Math.floor(this.ctx.sampleRate * 0.45);
      const impulse = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = impulse.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
      this.reverb.buffer = impulse; this.reverb.connect(this.wet);
      // Fixed effect nodes: attacks only allocate a small one-shot source.
      this.lanes = Array.from({ length: MAX_VOICES }, () => {
        const gain = this.ctx.createGain(), filter = this.ctx.createBiquadFilter();
        gain.gain.value = 0; filter.type = 'lowpass'; filter.connect(gain);
        gain.connect(this.master); gain.connect(this.reverb);
        return { gain, filter, source: null, started: -Infinity };
      });
    }
    await this.ctx.resume();
    await this.prepare(pitches);
  }
  // Releases leave natural decay. Cached samples eliminate full-buffer synthesis on attacks.
  handle(event) {
    if (event.type !== 'note_on' || !this.ready || this.ctx?.state !== 'running') return;
    const buffer = this.buffers.get(`${this.tone}:${event.pitch}`);
    if (!buffer) return; // No late/surprise attacks; all configured voicings are warmed before Ready.
    const ctx = this.ctx, now = ctx.currentTime;
    const lane = this.lanes.find(lane => !lane.source) ?? this.lanes.reduce((a, b) => a.started <= b.started ? a : b);
    let start = now;
    const param = lane.gain.gain;
    if (lane.source) {
      // Each lane stops its old source before its replacement starts: never >14 sounding strings.
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
      else { const value = param.value; param.cancelScheduledValues(now); param.setValueAtTime(value, now); }
      start += STEAL_FADE;
      param.linearRampToValueAtTime(0, start);
      lane.source.stop(start); this.steals++;
    } else param.cancelScheduledValues(now);
    const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(lane.filter);
    lane.filter.frequency.setValueAtTime((this.tone === 'wood' ? 3400 : this.tone === 'wire' ? 10000 : 7600) * (0.3 + 0.7 * event.intensity), start);
    param.setValueAtTime(0, start);
    param.linearRampToValueAtTime(event.intensity * 0.46, start + 0.0005);
    lane.source = source; lane.started = start; this.voices.add(lane); this.attacks++;
    source.onended = () => {
      source.disconnect();
      if (lane.source === source) { lane.source = null; this.voices.delete(lane); }
    };
    source.start(start);
  }
  setVolume(value) { this.volume = value; if (this.master) this.master.gain.setTargetAtTime(value * 0.38, this.ctx.currentTime, 0.01); }
  setResonance(value) { this.resonance = value; if (this.wet) this.wet.gain.setTargetAtTime(value * 0.35, this.ctx.currentTime, 0.01); }
  silence() {
    for (const lane of this.voices) {
      lane.source.stop(); lane.source = null;
      lane.gain.gain.cancelScheduledValues(this.ctx.currentTime);
      lane.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.voices.clear();
    if (this.reverb) { const impulse = this.reverb.buffer; this.reverb.buffer = null; this.reverb.buffer = impulse; }
  }
}
