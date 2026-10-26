# GuitChordi Hub launch packet — draft, not submitted

Checked against https://thefirmwarehub.com/submit/ and https://thefirmwarehub.com/kb/
on 26 October 2026. Public browser hosting is live. Firmware publication remains
blocked on the final hardware qualification, not on website availability.

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
not a reservation; recheck before release.
Release URL, version and tested package SHA-256: **pending qualification**.

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
   FM-1_982. Post-return user sound/control confirmation is pending. Entry from
   Felucca is also proven for this exact binary. See the hardware test log.
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
