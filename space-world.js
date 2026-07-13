// Data-driven Space Realm built from KayKit: Space Base Bits.
(function(root,factory){
 const parser=root?.levelTemplateParser||(typeof module!=="undefined"&&module.exports?require("./level-template-parser.js"):null);
 const api=factory(parser);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.SpaceWorld=api;root.worldFactories=root.worldFactories||{};root.worldFactories.space=api.create}
})(typeof globalThis!=="undefined"?globalThis:this,function(levelParser){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__";
 const LEVEL_URL=`levels/space-80.txt?v=${BUILD_VERSION}`;
 const ASSET_ROOT="assets/models/space-base-bits/";
 const MIN_SPACING=2;
 const PLAYER_RADIUS=.32;
 const ASSET_REGISTRY=Object.freeze({
  R:{assetId:"space.rocks.cluster-a",file:"rocks_A",scale:2,footprint:[2.6,3.2],size:[2.6,.8,3.2],color:0x596174},
  Q:{assetId:"space.rocks.cluster-b",file:"rocks_B",scale:2,footprint:[3.8,3.4],size:[3.8,2.2,3.4],color:0x485063},
  L:{assetId:"space.landing-pad.large",file:"landingpad_large",scale:2.4,footprint:[6,6],size:[6,1.2,6],color:0x7f8da1},
  p:{assetId:"space.landing-pad.small",file:"landingpad_small",scale:2,footprint:[3.8,3.8],size:[3.8,1,3.8],color:0x8b98aa},
  A:{assetId:"space.lander.a",file:"lander_A",scale:2.4,footprint:[3.4,3.4],size:[3.4,2.9,3.4],color:0xe8edf2},
  B:{assetId:"space.lander.b",file:"lander_B",scale:2.4,footprint:[3.4,3.4],size:[3.4,2.7,3.4],color:0xdde5ec},
  D:{assetId:"space.mining.drill",file:"drill_structure",scale:2,footprint:[3.6,3.6],size:[3.6,5.8,3.6],color:0xe09a45},
  S:{assetId:"space.power.solar-panel",file:"solarpanel",scale:2,footprint:[1.8,.8],size:[1.8,.8,.8],color:0x516c9b},
  W:{assetId:"space.power.wind-turbine",file:"windturbine_low",scale:2,footprint:[2.2,2.6],size:[2.2,2.4,2.6],color:0xe7edf1},
  T:{assetId:"space.vehicle.truck",file:"spacetruck",scale:2.5,footprint:[1.3,2.3],size:[1.3,1.5,2.3],color:0xe4a044},
  t:{assetId:"space.vehicle.trailer",file:"spacetruck_trailer",scale:2.5,footprint:[1.3,2.5],size:[1.3,.8,2.5],color:0xc77b3a},
  C:{assetId:"space.cargo.stack-a",file:"cargo_A_stacked",scale:2,footprint:[2,2],size:[2,2,2],color:0xa86f4d},
  c:{assetId:"space.cargo.pack-b",file:"cargo_B_packed",scale:2,footprint:[1,1],size:[1,1,1],color:0xb98255},
  N:{assetId:"space.container.a",file:"containers_A",scale:2,footprint:[1,1],size:[1,.5,1],color:0xbfc9d1},
  n:{assetId:"space.container.c",file:"containers_C",scale:2,footprint:[1,1],size:[1,.5,1],color:0x91a3b2},
  I:{assetId:"space.light.cluster",file:"lights",scale:1.5,footprint:[1.1,1.1],size:[1.1,1.5,1.1],color:0x78efff}
 });
 const ALIEN_SPEC=Object.freeze({assetId:"space.npc.alien",footprint:[1.4,1.4]});
 const WALKABLE=new Set([".","X"]);

 function parseLevel(text){
  if(!levelParser?.parse)throw new Error("Space level parser is unavailable");
  const level=levelParser.parse(text),known=new Set([...Object.keys(ASSET_REGISTRY),"a",...WALKABLE]);
  const unknown=new Set(level.map.join("").split("").filter(symbol=>!known.has(symbol)));
  if(unknown.size)throw new Error(`Unknown space level symbols: ${[...unknown].join(",")}`);
  const spawnSymbols=[];level.map.forEach((row,r)=>[...row].forEach((symbol,c)=>{if(symbol==="X")spawnSymbols.push([c,r])}));
  if(spawnSymbols.length!==1||spawnSymbols[0][0]!==level.spawnCol||spawnSymbols[0][1]!==level.spawnRow)throw new Error("Space level spawn metadata must point to its single X symbol");
  validateSpacing(level);
  return level;
 }
 function cellCenter(level,col,row){return {x:-level.width/2+(col+.5)*level.cell,z:-level.depth/2+(row+.5)*level.cell}}
 function placementsFromLevel(level){
  const placements=[];level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{
   const spec=ASSET_REGISTRY[symbol]||(symbol==="a"?ALIEN_SPEC:null);if(spec)placements.push({symbol,col,row,...cellCenter(level,col,row),spec});
  }));return placements;
 }
 function footprintDistance(a,b){
  const dx=Math.max(0,Math.abs(a.x-b.x)-(a.spec.footprint[0]+b.spec.footprint[0])/2);
  const dz=Math.max(0,Math.abs(a.z-b.z)-(a.spec.footprint[1]+b.spec.footprint[1])/2);
  return Math.hypot(dx,dz);
 }
 function spacingReport(level){
  const placements=placementsFromLevel(level);let minimum=Infinity,pair=null;
  for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){
   const distance=footprintDistance(placements[i],placements[j]);if(distance<minimum){minimum=distance;pair=[placements[i],placements[j]]}
  }
  return {minimum:Number.isFinite(minimum)?minimum:Infinity,pair,count:placements.length};
 }
 function validateSpacing(level){
  const report=spacingReport(level);if(report.minimum+1e-6<MIN_SPACING){const [a,b]=report.pair;throw new Error(`Space placements ${a.symbol}@${a.col},${a.row} and ${b.symbol}@${b.col},${b.row} are only ${report.minimum.toFixed(2)} units apart`)}
  return report;
 }
 function loadLevel(fetchImpl=globalThis.fetch){
  if(typeof fetchImpl!=="function")return Promise.reject(new Error("Space layout requires fetch"));
  return fetchImpl(LEVEL_URL).then(response=>{if(!response.ok)throw new Error(`Space level request failed (${response.status})`);return response.text()}).then(parseLevel);
 }
 function loadGLTF(loader,url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject))}
 async function loadAssets(Loader=globalThis.ThreeGLTFLoader?.GLTFLoader){
  if(!Loader)return {prototypes:new Map(),loadedAssetIds:[],errors:["Space GLTF loader is unavailable"],texture:null};
  const loader=new Loader(),prototypes=new Map(),errors=[];
  await Promise.all(Object.entries(ASSET_REGISTRY).map(async([symbol,spec])=>{
   try{const gltf=await loadGLTF(loader,`${ASSET_ROOT}${spec.file}.gltf?v=${BUILD_VERSION}`);prototypes.set(symbol,gltf.scene)}
   catch(error){errors.push(`${spec.file}: ${error?.message||error}`)}
  }));
  let sharedTexture=null;
  for(const prototype of prototypes.values())prototype.traverse(object=>{
   if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];
   materials.filter(Boolean).forEach(material=>{if(!material.map)return;if(!sharedTexture)sharedTexture=material.map;else if(material.map!==sharedTexture){material.map.dispose?.();material.map=sharedTexture;material.needsUpdate=true}});
  });
  return {prototypes,loadedAssetIds:[...prototypes.keys()].map(symbol=>ASSET_REGISTRY[symbol].assetId),errors,texture:sharedTexture};
 }
 function placeholder(THREE,spec){
  const geometry=new THREE.BoxGeometry(...spec.size),material=new THREE.MeshStandardMaterial({color:spec.color,roughness:.82});
  const mesh=new THREE.Mesh(geometry,material);mesh.position.y=spec.size[1]/2;mesh.userData.placeholder=true;return mesh;
 }
 function alienFallback(THREE){
  const group=new THREE.Group(),bodyMaterial=new THREE.MeshStandardMaterial({color:0x72e38c,roughness:.8}),darkMaterial=new THREE.MeshStandardMaterial({color:0x172232,roughness:.7});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.78,1.05,.5),bodyMaterial);body.position.y=1.1;group.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.5,10,8),bodyMaterial);head.scale.set(.85,.9,.8);head.position.y=1.95;group.add(head);
  [-.16,.16].forEach(x=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),darkMaterial);eye.scale.set(.12,.18,.08);eye.position.set(x,2.04,.4);group.add(eye)});
  group.userData.placeholder=true;return group;
 }
 function disposeResources(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(object=>{
   if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.filter(Boolean).forEach(material=>{materials.add(material);Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value)})});
  });textures.forEach(texture=>texture.dispose?.());materials.forEach(material=>material.dispose?.());geometries.forEach(geometry=>geometry.dispose?.());
  return {geometries:geometries.size,materials:materials.size,textures:textures.size};
 }
 function create(THREE){
  const group=new THREE.Group();group.name="space-world";group.userData={destination:"space",layout:{url:LEVEL_URL,status:"loading"},assets:{source:"KayKit: Space Base Bits",license:"CC0-1.0",status:"loading",loadedAssetIds:[],errors:[]},npcs:{aliens:0,nonAliens:0}};
  const collisionBoxes=[];let disposed=false,level=null,spacing=null;
  const debugPoses=Object.freeze({
   spawn:{x:2,z:34,angle:.25,height:15,distance:22},
   overview:{x:0,z:0,angle:.38,height:38,distance:48},
   landing:{x:-14,z:-22,angle:.32,height:13,distance:19},
   cargo:{x:-4,z:16,angle:.28,height:11,distance:16},
   aliens:{x:-14,z:30,angle:.45,height:4.8,distance:6.5,hidePlayer:true}
  });
  const world={group,bounds:{minX:-39.6,maxX:39.6,minZ:-39.6,maxZ:39.6},spawn:{x:2,z:34},camera:{angle:.25,height:15,distance:22},debugPoses,background:0x090b24,name:"Starfall Spaceport",
   canWalk(x,z){if(x<world.bounds.minX||x>world.bounds.maxX||z<world.bounds.minZ||z>world.bounds.maxZ)return false;return !collisionBoxes.some(box=>Math.abs(x-box.x)<box.halfX+PLAYER_RADIUS&&Math.abs(z-box.z)<box.halfZ+PLAYER_RADIUS)},
   debug(){return {layout:group.userData.layout,assets:group.userData.assets,npcs:group.userData.npcs,placements:collisionBoxes.length,minimumSpacing:spacing?.minimum??null,spawn:world.spawn}},
   dispose(){disposed=true;group.parent?.remove(group);disposeResources(group)}
  };
  world.ready=Promise.all([loadLevel(),loadAssets(),globalThis.QuaterniusAlienAsset?.load?.(THREE).catch(error=>({error}))||Promise.resolve(null)]).then(([loadedLevel,assets,alienAsset])=>{
   if(disposed)return world;level=loadedLevel;spacing=validateSpacing(level);world.name=level.name||world.name;world.bounds={minX:-level.width/2+PLAYER_RADIUS,maxX:level.width/2-PLAYER_RADIUS,minZ:-level.depth/2+PLAYER_RADIUS,maxZ:level.depth/2-PLAYER_RADIUS};world.spawn=cellCenter(level,level.spawnCol,level.spawnRow);
   const floor=new THREE.Mesh(new THREE.BoxGeometry(level.width,.3,level.depth),new THREE.MeshStandardMaterial({color:0x322d59,roughness:.94}));floor.position.y=-.15;floor.receiveShadow=true;floor.userData.assetId="space.terrain.floor";group.add(floor);
   let aliens=0;
   for(const placement of placementsFromLevel(level)){
    let object;
    if(placement.symbol==="a"){
     aliens++;object=alienFallback(THREE);
     if(alienAsset&&!alienAsset.error){object.clear();const model=new THREE.Mesh(alienAsset.geometry,alienAsset.material);const scale=.9;model.scale.setScalar(scale);model.position.y=globalThis.QuaterniusAlienAsset.groundedY(alienAsset.bounds,scale,0);model.userData.placeholder=false;object.add(model);object.userData.placeholder=false}
    }else{
     const prototype=assets.prototypes.get(placement.symbol);object=prototype?prototype.clone(true):placeholder(THREE,placement.spec);object.scale.setScalar(prototype?placement.spec.scale:1);
    }
    object.position.x=placement.x;object.position.z=placement.z;object.name=placement.spec.assetId;object.userData.assetId=placement.spec.assetId;object.userData.level={symbol:placement.symbol,col:placement.col,row:placement.row};
    object.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=true}});group.add(object);
    collisionBoxes.push({x:placement.x,z:placement.z,halfX:placement.spec.footprint[0]/2,halfZ:placement.spec.footprint[1]/2,assetId:placement.spec.assetId});
   }
   group.userData.layout={url:LEVEL_URL,status:"ready",size:`${level.width}x${level.depth}`,cell:level.cell,minimumSpacing:spacing.minimum};
   group.userData.assets={source:"KayKit: Space Base Bits",license:"CC0-1.0",status:assets.errors.length?(assets.loadedAssetIds.length?"partial":"fallback"):"ready",loadedAssetIds:assets.loadedAssetIds,errors:assets.errors};
   group.userData.npcs={aliens,nonAliens:0,alienAsset:alienAsset?.error?"fallback":"ready"};return world;
  }).catch(error=>{group.userData.layout.status="error";group.userData.layout.error=String(error?.message||error);throw error});
  return world;
 }
 return {LEVEL_URL,ASSET_ROOT,ASSET_REGISTRY,ALIEN_SPEC,MIN_SPACING,PLAYER_RADIUS,WALKABLE,parseLevel,cellCenter,placementsFromLevel,footprintDistance,spacingReport,validateSpacing,loadLevel,loadAssets,disposeResources,create};
});
