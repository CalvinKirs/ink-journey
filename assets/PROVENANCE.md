# Artwork provenance · v16 (including earlier artwork history)

All raster illustrations were produced for this project with the built-in image-generation tool. The underlying model/version was not independently selectable or verified. The following are design-brief summaries, not verbatim prompt transcripts.

- `unified-original.png`: one 2172 × 724 ink/gongbi-inspired river landscape, from reeds and a waterfall through a pine-covered tiger path to an artistically imagined Hanshan Temple. A single continuous horizon, river and lighting progression; no foreground tiger or boat baked in. Not a verified reconstruction of the real temple.
- `boat-shore-original.png`: transparent 1774 × 887 wooden cabin boat with warm lantern, matching the master painting.
- `tiger-shore-original.png`: transparent 1536 × 1024 alert tiger, with original soft translucent ink wash preserved around its body.
- `tiger-alert-original.png`, `tiger-roar-original.png`, `tiger-swipe-original.png`: three matching 1672 × 941 cinematic tiger compositions. The alert pose was edited from the roar scene; the swipe adds a distinctly raised paw.

Original PNG bytes are preserved unchanged. The master uses a quality-94 JPEG embedded in `unified-image.js`; shore actors use quality-94 WebP with alpha in `actor-images.js`; cinematic images retain their embedded JPEG copies. Only local format encoding/compression was applied. No manually invented background removal or substitute generated artwork was used. Canvas rendering crops transparent boat padding, preserves image proportions, and supplies bounded motion/wake/door effects.

The original V7 paintings and source remain in the preserved V7 archive rather than bloating this revised runtime package. V8 uses a single master, not a panel collage. Egrets and double doors are original procedural art. Environmental audio, wordless chant-like texture, bells and tiger sounds are synthesized, not wildlife/temple/voice recordings or recited scripture.

## Original asset SHA-256

- `boat-shore-original.png`: `2093a290d4165528a73427fb773fc62d184ddf030b3bcec3e6077d730624a57f`
- `tiger-alert-original.png`: `fcea90366b178495c81366bff80a8d3903d4934054e3dab32e22bf2d0e2e7792`
- `tiger-roar-original.png`: `acc2f957ab92e5dd825d67f23a8e09ae92bad2ec970747a23d63b5904cb39c01`
- `tiger-shore-original.png`: `8b97b1e3240f98b4ac5cfc70d6a9e6efe44edbd6aea23f75353a08ffa3f34093`
- `tiger-swipe-original.png`: `266d127d30f83ed1da848ab9a39d021a85f6c60dad27ee600e77f58cc9786af2`
- `unified-original.png`: `84106d92c5cbe9555a06c8e0b1f5ce049136924ac604fa84af41ec2931927676`

## V9 courtyard and motion

- `courtyard-original.png`: generated 1536 × 1024 autumn temple courtyard, using the v8 master as a style reference. A bell pavilion stands left, an incense burner center, and a lotus/koi pond right. This is an artistic scene inspired by Hanshan Temple, not a documentary reconstruction. Original PNG unchanged; quality-87 JPEG embedded in `courtyard-image.js` for offline runtime.
- V9 adds original procedural waterfall flow, individual egret flights, and a connected texture mesh for two-dimensional tiger articulation. It does not use wildlife video or claim full 3D motion. Courtyard fish, smoke, light, ripples and leaves are Canvas overlays; some fine details also remain painted into the base artwork.

- `courtyard-original.png`: `6fbf209f5fe44a4cd6b04cf697b06ce853c77f7b4202d5a9ed1de6e0a2c520c9`

## V10 correction

The unchanged original master PNG and three cinematic tiger PNG poses are embedded using lossless WebP encoding at their original pixel dimensions. This supersedes the earlier JPEG runtime encoding descriptions for these four images. No sharpen/upscale or new source detail is claimed. Zoom is limited by source resolution, and the shore animation is now a planted idle rather than simulated walking.

## V10 grounded tiger

- `tiger-standing-original.png`: corrected generated standing pose, 1536 × 1024 RGBA, three visible planted paws with the far hind leg occluded. Original PNG bytes unchanged. Runtime `actor-images.js` tiger property uses full-resolution lossless WebP with alpha preserved; boat property unchanged. The rejected five-paw intermediate was not used.
- SHA-256: `7ab06368b33aace90a3a1d2e03521e562d77b1ec9a5fc6a7471f0218739eea6d`.
- Grounded idle only: fixed footprint, fixed contact shadows, exact zero deformation below normalized y = .70. Upper-body breath, head, ears and tail remain subtly animated; no walking claim.

## V11 shore-tiger poses

Five generated RGBA illustrations use the V10 standing tiger as the visual reference. Each unchanged original is 1536 × 1024. Runtime copies retain native dimensions and alpha in lossless WebP; fully transparent RGB may be normalized by the encoder. No resizing, sharpening or added detail is claimed. These are separate two-dimensional poses, not a 3D rig or captured wildlife movement.

- `tiger-crouch-original.png` (crouch): SHA-256 `fe0f9c2852a0b7ffe30b32778a9d37f7375cb76b720fbe2e73b66f1cc999ad9d`.
- `tiger-side-original.png` (side): SHA-256 `1eccb960b6b1de4e15bc36e4e73d1ebb281eaaea0181e5de68fd2f14dec34aae`.
- `tiger-pounce-original.png` (pounce): SHA-256 `018c00deb5641f0efa73e6a942bd11f1a5cb01b50a6c666f4a9aef78181f8026`.
- `tiger-back-original.png` (back): SHA-256 `a456e682cb6f82314d18c1c857e15a3de0d7065ed93a9d64dddeb616a3a9f253`.
- `tiger-prone-original.png` (prone): SHA-256 `edac76448153e7116466f6e34acd8068f48def8cb8602c179c37afd7acbcf4ed`.

The back-roll illustration has a slight rightmost ear edge crop in the original. It is used at the small shore-actor scale, not as a new high-magnification portrait. Body proportions and contact anchors are calibrated per pose rather than stretching every frame to a common silhouette.

## V12 scenic extensions

Two new 2172×724 RGB panoramic paintings were generated using the unchanged original master as reference. Left adds bamboo, terraced hills and small cascades; right adds river villages, hills and a distant bridge. An image-generation edit removed each extension’s extra sun disc. The final corrected originals are preserved below; initial alternatives are not shipped. Full-resolution lossless WebP preserves original pixels. No resizing or sharpening. Native aspect placements overlap only the outer margins, using procedural edge masks without stretching.

- `extension-left-original.png`: SHA-256 `24e3cc3c1602f9d565a27152d5879e8fcb3a0fa0eed266008beec35aebdf5399`.
- `extension-right-original.png`: SHA-256 `713df06a84e364710008bdc7daa5d9706717960450a9766a161ffc24139f6fd4`.

## V13 motion layers

No new generated paintings or external assets. The river layer derives one immutable 6082×724 masked texture from the existing landscape renderer, then samples its water rows with shared-clock displacement. Original image files remain unchanged. Cloud masks are original procedural multi-lobed gradients (three small512×128 caches); mountain and foreground pixels are not geometrically displaced. No preview recordings are included in this repository.

## V14 outer scenic extensions and interactions

Two further 2172×724 panoramas use the existing west/east paintings as image-generation references. The west tea pavilion/bamboo landing and east lotus/fishing village are newly generated, not repeated or stretched. The west painted bell was removed through imagegen so a native swinging bell can occupy the same eave without a duplicate. The east leftmost pine/rocks/reeds were revised through imagegen to continue the previous panel edge. Runtime copies are lossless native-resolution WebP. Earlier alternatives remain outside the delivered source.

Final originals: `outer-left-original.png` and `outer-right-original.png`. Initial alternatives are not runtime assets and are not included in this repository.

Bell, stone hops, ripple contacts, kettle steam, fish feeding and river lantern are original procedural Canvas drawings animated by the application's shared clock.  The river cache expands once to 9992×724; existing terrain is not geometrically displaced.

- `outer-left-original.png` SHA-256: `c348b17781befd7d25a7fea2a4b8b8badb529247b4cb95434ae44da047416cfe`.

- `outer-right-original.png` SHA-256: `d87fed239a1eb3605b7c382de2b2112d7c57d05eeae7c03cc7f38019bb6e59ca`.
