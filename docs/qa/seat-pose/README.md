# KayKit seating pose QA

Captured at 1280 × 720 from the local game build on 2026-07-13.

## Screenshot roll

1. `sofa-seated-pose.png` — Styloo rig using its authored crouch-idle pose on the KayKit `couch_pillows` cushion, with the visible **Stand up** action confirming seated interaction state.
2. `chair-seated-pose.png` — the same rig pose aligned to the KayKit `chair_A` seat, independently positioned from the sofa.

## Runtime validation

- Character asset: `styloo-chibi-student-v1.2`, status `ready`, fallback `false`.
- Authored seated clip: `anim_crouchiddle`, loaded and active as runtime state `sit`.
- Sofa root while seated: `(-2, 0.35, 0.87)`; asset status `ready`.
- Chair root while seated: `(2, 0.30, 0.97)`; asset status `ready`.
- Standing from the chair restored `seated: false`, character state `idle`, and player height `y: 0`.
- Renderer during chair capture: 37 calls, 14,606 triangles, 291 geometries, 14 textures.
- No asset, animation, or runtime console errors were observed. The only warning was Three.js's existing non-module build deprecation notice.

The sofa and chair were placed, separated, and rotated through the normal build UI. For deterministic screenshot framing only, the player was moved to a known nearby QA position before pressing the visible **Sit down** control; no position shortcut is part of the shipped code.

## Automated validation

- `node --check humanoid-character.js`
- `node --check house-system.js`
- `node --check game.js`
- `node --test tests/*.test.js` — 15 passed, 0 failed
