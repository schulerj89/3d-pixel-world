# Conversation system

`conversation-system.js` is a world-agnostic dialogue state machine. It owns proximity prompts, text/action flow, guarded input, and camera entry/exit. The supplied Three.js camera adapter captures position, quaternion, zoom, and the controls target before focusing on the front of an object, then restores those exact values.

## Browser setup

Load `conversation-system.css` and `conversation-system.js`, then create one shared system:

```js
const view = createConversationDOMView({ root: document.body });
const dialogue = createConversationSystem({
  view,
  camera: createThreeConversationCameraAdapter({ THREE, camera, controls }),
  runAction(action, event) {
    return worldActions[action.action]?.(action.payload, event);
  }
});

dialogue.register(alien, {
  id: "space-guide",
  speaker: "Zee",
  prompt: "Talk",
  range: 3,
  camera: { distance: 4, height: 2, duration: 700 },
  start: "offer",
  nodes: {
    offer: {
      text: "Want to help recover five coins?",
      actions: [
        { id: "accept", label: "Accept", action: "start-coin-task", payload: { count: 5 }, end: true },
        { id: "decline", label: "Not now", end: true }
      ]
    }
  }
});
```

Call `dialogue.updateInteraction(player.position, worldState)` each frame or when the player moves. Forward `keydown` events to `dialogue.handleInput(event)`. Touch/click interaction is handled by the default DOM view. Call `dialogue.end()` before removing an active target.

Definitions may use string text/speaker/labels or functions receiving the start context. Actions support `when(context)`, `next`, and `end`. The injected action runner may return `{ next }` or `{ end: true }` asynchronously.

For QA, `dialogue.snapshot()` reports the current state, conversation, and node without exposing mutable internals. `dialogue.subscribe(listener)` or `onEvent` receives `start`, `state`, `node`, `action`, `end`, and `error` lifecycle events.
