# Play-in-browser firmware application simulator

The simulator is at **http://localhost:8769/**. The original workbench remains at **http://localhost:8768/**; the same simulator is also available at `/emu/` on the workbench service.

```sh
docker compose up --build -d --wait
# Or just the simulator:
docker compose up --build -d --wait firmware-simulator
npm run smoke:simulator
npm run test:simulator
# Stop both:
docker compose down
```

Click Switch on. This boots the C application in an AudioWorklet with live audio, a 240×240 RGB565 framebuffer, key/button LED masks, seven encoder roles plus master volume, and browser-backed settings snapshots. All 16 white inputs and 11 black chord slots are available. The original fourteen-voice C DSP is shared between this simulator and the workbench.

## What is actually simulated

`firmware/app.c` is a new portable application layer. Chord selection/slot assignment, white-key edge detection and 6+6+4 mapping, muted strings, tone selection, a three-second SEL lock, levels, transposition, shared room tail, screen drawing and settings validation execute in C. This is more than displaying a device image around the original JS input model: the browser only forwards input and displays C outputs. The same application source builds into a native host test executable and WASM.

This is **not a completed FM-1 hardware firmware build**. A separate experimental AC79 board adapter and `.fwsc` package now build; neither has been verified on a physical device. See [target build](firmware-build.md). The host's logical key indices and panel layout were checked against X0X's host/browser sources; raw hardware scan codes, LED capabilities, button safety, debouncing/peripheral timing and on-device RAM/CPU remain unverified. `SEL` is a proposed lock control for the host application, subject to physical ergonomic validation. The 240×240 screen is a real C framebuffer, not evidence of a tested hardware LCD driver. Host input reacts directly to events; no automatic strum scheduler is used.

## Panel controls

- Black keys: select one of eleven chord slots. White keys: actual string attacks; releases leave decay.
- SEL: continuous three-second hold toggles chord lock. Releasing/cancelling early aborts. Each continuous hold toggles once.
- SELECT: direct 40–240 BPM. ARP cycles Freeplay / Strum / Arp.
- ALGORITHM: browse sixteen instruments. PRESETS: browse the 50 chord styles, or change the selected slot’s assigned voicing while EDIT is active.
- KNOB 1: expressive intensity, 50% normal, below soft/dark, above brighter/driven; KNOB 2: transpose; KNOB 3: shared room; KNOB 4: per-slot chord voicing (Shape 1–6); MASTER: output level.
- EDIT: tap to toggle slot assignment; hold 1.2 seconds for Cancel / This slot / All slots, choose with PRESETS, tap SEL to confirm, HOME to cancel. SAVE: write a versioned C settings snapshot into localStorage under this simulator's own namespace. HOME: play page. FX: levels. GLO: global settings.
- PLAY/STOP: damp/clear all audio and held inputs; no transport or sequencer. OCT−/OCT+: transpose by one octave within ±12 semitones. ENV holds the three-second chord lock. LFO/SEQ/REC are reserved/disabled.
- Keyboard follows the workbench's string/chord shortcuts; hold Space with page focus for SEL; Escape damps. Knobs support pointer dragging, wheel, arrow keys and minus/plus controls. Keys and panel buttons support focused Space/Enter holds. Blur/visibility changes release inputs.

Chord data is generated from `web/chords.json` and `web/styles.json` at build time by `scripts/generate-firmware-bank.py`. The catalogue contains 294 explicit six-string voicings and 50 distinct eleven-slot style banks. Each style supplies a chord set, recommended WOOD/WIRE/GLOW tone and shared-room level. The fourteen-voice cap and direct white-key attacks remain unchanged.

Use CHORD STYLE or PRESETS to select a bank; black keys select individual chords. Chord names appear on the black keys, the browser guide and the bottom of every C LCD page. EDIT plus PRESETS changes the selected slot. Changing style loads that style’s factory chords and replaces unsaved slot edits. SAVE preserves the active style, edited slots and settings; it does not maintain separate edited copies of all fifty banks. The versioned snapshot accepts the original simulator’s saved settings without changing its first eleven voicing IDs. [Complete catalogue](styles.md).

 Runtime SAVE does not edit those files or communicate with a physical device. Saved settings restore after reload; audio, key holds and voice state do not persist.

The small shared room tail is implemented in the C host application; it is a plain delay/feedback effect, not extra plucked notes. It differs from the workbench's browser convolver. No tuning changes were made in this task.

## Build and verification

`Dockerfile` builds both DSP and application WASM from source in the pinned Emscripten 4.0.17 image. Compose explicitly selects the `instrument` and `simulator` server targets and binds only localhost ports 8768/8769. Builds use existing vendored MIT DSP source; the simulator adds no upstream code/assets.

`npm run test:simulator` runs:

1. The native C application tests: boot defaults, explicit mutes, no duplicate held attacks, immediate retriggers, all sixteen key pitches, three-second continuous lock, blocked chord changes while locked, settings validation/restore, non-silent audio and framebuffer output.
2. The same native application under UBSan.
3. All 50 styles, 550 slots and 8,800 white-key contacts against the source JSON: exact pitches/mutes/names, finite audio, no attacks on bank changes, a fourteen-voice ceiling, style persistence, original-settings migration and locked/invalid mode rejection.
4. The WASM application against a deterministic native control/audio sequence, plus all sixteen key pitches and 1,000 rapid real attacks with a fourteen-voice cap.

The native/WASM application outputs match **exactly as float32** for the 153,600-sample control sequence, including C room processing and parameter changes. Native floating point initially differed by 7.45e-9 because of contraction; setting `-ffp-contract=off` on both builds removes that difference. This verifies host consistency, not hardware parity. Reference peak: approximately 0.11592, finite and non-silent.

The C-reported main buffers/state total is **162,784 bytes**, including 115,200 bytes for the framebuffer, 8,192 bytes for the room line, the DSP buffers and settings/slot arrays. This is a scoped buffer tally, not total firmware RAM (small globals, code, browser/runtime buffers and stack are additional). WASM memory is fixed at 1 MiB. The browser transfers the screen only when its state changes, with approximately 20 Hz telemetry; audio stays on the worklet thread.

## Reference research, provenance and limits

The requested reference was [X0X's emulator](https://charlesvestal.github.io/fm1-x0x/emu/), and specifically the **Play in browser** links on [The Firmware Hub](https://thefirmwarehub.com/). The hub catalogue's `play` field links to examples including X0X, FoMni and ChoralRoot. Its install/rescue workflow is unrelated to this local simulator and was not invoked.

Pinned X0X research revision: `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`. Inspected `web/emu/build.sh`, `web/emu/x0x_web.c`, `web/emu/worklet.js`, `web/emu/index.html`, host parity tests and LICENSING.md. Its actual approach compiles its complete existing C app/host platform to WASM, advances the device while rendering audio, and forwards framebuffer/light/storage outputs to the browser. X0X code is GPL-3.0-only; no code, fonts, graphics, assets or firmware binary from X0X or the hub has been copied. Our independently written panel and C application follow that architecture with our existing MIT-licensed string-model dependency.

Next device-port work: implement/test the FM-1 platform adapter, compiler/package/recovery build path and physical resource limits. This host simulator is the reference for that work. Hardware flashing remains a separate user-authorized step.

## Browser acceptance evidence

Verified the running Docker simulator in the in-app browser: Switch on started the C application, LCD and telemetry; selecting D then pressing low E produced zero attacks; ALGORITHM incremented WOOD to WIRE; SAVE persisted WIRE/chord slot 3 across reload and reboot. Holding SEL for 5.2 seconds locked the chord and prevented a new black key from changing it; another hold unlocked it. A 28-attack keyboard sequence reached 14 active voices with 14 steals and zero DSP-limited samples. No browser warnings/errors were logged. Both HTTP smoke scripts pass and both containers are healthy. [Preview](firmware-simulator-preview.png).

## Chord-style acceptance evidence

The rebuilt Docker UI displays all fifty grouped choices. Selecting Memphis Blues updated all eleven black-key, guide and LCD labels from C telemetry without a new attack. PRESETS changed Cinematic Night to Ambient Air with matching labels and room settings. The diagnostics LCD page retained the eleven-chord legend. Node catalogue/input tests pass 16/16; native, UBSan, WASM integration and both HTTP smoke checks pass. [Current preview](styles-preview.png). See [device readiness](device-readiness.md) for the remaining target-build work.

The current product name is **Guitchordi**, including the browser title, panel and C LCD. The sixteen-patch selector and instrument-specific mapping are documented in [instruments.md](instruments.md). Existing browser saves migrate through the legacy namespace.

Knob 4 voicings are recalled per black-key slot and saved with SAVE in a version-5 snapshot. All instruments now expose six chord parts; explicit muted notes stay silent. See [instruments and voicings](instruments.md).

[Strum/Arp performance controls, tempo, gate, swing and three-second ENV lock](performance-modes.md). Knob mappings depend on the performance page; FX retains the ordinary tone and per-slot voicing controls.

Next-chord suggestions colour all eleven LCD chord labels and the browser black keys. Green/bright = smooth or strong, amber/medium = colour, red/dim = adventurous; selected chord stays gold. See [chord guide](chord-guide.md).
