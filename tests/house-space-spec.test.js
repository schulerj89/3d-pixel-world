const assert=require("assert");
const fs=require("fs");
const path=require("path");
const House=require("../house-space-spec.js");
const Restaurant=require("../restaurant-world.js");

const root=path.join(__dirname,"..");
const level=House.parseLevel(fs.readFileSync(path.join(root,House.LEVEL_FILE),"utf8"));
assert.deepStrictEqual([level.width,level.depth,level.cell],[24,20,1],"house shell must provide a larger 24x20 one-unit grid");
assert.strictEqual(level.map.length,20);assert(level.map.every(row=>row.length===24));
assert.deepStrictEqual(level.rooms.map(room=>[room.id,room.width,room.depth]),[
 ["kitchen",10,8],["bedroom",11,8],["living",14,9],["dining",7,5],["entry",7,3]
],"sectioned rooms need explicit unit dimensions");
assert.deepStrictEqual(level.fixtures.map(fixture=>[fixture.id,fixture.room]),[
 ["refrigerator","kitchen"],["double-bed","bedroom"],["sofa","living"],["dining-table","dining"]
],"the text plan must seed each main room with an appropriately zoned fixture");

const boundary=[...level.map[0],...level.map.at(-1),...level.map.slice(1,-1).flatMap(row=>[row[0],row.at(-1)])];
assert(boundary.every(symbol=>symbol==="#"||symbol==="E"),"every exterior edge must be enclosed by a wall or closed door");
assert.strictEqual(boundary.filter(symbol=>symbol==="E").length,4,"front entrance must be one enclosed four-unit door module");
assert.strictEqual(level.map.flatMap(row=>[...row]).filter(symbol=>symbol==="D").length,11,"section walls must reserve two four-unit entries and one three-unit entry");
const openPerimeter={...level,map:[...level.map]};openPerimeter.map[0]=`.${openPerimeter.map[0].slice(1)}`;
assert.throws(()=>House.validateLevel(openPerimeter),/perimeter must be enclosed/,"an open exterior edge must fail layout QA");

assert.deepStrictEqual(House.REFRIGERATOR,{
 assetId:Restaurant.ASSET_REGISTRY.F.assetId,
 sourceScene:Restaurant.ASSET_REGISTRY.F.sourceScene,
 scale:Restaurant.ASSET_REGISTRY.F.scale,
 size:Restaurant.ASSET_REGISTRY.F.size,
 collision:Restaurant.ASSET_REGISTRY.F.collision
},"house refrigerator must match the restaurant model, scale, visible size, and collision footprint");
const fridge=House.fixturePlacement(level,"refrigerator");
const kitchen=House.roomBounds(level,"kitchen");
assert(Math.abs(fridge.bounds.minZ-(level.originZ+level.wallThickness/2))<.001,"refrigerator must sit flush against the inside wall face");
assert(fridge.bounds.minX>=kitchen.minX&&fridge.bounds.maxX<=kitchen.maxX,"full 2.8-unit refrigerator width must fit inside the kitchen");
assert(House.frontAisle(level,fridge,"kitchen")>=House.CLEARANCE.applianceAisle,"restaurant-sized refrigerator needs a two-unit working aisle");

assert.strictEqual(House.playerSlack(1),.44,"one-unit passage leaves 0.44 units around the 0.56-unit avatar footprint");
assert.strictEqual(House.playerSlack(2),1.44,"two-unit passage leaves 1.44 units around the avatar footprint");
assert(House.supportsPassage(1,"secondary"),"one-unit passages must remain valid for secondary circulation");
assert(!House.supportsPassage(.99,"secondary"),"less than one unit must not pass the secondary clearance rule");
assert(House.supportsPassage(2,"primary"),"two-unit passages must pass the primary clearance rule");
assert(!House.supportsPassage(1.99,"primary"),"less than two units must not pass the primary clearance rule");
const wrongClearance={...level,primaryClearance:1};
assert.throws(()=>House.validateLevel(wrongClearance),/clearance metadata/,"text metadata must not weaken the two-unit primary path");

console.log("house space: enclosed 24x20 shell, sectioned rooms, restaurant-scale refrigerator, and 1u/2u clearances validated");
