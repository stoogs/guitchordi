# Experimental FM-1 target build

We now build an actual pi32v2 application, RAM update loader and `.fwsc` package for the M-VAVE FM-1. **This is a compile-tested bring-up candidate; no physical FM-1 has booted it yet.** It is not a qualified firmware release.

## Reproduce

Python 3.12+, Docker and curl are required on this Mac. All downloaded dependencies stay inside ignored `build/`; no system SDK installation is needed.

```sh
npm run setup:fm1
npm run build:fm1
npm run test:fm1
npm run test:simulator
```

`setup:fm1` downloads the official `jieli-linux-toolchains-20260730.1` archive (SHA-256 `a1545cddbc451a06bac43eb5cd96d831470c42a97c5c0b1f98879a20fc7647bd`) and three hash-pinned AC79 SDK files. The canonical Gitee SDK host did not resolve during bring-up; a pinned mirror of the matching SDK tag supplied byte-identical files. Every download must match its expected hash. The official compiler reports clang 4.0.1.

The build uses `linux/amd64` Debian pinned at `sha256:7ff6ba31527b9e336162fa061746c366c4b2032f4d2cff2078bea43f78efe3f8`, with the compiler mounted read-only. The toolchain container is stopped on exit. `JIELI_TOOLCHAIN` and `AC79_SDK` override dependency locations. `python3 scripts/build-fm1.py` builds the app and loader without requiring SDK packaging files. `--package` additionally requires exact SDK hashes. These commands never discover, open or write a physical device.

Outputs:

- `build/fm1/guitchordi.elf`, `.map`, `.bin`: linked target and app image.
- `build/fm1/loader/ota.bin`: attributed Felucca RAM update loader.
- `build/fm1/guitchordi-experimental.fwsc`: development package, identity `FM-1_900`.
- `build/fm1/report.json`, `symbols.txt`, `sections.txt`, `disassembly.txt`: measured build evidence.

Current measured app: **75,620 bytes**, main RAM data/BSS: **55,892 bytes**, framebuffer pool: **115,200 bytes**, loader: **6,528 bytes**, package: **609,684 bytes**. These link-time sizes exclude stack usage and do not establish real-time CPU capacity. [Exact report](fm1-build-measurements.json).

The development identity is inherited from the reference tooling. Choose a deliberate release identity/version and verify installer matching before publication; this is not presented as a Felucca release.

## What is connected

`firmware/fm1/main.c` connects the shared C instrument and 50 chord styles to Felucca/X0X HAL inputs, 10 kHz matrix scanning, encoder roles, key LEDs, master ADC, RGB565 LCD strips and stereo I2S DMA. It keeps core 1 held and uses 128-frame halves (approximately 2.90 ms at 44.1 kHz). Timer scanning has higher priority than audio. Application input/DSP mutations run in the audio ISR; the main loop draws the LCD. Display snapshots during parameter changes still need physical verification.

The framebuffer lives in the large-buffer pool; DSP and application state fit the main RAM region in the link map. Pitch conversion uses a precomputed integer phase table for MIDI 24–96, avoiding double-precision work at note onset. The audio clock uses integer quotient/remainder accumulation. No software-double routines are linked. Fourteen voices remain the requested ceiling, subject to on-device load measurement. Float output converts to signed 24-bit samples, left-justified in I2S words; actual codec format/rate/output must be verified on hardware.

Boot code arms the watchdog, installs exception vectors/guards and includes boot-loop fallback into chip update mode. Holding both octave buttons for five seconds requests chip update mode independently of chord lock. **Both recovery paths are compiled but untested on hardware.**

## Deliberate first-build limits

- No in-app USB updater, USB MIDI/audio or external MIDI integration. The loader is packaged, but the running instrument does not yet stage it through the normal web-installer handshake.
- SAVE makes the C snapshot in RAM only. Flash-backed persistence and calibration storage are pending; LCD text explicitly says RAM only.
- The physical button/encoder map starts from Felucca's defaults. Calibration and key/LED correspondence need the actual unit.
- CPU load, worst render time, dropouts, stack depth, latency, codec output and fourteen-voice behavior have not been measured on FM-1. `gm_device` contains maximum render time, late-half and frame counters for bring-up instrumentation.
- Tuning remains standard EADGBE. [Alternate tunings](tuning-presets.md) are recorded for later and are not loaded by runtime code.

## Validation boundary

The build checks entry address/stub, section placement/image size, RAM/pool headroom, RAM code calls, direct ROM references and linked software-double routines. The package uses all three exact reference SDK hashes. The copied Felucca updater and loader host tests run against this package with simulated flash, checking staging, CRCs, cancellation, app replacement, preserved flash head, write boundaries, idempotent reinstall and damaged/foreign-key header refusal. They do not establish physical USB/install/recovery behavior; the OTA-entry harness tests copied protocol code, which is not yet integrated into our running instrument.

Shared application tests still cover all 50 styles / 550 slots / 8,800 contacts; native/WASM audio matches exactly as float32. These verify the shared application, not pi32v2 execution. Use [device readiness](device-readiness.md) for the next hardware gates. Attribution and source obligations are in [platform provenance](../third_party/fm1-platform/README.md).

## Sixteen-instrument checkpoint

The current Guitchordi candidate includes all sixteen shared C patches and six-part mapping for every patch. [Catalogue and tests](instruments.md). Device render deadlines remain unmeasured for these patches, including the bowed excitation. The target app links without software-double routines; app image and state increase by 2,180 bytes and 112 bytes respectively versus the prior three-patch target.

Before a first physical test, follow [device-test preparation](first-device-test.md). The restore-file checksum mismatch and runtime USB-handshake limitation are unresolved hardware gates.
