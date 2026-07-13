// Core renderer, connected bakery world, movement, camera, and lazy destination orchestration.
// Feature systems are loaded afterward as ordered, cache-busted classic scripts.
const S=new THREE.Scene();S.background=new THREE.Color(0xffd7e6);const C=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);C.position.set(10,11,15);C.lookAt(0,1,-2);const R=new THREE.WebGLRenderer({antialias:true});R.setSize(innerWidth,innerHeight);R.setPixelRatio(Math.min(devicePixelRatio,1.25));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;game.appendChild(R.domElement);S.add(new THREE.HemisphereLight(0xffffff,0x805060,2.4));let sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(5,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.camera.near=.5;sun.shadow.camera.far=40;sun.shadow.bias=-.00035;sun.shadow.normalBias=.025;sun.shadow.camera.updateProjectionMatrix();S.add(sun);S.add(sun.target);
function box(w,h,d,c,x,y,z,parent=S){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
// Connected bakery room system. In each map, # is a wall, . is walkable floor,
// and D is a decorative, collision-solid entrance door.
// The main bakery has a 20 x 20 tile interior; shared doorway dots connect every room.
const ROOM_LAYOUTS=[
 {id:"bakery",name:"Main Bakery",originX:-10.5,originZ:15.5,floor:0xc98b68,wall:0xffd8e5,map:`
##########DD##########
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
#....................#
###########...########`},
 {id:"kitchen",name:"Bakery Kitchen",originX:-6.5,originZ:-5.5,floor:0xd9a47d,wall:0xffd8e5,map:`
########...######
#...............#
#................
#................
#................
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#################`},
 {id:"corridor",name:"Kitchen Corridor",originX:9.5,originZ:-7.5,floor:0xd9a47d,wall:0xffd8e5,map:`
....
....
....`},
 {id:"storage",name:"Bakery Storage",originX:11.5,originZ:-5.5,floor:0xb7b7b7,wall:0xc8c8c8,map:`
#################
#...............#
................#
................#
................#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#...............#
#################`}
].map(room=>({...room,rows:room.map.trim().split("\n").map(row=>row.trim())}));
const roomWorldGroup=new THREE.Group();S.add(roomWorldGroup);
const roomMatrix=new THREE.Matrix4();
// Rooms can share doorway coordinates. Keep the first floor tile at each world
// position so two materials never occupy the same plane and flicker as the
// camera moves. ROOM_LAYOUTS is ordered from the public bakery inward, making
// the bakery finish authoritative at its threshold.
const claimedFloorTiles=new Set();
ROOM_LAYOUTS.forEach(room=>{
 const floorTiles=[],wallTiles=[],doorTiles=[];
 room.rows.forEach((row,rowIndex)=>[...row].forEach((tile,colIndex)=>{
  const position={x:room.originX+colIndex,z:room.originZ-rowIndex};
  if(tile==="#")wallTiles.push(position);
  else if(tile==="."){
   const floorKey=`${position.x.toFixed(3)},${position.z.toFixed(3)}`;
   if(!claimedFloorTiles.has(floorKey)){
    claimedFloorTiles.add(floorKey);
    floorTiles.push(position);
   }
  }
  else if(tile==="D")doorTiles.push(position);
 }));
 const floorMaterial=new THREE.MeshStandardMaterial({color:room.floor,roughness:1,metalness:0});
 const floorMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.18,1),floorMaterial,floorTiles.length);
 floorTiles.forEach((tile,index)=>{roomMatrix.makeTranslation(tile.x,0,tile.z);floorMesh.setMatrixAt(index,roomMatrix)});
 floorMesh.castShadow=false;
 floorMesh.receiveShadow=true;
 floorMesh.frustumCulled=false;
 roomWorldGroup.add(floorMesh);
 if(wallTiles.length){
  const wallMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,5,1),new THREE.MeshStandardMaterial({color:room.wall}),wallTiles.length);
  wallTiles.forEach((tile,index)=>{roomMatrix.makeTranslation(tile.x,2.5,tile.z);wallMesh.setMatrixAt(index,roomMatrix)});
  wallMesh.castShadow=wallMesh.receiveShadow=true;roomWorldGroup.add(wallMesh);
 }
 if(doorTiles.length){
  const entrance=new THREE.Group();
  const doorMaterial=new THREE.MeshStandardMaterial({color:0x5f3428,roughness:.72});
  const trimMaterial=new THREE.MeshStandardMaterial({color:0xfff0cf,roughness:.65});
  const metalMaterial=new THREE.MeshStandardMaterial({color:0xe5b84d,metalness:.55,roughness:.35});
  const addEntrancePart=(geometry,material,x,y,z)=>{
   const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;entrance.add(mesh);return mesh;
  };
  doorTiles.forEach((tile,index)=>{
   addEntrancePart(new THREE.BoxGeometry(.96,3.75,.38),doorMaterial,tile.x,1.88,tile.z);
   addEntrancePart(new THREE.BoxGeometry(.66,.72,.05),trimMaterial,tile.x,2.5,tile.z-.215);
   addEntrancePart(new THREE.BoxGeometry(.66,.72,.05),trimMaterial,tile.x,1.45,tile.z-.215);
   const handleX=tile.x+(index<doorTiles.length/2 ? .27 : -.27);
   addEntrancePart(new THREE.SphereGeometry(.09,12,8),metalMaterial,handleX,1.85,tile.z-.27);
  });
  const minX=Math.min(...doorTiles.map(tile=>tile.x)),maxX=Math.max(...doorTiles.map(tile=>tile.x));
  const centerX=(minX+maxX)/2,centerZ=doorTiles[0].z;
  addEntrancePart(new THREE.BoxGeometry(.24,4.65,.54),trimMaterial,minX-.6,2.32,centerZ);
  addEntrancePart(new THREE.BoxGeometry(.24,4.65,.54),trimMaterial,maxX+.6,2.32,centerZ);
  addEntrancePart(new THREE.BoxGeometry(maxX-minX+2.2,.28,.54),trimMaterial,centerX,4.52,centerZ);
  roomWorldGroup.add(entrance);
 }
});
// Exterior scenery is deliberately separate from the ASCII collision map: the
// entrance stays solid, while the street-side setting remains visible through
// and around the bakery doors. Repeated tree parts are instanced to keep the
// scene inexpensive on tablets.
const bakeryExteriorGroup=new THREE.Group();
bakeryExteriorGroup.name="bakery-exterior-scenery";
roomWorldGroup.add(bakeryExteriorGroup);
const exteriorGrass=new THREE.Mesh(
 new THREE.BoxGeometry(34,.16,14),
 new THREE.MeshStandardMaterial({color:0x79b95a,roughness:1})
);
exteriorGrass.position.set(0,-.03,23);
exteriorGrass.receiveShadow=true;
bakeryExteriorGroup.add(exteriorGrass);
const exteriorSidewalk=new THREE.Mesh(
 new THREE.BoxGeometry(25,.12,3.2),
 new THREE.MeshStandardMaterial({color:0xc9c3b8,roughness:1})
);
exteriorSidewalk.position.set(0,.09,17.35);
exteriorSidewalk.receiveShadow=true;
bakeryExteriorGroup.add(exteriorSidewalk);
// Narrow inset seams suggest paving slabs without layering coplanar surfaces.
const sidewalkSeamMaterial=new THREE.MeshStandardMaterial({color:0xaaa59c,roughness:1});
const sidewalkSeams=new THREE.InstancedMesh(new THREE.BoxGeometry(.035,.025,3.05),sidewalkSeamMaterial,12);
for(let index=0;index<12;index++){
 roomMatrix.makeTranslation(-11+index*2,.165,17.35);
 sidewalkSeams.setMatrixAt(index,roomMatrix);
}
sidewalkSeams.receiveShadow=true;
bakeryExteriorGroup.add(sidewalkSeams);
const EXTERIOR_TREES=[
 {x:-13,z:21,scale:1.05},{x:-9.5,z:24.5,scale:.85},{x:-5.5,z:21.8,scale:.95},
 {x:6,z:22.2,scale:.9},{x:10,z:25,scale:1.08},{x:14,z:21.2,scale:.92}
];
const treeTrunks=new THREE.InstancedMesh(
 new THREE.CylinderGeometry(.28,.42,2.5,6),
 new THREE.MeshStandardMaterial({color:0x795038,roughness:1}),
 EXTERIOR_TREES.length
);
const treeCrowns=new THREE.InstancedMesh(
 new THREE.ConeGeometry(1.65,3.4,7),
 new THREE.MeshStandardMaterial({color:0x3f8f4e,roughness:1}),
 EXTERIOR_TREES.length
);
EXTERIOR_TREES.forEach(({x,z,scale},index)=>{
 roomMatrix.compose(
  new THREE.Vector3(x,1.3*scale,z),
  new THREE.Quaternion(),
  new THREE.Vector3(scale,scale,scale)
 );
 treeTrunks.setMatrixAt(index,roomMatrix);
 roomMatrix.compose(
  new THREE.Vector3(x,3.35*scale,z),
  new THREE.Quaternion(),
  new THREE.Vector3(scale,scale,scale)
 );
 treeCrowns.setMatrixAt(index,roomMatrix);
});
treeTrunks.castShadow=treeTrunks.receiveShadow=true;
treeCrowns.castShadow=treeCrowns.receiveShadow=true;
bakeryExteriorGroup.add(treeTrunks,treeCrowns);
function tileAtWorld(x,z){
 for(const room of ROOM_LAYOUTS){
  const col=Math.round(x-room.originX),row=Math.round(room.originZ-z);
  if(row>=0&&row<room.rows.length&&col>=0&&col<room.rows[row].length&&room.rows[row][col]===".")return room;
 }
 return null;
}
function canWalkAt(x,z){
 const radius=.28;
 return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([dx,dz])=>tileAtWorld(x+dx,z+dz));
}
function roomAtWorld(x,z){
 if(x>=12&&x<=27&&z<=-6&&z>=-21)return ROOM_LAYOUTS.find(room=>room.id==="storage");
 if(x>=9&&x<=13&&z<=-7&&z>=-10)return ROOM_LAYOUTS.find(room=>room.id==="corridor");
 if(x>=-6&&x<=9&&z<=-5&&z>=-21)return ROOM_LAYOUTS.find(room=>room.id==="kitchen");
 return ROOM_LAYOUTS.find(room=>room.id==="bakery");
}
// Voxel decorations for the main room. Keeping the models and placements in data
// makes it easy to dress the bakery without scattering one-off meshes through the scene.
const bakeryDecorGroup=new THREE.Group();
bakeryDecorGroup.name="main-bakery-decor";
S.add(bakeryDecorGroup);
function addBakeryDecorPart(parent,w,h,d,color,x,y,z){
 const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color}));
 part.position.set(x,y,z);part.castShadow=true;part.receiveShadow=true;parent.add(part);
}
const BAKERY_DECOR_MODELS={
 plant(g){
  addBakeryDecorPart(g,.9,.65,.9,0xc56f52,0,.33,0);
  addBakeryDecorPart(g,.55,.18,.55,0x8a4a38,0,.72,0);
  addBakeryDecorPart(g,.16,1,.16,0x4f8b55,0,1.18,0);
  [[-.32,1.2,0],[.32,1.35,.03],[0,1.55,-.25],[.08,1.12,.3]].forEach(([x,y,z])=>
   addBakeryDecorPart(g,.55,.42,.18,0x78b967,x,y,z));
 },
 cafeTable(g){
  addBakeryDecorPart(g,2.4,.18,1.35,0xf2cf9f,0,1.25,0);
  addBakeryDecorPart(g,.28,1.2,.28,0x8c553e,0,.62,0);
  [-1,1].forEach(x=>{
   addBakeryDecorPart(g,.75,.16,.75,0xd88c83,x,.65,0);
   addBakeryDecorPart(g,.18,.65,.18,0x8c553e,x,.32,0);
  });
  addBakeryDecorPart(g,.38,.38,.38,0xfff2c2,0,1.53,0);
  addBakeryDecorPart(g,.28,.12,.28,0xff9db8,0,1.78,0);
 },
 pastryCase(g){
  addBakeryDecorPart(g,3.1,.7,.9,0x9d6046,0,.35,0);
  addBakeryDecorPart(g,3,.95,.82,0xaee5ee,0,1.16,0);
  addBakeryDecorPart(g,2.75,.12,.7,0xf7e0ba,0,.95,0);
  [-.9,0,.9].forEach((x,index)=>{
   addBakeryDecorPart(g,.48,.22,.42,[0xff9fba,0xe1a866,0xffdb72][index],x,1.12,.06);
   addBakeryDecorPart(g,.3,.12,.3,0xfff0dc,x,1.3,.06);
  });
 },
 menuBoard(g){
  addBakeryDecorPart(g,3.7,2,.18,0x704839,0,2.4,0);
  addBakeryDecorPart(g,3.35,1.65,.08,0x315044,0,2.4,.12);
  [2.85,2.4,1.95].forEach((y,index)=>
   addBakeryDecorPart(g,2.25-index*.35,.09,.05,0xfff2d5,-.25,y,.19));
  addBakeryDecorPart(g,.45,.45,.05,0xf7b45d,1.25,2.55,.19);
 },
 breadRack(g){
  [-1.15,0,1.15].forEach(y=>addBakeryDecorPart(g,3,.14,.7,0x956047,0,y+1.35,0));
  [-1.35,1.35].forEach(x=>addBakeryDecorPart(g,.16,2.8,.7,0x75452f,x,1.4,0));
  [-.85,0,.85].forEach(x=>{
   addBakeryDecorPart(g,.62,.28,.45,0xdca85f,x,1.52,.02);
   addBakeryDecorPart(g,.48,.12,.48,0xf0c978,x,1.75,.02);
  });
 }
};
[
 {model:"plant",x:-8.4,z:12.7},
 {model:"plant",x:8.4,z:12.7},
 {model:"cafeTable",x:-7.3,z:8.1,rotation:Math.PI/2},
 {model:"cafeTable",x:7.3,z:7.2,rotation:Math.PI/2},
 {model:"pastryCase",x:-7.7,z:1.8,rotation:Math.PI/2},
 {model:"breadRack",x:8.7,z:1.2,rotation:-Math.PI/2},
 {model:"menuBoard",x:-5.8,z:14.25,rotation:0}
].forEach(({model,x,z,rotation=0})=>{
 const decoration=new THREE.Group();decoration.position.set(x,0,z);decoration.rotation.y=rotation;
 decoration.userData.decorType=model;BAKERY_DECOR_MODELS[model](decoration);bakeryDecorGroup.add(decoration);
});
// Keep a five-tile approach lane between the cashier station and kitchen door.
box(5,1.3,1.2,0xb96f4e,2.7,.7,.5);box(1,.8,.7,0x555555,3.8,1.65,.5);box(.7,.25,.5,0x9ff0b0,3.8,2.05,.5);
box(3,.2,.6,0x8c553e,-4.5,2.7,-5);for(let i=0;i<4;i++)box(.5,.4,.4,[0xff8fb1,0xffd36e,0x9fe3c1,0xa9c8ff][i],-5.5+i*.75,3,-4.9);
// Doorway frame between the main bakery and kitchen.
box(.35,4,.35,0x8b5a3c,1.0,2,-5.35);
box(.35,4,.35,0x8b5a3c,3.5,2,-5.35);
box(2.85,.35,.35,0x8b5a3c,2.25,3.85,-5.35);
// Kitchen stations follow a perimeter workflow and leave the middle of the room
// open as a walking lane. Interaction checks below read from this same data.
const KITCHEN_STATIONS={
 fridge:{x:8.44,z:-9.1,rotation:-Math.PI/2},
 prep:{x:4.2,z:-8.7},
 stove:{x:8.35,z:-14.5,rotation:-Math.PI/2},
 decorShelf:{x:-5.78,z:-9.6,rotation:Math.PI/2},
 blender:{x:-3.2,z:-14.2}
};
const kitchenFixtureGroup=new THREE.Group();
kitchenFixtureGroup.name="kitchen-workflow-fixtures";S.add(kitchenFixtureGroup);
function kitchenBox(w,h,d,color,x,y,z){return box(w,h,d,color,x,y,z,kitchenFixtureGroup)}
const fridgeStation=KITCHEN_STATIONS.fridge;
const fridgeGroup=new THREE.Group();fridgeGroup.name="kitchen-refrigerator";fridgeGroup.position.set(fridgeStation.x,0,fridgeStation.z);fridgeGroup.rotation.y=fridgeStation.rotation;kitchenFixtureGroup.add(fridgeGroup);
box(2.05,2.85,1.08,0xd8e8ef,0,1.43,0,fridgeGroup);
box(1.82,.06,.08,0xb9cdd7,0,1.78,.57,fridgeGroup);
box(.09,.9,.07,0x65727b,-.72,1.17,.59,fridgeGroup);
box(.09,.52,.07,0x65727b,-.72,2.22,.59,fridgeGroup);
box(1.65,.28,.06,0xeaf6fa,0,2.38,.59,fridgeGroup);
const prepStation=KITCHEN_STATIONS.prep;
kitchenBox(2.4,1,.9,0xe0b184,prepStation.x,.53,prepStation.z);
kitchenBox(.7,.2,.7,0xff8fb1,prepStation.x,1.15,prepStation.z+.1);
const decorShelfStation=KITCHEN_STATIONS.decorShelf;
const decorShelfGroup=new THREE.Group();decorShelfGroup.name="kitchen-decoration-shelf";decorShelfGroup.position.set(decorShelfStation.x,0,decorShelfStation.z);decorShelfGroup.rotation.y=decorShelfStation.rotation;kitchenFixtureGroup.add(decorShelfGroup);
box(3.2,.16,.42,0x8c553e,0,2.45,0,decorShelfGroup);
box(3.2,.16,.42,0x8c553e,0,3.25,0,decorShelfGroup);
box(.16,1.35,.42,0x8c553e,-1.5,2.72,0,decorShelfGroup);box(.16,1.35,.42,0x8c553e,1.5,2.72,0,decorShelfGroup);
for(let i=0;i<4;i++)box(.42,.38,.3,[0xffd36e,0xff8fb1,0x9fe3c1,0xa9c8ff][i],-1.08+i*.72,2.75,.08,decorShelfGroup);

// Ingredient shelf attached to the kitchen wall
box(8.4,.22,.65,0x8b5a3c,-.1,2.45,-19.95);
box(8.4,.22,.65,0x8b5a3c,-.1,1.25,-19.95);
box(.22,2.7,.65,0x8b5a3c,-4.2,1.55,-19.95);
box(.22,2.7,.65,0x8b5a3c,4.0,1.55,-19.95);
const ingredientSpots=[
{name:"Strawberry",emoji:"🍓",x:-3.65,y:2.75,z:-19.6,color:0xff5272},
{name:"Banana",emoji:"🍌",x:-2.7,y:2.75,z:-19.6,color:0xffdb45},
{name:"Egg",emoji:"🥚",x:-1.75,y:2.75,z:-19.6,color:0xfff4d6},
{name:"Milk",emoji:"🥛",x:-.8,y:2.75,z:-19.6,color:0xe8f5ff},
{name:"Flour",emoji:"🌾",x:.2,y:2.75,z:-19.6,color:0xf3d49b},
{name:"Sugar",emoji:"🍬",x:1.2,y:2.75,z:-19.6,color:0xffb6d8},
{name:"Butter",emoji:"🧈",x:2.2,y:2.75,z:-19.6,color:0xffdf62},
{name:"Chocolate",emoji:"🍫",x:3.25,y:2.75,z:-19.6,color:0x6b351f}
];
const ingredientModels=[];
ingredientSpots.forEach(s=>{
 let group=new THREE.Group();
 group.position.set(s.x,s.y,s.z);
 group.userData={ingredient:s.name,emoji:s.emoji};
 S.add(group);
 function piece(w,h,d,c,x,y,z){
   let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));
   m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);
 }
 piece(.82,.18,.62,0x9a633f,0,-.25,0);
 if(s.name==="Strawberry"){piece(.42,.42,.38,0xff5272,0,.08,0);piece(.28,.12,.28,0x62bd55,0,.34,0)}
 if(s.name==="Banana"){piece(.5,.18,.26,0xffdb45,0,.08,0);piece(.16,.2,.18,0xffe972,.2,.18,0)}
 if(s.name==="Egg"){piece(.34,.46,.34,0xfff7dc,0,.08,0);piece(.18,.16,.18,0xffd75e,0,.12,.18)}
 if(s.name==="Milk"){piece(.38,.62,.38,0xf4fbff,0,.14,0);piece(.28,.16,.28,0x7cc8ff,0,.53,0);piece(.26,.25,.03,0x77b9ed,0,.13,.21)}
 if(s.name==="Flour"){piece(.48,.65,.34,0xf1d6a6,0,.15,0);piece(.34,.2,.04,0xffffff,0,.17,.19)}
 if(s.name==="Sugar"){piece(.46,.58,.34,0xffc4df,0,.12,0);piece(.28,.18,.04,0xffffff,0,.12,.19)}
 if(s.name==="Butter"){piece(.58,.3,.34,0xffdf62,0,0,0);piece(.62,.08,.38,0xfff3a6,0,-.18,0)}
 if(s.name==="Chocolate"){piece(.58,.42,.18,0x6b351f,0,.05,0);piece(.12,.12,.04,0x8b4d2f,-.16,.13,.11);piece(.12,.12,.04,0x8b4d2f,.16,.13,.11)}
 ingredientModels.push(group);
});
box(4.5,.65,.18,0xfff0a8,1.2,3.65,-20.15);


// Big 3D stove and oven in the kitchen
const stoveGroup=new THREE.Group();
stoveGroup.position.set(KITCHEN_STATIONS.stove.x,0,KITCHEN_STATIONS.stove.z);
stoveGroup.rotation.y=KITCHEN_STATIONS.stove.rotation;
S.add(stoveGroup);
function stovePart(w,h,d,c,x,y,z){
 let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;stoveGroup.add(m);return m;
}
stovePart(2.5,1.65,1.25,0x4b5058,0,.85,0);
stovePart(2.15,.85,.08,0x171b22,0,.72,.64);
stovePart(2.15,.12,1.05,0x22262d,0,1.72,0);
stovePart(.48,.08,.48,0x111111,-.65,1.8,-.2);
stovePart(.48,.08,.48,0x111111,.65,1.8,-.2);
stovePart(.48,.08,.48,0x111111,-.65,1.8,.3);
stovePart(.48,.08,.48,0x111111,.65,1.8,.3);
for(let i=0;i<4;i++)stovePart(.16,.16,.12,0xffd15c,-.72+i*.48,1.42,.65);

// Bakery order TV on the kitchen back wall.
const bakeryOrderTV=new THREE.Group();
function orderTVPart(w,h,d,c,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,emissive:c===0x65d985?0x174d2b:0x000000,emissiveIntensity:c===0x65d985?.8:0}));
 m.position.set(x,y,z);m.castShadow=true;bakeryOrderTV.add(m);return m;
}
orderTVPart(3.5,2.15,.30,0x292d43,0,0,0);
orderTVPart(3.05,1.62,.10,0x65d985,0,0,.20);
orderTVPart(2.55,.13,.06,0xffffff,0,.48,.27);
orderTVPart(2.55,.13,.06,0xffffff,0,0,.27);
orderTVPart(2.55,.13,.06,0xffffff,0,-.48,.27);
bakeryOrderTV.position.set(5.7,3.6,-20.15);
S.add(bakeryOrderTV);

// Storage fixtures live in the connected storage room built by ROOM_LAYOUTS.
const page5Group=new THREE.Group();
page5Group.visible=true;
S.add(page5Group);
function page5Part(w,h,d,c,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;page5Group.add(m);return m;
}
function addStorageShelf(x,z){
 page5Part(4.8,.16,.72,0x888888,x,2.8,z);
 page5Part(4.8,.16,.72,0x888888,x,1.7,z);
 page5Part(4.8,.16,.72,0x888888,x,.6,z);
 page5Part(.16,3.0,.72,0x747474,x-2.2,1.5,z);
 page5Part(.16,3.0,.72,0x747474,x+2.2,1.5,z);
}
addStorageShelf(16.0,-18.8); addStorageShelf(23.6,-18.8);
addStorageShelf(16.0,-10.2); addStorageShelf(23.6,-10.2);
[
 [14.8,.95,-18.75,0xb98b63],[15.9,.95,-18.65,0xc2956b],[17.1,.95,-18.8,0xa87850],
 [14.9,2.05,-18.75,0xd0a47b],[16.2,2.05,-18.65,0xbb8d67],[17.2,2.05,-18.78,0x9f7550],
 [22.4,.95,-18.72,0xc99d72],[23.7,.95,-18.68,0xab7d58],[24.8,.95,-18.82,0xd4ab7f],
 [22.5,2.05,-18.72,0xa8744e],[23.7,2.05,-18.65,0xc59771],[24.8,2.05,-18.79,0xb98b63],
 [14.9,.95,-10.15,0xd1a77b],[16.2,.95,-10.05,0xb18059],[17.1,.95,-10.18,0xc0916b],
 [22.5,.95,-10.15,0xc69771],[23.8,.95,-10.04,0xaa7d57],[24.9,.95,-10.18,0xd3aa7d]
].forEach(a=>page5Part(.95,.75,.62,a[3],a[0],a[1],a[2]));

// Grabbable food blocks in the kitchen
const grabItems=[];
function makeGrabItem(name,emoji,color,x,y,z){
 let item=box(.65,.45,.65,color,x,y,z);
 item.userData={name:name,emoji:emoji,held:false};
 grabItems.push(item);
 return item;
}
makeGrabItem("Cupcake","🧁",0xff8fb1,KITCHEN_STATIONS.prep.x-.7,1.45,KITCHEN_STATIONS.prep.z);
makeGrabItem("Cookie","🍪",0xd79a58,KITCHEN_STATIONS.prep.x,1.45,KITCHEN_STATIONS.prep.z);
makeGrabItem("Cake","🎂",0xffd0e1,KITCHEN_STATIONS.prep.x+.7,1.45,KITCHEN_STATIONS.prep.z);



function person(shirt){
 let g=new THREE.Group();
 box(.7,.7,.7,0xf2bb91,0,2,0,g);
 box(.8,.9,.5,shirt,0,1.2,0,g);
 box(.25,.8,.3,0xf2bb91,-.55,1.2,0,g);
 box(.25,.8,.3,0xf2bb91,.55,1.2,0,g);
 box(.28,.8,.35,0x5870c8,-.2,.35,0,g);
 box(.28,.8,.35,0x5870c8,.2,.35,0,g);
 // Hair
 box(.74,.18,.74,0x6b3c35,0,2.32,0,g);
 box(.13,.42,.72,0x6b3c35,-.3,2.12,0,g);
 // Two eyes on the front of the face
 box(.10,.12,.05,0x202020,-.16,2.08,.375,g);
 box(.10,.12,.05,0x202020,.16,2.08,.375,g);
 // Eye shine
 box(.025,.025,.02,0xffffff,-.14,2.11,.407,g);
 box(.025,.025,.02,0xffffff,.18,2.11,.407,g);
 // Nose
 box(.07,.08,.06,0xe39d78,0,1.96,.39,g);
 // Happy smile
 box(.22,.055,.05,0x9b3f55,0,1.84,.39,g);
 box(.055,.055,.05,0x9b3f55,-.13,1.88,.39,g);
 box(.055,.055,.05,0x9b3f55,.13,1.88,.39,g);
 S.add(g);return g
}
let P=person(0xb77cff);P.position.set(-1,0,2);
// Find the player's colored body parts so the avatar shop can change them.
const playerMeshes=P.children;
const playerHead=playerMeshes[0];
const playerShirt=playerMeshes[1];
const playerLeftArm=playerMeshes[2];
const playerRightArm=playerMeshes[3];
const playerLeftLeg=playerMeshes[4];
const playerRightLeg=playerMeshes[5];
const playerHairTop=playerMeshes[6];
const playerHairSide=playerMeshes[7];
// The message area is reserved for useful, contextual feedback during play.
document.getElementById("msg").textContent="";
// Voxel hairstyles stay as small data sets so the world avatar and the
// customization preview always use the same silhouette. Each entry is
// [x, y, z, scale] for curls or [x, y, z, width, height, depth, tilt] for layers.
const PUFF_HAIR_VOXELS=[
 [-.50,2.56,.02,.95],[-.27,2.73,.05,1.02],[0,2.80,.04,1.08],[.27,2.73,.05,1.02],[.50,2.56,.02,.95],
 [-.57,2.32,0,1],[-.60,2.08,-.03,.94],[.57,2.32,0,1],[.60,2.08,-.03,.94],
 [-.42,2.59,-.29,.98],[0,2.73,-.36,1.1],[.42,2.59,-.29,.98],
 [-.52,2.34,-.38,1.02],[0,2.48,-.46,1.15],[.52,2.34,-.38,1.02],
 [-.43,2.08,-.41,.94],[0,2.14,-.48,1.02],[.43,2.08,-.41,.94],
 [-.31,2.46,.34,.72],[0,2.52,.38,.68],[.31,2.46,.34,.72]
];
const SHORT_HAIR_VOXELS=[
 [-.45,2.58,.02,1],[-.22,2.75,.02,1],[.02,2.80,.02,1.05],[.27,2.73,.02,1],[.48,2.56,.02,.95],
 [-.55,2.36,0,1],[-.60,2.12,-.02,1],[.57,2.34,0,1],[.61,2.10,-.02,1],
 [-.54,1.88,-.05,.9],[.54,1.88,-.05,.9],
 [-.38,2.65,-.30,1],[0,2.76,-.36,1.1],[.38,2.64,-.30,1],
 [-.50,2.38,-.38,1],[0,2.48,-.46,1.15],[.50,2.36,-.38,1],
 [-.46,2.08,-.40,.95],[0,2.14,-.48,1.05],[.46,2.06,-.40,.95],
 [-.28,2.42,.36,.62],[.05,2.50,.39,.58],[.34,2.38,.36,.58],
 [-.42,1.88,-.34,.78],[0,1.92,-.44,.86],[.42,1.88,-.34,.78]
];
const LONG_HAIR_LAYERS=[
 [-.28,2.62,.02,.38,.28,.76,-.10],[.28,2.62,.02,.38,.28,.76,.10],
 [-.43,2.38,-.02,.30,.55,.70,-.12],[.43,2.38,-.02,.30,.55,.70,.12],
 [-.53,2.02,-.08,.30,.62,.58,-.10],[.53,2.02,-.08,.30,.62,.58,.10],
 [-.58,1.60,-.12,.34,.58,.52,.10],[.58,1.60,-.12,.34,.58,.52,-.10],
 [-.53,1.20,-.16,.32,.52,.46,-.14],[.53,1.20,-.16,.32,.52,.46,.14],
 [0,2.42,-.42,.78,.55,.25,0],[0,1.95,-.45,.88,.62,.24,0],
 [0,1.45,-.43,.82,.58,.22,0],[0,1.02,-.38,.70,.46,.20,0],
 [-.20,2.50,.35,.24,.34,.24,-.08],[.20,2.50,.35,.24,.34,.24,.08]
];
// Extra pieces used to make the puffy style fuller and rounder.
const playerPuffPieces=[];
function addPlayerPuff(x,y,z,s){
 const m=new THREE.Mesh(
  new THREE.BoxGeometry(.34*s,.34*s,.34*s),
  new THREE.MeshStandardMaterial({color:0x6b3c35})
 );
 m.position.set(x,y,z);m.castShadow=true;m.visible=false;P.add(m);
 playerPuffPieces.push(m);
}
PUFF_HAIR_VOXELS.forEach(a=>addPlayerPuff(...a));
const playerLongPieces=[];
function addPlayerLong(x,y,z,w,h,d,ry=0){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x6b3c35}));
 m.position.set(x,y,z);m.rotation.z=ry;m.castShadow=true;m.visible=false;P.add(m);playerLongPieces.push(m);
}
// Layered, center-parted long hair that flows down both sides and the back.
LONG_HAIR_LAYERS.forEach(a=>addPlayerLong(...a));
const playerShortCurlPieces=[];
function addPlayerShortCurl(x,y,z,s){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.30*s,.30*s,.30*s),new THREE.MeshStandardMaterial({color:0x6b3c35}));
 m.position.set(x,y,z);m.castShadow=true;m.visible=false;P.add(m);playerShortCurlPieces.push(m);
}
// Rounded curly bob: full top, sides, back, and a few forehead curls.
SHORT_HAIR_VOXELS.forEach(a=>addPlayerShortCurl(...a));

let cashier=person(0xff7fa8);cashier.position.set(2.7,0,-.3);
let vx=0,vz=0,walk=0;
const PLAYER_MOVE_SPEED=5.376; // 20% faster than the previous 4.48 units/second.
const customers=[]; // No customers in this version.function spawn(){if(customers.length>5)return;let q=person(Math.random()*0xffffff);q.position.set(6.5,0,4.5);q.userData={stage:0,wait:180+Math.random()*180};customers.push(q)}// Customers removed.
const pad=document.getElementById('pad'),stick=document.getElementById('stick');let active=false;
function joy(e){let r=pad.getBoundingClientRect(),p=e.touches?e.touches[0]:e,dx=p.clientX-(r.left+72.5),dy=p.clientY-(r.top+72.5),d=Math.hypot(dx,dy),max=43;if(d>max){dx*=max/d;dy*=max/d}stick.style.transform=`translate(${dx}px,${dy}px)`;vx=dx/max;vz=dy/max}
pad.addEventListener('pointerdown',e=>{active=true;pad.setPointerCapture(e.pointerId);joy(e)});pad.addEventListener('pointermove',e=>{if(active)joy(e)});function stop(){active=false;vx=vz=0;stick.style.transform='translate(0,0)'}pad.addEventListener('pointerup',stop);pad.addEventListener('pointercancel',stop);

const recipes=[
{name:"Cupcake",emoji:"🧁",items:["🥚 Egg","🥛 Milk","🌾 Flour"]},
{name:"Cookies",emoji:"🍪",items:["🧈 Butter","🌾 Flour","🍬 Sugar"]},
{name:"Cake",emoji:"🎂",items:["🥚 Egg","🥛 Milk","🌾 Flour","🍬 Sugar"]},
{name:"Sweet Bread",emoji:"🍞",items:["🌾 Flour","🥛 Milk","🍬 Sugar","🧈 Butter"]},
{name:"Croissant",emoji:"🥐",items:["🌾 Flour","🥛 Milk","🧈 Butter"]}
];
let recipeIndex=0,addedIngredients=0;
const recipePanel=document.getElementById("recipePanel");
const ingredientList=document.getElementById("ingredientList");
function showRecipe(){
 const r=recipes[recipeIndex];
 document.getElementById("recipeName").textContent=r.emoji+" "+r.name;
 ingredientList.innerHTML="";
 r.items.forEach((item,i)=>{
  const d=document.createElement("div");d.className="ingredient"+(i<addedIngredients?" done":"");
  d.textContent=(i<addedIngredients?"✅ ":"⬜ ")+item;ingredientList.appendChild(d);
 });
}
showRecipe();
document.getElementById("makeFood").addEventListener("pointerdown",e=>{
 e.preventDefault();
 const r=recipes[recipeIndex];
 const nearShelf=P.position.z<-10.5 && P.position.x>-2.2 && P.position.x<4.6;
 if(!nearShelf){
  document.getElementById("msg").textContent="Walk close to the ingredient shelf on the kitchen wall first! 🧺";
  return;
 }
 if(addedIngredients<r.items.length){
  const ingredient=r.items[addedIngredients];
  addedIngredients++;
  showRecipe();
  document.getElementById("msg").textContent="You grabbed "+ingredient+" from the shelf! 🤲";
 }else{
  document.getElementById("msg").textContent="You made "+r.emoji+" "+r.name+"! Now tap ✅ Finish on the order TV to earn money. 📺";
  recipeIndex=(recipeIndex+1)%recipes.length;
  addedIngredients=0;showRecipe();
 }
});
let currentPlace="bakery";
const worldLoading=document.getElementById("worldLoading"),worldLoadingTitle=document.getElementById("worldLoadingTitle");
const disposableWorlds=new Map();
function disposeWorldRoot(root){
 if(!root)return;
 root.traverse(object=>{
  if(object.geometry)object.geometry.dispose();
  const materials=Array.isArray(object.material)?object.material:[object.material];
  materials.filter(Boolean).forEach(material=>{
   for(const value of Object.values(material))if(value&&value.isTexture)value.dispose();
   material.dispose();
  });
 });
 if(root.parent)root.parent.remove(root);
}
window.registerDisposableWorld=(id,root)=>{disposableWorlds.set(id,root);return root};
window.unloadDisposableWorlds=except=>{
 for(const [id,root] of disposableWorlds)if(id!==except){disposeWorldRoot(root);disposableWorlds.delete(id)}
};
window.runWorldTransition=(label,place,build)=>{
 // Select destination audio while the originating tap still carries browser
 // media permission; the scene build itself is intentionally delayed.
 window.switchWorldMusic?.(place);
 worldLoadingTitle.textContent=label;
 worldLoading.classList.add("open");worldLoading.setAttribute("aria-hidden","false");
 return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{
  let result;
  try{
   if(window.releaseLargeWorlds)window.releaseLargeWorlds(place);
   window.unloadDisposableWorlds(place);
   result=build();
  }finally{worldLoading.classList.remove("open");worldLoading.setAttribute("aria-hidden","true")}
  resolve(result);
 },40))));
};
window.getGameDebug=()=>({
 sceneId:currentPlace,loadedWorlds:[...disposableWorlds.keys(),...(spaceWorld?["space"]:[]),...(forestWorld?["forest"]:[]),...(castle?["castle"]:[])],
 player:{x:+P.position.x.toFixed(2),y:+P.position.y.toFixed(2),z:+P.position.z.toFixed(2)},
 render:{calls:R.info.render.calls,triangles:R.info.render.triangles},
 memory:{geometries:R.info.memory.geometries,textures:R.info.memory.textures},
 forest:forestWorld?.debug?.()||null
});
let inKitchen=false;
let money=100;
let servedCount=0;
const foods=["🧁 Cupcake","🍪 Cookies","🎂 Cake","🥐 Croissant","🍞 Sweet Bread","🍓 Strawberry Milkshake","🍫 Chocolate Milkshake"];
function updateMoney(){document.getElementById("money").textContent="💵 $"+money}
updateMoney();
function newOrders(){
 if(window.BakeryOrderTracker){window.BakeryOrderTracker.refresh();return}
 document.getElementById("order1").textContent=foods[Math.floor(Math.random()*foods.length)];
 document.getElementById("order2").textContent=foods[Math.floor(Math.random()*foods.length)];
 document.getElementById("order3").textContent=foods[Math.floor(Math.random()*foods.length)];
}
newOrders();
const backButton=document.getElementById("kitchenBack");
const roomName=document.getElementById("roomName");
const ROOM_SPAWNS={bakery:{x:-1,z:2},kitchen:{x:2.2,z:-8},storage:{x:19.8,z:-8.2}};
let activeRoomId="";
function syncBakeryRoomState(force=false){
 if(currentPlace!=="bakery")return;
 document.body.classList.add("bakery-mode");document.body.classList.remove("house-mode");
 const room=roomAtWorld(P.position.x,P.position.z);
 const roomId=room.id==="corridor"?"kitchen":room.id;
 inStorage=roomId==="storage";
 inKitchen=roomId==="kitchen";
 document.body.classList.toggle("storage-mode",inStorage);
 document.body.classList.toggle("kitchen-room-mode",inKitchen);
 page5Group.visible=true;
 if(!force&&roomId===activeRoomId)return;
 activeRoomId=roomId;
 closeKitchenPanels();
 roomName.style.display="block";
 roomName.textContent=roomId==="bakery"?"Main Bakery":roomId==="kitchen"?"Bakery Kitchen":"Bakery Storage";
 recipePanel.style.display=inKitchen?"block":"none";
 document.getElementById("orders").style.display=inKitchen?"block":"none";
 document.body.classList.toggle("kitchen-clean",inKitchen);
}
function teleportToRoom(roomId){
 const spawn=ROOM_SPAWNS[roomId];if(!spawn)return;
 P.position.set(spawn.x,0,spawn.z);
 syncBakeryRoomState(true);
 document.getElementById("msg").textContent="Teleported to "+roomName.textContent+".";
 updateCamera();
}
document.querySelectorAll("#roomTeleport [data-room]").forEach(button=>button.addEventListener("pointerdown",event=>{
 event.preventDefault();teleportToRoom(button.dataset.room);
}));
const hudMenuButton=document.getElementById("hudMenuButton"),hudDrawer=document.getElementById("hudDrawer");
[document.getElementById("firstPageButton"),document.getElementById("avatarButton"),document.getElementById("roomTeleport"),document.getElementById("menuGoCastle")].forEach(element=>hudDrawer.appendChild(element));
document.getElementById("menuGoCastle").hidden=false;
const musicToggle=document.getElementById("musicToggle");
const menuGoSpace=document.createElement("button");menuGoSpace.id="menuGoSpace";menuGoSpace.type="button";menuGoSpace.textContent="🚀 Go to Space";hudDrawer.insertBefore(menuGoSpace,musicToggle);
const forestMenuButton=document.createElement("button");forestMenuButton.id="menuGoForest";forestMenuButton.type="button";forestMenuButton.textContent="🌲 Go to Forest";hudDrawer.insertBefore(forestMenuButton,musicToggle);
document.getElementById("teleportBeach")?.remove();
const bakeryMusicTracks=[document.getElementById("bakeryMusic"),document.getElementById("sprinkleMusic")];
const beachMusicTracks=[document.getElementById("beachMusic")];
const destinationMusicTracks={space:[document.getElementById("spaceMusic")],forest:[document.getElementById("forestMusic")],castle:[document.getElementById("castleMusic")]};
const musicTracks=[...bakeryMusicTracks,...beachMusicTracks,...Object.values(destinationMusicTracks).flat()];
let musicTrackIndex=0,musicStarted=false,currentMusicWorld="bakery",currentMusicTrack=null,lastMusicError="",musicMuted=localStorage.getItem("bakeryMusicMuted")==="true";
function tracksForWorld(world){return destinationMusicTracks[world]||(world==="beach"?beachMusicTracks:bakeryMusicTracks)}
function activeMusicTracks(){return tracksForWorld(currentMusicWorld)}
function pauseAllMusic(){musicTracks.forEach(track=>{track.pause();track.currentTime=0})}
function playCurrentMusic(){
 if(musicMuted||musicToggle.disabled)return;
 const active=activeMusicTracks();musicTrackIndex%=active.length;currentMusicTrack=active[musicTrackIndex];musicStarted=true;
 currentMusicTrack.currentTime=0;currentMusicTrack.play().then(()=>{lastMusicError=""}).catch(error=>{lastMusicError=error?.name||"playback-error";if(currentMusicTrack===active[musicTrackIndex])musicStarted=false});
}
window.getMusicDebug=()=>({world:currentMusicWorld,track:currentMusicTrack?.id||null,started:musicStarted,muted:musicMuted,paused:currentMusicTrack?.paused??true,currentTime:currentMusicTrack?.currentTime||0,lastError:lastMusicError});
musicTracks.forEach(track=>{
 track.volume=.34;
 track.addEventListener("ended",()=>{
  const active=activeMusicTracks();
  if(track!==currentMusicTrack||musicMuted)return;
  musicTrackIndex=(musicTrackIndex+1)%active.length;
  playCurrentMusic();
 });
 track.addEventListener("error",handleMusicFailure,{once:true});
});
function updateMusicToggle(){
 musicToggle.textContent=musicMuted?"🔇 Music off":"🎵 Music on";
 musicToggle.setAttribute("aria-pressed",String(musicMuted));
}
function handleMusicFailure(){
 pauseAllMusic();musicStarted=false;currentMusicTrack=null;
 musicToggle.textContent="Music unavailable";
 musicToggle.disabled=true;
}
function startMusic(){
 if(musicMuted||musicStarted||musicToggle.disabled)return;
 playCurrentMusic();
}
window.switchWorldMusic=world=>{
 const nextWorld=world||currentPlace;
 if(nextWorld===currentMusicWorld&&musicStarted&&currentMusicTrack&&!currentMusicTrack.paused)return;
 const wasStarted=musicStarted;
 pauseAllMusic();musicTrackIndex=0;musicStarted=false;currentMusicTrack=null;currentMusicWorld=nextWorld;
 if(wasStarted&&!musicMuted)playCurrentMusic();
};
musicToggle.addEventListener("pointerdown",event=>event.stopPropagation());
musicToggle.addEventListener("click",()=>{
 musicMuted=!musicMuted;
 localStorage.setItem("bakeryMusicMuted",String(musicMuted));
 updateMusicToggle();
 if(musicMuted){pauseAllMusic();musicStarted=false;currentMusicTrack=null}
 else{musicStarted=false;startMusic()}
});
document.addEventListener("pointerdown",event=>{
 if(event.target.closest(".place")||document.getElementById("startPage").style.display==="none")startMusic();
},{passive:true});
updateMusicToggle();
function setHudMenu(open){hudDrawer.classList.toggle("open",open);hudMenuButton.setAttribute("aria-expanded",open)}
hudMenuButton.addEventListener("pointerdown",event=>{event.preventDefault();const open=!hudDrawer.classList.contains("open");if(open){closeKitchenPanels();if(currentPlace==="house")setHousePanel(false)}setHudMenu(open)});
hudDrawer.addEventListener("pointerdown",event=>{if(event.target.closest("button"))setHudMenu(false)});
document.getElementById("menuGoHouse").addEventListener("pointerdown",event=>{event.preventDefault();showHouse()});
document.getElementById("menuGoBakery").addEventListener("pointerdown",event=>{event.preventDefault();showBakery()});
document.getElementById("menuGoBeach").addEventListener("pointerdown",event=>{event.preventDefault();showBeach()});
menuGoSpace.addEventListener("pointerdown",event=>{event.preventDefault();window.runWorldTransition("Launching Space…","space",showSpace)});
document.getElementById("menuGoCastle").addEventListener("pointerdown",event=>{event.preventDefault();window.runWorldTransition("Raising the castle gates…","castle",showCastle)});
forestMenuButton.addEventListener("pointerdown",event=>{event.preventDefault();window.runWorldTransition("Growing the forest…","forest",showForest)});
const kitchenPanelIds=["recipePanel","orders","inventoryBox"];
function closeKitchenPanels(){
 kitchenPanelIds.forEach(id=>document.getElementById(id).classList.remove("hud-open"));
 document.querySelectorAll("#kitchenTools button").forEach(button=>button.classList.remove("active"));
}
document.querySelectorAll("#kitchenTools button").forEach(button=>button.addEventListener("pointerdown",event=>{
 event.preventDefault();
 const panel=document.getElementById(button.dataset.panel),willOpen=!panel.classList.contains("hud-open");
 closeKitchenPanels();setHudMenu(false);
 if(willOpen){panel.classList.add("hud-open");button.classList.add("active")}
}));
function enterKitchen(){
 teleportToRoom("kitchen");
}
function returnToBakery(){
 hideMilkshakeIngredientTags();teleportToRoom("bakery");
}
backButton.addEventListener("pointerdown",function(e){e.preventDefault();returnToBakery()});

let heldItem=null;
const grabButton=document.getElementById("grabButton");
const itemLabel=document.getElementById("itemLabel");

function updateHeldItem(){
 if(heldItem){
   heldItem.position.set(P.position.x,2.55,P.position.z-.55);
   heldItem.rotation.y=P.rotation.y;
 }
}

function grabOrDrop(){
 if(heldItem){
   heldItem.userData.held=false;
   heldItem.position.set(P.position.x,.45,P.position.z-.8);
   document.getElementById("msg").textContent="You put down the "+heldItem.userData.name+"!";
   heldItem=null;
   itemLabel.textContent="Hands: Empty";
   grabButton.innerHTML="🤲<br>GRAB";
   return;
 }
 let closest=null,closestDistance=1.8;
 grabItems.forEach(item=>{
   if(item.userData.held)return;
   let dx=item.position.x-P.position.x;
   let dz=item.position.z-P.position.z;
   let distance=Math.hypot(dx,dz);
   if(distance<closestDistance){closest=item;closestDistance=distance}
 });
 if(closest){
   heldItem=closest;
   closest.userData.held=true;
   itemLabel.textContent="Holding: "+closest.userData.emoji+" "+closest.userData.name;
   grabButton.innerHTML="👇<br>DROP";
   document.getElementById("msg").textContent="You grabbed the "+closest.userData.name+"!";
 }else{
   document.getElementById("msg").textContent="Walk closer to a food item, then tap GRAB.";
 }
}
grabButton.addEventListener("pointerdown",e=>{e.preventDefault();grabOrDrop()});

let followCamera=true;let cameraAngle=.65;let cameraHeight=6.8;let cameraDistance=9;
const cameraTargetPosition=new THREE.Vector3();
const cameraLookAtPosition=new THREE.Vector3();
let shadowAnchorX=NaN,shadowAnchorZ=NaN;

function updateCamera(){
 if(!followCamera)return;
 cameraTargetPosition.set(
   P.position.x+Math.sin(cameraAngle)*cameraDistance,
   cameraHeight+P.position.y,
   P.position.z+Math.cos(cameraAngle)*cameraDistance
 );
 C.position.lerp(cameraTargetPosition,.09);
 cameraLookAtPosition.set(P.position.x,P.position.y+1.2,P.position.z);
 C.lookAt(cameraLookAtPosition);
 // The connected world is much larger than DirectionalLight's default
 // -5..5 shadow volume. Re-center a larger, still high-resolution volume as
 // the player travels, moving it in half-tile increments to avoid shimmer.
 const anchorX=Math.round(P.position.x*2)/2,anchorZ=Math.round(P.position.z*2)/2;
 if(anchorX!==shadowAnchorX||anchorZ!==shadowAnchorZ){
  shadowAnchorX=anchorX;shadowAnchorZ=anchorZ;
  sun.position.set(anchorX+7,12,anchorZ+9);
  sun.target.position.set(anchorX,0,anchorZ);
  sun.target.updateMatrixWorld();
 }
}

const ingredientGrab=document.getElementById("ingredientGrab");
let selectedIngredient=null;
function updateIngredientGrab(){
 selectedIngredient=null;
 if(!inKitchen){ingredientGrab.style.display="none";return}
 let best=1.75;
 ingredientModels.forEach(item=>{
   if(!item.visible)return;
   let d=Math.hypot(item.position.x-P.position.x,item.position.z-P.position.z);
   if(d<best){best=d;selectedIngredient=item}
 });
 if(!selectedIngredient){ingredientGrab.style.display="none";return}
 let point=selectedIngredient.position.clone();point.y+=1.05;point.project(C);
 ingredientGrab.style.left=((point.x*.5+.5)*innerWidth-55)+"px";
 ingredientGrab.style.top=((-point.y*.5+.5)*innerHeight-45)+"px";
 ingredientGrab.innerHTML="🤲 GRAB<br>"+selectedIngredient.userData.emoji+" "+selectedIngredient.userData.ingredient;
 ingredientGrab.style.display="block";
}
ingredientGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const r=recipes[recipeIndex];
 const needed=r.items[addedIngredients]||"";
 if(needed.includes(selectedIngredient.userData.ingredient) ||
   (selectedIngredient.userData.ingredient==="Egg" && needed.includes("Eggs"))){
   addedIngredients++;showRecipe();
   document.getElementById("msg").textContent="You grabbed "+selectedIngredient.userData.emoji+" "+selectedIngredient.userData.ingredient+"!";
   if(addedIngredients>=r.items.length){
     document.getElementById("msg").textContent+=" You have everything! Tap the recipe button to finish.";
     document.getElementById("makeFood").style.display="block";
   }
 }else{
   document.getElementById("msg").textContent="The recipe needs "+needed+" next.";
 }
});


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
const lookStick=document.getElementById("lookStick");
let looking=false,lookX=0,lookY=0;
function setLook(e){
 let r=lookPad.getBoundingClientRect();
 let dx=e.clientX-(r.left+60),dy=e.clientY-(r.top+60);
 let d=Math.hypot(dx,dy),max=36;
 if(d>max){dx*=max/d;dy*=max/d}
 lookStick.style.transform=`translate(${dx}px,${dy}px)`;
 lookX=dx/max;lookY=dy/max;
}
lookPad.addEventListener("pointerdown",e=>{e.preventDefault();looking=true;lookPad.setPointerCapture(e.pointerId);setLook(e)});
lookPad.addEventListener("pointermove",e=>{if(looking){e.preventDefault();setLook(e)}});
function stopLook(){looking=false;lookX=lookY=0;lookStick.style.transform="translate(0,0)"}
lookPad.addEventListener("pointerup",stopLook);lookPad.addEventListener("pointercancel",stopLook);
function moveCameraControl(dt){
 if(!looking)return;
 cameraAngle-=lookX*2.2*dt;
 cameraHeight=Math.max(3.2,Math.min(11,cameraHeight-lookY*5*dt));
}

const stoveButton=document.getElementById("stoveButton");
let stoveIngredients=[];
function nearStove(){
 const station=KITCHEN_STATIONS.stove;
 return inKitchen && Math.hypot(P.position.x-station.x,P.position.z-station.z)<2.2;
}
function updateStoveButton(){
 if(!nearStove()){stoveButton.style.display="none";return}
 stoveButton.style.display="block";
 const r=recipes[recipeIndex];
 if(addedIngredients<r.items.length){
   stoveButton.textContent="🔥 ADD "+r.items[addedIngredients];
 }else{
   stoveButton.textContent="🍳 COOK "+r.emoji+" "+r.name;
 }
}
stoveButton.addEventListener("pointerdown",e=>{
 e.preventDefault();
 const r=recipes[recipeIndex];
 if(addedIngredients<r.items.length){
   const item=r.items[addedIngredients];
   stoveIngredients.push(item);
   addedIngredients++;
   showRecipe();
   document.getElementById("msg").textContent="You put "+item+" into the stove! 🔥";
 }else{
   document.getElementById("msg").textContent="The stove cooked "+r.emoji+" "+r.name+"! Take it to the order TV to serve. 📺";
   if(window.bakeryProductCompleted)window.bakeryProductCompleted(r.name,"stove");
   stoveIngredients=[];
   recipeIndex=(recipeIndex+1)%recipes.length;
   addedIngredients=0;showRecipe();
 }
});

let playerTurn=0;

const avatarShop=document.getElementById("avatarShop");
const shopMessage=document.getElementById("shopMessage");
const ownedShirts=new Set(["Purple"]);
const ownedPants=new Set(["Blue"]);

const skins=[
 {name:"Light",color:0xf2bb91,emoji:"🏻"},
 {name:"Warm",color:0xd99568,emoji:"🏼"},
 {name:"Tan",color:0xb97850,emoji:"🏽"},
 {name:"Deep",color:0x7b4932,emoji:"🏾"},
 {name:"Dark",color:0x4b2b20,emoji:"🏿"}
];
const shirts=[
 {name:"Purple",color:0xb77cff,price:0,emoji:"💜"},
 {name:"Pink",color:0xff73aa,price:10,emoji:"🩷"},
 {name:"Green",color:0x55c985,price:12,emoji:"💚"},
 {name:"Blue",color:0x5b9cff,price:15,emoji:"💙"},
 {name:"Gold",color:0xffc83d,price:20,emoji:"💛"}
];
const pants=[
 {name:"Blue",color:0x5870c8,price:0,emoji:"👖"},
 {name:"Black",color:0x292b35,price:10,emoji:"⬛"},
 {name:"Pink",color:0xd95b91,price:12,emoji:"🩷"},
 {name:"Green",color:0x397b55,price:15,emoji:"🟩"},
 {name:"White",color:0xf1f1f1,price:18,emoji:"⬜"}
];

function materialColor(mesh,color){mesh.material.color.setHex(color)}
function chooseSkin(s){
 materialColor(playerHead,s.color);materialColor(playerLeftArm,s.color);materialColor(playerRightArm,s.color);
 materialColor(pvHead,s.color);materialColor(pvArm1,s.color);materialColor(pvArm2,s.color);saved.skin=s.color;saveWorld();
 shopMessage.textContent="Skin tone changed to "+s.name+".";
 renderShop();
}
function buyWear(type,item){
 const owned=type==="shirt"?ownedShirts:ownedPants;
 if(!owned.has(item.name)){
  if(money<item.price){shopMessage.textContent="You need $"+item.price+" to buy that.";return}
  money-=item.price;updateMoney();owned.add(item.name);
  shopMessage.textContent="You bought the "+item.name+" "+type+"! 🎉";
 }
 if(type==="shirt"){materialColor(playerShirt,item.color);materialColor(pvShirt,item.color);saved.shirt=item.color}
 else{materialColor(playerLeftLeg,item.color);materialColor(playerRightLeg,item.color);materialColor(pvLeg1,item.color);materialColor(pvLeg2,item.color);saved.pants=item.color}
 saveWorld();
 renderShop();
}
function renderShop(){
 skinOptions.innerHTML="";shirtOptions.innerHTML="";pantsOptions.innerHTML="";
 skins.forEach(s=>{let b=document.createElement("button");b.className="option"+(playerHead.material.color.getHex()===s.color?" selected":"");b.setAttribute("aria-pressed",playerHead.material.color.getHex()===s.color);b.textContent=s.emoji+" "+s.name;b.onclick=()=>chooseSkin(s);skinOptions.appendChild(b)});
 shirts.forEach(i=>{let b=document.createElement("button");let selected=playerShirt.material.color.getHex()===i.color;b.className="option"+(selected?" selected":"");b.setAttribute("aria-pressed",selected);let own=ownedShirts.has(i.name);b.textContent=i.emoji+" "+i.name+(own?" ✓":" $"+i.price);b.onclick=()=>buyWear("shirt",i);shirtOptions.appendChild(b)});
 pants.forEach(i=>{let b=document.createElement("button");let selected=playerLeftLeg.material.color.getHex()===i.color;b.className="option"+(selected?" selected":"");b.setAttribute("aria-pressed",selected);let own=ownedPants.has(i.name);b.textContent=i.emoji+" "+i.name+(own?" ✓":" $"+i.price);b.onclick=()=>buyWear("pants",i);pantsOptions.appendChild(b)});
}
avatarButton.addEventListener("pointerdown",e=>{e.preventDefault();renderShop();avatarShop.style.display="block"});
closeAvatar.addEventListener("pointerdown",e=>{e.preventDefault();avatarShop.style.display="none"});
document.getElementById("closeAvatarTop").addEventListener("pointerdown",e=>{e.preventDefault();avatarShop.style.display="none"});
let inStorage=false;
const perfState={fps:0,frameMs:0,drawCalls:0,triangles:0,pixelRatio:R.getPixelRatio()};
let perfFrames=0,perfSampleStart=performance.now();
window.getGamePerformance=()=>({...perfState});
const perfOverlay=new URLSearchParams(location.search).has("perf")?Object.assign(document.createElement("div"),{textContent:"Measuring…"}):null;
if(perfOverlay){perfOverlay.style.cssText="position:fixed;right:8px;bottom:8px;z-index:9999;padding:5px 8px;border-radius:6px;background:#000b;color:#fff;font:12px monospace;pointer-events:none";document.body.appendChild(perfOverlay)}
let walkStrength=0;
function updatePlayerWalkAnimation(isMoving,dt){
 const easing=1-Math.exp(-dt*14);
 const groundY=currentPlace==="castle"?castleElevationAt(P.position.x,P.position.z,P.position.y):0;
 const seated=Boolean(window.isPlayerSeated?.());
 if(seated){
  walkStrength=THREE.MathUtils.lerp(walkStrength,0,easing);
  playerLeftArm.rotation.x=THREE.MathUtils.lerp(playerLeftArm.rotation.x,0,easing);
  playerRightArm.rotation.x=THREE.MathUtils.lerp(playerRightArm.rotation.x,0,easing);
  playerLeftLeg.rotation.x=THREE.MathUtils.lerp(playerLeftLeg.rotation.x,-Math.PI/2,easing);
  playerRightLeg.rotation.x=THREE.MathUtils.lerp(playerRightLeg.rotation.x,-Math.PI/2,easing);
  P.rotation.z=THREE.MathUtils.lerp(P.rotation.z,0,easing);
  P.position.y=THREE.MathUtils.lerp(P.position.y,groundY,easing);
  return;
 }
 walkStrength=THREE.MathUtils.lerp(walkStrength,isMoving?1:0,easing);
 if(isMoving)walk+=dt*12;
 const swing=Math.sin(walk)*.55*walkStrength;
 playerLeftArm.rotation.x=THREE.MathUtils.lerp(playerLeftArm.rotation.x,swing,easing);
 playerRightArm.rotation.x=THREE.MathUtils.lerp(playerRightArm.rotation.x,-swing,easing);
 playerLeftLeg.rotation.x=THREE.MathUtils.lerp(playerLeftLeg.rotation.x,-swing,easing);
 playerRightLeg.rotation.x=THREE.MathUtils.lerp(playerRightLeg.rotation.x,swing,easing);
 P.rotation.z=THREE.MathUtils.lerp(P.rotation.z,Math.sin(walk)*.035*walkStrength,easing);
 P.position.y=THREE.MathUtils.lerp(P.position.y,groundY+Math.abs(Math.sin(walk))*.06*walkStrength,easing);
}
let clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.04);const worldShadows=currentPlace!=="beach";if(sun.castShadow!==worldShadows)sun.castShadow=worldShadows;moveCameraControl(dt);let playerMoved=false;if(!window.isPlayerSeated?.()&&Math.abs(vx)+Math.abs(vz)>.08){
// Movement is relative to the camera direction.
const forwardX=-Math.sin(cameraAngle);
const forwardZ=-Math.cos(cameraAngle);
const rightX=Math.cos(cameraAngle);
const rightZ=-Math.sin(cameraAngle);
const worldX=rightX*vx+forwardX*(-vz);
const worldZ=rightZ*vx+forwardZ*(-vz);
let nextX=P.position.x+worldX*PLAYER_MOVE_SPEED*dt;
let nextZ=P.position.z+worldZ*PLAYER_MOVE_SPEED*dt;
if(Math.hypot(worldX,worldZ)>.08){
  playerTurn=Math.atan2(worldX,worldZ);
  P.rotation.y=playerTurn;
}
// The ASCII map owns bakery collision; the centralized house dimensions own
// the home boundary so the avatar cannot walk beyond the enlarged floor.
const canMove=currentPlace==="bakery"?canWalkAt(nextX,nextZ):
 currentPlace==="house"?canWalkInHouse(nextX,nextZ):
 currentPlace==="beach"?canWalkOnBeach(nextX,nextZ):
 currentPlace==="space"?ensureSpaceWorld().canWalk(nextX,nextZ):
 currentPlace==="forest"?Boolean(forestWorld&&forestWorld.canWalk(nextX,nextZ)):
 currentPlace==="castle"?canWalkInCastle(nextX,nextZ):true;
if(canMove){P.position.x=nextX;P.position.z=nextZ;playerMoved=true}
syncBakeryRoomState();}else{syncBakeryRoomState()}updatePlayerWalkAnimation(playerMoved,dt);updateCastleFloorPresentation();
// Sink the avatar slightly while wading and expose the state for future splash
// effects. Deep water remains traversable but never lets the avatar leave bounds.
window.houseWorldApi?.update?.(dt);
window.beachTownApi?.update?.(dt,currentPlace==="beach",C);
if(currentPlace==="beach"){
 const wadeDepth=THREE.MathUtils.clamp((BEACH_CONFIG.waterEdgeZ-P.position.z)/5,0,1);
 P.userData.wading=wadeDepth>0;
 P.position.y-=wadeDepth*.18;
}else P.userData.wading=false;
updateCamera();updateHeldItem();updateIngredientGrab();updateStoveButton();customers.forEach((q,i)=>{let u=q.userData,targetX,targetZ;
// Everyone stands in one straight line at the same x position
if(u.stage===0){targetX=3.8;targetZ=-1.8+i*1.15}
else if(u.stage===1){targetX=3.8;targetZ=-2.5}
else{targetX=6.8;targetZ=4.8}
let dx=targetX-q.position.x,dz=targetZ-q.position.z,d=Math.hypot(dx,dz);
if(d>.12){q.position.x+=dx/d*.025;q.position.z+=dz/d*.025;q.rotation.z=Math.sin(Date.now()*.012+i)*.025}
else if(u.stage===0 && i===0){u.stage=1}
else if(u.stage===1){if(--u.wait<0){u.stage=2;document.getElementById("msg").textContent="Use the bakery order TV to finish orders and earn money! 📺"}}
else if(u.stage===2){S.remove(q);customers.splice(i,1)}
});window.objectActions?.update();R.render(S,C);perfFrames++;const now=performance.now(),elapsed=now-perfSampleStart;if(elapsed>=500){perfState.fps=Math.round(perfFrames*1000/elapsed);perfState.frameMs=+(elapsed/perfFrames).toFixed(1);perfState.drawCalls=R.info.render.calls;perfState.triangles=R.info.render.triangles;perfFrames=0;perfSampleStart=now;if(perfOverlay)perfOverlay.textContent=`${perfState.fps} FPS · ${perfState.frameMs} ms · ${perfState.drawCalls} calls · ${perfState.triangles} tris`}}animate();
addEventListener('resize',()=>{C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);R.setPixelRatio(Math.min(devicePixelRatio,1.25));perfState.pixelRatio=R.getPixelRatio()});

// Keep the bakery and house as two separate places.
const bakeryObjects=S.children.filter(obj=>obj!==P && obj!==C && !obj.isLight);
const house=new THREE.Group();house.visible=false;S.add(house);
let spaceWorld=null;
function ensureSpaceWorld(){
 if(!spaceWorld){
  const factory=window.worldFactories&&window.worldFactories.space;
  if(!factory)throw new Error("Space world factory is unavailable");
  spaceWorld=factory(THREE);spaceWorld.group.visible=false;S.add(spaceWorld.group);
 }
 return spaceWorld;
}
function hideSpaceWorld(){if(spaceWorld)spaceWorld.group.visible=false}
function destroySpaceWorld(){if(spaceWorld){spaceWorld.dispose();spaceWorld=null}}
window.destroySpaceWorld=destroySpaceWorld;
// Large destinations are lazy factories: entering creates only that world's
// resources and leaving can release its geometry/materials immediately.
let forestWorld=null;
function ensureForestWorld(){
 if(!forestWorld){
  if(!window.worldFactories?.forest)throw new Error("Forest world factory did not load");
  forestWorld=window.worldFactories.forest.create(S);
 }
 return forestWorld;
}
function destroyForestWorld(){if(forestWorld){forestWorld.destroy();forestWorld=null}}
// Beach is a separate, deterministic destination. Repeated palms use instancing,
// the water is intentionally unlit, and distant/repeated scenery does not cast
// shadows so the iPad render budget stays focused on the player.
const beach=new THREE.Group();beach.name="beach-world";beach.visible=false;S.add(beach);
// The full destination is roughly 50x50. The surf is part of the playable
// space, so players can wade well past the foam without leaving the world.
const BEACH_CONFIG={halfWidth:40,nearZ:40,farZ:-40,waterEdgeZ:-5.5,deepWaterZ:-25,spawn:{x:0,z:15},camera:{angle:.22,height:10.5,distance:15.5}};
const beachSandMaterial=new THREE.MeshStandardMaterial({color:0xf2d38d,roughness:1});
const beachSand=new THREE.Mesh(new THREE.BoxGeometry(80,.28,45.5),beachSandMaterial);
// The large receiver crossed the moving directional-light frustum and produced
// a dark rectangular edge on tablets. Beach props still carry local shading.
beachSand.position.set(0,-.08,17.25);beachSand.receiveShadow=false;beach.add(beachSand);
const beachWaterMaterial=new THREE.MeshBasicMaterial({color:0x39b9d1,transparent:true,opacity:.82});
const beachWater=new THREE.Mesh(new THREE.PlaneGeometry(80,34.5),beachWaterMaterial);
beachWater.rotation.x=-Math.PI/2;beachWater.position.set(0,.04,-22.75);beach.add(beachWater);
const foamMaterial=new THREE.MeshBasicMaterial({color:0xe9ffff,transparent:true,opacity:.88});
[-5.65,-6.05,-6.55].forEach((z,index)=>{const foam=new THREE.Mesh(new THREE.PlaneGeometry(79-index*.7,.14),foamMaterial);foam.rotation.x=-Math.PI/2;foam.position.set(0,.065,z);beach.add(foam)});
const palmPositions=[[-22,-2],[-20,8],[-18,20],[-11,4],[-9,18],[-3,9],[5,20],[9,3],[13,14],[19,5],[22,20],[22,-1]];
const palmTrunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.28,3.8,7),new THREE.MeshStandardMaterial({color:0x9b6943,roughness:1}),palmPositions.length);
const palmLeaves=new THREE.InstancedMesh(new THREE.ConeGeometry(1.35,.22,7),new THREE.MeshStandardMaterial({color:0x35a85d,roughness:1,side:THREE.DoubleSide}),palmPositions.length*3);
const beachMatrix=new THREE.Matrix4(),beachQuat=new THREE.Quaternion(),beachScale=new THREE.Vector3(1,1,1),beachPos=new THREE.Vector3();
palmPositions.forEach(([x,z],index)=>{
 beachMatrix.makeTranslation(x,1.9,z);palmTrunks.setMatrixAt(index,beachMatrix);
 for(let leaf=0;leaf<3;leaf++){
  beachQuat.setFromEuler(new THREE.Euler(Math.PI/2,(leaf/3)*Math.PI*2,0));
  beachPos.set(x,3.85,z);beachMatrix.compose(beachPos,beachQuat,beachScale);palmLeaves.setMatrixAt(index*3+leaf,beachMatrix);
 }
});
palmTrunks.castShadow=palmTrunks.receiveShadow=false;palmLeaves.castShadow=palmLeaves.receiveShadow=false;beach.add(palmTrunks,palmLeaves);
const beachPropMaterials={wood:new THREE.MeshStandardMaterial({color:0xb37a4c,roughness:1}),white:new THREE.MeshStandardMaterial({color:0xfff5df,roughness:1}),pink:new THREE.MeshStandardMaterial({color:0xff79a8,roughness:1}),blue:new THREE.MeshStandardMaterial({color:0x55bde8,roughness:1}),yellow:new THREE.MeshStandardMaterial({color:0xffd75b,roughness:1})};
function beachMesh(geometry,material,x,y,z,parent=beach){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh}
// Umbrellas, towels, surf boards, and a lifeguard perch give the open sand landmarks.
[[-15,0,3,beachPropMaterials.pink],[0,0,7,beachPropMaterials.blue],[15,0,1,beachPropMaterials.yellow],[10,0,17,beachPropMaterials.pink]].forEach(([x,,z,color])=>{
 beachMesh(new THREE.CylinderGeometry(.07,.09,2.5,6),beachPropMaterials.wood,x,1.25,z);
 beachMesh(new THREE.ConeGeometry(2,.65,12),color,x,2.55,z);
});
[[-14.8,4.9,beachPropMaterials.blue],[-.2,9.9,beachPropMaterials.pink],[14.8,3.9,beachPropMaterials.yellow],[9.8,19.9,beachPropMaterials.blue],[-8,16,beachPropMaterials.pink]].forEach(([x,z,color])=>beachMesh(new THREE.BoxGeometry(2.4,.05,1.15),color,x,.09,z));
[-12,-8,8,12].forEach((x,index)=>{const board=beachMesh(new THREE.CapsuleGeometry(.3,1.6,4,8),index%2?beachPropMaterials.pink:beachPropMaterials.blue,x,.8,-4.7);board.rotation.z=.1*(index%2?1:-1)});
const beachSkinMaterials=[0x8b5a3c,0xc98962,0xf2c6a0].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
const beachWearMaterials=[beachPropMaterials.pink,beachPropMaterials.blue,beachPropMaterials.yellow,new THREE.MeshStandardMaterial({color:0x77d891,roughness:1})];
const BEACH_NPCS=[
 {x:-15,z:4.8,sitting:true,skin:1,wear:1,turn:.3},{x:0,z:9.8,sitting:true,skin:2,wear:0,turn:-.5},
 {x:-7,z:-2.8,sitting:false,skin:0,wear:2,turn:2.6},{x:13,z:-2.2,sitting:false,skin:1,wear:3,turn:-2.4},
 {x:-19,z:12,sitting:false,skin:2,wear:0,turn:.8},{x:10,z:19.8,sitting:true,skin:0,wear:3,turn:2.9},
 {x:18,z:8,sitting:false,skin:0,wear:1,turn:-.8},{x:-8,z:16,sitting:true,skin:1,wear:2,turn:2.2},
 {x:4,z:-10,sitting:false,skin:2,wear:3,turn:.2},{x:-15,z:-8,sitting:false,skin:1,wear:0,turn:2.8}
];
const npcBoxGeometry=new THREE.BoxGeometry(1,1,1),npcHeadGeometry=new THREE.SphereGeometry(.38,8,6),npcParentQuaternion=new THREE.Quaternion(),npcLocalQuaternion=new THREE.Quaternion(),npcWorldQuaternion=new THREE.Quaternion(),npcWorldPosition=new THREE.Vector3(),npcPartScale=new THREE.Vector3();
function beachNpcMatrix(npc,localX,localY,localZ,scaleX,scaleY,scaleZ,rotationX=0){
 npcParentQuaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),npc.turn);npcLocalQuaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),rotationX);npcWorldQuaternion.copy(npcParentQuaternion).multiply(npcLocalQuaternion);
 npcWorldPosition.set(localX,localY,localZ).applyQuaternion(npcParentQuaternion).add(new THREE.Vector3(npc.x,0,npc.z));npcPartScale.set(scaleX,scaleY,scaleZ);return beachMatrix.compose(npcWorldPosition,npcWorldQuaternion,npcPartScale);
}
function npcInstances(entries,geometry,material,write){if(!entries.length)return;const instances=new THREE.InstancedMesh(geometry,material,entries.length);entries.forEach((entry,index)=>instances.setMatrixAt(index,write(entry)));instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();instances.castShadow=instances.receiveShadow=false;beach.add(instances)}
beachWearMaterials.forEach((wearMaterial,wear)=>npcInstances(BEACH_NPCS.filter(npc=>npc.wear===wear),npcBoxGeometry,wearMaterial,npc=>beachNpcMatrix(npc,0,npc.sitting?1.03:1.55,0,.72,.85,.42)));
beachSkinMaterials.forEach((skinMaterial,skin)=>{
 const people=BEACH_NPCS.filter(npc=>npc.skin===skin);
 npcInstances(people,npcHeadGeometry,skinMaterial,npc=>beachNpcMatrix(npc,0,npc.sitting?1.72:2.35,0,1,1,1));
 const limbs=people.flatMap(npc=>[{npc,x:-.48,y:npc.sitting?1.16:1.5,z:0,sx:.2,sy:.72,sz:.2},{npc,x:.48,y:npc.sitting?1.16:1.5,z:0,sx:.2,sy:.72,sz:.2},{npc,x:-.22,y:.58,z:npc.sitting?.34:0,sx:.23,sy:.85,sz:.25,rx:npc.sitting?Math.PI/2:0},{npc,x:.22,y:.58,z:npc.sitting?.34:0,sx:.23,sy:.85,sz:.25,rx:npc.sitting?Math.PI/2:0}]);
 npcInstances(limbs,npcBoxGeometry,skinMaterial,part=>beachNpcMatrix(part.npc,part.x,part.y,part.z,part.sx,part.sy,part.sz,part.rx||0));
});
npcInstances(BEACH_NPCS.filter(npc=>npc.sitting),npcBoxGeometry,beachPropMaterials.wood,npc=>beachNpcMatrix(npc,0,.48,-.05,1.25,.18,.65));
const beachStructureColliders=[];
function addBeachStructure(factoryName,x,z){
 const factory=window.beachStructureFactories&&window.beachStructureFactories[factoryName];
 if(!factory)return;
 const structure=factory(THREE);structure.group.position.set(x,0,z);beach.add(structure.group);
 structure.collisionBoxes.forEach(box=>{
  if("minX" in box)beachStructureColliders.push({minX:x+box.minX,maxX:x+box.maxX,minZ:z+box.minZ,maxZ:z+box.maxZ});
  else beachStructureColliders.push({minX:x+box.x-box.width/2,maxX:x+box.x+box.width/2,minZ:z+box.z-box.depth/2,maxZ:z+box.z+box.depth/2});
 });
}
addBeachStructure("cafe",-14,12);
addBeachStructure("surfShop",14,12);
const beachTown=window.createBeachTown?.(THREE)||null;
if(beachTown){beach.add(beachTown.group);beachStructureColliders.push(...beachTown.collisions);window.beachTownApi=beachTown}
function canWalkOnBeach(x,z){
 if(x<-BEACH_CONFIG.halfWidth+.55||x>BEACH_CONFIG.halfWidth-.55||z>BEACH_CONFIG.nearZ-.55||z<BEACH_CONFIG.farZ+.55)return false;
 const radius=.3;
 return !beachStructureColliders.some(box=>x>box.minX-radius&&x<box.maxX+radius&&z>box.minZ-radius&&z<box.maxZ+radius);
}

// The castle is intentionally lazy: its meshes do not consume GPU resources
// until the destination is visited, and the shared world loader can dispose it.
const CASTLE_CONFIG={size:30,worldSize:40,spawn:{x:0,z:18},camera:{angle:0,height:11,distance:16},gateHalfWidth:2.25,frontWallZ:14,backWallZ:-14,upperY:4.35};
let castle=null;
function castleBox(parent,geometry,material,x,y,z,cast=false){
 const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=cast;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function createCastleWorld(){
 if(castle)return castle;
 const group=new THREE.Group();group.name="castle-world";group.visible=false;
 const geometries={
  ground:new THREE.BoxGeometry(40,.25,40),wallLong:new THREE.BoxGeometry(11.45,7.5,.65),wallSide:new THREE.BoxGeometry(.65,7.5,28),
  tower:new THREE.CylinderGeometry(1.65,1.9,10.2,10),merlon:new THREE.BoxGeometry(.72,.7,.72),floor:new THREE.BoxGeometry(27,.18,27),
  upperMain:new THREE.BoxGeometry(21,.22,25.8),upperLanding:new THREE.BoxGeometry(4.9,.22,2.7),ramp:new THREE.BoxGeometry(3.5,.22,20),rampRail:new THREE.BoxGeometry(.16,.7,20),
  column:new THREE.CylinderGeometry(.32,.38,3.5,8),table:new THREE.BoxGeometry(4,.25,1.3),bench:new THREE.BoxGeometry(2.8,.28,.65),
  body:new THREE.BoxGeometry(.72,.9,.42),head:new THREE.SphereGeometry(.38,8,6),limb:new THREE.BoxGeometry(.2,.75,.2)
 };
 const materials={grass:new THREE.MeshStandardMaterial({color:0x73a85c,roughness:1}),stone:new THREE.MeshStandardMaterial({color:0x9aa4b3,roughness:.92}),
  darkStone:new THREE.MeshStandardMaterial({color:0x687384,roughness:1}),floor:new THREE.MeshStandardMaterial({color:0xb8a789,roughness:1}),wood:new THREE.MeshStandardMaterial({color:0x71452d,roughness:1}),
  upperFloor:new THREE.MeshStandardMaterial({color:0xc8b99b,roughness:1,transparent:true}),gold:new THREE.MeshStandardMaterial({color:0xe9bd42,roughness:.55}),red:new THREE.MeshStandardMaterial({color:0xa73546,roughness:.9}),blue:new THREE.MeshStandardMaterial({color:0x355fb3,roughness:.9}),skin:new THREE.MeshStandardMaterial({color:0xd69a72,roughness:1})};
 castleBox(group,geometries.ground,materials.grass,0,-.16,0);
 castleBox(group,geometries.floor,materials.floor,0,-.03,0);
 // Two front segments preserve a clearly readable, collision-matched gate.
 castleBox(group,geometries.wallLong,materials.stone,-8.0,3.75,CASTLE_CONFIG.frontWallZ);
 castleBox(group,geometries.wallLong,materials.stone,8.0,3.75,CASTLE_CONFIG.frontWallZ);
 castleBox(group,new THREE.BoxGeometry(4.5,2.15,.7),materials.stone,0,6.45,CASTLE_CONFIG.frontWallZ);
 castleBox(group,new THREE.BoxGeometry(28,.65,.65),materials.darkStone,0,7.75,CASTLE_CONFIG.backWallZ);
 castleBox(group,new THREE.BoxGeometry(28,7.5,.65),materials.stone,0,3.75,CASTLE_CONFIG.backWallZ);
 castleBox(group,geometries.wallSide,materials.stone,-14,3.75,0);
 castleBox(group,geometries.wallSide,materials.stone,14,3.75,0);
 [[-14,14],[14,14],[-14,-14],[14,-14]].forEach(([x,z])=>castleBox(group,geometries.tower,materials.darkStone,x,5.1,z));
 // One instanced batch keeps the much larger two-storey silhouette cheap.
 const merlonPositions=[];
 for(let x=-13.2;x<=13.2;x+=1.3){merlonPositions.push([x,14],[x,-14])}
 for(let z=-12.7;z<=12.7;z+=1.3){merlonPositions.push([-14,z],[14,z])}
 const merlons=new THREE.InstancedMesh(geometries.merlon,materials.stone,merlonPositions.length),merlonMatrix=new THREE.Matrix4();
 merlonPositions.forEach(([x,z],index)=>{merlonMatrix.makeTranslation(x,8,z);merlons.setMatrixAt(index,merlonMatrix)});
 merlons.instanceMatrix.needsUpdate=true;merlons.computeBoundingSphere();merlons.receiveShadow=true;group.add(merlons);
 // Three slabs create a complete second-storey deck while preserving one
 // deliberate opening for the ramp. The large slab spans the hall; the two
 // west landings close the floor around the top and bottom of the opening.
 const upperFloorMeshes=[
  castleBox(group,geometries.upperMain,materials.upperFloor,2.45,CASTLE_CONFIG.upperY,0),
  castleBox(group,geometries.upperLanding,materials.upperFloor,-10.5,CASTLE_CONFIG.upperY,-11.55),
  castleBox(group,geometries.upperLanding,materials.upperFloor,-10.5,CASTLE_CONFIG.upperY,11.55)
 ];
 upperFloorMeshes.forEach(mesh=>{mesh.userData.castleUpperFloor=true});
 // A broad ramp is easier to steer on touch screens than narrow stairs.
 const ramp=castleBox(group,geometries.ramp,materials.darkStone,-10.6,CASTLE_CONFIG.upperY/2,0);
 ramp.rotation.x=Math.atan2(CASTLE_CONFIG.upperY,20);
 // Rails trace the open edge rather than breaking up the usable floor. The
 // west wall protects the other side, and the top stays open as the entrance.
 castleBox(group,new THREE.BoxGeometry(.22,1,20.25),materials.gold,-8.35,4.9,.1);
 castleBox(group,new THREE.BoxGeometry(4.25,1,.22),materials.gold,-10.45,4.9,10.25);
 [-12.4,-8.8].forEach(x=>{const rail=castleBox(group,geometries.rampRail,materials.gold,x,CASTLE_CONFIG.upperY/2+.42,0);rail.rotation.x=ramp.rotation.x});
 // Great-hall landmarks: a carpeted aisle, throne dais, banquet tables,
 // columns and banners make entering through the gate feel consequential.
 castleBox(group,new THREE.BoxGeometry(3.2,.06,24),materials.red,0,.13,0);
 castleBox(group,new THREE.BoxGeometry(5,.35,2.2),materials.darkStone,0,.25,-11.2);
 const throne=castleBox(group,new THREE.BoxGeometry(1.7,2.4,.8),materials.gold,0,1.45,-11.35);throne.castShadow=true;
 [-7,7].forEach(x=>{
  castleBox(group,geometries.table,materials.wood,x,1,-4.4);
  castleBox(group,geometries.bench,materials.wood,x-.2,.55,-3.25);castleBox(group,geometries.bench,materials.wood,x+.2,.55,-5.55);
 });
 [-9,-5,5,9].forEach(x=>castleBox(group,geometries.column,materials.stone,x,1.75,-8.5));
 [-7.5,7.5].forEach(x=>{const banner=castleBox(group,new THREE.BoxGeometry(1.7,2.5,.08),x<0?materials.red:materials.blue,x,3.35,-12.62);banner.receiveShadow=false});
 // A reading nook and royal map table give the second storey its own purpose.
 [9.5,11.25].forEach(x=>castleBox(group,new THREE.BoxGeometry(1.45,1.9,.45),materials.wood,x,5.35,5.9));
 castleBox(group,new THREE.CylinderGeometry(1.25,1.25,.28,10),materials.wood,5.3,4.62,-10.8);
 castleBox(group,new THREE.CylinderGeometry(.08,.08,2.3,6),materials.gold,0,5.55,-11.7);
 const royalFlag=castleBox(group,new THREE.BoxGeometry(2.2,1.35,.08),materials.red,1.1,6.15,-11.65);royalFlag.receiveShadow=false;
 function guard(x,z,turn,color){
  const npc=new THREE.Group();castleBox(npc,geometries.body,color,0,1.5,0);castleBox(npc,geometries.head,materials.skin,0,2.3,0);
  [-.48,.48].forEach(px=>castleBox(npc,geometries.limb,materials.skin,px,1.45,0));[-.22,.22].forEach(px=>castleBox(npc,geometries.limb,materials.darkStone,px,.58,0));
  const helmet=castleBox(npc,new THREE.ConeGeometry(.48,.7,8),materials.darkStone,0,2.78,0);helmet.receiveShadow=false;
  npc.position.set(x,0,z);npc.rotation.y=turn;group.add(npc);
 }
 guard(-3.3,12.2,0,materials.red);guard(3.3,12.2,0,materials.blue);guard(-4,-10,Math.PI,materials.red);guard(4,-10,Math.PI,materials.blue);
 group.userData.lifecycle={destination:"castle",footprint:"30x30",stories:2,lazy:true,dispose:"window.worldFactories.castle.destroy()",estimatedMeshes:group.children.length};
 group.userData.upperFloorMeshes=upperFloorMeshes;
 group.userData.upperFloorMaterial=materials.upperFloor;
 group.userData.debug=()=>({footprint:"30x30",stories:2,upperFloor:"full-deck",upperFloorArea:568.3,walkableCoverage:"85%",rampOpening:{minX:-12.95,maxX:-8.05,minZ:-10.2,maxZ:10.3},floorGhosted:materials.upperFloor.opacity<1,drawCallEstimate:group.children.length,instancedBattlements:merlonPositions.length,playerFloor:P.position.y>2?2:1});
 group.userData.resources={geometries:Object.values(geometries),materials:Object.values(materials)};
 S.add(group);castle=group;return group;
}
function destroyCastleWorld(){
 if(!castle)return;
 S.remove(castle);const resources=castle.userData.resources;
 resources.geometries.forEach(resource=>resource.dispose());resources.materials.forEach(resource=>resource.dispose());
 castle.traverse(object=>{if(object.isMesh&&!resources.geometries.includes(object.geometry))object.geometry.dispose()});castle=null;
}
window.worldFactories=window.worldFactories||{};
window.worldFactories.castle={create:createCastleWorld,destroy:destroyCastleWorld,metadata:{destination:"castle",size:"30x30",stories:2,spawnOutside:true,lazy:true}};
window.releaseLargeWorlds=except=>{
 if(except!=="space")destroySpaceWorld();
 if(except!=="forest")destroyForestWorld();
 if(except!=="castle")destroyCastleWorld();
};
function canWalkInCastle(x,z){
 const inset=.55,worldHalf=CASTLE_CONFIG.worldSize/2;if(x<-worldHalf+inset||x>worldHalf-inset||z<-worldHalf+inset||z>worldHalf-inset)return false;
 const onRamp=isCastleRamp(x,z),nextY=castleElevationAt(x,z,P.position.y),onUpper=nextY>2.25;
 if(onUpper&&!onRamp&&!isCastleUpperFloor(x,z))return false;
 // The opening rail is a real movement boundary at upper-floor height. The
 // ramp's open top remains the only route onto the deck.
 if(window.CastleLayout.crossesOpeningRail(P.position.x,x,z,P.position.y,nextY))return false;
 if(window.CastleLayout.crossesRampSideRail(P.position.x,P.position.z,x,z,P.position.y,nextY))return false;
 if(window.CastleLayout.crossesFrontOpeningRail(P.position.x,P.position.z,x,z,P.position.y,nextY))return false;
 // Outer keep walls block the player, while the broad gate remains open.
 if(z>13.55&&z<14.45&&Math.abs(x)>CASTLE_CONFIG.gateHalfWidth&&Math.abs(x)<14.45)return false;
 if(z<-13.55&&Math.abs(x)<14.45)return false;
 if(Math.abs(x)>13.55&&z>-14.45&&z<14.45)return false;
 if(onUpper)return true;
 // Keep the throne and banquet tables solid without cluttering the aisle.
 if(z<-10.75&&z>-12.25&&Math.abs(x)<2.7)return false;
 if(Math.abs(x)>4.7&&Math.abs(x)<9.3&&z>-6&&z<-2.8)return false;
 return true;
}
function isCastleRamp(x,z){return window.CastleLayout.isRamp(x,z)}
function isCastleUpperFloor(x,z){return window.CastleLayout.isUpperFloor(x,z)}
function castleElevationAt(x,z,currentY=0){return window.CastleLayout.elevationAt(x,z,currentY)}
function updateCastleFloorPresentation(){
 if(!castle)return;
 const material=castle.userData.upperFloorMaterial;
 if(!material)return;
 // A solid ceiling would hide the avatar from the elevated follow camera while
 // exploring the great hall. Ghost only the deck slabs on the lower storey;
 // the second floor stays fully opaque outside and while walking upstairs.
 const ghost=currentPlace==="castle"&&Math.abs(P.position.x)<13.4&&Math.abs(P.position.z)<13.4&&P.position.y<2.25;
 const opacity=ghost?.22:1;
 if(material.opacity===opacity)return;
 material.opacity=opacity;material.depthWrite=!ghost;material.needsUpdate=true;
}
