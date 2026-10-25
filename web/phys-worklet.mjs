// Rendering and voice state live on the audio thread, not the UI thread.
class PhysProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.api = new WebAssembly.Instance(options.processorOptions.module, {}).exports;
    this.api._initialize(); this.api.gm_reset();
    this.samples = new Float32Array(this.api.memory.buffer, this.api.gm_render(128), 128);
    this.blocks = 0; this.rejected = 0;
    this.port.onmessage = ({ data }) => {
      if (data.type === 'note_on') {
        if (!this.api.gm_note_on(data.string, data.pitch, data.intensity, data.tone)) this.rejected++;
      } else if (data.type === 'silence') this.api.gm_reset();
    };
  }
  process(inputs, outputs) {
    const channels = outputs[0];
    if (!channels?.length) return true;
    // The context explicitly requests the model's 44.1 kHz reference rate.
    if (sampleRate !== 44100) {
      for (const channel of channels) channel.fill(0);
      return true;
    }
    const frames = channels[0].length;
    for (let offset = 0; offset < frames; offset += 128) {
      const count = Math.min(128, frames - offset);
      this.api.gm_render(count);
      for (const channel of channels) {
        if (count === 128 && offset === 0) channel.set(this.samples);
        else for (let i = 0; i < count; i++) channel[offset + i] = this.samples[i];
      }
    }
    if (++this.blocks % 70 === 0) this.port.postMessage({
      active: this.api.gm_active(), steals: this.api.gm_steals(),
      clips: this.api.gm_clips(), stateBytes: this.api.gm_state_bytes(),
      rejected: this.rejected, blocks: this.blocks,
    });
    return true;
  }
}
registerProcessor('guitomnichord-phys', PhysProcessor);
