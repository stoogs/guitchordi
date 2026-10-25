# Guitchordi

[Print the one-page A4 controls cheatsheet](output/pdf/Guitchordi-Cheatsheet-A4.pdf) - labelled control diagram, mode chart, lock and reset shortcuts.

Independent M-VAVE FM-1 six-string instrument simulator. [brief.md](brief.md) is the project brief.

[Illustrated player manual](http://localhost:8769/manual/) · [Printable PDF](output/pdf/Guitchordi-Manual.pdf)

Factory defaults: **Steel Acoustic · Classic Rock · standard EADGBE · 90 BPM**. Strum starts at **Down · 1/8 · FREE · 50 ms**. K4 offers **INSTANT**, then 5 ms steps through 250 ms. Saved browser settings override factory defaults. [Current performance controls](docs/performance-modes.md). **GLO K3** selects fourteen [guitar tunings](docs/tuning-presets.md), with Standard EADGBE as default and the tuning shown above the chord.

**Hardware: experimental, not cleared for first flash.** See [first device test preparation](docs/first-device-test.md). Recovery/USB behaviour has not been verified on a physical unit; the current vendor restore download fails the pinned stock-V15 hash check. No device has been flashed.

## Play in the FM-1 panel simulator

```sh
docker compose up --build -d --wait
# Open http://localhost:8769 and click Switch on
npm run smoke:simulator
npm run test:simulator
```

The new **Play in browser** simulator has an FM-1-style panel, working screen, knobs, keys and lights. Chords, lock, settings, screen pixels and audio execute in the shared C application compiled to WASM. Hold ENV for three seconds to lock a chord; the padlock closes on the LCD/status strip. The top-right Visuals toggle enables optional note-reactive instrument art and remembers your preference. These effects run only in the browser UI. Drag knobs or use their −/+ buttons; SAVE stores settings in this browser. This is the application host build. An experimental FM-1 target adapter now builds a `.fwsc` package; hardware boot/performance and recovery remain unverified. [Simulator controls, build and evidence](docs/firmware-simulator.md).

The simulator now has **16 instruments**: the original Wood/Wire/Glow, eight additional guitars, harp, bowed violin, pizzicato cello, bass and dulcimer. Choose INSTRUMENT or turn ALGORITHM. All share fourteen voice slots; all patches expose six chord parts with adapted key labels and register. [Instrument catalogue](docs/instruments.md) · [Processor simulation findings](docs/processor-simulation.md).

The simulator includes **50 chord styles**: jazz, lo-fi, light/hard rock, Memphis/Chicago/Texas blues, pop, soul and more. Choose CHORD STYLE or turn PRESETS. Every black key has a chord label, with an eleven-chord guide above the keys and on every LCD page. SAVE keeps the style and edited slots. [Full style catalogue](docs/styles.md) · [Device readiness](docs/device-readiness.md).

The original instrument workbench remains on **http://localhost:8768/**. Compose builds and starts both services; `docker compose down` stops both.

## Play in the instrument workbench

From this workspace root:

```sh
docker compose up --build -d --wait
# Open http://localhost:8768
npm run smoke
# stop:
docker compose down
```

Click **Enable audio** and wait for **Ready**. The default engine now runs **UPSTREAM DSP · Clipper PHYS string**: the actual MIT-licensed fixed-point C string model, compiled to WASM and rendered in an AudioWorklet. The **Engine** menu also offers **TEMP WEB AUDIO · original**, preserving the lean JS sound you already played. These have independently designed WOOD/WIRE/GLOW experiments; matching tone names do not mean identical sounds. Switching engine silences/suspends the previous one.

Choose a chord, then tap or drag across the sixteen white keys. The zones map to `[E A D G B e] [E A D G B e] [D G B e]`. A skipped key creates no attack. Muted strings show × and stay silent. All sixteen playing keys remain available with a **14 ringing-voice limit**. The oldest voice fades briefly before replacement. Releases leave natural decay, and chord changes affect future presses only. Shared reverb is an effect tail, not another string attack.

Hold the lock button for five uninterrupted seconds to lock/unlock the selected chord. Chord keyboard keys: **Q W E R T Y U I O P [**. String keys: **A S D F G H J K L ; ' Z X C V B**. Hold **Space** with page focus, or Space/Enter while focusing the lock button, for the lock gesture. Repeated keyboard events do not retrigger; release and press again.

Expand **Chord slot configuration** to reassign eleven slots for the session. For lasting changes, edit [web/chords.json](web/chords.json), then rebuild. Schema version 1 has eleven slot names pointing to six MIDI pitches in low-to-high string order; `null` mutes a string. The current upstream adapter accepts pitches 24–96; all supplied voicings fit. Runtime assignments reset on reload. Simulated velocity changes intensity and timbre; it is not measured hardware pressure.

## Verify and develop

```sh
npm test              # core and original audio allocation/scheduling tests; Node 22+, no packages
npm run test:dsp      # pinned compiler container, native WAVs, sanitizers, WASM/reference tests
npm run smoke         # Docker must be running; HTTP, JS modules, WASM and attribution
```

The DSP check generates deterministic native audition files in `build/audio/phys-strum-{0,1,2}.wav`, 6/12/14-voice benchmarks and JSON measurements. [DSP feasibility](docs/dsp-feasibility.md) documents exact source boundaries and results. Native and WASM PCM output match exactly for the three reference strums. No FM-1 CPU/polyphony measurement is claimed.

Docker builds WASM from the vendored C source in a pinned Emscripten compiler stage, then serves static assets on `127.0.0.1:8768`. Audio executes in the browser. After the initial compiler/server image downloads, builds and playback require no network. There are no remote runtime scripts, fonts or accounts. Secure localhost is needed for AudioWorklet. For deliberate LAN hosting, configure HTTPS and the Compose port binding explicitly.

Optional UI development: `npm run serve` provides the original Python HTTP server on port 8768 (stop Docker first). Choose TEMP WEB AUDIO there; that simple server does not build or route the WASM artifact. For full upstream-engine development use the Docker rebuild command above. Opening the HTML directly as a file does not support module/chord-bank loading.

Manual smoke:

1. Enable audio, select G, tap all sixteen inputs and sweep both ways; only contacted keys should attack.
2. Select D: low E and A stay silent in both six-key zones. Change chords while notes ring: no unsolicited attacks or pitch changes to old tails.
3. Repeatedly retrigger, leave/re-enter, then switch windows while holding keys. Diagnostics should show no stuck keys.
4. Hold lock briefly (no toggle), then over five seconds (one toggle); repeat to unlock.
5. Change tones and engines, play again, and use Silence. Old engine audio and reverb should stop. Check touch separately.

## Experimental device firmware

`npm run setup:fm1`, `npm run build:fm1`, then `npm run test:fm1` prepare dependencies, build the actual pi32v2 app/loader/package and exercise simulated update tests. No command accesses a device. The candidate still needs physical bring-up, in-app USB update integration and flash-backed settings. [Build instructions](docs/firmware-build.md) · [Readiness](docs/device-readiness.md).

Standard **EADGBE** remains the default. [Fourteen tuning presets](docs/tuning-presets.md), including Drop D and Open D/G, are available through GLO K3.

## Source and project status

- `web/core.mjs`, `web/chords.json`: independent input model and voicing source.
- `firmware/app.c`: portable C instrument application with inputs, clock, screen, lights and settings; `web/emu/`: host simulator panel/worklet.
- `dsp/engine.c`: independent 14-voice C adapter; `dsp/render.c`: native renderer/benchmark CLI.
- `third_party/clipper-phys/phys_dsp.c`: one unchanged MIT source file from pinned Clipper; [source/notice record](third_party/clipper-phys/README.md).
- `web/upstream-audio.mjs`, `web/phys-worklet.mjs`: browser/WASM audio adapter.
- `web/audio.mjs`, `web/buffer-worker.mjs`, `web/pluck.mjs`: preserved cached original JS backend.
- [Progress](docs/progress.md), [upstream audit/Melodee findings](docs/upstream-audit.md), [DSP evidence](docs/dsp-feasibility.md).

Clipper/SLOOP/Melodee research archives are isolated in ignored `build/research/`. The audio model is the audited MIT leaf. The hardware target also vendors a focused, attributed GPL Felucca-derived platform/loader selection; its file hashes and licence record are in [third_party/fm1-platform](third_party/fm1-platform/README.md). No upstream sequencer, instrument wrapper, icons or sample assets have been merged; the display uses the separately credited OFL Noto Sans font. Melodee's STRUM/STROKE schedules a chord's notes over time; our independently written Strum/Arp scheduler supplements direct white-key playing. The simulator and experimental target share our instrument application. The target package compiles and passes simulated update tests; physical FM-1 operation remains unverified.

The original extracted starter remains intact in ignored `fm-guitomnichord/` beside its original zip. Active development files are at this workspace root. The project is published at https://github.com/stoogs/guitchordi.

## Source and licensing

The combined firmware project is GPL-3.0-only; see [LICENSE](LICENSE). Third-party components retain their own notices, including the MIT string-model leaf and OFL fonts. See [platform provenance](third_party/fm1-platform/README.md). Build dependencies, firmware packages and per-device flash backups stay out of Git.


## Credits and release testing

[Full licenses, credits and component boundaries](NOTICES.md) · [Local testing and Firmware Hub submission gates](docs/hub-submission.md). The combined project is **GPL-3.0-only**, with retained MIT DSP, OFL font and Apache-2.0 SDK notices. The Docker website includes a matching source archive and a visible credits link.

Guitchordi does **not** import stock, Felucca, X0X or other firmware projects,
patterns or user samples. SAVE is currently RAM-only on the device; browser SAVE
is browser-local. No preservation or automatic conversion of another firmware's
flash data is promised. Export that firmware's projects and samples before any
switch, and keep a verified recovery image and per-device backup.

The current `FM-1_900` package identity is an experimental placeholder, not a
reserved release identity. USB MIDI identity/update support, real-device install
and exit tests, processor-emulator tests and a verified restore route must be
completed before a Hub release. No Hub submission or release tag has been made.
