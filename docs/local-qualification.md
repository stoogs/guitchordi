# Local firmware qualification — 26 October 2026

**Later hardware checkpoint:** an explicitly approved first installation completed
and returned `FM-1_982`. See [physical installation evidence](first-device-installation.md).
The pre-installation assessment below is retained as history; remaining hardware
and release gates are not cleared by the identity response alone.

**NOT CLEARED TO FLASH.** No physical USB discovery, RAM-loader upload, backup,
flash write, GitHub firmware release or Hub submission was performed. Device writes
and publication still require explicit user approval. These are local engineering
results, not a no-brick guarantee.

## Changes and proven local results

- Integrated retained Felucca/X0X USB MIDI identity and OTA entry into the target
  adapter. Polling runs at 2 kHz from the 10 kHz input timer. No performance MIDI
  or USB audio is claimed. USB descriptors say **Stoogs / GuitChordi FM-1**.
- Application, package marker and generated loader use **FM-1_982 / ota-FM-1_982**.
  This identity was absent from the Hub catalogue updated 2026-10-25 14:59 UTC;
  it is provisional, not reserved. Recheck and coordinate before publishing.
- Runtime flash writes are restricted at both adapter and RAM-driver levels to
  `[0xE0000, 0xE5000)`. Unknown JEDEC ID disables writes. Accepted part remains
  `0x856014`. App settings remain RAM-only. Startup removes stale update staging
  using the retained upstream cleanup routine; backups are still essential.
- Update entry stops audio, masks its IRQ, zeros the DMA buffer and damps the
  instrument. Failure resumes silent audio. Restart opens the top-RAM guard only
  while reattaching its vector, then relocks it before enabling interrupts.
  The processor emulator caught the missing guard opening during development;
  this was fixed and added to the integration harness.
- The official M-VAVE V15 recovery file matches the **original pinned hash**:
  699,956 bytes, SHA-256
  `db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a`.
  Immutable source: [M-VAVE repository file](https://github.com/m-vave/fm1_open/blob/4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/firmware/FM-1_015.fwsc).
  The moving vendor URL's different V16 file was not accepted or repinned.
- `npm test`: 17/17 pass, including retained upstream hashes/license provenance.
- `npm run test:fm1`: target artifact/identity consistency, reference OTA/loader,
  USB packet tests and actual adapter hooks with host mocks pass under UBSan.
  USB tests cover descriptor content, SysEx framing, reply packetization,
  malformed/oversized messages, update and UBOOT request flags. They do **not**
  simulate USB electrical enumeration.
- Actual adapter hooks stage both Guitchordi and official V15 in simulated NOR.
  All **20 custom-loader / 46 stock-loader staging write-failure boundaries**
  refuse commit and recover with the model's subsequent cleanup writes working.
  Host disappearance/missing confirmation, unknown chip, unaligned erase,
  protected head/store/globals and wrapping addresses are checked. Official V15
  with a mismatched protected flash head is refused. Persistent flash failure
  is not represented by these single-operation failure injections.
- Loader re-entry simulation: **936/936** erase/program interruption boundaries
  recover while preserving protected head/globals. This assumes the loader is
  re-entered and the host resumes; it does not model SPL/ROM or physical power loss.

## Processor emulator: original model and local research

Pinned external tool: [Simon Johansson's build-67](https://github.com/simonjohansson/fm1-emulator/tree/519a13b879d744f5c05bfe3c4e5d4e04d8d4ae34).
Separate binary hashes and exact snapshots are in
[processor qualification results](processor-qualification-results.json).

| Run | Observed result | What it proves |
| --- | --- | --- |
| Original model, exact hardware candidate | Stops on `SPI1 supports idle BAUD 4 only` | Original model cannot run the unchanged upstream BAUD 0 display setup. |
| Separate `--emulator-diagnostic`, BAUD 4 | 35 guest seconds complete; HOME visible, LCD updates and audio DMA advance; bootguard pending/failed clear | Target startup and idle path execute in this model. No played audio or hardware timing claim. |
| Diagnostic, first virtual note at 7 seconds | Stops on unsupported opcode `0xff48` inside `note_on` | Original-model musical test remains blocked by decoder support; this is not a pass and does not establish an invalid hardware instruction. |
| Diagnostic, both OCT keys held | `usb_update_mode` written into mailbox; model stops on unsupported P33 chip reset | The gesture reaches the intended reset request; ROM USB enumeration and actual recovery remain untested. |

The latest upstream release checked was still build-67. Its virtual USB host is
CDC-console oriented; it does not provide a USB-MIDI updater host for this test.
Do not enable CDC or change the hardware/DSP build merely to label these tests
passed. Raw captures and downloaded emulator sources stay under ignored `build/`.

Reproduce (serialize builds; no hardware operations):

```sh
npm run build:fm1
npm run prepare:device
npm run test:fm1
python3 scripts/check-processor.py --label hardware-check
python3 scripts/build-fm1.py --package --emulator-diagnostic
python3 scripts/check-processor.py --diagnostic --idle --label idle-check
python3 scripts/check-processor.py --diagnostic --label note-check
python3 scripts/check-processor.py --diagnostic --recovery --label recovery-check
```

The original-model hardware/note checks above exit nonzero deliberately. Labels must
be new so previous evidence cannot be overwritten. Diagnostic output lives in
`build/fm1-emulator-diagnostic/`, separate from `build/fm1/`; preparation rejects
reports marked diagnostic. Neither directory is a released firmware.

### Local research follow-up, 26 October

The **unchanged hardware package** now boots and produces nonzero audio in a
locally patched model. Its SHA-256 remains
`30d522b0178b4446abc57ff9b31e7802017c32e9fc523daf2f1ebbd2d4a33b51`.
The external model adds long finite-float branches, signed register-pair right
shifts and BAUD 0 LCD support, checked against vendor compiler assembly and
existing upstream helpers. These are inferred model semantics, **not silicon
validation or upstream acceptance**. See the [patch, pins and reproduction
instructions](../scripts/emulator-research/README.md).

- Emulator regression suite: 242 tests run, zero failures, three skipped.
  Follow-up signed-shift/status-register and stress-harness checks: five run,
  zero failures, one skipped. Skipped cases are not passes.
- Exact-candidate boot/note capture: display updates and audio DMA continue;
  174,824 nonzero audio words by nine guest seconds.
- Deterministic virtual-panel stress: **343 actions over 20 guest seconds**,
  seed 982, 30 ms key holds, 15 ms gaps/encoder phases. Display changed in all
  ten observation intervals and the final probe key sounded. At 24.825 guest
  seconds including boot/probe, 1,860,028 nonzero audio words and 8,450 DMA
  completions were recorded. This does not establish musical quality, all-patch
  coverage, worst-case polyphony or physical real-time headroom.
- Virtual USB host was disabled. An earlier CDC-host run stalled before its
  first snapshot and was stopped, with cause unresolved. A separate 5 ms key
  run was stopped after producing no audio: its presses were shorter than the
  approximately 8.8 ms scan debounce. Neither aborted run is counted as a pass.

Raw evidence is retained under `build/fm1-emulator/research-hardware-note-2/`
and `build/fm1-emulator/research-playable-stress-982/`; compact results and hashes
are in the linked JSON. No firmware changes were needed for this follow-up.
ROM reset/recovery and physical USB updates remain outside this proof.

## Separate upstream comparison/review pass

This was a second review pass by the same coding agent against retained upstream
implementations, **not independent human or separate-agent sign-off**.
Reference: X0X revision `54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3`,
`firmware/src/x0x.c`, `app/main_fm1.c`, `usb.c`, `ota.c`, loader and flash/IRQ/sys
HAL. All originally vendored source hashes remain unchanged.

- Preserved upstream framing, CRC validation, accepted loader formats, staged
  loader readback, host-success-before-commit ordering and flash+RAM update record.
  `ota-FM-1_015` inside that record is the retained ROM/SPL protocol field; it is
  not the application's identity and was not renamed.
- Preserved flash driver RAM placement and chip check. Build disassembly checks
  confirm flash RAM code has no external calls; loader sections stay in RAM.
  Tightened application write windows to staging only (upstream also permits
  project/sample stores). The separate loader retains its audited write windows.
- Preserved USB SIE single-owner polling: only timer ISR touches registers during
  normal operation; audio does not access USB. Main-loop retry occurs with USB
  down, following upstream. Startup USB init precedes timer/IRQ enable.
- Added explicit audio quiescence and guarded restart, because this adapter uses
  128-frame audio halves and different ownership from the upstream sequencer.
  Host mocks cannot validate interrupt latency; hardware measurement remains open.
- Commit retains upstream USB detach/delay/reset sequence and clears intentional
  reboot failure counters. Upstream reset helper opens protected mailbox writes.
- Generated USB changes are only product/manufacturer descriptors and include
  path; generated loader change is only identity. Attribution is in NOTICES.md.
- Confirmed recovery download by pinned hash, not filename/version inference.
  V15 compatibility with the user's reportedly V16 unit still requires physical
  chip/flash/head validation and a private per-device backup.

## Still required before device qualification or submission

1. Review the local emulator extensions against hardware observations or upstream
   acceptance. Exact-candidate boot/note and panel stress pass in that research
   model; ROM/reset and USB-MIDI update coverage remain absent.
2. Recheck/reserve the provisional Hub identity; validate physical USB port name,
   enumeration, identity and outgoing update on the actual hardware.
3. Confirm exact unit/version/revision; establish its recovery route and make a
   verified private full backup using a separately approved procedure. No backup
   tool has been run, including its RAM-loader upload.
4. Obtain explicit approval for a controlled first installation, then qualify
   audio deadlines/stack/controls and entry from V15, another firmware and the
   user's actual starting version. Demonstrate leaving Guitchordi successfully.
5. Independent human review and actual recovery evidence remain advisable before
   release. Publish only after explicit approval and qualification of that exact
   binary; local tests cannot close the hardware gates.
