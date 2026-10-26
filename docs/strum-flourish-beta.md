# Strum flourish candidate — 26 October 2026

Changes after the user tested the chord-pulse build:

- White lane landmarks 1/7/13 remain illuminated even on muted X contacts, both
  in the browser and hardware brightness map. The note itself stays muted.
- The hidden Steel loop now uses the normal GLO rhythm velocity and selected
  intensity, with a bounded 10% downbeat accent. MASTER still applies normally;
  no extra DAC gain, forced volume or ceiling increase was introduced.
- Strum K1 now has ten patterns: the original six, random half chord, random
  two-thirds, full chord and fast Up-down-up. Partial membership skips mutes,
  selects distinct strings and sweeps them in physical order.
- The flourish queues three complete strokes. A tap completes the opener;
  holding repeats it at the selected division. K4 selects 30–120 ms for the whole
  burst; switching into this pattern clamps the existing sweep into that range.
  At very fast divisions the burst compresses to fit before the next tick.
  PLAY/mode change cancels remaining events. The flourish uses no timing jitter.
- The fixed event queue grows from 6 to 18 entries; fourteen DSP voices remain
  the limit. Data/BSS grows 344 bytes (including alignment), to 60728 bytes;
  framebuffer pool remains 115200 bytes. A successful link is not physical CPU
  or deadline proof, particularly with repeated dense flourishes.
- SAVE v13 retains the 46-word layout, accepts the new Strum IDs, and continues
  to read older settings under their original pattern bounds. Older firmware
  safely rejects the new schema. App/style/WASM cache keys advance to v13.

Local checks passed: all 1710 pattern/division/gate combinations; partial groups
with mutes; flourish direction, eighteen-note completion, early-release completion,
30–120 ms limits, cancellation and high-speed bounded rendering; native/WASM
rhythm parity (409600 samples); native and UBSan simulator/instrument/rhythm/loop
runs; sixteen-instrument/tuning/voicing/harmony regressions; loop parity (640000
samples); and 17 unit tests. A separate loop gain check proves master 50 yields
half the PCM amplitude of master 100, without changing the stored master level.
Target PCM/package/loader/update/interruption tests passed. Research CPU-model
boot/note PCM passed in `build/fm1-emulator/strum-flourish-pcm/result.json`; it
is not a physical stress test. Browser QA was muted and verified a 15-attack
up/down/up on five sounding C-chord strings, the 14-voice limit, and lit muted
lane starts. It is not a listening comparison.

The user reports the previous Steel squeal fix is good; those DSP patch settings
are unchanged. The new loop loudness and flourish still need device listening.

Staged candidate: `build/device-prep/strum-flourish/guitchordi-experimental.fwsc`.
SHA-256: `330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`.
App: 232184 bytes. No flash or device storage write was performed for this change.
No firmware release or Hub submission was published.

Pages deployment [40395481427](https://github.com/stoogs/guitchordi/actions/runs/40395481427)
succeeded for application commit `264fbf9185c0c4d7c703bf78d8734c672cf60582`.
Public browser QA confirmed the tenth Strum pattern, illuminated muted lane starts,
and fifteen attacks for three strokes over the five sounding C-chord parts,
with fourteen active voices maximum. The local preview server was stopped.
