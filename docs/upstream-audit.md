# Upstream research checkpoint — 2026-10-21

Update: one unchanged MIT synthesis file, `phys_dsp.c`, is now imported from the pinned Clipper revision below. No firmware wrapper, sequencer, font, icon or sample assets have been imported. The initial observations below remain a record of the research gate; current integration evidence is in [dsp-feasibility.md](dsp-feasibility.md). The browser now offers the upstream string model and the independent original JS sound as selectable backends. This is an initial source audit, not publication clearance. Revision inventory: [upstream-inventory.json](upstream-inventory.json), collected through GitHub's commit/tree API.

| Repository and pinned revision | Inspected evidence | Reuse decision / next gate |
| --- | --- | --- |
| [FoMni](https://github.com/charlesvestal/fm1-fomni/tree/7e7547f384fe70b7e89cfd725b0a211bcc60db05), `7e7547f384fe70b7e89cfd725b0a211bcc60db05` | Root LICENSE contains GPL v3; README identifies GPL-3.0-only. `host/build_host.sh` builds `host/omni_host.c` with `firmware/src/dsp/omni.c`, generated font/word headers and libm. | Reference for input and host scaffolding. Understand its hardware adapter before reusing anything. Browser input core currently written independently. |
| [Clipper](https://github.com/isod89/clipper-fm1/tree/e69067211c4690f34e494b5b896e4585163dcc2b), `e69067211c4690f34e494b5b896e4585163dcc2b` | Root LICENSE contains GPL v3. `firmware/src/eng_phys.c` identifies GPL-3.0-only; `phys_dsp.c` identifies MIT and DaisySP provenance. Engine includes `phys_dsp.c` and `phys_symp.c`. README documents `HOST_ONLY=1 tests/run_tests.sh`. | Native host renderer is the next feasibility target. Wrapper vs leaf-DSP dependency/licence boundaries must be audited before import. |
| [SLOOP](https://github.com/isod89/sloop-fm1/tree/4ec1ac829fd2bdf2c571ea215fb3d62477d01220), `4ec1ac829fd2bdf2c571ea215fb3d62477d01220` | Root LICENSE contains GPL v3; README identifies GPL-3.0-only. PHYS wrapper identifies GPL-3.0-only, DSP file MIT. `tests/hostsim.c` is a native WAV renderer and includes engine/voice/effect code. | Comparison candidate if Clipper adaptation is limiting. Do not vendor the full firmware for this browser slice. |

## Critical feasibility finding

Both inspected `firmware/src/eng_phys.c` versions define `PHYS_POLY 3`. Clipper's source describes a per-part arena holding model state. SLOOP additionally describes smaller state layouts and a two-voice SYMP layout. Thus a global 12/16-voice build option does **not** establish six or twelve independent PHYS voices. A focused DSP wrapper may need separate per-string state and a different allocator; RAM and CPU must be measured before adopting that route. No host or FM-1 performance measurement has yet been made.

The Clipper host-test command was found in README, not executed here. SLOOP's renderer header describes engine/preset/mono/output arguments, `CHORD`, `SECS` and `BENCH` controls; its includes show a broader firmware dependency boundary than a standalone string model. Next inspect the build script, generated tables, core type definitions, fixed-point helpers and DSP model initialization/render routines. Compile in a Linux container while the host compiler is blocked by Xcode setup.

## Licence/provenance gate before any import

Read each selected component's full header, copyright and dependency graph, plus `LICENSING.md` and nested notices. The wrapper and DSP implementation have different stated licences. The inventory also includes msfa, font and icon notices; their presence does not mean this project uses those assets. `phys_symp.c` is labelled MIT by wrapper comments, but its complete notice and dependencies still need direct inspection. Record every copied path, upstream SHA, licence, attribution, modifications and required notice/source distribution. Select the project's licence deliberately before distributing derived code; no project licence is inferred here.

Official FM-1 SDK investigation is deferred to the hardware milestone. Scan codes, pressure sensing, LEDs, device resources and controls remain unverified.

## Integration import record

`firmware/src/phys_dsp.c` from pinned Clipper is copied byte-for-byte to `third_party/clipper-phys/phys_dsp.c` (SHA-256 `5d39a4037b7686001189360a098edea64ff70aa2d9099ea1a448c792ae003e7c`). Full MIT notice remains in source; [component record](../third_party/clipper-phys/README.md) documents author attribution, exact path/SHA, no modifications, and Emscripten/musl notices. The adapter is independently written. No GPL firmware wrapper or preset table is copied. The component and adapter sources/notices are included in the served Docker artifact. This scoped import does not assign a licence to the entire project or import the upstream asset permission scheme.

## Melodee strum investigation

Pinned repository: https://github.com/keremimo/melodee/tree/398ada1e09d864c12f3b778a43e45c7c2a8031b8 . The local ignored research archive was inspected, including AGENTS.md, source notices, `firmware/src/chord.c` (`chord_strum_begin`, `chord_strum_due`), `seq.c` (pending-note scheduling), and `params.c` (STRUM/STROKE choices). Root code is GPL-3.0-only; chord.c credits Kerem Kilic (Ellic Studio), with retained Felucca portions attributed to Leo Kuroshita. No Melodee code has been copied.

Its strum feature freezes a voiced chord's order at a press, starts the first note, then schedules the remaining notes across a tempo division, with DOWN/UP/ALT ordering. That is a timed chord spread. Our instrument instead uses actual white-key contacts as attacks, so that scheduler is intentionally not connected to the playing path. It is useful research for scheduling/cancellation design, and does not establish physical string scanning or LED capability. No Melody/Melodee firmware flashing has been attempted.

Ignored downloads: pinned Clipper, SLOOP and Melodee archives in `build/research/`, never included in Docker context or source import. Reproduction of the playable app needs only the focused source already vendored and the pinned compiler image.

## Firmware application simulator reference

Inspected X0X `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3` and the Firmware Hub catalogue's Play in browser links (X0X/FoMni/ChoralRoot and others). X0X's host+WASM application, RGB565 framebuffer, input/light masks and worklet execution informed the architecture. No X0X/hub code, font, graphic, asset or firmware binary is imported. The new `firmware/` application and `web/emu/` panel are independently written around the already audited MIT DSP. The logical 27-key positions are host-model facts checked against X0X, not verified hardware scan codes. See [firmware-simulator.md](firmware-simulator.md).

## Hardware build checkpoint — 2026-10-21

Imported 33 focused files from X0X `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`: Felucca-derived HAL/startup/linker/LCD/USB/OTA, RAM update loader, packaging/build helpers and updater tests. All copied source is unchanged and SHA-256 inventoried in `third_party/fm1-platform/manifest.json`; original GPL-3.0-only licence/copyright and upstream LICENSING.md are retained. No X0X engines/sequencer/assets are imported. Our adapter/linker/build driver live separately in `firmware/fm1/` and `scripts/build-fm1.py`. The combined hardware target carries GPL corresponding-source obligations; the simulator does not link this platform code.

The official JieLi compiler archive `20260730.1` is hash-pinned in `scripts/setup-fm1.py` and runs in pinned Debian Docker. Three AC79 SDK files and their Apache-2.0 licence are hash-verified; Gitee did not resolve during setup, so a pinned mirror of the exact SDK tag supplied identical inputs. Compiler/SDK binaries stay in ignored build folders; the package necessarily includes the three SDK blobs. [Full provenance](../third_party/fm1-platform/README.md) · [Target build](firmware-build.md). No release was published or hardware flashed.
