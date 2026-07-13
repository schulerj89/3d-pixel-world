const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Restaurant=require("../restaurant-world.js");

const read=file=>fs.readFileSync(path.join(__dirname,"..",file),"utf8");
const dining=Restaurant.parseLevel(read(Restaurant.ROOM_FILES.dining));
const kitchen=Restaurant.parseLevel(read(Restaurant.ROOM_FILES.kitchen));
const rooms=[dining,kitchen];
const html=read("index.html"),houseSystem=read("house-system.js"),styles=read("styles.css");
assert(/id="goBakery">🍽️<span>Restaurant<\/span>/.test(html),"Realm destination must display Restaurant");
assert(!/id="goBakery">[^<]*<span>Bakery<\/span>/.test(html),"Bakery must not remain a visible Realm destination");
assert(html.indexOf("restaurant-world.js")<html.indexOf("house-system.js"),"Restaurant runtime must load before destination routing");
assert(/goBakery\.onclick=\(\)=>window\.runWorldTransition\([^\n]+restaurant/.test(houseSystem),"legacy destination ID must route to Restaurant");
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

const table=Restaurant.cellCenter(dining,8,8);
assert.strictEqual(Restaurant.symbolAtWorld(dining,table.x,table.z),"T");
assert.strictEqual(Restaurant.canWalk(rooms,table.x,table.z),false,"placeholder fixtures must collide");

const symbols=new Set(rooms.flatMap(room=>room.map).join("").replace(/[.#D]/g,"").split(""));
for(const symbol of symbols){
 const asset=Restaurant.ASSET_REGISTRY[symbol];
 assert(asset,`missing asset registry entry for ${symbol}`);
 assert(/^restaurant\./.test(asset.assetId),`${symbol} needs a stable restaurant asset ID`);
 assert(Array.isArray(asset.size)&&asset.size.length===3,`${symbol} needs placeholder dimensions`);
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
class Matrix4{makeTranslation(x,y,z){this.translation=[x,y,z];return this}}
const scene=new Group(),runtime=Restaurant.buildRuntime({Group,BoxGeometry,MeshStandardMaterial,Mesh,InstancedMesh,Matrix4},scene,rooms);
assert.strictEqual(scene.children[0],runtime.group);
assert.strictEqual(runtime.group.userData.destination,"restaurant");
assert.strictEqual(runtime.group.userData.npcs,0);assert.strictEqual(runtime.group.userData.orders,false);assert.strictEqual(runtime.group.userData.hud,false);
assert.strictEqual(runtime.group.children.filter(child=>child.userData.placeholder).length,symbols.size,"each asset symbol should create one instanced placeholder batch");
assert(runtime.group.children.every(child=>!child.userData.bakeryCustomerId),"restaurant runtime must not create bakery NPCs");
assert(runtime.canWalk(runtime.spawn.x,runtime.spawn.z));

(async()=>{
 const requests=[];
 const fakeFetch=async url=>{requests.push(url);const file=String(url).split("?")[0];return {ok:true,text:async()=>read(file)}};
 const loaded=await Restaurant.loadRooms(fakeFetch);
 assert.deepStrictEqual(loaded.map(room=>room.room),["dining","kitchen"]);
 assert(requests.every(url=>url.endsWith("?v=__BUILD_VERSION__")),"layout requests must be cache-versioned before Pages stamping");
 console.log(`restaurant world: ${dining.width}x${dining.depth} dining + ${kitchen.width}x${kitchen.depth} kitchen, ${symbols.size} mapped fixture symbols`);
})().catch(error=>{console.error(error);process.exitCode=1});
