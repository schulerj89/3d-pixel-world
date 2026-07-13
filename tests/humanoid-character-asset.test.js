const assert=require("assert");
const fs=require("fs");
const path=require("path");

const asset=path.join(__dirname,"..","assets","models","character","styloo-chibi-student.glb");
const bytes=fs.readFileSync(asset);
assert(bytes.length<=6_000_000,`character payload exceeds budget: ${bytes.length}`);
assert.strictEqual(bytes.toString("ascii",0,4),"glTF","asset is not a binary glTF");
const jsonLength=bytes.readUInt32LE(12);
assert.strictEqual(bytes.toString("ascii",16,20),"JSON","first GLB chunk must contain JSON");
const json=JSON.parse(bytes.toString("utf8",20,20+jsonLength).trim());
const clips=(json.animations||[]).map(animation=>animation.name).sort();
assert.deepStrictEqual(clips,["anim_crouch","anim_crouchiddle","anim_dying","anim_flip","anim_iddle","anim_iddle.001",
 "anim_jump","anim_push","anim_run","anim_uncrouch","anim_walk"]);
for(const name of ["anim_iddle","anim_walk","anim_run","anim_crouchiddle"]){
 const animation=json.animations.find(item=>item.name===name);
 const duration=Math.max(...animation.samplers.map(sampler=>json.accessors[sampler.input].max?.[0]||0));
 assert(duration>.1,`${name} must contain a non-empty animation timeline`);
}
const materials=(json.materials||[]).map(material=>material.name);
["character","hairvariant","schooloutfit","schoolskirt"].forEach(name=>assert(materials.includes(name),`missing customizable material ${name}`));
assert((json.skins||[]).length>0,"character must remain skinned");
// Eye geometry is entirely in front of the face on +Z. That matches the
// game's atan2(moveX, moveZ) yaw and protects against backwards locomotion.
const eyeNode=(json.nodes||[]).find(node=>node.name==="eyes");
assert(eyeNode&&Number.isInteger(eyeNode.mesh),"eyes mesh is required for orientation validation");
const eyePositionAccessor=json.accessors[json.meshes[eyeNode.mesh].primitives[0].attributes.POSITION];
assert(eyePositionAccessor.min[2]>.2,"Styloo chibi forward axis must remain +Z");
let triangles=0,minY=Infinity,maxY=-Infinity;
for(const mesh of json.meshes)for(const primitive of mesh.primitives){
 const position=json.accessors[primitive.attributes.POSITION];
 minY=Math.min(minY,position.min[1]);maxY=Math.max(maxY,position.max[1]);
 triangles+=(primitive.indices===undefined?position.count:json.accessors[primitive.indices].count)/3;
}
assert.strictEqual(triangles,10586,"unexpected character triangle count");
assert(minY>=0&&maxY>2,"character bind pose must be grounded and full-height");
console.log(`Styloo chibi: ${bytes.length} bytes, ${clips.length} clips, +Z forward`);
