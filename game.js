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
 fridge:{x:6.8,z:-8.6},
 prep:{x:4.2,z:-8.7},
 stove:{x:5.5,z:-14.2},
 blender:{x:-3.2,z:-14.2}
};
const kitchenFixtureGroup=new THREE.Group();
kitchenFixtureGroup.name="kitchen-workflow-fixtures";S.add(kitchenFixtureGroup);
function kitchenBox(w,h,d,color,x,y,z){return box(w,h,d,color,x,y,z,kitchenFixtureGroup)}
const fridgeStation=KITCHEN_STATIONS.fridge;
kitchenBox(1.4,2,.8,0xd8e8ef,fridgeStation.x,1,fridgeStation.z);
kitchenBox(.08,.8,.06,0x777777,fridgeStation.x-.45,1.15,fridgeStation.z+.43);
const prepStation=KITCHEN_STATIONS.prep;
kitchenBox(2.4,1,.9,0xe0b184,prepStation.x,.53,prepStation.z);
kitchenBox(.7,.2,.7,0xff8fb1,prepStation.x,1.15,prepStation.z+.1);
kitchenBox(2.4,.15,.35,0x8c553e,prepStation.x,2.7,prepStation.z-.6);
for(let i=0;i<3;i++)kitchenBox(.4,.35,.3,[0xffd36e,0xff8fb1,0x9fe3c1][i],prepStation.x-.7+i*.7,2.95,prepStation.z-.5);

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
[
[-.46,2.55,0,.9],[-.25,2.72,0,1],[0,2.78,0,1.05],[.25,2.72,0,1],[.46,2.55,0,.9],
[-.53,2.3,0,.95],[.53,2.3,0,.95],[-.48,2.05,0,.8],[.48,2.05,0,.8],
[-.38,2.55,-.28,.9],[0,2.7,-.32,1],[.38,2.55,-.28,.9],
[-.42,2.3,-.35,.95],[0,2.45,-.42,1.1],[.42,2.3,-.35,.95],
[-.3,2.05,-.38,.85],[.3,2.05,-.38,.85]
].forEach(a=>addPlayerPuff(...a));
const playerLongPieces=[];
function addPlayerLong(x,y,z,w,h,d,ry=0){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:0x6b3c35}));
 m.position.set(x,y,z);m.rotation.z=ry;m.castShadow=true;m.visible=false;P.add(m);playerLongPieces.push(m);
}
// Layered, center-parted long hair that flows down both sides and the back.
[
[-.28,2.62,.02,.38,.28,.76,-.10],[.28,2.62,.02,.38,.28,.76,.10],
[-.43,2.38,-.02,.30,.55,.70,-.12],[.43,2.38,-.02,.30,.55,.70,.12],
[-.53,2.02,-.08,.30,.62,.58,-.10],[.53,2.02,-.08,.30,.62,.58,.10],
[-.58,1.60,-.12,.34,.58,.52,.10],[.58,1.60,-.12,.34,.58,.52,-.10],
[-.53,1.20,-.16,.32,.52,.46,-.14],[.53,1.20,-.16,.32,.52,.46,.14],
[0,2.42,-.42,.78,.55,.25,0],[0,1.95,-.45,.88,.62,.24,0],
[0,1.45,-.43,.82,.58,.22,0],[0,1.02,-.38,.70,.46,.20,0]
].forEach(a=>addPlayerLong(...a));
const playerShortCurlPieces=[];
function addPlayerShortCurl(x,y,z,s){
 const m=new THREE.Mesh(new THREE.BoxGeometry(.30*s,.30*s,.30*s),new THREE.MeshStandardMaterial({color:0x6b3c35}));
 m.position.set(x,y,z);m.castShadow=true;m.visible=false;P.add(m);playerShortCurlPieces.push(m);
}
// Rounded curly bob: full top, sides, back, and a few forehead curls.
[
[-.45,2.58,.02,1],[-.22,2.75,.02,1],[.02,2.80,.02,1.05],[.27,2.73,.02,1],[.48,2.56,.02,.95],
[-.55,2.36,0,1],[-.60,2.12,-.02,1],[.57,2.34,0,1],[.61,2.10,-.02,1],
[-.54,1.88,-.05,.9],[.54,1.88,-.05,.9],
[-.38,2.65,-.30,1],[0,2.76,-.36,1.1],[.38,2.64,-.30,1],
[-.50,2.38,-.38,1],[0,2.48,-.46,1.15],[.50,2.36,-.38,1],
[-.46,2.08,-.40,.95],[0,2.14,-.48,1.05],[.46,2.06,-.40,.95],
[-.28,2.42,.36,.62],[.05,2.50,.39,.58],[.34,2.38,.36,.58]
].forEach(a=>addPlayerShortCurl(...a));

let cashier=person(0xff7fa8);cashier.position.set(2.7,0,-.3);
let vx=0,vz=0,walk=0;const customers=[]; // No customers in this version.function spawn(){if(customers.length>5)return;let q=person(Math.random()*0xffffff);q.position.set(6.5,0,4.5);q.userData={stage:0,wait:180+Math.random()*180};customers.push(q)}// Customers removed.
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
let inKitchen=false;
let money=100;
let servedCount=0;
const foods=["🧁 Cupcake","🍪 Cookies","🎂 Cake","🥐 Croissant","🍞 Sweet Bread","🍓 Strawberry Milkshake","🍫 Chocolate Milkshake"];
function updateMoney(){document.getElementById("money").textContent="💵 $"+money}
updateMoney();
function newOrders(){
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
[document.getElementById("firstPageButton"),document.getElementById("avatarButton"),document.getElementById("roomTeleport")].forEach(element=>hudDrawer.appendChild(element));
function setHudMenu(open){hudDrawer.classList.toggle("open",open);hudMenuButton.setAttribute("aria-expanded",open)}
hudMenuButton.addEventListener("pointerdown",event=>{event.preventDefault();const open=!hudDrawer.classList.contains("open");if(open)closeKitchenPanels();setHudMenu(open)});
hudDrawer.addEventListener("pointerdown",event=>{if(event.target.closest("button"))setHudMenu(false)});
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
   cameraHeight,
   P.position.z+Math.cos(cameraAngle)*cameraDistance
 );
 C.position.lerp(cameraTargetPosition,.09);
 cameraLookAtPosition.set(P.position.x,1.2,P.position.z);
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
   document.getElementById("msg").textContent="The stove cooked "+r.emoji+" "+r.name+"! Now tap ✅ Finish on the order TV to earn money. 📺";
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
 walkStrength=THREE.MathUtils.lerp(walkStrength,isMoving?1:0,easing);
 if(isMoving)walk+=dt*12;
 const swing=Math.sin(walk)*.55*walkStrength;
 playerLeftArm.rotation.x=THREE.MathUtils.lerp(playerLeftArm.rotation.x,swing,easing);
 playerRightArm.rotation.x=THREE.MathUtils.lerp(playerRightArm.rotation.x,-swing,easing);
 playerLeftLeg.rotation.x=THREE.MathUtils.lerp(playerLeftLeg.rotation.x,-swing,easing);
 playerRightLeg.rotation.x=THREE.MathUtils.lerp(playerRightLeg.rotation.x,swing,easing);
 P.rotation.z=THREE.MathUtils.lerp(P.rotation.z,Math.sin(walk)*.035*walkStrength,easing);
 P.position.y=THREE.MathUtils.lerp(P.position.y,Math.abs(Math.sin(walk))*.06*walkStrength,easing);
}
let clock=new THREE.Clock();function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.04);moveCameraControl(dt);let playerMoved=false;if(Math.abs(vx)+Math.abs(vz)>.08){
// Movement is relative to the camera direction.
const forwardX=-Math.sin(cameraAngle);
const forwardZ=-Math.cos(cameraAngle);
const rightX=Math.cos(cameraAngle);
const rightZ=-Math.sin(cameraAngle);
const worldX=rightX*vx+forwardX*(-vz);
const worldZ=rightZ*vx+forwardZ*(-vz);
// 4.48 units/second is exactly 40% faster than the previous 3.2.
const playerMoveSpeed=4.48;
let nextX=P.position.x+worldX*playerMoveSpeed*dt;
let nextZ=P.position.z+worldZ*playerMoveSpeed*dt;
if(Math.hypot(worldX,worldZ)>.08){
  playerTurn=Math.atan2(worldX,worldZ);
  P.rotation.y=playerTurn;
}
// The ASCII map is the single collision source for every connected bakery room.
if(currentPlace!=="bakery"||canWalkAt(nextX,nextZ)){P.position.x=nextX;P.position.z=nextZ;playerMoved=true}
syncBakeryRoomState();}else{syncBakeryRoomState()}updatePlayerWalkAnimation(playerMoved,dt);
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
});R.render(S,C);perfFrames++;const now=performance.now(),elapsed=now-perfSampleStart;if(elapsed>=500){perfState.fps=Math.round(perfFrames*1000/elapsed);perfState.frameMs=+(elapsed/perfFrames).toFixed(1);perfState.drawCalls=R.info.render.calls;perfState.triangles=R.info.render.triangles;perfFrames=0;perfSampleStart=now;if(perfOverlay)perfOverlay.textContent=`${perfState.fps} FPS · ${perfState.frameMs} ms · ${perfState.drawCalls} calls · ${perfState.triangles} tris`}}animate();
addEventListener('resize',()=>{C.aspect=innerWidth/innerHeight;C.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);R.setPixelRatio(Math.min(devicePixelRatio,1.25));perfState.pixelRatio=R.getPixelRatio()});

// ----- First page, character colors, and house decorating -----
const startPage=document.getElementById("startPage"),housePanel=document.getElementById("housePanel");
let furniture=[];
const saved=JSON.parse(localStorage.getItem("my3DWorld")||"{}");
function selectCustomizationButton(area,button){
 area.querySelectorAll("button").forEach(b=>{const selected=b===button;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",selected)});
}
function colorButtons(id,colors,apply,selectedColor){
 const area=document.getElementById(id);
 colors.forEach((c,index)=>{let b=document.createElement("button");b.className="swatch";b.style.background="#"+c.toString(16).padStart(6,"0");b.setAttribute("aria-label","Color "+(index+1));b.onclick=()=>{apply(c);selectCustomizationButton(area,b);saveWorld()};area.appendChild(b);if(c===selectedColor)selectCustomizationButton(area,b)})
}


// Bakery blender and fruit counter
const blenderStation=new THREE.Group();
function blenderPart(w,h,d,c,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,transparent:c===0x99ddff,opacity:c===0x99ddff?.65:1}));
 m.position.set(x,y,z);m.castShadow=true;blenderStation.add(m);return m;
}
blenderPart(1.8,.85,1,0xf1c27d,-3.8,.43,-2.4);
blenderPart(.65,.35,.55,0xdddddd,-3.8,1.02,-2.4);
blenderPart(.55,.8,.5,0x99ddff,-3.8,1.58,-2.4);
blenderPart(.62,.12,.56,0x555555,-3.8,2.03,-2.4);
blenderPart(.12,.12,.05,0xff5555,-3.8,1.03,-1.89);
// Fruit bowl and voxel fruits
blenderPart(1,.18,.65,0xd9a05b,-2.45,1.02,-2.4);
[
[-2.72,1.22,-2.4,0xff3f55],[-2.45,1.25,-2.36,0xff3f55],
[-2.18,1.22,-2.42,0xffd83d],[-2.57,1.42,-2.4,0xffd83d],
[-2.3,1.43,-2.38,0x66cc55]
].forEach(a=>blenderPart(.24,.24,.24,a[3],a[0],a[1],a[2]));
// Chocolate bar and milk carton for milkshakes
blenderPart(.5,.12,.3,0x6b351f,-1.75,1.18,-2.38);
blenderPart(.38,.65,.38,0xf7f7f7,-1.15,1.32,-2.4);
blenderPart(.3,.12,.3,0x78bfff,-1.15,1.7,-2.4);

// Local blender geometry is centered at (-3.8, -2.4); offset the group so its
// working point lands on the data-driven station coordinate.
blenderStation.position.set(KITCHEN_STATIONS.blender.x+3.8,0,KITCHEN_STATIONS.blender.z+2.4);S.add(blenderStation);
// The milkshake ingredients now live on the shared food-ingredient shelf.
for(let i=5;i<blenderStation.children.length;i++) blenderStation.children[i].visible=false;
// Real 3D avatar preview on the first page
const previewScene=new THREE.Scene();previewScene.background=new THREE.Color(0xe9f7ff);
const previewCamera=new THREE.PerspectiveCamera(45,210/270,.1,50);previewCamera.position.set(0,2.3,6);previewCamera.lookAt(0,1.2,0);
const previewRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});previewRenderer.setSize(200,260);
document.getElementById("characterPreview3D").appendChild(previewRenderer.domElement);
previewScene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const previewAvatar=new THREE.Group();previewScene.add(previewAvatar);
function previewBox(w,h,d,c,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y,z);previewAvatar.add(m);return m}
const pvHead=previewBox(.9,.9,.9,0xf2bb91,0,2.2,0),pvShirt=previewBox(1.05,1.05,.65,0xb77cff,0,1.25,0);
const pvArm1=previewBox(.28,.95,.32,0xf2bb91,-.72,1.3,0),pvArm2=previewBox(.28,.95,.32,0xf2bb91,.72,1.3,0);
const pvLeg1=previewBox(.38,.95,.45,0x5870c8,-.25,.28,0),pvLeg2=previewBox(.38,.95,.45,0x5870c8,.25,.28,0);
const pvHairTop=previewBox(.98,.25,.98,0x6b3c35,0,2.68,0),pvHairSide=previewBox(.2,.58,.9,0x6b3c35,-.4,2.35,0);
const pvPuffPieces=[];
function addPreviewPuff(x,y,z,s){
 let m=previewBox(.34*s,.34*s,.34*s,0x6b3c35,x,y,z);
 m.visible=false;pvPuffPieces.push(m);
}
[
[-.55,2.65,0,.95],[-.3,2.85,0,1.05],[0,2.92,0,1.12],[.3,2.85,0,1.05],[.55,2.65,0,.95],
[-.62,2.38,0,1], [.62,2.38,0,1],[-.58,2.12,0,.9],[.58,2.12,0,.9],
[-.45,2.7,-.32,1], [0,2.88,-.38,1.15],[.45,2.7,-.32,1],
[-.52,2.42,-.42,1.05],[0,2.55,-.5,1.2],[.52,2.42,-.42,1.05],
[-.4,2.15,-.43,.9],[.4,2.15,-.43,.9]
].forEach(a=>addPreviewPuff(...a));
const pvLongPieces=[];
function addPreviewLong(x,y,z,w,h,d,rz=0){
 let m=previewBox(w,h,d,0x6b3c35,x,y,z);m.rotation.z=rz;m.visible=false;pvLongPieces.push(m);
}
[
[-.34,2.75,.02,.42,.30,.82,-.10],[.34,2.75,.02,.42,.30,.82,.10],
[-.50,2.46,-.02,.32,.58,.74,-.12],[.50,2.46,-.02,.32,.58,.74,.12],
[-.62,2.05,-.08,.34,.68,.62,-.10],[.62,2.05,-.08,.34,.68,.62,.10],
[-.68,1.58,-.12,.38,.66,.56,.10],[.68,1.58,-.12,.38,.66,.56,-.10],
[-.62,1.12,-.16,.36,.58,.50,-.14],[.62,1.12,-.16,.36,.58,.50,.14],
[0,2.53,-.47,.90,.60,.27,0],[0,2.02,-.50,1,.68,.26,0],
[0,1.49,-.48,.94,.64,.24,0],[0,1.02,-.42,.78,.50,.22,0]
].forEach(a=>addPreviewLong(...a));
const pvShortCurlPieces=[];
function addPreviewShortCurl(x,y,z,s){
 let m=previewBox(.31*s,.31*s,.31*s,0x6b3c35,x,y,z);m.visible=false;pvShortCurlPieces.push(m);
}
[
[-.55,2.72,.02,1],[-.28,2.91,.02,1],[0,2.97,.02,1.08],[.29,2.90,.02,1],[.56,2.70,.02,.98],
[-.66,2.45,0,1.05],[-.70,2.17,-.02,1.03],[.66,2.43,0,1.05],[.70,2.15,-.02,1.03],
[-.63,1.90,-.05,.94],[.63,1.90,-.05,.94],
[-.48,2.78,-.34,1],[0,2.92,-.42,1.14],[.48,2.76,-.34,1],
[-.60,2.48,-.45,1.05],[0,2.58,-.54,1.2],[.60,2.46,-.45,1.05],
[-.56,2.16,-.47,1],[0,2.22,-.56,1.1],[.56,2.14,-.47,1],
[-.34,2.52,.42,.65],[.04,2.60,.45,.62],[.40,2.48,.42,.62]
].forEach(a=>addPreviewShortCurl(...a));



previewBox(.11,.13,.05,0x202020,-.2,2.25,.47);previewBox(.11,.13,.05,0x202020,.2,2.25,.47);previewBox(.3,.06,.05,0x9b3f55,0,2.02,.47);
let previewDrag=false,lastPreviewX=0;
previewRenderer.domElement.addEventListener("pointerdown",e=>{previewDrag=true;lastPreviewX=e.clientX;previewRenderer.domElement.setPointerCapture(e.pointerId)});
previewRenderer.domElement.addEventListener("pointermove",e=>{if(previewDrag){previewAvatar.rotation.y+=(e.clientX-lastPreviewX)*.02;lastPreviewX=e.clientX}});
previewRenderer.domElement.addEventListener("pointerup",()=>previewDrag=false);
(function previewLoop(){requestAnimationFrame(previewLoop);previewRenderer.render(previewScene,previewCamera)})();

function setHairStyle(style){
 saved.hairStyle=style;
 playerHairTop.visible=style==="Classic";playerHairSide.visible=style==="Classic";
 pvHairTop.visible=style==="Classic";pvHairSide.visible=style==="Classic";
 playerPuffPieces.forEach(m=>m.visible=false);
 pvPuffPieces.forEach(m=>m.visible=false);
 playerLongPieces.forEach(m=>m.visible=false);
 pvLongPieces.forEach(m=>m.visible=false);
 playerShortCurlPieces.forEach(m=>m.visible=false);
 pvShortCurlPieces.forEach(m=>m.visible=false);

 if(style==="Short"){
  playerHairTop.visible=false;playerHairSide.visible=false;
  pvHairTop.visible=false;pvHairSide.visible=false;
  playerShortCurlPieces.forEach(m=>m.visible=true);
  pvShortCurlPieces.forEach(m=>m.visible=true);
 }
 if(style==="Long"){
  // Hide the old block hair and show layered hair with a center part.
  playerHairTop.visible=false;playerHairSide.visible=false;
  pvHairTop.visible=false;pvHairSide.visible=false;
  playerLongPieces.forEach(m=>m.visible=true);
  pvLongPieces.forEach(m=>m.visible=true);
 }
 if(style==="Puffy"){
  // Hide the old flat top block and side strip.
  playerHairTop.visible=false;playerHairSide.visible=false;
  pvHairTop.visible=false;pvHairSide.visible=false;
  // Show many small voxel puffs around the top, sides, and back.
  playerPuffPieces.forEach(m=>m.visible=true);
  pvPuffPieces.forEach(m=>m.visible=true);
 }
 saveWorld();
}
["Classic","Short","Long","Puffy"].forEach(style=>{let b=document.createElement("button");b.className="option";b.textContent=style;b.onclick=()=>{setHairStyle(style);selectCustomizationButton(startHairStyle,b)};startHairStyle.appendChild(b);if(style===(saved.hairStyle||"Classic"))selectCustomizationButton(startHairStyle,b)});
colorButtons("startHairColor",[0x2b1a12,0x6b3c35,0xc9873c,0xf2d36b,0x222222,0xff79b0],c=>{materialColor(playerHairTop,c);materialColor(playerHairSide,c);materialColor(pvHairTop,c);materialColor(pvHairSide,c);playerPuffPieces.forEach(m=>materialColor(m,c));pvPuffPieces.forEach(m=>materialColor(m,c));playerLongPieces.forEach(m=>materialColor(m,c));pvLongPieces.forEach(m=>materialColor(m,c));playerShortCurlPieces.forEach(m=>materialColor(m,c));pvShortCurlPieces.forEach(m=>materialColor(m,c));saved.hair=c},saved.hair??0x6b3c35);
colorButtons("startSkin",[0xf2bb91,0xd99568,0xb97850,0x7b4932,0x4b2b20],c=>{materialColor(playerHead,c);materialColor(playerLeftArm,c);materialColor(playerRightArm,c);saved.skin=c;materialColor(pvHead,c);materialColor(pvArm1,c);materialColor(pvArm2,c)},saved.skin??0xf2bb91);
colorButtons("startShirt",[0xb77cff,0xff73aa,0x55c985,0x5b9cff,0xffc83d],c=>{materialColor(playerShirt,c);materialColor(pvShirt,c);saved.shirt=c},Number(saved.shirt??0xb77cff));
colorButtons("startPants",[0x5870c8,0x292b35,0xd95b91,0x397b55,0xf1f1f1],c=>{materialColor(playerLeftLeg,c);materialColor(playerRightLeg,c);saved.pants=c;materialColor(pvLeg1,c);materialColor(pvLeg2,c)},saved.pants??0x5870c8);
if(saved.skin){materialColor(playerHead,saved.skin);materialColor(playerLeftArm,saved.skin);materialColor(playerRightArm,saved.skin)}
if(saved.shirt)materialColor(playerShirt,saved.shirt);
if(saved.pants){materialColor(playerLeftLeg,saved.pants);materialColor(playerRightLeg,saved.pants);materialColor(pvLeg1,saved.pants);materialColor(pvLeg2,saved.pants)}
if(saved.skin){materialColor(pvHead,saved.skin);materialColor(pvArm1,saved.skin);materialColor(pvArm2,saved.skin)}
if(saved.shirt)materialColor(pvShirt,saved.shirt);
if(saved.hair){materialColor(playerHairTop,saved.hair);materialColor(playerHairSide,saved.hair);materialColor(pvHairTop,saved.hair);materialColor(pvHairSide,saved.hair);playerPuffPieces.forEach(m=>materialColor(m,saved.hair));pvPuffPieces.forEach(m=>materialColor(m,saved.hair));playerLongPieces.forEach(m=>materialColor(m,saved.hair));pvLongPieces.forEach(m=>materialColor(m,saved.hair));playerShortCurlPieces.forEach(m=>materialColor(m,saved.hair));pvShortCurlPieces.forEach(m=>materialColor(m,saved.hair))}
if(saved.hairStyle)setHairStyle(saved.hairStyle);
function saveWorld(){saved.furniture=furniture.map(x=>({
 kind:x.userData.kind,
 x:x.position.x,
 z:x.position.z,
 rotation:x.rotation.y
}));localStorage.setItem("my3DWorld",JSON.stringify(saved))}
// Keep the bakery and house as two separate places.
const bakeryObjects=S.children.filter(obj=>obj!==P && obj!==C && !obj.isLight);
const house=new THREE.Group();house.visible=false;S.add(house);
function hbox(w,h,d,c,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;house.add(m);return m}
hbox(12,.25,10,0xd7b08b,0,.03,0);hbox(12,5,.2,0xddefff,0,2.5,-4.9);hbox(.2,5,10,0xffe5ef,-5.9,2.5,0);
function addFurniture(kind,loading=false,savedItem=null){
 let g=new THREE.Group(),n=furniture.length,x=-3+(n%4)*2,z=-2+Math.floor(n/4)*2;
 function q(w,h,d,c,px,py,pz){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(px,py,pz);m.castShadow=true;g.add(m)}
 if(kind==="sofa"){q(2,.7,.8,0xe889ad,0,.55,0);q(2,.8,.25,0xd96f9a,0,1,-.3);q(.25,.7,.8,0xd96f9a,-1,.65,0);q(.25,.7,.8,0xd96f9a,1,.65,0)}
 if(kind==="table"){q(1.7,.18,1.1,0x9b6645,0,1,0);for(let a of[-.65,.65])for(let b of[-.35,.35])q(.14,1,.14,0x74472f,a,.5,b)}
 if(kind==="bed"){q(2.2,.45,1.3,0xffffff,0,.45,0);q(2.2,.25,1.3,0x8fc5ff,0,.72,0);q(.7,.18,1,0xffffff,-.6,.92,0)}
 if(kind==="lamp"){q(.55,.12,.55,0x555555,0,.08,0);q(.12,1.5,.12,0x777777,0,.8,0);q(.8,.65,.8,0xffe978,0,1.65,0)}
 if(kind==="chair"){q(.8,.18,.8,0x8f613f,0,.8,0);q(.8,1,.18,0x8f613f,0,1.3,-.3);q(.12,.8,.12,0x68442d,-.3,.4,0);q(.12,.8,.12,0x68442d,.3,.4,0)}
 if(kind==="fridge"){q(1.25,2.4,.9,0xdcecf2,0,1.2,0);q(.08,1,.08,0x777777,.48,1.55,.48)}
 if(kind==="tv"){q(2.5,1.5,.22,0x20232b,0,1.65,0);q(2.15,1.15,.05,0x62a9d8,0,1.65,.14);q(.2,.8,.2,0x555555,0,.65,0);q(1.3,.15,.55,0x555555,0,.2,0)}
 if(kind==="remote"){q(.35,.12,.75,0x333333,0,.15,0);q(.1,.04,.1,0xff5555,0,.23,-.25)}
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
g.userData.kind=kind;house.add(g);furniture.push(g);if(!loading)saveWorld()
}
(saved.furniture||[]).forEach(item=>{
 if(typeof item==="string")addFurniture(item,true);
 else addFurniture(item.kind,true,item);
});
function setBakeryVisible(show){
 bakeryObjects.forEach(obj=>obj.visible=show);
 P.visible=true;
}
function showBakery(){P.visible=true;
 currentPlace="bakery";
 document.body.classList.add("bakery-mode");document.body.classList.remove("house-mode");
 startPage.style.display="none";
 setBakeryVisible(true);
 page5Group.visible=true;
 house.visible=false;
 housePanel.style.display="none";furnitureMover.style.display="none";
 P.position.set(-1,0,2);
 C.position.set(10,11,15);
 C.lookAt(0,1,0);
 document.getElementById("roomTeleport").style.display="flex";
 syncBakeryRoomState(true);
}
function showHouse(){P.visible=true;
 currentPlace="house";
 document.body.classList.add("house-mode");document.body.classList.remove("bakery-mode");
 startPage.style.display="none";
 setBakeryVisible(false);
 house.visible=true;
 housePanel.style.display="block";
 document.getElementById("roomTeleport").style.display="none";
 setBuildingMode(furniture.length===0);
 P.position.set(0,0,2);
 C.position.set(8,8,11);
 C.lookAt(0,1,0);
}
goBakery.onclick=showBakery;goHouse.onclick=showHouse;


let sitting=false,tvIsOn=false,currentChannel="news";
const houseActionBtn=document.getElementById("houseAction");
const remotePanelEl=document.getElementById("remotePanel");
const tvScreenEl=document.getElementById("tvScreen");
const tvTitleEl=document.getElementById("tvTitle");
const tvShowEl=document.getElementById("tvShow");
const openTVRemoteBtn=document.getElementById("openTVRemote");
const shows={
 news:["📰 Tiny Town News","Breaking news: a giant cupcake was baked today! A little duck found its way home."],
 chef:["👨‍🍳 Chef Gary's Kitchen","Chef Gary is making rainbow pasta and teaching fun kitchen tips."],
 island:["🏝️ Island Hearts","Friends on a sunny island complete kindness challenges and work as teams."],
 monsters:["⚡ Pocket Pals Adventures","Sparkbit and Leafloo explore Crystal Forest and help a shy cloud creature."]
};
function hasFurniture(kind){return furniture.some(f=>f.userData.kind===kind)}
function nearFurniture(kind,range=1.8){return furniture.find(f=>f.userData.kind===kind&&Math.hypot(f.position.x-P.position.x,f.position.z-P.position.z)<range)}
function refreshHouseButtons(){
 const inHouse=currentPlace==="house";
 openTVRemoteBtn.style.display=(inHouse&&hasFurniture("tv"))?"block":"none";
 if(!inHouse||buildingMode){houseActionBtn.style.display="none";return}
 const chair=nearFurniture("chair"),fridge=nearFurniture("fridge");
 if(chair){houseActionBtn.style.display="block";houseActionBtn.textContent=sitting?"🚶 STAND":"🪑 SIT";houseActionBtn.dataset.action="sit"}
 else if(fridge){houseActionBtn.style.display="block";houseActionBtn.textContent="🧊 OPEN FRIDGE";houseActionBtn.dataset.action="fridge"}
 else houseActionBtn.style.display="none";
}
houseActionBtn.onclick=()=>{
 if(houseActionBtn.dataset.action==="sit"){
  const chair=nearFurniture("chair",2.2);
  if(!sitting&&chair){sitting=true;P.position.set(chair.position.x,.45,chair.position.z)}
  else{sitting=false;P.position.z+=1}
 }
 if(houseActionBtn.dataset.action==="fridge")document.getElementById("msg").textContent="Inside: milk, fruit, cake, and juice! 🥛🍓🍰";
};
openTVRemoteBtn.onclick=()=>{remotePanelEl.style.display="block"};
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
document.querySelectorAll("#remotePanel [data-channel]").forEach(b=>b.onclick=()=>{
 if(!tvIsOn){document.getElementById("msg").textContent="Press Power first! 📺";return}
 showTVChannel(b.dataset.channel)
});
document.getElementById("closeRemote").onclick=()=>remotePanelEl.style.display="none";
setInterval(refreshHouseButtons,150);
let buildingMode=true;
const buildingTools=document.getElementById("buildingTools");
const saveHouseButton=document.getElementById("saveHouse");
const buildHouseButton=document.getElementById("buildHouse");
const buildMessage=document.getElementById("buildMessage");

function setBuildingMode(on){
 buildingMode=on;
 const movePad=document.getElementById("pad");
 const cameraPad=document.getElementById("lookPad");
 const cameraLabel=document.getElementById("lookLabel");
 if(on){
  if(movePad)movePad.style.bottom="195px";
  if(cameraPad)cameraPad.style.bottom="195px";
  if(cameraLabel)cameraLabel.style.bottom="320px";
 }else{
  if(movePad)movePad.style.bottom="22px";
  if(cameraPad)cameraPad.style.bottom="105px";
  if(cameraLabel)cameraLabel.style.bottom="230px";
 }
 buildingTools.style.display=on?"block":"none";furnitureMover.style.display=(on&&currentPlace==='house')?'block':'none';
 saveHouseButton.style.display=on?"block":"none";
 buildHouseButton.style.display=on?"none":"block";
 buildMessage.textContent=on?"Building Mode: ON 🔨":"House Saved! Building Mode: OFF 💾";
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
 document.getElementById("msg").textContent="Building mode is on! You can decorate again. 🔨";
});

document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>addFurniture(b.dataset.f));
let selectedFurnitureIndex=-1;
function selectedFurniture(){
 return selectedFurnitureIndex>=0 ? furniture[selectedFurnitureIndex] : null;
}
function updateFurnitureLabel(){
 const item=selectedFurniture();
 document.getElementById("selectedFurniture").textContent=
  item ? "Selected: "+item.userData.kind+" ✨" : "Selected: None";
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
 item.position.x=Math.max(-5.1,Math.min(5.1,item.position.x+dx));
 item.position.z=Math.max(-4.1,Math.min(4.1,item.position.z+dz));
 saveWorld();
}
document.getElementById("moveFUp").onclick=()=>moveSelected(0,-.5);
document.getElementById("moveFDown").onclick=()=>moveSelected(0,.5);
document.getElementById("moveFLeft").onclick=()=>moveSelected(-.5,0);
document.getElementById("moveFRight").onclick=()=>moveSelected(.5,0);
document.getElementById("rotateF").onclick=()=>{
 const item=selectedFurniture();
 if(!item)return;
 item.rotation.y+=Math.PI/4;
 saveWorld();
};

clearFurniture.onclick=()=>{furniture.forEach(x=>house.remove(x));furniture=[];selectedFurnitureIndex=-1;updateFurnitureLabel();saveWorld()};
backPlaces.onclick=()=>{startPage.style.display="block";housePanel.style.display="none";house.visible=false;setBakeryVisible(false)};


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

document.getElementById("firstPageButton").addEventListener("pointerdown",function(event){
  event.preventDefault();
  document.getElementById("startPage").style.display="block";
document.getElementById("housePanel").style.display="none";house.visible=false;setBakeryVisible(false);
});

// Reliable furniture selector and page visibility fix
(function(){
 const mover=document.getElementById("furnitureMover");
 const selectBtn=document.getElementById("selectFurniture2");
 const label=document.getElementById("selectedFurniture2");

 function refreshMover(){
   const shouldShow=(currentPlace==="house" && buildingMode===true && startPage.style.display==="none");
   mover.style.display=shouldShow?"block":"none";
 }
 function selectNext(){
   if(!furniture || furniture.length===0){
     selectedFurnitureIndex=-1;
     label.textContent="Add furniture first!";
     return;
   }
   selectedFurnitureIndex++;
   if(selectedFurnitureIndex>=furniture.length)selectedFurnitureIndex=0;
   const item=furniture[selectedFurnitureIndex];
   label.textContent="Selected: "+item.userData.kind+" ✨";
   const oldLabel=document.getElementById("selectedFurniture");
   if(oldLabel)oldLabel.textContent="Selected: "+item.userData.kind+" ✨";
 }
 // Replace the old click action so it cannot run twice.
 if(selectBtn){
   const fresh=selectBtn.cloneNode(true);
   selectBtn.parentNode.replaceChild(fresh,selectBtn);
   fresh.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();selectNext()});
   fresh.addEventListener("click",function(e){e.preventDefault();e.stopPropagation()});
 }
 // Hide on every page except House + Build Mode.
 setInterval(refreshMover,100);
 document.getElementById("goBakery").addEventListener("pointerdown",()=>mover.style.display="none");
 document.getElementById("backPlaces").addEventListener("pointerdown",()=>mover.style.display="none");
 document.getElementById("firstPageButton").addEventListener("pointerdown",()=>mover.style.display="none");
 document.getElementById("saveHouse").addEventListener("pointerdown",()=>mover.style.display="none");
})();


// FINAL FURNITURE MOVEMENT REPAIR
(function(){
 function getSelectedItem(){
   if(!Array.isArray(furniture)||furniture.length===0)return null;
   if(selectedFurnitureIndex<0||selectedFurnitureIndex>=furniture.length)selectedFurnitureIndex=0;
   return furniture[selectedFurnitureIndex];
 }
 function moveItem(dx,dz){
   const item=getSelectedItem();
   if(!item){document.getElementById("selectedFurniture2").textContent="Add furniture first!";return}
   item.position.x=Math.max(-5.1,Math.min(5.1,item.position.x+dx));
   item.position.z=Math.max(-4.1,Math.min(4.1,item.position.z+dz));
   document.getElementById("selectedFurniture2").textContent="Selected: "+item.userData.kind+" ✨";
   saveWorld();
 }
 function replaceButton(id,action){
   const old=document.getElementById(id);
   if(!old)return;
   const fresh=old.cloneNode(true);
   old.parentNode.replaceChild(fresh,old);
   fresh.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();action()});
 }
 replaceButton("moveFUp2",()=>moveItem(0,-.5));
 replaceButton("moveFDown2",()=>moveItem(0,.5));
 replaceButton("moveFLeft2",()=>moveItem(-.5,0));
 replaceButton("moveFRight2",()=>moveItem(.5,0));
 replaceButton("rotateF2",()=>{
   const item=getSelectedItem();
   if(item){item.rotation.y+=Math.PI/4;saveWorld()}
 });
 // Keep the widget only in the house while Build Mode is on.
 setInterval(()=>{
   const mover=document.getElementById("furnitureMover");
   const first=document.getElementById("startPage");
   const show=currentPlace==="house"&&buildingMode===true&&first.style.display==="none";
   mover.style.display=show?"block":"none";
 },100);
})();


// Blender interaction
const blenderBtn=document.getElementById("blenderButton");
const smoothieMsg=document.getElementById("smoothieMessage");
let blenderBusy=false;
setInterval(()=>{
 const station=KITCHEN_STATIONS.blender;
 const near=Math.hypot(P.position.x-station.x,P.position.z-station.z)<2.7;
 blenderBtn.style.display="none";
},120);
blenderBtn.onclick=()=>{
 if(blenderBusy)return;
 blenderBusy=true;
 blenderBtn.textContent="🌀 BLENDING...";
 smoothieMsg.style.display="block";
 smoothieMsg.textContent="🍓 Adding strawberries, banana, and fruit!";
 let shakes=0;
 const timer=setInterval(()=>{
  blenderStation.rotation.y=(shakes%2?.035:-.035);
  shakes++;
  if(shakes>18){
   clearInterval(timer);blenderStation.rotation.y=0;
   blenderBtn.textContent="🥤 USE BLENDER";
   smoothieMsg.textContent="🥤 Your berry-banana smoothie is ready!";
   setTimeout(()=>smoothieMsg.style.display="none",2500);
   blenderBusy=false;
  }
 },80);
};


// Milkshake ingredient system
const shakePanel=document.getElementById("shakePanel");
const shakeList=document.getElementById("shakeList");
const shakeResult=document.getElementById("shakeResult");
const addStrawBtn=document.getElementById("addStraw");
let shakeIngredients=[],madeShake=null,strawAdded=false;
function updateShakeList(){
 shakeList.textContent="Blender: "+(shakeIngredients.length?shakeIngredients.map(x=>({strawberry:"🍓 Strawberry",banana:"🍌 Banana",milk:"🥛 Milk",chocolate:"🍫 Chocolate"}[x])).join(", "):"Empty");
}
setInterval(()=>{
 const station=KITCHEN_STATIONS.blender;
 const near=Math.hypot(P.position.x-station.x,P.position.z-station.z)<2.7;
 shakePanel.style.display=(currentPlace==="bakery"&&inKitchen===true&&near)?"block":"none";
 blenderBtn.style.display="none";
},100);
document.querySelectorAll("[data-shake]").forEach(b=>b.onclick=()=>{
 const item=b.dataset.shake;
 if(!shakeIngredients.includes(item)){shakeIngredients.push(item);updateShakeList();shakeResult.textContent=({strawberry:"Strawberry added! 🍓",banana:"Banana added! 🍌",milk:"Milk added! 🥛",chocolate:"Chocolate added! 🍫"}[item])}
});
document.getElementById("blendShake").onclick=()=>{
 if(!shakeIngredients.includes("milk")){shakeResult.textContent="Add milk first! 🥛";return}
 if(shakeIngredients.includes("strawberry")){
  madeShake="strawberry";shakeResult.textContent="🍓 Strawberry milkshake made! Add a straw!";
 }else if(shakeIngredients.includes("chocolate")){
  madeShake="chocolate";shakeResult.textContent="🍫 Chocolate milkshake made! Add a straw!";
 }else{
  shakeResult.textContent="Add strawberry or chocolate!";return;
 }
 shakeIngredients=[];updateShakeList();addStrawBtn.style.display="block";strawAdded=false;
};
addStrawBtn.onclick=()=>{
 if(!madeShake)return;
 strawAdded=true;addStrawBtn.style.display="none";
 shakeResult.innerHTML=(madeShake==="strawberry"?"🍓 Strawberry":"🍫 Chocolate")+" milkshake ready! <span style='font-size:28px'>🥤</span><br>Red and white striped straw added! ❤️🤍";
};


// Show the milkshake station only while the player is in the kitchen.
setInterval(()=>{
 const page4Open=currentPlace==="bakery"&&inKitchen===true;
 blenderStation.visible=page4Open;
 if(!page4Open){document.getElementById("shakePanel").style.display="none";document.getElementById("blenderButton").style.display="none";}
},80);


function hideMilkshakeIngredientTags(){
 ["tagStrawberry","tagBanana","tagMilk","tagChocolate"].forEach(id=>{
   const el=document.getElementById(id);
   if(el) el.style.display="none";
 });
}

// Floating labels for milkshake ingredients in the kitchen.
const ingredientTags = [
  {id:"tagStrawberry", pos:new THREE.Vector3(-3.65,3.45,-19.6)},
  {id:"tagBanana", pos:new THREE.Vector3(-2.7,3.45,-19.6)},
  {id:"tagMilk", pos:new THREE.Vector3(-.8,3.45,-19.6)},
  {id:"tagChocolate", pos:new THREE.Vector3(3.25,3.45,-19.6)}
];
function updateIngredientTags(){
  const page4Open = currentPlace==="bakery" && inKitchen===true && inStorage!==true;
  const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.2;
  ingredientTags.forEach(t=>{
    const el=document.getElementById(t.id);
    if(!page4Open||!nearShelf){el.style.display="none";return;}
    const v=t.pos.clone().project(C);
    if(v.z<-1||v.z>1){el.style.display="none";return;}
    el.style.display="block";
    el.style.left=((v.x*.5+.5)*innerWidth-el.offsetWidth/2)+"px";
    el.style.top=((-v.y*.5+.5)*innerHeight-el.offsetHeight-8)+"px";
  });
}
setInterval(updateIngredientTags,80);


// ===== Recipe target system + cleaner kitchen HUD =====
let makeTarget="cupcake";
const targetInfo={
 cupcake:{mode:"food",recipe:0,name:"🧁 Cupcake",need:["Egg","Milk","Flour"]},
 cookies:{mode:"food",recipe:1,name:"🍪 Cookies",need:["Butter","Flour","Sugar"]},
 cake:{mode:"food",recipe:2,name:"🎂 Cake",need:["Egg","Milk","Flour","Sugar"]},
 sweetBread:{mode:"food",recipe:3,name:"🍞 Sweet Bread",need:["Flour","Milk","Sugar","Butter"]},
 croissant:{mode:"food",recipe:4,name:"🥐 Croissant",need:["Flour","Milk","Butter"]},
 strawberryShake:{mode:"shake",name:"🍓 Strawberry Milkshake",need:["Milk","Strawberry"]},
 chocolateShake:{mode:"shake",name:"🍫 Chocolate Milkshake",need:["Milk","Chocolate"]}
};
function prettyIngredient(n){
 return ({Egg:"🥚 Egg",Milk:"🥛 Milk",Flour:"🌾 Flour",Sugar:"🍬 Sugar",Butter:"🧈 Butter",Strawberry:"🍓 Strawberry",Banana:"🍌 Banana",Chocolate:"🍫 Chocolate"})[n]||n;
}
function shakeHaveNames(){return shakeIngredients.map(x=>({strawberry:"Strawberry",banana:"Banana",milk:"Milk",chocolate:"Chocolate"})[x]);}
function targetDoneNames(){
 const t=targetInfo[makeTarget];
 return t.mode==="food"?t.need.slice(0,addedIngredients):shakeHaveNames();
}
function targetMissing(){
 const t=targetInfo[makeTarget],done=targetDoneNames();
 return t.need.filter(n=>!done.includes(n));
}
function refreshMakingPanel(){
 const t=targetInfo[makeTarget];
 document.querySelectorAll("#makeChoices button").forEach(b=>b.classList.toggle("activeChoice",b.dataset.make===makeTarget));
 document.getElementById("recipeName").textContent=t.name;
 const done=targetDoneNames();
 ingredientList.innerHTML="";
 t.need.forEach(n=>{
   const d=document.createElement("div");
   const ok=done.includes(n);
   d.className="ingredient"+(ok?" done":"");
   d.textContent=(ok?"✅ ":"⬜ ")+prettyIngredient(n);
   ingredientList.appendChild(d);
 });
 document.getElementById("makeFood").style.display="none";
}
showRecipe=refreshMakingPanel;
document.querySelectorAll("#makeChoices button").forEach(b=>b.addEventListener("pointerdown",e=>{
 e.preventDefault();
 makeTarget=b.dataset.make;
 const t=targetInfo[makeTarget];
 if(t.mode==="food"){
   recipeIndex=t.recipe;addedIngredients=0;
 }else{
   shakeIngredients=[];madeShake=null;strawAdded=false;updateShakeList();
   document.getElementById("addStraw").style.display="none";
   document.getElementById("shakeResult").textContent="";
 }
 refreshMakingPanel();
 document.getElementById("msg").textContent="Now making "+t.name+"! The ingredients you need are glowing. ✨";
}));

// Replace the old shelf buttons with one recipe-aware button.
function replaceShelfButton(id){
 const old=document.getElementById(id);
 const fresh=old.cloneNode(true);
 old.parentNode.replaceChild(fresh,old);
 return fresh;
}
const smartFoodGrab=replaceShelfButton("ingredientGrab");
const smartShakeGrab=replaceShelfButton("shakeGrab");

function ingredientIsActive(name){
 const t=targetInfo[makeTarget];
 if(t.mode==="food"){
   const needed=t.need[addedIngredients];
   return name===needed;
 }
 return t.need.includes(name)&&!shakeHaveNames().includes(name);
}
function updateSmartShelfButtons(){
 document.body.classList.toggle("kitchen-clean",inKitchen);
 smartFoodGrab.style.display="none";
 smartShakeGrab.style.display="none";
 if(!inKitchen||!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 let point=selectedIngredient.position.clone();point.y+=1.0;point.project(C);
 const left=((point.x*.5+.5)*innerWidth-68)+"px";
 const top=((-point.y*.5+.5)*innerHeight-42)+"px";
 const t=targetInfo[makeTarget];
 const btn=t.mode==="food"?smartFoodGrab:smartShakeGrab;
 btn.style.left=left;btn.style.top=top;
 btn.innerHTML=(t.mode==="food"?"🍰 GRAB FOR RECIPE":"🥤 ADD TO BLENDER")+"<br>"+selectedIngredient.userData.emoji+" "+name;
 btn.style.display="block";
}
smartFoodGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 addedIngredients++;
 refreshMakingPanel();
 document.getElementById("msg").textContent=selectedIngredient.userData.emoji+" "+name+" activated and added! ✨";
 if(targetMissing().length===0)document.getElementById("msg").textContent+=" You have everything—go to the stove!";
});
smartShakeGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 const map={Strawberry:"strawberry",Banana:"banana",Milk:"milk",Chocolate:"chocolate"};
 shakeIngredients.push(map[name]);updateShakeList();refreshMakingPanel();
 document.getElementById("msg").textContent=selectedIngredient.userData.emoji+" "+name+" activated and added to the blender! ✨";
 if(targetMissing().length===0)document.getElementById("msg").textContent+=" You have everything—walk to the blender!";
});

// Glow only the ingredients needed for the chosen item.
let glowClock=0;
function updateActiveIngredients(){
 glowClock+=.12;
 ingredientModels.forEach(item=>{
   const active=ingredientIsActive(item.userData.ingredient);
   const s=active?1.08+Math.sin(glowClock)*.05:.92;
   item.scale.setScalar(s);
   item.traverse(o=>{
     if(o.isMesh&&o.material){
       o.material.transparent=true;
       o.material.opacity=active?1:.42;
       if("emissive" in o.material){
         o.material.emissive.setHex(active?0x332800:0x000000);
         o.material.emissiveIntensity=active?.8:0;
       }
     }
   });
 });
}
setInterval(()=>{updateSmartShelfButtons();updateActiveIngredients()},80);

// Make the blender produce only the selected shake.
const oldBlend=document.getElementById("blendShake");
const newBlend=oldBlend.cloneNode(true);oldBlend.parentNode.replaceChild(newBlend,oldBlend);
newBlend.addEventListener("pointerdown",e=>{
 e.preventDefault();
 const t=targetInfo[makeTarget];
 if(t.mode!=="shake"){shakeResult.textContent="Choose a milkshake first!";return}
 if(targetMissing().length){shakeResult.textContent="You still need: "+targetMissing().map(prettyIngredient).join(", ");return}
 madeShake=makeTarget==="strawberryShake"?"strawberry":"chocolate";
 shakeResult.textContent=t.name+" made! Add the striped straw! 🥤";
 addStrawBtn.style.display="block";
});
refreshMakingPanel();


// ===== FINAL MILKSHAKE UI CLEANUP =====
const blenderReadyIcon=document.getElementById("blenderReadyIcon");

// The old overlay and old floating add button are no longer used.
document.getElementById("shakePanel").style.display="none";
document.getElementById("shakeGrab").style.display="none";

function finalMilkshakeUI(){
  document.getElementById("shakePanel").style.display="none";
  document.getElementById("shakeGrab").style.display="none";

  const target=targetInfo[makeTarget];
  const shakeSelected=target && target.mode==="shake";
  const allReady=shakeSelected && targetMissing().length===0 && !madeShake;
 const station=KITCHEN_STATIONS.blender;
 const nearBlender=Math.hypot(P.position.x-station.x,P.position.z-station.z)<3.2;
  const show=inKitchen && currentPlace==="bakery" && allReady && nearBlender;

  if(!show){
    blenderReadyIcon.style.display="none";
    return;
  }

  // Keep the icon directly over the real blender.
  const p=new THREE.Vector3(station.x,2.65,station.z).project(C);
  if(p.z<-1||p.z>1){
    blenderReadyIcon.style.display="none";
    return;
  }
  blenderReadyIcon.style.display="block";
  blenderReadyIcon.style.left=((p.x*.5+.5)*innerWidth-39)+"px";
  blenderReadyIcon.style.top=((-p.y*.5+.5)*innerHeight-88)+"px";
}

blenderReadyIcon.addEventListener("pointerdown",e=>{
  e.preventDefault();
  e.stopPropagation();
  const target=targetInfo[makeTarget];
  if(!target || target.mode!=="shake" || targetMissing().length)return;

  madeShake=makeTarget==="strawberryShake"?"strawberry":"chocolate";
  blenderReadyIcon.style.display="none";
  addStrawBtn.style.display="block";
  shakeResult.textContent=target.name+" made! Add the red-and-white striped straw! ❤️🤍";
  document.getElementById("msg").textContent=target.name+" is blended! Add the striped straw. 🥤";
});

// Make the straw button appear as a compact icon near the blender instead of opening the overlay.
addStrawBtn.style.position="fixed";
addStrawBtn.style.zIndex="411";
addStrawBtn.style.width="76px";
addStrawBtn.style.height="76px";
addStrawBtn.style.borderRadius="50%";
addStrawBtn.style.fontSize="0";
addStrawBtn.innerHTML="🥤";
addStrawBtn.style.background="#fff";
addStrawBtn.style.border="4px solid #ff5577";

function positionStrawIcon(){
  if(addStrawBtn.style.display==="none" || !inKitchen || !madeShake)return;
  const station=KITCHEN_STATIONS.blender;
  const p=new THREE.Vector3(station.x,2.65,station.z).project(C);
  addStrawBtn.style.left=((p.x*.5+.5)*innerWidth-38)+"px";
  addStrawBtn.style.top=((-p.y*.5+.5)*innerHeight-88)+"px";
}

setInterval(()=>{
  finalMilkshakeUI();
  positionStrawIcon();
},80);


// ===== BAKERY ORDER TV + CHECK BUTTON =====
(function(){
 const checkBtn=document.getElementById("checkHouse");
 const orders=document.getElementById("orders");

 checkBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   if(typeof showHouse==="function") showHouse();
   // Put the player at the open front side of the house, facing inward.
   P.position.set(0,0,4.1);
   P.rotation.set(0,Math.PI,0);
   C.position.set(0,6.8,11.5);
   C.lookAt(0,1.2,1.3);
   orders.style.display="none";
   document.getElementById("msg").textContent="Teleported to the front of your house! 🏠✨";
 });

 // The bakery order TV belongs in the kitchen.
 setInterval(()=>{
   const page4=currentPlace==="bakery"&&inKitchen===true&&inStorage!==true;
   bakeryOrderTV.visible=page4;
   if(!page4) orders.style.display="none";
 },100);

 // Refresh the bakery TV orders whenever the kitchen becomes active.
 const oldEnterKitchen=enterKitchen;
 enterKitchen=function(){
   oldEnterKitchen();
   newOrders();
   orders.style.display="block";
 };
})();


// ===== FINAL RELIABLE INGREDIENT GRAB BUTTON =====
(function(){
  const fixedGrab=document.getElementById("fixedIngredientGrab");

  // Hide the older floating grab buttons so they cannot overlap or steal taps.
  const oldFood=document.getElementById("ingredientGrab");
  const oldShake=document.getElementById("shakeGrab");
  if(oldFood) oldFood.style.setProperty("display","none","important");
  if(oldShake) oldShake.style.setProperty("display","none","important");

  function currentNeededIngredient(){
    const t=targetInfo[makeTarget];
    if(!t)return null;
    if(t.mode==="food") return t.need[addedIngredients] || null;
    const already=shakeHaveNames();
    return t.need.find(name=>!already.includes(name)) || null;
  }

  function updateFixedGrab(){
    if(!inKitchen || !selectedIngredient){
      fixedGrab.style.display="none";
      return;
    }

    const name=selectedIngredient.userData.ingredient;
    const needed=currentNeededIngredient();

    // Only show the button when standing by the correct ingredient.
    if(!needed || name!==needed){
      fixedGrab.style.display="none";
      return;
    }

    const t=targetInfo[makeTarget];
    fixedGrab.style.background=t.mode==="shake"?"#ff9ed2":"#ffd86b";
    fixedGrab.innerHTML=(t.mode==="shake"?"🥤 ADD TO BLENDER":"🍰 GRAB FOR RECIPE")
      +"<br>"+selectedIngredient.userData.emoji+" "+name;
    fixedGrab.style.display="block";
  }

  function grabCurrentIngredient(e){
    e.preventDefault();
    e.stopPropagation();

    if(!inKitchen || !selectedIngredient)return;

    const t=targetInfo[makeTarget];
    const name=selectedIngredient.userData.ingredient;
    const needed=currentNeededIngredient();

    if(!t || !needed || name!==needed){
      document.getElementById("msg").textContent="Walk closer to the glowing ingredient you need. ✨";
      return;
    }

    if(t.mode==="food"){
      addedIngredients++;
      refreshMakingPanel();
      document.getElementById("msg").textContent=
        selectedIngredient.userData.emoji+" "+name+" grabbed for "+t.name+"! ✅";
      if(targetMissing().length===0){
        document.getElementById("msg").textContent+=" You have everything—go to the stove! 🔥";
      }
    }else{
      const map={Strawberry:"strawberry",Banana:"banana",Milk:"milk",Chocolate:"chocolate"};
      const key=map[name];
      if(key && !shakeIngredients.includes(key)) shakeIngredients.push(key);
      updateShakeList();
      refreshMakingPanel();
      document.getElementById("msg").textContent=
        selectedIngredient.userData.emoji+" "+name+" added to the blender! ✅";
      if(targetMissing().length===0){
        document.getElementById("msg").textContent+=" You have everything—go to the blender! 🥤";
      }
    }

    fixedGrab.style.display="none";
  }

  fixedGrab.addEventListener("pointerdown",grabCurrentIngredient);
  fixedGrab.addEventListener("click",e=>e.preventDefault());

  setInterval(updateFixedGrab,70);
})();


// ===== CUPS, STRIPED STRAWS, AND BLENDER LIQUID =====
(function(){
  const accessoryGrab=document.getElementById("blenderAccessoryGrab");

  // New 3D props near the blender station.
  function localBox(w,h,d,c,x,y,z){
    const m=new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({color:c,transparent:false})
    );
    m.position.set(x,y,z);
    m.castShadow=true;
    m.receiveShadow=true;
    blenderStation.add(m);
    return m;
  }

  // Stack of cups
  localBox(.55,.08,.55,0xd7b08b,-5.15,1.02,-2.35); // tray
  const cup1=localBox(.32,.35,.32,0xffffff,-5.15,1.28,-2.35);
  const cup2=localBox(.30,.33,.30,0xf9f9f9,-5.15,1.58,-2.35);
  const cup3=localBox(.28,.31,.28,0xf4f4f4,-5.15,1.86,-2.35);

  // Bowl of red-and-white striped straws
  localBox(.62,.16,.52,0xd9a05b,-4.2,1.02,-2.35); // bowl
  localBox(.09,.62,.09,0xffffff,-4.34,1.42,-2.28);
  localBox(.09,.62,.09,0xffffff,-4.20,1.45,-2.35);
  localBox(.09,.62,.09,0xffffff,-4.06,1.40,-2.42);
  localBox(.03,.62,.11,0xff4b63,-4.34,1.42,-2.28);
  localBox(.03,.62,.11,0xff4b63,-4.20,1.45,-2.35);
  localBox(.03,.62,.11,0xff4b63,-4.06,1.40,-2.42);

  // Liquid inside the blender jar.
  const chocolateBlend=localBox(.44,.34,.40,0x6a3d24,-3.8,1.42,-2.4);
  const strawberryBlend=localBox(.44,.34,.40,0xff90b4,-3.8,1.42,-2.4);
  chocolateBlend.visible=false;
  strawberryBlend.visible=false;

  let hasMilkshakeCup=false;
  let hasStripedStraw=false;

  // We will use the real cup/straw workflow instead of the old straw icon.
  addStrawBtn.style.display="none";
  addStrawBtn.onclick=()=>{};
  addStrawBtn.style.pointerEvents="none";

  function page4Open(){
    return currentPlace==="bakery" && inKitchen===true;
  }

  function cupWorld(){
    return new THREE.Vector3(blenderStation.position.x-5.15,1.86,blenderStation.position.z-2.35);
  }
  function strawWorld(){
    return new THREE.Vector3(blenderStation.position.x-4.2,1.55,blenderStation.position.z-2.35);
  }

  function updateBlendVisual(){
    const hasChoco = shakeIngredients.includes("chocolate") || madeShake==="chocolate";
    const hasBerry = shakeIngredients.includes("strawberry") || madeShake==="strawberry";
    const hasMilk = shakeIngredients.includes("milk") || madeShake==="chocolate" || madeShake==="strawberry";

    chocolateBlend.visible = page4Open() && hasChoco && hasMilk;
    strawberryBlend.visible = page4Open() && hasBerry && hasMilk && !hasChoco;
  }

  function updateAccessoryButton(){
    accessoryGrab.style.display="none";
    if(!page4Open()) return;

    // Hide the old straw icon every frame so it cannot clutter the screen.
    addStrawBtn.style.display="none";

    const nearCup=Math.hypot(P.position.x-cupWorld().x,P.position.z-cupWorld().z)<2.2;
    const nearStraw=Math.hypot(P.position.x-strawWorld().x,P.position.z-strawWorld().z)<2.2;

    // If a shake is finished, guide the player through cup then straw.
    if(madeShake && !hasMilkshakeCup && nearCup){
      accessoryGrab.style.background="#9fe2ff";
      accessoryGrab.innerHTML="🥤 GRAB CUP";
      accessoryGrab.dataset.action="cup";
      accessoryGrab.style.display="block";
      return;
    }

    if(madeShake && hasMilkshakeCup && !hasStripedStraw && nearStraw){
      accessoryGrab.style.background="#ffd4de";
      accessoryGrab.innerHTML="❤️🤍 GRAB STRAW";
      accessoryGrab.dataset.action="straw";
      accessoryGrab.style.display="block";
      return;
    }

    // Optional free grabbing even before blending.
    if(!madeShake && nearCup){
      accessoryGrab.style.background="#e9f8ff";
      accessoryGrab.innerHTML=hasMilkshakeCup?"🥤 CUP READY":"🥤 GRAB CUP";
      accessoryGrab.dataset.action="cup";
      accessoryGrab.style.display="block";
      return;
    }
    if(!madeShake && nearStraw){
      accessoryGrab.style.background="#fff1f4";
      accessoryGrab.innerHTML=hasStripedStraw?"❤️🤍 STRAW READY":"❤️🤍 GRAB STRAW";
      accessoryGrab.dataset.action="straw";
      accessoryGrab.style.display="block";
      return;
    }
  }

  accessoryGrab.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    const action=accessoryGrab.dataset.action;

    if(action==="cup"){
      hasMilkshakeCup=true;
      document.getElementById("msg").textContent=
        madeShake ? "You grabbed a cup! Now grab a striped straw. 🥤" : "You grabbed a cup! It is ready for a milkshake. 🥤";
    }

    if(action==="straw"){
      hasStripedStraw=true;
      strawAdded=true;
      if(madeShake){
        const name = madeShake==="strawberry" ? "🍓 Strawberry" : "🍫 Chocolate";
        shakeResult.innerHTML=name+" milkshake ready! <span style='font-size:28px'>🥤</span><br>Red and white striped straw added! ❤️🤍";
        document.getElementById("msg").textContent="Your milkshake is finished with a striped straw! ❤️🤍";
      }else{
        document.getElementById("msg").textContent="You grabbed a striped straw! ❤️🤍";
      }
    }

    accessoryGrab.style.display="none";
  });

  // Reset cup/straw progress when a new shake is blended.
  const oldBlendButton=blenderReadyIcon;
  oldBlendButton.addEventListener("pointerdown",()=>{
    hasMilkshakeCup=false;
    hasStripedStraw=false;
    strawAdded=false;
  });

  // If the player switches away from milkshakes, keep props but stop the completion logic.
  setInterval(()=>{
    updateAccessoryButton();
    updateBlendVisual();
    if(!page4Open()){
      accessoryGrab.style.display="none";
      addStrawBtn.style.display="none";
    }
  },70);
})();


// ===== Finish Orders =====
(function(){
 const finishOrdersBtn=document.getElementById("finishOrders");

 finishOrdersBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   servedCount+=3;
   money+=15;
   updateMoney();
   newOrders();
   document.getElementById("msg").textContent="Finished! Here are the next 3 orders. ✅📺";
 });

})();


// ===== TOUCH DRAG CAMERA CONTROL =====
(function(){
  const gameArea=document.getElementById("game");
  let draggingCamera=false;
  let dragId=null;
  let lastX=0,lastY=0;

  function interactiveTarget(el){
    return !!el.closest("button, #pad, #housePanel, #orders, #recipePanel, #avatarShop, #remotePanel, #tvScreen, #furnitureMover");
  }

  gameArea.addEventListener("pointerdown",e=>{
    if(interactiveTarget(e.target)) return;
    draggingCamera=true;
    dragId=e.pointerId;
    lastX=e.clientX;
    lastY=e.clientY;
    gameArea.setPointerCapture(e.pointerId);
  });

  gameArea.addEventListener("pointermove",e=>{
    if(!draggingCamera || e.pointerId!==dragId) return;
    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;
    lastX=e.clientX;
    lastY=e.clientY;

    cameraAngle-=dx*0.012;
    cameraHeight=Math.max(3.2,Math.min(11,cameraHeight+dy*0.02));
  });

  function stopDrag(e){
    if(e.pointerId!==dragId) return;
    draggingCamera=false;
    dragId=null;
  }
  gameArea.addEventListener("pointerup",e=>{draggingCamera=false;dragId=null;});
  gameArea.addEventListener("pointercancel",e=>{draggingCamera=false;dragId=null;});

  // Also disable the old look pad behavior variables if they exist.
  if(typeof looking!=="undefined") looking=false;
  if(typeof lookX!=="undefined") lookX=0;
  if(typeof lookY!=="undefined") lookY=0;
})();


// ===== PAGE 5 STOCK BOXES + PAGE 4 RESTOCK SYSTEM =====
(function(){
 const restockShelfBtn=document.getElementById("restockShelf");
 const stockLabels=[...Array(8)].map((_,i)=>document.getElementById("boxLabel"+i));
 const stockBoxInfo=[
   {name:"Strawberry",emoji:"🍓",color:0xff7ca1,x:15.1,y:3.18,z:-18.75},
   {name:"Banana",emoji:"🍌",color:0xffda56,x:16.35,y:3.18,z:-18.75},
   {name:"Egg",emoji:"🥚",color:0xfff4d6,x:23.15,y:3.18,z:-18.75},
   {name:"Milk",emoji:"🥛",color:0xeaf8ff,x:24.4,y:3.18,z:-18.75},
   {name:"Flour",emoji:"🌾",color:0xf2d7a7,x:15.15,y:3.18,z:-10.15},
   {name:"Sugar",emoji:"🍬",color:0xffb6d8,x:16.4,y:3.18,z:-10.15},
   {name:"Butter",emoji:"🧈",color:0xffdf6a,x:23.15,y:3.18,z:-10.15},
   {name:"Chocolate",emoji:"🍫",color:0x6b351f,x:24.4,y:3.18,z:-10.15}
 ];
 window.stockBoxes=[];
 const stockBoxes=window.stockBoxes;

 function makeStockBox(info){
   const g=new THREE.Group();
   g.position.set(info.x,info.y,info.z);
   g.userData={name:info.name+" Box",emoji:"📦",held:false,stockIngredient:info.name,stockEmoji:info.emoji};
   function part(w,h,d,c,x,y,z){
     const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));
     m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
   }
   // box body
   part(.95,.7,.62,0xc89c72,0,0,0);
   part(.99,.08,.66,0x9d734d,0,.39,0);
   // colored food sticker
   part(.46,.28,.04,0xffffff,0,.04,.33);
   part(.22,.22,.04,info.color,-.12,.05,.35);
   part(.14,.14,.04,info.color,.1,.05,.35);
   page5Group.add(g);
   stockBoxes.push(g);
   grabItems.push(g);
   return g;
 }
 stockBoxInfo.forEach(makeStockBox);

 function setIngredientStock(name,on){
   ingredientModels.forEach(m=>{
     if(m.userData.ingredient===name){
       m.visible=on;
       m.userData.stocked=on;
     }
   });
 }
 function setAllIngredientStock(on){
   ingredientModels.forEach(m=>{
     m.visible=on;
     m.userData.stocked=on;
   });
 }
 ingredientModels.forEach(m=>m.userData.stocked=true);

 function updateStorageBoxLabels(){
   stockBoxes.forEach((box,i)=>{
     const el=stockLabels[i];
     if(!el)return;
     if(currentPlace!=="bakery" || inStorage!==true || !box.visible || box.userData.held){
       el.style.display="none";
       return;
     }
     const p=box.position.clone();
     p.y+=.78;
     p.project(C);
     if(p.z<-1 || p.z>1){el.style.display="none";return;}
     el.style.display="block";
     el.textContent=box.userData.stockEmoji+" "+box.userData.stockIngredient;
     el.style.left=((p.x*.5+.5)*innerWidth-el.offsetWidth/2)+"px";
     el.style.top=((-p.y*.5+.5)*innerHeight-el.offsetHeight-10)+"px";
   });
 }

 function updateRestockButton(){
   if(!(currentPlace==="bakery" && inKitchen===true && inStorage!==true && heldItem && heldItem.userData && heldItem.userData.stockIngredient)){
     restockShelfBtn.style.display="none";
     return;
   }
   const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.3;
   if(!nearShelf){
     restockShelfBtn.style.display="none";
     return;
   }
   const p=new THREE.Vector3(-.1,3.6,-19.6).project(C);
   if(p.z<-1 || p.z>1){
     restockShelfBtn.style.display="none";
     return;
   }
   restockShelfBtn.style.display="block";
   restockShelfBtn.style.left=((p.x*.5+.5)*innerWidth-72)+"px";
   restockShelfBtn.style.top=((-p.y*.5+.5)*innerHeight-24)+"px";
   restockShelfBtn.innerHTML="📦 RESTOCK<br>"+heldItem.userData.stockEmoji+" "+heldItem.userData.stockIngredient;
 }

 restockShelfBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   if(!(heldItem && heldItem.userData && heldItem.userData.stockIngredient))return;

   const ingredientName=heldItem.userData.stockIngredient;
   setIngredientStock(ingredientName,true);

   // consume the box and remove it from the game
   const usedBox=heldItem;
   usedBox.userData.held=false;
   usedBox.visible=false;
   if(usedBox.parent) usedBox.parent.remove(usedBox);
   const gi=grabItems.indexOf(usedBox);
   if(gi>=0) grabItems.splice(gi,1);
   const sb=stockBoxes.indexOf(usedBox);
   if(sb>=0) stockBoxes.splice(sb,1);

   heldItem=null;
   itemLabel.textContent="Hands: Empty";
   grabButton.innerHTML="🤲<br>GRAB";
   restockShelfBtn.style.display="none";

   const left=ingredientModels.filter(m=>!m.visible).length;
   document.getElementById("msg").textContent=
     "You restocked "+ingredientName+" on the kitchen shelf! "+(left===0?"Everything is restocked! ✨":"There are still "+left+" empty shelf spots.");
 });

 // After a full set of 3 bakery orders is finished, the shelf runs out.
 const finishOrdersBtn2=document.getElementById("finishOrders");
 finishOrdersBtn2.addEventListener("pointerdown",()=>{
   setAllIngredientStock(false);
   selectedIngredient=null;
   const a=document.getElementById("fixedIngredientGrab");
   const b=document.getElementById("ingredientGrab");
   const c=document.getElementById("shakeGrab");
   if(a)a.style.display="none";
   if(b)b.style.display="none";
   if(c)c.style.display="none";
   document.getElementById("msg").textContent="You finished 3 orders, so the shelf is empty now! Walk or teleport to storage and bring back stock boxes. 📦";
 });

 setInterval(()=>{
   updateStorageBoxLabels();
   updateRestockButton();
 },70);
})();


// ===== HOUSE FURNITURE SHOP =====
(function(){
  const shop=document.getElementById("houseShop");
  const openBtn=document.getElementById("openHouseShop");
  const closeBtn=document.getElementById("closeHouseShop");
  const message=document.getElementById("houseShopMessage");

  const names={
    bookshelf:"Bookshelf",
    rug:"Cozy Rug",
    dresser:"Dresser",
    plant:"House Plant",
    desk:"Desk",
    vanity:"Vanity"
  };

  function openShop(){
    if(currentPlace!=="house"){
      document.getElementById("msg").textContent="Go to your house to use the furniture shop. 🏠";
      return;
    }
    shop.style.display="flex";
    message.textContent="You have $"+money+". Choose new furniture! ✨";
  }

  function closeShop(){
    shop.style.display="none";
  }

  openBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    openShop();
  });

  closeBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    closeShop();
  });

  shop.addEventListener("pointerdown",e=>{
    if(e.target===shop)closeShop();
  });

  document.querySelectorAll("[data-buy-furniture]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{
      e.preventDefault();
      e.stopPropagation();

      const kind=btn.dataset.buyFurniture;
      const price=Number(btn.dataset.price);

      if(money<price){
        message.textContent="You need $"+price+" for the "+names[kind]+". You have $"+money+".";
        return;
      }

      money-=price;
      updateMoney();
      addFurniture(kind);
      selectedFurnitureIndex=furniture.length-1;
      updateFurnitureLabel();

      message.textContent="You bought a "+names[kind]+"! It was added to your house. 🎉";
      document.getElementById("msg").textContent="New furniture added! Turn on Build Mode to move it. 🏠✨";
    });
  });

  // Shop only belongs to the house.
  setInterval(()=>{
    if(currentPlace!=="house") shop.style.display="none";
  },120);
})();


// ===== FINAL: INSIDE-HOUSE TELEPORT + 4-SLOT STOCK INVENTORY =====
(function(){
  // Replace CHECK so only the final inside-house teleport runs.
  const oldCheck=document.getElementById("checkHouse");
  const check=oldCheck.cloneNode(true);
  oldCheck.parentNode.replaceChild(check,oldCheck);

  check.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    if(typeof showHouse==="function") showHouse();

    // Spawn safely inside the middle of the house.
    P.position.set(0,0,0.7);
    P.rotation.set(0,Math.PI,0);
    cameraAngle=.15;
    cameraHeight=6.5;
    C.position.set(3.5,6.5,7.5);
    C.lookAt(0,1.2,0);

    document.getElementById("orders").style.display="none";
    document.getElementById("msg").textContent="Teleported inside your house! 🏠✨";
  });

  // Replace old box and restock buttons so old one-box listeners cannot interfere.
  const oldBoxBtn=document.getElementById("boxGrabButton");
  const boxBtn=oldBoxBtn.cloneNode(true);
  oldBoxBtn.parentNode.replaceChild(boxBtn,oldBoxBtn);

  const oldRestock=document.getElementById("restockShelf");
  const restockBtn=oldRestock.cloneNode(true);
  oldRestock.parentNode.replaceChild(restockBtn,oldRestock);

  const inventoryBox=document.getElementById("inventoryBox");
  const stockInventory=[]; // up to four {name, emoji}
  const MAX_STOCK=4;

  // Stock boxes are handled only by this inventory system.
  function allStockBoxes(){ return window.stockBoxes || []; }

  allStockBoxes().forEach(box=>{
    const i=grabItems.indexOf(box);
    if(i>=0) grabItems.splice(i,1);
  });

  function nearestBox(){
    let best=null,bestD=2.5;
    allStockBoxes().forEach(box=>{
      if(!box || !box.visible || box.userData.held || box.userData.collected)return;
      const d=Math.hypot(box.position.x-P.position.x,box.position.z-P.position.z);
      if(d<bestD){best=box;bestD=d;}
    });
    return best;
  }

  let lastInventorySignature="";
  let lastInventoryVisible=null;

  function renderInventory(){
    const showInventory =
      currentPlace==="bakery" &&
      (inStorage===true || (inKitchen===true && inStorage!==true));

    if(lastInventoryVisible!==showInventory){
      inventoryBox.style.display=showInventory?"block":"none";
      lastInventoryVisible=showInventory;
    }

    if(!showInventory)return;

    const signature=stockInventory.map(item=>item.name).join("|");
    if(signature===lastInventorySignature)return;
    lastInventorySignature=signature;

    let slots="";
    for(let i=0;i<MAX_STOCK;i++){
      const item=stockInventory[i];
      slots+=item
        ? `<div class="inventorySlot filled">${item.emoji}<br>${item.name}</div>`
        : `<div class="inventorySlot">Empty</div>`;
    }

    inventoryBox.innerHTML=
      `<b>📦 Stock Inventory ${stockInventory.length}/${MAX_STOCK}</b>`+
      `<div id="inventorySlots">${slots}</div>`+
      `<span class="small">Kitchen and storage only</span>`;
  }

  function updateBoxButton(){
    if(!(currentPlace==="bakery" && inStorage===true)){
      boxBtn.style.display="none";
      return;
    }

    if(stockInventory.length>=MAX_STOCK){
      boxBtn.style.display="none";
      return;
    }

    const box=nearestBox();
    if(!box){
      boxBtn.style.display="none";
      return;
    }

    const p=box.position.clone();
    p.y+=1.1;
    p.project(C);
    if(p.z<-1||p.z>1){
      boxBtn.style.display="none";
      return;
    }

    boxBtn.style.display="block";
    boxBtn.innerHTML="🤲 GRAB BOX<br>"+box.userData.stockEmoji+" "+box.userData.stockIngredient;
    boxBtn.style.left=((p.x*.5+.5)*innerWidth-boxBtn.offsetWidth/2)+"px";
    boxBtn.style.top=((-p.y*.5+.5)*innerHeight-boxBtn.offsetHeight-8)+"px";
  }

  boxBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();

    if(stockInventory.length>=MAX_STOCK){
      document.getElementById("msg").textContent="Your stock inventory is full. You can carry 4 boxes. 📦";
      return;
    }

    const box=nearestBox();
    if(!box){
      document.getElementById("msg").textContent="Walk closer to a stock box. 📦";
      return;
    }

    stockInventory.push({
      name:box.userData.stockIngredient,
      emoji:box.userData.stockEmoji
    });

    box.userData.collected=true;
    box.visible=false;
    if(box.parent) box.parent.remove(box);

    const gi=grabItems.indexOf(box);
    if(gi>=0)grabItems.splice(gi,1);

    boxBtn.style.display="none";
    renderInventory();
    document.getElementById("msg").textContent=
      "Added "+box.userData.stockEmoji+" "+box.userData.stockIngredient+
      " to inventory! "+stockInventory.length+"/4 slots used. 📦";
  });

  function updateRestockButton(){
    if(!(currentPlace==="bakery" && inKitchen===true && inStorage!==true && stockInventory.length>0)){
      restockBtn.style.display="none";
      return;
    }

    const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.3;
    if(!nearShelf){
      restockBtn.style.display="none";
      return;
    }

    const item=stockInventory[0];
    const p=new THREE.Vector3(-.1,3.6,-19.6).project(C);
    if(p.z<-1||p.z>1){
      restockBtn.style.display="none";
      return;
    }

    restockBtn.style.display="block";
    restockBtn.innerHTML="📦 RESTOCK<br>"+item.emoji+" "+item.name;
    restockBtn.style.left=((p.x*.5+.5)*innerWidth-restockBtn.offsetWidth/2)+"px";
    restockBtn.style.top=((-p.y*.5+.5)*innerHeight-28)+"px";
  }

  restockBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    if(!stockInventory.length)return;

    const item=stockInventory.shift();

    ingredientModels.forEach(model=>{
      if(model.userData.ingredient===item.name){
        model.visible=true;
        model.userData.stocked=true;
      }
    });

    renderInventory();
    document.getElementById("msg").textContent=
      "Restocked "+item.emoji+" "+item.name+" on the kitchen shelf! ✨";
  });

  // Keep the inventory visible throughout the game.
  renderInventory();

  setInterval(()=>{
    updateBoxButton();
    updateRestockButton();
    renderInventory();
  },120);
})();


// ===== FINAL HOUSE TV REMOTE, CHANNEL SVGs, ROOM LABEL, CHECK HUD, RUG FIX =====
(function(){
  const roomLabel=document.getElementById("roomName");
  const pickupBtn=document.getElementById("pickupRemoteButton");
  const handRemote=document.getElementById("handRemote");
  const channelArt=document.getElementById("channelArt");
  const oldOpenRemote=document.getElementById("openTVRemote");

  let carryingRemote=false;
  let pickedRemoteObject=null;

  const svgArt={
    news:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#78c8ff"/>
      <rect y="105" width="300" height="45" fill="#234d7d"/>
      <rect x="18" y="18" width="112" height="54" rx="8" fill="#fff"/>
      <text x="74" y="42" text-anchor="middle" font-size="17" font-weight="bold" fill="#234d7d">TINY TOWN</text>
      <text x="74" y="62" text-anchor="middle" font-size="17" font-weight="bold" fill="#e43f63">NEWS</text>
      <circle cx="205" cy="63" r="25" fill="#f2bb91"/>
      <rect x="180" y="88" width="50" height="42" rx="8" fill="#7c5cff"/>
      <rect x="242" y="50" width="11" height="65" rx="5" fill="#333"/>
      <circle cx="247" cy="44" r="13" fill="#777"/>
      <text x="150" y="140" text-anchor="middle" font-size="13" fill="#fff">Breaking stories from around town!</text>
    </svg>`,
    chef:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#ffe1a6"/>
      <rect y="106" width="300" height="44" fill="#d98b52"/>
      <rect x="32" y="54" width="95" height="53" rx="8" fill="#fff"/>
      <circle cx="200" cy="55" r="24" fill="#f2bb91"/>
      <rect x="176" y="78" width="48" height="50" rx="8" fill="#fff"/>
      <path d="M176 35 Q200 8 224 35" fill="#fff"/>
      <ellipse cx="90" cy="93" rx="35" ry="10" fill="#777"/>
      <circle cx="78" cy="83" r="8" fill="#ff6b83"/>
      <circle cx="96" cy="81" r="8" fill="#6bcf63"/>
      <text x="150" y="142" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">CHEF GARY'S KITCHEN</text>
    </svg>`,
    island:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#79d7ff"/>
      <circle cx="255" cy="28" r="20" fill="#ffe66d"/>
      <path d="M0 100 Q75 75 150 100 T300 100 V150 H0Z" fill="#48b9d1"/>
      <ellipse cx="150" cy="110" rx="78" ry="26" fill="#f4d58a"/>
      <rect x="146" y="45" width="8" height="55" fill="#8b5a2b"/>
      <path d="M150 48 Q112 30 120 14 Q143 22 150 48" fill="#4bbf66"/>
      <path d="M150 48 Q188 30 180 14 Q157 22 150 48" fill="#4bbf66"/>
      <circle cx="112" cy="92" r="16" fill="#f2bb91"/>
      <circle cx="188" cy="92" r="16" fill="#d99568"/>
      <text x="150" y="142" text-anchor="middle" font-size="15" font-weight="bold" fill="#7a3a5d">ISLAND HEARTS</text>
    </svg>`,
    monsters:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#3e356b"/>
      <circle cx="40" cy="25" r="3" fill="#fff"/><circle cx="85" cy="17" r="2" fill="#fff"/>
      <circle cx="250" cy="30" r="3" fill="#fff"/><circle cx="220" cy="15" r="2" fill="#fff"/>
      <path d="M0 120 L45 62 L88 120 Z" fill="#24563d"/>
      <path d="M65 120 L120 48 L175 120 Z" fill="#2e704d"/>
      <path d="M145 120 L205 55 L265 120 Z" fill="#24563d"/>
      <circle cx="115" cy="84" r="27" fill="#ffd54f"/>
      <circle cx="188" cy="89" r="25" fill="#78d66e"/>
      <circle cx="108" cy="78" r="4" fill="#222"/><circle cx="122" cy="78" r="4" fill="#222"/>
      <circle cx="181" cy="83" r="4" fill="#222"/><circle cx="195" cy="83" r="4" fill="#222"/>
      <text x="150" y="142" text-anchor="middle" font-size="15" font-weight="bold" fill="#fff">POCKET PALS ADVENTURES</text>
    </svg>`
  };

  function setRoomLabel(){
    if(currentPlace==="bakery"){
      roomLabel.style.display="block";
      if(inStorage===true) roomLabel.textContent="Bakery Storage";
      else if(inKitchen===true) roomLabel.textContent="Bakery Kitchen";
      else roomLabel.textContent="Main Bakery";
    }else{
      roomLabel.style.display="none";
    }
  }

  function nearestRemote(){
    return furniture.find(f=>
      f.userData.kind==="remote" &&
      Math.hypot(f.position.x-P.position.x,f.position.z-P.position.z)<2.2
    );
  }

  let lastHandRemoteVisible=null;
  let lastPickupVisible=null;

  function setRemoteVisible(el,show,lastName){
    const value=show?"block":"none";
    if(lastName==="hand"){
      if(lastHandRemoteVisible===show)return;
      lastHandRemoteVisible=show;
    }else{
      if(lastPickupVisible===show)return;
      lastPickupVisible=show;
    }
    el.style.display=value;
  }

  function updateRemotePickup(){
    setRoomLabel();

    // Old floating remote menus stay hidden.
    oldOpenRemote.style.display="none";
    remotePanelEl.style.display="none";

    const avatarShopOpen=avatarShop.style.display==="block";
    const houseShopOpen=document.getElementById("houseShop") &&
      document.getElementById("houseShop").style.display==="flex";

    // Hide the remote while a full-screen shop is open so it never covers the shop.
    if(currentPlace!=="house" || avatarShopOpen || houseShopOpen){
      setRemoteVisible(pickupBtn,false,"pickup");
      setRemoteVisible(handRemote,false,"hand");
      return;
    }

    if(carryingRemote){
      setRemoteVisible(pickupBtn,false,"pickup");
      setRemoteVisible(handRemote,true,"hand");
      return;
    }

    setRemoteVisible(handRemote,false,"hand");
    const remote=nearestRemote();
    if(!remote || buildingMode){
      setRemoteVisible(pickupBtn,false,"pickup");
      return;
    }

    const p=remote.position.clone();
    p.y+=.8;
    p.project(C);
    if(p.z<-1||p.z>1){
      setRemoteVisible(pickupBtn,false,"pickup");
      return;
    }

    setRemoteVisible(pickupBtn,true,"pickup");
    pickupBtn.style.left=((p.x*.5+.5)*innerWidth-pickupBtn.offsetWidth/2)+"px";
    pickupBtn.style.top=((-p.y*.5+.5)*innerHeight-pickupBtn.offsetHeight-8)+"px";
  }

  pickupBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    const remote=nearestRemote();
    if(!remote)return;
    carryingRemote=true;
    pickedRemoteObject=remote;
    remote.visible=false;
    handRemote.style.display="block";
    document.getElementById("msg").textContent="You picked up the TV remote! Use the remote at the bottom-right. 📱";
  });

  document.getElementById("putRemoteDown").addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    carryingRemote=false;
    if(pickedRemoteObject){
      pickedRemoteObject.position.set(P.position.x,.15,P.position.z-.8);
      pickedRemoteObject.visible=true;
      pickedRemoteObject=null;
      saveWorld();
    }
    handRemote.style.display="none";

    // Putting the remote down also closes and powers off the TV popup.
    tvIsOn=false;
    tvScreenEl.style.display="none";
    if(tvAnimationTimer){
      clearInterval(tvAnimationTimer);
      tvAnimationTimer=null;
    }

    document.getElementById("msg").textContent="You put the remote down, and the TV turned off. 📱📺";
  });

  function powerTV(){
    if(!carryingRemote){
      document.getElementById("msg").textContent="Pick up the remote first. 📱";
      return;
    }
    if(!hasFurniture("tv")){
      document.getElementById("msg").textContent="Add a TV to the house first. 📺";
      return;
    }
    tvIsOn=!tvIsOn;
    tvScreenEl.style.display=tvIsOn?"block":"none";
    if(tvIsOn)showTVChannel(currentChannel);
  }

  document.getElementById("handRemotePower").addEventListener("pointerdown",e=>{
    e.preventDefault();e.stopPropagation();powerTV();
  });

  document.querySelectorAll("[data-hand-channel]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{
      e.preventDefault();
      e.stopPropagation();
      if(!carryingRemote)return;
      if(!tvIsOn){
        document.getElementById("msg").textContent="Press Power on the remote first. 📺";
        return;
      }
      showTVChannel(btn.dataset.handChannel);
    });
  });

  // Add SVG placeholder artwork whenever a channel changes.
  const oldShowTVChannel=showTVChannel;
  showTVChannel=function(name){
    oldShowTVChannel(name);
    channelArt.style.display="flex";
    channelArt.innerHTML=svgArt[name]||svgArt.news;

    // Keep the original emoji actors hidden because the SVG channel now animates.
    document.getElementById("actor1").style.display="none";
    document.getElementById("actor2").style.display="none";
    document.getElementById("tvProp").style.display="none";
    document.getElementById("speech").style.display="none";
  };

  // Keep CHECK away from the top-right HUD.
  const check=document.getElementById("checkHouse");
  check.style.left="12px";
  check.style.right="auto";
  check.style.top="58px";

  // Ensure already-added rugs are visible too.
  furniture.filter(f=>f.userData.kind==="rug").forEach(rug=>{
    rug.position.y=.16;
    rug.visible=true;
  });

  setInterval(updateRemotePickup,100);
})();
