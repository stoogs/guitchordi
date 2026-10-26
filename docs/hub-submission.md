# Local qualification and Firmware Hub submission

Checked against [Submit your firmware](https://thefirmwarehub.com/submit/) and
[the Knowledge Base](https://thefirmwarehub.com/kb/) on 25 October 2026.
This is our preparation plan, not a submission or clearance to flash.

## Current position

| Gate | Evidence / outstanding work |
| --- | --- |
| Public source and license | Repository public at https://github.com/stoogs/guitchordi; GPL-3.0-only, with retained MIT, OFL and Apache-2.0 notices. Central inventory: [NOTICES.md](../NOTICES.md). |
| Local C/WASM behavior | Existing rhythm, instrument, tuning, reset, voice-bound and parity regressions pass. Browser is the behavior reference, not proof of processor/peripheral operation. |
| Target package | App + Felucca-derived loader builds; package/flash simulation passes. Latest recorded candidate: [build measurements](fm1-build-measurements.json). No device has booted it. |
| Processor/board emulator | Hardware candidate stops at LCD baud restriction. Separate slower-LCD diagnostic boots; playing a note stops on unsupported opcode. [Current evidence](local-qualification.md). |
| USB MIDI and runtime updater | Integrated and tested at packet/hook level against host mocks; physical enumeration, identity and outgoing update remain unverified. |
| Unique identity | `FM-1_982` is provisional, absent from the 25 October catalogue, and shared by app/package/generated loader. Coordinate/reserve with the Hub and recheck before release. |
| Real-device entry/exit | **Not tested.** Hub requires installing the release from V15 and from another firmware, then successfully leaving ours for another firmware. Test the user's exact starting version too (reported likely V16). |
| Restore route | Official repository V15 now matches the pinned hash. This unit's recovery and backup route still need verification before writing. |
| Release / submission | Neither a firmware release nor Hub submission has been made. Publishing source is not release qualification. |

## 1. Repeatable local source and package checks

Run from the repository root with Docker available:

```sh
npm test
npm run test:simulator
npm run test:rhythm
npm run test:instruments
npm run test:dsp
npm run setup:fm1
npm run build:fm1
npm run test:fm1
docker compose up --build -d --wait
npm run smoke:simulator
```

Keep the commit, compiler/container pins, app/package SHA-256, build report and
logs together. Check the browser source archive's checksum and rebuild its WASM
from a clean extracted directory. Verify copied upstream file hashes and font
provenance (`tests/licensing.test.mjs`). For a device release, include matching
complete source/build inputs and all license notices; review the exact SDK inputs
and applicable license scope again. The pinned SDK tree has no root NOTICE;
its two uC-HTTPc NOTICE files are for an unrelated HTTP client, not our three
packaging inputs. This observation is recorded rather than silently treating all
SDK libraries as dependencies or cleared for reuse.

Manually check all controls, touch/key release, instrument changes, all tunings,
Freeplay/Strum/Arp timing, gate tails, lock, chord edits, GLO reset confirmation,
SAVE/reload and sound under dense playing. No automatic audio should begin on
restore; no held key should restart after damp/reset without release.

## 2. Run the actual pi32v2 package locally

The [FM-1 emulator by Simon Johansson](https://github.com/simonjohansson/fm1-emulator)
is a separate GPL-2.0 QEMU-based test tool. It executes firmware machine code and
models the board; it is distinct from our recompiled browser simulator. Keep it
outside our source distribution unless deliberately packaging it with its own
source/license obligations. Do not weaken OS security settings to run it.

The first local test used its official `build-67` macOS ARM64 archive:

- Upstream commit: `519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34`.
- Archive SHA-256: `739758a473cf67185da1f9da48231b725c9a6f8a340d137b181936e1e5086df4`.
- Exact candidate SHA-256: `9f1c546b88fc09b4f8dac294ecad07677630f526e0775c7396c5c66b70c63f97`.
- Command after verifying/extracting into ignored `build/fm1-emulator/build-67/`:

```sh
build/fm1-emulator/build-67/emulator --headless build/fm1/guitchordi-experimental.fwsc
```

It exits with `pi32v2: SPI1 supports idle BAUD 4 only at PC 0x02001084 after
26446743 instructions`. Disassembly at that PC writes zero to SPI1 BAUD;
our retained upstream LCD implementation changes speed after initialization.
That is an identified emulator-model restriction, not evidence of a real FM-1
failure or of a successful boot. Next investigate a newer/model-compatible emulator
or a separately marked diagnostic build. Do not quietly change the shipping
hardware clock behavior just to make an emulator pass. Once supported, require
LCD boot, actual controls, notes, all modes and repeated reboot/panic tests;
record any model gaps. Emulator speed is not a measured FM-1 audio deadline.

## 3. Complete USB and recovery engineering before first flash

USB MIDI identity and update entry are integrated in `firmware/fm1/update.h`.
Host packet and integration tests pass. Physical enumeration and handoff remain
required; [current evidence and independent comparison](local-qualification.md).
Prove that update entry quiesces audio safely and preserves the protected flash
head/storage boundaries. Repeat package/loader fault tests on the exact candidate.
The standard outgoing update path is a required feature, not replaced by an
emergency recovery shortcut.

Follow [first-device-test.md](first-device-test.md) to establish the actual unit's
revision/current firmware, exported projects/samples, verified stock recovery file
and per-device backup, plus an independently verified recovery route. Preparation scripts only stage/check files; they do not access a device. Their
hash or chip-ID refusal remains a stop condition. No no-brick guarantee follows
from local software checks.

## 4. Controlled real-device qualification

Only after the preceding gates are satisfied:

1. Install the exact hash-recorded candidate using the reviewed route and stable
   power, with low output volume. Check boot/display, one key, master, octave and
   control mapping before dense playing.
2. Measure actual sample rate, output/latency, stack margin, maximum render time
   and missed audio DMA halves across all patches up to fourteen voices. At
   44.1 kHz a 128-frame half-buffer has about 2.90 ms; require zero overruns and
   measured safety margin during sustained rapid playing and UI changes.
3. Test all controls and reset/lock gestures on hardware. Verify power-on defaults
   and document RAM-only SAVE accurately. Check cable reconnect and cold boots.
4. Run the Hub's installation matrix: known V15 -> Guitchordi; another tested
   custom firmware -> Guitchordi; user's actual V16 -> Guitchordi if that is the
   starting version; Guitchordi -> known-good other firmware/stock; then back.
   Record every version/hash, identity response, install result and successful boot.
   Do not count a write followed by an identity timeout as success.
5. Validate recovery using the reviewed procedure; do not perform deliberate
   power-interruption experiments on the user's only unit as a routine test.
   Simulated interruption coverage does not prove physical recovery.

Use [hardware-test-log.md](hardware-test-log.md) for the evidence. Any code change
after qualification requires appropriate regression and a newly identified build;
the submitted binary must be the tested release artifact.

## 5. Release materials, then submission

After all gates pass, create a tested versioned GitHub release containing the
`.fwsc`, its checksum, matching corresponding-source archive, full notices,
release notes and completed test evidence. Include compatibility/data-loss and
RAM-only-save limitations clearly. Keep the binary identical to what was tested.
The Hub's optional `zvenson/fm1-build` shared GitHub workflow can produce an
attestation; our current Docker build needs adaptation/verification before using
that workflow. No automated publishing workflow is enabled by this document.

Prepare the submission's firmware/author names, repository/release links, unique
identity, GPL-3.0-only declaration, two-to-three sentence description and a 240x240
LCD capture or suitable photo. Include the cheatsheet and an HTTPS browser demo
if deployed; localhost is not a public demo link. A root `fmhub.json` is optional
for card text/category/HTTPS demo links, and should describe tested present features.
Send the links to the Hub only after testing, with the author's approved display
name. The Hub checks package identity/loader/checksum and may mirror source;
it does not perform our hardware qualification. Future releases may be imported
automatically, so each release must meet the same gates.
