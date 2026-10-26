# Local processor-emulator compatibility research

These patches/tests are **GPL-2.0-or-later**, for Simon Johansson's external
[FM-1 emulator](https://github.com/simonjohansson/fm1-emulator), based on pinned
commit `519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34` (build-67).
Upstream copyright/license remains with its authors. This tool is separate from
the Guitchordi firmware. No modified emulator binary is published here.

The Guitchordi hardware package is unchanged by this research. Vendor compiler
assembly (`-target pi32v2 -mcpu=r3 -mfprev1`, same flags as X0X) identifies two
instructions reached by its DSP:

- `FF48 4180 014D`: long `iff (r4 u> r1) goto ...`, in `note_on` validation.
  The original decoder treats any low byte in word 2 as illegal; bit 7 is the
  float form. The local decoder reuses its existing finite-float comparison
  helper and six-byte signed displacement. NaN/infinity stay unsupported under
  that helper's existing checks. Tests compare 70 finite relations, including
  negatives and signed zero, against numeric expectations.
- `E1D8 4103`: `r5_r4 >>>= r1`, signed register-pair right shift in the physical
  string model. Existing immediate arithmetic shifts already use the same
  numeric semantics. Local support covers counts 0–63; counts >=64 deliberately
  remain errors. Tests cover negative/positive pairs and word boundaries.

The LCD model already calculates transfer duration from `(BAUD + 1)`. Its explicit
BAUD-4-only guard is extended to allow **0 or 4**, with busy-transfer restrictions
retained. Tests check completed pixel DMA and faster model timing for BAUD 0.
No claim is made about electrical panel timing or physical CPU deadlines.

`pi32v2-compat.patch` includes a corresponding upstream test expectation update:
kind 3 is now tested positively; kind 1 and odd register pairs stay rejected.
The new `test_*_local.py` files accompany the patch. Full suite result:
**242 tests, zero failures, three skipped** (optional external-package cases).
The assertions exercised more cases through subtests. All are software-model tests,
not newly captured hardware observations.

## Reproduce

1. Download the pinned source tarball from
   `https://api.github.com/repos/simonjohansson/fm1-emulator/tarball/519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34`.
   Verify `manifest.json`'s source archive SHA-256; extract into an ignored working
   directory. Retain its GPL/QEMU/GLib notices if distributing a built tool.
2. Download `https://download.qemu.org/qemu-11.1.2.tar.xz`; verify the manifest's
   QEMU checksum. Extract under that checkout's `.cache/`. For Python's safe tar
   filter, omit the archive's absolute X11 include symlink (unused in this
   headless build); do not disable path protections for arbitrary archives.
3. Apply `patch -p1 < pi32v2-compat.patch` from the checkout root. Copy the three
   `test_*_local.py` files into its `tests/` directory. Run `python3 tools/integrate.py`.
4. Build the provided Dockerfile as `guitchordi-emulator-research`. It is a local
   research environment with distribution build dependencies, not a reproducible
   release toolchain; the resulting binary's checksum is captured in each test.
5. Mount that checkout at `/work` in the container and run:

```sh
mkdir -p .cache/local-build
cd .cache/local-build
../qemu-11.1.2/configure --target-list=pi32v2-softmmu \
  --python=/opt/qemu-python/bin/python --without-default-features --enable-tcg \
  --disable-fdt --disable-docs --disable-user --disable-tools \
  --disable-guest-agent --disable-slirp --disable-capstone --disable-werror
ninja -j4 qemu-system-pi32v2
cd ../..
ln -s .cache/local-build/qemu-system-pi32v2 emulator
python3 -m unittest discover -s tests
```

The local build is Linux/headless and must run inside its container on this Mac.
Use the repository's `scripts/check-processor.py --emulator PATH --emulator-label
local-iff-sar-baud0 --label NEW-LABEL` with the repository mounted at the same
absolute path inside Docker. **Omit `--diagnostic`** to test the unchanged hardware
package. Never mount USB devices, request privileged Docker, or call an installer.

The optional upstream `tests/stress.py` provides deterministic virtual panel input;
its event log and seed must accompany any result. Model boot/playback passes do not
clear flashing, verify physical USB-MIDI, or emulate ROM recovery/reset.

### Recorded panel stress

The patch also adds `--no-usb` to the upstream stress harness, disabling its
CDC-oriented virtual host for this USB-MIDI firmware. From the external checkout,
inside Docker with the repository mounted at the same absolute path, reproduce:

```sh
python3 tests/stress.py /ABS/REPO/build/fm1/guitchordi-experimental.fwsc \
  --seed 982 --seconds 20 --boot-seconds 3 --hold-ms 30 --gap-ms 15 --phase-ms 15 \
  --no-usb --output /ABS/REPO/build/fm1-emulator/NEW-STRESS-LABEL
```

Recorded result: 343 actions, display changes in 10/10 intervals, final probe
sounded. The 30 ms holds exceed the firmware's approximately 8.8 ms debounce.
Earlier CDC-host and 5 ms hold runs were aborted and are not passes. A follow-up
`python3 -m unittest test_signed_pair_local test_stress` from `tests/` passed
five tests with one skipped, including signed-shift status-register preservation.
