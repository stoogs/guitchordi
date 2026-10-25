# fm-guitomnichord

**Project brief and autonomous research/build plan — 2026-10-21**  
**Status:** exploration / browser prototype; no integration with upstream firmware claimed.  
**Project identity:** independent M-VAVE FM-1 instrument. Do not conflate with GloKeys, Polly, Patternarium Bridge, or the user's other FM-1 projects.

## 1. Mission

Build an expressive, self-hosted, *six-string chord instrument* for the M-VAVE FM-1: hold it in a guitar-like orientation, use black keys for chord selection, and strum illuminated white keys as physically distinct virtual strings. A pluck is produced **only** when a corresponding key is actually pressed: no gesture prediction, note completion, automatic arpeggiation, or inferred string attacks. The final instrument need not imitate a guitar perfectly; develop a unique resonant-string sonic character suited to the FM-1's resources.

**FIRST ACCEPTANCE MILESTONE:** `docker compose up --build` launches a browser-accessible, interactive, audible local development instrument, with clear run instructions and a basic smoke test. The very first Docker target may host the existing JS/Web Audio prototype as a stepping stone. However, **this does not constitute running Clipper's real synthesis engine**. A second, explicit milestone replaces the temporary sound generator with a verified, native/WASM-rendered DSP engine from Clipper/SLOOP (or documents why it is not technically viable). The longer-term outcome is one sufficiently portable input/audio design with a browser test harness and a hardware firmware build.

An *FM-1 hardware emulator* would imply processor/peripheral simulation; that is **not** required. Aim for a functional, testable **instrument simulator**, ideally with common portable C/C++ sound generation, not cycle-accurate hardware emulation.

## 2. Non-negotiable instrument behavior

1. **16 white keys; 11 black chord-selection keys.** Validate hardware scan codes, velocity/pressure sensing and LED addressability against firmware sources and real hardware before stating specifics as certain.
2. **Direct key-to-string mapping.** White key press produces that assigned guitar-string pitch/voice; releasing key ends the input action (decay can continue). Pressing the same key again retriggers its string. No virtual notes for skipped keys.
3. **Three contiguous playing zones:** soft six strings, normal six strings, plus four treble accent strings (`6 + 6 + 4`). Proposed mapping, in white-key order: `[E A D G B e] [E A D G B e] [D G B e]`. Verify ergonomics with user: orientation/reversal may need configuration. A guitar-style downstroke typically runs low E -> high e; upstroke reverses it.
4. **Velocity/intensity layering:** each zone has a different base range and attack/brightness. Where actual hardware velocity or aftertouch is usable, combine it with zone response; fall back gracefully to fixed zone response. Do not claim a pressure curve exists before measuring it. Velocity impacts timbre, not just gain.
5. **Chord selection:** initially 11 user-assignable slots on black keys, using actual six-string voicings including muted/unplayed strings and per-string pitches. User can select or temporarily hold a chord. Provide a discoverable chord bank/configuration format; persistence can follow after first milestone.
6. **Chord lock:** a deliberate five-second button hold toggles locking the selected chord, with obvious LED/UI feedback. Investigate a button that is usable in a guitar-holding posture and avoid conflicts with system/boot controls. While lock is active, hands can strum without holding a chord key.
7. **No synthesized extra attacks:** shared resonator/reverb/tail effects are allowed, but should be labeled and distinguishable from extra virtual string plucks.
8. **Individual-string behavior:** strings can ring, decay, mute and retrigger independently. Chord transitions must be explicitly designed and tested. A muted string makes *no sound* when struck.
9. **Sound design:** prototype three broad preset families: **WOOD** (warm organic pluck), **WIRE** (bright electric/metallic, pedals-friendly) and **GLOW** (evolving synthetic resonances). These are exploration targets, not promises of realistic acoustic samples.
10. **MIDI:** plan MIDI note-on/off and velocity output with channel/note design documented; not essential for Docker proof but important for hardware and external instruments.

## 3. Scope guardrails

**In scope initially:** playable browser instrument; real per-key input; chord slots; string pitches; muted strings; retriggering; velocity zones; audible DSP; reproducible Docker build; local-first operation; observable logs and tests; path to shared engine.

**Not in scope initially:** rhythm accompaniment, sequencer, song mode, amp simulation, sample marketplace, DAW plugin, custom hardware, exact guitar acoustic realism, full processor emulator, cloud accounts, online deployment, firmware flasher or OTA updates.

Do not merge large upstream projects wholesale before understanding dependencies, licensing and hardware assumptions. Import focused components through adapters; prefer a working vertical slice over a spectacular but broken monolith.

## 4. Upstreams to research (pin commits before import)

| Source | URL | Why | Verify before copying |
|---|---|---|---|
| FoMni | https://github.com/charlesvestal/fm1-fomni | Chord/strum input model; browser and host emulator scaffolding; FM-1 hardware abstractions | Host build, browser build path, key matrix, LEDs, chord UI, licenses |
| Clipper | https://github.com/isod89/clipper-fm1 | Modular synth engines, effects, patch structure, host rendering/tests, optional voice configurations | Portable DSP modules, exact host test commands, CPU use, per-engine polyphony, dependencies, licenses |
| SLOOP | https://github.com/isod89/sloop-fm1 | PHYS sound models and Felucca/Mutable Instruments/DaisySP heritage | Model implementation, RAM/CPU, dependency provenance, voice count, licenses |
| Official FM-1 | https://github.com/m-vave/fm1_open | Reference hardware/SDK if needed | Current build/licensing/hardware support; optional until firmware phase |

**Important:** Clipper's advertised 12/16 voice build choices are **not** evidence that 12 simultaneous PHYS voices work on-device. Prove specific engine polyphony with measurable benchmarks. Many repositories may have GPL-3.0 and other third-party obligations. Create `docs/upstream-audit.md` with exact URL, commit SHA, licenses of every copied component, modification record and attribution. Do not silently copy upstream files or commit massive vendor trees. Keep dependencies pinned for reproducibility.

## 5. Suggested architecture

```text
Browser / touchscreen / mouse / computer keyboard
                |
      virtual FM-1 key events
                |
      input-adapter + chord/lock state machine
                |
      string event model (6 logical strings)
            /             \
      MIDI event sink      audio engine API
                            |
              native DSP or WASM DSP backend
                            |
                stereo samples / audio output

                   +-----------+
                   | Docker    | -> localhost webpage
                   | static UI |    (audio executes in browser)
                   +-----------+

Later: FM-1 key/LED/audio adapters -> same logical instrument model.
```

Separate **instrument core** (chords, key-to-string mapping, state machine, voicing, lock behavior), **platform adapters** (web/hardware), and **sound backend** (temporary Web Audio, later tested native/WASM DSP). Develop a stable event interface early, such as `note_on(string_id, midi_pitch, normalized_intensity, timestamp)` and `note_off`/`damp`; decide exactly how key release interacts with a plucked string.

Keep actual event-to-audio timing measurable; pay attention to browser AudioContext start policies and use AudioWorklet for any production WASM audio engine to avoid main-thread glitches. AudioWorklet/WASM compilation is a research task, not already solved. Containerizing a website does **not** run browser audio on the server; Docker just serves frontend assets unless a native render service is added.

## 6. Ordered autonomous execution plan (work in small, provable steps)

### Phase 0 — repository and environment hygiene
- Create clean `fm-guitomnichord` repository, `README.md`, `brief.md`, `docs/`, `web/`, `tests/`, and `third_party/` only if actually needed.
- Establish `.gitignore` before `git init` / first commit: ignore build outputs, local presets/recordings, binaries, WASM intermediate files, developer secrets. Avoid incorporating unrelated FM-1 project assets.
- Check Docker/Compose availability, OS/architecture, browser compatibility and current toolchains. Write exact reproducible commands.
- Fetch or inspect upstream sources, record commit SHAs and licenses. Do not assume an online emulator exists for Clipper.
- **Checkpoint:** short research table showing components to reuse vs rewrite, blockers and licenses.

### Phase 1 — guaranteed Docker-visible vertical slice (first win)
- Bring existing original static prototype into `/web/` *as a clearly marked temporary baseline*, or use a minimal clean equivalent.
- Add root `Dockerfile` + `compose.yaml`, bind to `127.0.0.1:8768:80` by default for safe local hosting; serve static assets with a minimal HTTP server. Document other LAN/reverse-proxy options rather than exposing publicly by default.
- `docker compose up --build -d` -> open `http://localhost:8768`; click to unlock browser audio; pick chords, drag individual strings, hear plucks; lock/unlock chord.
- Add HTTP smoke test (`curl -f http://localhost:8768`) and a useful healthcheck. Confirm offline operation after initial image/build requirements are satisfied.
- **Checkpoint:** runnable demo, exact start/stop commands, screenshot or short user verification checklist. Explicitly label JS audio **placeholder**.

### Phase 2 — deterministic playing behavior and correctness
- Use **one source of truth** for voicings and string mapping. Chord schemas specify pitch or mute for all six strings, independent of zone.
- Test all 16 white inputs; prove 6+6+4 mapping. Test both sweep directions, skipped keys (no ghost notes), repeated strokes, muted strings, very rapid key events, pointer leave/re-enter and chord changes with ringing notes.
- Keyboard and touch input should not get stuck; mouse drag should not produce duplicate spurious retriggers unless a genuine new activation occurs.
- Implement zone intensity and optional modeled velocity with documented fallback; represent pressure/velocity test input in browser UI without implying hardware support.
- Add diagnostics page (last event, string, chord, pitch, zone, measured/simulated velocity, active voice count).
- **Checkpoint:** deterministic automated event tests and a manual strum test for the user.

### Phase 3 — audition REAL upstream audio on desktop (critical feasibility gate)
- Build Clipper's native host DSP/test renderer from a pinned commit on a development machine or container. Capture baseline WAVs for PHYS/pluck engines and verify audio is not silent or clipped.
- Compare SLOOP PHYS engines if Clipper interface or polyphony is limiting. Locate the exact synthesis callback boundaries; document how a note maps to a string/model and how voice allocation works.
- Build a tiny host CLI audition utility that produces a WAV from a deterministic 6-note strum (pitch, velocity, timing). No browser yet. Generate e.g. individual nylon/metal/pluck/reference samples where legal.
- Benchmark **6 and 12 simultaneous ringing/retriggering voices per selected engine**, recording sample rate, CPU target/build flags, peak/average CPU, RAM footprint, audible glitches, note stealing and latency. Host performance does not prove FM-1 performance; keep measurements separate.
- If true 12-voice PHYS is too expensive, test 6 lightweight modeled strings + a shared resonator/effect, or a hybrid FM/pluck engine. Clearly document compromises before proceeding.
- **Checkpoint:** locally auditionable WAV and `docs/dsp-feasibility.md` citing exact source file paths and results. **DO NOT** represent the JS placeholder as Clipper DSP.

### Phase 4 — real Clipper/SLOOP DSP in the browser
- Extract or wrap *only* the audited, suitable DSP; build with Emscripten to WASM if compatible. Where unavailable, isolate an equivalent native/WASM core rather than rewriting without explanation.
- Integrate the audio engine with the web UI through an AudioWorklet or another proven low-latency path. Add explicit audio engine identity/version in the UI and a selectable fallback demo engine for comparison.
- Verify parameter/patch parity using generated deterministic reference audio (compare WAVs or analysis metrics within an appropriate tolerance).
- Profile CPU and glitches under 6/12 overlapping notes on ordinary laptop/browser targets; expose overload diagnostics.
- **Checkpoint:** `docker compose up --build` serves the **real upstream-derived DSP** instrument playable in a browser. This is the main research-phase success after the initial container proof.

### Phase 5 — final character, instrument features
- Build WOOD/WIRE/GLOW presets with velocity-to-brightness and zone offsets; prefer musicality and lower CPU over forcing acoustic-guitar authenticity.
- Refine string retrigger/damping semantics and shared resonance; test tails across chord changes, note stealing and clipping.
- Add user-configurable chord mapping/banks, sensible defaults, save/import/export with schema version, reset and accessibility.
- Explore MIDI output and integration with external guitar instruments/pedals; verify connector support on actual FM-1.
- **Checkpoint:** user can play a short demonstration and give A/B feedback on three distinctive sounds.

### Phase 6 — physical FM-1 port (separate milestone)
- Study hardware SDK/build/toolchain, available RAM/flash and CPU, firmware recovery, key/LED scanning and pressure hardware. Pin tested compiler/toolchain/container versions.
- Port the logical instrument engine and selected DSP through hardware adapters. Confirm per-key LEDs and distinguishable zone lighting on hardware; simulated colors/brightness are not proof that physical LEDs support them.
- Test actual fast guitar-style strumming, aftertouch/velocity acquisition, two-handed chord selection, and five-second chord lock. Record audio, underruns, RAM peaks and on-device polyphony. Keep recovery image and documented flashing/restore path.
- **Checkpoint:** reproducible firmware build, stable 6-string playability, known performance limit, safe recovery instructions; hardware install only after user explicitly chooses to test.

## 7. Test/acceptance matrix

| Test | Required for first Docker milestone? | Required for real-DSP milestone? |
|---|---|---|
| `docker compose up --build` serves site on localhost | YES | YES |
| Browser audio starts after explicit user gesture | YES | YES |
| Each pressed mapped key triggers one corresponding string | YES | YES |
| Missed/swiped-over keys do **not** generate invisible notes | YES | YES |
| 6 soft + 6 normal + 4 accent inputs | YES | YES |
| Chord voicings include explicit mute strings | YES | YES |
| Chord lock via 5 s hold and visible state | YES | YES |
| Up/down strums and immediate retriggers audibly work | YES | YES |
| Backend displays `TEMP WEB AUDIO` or `UPSTREAM DSP` accurately | YES | YES |
| Clipper/SLOOP DSP compiled to host with actual audible WAV | NO | YES |
| Browser WASM sound verified against host reference | NO | YES |
| 6/12-note overlap and CPU/latency benchmark | NO | YES |
| Flashable FM-1 image and physical LED tests | NO | NO; Phase 6 |

**Success wording:** Never mark a phase complete until its reproduction commands, working artifact, tests and unresolved limitations are documented. A working static HTML container is *Phase 1 success*, not *Clipper emulation*. A 12-voice desktop benchmark is not a 12-voice FM-1 benchmark.

## 8. Risks, questions and fallback decisions

- **Licensing/provenance:** FoMni/Clipper/SLOOP repositories and nested DSP code may have multiple licenses. Inventory before reuse. License compatibility is a go/no-go gate for publication; include required credits/notices/source distribution.
- **Memory, CPU, voices:** 6-string model is mandatory; 12 live audio voices are highly desirable for ringing overlap but not automatically physically authentic, nor proven on FM-1. Benchmark instead of promising.
- **Host vs firmware:** Linux/macOS native host compilation, browser WASM and JieLi embedded firmware require different runtimes/toolchains. Avoid pretending Docker automatically emulates hardware.
- **WebAudio timing:** first-play restrictions, pointer event sampling and browser scheduling cause different behavior from the physical keyboard. Record input latency and flag limitations.
- **Hardware LED lighting:** exact key count/mapping, LED color/brightness and pressure sensing require verification against source and actual device.
- **Real-guitar voicing:** chord-held notes can change a string's pitch, muted strings remain silent. Define transition policies: re-fret, damp, retrigger and retain tails.
- **Six versus twelve voices:** benchmark three routes: 12 independent decaying voices; six exclusive string voices with smooth damp/re-fret; six string voices plus shared effects/resonator. Choose by ear and real resources.
- **Overgrown build:** do not implement six modes, a sequencer, browser editor and a flasher before the first audible real-DSP patch. Keep progression vertical.
- **Fallbacks:** if upstream Clipper DSP cannot be WASM-compiled quickly, provide a native host rendering service/CLI and continue browser input tests separately. If no suitable physical model fits, adopt a lighter plucked FM engine and document why.

## 9. Agent execution instructions

This is intended as an autonomous engineering brief for a coding agent with generous research time. **Start implementation; do not merely propose a roadmap.** Make sensible, reversible choices without asking the user to resolve every implementation detail. Prefer small, validated commits/checkpoints over an attempted all-at-once port. Investigate readmes **and actual code paths**. If a command fails, record the exact error, attempt a small fix, and preserve a working state. Keep `docs/progress.md` updated with (a) what runs now, (b) exact commands, (c) measured evidence, (d) open risks, and (e) next 1–3 actions. Prioritize a Docker-playable local result, then real DSP audition, then WASM. Ask the user for real-hardware validation when genuinely necessary, never claim to have tested an FM-1 without one. Do not flash hardware or publish repositories without explicit instruction.

**First command objective:** create a runnable Compose application, verify an HTTP response, then verify interactive audio manually in browser when available. Do not wait for a perfect upstream DSP port to deliver this first milestone.

## 10. Research links and earlier proof-of-concept

- FoMni repo: https://github.com/charlesvestal/fm1-fomni
- FoMni playable browser reference: https://charlesvestal.github.io/fm1-fomni/emu/
- Clipper repo: https://github.com/isod89/clipper-fm1
- Clipper editor (requires real hardware; NOT a standalone synthesizer): https://isod89.github.io/clipper-fm1/webapp/editor/
- SLOOP repo: https://github.com/isod89/sloop-fm1
- Included `index.html` in this project is an **independent Web Audio proof of concept**; it contains no borrowed Clipper/FoMni/SLOOP synthesis code. Do not confuse this with a validated hardware simulator.

## 11. Explicit decision log

- Project name: **fm-guitomnichord**.
- Separate from all earlier user projects.
- User will physically hold the FM-1 like a guitar and sweep a finger up/down across white keys.
- Prefer physical one-key/one-string behavior over inferred gestures.
- Initial white-key scheme: six soft + six normal + four stronger treble accents, with real sensed velocity layered on top if possible.
- Black-key chord buttons: user assignable; persistent/held chord, plus deliberate five-second chord-lock toggle.
- Desired audio: an original resonant-plucked instrument, with WOOD / WIRE / GLOW experiments; external pedals welcome.
- Research Clipper + FoMni + SLOOP for reuse; avoid assuming they can simply be combined.
- Immediate deliverable is a self-hosted Docker instrument; then verifiable native/WASM Clipper-or-SLOOP DSP; hardware flash only later.
