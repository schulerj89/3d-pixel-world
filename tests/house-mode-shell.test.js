const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const html=read("index.html"),css=read("house-shell.css"),house=read("house-system.js"),gameplay=read("gameplay-ui.js");

assert(html.includes('house-shell.css?v=__BUILD_VERSION__'),"house command-bar styles must load with cache busting");
assert(html.includes('class="houseModePanel"')&&html.includes('role="dialog"')&&html.includes('aria-labelledby="housePanelTitle"'),"house panel must expose dialog semantics");
assert(html.includes('role="tablist" aria-label="House tools"')&&html.includes('role="tabpanel"'),"Home and Build must use accessible tab semantics");
assert(!html.includes('id="backPlaces"')&&!house.includes("backPlaces.onclick"),"redundant Places navigation must be removed from My House");
assert(house.includes('open&&!buildingMode')&&house.includes('setHousePanel(false)'),"the House panel must not open during building and must close as building begins");
assert(house.includes('housePanelToggle.disabled=Boolean(on)')&&house.includes('aria-hidden')&&house.includes('tabIndex=on?-1:0'),"House control must leave the interaction and accessibility trees during building");
assert(/body\.house-building #housePanelToggle\.gameHudButton\{display:none!important\}/.test(css),"build mode must hide the House control so it cannot overlap the build tray");
assert(css.includes('grid-template-columns:minmax(128px,1fr) minmax(190px,230px) 44px'),"landscape panel must use a compact command-bar layout");
assert(css.includes('max-height:calc(100dvh')&&css.includes('env(safe-area-inset-left)'),"house panel must remain within dynamic landscape safe areas");
assert(css.includes('min-height:44px')&&css.includes('button:focus-visible'),"house controls must keep touch targets and keyboard focus");
assert(house.includes('["ArrowLeft","ArrowRight","Home","End"]')&&house.includes('e.key==="Escape"'),"house tabs and dialog must support keyboard navigation and dismissal");
assert(gameplay.includes('window.setHousePanelOpen?.(false)')&&gameplay.indexOf('window.setHousePanelOpen?.(false)')<gameplay.indexOf('openShop();'),"Furniture Shop must close the House panel before opening");

console.log("house mode shell: compact command bar, exclusive build mode, global travel, focus, and safe areas validated");
