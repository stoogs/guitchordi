> **26 October hardware checkpoint:** the corrected quiet beta is installed and
> user-confirmed working, with controlled audio matching the emulator. Keep its
> conservative output ceiling until measured audio qualification. The original
> first-install package remains unsafe. See [audio evidence](fm1-audio-incident.md).
>
> The preparation assessment below predates installation. Recovery entry and a
> full backup were verified from Felucca; Guitchordi has completed an outgoing
> update. Worst-case timing, long-run stability and restoration remain open.

# Device readiness

The Guitchordi portable C instrument now has an experimental FM-1 board adapter and produces a pi32v2 application, attributed Felucca update loader and `.fwsc` package. **Compilation and simulated update tests pass; no physical device has booted this build.** No device has been flashed.

**First-flash status: NOT CLEARED.** V15 recovery download is verified and runtime USB/OTA is integrated and host-tested. No physical enumeration, backup, install or recovery has been performed. See [current qualification evidence](local-qualification.md).

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
3. Validate boot-loop fallback and octave-button recovery on the device. Validate the integrated in-app USB updater and calibrate the panel. Performance MIDI/USB audio are absent and SAVE is RAM-only.
4. Finish release identity/versioning, recovery/install verification and corresponding-source/notices packaging before distributing a release.

The linked image and memory sections fitting are useful evidence, but do not prove correct hardware operation. The 128-frame audio half-buffer gives roughly 2.90 ms of render budget at 44.1 kHz; physical end-to-end latency is unmeasured. The simulator remains the behavioral reference during bring-up.

Standard EADGBE remains the factory default. GLO K3 selects fourteen [guitar tuning presets](tuning-presets.md), now implemented in the shared C runtime.

## Hub release qualification

The exact local-to-device-to-Hub gates are in [hub-submission.md](hub-submission.md). The unchanged package now passes boot/note and 343 virtual control actions in a locally patched processor emulator. The original upstream model still lacks the necessary LCD/instruction support; our extensions are not hardware-validated. See [local qualification](local-qualification.md). The integrated runtime USB identity and outgoing-update hooks still need hardware validation.
