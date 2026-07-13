# Restaurant visual QA

Captured at 1280x720 from the deterministic `restaurantView` camera poses.

| View | Validation |
| --- | --- |
| `restaurant-sky-overview.png` | Blue sky is visible around the open-top restaurant shell; dining layout remains readable. |
| `restaurant-chair-table.png` | Chair backrests are on the outside edge and all seats face their adjacent tables. |
| `restaurant-cash-register.png` | Cash register loads as authored art, sits centered on the cashier desk, and its controls face the dining/main area. |
| `restaurant-front-door.png` | Matching Restaurant Bits doorway fills the four-unit opening; the door leaf is centered in the frame with no uncovered side gap and blocks player clipping. |
| `restaurant-cashier-npc.png` | The external CC0 merchant NPC loads behind the register, faces the dining/main area, and remains fully readable around the register and counter. |
| `kitchen-food-shelf-near.png` | The wall-mounted kitchen shelf displays authored burger and dinner props; its burger proximity icon is visible while the player is inside the configured range. |

Runtime asset status was `ready` during capture. No primitive fallback was active for the restaurant kit, cash register, or entrance.

Front-door capture metadata: scene `dining`; pose `restaurant-front-door`; target `(0, 19.5)`; camera angle `0`, height `4.5`, distance `6`; player hidden for an unobstructed exterior frame. Browser console errors: `0`.

Cashier capture metadata: scene `dining`; pose `restaurant-cashier-npc`; target `(0, 13.5)`; camera angle `PI`, height `4.6`, distance `6`; player hidden. A second frame captured 420 ms later differed by 30,286 bytes, confirming that the configured `anim_iddle` clip advances at runtime.

Food-shelf capture metadata: scene `kitchen`; pose `kitchen-food-shelf`; target `(-8.8, -34.5)`; camera angle `PI / 2`, height `5.8`, distance `7`. The runtime proximity marker reported `restaurant.kitchen.food-shelf-nearby` at this pose and cleared after moving to the distant `kitchen-east-wall` pose. The marker deliberately has `action: null`. Browser console errors across the final QA run: `0`.
