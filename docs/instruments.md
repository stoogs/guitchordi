# Guitchordi instruments and chord voicings

Choose an instrument with ALGORITHM. PRESETS chooses the chord style. Instrument, transpose, intensity and room remain independent of style changes.

All sixteen instruments now expose all six chord parts, using the same 6 soft / 6 normal / 4 accent contacts and fourteen shared voices. Violin, cello and bass no longer reduce chords to four parts. Non-guitar keys show their actual pitches. Explicit muted parts remain silent; six string positions can contain duplicate pitch classes.

## Knob 4 in Freeplay / FX: per-slot voicing

Press a black key, then turn KNOB 4 to choose Shape 1–6. Each of the eleven slots remembers its own selection when switching between chords. MASTER is the only physical output-level control. Shape 1 is the original factory voicing. The other five change the standard-EADGBE string placement and register while preserving every pitch class present in the factory voicing. They are generated across different neck positions; choices can include bass inversions and different muted strings.

Changing shape affects new attacks only. It does not retrigger notes, retune ringing voices, alter the instrument or change transpose. Chord lock blocks shape editing. SAVE stores all eleven choices and the current settings in the browser; device SAVE remains RAM-only pending flash persistence. Changing style loads that style's factory slots and Shape 1, as with existing slot edits. EDIT reassignment resets that slot to Shape 1. Hold EDIT for 1.2 seconds, choose This slot / All slots with PRESETS and confirm with SEL to restore factory chord assignment(s) and shape(s); HOME cancels.

Version-6 snapshots contain 42 words, including rhythm mode, BPM and the two pattern parameter banks. Original 21-word v1–v4 and 32-word v5 saves remain accepted and initialise all slot shapes to their factory choices. Old intensity values migrate into the current neutral-50 range. Invalid chord/shape data is rejected before state changes.

## Patches

| # | Instrument | Character | Parts | Register |
| --- | --- | --- | --- | --- |
| 1 | Wood | Mellow original plucked string. | 6 | +0 semitones |
| 2 | Wire | Bright original plucked string. | 6 | +0 semitones |
| 3 | Glow | Synthetic original string colour. | 6 | +0 semitones |
| 4 | Nylon Acoustic | Warm fingerpicked attack, clear upper strings and a fuller ringing body. | 6 | +0 semitones |
| 5 | Steel Acoustic | Brighter pick and ringing steel-like string. | 6 | +0 semitones |
| 6 | Jumbo Acoustic | Rounder low end and an open ringing tail. | 6 | +0 semitones |
| 7 | Palm Muted | Short, damped attacks for tight rhythmic playing. | 6 | +0 semitones |
| 8 | Clean Electric | Clean electric-like picked string. | 6 | +0 semitones |
| 9 | Round Jazz Guitar | Soft, dark attack for round jazz chords. | 6 | +0 semitones |
| 10 | Crunch Electric | Picked strings with gentle per-voice saturation. | 6 | +0 semitones |
| 11 | Heavy Electric | Harder saturated attack with controlled decay. | 6 | +0 semitones |
| 12 | Harp | Clear ringing plucks across six chord parts; intensity stays clean. | 6 | +12 semitones |
| 13 | Violin | Clean sustained violin-style harmonics with a smooth swell; intensity adds no distortion. | 6 | +12 semitones |
| 14 | Pizzicato Cello | Six plucked chord parts in a low cello register. | 6 | -12 semitones |
| 15 | Electric Bass | Six chord parts in a bass register. | 6 | -12 semitones |
| 16 | Dulcimer | Bright hammered-string-inspired colour. | 6 | +12 semitones |

Register changes preserve pitch classes and fold pitches into MIDI 24–96. Standard EADGBE remains the guitar reference; alternate string tunings are still planned. These are lightweight synthetic instruments. Violin uses a bounded four-harmonic source with a smooth swell/release; the other patches use the MIT string model.

Knob 1 defaults to 50%. Below neutral is softer/darker; above neutral adds brightness and compensated drive to the guitar/synthetic patches. Harp and Violin keep their clean waveform above 50%, with a gentle level increase to 100%. MASTER changes output level; Knob 4 changes chord voicing.

ENV held three seconds locks/unlocks chords. SEL is contextual OK, EDIT opens assignment/reset controls. Space holds ENV; Enter confirms with SEL when a focused control has not consumed it.

## Validation

All 294 chords have six distinct shapes (1,764 total), with identical pitch-class sets to each original. All 169,344 shape/instrument/part combinations match the shared C pitch mapping. Tests cover separate per-slot recall, SAVE/reload, legacy migration, lock protection, unchanged MASTER, no invented attacks and reset behavior. The instrument suite compares 2,867,200 native/WASM samples exactly, checks all 140,800 original-shape instrument/style/slot/key combinations and runs 20,000 mixed-patch/intensity retriggers under UBSan. Six-note intensity sweeps remain finite and unclipped. FM-1 execution and real-time headroom remain unmeasured.

Catalogue: `web/instruments.json`, authored with `scripts/create-instrument-library.py`. Shapes are generated by `scripts/generate-firmware-bank.py`. Run `npm run test:simulator`, `npm run test:instruments` and `npm run review:instruments` for checks and audition files.

ARP cycles Freeplay / Strum / Arp; SELECT directly adjusts BPM. In Strum/Arp, Knobs 1–4 become pattern/division/gate/humanity-or-swing controls. FX returns to the ordinary tone/voicing knobs. See [performance modes](performance-modes.md).
