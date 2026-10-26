# GuitChordi v0.1.0-beta.1 — prepared release

Status: local release preparation only. No tag, public firmware release or Hub
submission has been made. Proposed release title: **GuitChordi v0.1.0-beta.1**,
marked as a GitHub prerelease.

GuitChordi turns the M-VAVE FM-1 into a chord and string instrument: sixteen
synthesized sounds, fifty chord styles, fourteen guitar tunings and remembered
chord voicings. Play directly, repeat strums, or explore arpeggios, partial chords
and an Up–Down–Up flourish.

Factory settings are Nylon Acoustic, Classic Rock, standard EADGBE, Strum mode,
90 BPM and 60% intensity; strum settings are Down, 1/8, FREE gate and 50 ms.
The device contains a conservative output ceiling and physical master control.

## Exact tested binary

- Proposed filename: `guitchordi-v0.1.0-beta.1.fwsc` (renamed copy only).
- Size: 609684 bytes.
- SHA-256: `330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`.
- Running identity: `FM-1_982`; loader identity: `ota-FM-1_982`.
- Instrument/build source baseline: `264fbf9185c0c4d7c703bf78d8734c672cf60582`.
  Later qualification/release commits change documentation only. The future
  release tag must point to the reviewed source commit, not a moving main link.
- No firmware rebuild or device write is part of this release preparation.

## Hardware and local evidence

On one developer-owned M-VAVE FM-1, the exact package above installed from
official stock V15 (`FM-1_015`) and Felucca 1.6.1 (`FM-1_916`). Ordinary outgoing
installation to Felucca and return to this identical package completed. Separate
MIDI identity requests verified running firmware; the user confirmed playing.

After the V15 installation, the user pushed jazzy chords, patterns and timing:
the displayed peak render was **2511 us**, late buffers **0**, invalid samples
**0**. Against the approximately 2902 us audio-half deadline, the observed peak
leaves about 391 us / 13.5% margin. This is not whole-CPU utilization, an
exhaustive worst-case measurement or a guaranteed margin on every unit.

Local regressions include 1710 rhythm configurations, bounded fourteen-voice
operation, native/WASM parity, instrument/tuning/voicing tests, audio output
format/limiting, package/loader validation and simulated update interruptions.
Details and provenance: [hardware log](hardware-test-log.md),
[candidate tests](strum-flourish-beta.md), [local qualification](local-qualification.md).

## Compatibility and beta limits

- Device SAVE is **RAM-only**; a power cycle loses device edits. Browser SAVE is
  local to that browser. No flash-backed preset persistence is advertised.
- No import/conversion of other firmwares' projects, patterns or samples.
  Export those using their own firmware before switching. Data preservation is
  not promised; installing another firmware may overwrite shared storage.
- USB MIDI is used for identity/update. USB performance MIDI and USB audio are
  not implemented.
- Recovery USB enumeration and a private full-flash backup were verified on the
  test unit. Physical interrupted-write resume, full-backup restoration, power
  failure behavior and stack high-water margin remain untested.
- Session duration and instrument-by-instrument stress coverage were not logged.
- The Hub KB also requests a physical interrupted-update/resume test. That gap
  must be disclosed/resolved before claiming complete Hub qualification.
- This package is locally built; it has no GitHub build attestation.

Use Chrome for the browser installer (confirmed in this test). Keep power/USB
stable during updates, start sound checks at low volume, and retain backups.
No zero-risk or universal recovery guarantee is made.

## Source and attribution

Combined firmware: **GPL-3.0-only**. Platform/startup/USB/OTA/loader code derives
from Charles Vestal's X0X and Felucca by Leo Kuroshita (@kurogedelic), Hügelton
Instruments. The unchanged MIT physical string DSP comes via Clipper by isod89,
with Electrosmith/Emilie Gillet and Felucca-port notices retained. Noto Sans glyphs
are OFL-1.1; the three JieLi SDK package inputs retain Apache-2.0 notices.

Distribute complete corresponding source and build scripts at the release tag,
plus the source archive, checksums, full license texts and [NOTICES](../NOTICES.md).
The source archive is extra convenience; it does not replace browsable tagged
repository source. No stock firmware, device backups or vendor compiler archive
is included in our release assets. No upstream endorsement is claimed.

[Website](https://stoogs.github.io/guitchordi/) ·
[Play in browser](https://stoogs.github.io/guitchordi/emu/) ·
[Manual](https://stoogs.github.io/guitchordi/manual/) ·
[A4 cheatsheet](https://stoogs.github.io/guitchordi/manual/Guitchordi-Cheatsheet-A4.pdf)
