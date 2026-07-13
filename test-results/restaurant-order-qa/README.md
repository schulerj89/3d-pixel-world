# Restaurant order and NPC QA

Captured from the local static build on 2026-07-13 with the named `restaurantView`
camera poses and the real KayKit/chibi assets.

| Capture | Validation |
| --- | --- |
| `cashier-register.png` | Cashier is on the staff side of the counter, rotated toward the pushed-back register; the first guest faces the counter from the public side. |
| `customer-line.png` | Four animated chibi guests wait on exact straight-line slots at `z=17.25`, face the register, and use four visible costume color variants. |
| `orders-expanded.png` | Collapsible menu exposes four FIFO orders and the varying `$8`, `$12`, `$16`, and `$10` rewards. |
| `customer-door-fade.png` | The served guest fades at the front door; the UI temporarily shows three orders and the money total has advanced from `$108` to `$120`. |
| `food-tables.png` | Six dining tables receive ten food placements from the shared restaurant kit, including two three-piece red-produce clusters. |

Lifecycle inspection confirmed that a served customer leaves only after completion,
fades to 37% opacity at the door, and is removed before the next order/customer
refills the line to four. The first two visible completions paid `$8` and `$12`
exactly once. The final queue view rendered at 94 calls / 104,374 triangles;
the wide food-table view rendered at 130 calls / 118,361 triangles.

The asset pack has no strawberry model. Its small red, green-topped tomato ingredient
is the closest matching authored food and is used for the requested strawberry-like
clusters. Browser QA reported no application errors; the only console output was the
repository's existing Three.js global-build deprecation warning.
