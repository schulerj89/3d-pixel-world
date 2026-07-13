const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),css=read("pregame-wizard.css"),flow=read("pregame-wizard.js"),avatar=read("avatar-system.js"),house=read("house-system.js");

assert(!html.includes("Who will you be?"),"character-type screen must be removed");
for(const id of ["adventureTypeScreen","characterTypeOptions","startHairStyle","customizeOutfit","startOutfit","startShirt","startAstronautHelmet"]){
 assert(!html.includes(`id="${id}"`),`obsolete startup control remains: ${id}`);
}
for(const id of ["startHairColor","startSkin","startPants","startOutfitColor"]){
 assert(html.includes(`id="${id}"`),`required color control missing: ${id}`);
}
assert((html.match(/class="magicChoice"/g)||[]).length===4,"startup must expose exactly four concise color controls");
assert(html.includes('id="wizardNextButton"')&&html.includes('id="wizardBackButton"'),"wizard needs Next and Back/Edit controls");
assert((html.match(/class="place" id="go/g)||[]).length===6,"world picker must retain all six worlds");
for(const file of ["pregame-wizard.css","pregame-wizard.js"])assert(html.includes(`${file}?v=__BUILD_VERSION__`),`${file} must be cache busted`);
assert(flow.includes('show("worlds"')&&flow.includes('show("customize"'),"wizard must support both directions");
assert(flow.includes("worldPickerHeading")&&flow.includes("customizeHeading"),"step changes must move focus to the new heading");
for(const id of ["startHairColor","startSkin","startPants","startOutfitColor"]){
 assert(flow.includes(`["${id}"`),`short landscape color cycler must include ${id}`);
}
assert(flow.includes('aria-label",`Previous ${label} color`')&&flow.includes('aria-label",`Next ${label} color`'),"color cyclers need accessible previous and next controls");
assert(flow.includes("compactLandscape.matches")&&flow.includes("swatch.hidden=compact&&index!==active"),"only the selected swatch should remain visible in short landscape");
assert(css.includes("orientation:landscape")&&css.includes("max-height:540px"),"wizard needs compact iPhone landscape rules");
assert(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"short landscape should use a calmer two-by-two color-control grid");
assert(css.includes("minmax(150px,220px) minmax(0,1fr)"),"short landscape must cap the avatar preview column");
assert(css.includes(".customizeWorkbench>.wizardProgress")&&css.includes(".customizeStep>.buildVersion{display:none}"),"short landscape must hide progress, helper copy, and the build badge");
assert(css.includes(".colorCycleButton")&&css.includes("width:40px")&&css.includes("height:40px"),"short-landscape arrows need compact touch targets");
assert(!css.includes("min-height:430px"),"wizard must not inherit the old short-screen scroll trap");
assert(css.includes("overflow:hidden"),"wizard viewport must remain scroll free");
assert(avatar.includes("delete saved.characterType")&&avatar.includes("delete saved.outfit")&&avatar.includes("delete saved.shirt"),"obsolete persisted type/outfit choices must be retired");
assert(avatar.includes("storedOutfitColor")&&avatar.includes("legacyShirt"),"legacy shirt saves must migrate to the canonical outfit color");
assert(avatar.includes('localStorage.setItem("my3DWorld",JSON.stringify(saved))'),"retired fields must be cleared before the Styloo loader reads customization");
assert(!avatar.includes('colorButtons("startOutfit"')&&!avatar.includes("startAstronautHelmet"),"obsolete startup controls must not be wired");
assert(avatar.includes("titleScreen?.hidden")&&avatar.includes("!customizeStep.hidden"),"large preview must render only while customization is visible");
assert(house.includes("window.showPregameCustomization?.()"),"in-game Edit must reopen character customization");
assert(!html.includes('id="backPlaces"')&&!house.includes("backPlaces.onclick"),"house navigation must rely on the global world menu instead of a duplicate Places action");
console.log("pre-game wizard: four colors, two steps, compact landscape, and world routing validated");
