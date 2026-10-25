import { renderPluck, BUFFER_RATE, TONES } from './pluck.mjs';
self.onmessage = ({ data: pitches }) => {
  try {
    for (const tone of TONES) for (const pitch of pitches) {
      const samples = renderPluck(pitch, tone);
      self.postMessage({ tone, pitch, samples, sampleRate: BUFFER_RATE }, [samples.buffer]);
    }
    self.postMessage({ done: true });
  } catch (error) { self.postMessage({ error: error.message }); }
};
