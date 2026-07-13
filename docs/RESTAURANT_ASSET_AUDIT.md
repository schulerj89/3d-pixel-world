# KayKit Restaurant Bits asset audit

Audit date: 2026-07-13. Official source: <https://kaylousberg.itch.io/restaurant-bits>.

## Decision

The free pack is suitable for the planned 40x40 main restaurant and 25x25 kitchen. It is internally consistent, CC0, correctly scaled for the current character, low-poly, and uses one shared gradient atlas. A curated optimized kit has been added at `assets/models/restaurant/kaykit-restaurant-kit.glb`; runtime code is intentionally unchanged.

## Provenance and license

- The official page states that the free version contains 140+ optimized models, permits personal and commercial use without attribution, and is CC0.
- The included `License.txt` independently identifies **KayKit: Restaurant Bits 1.0**, creation date 2023-09-29, creator Kay Lousberg, and CC0 1.0 Universal.
- Official free upload ID: `8784350`; upload date: 2023-09-29 08:32 UTC.
- Official download label: `Free`; archive root: `KayKit_Restaurant_Bits_1.0_FREE`.
- Archive: 11,298,866 bytes; SHA-256 `75F75F0A1AE569F3F2348FA7A04CCD45D2F010D419045755C70AE43289B68E4B`.

The current itch page was updated in July 2026 for its product offerings, but the free upload itself still identifies as version 1.0 and retains its 2023 upload date.

## Full free-pack inventory

The archive contains 144 GLTF files plus 144 external BIN buffers, 144 general FBX files, 144 Unity-oriented FBX files, and 150 OBJ/MTL pairs. The OBJ edition exposes a few subparts separately that are grouped in GLTF. There is one shared `restaurantbits_texture.png` atlas, 1024x1024 RGBA and 21,070 bytes, copied into the format folders.

Measured across all 144 GLTF models:

- 75,346 triangles total if every unique model were loaded once.
- 3,110,288 bytes of binary geometry data.
- Largest individual model: `table_round_A_decorated`, 4,422 triangles.
- One material and one atlas texture per source GLTF; the texture content is identical and should be deduplicated.
- No skeletons or animations; doors and refrigerator sections are separate child nodes and can be animated by the game if desired.

FBX and OBJ provide no benefit to this Three.js game and should not be deployed.

## Unit scale and layout fit

The source is Y-up and its authored dimensions are directly useful as game units. A standard wall is exactly **4 wide x 4 high x 0.5 deep**. A main 40x40 shell therefore uses ten modules per side without rescaling. Kitchen counters are 2 units wide and about 1 unit high; a standard kitchen floor tile is 4x4; the decorated refrigerator is 2 wide x 2.5 high x 2.24 deep. The Chibi character body is about 2.23 units tall, so doors at 2.8 high, counters at 1 high, and tables at 1 high read naturally.

For the 25x25 kitchen, use six 4-unit floor modules across the primary 24x24 area and cover the final boundary with the game's floor primitive or a clipped/hidden edge tile. Keep visual tiles slightly above the collision floor to avoid z-fighting. Use simple box collision proxies matching the measured dimensions.

## Best assets for the 40x40 main restaurant

| Asset | Dimensions (X x Y x Z) | Source triangles | Use |
| --- | ---: | ---: | --- |
| `wall` | 4 x 4 x 0.5 | 76 | Repeated solid perimeter module |
| `wall_window_open` | 4 x 4 x 0.5 | 192 | Front and side windows |
| `wall_doorway` | 4 x 4 x 0.5 | 162 | Main entrance module |
| `wall_orderwindow_decorated` | 4 x 4 x 0.9 | 650 | Readable service opening between dining and kitchen |
| `door_A` | 1.6 x 2.8 x 0.771 | 188 | Front door child/interaction visual |
| `table_round_A` | 3 x 1 x 3 | 312 | Main dining table; clone throughout room |
| `chair_A` | 0.75 x 1.208 x 0.796 | 428 | Main seating and sit-action anchor |
| `chair_stool` | 0.75 x 0.5 x 0.75 | 272 | Counter seating |
| `menu` | 0.5 x 0.8 x 0.3 | 108 | Table/cashier decoration |

Prefer the plain table plus separately placed food/plates. The pre-decorated large table costs 4,422 triangles and repeats the same arrangement, so it was deliberately excluded.

## Best assets for the 25x25 kitchen

| Asset | Dimensions (X x Y x Z) | Source triangles | Use |
| --- | ---: | ---: | --- |
| `floor_kitchen` | 4 x 0.5 x 4 | 48 | Instanced decorative kitchen floor |
| `fridge_A_decorated` | 2 x 2.5 x 2.24 | 2,398 | Feature refrigerator with separate door children |
| `oven` | 2 x 2.02 x 2.348 | 542 | Wall-aligned oven with separate door child |
| `stove_multi_decorated` | 2.2 x 1.716 x 2.288 | 2,270 | Readable hero cooking station |
| `extractorhood` | 2 x 2 x 1.609 | 204 | Mount above stove; authored Y range is 2..4 |
| `kitchencounter_sink_backsplash` | 2 x 1.802 x 2.042 | 686 | Sink run |
| `kitchencounter_straight_A_backsplash` | 2 x 1.2 x 2.042 | 180 | Repeated wall counter |
| `kitchencounter_innercorner_backsplash` | 2 x 1.2 x 2 | 56 | Consistent counter turn |
| `kitchencabinet` | 2 x 2 x 1.042 | 156 | Wall cabinet; authored Y range is 2..4 |
| `kitchentable_A_large_decorated` | 3 x 1.928 x 2 | 1,996 | Center prep island with visual clutter included |
| `dishrack_plates` | 1.2 x 1.095 x 1.2 | 880 | Sink-side detail |
| `shelf_papertowel_decorated` | 2 x 1.71 x 0.626 | 832 | Wall detail; position relative to wall rather than floor |

The kit also includes low-cost cutting board, knife, pan, pot, plate, bowl, burger, and dinner scenes for hand-authored prep and serving details.

## Integrated browser budget

The curated derivative contains 29 separately addressable scenes and all assets listed above:

- 503,564-byte GLB, SHA-256 `66A6930D382CB6014FE459F628BC5F9D960EF9B487D0E76BE803633540AFF44D`.
- 16,456 triangles and 18,855 uploaded vertices across all 29 unique scene assets.
- 32 meshes/primitives, one shared material, one 128x128 WebP atlas.
- Estimated atlas GPU allocation: 87,380 bytes including mip levels.
- Extensions: `EXT_texture_webp`, `KHR_mesh_quantization`; both are supported by the bundled GLTFLoader.

This remains cheap only if the GLB is loaded once. Cache scene prototypes, clone them, and instance repeated walls/floors/chairs where practical. Avoid enabling shadows on every small tabletop prop; reserve casting shadows for architecture, major appliances, tables, and the nearest furniture.
