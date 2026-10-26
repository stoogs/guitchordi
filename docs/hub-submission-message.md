# Hub submission message — ready for the user to send

To: zven@thefirmwarehub.com

Subject: GuitChordi — FM-1 chord/string instrument, beta submission

Hello,

I'd like to submit GuitChordi, by Stoogs, for the FM-1. It turns the device into
a chord and string instrument with sixteen synthesized sounds, fifty chord
styles, editable voicings and guitar tunings. Freeplay, Strum and Arp modes
include random partial chords and a three-stroke flourish.

- Repository: https://github.com/stoogs/guitchordi
- Release (GitHub prerelease): https://github.com/stoogs/guitchordi/releases/tag/v0.1.0-beta.1
- Firmware asset: `guitchordi-v0.1.0-beta.1.fwsc`.
- Identity: FM-1_982 (ordinary update loader included).
- License: GPL-3.0-only, with MIT/OFL/Apache notices retained:
  https://github.com/stoogs/guitchordi/blob/v0.1.0-beta.1/NOTICES.md
- Picture: https://stoogs.github.io/guitchordi/assets/boot-screen.png (240 × 240).
- Play: https://stoogs.github.io/guitchordi/emu/
- Manual: https://stoogs.github.io/guitchordi/manual/
- Cheatsheet: https://stoogs.github.io/guitchordi/manual/Guitchordi-Cheatsheet-A4.pdf

The exact 609684-byte candidate, SHA-256
330396f043093bcdda65aacbd0098dd1fc1f253a17d5707db19ff5d971e05217,
has been tested on one real FM-1: installation from stock V15 and Felucca 1.6.1,
outgoing ordinary update to Felucca and return, reboot and independent USB MIDI
identity checks. The user confirmed playing and reports 2511 us peak rendering,
zero late buffers and zero invalid samples during dense jazz/pattern playing.
This is an observed session, not exhaustive CPU/stack qualification.

The physical unplug-during-write/resume test in the KB is not yet performed;
we have simulated interruption tests, recovery USB enumeration and a verified
private full-flash backup, but do not claim physical resume/restoration proof.
Please advise whether physical resume testing is required before beta listing.

Device SAVE is RAM-only, and USB performance MIDI/audio are not implemented.
It does not import other firmwares' projects or samples or promise preservation.
These limits are documented publicly. The package is locally built, without a
GitHub build attestation. Complete corresponding source is browsable at the matching release tag, with
an additional source archive and full license notices attached to the release.

Thanks,
Stoogs

---

Sending status: **user-confirmed sent on 26 October 2026**. The user sent the
message themselves and reported “ok sent”; the agent did not send it or
independently inspect the sent message. Hub acceptance/listing remains pending.
The beta was published with explicit user authorization. All five asset sizes
and GitHub SHA-256 digests match the local prepared assets, and a download of
the public firmware matched the exact tested package. This is a request for
listing with a disclosed physical-resume test gap, not a claim of acceptance.
