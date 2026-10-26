# Nylon / Strum candidate — 26 October 2026

First use and confirmed factory reset now select Nylon Acoustic and Strum.
Classic Rock, standard EADGBE, 90 BPM, Down, 1/8, FREE, 50 ms sweep and 80%
rhythm velocity remain the starting combination. Saved user choices still restore;
boot never starts notes until a playing contact.

## Steel tail change

The Steel patch previously combined dispersion (structure 20000), brightness
53000 and damping 46000. Its B/C#m upper tones could leave a prominent higher
partial after the attack. Use the neutral structure region (16500), brightness
45500, damping 38000 and pluck position 16000. Duration and gain are unchanged;
there is no new per-sample filter, voice or buffer.

[Measured isolated tails](steel-tail-measurements.json) compare the previous
committed patch with the replacement at 80% attack, character 50. For MIDI
59/61/63/66/68/71, 1–2 second tail energy falls by 7.4/11.0/14.3/15.0/14.0/11.9 dB.
The previous B4 tail had 16.3% spectral energy above 2 kHz; the replacement has
less than 0.01%. This is signal evidence, not proof of subjective sound quality on
the FM-1 speaker. `tests/steel-tail-test.c` guards tail energy and first-difference
energy on the affected upper chord tones.

## Output level

Device signed-24-bit output ceiling increases from 524287 to 629144: 20% amplitude,
about +1.58 dB. It remains approximately -22.5 dBFS. Zero master, ADC error mute,
invalid float rejection, immediate turn-down and right-justified PCM are retained.
This is not a 20% perceived-loudness promise. The browser gain is unchanged.

## Hidden loop

The [official published score](https://www.musicnotes.com/sheetmusic/coldplay/yellow/MN0043564)
identifies B major and quarter-note = 88. The user's 173 BPM interpretation is
close to the double-time pulse. The loop now uses 173 eighth-note pulses/minute
(86.5 quarter-note BPM), an accented D-DU-UDU pattern, Nylon, and B/F#6/Emaj7/B
voicings sharing high D#. Those voicings and the pattern are an approximation;
this remains an instrumental chord-loop nod, without melody, lyrics or recording.
PLAY's five-second hold and one-press stop are unchanged. The loop leaves the
user's instrument, tempo and performance-mode settings untouched.

## Local evidence and limits

- Native + undefined-behavior sanitizer runs: simulator, 16 instruments, mixed
  retriggers, rhythm and hidden transport passed.
- Native/WASM exact audio parity: simulator, rhythm, all 16 instruments and
  640,000 loop samples passed. All 1,080 rhythm configurations passed.
- Six-note sweeps at five intensity settings across all 16 instruments remained
  unclipped. The Steel tail regression and 17 unit tests passed.
- Factory Strum tap completes six notes; reset confirmation, SAVE migration,
  velocity zones, independent tunings and 14-voice bounds passed.
- Signed PCM receiver, 5% scaling, zero/invalid input, LED, loader, update and
  interruption tests passed. Upstream HAL and DSP source bytes remain unchanged.
- Compiled processor-model boot/note and signed PCM check passed at
  `build/fm1-emulator/nylon-strum-plus20-pcm/result.json`. This local patched research
  model does not prove physical timing or acoustic loudness.
- Fresh browser origin confirmed Nylon, Classic Rock, Strum, 90 BPM, Down, 1/8,
  FREE and 50 ms, plus immediate repeated strumming. Output muted for browser QA.

Candidate: `build/device-prep/nylon-strum-plus20/guitchordi-experimental.fwsc`.
SHA-256: `ecc909f20576ec0e10440f5eaba20d2f4b3fb00f3d43b1d280799543ae491a59`.
App 231148 bytes; data/BSS 60384 bytes; pool 115200 bytes (unchanged RAM).
No device was accessed or flashed; no firmware release or Hub submission was made.

Browser deployment of commit `75f5b6393b9c1845945d08385724219d1471edbe`
succeeded in [Pages run 40390074668](https://github.com/stoogs/guitchordi/actions/runs/40390074668).
The public `/guitchordi/emu/` confirmed the same Nylon/Strum factory controls and
repeated chord attacks after publication. The local preview server was stopped.
