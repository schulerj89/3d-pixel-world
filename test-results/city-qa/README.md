# Chibi City visual QA

Captured from the isolated worktree with the visible in-app browser at 1280x720. Each route was loaded through the title screen and City world picker with the named `cityPose` query and the live performance overlay enabled.

## Final captures

- `city-overview.png` - complete 98x98 layout, building distribution, 3x3 road grid, and active traffic.
- `building-a-front.png` through `building-h-front.png` - every KayKit building type at its road-facing entrance with a full-body chibi scale reference.
- `traffic-lights-facing.png` - paired signals at a four-way junction, facing opposing approaches without intersecting the character.
- `cars-east-west-facing.png` - four-car-budget traffic in a deterministic QA formation; the nearest car is taller than the chibi and all cars face their lane vectors.
- `cars-north-south-facing.png` - four deterministic cars align with the vertical lanes while the full-body chibi provides a scale reference.

## Findings and fixes

1. Center and south building poses originally showed rear walls. Their camera/player targets now face the road entrances.
2. The original signal pose put the player under a signal arm. It now sits five units down the approach.
3. Submitted building captures still contained large black ground rectangles. The corrected runtime uses one non-culled basic-material ground mesh and keeps the renderer shadow pipeline stable while disabling only the City's shadow-casting light. Regenerated A, C, E, G, and overview captures are clean.
4. Twelve pooled GLTF cars peaked above the 140-call budget. Production now pools four cars across six randomized lanes.
5. The corrected visible-browser overview held 56 FPS at 119 calls and approximately 29K triangles. Close building views held 56-57 FPS at 23-91 calls.
6. Fallback traffic materials are disposed when GLTF cars replace them, and edge-opacity behavior has direct assertions.
7. City mode uses a 220-unit camera far plane so the entire 98x98 layout remains visible; other worlds retain the tighter limit.

## Scale and spacing

- The level uses 7 world units per text-map cell.
- Nine enlarged building footprints retain 19.96 world units minimum edge-to-edge clearance.
- KayKit cars are scaled to 3.6 units tall versus the approximately 3-unit chibi (1.20:1).
- All 75 road tiles, nine junctions, 18 traffic lights, streetlights, buildings, and cars share the KayKit City Builder Bits atlas/models.
