# Native and browser DSP checkpoint — 2026-10-21

**Running implementation:** Clipper's actual fixed-point string-model routines, compiled to native C and standalone WASM; live browser rendering uses an AudioWorklet. This is a focused upstream-derived model with an independent adapter, not the whole Clipper synthesizer, factory patches or firmware emulator. The original temporary JS backend remains selectable.

## Source boundary

The only copied synthesis file is `third_party/clipper-phys/phys_dsp.c`, unchanged from Clipper commit `e69067211c4690f34e494b5b896e4585163dcc2b`, path `firmware/src/phys_dsp.c`. Its complete MIT notice credits Electrosmith, Emilie Gillet and Leo Kuroshita's fixed-point port for Felucca. SHA-256 and notices are in [the component record](../third_party/clipper-phys/README.md). The source's string section defines `px_string_t`, `px_string_blk_t`, `px_string_block`, `px_string_excite` and `px_string_run`.

`dsp/engine.c` calls those routines from an independently written static 14-voice adapter. It does not use the GPL `eng_phys.c` arena/three-voice allocator. Each attack owns its pitch and normalized intensity; all voices ring independently. An oldest-voice steal fades for up to 132 samples (~3 ms), then resets that same state to the pending real key event. It does not create an attack for an unpressed key. `note_off` ends input ownership but lets natural decay continue; chord changes affect only future attacks. WOOD/WIRE/GLOW here are new parameter experiments, not copies of upstream presets or guarantees of parity with the old JS tone names. BOW/Dust/sympathetic-note generation is disabled; shared reverb is a separate browser effect.

The model's reference rate is 44,100 Hz. Its fixed-point coefficients contain rate assumptions; the browser explicitly requests that rate and refuses an incompatible context rather than silently detuning. The adapter accepts MIDI pitches 24–96; other pitches are rejected and counted. All bundled chord-bank pitches fit that range. Supporting arbitrary user MIDI-range voicings requires a separate tuning/range validation pass.

## Reproduction

```sh
# No local C/Emscripten installation needed; builds source inside the pinned compiler image.
docker compose up --build -d --wait
npm test
npm run smoke
npm run test:dsp
```

The full DSP check creates `build/audio/phys-strum-{0,1,2}.wav`, six-second deterministic six-string strums; benchmark WAVs for 6/12/14 voices; `build/dsp-parity.json`; and `build/dsp-measurements.json`. `dsp/render.c` is a tiny native audition/measurement CLI. It uses no copied upstream host harness or generated assets. The benchmark restarts a full held voice load every half second, preventing decay/voice shutdown from making the reported CPU look artificially cheap. Rendering is measured separately from WAV file output; note setup is outside that render timing. Per-attack setup cost is not included in the native CPU table.

Compiler image: `emscripten/emsdk:4.0.17`, pinned digest `sha256:10ee8f470c016ddb23d0f04d45bed7b4c3e896f88b135976bbc80751bc7f7825`. Native flags: `-O2 -fwrapv -fno-strict-aliasing`; WASM uses `-O3` with the same integer-semantics flags. UBSan builds use `-O1 -fsanitize=undefined -fno-sanitize-recover=all`. Browser image builds WASM itself in the first Docker stage; no generated binary needs to be checked in. Source/notices are served under `/upstream-source/` alongside the browser artifact.

## Measured desktop results

Initial run: Linux aarch64 in Docker Desktop on this Apple Silicon host. These are **native host render costs**, not FM-1 CPU percentages or proof of browser/device glitch-free output. Snapshot: [dsp-measurements.json](dsp-measurements.json).

| Tone | Six voices, mean budget | Twelve voices | Fourteen voices | Worst 14-voice render block |
| --- | ---: | ---: | ---: | ---: |
| WOOD | 0.208% | 0.408% | 0.479% | 0.0437 ms |
| WIRE | 0.199% | 0.385% | 0.453% | 0.0356 ms |
| GLOW | 0.200% | 0.387% | 0.444% | 0.0543 ms |

Benchmark blocks are 126 samples (~2.857 ms at 44.1 kHz); browser blocks are 128 (~2.902 ms). Worst-block wall times include host scheduling noise. Peak/average CPU on the physical FM-1 remains unknown.

- Every generated WAV is non-silent and has no PCM clipping or adapter-limited samples in this test set. Representative six-note WOOD strum peak is approximately 0.103 full scale, RMS approximately 0.0062 over six seconds, including silence.
- All three deterministic six-string native/WASM comparisons are **PCM16-exact**: maximum and RMS difference zero. This tests the shared adapter/model before the browser's separate reverb/limiter/device resampling. It is not a claim of complete Clipper preset parity.
- 1,000 actual WASM retriggers remain finite, respect the 14-voice state limit, produce voice stealing, and do not grow memory. Near-expired steals are tested so a new press is not lost at a tail boundary.
- Static voice/output state: **39,152 bytes**. WASM memory reserved: **1,048,576 bytes** including stack/runtime; module: **9,319 bytes** in this build. These are distinct quantities. No dynamic allocation is used by the adapter's render/note paths; the browser backend does not pre-render/cache all notes.
- UBSan native 14-voice render passes. Browser test observed a running upstream AudioWorklet, non-zero output peak 0.1100, 42 real attacks, 28 steals, zero rejected events and zero limited samples; warning/error log empty. Main-thread event posting peaked at 0.100 ms in that run, which excludes worklet queueing, DSP cost and device latency. It is not an underrun measurement. The final rebuilt app also verified a D-chord low-E mute with zero attacks, then WIRE playback reached 14/14 active voices with non-zero output, zero rejected events and zero limited samples. [Browser screenshot](browser-upstream-preview.png).

## Browser path and limits

`web/upstream-audio.mjs` compiles the fetched WASM module on the main thread and transfers the compiled module to `web/phys-worklet.mjs`. The worklet instantiates it once, reuses a view of its fixed output buffer, handles only actual note-on messages, and renders/mixes on the audio thread. A copied mono signal feeds both output channels, with optional separate mono room effect and limiter. It posts low-rate voice/state/error telemetry, keeping UI updates outside the render loop. Engine switching silences and suspends the previous audio context; switching back resumes it. The selected engine is named explicitly in the header and diagnostics. A processing error is surfaced rather than silently labelled as upstream sound.

Remaining work: sustained multi-browser/touch/low-power-device glitch and end-to-end latency measurements; more pitch/timbre/clipping coverage at maximum intensity; hardware RAM/CPU/toolchain/key/LED adapters; MIDI. The current modular C adapter is a useful portability boundary, not a flashable FM-1 image. No hardware flashing or repository publication has occurred.
