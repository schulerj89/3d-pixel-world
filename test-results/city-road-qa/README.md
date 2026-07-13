# City road, curb, and grounding QA

Captured in the isolated `city-road-grounding` worktree at 1280x720 with the
visible browser performance overlay. Screenshots use named City debug poses.

## Final captures

- `player-road-grounding.png` — the full-body chibi stands at the road surface
  (Y 0.46) without sinking through the KayKit asphalt.
- `player-sidewalk-grounding.png` — the chibi stands on the patterned pavers at
  Y 0.58; the 0.12-unit curb is visible beside the road.
- `cars-east-west-grounding.png` — four deterministic cars occupy the closest
  two opposing east/west lanes with wheel contact visible.
- `cars-north-south-grounding.png` — the same check on the nearest opposing
  north/south lanes.
- `widened-intersection-signals.png` — the widened intersection, lane markings,
  curb corners, streetlights, and opposing signal heads.
- `city-126-overview.png` — the complete 126x126 text-authored city.

## Geometry and spacing

- KayKit roads are 2 source units wide and 0.1 high. At 4.5x they are 9 units
  wide and their rendered top is Y 0.46 (`0.01 + 0.1 * 4.5`).
- KayKit cars are 3.36 units wide. Two cars require 6.72 units, leaving 2.28
  units of total road clearance across the two lanes.
- Every street has two opposing lanes (12 lanes across six streets).
- Every four-way junction has four cardinal signal orientations. All 36 lights
  are batched into two instanced meshes.
- All five car models have a local minimum Y of -0.06104. At 8x scale, the car
  root is Y 0.95 so the wheel bottoms meet the Y 0.46 road.
- The player samples `surfaceYAt(x,z)` every frame: Y 0.46 on roads and Y 0.58
  on sidewalks.
- The 126x126 level uses 9-unit cells and retains 27.96 units minimum building
  clearance.

## Sidewalk asset and budget

- The sidewalk uses Poly Haven's CC0 Patterned Paving 1K diffuse JPG.
- One 1024x1024, 862.9 KB texture is reused across a single merged 121-tile
  sidewalk mesh. Curbs are a second merged mesh, so texture detail costs two
  draw calls total rather than one mesh per tile.
- World-coordinate UVs preserve texture phase across cell boundaries; QA found
  no paving seams or gaps.
- Total repository web assets are 13.87 MB after the addition.

## Browser measurements

- Player on road: 56 FPS, 93 calls, 47,186 triangles.
- Player on sidewalk: 56 FPS, 50 calls, 39,206 triangles.
- East/west cars: 56 FPS, 120 calls, 53,085 triangles.
- North/south cars: 56 FPS, 119 calls, 52,065 triangles.
- Widened signals: 56 FPS, 67 calls, 41,329 triangles.
- Overview: 56 FPS, 107 calls, 40,433 triangles.

All captures remain below the 140-call exploration budget. The visible browser
session is pacing at a stable 55-57 FPS.
