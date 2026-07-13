const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const house=fs.readFileSync(path.join(root,"house-system.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"build-catalog.css"),"utf8");

assert(html.includes('id="clearAllFurniture"')&&html.includes('aria-describedby="clearFurnitureStatus"'),"clear-all must be an accessible labeled build control");
assert(/id="clearAllFurniture"[^>]*aria-disabled="true"[^>]*disabled/.test(html),"clear-all must start disabled until saved furniture is loaded");
assert(html.includes('id="clearFurnitureStatus"')&&html.includes('role="status"')&&html.includes('aria-live="polite"'),"clear-all must announce completion without moving focus");
assert(html.includes('id="buildRemoveToggle"')&&html.includes('aria-controls="buildDangerActions"')&&html.includes('id="buildDangerActions"'),"destructive actions must be contained in a labeled disclosure");
assert(css.includes("#clearAllFurniture")&&css.includes("min-height:44px!important"),"clear-all must retain a touch-sized target");
assert(house.includes("if(saved.houseFurnitureCleared===true)return"),"an intentionally empty save must not reseed starter fixtures");
assert(house.includes("saved.houseFurnitureCleared=false;saveWorld()"),"adding furniture must restore normal save semantics");
assert(house.includes("if(sitting)leaveSeat()"),"clear-all must exit a currently occupied seat before removal");
assert(house.includes("for(const item of furniture){unregisterFurnitureAction(item);house.remove(item)}"),"clear-all must unregister every action and detach every furniture object");
assert(house.includes("furniture.length=0")&&house.includes("selectedFurnitureIndex=-1"),"clear-all must empty the collection and selection");
assert(house.includes("saved.houseFurnitureCleared=true")&&house.includes("saveWorld()"),"clear-all must persist the intentional empty state");
assert(house.includes('clearAllFurnitureButton.disabled=furniture.length===0')&&house.includes('setAttribute("aria-disabled"'),"clear-all must expose its unavailable state to assistive technology");
assert(house.includes("queueMicrotask(()=>updateFurnitureLabel())"),"loaded and intentionally empty saves must initialize reset UI state");
assert(house.includes("window.clearAllHouseFurniture=clearAllFurniture"),"browser QA must have a deterministic clear-all hook");
assert(house.includes('dataset.confirming="true"')&&house.includes('textContent="Confirm clear all"'),"clear-all must use an accessible inline confirmation state");
assert(!house.includes('window.confirm("Remove all furniture'),"clear-all must not depend on a blocking native dialog");

console.log("house clear furniture: seating, actions, selection, persistence, reseed guard, and accessible control validated");
