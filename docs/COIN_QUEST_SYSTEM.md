# Portable Coin Quest System

`coin-quest-system.js` is world-agnostic. A world owns when the quest starts and supplies only its Three.js scene, player position, and reward callback. Include `coin-quest-system.css` to use the themed timer HUD.

```html
<link rel="stylesheet" href="coin-quest-system.css">
<script src="coin-quest-system.js"></script>
```

```js
const quest = CoinQuestSystem.createCoinQuestSystem({
 THREE,
 scene,
 loader: new THREE.GLTFLoader(),
 getPlayerPosition: () => player.position,
 onReward: dollars => addMoney(dollars),
 completed: savedQuest?.completed === true,
 completedAt: savedQuest?.completedAt,
 getRenderInfo: () => ({
  calls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures
 }),
 config: {
  id: "alien-coin-sprint",
  title: "Cosmic Coin Sprint",
  count: 6,
  timeLimitSeconds: 30,
  reward: 10,
  positions: coinLocations
 }
});

quest.start();
// In the world update loop; use the same monotonic clock used by `start`.
quest.update(deltaSeconds, performance.now());
```

The GLTF is loaded once and cloned with shared geometry/material resources. Until it is ready, or if loading fails, all pickups use a shared primitive fallback. Call `destroy()` when leaving a disposable world.

The HUD is visible only during an active timed run. Idle, failed, and completed states stay out of gameplay; integrations can surface retry and completion copy through their quest-giver dialogue. Passing `completed: true` restores a one-time quest as successful with all pickups hidden and the reward already marked as granted, so loading a save cannot pay twice.

## API

- `start(timestamp?)`, `retry(timestamp?)`: begin/reset a run.
- `update(deltaSeconds, timestamp?)`: animate, collect by proximity, and advance the timer.
- `collect(index, timestamp?)`: explicit collection hook for custom collision systems.
- `subscribe(listener)`: listen for `quest:start`, `coin:collect`, `quest:success`, `quest:failed`, and `quest:retry`.
- `debugSnapshot()`: quest state, world positions, asset status/IDs, asset/draw estimates, and optional renderer metrics.
- `debugCollect(index)`, `debugFail(reason)`: deterministic QA hooks.
- `assetReady`: promise resolving to `ready`, `fallback`, or `discarded` asset status.
- `destroy()`: remove the scene root/HUD and dispose owned fallback resources.

The controller class is also exported separately so quest state can be tested or reused without Three.js or the DOM.
