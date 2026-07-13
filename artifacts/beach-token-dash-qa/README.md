# Beach Token Dash QA

Validated at 1280 × 720 on the deterministic `?beachPose=tokenDash` route.

- NPC/player scale: Marina and Kai are 2.55 world units tall; Sol, Tala, and Milo are 2.6; the player is approximately 2.7. The idle screenshot confirms comparable silhouettes and clear separation.
- Conversation: Marina uses the shared Space-world camera adapter and textbox. Player movement is locked during the shot, all copy and buttons are readable, and the quest HUD remains hidden until acceptance.
- Active game: six Quaternius CC0 coin pickups are visible across open sand. The compact timer/progress HUD clears both the Menu and wallet.
- Reward: controller and integration tests verify a single `$20` award through the shared economy with reason `beach-token-dash`.
- Runtime budget: idle measured 63 render calls / 25,063 triangles; active measured 97 calls / 31,789 triangles, below the Beach budget of 140 calls. Coin assets load once (20,862 bytes) and clone for six pickups.
- Console: no runtime errors; only the repository's existing Three.js deprecation warning was observed.

QA found and fixed one regression during review: `.coin-quest-hud`'s authored `display:grid` overrode the browser's native `[hidden]` rule, making the HUD visible before acceptance. The shared stylesheet now explicitly hides inactive quest HUDs.

## Captures

- `beach-npc-player-scale.png`
- `beach-marina-conversation.png`
- `beach-token-dash-active.png`
