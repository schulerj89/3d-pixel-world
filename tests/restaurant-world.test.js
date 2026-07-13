const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Restaurant=require("../restaurant-world.js");

const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const dining=Restaurant.parseLevel(read(Restaurant.ROOM_FILES.dining));
const kitchen=Restaurant.parseLevel(read(Restaurant.ROOM_FILES.kitchen));
const rooms=[dining,kitchen];
const kitPath=path.join(__dirname,"..","assets","models","restaurant","kaykit-restaurant-kit.glb");
const kitBuffer=fs.readFileSync(kitPath);
assert.strictEqual(kitBuffer.toString("ascii",0,4),"glTF","KayKit restaurant kit must be a valid binary glTF");
assert.strictEqual(kitBuffer.length,503564,"audited KayKit derivative size changed unexpectedly");
assert(Restaurant.KIT_URL.endsWith("?v=__BUILD_VERSION__"),"restaurant GLB must be cache-versioned before Pages stamping");
assert.strictEqual(Restaurant.BACKGROUND_COLOR,0x87ceeb,"restaurant must use a blue-sky background");
for(const [key,spec] of Object.entries(Restaurant.EXTRA_ASSETS)){
 const file=spec.url.split("?")[0],buffer=fs.readFileSync(path.join(__dirname,"..",file));
 assert.strictEqual(buffer.toString("ascii",0,4),"glTF",`${key} must be a valid binary glTF`);
 assert(buffer.length<(spec.kind==="npc"?1100000:400000),`${key} must stay within its audited ${spec.kind} budget`);
 assert.strictEqual(buffer.length,spec.bytes,`${key} runtime byte metadata must match its GLB`);
 assert(spec.url.endsWith("?v=__BUILD_VERSION__"),`${key} must be cache-versioned`);
 if(spec.kind==="npc"){
  const length=buffer.readUInt32LE(12),json=JSON.parse(buffer.subarray(20,20+length).toString("utf8").replace(/\0+$/,""));
  assert(json.animations.some(animation=>animation.name===spec.idleClip),`${key} must ship its configured idle clip`);
 }
}
const jsonLength=kitBuffer.readUInt32LE(12),gltf=JSON.parse(kitBuffer.subarray(20,20+jsonLength).toString("utf8").replace(/\0+$/,""));
const kitScenes=new Set(gltf.scenes.flatMap(scene=>scene.nodes.map(node=>gltf.nodes[node]?.name)));
assert(kitScenes.has(Restaurant.WALL.sourceScene),"KayKit derivative must include the authored restaurant wall scene");
assert(kitScenes.has(Restaurant.KITCHEN_FLOOR.sourceScene),"curated Restaurant Bits GLB must include the authored kitchen floor");
assert(kitScenes.has(Restaurant.FRONT_ENTRANCE.frameScene)&&kitScenes.has(Restaurant.FRONT_ENTRANCE.doorScene),"front entrance must reuse the matching Restaurant Bits doorway and door scenes");
assert(kitScenes.has(Restaurant.KITCHEN_FOOD_SHELF.sourceScene),"food display must reuse the authored Restaurant Bits wall shelf");
Restaurant.KITCHEN_FOOD_SHELF.food.forEach(food=>assert(kitScenes.has(food.sourceScene),`${food.assetId} must reuse an authored Restaurant Bits food scene`));
assert.strictEqual(Restaurant.FRONT_ENTRANCE.doorOffsetX,-.8,"door leaf must offset its authored 0..1.6 footprint to center over the doorway opening");
const html=read("index.html"),houseSystem=read("house-system.js"),styles=read("styles.css");
const game=read("game.js");assert(game.includes('window.RestaurantWorld?.current?.update?.(dt,currentPlace==="restaurant"?P.position:null)'),"restaurant idle animation and proximity marker must update from the shared game loop");
assert(/id="goBakery"[^>]*>[^<]*<span>Restaurant<\/span>/.test(html),"Realm destination must display Restaurant");
assert(!/id="goBakery">[^<]*<span>Bakery<\/span>/.test(html),"Bakery must not remain a visible Realm destination");
assert(html.indexOf("restaurant-world.js")<html.indexOf("house-system.js"),"Restaurant runtime must load before destination routing");
assert(/goBakery\.onclick=\(\)=>window\.runWorldTransition\([^\n]+restaurant/.test(houseSystem),"legacy destination ID must route to Restaurant");
assert(houseSystem.includes('get("restaurantRoom")'),"named restaurant room poses must be available for screenshot QA");
assert(/function showBakery\(\)/.test(houseSystem),"dormant Bakery implementation must remain available");
assert(/body\.restaurant-mode #kitchenTools[^\n]+#orders[^\n]+#inventoryBox/.test(styles),"Restaurant mode must suppress Bakery HUD panels");

assert.deepStrictEqual([dining.width,dining.depth],[40,40],"dining room must be 40x40 world units");
assert.deepStrictEqual([kitchen.width,kitchen.depth],[25,25],"kitchen must be 25x25 world units");
assert.strictEqual(dining.cell,1);assert.strictEqual(kitchen.cell,1);
assert(Restaurant.validateConnection(dining,kitchen),"connected doorway must align");
assert.strictEqual(Restaurant.doorwayCells(dining).length,4);
assert.strictEqual(Restaurant.doorwayCells(kitchen).length,4);
assert.strictEqual(dining.map[dining.map.length-1].split("E").length-1,4,"front entrance must reserve the full four-unit authored doorway module");
assert(Restaurant.canWalk(rooms,0,19),"player must be able to approach the front entrance from the dining side");
assert.strictEqual(Restaurant.canWalk(rooms,0,19.7),false,"closed front entrance must stop the player before the visible door");

const diningSpawn=Restaurant.cellCenter(dining,dining.spawnCol,dining.spawnRow);
assert(Restaurant.canWalk(rooms,diningSpawn.x,diningSpawn.z),"dining spawn must be walkable");
assert(Restaurant.canWalk(rooms,0,-19.75),"dining side of doorway must be walkable");
assert(Restaurant.canWalk(rooms,0,-20.25),"kitchen side of doorway must be walkable");
assert(Restaurant.canWalk(rooms,0,-20.01),"doorway must cross the shared room boundary without a collision gap");
assert.strictEqual(Restaurant.canWalk(rooms,-19.5,0),false,"wall cells must collide");
assert.strictEqual(Restaurant.canWalk(rooms,-19.46,-10),true,"authored half-unit walls must release at their visible inner edge plus player radius");
assert.strictEqual(Restaurant.canWalk(rooms,-12.6,-30),false,"outside both rooms must collide");

const kitchenSpawn=Restaurant.cellCenter(kitchen,kitchen.spawnCol,kitchen.spawnRow),step=.5,queue=[[diningSpawn.x,diningSpawn.z]],visited=new Set([`${diningSpawn.x},${diningSpawn.z}`]);
let connected=false;
for(let index=0;index<queue.length&&!connected;index++){
 const [x,z]=queue[index];if(Math.hypot(x-kitchenSpawn.x,z-kitchenSpawn.z)<=step){connected=true;break}
 for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
  const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;
  if(!visited.has(key)&&Restaurant.canWalk(rooms,nx,nz)){visited.add(key);queue.push([nx,nz])}
 }
}
assert(connected,"the dining spawn must have a continuous collision-safe route into the kitchen");

const table=Restaurant.cellCenter(dining,8,8);
assert.strictEqual(Restaurant.symbolAtWorld(dining,table.x,table.z),"T");
assert.strictEqual(Restaurant.canWalk(rooms,table.x,table.z),false,"placeholder fixtures must collide");
assert.strictEqual(Restaurant.canWalk(rooms,table.x,table.z+.9),false,"collision must cover the visible KayKit table footprint, not only its symbol cell");
assert.strictEqual(Restaurant.canWalk(rooms,table.x,table.z+1.6),true,"table collision must release beyond the measured footprint");
const leftChair=Restaurant.cellCenter(dining,7,8),rightChair=Restaurant.cellCenter(dining,9,8);
assert.strictEqual(Restaurant.assetTransform(dining,"C",7,8,leftChair).yaw,Math.PI/2,"left dining chairs must turn 180 degrees to face their tables");
assert.strictEqual(Restaurant.assetTransform(dining,"C",9,8,rightChair).yaw,-Math.PI/2,"right dining chairs must turn 180 degrees to face their tables");
assert.strictEqual(Restaurant.canWalk(rooms,Restaurant.CASH_DESK.position.x,Restaurant.CASH_DESK.position.z),false,"cash desk footprint must collide in the main area");
const fridge=Restaurant.cellCenter(kitchen,2,1);
assert.strictEqual(Restaurant.canWalk(rooms,fridge.x,fridge.z+.9),false,"large kitchen appliances need measured collision footprints");

const kitchenPlacements=[];
kitchen.map.forEach((row,r)=>[...row].forEach((symbol,c)=>{if(Restaurant.ASSET_REGISTRY[symbol])kitchenPlacements.push({symbol,row:r,col:c,position:Restaurant.cellCenter(kitchen,c,r)})}));
const prepCounters=kitchenPlacements.filter(item=>item.symbol==="K");
assert.strictEqual(prepCounters.length,3,"kitchen must have exactly three prep counters");
assert(prepCounters.every(item=>item.row===prepCounters[0].row),"prep counters must form one free-standing island run");
assert(prepCounters.slice(1).every((item,index)=>item.col-prepCounters[index].col>=3),"prep counters need at least three world units center-to-center");
assert.strictEqual(Restaurant.ASSET_REGISTRY.F.scale,1.4,"refrigerators must be scaled up by 40%");
assert.strictEqual(Restaurant.ASSET_REGISTRY.S.sourceScene,"oven","stove must use the undecorated appliance scene with no food on top");
for(const item of kitchenPlacements.filter(item=>["S","F","W","R"].includes(item.symbol))){
 const transform=Restaurant.assetTransform(kitchen,item.symbol,item.col,item.row,item.position);
 if(item.row===1){
  assert.strictEqual(transform.yaw,0,`${item.symbol} on the north wall must face into the kitchen`);
  assert(Math.abs(transform.z-Restaurant.ASSET_REGISTRY[item.symbol].collision[1]-(kitchen.originZ+Restaurant.WALL.thickness/2))<.001,`${item.symbol} must sit flush to the authored north wall`);
 }else if(item.col===1){
  assert.strictEqual(transform.yaw,Math.PI/2,`${item.symbol} on the west wall must face into the kitchen`);
 }else if(item.col===kitchen.map[item.row].length-2){
  assert.strictEqual(transform.yaw,-Math.PI/2,`${item.symbol} on the east wall must face into the kitchen`);
 }else assert.fail(`${item.symbol} must be placed against a kitchen wall`);
}
const westRack=kitchenPlacements.find(item=>item.symbol==="R"&&item.col===1),westRackTransform=Restaurant.assetTransform(kitchen,"R",westRack.col,westRack.row,westRack.position);
assert.strictEqual(Restaurant.canWalk(rooms,westRackTransform.x+.9,westRackTransform.z),true,"rotated side-wall collision must release along the cabinet depth axis");
assert.strictEqual(Restaurant.canWalk(rooms,westRackTransform.x,westRackTransform.z+.7),false,"rotated side-wall collision must cover the cabinet width axis");

const symbols=new Set(rooms.flatMap(room=>room.map).join("").replace(/[.#DE]/g,"").split(""));
for(const symbol of symbols){
 const asset=Restaurant.ASSET_REGISTRY[symbol];
 assert(asset,`missing asset registry entry for ${symbol}`);
 assert(/^restaurant\./.test(asset.assetId),`${symbol} needs a stable restaurant asset ID`);
 assert(Array.isArray(asset.size)&&asset.size.length===3,`${symbol} needs placeholder dimensions`);
 assert(Array.isArray(asset.collision)&&asset.collision.length===2,`${symbol} needs a measured X/Z collision footprint`);
}
for(const symbol of ["T","C","B","H","K","S","F","W","R"]){
 const source=Restaurant.ASSET_REGISTRY[symbol].sourceScene;
 assert(source,`${symbol} must use a KayKit scene instead of its primitive fallback`);
 assert(kitScenes.has(source),`${symbol} references missing KayKit scene ${source}`);
}

class Node3D{
 constructor(){this.children=[];this.userData={};this.position={set:(x,y,z)=>{this.xyz=[x,y,z]}};this.rotation={};this.scale={setScalar:value=>{this.scalar=value},set:(x,y,z)=>{this.scaleXYZ=[x,y,z]}};this.parent=null}
 add(child){child.parent=this;this.children.push(child)}
 traverse(visitor){visitor(this);this.children.forEach(child=>child.traverse?child.traverse(visitor):visitor(child))}
 remove(child){this.children=this.children.filter(item=>item!==child)}
}
class Group extends Node3D{}
class BoxGeometry{constructor(...size){this.size=size}dispose(){this.disposed=true}}
class MeshStandardMaterial{constructor(options){Object.assign(this,options)}dispose(){this.disposed=true}}
class Mesh extends Node3D{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
class InstancedMesh extends Mesh{constructor(geometry,material,count){super(geometry,material);this.count=count;this.instanceMatrix={needsUpdate:false};this.matrices=[]}setMatrixAt(i,matrix){this.matrices[i]=matrix.translation}}
class Matrix4{makeTranslation(x,y,z){this.translation=[x,y,z];return this}makeScale(x,y,z){this.scale=[x,y,z];return this}setPosition(x,y,z){this.translation=[x,y,z];return this}}
class Vector3{set(x,y,z){this.xyz=[x,y,z];return this}}
Matrix4.prototype.makeRotationY=function(yaw){this.yaw=yaw;return this};Matrix4.prototype.scale=function(vector){this.instanceScale=vector.xyz;return this};
const scene=new Group(),runtime=Restaurant.buildRuntime({Group,BoxGeometry,MeshStandardMaterial,Mesh,InstancedMesh,Matrix4,Vector3},scene,rooms);
assert.strictEqual(scene.children[0],runtime.group);
assert.strictEqual(runtime.group.userData.destination,"restaurant");
const kitchenFloor=runtime.group.children.find(child=>child.userData.assetId==="restaurant.floor.kitchen.checkerboard");
assert(kitchenFloor,"restaurant kitchen must build a checkerboard floor");
assert.deepStrictEqual([kitchenFloor.userData.surfaceY,kitchenFloor.userData.fixtureBaseY,kitchenFloor.userData.playerBaseY],[0,0,0],"floor surface, fixtures, and player must share the same base height");
assert.strictEqual(kitchenFloor.userData.tileCount,625,"fallback checkerboard must cover every 1x1 kitchen cell");
assert.strictEqual(kitchenFloor.children.reduce((sum,batch)=>sum+batch.count,0),625,"checkerboard batches must not leave floor gaps");
for(const name of ["kitchen-overview","kitchen-fixtures","kitchen-doorway","kitchen-north-wall","kitchen-west-wall","kitchen-east-wall","restaurant-chair-table","restaurant-cash-register","restaurant-front-door","restaurant-cashier-npc","restaurant-sky-overview","kitchen-food-shelf"]){
 assert(Restaurant.DEBUG_VIEWS[name],`screenshot QA needs stable ${name} view`);
}
for(const view of Object.values(Restaurant.DEBUG_VIEWS).filter(view=>!view.hidePlayer))assert(Restaurant.canWalk(rooms,view.position.x,view.position.z),"player-visible restaurant screenshot poses must remain walkable");
const floorRoot=Object.assign(new Node3D(),{name:Restaurant.KITCHEN_FLOOR.sourceScene,isMesh:true,geometry:{},material:{}}),floorScene=new Group();floorScene.add(floorRoot);
const authoredFloor=Restaurant.buildKitchenFloor({Group,BoxGeometry,MeshStandardMaterial,InstancedMesh},kitchen,{scenes:[floorScene]},new Matrix4());
assert.strictEqual(authoredFloor.userData.sourceReady,true,"available Restaurant Bits floor must replace the procedural fallback");
assert.strictEqual(authoredFloor.userData.tileCount,49,"25x25 kitchen must use 49 fitted 4x4 authored tile modules");
assert.strictEqual(authoredFloor.children[0].count,49,"authored checkerboard must remain a single instanced draw batch");
assert.strictEqual(authoredFloor.children[0].matrices[0][1]+Restaurant.KITCHEN_FLOOR.thickness/2,Restaurant.KITCHEN_FLOOR.surfaceY,"authored tile top must land exactly at fixture/player base height");
const segments=Restaurant.wallSegments(rooms);
assert.strictEqual(Restaurant.wallBoundaryLines(rooms).length,7,"shared dining/kitchen boundary must render once rather than as parallel walls");
assert.strictEqual(segments.length,61,"restaurant shell must use fitted authored wall modules for every solid perimeter run");
assert(segments.every(segment=>segment.length>0&&segment.length<=Restaurant.WALL.moduleLength),"wall runs must be fitted without stretching beyond the authored four-unit module");
const sharedWalls=segments.filter(segment=>Math.abs(segment.z+20)<.001&&segment.yaw===0);
assert.strictEqual(sharedWalls.length,10,"shared wall must preserve two solid runs around the four-unit doorway");
assert(sharedWalls.every(segment=>segment.x+segment.length/2<=-2+.001||segment.x-segment.length/2>=2-.001),"authored wall art must not overlap the connected-room doorway");
const wallRoot=Object.assign(new Node3D(),{name:Restaurant.WALL.sourceScene,isMesh:true,geometry:{},material:{},scale:{x:2,y:2,z:2}});wallRoot.position.y=2;
const wallScene=new Group();wallScene.add(wallRoot);
const authoredWalls=Restaurant.buildWalls({Group,BoxGeometry,MeshStandardMaterial,InstancedMesh,Vector3},rooms,{scenes:[wallScene]},new Matrix4());
assert.strictEqual(authoredWalls.userData.placeholder,false,"available KayKit wall art must replace the procedural wall fallback");
assert.strictEqual(authoredWalls.userData.sourceScene,"wall");assert.strictEqual(authoredWalls.count,segments.length,"authored walls must remain one instanced draw batch");
assert.deepStrictEqual(runtime.group.userData.npcs,{count:1,cashier:{assetId:"restaurant.npc.cashier-merchant",idleClip:"anim_iddle",animated:false}},"cashier fallback must remain explicit in runtime diagnostics");assert.strictEqual(runtime.group.userData.orders,false);assert.strictEqual(runtime.group.userData.hud,false);
assert.deepStrictEqual(Object.values(runtime.cameraPoses).map(pose=>pose.name),["kitchen-overview","kitchen-north-wall","kitchen-west-wall","kitchen-east-wall","restaurant-chair-table","restaurant-cash-register","restaurant-front-door","restaurant-cashier-npc","kitchen-food-shelf"],"named restaurant camera poses must remain stable for screenshot QA");
assert(Object.values(runtime.cameraPoses).every(pose=>["kitchen","dining"].includes(pose.sceneId)&&Number.isFinite(pose.target.x)&&Number.isFinite(pose.target.z)),"restaurant screenshot poses need explicit scene targets");
const foodShelf=runtime.group.children.find(child=>child.userData.assetId===Restaurant.KITCHEN_FOOD_SHELF.assetId);assert(foodShelf,"kitchen must build the proximity-aware food shelf even when art falls back");
assert.strictEqual(runtime.update(.016,{x:0,z:0}),false,"food shelf icon must stay hidden outside its range");
assert.strictEqual(runtime.update(.016,{x:-9,z:-34.5}),true,"food shelf icon must appear near its configured wall position");
assert.strictEqual(runtime.group.userData.proximity.active,true);assert.strictEqual(runtime.group.userData.proximity.action,null,"nearby shelf marker is informational only for now");
assert.strictEqual(runtime.group.children.filter(child=>child.userData.placeholder&&child.userData.symbol).length,symbols.size,"each fixture symbol should create one instanced placeholder batch");
assert(runtime.group.children.every(child=>!child.userData.bakeryCustomerId),"restaurant runtime must not create bakery NPCs");
assert(runtime.canWalk(runtime.spawn.x,runtime.spawn.z));

let geometryDisposals=0,materialDisposals=0,textureDisposals=0;
const sharedGeometry={dispose:()=>geometryDisposals++};
const sharedTexture={isTexture:true,dispose:()=>textureDisposals++};
const sharedMaterial={map:sharedTexture,dispose:()=>materialDisposals++};
const disposableRoot=new Group();
disposableRoot.add(Object.assign(new Node3D(),{geometry:sharedGeometry,material:sharedMaterial}));
disposableRoot.add(Object.assign(new Node3D(),{geometry:sharedGeometry,material:sharedMaterial}));
assert.deepStrictEqual(Restaurant.disposeRuntimeResources(disposableRoot),{geometries:1,materials:1,textures:1},"shared GLB resources must be deduplicated during disposal");
assert.deepStrictEqual([geometryDisposals,materialDisposals,textureDisposals],[1,1,1],"Restaurant unload must explicitly dispose shared geometry, material, and texture resources once");

(async()=>{
 const requests=[];
 const fakeFetch=async url=>{requests.push(url);const file=String(url).split("?")[0];return {ok:true,text:async()=>read(file)}};
 const loaded=await Restaurant.loadRooms(fakeFetch);
 assert.deepStrictEqual(loaded.map(room=>room.room),["dining","kitchen"]);
 assert(requests.every(url=>url.endsWith("?v=__BUILD_VERSION__")),"layout requests must be cache-versioned before Pages stamping");
 console.log(`restaurant world: ${dining.width}x${dining.depth} dining + ${kitchen.width}x${kitchen.depth} kitchen, ${symbols.size} mapped fixture symbols`);
})().catch(error=>{console.error(error);process.exitCode=1});
