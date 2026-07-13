(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HouseLayoutValidator=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 const DEFAULTS=Object.freeze({
  requiredRooms:Object.freeze(["kitchen","bedroom","living","dining","entry"]),
  minimumDoorWidth:3,
  maximumDoorWidth:4,
  fixtureSymbols:Object.freeze(["F","S","B","T"])
 });
 const WALKABLE=new Set([".","D","E"]);

 class HouseLayoutValidationError extends Error{
  constructor(report){
   super(`House layout failed QA (${report.issues.length} issue${report.issues.length===1?"":"s"})\n${report.issues.map(issue=>`- ${issue.code}: ${issue.message}`).join("\n")}`);
   this.name="HouseLayoutValidationError";
   this.report=report;
  }
 }

 function key(col,row){return `${col},${row}`}
 function inBounds(level,col,row){return row>=0&&row<level.depth&&col>=0&&col<level.width}
 function at(level,col,row){return inBounds(level,col,row)?level.map[row][col]:null}
 function neighbors(col,row){return [[col-1,row],[col+1,row],[col,row-1],[col,row+1]]}
 function isBoundary(level,col,row){return col===0||row===0||col===level.width-1||row===level.depth-1}
 function isFixture(symbol,options){return options.fixtureSymbols.includes(symbol)}
 function isWalkable(symbol,options){return WALKABLE.has(symbol)||isFixture(symbol,options)}
 function wallJunctions(level){
  const result=[];
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++)if(at(level,col,row)==="#"){
   const horizontal=at(level,col-1,row)==="#"||at(level,col+1,row)==="#",vertical=at(level,col,row-1)==="#"||at(level,col,row+1)==="#";
   if(horizontal&&vertical)result.push([col,row]);
  }
  return result;
 }

 function collectRuns(level,symbol){
  const seen=new Set(),runs=[];
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++){
   if(at(level,col,row)!==symbol||seen.has(key(col,row)))continue;
   let horizontal=at(level,col-1,row)===symbol||at(level,col+1,row)===symbol;
   let vertical=at(level,col,row-1)===symbol||at(level,col,row+1)===symbol;
   if(!horizontal&&!vertical){
    const horizontalWalls=at(level,col-1,row)==="#"&&at(level,col+1,row)==="#";
    const verticalWalls=at(level,col,row-1)==="#"&&at(level,col,row+1)==="#";
    horizontal=horizontalWalls;vertical=verticalWalls;
   }
   if(horizontal&&vertical){runs.push({symbol,orientation:"ambiguous",cells:[[col,row]],width:1,start:[col,row],end:[col,row]});seen.add(key(col,row));continue}
   const orientation=vertical?"V":"H",cells=[];
   let c=col,r=row;
   while(at(level,c,r)===symbol&&!seen.has(key(c,r))){cells.push([c,r]);seen.add(key(c,r));if(orientation==="H")c++;else r++}
   runs.push({symbol,orientation,cells,width:cells.length,start:cells[0],end:cells[cells.length-1]});
  }
  return runs;
 }

 function flood(level,starts,options,blockedFixtures=true){
  const queue=[...starts],visited=new Set(queue.map(([col,row])=>key(col,row)));
  while(queue.length){
   const [col,row]=queue.shift();
   for(const [nextCol,nextRow] of neighbors(col,row)){
    const symbol=at(level,nextCol,nextRow),id=key(nextCol,nextRow);
    if(symbol===null||visited.has(id)||symbol==="#")continue;
    if(symbol!=="D"&&symbol!=="E"&&symbol!=="."&&(blockedFixtures||!isFixture(symbol,options)))continue;
    visited.add(id);queue.push([nextCol,nextRow]);
   }
  }
  return visited;
 }

 function audit(level,userOptions={}){
  const options={...DEFAULTS,...userOptions,requiredRooms:[...(userOptions.requiredRooms||DEFAULTS.requiredRooms)],fixtureSymbols:[...(userOptions.fixtureSymbols||DEFAULTS.fixtureSymbols)]};
  const issues=[],add=(code,message,details={})=>issues.push({code,message,...details});
  if(!Number.isInteger(level?.width)||!Number.isInteger(level?.depth)||level.width<5||level.depth<5)add("dimensions","Plan needs integer width/depth of at least 5 cells");
  if(level?.cell!==1)add("unit-grid","One map cell must equal one world unit");
  if(!Array.isArray(level?.map)||level.map.length!==level.depth||level.map.some(row=>typeof row!=="string"||row.length!==level.width)){
   add("map-size","Map rows must exactly match declared width and depth");
   return finish(level,issues,[],[],new Set());
  }
  const allowed=new Set(["#",".","D","E",...options.fixtureSymbols]);
  level.map.forEach((row,rowIndex)=>[...row].forEach((symbol,col)=>{if(!allowed.has(symbol))add("unknown-symbol",`Unknown '${symbol}' at (${col},${rowIndex})`,{col,row:rowIndex,symbol})}));

  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++)if(isBoundary(level,col,row)){
   const symbol=at(level,col,row);
   if(symbol!=="#"&&symbol!=="E")add("open-perimeter",`Exterior cell (${col},${row}) is '${symbol}', not wall or entrance`,{col,row,symbol});
   if(symbol==="D")add("interior-door-on-perimeter",`Interior door cannot occupy exterior cell (${col},${row})`,{col,row});
  }
  for(const [col,row] of [[0,0],[level.width-1,0],[0,level.depth-1],[level.width-1,level.depth-1]])if(at(level,col,row)!=="#")add("corner-seam",`Exterior corner (${col},${row}) must be a solid wall`,{col,row});
  for(let row=1;row<level.depth-1;row++)for(let col=1;col<level.width-1;col++)if(at(level,col,row)==="E")add("entrance-off-perimeter",`Exterior entrance cell (${col},${row}) is inside the plan`,{col,row});

  const doorRuns=[...collectRuns(level,"D"),...collectRuns(level,"E")];
  for(const run of doorRuns){
   const name=run.symbol==="E"?"Exterior entrance":"Interior doorway";
   if(run.orientation==="ambiguous")add("door-block",`${name} forms a two-dimensional overlap at (${run.start[0]},${run.start[1]})`,{run});
   if(run.width<options.minimumDoorWidth||run.width>options.maximumDoorWidth)add("door-width",`${name} is ${run.width} units; entries must be ${options.minimumDoorWidth}-${options.maximumDoorWidth} units`,{run});
   if(run.orientation==="ambiguous")continue;
   const [startCol,startRow]=run.start,[endCol,endRow]=run.end;
   const before=run.orientation==="H"?at(level,startCol-1,startRow):at(level,startCol,startRow-1);
   const after=run.orientation==="H"?at(level,endCol+1,endRow):at(level,endCol,endRow+1);
   if(before!=="#"||after!=="#")add("door-seam",`${name} must meet a wall at both ends`,{run,before,after});
   if(run.symbol==="E"&&run.cells.some(([col,row])=>!isBoundary(level,col,row)))add("entrance-span",`${name} must stay on one exterior edge`,{run});
   if(run.symbol==="D"&&run.cells.some(([col,row])=>isBoundary(level,col,row)))add("interior-door-on-perimeter",`${name} must stay inside the shell`,{run});
   const sides=run.cells.flatMap(([col,row])=>run.orientation==="H"?[[col,row-1],[col,row+1]]:[[col-1,row],[col+1,row]]);
   const sideA=sides.filter((_,index)=>index%2===0),sideB=sides.filter((_,index)=>index%2===1);
   if(run.symbol==="E"){
    if(!sides.some(([col,row])=>isWalkable(at(level,col,row),options))||!sides.some(([col,row])=>at(level,col,row)===null))add("blocked-door",`${name} needs clear interior floor and an exterior-facing side`,{run});
   }else if(!sideA.some(([col,row])=>isWalkable(at(level,col,row),options))||!sideB.some(([col,row])=>isWalkable(at(level,col,row),options)))add("blocked-door",`${name} needs walkable floor on both sides`,{run});
  }
  const exteriorRuns=doorRuns.filter(run=>run.symbol==="E");
  if(exteriorRuns.length!==1)add("entrance-count",`Plan requires exactly one contiguous exterior entrance, found ${exteriorRuns.length}`);
  if(Number.isFinite(level.entranceWidth)&&exteriorRuns.length===1&&exteriorRuns[0].width!==level.entranceWidth)add("entrance-metadata",`Entrance metadata says ${level.entranceWidth} units but map uses ${exteriorRuns[0].width}`);

  const structural=[];
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++)if("#DE".includes(at(level,col,row)))structural.push([col,row]);
  if(structural.length){
   const connected=new Set([key(...structural[0])]),queue=[structural[0]];
   while(queue.length){const [col,row]=queue.shift();for(const next of neighbors(col,row)){const id=key(...next);if(!connected.has(id)&&"#DE".includes(at(level,...next))){connected.add(id);queue.push(next)}}}
   if(connected.size!==structural.length)add("disconnected-wall",`${structural.length-connected.size} wall/door cells are disconnected from the shell`,{disconnected:structural.length-connected.size});
  }
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++)if(at(level,col,row)==="#"&&!neighbors(col,row).some(([c,r])=>"#DE".includes(at(level,c,r))))add("isolated-wall",`Wall cell (${col},${row}) has no structural neighbor`,{col,row});
  for(let row=1;row<level.depth-1;row++)for(let col=1;col<level.width-1;col++)if(at(level,col,row)==="."){
   const horizontalSeam=at(level,col-1,row)==="#"&&at(level,col+1,row)==="#"&&isWalkable(at(level,col,row-1),options)&&isWalkable(at(level,col,row+1),options);
   const verticalSeam=at(level,col,row-1)==="#"&&at(level,col,row+1)==="#"&&isWalkable(at(level,col-1,row),options)&&isWalkable(at(level,col+1,row),options);
   if(horizontalSeam||verticalSeam)add("unmarked-wall-gap",`Wall seam at (${col},${row}) uses floor instead of a 3-4 unit door run`,{col,row,orientation:horizontalSeam?"H":"V"});
  }
  for(let row=0;row<level.depth-1;row++)for(let col=0;col<level.width-1;col++)if([[col,row],[col+1,row],[col,row+1],[col+1,row+1]].every(([c,r])=>at(level,c,r)==="#"))add("wall-block",`Wall cells form a double-thick 2x2 block at (${col},${row})`,{col,row});

  const rooms=Array.isArray(level.rooms)?level.rooms:[],roomIds=new Set();
  for(const required of options.requiredRooms)if(!rooms.some(room=>room.id===required))add("missing-room",`Required room '${required}' is not declared`,{room:required});
  for(const room of rooms){
   if(!room.id||roomIds.has(room.id))add("duplicate-room",`Room id '${room.id}' is missing or duplicated`,{room:room.id});
   roomIds.add(room.id);
   if(![room.col,room.row,room.width,room.depth].every(Number.isInteger)||room.width<1||room.depth<1||room.col<1||room.row<1||room.col+room.width>level.width-1||room.row+room.depth>level.depth-1)add("room-bounds",`Room '${room.id}' must be a positive integer rectangle inside the shell`,{room:room.id});
  }
  for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){
   const a=rooms[i],b=rooms[j],overlap=a.col<b.col+b.width&&a.col+a.width>b.col&&a.row<b.row+b.depth&&a.row+a.depth>b.row;
   if(overlap)add("room-overlap",`Rooms '${a.id}' and '${b.id}' overlap`,{rooms:[a.id,b.id]});
  }

  const entranceCells=exteriorRuns.flatMap(run=>run.cells).filter(([col,row])=>at(level,col,row)==="E");
  const reachable=flood(level,entranceCells,options,true);
  for(const room of rooms){
   let walkable=0,reached=0;
   for(let row=room.row;row<room.row+room.depth;row++)for(let col=room.col;col<room.col+room.width;col++){
    const symbol=at(level,col,row);if(WALKABLE.has(symbol)){walkable++;if(reachable.has(key(col,row)))reached++}
   }
   if(!walkable)add("room-no-floor",`Room '${room.id}' has no walkable floor`,{room:room.id});
   else if(!reached)add("unreachable-room",`Room '${room.id}' cannot be reached from the exterior entrance`,{room:room.id});
  }

  const fixtures=Array.isArray(level.fixtures)?level.fixtures:[],fixtureIds=new Set(),anchors=new Set();
  for(const fixture of fixtures){
   const anchor=key(fixture.col,fixture.row),room=rooms.find(candidate=>candidate.id===fixture.room);
   if(!fixture.id||fixtureIds.has(fixture.id))add("duplicate-fixture",`Fixture id '${fixture.id}' is missing or duplicated`,{fixture:fixture.id});
   fixtureIds.add(fixture.id);
   if(anchors.has(anchor))add("fixture-overlap",`Multiple fixtures use anchor (${fixture.col},${fixture.row})`,{fixture:fixture.id,col:fixture.col,row:fixture.row});
   anchors.add(anchor);
   if(!room)add("fixture-room",`Fixture '${fixture.id}' references unknown room '${fixture.room}'`,{fixture:fixture.id});
   if(at(level,fixture.col,fixture.row)!==fixture.symbol)add("fixture-anchor",`Fixture '${fixture.id}' does not match map anchor (${fixture.col},${fixture.row})`,{fixture:fixture.id});
   if(room&&(fixture.col<room.col||fixture.col>=room.col+room.width||fixture.row<room.row||fixture.row>=room.row+room.depth))add("fixture-outside-room",`Fixture '${fixture.id}' is outside '${room.id}'`,{fixture:fixture.id});
   if(isBoundary(level,fixture.col,fixture.row)||"#DE".includes(at(level,fixture.col,fixture.row)))add("fixture-wall-overlap",`Fixture '${fixture.id}' overlaps a wall or door cell`,{fixture:fixture.id});
   const approach=fixture.facing==="north"?[fixture.col,fixture.row+1]:fixture.facing==="south"?[fixture.col,fixture.row-1]:fixture.facing==="west"?[fixture.col+1,fixture.row]:fixture.facing==="east"?[fixture.col-1,fixture.row]:null;
   if(approach&&!WALKABLE.has(at(level,...approach)))add("fixture-clearance",`Fixture '${fixture.id}' has no clear front approach`,{fixture:fixture.id,approach});
   if(!approach&&!neighbors(fixture.col,fixture.row).some(([col,row])=>WALKABLE.has(at(level,col,row))))add("fixture-clearance",`Fixture '${fixture.id}' has no adjacent clear floor`,{fixture:fixture.id});
  }
  for(let row=0;row<level.depth;row++)for(let col=0;col<level.width;col++)if(isFixture(at(level,col,row),options)&&!fixtures.some(fixture=>fixture.col===col&&fixture.row===row&&fixture.symbol===at(level,col,row)))add("orphan-fixture",`Map fixture '${at(level,col,row)}' at (${col},${row}) has no record`,{col,row});

  return finish(level,issues,doorRuns,rooms,reachable);
 }

 function wallBounds(wall){
  if(wall.type==="cell")return {minX:wall.x-wall.width/2,maxX:wall.x+wall.width/2,minZ:wall.z-wall.depth/2,maxZ:wall.z+wall.depth/2};
  return wall.orientation==="H"
   ?{minX:wall.start,maxX:wall.end,minZ:wall.fixed-wall.thickness/2,maxZ:wall.fixed+wall.thickness/2}
   :{minX:wall.fixed-wall.thickness/2,maxX:wall.fixed+wall.thickness/2,minZ:wall.start,maxZ:wall.end};
 }
 function auditWallGeometry(level,walls){
  const issues=[],add=(code,message,details={})=>issues.push({code,message,...details}),epsilon=1e-7;
  if(!Array.isArray(walls)||!walls.length)return {valid:false,issues:[{code:"wall-geometry-empty",message:"Rendered wall geometry is empty"}],metrics:{pieces:0,junctions:0,overlaps:0}};
  const bounds=walls.map(wall=>wallBounds(wall)),expected=wallJunctions(level),actual=walls.filter(wall=>wall.type==="cell"&&wall.junction);
  for(const wall of walls){
   if((wall.heightOffset||0)!==0)add("wall-height-layer",`Wall '${wall.id}' uses a competing height layer`,{wall:wall.id,heightOffset:wall.heightOffset});
   const box=wallBounds(wall);if(!(box.maxX>box.minX&&box.maxZ>box.minZ))add("wall-piece-size",`Wall '${wall.id}' has a non-positive footprint`,{wall:wall.id});
  }
  const expectedKeys=new Set(expected.map(([col,row])=>key(col,row))),actualKeys=new Set(actual.map(wall=>key(wall.junction.col,wall.junction.row)));
  for(const id of expectedKeys)if(!actualKeys.has(id))add("wall-junction-missing",`Authored junction ${id} has no single owning geometry piece`,{junction:id});
  for(const id of actualKeys)if(!expectedKeys.has(id))add("wall-junction-extra",`Geometry includes an unauthored junction at ${id}`,{junction:id});
  for(const junction of actual){
   const {col,row}=junction.junction,box=wallBounds(junction),centerX=(box.minX+box.maxX)/2,centerZ=(box.minZ+box.maxZ)/2;
   const expectedBranches=new Set([["west",col-1,row],["east",col+1,row],["north",col,row-1],["south",col,row+1]].filter(([,c,r])=>at(level,c,r)==="#").map(([side])=>side));
   const actualBranches=new Set();
   for(const wall of walls)if(wall.type==="line"){
    if(wall.orientation==="H"&&Math.abs(wall.fixed-centerZ)<=epsilon){
     if(Math.abs(wall.end-box.minX)<=epsilon)actualBranches.add("west");
     if(Math.abs(wall.start-box.maxX)<=epsilon)actualBranches.add("east");
    }else if(wall.orientation==="V"&&Math.abs(wall.fixed-centerX)<=epsilon){
     if(Math.abs(wall.end-box.minZ)<=epsilon)actualBranches.add("north");
     if(Math.abs(wall.start-box.maxZ)<=epsilon)actualBranches.add("south");
    }
   }
   const expectedList=[...expectedBranches].sort(),actualList=[...actualBranches].sort();
   if(expectedList.join(",")!==actualList.join(","))add("wall-junction-branch",`Junction (${col},${row}) renders [${actualList}] but the TXT plan requires [${expectedList}]`,{junction:key(col,row),expected:expectedList,actual:actualList});
  }
  let overlaps=0;const adjacency=walls.map(()=>[]);
  for(let i=0;i<walls.length;i++)for(let j=i+1;j<walls.length;j++){
   const a=bounds[i],b=bounds[j],x=Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX),z=Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ);
   if(x>epsilon&&z>epsilon){overlaps++;add("wall-layer-overlap",`Walls '${walls[i].id}' and '${walls[j].id}' occupy the same floor area`,{walls:[walls[i].id,walls[j].id],overlap:{x,z}})}
   if(x>=-epsilon&&z>=-epsilon){adjacency[i].push(j);adjacency[j].push(i)}
  }
  const connected=new Set([0]),queue=[0];while(queue.length){for(const next of adjacency[queue.shift()])if(!connected.has(next)){connected.add(next);queue.push(next)}}
  if(connected.size!==walls.length)add("wall-geometry-disconnected",`${walls.length-connected.size} rendered wall pieces do not meet the shell`,{disconnected:walls.length-connected.size});
  return {valid:issues.length===0,issues,metrics:{pieces:walls.length,junctions:actual.length,overlaps}};
 }
 function validateWallGeometry(level,walls){const report=auditWallGeometry(level,walls);if(!report.valid)throw new HouseLayoutValidationError(report);return report}

 function finish(level,issues,doorRuns,rooms,reachable){
  return {valid:issues.length===0,issues,metrics:{width:level?.width||0,depth:level?.depth||0,rooms:rooms.length,doorRuns:doorRuns.length,reachableCells:reachable.size,wallJunctions:Array.isArray(level?.map)?wallJunctions(level).length:0}};
 }
 function validate(level,options){const report=audit(level,options);if(!report.valid)throw new HouseLayoutValidationError(report);return report}
 return {DEFAULTS,HouseLayoutValidationError,audit,validate,collectRuns,auditWallGeometry,validateWallGeometry,wallJunctions};
});
