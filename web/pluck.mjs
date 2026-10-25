// Original placeholder synthesis, rendered once per pitch/tone off the input thread.
export const BUFFER_RATE = 24000;
export const TONES = ['wood', 'wire', 'glow'];
export function renderPluck(pitch, tone, random = Math.random) {
  const frequency = 440 * 2 ** ((pitch - 69) / 12);
  const period = Math.max(2, Math.round(BUFFER_RATE / frequency));
  const length = Math.floor(BUFFER_RATE * (tone === 'glow' ? 2.4 : 1.8));
  const data = new Float32Array(length), line = new Float32Array(period);
  // Stronger damping deliberately trades long, rich tails for a drier response.
  const damping = (tone === 'wire' ? 0.996 : tone === 'wood' ? 0.989 : 0.998) ** 2;
  for (let i = 0; i < period; i++) line[i] = random() * 2 - 1;
  let previous = 0;
  for (let i = 0; i < length; i++) {
    const index = i % period, value = line[index];
    // Tiny onset ramp and natural end taper avoid discontinuities.
    data[i] = value * (1 - i / length) * Math.min(1, i / 12);
    line[index] = (value + previous) * 0.5 * damping;
    if (tone === 'glow') line[index] += Math.sin(i * 2 * Math.PI * frequency / BUFFER_RATE) * 0.0007;
    previous = value;
  }
  return data;
}
