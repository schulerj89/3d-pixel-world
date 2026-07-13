// House shell, destination switching, building controls, and TV interaction.
// The house shell, camera, spawn, and furniture limits all derive from this
// one definition so future room-size changes cannot leave build bounds behind.
const HOUSE_CONFIG={
 width:15,
 depth:15,
 wallHeight:5,
 wallThickness:.2,
 playerInset:.45,
 furnitureInset:.65,
 furnitureStep:.5,
 spawn:{x:0,z:2.5},
 camera:{angle:.35,height:8,distance:11}
};
const HOUSE_HALF_WIDTH=HOUSE_CONFIG.width/2;
const HOUSE_HALF_DEPTH=HOUSE_CONFIG.depth/2;
const HOUSE_BOUNDS={
 minX:-HOUSE_HALF_WIDTH+HOUSE_CONFIG.furnitureInset,
 maxX:HOUSE_HALF_WIDTH-HOUSE_CONFIG.furnitureInset,
 minZ:-HOUSE_HALF_DEPTH+HOUSE_CONFIG.furnitureInset,
 maxZ:HOUSE_HALF_DEPTH-HOUSE_CONFIG.furnitureInset,
 step:HOUSE_CONFIG.furnitureStep
};
function canWalkInHouse(x,z){
 return x>=-HOUSE_HALF_WIDTH+HOUSE_CONFIG.playerInset &&
  x<=HOUSE_HALF_WIDTH-HOUSE_CONFIG.playerInset &&
  z>=-HOUSE_HALF_DEPTH+HOUSE_CONFIG.playerInset &&
  z<=HOUSE_HALF_DEPTH-HOUSE_CONFIG.playerInset;
}
function hbox(w,h,d,c,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;house.add(m);return m}
hbox(HOUSE_CONFIG.width,.25,HOUSE_CONFIG.depth,0xd7b08b,0,.03,0);
hbox(HOUSE_CONFIG.width,HOUSE_CONFIG.wallHeight,HOUSE_CONFIG.wallThickness,0xddefff,0,HOUSE_CONFIG.wallHeight/2,-HOUSE_HALF_DEPTH+HOUSE_CONFIG.wallThickness/2);
hbox(HOUSE_CONFIG.wallThickness,HOUSE_CONFIG.wallHeight,HOUSE_CONFIG.depth,0xffe5ef,-HOUSE_HALF_WIDTH+HOUSE_CONFIG.wallThickness/2,HOUSE_CONFIG.wallHeight/2,0);
function addFurniture(kind,loading=false,savedItem=null){
 if(kind==="remote")return null;
 let g=new THREE.Group(),n=furniture.length,x=-5+(n%6)*2,z=-4+Math.floor(n/6)*2;
 function q(w,h,d,c,px,py,pz){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(px,py,pz);m.castShadow=true;g.add(m);return m}
 if(kind==="sofa"){q(2,.7,.8,0xe889ad,0,.55,0);q(2,.8,.25,0xd96f9a,0,1,-.3);q(.25,.7,.8,0xd96f9a,-1,.65,0);q(.25,.7,.8,0xd96f9a,1,.65,0)}
 if(kind==="table"){q(1.7,.18,1.1,0x9b6645,0,1,0);for(let a of[-.65,.65])for(let b of[-.35,.35])q(.14,1,.14,0x74472f,a,.5,b)}
 if(kind==="bed"){q(2.2,.45,1.3,0xffffff,0,.45,0);q(2.2,.25,1.3,0x8fc5ff,0,.72,0);q(.7,.18,1,0xffffff,-.6,.92,0)}
 if(kind==="lamp"){q(.55,.12,.55,0x555555,0,.08,0);q(.12,1.5,.12,0x777777,0,.8,0);q(.8,.65,.8,0xffe978,0,1.65,0)}
 if(kind==="chair"){q(.8,.18,.8,0x8f613f,0,.8,0);q(.8,1,.18,0x8f613f,0,1.3,-.3);q(.12,.8,.12,0x68442d,-.3,.4,0);q(.12,.8,.12,0x68442d,.3,.4,0)}
 if(kind==="fridge"){q(1.25,2.4,.9,0xdcecf2,0,1.2,0);q(.08,1,.08,0x777777,.48,1.55,.48)}
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


 g.position.set(savedItem?.x ?? x,0,savedItem?.z ?? z);
g.rotation.y=savedItem?.rotation ?? 0;
g.userData.kind=kind;house.add(g);furniture.push(g);constrainFurniture(g);
// Saved furniture is constructed before the interaction declarations below are
// initialized. A microtask registers it after this script has finished loading.
queueMicrotask(()=>registerFurnitureAction(g));
if(!loading)saveWorld()
}
saved.furniture=(saved.furniture||[]).filter(item=>(typeof item==="string"?item:item?.kind)!=="remote");
localStorage.setItem("my3DWorld",JSON.stringify(saved));
saved.furniture.forEach(item=>{
 if(typeof item==="string")addFurniture(item,true);
 else addFurniture(item.kind,true,item);
});
function setBakeryVisible(show){
 bakeryObjects.forEach(obj=>obj.visible=show);
 P.visible=true;
}
function showBakery(){P.visible=true;
 window.releaseLargeWorlds("bakery");
 currentPlace="bakery";
 document.body.classList.add("bakery-mode");document.body.classList.remove("house-mode","beach-mode","space-mode","forest-mode","castle-mode");
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
function showHouse(){P.visible=true;
 window.releaseLargeWorlds("house");
 currentPlace="house";
 document.body.classList.add("house-mode");document.body.classList.remove("bakery-mode","beach-mode","space-mode","forest-mode","castle-mode");
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
 P.position.set(HOUSE_CONFIG.spawn.x,0,HOUSE_CONFIG.spawn.z);
 cameraAngle=HOUSE_CONFIG.camera.angle;
 cameraHeight=HOUSE_CONFIG.camera.height;
 cameraDistance=HOUSE_CONFIG.camera.distance;
 C.position.set(
  P.position.x+Math.sin(cameraAngle)*cameraDistance,
  cameraHeight,
  P.position.z+Math.cos(cameraAngle)*cameraDistance
 );
 C.lookAt(0,1,0);
 if(window.switchWorldMusic)window.switchWorldMusic("house");
}
function showBeach(){
 window.releaseLargeWorlds("beach");
 currentPlace="beach";P.visible=true;
 document.body.classList.add("beach-mode");document.body.classList.remove("bakery-mode","house-mode","space-mode","forest-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(0x9edfff);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=true;
 hideSpaceWorld();
 if(castle)castle.visible=false;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";
 document.getElementById("recipePanel").style.display="none";
 document.getElementById("roomTeleport").style.display="none";
 roomName.style.display="block";roomName.textContent="Sunny Beach";
 P.position.set(BEACH_CONFIG.spawn.x,0,BEACH_CONFIG.spawn.z);P.rotation.y=Math.PI;
 cameraAngle=BEACH_CONFIG.camera.angle;cameraHeight=BEACH_CONFIG.camera.height;cameraDistance=BEACH_CONFIG.camera.distance;
 updateCamera();
 if(window.switchWorldMusic)window.switchWorldMusic("beach");
}
function showSpace(){
 destroyForestWorld();
 if(castle)castle.visible=false;
 const world=ensureSpaceWorld();currentPlace="space";P.visible=true;
 document.body.classList.add("space-mode");document.body.classList.remove("bakery-mode","house-mode","beach-mode","forest-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(world.background);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=false;world.group.visible=true;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";document.getElementById("roomTeleport").style.display="none";
 roomName.style.display="block";roomName.textContent=world.name;
 P.position.set(world.spawn.x,0,world.spawn.z);P.rotation.y=Math.PI;
 cameraAngle=world.camera.angle;cameraHeight=world.camera.height;cameraDistance=world.camera.distance;updateCamera();
 if(window.switchWorldMusic)window.switchWorldMusic("space");
}
function showForest(){
 hideSpaceWorld();
 if(castle)castle.visible=false;
 const world=ensureForestWorld(),config=world.config;
 currentPlace="forest";P.visible=true;
 document.body.classList.add("forest-mode");document.body.classList.remove("bakery-mode","house-mode","beach-mode","space-mode","castle-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
 S.background.set(0xa9dcbd);startPage.style.display="none";
 setBakeryVisible(false);house.visible=false;beach.visible=false;world.root.visible=true;
 inKitchen=false;inStorage=false;page5Group.visible=false;
 setHousePanel(false);setBuildingMode(false);setHudMenu(false);closeKitchenPanels();
 document.getElementById("orders").style.display="none";document.getElementById("recipePanel").style.display="none";
 document.getElementById("roomTeleport").style.display="none";roomName.style.display="block";roomName.textContent="Whimsy Forest";
 P.position.set(config.spawn.x,0,config.spawn.z);P.rotation.y=Math.PI;
 cameraAngle=config.camera.angle;cameraHeight=config.camera.height;cameraDistance=config.camera.distance;updateCamera();
 if(window.switchWorldMusic)window.switchWorldMusic("forest");
}
function showCastle(){
 destroyForestWorld();hideSpaceWorld();
 const world=createCastleWorld();currentPlace="castle";P.visible=true;
 document.body.classList.add("castle-mode");document.body.classList.remove("bakery-mode","house-mode","beach-mode","space-mode","forest-mode","kitchen-clean","storage-mode","kitchen-room-mode","house-building");
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
goBakery.onclick=showBakery;goHouse.onclick=showHouse;document.getElementById("goBeach").onclick=showBeach;
document.getElementById("goSpace").onclick=()=>window.runWorldTransition("Launching Space…","space",showSpace);
document.getElementById("goForest").onclick=()=>window.runWorldTransition("Growing the forest…","forest",showForest);
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
 return furniture.find(f=>(f.userData.kind==="chair"||f.userData.kind==="sofa")&&f.visible!==false&&Math.hypot(f.position.x-P.position.x,f.position.z-P.position.z)<range);
}
function leaveSeat(){
 if(!sitting)return;
 const seat=seatedFurniture;
 sitting=false;seatedFurniture=null;P.userData.seated=false;
 if(seat){
  const exitOffset=new THREE.Vector3(0,0,seat.userData.kind==="sofa"?1.35:1.05).applyQuaternion(seat.quaternion);
  P.position.set(seat.position.x+exitOffset.x,0,seat.position.z+exitOffset.z);
 }else P.position.y=0;
}
function takeSeat(seat){
 if(!seat)return;
 const isSofa=seat.userData.kind==="sofa";
 const seatOffset=new THREE.Vector3(0,0,isSofa ? .08 : .03).applyQuaternion(seat.quaternion);
 sitting=true;seatedFurniture=seat;P.userData.seated=true;
 P.position.set(seat.position.x+seatOffset.x,isSofa ? -.35 : -.3,seat.position.z+seatOffset.z);
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
 if(kind!=="sofa"&&kind!=="chair"&&kind!=="tv")return;
 const isSeat=kind==="sofa"||kind==="chair";
 const config={
  object:item,
  icon:isSeat?"🛋️":"📺",
  label:isSeat?"Sit down":"TV controls",
  range:isSeat?2.25:2.4,
  anchorOffset:new THREE.Vector3(0,isSeat?(kind==="sofa"?1.75:1.9):2.75,0),
  enabled:()=>currentPlace==="house"&&!buildingMode&&(!sitting||(isSeat&&seatedFurniture===item)),
  onAction:()=>{
   if(isSeat){if(sitting)leaveSeat();else takeSeat(item);return}
   tvControlsPanelEl.style.display="block";
  }
 };
 item.userData.objectActionRegistration=window.objectActions.register(config)||config;
}
function registerPendingFurnitureActions(){furniture.forEach(registerFurnitureAction)}
window.registerHouseFurnitureActions=registerPendingFurnitureActions;
function refreshHouseButtons(){
 const inHouse=currentPlace==="house";
 if(!inHouse||buildingMode){if(sitting)leaveSeat();houseActionBtn.style.display="none";tvControlsPanelEl.style.display="none";return}
 registerPendingFurnitureActions();
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
const buildingTools=document.getElementById("buildingTools");
const saveHouseButton=document.getElementById("saveHouse");
const buildHouseButton=document.getElementById("buildHouse");
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
 const show=Boolean(open&&currentPlace==="house"&&startPage.style.display==="none");
 housePanel.classList.toggle("open",show);
 housePanel.setAttribute("aria-hidden",String(!show));
 housePanelToggle.setAttribute("aria-expanded",String(show));
}
function setHouseTab(name){
 document.querySelectorAll("[data-house-tab]").forEach(b=>b.classList.toggle("active",b.dataset.houseTab===name));
 document.querySelectorAll("[data-house-view]").forEach(v=>v.classList.toggle("active",v.dataset.houseView===name));
}
housePanelToggle.addEventListener("pointerdown",e=>{e.preventDefault();const open=!housePanel.classList.contains("open");if(open)setHudMenu(false);setHousePanel(open)});
closeHousePanel.addEventListener("pointerdown",e=>{e.preventDefault();setHousePanel(false)});
document.querySelectorAll("[data-house-tab]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();setHouseTab(b.dataset.houseTab)}));

function setBuildingMode(on){
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
 document.getElementById("selectedFurniture").textContent=item?"Selected: "+item.userData.kind.replace(/^./,c=>c.toUpperCase())+" · "+(selectedFurnitureIndex+1)+" of "+furniture.length:"No furniture selected";
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

document.getElementById("deleteFurniture").onclick=()=>{const item=selectedFurniture();if(!item)return;if(item===seatedFurniture)leaveSeat();unregisterFurnitureAction(item);house.remove(item);furniture.splice(selectedFurnitureIndex,1);selectedFurnitureIndex=Math.min(selectedFurnitureIndex,furniture.length-1);updateFurnitureLabel();saveWorld()};
backPlaces.onclick=()=>{startPage.style.display="block";setHousePanel(false);setBuildingMode(false);house.visible=false;beach.visible=false;hideSpaceWorld();destroyForestWorld();if(castle)castle.visible=false;setBakeryVisible(false)};


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
document.getElementById("goForest").addEventListener("click",restoreGameButtons);
document.getElementById("goCastle").addEventListener("click",restoreGameButtons);

document.getElementById("firstPageButton").addEventListener("pointerdown",function(event){
  event.preventDefault();
  document.getElementById("startPage").style.display="block";
showCharacterTypeChooser();
setHousePanel(false);setBuildingMode(false);house.visible=false;setBakeryVisible(false);
beach.visible=false;
hideSpaceWorld();
destroyForestWorld();if(castle)castle.visible=false;
});
