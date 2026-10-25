# Device readiness

The Guitchordi portable C instrument now has an experimental FM-1 board adapter and produces a pi32v2 application, attributed Felucca update loader and `.fwsc` package. **Compilation and simulated update tests pass; no physical device has booted this build.** No device has been flashed.

**First-flash status: NOT CLEARED.** The current vendor restore file fails the pinned V15 hash, and the candidate cannot answer the running USB updater handshake. See [first-device-test checklist and recovery audit](first-device-test.md). The loader re-entry simulation passed 290 flash-operation interruption points; actual SPL/USB recovery remains unverified.

## Completed build work

- Official JieLi compiler runs in pinned linux/amd64 Docker on this Apple Silicon Mac.
- Focused, pinned Felucca/X0X platform components are imported with original notices and a file-hash manifest.
- Shared chord/DSP application links for the actual processor, including all 50 styles, 16 instruments and the 14-voice ceiling.
- Framebuffer is placed in the large-buffer pool. Pitch conversion uses a precomputed table; the target links without software-double routines.
- Experimental adapter connects key/encoder scanning, LEDs, LCD, master ADC and I2S DMA. Watchdog, exception guards, boot-loop fallback and octave-button update entry are compiled.
- SDK packaging inputs match the exact reference SHA-256 values. The generated package passes simulated updater/loader tests, including write-range and flash-header preservation checks.

[Build instructions and exact limitations](firmware-build.md) · [Recorded measurements](fm1-build-measurements.json).

## Before deployment qualification

1. Verify the physical unit's identity and stock recovery route. Boot a controlled bring-up candidate and check screen, one key and quiet sound output; then establish the complete input/button/encoder/LED map.
2. Measure actual sample rate, codec output, CPU render deadlines, total RAM/stack, dropouts and playing latency. Test increasing simultaneous voice loads; fourteen voices is a ceiling, not yet a measured device capability.
3. Validate boot-loop fallback and octave-button recovery on the device. Integrate the normal in-app USB update handshake and flash-backed settings/calibration. The current candidate has no in-app USB updater/MIDI/audio and SAVE is RAM-only.
4. Finish release identity/versioning, recovery/install verification and corresponding-source/notices packaging before distributing a release.

The linked image and memory sections fitting are useful evidence, but do not prove correct hardware operation. The 128-frame audio half-buffer gives roughly 2.90 ms of render budget at 44.1 kHz; physical end-to-end latency is unmeasured. The simulator remains the behavioral reference during bring-up.

Standard EADGBE remains unchanged and is the required factory default. [Fourteen alternate/default tuning specifications](tuning-presets.md) are recorded for later implementation.
