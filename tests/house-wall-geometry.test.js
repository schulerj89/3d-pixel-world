const assert=require("assert");
const fs=require("fs");
const path=require("path");
const vm=require("vm");
const root=path.resolve(__dirname,"..");
const {parse}=require(path.join(root,"house-layout.js"));
const Validator=require(path.join(root,"house-layout-validator.js"));
const HouseSpaceSpec=require(path.join(root,"house-space-spec.js"));
const source=fs.readFileSync(path.join(root,"house-main-level.txt"),"utf8"),level=HouseSpaceSpec.parseLevel(source),layout=parse(source);

const signatures=new Set();
for(const wall of layout.walls){
 const signature=wall.type==="cell"?[wall.type,wall.x,wall.z,wall.width,wall.depth].join(":"):[wall.orientation,wall.fixed,wall.start,wall.end].join(":");
 assert(!signatures.has(signature),`duplicate wall plane: ${signature}`);
 signatures.add(signature);
 if(wall.type==="line")assert(wall.end>wall.start,"wall segments must have positive length");
 else assert(wall.width>0&&wall.depth>0,"junction pieces must have positive dimensions");
 assert.strictEqual(wall.thickness,layout.wallThickness,"every wall must use the authored thin-shell thickness");
 assert.strictEqual(wall.heightOffset,0,"all wall pieces must share one height layer");
}

const frontWalls=layout.walls.filter(wall=>wall.kind==="perimeter"&&wall.orientation==="H"&&wall.fixed>0);
assert.deepStrictEqual(frontWalls.map(wall=>[wall.start,wall.end]),[[-11.375,-2],[2,11.375]],"front lines must meet their corner owners and stop at the four-unit entrance");
assert(frontWalls.every(wall=>wall.fixed===layout.bounds.maxZ-.5),"front structure must follow the authored perimeter-cell centerline");

const geometryReport=Validator.validateWallGeometry(level,layout.walls);
assert.deepStrictEqual(geometryReport.metrics,{pieces:28,junctions:11,overlaps:0},"geometry QA must prove exact joins with no double-layer footprint");
const legacyCross=[{id:"horizontal",type:"line",orientation:"H",fixed:0,start:-1,end:1,thickness:.25,heightOffset:0},{id:"vertical",type:"line",orientation:"V",fixed:0,start:-1,end:1,thickness:.25,heightOffset:-.015}];
const legacyCodes=Validator.auditWallGeometry(level,legacyCross).issues.map(issue=>issue.code);
assert(legacyCodes.includes("wall-layer-overlap"),"the former crossing slabs must fail positive-area overlap QA");
assert(legacyCodes.includes("wall-height-layer"),"the former staggered cap heights must fail single-layer QA");
const corner=layout.walls.find(wall=>wall.id==="junction-15-9"),cornerBox={minX:corner.x-corner.width/2,maxX:corner.x+corner.width/2,minZ:corner.z-corner.depth/2,maxZ:corner.z+corner.depth/2};
assert(!layout.walls.some(wall=>wall.type==="line"&&wall.orientation==="H"&&wall.fixed===corner.z&&wall.start===cornerBox.maxX),"the kitchen/bedroom corner must not grow an east-facing T whisker");
assert(!layout.walls.some(wall=>wall.type==="line"&&wall.orientation==="V"&&wall.fixed===corner.x&&wall.end===cornerBox.minZ),"the kitchen/bedroom corner must not grow a north-facing T whisker");
const whiskered=layout.walls.map(wall=>({...wall}));whiskered.push({id:"bad-whisker",type:"line",orientation:"H",fixed:corner.z,start:cornerBox.maxX,end:cornerBox.maxX+.5,thickness:.25,heightOffset:0});
assert(Validator.auditWallGeometry(level,whiskered).issues.some(issue=>issue.code==="wall-junction-branch"),"validator must reject a rendered branch absent from the TXT junction");

const context={console};context.window=context;context.globalThis=context;
vm.runInNewContext(fs.readFileSync(path.join(root,"house-exterior.js"),"utf8"),context,{filename:"house-exterior.js"});
const exterior=context.HouseExteriorGeometry;
assert(exterior,"exterior geometry contract must be available to QA");
assert.strictEqual(exterior.wallLayerCount,1,"the exterior must reuse the structural shell instead of adding a second wall");
assert.strictEqual(exterior.claddingMode,"structural-outward-faces","outer texture must be assigned to outward structural faces");
assert(Math.abs(exterior.facadeZ-(frontWalls[0].fixed+layout.wallThickness/2+.005))<1e-9,"entrance infill must sit directly against the structural front face");
assert(exterior.doorWidth>=3&&exterior.doorWidth<exterior.entranceWidth,"door leaf must fill most of its four-unit module while retaining frame clearance");

const interiorEntries=layout.openings.filter(opening=>opening.symbol==="D");
assert(interiorEntries.every(opening=>opening.width>=3&&opening.width<=4),"every interior entry must span three or four one-unit cells");
assert.deepStrictEqual(interiorEntries.map(opening=>opening.orientation).sort(),["H","H","V"],"opening components must retain horizontal and vertical geometry");

console.log("house wall geometry: exact single-height joins, zero footprint overlaps, one textured shell, and 3/4-unit entries validated");
