const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const root=path.join(__dirname,"..");
const assetRoot=path.join(root,"assets","textures","house-walls");
const script=fs.readFileSync(path.join(root,"house-wall-materials.js"),"utf8");

for(const file of ["interior-painted-plaster.webp","exterior-wall-cladding.webp"]){
  const fullPath=path.join(assetRoot,file);
  assert.ok(fs.existsSync(fullPath),`${file} must be checked in`);
  assert.ok(fs.statSync(fullPath).size<20*1024,`${file} must stay below the 20 KiB browser budget`);
}
assert.ok(fs.existsSync(path.join(assetRoot,"SOURCE.md")),"texture provenance must ship with the assets");
assert.ok(fs.existsSync(path.join(assetRoot,"LICENSE-CC0.txt")),"the CC0 notice must ship with the assets");

const loadedUrls=[];
class Texture{
  constructor(){this.repeat={set:(x,y)=>{this.repeatValue=[x,y]}}}
  clone(){return new Texture()}
}
class TextureLoader{
  load(url,onLoad){loadedUrls.push(url);queueMicrotask(()=>onLoad(new Texture()))}
}
class MeshStandardMaterial{
  constructor(options){
    Object.assign(this,options);
    this.userData={};
    this.color={set:value=>{this.appliedColor=value}};
  }
}
const THREE={TextureLoader,MeshStandardMaterial,RepeatWrapping:"repeat",SRGBColorSpace:"srgb",FrontSide:"front"};
const context={window:{THREE},console,queueMicrotask};
vm.runInNewContext(script,context,{filename:"house-wall-materials.js"});

const api=context.window.HouseWallMaterials;
assert.deepEqual(Object.keys(api.surfaces),["interior","exterior"]);
const renderer={capabilities:{getMaxAnisotropy:()=>16}};
const first=api.create("interior",{width:6,height:3,renderer});
const second=api.create("interior",{width:3,height:3,renderer});
const outside=api.create("exterior",{width:8,height:4,renderer});

Promise.all([first.userData.textureReady,second.userData.textureReady,outside.userData.textureReady]).then(()=>{
  assert.equal(loadedUrls.length,2,"each source image must be fetched only once");
  assert.ok(loadedUrls.every(url=>url.includes("?v=__BUILD_VERSION__")),"texture requests must be cache busted");
  assert.deepEqual(first.map.repeatValue,[2,1],"interior repeat must follow wall world dimensions");
  assert.deepEqual(outside.map.repeatValue,[4,2],"exterior repeat must follow wall world dimensions");
  assert.equal(first.map.anisotropy,8,"anisotropy must be capped for browser performance");
  assert.equal(first.map.colorSpace,"srgb","wall diffuse maps must use sRGB color space");
  assert.equal(first.userData.textureStatus,"ready");
  assert.equal(api.debug().loadedIds.length,2);
  assert.equal(api.debug().errors.length,0);
  assert.throws(()=>api.create("roof"),/Unknown house wall surface/);
  const fallbackContext={window:{THREE:{...THREE,TextureLoader:null}},console,queueMicrotask};
  vm.runInNewContext(script,fallbackContext,{filename:"house-wall-materials-fallback.js"});
  const fallback=fallbackContext.window.HouseWallMaterials.create("interior");
  return fallback.userData.textureReady.then(()=>{
    assert.equal(fallback.userData.textureStatus,"fallback","solid color must survive a texture load failure");
    assert.equal(fallback.map,undefined,"failed texture loading must not leave a partial map");
    assert.equal(fallbackContext.window.HouseWallMaterials.debug().errors.length,1);
    console.log("house wall materials: CC0 assets, payload budgets, cached loading, tiling, and fallbacks validated");
  });
}).catch(error=>{
  console.error(error);
  process.exitCode=1;
});
