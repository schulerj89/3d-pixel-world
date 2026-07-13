// Data-driven Restaurant destination. Bakery code remains available but dormant.
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.RestaurantWorld=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__";
 const KIT_URL=`assets/models/restaurant/kaykit-restaurant-kit.glb?v=${BUILD_VERSION}`;
 const ROOM_FILES={dining:"restaurant-main-level.txt",kitchen:"restaurant-kitchen-level.txt"};
 const WALKABLE=new Set([".","D"]);
 const PLAYER_RADIUS=.28;
 const ASSET_REGISTRY=Object.freeze({
  T:{assetId:"restaurant.table.round",sourceScene:"table_round_A",scale:.78,collision:[1.17,1.17],color:0xb87955,size:[1.35,.78,1.35],height:.39},
  C:{assetId:"restaurant.chair.dining",sourceScene:"chair_A",scale:.88,collision:[.34,.36],color:0xd79a78,size:[.72,1.05,.72],height:.525},
  B:{assetId:"restaurant.booth.single",sourceScene:"chair_stool",scale:1.15,collision:[.44,.44],color:0xc75f87,size:[.9,1.15,1.5],height:.575},
  H:{assetId:"restaurant.host.stand",sourceScene:"menu",scale:1.35,collision:[.35,.24],color:0x8f5d45,size:[.9,1.25,.7],height:.625},
  P:{assetId:"restaurant.plant.potted",collision:[.38,.38],color:0x5da56c,size:[.75,1.35,.75],height:.675},
  K:{assetId:"restaurant.kitchen.prep",sourceScene:"kitchencounter_straight_A_backsplash",collision:[1,1.03],color:0xb9c6cf,size:[.92,1,.92],height:.5},
  S:{assetId:"restaurant.kitchen.stove",sourceScene:"oven",collision:[1,1.174],color:0x555d66,size:[2,2.02,2.348],height:1.01},
  F:{assetId:"restaurant.kitchen.fridge",sourceScene:"fridge_A_decorated",scale:1.4,collision:[1.4,1.568],color:0xdce8ed,size:[2.8,3.5,3.136],height:1.75},
  W:{assetId:"restaurant.kitchen.sink",sourceScene:"kitchencounter_sink_backsplash",collision:[1,1.03],color:0x76aab8,size:[.92,1,.92],height:.5},
  R:{assetId:"restaurant.kitchen.rack",sourceScene:"kitchencabinet",collision:[1,.53],color:0x9b765a,size:[.92,1.8,.92],height:.9}
 });

 function parseLevel(text){
  const values={},map=[];let readingMap=false;
  String(text).split(/\r?\n/).forEach(raw=>{
   const line=raw.trim();if(!line||line.startsWith(";"))return;
   if(line==="map:"){readingMap=true;return}
   if(readingMap){map.push(line);return}
   const split=line.indexOf(":");if(split>0)values[line.slice(0,split).trim()]=line.slice(split+1).trim();
  });
  const [width,depth]=String(values.size||"").split("x").map(Number);
  const cell=Number(values.cell),[originX,originZ]=String(values.origin||"").split(",").map(Number);
  const [spawnCol,spawnRow]=String(values.spawn||"").split(",").map(Number);
  if(!width||!depth||!cell||!Number.isFinite(originX)||!Number.isFinite(originZ))throw new Error("Invalid restaurant level metadata");
  if(map.length!==depth/cell||map.some(row=>row.length!==width/cell))throw new Error(`Restaurant ${values.room||"room"} map dimensions do not match metadata`);
  if(!map[spawnRow]||!WALKABLE.has(map[spawnRow][spawnCol]))throw new Error(`Restaurant ${values.room||"room"} spawn must be walkable`);
  const unknown=new Set(map.join("").split("").filter(symbol=>symbol!=="#"&&!WALKABLE.has(symbol)&&!ASSET_REGISTRY[symbol]));
  if(unknown.size)throw new Error(`Unknown restaurant symbols: ${[...unknown].join(",")}`);
  return {...values,width,depth,cell,originX,originZ,spawnCol,spawnRow,map};
 }
 function cellCenter(room,col,row){return {x:room.originX+(col+.5)*room.cell,z:room.originZ+(row+.5)*room.cell}}
 function roomAt(rooms,x,z){return rooms.find(room=>x>=room.originX&&x<room.originX+room.width&&z>=room.originZ&&z<room.originZ+room.depth)}
 function symbolAtWorld(room,x,z){
  const col=Math.floor((x-room.originX)/room.cell),row=Math.floor((z-room.originZ)/room.cell);
  return room.map[row]?.[col];
 }
 function canWalk(rooms,x,z){
  const room=roomAt(rooms,x,z);if(!room)return false;
  const centerCol=Math.floor((x-room.originX)/room.cell),centerRow=Math.floor((z-room.originZ)/room.cell);
  for(let row=centerRow-2;row<=centerRow+2;row++)for(let col=centerCol-2;col<=centerCol+2;col++){
   const symbol=room.map[row]?.[col];if(!symbol||symbol==="."||symbol==="D")continue;
   const center=cellCenter(room,col,row);
   if(symbol==="#"){
    const half=room.cell/2+PLAYER_RADIUS;if(Math.abs(x-center.x)<half&&Math.abs(z-center.z)<half)return false;continue;
   }
   const spec=ASSET_REGISTRY[symbol],transform=assetTransform(room,symbol,col,row,center),baseHalf=spec?.collision||[room.cell/2,room.cell/2];
   const half=Math.abs(Math.sin(transform.yaw))>.5?[baseHalf[1],baseHalf[0]]:baseHalf;
   if(Math.abs(x-transform.x)<half[0]+PLAYER_RADIUS&&Math.abs(z-transform.z)<half[1]+PLAYER_RADIUS)return false;
  }
  return true;
 }
 function doorwayCells(room){
  const result=[];room.map.forEach((row,r)=>[...row].forEach((symbol,c)=>{if(symbol==="D")result.push(cellCenter(room,c,r))}));return result;
 }
 function validateConnection(dining,kitchen){
  const a=doorwayCells(dining),b=doorwayCells(kitchen);
  if(a.length!==4||b.length!==4)throw new Error("Restaurant connection requires four cells per doorway");
  const ax=a.map(p=>p.x).sort((x,y)=>x-y),bx=b.map(p=>p.x).sort((x,y)=>x-y);
  if(ax.some((x,i)=>Math.abs(x-bx[i])>.001))throw new Error("Restaurant doorways are not horizontally aligned");
  const diningNorth=dining.originZ,kitchenSouth=kitchen.originZ+kitchen.depth;
  if(Math.abs(diningNorth-kitchenSouth)>.001)throw new Error("Restaurant rooms do not share a doorway boundary");
  return true;
 }

 let runtime=null,loading=null;
 function sourceScene(kit,name){return kit?.scenes?.find(scene=>scene.children?.[0]?.name===name)||null}
 const WALL_FIXTURES=new Set(["S","F","W","R"]);
 function assetTransform(room,symbol,col,row,position){
  let x=position.x,z=position.z,yaw=0;
  if(symbol==="C"){
   if(room.map[row]?.[col+1]==="T"){x-=.58;yaw=-Math.PI/2}
   else if(room.map[row]?.[col-1]==="T"){x+=.58;yaw=Math.PI/2}
  }
  if(symbol==="B")yaw=Math.abs(x)<room.width*.25?0:(x<room.originX+room.width/2?Math.PI/2:-Math.PI/2);
  if(room.room==="kitchen"&&WALL_FIXTURES.has(symbol)){
   const halfDepth=ASSET_REGISTRY[symbol].collision[1];
   if(row<=1){z=room.originZ+room.cell+halfDepth;yaw=0}
   else if(row>=room.map.length-2){z=room.originZ+room.depth-room.cell-halfDepth;yaw=Math.PI}
   else if(col<=1){x=room.originX+room.cell+halfDepth;yaw=Math.PI/2}
   else if(col>=room.map[row].length-2){x=room.originX+room.width-room.cell-halfDepth;yaw=-Math.PI/2}
  }
  return {x,z,yaw};
 }
 function buildRuntime(THREE,scene,rooms,kit=null,assetError=""){
  validateConnection(rooms[0],rooms[1]);
  const group=new THREE.Group();group.name="restaurant-world";group.visible=false;
  const materials={wall:new THREE.MeshStandardMaterial({color:0xf4d6cc,roughness:.92}),
   diningFloor:new THREE.MeshStandardMaterial({color:0xd9ae86,roughness:1}),kitchenFloor:new THREE.MeshStandardMaterial({color:0xc6d0d3,roughness:1})};
  const wallGeometry=new THREE.BoxGeometry(1,4,1),wallCells=[];
  rooms.forEach(room=>{
   const floor=new THREE.Mesh(new THREE.BoxGeometry(room.width,.18,room.depth),room.room==="dining"?materials.diningFloor:materials.kitchenFloor);
   floor.position.set(room.originX+room.width/2,-.09,room.originZ+room.depth/2);floor.receiveShadow=true;floor.userData.assetId=`restaurant.floor.${room.room}`;group.add(floor);
   room.map.forEach((row,r)=>[...row].forEach((symbol,c)=>{if(symbol==="#")wallCells.push(cellCenter(room,c,r))}));
  });
  const walls=new THREE.InstancedMesh(wallGeometry,materials.wall,wallCells.length),matrix=new THREE.Matrix4();
  wallCells.forEach((p,i)=>{matrix.makeTranslation(p.x,2,p.z);walls.setMatrixAt(i,matrix)});walls.instanceMatrix.needsUpdate=true;walls.castShadow=walls.receiveShadow=true;walls.userData.assetId="restaurant.wall.segment";group.add(walls);
  const loadedAssetIds=[];
  for(const [symbol,spec] of Object.entries(ASSET_REGISTRY)){
   const placements=[];rooms.forEach(room=>room.map.forEach((row,r)=>[...row].forEach((value,c)=>{if(value===symbol)placements.push({room,row:r,col:c,...cellCenter(room,c,r)})})));
   if(!placements.length)continue;
   const prototype=spec.sourceScene&&sourceScene(kit,spec.sourceScene);
   if(prototype){
    const art=new THREE.Group();art.name=spec.assetId;art.userData={assetId:spec.assetId,symbol,sourceScene:spec.sourceScene,placeholder:false,instanceCount:placements.length};
    placements.forEach(placement=>{const clone=prototype.clone(true),transform=assetTransform(placement.room,symbol,placement.col,placement.row,placement);clone.position.set(transform.x,0,transform.z);clone.rotation.y=transform.yaw;clone.scale.setScalar(spec.scale||1);clone.traverse(object=>{if(object.isMesh){object.castShadow=symbol==="T"||symbol==="S"||symbol==="F";object.receiveShadow=true}});art.add(clone)});
    group.add(art);loadedAssetIds.push(spec.assetId);continue;
   }
   const geometry=new THREE.BoxGeometry(...spec.size),material=new THREE.MeshStandardMaterial({color:spec.color,roughness:.82});
   const batch=new THREE.InstancedMesh(geometry,material,placements.length);batch.name=spec.assetId;
   placements.forEach((p,i)=>{matrix.makeTranslation(p.x,spec.height,p.z);batch.setMatrixAt(i,matrix)});batch.instanceMatrix.needsUpdate=true;batch.castShadow=batch.receiveShadow=true;
   batch.userData={assetId:spec.assetId,symbol,placeholder:true,instanceCount:placements.length};group.add(batch);
  }
  group.userData={destination:"restaurant",rooms:rooms.map(room=>({id:room.room,width:room.width,depth:room.depth,layoutFile:ROOM_FILES[room.room]})),assetRegistry:ASSET_REGISTRY,assets:{url:KIT_URL,status:kit?"ready":"fallback",loadedAssetIds,error:assetError},npcs:0,orders:false,hud:false};
  scene.add(group);
  const spawns=Object.fromEntries(rooms.map(room=>[room.room,cellCenter(room,room.spawnCol,room.spawnRow)]));
  const cameraPoses={
   kitchenOverview:{sceneId:"kitchen",name:"kitchen-overview",target:{x:0,z:-30},angle:0,height:11,distance:15},
   kitchenNorthWall:{sceneId:"kitchen",name:"kitchen-north-wall",target:{x:0,z:-39},angle:0,height:6.5,distance:10},
   kitchenWestWall:{sceneId:"kitchen",name:"kitchen-west-wall",target:{x:-8.5,z:-34},angle:Math.PI/2,height:6.5,distance:10},
   kitchenEastWall:{sceneId:"kitchen",name:"kitchen-east-wall",target:{x:8.5,z:-34},angle:-Math.PI/2,height:6.5,distance:10}
  };
  return {group,rooms,spawns,spawn:spawns.dining,camera:{angle:.35,height:8.5,distance:8.8},cameraPoses,canWalk:(x,z)=>canWalk(rooms,x,z)};
 }
 async function loadRooms(fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=="function")throw new Error("Restaurant layouts require fetch");
  const texts=await Promise.all(Object.values(ROOM_FILES).map(async file=>{const response=await fetchImpl(`${file}?v=${BUILD_VERSION}`);if(!response.ok)throw new Error(`Failed to load ${file}: ${response.status}`);return response.text()}));
  return texts.map(parseLevel);
 }
 function loadKit(){
  const Loader=globalThis.ThreeGLTFLoader?.GLTFLoader;if(!Loader)return Promise.reject(new Error("Restaurant GLTF loader is unavailable"));
  return new Promise((resolve,reject)=>new Loader().load(KIT_URL,resolve,undefined,reject));
 }
 async function ensure(THREE,scene,fetchImpl){
  if(runtime)return runtime;if(loading)return loading;
  loading=Promise.all([loadRooms(fetchImpl),loadKit().then(kit=>({kit,error:""})).catch(error=>({kit:null,error:String(error?.message||error) }))]).then(([rooms,asset])=>runtime=buildRuntime(THREE,scene,rooms,asset.kit,asset.error)).finally(()=>loading=null);return loading;
 }
 function disposeRuntimeResources(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root?.traverse(object=>{
   if(object.geometry)geometries.add(object.geometry);
   const list=Array.isArray(object.material)?object.material:[object.material];
   list.filter(Boolean).forEach(material=>{materials.add(material);Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value)})});
  });
  textures.forEach(texture=>texture.dispose?.());materials.forEach(material=>material.dispose?.());geometries.forEach(geometry=>geometry.dispose?.());
  return {geometries:geometries.size,materials:materials.size,textures:textures.size};
 }
 function destroy(){if(!runtime)return;const root=runtime.group;disposeRuntimeResources(root);root.parent?.remove(root);runtime=null}
 return {KIT_URL,ROOM_FILES,ASSET_REGISTRY,WALKABLE,PLAYER_RADIUS,parseLevel,cellCenter,roomAt,symbolAtWorld,canWalk,doorwayCells,validateConnection,sourceScene,assetTransform,buildRuntime,loadRooms,loadKit,disposeRuntimeResources,ensure,destroy,get current(){return runtime}};
});
