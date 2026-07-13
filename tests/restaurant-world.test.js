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
const jsonLength=kitBuffer.readUInt32LE(12),gltf=JSON.parse(kitBuffer.subarray(20,20+jsonLength).toString("utf8").replace(/\0+$/,""));
const kitScenes=new Set(gltf.scenes.flatMap(scene=>scene.nodes.map(node=>gltf.nodes[node]?.name)));
assert(kitScenes.has(Restaurant.KITCHEN_FLOOR.sourceScene),"curated Restaurant Bits GLB must include the authored kitchen floor");
const html=read("index.html"),houseSystem=read("house-system.js"),styles=read("styles.css");
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

const diningSpawn=Restaurant.cellCenter(dining,dining.spawnCol,dining.spawnRow);
assert(Restaurant.canWalk(rooms,diningSpawn.x,diningSpawn.z),"dining spawn must be walkable");
assert(Restaurant.canWalk(rooms,0,-19.75),"dining side of doorway must be walkable");
assert(Restaurant.canWalk(rooms,0,-20.25),"kitchen side of doorway must be walkable");
assert(Restaurant.canWalk(rooms,0,-20.01),"doorway must cross the shared room boundary without a collision gap");
assert.strictEqual(Restaurant.canWalk(rooms,-19.5,0),false,"wall cells must collide");
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
const fridge=Restaurant.cellCenter(kitchen,3,1);
assert.strictEqual(Restaurant.canWalk(rooms,fridge.x,fridge.z+.9),false,"large kitchen appliances need measured collision footprints");

const symbols=new Set(rooms.flatMap(room=>room.map).join("").replace(/[.#D]/g,"").split(""));
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
 constructor(){this.children=[];this.userData={};this.position={set:(x,y,z)=>{this.xyz=[x,y,z]}};this.parent=null}
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
const scene=new Group(),runtime=Restaurant.buildRuntime({Group,BoxGeometry,MeshStandardMaterial,Mesh,InstancedMesh,Matrix4},scene,rooms);
assert.strictEqual(scene.children[0],runtime.group);
assert.strictEqual(runtime.group.userData.destination,"restaurant");
const kitchenFloor=runtime.group.children.find(child=>child.userData.assetId==="restaurant.floor.kitchen.checkerboard");
assert(kitchenFloor,"restaurant kitchen must build a checkerboard floor");
assert.deepStrictEqual([kitchenFloor.userData.surfaceY,kitchenFloor.userData.fixtureBaseY,kitchenFloor.userData.playerBaseY],[0,0,0],"floor surface, fixtures, and player must share the same base height");
assert.strictEqual(kitchenFloor.userData.tileCount,625,"fallback checkerboard must cover every 1x1 kitchen cell");
assert.strictEqual(kitchenFloor.children.reduce((sum,batch)=>sum+batch.count,0),625,"checkerboard batches must not leave floor gaps");
assert.deepStrictEqual(Object.keys(Restaurant.DEBUG_VIEWS),["kitchen-overview","kitchen-fixtures","kitchen-doorway"],"screenshot QA needs stable named kitchen views");
for(const view of Object.values(Restaurant.DEBUG_VIEWS))assert(Restaurant.canWalk(rooms,view.position.x,view.position.z),"kitchen screenshot pose must remain walkable");
const floorRoot=Object.assign(new Node3D(),{name:Restaurant.KITCHEN_FLOOR.sourceScene,isMesh:true,geometry:{},material:{}}),floorScene=new Group();floorScene.add(floorRoot);
const authoredFloor=Restaurant.buildKitchenFloor({Group,BoxGeometry,MeshStandardMaterial,InstancedMesh},kitchen,{scenes:[floorScene]},new Matrix4());
assert.strictEqual(authoredFloor.userData.sourceReady,true,"available Restaurant Bits floor must replace the procedural fallback");
assert.strictEqual(authoredFloor.userData.tileCount,49,"25x25 kitchen must use 49 fitted 4x4 authored tile modules");
assert.strictEqual(authoredFloor.children[0].count,49,"authored checkerboard must remain a single instanced draw batch");
assert.strictEqual(authoredFloor.children[0].matrices[0][1]+Restaurant.KITCHEN_FLOOR.thickness/2,Restaurant.KITCHEN_FLOOR.surfaceY,"authored tile top must land exactly at fixture/player base height");
assert.strictEqual(runtime.group.userData.npcs,0);assert.strictEqual(runtime.group.userData.orders,false);assert.strictEqual(runtime.group.userData.hud,false);
assert.strictEqual(runtime.group.children.filter(child=>child.userData.placeholder).length,symbols.size,"each asset symbol should create one instanced placeholder batch");
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
