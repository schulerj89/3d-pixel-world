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
assert(catalog.includes('aria-label","Previous furniture')&&catalog.includes('aria-label","Next furniture'),"catalog must offer explicit previous/next controls");
assert(catalog.includes('aria-expanded')&&catalog.includes('window.setBuildCatalogCollapsed'),"build dock collapse state must be accessible and resettable");
assert(house.includes('window.setBuildCatalogCollapsed?.(false)'),"build sessions must reopen with tools available");
assert(styles.includes("max-height:calc(100dvh - 68px)"),"landscape house panel must stay inside the dynamic viewport");

console.log("house landscape layout: compact dock, room view, safe areas, scrolling, and touch targets validated");
