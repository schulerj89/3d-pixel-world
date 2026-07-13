const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const html=read("index.html"),css=read("world-menu.css"),menu=read("world-menu.js");

assert(html.includes('world-menu.css?v=__BUILD_VERSION__')&&html.includes('world-menu.js?v=__BUILD_VERSION__'),"world menu component assets must be loaded with cache busting");
assert(html.includes("viewport-fit=cover"),"landscape menu must expose device safe areas");
assert(menu.includes("worldMenuDestinations")&&menu.includes("worldMenuUtilities")&&menu.includes("worldMenuContext"),"destinations, contextual rooms, and utilities must have separate groups");
assert(Object.keys({menuGoBakery:1,menuGoHouse:1,menuGoBeach:1,menuGoSpace:1,menuGoCity:1,menuGoCastle:1}).every(id=>menu.includes(id)),"all six worlds must remain reachable");
assert(menu.includes('role","dialog')&&menu.includes('aria-labelledby","worldMenuTitle'),"world menu must expose dialog semantics and a label");
assert(menu.includes('event.key!=="Escape"')&&menu.includes('menuButton.focus()'),"Escape and close must restore focus to the Menu button");
assert(css.includes("grid-template-columns:repeat(3,minmax(0,1fr))"),"landscape destinations must use a compact three-column grid");
assert(css.includes("max-height:calc(100dvh")&&css.includes("overflow:auto"),"menu must stay inside and scroll within the dynamic viewport");
assert(css.includes("env(safe-area-inset-left)")&&css.includes("env(safe-area-inset-right)")&&css.includes("env(safe-area-inset-bottom)"),"menu must respect landscape safe areas");
assert(css.includes("min-height:44px")&&css.includes("--world-menu-card-height:48px"),"menu controls must retain touch targets in short landscape");
assert(css.includes("button:focus-visible")&&css.includes("--world-menu-focus"),"menu controls must provide visible keyboard focus");

console.log("world menu landscape: grouped travel dashboard, safe-area sizing, scrolling, focus, and touch targets validated");
