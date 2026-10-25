# Guitar tuning presets

Standard **E2 A2 D3 G3 B3 E4 (EADGBE)** remains the default. Press **GLO**, turn **K3** to choose a tuning, then press **SEL** to return Home. The active tuning is shown above the main chord on every page. The shared C simulator and experimental device build use the same tuning tables. These are string-tuning presets, not a microphone pitch-detection tuner.

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

Open D/G/E/A and their minor variants offer slide/blues layouts. Standard is first and remains the factory default. SAVE remembers tuning in the browser; old saves migrate to Standard. Device SAVE remains RAM-only. ENV lock blocks tuning changes. Changing instrument or chord style keeps the tuning selection.

Each tuning has six precomputed guitar shapes for each of the 294 named chords. Every shape preserves the original chord's exact pitch-class set, uses open strings or a four-fret hand window, and has at most four distinct stopped frets. Muted strings and the 6+6+4 contact mapping remain supported. Standard's existing voicings are byte-for-byte unchanged. Shape choice still belongs to each chord slot; tuning changes its corresponding grip, without overwriting the saved chord assignment. Ringing notes finish at their original pitches; new attacks use the selected tuning.

Tuning changes string layout, bass availability and chord voicing; it does not transpose the named chord. Even half/whole-step-down presets preserve the displayed chord names. To lower the entire instrument/song, use FX K2 Transpose. This remains a chord/strum instrument: playing a song's harmony is supported, but arbitrary guitar riffs or a low-D pedal underneath a different chord are not automatically recreated.

The machine-readable source is `tuning-presets.json`. Builds generate compact fret tables in flash; there is no voicing search, allocation or table copying in the audio callback. Snapshot v10 adds a tuning index (45 words); v1–v9 restore to Standard. Tests cover all 24,696 shapes / 148,176 string pitches, exact pitch classes, fret bounds, low Drop-D bass, all-open Open D, silent switching, persistence, lock and setting independence.
