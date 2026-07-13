# Restaurant visual QA

Captured at 1280x720 from the deterministic `restaurantView` camera poses.

| View | Validation |
| --- | --- |
| `restaurant-sky-overview.png` | Blue sky is visible around the open-top restaurant shell; dining layout remains readable. |
| `restaurant-chair-table.png` | Chair backrests are on the outside edge and all seats face their adjacent tables. |
| `restaurant-cash-register.png` | Cash register loads as authored art, sits centered on the cashier desk, and its controls face the dining/main area. |
| `restaurant-front-door.png` | Door fills the two-unit south-wall opening, is upright, faces outward, and does not overlap the authored wall modules. |

Runtime asset status was `ready` during capture. No primitive fallback was active for the restaurant kit, cash register, or front door.
