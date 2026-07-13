const assert=require("assert");
const fs=require("fs");
const path=require("path");
const asset=require("../alien-model.js");

const root=path.join(__dirname,"..");
assert.strictEqual(asset.source.name,"Ultimate Space Kit");
assert.strictEqual(asset.source.author,"Quaternius");
assert.strictEqual(asset.source.license,"CC0-1.0");
assert.strictEqual(asset.MODEL_SPECS.length,2,"two alien variants should be reused across five placements");
assert(fs.readFileSync(path.join(root,"alien-model.js"),"utf8").includes("cloneNode.bindMatrix.copy(sourceNode.bindMatrix)"),"skinned clones must preserve the authored bind matrix");

for(const spec of asset.MODEL_SPECS){
  const file=path.join(root,asset.ASSET_ROOT,spec.file),json=JSON.parse(fs.readFileSync(file,"utf8"));
  assert(fs.statSync(file).size<250*1024,`${spec.file} exceeds the per-alien source budget`);
  assert(json.animations.some(animation=>animation.name===spec.animation),`${spec.file} is missing ${spec.animation}`);
  assert(json.skins?.length>0&&json.meshes?.length>0,`${spec.file} must retain its rigged mesh`);
  assert(json.buffers.every(buffer=>buffer.uri.startsWith("data:")),`${spec.file} should be a self-contained glTF`);
}

assert.strictEqual(asset.selectIdleClip([{name:"Walk"},{name:"Flying_Idle"}]).name,"Flying_Idle");
assert.strictEqual(asset.selectIdleClip([{name:"Idle_Breathe"}],"missing").name,"Idle_Breathe");
assert.strictEqual(asset.selectIdleClip([{name:"Walk"}]),null);
for(const [minY,scale,surfaceY] of [[1.5,.9,0],[1.37,.72,.25]]){
  const y=asset.groundedY({min:{y:minY}},scale,surfaceY);
  assert(Math.abs(y+minY*scale-surfaceY)<1e-8,"scaled alien bottom should match its support surface");
}

console.log("animated aliens: 2 CC0 glTF variants, rigged Flying_Idle clips, 351 KB total");
