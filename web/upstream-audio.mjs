export class UpstreamAudio {
  constructor() {
    this.label = 'UPSTREAM DSP · Clipper PHYS string';
    this.ready = false; this.maxVoices = 14; this.voices = new Set(); this.buffers = new Map();
    this.steals = 0; this.attacks = 0; this.tone = 'wood'; this.volume = 0.6; this.resonance = 0.12;
    this.stats = { active: 0, clips: 0, stateBytes: 0, rejected: 0, blocks: 0 };
  }
  get activeVoices() { return this.stats.active; }
  async enable() {
    if (!this.ctx) this.ctx = new AudioContext({ latencyHint: 'interactive', sampleRate: 44100 });
    await this.ctx.resume();
    if (this.ctx.sampleRate !== 44100) throw new Error('PHYS requires a 44.1 kHz audio context');
    if (this.ready) return;
    if (!this.preparing) this.preparing = this.prepare();
    await this.preparing;
  }
  async prepare() {
    const response = await fetch('./dsp/phys.wasm');
    if (!response.ok) throw new Error(`PHYS WASM unavailable (${response.status}); choose TEMP WEB AUDIO`);
    const module = await WebAssembly.compile(await response.arrayBuffer());
    await this.ctx.audioWorklet.addModule(new URL('./phys-worklet.mjs', import.meta.url));
    this.node = new AudioWorkletNode(this.ctx, 'guitomnichord-phys', {
      numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { module },
    });
    this.node.port.onmessage = ({ data }) => { this.stats = data; this.steals = data.steals; };
    this.node.onprocessorerror = () => { this.ready = false; this.error = 'Audio processor stopped; reload or select TEMP WEB AUDIO'; };
    this.master = this.ctx.createGain(); this.master.gain.value = this.volume * 0.8;
    const limiter = this.ctx.createDynamicsCompressor();
    this.meter = this.ctx.createAnalyser(); this.meter.fftSize = 256;
    this.meterSamples = new Float32Array(256);
    this.master.connect(limiter).connect(this.meter).connect(this.ctx.destination);
    this.node.connect(this.master);
    this.wet = this.ctx.createGain(); this.wet.gain.value = this.resonance * 0.35;
    this.wet.connect(this.master);
    this.reverb = this.ctx.createConvolver();
    const length = Math.floor(this.ctx.sampleRate * 0.45);
    const impulse = this.ctx.createBuffer(1, length, this.ctx.sampleRate), samples = impulse.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    this.reverb.buffer = impulse; this.node.connect(this.reverb); this.reverb.connect(this.wet);
    this.ready = true;
  }
  handle(event) {
    if (event.type !== 'note_on' || !this.ready || this.ctx?.state !== 'running') return;
    this.node.port.postMessage({ type: 'note_on', string: event.string, pitch: event.pitch,
      intensity: event.intensity, tone: ['wood', 'wire', 'glow'].indexOf(this.tone) });
    this.attacks++;
  }
  setVolume(value) { this.volume = value; if (this.master) this.master.gain.setTargetAtTime(value * 0.8, this.ctx.currentTime, 0.01); }
  setResonance(value) { this.resonance = value; if (this.wet) this.wet.gain.setTargetAtTime(value * 0.35, this.ctx.currentTime, 0.01); }
  silence() {
    this.node?.port.postMessage({ type: 'silence' }); this.stats.active = 0;
    if (this.reverb) { const impulse = this.reverb.buffer; this.reverb.buffer = null; this.reverb.buffer = impulse; }
  }
}
