# My House furniture QA

Captured at 1280 × 720 from the local game build on 2026-07-13.

## Screenshot roll

1. `01-build-catalog-and-controls.png` — expanded catalog, new item cards, movement grid, rotate control, and selected-item state.
2. `02-furnished-house.png` — clean in-world view of KayKit seating, tables, lamps, bed, cactus, and the retained primitive TV/fridge.
3. `03-shop-replacements.png` — furniture shop proof for the rug, dresser, and house-plant replacement path.

## Live runtime validation

- 14/14 mapped KayKit Furniture Bits model IDs reached `assetStatus: ready`.
- Loader state after placing the full set: 14 loaded, 0 pending, 0 errors.
- Sofa retained its build-mode rotation (`0.785` radians / 45°) across save and reload.
- Position controls persisted the showcase layout in 0.5-unit steps.
- TV and fridge reported `assetId: null` and `assetStatus: primitive`, confirming unmatched project furniture was not replaced.
- Full showcase renderer snapshot: 54 calls, 19,146 triangles, 285 geometries, 24 textures.

## Replacement scope

| Existing item | KayKit model |
| --- | --- |
| Sofa | `couch_pillows` |
| Low table | `table_low` |
| Bed | `bed_double_A` |
| Floor lamp | `lamp_standing` |
| Chair | `chair_A` |
| Rug | `rug_rectangle_stripes_A` |
| Dresser | `cabinet_medium_decorated` |
| House plant | `cactus_medium_A` |

New catalog additions use `armchair_pillows`, `chair_stool`, `table_medium_long`, `table_small`, `lamp_table`, and `cactus_small_A`. TV, fridge, desk, vanity, and bookshelf remain project-native primitives because the selected pack does not provide direct equivalents.

## Automated validation

- `node --check furniture-assets.js`
- `node --check house-system.js`
- `node --test tests/*.test.js` — 15 passed, 0 failed after rebasing onto the latest `origin/main`
- Added asset payload: 293,619 bytes (about 286.7 KiB), including one shared 15 KiB texture atlas.

Asset source and CC0 license details are in `assets/models/furniture-bits/SOURCE.md` and `LICENSE-CC0.txt`.
