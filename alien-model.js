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
  function animationSampleTimes(clip,minimumSamples=32){
    const duration=Math.max(Number(clip?.duration)||0,0),times=new Set([0,duration]);
    if(duration>0)for(let index=0;index<minimumSamples;index++)times.add(duration*index/minimumSamples);
    for(const track of clip?.tracks||[])for(const time of track.times||[]){
      const value=Number(time);if(Number.isFinite(value)&&value>=0&&value<=duration)times.add(value);
    }
    return [...times].sort((a,b)=>a-b);
  }
  function groundingProfileFromBottoms(bottoms,duration=0){
    const finite=bottoms.filter(Number.isFinite);
    if(!finite.length)throw new Error("Alien animation produced no finite ground samples");
    return {minBottom:Math.min(...finite),maxBottom:Math.max(...finite),sampleCount:finite.length,duration};
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
  function sampleAnimatedGrounding(THREE,model,mixer,clip){
    const times=animationSampleTimes(clip),bottoms=[];
    for(const time of times){
      mixer.setTime(time);
      bottoms.push(measureBounds(THREE,model).min.y);
    }
    return groundingProfileFromBottoms(bottoms,clip?.duration||0);
  }
  function createInstance(THREE,asset,index=0,surfaceY=0){
    const model=cloneScene(THREE,asset.scene),clip=selectIdleClip(asset.animations,asset.spec.animation);
    model.name=asset.spec.id;model.scale.setScalar(asset.spec.scale);model.rotation.y=index%2?Math.PI*.35:-Math.PI*.2;
    const mixer=clip?new THREE.AnimationMixer(model):null;
    const phase=clip?(index*.37)%Math.max(clip.duration,.01):0;
    if(mixer)mixer.clipAction(clip).play();
    // Sampling is deliberately creation-time only. The cached per-variant profile
    // keeps Box3 work out of the render loop and out of subsequent instances.
    if(!asset.groundingProfile){
      asset.groundingProfile=mixer?sampleAnimatedGrounding(THREE,model,mixer,clip):groundingProfileFromBottoms([measureBounds(THREE,model).min.y]);
    }
    const profile=asset.groundingProfile;
    const rootShiftY=surfaceY-profile.minBottom;
    model.position.y+=rootShiftY;
    if(mixer)mixer.setTime(phase);
    model.updateMatrixWorld(true);
    const groundedBounds=measureBounds(THREE,model),groundError=profile.minBottom+rootShiftY-surfaceY;
    const groundClearance=groundedBounds.min.y-surfaceY;
    const grounding={method:"sampled-animation-bounds",sampleCount:profile.sampleCount,duration:profile.duration,minAnimatedBottom:profile.minBottom,maxAnimatedBottom:profile.maxBottom,rootShiftY,rootY:model.position.y,groundError,groundClearance,phase};
    model.userData={...model.userData,assetId:asset.spec.id,source:"Quaternius Ultimate Space Kit",license:"CC0-1.0",animation:clip?.name||null,groundY:surfaceY,groundError,groundClearance,grounding};
    return {model,mixer,clipName:clip?.name||null,groundError,groundClearance,grounding,bounds:groundedBounds};
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
    ASSET_ROOT,MODEL_SPECS,selectIdleClip,groundedY,animationSampleTimes,groundingProfileFromBottoms,cloneScene,measureBounds,sampleAnimatedGrounding,createInstance,load
  };
  root.QuaterniusAlienAsset=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
