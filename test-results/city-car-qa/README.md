# City car scale and material QA

## Scope

- Reduce KayKit cars from 8x to 7x while keeping them slightly taller than the
  three-unit chibi.
- Derive wheel grounding from the source mesh's local wheel-bottom offset.
- Preserve depth writes on cloned car materials so rear/internal faces cannot
  render through the body as apparent black holes.
- Keep the existing smooth edge fade, with a 0.01 alpha cutoff so fully
  invisible cars do not write hidden depth.

## Measured geometry

- Car dimensions at 7x: 2.94 wide, 3.15 high, 6.58 long.
- Two lane centers: 4.2 units apart, leaving 1.26 units between opposing cars.
- Road edge clearance: 0.93 units per outside edge, up from 0.72 at 8x.
- Car-to-chibi height ratio: 1.05.

## Captures

| Screenshot | Named pose | Result | Browser measurement |
| --- | --- | --- | --- |
| `cars-east-west-scale-material.png` | `carsEast` | Full-opacity red, police, and blue cars fit their lanes with clean body surfaces | 56 FPS, 118 calls, 52,132 triangles |
| `cars-north-south-scale-material.png` | `carsNorth` | Opposing traffic remains grounded and fits the crossing from the perpendicular view | 57 FPS, 119 calls, 52,967 triangles |
| `cars-edge-fade-material.png` | `carsFadeEast` | Deterministic 25%, 75%, and full-opacity stages fade without black holes or invisible depth occlusion | 56 FPS, 93 calls, 41,593 triangles |

All captures are 1280x720 PNGs from the user-visible browser. Asset status was
`ready` in every pose, and calls remain under the 140-call exploration budget.

## Root cause

The source glTF material is opaque and includes normals. Runtime cloning forced
every car material to `transparent=true` and `depthWrite=false`, allowing
rear/internal faces to blend through the outer body. The fix keeps transparency
for the edge fade but restores `depthWrite=true` and applies `alphaTest=0.01`.

## Automated checks

- `node --test tests/*.test.js`: 27/27 passing.
- `git diff --check`: clean (Windows line-ending notices only).
- Asset inventory remains 177 files / 14.92 MB; no new runtime assets.

## Independent QA

**PASS — no actionable defects found.** The reviewer confirmed lane clearance,
correct opposing direction, wheel contact within 0.00005 units of asphalt,
clean body silhouettes, and coherent 25%/75%/100% fade stages. The police
car's remaining black hood, bed, wheels, and trim match intentional regions in
`citybits_texture.png`; they are authored paint rather than rendering holes.
