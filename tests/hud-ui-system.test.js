const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const css = read("ui-system.css");

assert(html.includes('href="ui-system.css?v=__BUILD_VERSION__"'), "the HUD component layer must be loaded with cache busting");
assert(/id="hudMenuButton" class="gameHudButton gameHudButton--menu"/.test(html), "Menu must use the shared HUD button component");
assert(/id="housePanelToggle" class="gameHudButton gameHudButton--house"/.test(html), "House must use the shared HUD button component");
assert(/id="money" class="gameHudBadge gameHudBadge--currency"/.test(html), "currency must use the shared HUD badge component");

for (const token of ["--game-hud-safe-top", "--game-hud-safe-left", "--game-hud-touch-target", "--game-hud-surface", "--game-hud-focus"]) {
  assert(css.includes(token), `${token} must be defined in the HUD token layer`);
}

for (const alias of ["--ui-accent", "--ui-surface", "--ui-border", "--ui-text", "--ui-focus", "--ui-touch-target"]) {
  assert(css.includes(alias), `${alias} must connect overlays to the shared token layer`);
}

assert(css.includes("env(safe-area-inset-top)") && css.includes("env(safe-area-inset-left)") && css.includes("env(safe-area-inset-right)"), "HUD edges must respect device safe areas");
assert(html.includes("viewport-fit=cover"), "the viewport must expose notch safe areas in full-bleed landscape");
assert(/\.gameHudButton:focus-visible\s*\{[^}]*outline: 3px solid/.test(css), "HUD buttons must expose a strong keyboard focus state");
assert(/#hudMenuButton\.gameHudButton--menu\s*\{[^}]*left: var\(--game-hud-safe-left\)/.test(css), "Menu must anchor the compact landscape cluster");
assert(/#housePanelToggle\.gameHudButton--house\s*\{[^}]*left: calc\(var\(--game-hud-safe-left\) \+ 92px \+ var\(--game-hud-gap\)\)/.test(css), "House must join Menu at the shared cluster gap");
assert(css.includes("body.house-mode #housePanelToggle.gameHudButton"), "House must only be forced visible while the player is in My House");
assert(css.includes("min-height: var(--game-hud-touch-target)"), "HUD components must retain the shared touch target");

console.log("HUD UI system: tokens, safe areas, focus, touch targets, and compact Menu/House cluster validated");
