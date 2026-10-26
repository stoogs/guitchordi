# First FM-1 device test: preparation, not clearance to flash

**Status: NOT CLEARED FOR FIRST FLASH.** No physical FM-1 has run this candidate. Passing host tests cannot guarantee that it will not leave a device unbootable. No device discovery, backup or flash operation has been performed by the preparation scripts.

## What is prepared and blocked

Run `npm run build:fm1`, `npm run test:fm1`, then `python3 scripts/prepare-device-test.py`. The last command attempts to stage an ignored `build/device-prep/` folder containing the experimental candidate, stock V15 only if its pinned hash matches, a pinned WL82 recovery loader, pinned reference installer/rescue source, this guide and a checksum manifest. It downloads files only; it does not install dependencies or execute the recovery tools. Keep a separate copy of the folder before connecting hardware.

The copied reference tools retain their GPL notice/license. Their original source is [X0X at the recorded revision](https://github.com/charlesvestal/fm1-x0x/tree/54194c54bb01e9d9b3fe9d641b3ddfa512ac04a3). Recovery guidance is also available in the [upstream manual](https://charlesvestal.github.io/fm1-x0x/manual/) and [build instructions](https://github.com/charlesvestal/fm1-x0x/blob/main/BUILDING.md).

**Restore-file blocker resolved (25 October 2026):** the official M-VAVE repository at
`4c7496daac04a95ff10d1afdcc8f9ead2dbabc41/sdk/firmware/FM-1_015.fwsc` provides
699,956 bytes with the unchanged pinned SHA-256
`db1642b2b6fa5c2cccb11ffd13878068bb28601678d3644049f99dc40e7edb8a`.
Preparation now stages this exact file. The moving vendor URL previously returned
V16 and remains rejected as V15. No hash bypass or hardware restore was performed.

## Audit results and limits

1. Target compilation checks entry stub, section placement, image size, RAM/pool bounds, ROM references and absence of software-double routines. Standard EADGBE remains unchanged. Startup defaults: Steel Acoustic, Classic Rock, 90 BPM; Freeplay until ARP selects Strum/Arp. Strum defaults Down / 1/8 / FREE / 50 ms. Settings saved in the browser override factory defaults.
2. The portable updater/loader tests use this exact package. They check CRCs, key/header refusal, application replacement, staging bounds, idempotence, and preservation of flash head `[0, 0x4000)` and unrelated storage. An additional fault harness interrupts after each flash erase/program operation and checks recovery **if the loader is re-entered**. It does not simulate USB electronics, the stock SPL, complete processor resets or loss of power on a real chip.
3. Code review confirms a watchdog, exception-to-UBOOT route, retained warm-reset boot counter, and a five-second hold of both octave buttons to request chip update mode. These routes are compiled, not hardware-tested. A cold power cycle can lose RAM-held boot-counter state. They must not be treated as guaranteed recovery.

**Critical limitation:** runtime USB identity/OTA hooks are now integrated and host-tested,
but physical enumeration, installation and outgoing updates are unverified. An
identity timeout must never be counted as successful installation or resolved by
blind retries. See [local qualification evidence](local-qualification.md).

## Required before the first write

- Record the exact M-VAVE FM-1 model/hardware revision and current firmware identity. Match against the reference tool's accepted chip and flash identifiers; a different unit must be investigated, never forced through a guard.
- Export current presets/projects through their own firmware's supported backup tool. Stock restoration may replace application data; a generic project backup is not a full flash backup.
- Establish an independent recovery route **before installing the candidate**. Confirm chip-update USB enumeration (`4C4A:8057`) or have a verified FM-1 Transporter route available. Do not infer this from the browser simulator. Once a device is confirmed in recovery, use an explicitly reviewed backup-only operation to save its complete per-device flash and verify the backup size/checksum. The reference rescue tool's default mode is flash-read/backup-only but uploads and runs a RAM loader; it is not a passive USB identity check.
- Retain the verified stock file and that unit's backup offline. The pinned rescue tool accepts only its known stock hash and expected chip/flash tuple, checks the protected flash head, and verifies final writes. Its refusal is a stop condition.
- Decide and review the initial installation route for the actual starting firmware, including testing the new outgoing-update handshake and independent recovery. Do not use `--force` to bypass checks.

The upstream documentation says ROM recovery can work when the chip enumerates in update mode; otherwise a hardware Transporter may be necessary. This remains a condition to verify on this particular unit, not a no-brick guarantee.

## First bring-up after those gates are met

Use a direct, reliable USB data connection and stable power. Start with speakers disconnected or amplifier volume very low. Install only the manifest-matching candidate using the reviewed route. Stop on any unexpected identity, verification error or recovery behaviour.

Check one screen, one chord key, one white key, master volume and both octave buttons before dense playing. Confirm quiet stereo output and actual sample rate. Measure `gm_device.max_render_us` and `late_halves`; each 128-frame audio half has about 2.90 ms at 44.1 kHz. Increase load gradually from one note to fourteen. Check button/encoder/LED mapping, release tails, FX toggle and strum timing. SAVE is RAM-only on the device.

Verify return to update mode and restoration of stock before considering this build hardware-ready. Log the exact package hash, results and recovery evidence. Device performance, stack margin and latency remain unmeasured until then.
