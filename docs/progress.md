## Guitar tuning selector — 25 October 2026

GLO K3 now selects all fourteen planned guitar tunings. Standard EADGBE remains the default and preserves every existing voicing. Alternate tunings use generated compact fret tables: 294 chords × six shapes per tuning, exact chord pitch classes, open strings/four-fret windows and at most four distinct stopped frets. Active tuning is displayed above the main chord; GLO also shows open-string pitch names. ENV lock blocks tuning changes; instrument/style changes preserve tuning. New attacks use the new grip; existing tails are not retuned. Snapshot v10/45 words migrates all previous saves to Standard. Tests cover 24,696 shapes / 148,176 string pitches, low Drop-D bass, open-D all-open grip and setting persistence/independence.

## Factory defaults, fine sweep and first-device audit — 25 October 2026

Steel Acoustic + Classic Rock + standard EADGBE + 90 BPM are the factory settings. Strum defaults are Down / 1/8 / FREE / 50 ms. K4 offers INSTANT then 5 ms steps up to 250 ms; v9/44-word snapshots migrate v8 25 ms units while preserving duration. Browser checked at INSTANT → 5 ms and restored/saved at 50 ms with the factory sound/style.

Built the processor candidate and ran simulator, sixteen-instrument, rhythm and updater/loader tests. A new UBSan host harness interrupts every flash operation and resumes the loader; all 290 cases preserve protected head/globals and reproduce the new app. This models loader re-entry, not stock SPL or hardware power loss. Device-test staging performs no hardware access. Vendor stock download fails the expected V15 hash and is rejected; the candidate also lacks a runtime USB updater handshake. First flash is not cleared. See first-device-test.md.

## FX toggle, sweep and gate-tail settings — 25 October 2026

FX now toggles tone/Home without cancelling playback. Strum K4 controls a 0–250 ms whole-stroke sweep (50 ms default), independent of beat division/gate; extremely fast repeats cap it to fit a step. GLO now opens global settings: K1 percentage-gate tails On/Off, K2 strum Humanity (20% default); SEL/GLO/HOME returns. Percentage gates with tails On enter a soft release instead of a clipped ending; FREE retains full natural decay. Snapshot v8/44 words migrates v6/v7 humanity into globals and initializes sweep at 50 ms. Timing, tails, cancellation, page toggling and migration tests pass.

## Next-chord guidance — 25 October 2026

Added a shared C harmonic suggestion guide, with green/amber/red chord names and matching browser key illumination. FM-1 adapter maps those levels to full / half / one-sixth scan-frame LED brightness; current/pressed keys remain full. Suggestions combine shared pitch classes, nearest pitch-class movement, circle motion, dominant/diminished resolution and soft key fit. Edited slots invalidate the cache. All 6,050 style/current/candidate pairs are checked; no hint triggers or alters audio. See [chord guide](chord-guide.md) for musical limits, source references and hardware caveats.

## FREE gate — 25 October 2026

Strum and Arp now default to FREE. Automatic voices retain the instrument's natural envelope and overlap subsequent steps within the existing fourteen-voice cap. K3 also retains 25/50/75/100% gates. FREE strums retain normal stroke spacing. Mode changes and PLAY still cancel automatic voices. Native/UBSan/WASM coverage now spans 1,080 rhythm configurations, with explicit tail and cancellation checks.

## Rhythm control refinement — 25 October 2026

ARP now cycles Freeplay → Strum → Arp. SELECT directly adjusts 40–240 BPM; LFO is reserved. Each of six base beat divisions (1/1 through 1/32) has straight, dotted and triplet variants, for 18 options. The active rhythm panel takes half the chord row, with PAT / DIV / GATE / HUM or SWNG labels and a slightly smaller chord name. Version-7 snapshots migrate v6 beat divisions without changing their timing. All 864 pattern/division/gate combinations, 54 exact division/tempo timings, legacy saves and native/WASM parity pass.

# Progress — 2026-10-25

## Latest checkpoint — Freeplay / Strum / Arp and three-second colour lock

SELECT now chooses Freeplay, Strum or Arp. Freeplay keeps silent chord selection and direct white-key attacks. Holding a chord key drives the selected rhythm; releasing stops repeats. A tap completes one captured strum or plays one arp note. Six patterns per auto mode use the current saved chord voicing and skip explicit mutes. Strum offers Down/Up/Alternate/Block/Bass+chord/Shuffle; Arp offers Up/Down/Up-down/Down-up/Outside-in/Random.

On the performance page the knobs become pattern, beat division, gate and humanity/swing. Each mode has its own parameter bank. Divisions include halves, quarters, eighths and sixteenths with eighth/sixteenth triplets; gate has 25/50/75/100% steps. LFO opens 40–240 BPM editing with SELECT and SEL confirms. FX retains normal intensity/transpose/room/voicing controls; HOME returns to performance; ARP is a shortcut. Both the permanent parameter bar and four lines right of the main chord reflect the active context. v6/42-word saves preserve mode, BPM and both banks; v1–v5 migrate to Freeplay defaults and restore never auto-starts playback.

Added an allocation-free six-note queue and integer sample-time scheduler in shared C. Segmented rendering retains one stable output buffer for AudioWorklet/target consumers. Timed voices use smooth gated envelopes in the same fourteen-voice pool. PLAY/Escape clears queued notes, with held-chord suppression until release, and mode changes cancel future automatic events. Chord changes restart immediately. White keys stay directly playable. Initial 64-bit variable division failed on the target; equivalent bounded 32-bit arithmetic now compiles and preserves timing/parity.

ENV locking now needs three continuous seconds and warms the icon from amber toward red, toggling once per hold. Both browser and LCD use the colour feedback; the horizontal hold bar is removed.

Validation: 288 mode/pattern/division/gate cases; onset/gate/swing timing; tap/hold/release and held-stop suppression; mode transitions; per-mode recall; v6/legacy saves; colour ramp and lock threshold. Native and WASM automatic audio match across 409,600 samples; native stress passes UBSan. All sixteen instrument regressions still match 2,867,200 samples with finite tails and 20,000 mixed retriggers; existing Freeplay and voicing tests pass. Browser verified held Strum, Arp controls at 140 BPM, LFO/SEL tempo flow, three-second lock/unlock and context display. Target app 70,124 bytes, data/BSS 55,660 bytes (42,644 spare), no software doubles; simulated updater/loader checks pass. Device CPU/latency remains unmeasured. [Guide](performance-modes.md) · [Measurements](rhythm-measurements.json).

## Prior checkpoint — Knob 4 chord voicings and six-part instruments

Repurposed Knob 4 from duplicate volume to the selected black-key slot's chord voicing. All 294 chords now have six distinct standard-EADGBE shapes: the original plus five generated alternatives spanning neck positions, preserving the original pitch-class set. Each of eleven slots stores an independent shape index; chord switching recalls it, instrument changes preserve it and MASTER remains the output control. Changing a shape does not create attacks or retune existing voices. Lock blocks shape edits. Reassignment/reset restores Shape 1; changing style loads factory slots/shapes as before.

Expanded snapshots to version 5 / 32 words, saving eleven shape choices in addition to the original fields. Existing v1–v4 21-word snapshots still load with factory shapes; validation rejects invalid shape indices before mutating state. Browser SAVE and reload verified two independently recalled choices, with MASTER unchanged. Device SAVE remains RAM-only.

Removed the former four-part restriction from violin, cello and bass. All instruments now expose six chord positions across the established 6 soft / 6 normal / 4 accent contacts. Other-family key labels show actual pitches, and the LCD shows six part numbers for those instruments. Explicit mutes remain visible as X, and duplicated pitches remain legitimate voicing choices. No extra voices or automatic notes introduced.

Validation: native/UBSan application tests, original 50-style mapping suite, all sixteen instrument stress/persistence/tail tests, 2,867,200 exact native/WASM samples, 20,000 mixed retriggers, and 80 unclipped intensity sweeps pass. New voicing integration checks 1,764 distinct shapes and all 169,344 instrument/shape/part pitches. Browser verified per-slot recall, SAVE/reload and six-part note labels. Target app 66,136 bytes, main data/BSS 54,680 bytes (43,624 spare), pool 115,200 bytes. Simulated updater/loader and Docker builds pass; physical performance is still unmeasured. [Preview](guitchordi-voicing-memory-preview.png).

## Prior checkpoint — two-thirds chord area, permanent parameter bar and larger voicings

Corrected the layout interpretation: main chord name is centred at x80 within the left two-thirds (160 px) of the LCD. It can use up to 148 px, allowing extended chords to remain larger. Slot, octave and voice/partial-shift metadata occupy the right third. Removed GUITCHORDI from the LCD; the title bar permanently shows Knob 1 intensity, Knob 2 transpose, Knob 3 room and Knob 4 output, plus the ENV lock icon/caption. Parameter values use antialiased 18 px type and update on every page.

Enlarged the always-visible eleven-voicing map from four columns to three, with four rows. Noto Sans 14 px labels (12 px fallback for the longest labels) replace the old 5×7 glyphs. All 294 chord names fit in both main and grid areas; 0/100% and signed transpose extrema fit the parameter cells. Pitch names remain 18 px; part/string labels now use 14 px type. Reflowed page content and the explicit reset menu to keep the header and voicing map visible.

Native/UBSan/WASM application and exact audio parity checks pass, as do target compilation, simulated updater/loader and HTTP checks. Browser verified a Bbmaj7 voicing with the new bar, larger labels and separated main chord. Current target app 51,064 bytes; main data/BSS remains 54,592 bytes and large-buffer pool remains 115,200 bytes. No DSP change. [Preview](guitchordi-parameter-bar-preview.png).

## Prior checkpoint — readable chord typography and separated title area

Moved the large chord-name anchor to x160 (two-thirds across the LCD), moved SLOT to the left at x12, and retained the lock in its own right-hand area. The title no longer shares the slot label's space. Added OFL-licensed Noto Sans semibold antialiased glyphs for the main chord and pitch names. Main labels select 36, 26 or 18 px to fit an 88 px advance; all 294 labels fit and glyph bounds stay between y64 and y105. Pitch names use 18 px with centred cells. Small status labels retain the compact original glyphs.

The full licensed font is an authoring input only. A Pillow script creates the checked-in four-bit bitmap subset and records its source hash; normal builds need no font tooling. Integer RGB565 blending writes into the existing framebuffer, with no runtime font allocation or audio change. Native/UBSan/WASM tests pass with exact audio parity; simulated updater/loader package checks pass. Browser checked A and Bbmaj7, clean separation, and note rows. Target app 46,784 bytes, unchanged main data/BSS 54,592 bytes and framebuffer pool 115,200 bytes. Both Docker services rebuilt healthy. [Preview](guitchordi-readable-chord-preview.png).

## Prior checkpoint — clean natural intensity, ENV lock, SEL OK and octave display

Removed the added high-intensity brightness/drive macro from Harp and Violin. The 50–100 range now only gently raises gain up to 15%; neutral and high waveforms are checked equal after gain compensation within 1e-6. Lower intensity remains soft/dark, other instruments retain their previous macros. Shortened Bowed Violin to Violin (same ID, same synthetic harmonic source).

Moved the five-second chord-lock hold from SEL to ENV in shared C, browser buttons, Space shortcut, padlock captions and hold progress. SEL now confirms reset choices and finishes slot assignment; Enter supplies contextual OK. EDIT no longer confirms a reset, even when pressed in its menu. Native/UBSan tests cover that distinction, ENV threshold/once-per-hold and old SEL hold not locking. Browser verified ENV lock/unlock, SEL reset confirmation, clean Violin at 100% and octave switching.

The former top-right screen-page number is now relative OCT -1/0/+1, with any partial semitone shift shown separately. Centred chord name and note cells for both four- and six-part layouts. Mapping remains four upper parts for violin/cello, four lower parts for bass, six string positions for guitar/harp/dulcimer; extended chords can contain duplicated pitches and four-part versions can omit extensions. No extra voices or hidden notes added.

All instrument/native/UBSan/WASM and 80 intensity sweep checks pass. Rebuilt target app 32,092 bytes, unchanged main data/BSS 54,592 bytes; package simulated updater/loader checks pass. Both local containers healthy. Hardware performance remains unmeasured.

## Prior checkpoint — centred controls, patch revision, independent settings and resets

Centred the three browser guide columns and C LCD headings/values. Chord styles now change only their chord bank: they preserve instrument, standard EADGBE/transpose, intensity and room. Instruments retain their intended register/part mappings; alternate tuning selection remains future work.

Reviewed all sixteen patches through deterministic renders. Steel and the original three retain their neutral coefficients; revised twelve others, including a clearer, longer-ringing Nylon, fuller Jumbo/Jazz/Cello, tighter Palm, clearer electrics and less brittle Dulcimer. Replaced Violin's sustained dust exciter with a bounded four-harmonic surrogate, 102 ms swell and 300 ms release. It shares the fourteen-voice pool and avoids continuous noise accumulation; this is a lightweight synthetic articulation, not sampled violin.

Intensity defaults to neutral 50%. The full 0–100 range shapes new attacks: below neutral reduces brightness/gain, above neutral opens brightness and adds quadratic per-voice drive with gain compensation. Queued retriggers retain their captured character. Version-4 snapshots preserve zero intensity and migrate legacy values (old 100 → new 50). Key zones, independent master and finite tails remain.

Tap EDIT assigns. Hold EDIT 1.2 seconds to open Cancel / This slot / All slots; PRESETS chooses and a separate EDIT tap confirms, HOME cancels. Releasing a hold alone never resets. Reset restores the current style's factory slot(s); lock prevents reset and other settings are preserved. Browser guide and C LCD show the menu selection. The regular LCD popup remains removed.

Validation: 16 Node tests; application native/UBSan/WASM; all 140,800 instrument/style contacts; 2,867,200 exact native/WASM instrument samples; 20,000 mixed-patch/intensity retriggers; all 80 six-note intensity sweeps finite and without DSP limiting. Bowed single-note periodicity 0.99989. Original three-patch PCM parity remains exact. Browser verified independent instrument/transpose/style, hold reset with explicit confirmation, restored chord, and normal 50% default. Rebuilt target app 31,744 bytes, main data/BSS 54,592 bytes (43,712 spare), no software doubles; simulated updater/loader checks pass. FM-1 physical performance remains unmeasured. Both Docker apps healthy. The review script produces a 64-second sixteen-instrument reel and a five-level Steel comparison in build/audio-review; these tests are not a human listening verdict. [Signal report](instrument-review-measurements.json). [UI preview](guitchordi-refinements-preview.png) · [Reset menu](guitchordi-reset-menu-preview.png).

## Prior checkpoint — unobstructed LCD

Removed the temporary knob readout overlay from the C LCD at the player’s request. The persistent Preset / Algorithm / Select header, notes, zones, voice count and chord legend remain visible while turning controls. The browser control guide retains its highlights and inline value feedback. Native/UBSan/WASM tests pass with exact audio parity; target package rebuilt at 30,924 app bytes.

## Prior checkpoint — live control guide

Added persistent Preset / Algorithm / Select columns to the browser panel and the shared 240×240 C LCD. The values follow the selected style, instrument and actual page (Play, Chord slots, Levels, Diagnostics). EDIT changes the preset readout to the selected slot assignment; alternate tuning remains planned, with standard EADGBE unchanged.

Knobs 1–4 now show permanent function/value labels in the browser. Every turned control highlights its guide entry and displays its name/value for three seconds in the browser and C LCD. MASTER has a distinct activity identity while retaining the same output parameter as Knob 4. Repeated unchanged ADC values do not keep the overlay alive. Added the missing LCD percent glyph. No DSP parameters or synthesis paths changed.

Validation: native and UBSan tests cover all eight control identities, three-second expiry, turns at a bound, invalid/zero movement, MASTER/Knob 4 volume sharing, unchanged ADC suppression and no control-generated attacks. Existing 50-style/550-slot/8,800-contact WASM tests pass with exact native audio parity. Browser verified Acoustic Pop / Wood, all four knob readouts, SELECT page changes and EDIT slot assignment. Target app builds at 31,460 bytes, main data/BSS 54,360 bytes (43,944 bytes spare); loader/package checks pass in simulated flash. Both Docker services rebuilt healthy. [Preview](guitchordi-control-guide-preview.png).

## Prior checkpoint — optional instrument visuals and padlocks

Added a top-right browser instrument panel with guitar/bass, bowed-string, harp and dulcimer outlines. Unmuted C attack telemetry triggers zone-coloured motes, string motion and a small wave trace. A persistent Visuals on/off button controls it; reduced-motion preference supplies the initial default. The animation caps at 30 fps, uses 32 preallocated particles and stops when idle, hidden, off-screen or disabled. It creates no audio nodes/voices and changes no synthesis parameters. These decorative effects are browser-only.

Replaced visible lock/unlocked text in the status strip with accessible open/closed SVG padlocks and on the C LCD with an independently drawn pixel padlock. The five-second SEL gesture and lock behavior remain unchanged. Browser verified instrument artwork follows selection, real presses create attacks, disabling effects survives reload, and continuous SEL closes the padlock and blocks style changes. Native/UBSan/WASM application checks pass with exact control-audio parity; target app links at 30,544 bytes with unchanged RAM. Updated package and HTTP checks pass. Browser warning/error log is empty; the instrument is left unlocked with visuals enabled. [Preview](guitchordi-visuals-preview.png).

## Prior checkpoint — illustrated manual and coloured note zones

Added a six-page illustrated player manual with four real in-app screenshots, an HTML guide at `/manual/`, a downloadable PDF, and a Manual link in the simulator header. One authoring script, `scripts/build-manual.py`, produces both versions. PDF pages rendered with Poppler, visually checked and validated for text bounds/embedded fonts. Both containers are healthy and HTTP smoke checks include the manual, PDF and all four screenshots. Browser acceptance verified actual violin pitches/zone labels, five-second lock/unlock and SAVE; the published guide loads its navigation, images and download link. Topics include start-up, instrument/style changes, violin zones, lock/edit/save, all controls/shortcuts, hardware expectations and troubleshooting.

Violin/cello/bass light keys now show actual sounding notes and octaves. Green, amber and coral lettering/key tops/active highlights identify soft, normal and accent zones. A matching numbered zone legend and live instrument/chord/lock/voice strip clarify the playing layout. C LCD shows note names instead of MIDI numbers, matching zone badges, and the last played part coloured by its input zone. Default guitar string labels and EADGBE reference remain unchanged. Chord suffix case is preserved in the status strip.

The C pitch-telemetry API is tested for all 140,800 instrument/style/slot/key cases, including invalid indices. Existing native/UBSan and WASM application tests pass with float32-exact audio; all sixteen-patch parity cases still match 2,867,200 native samples. Updated target links at 30,472 bytes, main data/BSS 54,352 bytes, framebuffer pool 115,200 bytes, no soft-double routines. Simulated updater/loader tests pass against the rebuilt package. Source DSP parameters/voice allocation are unchanged in this checkpoint.

Headroom is specifically link-time memory: 43,952 bytes remain in the main RAM region, 228,864 bytes in the large-buffer pool; stacks occupy separate reserved regions and high-water usage is unmeasured. CPU audio capacity is still unmeasured; each 128-frame half needs to complete in approximately 2.90 ms. Same core timbre is the expectation from shared C/model/settings, not verified pi32v2 execution, codec/output or fourteen-voice hardware parity. [Current measurements](fm1-build-measurements.json).

## Prior checkpoint — Guitchordi, sixteen instruments and expanded tests

Renamed the visible product to **Guitchordi** in both browser pages, panel and C LCD, package metadata and experimental target filenames. Workspace paths and the original starter remain intact. Browser saves use a new namespace with fallback to the legacy key; v3 snapshots store all sixteen tones and original v1/v2 IDs remain accepted.

Retained Wood/Wire/Glow at IDs 0–2 with original coefficients. Added eight guitar variants (nylon, steel, jumbo, palm muted, clean electric, round jazz, crunch, heavy) plus harp, bowed violin, pizzicato cello, electric bass and dulcimer. All use the existing MIT string model and one shared fourteen-voice pool. Bowed excitation, patch envelopes, register and per-voice saturation provide the extra timbres. Four-part violin/cello/bass mappings repeat across the sixteen contacts; browser key labels and LCD follow the actual mapping. [Catalogue](instruments.md).

Validation: native + UBSan pass 20,000 deterministic mixed-patch retriggers across pitches/intensities; all sixteen patches have distinct, finite, non-silent audio and bounded tails. Native/WASM float32 output is exactly equal across 2,867,200 samples. All 140,800 instrument/style/slot/key combinations match expected pitches and explicit mutes. Each patch saves/restores and invalid/legacy tone boundaries are checked. Original sixteen Node tests and the original DSP parity/retrigger checks pass (the old invalid-tone boundary was updated from 3 to 16). Existing application/native/UBSan/WASM tests pass. Both Docker apps rebuild healthy; both HTTP smoke scripts pass. Browser verified four-part violin labels, a real pitch-62 note, SAVE/reload restoration, then immediate nylon keyboard playing at pitch 43 after selecting the instrument. No numerical test is a listening assessment. Browser warning/error log is empty. Final preview leaves Nylon Acoustic selected and saved: [Guitchordi preview](guitchordi-instruments-preview.png). [Measurements](instruments-measurements.json).

Guitchordi's updated device app is **30,220 bytes**, main RAM data/BSS **54,352 bytes**, framebuffer pool **115,200 bytes**, `.fwsc` **609,684 bytes**. Link checks pass with no software-double routines; renamed package passes simulated updater/loader tests. Compared with the earlier three-patch target, the app grows by 2,180 bytes and state by 112 bytes. Hardware boot/performance/recovery, persistent flash settings and in-app USB updates remain open.

No supported FM-1/pi32v2 processor VM was found in the official toolchain or QEMU's documented system targets. Docker/native/WASM and simulated flash tests remain useful behavioral checks, with no claim to chip-cycle/peripheral emulation. [Processor simulation findings](processor-simulation.md).

## Prior checkpoint — first pi32v2 app and experimental firmware package

User asked to investigate deployable firmware ahead of an expected FM-1 delivery and asked whether Felucca should be the base. Reused a focused 33-file, unmodified and hash-inventoried selection of Felucca-derived X0X platform/loader/build support at `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`. Original GPL source/notices retained; no X0X instruments/assets imported. [Provenance](../third_party/fm1-platform/README.md).

Official JieLi `20260730.1` toolchain (clang 4.0.1) runs in pinned linux/amd64 Debian Docker. Three SDK packaging blobs match the reference AC79 SDK hashes; canonical Gitee DNS failed, so a pinned mirror of the exact SDK tag supplied identical files. New setup/build/check scripts reproduce an actual processor image, loader and experimental `.fwsc` without accessing a device.

Shared C application and DSP now link for pi32v2. Phase increments are precomputed, audio clock uses integer remainder accumulation, framebuffer is in the large-buffer pool and no software-double routines link. Board adapter connects timer-scanned matrix inputs, encoder roles, key LEDs, ADC master, LCD strips and 128-frame stereo I2S DMA. Core 1 stays held. Watchdog, exception guards, two-failed-boot fallback and both-octave update entry are compiled, not hardware-verified.

Final measured app: **28,040 bytes**, main data/BSS **54,240 bytes**, framebuffer pool **115,200 bytes**, RAM loader package **6,528 bytes**, `.fwsc` **609,684 bytes**. [Measurements](fm1-build-measurements.json). Link/image checks pass; simulated updater/loader tests pass against the generated package, including app replacement, protected flash head, range checks, cancellation, idempotence and damaged-key refusal. Shared regression: 16 Node tests, native, UBSan and all 50/550/8,800 WASM cases pass; native/WASM float32 audio still exact.

This is an **unflashed bring-up candidate**, not a qualified device release. Running app lacks in-app USB update/MIDI/audio and SAVE is RAM-only; panel calibration, actual audio rate/output, CPU/stack/latency/14-voice measurements and physical recovery tests await the device. [Build instructions](firmware-build.md) · [Readiness](device-readiness.md).

Recorded fourteen future tuning specifications (including Open D/G, slide/blues options and drop tunings) in [tuning-presets.md](tuning-presets.md) and its JSON. Standard **EADGBE** remains default and runtime pitch behavior is unchanged. No tuner UI added; harmony-aware revoicing is required when alternate tuning is implemented.

## Prior checkpoint — persistent chord labels and fifty styles

Added 50 distinct eleven-slot chord styles, including jazz, lo-fi, light/hard rock, Memphis/Chicago/Texas blues, pop, soul, folk and ambient. A 294-voicing guitar catalogue preserves the original eleven numeric IDs. C owns bank selection, names, pitches, recommended tone/room and versioned persistence. PRESETS browses styles outside EDIT. No automatic attacks or extra DSP voices are introduced by changing banks.

All eleven black-key chords remain visible on the keys, an always-present browser guide and every C LCD page. Minor/flat suffixes retain their case on the LCD. Browser labels follow C telemetry, including edited slots. Saved style snapshots roundtrip; legacy snapshots migrate. Changing banks loads factory slots.

Validation: 16 Node tests pass; native host, UBSan and WASM tests pass. All 50 banks / 550 slots / 8,800 white contacts match source pitches and mutes; all voicings match their advertised pitch classes and guitar fret reach. Native/WASM control audio remains float32-exact. Both Docker targets rebuilt healthy and both smoke checks pass. Browser verified live bank labels, PRESETS and the legend on diagnostics. [Preview](styles-preview.png) · [Style catalogue](styles.md).

The application simulator is working; there is still no flashable target package. The next milestone is a minimal device build with one key, audio and screen, followed by full peripheral mapping and actual CPU/RAM/latency/recovery validation. [Device readiness](device-readiness.md).

## Prior checkpoint — Docker Play-in-browser application simulator

User requested a firmware simulator like X0X and specifically clarified the Firmware Hub's Play in browser buttons. Tuning is deferred. Added a separate Docker simulator at **http://localhost:8769/**, with the original workbench retained on **http://localhost:8768/**. Both are built with `docker compose up --build -d --wait`.

The simulator now runs independent `firmware/app.c` for chord slots, all 27 logical keys, input edges, five-second lock, knobs/buttons, screen framebuffer, lights, shared room and settings storage; it calls the shared native/WASM string DSP. The browser forwards inputs and displays C outputs. `web/chords.json` generates the C bank header. This is an application host build; no actual FM-1 peripheral adapter or flashable firmware package is claimed.

Native and WASM application tests verify all sixteen pitches, muted/no-extra attacks, retriggers, lock timing/blocking, settings validation/restore, finite audio and drawn framebuffer; the deterministic 153,600-sample control sequence is float32-exact between the native and WASM builds with floating-point contraction disabled. The main C buffers tally 162,672 bytes, including the 240×240 framebuffer; not a complete hardware RAM estimate. Existing 13 Node tests still pass; the new native host, UBSan and WASM tests also pass. Browser verification passed switch-on, LCD/knob response, D low-E mute, SAVE/reload restoration, five-second lock/unlock/blocking and 28 attacks reaching 14 active voices with 14 steals. Browser warning/error log empty; both containers healthy and HTTP smoke scripts pass. [Simulator preview](firmware-simulator-preview.png). Commands: `npm run test:simulator`, `npm run smoke:simulator`, `npm test`.

X0X research pin: `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`; inspected its host/browser/worklet/parity build and licensing, along with the hub's actual `play` links. No X0X code/assets imported. The hardware-looking panel and application are independently written. See [firmware-simulator.md](firmware-simulator.md) for controls, exact reproduction, known limits and next device-port boundary.

## Prior checkpoint — real upstream-derived DSP integrated

User authorized proceeding with the upstream integration without waiting for an audition gate and asked to investigate Melodee. Implemented a native/WASM path around one audited MIT Clipper string-model file, keeping the original JS engine selectable. The browser now defaults to **UPSTREAM DSP · Clipper PHYS string** and renders live in an AudioWorklet with the independent 14-voice C adapter. Docker builds the WASM from source with a pinned Emscripten stage.

- Downloaded pinned Clipper, SLOOP and Melodee archives into ignored `build/research/`. Melodee commit: `398ada1e09d864c12f3b778a43e45c7c2a8031b8`. Inspected its AGENTS.md, attribution, chord strum and sequencer paths. Its STRUM/STROKE is a tempo-based chord spread; no automatic-note scheduler was connected to our direct-contact playing path.
- Copied only unchanged `firmware/src/phys_dsp.c` from Clipper `e69067211c4690f34e494b5b896e4585163dcc2b`; preserved MIT/copyright notice, added exact hash/provenance and compiler/runtime notices. No GPL engine wrapper/preset table or Melodee code imported. All imported source/notices are served with the app.
- Native deterministic six-note WAVs for all three exploratory patches are non-silent and unclipped. Six/twelve/fourteen-voice steady-load native benchmarks completed; 14-voice mean render budget ~0.44–0.48% on this desktop Linux container, not on FM-1. Static adapter state 39,152 bytes; reserved WASM memory 1 MiB; compiled module 9,319 bytes.
- Native/WASM reference comparison is PCM16-exact for all three deterministic strums. Actual WASM stress: 1,000 retriggers, finite output, <=14 active voice states, no memory growth, near-expired steals preserved. UBSan native renders pass. Existing 13 Node tests also pass.
- Browser worklet test: Ready with upstream engine, 42 key attacks / 84 input events, 28 steals, no rejected events or limited samples, live output peak 0.1100. Main-thread note-message posting peaked at 0.100 ms in that run; no end-to-end latency claim. Browser warning/error log empty. Switching to the original JS backend reached Ready with 63 cached sounds and created a voice on a real press.
- Final rebuilt app check: muted D low E produced no audio attack; WIRE reached 14/14 voices with non-zero output. Screenshot: [browser-upstream-preview.png](browser-upstream-preview.png). Served WASM SHA-256 `17f25d545debb7d2f17379fe16377f1856baed0001f89fa8253833b62fc2ee42` matches the locally validated binary. Full `npm run test:dsp` passed, including UBSan for all three tones.
- Reproduction: `docker compose up --build -d --wait`, `npm test`, `npm run test:dsp`, `npm run smoke`. Renderer WAVs/benchmarks are in `build/audio/`; source is `dsp/`; measured report is [dsp-feasibility.md](dsp-feasibility.md) and [dsp-measurements.json](dsp-measurements.json).
- The browser build is working; low-power/browser glitch testing, sustained output latency measurement and FM-1 hardware adapter/toolchain validation remain open. No firmware flashing or publication occurred. No listening gate was used to delay this integration.

## Prior checkpoint — responsiveness first

User audition feedback: the initial sound was excellent; the new priority is feel/reactivity over quality. Interpreted requested “14 strings” as 14 simultaneous ringing audio voices, preserving the required 16 physical input positions.

- Fixed 14 filter/gain lanes, oldest-voice replacement with a 3 ms fade before replacement starts; the old/new sources do not overlap in a lane. Sub-millisecond onset ramp and smoothed master/reverb controls reduce discontinuities.
- Startup module worker prepares all 63 default pitch/tone combinations; cached AudioBuffers are shared across attacks. Fresh lightweight one-shot sources remain necessary, but no pluck synthesis, sample-buffer, filter or gain allocation occurs in attack dispatch. Startup memory tradeoff: 12,096,000 sample bytes (~11.5 MiB), excluding graph/runtime overhead. This is not an FM-1 memory claim.
- Intentional quality reductions: 24 kHz mono source data, stronger damping, tails reduced to 1.8 seconds (WOOD/WIRE) and 2.4 seconds (GLOW), shared reverb shortened from 1.3-second stereo to 0.45-second mono, default wet control reduced to 12%. Source rate is distinct from browser device output rate.
- AudioContext requests interactive latency; actual output latency is browser/device-dependent. See [AudioContext options](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/AudioContext). Reused sample buffers and new one-shot source nodes follow the [AudioBufferSourceNode lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).
- UI updates coalesce into animation frames; diagnostics run separately at 5 Hz. Attack timing is no longer overwritten by the following release event; session peak and steal count are visible.
- Verification: **13/13 tests pass**, including 1,000 attacks with the underlying scheduled-source timeline never exceeding 14 sounding sources; no buffer/gain/filter allocation after preparation; stale-ended callback ownership; Silence; all three tone sample outputs finite/non-silent with tapered ends. Scheduling tests use a model AudioContext, not a real browser renderer.
- Browser verification: startup reached Ready with 63 cached sounds; 42 rapid keyboard attacks produced 84 input events, reached 14/14 voices, and recorded 28 steals. Peak measured JS attack scheduling was **0.200 ms** in this run. All voices then decayed to zero and no held keys remained. Browser warning/error log was empty. This is not an end-to-end latency, CPU-load or underrun benchmark. Screenshot: [browser-lean-preview.png](browser-lean-preview.png).
- Docker rebuilt successfully; healthy container and expanded HTTP smoke (including worker/synthesis modules) pass. Current URL remains http://localhost:8768/. The prior listening feedback applies to the original sound; the leaner tone and steal fades need fresh listening feedback.

## What runs now

The workspace root contains the active Compose app, `web/`, `tests/`, scripts and documentation. The original nested starter and zip remain intact and ignored. The local Docker container is running on **http://localhost:8768** with selectable **UPSTREAM DSP** and original **TEMP WEB AUDIO**, eleven selectable/configurable chord slots, sixteen direct string inputs, three intensity/timbre zones, explicit mutes, five-second lock and diagnostics. A focused MIT upstream string model is now compiled to native/WASM; no complete upstream firmware is imported. No hardware has been connected or flashed.

```sh
cd /Users/stuartblack/code/fm-guitomnichord
docker compose up --build -d --wait
npm test
npm run smoke
docker compose ps
# stop:
docker compose down
```

Node tests need no package installation. `npm run serve` is an alternative Python HTTP server; stop Docker first. Initial Docker image acquisition needs network; subsequent builds/playback use local assets. Docker base is pinned by the digest observed during the successful build.

## Measured evidence

- Host: Darwin arm64; Node v22.11.0, Python 3.13 available. Docker client/server 29.4.0, Compose v5.1.2; Docker Linux VM aarch64.
- `docker compose up --build -d --wait`: successful build and healthy container; binding `127.0.0.1:8768->80/tcp` confirmed.
- HTTP smoke: all six page/application assets returned successfully; module `Content-Type: application/javascript` verified. Initial Nginx default served `.mjs` as `application/octet-stream`; fixed with an explicit MIME location and added a regression smoke assertion. Browser cached the old header, so the app entry has a version query to force refresh.
- `npm test`: **9/9 passing**. Covers every white input and zone, both travel directions, skipped keys, repeated contact/re-entry, explicit mutes, rapid retrigger, pitch ownership across chord changes, lock timing/cancellation, multi-contact release and bank validation.
- Browser via in-app browser: eleven chords and sixteen keys rendered; Enable audio changed context to `running`. Two separate key clicks emitted four on/off events and created two active audio voices. D low-E input emitted `muted` with zero voices. A 5.2-second hold disabled chord controls and displayed Locked to G; another 5.2-second hold unlocked them. Screenshot: [browser-preview.png](browser-preview.png).
- This verifies graph startup/voice scheduling, **not an independent listening assessment**. Physical output audibility, tone quality, touch ergonomics and full latency still require the manual README checklist. No browser WASM, native upstream WAV or FM-1 benchmark is claimed.
- Pinned upstream GitHub commits, licence headers and selected host/PHYS code paths inspected. Both PHYS wrappers define a three-voice limit; see [upstream-audit.md](upstream-audit.md).

## Environment failures and fixes

- `/usr/bin/git status --short` fails: `You have not agreed to the Xcode license agreements.` Git initialization/commit remains pending user completion of Apple's licence process; no agreement was accepted automatically.
- Docker socket initially returned `permission denied while trying to connect to the docker API`; access succeeded through the tool's approved sandbox escalation. Localhost curl similarly needed sandbox escalation. The app itself is healthy on the host.
- Python urllib HTTPS failed with `CERTIFICATE_VERIFY_FAILED: unable to get local issuer certificate`. Switched upstream metadata reads to system `curl` with certificate validation intact.

## Phase status and remaining risks

Phase 0 has working layout, ignores, environment inventory and an initial pinned upstream audit. Git initialization and full component licence inventory remain open. Phase 1 has a verified Docker/HTTP/browser interaction slice; user listening/manual checklist is outstanding. Phase 2 has core event tests but has not been signed off across touch devices/browsers. Phases 3/4 now have the focused native renderer, verified shared WASM model and live AudioWorklet integration described in the latest checkpoint. Cross-browser/glitch/latency validation remains open; firmware phase 6 has not started.

The placeholder pre-renders random excitation in a startup worker and caches samples. Its 14-voice cap is a browser policy, not proof of hardware resources. Diagnostic dispatch duration excludes output latency. Chord assignment is runtime-only unless the JSON file is edited/rebuilt. Persistent held-chord selection is the initial policy; a temporary-hold mode is deferred. There is no MIDI sink yet. The imported leaf model uses an independent measured 14-voice allocator; firmware RAM/CPU portability and licences for any additional imports remain separate gates.

## Next three actions

1. Stress the live upstream backend across touch devices/browsers and record end-to-end latency/dropouts; keep the JS reference selectable.
2. Inspect pinned FM-1 SDK/hardware adapters, key/LED mapping and compiler resources, then build an unflashed firmware vertical slice around the shared core.
3. Validate real FM-1 RAM/CPU/voice limits and control ergonomics before any user-authorized device installation. Resolve Git setup when the user has completed Xcode licensing.

## Rhythm velocity and confirmed factory reset — 2026-10-25

Strum/Arp normal keys and automatic notes now default to 80% attack. Soft/accent zones remain expressive; GLO K4 adjusts 1–100% separately from tone Intensity. Binary hardware input still cannot measure physical strike velocity. GLO held three seconds opens Reset everything?; SEL confirms, HOME cancels. Confirmation restores every saved instrument setting and chord slot, publishes a browser save, and requires held keys to release. Target package builds at 217424 bytes / 55916 main RAM bytes. Velocity/reset regressions, rhythm matrix and native/WASM parity passed. No device accessed.
