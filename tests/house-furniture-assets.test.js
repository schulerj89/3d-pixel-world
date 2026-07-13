const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const assetsScript=fs.readFileSync(path.join(root,"furniture-assets.js"),"utf8");
const houseScript=fs.readFileSync(path.join(root,"house-system.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const assetRoot=path.join(root,"assets","models","furniture-bits");

const replacements={
  sofa:"couch_pillows",
  table:"table_low",
  bed:"bed_double_A",
  lamp:"lamp_standing",
  chair:"chair_A",
  rug:"rug_rectangle_stripes_A",
  dresser:"cabinet_medium_decorated",
  plant:"cactus_medium_A"
};
const additions={
  armchair:"armchair_pillows",
  stool:"chair_stool",
  diningTable:"table_medium_long",
  sideTable:"table_small",
  tableLamp:"lamp_table",
  smallCactus:"cactus_small_A"
};

for(const [kind,file] of Object.entries({...replacements,...additions})){
  assert(assetsScript.includes(`${kind}:{file:"${file}"`),`${kind} must map to ${file}`);
  assert(fs.existsSync(path.join(assetRoot,`${file}.gltf`)),`${file}.gltf must exist`);
  assert(fs.existsSync(path.join(assetRoot,`${file}.bin`)),`${file}.bin must exist`);
  const gltf=JSON.parse(fs.readFileSync(path.join(assetRoot,`${file}.gltf`),"utf8"));
  assert.strictEqual(gltf.buffers[0].uri,`${file}.bin`,`${file} must use its checked-in buffer`);
  assert.strictEqual(gltf.images[0].uri,"furniturebits_texture.png",`${file} must share the atlas texture`);
}

for(const primitive of ["tv","fridge","desk","vanity","bookshelf"]){
  assert(!new RegExp(`\\b${primitive}:\\{file:`).test(assetsScript),`${primitive} must remain project-authored`);
}
for(const kind of Object.keys(additions)){
  assert(html.includes(`data-f="${kind}"`),`${kind} must be available in the build catalog`);
}

assert(html.includes("furniture-assets.js?v=__BUILD_VERSION__"),"the furniture loader must be cache busted");
assert(houseScript.includes("item.rotation.y+=Math.PI/4"),"placed furniture must retain 45-degree rotation");
assert(houseScript.includes("window.FurnitureAssets?.attach(g,kind)"),"furniture groups must receive async art");
assert(assetsScript.includes("fallbackRoot.visible=false"),"loaded art must replace its primitive fallback");
assert(houseScript.includes("window.getHouseFurnitureDebug"),"browser QA must expose furniture and renderer state");
assert(fs.existsSync(path.join(assetRoot,"LICENSE-CC0.txt")),"the KayKit license must ship with the assets");
assert(fs.existsSync(path.join(assetRoot,"SOURCE.md")),"asset provenance must be documented");

console.log("house furniture: KayKit mappings, primitive exceptions, placement rotation, fallbacks, and provenance validated");
