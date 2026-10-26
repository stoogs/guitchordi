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

## 26 October 2026 — return from Felucca to GuitChordi

The user confirmed Felucca was running fine. Under the existing round-trip
approval, the exact GuitChordi package
`330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`
was reverified and installed from running FM-1_916. Ordinary MIDI installation
completed with exit 0 and rebooted into FM-1_982. A separate identity request
confirmed running FM-1_982 on the cached X0X FM-1 endpoint.

Both update directions now have successful transport/reboot/identity evidence;
Felucca has user-confirmed operation. Post-return GuitChordi audio/control check
is pending. V15 entry remains untested. No release or Hub submission performed.

The user subsequently confirmed post-return GuitChordi works fine. The final
GuitChordi -> Felucca 1.6.1 -> identical GuitChordi round trip is complete with
installer/reboot/identity evidence and user-confirmed operation on both sides.
V15 entry and sustained worst-case deadline measurements remain open.

## 26 October 2026 — V15 route review, no device write

The pinned stock V15 package was rechecked: 699956 bytes, SHA-256
`db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a`.
Felucca upstream at commit `a53ecf428c29c780108fd70a31b71a32a6b5c313`
uses the identical size/hash allowlist in `web/fm1pkg.js`. Its
`web/index_pkg.html` stock return path validates that package, exports a
complete Felucca archive, then uses the ordinary two-stage MIDI updater
(`web/fm1ota.js`) and verifies the resulting identity. The running-firmware
path refuses firmware without its archive-export capability. Our existing
private full-flash backup is a different backup format and does not establish
that browser capability in GuitChordi.

The retained Python installer's default package guard rejects stock because
it lacks the Felucca loader marker. Its generic force flag has not been used.
No claim is made that this guard is proof of an incompatible wire protocol.
Before a stock test, choose and verify either upstream's Felucca backup/stock
return path or a strictly allowlisted equivalent. Do not bypass the guard
blindly. A V15 installation and return still need separate user approval.
No V15 write, rescue restoration, release or Hub submission was performed.

## 26 October 2026 — stock-test staging reached Felucca

Under explicit user approval to proceed through Felucca to V15 and stop, the
verified Felucca 1.6.1 package was installed from GuitChordi. Installer log
reports completed write and reboot to FM-1_916; a separate identity request
confirmed running FM-1_916 after the interrupted browser-control attempt.
The user also confirmed Felucca is running. Stock V15 package size/hash
were reverified. Native Brave UI access timed out; no stock installation or
new musical archive export was performed by the agent. The original verified
private full-flash backup remains available. V15 entry remains untested.
Local progress record: `build/device-prep/hub-roundtrip/v15-progress.json`.

## 26 October 2026 — stock V15 entry to final GuitChordi candidate

The user reports the official backup/return-to-V15 procedure worked in Chrome
(Firefox did not), and stock firmware worked great. The agent did not observe
the browser backup download or its contents; that export remains user-reported.
A separate MIDI identity request independently confirmed running FM-1_015 on
the newly enumerated FM-1 endpoint before any return write.

The user requested continuing. The unchanged 609684-byte candidate SHA-256
`330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`
and Felucca loader marker were reverified. Ordinary MIDI installation from
V15 completed with exit 0 and reported reboot to FM-1_982. A separate identity
request confirmed running FM-1_982 (macOS endpoint returned to X0X FM-1).
No force override or rescue restoration was used.

V15 -> exact final candidate now has physical transport/reboot/identity evidence.
Post-return user sound/control confirmation is pending. This does not prove
worst-case processor timing, stack margin or physical recovery restoration.
Installer log: `build/device-prep/hub-roundtrip/v15-to-guitchordi.log`.
No firmware release or Hub submission performed.
