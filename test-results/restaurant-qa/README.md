# Restaurant visual QA

Captured at 1280x720 from the deterministic `restaurantView` camera poses.

| View | Validation |
| --- | --- |
| `restaurant-sky-overview.png` | Blue sky is visible around the open-top restaurant shell; dining layout remains readable. |
| `restaurant-chair-table.png` | Chair backrests are on the outside edge and all seats face their adjacent tables. |
| `restaurant-cash-register.png` | Cash register loads as authored art, sits centered on the cashier desk, and its controls face the dining/main area. |
| `restaurant-front-door.png` | Matching Restaurant Bits doorway fills the four-unit opening; the door leaf is centered in the frame with no uncovered side gap and blocks player clipping. |

Runtime asset status was `ready` during capture. No primitive fallback was active for the restaurant kit, cash register, or entrance.

Front-door capture metadata: scene `dining`; pose `restaurant-front-door`; target `(0, 19.5)`; camera angle `0`, height `4.5`, distance `6`; player hidden for an unobstructed exterior frame. Browser console errors: `0`.
