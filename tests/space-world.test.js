const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Space=require("../space-world.js");

const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const level=Space.parseLevel(read("levels/space-80.txt"));
const report=Space.validateSpacing(level);
assert.deepStrictEqual([level.width,level.depth,level.cell],[80,80,4]);
assert.strictEqual(level.symbolAt(level.spawnCol,level.spawnRow),"X");
assert(report.minimum>=Space.MIN_SPACING,`minimum spacing is ${report.minimum}`);
assert.strictEqual(Space.placementsFromLevel(level).filter(item=>item.symbol==="a").length,5,"all five alien NPCs should remain");
assert.strictEqual(Space.placementsFromLevel(level).filter(item=>item.symbol!=="a").length,25,"level should place twenty-five Space Base Bits props");
assert(Space.roadCells(level).length>=70,"the text layout should author a substantial connected road network");
assert.strictEqual(Space.ASSET_REGISTRY.A.scale,6,"lander A should be 250% of its previous 2.4 scale");
assert.strictEqual(Space.ASSET_REGISTRY.B.scale,6,"lander B should be 250% of its previous 2.4 scale");
assert.strictEqual(Space.BACKGROUND_STAR_COUNT,700,"space backdrop star budget changed unexpectedly");
assert(!Object.values(Space.ASSET_REGISTRY).some(spec=>/basemodule|cargodepot/.test(spec.file)),"legacy building modules must remain excluded");

const html=read("index.html");
assert(!html.includes("space-buildings.js"),"legacy procedural buildings must not load");
assert(html.indexOf("vendor/gltf-loader-global.js")<html.indexOf("space-world.js"),"GLTF loader must initialize before the Space Realm runtime");
for(const spec of Object.values(Space.ASSET_REGISTRY)){
 for(const extension of ["gltf","bin"])assert(fs.existsSync(path.join(root,Space.ASSET_ROOT,`${spec.file}.${extension}`)),`missing ${spec.file}.${extension}`);
}
assert(fs.existsSync(path.join(root,Space.ASSET_ROOT,"spacebits_texture.png")),"missing shared Space Base Bits texture atlas");
assert.strictEqual(new Set(Object.values(Space.ASSET_REGISTRY).map(spec=>spec.file)).size,26,"asset registry should reuse twenty-six source models");
const source=read("space-world.js");
for(const pose of ["overview","landing","roads","cargo","aliens","alienExtraSmall","alienSmall"])assert(source.includes(`${pose}:{`),`missing named ${pose} screenshot pose`);
assert(source.includes("depthWrite:false,depthTest:true"),"starfield must respect scene depth instead of rendering through the floor and props");
assert(source.includes("alienMixers.forEach(mixer=>mixer.update(dt))"),"Space Realm must advance authored alien idle clips");
assert(source.includes("grounded:alienGrounding.every"),"alien ground-contact status must be exposed for QA");
assert(source.includes("space-alien-contact-shadows"),"aliens need an instanced ground-contact cue");
assert(read("house-system.js").includes("dataset.spaceAlienGrounded"),"browser QA must expose alien ground-contact status");

const alienAsset=require("../alien-model.js");
for(const spec of alienAsset.MODEL_SPECS)assert(fs.existsSync(path.join(root,alienAsset.ASSET_ROOT,spec.file)),`missing animated alien ${spec.file}`);
assert.strictEqual(alienAsset.source.license,"CC0-1.0");

const broken=read("levels/space-80.txt").replace("...L.....rr.....p...","...Lp....rr.........");
assert.throws(()=>Space.parseLevel(broken),/only .* units apart/,"layout validation must reject props with less than two units of clearance");
console.log(`space world: ${report.count} placements, ${Space.roadCells(level).length} road tiles, ${report.minimum.toFixed(2)} minimum units, 5 aliens, 0 other NPCs`);
