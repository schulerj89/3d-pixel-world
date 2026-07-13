// Portable timed collectible quest for Three.js worlds.
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.CoinQuestSystem=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 const DEFAULT_CONFIG=Object.freeze({
  id:"space-coin-sprint",
  title:"Cosmic Coin Sprint",
  count:6,
  timeLimitSeconds:30,
  reward:10,
  collectRadius:1.35,
  hoverHeight:.85,
  hoverAmplitude:.16,
  hoverSpeed:2.25,
  rotationSpeed:1.8,
  coinHeight:1.25,
  positions:Object.freeze([
   Object.freeze({x:-12,y:0,z:-2}),Object.freeze({x:-7,y:0,z:5}),
   Object.freeze({x:-1,y:0,z:8}),Object.freeze({x:6,y:0,z:5}),
   Object.freeze({x:11,y:0,z:-1}),Object.freeze({x:3,y:0,z:-8})
  ])
 });

 function finite(value,fallback){return Number.isFinite(Number(value))?Number(value):fallback}
 function isHudVisiblePhase(phase){return phase==="active"||phase==="failed"}
 function normalizeConfig(input){
  const source=input||{};
  const positions=Array.isArray(source.positions)?source.positions:DEFAULT_CONFIG.positions;
  const count=Math.max(1,Math.floor(finite(source.count,positions.length||DEFAULT_CONFIG.count)));
  return {
   id:String(source.id||DEFAULT_CONFIG.id),title:String(source.title||DEFAULT_CONFIG.title),count,
   timeLimitSeconds:Math.max(.1,finite(source.timeLimitSeconds,DEFAULT_CONFIG.timeLimitSeconds)),
   reward:Math.max(0,finite(source.reward,DEFAULT_CONFIG.reward)),
   collectRadius:Math.max(.1,finite(source.collectRadius,DEFAULT_CONFIG.collectRadius)),
   hoverHeight:finite(source.hoverHeight,DEFAULT_CONFIG.hoverHeight),
   hoverAmplitude:Math.max(0,finite(source.hoverAmplitude,DEFAULT_CONFIG.hoverAmplitude)),
   hoverSpeed:finite(source.hoverSpeed,DEFAULT_CONFIG.hoverSpeed),
   rotationSpeed:finite(source.rotationSpeed,DEFAULT_CONFIG.rotationSpeed),
   coinHeight:Math.max(.1,finite(source.coinHeight,DEFAULT_CONFIG.coinHeight)),
   positions:Array.from({length:count},(_,index)=>{
    const supplied=positions[index];
    if(supplied)return {x:finite(supplied.x,0),y:finite(supplied.y,0),z:finite(supplied.z,0)};
    const angle=index/count*Math.PI*2,radius=7+index%2*2;
    return {x:Math.cos(angle)*radius,y:0,z:Math.sin(angle)*radius};
   })
  };
 }

 class CoinQuestController{
  constructor(config,options){
   this.config=normalizeConfig(config);this.now=options&&options.now||(()=>Date.now());
   this.onReward=options&&options.onReward||(()=>{});this.listeners=new Set();
   if(options&&typeof options.onEvent==="function")this.listeners.add(options.onEvent);
   this.run=0;this.rewardGranted=false;this.reset();
  }
  reset(){
   this.phase="idle";this.startedAt=null;this.finishedAt=null;this.remainingMs=this.config.timeLimitSeconds*1000;
   this.collected=new Array(this.config.count).fill(false);this.rewardGranted=false;return this.snapshot();
  }
  emit(type,detail){
   const event=Object.assign({type,questId:this.config.id,snapshot:this.snapshot()},detail||{});
   this.listeners.forEach(listener=>listener(event));return event;
  }
  subscribe(listener){if(typeof listener!=="function")throw new Error("Quest listener must be a function");this.listeners.add(listener);return()=>this.listeners.delete(listener)}
  start(at){
   this.run+=1;this.phase="active";this.startedAt=finite(at,this.now());this.finishedAt=null;
   this.remainingMs=this.config.timeLimitSeconds*1000;this.collected.fill(false);this.rewardGranted=false;
   this.emit("quest:start",{run:this.run});return this.snapshot();
  }
  retry(at){const previousRun=this.run;this.start(at);this.emit("quest:retry",{previousRun,run:this.run});return this.snapshot()}
  update(at){
   if(this.phase!=="active")return this.snapshot();
   const time=finite(at,this.now());this.remainingMs=Math.max(0,this.config.timeLimitSeconds*1000-(time-this.startedAt));
   if(this.remainingMs<=0)this.fail("time-expired",time);
   return this.snapshot();
  }
  collect(index,at){
   if(this.phase!=="active"||index<0||index>=this.collected.length||this.collected[index])return false;
   this.update(at);if(this.phase!=="active")return false;
   this.collected[index]=true;this.emit("coin:collect",{index,collectedCount:this.collectedCount});
   if(this.collectedCount===this.config.count)this.succeed(finite(at,this.now()));
   return true;
  }
  succeed(at){
   if(this.phase!=="active")return false;
   this.phase="success";this.finishedAt=at;
   if(!this.rewardGranted){this.rewardGranted=true;this.onReward(this.config.reward,{questId:this.config.id,run:this.run});}
   this.emit("quest:success",{reward:this.config.reward,run:this.run});return true;
  }
  fail(reason,at){
   if(this.phase!=="active")return false;
   this.phase="failed";this.finishedAt=finite(at,this.now());this.remainingMs=0;
   this.emit("quest:failed",{reason:reason||"failed",run:this.run});return true;
  }
  get collectedCount(){let total=0;for(const value of this.collected)if(value)total+=1;return total}
  snapshot(){return {
   id:this.config.id,title:this.config.title,phase:this.phase,run:this.run,count:this.config.count,
   collectedCount:this.collectedCount,remainingMs:this.remainingMs,reward:this.config.reward,
   rewardGranted:this.rewardGranted,collected:this.collected.slice()
  }}
 }

 function createCoinQuestSystem(options){
  if(!options||!options.THREE||!options.scene)throw new Error("Coin quest requires THREE and scene");
  const THREE=options.THREE,scene=options.scene,config=normalizeConfig(options.config);
  const now=options.now||(()=>performance.now());
  const controller=new CoinQuestController(config,{now,onReward:options.onReward,onEvent:options.onEvent});
  const group=new THREE.Group();group.name=`coin-quest:${config.id}`;scene.add(group);
  const getPlayerPosition=options.getPlayerPosition||(()=>null);
  const assetUrl=options.assetUrl||"assets/models/quaternius-platformer-coin/Coin.gltf";
  const coins=[];let elapsed=0,destroyed=false,assetStatus="fallback",prototypeMeshCount=2;
  const loadedAssetIds=[];

  const fallbackGeometry=new THREE.CylinderGeometry(.43,.43,.14,20);
  const fallbackInsetGeometry=new THREE.TorusGeometry(.28,.055,6,20);
  const fallbackMaterial=new THREE.MeshStandardMaterial({color:0xffc928,roughness:.28,metalness:.72,emissive:0x6f3500,emissiveIntensity:.18});
  function createFallbackPrototype(){
   const root=new THREE.Group(),body=new THREE.Mesh(fallbackGeometry,fallbackMaterial),inset=new THREE.Mesh(fallbackInsetGeometry,fallbackMaterial);
   body.rotation.z=Math.PI/2;inset.rotation.y=Math.PI/2;root.add(body,inset);root.userData.coinFallback=true;return root;
  }
  let prototype=createFallbackPrototype();

  function placeVisual(coin,visual){
   if(coin.visual)coin.anchor.remove(coin.visual);
   coin.visual=visual;coin.anchor.add(visual);visual.visible=controller.phase==="active"&&!coin.collected;
  }
  for(let index=0;index<config.count;index++){
   const position=config.positions[index],anchor=new THREE.Group();
   anchor.name=`quest-coin:${index}`;anchor.position.set(position.x,position.y+config.hoverHeight,position.z);
   group.add(anchor);const coin={index,anchor,visual:null,baseY:position.y+config.hoverHeight,collected:false,phase:index*.91};
   placeVisual(coin,prototype.clone(true));coins.push(coin);
  }

  let hud=null,titleNode=null,timerNode=null,progressNode=null,statusNode=null,retryButton=null;
  if(options.hud!==false&&typeof document!=="undefined"){
   hud=document.createElement("section");hud.className="coin-quest-hud";hud.setAttribute("aria-live","polite");
   titleNode=document.createElement("div");titleNode.className="coin-quest-title";
   timerNode=document.createElement("div");timerNode.className="coin-quest-timer";
   progressNode=document.createElement("div");progressNode.className="coin-quest-progress";
   statusNode=document.createElement("div");statusNode.className="coin-quest-status";
   retryButton=document.createElement("button");retryButton.type="button";retryButton.className="coin-quest-retry";retryButton.textContent="Retry mission";retryButton.hidden=true;
   retryButton.addEventListener("click",()=>retry());hud.append(titleNode,timerNode,progressNode,statusNode,retryButton);
   (options.root||document.body).appendChild(hud);
  }
  function renderHud(){
   if(!hud)return;const state=controller.snapshot(),seconds=Math.max(0,state.remainingMs/1000);
   hud.hidden=!isHudVisiblePhase(state.phase);
   titleNode.textContent=config.title;timerNode.textContent=`${seconds.toFixed(seconds<10?1:0)}s`;
   progressNode.textContent=`${state.collectedCount} / ${state.count} coins`;
   hud.dataset.phase=state.phase;retryButton.hidden=state.phase!=="failed"||options.showRetryButton===false;
   statusNode.textContent=state.phase==="success"?`Mission complete  +$${config.reward}`:state.phase==="failed"?"Time expired":"";
  }
  function syncCoinVisibility(){for(const coin of coins){coin.collected=controller.collected[coin.index];coin.visual.visible=controller.phase==="active"&&!coin.collected}}
  function start(at){const state=controller.start(at);syncCoinVisibility();renderHud();return state}
  function retry(at){const state=controller.retry(at);syncCoinVisibility();renderHud();return state}
  function collect(index,at){const didCollect=controller.collect(index,at);if(didCollect){coins[index].collected=true;coins[index].visual.visible=false;renderHud()}return didCollect}
  function update(delta,at){
   elapsed+=Math.max(0,finite(delta,0));
   for(const coin of coins){
    coin.anchor.position.y=coin.baseY+Math.sin(elapsed*config.hoverSpeed+coin.phase)*config.hoverAmplitude;
    coin.anchor.rotation.y+=config.rotationSpeed*Math.max(0,finite(delta,0));
   }
   if(controller.phase==="active"){
    const player=getPlayerPosition();
    if(player)for(const coin of coins){
     if(coin.collected)continue;const dx=player.x-coin.anchor.position.x,dz=player.z-coin.anchor.position.z;
     const dy=(finite(player.y,coin.baseY)-coin.baseY)*.35;
     if(dx*dx+dy*dy+dz*dz<=config.collectRadius*config.collectRadius)collect(coin.index,at);
    }
    controller.update(at);if(controller.phase!=="active")syncCoinVisibility();renderHud();
   }
   return controller.snapshot();
  }

  function normalizePrototype(source){
   const bounds=new THREE.Box3().setFromObject(source),size=new THREE.Vector3(),center=new THREE.Vector3();
   bounds.getSize(size);bounds.getCenter(center);const scale=config.coinHeight/Math.max(.001,size.y);
   source.scale.multiplyScalar(scale);source.updateMatrixWorld(true);
   const scaledBounds=new THREE.Box3().setFromObject(source);scaledBounds.getCenter(center);
   source.position.x-=center.x;source.position.z-=center.z;source.position.y-=scaledBounds.min.y;
   prototypeMeshCount=0;source.traverse(object=>{if(object.isMesh){prototypeMeshCount+=1;object.castShadow=false;object.receiveShadow=false}});
   return source;
  }
  function loadAsset(){
   if(!options.loader||typeof options.loader.load!=="function")return Promise.resolve({status:"fallback",reason:"loader-unavailable"});
   assetStatus="loading";
   return new Promise(resolve=>options.loader.load(assetUrl,gltf=>{
    const loadedScene=gltf.scene||gltf.scenes&&gltf.scenes[0];
    if(destroyed){disposeObjectResources(loadedScene);return resolve({status:"discarded"})}
    try{
     prototype=normalizePrototype(loadedScene.clone(true));
     for(const coin of coins)placeVisual(coin,prototype.clone(true));
     assetStatus="ready";loadedAssetIds.push("quaternius-platformer-coin");syncCoinVisibility();resolve({status:"ready",url:assetUrl});
    }catch(error){disposeObjectResources(loadedScene);assetStatus="fallback";resolve({status:"fallback",error});}
   },undefined,error=>{assetStatus="fallback";resolve({status:"fallback",error});}));
  }
  const assetReady=loadAsset();renderHud();
  function disposeMaterial(material){
   if(!material)return;for(const value of Object.values(material))if(value&&value.isTexture)value.dispose();material.dispose();
  }
  function disposeObjectResources(object){
   if(!object||typeof object.traverse!=="function")return;
   const geometries=new Set(),materials=new Set();object.traverse(child=>{
    if(child.geometry)geometries.add(child.geometry);
    const list=Array.isArray(child.material)?child.material:[child.material];for(const material of list)if(material)materials.add(material);
   });
   geometries.forEach(geometry=>geometry.dispose());materials.forEach(disposeMaterial);
  }
  function debugSnapshot(){
   const visible=coins.reduce((sum,coin)=>sum+(coin.visual.visible?1:0),0);
   return Object.assign(controller.snapshot(),{
    assetStatus,assetUrl,loadedAssetIds:loadedAssetIds.slice(),coinPositions:coins.map(coin=>({x:coin.anchor.position.x,y:coin.anchor.position.y,z:coin.anchor.position.z,collected:coin.collected})),
    budget:{assetBytes:20862,prototypeLoads:assetStatus==="ready"?1:0,prototypeMeshCount,visibleCoinDrawEstimate:prototypeMeshCount*visible},
    renderInfo:typeof options.getRenderInfo==="function"?options.getRenderInfo():null
   });
  }
  function destroy(){
   if(destroyed)return;destroyed=true;scene.remove(group);if(hud)hud.remove();
   if(assetStatus==="ready")disposeObjectResources(prototype);
   fallbackGeometry.dispose();fallbackInsetGeometry.dispose();fallbackMaterial.dispose();
  }
  return {config,group,coins,controller,assetReady,start,retry,collect,update,destroy,subscribe:listener=>controller.subscribe(listener),debugSnapshot,debugCollect:(index,at)=>collect(index,at),debugFail:(reason,at)=>{const result=controller.fail(reason,at);syncCoinVisibility();renderHud();return result},hud};
 }

 return {DEFAULT_CONFIG,normalizeConfig,isHudVisiblePhase,CoinQuestController,createCoinQuestSystem};
});
