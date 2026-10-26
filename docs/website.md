# GuitChordi project website

A static GitHub Pages site, with the C/WASM browser instrument at `emu/`, the
current HTML guide at `manual/`, an A4 cheatsheet and complete browser-source
archive. The source is in `site/`; output is ignored `dist/`. The page is a project
site for eventual Firmware Hub links, not a replacement or fork of the Hub.

## Build and preview

```sh
npm run build:site
npm run test:site
python3 -m http.server 8770 --bind 127.0.0.1 --directory dist
```

The build uses the pinned existing Emscripten Docker image. It compiles fresh
WASM, packages static assets, rebases simulator/license links and generates a
matching source archive with its checksum. `--skip-wasm-build` is for local layout
iteration only; the publishing workflow always compiles fresh WASM. Generated
content includes no `.fwsc` firmware, private flash backups, secrets or accounts.
The browser AudioWorklet needs HTTPS or localhost; GitHub Pages supplies HTTPS.
No server backend or cross-origin isolation is required by this single-threaded
WASM build.

The preview was checked under `/guitchordi/` as well as a 390-pixel iframe:
hero layout, instrument-family tabs (including Home keyboard selection), local
links, WASM startup and a white-key attack. Browser sound was muted during QA;
this verifies startup/input behavior rather than a listening comparison.
The static checker validates local HTML links, WASM magic, source checksum and
private-file exclusions. The codebase's 17 unit tests also pass.

## Publish on GitHub Pages

1. In `stoogs/guitchordi`, open **Settings → Pages** and choose **GitHub Actions**
   as the build/deployment source.
2. Open **Actions → Publish GuitChordi website → Run workflow** on `main`.
3. Wait for the build and Pages deployment jobs to succeed. The expected project
   URL is `https://stoogs.github.io/guitchordi/`; the playable instrument will be
   at `https://stoogs.github.io/guitchordi/emu/`.

The workflow is intentionally manual. A source push does not create a website
or firmware release. Pages was subsequently configured to use GitHub Actions with explicit user authorization. Publication status is recorded with the current deployment evidence.
Official references: [GitHub Pages static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages),
[custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Firmware Hub material

Suggested card copy:

> GuitChordi turns the M-VAVE FM-1 into a chord and string instrument,
> with 16 instrument colours, 50 chord styles, editable voicings, and Freeplay,
> Strum and Arp modes. Try the shared C instrument in your browser, then explore
> the FM-1 beta as device qualification progresses.

After Pages deployment, use the project and `emu/` URLs, the A4 PDF, and
`assets/boot-screen.png` (the actual 240 × 240 screen capture). License:
GPL-3.0-only with retained upstream notices. `FM-1_982` remains provisional.
The website carries no install button while firmware release qualification is
unfinished. The Hub still requires a qualified GitHub release, unique identity,
update loader and real entry/exit tests; [submission requirements](https://thefirmwarehub.com/submit/).
Do not send a submission, publish `.fwsc` downloads or label it Hub-approved until
those gates are completed and the user explicitly approves release/submission.
