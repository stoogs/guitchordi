# Guitchordi: licenses, credits and source

Guitchordi's combined firmware project is licensed under **GPL-3.0-only**.
The complete GPL text is in [LICENSE](LICENSE). The MIT and OFL components below
retain their own licenses and copyright notices; the GPL project license does
not erase them or make the whole firmware MIT-licensed. Original Guitchordi
application, DSP adapter, browser controls, chord/tuning generators and tests
are maintained at https://github.com/stoogs/guitchordi.

## Material actually incorporated

| Component | Origin and attribution | License / retained record |
| --- | --- | --- |
| Hardware platform, startup, LCD, USB/OTA support, RAM update loader and packaging tools | Charles Vestal's X0X, itself derived from Felucca by Leo Kuroshita (@kurogedelic), Hügelton Instruments. X0X changes remain credited by the upstream headers and licensing record. | GPL-3.0-only. [Exact revision, file inventory and SHA-256 hashes](third_party/fm1-platform/manifest.json); [scope](third_party/fm1-platform/README.md); [original licensing](third_party/fm1-platform/LICENSING.md); [full license](third_party/fm1-platform/LICENSE). These components enter the device target, not the browser simulator. |
| Physical string DSP, `phys_dsp.c` | Clipper by isod89; Copyright (c) 2020 Electrosmith, Corp, Emilie Gillet. Fixed-point C port for Felucca, 2026: Leo Kuroshita (@kurogedelic), Hügelton Instruments. Derived from DaisySP as identified in the source. | MIT. Imported unchanged at Clipper commit `e69067211c4690f34e494b5b896e4585163dcc2b`. [Full notice](third_party/clipper-phys/MIT-LICENSE.txt); [source and hash](third_party/clipper-phys/README.md). Used by device and WASM DSP. |
| Device display glyphs and their source font | Noto Sans, Copyright 2022 The Noto Project Authors | SIL OFL 1.1. [Font provenance](firmware/fonts/README.md), [full license](firmware/fonts/OFL.txt). `firmware/display-font.h` is a generated raster subset; it retains its source hash and font credit. Independent 5x7 glyphs in `firmware/font.h` are separate original artwork. |
| Package inputs `uboot.boot`, `cfg_tool.bin`, `cfg/eq_cfg_hw.bin` | JieLi AC79 SDK, canonical repository https://gitee.com/Jieli-Tech/fw-AC79_AIoT_SDK, SDK tag AC79NN_SDK_V1.2.1_2023-12-13; pinned matching mirror revision `d179b4484759423312073f5fbb232501aa491047` | Apache-2.0 under the pinned SDK's root license. [Full text](third_party/fm1-platform/AC79-SDK-LICENSE.txt), [hash-pinned downloader](scripts/setup-fm1.py). Inputs are downloaded into ignored build folders and included in the device package, not the WASM instrument. SDK source availability/required notices must be rechecked for every dependency update. |
| WASM compiler/runtime support | Emscripten SDK 4.0.17 and musl; see their complete contributor notices | [Emscripten license](third_party/clipper-phys/EMSCRIPTEN-LICENSE.txt), [musl copyright/license](third_party/clipper-phys/MUSL-COPYRIGHT.txt). Compiler container pinned in Dockerfile. |

The platform files remain byte-for-byte upstream copies. Guitchordi's adaptations
are kept separately in `firmware/fm1/` and the project build scripts. The string
DSP leaf is unchanged; fourteen-voice allocation, patches, mapping and mixing are
implemented by Guitchordi's adapter. No upstream author is claimed to endorse
Guitchordi or to have tested its firmware.

## Research and inspiration, not additional imported code

- Melodee by Kerem Kilic / keremimo (Ellic Studio): strum scheduling research;
  no Melodee code imported. Its GPL project is not presented as an MIT component.
- FoMni and X0X by Charles Vestal, SLOOP/Clipper by isod89, and the Firmware Hub:
  architectural and interface research, with the actual imports limited to the
  component records above. [Historical audit](docs/upstream-audit.md).
- The original upstream licensing record describes components from the entire
  X0X project. Its drum engines, sequencer, samples, icon atlas and other fonts
  are not thereby dependencies of Guitchordi.
- Simon Johansson's GPL-2.0 QEMU-based FM-1 emulator is a separate prospective
  test tool, not linked into or bundled with Guitchordi.

## Distribution checklist

For every distributed device binary, publish the matching complete corresponding
source and the scripts/configuration needed to rebuild it, at the exact release
commit, alongside the retained license and attribution texts. Include this file,
GPL text, MIT notice, OFL text, Apache text, dependency records and checksums in
the release materials. A moving `main` link alone is not the matching source for
an old binary. Keep original copyright notices intact. Do not copy vendor
compiler archives, stock firmware, users' backups or unrelated research downloads
into our source release.

The Docker website supplies a source archive built from the same build context
as its WASM, including the generators and inputs needed to reproduce it, at
`/upstream-source/guitchordi-source.tar.gz`, with SHA-256 and per-file manifest.
[Browser credits](web/licenses.html) link the notices and source download.
This records our present provenance and packaging checks, not a blanket clearance
for future imports or a substitute for checking an updated component's terms.

## Names and assets

M-VAVE and FM-1 belong to their respective owners. Felucca and Hügelton Instruments
are the upstream authors' names. Guitchordi is independent and not endorsed by them.
The control diagram, browser visuals and musical chord/tuning data were authored
for this project; no recorded instrument samples, third-party panel photo or
upstream icon atlas are used. The printable PDFs currently embed subsets of the
host's Arial fonts through ReportLab; the font binaries are not source dependencies
of the instrument, are not claimed to be OFL/MIT/GPL, and are not vendored in this
repository. PDF rebuilds require those locally installed document fonts.

### Guitchordi USB/update integration (25 October 2026)

`firmware/fm1/update.h` adapts the hookup sequence from the pinned X0X
`firmware/src/x0x.c` and `firmware/src/app/main_fm1.c`, retaining Felucca/X0X
attribution and GPL-3.0-only. The original vendored files stay byte-identical.
`scripts/generate-fm1-usb.py` generates a copy with only the manufacturer/product
USB descriptors and include path changed. The target builder copies the platform
to an ignored build directory and changes only the loader's identity string.
The build scripts, identity header and retained source are corresponding source
for those generated derivatives. No new upstream DSP, assets or samples enter.

The updater integration host harness derives from the retained GPL updater test
and replaces its hardware hooks with our actual adapter plus explicit host mocks.
The processor emulator and downloaded research tests remain external tools under
`build/`; they are not imported into or distributed with this firmware.

### External emulator research tools (26 October 2026)

`scripts/emulator-research/` contains local GPL-2.0-or-later patches and test
additions for Simon Johansson's GPL/QEMU-based FM-1 emulator at
`519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34`. The patch adapts that project's
`translate.c`, `fm1-lcd.c` and one test expectation; upstream authorship and license
remain applicable. These run as a separate development tool and are not linked
into the Guitchordi firmware or browser simulator. The full emulator, QEMU sources
and compiled research binary remain in ignored local build directories. The
included README records source pins, hashes, build instructions and limitations.
