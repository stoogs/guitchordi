# FM-1 audio incident and quiet diagnostic — 26 October 2026

The first hardware build booted and answered USB identity but failed physical
audio: excessive volume at about 5% master, then intermittent playback. Keep
that package out of use. No new device operations were performed during this fix.

## Confirmed output-format defect

Felucca v1.6.1 `firmware/src/audio.c` converts Q15 output by multiplying by 128
and writes that signed 24-bit value directly into each int32 DMA slot. Its
`firmware/hal/fm1_audio.h` is byte-identical to our retained HAL. Our adapter
multiplied normalized floats by 8388607, then shifted the result left eight bits.
That extra shift wraps the codec's low 24 sample bits. The retained header's
“left-justified” comment was misleading for this configuration; the working
upstream call site and emulator receiver both use right-justified values.

References: [Felucca v1.6.1 audio.c](https://github.com/hugelton/Felucca/blob/v1.6.1/firmware/src/audio.c),
[identical codec HAL](https://github.com/hugelton/Felucca/blob/v1.6.1/firmware/hal/fm1_audio.h).
No upstream vendored sources were changed.

## Corrected diagnostic

- Writes signed 24-bit values directly, with a temporary digital peak bound of
  524287 (approximately -24 dBFS). This does not guarantee acoustic loudness.
- Starts master at zero; turns down immediately; smooths increases only.
  ADC failure/out-of-range results and the zero deadband mute output.
- Independently gates output at zero master and rejects non-finite/out-of-range
  normalized samples before float-to-integer conversion.
- Defers USB polling while audio renders, matching upstream interrupt ownership.
- Adds a temporary bottom row: US = peak render microseconds (128 frames allow
  about 2902 us), L = late halves, VOL = physical master percent, BAD = rejected
  normalized samples. The processor model's timing is not silicon timing.

## Local evidence

Target build and all FM-1 update/loader checks pass, including 936 interruption
boundaries. New UBSan/float-cast checks exercise signed PCM interpretation,
monotonicity, bounds, 5% signal scaling, NaN/infinity, zero and ADC failures.
The 17 unit checks pass. Processor boot/note passes in the documented research
model. The stronger PCM capture test passes the corrected compiled package and
rejects the original failed package. Earlier “nonzero audio” tests did not
establish output format or sound quality and missed this defect.

Corrected candidate SHA-256:
`97c40e1ce3d9e96bcbd2a6bbb0ebf152ed85f4c31509dc6a5a9aa0429ec38423`.
Actual captured PCM peak at 7.75 guest seconds: 594; all words are
signed 24-bit values and left/right match. This is a short single-note capture,
not maximum-polyphony, all-instrument or acoustic validation.

The intermittent playback cause is **unresolved**. The new diagnostic gives
physical evidence for render overruns, invalid samples and master behavior.
It has not been installed. A further flash requires separate explicit approval.

## Quiet diagnostic installation

The user explicitly approved installation of the corrected quiet candidate.
The existing Guitchordi updater completed the transaction, programmed to 100%,
restarted, and answered `FM-1_982`; installer exit code 0. This also exercises
an outgoing update from the first Guitchordi build. Both builds share the
provisional identity, so identity alone does not distinguish them; confirm the
new US/L/VOL/BAD row on screen. Physical volume, audio continuity and timing
results remain pending. Restoration remains untested.

## User confirmation: quiet diagnostic works

After the corrected build was installed, the user reported that it works exactly
like the emulator, with controlled audio and a slightly quiet maximum level.
The previously reported intermittent audio was not observed in that check.
This is a user-observed functional pass, not a measured worst-case load sweep:
US/L/BAD readings, every instrument, long sessions and restore remain unqualified.
The temporary output ceiling is retained for the working beta checkpoint.
