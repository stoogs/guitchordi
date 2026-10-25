# Planned tuning presets

Standard **E2 A2 D3 G3 B3 E4 (EADGBE)** remains the default. This list is a future specification; no tuning selector or pitch changes are introduced in the current simulator or first device build. These are string-tuning presets, not a microphone pitch-detection tuner.

| Preset | Six strings, low to high |
| --- | --- |
| Standard EADGBE | E2 A2 D3 G3 B3 E4 |
| Drop D | D2 A2 D3 G3 B3 E4 |
| Double Drop D | D2 A2 D3 G3 B3 D4 |
| Open D / Vestapol | D2 A2 D3 F#3 A3 D4 |
| Open G / Spanish | D2 G2 D3 G3 B3 D4 |
| Open E | E2 B2 E3 G#3 B3 E4 |
| Open A | E2 A2 E3 A3 C#4 E4 |
| DADGAD | D2 A2 D3 G3 A3 D4 |
| Open D minor | D2 A2 D3 F3 A3 D4 |
| Open G minor | D2 G2 D3 G3 Bb3 D4 |
| Open C | C2 G2 C3 G3 C4 E4 |
| Open D6 | D2 A2 D3 F#3 B3 D4 |
| Half-step down | Eb2 Ab2 Db3 Gb3 Bb3 Eb4 |
| Whole-step down | D2 G2 C3 F3 A3 D4 |

Open D/G/E/A and their minor variants cover common slide/blues approaches. Standard stays first and must restore on factory reset. Persist tuning with its own settings-version migration when implemented.

Future chord policy: regenerate/validate voicings for the selected tuning so chord names remain accurate. Applying six per-string offsets to the existing absolute MIDI voicings would change the advertised harmony. Muted strings and the 6+6+4 input mapping must be preserved. A separate open-string/free-play mode can directly use these six pitches. Machine-readable notes are in `tuning-presets.json`; the runtime does not load that file.
