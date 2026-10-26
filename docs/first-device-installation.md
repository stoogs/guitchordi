# First physical installation — 26 October 2026

With explicit user approval, the reviewed installer updated a working Felucca
1.6.1 unit (`FM-1_916`) to Guitchordi (`FM-1_982`). The installer completed with
exit code 0 after programming, restarting and querying the running identity.

Candidate SHA-256:
`30d522b0178b4446abc57ff9b31e7802017c32e9fc523daf2f1ebbd2d4a33b51`.

Before installation, recovery enumerated as `WL80UBOOT1.00` (`4C4A:8057`).
The backup-only rescue operation reported chip key `980F`, flash type 3 and
flash ID `856014`. Its 1,048,576-byte backup was preserved in ignored local
storage, checksummed and copied; its protected head matched pinned stock V15.
This was one device read, not two independent reads. No restore was performed.

Proven on this unit: Felucca recovery entry, full backup acquisition, incoming
Guitchordi update completion and post-reboot Guitchordi identity response.
Still pending: display/controls/audio checks, sustained operation, real-time
headroom, Guitchordi recovery entry, outgoing updates and actual restoration.
No release or Hub submission was published. Earlier qualification reports
record the pre-installation state; this checkpoint supersedes their statements
that no physical installation has occurred, without clearing remaining gates.

## Physical audio failure — STOP PLAYBACK

The user reported that the screen and controls worked, but audio was extremely
loud at roughly 5% master and intermittent (one or two notes, then silence).
The first-installed package is unsafe for continued audio testing. The user was
instructed to power off and disconnect external audio. Do not reinstall its
SHA-256 `30d522b0178b4446abc57ff9b31e7802017c32e9fc523daf2f1ebbd2d4a33b51`.

Code comparison with Felucca v1.6.1 found an extra eight-bit shift in our adapter.
Its identical codec HAL is used with signed 24-bit integer values by Felucca;
our adapter instead left-shifted them, wrapping the codec's low 24 bits. The
previous emulator criteria only counted nonzero words and therefore missed this
format error. A new test captures and interprets the compiled firmware's actual
PCM words, rather than treating nonzero audio as output qualification.

The cause of intermittent playback is not established. CPU deadlines, invalid
samples and physical master level need observations on hardware. Corrected local
builds do not establish acoustic safety or resolve the dropout report by themselves.

[Corrective build, PCM regression and remaining limits](fm1-audio-incident.md).
