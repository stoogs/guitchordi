# Chord-pulse / lane-light candidate — 26 October 2026

Arp K1 retains its six single-note patterns and adds Random Half Chord,
Random Two-thirds and Full Chord. Partial groups choose distinct sounding parts
without replacement on every tick; fractions round up for muted/smaller voicings.
Six sounding parts yield 3/4/6 simultaneous notes. Division, gate/tails, swing,
velocity, release and stop use the existing scheduler and fourteen-voice pool.
There is no new allocation or queue. More attacks can consume more CPU per tick;
real-device worst-case timing remains unmeasured.

Intensity now defaults to 60%, while 50% remains the neutral tone reference.
Saved intensity choices are preserved. Nylon/Strum, Classic Rock, EADGBE, 90 BPM,
Down, 1/8, FREE and 50 ms remain defaults. The hidden loop explicitly uses Steel
at character 50, retaining its gentler tempo and strum pattern.

White keys 1/7/13 mark the soft/normal/accent lane starts: illuminated top caps
in the browser, medium-duty LEDs on hardware. Muted contacts stay dark; actual
presses take priority. This is a playing aid, not an extra attack or pressure sensor.

SAVE schema v12 accepts Arp pattern IDs 0–8; Strum remains 0–5. Existing schemas
v1–v11 still restore with their original values. Older firmware rejects new-schema
saves safely rather than indexing nonexistent patterns. Device SAVE remains RAM-only.
Versioned app/style/WASM URLs prevent cached six-pattern controls driving nine-pattern
firmware. Browser QA exposed the stale-control case and verified the corrected assets.

Local evidence:
- 1,350 pattern/division/gate configurations passed, with group counts for muted
  and complete chords, gate release, stop, invalid saved patterns and v12 SAVE.
- Native and UBSan group tests passed; rhythm parity covers 409,600 samples.
  Simulator, voicings, harmony, fourteen tunings, sixteen instruments, 20,000 mixed
  retriggers, hidden-loop parity and 17 unit tests passed.
- All sixteen six-note sweeps at five intensity values remained unclipped.
- Firmware PCM, package, loader, update/interruption and LED tests passed.
- Research CPU model boot/note and signed-PCM capture passed at
  `build/fm1-emulator/chord-pulse-lanes-pcm/result.json`; no physical timing claim.
- Muted browser QA visibly confirmed 3/4/6 active voices on isolated chord taps,
  correct K1 names/range and the three top-cap markers.
- Static Pages/source checks passed; licenses/upstream hashes retained.

Candidate: `build/device-prep/chord-pulse-lanes/guitchordi-experimental.fwsc`.
SHA-256: `78ff59f8c4efb20eff96e930a2a571dd0fa4bae5618b3677a992765116a4eb9b`.
App 231416 B; data/BSS 60384 B; framebuffer pool 115200 B (RAM unchanged).
Not flashed. No public firmware release or Hub submission.
See [the launch packet](hub-launch-draft.md) for the remaining hardware gates.
