// Scheduling model for voice-budget tests; not an audio-quality/browser latency substitute.
class Param {
  constructor() { this.value = 0; this.events = []; }
  setValueAtTime(value, at) { this.value = value; this.events.push({ value, at }); }
  linearRampToValueAtTime(value, at) { this.setValueAtTime(value, at); }
  setTargetAtTime(value, at) { this.setValueAtTime(value, at); }
  cancelScheduledValues() {}
  cancelAndHoldAtTime() {}
}
class Node {
  constructor() { this.gain = new Param(); this.frequency = new Param(); }
  connect() { return this; }
  disconnect() { this.disconnected = true; }
}
export class TestAudioContext {
  constructor(options) {
    this.options = options; this.currentTime = 0; this.sampleRate = 48000; this.state = 'running';
    this.destination = new Node(); this.sources = []; this.allocations = { buffer: 0, gain: 0, filter: 0 };
  }
  resume() { return Promise.resolve(); }
  createGain() { this.allocations.gain++; return new Node(); }
  createBiquadFilter() { this.allocations.filter++; return new Node(); }
  createDynamicsCompressor() { return new Node(); }
  createConvolver() { return new Node(); }
  createBuffer(channels, length, sampleRate) {
    this.allocations.buffer++;
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { duration: length / sampleRate, getChannelData: channel => data[channel], copyToChannel: (samples, channel) => data[channel].set(samples) };
  }
  createBufferSource() {
    const source = new Node();
    source.start = at => { source.begin = at; };
    source.stop = (at = this.currentTime) => { source.end = at; };
    this.sources.push(source); return source;
  }
}
export class TestWorker {
  postMessage(pitches) {
    queueMicrotask(() => {
      for (const tone of ['wood', 'wire', 'glow']) for (const pitch of pitches) {
        this.onmessage({ data: { tone, pitch, samples: new Float32Array(240), sampleRate: 24000 } });
      }
      this.onmessage({ data: { done: true } });
    });
  }
  terminate() {}
}
