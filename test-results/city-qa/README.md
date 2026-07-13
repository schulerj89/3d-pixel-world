# Chibi City visual QA

Captured from the isolated worktree with the visible in-app browser at 1280x720. Each route was loaded through the title screen and City world picker with the named `cityPose` query and the live performance overlay enabled.

## Final captures

- `city-overview.png` — complete 98x98 layout (exceeding the 70x70 target), building distribution, 3x3 road grid, and active traffic.
- `building-a-front.png` through `building-h-front.png` — every KayKit building type at its road-facing entrance with a full-body chibi scale reference.
- `traffic-lights-facing.png` — paired signals at a four-way junction, facing opposing approaches without intersecting the character.
- `cars-east-west-facing.png` — four-car-budget traffic in a deterministic QA formation; the nearest car is visibly taller than the chibi and all cars face their lane vectors.
- `cars-north-south-facing.png` — four deterministic cars align with the vertical lanes while the full-body chibi provides a scale reference.

## Findings and fixes

1. The initial center/south building poses showed rear walls. Their camera/player targets were moved to the road-facing entrances; the final captures show doors and storefront awnings.
2. The initial signal pose put the player under a signal arm. It was moved five units down the approach; the final signal heads and poles are unobstructed.
3. A long-duration capture exposed camera-dependent holes in the instanced sidewalk. The final ground uses four shared, non-culled basic-material quadrants and disables realtime City shadow maps; every regenerated A-H capture is clean.
4. Twelve pooled GLTF cars peaked at 146+ calls. The final production pool is four cars across six randomized lanes; named QA poses freeze four-car directional formations for repeatable captures within the 140-call exploration budget.
5. Visible-browser samples were stable at 56-57 FPS and 17.7-17.9 ms in this browser session. No asset-load or runtime errors were logged; the only console warning was Three.js's existing global-build deprecation notice.
6. Independent QA found the fallback traffic materials were orphaned when GLTF cars replaced them. `installTemplates()` now disposes those materials immediately, and the edge-opacity helper has direct assertions for 0%, 50%, 100%, and final 0% fade states.
7. Enlarging the complete kit expanded the overview camera beyond its original 100-unit far plane. City mode now uses a 220-unit far plane, restoring every building, road, signal, and car in the 98x98 overview while other destinations retain the tighter limit.

## Scale and spacing

- The level uses 7 world units per text-map cell. Automated QA intentionally rejects smaller cells as too tight for the enlarged city kit.
- The nine enlarged building footprints retain 19.96 world units minimum edge-to-edge clearance, exceeding the 2-unit contract.
- KayKit cars are scaled to 3.6 units tall versus the approximately 3-unit chibi (1.20:1), making them visibly larger than the player.
- All 75 road tiles, nine junctions, 18 traffic lights, streetlights, buildings, and cars share the KayKit City Builder Bits atlas/models.
