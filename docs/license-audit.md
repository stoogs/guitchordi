# License/provenance checkpoint - 25 October 2026

Scope: the checked-in project, its current Docker/WASM artifact and the inputs
of the experimental FM-1 build. This is a recorded engineering inventory, not
a guarantee about future imports or all possible legal uses.

- Root combined-project license is GPL-3.0-only. Full GPL text retained.
- All **33** pinned platform files were SHA-256 checked against their import
  manifest, including the original GPL text and X0X licensing record. No imported
  file was edited to add Guitchordi notices; adaptations stay in our own files.
- The MIT `phys_dsp.c` hash matches the audited Clipper leaf. Its original
  Electrosmith / Emilie Gillet / Leo Kuroshita credit and permission/disclaimer
  remain in source; a standalone notice now accompanies it.
- `display-font.h` records the hash of the supplied Noto Sans font. The test
  verifies that hash against the actual font. Its full OFL text is retained.
- Emscripten and musl notices remain included with the WASM/source distribution.
- The pinned SDK root tree and full recursive tree were inspected through GitHub
  at `d179b4484759423312073f5fbb232501aa491047` (not truncated). Its root LICENSE
  is retained; its only two NOTICE paths belong to uC-HTTPc, which is not imported
  or linked here. Three package inputs and the license are pinned by setup hashes.
  Recheck license scope/notices if any SDK inputs change; no general permission
  is asserted for other SDK libraries or the separate FM1 Open binary engine.
- Melodee/FoMni and other research-only references are distinguished from copied
  dependencies. No unrelated X0X instruments/assets are claimed as imports.
- The processor emulator is downloaded only under ignored `build/`, with its
  own GPL-2.0 and library notices intact, and is not bundled with our product.
- Printable documents use host-provided Arial subsets; this is explicitly
  distinguished from the OFL device font. Those document font files are not
  vendored or advertised as GPL/MIT source.

New distribution provisions:

1. [NOTICES.md](../NOTICES.md) is the central attribution and component inventory.
2. The browser has a credits link to full license texts and its matching source
   archive, with archive SHA-256 and a per-file manifest.
3. Docker packages source, build scripts, chord/tuning inputs, font source,
   retained platform sources and notices, tests and build configuration. Build
   downloads, secrets, Git metadata and user flash backups remain excluded.
4. The downloaded archive was checked for its required inputs, every manifest
   entry and private-path exclusions. A clean extracted-source WASM rebuild is
   part of this checkpoint: it matched the served WASM byte-for-byte. Release binaries still require exact release-source
   packaging and the qualification steps in [hub-submission.md](hub-submission.md).

Automated retained-byte and license checks: `npm test`
(`tests/licensing.test.mjs`). Served-asset checks: `npm run smoke:simulator`.
