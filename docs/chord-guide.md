# Next-chord guide

The eleven chord names on the device LCD now suggest what might follow the selected chord. The current chord stays gold. There are no bars beside the slot numbers. Other slots use light green (smooth/strong), amber (colour change) or soft red (adventurous). The browser chord cards and black keys show the same guidance, with explanations on hover and accessibility descriptions.

These are suggestions, not correctness judgements. A curated style is a related palette, not a guarantee that every change is equally settled or that every chord uses one scale. Jazz After Hours includes chromatic chords such as D7b9, G9 and Eb13 as well as chords within F major. Rhythm, melody, voicing and the phrase's destination still affect how a change feels.

The shared C application uses a small, deterministic heuristic:

- Shared sounding pitch classes and short pitch-class movement reward continuity.
- Ascending fourths/descending fifths reward circle movement.
- Dominant-to-tonic, leading diminished-to-tonic, and tritone-substitute resolutions receive a further boost.
- The declared style key supplies a soft scale-fit preference; minor tonic styles use natural minor, Jazz Modal uses Dorian, blues expands the palette, and C/G uses both major scales.
- The current tonic and tonic-to-predominant motion receive modest preferences.

The thresholds are product choices, not trained probabilities. No chord is disabled, quantized or changed. Red means more tension, not bad. It cannot judge a melody being played elsewhere or infer a complete song's harmony. Changing a chord slot updates its suggestions; transposing the entire instrument or choosing another voicing keeps its harmonic relationships. Suggestions are relative to the currently selected chord, even before playing it. ENV lock still holds chord selection.

For example, C13 → Fmaj9 and D7b9 → Gm9 are highlighted as resolutions in Jazz After Hours. Common-practice harmonic function and circle motion are described in [Open Music Theory](https://open-musictheory.github.io/docs/harmony/harmonicFunctions/) and the [University of Wisconsin MACRO tutorial](https://macromusic.dcs.wisc.edu/tutorials/harmonicprog.html). The guide is a deliberately simplified application of those ideas across the instrument's wider styles.

## Device lights and implementation

FM-1 key LEDs are monochrome. The adapter maps green/high to full brightness, amber/medium to half the scan frames, and red/low to one sixth. Selected or physically pressed keys are full brightness. This scan-based modulation uses the existing timer and dim LED layer; there are no waits in the audio callback. Actual perceived contrast and physical key mapping remain unverified until hardware testing.

The guide runs on UI/LED polling, caches the eleven slot relationships, and uses compact root/pitch-class metadata. It performs no per-sample work and allocates no runtime memory. The 14-voice DSP and automatic rhythm scheduler are unchanged.

Validation covers all 6,050 style/current/candidate combinations, known resolutions, edited slots, voicing/transposition invariance, level bounds and absence of audio attacks. Native/UBSan and WASM checks pass; existing Freeplay audio stays exact. The FM-1 target compiles, but physical operation is still unverified.

## FM-1 LED contrast follow-up

The working beta checkpoint is `0861137`. The next source change uses full,
one-quarter and one-twelfth matrix-frame duty for high/medium/low suggestions,
increasing their separation. Idle function buttons use the faint tier;
active functions and pressed/selected note keys use full brightness. Hardware
LEDs are monochrome; the screen retains green/amber/red guidance. The source
scheduler is tested over repeated full cycles, but visual brightness and flicker
are pending physical validation. This change does not alter audio levels.

Local target build, LED duty-cycle checks, PCM safety/update tests and compiled
processor boot/note/PCM capture pass. LED package SHA-256:
`98cc4ee9b4ab4b74ba531d38f81449a2dd58a23dcfa0930abb574da9aab6d043`. Not installed; visual contrast remains unverified.
