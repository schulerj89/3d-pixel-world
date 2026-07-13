// Data-driven Restaurant destination. Bakery code remains available but dormant.
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.RestaurantWorld=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__";
 const KIT_URL=`assets/models/restaurant/kaykit-restaurant-kit.glb?v=${BUILD_VERSION}`;
 const BACKGROUND_COLOR=0x87ceeb;
 const EXTRA_ASSETS=Object.freeze({
  cashRegister:Object.freeze({assetId:"restaurant.front.cash-register",kind:"prop",url:`assets/models/restaurant-extras/cash-register.glb?v=${BUILD_VERSION}`,bytes:323928,position:Object.freeze({x:0,y:1.03,z:15.08}),scale:1.15,yaw:Math.PI}),
  cashierMerchant:Object.freeze({assetId:"restaurant.npc.cashier-merchant",kind:"npc",url:`assets/models/restaurant-npcs/cashier-merchant.glb?v=${BUILD_VERSION}`,bytes:999400,position:Object.freeze({x:0,y:0,z:13.9}),scale:1.08,yaw:0,idleClip:"anim_iddle",walkClip:"anim_walk"})
 });
 const CASH_DESK=Object.freeze({assetId:"restaurant.front.cash-desk",sourceScene:"kitchencounter_straight_A_backsplash",position:Object.freeze({x:0,y:0,z:15.5}),scale:1,yaw:Math.PI,collision:Object.freeze([1,1.03])});
 const FRONT_ENTRANCE=Object.freeze({assetId:"restaurant.front.entrance",frameAssetId:"restaurant.front.entrance-frame",frameScene:"wall_doorway",doorAssetId:"restaurant.front.door",doorScene:"door_A",position:Object.freeze({x:0,y:0,z:20}),doorOffsetX:-.8,yaw:0,collision:Object.freeze([2,.25])});
 const INITIAL_CUSTOMER_ORDERS=Object.freeze(["strawberry-plate","burger","dinner","strawberry-dessert"].map((productId,index)=>Object.freeze({id:`restaurant-order-${String(index+1).padStart(3,"0")}`,productId})));
 const KITCHEN_FOOD_COUNTER=Object.freeze({
  assetId:"restaurant.kitchen.food-counter",sourceScene:"kitchentable_A_large",position:Object.freeze({x:-11,y:0,z:-34.5}),yaw:Math.PI/2,collision:Object.freeze([1,1.5]),
  food:Object.freeze([Object.freeze({assetId:"restaurant.kitchen.food.burger",sourceScene:"food_burger",x:-.6,y:1.04,z:0,scale:.55}),Object.freeze({assetId:"restaurant.kitchen.food.dinner",sourceScene:"food_dinner",x:.6,y:1.04,z:0,scale:.55})]),
  marker:Object.freeze({id:"restaurant.kitchen.food-counter-nearby",icon:"🍔",range:3.4,x:0,y:2.15,z:0,action:null})
 });
 const ROOM_FILES={dining:"restaurant-main-level.txt",kitchen:"restaurant-kitchen-level.txt"};
 const WALKABLE=new Set([".","D","E"]);
 const PLAYER_RADIUS=.28;
 const WALL=Object.freeze({sourceScene:"wall",moduleLength:4,height:4,thickness:.5});
 const KITCHEN_FLOOR=Object.freeze({sourceScene:"floor_kitchen",tileSize:4,surfaceY:0,thickness:.5,fixtureBaseY:0,playerBaseY:0});
 const DEBUG_VIEWS=Object.freeze({
  "kitchen-overview":Object.freeze({room:"kitchen",position:Object.freeze({x:0,z:-30}),camera:Object.freeze({angle:0,height:11,distance:15})}),
  "kitchen-fixtures":Object.freeze({room:"kitchen",position:Object.freeze({x:.5,z:-37.5}),camera:Object.freeze({angle:.15,height:8,distance:9})}),
  "kitchen-doorway":Object.freeze({room:"kitchen",position:Object.freeze({x:.5,z:-23.5}),camera:Object.freeze({angle:.35,height:6.5,distance:8})}),
  "kitchen-north-wall":Object.freeze({room:"kitchen",position:Object.freeze({x:0,z:-39}),camera:Object.freeze({angle:0,height:6.5,distance:10})}),
  "kitchen-west-wall":Object.freeze({room:"kitchen",position:Object.freeze({x:-8.5,z:-34}),camera:Object.freeze({angle:Math.PI/2,height:6.5,distance:10})}),
  "kitchen-east-wall":Object.freeze({room:"kitchen",position:Object.freeze({x:8.5,z:-34}),camera:Object.freeze({angle:-Math.PI/2,height:6.5,distance:10})}),
  "kitchen-plain-stoves":Object.freeze({room:"kitchen",position:Object.freeze({x:3,z:-41.5}),camera:Object.freeze({angle:0,height:4.8,distance:6.5}),hidePlayer:true}),
  "restaurant-wall-north-doorway":Object.freeze({room:"dining",position:Object.freeze({x:0,z:-16}),camera:Object.freeze({angle:0,height:6.5,distance:8})}),
  "restaurant-wall-southwest":Object.freeze({room:"dining",position:Object.freeze({x:-14,z:16}),camera:Object.freeze({angle:2.35,height:7,distance:8})}),
  "restaurant-wall-southeast":Object.freeze({room:"dining",position:Object.freeze({x:14,z:16}),camera:Object.freeze({angle:-2.35,height:7,distance:8})}),
  "restaurant-chair-table":Object.freeze({room:"dining",position:Object.freeze({x:-11.5,z:12.5}),camera:Object.freeze({angle:0,height:5.5,distance:7})}),
  "restaurant-cash-register":Object.freeze({room:"dining",position:Object.freeze({x:0,z:14}),camera:Object.freeze({angle:Math.PI,height:4.4,distance:5.5}),hidePlayer:true}),
  "restaurant-front-door":Object.freeze({room:"dining",position:Object.freeze({x:0,z:19.5}),camera:Object.freeze({angle:0,height:4.5,distance:6}),hidePlayer:true}),
  "restaurant-cashier-npc":Object.freeze({room:"dining",position:Object.freeze({x:0,z:13.5}),camera:Object.freeze({angle:Math.PI,height:4.6,distance:6}),hidePlayer:true}),
  "restaurant-customer-line":Object.freeze({room:"dining",position:Object.freeze({x:2.5,z:17.25}),camera:Object.freeze({angle:Math.PI,height:6,distance:8}),hidePlayer:true}),
  "restaurant-sky-overview":Object.freeze({room:"dining",position:Object.freeze({x:0,z:5}),camera:Object.freeze({angle:.35,height:9,distance:11})}),
  "kitchen-food-counter":Object.freeze({room:"kitchen",position:Object.freeze({x:-8.6,z:-34.5}),camera:Object.freeze({angle:Math.PI/2,height:5.8,distance:7}),hidePlayer:true}),
  "kitchen-wall-northwest":Object.freeze({room:"kitchen",position:Object.freeze({x:-8,z:-41}),camera:Object.freeze({angle:.8,height:6.5,distance:7})}),
  "kitchen-wall-northeast":Object.freeze({room:"kitchen",position:Object.freeze({x:9,z:-41}),camera:Object.freeze({angle:-.8,height:6.5,distance:7})})
 });
 const ASSET_REGISTRY=Object.freeze({
  T:{assetId:"restaurant.table.round",sourceScene:"table_round_A",scale:.78,collision:[1.17,1.17],color:0xb87955,size:[1.35,.78,1.35],height:.39},
  C:{assetId:"restaurant.chair.dining",sourceScene:"chair_A",scale:.88,collision:[.34,.36],color:0xd79a78,size:[.72,1.05,.72],height:.525},
  B:{assetId:"restaurant.booth.single",sourceScene:"chair_stool",scale:1.15,collision:[.44,.44],color:0xc75f87,size:[.9,1.15,1.5],height:.575},
  H:{assetId:"restaurant.host.stand",sourceScene:"menu",scale:1.35,collision:[.35,.24],color:0x8f5d45,size:[.9,1.25,.7],height:.625},
  P:{assetId:"restaurant.plant.potted",collision:[.38,.38],color:0x5da56c,size:[.75,1.35,.75],height:.675},
  K:{assetId:"restaurant.kitchen.prep",sourceScene:"kitchencounter_straight_A_backsplash",collision:[1,1.03],color:0xb9c6cf,size:[.92,1,.92],height:.5},
  S:{assetId:"restaurant.kitchen.stove",sourceScene:"stove_multi",collision:[1,1.174],color:0x555d66,size:[2,1.2,2.288],height:.6},
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
   const symbol=room.map[row]?.[col];if(!symbol||WALKABLE.has(symbol))continue;
   const center=cellCenter(room,col,row);
   if(symbol==="#"){
    const boundary=wallCellCollision(room,col,row,center);
    if(Math.abs(x-boundary.x)<boundary.halfX+PLAYER_RADIUS&&Math.abs(z-boundary.z)<boundary.halfZ+PLAYER_RADIUS)return false;continue;
   }
   const spec=ASSET_REGISTRY[symbol],transform=assetTransform(room,symbol,col,row,center),baseHalf=spec?.collision||[room.cell/2,room.cell/2];
   const half=Math.abs(Math.sin(transform.yaw))>.5?[baseHalf[1],baseHalf[0]]:baseHalf;
   if(Math.abs(x-transform.x)<half[0]+PLAYER_RADIUS&&Math.abs(z-transform.z)<half[1]+PLAYER_RADIUS)return false;
  }
  if(room.room==="dining"&&Math.abs(x-CASH_DESK.position.x)<CASH_DESK.collision[0]+PLAYER_RADIUS&&Math.abs(z-CASH_DESK.position.z)<CASH_DESK.collision[1]+PLAYER_RADIUS)return false;
  if(room.room==="dining"&&Math.abs(x-FRONT_ENTRANCE.position.x)<FRONT_ENTRANCE.collision[0]+PLAYER_RADIUS&&Math.abs(z-FRONT_ENTRANCE.position.z)<FRONT_ENTRANCE.collision[1]+PLAYER_RADIUS)return false;
  if(room.room==="kitchen"&&Math.abs(x-KITCHEN_FOOD_COUNTER.position.x)<KITCHEN_FOOD_COUNTER.collision[0]+PLAYER_RADIUS&&Math.abs(z-KITCHEN_FOOD_COUNTER.position.z)<KITCHEN_FOOD_COUNTER.collision[1]+PLAYER_RADIUS)return false;
  return true;
 }
 function wallCellCollision(room,col,row,center){
  if(row===0)return {x:center.x,z:room.originZ,halfX:room.cell/2,halfZ:WALL.thickness/2};
  if(row===room.map.length-1)return {x:center.x,z:room.originZ+room.depth,halfX:room.cell/2,halfZ:WALL.thickness/2};
  if(col===0)return {x:room.originX,z:center.z,halfX:WALL.thickness/2,halfZ:room.cell/2};
  if(col===room.map[row].length-1)return {x:room.originX+room.width,z:center.z,halfX:WALL.thickness/2,halfZ:room.cell/2};
  return {x:center.x,z:center.z,halfX:room.cell/2,halfZ:room.cell/2};
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
 function firstMesh(root){let mesh=null;root?.traverse?.(object=>{if(!mesh&&object.isMesh)mesh=object});return mesh}
 function buildKitchenFloor(THREE,room,kit,matrix){
  const floorGroup=new THREE.Group();floorGroup.name="restaurant-kitchen-checkerboard";
  const prototype=sourceScene(kit,KITCHEN_FLOOR.sourceScene),source=firstMesh(prototype);
  if(source){
   const columns=Math.ceil(room.width/KITCHEN_FLOOR.tileSize),rows=Math.ceil(room.depth/KITCHEN_FLOOR.tileSize);
   const tiles=new THREE.InstancedMesh(source.geometry,source.material,columns*rows);let index=0;
   for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const width=Math.min(KITCHEN_FLOOR.tileSize,room.width-col*KITCHEN_FLOOR.tileSize);
    const depth=Math.min(KITCHEN_FLOOR.tileSize,room.depth-row*KITCHEN_FLOOR.tileSize);
    matrix.makeScale(width/2,KITCHEN_FLOOR.thickness*4,depth/2);
    matrix.setPosition(room.originX+col*KITCHEN_FLOOR.tileSize+width/2,-KITCHEN_FLOOR.thickness/2,room.originZ+row*KITCHEN_FLOOR.tileSize+depth/2);
    tiles.setMatrixAt(index++,matrix);
   }
   tiles.instanceMatrix.needsUpdate=true;tiles.receiveShadow=true;tiles.frustumCulled=false;
   tiles.userData={assetId:"restaurant.floor.kitchen.checkerboard.instances",sourceScene:KITCHEN_FLOOR.sourceScene,instanceCount:index};
   floorGroup.add(tiles);
   floorGroup.userData={assetId:"restaurant.floor.kitchen.checkerboard",sourceScene:KITCHEN_FLOOR.sourceScene,tileSize:KITCHEN_FLOOR.tileSize,tileCount:index,surfaceY:KITCHEN_FLOOR.surfaceY,fixtureBaseY:KITCHEN_FLOOR.fixtureBaseY,playerBaseY:KITCHEN_FLOOR.playerBaseY,sourceReady:true};
   return floorGroup;
  }
  const geometry=new THREE.BoxGeometry(room.cell,.18,room.cell),materials=[new THREE.MeshStandardMaterial({color:0xf1efe8,roughness:.94}),new THREE.MeshStandardMaterial({color:0x24272b,roughness:.94})];
  const cells=[[],[]];
  for(let row=0;row<room.depth/room.cell;row++)for(let col=0;col<room.width/room.cell;col++)cells[(row+col)%2].push(cellCenter(room,col,row));
  cells.forEach((positions,color)=>{
   const batch=new THREE.InstancedMesh(geometry,materials[color],positions.length);
   positions.forEach((position,index)=>{matrix.makeTranslation(position.x,-.09,position.z);batch.setMatrixAt(index,matrix)});
   batch.instanceMatrix.needsUpdate=true;batch.receiveShadow=true;batch.userData={assetId:`restaurant.floor.kitchen.checkerboard.${color?"dark":"light"}`,instanceCount:positions.length};floorGroup.add(batch);
  });
  floorGroup.userData={assetId:"restaurant.floor.kitchen.checkerboard",sourceScene:KITCHEN_FLOOR.sourceScene,tileSize:room.cell,tileCount:room.width/room.cell*room.depth/room.cell,surfaceY:KITCHEN_FLOOR.surfaceY,fixtureBaseY:KITCHEN_FLOOR.fixtureBaseY,playerBaseY:KITCHEN_FLOOR.playerBaseY,sourceReady:false};
  return floorGroup;
 }
 function wallBoundaryLines(rooms){
  const lines=[];
  rooms.forEach(room=>{
   const lastRow=room.map.length-1,lastCol=room.map[0].length-1;
   lines.push(
    {axis:"x",fixed:room.originZ,start:room.originX,cell:room.cell,symbols:room.map[0]},
    {axis:"x",fixed:room.originZ+room.depth,start:room.originX,cell:room.cell,symbols:room.map[lastRow]},
    {axis:"z",fixed:room.originX,start:room.originZ,cell:room.cell,symbols:room.map.map(row=>row[0]).join("")},
    {axis:"z",fixed:room.originX+room.width,start:room.originZ,cell:room.cell,symbols:room.map.map(row=>row[lastCol]).join("")}
   );
  });
  return lines.filter((line,index)=>!lines.slice(0,index).some(previous=>previous.axis===line.axis&&Math.abs(previous.fixed-line.fixed)<.001&&previous.start<=line.start&&previous.start+previous.symbols.length*previous.cell>=line.start+line.symbols.length*line.cell));
 }
 function wallSegments(rooms){
  const segments=[];
  wallBoundaryLines(rooms).forEach(line=>{
   let index=0;
   while(index<line.symbols.length){
    if(line.symbols[index]!=="#"){index++;continue}
    const runStart=index;while(index<line.symbols.length&&line.symbols[index]==="#")index++;
    const runLength=(index-runStart)*line.cell,count=Math.ceil(runLength/WALL.moduleLength),length=runLength/count;
    for(let part=0;part<count;part++){
     const along=line.start+runStart*line.cell+(part+.5)*length;
     segments.push({x:line.axis==="x"?along:line.fixed,z:line.axis==="z"?along:line.fixed,yaw:line.axis==="z"?Math.PI/2:0,length});
    }
   }
  });
  return segments;
 }
 function buildWalls(THREE,rooms,kit,matrix){
  const segments=wallSegments(rooms),prototype=sourceScene(kit,WALL.sourceScene),source=firstMesh(prototype);
  if(source){
   const walls=new THREE.InstancedMesh(source.geometry,source.material,segments.length),scale=new THREE.Vector3();
   segments.forEach((segment,index)=>{
    matrix.makeRotationY(segment.yaw);scale.set((source.scale?.x||2)*segment.length/WALL.moduleLength,source.scale?.y||2,source.scale?.z||2);matrix.scale(scale);
    matrix.setPosition(segment.x,source.position?.y??WALL.height/2,segment.z);walls.setMatrixAt(index,matrix);
   });
   walls.instanceMatrix.needsUpdate=true;walls.castShadow=walls.receiveShadow=true;walls.frustumCulled=false;
   walls.userData={assetId:"restaurant.wall.kaykit",sourceScene:WALL.sourceScene,placeholder:false,instanceCount:segments.length,moduleLength:WALL.moduleLength,height:WALL.height,thickness:WALL.thickness};return walls;
  }
  const geometry=new THREE.BoxGeometry(1,WALL.height,1),material=new THREE.MeshStandardMaterial({color:0xf4d6cc,roughness:.92}),walls=new THREE.InstancedMesh(geometry,material,segments.length),scale=new THREE.Vector3();
  segments.forEach((segment,index)=>{matrix.makeRotationY(segment.yaw);scale.set(segment.length,1,WALL.thickness);matrix.scale(scale);matrix.setPosition(segment.x,WALL.height/2,segment.z);walls.setMatrixAt(index,matrix)});
  walls.instanceMatrix.needsUpdate=true;walls.castShadow=walls.receiveShadow=true;walls.userData={assetId:"restaurant.wall.fallback",sourceScene:WALL.sourceScene,placeholder:true,instanceCount:segments.length};return walls;
 }
 function assetTransform(room,symbol,col,row,position){
  let x=position.x,z=position.z,yaw=0;
  if(symbol==="C"){
   if(room.map[row]?.[col+1]==="T"){x-=.58;yaw=Math.PI/2}
   else if(room.map[row]?.[col-1]==="T"){x+=.58;yaw=-Math.PI/2}
  }
  if(symbol==="B")yaw=Math.abs(x)<room.width*.25?0:(x<room.originX+room.width/2?Math.PI/2:-Math.PI/2);
  if(room.room==="kitchen"&&WALL_FIXTURES.has(symbol)){
   const halfDepth=ASSET_REGISTRY[symbol].collision[1];
   if(row<=1){z=room.originZ+WALL.thickness/2+halfDepth;yaw=0}
   else if(row>=room.map.length-2){z=room.originZ+room.depth-WALL.thickness/2-halfDepth;yaw=Math.PI}
   else if(col<=1){x=room.originX+WALL.thickness/2+halfDepth;yaw=Math.PI/2}
   else if(col>=room.map[row].length-2){x=room.originX+room.width-WALL.thickness/2-halfDepth;yaw=-Math.PI/2}
  }
  return {x,z,yaw};
 }
 function buildCashierFallback(THREE,spec){
  const root=new THREE.Group();root.name=spec.assetId;const skin=new THREE.MeshStandardMaterial({color:0xd99568,roughness:.85}),uniform=new THREE.MeshStandardMaterial({color:0x6a3b75,roughness:.85});
  [[.7,.7,.7,skin,0,1.85,0],[.8,.9,.5,uniform,0,1.15,0],[.26,.75,.3,skin,-.5,1.15,0],[.26,.75,.3,skin,.5,1.15,0],[.28,.75,.34,uniform,-.2,.38,0],[.28,.75,.34,uniform,.2,.38,0]].forEach(([w,h,d,material,x,y,z])=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);root.add(mesh)});
  root.position.set(spec.position.x,spec.position.y,spec.position.z);root.rotation.y=spec.yaw;root.userData={assetId:spec.assetId,placeholder:true,idleClip:null};return root;
 }
 function customerSystemApi(){
  if(globalThis.RestaurantCustomers)return globalThis.RestaurantCustomers;
  if(typeof require==="function")try{return require("./restaurant-customer-system.js")}catch(_error){return null}
  return null;
 }
 function createCustomerAvatarFactory(THREE,parent,npcAsset){
  const spec=EXTRA_ASSETS.cashierMerchant,colors=[0x68a7d8,0xd8799b,0x7cb66d,0xd39b54];
  return ({id,order,variant})=>{
   const root=npcAsset?.scene?.clone?.(true)||buildCashierFallback(THREE,{...spec,assetId:id,position:{x:0,y:0,z:0},yaw:0});root.name=id;root.scale.setScalar?.(spec.scale*.96);root.userData={...root.userData,assetId:id,sourceAssetId:spec.assetId,orderId:String(order.id),costumeVariant:variant,placeholder:!npcAsset?.scene};parent.add(root);
   const materials=[];root.traverse?.(object=>{if(!object.isMesh)return;const source=Array.isArray(object.material)?object.material:[object.material];const variants=source.map(material=>{const clone=material?.clone?.()||material;if(clone?.color?.lerp)clone.color.lerp(new THREE.Color(colors[variant%colors.length]),.22);if(clone){clone.transparent=true;materials.push(clone)}return clone});object.material=Array.isArray(object.material)?variants:variants[0];object.castShadow=object.receiveShadow=true});
   const clips={idle:npcAsset?.animations?.find(clip=>clip.name===spec.idleClip),walk:npcAsset?.animations?.find(clip=>clip.name===spec.walkClip)},mixer=npcAsset?.scene&&THREE.AnimationMixer?new THREE.AnimationMixer(root):null,actions={},state={motion:null};
   const setMotion=motion=>{if(state.motion===motion)return;const clip=clips[motion]||clips.idle;if(!mixer||!clip){state.motion=motion;return}const next=actions[motion]||(actions[motion]=mixer.clipAction(clip));Object.values(actions).forEach(action=>{if(action!==next)action.fadeOut?.(.16)});next.reset?.().fadeIn?.(.16).play?.();state.motion=motion};
   return {root,setPosition:(x,z)=>root.position.set(x,0,z),faceDirection:(x,z)=>{root.rotation.y=Math.atan2(x,z)},setMotion,setOpacity:value=>materials.forEach(material=>{material.opacity=value}),update:dt=>mixer?.update(dt),dispose:()=>{mixer?.stopAllAction?.();parent.remove(root);materials.forEach(material=>material?.dispose?.())}};
  };
 }
 function createProximityIcon(THREE,spec){
  let marker;
  if(THREE.Sprite&&THREE.SpriteMaterial&&THREE.CanvasTexture&&globalThis.document?.createElement){
   const canvas=document.createElement("canvas");canvas.width=canvas.height=128;const context=canvas.getContext("2d");context.fillStyle="rgba(255,255,255,.94)";context.beginPath();context.arc(64,64,55,0,Math.PI*2);context.fill();context.strokeStyle="#704f8f";context.lineWidth=7;context.stroke();context.font="64px sans-serif";context.textAlign="center";context.textBaseline="middle";context.fillText(spec.icon,64,68);
   const texture=new THREE.CanvasTexture(canvas);if(THREE.SRGBColorSpace)texture.colorSpace=THREE.SRGBColorSpace;marker=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));marker.scale.set(.82,.82,1);marker.renderOrder=100;
  }else marker=new THREE.Group();
  marker.name=spec.id;marker.position.set(spec.x,spec.y,spec.z);marker.visible=false;marker.userData={markerId:spec.id,icon:spec.icon,range:spec.range,action:spec.action};return marker;
 }
 function addKitchenFoodCounter(THREE,group,kit,loadedAssetIds){
  const display=new THREE.Group();display.name=KITCHEN_FOOD_COUNTER.assetId;display.position.set(KITCHEN_FOOD_COUNTER.position.x,KITCHEN_FOOD_COUNTER.position.y,KITCHEN_FOOD_COUNTER.position.z);display.rotation.y=KITCHEN_FOOD_COUNTER.yaw;
  const counterPrototype=sourceScene(kit,KITCHEN_FOOD_COUNTER.sourceScene);
  if(counterPrototype){const counter=counterPrototype.clone(true);counter.userData={assetId:KITCHEN_FOOD_COUNTER.assetId,sourceScene:KITCHEN_FOOD_COUNTER.sourceScene,placeholder:false};counter.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});display.add(counter);loadedAssetIds.push(KITCHEN_FOOD_COUNTER.assetId)}
  else{const top=new THREE.Mesh(new THREE.BoxGeometry(3,.18,2),new THREE.MeshStandardMaterial({color:0x9aa4aa,roughness:.72}));top.position.set(0,.91,0);top.userData={assetId:KITCHEN_FOOD_COUNTER.assetId,placeholder:true};display.add(top)}
  KITCHEN_FOOD_COUNTER.food.forEach((spec,index)=>{const prototype=sourceScene(kit,spec.sourceScene);if(prototype){const food=prototype.clone(true);food.position.set(spec.x,spec.y,spec.z);food.scale.setScalar(spec.scale);food.userData={assetId:spec.assetId,sourceScene:spec.sourceScene,placeholder:false};food.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});display.add(food);loadedAssetIds.push(spec.assetId)}else{const food=new THREE.Mesh(new THREE.BoxGeometry(.55,.45,.5),new THREE.MeshStandardMaterial({color:index?0xf0c978:0xb87955,roughness:.82}));food.position.set(spec.x,spec.y+.22,spec.z);food.userData={assetId:spec.assetId,placeholder:true};display.add(food)}});
  const marker=createProximityIcon(THREE,KITCHEN_FOOD_COUNTER.marker);display.add(marker);display.userData={assetId:KITCHEN_FOOD_COUNTER.assetId,sourceScene:KITCHEN_FOOD_COUNTER.sourceScene,food:KITCHEN_FOOD_COUNTER.food.map(spec=>spec.assetId),marker:marker.userData,collision:KITCHEN_FOOD_COUNTER.collision};group.add(display);return {display,marker};
 }
 function addFrontArea(THREE,group,kit,extras,loadedAssetIds,mixers=[]){
  const front=new THREE.Group();front.name="restaurant-front-area";
  const deskPrototype=sourceScene(kit,CASH_DESK.sourceScene);
  if(deskPrototype){
   const desk=deskPrototype.clone(true);desk.position.set(CASH_DESK.position.x,CASH_DESK.position.y,CASH_DESK.position.z);desk.rotation.y=CASH_DESK.yaw;desk.scale.setScalar(CASH_DESK.scale);desk.userData={assetId:CASH_DESK.assetId,sourceScene:CASH_DESK.sourceScene,placeholder:false};desk.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});front.add(desk);loadedAssetIds.push(CASH_DESK.assetId);
  }else{
   const desk=new THREE.Mesh(new THREE.BoxGeometry(2,1,1.1),new THREE.MeshStandardMaterial({color:0x9d6f55,roughness:.85}));desk.position.set(CASH_DESK.position.x,.5,CASH_DESK.position.z);desk.userData={assetId:CASH_DESK.assetId,placeholder:true};front.add(desk);
  }
  for(const [key,spec] of Object.entries(EXTRA_ASSETS).filter(([,spec])=>spec.kind==="prop")){
   const prototype=extras[key]?.scene;
   if(prototype){
    const art=prototype.clone(true);art.name=spec.assetId;art.position.set(spec.position.x,spec.position.y,spec.position.z);art.rotation.y=spec.yaw;art.scale.setScalar(spec.scale);art.userData={assetId:spec.assetId,url:spec.url,placeholder:false};art.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});front.add(art);loadedAssetIds.push(spec.assetId);
   }else{
    const register=new THREE.Mesh(new THREE.BoxGeometry(.7,.5,.55),new THREE.MeshStandardMaterial({color:0x303840,roughness:.6}));register.position.set(spec.position.x,spec.position.y+.25,spec.position.z);register.userData={assetId:spec.assetId,placeholder:true};front.add(register);
   }
  }
  const cashierSpec=EXTRA_ASSETS.cashierMerchant,cashierAsset=extras.cashierMerchant,cashier=cashierAsset?.scene?.clone?.(true)||buildCashierFallback(THREE,cashierSpec);
  if(cashierAsset?.scene){cashier.name=cashierSpec.assetId;cashier.position.set(cashierSpec.position.x,cashierSpec.position.y,cashierSpec.position.z);cashier.rotation.y=cashierSpec.yaw;cashier.scale.setScalar(cashierSpec.scale);cashier.userData={assetId:cashierSpec.assetId,url:cashierSpec.url,placeholder:false,idleClip:cashierSpec.idleClip};cashier.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});const clip=cashierAsset.animations?.find(animation=>animation.name===cashierSpec.idleClip);if(clip&&THREE.AnimationMixer){const mixer=new THREE.AnimationMixer(cashier);mixer.clipAction(clip).play();mixers.push(mixer)}loadedAssetIds.push(cashierSpec.assetId)}
  front.add(cashier);
  const entrance=new THREE.Group();entrance.name=FRONT_ENTRANCE.assetId;
  const framePrototype=sourceScene(kit,FRONT_ENTRANCE.frameScene),doorPrototype=sourceScene(kit,FRONT_ENTRANCE.doorScene);
  if(framePrototype&&doorPrototype){
   [[framePrototype,FRONT_ENTRANCE.frameAssetId,FRONT_ENTRANCE.frameScene,0],[doorPrototype,FRONT_ENTRANCE.doorAssetId,FRONT_ENTRANCE.doorScene,FRONT_ENTRANCE.doorOffsetX]].forEach(([prototype,assetId,source,offsetX])=>{
    const art=prototype.clone(true);art.position.set(FRONT_ENTRANCE.position.x+offsetX,FRONT_ENTRANCE.position.y,FRONT_ENTRANCE.position.z);art.rotation.y=FRONT_ENTRANCE.yaw;art.userData={assetId,sourceScene:source,offsetX,placeholder:false};art.traverse(object=>{if(object.isMesh){object.castShadow=object.receiveShadow=true}});entrance.add(art);loadedAssetIds.push(assetId);
   });
  }else{
   const frameMaterial=new THREE.MeshStandardMaterial({color:0xf4d6cc,roughness:.9}),doorMaterial=new THREE.MeshStandardMaterial({color:0x35a684,roughness:.75});
   [[.45,4,.5,-1.78,2],[.45,4,.5,1.78,2],[3.1,.45,.5,0,3.78]].forEach(([w,h,d,x,y])=>{const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),frameMaterial);part.position.set(x,y,FRONT_ENTRANCE.position.z);entrance.add(part)});
   const door=new THREE.Mesh(new THREE.BoxGeometry(1.65,2.8,.22),doorMaterial);door.position.set(0,1.4,FRONT_ENTRANCE.position.z);door.userData={assetId:FRONT_ENTRANCE.doorAssetId,offsetX:FRONT_ENTRANCE.doorOffsetX,placeholder:true};entrance.add(door);
  }
  entrance.userData={assetId:FRONT_ENTRANCE.assetId,frameScene:FRONT_ENTRANCE.frameScene,doorScene:FRONT_ENTRANCE.doorScene,placeholder:!(framePrototype&&doorPrototype)};front.add(entrance);
  front.userData={assetId:"restaurant.front-area",cashDesk:CASH_DESK,cashier:{assetId:cashierSpec.assetId,idleClip:cashier.userData.idleClip,placeholder:cashier.userData.placeholder},entrance:FRONT_ENTRANCE,props:EXTRA_ASSETS};group.add(front);return front;
 }
 function buildRuntime(THREE,scene,rooms,kit=null,assetError="",extras={}){
  validateConnection(rooms[0],rooms[1]);
  const group=new THREE.Group();group.name="restaurant-world";group.visible=false;
  const materials={diningFloor:new THREE.MeshStandardMaterial({color:0xd9ae86,roughness:1})};
  const matrix=new THREE.Matrix4(),loadedAssetIds=[],mixers=[];
  rooms.forEach(room=>{
   if(room.room==="kitchen"){
    const floor=buildKitchenFloor(THREE,room,kit,matrix);group.add(floor);if(floor.userData.sourceReady)loadedAssetIds.push(floor.userData.assetId);
   }else{
    const floor=new THREE.Mesh(new THREE.BoxGeometry(room.width,.18,room.depth),materials.diningFloor);
    floor.position.set(room.originX+room.width/2,-.09,room.originZ+room.depth/2);floor.receiveShadow=true;floor.userData.assetId=`restaurant.floor.${room.room}`;group.add(floor);
   }
  });
  const walls=buildWalls(THREE,rooms,kit,matrix);group.add(walls);if(!walls.userData.placeholder)loadedAssetIds.push(walls.userData.assetId);
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
  const foodCounter=addKitchenFoodCounter(THREE,group,kit,loadedAssetIds);addFrontArea(THREE,group,kit,extras,loadedAssetIds,mixers);
  const CustomerSystem=customerSystemApi()?.RestaurantCustomerSystem,customerSystem=CustomerSystem?new CustomerSystem({maxActive:4,waitingFaceTarget:EXTRA_ASSETS.cashRegister.position,avatarFactory:createCustomerAvatarFactory(THREE,group,extras.cashierMerchant)}):null,eventDisposers=[];
  INITIAL_CUSTOMER_ORDERS.forEach(order=>customerSystem?.enqueue(order));
  if(customerSystem&&typeof globalThis.addEventListener==="function"){
   const added=event=>{const detail=event.detail||{},order=detail.order||detail.customerOrder?.order||detail;if(order?.id!=null)customerSystem.enqueue(order)};
   const completed=event=>{const detail=event.detail||{},orderId=detail.orderId||detail.order?.id||detail.customerOrder?.order?.id;if(orderId!=null)customerSystem.completeOrder(orderId)};
   globalThis.addEventListener("restaurant-order-added",added);globalThis.addEventListener("restaurant-order-completed",completed);eventDisposers.push(()=>globalThis.removeEventListener("restaurant-order-added",added),()=>globalThis.removeEventListener("restaurant-order-completed",completed));
  }
  const urls=[KIT_URL,...Object.values(EXTRA_ASSETS).map(spec=>spec.url)],externalReady=Object.keys(EXTRA_ASSETS).every(key=>extras[key]?.scene),entranceReady=sourceScene(kit,FRONT_ENTRANCE.frameScene)&&sourceScene(kit,FRONT_ENTRANCE.doorScene);
  const totalAssetBytes=549488+Object.values(EXTRA_ASSETS).reduce((sum,spec)=>sum+(spec.bytes||0),0),proximity={markerId:KITCHEN_FOOD_COUNTER.marker.id,range:KITCHEN_FOOD_COUNTER.marker.range,active:false,action:null};
  group.userData={destination:"restaurant",rooms:rooms.map(room=>({id:room.room,width:room.width,depth:room.depth,layoutFile:ROOM_FILES[room.room]})),assetRegistry:ASSET_REGISTRY,assets:{url:KIT_URL,urls,status:kit&&externalReady&&entranceReady?"ready":"fallback",loadedAssetIds,totalBytes:totalAssetBytes,error:assetError},floor:{kitchen:KITCHEN_FLOOR},npcs:{count:1+(customerSystem?.customers?.length||0),cashier:{assetId:EXTRA_ASSETS.cashierMerchant.assetId,idleClip:EXTRA_ASSETS.cashierMerchant.idleClip,animated:mixers.length===1},customerQueue:customerSystem?.debug?.()||null},proximity,orders:{controller:"RestaurantCustomerSystem",completionMethod:"completeOrder(orderId)",maxActive:4},hud:false};
  scene.add(group);
  const spawns=Object.fromEntries(rooms.map(room=>[room.room,cellCenter(room,room.spawnCol,room.spawnRow)]));
  const cameraPoses={
   kitchenOverview:{sceneId:"kitchen",name:"kitchen-overview",target:{x:0,z:-30},angle:0,height:11,distance:15},
   kitchenNorthWall:{sceneId:"kitchen",name:"kitchen-north-wall",target:{x:0,z:-39},angle:0,height:6.5,distance:10},
   kitchenWestWall:{sceneId:"kitchen",name:"kitchen-west-wall",target:{x:-8.5,z:-34},angle:Math.PI/2,height:6.5,distance:10},
   kitchenEastWall:{sceneId:"kitchen",name:"kitchen-east-wall",target:{x:8.5,z:-34},angle:-Math.PI/2,height:6.5,distance:10},
   kitchenPlainStoves:{sceneId:"kitchen",name:"kitchen-plain-stoves",target:{x:3,z:-41.5},angle:0,height:4.8,distance:6.5},
   restaurantChairTable:{sceneId:"dining",name:"restaurant-chair-table",target:{x:-11.5,z:12.5},angle:0,height:5.5,distance:7},
   restaurantCashRegister:{sceneId:"dining",name:"restaurant-cash-register",target:{x:0,z:14},angle:Math.PI,height:4.4,distance:5.5},
   restaurantFrontDoor:{sceneId:"dining",name:"restaurant-front-door",target:{x:0,z:19.5},angle:0,height:4.5,distance:6},
   restaurantCashierNpc:{sceneId:"dining",name:"restaurant-cashier-npc",target:{x:0,z:13.5},angle:Math.PI,height:4.6,distance:6},
   restaurantCustomerLine:{sceneId:"dining",name:"restaurant-customer-line",target:{x:2.5,z:17.25},angle:Math.PI,height:6,distance:8},
   kitchenFoodCounter:{sceneId:"kitchen",name:"kitchen-food-counter",target:{x:-8.6,z:-34.5},angle:Math.PI/2,height:5.8,distance:7}
   };
  return {group,rooms,spawns,spawn:spawns.dining,camera:{angle:.35,height:8.5,distance:8.8},cameraPoses,debugViews:DEBUG_VIEWS,floorSurfaceY:KITCHEN_FLOOR.surfaceY,customerSystem,enqueueOrder:order=>customerSystem?.enqueue(order)??false,completeOrder:orderId=>customerSystem?.completeOrder(orderId)??false,canWalk:(x,z)=>canWalk(rooms,x,z),update(dt,playerPosition){mixers.forEach(mixer=>mixer.update(dt));customerSystem?.update(dt);group.userData.npcs.customerQueue=customerSystem?.debug?.()||null;group.userData.npcs.count=1+(customerSystem?.customers?.length||0);const active=Boolean(playerPosition)&&Math.hypot(playerPosition.x-KITCHEN_FOOD_COUNTER.position.x,playerPosition.z-KITCHEN_FOOD_COUNTER.position.z)<=KITCHEN_FOOD_COUNTER.marker.range;foodCounter.marker.visible=active;proximity.active=active;if(globalThis.document?.body)document.body.dataset.restaurantProximityIcon=active?proximity.markerId:"";return active},dispose(){eventDisposers.forEach(dispose=>dispose());customerSystem?.dispose()}};
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
 function loadExtraAssets(){
  const Loader=globalThis.ThreeGLTFLoader?.GLTFLoader;if(!Loader)return Promise.resolve({models:{},errors:["Restaurant GLTF loader is unavailable"]});
  return Promise.all(Object.entries(EXTRA_ASSETS).map(([key,spec])=>new Promise(resolve=>new Loader().load(spec.url,model=>resolve({key,model}),undefined,error=>resolve({key,error:String(error?.message||error)}))))).then(results=>({models:Object.fromEntries(results.filter(result=>result.model).map(result=>[result.key,result.model])),errors:results.filter(result=>result.error).map(result=>`${result.key}: ${result.error}`)}));
 }
 async function ensure(THREE,scene,fetchImpl){
  if(runtime)return runtime;if(loading)return loading;
  loading=Promise.all([loadRooms(fetchImpl),loadKit().then(kit=>({kit,error:""})).catch(error=>({kit:null,error:String(error?.message||error) })),loadExtraAssets()]).then(([rooms,asset,extras])=>runtime=buildRuntime(THREE,scene,rooms,asset.kit,[asset.error,...extras.errors].filter(Boolean).join("; "),extras.models)).finally(()=>loading=null);return loading;
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
 function destroy(){if(!runtime)return;const root=runtime.group;runtime.dispose?.();disposeRuntimeResources(root);root.parent?.remove(root);runtime=null}
 return {KIT_URL,BACKGROUND_COLOR,EXTRA_ASSETS,CASH_DESK,FRONT_ENTRANCE,INITIAL_CUSTOMER_ORDERS,KITCHEN_FOOD_COUNTER,ROOM_FILES,ASSET_REGISTRY,WALKABLE,PLAYER_RADIUS,WALL,KITCHEN_FLOOR,DEBUG_VIEWS,parseLevel,cellCenter,roomAt,symbolAtWorld,canWalk,wallCellCollision,doorwayCells,validateConnection,sourceScene,firstMesh,buildKitchenFloor,wallBoundaryLines,wallSegments,buildWalls,assetTransform,buildCashierFallback,customerSystemApi,createCustomerAvatarFactory,createProximityIcon,addKitchenFoodCounter,addFrontArea,buildRuntime,loadRooms,loadKit,loadExtraAssets,disposeRuntimeResources,ensure,destroy,get current(){return runtime}};
});
