# Restaurant kitchen checkerboard QA

Captured from the local static build on 2026-07-13. Each URL uses the stable `restaurantView` debug pose and loads the Restaurant destination with the curated KayKit Restaurant Bits GLB.

| Screenshot | Debug pose | Player position | Camera `(angle, height, distance)` | Review |
| --- | --- | --- | --- | --- |
| `kitchen-overview.png` | `kitchen-overview` | `(0.5, 0, -31.5)` | `(0.35, 15, 17)` | Full 25×25 checkerboard coverage; clean wall perimeter; fixtures and player above the surface. |
| `kitchen-fixtures.png` | `kitchen-fixtures` | `(0.5, 0, -37.5)` | `(0.15, 8, 9)` | Refrigerator, prep counters, stoves, sink, and cabinets sit at the shared `y=0` floor surface without sinking. |
| `kitchen-doorway.png` | `kitchen-doorway` | `(0.5, 0, -23.5)` | `(0.35, 6.5, 8)` | Checker pattern reaches the doorway without gaps or a raised threshold. |

Runtime asset: `floor_kitchen` from `assets/models/restaurant/kaykit-restaurant-kit.glb` (`sourceReady: true`). The authored floor is rendered as 49 fitted 4×4 modules in one instanced batch. The fallback uses 625 1×1 cells split into two instanced color batches.

Browser console review found no new errors. The only warning was the repository's existing Three.js legacy-build deprecation warning.
