const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const City=require("../city-world.js"),root=path.join(__dirname,".."),read=file=>fs.readFileSync(path.join(root,file),"utf8");

const level=City.parseLevel(read("levels/city-98.txt")),spacing=City.spacingReport(level),roads=City.validateRoads(level),placements=City.buildingPlacements(level),lanes=City.roadLanes(level);
assert.deepEqual([level.width,level.depth,level.cell],[98,98,7]);
assert.equal(level.symbolAt(level.spawnCol,level.spawnRow),"X");
assert.equal(placements.length,9,"all nine city buildings should be level-authored");
assert(spacing.minimum>=City.MIN_SPACING,`minimum building clearance is ${spacing.minimum}`);
assert.equal(roads.junctions,9,"the city needs a 3x3 traffic-light grid");
assert(roads.roadTiles>=70,"the city should have a connected road network");
assert.equal(lanes.length,6,"three horizontal and three vertical traffic lanes should reach world edges");
assert(City.CAR_SCALE*.45>=3,"cars should be at least as tall as the three-unit chibi");

const tooTight=read("levels/city-98.txt").replace("cell: 7","cell: 2").replace("size: 98x98","size: 28x28");
assert.throws(()=>City.parseLevel(tooTight),/too tight for the enlarged city kit/);
for(const file of City.MODEL_FILES)for(const extension of ["gltf","bin"]){
 assert(fs.existsSync(path.join(root,City.ASSET_ROOT,`${file}.${extension}`)),`missing ${file}.${extension}`);
}
assert(fs.existsSync(path.join(root,City.ASSET_ROOT,"citybits_texture.png")),"missing shared city atlas");
assert.equal(new Set(City.MODEL_FILES).size,City.MODEL_FILES.length,"the city asset registry should load each source once");
const source=read("city-world.js");
for(const pose of ["overview","buildingsNorth","buildingsCenter","buildingsSouth","trafficLights","carsEast","carsNorth"])assert(source.includes(`${pose}:{`),`missing named ${pose} QA pose`);
for(const type of "ABCDEFGH")assert(source.includes(`building${type}:{`),`missing building ${type} QA pose`);
const html=read("index.html");
assert(html.includes('id="goCity"')&&html.includes("assets/ui/city.svg"),"world picker needs the City button and icon");
assert(!/goForest|forest-world\.js|forest-animal-model\.js/.test(html),"forest destination scripts and button must be removed");
console.log(`city world: ${placements.length} buildings, ${roads.roadTiles} road tiles, ${roads.junctions} junctions, ${spacing.minimum.toFixed(2)} minimum units`);
