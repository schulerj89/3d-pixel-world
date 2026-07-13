"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),house=read("house-system.js"),game=read("game.js"),world=read("space-world.js");

for(const file of ["conversation-system.css","conversation-system.js","coin-quest-system.css","coin-quest-system.js"]){
 assert(html.includes(`${file}?v=__BUILD_VERSION__`),`${file} must load through the versioned page shell`);
}
assert(html.indexOf("conversation-system.js")<html.indexOf("house-system.js"),"conversation runtime must load before integration code");
assert(html.indexOf("coin-quest-system.js")<html.indexOf("house-system.js"),"quest runtime must load before integration code");

assert.match(house,/count:6,timeLimitSeconds:30,reward:10/,"Nova configures six coins, thirty seconds, and a $10 reward");
assert.match(house,/speaker:"Nova"/);assert.match(house,/action:"start-coin-task"/);assert.match(house,/action:"retry-coin-task"/);
assert.match(house,/targetHeight:\.55/,"small aliens use a stable root-relative camera target");
assert.match(house,/showRetryButton:false/,"failed missions must route retry through Nova rather than bypassing the NPC");
assert.match(house,/SPACE_COIN_PROGRESS_KEY="spaceCoinSprint"/,"Space completion uses a stable saved-progress key");
assert.match(house,/completed:progress\?\.completed===true,completedAt:progress\?\.completedAt/,"a completed sprint restores without showing pickups or the HUD");
assert.match(house,/saveSpaceCoinCompletion\(event\.reward\)/,"successful completion is persisted immediately");
assert.match(house,/saved\.money=window\.gameEconomy\.getBalance\(\);[\s\S]*saved\.questProgress=Object\.assign/,"quest completion preserves the live reward balance in the same save transaction");
assert.match(house,/localStorage\.setItem\("my3DWorld",JSON\.stringify\(saved\)\)/,"quest completion shares the existing world save");
assert.match(house,/scratchPosition:new THREE\.Vector3\(\)/,"conversation proximity checks must reuse a scratch vector without mutating targets");
assert.match(house,/world\.findObject\("space\.cargo\.stack-a"\)/,"portable conversations are also attached to a world object");
assert.match(house,/pendingQuestStart="start"/,"the timer waits until the conversation camera has restored");
assert.match(house,/event\.detail\?\.phase==="complete"/,"quest start is synchronized to the completed conversation exit");
assert.match(house,/saved\.orbit=\{followCamera,cameraAngle,cameraHeight,cameraDistance\}/,"camera orbit state is captured exactly");
assert.match(house,/cameraAngle=saved\.orbit\.cameraAngle/);assert.match(house,/followCamera=saved\.orbit\.followCamera/);
assert.match(house,/saved\.playerVisible=P\.visible/);assert.match(house,/P\.visible=saved\.playerVisible/,"the avatar is restored after no longer occluding a conversation target");
assert.match(house,/window\.isGameplayInputLocked/,"conversation state can lock gameplay controls");
assert.doesNotMatch(house,/portrait|imageBox|image-box/i,"text conversations do not create a portrait/image box");

assert.match(game,/window\.isGameplayInputLocked\?\.\(\)/,"player movement respects the conversation input lock");
assert.match(game,/window\.updateSpaceInteractions\?\.\(dt,currentPlace==="space"\)/,"quest and proximity logic update only through the game loop");
assert.match(game,/window\.gameEconomy=\{[\s\S]*getBalance[\s\S]*add\(amount,reason=/,"the reward uses the shared game economy API");
assert.match(game,/persistedEconomySave\.money/,"the shared economy restores its saved balance");
assert.match(game,/worldSave\.money=money;localStorage\.setItem\("my3DWorld"/,"economy rewards persist immediately");
assert.match(fs.readFileSync(path.join(root,"avatar-system.js"),"utf8"),/saved\.money=window\.gameEconomy\?\.getBalance/,"later world saves preserve the current economy balance");
assert.match(game,/function hideSpaceWorld\(\)\{if\(spaceWorld\)\{window\.destroySpaceInteractionRuntime/,"leaving Space cleans up the portable interaction runtime");

const positions=[[-10,-2],[-6,2],[-2,6],[2,2],[6,-2],[2,-8]];
for(const [x,z] of positions)assert(house.includes(`{x:${x},y:0,z:${z}}`),`missing authored coin at ${x}, ${z}`);
assert.equal(new Set(positions.map(position=>position.join(","))).size,6,"all quest pickup positions are unique");
for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
 const distance=Math.hypot(positions[i][0]-positions[j][0],positions[i][1]-positions[j][1]);
 assert(distance>=4,`coins ${i} and ${j} are too tightly spaced (${distance.toFixed(2)} units)`);
}
assert.match(world,/findObject\(assetId\)/,"Space exposes object lookup for portable interactions");
assert.match(world,/alienObjects\.push\(object\)/,"Space exposes aliens as conversation targets");
assert.match(world,/questCoins:\{/,"Space provides a quest screenshot pose for QA");

console.log("space interaction integration tests passed");
