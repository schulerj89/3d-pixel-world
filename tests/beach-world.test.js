const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),Beach=require("../beach-world.js"),read=file=>fs.readFileSync(path.join(root,file),"utf8");

assert.deepStrictEqual(Beach.CITY_FILES,["building_A","building_C","building_E","building_G","road_straight","road_straight_crossing","bench","streetlight","car_hatchback","car_taxi"],"beach must request the audited City Builder subset");
assert.equal(Beach.NPC_SPECS.length,5,"beach needs five distinct external NPCs");
assert.equal(new Set(Beach.NPC_SPECS.map(spec=>spec.file)).size,5,"each independently animated NPC must own a unique GLB skeleton");
assert(Object.values(Beach.DEBUG_POSES).some(pose=>pose.name==="beach-overview"));
assert(Object.values(Beach.DEBUG_POSES).some(pose=>pose.name==="beach-water-shore"));
assert.equal(Object.values(Beach.DEBUG_POSES).filter(pose=>pose.name.includes("full-body")).length,5,"every NPC needs stable full-body screenshot coverage");

let beachBytes=0;
for(const spec of Beach.NPC_SPECS){
 const file=path.join(root,"assets/models/beach-npcs",spec.file),buffer=fs.readFileSync(file);beachBytes+=buffer.length;
 assert(buffer.includes(Buffer.from("idle")),`${spec.id} must include the authored idle animation`);
}
for(const file of Beach.NATURE_FILES){const model=path.join(root,"assets/models/beach-nature",`${file}.glb`);assert(fs.existsSync(model),`missing Kenney Nature model ${file}`);beachBytes+=fs.statSync(model).size}
const waterNormal=path.join(root,"assets/textures/water/waternormals.jpg");assert(fs.existsSync(waterNormal));beachBytes+=fs.statSync(waterNormal).size;
assert(beachBytes<2*1024*1024,`new Beach runtime art is ${beachBytes} bytes; expected under 2 MB`);

for(const file of ["assets/models/beach-npcs/SOURCE.md","assets/models/beach-npcs/LICENSE-CC0.txt","assets/models/beach-nature/SOURCE.md","assets/models/beach-nature/LICENSE-CC0.txt","assets/textures/water/SOURCE.md","vendor/THREE-WATER-LICENSE.txt"])assert(fs.existsSync(path.join(root,file)),`missing provenance ${file}`);
const source=read("beach-world.js"),game=read("game.js"),house=read("house-system.js"),html=read("index.html");
assert(source.includes('textureWidth:256,textureHeight:256'),"reflective water must keep the mobile-sized target");
assert(source.includes('maxRenderCalls:140')&&source.includes('maxAssetBytes:8*1024*1024'),"Beach debug output must publish explicit budgets");
assert(source.includes('clipAction(clip).play()'),"NPC idle clips must actually play");
assert(source.includes('water?.dispose?.()')&&source.includes('mixer.stopAllAction()'),"water targets and mixers require explicit disposal");
assert(game.includes('beach:beachWorld?.debug?.()||null'),"global game diagnostics must include Beach");
assert(game.includes('if(except!=="beach")destroyBeachWorld()'),"large-world release must dispose Beach");
assert(house.includes('get("beachPose")')&&house.includes('dataset.beachAssetStatus'),"Beach route must expose deterministic QA state");
assert(html.indexOf("vendor/three-water-global.js")<html.indexOf("beach-world.js")&&html.indexOf("beach-world.js")<html.indexOf("game.js"),"Water and Beach scripts must load before game bootstrap");

console.log(`beach world: ${Beach.NPC_SPECS.length} animated NPC assets, ${Beach.NATURE_FILES.length} nature assets, ${(beachBytes/1024/1024).toFixed(2)} MB new runtime art`);
