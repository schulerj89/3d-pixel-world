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
 function lineWalls(level){
  const walls=[],thickness=level.wallThickness;
  const add=(id,orientation,fixed,start,end,kind="interior")=>walls.push({id,type:"line",orientation,fixed,start,end,thickness,kind,heightOffset:orientation==="V"?-.015:0});
  const runs=(values,predicate)=>{const found=[];let start=-1;for(let index=0;index<=values.length;index++){if(predicate(values[index])&&start<0)start=index;if(!predicate(values[index])&&start>=0){found.push([start,index]);start=-1}}return found};
  // Maximal runs cover complete authored wall cells. Horizontal and vertical
  // runs therefore cross at every corner/T-junction instead of stopping half
  // a unit apart. Vertical caps sit 0.015u lower than horizontal caps so the
  // overlapping junction top has one stable depth winner and cannot shimmer.
  for(let row=0;row<level.depth;row++)for(const [start,end] of runs([...level.map[row]],symbol=>symbol==="#"))if(end-start>=2){
   const kind=row===0||row===level.depth-1?"perimeter":"interior";
   const lineStart=level.originX+start+(start===0?.5:0),lineEnd=level.originX+end-(end===level.width?.5:0);
   add(`${kind}-h-${row}-${start}`,"H",level.originZ+row+.5,lineStart,lineEnd,kind);
  }
  for(let col=0;col<level.width;col++){
   const values=level.map.map(row=>row[col]);
   for(const [start,end] of runs(values,symbol=>symbol==="#"))if(end-start>=2){
   const kind=col===0||col===level.width-1?"perimeter":"interior";
    const lineStart=level.originZ+start+(start===0?.5:0),lineEnd=level.originZ+end-(end===level.depth?.5:0);
    add(`${kind}-v-${col}-${start}`,"V",level.originX+col+.5,lineStart,lineEnd,kind);
   }
  }
  return walls;
 }
 function connectedOpenings(level){
  const openings=[],seen=new Set(),key=(row,col)=>`${row}:${col}`;
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++){
   const symbol=level.map[row][col];if((symbol!=="D"&&symbol!=="E")||seen.has(key(row,col)))continue;
   const cells=[],queue=[[row,col]];seen.add(key(row,col));
   while(queue.length){const [currentRow,currentCol]=queue.shift();cells.push([currentRow,currentCol]);for(const [nextRow,nextCol] of [[currentRow-1,currentCol],[currentRow+1,currentCol],[currentRow,currentCol-1],[currentRow,currentCol+1]])if(level.map[nextRow]?.[nextCol]===symbol&&!seen.has(key(nextRow,nextCol))){seen.add(key(nextRow,nextCol));queue.push([nextRow,nextCol])}}
   const rows=cells.map(cell=>cell[0]),cols=cells.map(cell=>cell[1]),minRow=Math.min(...rows),maxRow=Math.max(...rows),minCol=Math.min(...cols),maxCol=Math.max(...cols),orientation=maxCol-minCol>=maxRow-minRow?"H":"V";
   openings.push({id:`${symbol==="E"?"exterior":"interior"}-${minRow}-${minCol}`,symbol,orientation,fixed:orientation==="H"?level.originZ+minRow+.5:level.originX+minCol+.5,start:orientation==="H"?level.originX+minCol:level.originZ+minRow,end:orientation==="H"?level.originX+maxCol+1:level.originZ+maxRow+1,width:cells.length});
  }
  return openings;
 }
 function adaptLevel(level){
  validateLevel(level);
  const walls=lineWalls(level);
  const rooms=level.rooms.map(room=>({id:room.id,minX:level.originX+room.col,maxX:level.originX+room.col+room.width,minZ:level.originZ+room.row,maxZ:level.originZ+room.row+room.depth}));
  const openings=connectedOpenings(level);
  const bounds={minX:level.originX,maxX:level.originX+level.width,minZ:level.originZ,maxZ:level.originZ+level.depth};
  const cellAt=(x,z)=>({col:Math.floor((x-level.originX)/level.cell),row:Math.floor((z-level.originZ)/level.cell)});
  const layout={source:"house-main-level.txt",version:2,gridCell:1,width:level.width,depth:level.depth,wallHeight:level.wallHeight,wallThickness:level.wallThickness,playerRadius:.45,furnitureInset:.65,furnitureStep:.5,spawn:{x:0,z:bounds.maxZ-2},camera:{angle:2.8,height:11,distance:16},spacings:{tight:level.minimumClearance,doorway:level.primaryClearance,aisle:level.applianceAisle},bounds,rooms,walls,openings,fixtures:level.fixtures};
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
