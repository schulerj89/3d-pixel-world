# Beach world visual QA

Captured from the isolated `codex/beach-world-revamp` worktree at 1280×720 on 2026-07-13. Each route used `?perf&beachPose=<pose>` and waited for `document.body.dataset.beachAssetStatus === "ready"` before capture.

## Final captures

| File | Pose | Visible-browser result |
| --- | --- | --- |
| `beach-overview.png` | `overview` | 56 FPS, 110 calls, 25,223 triangles |
| `beach-water-shore.png` | `waterShore` | 57 FPS, 18 calls, 11,368 triangles |
| `beach-town-buildings.png` | `townBuildings` | 57 FPS, 31 calls, 11,490 triangles |
| `beach-npc-group.png` | `npcGroup` | 57 FPS, 102 calls, 27,010 triangles |
| `beach-npc-marina-full-body.png` | `npcMarina` | 56 FPS, 60 calls, 21,218 triangles |
| `beach-npc-kai-full-body.png` | `npcKai` | 57 FPS, 68 calls, 20,642 triangles |
| `beach-npc-sol-full-body.png` | `npcSol` | 57 FPS, 51 calls, 13,610 triangles |
| `beach-npc-tala-full-body.png` | `npcTala` | 57 FPS, 49 calls, 18,692 triangles |
| `beach-npc-milo-full-body.png` | `npcMilo` | 57 FPS, 57 calls, 16,786 triangles |

All captures stayed below the Beach contract of 140 render calls. The new Beach-only runtime art totals 1.37 MB, below the 8 MB scene budget.

## QA iterations applied

1. Browser QA found the animation loop reading the lazy Beach binding before initialization. The binding now initializes with shared game state before the first animation frame.
2. The low shoreline camera exposed a black finite-world horizon. A camera-recentered gradient sky dome now backs the reflective water at every debug pose.
3. The first town pose showed building backs and the first crowd pose hid NPCs behind structures. Both camera routes and two promenade placements were revised.
4. The first full-body NPC route was blocked by the café and then showed the model's back. The close-up cameras and Kenney skate-character yaw corrections now show intact faces and grounded feet.
5. Independent QA rejected three ruler-straight foam bars and palm-obstructed crowd evidence. The shoreline now uses one feathered irregular shader ribbon, the two promenade occluders were removed, and all five NPC close-ups were captured.

## Gates

- Asset state: `ready` in all five final captures.
- Water: Three.js r160 Water, local normal map, 256×256 reflection target, no black horizon or rectangular clipping in the final shoreline capture.
- NPCs: five unique CC0 GLBs, five active authored `idle` clips, distinct silhouettes, intact eyes/materials, and no shared-skeleton cloning.
- Town: KayKit City Builder Bits roads, crossings, storefronts, benches, streetlights, and car templates are visible at chibi scale.
- HUD: Menu, money, joystick, and performance overlay remain separated and readable.
- Regression: all repository Node assertion tests pass, including `tests/beach-world.test.js`.
