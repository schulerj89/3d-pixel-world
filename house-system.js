// House shell, destination switching, building controls, and TV interaction.
// house-main-level.txt is the authoritative room/wall source; these values are a
// conservative startup envelope used only while that file is loading.
const HOUSE_CONFIG={
 width:24,
 depth:20,
 origin:{x:-12,z:-12.5},
 wallHeight:5,
 wallThickness:.24,
 playerInset:.45,
 furnitureInset:.65,
 furnitureStep:.5,
 spawn:{x:0,z:5.5},
 camera:{angle:2.8,height:11,distance:16}
};
const HOUSE_BOUNDS={
 minX:HOUSE_CONFIG.origin.x+HOUSE_CONFIG.furnitureInset,
 maxX:HOUSE_CONFIG.origin.x+HOUSE_CONFIG.width-HOUSE_CONFIG.furnitureInset,
 minZ:HOUSE_CONFIG.origin.z+HOUSE_CONFIG.furnitureInset,
 maxZ:HOUSE_CONFIG.origin.z+HOUSE_CONFIG.depth-HOUSE_CONFIG.furnitureInset,
 step:HOUSE_CONFIG.furnitureStep
};
const HOUSE_DEBUG_VIEWS=Object.freeze({
 overview:{name:"house-overview",target:{x:0,z:-2.5},camera:{angle:2.8,height:15,distance:20},hidePlayer:true},
 kitchen:{name:"house-kitchen-2u-aisle",target:{x:-6,z:-7.2},camera:{angle:0,height:9.5,distance:10},hidePlayer:true},
 bedroom:{name:"house-bedroom",target:{x:6,z:-7},camera:{angle:0,height:9.5,distance:10},hidePlayer:true},
 living:{name:"house-living-1u-passage",target:{x:-5,z:2},camera:{angle:0,height:12,distance:8},hidePlayer:true},
 enclosure:{name:"house-enclosed-corners",target:{x:0,z:-2.5},camera:{angle:.72,height:14,distance:21},hidePlayer:true},
 exterior:{name:"house-exterior-cladding",area:"exterior",target:{x:0,z:9.5},camera:{angle:0,height:8,distance:15},hidePlayer:true}
});
let houseArea="interior",houseCity=null,activeHouseLayout=null,houseLayoutStatus="loading",houseLayoutError=null;
function canWalkInHouse(x,z){
 if(houseArea==="exterior")return houseCity?.canWalk?houseCity.canWalk(x,z):x>=-18&&x<=18&&z>=7.9&&z<=35;
 if(activeHouseLayout)return activeHouseLayout.canWalk(x,z,HOUSE_CONFIG.playerInset);
 return x>=HOUSE_CONFIG.origin.x+HOUSE_CONFIG.playerInset &&
  x<=HOUSE_CONFIG.origin.x+HOUSE_CONFIG.width-HOUSE_CONFIG.playerInset &&
  z>=HOUSE_CONFIG.origin.z+HOUSE_CONFIG.playerInset &&
  z<=HOUSE_CONFIG.origin.z+HOUSE_CONFIG.depth-HOUSE_CONFIG.playerInset;
}
function hbox(w,h,d,c,x,y,z,parent=house){let material=Array.isArray(c)||c?.isMaterial?c:new THREE.MeshStandardMaterial({color:c});let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
const houseLayoutShell=new THREE.Group();houseLayoutShell.name="house-layout-shell";house.add(houseLayoutShell);
function applyHouseLayout(layout){
 activeHouseLayout=layout;houseLayoutStatus="ready";houseLayoutError=null;
 Object.assign(HOUSE_CONFIG,{width:layout.width,depth:layout.depth,origin:{x:layout.bounds.minX,z:layout.bounds.minZ},wallHeight:layout.wallHeight,wallThickness:layout.wallThickness,playerInset:layout.playerRadius,furnitureInset:layout.furnitureInset,furnitureStep:layout.furnitureStep,spawn:{...layout.spawn},camera:{...layout.camera}});
 Object.assign(HOUSE_BOUNDS,{minX:layout.bounds.minX+layout.furnitureInset,maxX:layout.bounds.maxX-layout.furnitureInset,minZ:layout.bounds.minZ+layout.furnitureInset,maxZ:layout.bounds.maxZ-layout.furnitureInset,step:layout.furnitureStep});
 houseLayoutShell.clear();
 const floor=hbox(layout.width,.25,layout.depth,0xd7b08b,(layout.bounds.minX+layout.bounds.maxX)/2,.03,(layout.bounds.minZ+layout.bounds.maxZ)/2,houseLayoutShell);floor.name="house-floor";
 for(const room of layout.rooms){
  const colors={living:0xe0bd98,kitchen:0xd6c19f,bedroom:0xddb7aa,entry_hall:0xd9c4a5,flex_room:0xd1bd9c};
  const panel=hbox(room.maxX-room.minX,.03,room.maxZ-room.minZ,colors[room.id]||0xd7b08b,(room.minX+room.maxX)/2,.17,(room.minZ+room.maxZ)/2,houseLayoutShell);
  panel.name=`room-floor-${room.id}`;panel.userData.roomId=room.id;
 }
 for(const wall of layout.walls){
  const length=wall.end-wall.start;
  const renderedHeight=layout.wallHeight;
  const wallWidth=wall.type==="cell"?wall.width:length;
  const interiorMaterial=window.HouseWallMaterials?.create("interior",{width:wallWidth,height:renderedHeight,renderer:R})||0xf2e8dc;
  const outwardFaces=wall.outwardFaces||[wall.outward].filter(Boolean);
  let wallMaterial=interiorMaterial;
  if(outwardFaces.length&&interiorMaterial?.isMaterial){
   const exteriorMaterial=window.HouseWallMaterials?.create("exterior",{width:wallWidth,height:renderedHeight,renderer:R})||interiorMaterial;
   const faceIndex={east:0,west:1,south:4,north:5};
   wallMaterial=Array(6).fill(interiorMaterial);for(const face of outwardFaces)wallMaterial[faceIndex[face]]=exteriorMaterial;
  }
  const mesh=wall.type==="cell"
   ?hbox(wall.width,renderedHeight,wall.depth,wallMaterial,wall.x,renderedHeight/2,wall.z,houseLayoutShell)
   :wall.orientation==="H"
    ?hbox(length,renderedHeight,wall.thickness||layout.wallThickness,wallMaterial,(wall.start+wall.end)/2,renderedHeight/2,wall.fixed,houseLayoutShell)
    :hbox(wall.thickness||layout.wallThickness,renderedHeight,length,wallMaterial,wall.fixed,renderedHeight/2,(wall.start+wall.end)/2,houseLayoutShell);
  mesh.name=`house-wall-${wall.id}`;mesh.userData.wallId=wall.id;
 }
 document.body.dataset.houseLayoutStatus="ready";
 document.body.dataset.houseGridCell=String(layout.gridCell);
 queueMicrotask(()=>{
  // An explicit empty layout is different from a first visit. Preserve the
  // player's recovery choice instead of rebuilding fixtures over an old save.
  if(saved.houseFurnitureCleared===true)return;
  const seedStarterSet=furniture.length===0,spec=window.HouseSpaceSpec?.REFRIGERATOR;
  for(const fixture of layout.fixtures){
   const kind={refrigerator:"fridge","double-bed":"bed",sofa:"sofa","dining-table":"diningTable"}[fixture.id];
   if(!kind||furniture.some(item=>item.userData.kind===kind)||(!seedStarterSet&&kind!=="fridge"))continue;
   const x=layout.bounds.minX+(fixture.col+.5)*layout.gridCell;
   const z=kind==="fridge"&&spec?layout.bounds.minZ+layout.wallThickness/2+spec.collision[1]:layout.bounds.minZ+(fixture.row+.5)*layout.gridCell;
   addFurniture(kind,true,{x,z,rotation:0});
  }
 });
}
window.HouseLayout?.load("house-main-level.txt").then(applyHouseLayout).catch(error=>{
 houseLayoutStatus="error";houseLayoutError=error.message;document.body.dataset.houseLayoutStatus="error";
 console.error("House layout failed to load",error);
});
const houseExterior=window.createHouseExterior?.(THREE)||null;
if(houseExterior)house.add(houseExterior.group);
function registerHouseCity(city){
 if(!city||city===houseCity)return houseCity;
 if(houseCity?.group?.parent===house)house.remove(houseCity.group);
 houseCity=city;if(city.group&&!city.group.parent)house.add(city.group);
 return city;
}
if(window.createHouseCity)registerHouseCity(window.createHouseCity(THREE));
window.houseWorldApi={
 registerCity:registerHouseCity,
 get area(){return houseArea},
 isOutside:()=>houseArea==="exterior",
 update:dt=>{if(currentPlace==="house"&&houseArea==="exterior")houseCity?.update?.(dt,P,C)},
 enterInterior:()=>setHouseArea("interior"),
 goOutside:()=>setHouseArea("exterior")
};
function setHouseArea(area){
 houseArea=area==="exterior"?"exterior":"interior";
 houseCity?.setActive?.(houseArea==="exterior");
 if(buildingMode&&houseArea!=="interior")setBuildingMode(false);
 const spawn=houseArea==="exterior"?(houseCity?.exteriorSpawn||houseExterior?.exteriorSpawn||{x:0,z:9.5}):(activeHouseLayout?.spawn||houseExterior?.interiorSpawn||HOUSE_CONFIG.spawn);
 P.position.set(spawn.x,0,spawn.z);P.rotation.y=houseArea==="exterior"?0:Math.PI;
 cameraHeight=houseArea==="exterior"?10:HOUSE_CONFIG.camera.height;
 cameraDistance=houseArea==="exterior"?14:HOUSE_CONFIG.camera.distance;
 setHousePanel(false);
}
function addFurniture(kind,loading=false,savedItem=null){
 if(kind==="remote")return null;
 let g=new THREE.Group(),n=furniture.length,x=-5+(n%6)*2,z=-4+Math.floor(n/6)*2;
 const fallbackRoot=new THREE.Group();
 fallbackRoot.name=`${kind}-primitive-fallback`;
 g.add(fallbackRoot);g.userData.fallbackRoot=fallbackRoot;
 function q(w,h,d,c,px,py,pz){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(px,py,pz);m.castShadow=true;fallbackRoot.add(m);return m}
 if(kind==="sofa"){
   // A roomy three-seat voxel sofa. The group stays at floor level so old
   // saved positions/rotations continue to load without migration.
   q(3.1,.28,1.22,0xb95783,0,.35,0);
   q(2.55,.35,.92,0xef9fbd,0,.67,.08);
   for(const px of[-.86,0,.86])q(.78,.18,.84,0xf7b0ca,px,.88,.13);
   q(2.75,.78,.28,0xd96f9a,0,1.28,-.47);
   for(const px of[-.86,0,.86])q(.8,.64,.18,0xe889ad,px,1.3,-.3);
   q(.34,.82,1.28,0xd96f9a,-1.48,.73,0);
   q(.34,.82,1.28,0xd96f9a,1.48,.73,0);
   g.userData.seatAnchor={x:0,y:-.3,z:.13};
   g.userData.seatHeight=.88;
   g.userData.exitAnchor={x:0,y:0,z:1.7};
   g.userData.actionAnchor={x:0,y:2.05,z:0};
 }
 if(kind==="table"){q(1.7,.18,1.1,0x9b6645,0,1,0);for(let a of[-.65,.65])for(let b of[-.35,.35])q(.14,1,.14,0x74472f,a,.5,b)}
 if(kind==="bed"){q(2.2,.45,1.3,0xffffff,0,.45,0);q(2.2,.25,1.3,0x8fc5ff,0,.72,0);q(.7,.18,1,0xffffff,-.6,.92,0)}
 if(kind==="lamp"){q(.55,.12,.55,0x555555,0,.08,0);q(.12,1.5,.12,0x777777,0,.8,0);q(.8,.65,.8,0xffe978,0,1.65,0)}
 if(kind==="chair"){
   q(.8,.18,.8,0x8f613f,0,.8,0);q(.8,1,.18,0x8f613f,0,1.3,-.3);q(.12,.8,.12,0x68442d,-.3,.4,0);q(.12,.8,.12,0x68442d,.3,.4,0);
   g.userData.seatAnchor={x:0,y:-.3,z:.03};
   g.userData.seatHeight=.8;
   g.userData.exitAnchor={x:0,y:0,z:1.05};
   g.userData.actionAnchor={x:0,y:2.05,z:0};
 }
 if(kind==="fridge"){q(2.8,3.5,3.136,0xdcecf2,0,1.75,0);q(.1,1.15,.1,0x667781,1.02,2.05,1.59)}
 if(kind==="tv"){q(2.5,1.5,.22,0x20232b,0,1.65,0);g.userData.tvScreen=q(2.15,1.15,.05,0x151923,0,1.65,.14);q(.2,.8,.2,0x555555,0,.65,0);q(1.3,.15,.55,0x555555,0,.2,0)}
 if(kind==="bookshelf"){
   q(1.5,2.2,.45,0x8a5a3b,0,1.1,0);
   q(1.3,.12,.5,0x6f452d,0,.42,.02);
   q(1.3,.12,.5,0x6f452d,0,1.05,.02);
   q(1.3,.12,.5,0x6f452d,0,1.68,.02);
   for(let i=0;i<5;i++)q(.15,.45,.32,[0xff7f9f,0x6fb7ff,0xffd65c,0x72d48f,0xb98cff][i],-.48+i*.24,.7,.12);
   for(let i=0;i<4;i++)q(.18,.4,.32,[0xffb35c,0x8fd5ff,0xff8fb1,0x9be39c][i],-.38+i*.28,1.33,.12);
 }
 if(kind==="rug"){
   q(2.6,.10,1.7,0xd9a6ff,0,.20,0);
   q(2.15,.04,1.25,0xffe6f4,0,.27,0);
 }
 if(kind==="dresser"){
   q(1.7,1.55,.65,0xb9845f,0,.78,0);
   for(let i=0;i<3;i++){q(1.45,.35,.08,0xd9a784,0,.42+i*.42,.37);q(.09,.09,.08,0x555555,0,.42+i*.42,.43)}
 }
 if(kind==="plant"){
   q(.75,.55,.75,0xc57d55,0,.3,0);
   q(.18,1.05,.18,0x4e8b45,0,1.05,0);
   q(.7,.18,.35,0x62b956,-.25,1.3,0);
   q(.7,.18,.35,0x62b956,.25,1.58,0);
   q(.45,.18,.55,0x72c869,0,1.82,0);
 }
 if(kind==="desk"){
   q(2.2,.18,1.0,0x9c6b48,0,1,0);
   q(.16,1,.16,0x70472f,-.85,.5,-.3);
   q(.16,1,.16,0x70472f,.85,.5,-.3);
   q(.16,1,.16,0x70472f,-.85,.5,.3);
   q(.16,1,.16,0x70472f,.85,.5,.3);
   q(1.0,.65,.08,0x252833,0,1.48,-.18);
   q(.18,.35,.18,0x555555,0,1.18,-.18);
 }
 if(kind==="vanity"){
   q(1.8,.18,.75,0xf1b8cf,0,.9,0);
   q(.16,.9,.16,0xd989aa,-.7,.45,0);
   q(.16,.9,.16,0xd989aa,.7,.45,0);
   q(1.15,1.35,.12,0xd7efff,0,1.75,-.18);
   q(1.35,1.55,.12,0xe6a6c3,0,1.75,-.23);
   q(.18,.18,.18,0xffe16b,-.45,1.1,.15);
   q(.18,.18,.18,0xff8fb1,.45,1.1,.15);
 }
 if(kind==="armchair"){
   q(1.7,.3,1.2,0xd66f9d,0,.5,0);q(1.45,.7,.28,0xec91b6,0,1.15,-.45);
   q(.25,.8,1.2,0xc95c8f,-.72,.75,0);q(.25,.8,1.2,0xc95c8f,.72,.75,0);
   g.userData.seatAnchor={x:0,y:-.3,z:.1};g.userData.seatHeight=.8;
   g.userData.exitAnchor={x:0,y:0,z:1.35};g.userData.actionAnchor={x:0,y:2,z:0};
 }
 if(kind==="stool"){
   q(.75,.2,.75,0xd68a58,0,.55,0);q(.14,.55,.14,0x70472f,-.25,.28,-.25);q(.14,.55,.14,0x70472f,.25,.28,.25);
   g.userData.seatAnchor={x:0,y:-.45,z:0};g.userData.seatHeight=.5;
   g.userData.exitAnchor={x:0,y:0,z:1};g.userData.actionAnchor={x:0,y:1.55,z:0};
 }
 if(kind==="diningTable"){q(3,.18,2,0x9b6645,0,1,0);for(const px of[-1.2,1.2])for(const pz of[-.7,.7])q(.15,1,.15,0x70472f,px,.5,pz)}
 if(kind==="sideTable"){q(1,.16,1,0xb9845f,0,1,0);q(.18,1,.18,0x70472f,0,.5,0)}
 if(kind==="tableLamp"){q(.6,.1,.6,0x666666,0,.08,0);q(.1,.7,.1,0x888888,0,.45,0);q(.75,.55,.75,0xffe978,0,.95,0)}
 if(kind==="smallCactus"){q(.48,.38,.48,0xc57d55,0,.2,0);q(.2,.55,.2,0x62b956,0,.62,0)}


 g.position.set(savedItem?.x ?? x,0,savedItem?.z ?? z);
g.rotation.y=savedItem?.rotation ?? 0;
 g.userData.kind=kind;g.userData.label={diningTable:"Dining Table",sideTable:"Side Table",tableLamp:"Table Lamp",smallCactus:"Small Cactus"}[kind]||kind.replace(/^./,c=>c.toUpperCase());
 house.add(g);furniture.push(g);constrainFurniture(g);
 const assetPromise=window.FurnitureAssets?.attach(g,kind);
 if(assetPromise)assetPromise.then(()=>{
   if(!g.parent)return;
   constrainFurniture(g);
   updateFurnitureLabel();
 });
// Saved furniture is constructed before the interaction declarations below are
// initialized. A microtask registers it after this script has finished loading.
queueMicrotask(()=>registerFurnitureAction(g));
if(!loading){saved.houseFurnitureCleared=false;saveWorld()}
return g;
}
saved.furniture=(saved.furniture||[]).filter(item=>(typeof item==="string"?item:item?.kind)!=="remote");
localStorage.setItem("my3DWorld",JSON.stringify(saved));
saved.furniture.forEach(item=>{
 if(typeof item==="string")addFurniture(item,true);
 else addFurniture(item.kind,true,item);
});
queueMicrotask(()=>updateFurnitureLabel());
function setBakeryVisible(show){
 bakeryObjects.forEach(obj=>obj.visible=show);
 P.visible=true;
}
function showBakery(){P.visible=true;
 window.releaseLargeWorlds("bakery");
 currentPlace="bakery";
 document.body.classList.add("bakery-mode");document.body.classList.remove("house-mode","beach-mode","space-mode","city-mode","castle-mode");
 S.background.set(0xffd7e6);
 startPage.style.display="none";
 setBakeryVisible(true);
 page5Group.visible=true;
 house.visible=false;
 beach.visible=false;
 hideSpaceWorld();
 if(castle)castle.visible=false;
 setHousePanel(false);setBuildingMode(false);
 P.position.set(-1,0,2);
 C.position.set(10,11,15);
 C.lookAt(0,1,0);
 document.getElementById("roomTeleport").style.display="flex";
 syncBakeryRoomState(true);
 if(window.switchWorldMusic)window.switchWorldMusic("bakery");
}
async function showRestaurant(){
 const world=await window.RestaurantWorld.ensure(THREE,S);
 currentPlace="restaurant";P.visible=true;
 document.body.classList.add("restaurant-mode");
 document.body.classList.remove("bakery-mode","house-mode","beach-mode","space-mode","city-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(window.RestaurantWorld.BACKGROUND_COLOR);startPage.style.display="none";
 setBakeryVisible(false);page5Group.visible=false;house.visible=false;beach.visible=false;hideSpaceWorld();
 if(castle)castle.visible=false;
 world.group.visible=true;inKitchen=false;inStorage=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";
 document.getElementById("inventoryBox").style.display="none";document.getElementById("roomTeleport").style.display="none";
 document.getElementById("msg").textContent="";
 const debugParams=new URLSearchParams(location.search),debugView=world.debugViews?.[debugParams.get("restaurantView")],debugRoom=debugParams.get("restaurantRoom");
 const spawn=debugView?.position||world.spawns?.[debugRoom||debugView?.room]||world.spawn,camera=debugView?.camera||world.camera;
 document.body.dataset.restaurantAssetStatus=world.group.userData.assets.status;
 P.position.set(spawn.x,world.floorSurfaceY||0,spawn.z);P.rotation.y=Math.PI;
 P.visible=debugView?.hidePlayer!==true;
 cameraAngle=camera.angle;cameraHeight=camera.height;cameraDistance=camera.distance;updateCamera();
 window.switchWorldMusic?.("restaurant");
}
function showHouse(){P.visible=true;
 window.releaseLargeWorlds("house");
 currentPlace="house";
 document.body.classList.add("house-mode");document.body.classList.remove("restaurant-mode","bakery-mode","beach-mode","space-mode","city-mode","castle-mode");
 S.background.set(0xffd7e6);
 document.body.classList.remove("kitchen-clean","storage-mode");
 startPage.style.display="none";
 setBakeryVisible(false);
 house.visible=true;
 beach.visible=false;
 hideSpaceWorld();
 if(castle)castle.visible=false;
 setHousePanel(false);
 setHudMenu(false);closeKitchenPanels();
 document.getElementById("roomTeleport").style.display="none";
 setBuildingMode(false);
 const debugView=HOUSE_DEBUG_VIEWS[new URLSearchParams(location.search).get("houseView")];
 setHouseArea(debugView?.area||"interior");
 if(debugView?.target)P.position.set(debugView.target.x,0,debugView.target.z);
 P.visible=debugView?.hidePlayer!==true;
 cameraAngle=debugView?.camera.angle??HOUSE_CONFIG.camera.angle;
 cameraHeight=debugView?.camera.height??HOUSE_CONFIG.camera.height;
 cameraDistance=debugView?.camera.distance??HOUSE_CONFIG.camera.distance;
 C.position.set(
  P.position.x+Math.sin(cameraAngle)*cameraDistance,
  cameraHeight,
  P.position.z+Math.cos(cameraAngle)*cameraDistance
 );
 C.lookAt(P.position.x,1,P.position.z);
 if(window.switchWorldMusic)window.switchWorldMusic("house");
}
async function showBeach(){
 window.releaseLargeWorlds("beach");
 const world=ensureBeachWorld();await world.ready;ensureBeachInteractionRuntime(world);
 currentPlace="beach";P.visible=true;
 document.body.classList.add("beach-mode");document.body.classList.remove("restaurant-mode","bakery-mode","house-mode","space-mode","city-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(0x9edfff);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=true;world.group.visible=true;
 hideSpaceWorld();
 if(castle)castle.visible=false;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";
 document.getElementById("recipePanel").style.display="none";
 document.getElementById("roomTeleport").style.display="none";
 roomName.style.display="block";roomName.textContent="Sunny Beach";
 const poseId=new URLSearchParams(location.search).get("beachPose")||"spawn",pose=world.debugPoses?.[poseId]||{...world.spawn,...world.camera};
 P.position.set(pose.x,0,pose.z);P.rotation.y=Math.PI;P.visible=pose.hidePlayer!==true;
 cameraAngle=pose.angle;cameraHeight=pose.height;cameraDistance=pose.distance;
 updateCamera();
 document.body.dataset.beachPose=poseId;document.body.dataset.beachAssetStatus=world.group.userData.assets.status;
 if(window.switchWorldMusic)window.switchWorldMusic("beach");
}
async function showSpace(){
  destroyCityWorld();
 if(castle)castle.visible=false;
 const world=ensureSpaceWorld();await world.ready;ensureSpaceInteractionRuntime(world);currentPlace="space";P.visible=true;
 document.body.classList.add("space-mode");document.body.classList.remove("restaurant-mode","bakery-mode","house-mode","beach-mode","city-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(world.background);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=false;world.group.visible=true;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";document.getElementById("roomTeleport").style.display="none";
 const poseId=new URLSearchParams(location.search).get("spacePose")||"spawn",pose=world.debugPoses?.[poseId]||{...world.spawn,...world.camera};
 roomName.style.display="block";roomName.textContent=world.name;
 P.position.set(pose.x,world.surfaceYAt?.(pose.x,pose.z)??0,pose.z);P.rotation.y=Math.PI;P.visible=pose.hidePlayer!==true;
 cameraAngle=pose.angle;cameraHeight=pose.height;cameraDistance=pose.distance;updateCamera();
 document.body.dataset.spacePose=poseId;document.body.dataset.spaceAssetStatus=world.group.userData.assets.status;document.body.dataset.spaceAliens=String(world.group.userData.npcs.aliens);document.body.dataset.spaceOtherNpcs=String(world.group.userData.npcs.nonAliens);
 document.body.dataset.spaceAlienGrounded=String(world.group.userData.npcs.grounded);document.body.dataset.spaceAlienAnimations=world.group.userData.npcs.idleAnimations.join(",");document.body.dataset.spaceAlienModels=world.group.userData.npcs.alienModels.join(",");
 if(window.switchWorldMusic)window.switchWorldMusic("space");
}
async function showCity(){
 hideSpaceWorld();
 if(castle)castle.visible=false;
 const world=ensureCityWorld();await world.ready;currentPlace="city";P.visible=true;
 document.body.classList.add("city-mode");document.body.classList.remove("restaurant-mode","bakery-mode","house-mode","beach-mode","space-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(world.background);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=false;world.group.visible=true;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";
 document.getElementById("roomTeleport").style.display="none";roomName.style.display="block";roomName.textContent=world.name;
 const poseId=new URLSearchParams(location.search).get("cityPose")||"spawn",pose=world.debugPoses?.[poseId]||{...world.spawn,...world.camera};
 world.prepareDebugPose?.(poseId);
 P.position.set(pose.x,0,pose.z);P.rotation.y=Math.PI;P.visible=pose.hidePlayer!==true;
 cameraAngle=pose.angle;cameraHeight=pose.height;cameraDistance=pose.distance;updateCamera();
 document.body.dataset.cityPose=poseId;document.body.dataset.cityAssetStatus=world.group.userData.assets.status;
 if(window.switchWorldMusic)window.switchWorldMusic("city");
}
function showCastle(){
 destroyCityWorld();hideSpaceWorld();
 const world=createCastleWorld();currentPlace="castle";P.visible=true;
 document.body.classList.add("castle-mode");document.body.classList.remove("restaurant-mode","bakery-mode","house-mode","beach-mode","space-mode","city-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(0xa9cef0);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=false;world.visible=true;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";document.getElementById("roomTeleport").style.display="none";
 roomName.style.display="block";roomName.textContent="Royal Castle";
 P.position.set(CASTLE_CONFIG.spawn.x,0,CASTLE_CONFIG.spawn.z);P.rotation.y=Math.PI;
 cameraAngle=CASTLE_CONFIG.camera.angle;cameraHeight=CASTLE_CONFIG.camera.height;cameraDistance=CASTLE_CONFIG.camera.distance;updateCamera();
 if(window.switchWorldMusic)window.switchWorldMusic("castle");
}
goBakery.onclick=()=>window.runWorldTransition("Setting the tables…","restaurant",showRestaurant);goHouse.onclick=showHouse;document.getElementById("goBeach").onclick=()=>window.runWorldTransition("Opening Sunny Beach…","beach",showBeach);
document.getElementById("goSpace").onclick=()=>window.runWorldTransition("Launching Space…","space",showSpace);
document.getElementById("goCity").onclick=()=>window.runWorldTransition("Opening Chibi City…","city",showCity);
document.getElementById("goCastle").onclick=()=>window.runWorldTransition("Raising the castle gates…","castle",showCastle);


let sitting=false,seatedFurniture=null,tvIsOn=false,currentChannel="news";
const houseActionBtn=document.getElementById("houseAction");
const tvControlsPanelEl=document.getElementById("tvControlsPanel");
const tvScreenEl=document.getElementById("tvScreen");
const tvTitleEl=document.getElementById("tvTitle");
const tvShowEl=document.getElementById("tvShow");
const shows={
 news:["📰 Tiny Town News","Breaking news: a giant cupcake was baked today! A little duck found its way home."],
 chef:["👨‍🍳 Chef Gary's Kitchen","Chef Gary is making rainbow pasta and teaching fun kitchen tips."],
 island:["🏝️ Island Hearts","Friends on a sunny island complete kindness challenges and work as teams."],
 monsters:["⚡ Pocket Pals Adventures","Sparkbit and Leafloo explore Crystal Forest and help a shy cloud creature."]
};
function hasFurniture(kind){return furniture.some(f=>f.userData.kind===kind)}
function nearFurniture(kind,range=1.8){return furniture.find(f=>f.userData.kind===kind&&Math.hypot(f.position.x-P.position.x,f.position.z-P.position.z)<range)}
function nearbySeat(range=2.25){
 return furniture.find(f=>["chair","sofa","armchair","stool"].includes(f.userData.kind)&&f.visible!==false&&Math.hypot(f.position.x-P.position.x,f.position.z-P.position.z)<range);
}
function leaveSeat(){
 if(!sitting)return;
 const seat=seatedFurniture;
 sitting=false;seatedFurniture=null;P.userData.seated=false;delete P.userData.seatedY;
 if(seat){
  const anchor=seat.userData.exitAnchor||{x:0,y:0,z:seat.userData.kind==="sofa"?1.7:1.05};
  const exitOffset=new THREE.Vector3(anchor.x,anchor.y,anchor.z).applyQuaternion(seat.quaternion);
  P.position.set(seat.position.x+exitOffset.x,0,seat.position.z+exitOffset.z);
 }else P.position.y=0;
}
function takeSeat(seat){
 if(!seat)return;
 const anchor=seat.userData.seatAnchor||{x:0,y:-.3,z:seat.userData.kind==="sofa"?.13:.03};
 const seatOffset=new THREE.Vector3(anchor.x,0,anchor.z).applyQuaternion(seat.quaternion);
 sitting=true;seatedFurniture=seat;P.userData.seated=true;
 P.position.set(seat.position.x+seatOffset.x,seat.position.y+anchor.y,seat.position.z+seatOffset.z);
 P.userData.seatedY=P.position.y;
 P.rotation.y=seat.rotation.y;
}
window.isPlayerSeated=()=>sitting;
window.leavePlayerSeat=leaveSeat;
function unregisterFurnitureAction(item){
 const registration=item?.userData?.objectActionRegistration;
 if(!registration)return;
 if(typeof registration==="function")registration();
 else if(typeof registration.unregister==="function")registration.unregister();
 else if(typeof registration.dispose==="function")registration.dispose();
 else if(window.objectActions?.unregister)window.objectActions.unregister(registration);
 delete item.userData.objectActionRegistration;
}
function registerFurnitureAction(item){
 if(!item||item.userData.objectActionRegistration||!window.objectActions?.register)return;
 const kind=item.userData.kind;
 if(!["sofa","chair","armchair","stool","tv"].includes(kind))return;
 const isSeat=["sofa","chair","armchair","stool"].includes(kind);
 const config={
  icon:()=>isSeat?(sitting?"🚶":"🛋️"):"📺",
  label:()=>isSeat?(sitting?"Stand up":"Sit down"):"TV controls",
  range:isSeat?2.25:2.4,
  anchorOffset:0,
  world:"house",
  getAnchor:(target,out)=>{
   const point=target.userData.actionAnchor||{x:0,y:isSeat?(kind==="sofa"?2.05:1.9):2.75,z:0};
   out.set(point.x,point.y,point.z);return target.localToWorld(out);
  },
  enabled:()=>currentPlace==="house"&&houseArea==="interior"&&!buildingMode&&
   (isSeat?(!sitting||seatedFurniture===item):tvControlsPanelEl.style.display!=="block"),
  onAction:()=>{
   if(isSeat){if(sitting)leaveSeat();else takeSeat(item);return}
   tvControlsPanelEl.style.display="block";
  }
 };
 item.userData.objectActionRegistration=window.objectActions.register(item,config)||config;
}
function registerPendingFurnitureActions(){furniture.forEach(registerFurnitureAction)}
window.registerHouseFurnitureActions=registerPendingFurnitureActions;
let doorActionRegistration=null;
function registerHouseDoorAction(){
 if(doorActionRegistration||!houseExterior?.door||!window.objectActions?.register)return;
 doorActionRegistration=window.objectActions.register(houseExterior.door,{
  icon:"🚪",label:()=>houseArea==="exterior"?"Enter house":"Go outside",range:3.1,priority:20,anchorOffset:0,world:"house",
  getAnchor:(target,out)=>{const point=target.userData.actionAnchor;out.set(point.x,point.y,point.z);return target.localToWorld(out)},
  enabled:()=>currentPlace==="house"&&!buildingMode,
  onAction:()=>setHouseArea(houseArea==="exterior"?"interior":"exterior")
 });
}
queueMicrotask(registerHouseDoorAction);
function refreshHouseButtons(){
 const inHouse=currentPlace==="house"&&houseArea==="interior";
 if(!inHouse||buildingMode){if(sitting)leaveSeat();houseActionBtn.style.display="none";tvControlsPanelEl.style.display="none";return}
 registerPendingFurnitureActions();
 registerHouseDoorAction();
 const fridge=nearFurniture("fridge");
 if(fridge){houseActionBtn.classList.remove("seat-action");houseActionBtn.style.display="block";houseActionBtn.textContent="🧊 OPEN FRIDGE";houseActionBtn.dataset.action="fridge"}
 else{houseActionBtn.classList.remove("seat-action");houseActionBtn.style.display="none"}
}
houseActionBtn.onclick=()=>{
 if(houseActionBtn.dataset.action==="fridge")document.getElementById("msg").textContent="Inside: milk, fruit, cake, and juice! 🥛🍓🍰";
};
let tvAnimationTimer=null,tvFrame=0;
const channelScenes={
 news:[
  ["🧑‍💼","👩‍💼","🎤","Welcome to Tiny Town News!"],
  ["👩‍💼","🧑‍🍳","🧁","A giant cupcake was baked today!"],
  ["🧑‍💼","🦆","🏡","A little duck found its way home!"]
 ],
 chef:[
  ["🧑‍🍳","👩‍🍳","🍝","Today we are making rainbow pasta!"],
  ["👩‍🍳","🧑‍🍳","🥕","Add colorful vegetables!"],
  ["🧑‍🍳","👩‍🍳","⭐","It tastes wonderful!"]
 ],
 island:[
  ["👧","🧑","🏝️","Welcome to Island Hearts!"],
  ["🧑","👧","🏆","Today's challenge is teamwork!"],
  ["👧","🧑","💖","Everyone helped each other!"]
 ],
 monsters:[
  ["🟡","🟢","🌲","Sparkbit and Leafloo enter the forest!"],
  ["🟢","☁️","💎","They meet a shy cloud creature."],
  ["🟡","🟢","✨","The Pocket Pals save the day!"]
 ]
};
function drawTVFrame(){
 const scene=channelScenes[currentChannel][tvFrame%channelScenes[currentChannel].length];
 document.getElementById("actor1").textContent=scene[0];
 document.getElementById("actor2").textContent=scene[1];
 document.getElementById("tvProp").textContent=scene[2];
 document.getElementById("speech").textContent=scene[3];
 document.getElementById("actor1").style.transform=tvFrame%2?"translateY(-8px)":"translateY(0)";
 document.getElementById("actor2").style.transform=tvFrame%2?"translateX(-8px)":"translateX(0)";
 tvFrame++;
}
function showTVChannel(name){
 currentChannel=name;tvTitleEl.textContent=shows[name][0];tvShowEl.textContent=shows[name][1];
 tvFrame=0;drawTVFrame();clearInterval(tvAnimationTimer);tvAnimationTimer=setInterval(()=>{if(tvIsOn)drawTVFrame()},1800);
}
document.getElementById("tvPower").onclick=()=>{
 if(!hasFurniture("tv")){document.getElementById("msg").textContent="Add a TV in Build Mode first! 📺";return}
 tvIsOn=!tvIsOn;tvScreenEl.style.display=tvIsOn?"block":"none";if(tvIsOn)showTVChannel(currentChannel)
};
document.querySelectorAll("#tvControlsPanel [data-channel]").forEach(b=>b.onclick=()=>{
 if(!tvIsOn){document.getElementById("msg").textContent="Press Power first! 📺";return}
 showTVChannel(b.dataset.channel)
});
document.getElementById("closeTVControls").onclick=()=>tvControlsPanelEl.style.display="none";
setInterval(refreshHouseButtons,150);
let buildingMode=false;
window.objectActions=window.createObjectActionSystem({
 THREE,camera:C,renderer:R,
 getPlayerPosition:()=>P.position,
 getWorld:()=>currentPlace,
 isBuildMode:()=>buildingMode
});
const SPACE_COIN_POSITIONS=Object.freeze([
 Object.freeze({x:-10,y:0,z:-2}),Object.freeze({x:-6,y:0,z:2}),Object.freeze({x:-2,y:0,z:6}),
 Object.freeze({x:2,y:0,z:2}),Object.freeze({x:6,y:0,z:-2}),Object.freeze({x:2,y:0,z:-8})
]);
const BEACH_TOKEN_POSITIONS=Object.freeze([
 Object.freeze({x:-13,y:0,z:1}),Object.freeze({x:-16,y:0,z:11}),Object.freeze({x:-9,y:0,z:16}),
 Object.freeze({x:1,y:0,z:4}),Object.freeze({x:7,y:0,z:1}),Object.freeze({x:7,y:0,z:13})
]);
const SPACE_COIN_PROGRESS_KEY="spaceCoinSprint";
function getSpaceCoinProgress(){return saved.questProgress?.[SPACE_COIN_PROGRESS_KEY]||null}
function saveSpaceCoinCompletion(reward){
 saved.questProgress=Object.assign({},saved.questProgress,{[SPACE_COIN_PROGRESS_KEY]:{completed:true,completedAt:Date.now(),reward}});
 localStorage.setItem("my3DWorld",JSON.stringify(saved));
 return saved.questProgress[SPACE_COIN_PROGRESS_KEY];
}
let spaceInteractionRuntime=null;
function createSpaceConversationCamera(){
 const tween=window.createThreeConversationCameraAdapter({THREE,camera:C,duration:650});
 return {
  capture(){
   const saved=tween.capture();saved.orbit={followCamera,cameraAngle,cameraHeight,cameraDistance};saved.playerVisible=P.visible;followCamera=false;P.visible=false;return saved;
  },
  focus:(target,config)=>tween.focus(target,config),
  restore(saved,detail){
   const instant=detail?.reason==="world-exit",destination=Object.assign({},saved,{duration:instant?0:650});
   return Promise.resolve(tween.restore(destination)).finally(()=>{
    if(saved?.orbit){cameraAngle=saved.orbit.cameraAngle;cameraHeight=saved.orbit.cameraHeight;cameraDistance=saved.orbit.cameraDistance;followCamera=saved.orbit.followCamera}
    if(saved&&typeof saved.playerVisible==="boolean")P.visible=saved.playerVisible;
   });
  }
 };
}
function questConversationDefinition(quest){
 const state=()=>quest.controller.snapshot();
 return {
  id:"space-guide-nova",speaker:"Nova",prompt:"Talk to Nova",range:4.5,priority:30,
  enabled:()=>currentPlace==="space",camera:{distance:3.7,height:2.1,targetHeight:.55,duration:650},start:"briefing",
  nodes:{briefing:{
   text:()=>{
    const mission=state();
    if(mission.phase==="active")return `You have ${mission.collectedCount} of ${mission.count} star coins. ${Math.ceil(mission.remainingMs/1000)} seconds remain.`;
    if(mission.phase==="failed")return "The beacon window closed. I can reset the star coins if you want another run.";
    if(mission.phase==="success")return "Perfect route! The six beacons are stable, and your $10 reward has been transferred.";
    return "Six star coins broke away from our beacon grid. Collect them before the 30-second signal window closes and I will pay you $10.";
   },
   actions:[
    {id:"accept",label:"Start the coin sprint",action:"start-coin-task",end:true,when:()=>state().phase==="idle"},
    {id:"later",label:"Maybe later",end:true,when:()=>state().phase==="idle"},
    {id:"status",label:"Back to the hunt",end:true,when:()=>state().phase==="active"},
    {id:"retry",label:"Retry the mission",action:"retry-coin-task",end:true,when:()=>state().phase==="failed"},
    {id:"leave-failed",label:"Not yet",end:true,when:()=>state().phase==="failed"},
    {id:"thanks",label:"Thanks, Nova",end:true,when:()=>state().phase==="success"}
   ]
  }}
 };
}
function ensureSpaceInteractionRuntime(world){
 if(spaceInteractionRuntime?.world===world)return spaceInteractionRuntime;
 if(spaceInteractionRuntime)destroySpaceInteractionRuntime();
 const view=window.createConversationDOMView({root:document.body}),camera=createSpaceConversationCamera(),progress=getSpaceCoinProgress();
 const quest=window.CoinQuestSystem.createCoinQuestSystem({
  THREE,scene:world.group,loader:new window.ThreeGLTFLoader.GLTFLoader(),getPlayerPosition:()=>P.position,
  onReward:value=>window.gameEconomy.add(value,"space-coin-sprint"),showRetryButton:false,
  completed:progress?.completed===true,completedAt:progress?.completedAt,
  getRenderInfo:()=>({calls:R.info.render.calls,triangles:R.info.render.triangles,geometries:R.info.memory.geometries,textures:R.info.memory.textures}),
  config:{id:"space-coin-sprint",title:"Cosmic Coin Sprint",count:6,timeLimitSeconds:30,reward:10,positions:SPACE_COIN_POSITIONS}
 });
 let pendingQuestStart=null;
 const conversation=window.createConversationSystem({
  view,camera,scratchPosition:new THREE.Vector3(),
  runAction:action=>{
   if(action.action==="start-coin-task"){pendingQuestStart="start";return {end:true}}
   if(action.action==="retry-coin-task"){pendingQuestStart="retry";return {end:true}}
   return typeof action.run==="function"?action.run():undefined;
  }
 });
 const questGiver=world.aliens[2]||world.aliens[0];
 questGiver.userData.npcName="Nova";questGiver.userData.interactionType="quest-giver";
 conversation.register(questGiver,questConversationDefinition(quest));
 const names=["Zed","Mori","Pip","Orbi","Luma"];
 world.aliens.forEach((alien,index)=>{
  if(alien===questGiver)return;const name=names[index]||`Explorer ${index+1}`;alien.userData.npcName=name;alien.userData.interactionType="npc";
  conversation.register(alien,{id:`space-alien-${index}`,speaker:name,prompt:`Talk to ${name}`,range:4,enabled:()=>currentPlace==="space",camera:{distance:3.5,height:2,targetHeight:.55,duration:650},nodes:{hello:{text:"The road lights lead back to the launch pads. Nova is tracking a beacon problem near the center crossing.",actions:[{id:"bye",label:"Safe travels",end:true}]}}});
 });
 const cargo=world.findObject("space.cargo.stack-a");
 if(cargo){
  cargo.userData.interactionType="object";
  conversation.register(cargo,{id:"space-cargo-manifest",speaker:"Cargo Stack C-14",prompt:"Inspect cargo",range:4.2,enabled:()=>currentPlace==="space",camera:{distance:4.4,height:2.4,duration:650},nodes:{
   sealed:{text:"The container is sealed. Its status light is waiting for a manifest check.",actions:[{id:"scan",label:"Run manifest scan",next:"manifest"},{id:"leave",label:"Leave it sealed",end:true}]},
   manifest:{text:"Manifest verified: solar couplers, rover cells, and six empty beacon sockets.",actions:[{id:"close",label:"Close manifest",end:true}]}
  }});
 }
 const unsubscribeConversation=conversation.subscribe(event=>{
  document.body.classList.toggle("conversation-active",event.snapshot.state!==conversation.STATES.IDLE);
  if(event.type==="end"&&event.detail?.phase==="complete"&&pendingQuestStart){const action=pendingQuestStart;pendingQuestStart=null;if(action==="retry")quest.retry(performance.now());else quest.start(performance.now())}
 });
 const unsubscribeQuest=quest.subscribe(event=>{
  const state=event.snapshot;
  if(event.type==="coin:collect"){
   window.playGameSoundEffect?.("spaceCoinSound",.68);
   document.getElementById("msg").textContent=`Star coin collected: ${event.collectedCount} / ${state.count}`;
  }
  if(event.type==="quest:success"){
   saveSpaceCoinCompletion(event.reward);
   document.getElementById("msg").textContent=`Mission complete! You earned $${event.reward}.`;
  }
  if(event.type==="quest:failed")document.getElementById("msg").textContent="Time expired. Talk to Nova to retry.";
 });
 const keyHandler=event=>conversation.handleInput(event);addEventListener("keydown",keyHandler);
 spaceInteractionRuntime={
  world,conversation,quest,
  update(dt,isActive){
   if(!isActive){conversation.updateInteraction(null);if(quest.hud)quest.hud.hidden=true;return}
   conversation.updateInteraction(P.position,{world:"space",quest:quest.controller.snapshot()});quest.update(dt,performance.now());
   const mission=quest.controller.snapshot();
   document.body.dataset.spaceConversationState=conversation.state;document.body.dataset.spaceQuestPhase=mission.phase;document.body.dataset.spaceQuestCoins=`${mission.collectedCount}/${mission.count}`;document.body.dataset.spaceQuestRemaining=String(Math.ceil(mission.remainingMs/1000));
  },
  debug(){return {conversation:conversation.snapshot(),quest:quest.debugSnapshot(),questGiver:questGiver.userData.npcName,registeredTargets:world.aliens.length+(cargo?1:0)}},
  destroy(){
   removeEventListener("keydown",keyHandler);unsubscribeConversation();unsubscribeQuest();document.body.classList.remove("conversation-active");quest.destroy();
   const finish=()=>conversation.destroy();if(conversation.state===conversation.STATES.IDLE)finish();else conversation.end("world-exit").finally(finish);
  }
 };
 window.spaceInteractionRuntime=spaceInteractionRuntime;return spaceInteractionRuntime;
}
function destroySpaceInteractionRuntime(){if(spaceInteractionRuntime){spaceInteractionRuntime.destroy();spaceInteractionRuntime=null;window.spaceInteractionRuntime=null}}
window.destroySpaceInteractionRuntime=destroySpaceInteractionRuntime;
window.updateSpaceInteractions=(dt,isActive)=>spaceInteractionRuntime?.update(dt,isActive);
let beachInteractionRuntime=null;
function beachQuestConversationDefinition(quest){
 const state=()=>quest.controller.snapshot();
 return {
  id:"beach-guide-marina",speaker:"Marina",prompt:"Talk to Marina",range:4.2,priority:30,
  enabled:()=>currentPlace==="beach",camera:{distance:4.1,height:2.6,targetHeight:1.3,duration:650},start:"challenge",
  nodes:{challenge:{
   text:()=>{
    const game=state();
    if(game.phase==="active")return `You found ${game.collectedCount} of ${game.count} boardwalk tokens. ${Math.ceil(game.remainingMs/1000)} seconds remain.`;
    if(game.phase==="failed")return "The prize timer ran out, but I can scatter the tokens for another try.";
    if(game.phase==="success")return "That was fast! The prize booth is stocked again, and your $20 reward is in your wallet.";
    return "The boardwalk prize booth lost six gold tokens across the sand. Collect all six in 35 seconds and I will pay you $20.";
   },
   actions:[
    {id:"accept",label:"Start the token dash",action:"start-beach-token-dash",end:true,when:()=>state().phase==="idle"},
    {id:"later",label:"Maybe later",end:true,when:()=>state().phase==="idle"},
    {id:"status",label:"Keep searching",end:true,when:()=>state().phase==="active"},
    {id:"retry",label:"Try the dash again",action:"retry-beach-token-dash",end:true,when:()=>state().phase==="failed"},
    {id:"leave-failed",label:"Not yet",end:true,when:()=>state().phase==="failed"},
    {id:"thanks",label:"Thanks, Marina",end:true,when:()=>state().phase==="success"}
   ]
  }}
 };
}
function ensureBeachInteractionRuntime(world){
 if(beachInteractionRuntime?.world===world)return beachInteractionRuntime;
 if(beachInteractionRuntime)destroyBeachInteractionRuntime();
 const view=window.createConversationDOMView({root:document.body}),camera=createSpaceConversationCamera();
 const quest=window.CoinQuestSystem.createCoinQuestSystem({
  THREE,scene:world.group,loader:new window.ThreeGLTFLoader.GLTFLoader(),getPlayerPosition:()=>P.position,
  onReward:value=>window.gameEconomy.add(value,"beach-token-dash"),showRetryButton:false,
  getRenderInfo:()=>({calls:R.info.render.calls,triangles:R.info.render.triangles,geometries:R.info.memory.geometries,textures:R.info.memory.textures}),
  config:{id:"beach-token-dash",title:"Boardwalk Token Dash",count:6,timeLimitSeconds:35,reward:20,positions:BEACH_TOKEN_POSITIONS}
 });
 let pendingQuestStart=null;
 const conversation=window.createConversationSystem({
  view,camera,scratchPosition:new THREE.Vector3(),
  runAction:action=>{
   if(action.action==="start-beach-token-dash"){pendingQuestStart="start";return {end:true}}
   if(action.action==="retry-beach-token-dash"){pendingQuestStart="retry";return {end:true}}
   return typeof action.run==="function"?action.run():undefined;
  }
 });
 const questGiver=world.findNpc?.("marina")||world.npcs?.[0];
 if(!questGiver)throw new Error("Beach token dash requires Marina");
 questGiver.userData.npcName="Marina";questGiver.userData.interactionType="quest-giver";
 conversation.register(questGiver,beachQuestConversationDefinition(quest));
 const tips={kai:"Marina's tokens glint beside the water and umbrellas.",sol:"The road is out of bounds for the token dash, so stay on the sand.",tala:"Make a wide loop and finish near Marina.",milo:"The gold tokens float just above the beach."};
 world.npcs?.forEach(actor=>{
  if(actor===questGiver)return;const id=actor.userData.npcId,name=actor.userData.npcName||id;
  conversation.register(actor,{id:`beach-npc-${id}`,speaker:name,prompt:`Talk to ${name}`,range:3.8,enabled:()=>currentPlace==="beach",camera:{distance:4,height:2.6,targetHeight:1.3,duration:650},nodes:{hello:{text:tips[id]||"Marina is running a boardwalk token dash today.",actions:[{id:"bye",label:"Got it",end:true}]}}});
 });
 const unsubscribeConversation=conversation.subscribe(event=>{
  document.body.classList.toggle("conversation-active",event.snapshot.state!==conversation.STATES.IDLE);
  if(event.type==="end"&&event.detail?.phase==="complete"&&pendingQuestStart){const action=pendingQuestStart;pendingQuestStart=null;if(action==="retry")quest.retry(performance.now());else quest.start(performance.now())}
 });
 const unsubscribeQuest=quest.subscribe(event=>{
  const state=event.snapshot;
  if(event.type==="coin:collect"){window.playGameSoundEffect?.("spaceCoinSound",.68);document.getElementById("msg").textContent=`Boardwalk token found: ${event.collectedCount} / ${state.count}`}
  if(event.type==="quest:success")document.getElementById("msg").textContent=`Token dash complete! You earned $${event.reward}.`;
  if(event.type==="quest:failed")document.getElementById("msg").textContent="Time expired. Talk to Marina to retry.";
 });
 const keyHandler=event=>conversation.handleInput(event);addEventListener("keydown",keyHandler);
 beachInteractionRuntime={
  world,conversation,quest,
  update(dt,isActive){
   if(!isActive){conversation.updateInteraction(null);if(quest.hud)quest.hud.hidden=true;return}
   conversation.updateInteraction(P.position,{world:"beach",quest:quest.controller.snapshot()});quest.update(dt,performance.now());
   const game=quest.controller.snapshot();document.body.dataset.beachConversationState=conversation.state;document.body.dataset.beachQuestPhase=game.phase;document.body.dataset.beachQuestTokens=`${game.collectedCount}/${game.count}`;document.body.dataset.beachQuestRemaining=String(Math.ceil(game.remainingMs/1000));
  },
  debug(){return {conversation:conversation.snapshot(),quest:quest.debugSnapshot(),questGiver:questGiver.userData.npcName,registeredTargets:world.npcs?.length||1}},
  destroy(){
   removeEventListener("keydown",keyHandler);unsubscribeConversation();unsubscribeQuest();document.body.classList.remove("conversation-active");quest.destroy();
   const finish=()=>conversation.destroy();if(conversation.state===conversation.STATES.IDLE)finish();else conversation.end("world-exit").finally(finish);
  }
 };
 window.beachInteractionRuntime=beachInteractionRuntime;return beachInteractionRuntime;
}
function destroyBeachInteractionRuntime(){if(beachInteractionRuntime){beachInteractionRuntime.destroy();beachInteractionRuntime=null;window.beachInteractionRuntime=null}}
window.destroyBeachInteractionRuntime=destroyBeachInteractionRuntime;
window.updateBeachInteractions=(dt,isActive)=>beachInteractionRuntime?.update(dt,isActive);
window.isGameplayInputLocked=()=>Boolean(
 (spaceInteractionRuntime&&spaceInteractionRuntime.conversation.state!==spaceInteractionRuntime.conversation.STATES.IDLE)||
 (beachInteractionRuntime&&beachInteractionRuntime.conversation.state!==beachInteractionRuntime.conversation.STATES.IDLE)
);
const buildingTools=document.getElementById("buildingTools");
const saveHouseButton=document.getElementById("saveHouse");
const buildHouseButton=document.getElementById("buildHouse");
const clearAllFurnitureButton=document.getElementById("clearAllFurniture");
const clearFurnitureStatus=document.getElementById("clearFurnitureStatus");
let clearFurnitureConfirmTimer=null;
const buildMessage=document.getElementById("buildMessage");
const housePanelToggle=document.getElementById("housePanelToggle");
const closeHousePanel=document.getElementById("closeHousePanel");
let selectedFurnitureIndex=-1;
// Build guides are created once and reused. Keeping them in the house group means
// their coordinates always match the furniture coordinates, without adding them
// to the normal house presentation.
const furnitureGrid=new THREE.GridHelper(
 Math.min(HOUSE_CONFIG.width,HOUSE_CONFIG.depth)-HOUSE_CONFIG.furnitureInset*2,
 Math.round((Math.min(HOUSE_CONFIG.width,HOUSE_CONFIG.depth)-HOUSE_CONFIG.furnitureInset*2)/HOUSE_BOUNDS.step),
 0x6c3cff,0xb9a7e8
);
furnitureGrid.position.y=.17;
furnitureGrid.position.z=-2.5;
furnitureGrid.material.transparent=true;
furnitureGrid.material.opacity=.58;
furnitureGrid.material.depthWrite=false;
furnitureGrid.renderOrder=5;
furnitureGrid.visible=false;
house.add(furnitureGrid);
const furnitureFootprint=new THREE.Mesh(
 new THREE.PlaneGeometry(1,1),
 new THREE.MeshBasicMaterial({color:0x8cff88,transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide})
);
furnitureFootprint.rotation.x=-Math.PI/2;
furnitureFootprint.position.y=.16;
furnitureFootprint.renderOrder=6;
furnitureFootprint.visible=false;
house.add(furnitureFootprint);
let furnitureOutline=null;

function updateFurnitureGuides(){
 const item=selectedFurniture();
 const visible=Boolean(buildingMode&&currentPlace==="house"&&item);
 furnitureGrid.visible=Boolean(buildingMode&&currentPlace==="house");
 furnitureFootprint.visible=visible;
 if(furnitureOutline)furnitureOutline.visible=visible;
 if(!visible)return;
 if(!furnitureOutline){
  furnitureOutline=new THREE.BoxHelper(item,0xffe45c);
  furnitureOutline.material.transparent=true;
  furnitureOutline.material.opacity=.95;
  furnitureOutline.material.depthTest=false;
  furnitureOutline.renderOrder=7;
  house.add(furnitureOutline);
 }else furnitureOutline.object=item;
 furnitureOutline.setFromObject(item);
 const box=new THREE.Box3().setFromObject(item);
 const size=box.getSize(new THREE.Vector3());
 const center=box.getCenter(new THREE.Vector3());
 furnitureFootprint.position.set(center.x,.16,center.z);
 furnitureFootprint.scale.set(Math.max(size.x,.5),Math.max(size.z,.5),1);
}

function setHousePanel(open){
 const show=Boolean(open&&!buildingMode&&currentPlace==="house"&&houseArea==="interior"&&startPage.style.display==="none");
 housePanel.classList.toggle("open",show);
 housePanel.setAttribute("aria-hidden",String(!show));
 housePanelToggle.setAttribute("aria-expanded",String(show));
}
window.setHousePanelOpen=setHousePanel;
function setHouseTab(name){
 document.querySelectorAll("[data-house-tab]").forEach(b=>{
  const active=b.dataset.houseTab===name;
  b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;
 });
 document.querySelectorAll("[data-house-view]").forEach(v=>{const active=v.dataset.houseView===name;v.classList.toggle("active",active);v.hidden=!active});
}
housePanelToggle.addEventListener("pointerdown",e=>{e.preventDefault();if(buildingMode){setHousePanel(false);window.setBuildCatalogCollapsed?.(false);return}const open=!housePanel.classList.contains("open");if(open)setHudMenu(false);setHousePanel(open)});
closeHousePanel.addEventListener("pointerdown",e=>{e.preventDefault();setHousePanel(false);housePanelToggle.focus()});
document.querySelectorAll("[data-house-tab]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();setHouseTab(b.dataset.houseTab)}));
document.querySelector(".houseTabs").addEventListener("keydown",e=>{
 if(!["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
 const tabs=[...document.querySelectorAll("[data-house-tab]")],current=Math.max(0,tabs.indexOf(document.activeElement));
 const index=e.key==="Home"?0:e.key==="End"?tabs.length-1:(current+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
 e.preventDefault();setHouseTab(tabs[index].dataset.houseTab);tabs[index].focus();
});
housePanel.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();setHousePanel(false);housePanelToggle.focus()}});

function setBuildingMode(on){
 if(on&&houseArea!=="interior")return;
 window.setBuildCatalogCollapsed?.(false);
 buildingMode=on;
 if(on&&furniture.length&&selectedFurnitureIndex<0)selectedFurnitureIndex=furniture.length-1;
 const movePad=document.getElementById("pad");
 const cameraPad=document.getElementById("lookPad");
 const cameraLabel=document.getElementById("lookLabel");
 if(movePad)movePad.classList.toggle("build-mode",on);
 if(cameraPad)cameraPad.classList.toggle("build-mode",on);
 if(cameraLabel)cameraLabel.classList.toggle("build-mode",on);
 buildingTools.classList.toggle("enabled",on);
 saveHouseButton.hidden=!on;
 buildHouseButton.hidden=on;
 buildMessage.textContent="";
 document.body.classList.toggle("house-building",on&&currentPlace==="house");
 housePanelToggle.disabled=Boolean(on);
 housePanelToggle.setAttribute("aria-hidden",String(Boolean(on)));
 housePanelToggle.tabIndex=on?-1:0;
 if(on){setHouseTab("build");setHousePanel(false)}
 updateFurnitureLabel();
 updateFurnitureGuides();
}

saveHouseButton.addEventListener("pointerdown",e=>{
 e.preventDefault();
 saveWorld();
 setBuildingMode(false);
 document.getElementById("msg").textContent="Your house is saved! 🏠💾";
});

buildHouseButton.addEventListener("pointerdown",e=>{
 e.preventDefault();
 setBuildingMode(true);
 document.getElementById("msg").textContent="";
});

document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{addFurniture(b.dataset.f);selectedFurnitureIndex=furniture.length-1;updateFurnitureLabel()});
function selectedFurniture(){
 return selectedFurnitureIndex>=0&&selectedFurnitureIndex<furniture.length ? furniture[selectedFurnitureIndex] : null;
}
function updateFurnitureLabel(){
 const item=selectedFurniture();
 document.getElementById("selectedFurniture").textContent=item?"Selected: "+item.userData.label+" · "+(selectedFurnitureIndex+1)+" of "+furniture.length:"No furniture selected";
 clearAllFurnitureButton.disabled=furniture.length===0;
 clearAllFurnitureButton.setAttribute("aria-disabled",String(clearAllFurnitureButton.disabled));
 furniture.forEach((f,i)=>f.traverse(child=>{if(child.isMesh){if(!child.userData.baseEmissive)child.userData.baseEmissive=child.material.emissive.getHex();child.material.emissive.setHex(i===selectedFurnitureIndex&&buildingMode?0x24104a:child.userData.baseEmissive)} }));
 updateFurnitureGuides();
}
document.getElementById("selectFurniture").onclick=()=>{
 if(!furniture.length){
  document.getElementById("selectedFurniture").textContent="Add furniture first!";
  return;
 }
 selectedFurnitureIndex=(selectedFurnitureIndex+1)%furniture.length;
 updateFurnitureLabel();
};
function moveSelected(dx,dz){
 const item=selectedFurniture();
 if(!item)return;
 item.position.x+=dx;item.position.z+=dz;
 constrainFurniture(item);
 updateFurnitureGuides();
 saveWorld();
}
function constrainFurniture(item){
 item.updateWorldMatrix(true,true);
 const box=new THREE.Box3().setFromObject(item);
 if(box.min.x<HOUSE_BOUNDS.minX)item.position.x+=HOUSE_BOUNDS.minX-box.min.x;
 if(box.max.x>HOUSE_BOUNDS.maxX)item.position.x-=box.max.x-HOUSE_BOUNDS.maxX;
 if(box.min.z<HOUSE_BOUNDS.minZ)item.position.z+=HOUSE_BOUNDS.minZ-box.min.z;
 if(box.max.z>HOUSE_BOUNDS.maxZ)item.position.z-=box.max.z-HOUSE_BOUNDS.maxZ;
}
document.getElementById("moveFUp").onclick=()=>moveSelected(0,-HOUSE_BOUNDS.step);
document.getElementById("moveFDown").onclick=()=>moveSelected(0,HOUSE_BOUNDS.step);
document.getElementById("moveFLeft").onclick=()=>moveSelected(-HOUSE_BOUNDS.step,0);
document.getElementById("moveFRight").onclick=()=>moveSelected(HOUSE_BOUNDS.step,0);
document.getElementById("rotateF").onclick=()=>{
 const item=selectedFurniture();
 if(!item)return;
 item.rotation.y+=Math.PI/4;
 constrainFurniture(item);
 updateFurnitureGuides();
 saveWorld();
};

window.getHouseFurnitureDebug=()=>({
 sceneId:currentPlace,
 area:houseArea,
 buildingMode,
 renderInfo:{calls:R.info.render.calls,triangles:R.info.render.triangles,geometries:R.info.memory.geometries,textures:R.info.memory.textures},
 assets:window.FurnitureAssets?.debug?.()||null,
 furniture:furniture.map(item=>({
   kind:item.userData.kind,
   label:item.userData.label,
   assetId:item.userData.assetId||null,
   assetStatus:item.userData.assetStatus||"primitive",
   x:+item.position.x.toFixed(2),
   z:+item.position.z.toFixed(2),
   rotation:+item.rotation.y.toFixed(3)
 }))
});

window.getHouseLayoutDebug=()=>({
 status:houseLayoutStatus,
 error:houseLayoutError,
 area:houseArea,
 player:{x:+P.position.x.toFixed(2),z:+P.position.z.toFixed(2),room:activeHouseLayout?.roomAt(P.position.x,P.position.z)||null},
 walkable:activeHouseLayout?activeHouseLayout.canWalk(P.position.x,P.position.z,HOUSE_CONFIG.playerInset):null,
 furnitureBounds:{...HOUSE_BOUNDS},
 spacing:{gridUnit:1,secondary:1,primary:2,playerDiameter:window.HouseSpaceSpec?.PLAYER?.diameter||.56,secondarySlack:window.HouseSpaceSpec?.playerSlack?.(1),primarySlack:window.HouseSpaceSpec?.playerSlack?.(2)},
 wallTextures:window.HouseWallMaterials?.debug?.()||null,
 refrigerator:window.HouseSpaceSpec?.REFRIGERATOR||null,
 debugViews:Object.fromEntries(Object.entries(HOUSE_DEBUG_VIEWS).map(([id,view])=>[id,view.name])),
 layout:activeHouseLayout?.debug?.()||null,
 shell:{walls:houseLayoutShell.children.filter(child=>child.userData.wallId).length,rooms:houseLayoutShell.children.filter(child=>child.userData.roomId).length}
});

document.getElementById("deleteFurniture").onclick=()=>{const item=selectedFurniture();if(!item)return;if(item===seatedFurniture)leaveSeat();unregisterFurnitureAction(item);house.remove(item);furniture.splice(selectedFurnitureIndex,1);selectedFurnitureIndex=Math.min(selectedFurnitureIndex,furniture.length-1);updateFurnitureLabel();saveWorld()};
function clearAllFurniture(){
 if(!furniture.length)return false;
 if(sitting)leaveSeat();
 tvControlsPanelEl.style.display="none";
 houseActionBtn.style.display="none";
 for(const item of furniture){unregisterFurnitureAction(item);house.remove(item)}
 furniture.length=0;
 selectedFurnitureIndex=-1;
 saved.houseFurnitureCleared=true;
 saveWorld();
 updateFurnitureLabel();
 clearFurnitureStatus.textContent="All furniture removed. Your empty house has been saved.";
 document.getElementById("msg").textContent="All furniture cleared and the empty house was saved.";
 return true;
}
function resetClearFurnitureConfirmation(){
 clearTimeout(clearFurnitureConfirmTimer);clearFurnitureConfirmTimer=null;
 clearAllFurnitureButton.dataset.confirming="false";
 clearAllFurnitureButton.textContent="Clear all furniture";
}
window.clearAllHouseFurniture=clearAllFurniture;
clearAllFurnitureButton.addEventListener("click",()=>{
 if(!furniture.length)return;
 if(clearAllFurnitureButton.dataset.confirming==="true"){
  resetClearFurnitureConfirmation();clearAllFurniture();return;
 }
 clearAllFurnitureButton.dataset.confirming="true";
 clearAllFurnitureButton.textContent="Confirm clear all";
 clearFurnitureStatus.textContent="Press Confirm clear all to remove every furniture item and save an empty house.";
 clearFurnitureConfirmTimer=setTimeout(resetClearFurnitureConfirmation,10000);
});
function restoreGameButtons(){
 const pad=document.getElementById("pad");
 
const shakeGrab=document.getElementById("shakeGrab");
function updateShakeGrab(){
 if(!inKitchen || !selectedIngredient || !["Strawberry","Banana","Milk","Chocolate"].includes(selectedIngredient.userData.ingredient)){
   shakeGrab.style.display="none";return;
 }
 let point=selectedIngredient.position.clone();point.y+=.35;point.project(C);
 shakeGrab.style.left=((point.x*.5+.5)*innerWidth-68)+"px";
 shakeGrab.style.top=((-point.y*.5+.5)*innerHeight+10)+"px";
 shakeGrab.innerHTML="🥤 ADD TO BLENDER<br>"+selectedIngredient.userData.emoji+" "+selectedIngredient.userData.ingredient;
 shakeGrab.style.display="block";
}
shakeGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const map={Strawberry:"strawberry",Banana:"banana",Milk:"milk",Chocolate:"chocolate"};
 const item=map[selectedIngredient.userData.ingredient];
 if(!item)return;
 if(!shakeIngredients.includes(item)) shakeIngredients.push(item);
 updateShakeList();
 document.getElementById("msg").textContent=selectedIngredient.userData.emoji+" "+selectedIngredient.userData.ingredient+" added to the blender! Walk to the blender when you are ready. 🥤";
});
setInterval(updateShakeGrab,80);

const lookPad=document.getElementById("lookPad");
 const lookLabel=document.getElementById("lookLabel");
 if(pad){pad.style.display="block";pad.style.visibility="visible"}
 if(lookPad){lookPad.style.display="block";lookPad.style.visibility="visible"}
 if(lookLabel){lookLabel.style.display="block";lookLabel.style.visibility="visible"}
}
document.getElementById("goBakery").addEventListener("click",restoreGameButtons);
document.getElementById("goHouse").addEventListener("click",restoreGameButtons);
document.getElementById("goBeach").addEventListener("click",restoreGameButtons);
document.getElementById("goSpace").addEventListener("click",restoreGameButtons);
document.getElementById("goCity").addEventListener("click",restoreGameButtons);
document.getElementById("goCastle").addEventListener("click",restoreGameButtons);

document.getElementById("firstPageButton").addEventListener("pointerdown",function(event){
  event.preventDefault();
  document.getElementById("startPage").style.display="block";
window.showPregameCustomization?.();
setHousePanel(false);setBuildingMode(false);house.visible=false;setBakeryVisible(false);
beach.visible=false;
hideSpaceWorld();
destroyCityWorld();if(castle)castle.visible=false;
window.RestaurantWorld?.destroy?.();
});
