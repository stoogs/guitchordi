# Chord styles

The firmware simulator has 50 harmonic banks. Choose CHORD STYLE or turn PRESETS; the eleven black keys select the chords shown in order below. Each bank also recommends a tone and room level. Playing remains direct: white-key contact creates the string attack.

SAVE stores the active bank and its current edits. Switching banks loads factory slots. The catalogue is `web/styles.json`; six-string MIDI voicings and explicit mutes are in `web/chords.json`. `scripts/create-style-library.py` deliberately regenerates both authored files; edit its recipes first if using that authoring path. Builds only compile the JSON with `scripts/generate-firmware-bank.py`.

| # | Style | Family | Key | Black keys 1–11 |
| --- | --- | --- | --- | --- |
| 1 | Original Sixstring | Original | C / G | C, G, D, Am, Em, F, Dm, A, E, G7, B7 |
| 2 | Jazz Essentials | Jazz | C | Cmaj7, Dm7, G7, Am7, Fmaj7, Em7, Bm7b5, E7, A7, D9, G13 |
| 3 | Jazz After Hours | Jazz | F | Fmaj9, F6, Gm9, C13, Dm9, Bbmaj7, Am7, D7b9, G9, Eb13, Edim7 |
| 4 | Jazz ii V I | Jazz | Bb | Cm7, F9, Bbmaj7, Gm7, Cm9, F13, Bbmaj9, Ebmaj7, D7, G7b9, Am7b5 |
| 5 | Jazz Minor | Jazz | D | Dm9, Gm7, A7b9, Bbmaj7, Em7b5, C9, Dm6, Fmaj7, A7#9, Bb6, C#dim7 |
| 6 | Jazz Bossa | Jazz | G | G6, Am9, D9, Bm7, E7, Am7, D13, Gmaj9, Cmaj7, C#dim7, F9 |
| 7 | Jazz Modal | Jazz | D | Dm7, Dm9, G9, Cmaj7, Fmaj7, Am7, Bbmaj7, Em7, Gm7, Dsus2, D7sus4 |
| 8 | Jazz Soul | Jazz | F | Fmaj9, Dm9, Gm9, C13, Bbmaj9, Am7, Eb9, D7#9, Bbm6, Dbmaj7, C7b9 |
| 9 | Jazz Altered | Jazz | C | Cmaj7, Dm7, G7b9, G7#9, Db7, E7#9, A7b9, Dm7b5, Fm6, Bdim7, Cmaj9 |
| 10 | Lo-fi Bedroom | Lo-fi | C | Cmaj7, Am7, Fmaj7, Dm7, Em7, G7sus4, Cmaj9, Am9, F6, Bbmaj7, G9 |
| 11 | Lo-fi Rainy Day | Lo-fi | F | Fmaj9, Dm9, Gm7, C9, Bbmaj7, Am7, Dbmaj7, Bbm6, F6, Ebmaj7, C7sus4 |
| 12 | Lo-fi Tape Haze | Lo-fi | Eb | Ebmaj7, Cm7, Abmaj9, Fm9, Bb13, Gm7, Dbmaj7, Bmaj7, Eb6, Abm7, Bb7b9 |
| 13 | Lo-fi Late Train | Lo-fi | Bb | Bbmaj9, Dm7, Gm9, Cm7, F9, Eb6, Abmaj7, Ebm6, Dbmaj7, F7sus4, Bbmaj7 |
| 14 | Lo-fi Dusk | Lo-fi | A | Am9, Dm7, Gmaj7, Cmaj7, Fmaj9, E7sus4, Am7, Bm7b5, E7b9, Dm9, G6 |
| 15 | Lo-fi Dusty Soul | Lo-fi | D | Dmaj9, Bm9, Em9, A13, Gmaj7, F#m7, C9, Gm6, Bbmaj7, D6, A7#9 |
| 16 | Light Rock | Rock | G | G, D, Em, C, Am, Bm, Gadd9, Dsus4, Cadd9, Em7, D7 |
| 17 | Classic Rock | Rock | E | E, B, A, D, G, C#m, F#m, E7, B7, Asus4, E5 |
| 18 | Hard Rock | Rock | E | E5, G5, A5, D5, B5, C5, F#5, Em, A, B7, E7#9 |
| 19 | Heavy Rock | Rock | D | D5, Eb5, F5, G5, A5, Bb5, C5, Dm, Gm, A7, Dsus4 |
| 20 | Indie Rock | Rock | A | Aadd9, Esus2, F#m7, Dmaj7, Bm7, A, E, Dsus2, G, C#m, Esus4 |
| 21 | Alternative Rock | Rock | C | C5, Ab5, Eb5, Bb5, F5, G5, Cm, Abmaj7, Fm, Bbsus2, G7 |
| 22 | Southern Rock | Rock | G | G, F, C, G7, C7, D7, Bb, D, Em, G6, F9 |
| 23 | Garage Rock | Rock | A | A5, D5, E5, C5, G5, A7, D7, E7, Am, B, A |
| 24 | Dream Rock | Rock | D | Dadd9, Asus2, Bm9, Gmaj7, Em7, Dmaj9, Asus4, Gadd9, Cmaj7, F#m7, Dsus2 |
| 25 | Stadium Rock | Rock | D | D, A, Bm, G, Dsus2, Asus4, Gadd9, Em, C, D5, A5 |
| 26 | Delta Blues | Blues | E | E7, A7, B7, E, A, B, Em, D, G, B9, E7#9 |
| 27 | Memphis Blues | Blues | Bb | Bb9, Eb9, F13, Bb7, Eb7, F7, G7, C9, D7, Edim7, Bb6 |
| 28 | Chicago Blues | Blues | A | A7, D9, E9, A9, D7, E7, Am7, C, G, E7#9, A6 |
| 29 | Texas Blues | Blues | E | E7#9, A7, B9, E7, A9, B7, Em7, G7, D, F#9, E6 |
| 30 | Jump Blues | Blues | F | F6, Bb9, C13, F9, Gm7, C9, D7, G9, Bdim7, Bb6, F7 |
| 31 | Slow Blues | Blues | G | G9, C9, D7b9, G7, C7, D9, Gm7, Bb7, Eb7, Am7, D13 |
| 32 | Minor Blues | Blues | A | Am7, Dm7, E7, Am9, Dm9, F7, G7, E7b9, Bm7b5, Cmaj7, Am6 |
| 33 | Jazz Blues | Blues | C | C9, F9, C13, F#dim7, Dm7, G13, Em7, A7b9, D9, G7#9, C6 |
| 34 | Pop Essentials | Pop | C | C, G, Am, F, Dm, Em, Cadd9, Gsus4, Fadd9, Am7, C6 |
| 35 | Bright Pop | Pop | G | G, D, Em, C, Am, Bm, G6, C6, Gadd9, Dsus2, D7 |
| 36 | Indie Pop | Pop | D | Dmaj7, Aadd9, Bm7, Gmaj7, Em7, F#m7, Dadd9, G6, Cmaj7, Asus4, D6 |
| 37 | Dream Pop | Pop | A | Amaj9, Esus2, F#m9, Dmaj7, Bm9, C#m7, Aadd9, Dadd9, Gmaj7, E7sus4, A6 |
| 38 | Dark Pop | Pop | A | Am, F, C, G, Dm, E7, Am9, Fmaj7, Cadd9, Gsus2, Bm7b5 |
| 39 | Synth Pop | Pop | E | Em7, Cmaj7, Gmaj7, Dsus2, Am7, Bm7, Em9, Cadd9, Gadd9, B7, F#m7b5 |
| 40 | Acoustic Pop | Pop | D | D, A, Bm, G, Em, F#m, Dsus2, Gadd9, Asus4, Bm7, Dadd9 |
| 41 | Pop Ballads | Pop | F | Fmaj7, Csus4, Dm7, Bbmaj7, Gm7, Am7, Fadd9, Bbm6, Dbmaj7, C7, F6 |
| 42 | Soul Classics | Soul | F | F6, Dm7, Gm7, C9, Bbmaj7, Am7, D7, G9, Eb9, Bbm6, Fmaj9 |
| 43 | Neo Soul | Soul | Eb | Ebmaj9, Cm9, Fm9, Bb13, Abmaj9, Gm7, Db13, C7#9, Abm9, Bmaj7, Bb7b9 |
| 44 | Memphis Soul | Soul | Bb | Bb6, Eb6, F9, Gm7, Cm7, Dm7, Bb9, Eb9, Ab9, G7, F13 |
| 45 | Gospel Soul | Soul | Ab | Abmaj9, Dbmaj7, Bbm7, Eb13, Fm7, Cm7, Dbm6, Ddim7, F7b9, Bb9, Ab6 |
| 46 | Folk Open | Folk | G | G, C, D, Em, Am, Bm, Gadd9, Cadd9, Dsus4, Gsus2, F |
| 47 | Country Roads | Folk | D | D, G, A7, Bm, Em, D6, G6, A9, E7, B7, Dadd9 |
| 48 | Americana | Folk | A | A, D, E, F#m, Bm, G, A7, D6, E7, Aadd9, C |
| 49 | Ambient Air | Ambient | C | Cmaj9, Fmaj9, Am9, Dm9, Gsus2, Csus2, Fadd9, Bbmaj7, Ebmaj7, Abmaj7, G7sus4 |
| 50 | Cinematic Night | Ambient | E | Em9, Cmaj9, Gmaj7, Dsus2, Am9, Bsus4, Em6, F#m7b5, B7b9, C6, D7sus4 |
