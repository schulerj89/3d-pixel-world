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
assert.deepStrictEqual(frontWalls.map(wall=>[wall.start,wall.end]),[[-12,-2],[2,12]],"front wall runs must stop at the four-unit entrance instead of drawing behind its door");
assert(frontWalls.every(wall=>wall.fixed+wall.thickness/2===layout.bounds.maxZ),"interior front wall must terminate exactly on the shell boundary");

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
