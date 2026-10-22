# 山水之间 · 入画 / An Ink Journey v16

An interactive ink landscape made with static HTML, CSS, Canvas and Web Audio. The source runs locally with no build step, runtime dependencies, API keys, remote artwork, analytics or downloaded fonts.

## Language

English is the v16 default when no valid saved language preference exists. A previously saved Chinese preference is retained; saved English is also respected. Use 中文 / EN in the header or either scene dialog to switch languages. If browser storage is blocked, the next visit defaults to English. Switching language preserves the current scene, drawings, inscription, seal and interaction state. The language preference persists locally; the journey and personal artwork otherwise reset on reload.

## Run locally

Open `index.html` in a current browser, or serve this directory:

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. Keep all JavaScript files beside `index.html`. Original PNGs are in `assets/`; the runtime uses locally embedded image copies in JavaScript. This repository contains source and artwork only, with no deployment workflow or hosting setup. The inherited empty `.nojekyll` marker is retained as part of the source; it does not enable hosting.

## Explore the scroll

- Five distinct panoramic paintings form a 33,120-unit scroll, 4.6 times the original central painting's width. Explore the bamboo tea landing, waterfall gorge, tiger path, imagined Hanshan Temple and lotus-side fishing village by dragging, swiping, chapter buttons, the position slider, or Left/Right and Home/End while the artwork is focused.
- The river animates painted water and reflections through texture displacement. Drifting cloud and valley-mist layers share the scene clock, alongside waterfalls, independent egret flights and a moving boat with a wake.
- The shore tiger has a grounded idle and separate illustrated crouch, pounce, roll and prone poses. A separate cinematic encounter offers roar, paw swipe and approach actions. These are two-dimensional image-based animations, not wildlife footage or a fully articulated 3D animal.
- Enter the temple courtyard for the bell, pond fish, incense and lantern light. Additional landscape destinations include an eave bell, skipping stones, kettle steam, fish feeding and drifting river lanterns.
- Use the ink studio to paint, undo, clear, add an inscription or seal, and export the current view as a PNG. Export before leaving to retain personal artwork.

## Sound, motion and accessibility

Sound starts muted and requires an explicit gesture. Wind, water, bells, the wordless temple texture and tiger sounds are locally synthesized; they are not field recordings or recited scripture. Entering a dialog, hiding the tab or leaving the page mutes environmental sound; re-enable it explicitly.

Pause controls freeze scene time. Reduced-motion mode limits energetic movement and provides settled feedback. Keyboard controls, visible focus, live announcements and dialog controls supplement pointer input. Freehand painting still requires a pointing device, and visual artwork is not fully represented through screen-reader narration. In Explore mode the page can scroll normally; in Paint mode use the area outside the artwork to scroll.

## Files and artwork

The repository contains 33 runtime files, 17 unchanged original PNGs, and five supporting files: this README, `LICENSE`, `.gitignore`, `assets/PROVENANCE.md` and `SHA256SUMS.txt` (55 files total). The inherited MIT license is preserved unchanged. See `assets/PROVENANCE.md` for artwork history, encoding details and original asset hashes. Generated paintings are artistic interpretations, not verified geographical or historical reconstructions.

All five landscape paintings retain their native 2172 × 724 source resolution. Logical scroll dimensions do not create new image detail. Limited edge overlaps have soft transitions; the panorama is not perfectly pixel-matched outpainting. Browser/device limits, long-session memory, physical touch and audible sound require testing on the intended devices.

## Verification limits

This upload preserves the v16 runtime and original artwork byte for byte. Documentation was cleaned for this repository and `SHA256SUMS.txt` was regenerated afterward. The checksum inventory covers every delivered file except the checksum file itself.

No actual browser QA was performed or claimed as part of this repository upload. Historical QA reports, validation artifacts, deployment workflows and hosting setup are excluded. Source integrity checks do not establish browser layout, touch, audio or performance results.
