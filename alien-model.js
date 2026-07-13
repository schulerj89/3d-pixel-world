(function(root){
  "use strict";
  const BUILD_VERSION="__BUILD_VERSION__";
  const ASSET_ROOT="assets/models/quaternius-space-aliens/";
  const MODEL_SPECS=Object.freeze([
    Object.freeze({id:"space.npc.alien.extra-small",file:"Enemy_ExtraSmall.gltf",animation:"Flying_Idle",scale:.9}),
    Object.freeze({id:"space.npc.alien.small",file:"Enemy_Small.gltf",animation:"Flying_Idle",scale:.72})
  ]);

  function loadGLTF(loader,url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject))}
  function selectIdleClip(animations=[],preferred="Flying_Idle"){
    return animations.find(clip=>clip.name===preferred)||animations.find(clip=>/idle/i.test(clip.name))||null;
  }
  function groundedY(bounds,scale=1,surfaceY=0){
    if(!bounds?.min||!Number.isFinite(bounds.min.y))throw new Error("Alien bounds are required for grounding");
    return surfaceY-bounds.min.y*scale;
  }
  function cloneScene(THREE,source){
    const clone=source.clone(true),sourceToClone=new Map();
    (function mapPair(sourceNode,cloneNode){
      sourceToClone.set(sourceNode,cloneNode);
      for(let index=0;index<sourceNode.children.length;index++)mapPair(sourceNode.children[index],cloneNode.children[index]);
    })(source,clone);
    source.traverse(sourceNode=>{
      if(!sourceNode.isSkinnedMesh)return;
      const cloneNode=sourceToClone.get(sourceNode);
      const bones=sourceNode.skeleton.bones.map(bone=>sourceToClone.get(bone));
      cloneNode.skeleton=sourceNode.skeleton.clone();cloneNode.skeleton.bones=bones;
      cloneNode.bindMatrix.copy(sourceNode.bindMatrix);cloneNode.bind(cloneNode.skeleton,cloneNode.bindMatrix);
    });
    return clone;
  }
  function measureBounds(THREE,model){
    model.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(model);
    if(box.isEmpty())throw new Error("Alien model produced empty bounds");
    return {min:{x:box.min.x,y:box.min.y,z:box.min.z},max:{x:box.max.x,y:box.max.y,z:box.max.z}};
  }
  function createInstance(THREE,asset,index=0,surfaceY=0){
    const model=cloneScene(THREE,asset.scene),clip=selectIdleClip(asset.animations,asset.spec.animation);
    model.name=asset.spec.id;model.scale.setScalar(asset.spec.scale);model.rotation.y=index%2?Math.PI*.35:-Math.PI*.2;
    const mixer=clip?new THREE.AnimationMixer(model):null;
    if(mixer){const action=mixer.clipAction(clip);action.play();mixer.setTime((index*.37)%Math.max(clip.duration,.01))}
    const initialBounds=measureBounds(THREE,model);
    model.position.y+=surfaceY-initialBounds.min.y;model.updateMatrixWorld(true);
    const groundedBounds=measureBounds(THREE,model),groundError=groundedBounds.min.y-surfaceY;
    model.userData={...model.userData,assetId:asset.spec.id,source:"Quaternius Ultimate Space Kit",license:"CC0-1.0",animation:clip?.name||null,groundY:surfaceY,groundError};
    return {model,mixer,clipName:clip?.name||null,groundError,bounds:groundedBounds};
  }
  async function load(THREE,Loader=root.ThreeGLTFLoader?.GLTFLoader){
    if(!Loader)return {variants:[],loadedAssetIds:[],errors:["Alien GLTF loader is unavailable"]};
    const loader=new Loader(),variants=[],errors=[];
    await Promise.all(MODEL_SPECS.map(async spec=>{
      try{
        const gltf=await loadGLTF(loader,`${ASSET_ROOT}${spec.file}?v=${BUILD_VERSION}`);
        if(!selectIdleClip(gltf.animations,spec.animation))throw new Error(`${spec.file} is missing an idle animation`);
        variants.push({spec,scene:gltf.scene,animations:gltf.animations});
      }catch(error){errors.push(`${spec.file}: ${error?.message||error}`)}
    }));
    variants.sort((a,b)=>MODEL_SPECS.indexOf(a.spec)-MODEL_SPECS.indexOf(b.spec));
    return {variants,loadedAssetIds:variants.map(asset=>asset.spec.id),errors};
  }

  const api={
    source:{name:"Ultimate Space Kit",author:"Quaternius",license:"CC0-1.0",url:"https://quaternius.com/packs/ultimatespacekit.html"},
    ASSET_ROOT,MODEL_SPECS,selectIdleClip,groundedY,cloneScene,measureBounds,createInstance,load
  };
  root.QuaterniusAlienAsset=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
