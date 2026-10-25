# FM-1 platform components

Source: https://github.com/charlesvestal/fm1-x0x at `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`. This is a focused selection of the Felucca-derived hardware layer, startup/linker definitions, LCD/USB/OTA support, update loader, packaging helpers and two updater tests. No X0X sequencer, drum engines, fonts, samples, graphics or instrument UI are included.

The copied files are unmodified; `manifest.json` records every path and SHA-256. `LICENSE` is GPL-3.0-only, and the upstream `LICENSING.md` retains authorship/provenance. Most platform components are Copyright (C) 2026 Leo Kuroshita (@kurogedelic), Hügelton Instruments. Our target adapter and linker changes are in `firmware/fm1/`; the build driver is `scripts/build-fm1.py`. It calls the copied loader builder, package generator and image checks with our source/output paths.

The combined hardware firmware uses GPL components and must be distributed under GPL-3.0-only with complete corresponding source, build scripts and retained notices. The Clipper string-model leaf retains its MIT notice. This hardware platform is not linked into the independent browser/WASM simulator.

Three SDK binaries enter the package at build time, from AC79NN_SDK_V1.2.1_2023-12-13. Canonical source: https://gitee.com/Jieli-Tech/fw-AC79_AIoT_SDK. During this build that host could not resolve; identical files were retrieved from the `amitv87/fw-AC79_AIoT_SDK` mirror at `d179b4484759423312073f5fbb232501aa491047` and matched all three SHA-256 values pinned by the reference build. They remain in ignored `build/ac79-sdk/`, not vendored here. Their Apache-2.0 licence is included as `AC79-SDK-LICENSE.txt`; `scripts/setup-fm1.py` verifies it and the binaries.

The official JieLi compiler archive is downloaded into ignored `build/toolchain/` from the vendor's package server. Its URL, version and observed SHA-256 are pinned by `scripts/setup-fm1.py`; the compiler itself is not redistributed as project source.

Local builds only: no public firmware distribution or hardware installation has been performed. See `docs/firmware-build.md` for candidate limitations and reproduction.
