# Processor simulation and testing

The current browser panel runs the shared C instrument as WebAssembly. The native tests run that C code as a Linux executable in Docker. Both test the actual instrument/DSP source, but neither executes the pi32v2 firmware machine code or models the FM-1 peripherals/cycles.

A normal virtual machine image cannot boot the FM-1 binary. Docker runs our x86/ARM host tools; the JieLi compiler produces pi32v2 instructions for a different processor. QEMU's [documented system targets](https://www.qemu.org/docs/master/system/targets.html) do not include JieLi/pi32v2 or an AC79/FM-1 board. The downloaded official toolchain contains compiler/linker/disassembly utilities, with no processor simulator found in its `pi32v2/bin` or `common/bin` directories. No usable supported full FM-1 processor/board emulator was found in this investigation; this is not a claim that no private or experimental implementation exists.

What we can verify here:

| Test | Exercises | Does not establish |
| --- | --- | --- |
| Browser C/WASM panel | Chord styles, instrument mapping, input attacks, lock, LCD, browser saves, actual synthesized audio | Device CPU cycles, raw scan timing, I2S codec or USB hardware |
| Native + UBSan | Real C DSP, memory/undefined-behavior checks, 20,000 randomized mixed-patch retriggers | pi32v2 instruction execution or interrupt behavior |
| Native/WASM parity | 2,867,200 float32 samples across all sixteen patches; exact agreement | Output parity with real FM-1 hardware |
| Key-map matrix | All 140,800 instrument/style/slot/key combinations | Physical wiring/calibration |
| Target compiler + linker | Real pi32v2 instructions, entry stub, memory layout, image size, no linked soft-double routines | Successful boot or real-time render deadlines |
| Simulated updater/flash | Loader framing, CRCs, cancellation, allowed writes, preserved flash head, corrupted-header rejection | Actual USB transport, flash electrical behavior or physical recovery |

Commands: `npm test`, `npm run test:simulator`, `npm run test:instruments`, `npm run test:dsp`, `npm run build:fm1`, `npm run test:fm1`.

Next hardware measurements: actual output sample rate/codec format, control mapping, worst audio render time at increasing voice counts for each patch, missed DMA halves, stack high-water marks, power/reboot behavior and update/recovery entry. The new bowed patch must be included in that load sweep. These measurements decide the safe voice budget and deployment readiness. See [device readiness](device-readiness.md).
