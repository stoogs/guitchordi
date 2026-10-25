# Clipper PHYS string model — source and attribution

Imported file: `phys_dsp.c` (unchanged).

- Repository: https://github.com/isod89/clipper-fm1
- Commit: `e69067211c4690f34e494b5b896e4585163dcc2b`
- Original path: `firmware/src/phys_dsp.c`
- SHA-256: `5d39a4037b7686001189360a098edea64ff70aa2d9099ea1a448c792ae003e7c`
- SPDX: MIT. The complete copyright, permission and disclaimer are retained at the top of the file.
- Authors credited by that notice: Electrosmith, Corp, Emilie Gillet; fixed-point C port for Felucca by Leo Kuroshita (@kurogedelic), Hügelton Instruments, 2026.
- Provenance: DaisySP physical models, as described in the original source header and upstream LICENSING.md.

Modifications: none to the imported file. This project calls the string-model routines from an independently written C adapter in `dsp/engine.c`. The adapter provides fourteen voice states, event validation, independent exploratory parameters, bounded tails, fade-before-steal, mixing and output limiting. The GPL-licensed `eng_phys.c` firmware wrapper, preset tables, sequencer, font/icon/sample assets, and other firmware code have not been imported. This is a source-derived string model, not the complete Clipper synth or its preset/FX chain.

The WASM is built from source using pinned Emscripten SDK 4.0.17. Emscripten and musl notices for the build/runtime dependencies are included in `EMSCRIPTEN-LICENSE.txt` and `MUSL-COPYRIGHT.txt`. Local research archives are ignored build inputs, not distributed dependencies.

Reproduction from project root: `docker compose up --build -d --wait`; full native/reference checks: `npm run test:dsp`.
