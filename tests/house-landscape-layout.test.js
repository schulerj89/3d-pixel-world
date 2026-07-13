const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const css=read("build-catalog.css"),catalog=read("build-catalog.js"),house=read("house-system.js"),styles=read("styles.css");

assert(css.includes("max-height:174px"),"short landscape build dock must preserve most of a 430px scene");
assert(css.includes("env(safe-area-inset-left)")&&css.includes("env(safe-area-inset-right)"),"build dock must respect landscape safe areas");
assert(css.includes("min-height:44px")&&css.includes("width:44px"),"primary build and scroll controls must retain touch targets");
assert(css.includes("build-tray-collapsed")&&css.includes("#lookPad"),"collapsed room view must restore camera controls");
assert(/body\.house-building\.build-tray-collapsed #lookPad\{[^}]*visibility:visible!important;[^}]*pointer-events:auto!important/.test(css),"collapsed room view must override the legacy hidden, non-interactive look pad cascade");
assert(/body\.house-building\.build-tray-collapsed #lookPad\{[^}]*bottom:max\(78px/.test(css),"collapsed room view must lift the look pad above the compact build dock");
assert(/\.buildCatalogTray\.collapsed\{[^}]*grid-template-rows:44px;[^}]*max-height:62px/.test(css),"collapsed short-landscape dock must fit its 44px row, 12px vertical padding, and 6px border without clipping");
assert(css.includes("(orientation:landscape) and (min-height:501px)")&&css.includes("max-height:min(250px,32dvh)")&&css.includes(".buildCatalogTray .moveGrid{display:flex"),"tablet landscape editor controls must stay in a capped, single-row dock instead of overflowing into the header");
assert(catalog.includes('aria-label","Previous furniture')&&catalog.includes('aria-label","Next furniture'),"catalog must offer explicit previous/next controls");
assert(catalog.includes('aria-expanded')&&catalog.includes('window.setBuildCatalogCollapsed'),"build dock collapse state must be accessible and resettable");
assert(house.includes('window.setBuildCatalogCollapsed?.(false)'),"build sessions must reopen with tools available");
assert(styles.includes("max-height:calc(100dvh - 68px)"),"landscape house panel must stay inside the dynamic viewport");

console.log("house landscape layout: compact dock, room view, safe areas, scrolling, and touch targets validated");
