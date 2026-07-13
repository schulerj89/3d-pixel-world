(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HouseSpaceSpec=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const LEVEL_FILE="house-main-level.txt";
 const PLAYER=Object.freeze({radius:.28,diameter:.56});
 const CLEARANCE=Object.freeze({secondary:1,primary:2,applianceAisle:2});
 // This is intentionally identical to RestaurantWorld.ASSET_REGISTRY.F.
 const REFRIGERATOR=Object.freeze({
  assetId:"restaurant.kitchen.fridge",
  sourceScene:"fridge_A_decorated",
  scale:1.4,
  size:Object.freeze([2.8,3.5,3.136]),
  collision:Object.freeze([1.4,1.568])
 });

 function parseRecord(value,fields){
  const parts=String(value).split(",").map(part=>part.trim());
  return Object.fromEntries(fields.map((field,index)=>[field,/^-?\d+(?:\.\d+)?$/.test(parts[index])?Number(parts[index]):parts[index]]));
 }
 function parseLevel(text){
  const values={},rooms=[],fixtures=[],map=[];let readingMap=false;
  String(text).split(/\r?\n/).forEach(raw=>{
   const line=raw.trim();if(!line||line.startsWith(";"))return;
   if(readingMap){map.push(line);return}
   const separator=line.indexOf(":");if(separator<0)return;
   const key=line.slice(0,separator).trim(),value=line.slice(separator+1).trim();
   if(key==="map"){readingMap=true;return}
   if(key==="room")rooms.push(parseRecord(value,["id","col","row","width","depth"]));
   else if(key==="fixture")fixtures.push(parseRecord(value,["id","symbol","room","col","row","facing"]));
   else values[key]=value;
  });
  const [width,depth]=String(values.size||"").split("x").map(Number);
  const [originX,originZ]=String(values.origin||"").split(",").map(Number);
  const level={...values,width,depth,originX,originZ,cell:Number(values.cell),wallThickness:Number(values["wall-thickness"]),wallHeight:Number(values["wall-height"]),minimumClearance:Number(values["minimum-clearance"]),primaryClearance:Number(values["primary-clearance"]),applianceAisle:Number(values["appliance-aisle"]),entranceWidth:Number(values["entrance-width"]),rooms,fixtures,map};
  validateLevel(level);return level;
 }
 function isBoundarySymbol(symbol){return symbol==="#"||symbol==="E"}
 function validateLevel(level){
  if(!level.width||!level.depth||level.cell!==1)throw new Error("House layout requires positive dimensions and 1-unit cells");
  if(level.map.length!==level.depth||level.map.some(row=>row.length!==level.width))throw new Error("House map dimensions do not match metadata");
  const perimeter=[...level.map[0],...level.map[level.depth-1],...level.map.slice(1,-1).flatMap(row=>[row[0],row[level.width-1]])];
  if(perimeter.some(symbol=>!isBoundarySymbol(symbol)))throw new Error("House exterior perimeter must be enclosed by walls or closed entrance cells");
  const entrances=level.map.flatMap(row=>[...row]).filter(symbol=>symbol==="E").length;
  if(entrances!==level.entranceWidth)throw new Error("House entrance width does not match its closed perimeter cells");
  if(level.minimumClearance!==CLEARANCE.secondary||level.primaryClearance!==CLEARANCE.primary||level.applianceAisle!==CLEARANCE.applianceAisle)throw new Error("House clearance metadata must retain the audited 1-unit/2-unit rules");
  for(const room of level.rooms){
   if(room.col<1||room.row<1||room.col+room.width>level.width-1||room.row+room.depth>level.depth-1)throw new Error(`Room ${room.id} crosses the enclosed shell`);
  }
  for(const fixture of level.fixtures){
   const room=level.rooms.find(candidate=>candidate.id===fixture.room);
   if(!room)throw new Error(`Fixture ${fixture.id} references an unknown room`);
   if(level.map[fixture.row]?.[fixture.col]!==fixture.symbol)throw new Error(`Fixture ${fixture.id} anchor is missing from the map`);
   if(fixture.col<room.col||fixture.col>=room.col+room.width||fixture.row<room.row||fixture.row>=room.row+room.depth)throw new Error(`Fixture ${fixture.id} is outside ${room.id}`);
  }
  return true;
 }
 function roomBounds(level,roomOrId){
  const room=typeof roomOrId==="string"?level.rooms.find(item=>item.id===roomOrId):roomOrId;
  if(!room)return null;
  return {minX:level.originX+room.col,maxX:level.originX+room.col+room.width,minZ:level.originZ+room.row,maxZ:level.originZ+room.row+room.depth};
 }
 function fixturePlacement(level,fixtureOrId,spec=REFRIGERATOR){
  const fixture=typeof fixtureOrId==="string"?level.fixtures.find(item=>item.id===fixtureOrId):fixtureOrId;
  const room=roomBounds(level,fixture.room),halfX=spec.collision[0],halfZ=spec.collision[1],wallInset=level.wallThickness/2;
  let x=level.originX+(fixture.col+.5)*level.cell,z=level.originZ+(fixture.row+.5)*level.cell,yaw=0;
  if(fixture.facing==="north")z=level.originZ+wallInset+halfZ;
  else if(fixture.facing==="south"){z=level.originZ+level.depth-wallInset-halfZ;yaw=Math.PI}
  else if(fixture.facing==="west"){x=room.minX+wallInset+halfZ;yaw=Math.PI/2}
  else if(fixture.facing==="east"){x=room.maxX-wallInset-halfZ;yaw=-Math.PI/2}
  return {x,z,yaw,bounds:{minX:x-halfX,maxX:x+halfX,minZ:z-halfZ,maxZ:z+halfZ}};
 }
 function playerSlack(clearance){return Number((clearance-PLAYER.diameter).toFixed(6))}
 function supportsPassage(clearance,kind="secondary"){
  return clearance>=CLEARANCE[kind]&&playerSlack(clearance)>=0;
 }
 function frontAisle(level,placement,roomOrId){
  const room=roomBounds(level,roomOrId),frontEdge=placement.yaw===0?placement.bounds.maxZ:placement.bounds.minZ;
  return placement.yaw===0?room.maxZ-frontEdge:frontEdge-room.minZ;
 }
 function planValidator(){
  if(typeof globalThis!=="undefined"&&globalThis.HouseLayoutValidator)return globalThis.HouseLayoutValidator;
  if(typeof require==="function")return require("./house-layout-validator.js");
  throw new Error("HouseLayoutValidator must load before programmatic house plan QA");
 }
 function auditPlan(level,options){return planValidator().audit(level,options)}
 function validatePlan(level,options){return planValidator().validate(level,options)}
 return {LEVEL_FILE,PLAYER,CLEARANCE,REFRIGERATOR,parseLevel,validateLevel,auditPlan,validatePlan,roomBounds,fixturePlacement,playerSlack,supportsPassage,frontAisle};
});
