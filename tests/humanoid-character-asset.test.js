const assert=require("assert");
const fs=require("fs");
const path=require("path");

const asset=path.join(__dirname,"..","assets","models","character","quaternius-casual-humanoid.glb");
const bytes=fs.readFileSync(asset);
assert(bytes.length<=1_500_000,`character payload exceeds budget: ${bytes.length}`);
assert.strictEqual(bytes.toString("ascii",0,4),"glTF","asset is not a binary glTF");
const jsonLength=bytes.readUInt32LE(12);
assert.strictEqual(bytes.toString("ascii",16,20),"JSON","first GLB chunk must contain JSON");
const json=JSON.parse(bytes.toString("utf8",20,20+jsonLength).trim());
const clips=(json.animations||[]).map(animation=>animation.name).sort();
assert.deepStrictEqual(clips,["CharacterArmature|Idle","CharacterArmature|Run","CharacterArmature|Walk"]);
const materials=(json.materials||[]).map(material=>material.name);
["Skin","Hair","Purple","LightBlue"].forEach(name=>assert(materials.includes(name),`missing customizable material ${name}`));
assert((json.skins||[]).length>0,"character must remain skinned");
console.log(`humanoid character: ${bytes.length} bytes, clips: ${clips.join(", ")}`);
