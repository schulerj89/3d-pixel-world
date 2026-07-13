// Animated, material-customizable Styloo chibi player with an automatic voxel fallback.
(function(global){
 const ASSET_URL="assets/models/character/styloo-chibi-student.glb?v=__BUILD_VERSION__";
 const REQUIRED_CLIPS={idle:"anim_iddle",walk:"anim_walk",run:"anim_run"};
 const ASSET_BYTES=3753900;
 const FACING=global.characterFacing;
 const MODEL_FORWARD_AXIS=FACING?.STYLOO_MODEL_FORWARD_AXIS||"+z";
 const MODEL_FORWARD_CORRECTION=FACING?.STYLOO_MODEL_FORWARD_CORRECTION??0;
 // Styloo authored the face/eyes on +Z. P.rotation.y is atan2(moveX, moveZ),
 // so no corrective half-turn is needed for this asset.
 const ORIENTATION={forwardAxis:MODEL_FORWARD_AXIS,yawOffsetRadians:MODEL_FORWARD_CORRECTION,movementYaw:"atan2(moveX, moveZ)"};

 function readCustomization(){
  try{return JSON.parse(localStorage.getItem("my3DWorld")||"{}")}
  catch(_error){return {}}
 }

 function cloneAndTintMaterials(model,values){
  const cache=new Map(),materials=new Set();
  model.traverse(object=>{
   if(!object.isMesh)return;
   object.castShadow=true;object.receiveShadow=true;
   const source=Array.isArray(object.material)?object.material:[object.material];
   const mapped=source.map(material=>{
    if(!material)return material;
    if(!model.userData.characterMaterialsCloned){
     if(!cache.has(material))cache.set(material,material.clone());
     return cache.get(material);
    }
    return material;
   });
   object.material=Array.isArray(object.material)?mapped:mapped[0];mapped.forEach(material=>material&&materials.add(material));
  });
  model.userData.characterMaterialsCloned=true;
  const saved=values||readCustomization();
  const outfit=saved.outfit&&saved.outfit!=="Everyday"?Number(saved.outfitColor):Number(saved.shirt);
  const colors={character:Number(saved.skin??0xf2bb91),hairvariant:Number(saved.hair??0x6b3c35),
   schooloutfit:Number(outfit||0xb77cff),schoolskirt:Number(saved.pants??0x5870c8)};
  materials.forEach(material=>{
   const color=colors[material.name];
   if(Number.isFinite(color)&&material.color)material.color.setHex(color);
  });
 }

 class AnimatedHumanoidInstance{
  constructor(root,{preview=false}={}){
   this.root=root;this.preview=preview;this.model=null;this.mixer=null;this.actions={};this.active="";
   this.fallbackChildren=[...root.children];
  }
  async load(){
   const Loader=global.ThreeGLTFLoader?.GLTFLoader;
   if(!Loader)throw new Error("GLTFLoader is unavailable");
   const gltf=await new Promise((resolve,reject)=>new Loader().load(ASSET_URL,resolve,undefined,reject));
   const clips=new Map(gltf.animations.map(clip=>[clip.name,clip]));
   for(const clipName of Object.values(REQUIRED_CLIPS))if(!clips.has(clipName))throw new Error(`Required animation missing: ${clipName}`);
   const model=gltf.scene;
   model.name=this.preview?"animated-chibi-preview":"animated-chibi-player";
   model.scale.setScalar(1.08);
   if(FACING?.attachVisual)FACING.attachVisual(model,MODEL_FORWARD_AXIS);
   else model.rotation.y=ORIENTATION.yawOffsetRadians;
   model.userData.characterForwardAxis=ORIENTATION.forwardAxis;
   model.userData.characterYawOffset=ORIENTATION.yawOffsetRadians;
   cloneAndTintMaterials(model);
   this.root.add(model);this.model=model;
   this.mixer=new THREE.AnimationMixer(model);
   Object.entries(REQUIRED_CLIPS).forEach(([state,name])=>this.actions[state]=this.mixer.clipAction(clips.get(name)));
   this.actions.idle.play();this.active="idle";
   this.fallbackChildren.forEach(child=>child.visible=false);
   this.root.userData.characterAsset="styloo-chibi-student-v1.2";
   this.root.userData.characterForwardAxis=ORIENTATION.forwardAxis;
   this.root.userData.characterYawOffset=ORIENTATION.yawOffsetRadians;
   this.root.userData.characterFallback=false;
   return this;
  }
  setState(state){
   if(!this.actions[state]||state===this.active)return;
   const previous=this.actions[this.active],next=this.actions[state];
   next.reset().setEffectiveTimeScale(state==="run"?1.08:1).setEffectiveWeight(1).fadeIn(.14).play();
   previous?.fadeOut(.14);this.active=state;
  }
  update(dt,state){this.setState(state);this.mixer?.update(dt)}
  applyCustomization(values){
   if(!this.model)return;
   // Legacy wardrobe controls still update the voxel fallback so it is ready
   // if this asset ever fails. Keep those pieces hidden while the rig is live.
   this.fallbackChildren.forEach(child=>child.visible=false);
   cloneAndTintMaterials(this.model,values);
  }
  restoreFallback(error){
   if(this.model)this.root.remove(this.model);
   this.model=null;this.mixer=null;this.fallbackChildren.forEach(child=>child.visible=true);
   this.root.userData.characterFallback=true;this.root.userData.characterError=String(error?.message||error||"load failed");
  }
 }

 const debug={status:"loading",source:"Styloo Chibi Characters v1.2 / studentpr.glb",license:"CC0-1.0",
  assetBytes:ASSET_BYTES,triangles:10586,orientation:ORIENTATION,
  customizableMaterials:["character","hairvariant","schooloutfit","schoolskirt"],
  requiredClips:Object.values(REQUIRED_CLIPS),loadedClips:[],fallback:true,error:null,preview:false};
 const debugNode=global.document?.createElement?.("output")||null;
 if(debugNode){debugNode.id="characterAssetStatus";debugNode.hidden=true;global.document.body.appendChild(debugNode)}
 const publishDebug=()=>{if(debugNode)debugNode.textContent=JSON.stringify({...debug,state:world?.active||""})};
 const world=new AnimatedHumanoidInstance(global.playerAvatarRoot);
 const preview=global.avatarPreviewRoot?new AnimatedHumanoidInstance(global.avatarPreviewRoot,{preview:true}):null;
 const system={
  update(dt,moving,inputStrength=0){
   const state=moving?(inputStrength>.72?"run":"walk"):"idle";
   world.update(dt,state);preview?.update(dt,"idle");debug.state=state;publishDebug();
  },
  applyCustomization(values){world.applyCustomization(values);preview?.applyCustomization(values)},
  debug(){return {...debug,state:world.active}}
 };
 global.customHumanoidCharacter=system;
 global.getCharacterAssetDebug=()=>system.debug();
 publishDebug();
 Promise.all([world.load(),preview?.load()].filter(Boolean)).then(()=>{
  debug.status="ready";debug.fallback=false;debug.preview=Boolean(preview?.model);
  debug.loadedClips=[...Object.values(REQUIRED_CLIPS)];system.applyCustomization();publishDebug();
 }).catch(error=>{
  world.restoreFallback(error);preview?.restoreFallback(error);
  debug.status="fallback";debug.fallback=true;debug.error=String(error?.message||error);publishDebug();
  console.warn("Animated humanoid unavailable; keeping voxel character.",error);
 });
})(window);
