# GuitChordi Hub launch packet — draft, not submitted

Checked against https://thefirmwarehub.com/submit/ and https://thefirmwarehub.com/kb/
on 26 October 2026. Public browser hosting is live. Firmware publication remains
awaiting final release review and explicit publication approval. Hardware update
paths and a user-reported stress session are recorded in the hardware test log.

## Proposed card / message material

Firmware: **GuitChordi**. Author: **Stoogs** (confirm preferred card credit before sending).
Repository: https://github.com/stoogs/guitchordi
Play: https://stoogs.github.io/guitchordi/emu/
Guide: https://stoogs.github.io/guitchordi/manual/
A4 controls: https://stoogs.github.io/guitchordi/manual/Guitchordi-Cheatsheet-A4.pdf
240x240 screen: https://stoogs.github.io/guitchordi/assets/boot-screen.png
Licence: GPL-3.0-only, with MIT DSP, OFL fonts and Apache-2.0 platform notices retained.
Full attribution/source: https://stoogs.github.io/guitchordi/licenses.html
Identity: **FM-1_982**, provisional. It was absent from the fully loaded live Hub
identity table (105 rows) on 26 October 2026. This is a current collision check,
not a reservation; recheck before release. Rechecked against all 105 actual
`product` identities in the catalogue updated 26 October 2026, 21:01 UTC: no
FM-1_982 match. Broad installer `ident` regular expressions are not ownership
reservations and were not used as actual product identities.
Proposed version: **v0.1.0-beta.1**, not published.
[Release notes](release-v0.1.0-beta.1.md) · [Unsent submission message](hub-submission-message.md).
Release URL: **not published**. Tested package SHA-256:
`330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`.

GuitChordi turns the M-VAVE FM-1 into a chord and string instrument with sixteen
synthesized sounds, fifty chord styles, editable voicings and guitar tunings.
Play directly, repeat strums, or explore arpeggios and random partial-chord pulses.
The browser version runs the shared C instrument and needs no device.

`fmhub.json` supplies draft card text, the chords category and the HTTPS demo.
No mail has been sent, tag pushed, firmware release published or submission made.

## Required before sending

1. Install and play the exact final package on the real unit: all controls,
   all sixteen sounds, three new chord-pulse patterns, muted parts, sustained
   fourteen-voice load and low-to-high master sweep. Record the exact hash.
   Check the increased output level and Steel tails by ear; local tests cannot.
2. V15 -> exact final candidate completed on 26 October: independent starting
   identity FM-1_015, ordinary updater exit 0, reboot and independent identity
   FM-1_982. The user subsequently exercised jazzy chords, patterns and timing,
   reporting peak render 2511 us, L 0, BAD 0. This leaves about 13.5% of the
   audio-half deadline at the observed peak; it is not an exhaustive timing or
   whole-CPU utilization proof. Entry from Felucca is also proven for this exact
   binary. Session duration, all-patch coverage and stack margin remain unrecorded.
3. Completed on 26 October: exact final candidate SHA-256
   `330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217`
   -> official Felucca 1.6.1 -> identical candidate. Both installers exited 0,
   independent identities matched (916 / 982), and the user confirmed operation
   on both sides. V15 entry is recorded above. Do not induce physical power failures.
4. Confirm USB MIDI identity uniqueness; retain protected-sector/update-loader
   checks and the private device backup. Document RAM-only SAVE and inability
   to read other firmwares' projects/samples in the release notes.
5. Only after approval: publish a versioned beta `.fwsc`, checksum, matching
   source archive, notices and honest hardware evidence; then send these links
   with the approved author credit to the Hub contact listed on the submission page.

The Hub requires real-device entry from V15 and another firmware, plus an outgoing
update. It does not test third-party firmware. Optional shared-workflow signing is
separate from qualification; do not add an auto-release workflow before its build
has been verified and release is approved.

## Additional KB requirement found during final review

The KB checked again on 26 October explicitly asks for unplug-during-writing /
resume on real hardware. That test remains unperformed. Existing local
interruption simulation and ordinary round trips must not be labelled as the
physical test. Do not start it without specific approval. Before claiming full
Hub qualification, perform a separately reviewed/approved test or ask the Hub
maintainer whether beta listing can proceed with this disclosed gap.

The local release folder is `build/releases/v0.1.0-beta.1/`. It contains only a
renamed copy of the tested package, complete source archive, full notices, release
notes, qualification metadata and checksums. Preparation does not publish a tag,
create a GitHub release or send a message. The source archive is bound to the
recorded commit; only documentation changed since the tested application commit.

## Published beta checkpoint — 26 October 2026

The user requested submission, then chose to send the prepared email themselves.
The exact source commit `09a4f170d76e7e6b1fad6cb3f3609553eabaf498` is now tagged
`v0.1.0-beta.1`. The GitHub prerelease is published:
https://github.com/stoogs/guitchordi/releases/tag/v0.1.0-beta.1

It contains the unchanged tested firmware, matching source archive, review ZIP
with licenses/evidence, qualification snapshot and SHA256SUMS. All five public
asset sizes and GitHub digests were verified against the prepared files; a
download of the public firmware independently matched the tested package hash.
The preparation-state fields in the archived source/qualification snapshot
describe the prepublication state; this checkpoint records publication. No
firmware rebuild or device write occurred. No Hub email has been sent by the
agent, and Hub acceptance/listing is not established. The physical interruption
test was explicitly declined by the user and remains clearly disclosed.
