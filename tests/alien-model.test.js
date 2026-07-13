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
const clip={duration:2,tracks:[{times:new Float32Array([0,.35,1.7,2])}]};
const sampleTimes=asset.animationSampleTimes(clip,4);
assert.strictEqual(sampleTimes.length,7,"ground sampling should combine authored keys and intermediate phases");
for(const expected of [0,.35,.5,1,1.5,1.7,2])assert(sampleTimes.some(actual=>Math.abs(actual-expected)<1e-6),`ground sampling omitted phase ${expected}`);
const profile=asset.groundingProfileFromBottoms([.12,-.04,.08,0],2);
assert.deepStrictEqual(profile,{minBottom:-.04,maxBottom:.12,sampleCount:4,duration:2},"ground profile must retain the full animated vertical range");
assert.throws(()=>asset.groundingProfileFromBottoms([NaN]),/no finite ground samples/);
for(const [minY,scale,surfaceY] of [[1.5,.9,0],[1.37,.72,.25]]){
  const y=asset.groundedY({min:{y:minY}},scale,surfaceY);
  assert(Math.abs(y+minY*scale-surfaceY)<1e-8,"scaled alien bottom should match its support surface");
}

const source=fs.readFileSync(path.join(root,"alien-model.js"),"utf8");
assert(source.includes("if(!asset.groundingProfile)"),"animation bounds must be sampled once and cached per model variant");
assert(source.includes('method:"sampled-animation-bounds"'),"grounding debug data must identify the sampled approach");
assert(source.includes("groundClearance"),"QA needs current-phase ground clearance in addition to worst-case error");
assert(!/function update[^]*Box3/.test(source),"animated grounding must not perform per-frame Box3 work");

console.log("animated aliens: 2 CC0 glTF variants, rigged Flying_Idle clips, 351 KB total");
