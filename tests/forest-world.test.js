const assert=require("assert");
const fs=require("fs");
const vm=require("vm");

class Vector3{constructor(x=0,y=0,z=0){this.set(x,y,z)}set(x,y,z){this.x=x;this.y=y;this.z=z;return this}setScalar(v){return this.set(v,v,v)}}
class Group{
  constructor(){this.children=[];this.position=new Vector3();this.rotation={x:0,y:0,z:0};this.scale=new Vector3(1,1,1);this.visible=true}
  add(item){this.children.push(item);item.parent=this}
  remove(item){this.children=this.children.filter(child=>child!==item)}
}
class Mesh extends Group{constructor(geometry,material){super();this.geometry=geometry;this.material=material}}
class InstancedMesh extends Mesh{
  constructor(geometry,material,capacity){super(geometry,material);this.count=capacity;this.instanceMatrix={count:capacity,needsUpdate:false,setUsage(){}}}
  setMatrixAt(){} computeBoundingSphere(){} dispose(){this.disposed=true}
}
class Disposable{dispose(){this.disposed=true}}
class Matrix4{compose(){return this}}
const geometryNames=["BoxGeometry","CylinderGeometry","DodecahedronGeometry","SphereGeometry"];
const THREE={Group,Mesh,InstancedMesh,Vector3,Quaternion:class{},Matrix4,MeshLambertMaterial:Disposable,DynamicDrawUsage:1};
geometryNames.forEach(name=>THREE[name]=class extends Disposable{});

global.THREE=THREE;global.window=global;global.worldFactories={};
global.QuaterniusForestAnimals={load:async()=>({geometry:new Disposable(),material:new Disposable(),dispose(){this.geometry.dispose();this.material.dispose()}})};
vm.runInThisContext(fs.readFileSync(require.resolve("../forest-world.js"),"utf8"));

(async()=>{
  const scene=new Group(),world=worldFactories.forest.create(scene);
  let debug=world.debug();
  assert(debug.visibleChunks>100,"expanded forest should render substantially beyond the former 25 chunks");
  assert(debug.activeChunks>debug.visibleChunks,"a cached keep ring should surround visible chunks");
  assert.strictEqual(debug.generationLookAheadUnits,48);
  assert(debug.visibleAnimals>0&&debug.visibleAnimals<=2,"only nearby landmark animals should be visible at spawn");
  world.update(0,0);debug=world.debug();
  assert.strictEqual(debug.visibleAnimals,0,"distant animals should be culled");
  assert(debug.activeChunks<=debug.maxActiveChunks);
  await Promise.resolve();await Promise.resolve();
  world.destroy();
  assert.strictEqual(scene.children.length,0,"forest root should be removed on destroy");
  console.log(`forest streaming: ${debug.visibleChunks} visible, ${debug.activeChunks} cached, ${debug.visibleAnimals} distant animals`);
})().catch(error=>{console.error(error);process.exitCode=1});
