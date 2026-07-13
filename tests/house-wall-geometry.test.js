const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const {parse}=require(path.join(root,"house-layout.js"));
const layout=parse(fs.readFileSync(path.join(root,"house-main-level.txt"),"utf8"));

const signatures=new Set();
for(const wall of layout.walls){
 const signature=[wall.orientation,wall.fixed,wall.start,wall.end].join(":");
 assert(!signatures.has(signature),`duplicate wall plane: ${signature}`);
 signatures.add(signature);
 assert(wall.end>wall.start,"wall segments must have positive length");
 assert.strictEqual(wall.thickness,layout.wallThickness,"every wall must use the authored thin-shell thickness");
}

const frontWalls=layout.walls.filter(wall=>wall.kind==="perimeter"&&wall.orientation==="H"&&wall.fixed>0);
assert.deepStrictEqual(frontWalls.map(wall=>[wall.start,wall.end]),[[-11.5,-2],[2,11.5]],"front structure must meet the side-wall centerlines and stop at the four-unit entrance");
assert(frontWalls.every(wall=>wall.fixed===layout.bounds.maxZ-.5),"front structure must follow the authored perimeter-cell centerline");

function touches(a,b){
 const epsilon=1e-9;
 if(a.orientation===b.orientation){
  if(Math.abs(a.fixed-b.fixed)>epsilon)return false;
  return a.start<=b.end+epsilon&&b.start<=a.end+epsilon;
 }
 const horizontal=a.orientation==="H"?a:b,vertical=a.orientation==="V"?a:b;
 return vertical.fixed>=horizontal.start-epsilon&&vertical.fixed<=horizontal.end+epsilon&&horizontal.fixed>=vertical.start-epsilon&&horizontal.fixed<=vertical.end+epsilon;
}
const connected=new Set([0]),queue=[0];
while(queue.length){const current=queue.shift();layout.walls.forEach((wall,index)=>{if(!connected.has(index)&&touches(layout.walls[current],wall)){connected.add(index);queue.push(index)}})}
assert.strictEqual(connected.size,layout.walls.length,"rendered wall segments must form one continuous corner/T-junction network");
assert(layout.walls.filter(wall=>wall.orientation==="H").every(wall=>wall.heightOffset===0),"horizontal wall caps use the full authored height");
assert(layout.walls.filter(wall=>wall.orientation==="V").every(wall=>wall.heightOffset<0),"vertical caps need a tiny height reveal so crossing tops cannot z-fight");

const context={console};context.window=context;context.globalThis=context;
vm.runInNewContext(fs.readFileSync(path.join(root,"house-exterior.js"),"utf8"),context,{filename:"house-exterior.js"});
const exterior=context.HouseExteriorGeometry;
assert(exterior,"exterior geometry contract must be available to QA");
const assertReveal=(actual,message)=>assert(Math.abs(actual-exterior.skinReveal)<1e-9,message);
assertReveal(exterior.frontSkinZ-exterior.skinThickness/2-layout.bounds.maxZ,"front cladding must retain a reveal outside the interior shell");
assertReveal(layout.bounds.minZ-(exterior.backSkinZ+exterior.skinThickness/2),"back cladding must retain a reveal outside the interior shell");
assertReveal(layout.bounds.minX-(exterior.westSkinX+exterior.skinThickness/2),"west cladding must retain a reveal outside the shell");
assertReveal(exterior.eastSkinX-exterior.skinThickness/2-layout.bounds.maxX,"east cladding must retain a reveal outside the shell");
assert.strictEqual(JSON.stringify(exterior.frontRuns.map(run=>[run.start,run.end])),JSON.stringify([[-12,-2],[2,12]]),"cladding and interior shell must share the same door cutout");
assert(exterior.doorWidth>=3&&exterior.doorWidth<exterior.entranceWidth,"door leaf must fill most of its four-unit module while retaining frame clearance");

const interiorEntries=layout.openings.filter(opening=>opening.symbol==="D");
assert(interiorEntries.every(opening=>opening.width>=3&&opening.width<=4),"every interior entry must span three or four one-unit cells");
assert.deepStrictEqual(interiorEntries.map(opening=>opening.orientation).sort(),["H","H","V"],"opening components must retain horizontal and vertical geometry");

console.log("house wall geometry: thin non-duplicate planes, separated skins, aligned facade cutout, and 3/4-unit entries validated");
