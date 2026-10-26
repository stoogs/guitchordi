# Guitchordi device qualification record

Status: NOT RUN. Complete a separate copy for each tested release candidate.

- Date / tester / device model and hardware revision:
- Exact starting firmware identity and version:
- Guitchordi commit / release identity / candidate SHA-256:
- Matching source archive / SHA-256 / build-tool pins:
- Exported projects and samples / backup verified (private location, not committed):
- Stock restore artifact source / version / SHA-256:
- Independent recovery route verified before first write:
- Processor emulator version / result / known model restrictions:
- USB MIDI enumeration and identity reply:
- V15 -> candidate: install + post-install boot + identity:
- Other custom firmware -> candidate (version/hash):
- Actual user's starting version -> candidate:
- Candidate -> known-good firmware/stock (version/hash):
- Return installation / reconnect / cold boot / recovery evidence:
- Screen / knobs / buttons / all key zones / LED mapping:
- Sixteen patches / tunings / chord edits / voicing memory:
- Strum/Arp timing / gates / FREE tails / damp / held-key behavior:
- ENV lock / EDIT reset / GLO 3-second prompt / SEL confirm / HOME cancel:
- RAM-only SAVE behavior correctly documented:
- Sample rate / latency / worst render time / DMA late halves / stack margin:
- Maximum validated voices and stress duration for each patch:
- Quiet output / clipping / stuck notes / stability findings:
- Data compatibility / known limitations:
- License notices / exact corresponding source checked:
- Decision: FAIL / NEEDS WORK / QUALIFIED, with reason and evidence links:

Do not record private full-flash backups or personal data in the public repository.

## 26 October 2026 — outgoing switch to Felucca 1.6.1

The user approved GuitChordi -> Felucca 1.6.1 -> the same GuitChordi candidate,
pausing in Felucca for a sound check. Both package hashes, loader markers and the
existing private backup hash were verified before starting.

- Start: running FM-1_982, GuitChordi package SHA-256
  `330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`.
- Target: official Felucca 1.6.1, SHA-256
  `dff3a38f7e5b9833e15aba322558c9485e9e422e3ff813c616c91b3584a2d909`,
  matching its published release checksum.
- Ordinary MIDI update completed, reference installer exit 0, reboot identity
  FM-1_916. Separate post-install identity request: running FM-1_916.
- Cached macOS MIDI endpoint: X0X FM-1. No force override or rescue write used.
- Felucca sound/control confirmation: pending user feedback. Return leg approved
  but not yet performed. This does not establish V15 entry or complete the round trip.
- Local record: `build/device-prep/hub-roundtrip/results.json`.
