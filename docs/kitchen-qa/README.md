# Kitchen screenshot QA

Scene: `kitchen`. All captures use named follow-camera poses and the live KayKit
restaurant GLB. The asset load completed with no browser console errors. The
current game build does not expose an FPS or renderer-memory overlay.

| Screenshot | Debug pose | Character / camera target | Camera angle, height, distance | Visual result |
| --- | --- | --- | --- | --- |
| `kitchen-overview.png` | `kitchen-overview` | `(0, 0, -30)` | `0, 11, 15` | Three free-standing prep counters have clear spacing; all other fixtures are wall-aligned. |
| `kitchen-north-wall.png` | `kitchen-north-wall` | `(0, 0, -39)` | `0, 6.5, 10` | Refrigerators, undecorated stoves, and sink face into the room and sit against the north wall. |
| `kitchen-west-wall.png` | `kitchen-west-wall` | `(-8.5, 0, -34)` | `PI/2, 6.5, 10` | West cabinets show their doors toward the room and remain flush to the wall. |
| `kitchen-east-wall.png` | `kitchen-east-wall` | `(8.5, 0, -34)` | `-PI/2, 6.5, 10` | East cabinets show their doors toward the room and remain flush to the wall. |

The north-wall close-up also verifies that the stove surfaces contain no food
props and that both refrigerators use the requested 140% scale.
