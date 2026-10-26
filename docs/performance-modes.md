# Freeplay, Strum and Arp

Factory settings are Nylon Acoustic at 60% intensity, Classic Rock, standard EADGBE, 90 BPM, Down, 1/8, FREE and 50 ms sweep. Strum is the factory mode; saved settings override these defaults.

Press ARP to cycle Freeplay → Strum → Arp → Freeplay. Turn SELECT to adjust BPM directly. Modes and their parameters are owned by the same C application in the browser and experimental FM-1 build.

In Freeplay, black keys select chords silently and only the white keys you touch attack. In Strum and Arp, hold a black chord key to repeat that chord. A quick tap completes one strum or plays the first arp note. Releasing the last chord key stops new repeats; a started strum completes, and gated notes finish their release. A new chord press starts its phrase immediately. White keys remain directly playable in every mode.

| Mode | Knob 1 | Knob 2 | Knob 3 | Knob 4 |
| --- | --- | --- | --- | --- |
| Freeplay / FX page | Intensity | Transpose | Shared room | Per-slot voicing |
| Strum play page | Six patterns | Beat division | Gate | Strum sweep (ms) |
| GLO global settings | Gate tails On/Off | Strum humanity | Guitar tuning | Rhythm velocity |
| Arp play page | Nine patterns | Beat division | Gate | Swing |

Strum patterns: Down, Up, Alternate, Block, Bass + chord, Shuffle. Down/up follow the six string positions, skipping explicit mutes. Bass + chord separates the bass from the remaining simultaneous notes. K4 sets the requested whole-stroke sweep from INSTANT (0 ms), then 5–250 ms in 5 ms steps (default 50 ms). Repeat tempo/division and gate do not set this sweep. At extreme repeat rates the stroke fits within the current step, preventing queued notes spilling into the next stroke. Block stays simultaneous, and Bass + chord uses the sweep to separate its two attacks. Humanity remains available in GLO as a global 0–100% setting in ten-point steps; default 20%. It adds small timing/attack-strength variations, not pitch detuning or distortion.

Arp patterns: Up, Down, Up-down, Down-up, Outside-in, Random, Random Half Chord, Random Two-thirds and Full Chord. The last three pulse several chord parts together: half (rounded up), two-thirds (rounded up), or all sounding parts. Partial groups are randomly chosen without duplicate parts per tick. With six sounding parts this gives 3, 4 or 6 notes. They use the currently selected chord/voicing and skip muted parts. Swing is a 0–60% amount in five-point steps; zero is straight. Alternating long/short steps preserve each pair's total beat length.

Both modes offer 18 divisions: 1/1, 1/2, 1/4, 1/8, 1/16 and 1/32, each in straight, dotted (D) and triplet (T) variants. Dotted steps last 1.5 times the straight step; triplets last two-thirds. Gate defaults to FREE: each note uses its natural instrument envelope and can ring across subsequent steps. Knob 3 also offers 25%, 50%, 75% or 100% of the current step interval, with a short release to avoid clicks. GLO K1 turns percentage-gate tails On/Off globally. Off keeps the short gated release. On appends a soft, naturally decaying release (up to 400 ms for most patches, 500 ms for Violin, 700 ms for Harp); percentage still sets the hold portion. A patch can decay sooner. FREE is unaffected and uses its normal full lifetime. Changing this option affects subsequent notes; PLAY still damps everything. Each mode remembers its own four parameters.

## Tempo and other controls

Tempo defaults to 90 BPM. Turn SELECT for 40–240 BPM directly, with no confirmation step. LFO is reserved for future use. SEL remains contextual OK. Tempo changes affect subsequent scheduled intervals. MASTER always controls volume.

FX toggles between the ordinary intensity/transpose/room/voicing controls and Home without replacing rhythm settings or interrupting playback. HOME returns to the performance page. GLO opens global settings: K1 Gate tails, K2 Humanity, K3 Tuning, K4 Strum/Arp velocity (1–100%, default 80%); SEL, GLO or HOME returns to play. Gate tails defaults Off, retaining earlier percentage-gate behaviour. ARP cycles all three performance modes. EDIT retains chord assignment and hold-to-reset functionality. The four labelled lines beside the slightly smaller main chord show PAT, DIV, GATE and STRM/SWNG.

PLAY or Escape damps sound and clears pending rhythm notes. A chord held through PLAY must be released and pressed again before restarting. Switching performance modes also clears pending automatic notes. No automatic voices are started merely by turning knobs, changing an instrument or restoring saved settings.

## Lock and saving

Hold ENV continuously for three seconds to lock or unlock the chord. The lock icon warms from amber toward red during the hold; there is no horizontal progress bar. Releasing early cancels. A continuous long hold toggles once. Locked chord selection/voicings remain fixed, while rhythm parameters and tempo remain editable.

SAVE stores performance mode, BPM, both parameter banks and the existing per-slot voicings/settings in a version-12, 46-word browser snapshot. Version-6 rhythm saves migrate their original beat divisions. V6/v7 saves move the old Humanity K4 value into globals and start sweep at 50 ms, with gate tails Off. V8 saves migrate sweep from 25 ms units to 5 ms units. V9 saves keep sweep, gate tails and humanity separately; v10 adds independent tuning; v11 adds rhythm velocity (older snapshots default to 80%); v12 adds three Arp chord-pulse patterns, with older snapshots defaulting to Standard EADGBE. Old 21-word (v1–v4) and 32-word (v5) saves remain accepted, defaulting to Freeplay / 90 BPM / factory rhythm settings. Restoring a rhythm mode does not start playback. Device SAVE is still RAM-only pending flash persistence.

## Validation and device boundary

The scheduler uses a fixed six-note queue and integer sample timing, without runtime allocations or browser timers. Its segmented render path returns one stable audio buffer. Automatic notes use natural envelopes in FREE, or gated envelopes for percentage settings and the same fourteen-voice pool; manual voices retain their ordinary finite tails. The processor toolchain lacks variable unsigned 64-bit division, so tempo/swing calculations use equivalent bounded 32-bit arithmetic.

`npm run test:rhythm` covers all 1,350 pattern/division/gate configurations, onset timing, gate lengths and optional release tails, independent strum sweep, FX toggling, swing pair timing, tap/hold/release behavior, mode changes, held-key stop suppression, per-mode parameter recall, snapshots and the three-second lock colour ramp. Native and WASM rhythm audio match exactly across 409,600 samples; native stress also runs under UBSan. Freeplay and sixteen-instrument regression audio remain exact. These checks do not establish FM-1 CPU/latency capacity; physical measurements are still required.

GLO K3 selects one of fourteen [guitar tunings](tuning-presets.md). The current tuning appears above the main chord. This changes the string voicing while preserving the named harmony; use FX transpose for changing the song key.


## Attack velocity and factory reset

In Strum and Arp, automatic notes and normal white strum keys use an 80% attack by default. Soft keys use half that strength (40% at default), and accent keys use 1.25 times the strength (100% at default), capped at 100%. GLO K4 adjusts the common rhythm velocity in one-point steps, independently of tone Intensity. Freeplay retains its existing soft/normal/accent strengths. Strum humanity adds its existing small variations around the selected velocity, bounded to 1–100%. The current device input reports binary presses; this is attack-level control, not measured pressure or strike velocity. Attacks still start immediately through the existing audio path.

Hold GLO continuously for three seconds to open **Reset everything?**. Nothing resets until a fresh SEL press. HOME cancels. The prompt stops sound and blocks playing, knobs and preset changes. Confirmation restores instrument, style, all chord slots and voicings, tuning, transpose, lock, tempo, mode, rhythm banks, effects, master and global settings. It publishes a fresh browser save so a reload retains factory settings. Browser-only visuals and mute preferences are separate. Device snapshots remain RAM-only. Held GLO cannot open the prompt again until released; keys held during reset must be released before playing again.

The first white contact of each soft/normal/accent lane (keys 1, 7, 13) has a small top light in the browser and a dim hardware LED. Muted contacts remain dark; a press overrides the home light.
