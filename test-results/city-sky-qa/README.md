# City sky and prop-facing QA

## Scope

- Stoplights and streetlights use one shared 180-degree facing correction.
- The City uses a single inward-facing sky dome with a 1024x512 derivative of
  Poly Haven's CC0 Kloofendal 48d Partly Cloudy (Pure Sky) panorama.
- Static QA poses pause random traffic so the props remain unobstructed; normal
  City gameplay and the dedicated car poses retain pooled traffic.

## Captures

| Screenshot | Named pose | Visible result | Browser measurement |
| --- | --- | --- | --- |
| `traffic-lights-rotated.png` | `trafficLights` | Four-way signals face their corrected cardinal approaches | 56 FPS, 68 calls, 42,289 triangles |
| `street-lights-rotated.png` | `streetLights` | Lamp arms and nearby signals are unobstructed and use the corrected orientation | 56 FPS, 46 calls, 38,932 triangles |
| `sunny-partly-cloudy-street.png` | `skyStreet` | Blue midday sky, sunlit cumulus clouds, and no center far-plane hole | 56 FPS, 93 calls, 37,724 triangles |
| `city-cloudy-overview.png` | `overview` | The 126x126 City remains enclosed by the panorama with no black gaps or seams | 56 FPS, 106 calls, 40,591 triangles |

All captures are 1280x720 PNGs from the user-visible browser. Asset status was
`ready` in each pose. Calls remain below the 140-call exploration budget.

## Defect found and fixed during QA

The first low street capture revealed a cyan hole where a 220-unit dome crossed
the 280-unit City far plane. The final dome radius is 140 units: it encloses the
largest overview camera offset while keeping the viewed sky surface within the
far plane. The final checked-in captures show the corrected result.

## Automated checks

- `node --test tests/*.test.js`: 24/24 passing.
- `git diff --check`: clean (Windows line-ending notices only).
- Asset inventory: 177 files / 14.92 MB total.
- Added sky JPG: 61,129 bytes; one decoded texture and one draw call.

## Independent QA

**PASS — no actionable defects found.** The reviewer confirmed the exact 180°
correction on both prop types, four cardinal signal approaches, lamp arms over
their intended lanes, a seam-free sunny/partly-cloudy sky, no black or cyan
far-plane gaps, and all four captures within the performance budget.

## Provenance

- Asset: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
- License: https://polyhaven.com/license
- Creators: Greg Zaal (original) and Jarod Guest (pure-sky edit).
- The included 1024x512 JPEG quality-90 derivative is documented in
  `assets/textures/city/SOURCE.md`.
