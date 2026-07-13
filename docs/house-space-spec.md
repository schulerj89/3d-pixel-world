# My House space and scale specification

The executable source of truth is `house-main-level.txt`; `house-space-spec.js`
parses and validates it. Coordinates, room sizes, collision footprints, and
clearances are world units—not approximate visual proportions.

## Shell and rooms

The enclosed shell is **24 × 20 units**, compared with the former 15 × 15
single room. Exterior perimeter cells are walls except for the four-unit closed
front entrance. Interior `D` cells are doorway modules in section walls. The
shell expands toward the rear, keeping the front facade at Z=7.5 so the porch,
sidewalk, and city road retain their safe spacing.

| Room | Usable grid | Purpose |
| --- | ---: | --- |
| Kitchen | 10 × 8 | Full-size appliances plus a 2-unit working aisle |
| Bedroom | 11 × 8 | Double bed, side tables, dresser, and circulation |
| Living room | 14 × 9 | Sofa/chairs, TV, and primary route |
| Dining room | 7 × 5 | Dining table and chair pull-out room |
| Entry | 7 × 3 | Four-unit front entrance and arrival space |

## Unit-spacing rules

- **1 unit:** minimum edge-to-edge secondary passage. The player collision
  diameter is 0.56, leaving 0.44 units of total movement slack.
- **2 units:** preferred primary circulation and the mandatory clear aisle in
  front of kitchen appliances. It leaves 1.44 units of total movement slack.
- Measurements are between collision edges, not between object origins. A
  refrigerator centered three units from another object is not a three-unit
  aisle when their collision boxes consume that span.

## Refrigerator scale

The house refrigerator must reuse the restaurant specification exactly:

| Property | Value |
| --- | --- |
| Scene | `fridge_A_decorated` |
| Scale | 1.4 |
| Visible size | 2.8 × 3.5 × 3.136 |
| X/Z collision half-extents | 1.4 × 1.568 |

The north-wall anchor is wall-flush using its collision depth, rather than the
one-cell map marker. The kitchen has more than the required two units between
the refrigerator front collision edge and the opposite section wall.

## Integration contract

Use `HouseSpaceSpec.parseLevel()` for the text layout, build walls for every
`#`, build closed door modules for `D`/`E`, and use `fixturePlacement()` for the
restaurant-sized refrigerator. Furniture placement UI should show both one-unit
and two-unit guides and reject layouts that narrow a primary route below two
units or any secondary passage below one unit.

Before shipping a plan, run `node scripts/validate-house-layout.js`. The QA gate
requires every interior and exterior entry run to be 3-4 contiguous unit cells
bounded by walls. It also checks the exterior perimeter and corners, wall/door
connectivity, unmarked seams, room bounds and reachability, fixture anchors,
overlaps, and fixture approach clearance. `HouseSpaceSpec.validatePlan(level)`
exposes the same reusable contract to other Node or browser QA tools.

The CLI also adapts the TXT plan into rendered wall footprints and runs
`HouseLayoutValidator.validateWallGeometry(level, walls)`. This second gate
requires one common wall height, one owning square per corner/T-junction,
branches that exactly match neighboring `#` cells, a connected shell, and zero
positive-area overlaps between wall pieces. A 2x2 `#` block is rejected as a
double-thick wall, and exterior cladding is assigned to the outward faces of
the structural shell instead of being rendered as a second wall layer.
