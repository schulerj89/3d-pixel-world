# Restaurant authored-wall screenshot QA

Scene: `restaurant`. The live KayKit restaurant GLB loaded successfully in all
captures, and the browser reported no application console errors. The current
build does not expose an FPS or renderer-memory overlay.

| Screenshot | Debug pose / character position | Camera | Result |
| --- | --- | --- | --- |
| `wall-north-doorway.png` | `restaurant-wall-north-doorway` / `(0, 0, -16)` | Follow target; angle `0`, height `6.5`, distance `8` | Shared wall renders once, modules meet cleanly, and the four-unit kitchen doorway remains open. |
| `wall-southwest-1.png` | `restaurant-wall-southwest` / `(-14, 0, 16)` | Follow target; angle `2.35`, height `7`, distance `8` | South and west authored modules form a closed perpendicular corner without a wall gap. |
| `wall-southeast-1.png` | `restaurant-wall-southeast` / `(14, 0, 16)` | Follow target; angle `-2.35`, height `7`, distance `8` | South and east authored modules form a closed perpendicular corner without a wall gap. |
| `wall-kitchen-northwest.png` | `kitchen-wall-northwest` / `(-8, 0, -41)` | Follow target; angle `0.8`, height `6.5`, distance `7` | Kitchen north/west corner is closed; refrigerator and cabinet backs sit against the thinner authored wall. |
| `wall-kitchen-northeast.png` | `kitchen-wall-northeast` / `(9, 0, -41)` | Follow target; angle `-0.8`, height `6.5`, distance `7` | Kitchen north/east corner is closed; stove, sink, and cabinet remain wall-aligned. |

All visible restaurant shell walls use the pack's `wall` scene. The prior
Three.js box wall is retained only as a GLB load-failure fallback.
