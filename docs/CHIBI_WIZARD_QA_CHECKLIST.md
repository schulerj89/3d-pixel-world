# Locked-Chibi Two-Step Wizard QA Checklist

Baseline reviewed: `main` at `98dbc0377e3ae78328ec8b1fa3bc6c8bc30aca75`.

Target flow: **Title -> 1. Customize colors -> 2. Choose a world -> Loading -> World**. The authored Styloo chibi is the only selectable player model. The same animated 3D preview remains visible on both wizard steps.

## Current blockers

- [ ] Replace the current character-type chooser plus Looks/Outfit/Realm tabs. It is a three-screen, three-tab flow rather than the requested two-step wizard.
- [ ] Remove character type, hair style, adventure outfit, outfit color, and astronaut helmet controls from the wizard. These controls manipulate voxel fallback parts; the loaded Styloo model hides those parts, so the controls are misleading or appear broken.
- [ ] Remove the old outfit override in `humanoid-character.js`. Today any persisted non-`Everyday` `saved.outfit` makes `schooloutfit` use `outfitColor` instead of the selected `shirt` color.
- [ ] Fix compact-landscape sizing. At 667x375 through 932x430, `.customizePanel` is forced to a 430px minimum height, so the page cannot remain within the visible Safari viewport.
- [ ] Add explicit focus movement and restoration. Current screen transitions change `hidden`/`aria-hidden` but do not focus the new screen heading, and the back action does not restore focus to its invoker.
- [ ] Pause the wardrobe preview RAF while gameplay is visible. The current preview renderer continues rendering after a world is selected and has no disposal/debug lifecycle.

## Implementation contract

### State and navigation

- [ ] Represent the wizard with one state value: `colors` or `worlds`; do not infer state from CSS classes.
- [ ] On `Start Game`, open `colors`, keep the preview in idle, and focus the step heading (`tabindex="-1"`).
- [ ] Step 1 contains only four color groups and a primary `Choose a world` button.
- [ ] Step 2 contains the persistent preview, all six world destinations, and a visible `Back to colors` button.
- [ ] Selecting a world is the submit action; disable repeat activation until the loading transition owns the screen.
- [ ] `Back to colors` preserves the current palette and preview yaw, then restores focus to `Choose a world` or the colors heading.
- [ ] The in-world `Places`/`backPlaces` action opens the `worlds` step. The in-world edit-character action opens `colors`. Neither may reopen the removed character-type screen.
- [ ] If browser history is integrated, `popstate` moves `worlds -> colors -> title` before leaving the page. If history is not integrated, do not add partial history entries; the visible Back buttons remain authoritative.
- [ ] Hidden wizard steps use `hidden` (or `inert` plus `aria-hidden`) so none of their controls remain tabbable.

### Locked model and live color mapping

The four supported persisted keys must map directly to the four audited Styloo material names:

| UI group | Saved key | GLB material | Default |
| --- | --- | --- | --- |
| Skin tone | `skin` | `character` | `0xf2bb91` |
| Hair color | `hair` | `hairvariant` | `0x6b3c35` |
| Top color | `shirt` | `schooloutfit` | `0xb77cff` |
| Bottom color | `pants` | `schoolskirt` | `0x5870c8` |

- [ ] Tint every cloned material with a matching name, including multiple meshes using the same named source material.
- [ ] Apply each selection immediately to both the wardrobe preview and in-world model, then persist it.
- [ ] Preview and world instances must own separate cloned materials; changing the preview must not mutate a cached GLTF prototype or another model instance.
- [ ] Keep the authored mesh, skin, skeleton, idle/walk/run clips, and `+Z` forward convention unchanged.
- [ ] Always show a full-body idle preview with face and shoes visible. Default yaw is zero so the face looks toward the camera.
- [ ] Dragging horizontally rotates only the preview. Handle `pointercancel` and `lostpointercapture` as well as `pointerup`; do not allow vertical page panning to become stuck.
- [ ] Ignore removed legacy keys at runtime. One-time normalization should prefer an existing `shirt`; use `outfitColor` only when `shirt` is absent, then remove or permanently ignore `characterType`, `hairStyle`, `outfit`, `outfitColor`, and `astronautHelmet`.
- [ ] Loading or GLB failure keeps a clearly labeled fallback preview without re-exposing removed model/outfit controls.

### Removed-control regressions

- [ ] No wizard DOM or visible copy references Heroes, Princess, Wizard, Explorer, Beach Star, Astronaut, hair style, adventure outfit, outfit color, or helmet.
- [ ] Remove or guard listeners for `characterTypeOptions`, `continueToCustomize`, `backToCharacterTypes`, `startHairStyle`, `startOutfit`, `startOutfitColor`, and `startAstronautHelmet`; startup must produce zero null-reference errors.
- [ ] Remove `applyCharacterTypeDefault`, `CHARACTER_TYPES`, and the old type-to-outfit transition from the active flow.
- [ ] Do not delete the voxel model until GLB failure behavior is deliberately replaced; keep it strictly internal and hidden when the Styloo model is valid.
- [ ] The in-world avatar shop, if retained, exposes only supported chibi color regions. It must not resurrect model, hairstyle, wearable, or helmet selection.
- [ ] Existing saves containing every removed key still load the chibi, show the correct four colors, enter all six worlds, and save without restoring removed choices.
- [ ] Returning from each world does not recreate duplicate preview canvases, animation loops, event listeners, or GLB instances.

## Landscape layout acceptance

Use `100dvh`, safe-area insets, and a no-page-scroll layout. A panel may scroll only as an emergency at 200% text zoom; ordinary landscape sizes must fit without scrolling.

Test these CSS viewport sizes:

| Class | Required viewport samples | Layout acceptance |
| --- | --- | --- |
| iPad landscape | 1024x768, 1133x744, 1194x834, 1366x1024 | Preview and controls form two columns; color groups fit in one view; world grid is 3x2. |
| iPhone landscape | 667x375, 844x390, 852x393, 932x430 | Compact two-column layout; world grid is 3x2; no clipped heading, Back, primary action, or world tile. |

- [ ] Wizard bounds stay inside `env(safe-area-inset-left/right/top/bottom)` with at least 8px additional breathing room.
- [ ] `document.scrollingElement.scrollHeight <= window.innerHeight + 1` at every ordinary test viewport and on both steps.
- [ ] No control, preview canvas, or focus ring crosses its card bounds.
- [ ] All tap targets are at least 44x44 CSS px with at least 8px separation where accidental activation is likely.
- [ ] The preview is at least 180x240 on iPad and 112x168 on short iPhone landscape; the full body remains readable at both sizes.
- [ ] Color groups use compact rows/grids; they do not require nested horizontal scrolling.
- [ ] The six world tiles remain fully visible and readable. Labels do not truncate at 200% text zoom; at that zoom, controlled internal scrolling is acceptable.
- [ ] Rotation, address-bar expansion/collapse, and `visualViewport` resize do not leave stale canvas dimensions or move the primary action offscreen.
- [ ] Long-press and double-tap do not select decorative text or zoom the page; editable controls, if later added, retain normal text behavior.

## Accessibility acceptance

- [ ] Each step has a unique heading and visible `Step 1 of 2` / `Step 2 of 2` text. Do not rely on color alone.
- [ ] Each color group is a `fieldset`/`legend` or labelled `radiogroup`. Swatches use radio semantics (`aria-checked`) rather than independent toggle semantics.
- [ ] Every swatch has a human name such as `Deep brown hair`, not `Color 1`.
- [ ] Selected state uses the requested border highlight without a checkmark. The border/background difference is at least 3:1 against adjacent colors.
- [ ] Keyboard arrows move within a swatch radio group; Tab moves between groups and primary actions. Enter/Space activates the focused choice.
- [ ] `:focus-visible` is visually distinct from the selected border and is never clipped.
- [ ] World buttons have accessible names matching their visible destination labels and expose disabled/busy state during launch.
- [ ] Loading remains `role="status" aria-live="polite"`; do not announce every preview rotation or color repaint.
- [ ] Decorative emoji and the preview canvas are hidden from the accessibility tree unless useful alternative text is provided once on the preview region.
- [ ] `prefers-reduced-motion` stops decorative motion and preview auto-turn, but manual preview rotation and color updates remain functional.

## Automated checks

- [ ] DOM contract test: exactly two wizard steps, four color groups, six world buttons, one preview mount, and none of the removed controls/copy.
- [ ] State test: title -> colors -> worlds -> colors, including focus destination and preservation of values/yaw.
- [ ] Keyboard test: radio arrow navigation, Tab order, Enter world launch, and no tabbable nodes in the hidden step.
- [ ] Persistence migration test using a save with all legacy keys plus explicit `shirt`; `shirt` must win over `outfitColor`.
- [ ] Material test: selecting one extreme palette produces exact hex values on `character`, `hairvariant`, `schooloutfit`, and `schoolskirt` in both preview and player.
- [ ] Isolation test: preview material objects are not identical to player or cached-prototype material objects.
- [ ] Lifecycle test: one preview RAF/canvas/GLB instance across repeated step changes; RAF pauses in-world and resumes once on return.
- [ ] Asset contract remains 3,753,900 bytes, 10,586 triangles, skinned, with `anim_iddle`, `anim_walk`, and `anim_run`.
- [ ] Facing test remains `+Z` with no corrective half-turn and validates front-facing travel in every world.
- [ ] Viewport bounds test records wizard/card/control rectangles and asserts the landscape criteria above.
- [ ] Run the complete existing test suite after removing old controls to catch unguarded legacy references.

## Deterministic screenshot route

Add a QA-only debug hook that can set `step`, exact palette, preview yaw, and idle time without manual dragging. Record viewport, step, palette, yaw, model status, renderer calls/triangles, and active focus in each capture manifest.

1. `menu-chibi-colors-ipad-1194x834-front.png` — default palette, yaw 0, Step 1; full body, all four groups, selected borders, and primary action visible.
2. `menu-chibi-colors-iphone-844x390-front.png` — same pose at short landscape; verify safe areas and zero page scroll.
3. `menu-chibi-colors-iphone-667x375-contrast.png` — darkest skin, pink hair, gold top, white bottom, yaw 0.55 rad; confirm all four material regions independently.
4. `menu-chibi-colors-ipad-1024x768-focus.png` — keyboard focus on a non-selected swatch; focus and selected borders must both be unambiguous.
5. `menu-chibi-worlds-ipad-1194x834.png` — Step 2, six destinations, preview, Back, and no removed controls.
6. `menu-chibi-worlds-iphone-844x390.png` — compact 3x2 world grid with no clipping or overlap.
7. `menu-chibi-worlds-iphone-932x430-safe-area.png` — simulated nonzero left/right safe insets; edge world tiles and Back remain inside bounds.
8. `menu-chibi-colors-returned-1194x834.png` — return from a world; palette/yaw preserved and only one preview canvas visible.
9. `menu-chibi-fallback-844x390.png` — forced GLB load failure; readable fallback state, usable color/world navigation, no removed controls.

For each color screenshot, inspect face, hair, torso, and skirt/bottom visually before reading debug values. For each world screenshot, inspect layout and focus before interpreting renderer metrics.

## Release gate

Pass only when all ordinary landscape screenshots fit without page scrolling, all four colors visibly and numerically map to the live chibi, removed controls cannot be reached through any entry point or old save, Back/focus behavior is deterministic, and the full test suite remains green.
