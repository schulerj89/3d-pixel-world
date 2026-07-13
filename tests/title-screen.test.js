const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"title-screen.css"),"utf8");
const script=fs.readFileSync(path.join(root,"title-screen.js"),"utf8");
const game=fs.readFileSync(path.join(root,"game.js"),"utf8");

assert(html.includes('<section id="titleScreen"'),"title screen must precede character selection");
assert(html.indexOf('id="titleScreen"')<html.indexOf('id="startPage"'),"title screen must be the first player flow");
assert(html.includes('id="titleScreenHeading"')&&html.includes("My</span> <span>3D</span> <span>World"),"title must say My 3D World");
assert(html.includes('id="titleStartButton"'),"title needs a Start Game button");
for(const asset of ["title-screen.css","title-screen.js"]){
 assert(html.includes(`${asset}?v=__BUILD_VERSION__`),`${asset} must be cache busted`);
}
assert(css.includes("orientation:landscape")&&css.includes("max-height:540px"),"title CSS needs a compact landscape layout");
assert(css.includes("height:100dvh"),"title must follow the dynamic mobile viewport height");
assert(css.includes("grid-template-columns:minmax(0,1.16fr) minmax(200px,.84fr)"),"compact landscape columns must be allowed to shrink inside iPhone safe areas");
assert(css.includes("flex-wrap:nowrap;font-size:clamp(42px,7.5vw,70px)"),"compact landscape title must stay on one readable line");
assert(css.includes("min-height:50px"),"compact landscape Start Game control must retain a generous touch target");
assert(css.includes("env(safe-area-inset-top)")&&css.includes("env(safe-area-inset-bottom)"),"compact landscape layout must respect every safe-area edge");
assert(css.includes("#titleCharacterPreview{inset:4% 0 2%}"),"compact landscape chibi must sit lower over its pedestal");
assert(css.includes("overflow:hidden"),"title must not scroll on short landscape screens");
assert(script.includes("anim_iddle"),"title chibi must play the authored idle animation");
assert(script.includes("styloo-chibi-student.glb?v=__BUILD_VERSION__"),"title model must use the cache-busted Styloo asset");
assert(script.includes("global.startGameMusic?.()"),"Start Game must request music during user activation");
assert(game.includes("window.startGameMusic=startMusic"),"the title must use the existing world music controller");
assert(script.includes("forceContextLoss"),"dismissed title preview must release its WebGL context");
assert(script.includes("getTitleScreenDebug"),"title must expose renderer metrics for browser QA");
console.log("title screen: landscape layout, animated chibi, music handoff, and disposal validated");
