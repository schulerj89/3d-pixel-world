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
assert.strictEqual(Space.placementsFromLevel(level).filter(item=>item.symbol!=="a").length,20,"level should place twenty Space Base Bits props");
assert(!/[OH]/.test(level.map.join("")),"legacy observatory and building symbols must be removed");

const html=read("index.html");
assert(!html.includes("space-buildings.js"),"legacy procedural buildings must not load");
assert(html.indexOf("vendor/gltf-loader-global.js")<html.indexOf("space-world.js"),"GLTF loader must initialize before the Space Realm runtime");
for(const spec of Object.values(Space.ASSET_REGISTRY)){
 for(const extension of ["gltf","bin"])assert(fs.existsSync(path.join(root,Space.ASSET_ROOT,`${spec.file}.${extension}`)),`missing ${spec.file}.${extension}`);
}
assert(fs.existsSync(path.join(root,Space.ASSET_ROOT,"spacebits_texture.png")),"missing shared Space Base Bits texture atlas");
assert.strictEqual(new Set(Object.values(Space.ASSET_REGISTRY).map(spec=>spec.file)).size,16,"asset registry should reuse sixteen source models");
const source=read("space-world.js");
for(const pose of ["overview","landing","cargo","aliens"])assert(source.includes(`${pose}:{`),`missing named ${pose} screenshot pose`);

const broken=read("levels/space-80.txt").replace(".............p......",".......p............");
assert.throws(()=>Space.parseLevel(broken),/only .* units apart/,"layout validation must reject props with less than two units of clearance");
console.log(`space world: ${report.count} placements, ${report.minimum.toFixed(2)} minimum units, 5 aliens, 0 other NPCs`);
