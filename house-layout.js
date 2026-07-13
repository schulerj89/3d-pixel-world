// Structural adapter for the authoritative house-main-level.txt unit-grid map.
(function(root){
 "use strict";
 function fallbackParseLevel(text){
  const values={},rooms=[],fixtures=[],map=[];let readingMap=false;
  String(text).split(/\r?\n/).forEach(raw=>{
   const line=raw.trim();if(!line||line.startsWith(";"))return;
   if(readingMap){map.push(line);return}
   const separator=line.indexOf(":");if(separator<0)return;
   const key=line.slice(0,separator).trim(),value=line.slice(separator+1).trim();
   if(key==="map"){readingMap=true;return}
   const record=()=>value.split(",").map(part=>part.trim()).map(part=>/^-?\d+(?:\.\d+)?$/.test(part)?Number(part):part);
   if(key==="room"){const [id,col,row,width,depth]=record();rooms.push({id,col,row,width,depth})}
   else if(key==="fixture"){const [id,symbol,room,col,row,facing]=record();fixtures.push({id,symbol,room,col,row,facing})}
   else values[key]=value;
  });
  const [width,depth]=String(values.size||"").split("x").map(Number),[originX,originZ]=String(values.origin||"").split(",").map(Number);
  return {...values,width,depth,originX,originZ,cell:Number(values.cell),wallThickness:Number(values["wall-thickness"]),wallHeight:Number(values["wall-height"]),minimumClearance:Number(values["minimum-clearance"]),primaryClearance:Number(values["primary-clearance"]),applianceAisle:Number(values["appliance-aisle"]),entranceWidth:Number(values["entrance-width"]),rooms,fixtures,map};
 }
 function validateLevel(level){
  if(level.width!==24||level.depth!==20||level.cell!==1)throw new Error("My House layout must be a 24x20 one-unit grid");
  if(level.map.length!==level.depth||level.map.some(row=>row.length!==level.width))throw new Error("House map dimensions do not match metadata");
  if(level.minimumClearance!==1||level.primaryClearance!==2||level.applianceAisle!==2)throw new Error("House map must retain validated 1-unit and 2-unit spacing");
  const perimeter=[...level.map[0],...level.map[level.depth-1],...level.map.slice(1,-1).flatMap(row=>[row[0],row[level.width-1]])];
  if(perimeter.some(symbol=>symbol!=="#"&&symbol!=="E"))throw new Error("House perimeter must be enclosed by walls or its exterior entrance");
  for(const id of["living","kitchen","bedroom"]){if(!level.rooms.some(room=>room.id===id))throw new Error(`House map requires ${id}`)}
  return level;
 }
 function segmentsFor(level,symbol){
  const segments=[];
  level.map.forEach((row,rowIndex)=>{
   let start=-1;
   for(let col=0;col<=row.length;col++){
    if(row[col]===symbol&&start<0)start=col;
    if(row[col]!==symbol&&start>=0){segments.push({row:rowIndex,start,end:col});start=-1}
   }
  });
  return segments;
 }
 function adaptLevel(level){
  validateLevel(level);
  const walls=segmentsFor(level,"#").map(segment=>({id:`run-${segment.row}-${segment.start}`,type:"cell",x:level.originX+(segment.start+segment.end)/2,z:level.originZ+segment.row+.5,width:segment.end-segment.start,depth:level.cell}));
  const rooms=level.rooms.map(room=>({id:room.id,minX:level.originX+room.col,maxX:level.originX+room.col+room.width,minZ:level.originZ+room.row,maxZ:level.originZ+room.row+room.depth}));
  const openings=[];
  for(const symbol of["D","E"]){
   for(const segment of segmentsFor(level,symbol))openings.push({id:`${symbol==="E"?"exterior":"interior"}-${segment.row}-${segment.start}`,symbol,orientation:"H",fixed:level.originZ+segment.row+.5,start:level.originX+segment.start,end:level.originX+segment.end,width:segment.end-segment.start});
  }
  const bounds={minX:level.originX,maxX:level.originX+level.width,minZ:level.originZ,maxZ:level.originZ+level.depth};
  const cellAt=(x,z)=>({col:Math.floor((x-level.originX)/level.cell),row:Math.floor((z-level.originZ)/level.cell)});
  const layout={source:"house-main-level.txt",version:2,gridCell:1,width:level.width,depth:level.depth,wallHeight:level.wallHeight,wallThickness:level.wallThickness,playerRadius:.45,furnitureInset:.65,furnitureStep:.5,spawn:{x:0,z:8},camera:{angle:2.8,height:11,distance:16},spacings:{tight:level.minimumClearance,doorway:level.primaryClearance,aisle:level.applianceAisle},bounds,rooms,walls,openings,fixtures:level.fixtures};
  layout.roomAt=(x,z)=>rooms.find(room=>x>=room.minX&&x<room.maxX&&z>=room.minZ&&z<room.maxZ)?.id||(layout.canWalk(x,z,0)?"circulation":null);
  layout.canWalk=(x,z,radius=layout.playerRadius)=>{
   if(x<bounds.minX+radius||x>bounds.maxX-radius||z<bounds.minZ+radius||z>bounds.maxZ-radius)return false;
   const probes=[[x,z],[x-radius,z],[x+radius,z],[x,z-radius],[x,z+radius]];
   return probes.every(([px,pz])=>{const {col,row}=cellAt(px,pz);return row>=0&&row<level.depth&&col>=0&&col<level.width&&level.map[row][col]!=="#"});
  };
  layout.debug=()=>({source:layout.source,version:layout.version,gridCell:1,size:{width:layout.width,depth:layout.depth},spacings:{...layout.spacings},rooms:rooms.map(room=>({...room})),walls:walls.length,openings:openings.map(opening=>({...opening})),spawn:{...layout.spawn}});
  return layout;
 }
 function parse(text){
  const parser=root.HouseSpaceSpec?.parseLevel||fallbackParseLevel;
  return adaptLevel(parser(text));
 }
 async function load(url="house-main-level.txt"){
  const response=await fetch(url,{cache:"no-cache"});
  if(!response.ok)throw new Error(`Unable to load ${url}: HTTP ${response.status}`);
  return parse(await response.text());
 }
 const api={parse,adaptLevel,load};
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HouseLayout=api;
})(typeof window!=="undefined"?window:globalThis);
