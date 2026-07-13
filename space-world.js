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
 const BACKGROUND_STAR_COUNT=700;
 const ROAD_SYMBOLS=new Set(["r","X","U"]);
 const ASSET_REGISTRY=Object.freeze({
  R:{assetId:"space.rocks.cluster-a",file:"rocks_A",scale:2,footprint:[2.6,3.2],size:[2.6,.8,3.2],color:0x596174},
  Q:{assetId:"space.rocks.cluster-b",file:"rocks_B",scale:2,footprint:[3.8,3.4],size:[3.8,2.2,3.4],color:0x485063},
  F:{assetId:"space.rock.a",file:"rock_A",scale:3,footprint:[1.6,1.5],size:[1.6,.8,1.5],color:0x687184},
  G:{assetId:"space.rock.b",file:"rock_B",scale:3,footprint:[2.1,2.4],size:[2.1,1.2,2.4],color:0x505a6e},
  L:{assetId:"space.landing-pad.large",file:"landingpad_large",scale:4,footprint:[10,10],size:[10,2,10],color:0x7f8da1},
  p:{assetId:"space.landing-pad.small",file:"landingpad_small",scale:3.5,footprint:[6.7,6.7],size:[6.7,1.8,6.7],color:0x8b98aa},
  A:{assetId:"space.lander.a",file:"lander_A",scale:6,footprint:[8.5,8.5],size:[8.5,7.2,8.5],color:0xe8edf2},
  B:{assetId:"space.lander.b",file:"lander_B",scale:6,footprint:[8.5,8.5],size:[8.5,6.6,8.5],color:0xdde5ec},
  E:{assetId:"space.lander.base",file:"lander_base",scale:4,footprint:[5.4,5.4],size:[5.4,2,5.4],color:0x8492a5,collidable:false},
  D:{assetId:"space.mining.drill",file:"drill_structure",scale:2,footprint:[3.6,3.6],size:[3.6,5.8,3.6],color:0xe09a45},
  M:{assetId:"space.mining.terrain",file:"terrain_mining",scale:3,footprint:[6,6],size:[6,6.2,6],color:0xb76d3a},
  S:{assetId:"space.power.solar-panel",file:"solarpanel",scale:2,footprint:[1.8,.8],size:[1.8,.8,.8],color:0x516c9b},
  H:{assetId:"space.power.solar-hub",file:"roofmodule_solarpanels",scale:3,footprint:[4.2,4.2],size:[4.2,1.7,4.2],color:0x536d9e},
  W:{assetId:"space.power.wind-turbine",file:"windturbine_low",scale:2,footprint:[2.2,2.6],size:[2.2,2.4,2.6],color:0xe7edf1},
  Y:{assetId:"space.power.wind-turbine-tall",file:"windturbine_tall",scale:2.5,footprint:[4.2,2.5],size:[4.2,5.6,2.5],color:0xf0f3f5},
  T:{assetId:"space.vehicle.truck",file:"spacetruck",scale:2.5,footprint:[1.3,2.3],size:[1.3,1.5,2.3],color:0xe4a044},
  t:{assetId:"space.vehicle.trailer",file:"spacetruck_trailer",scale:2.5,footprint:[1.3,2.5],size:[1.3,.8,2.5],color:0xc77b3a},
  V:{assetId:"space.vehicle.truck-large",file:"spacetruck_large",scale:3.5,footprint:[1.8,3.6],size:[1.8,2.4,3.6],color:0xe2a248},
  C:{assetId:"space.cargo.stack-a",file:"cargo_A_stacked",scale:2,footprint:[2,2],size:[2,2,2],color:0xa86f4d},
  c:{assetId:"space.cargo.pack-b",file:"cargo_B_packed",scale:2,footprint:[1,1],size:[1,1,1],color:0xb98255},
  N:{assetId:"space.container.a",file:"containers_A",scale:2,footprint:[1,1],size:[1,.5,1],color:0xbfc9d1},
  n:{assetId:"space.container.c",file:"containers_C",scale:2,footprint:[1,1],size:[1,.5,1],color:0x91a3b2},
  I:{assetId:"space.light.cluster",file:"lights",scale:1.5,footprint:[1.1,1.1],size:[1.1,1.5,1.1],color:0x78efff},
  J:{assetId:"space.utility.structure-low",file:"structure_low",scale:3,footprint:[5.3,5.3],size:[5.3,3,5.3],color:0x9ba8b8},
  K:{assetId:"space.utility.structure-tall",file:"structure_tall",scale:3,footprint:[5.3,5.3],size:[5.3,6,5.3],color:0xaab5c2},
  U:{assetId:"space.road.tunnel",file:"tunnel_straight_A",scale:3,footprint:[6,2.8],size:[6,1.8,2.8],color:0x77869a,collidable:false}
 });
 const ALIEN_SPEC=Object.freeze({assetId:"space.npc.alien.cc0",footprint:[1.5,1.5]});
 const WALKABLE=new Set([".","r","X"]);

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
 function buildAlienShadows(THREE,placements,parent){
  const geometry=new THREE.CircleGeometry(.68,16);geometry.rotateX(-Math.PI/2);
  const material=new THREE.MeshBasicMaterial({color:0x080b18,transparent:true,opacity:.34,depthWrite:false});
  const shadows=new THREE.InstancedMesh(geometry,material,placements.length),matrix=new THREE.Matrix4();
  shadows.name="space-alien-contact-shadows";shadows.userData={assetId:"space.npc.alien.contact-shadow",instanceCount:placements.length};shadows.renderOrder=2;
  placements.forEach((placement,index)=>{matrix.makeTranslation(placement.x,.012,placement.z);shadows.setMatrixAt(index,matrix)});shadows.instanceMatrix.needsUpdate=true;parent.add(shadows);
  return {instances:placements.length,drawCalls:1};
 }
 function roadCells(level){
  const cells=[];level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(ROAD_SYMBOLS.has(symbol))cells.push({symbol,col,row,...cellCenter(level,col,row)})}));return cells;
 }
 function buildRoads(THREE,level,parent){
  const cells=roadCells(level),roadSet=new Set(cells.map(cell=>`${cell.col},${cell.row}`)),matrix=new THREE.Matrix4();
  const tileGeometry=new THREE.BoxGeometry(level.cell*.96,.08,level.cell*.96),tileMaterial=new THREE.MeshStandardMaterial({color:0x1b2b45,emissive:0x071326,emissiveIntensity:.8,roughness:.78,metalness:.18});
  const tiles=new THREE.InstancedMesh(tileGeometry,tileMaterial,cells.length);tiles.name="space-roads";tiles.userData={assetId:"space.road.tile",instanceCount:cells.length};
  cells.forEach((cell,index)=>{matrix.makeTranslation(cell.x,.025,cell.z);tiles.setMatrixAt(index,matrix)});tiles.instanceMatrix.needsUpdate=true;tiles.receiveShadow=true;parent.add(tiles);
  const dashGeometry=new THREE.BoxGeometry(1,1,1),dashMaterial=new THREE.MeshBasicMaterial({color:0x74efff}),dashes=new THREE.InstancedMesh(dashGeometry,dashMaterial,cells.length),dummy=new THREE.Object3D();
  dashes.name="space-road-markings";dashes.userData={assetId:"space.road.marking",instanceCount:cells.length};
  cells.forEach((cell,index)=>{const horizontal=roadSet.has(`${cell.col-1},${cell.row}`)||roadSet.has(`${cell.col+1},${cell.row}`),vertical=roadSet.has(`${cell.col},${cell.row-1}`)||roadSet.has(`${cell.col},${cell.row+1}`);dummy.position.set(cell.x,.085,cell.z);dummy.rotation.set(0,vertical&&!horizontal?Math.PI/2:0,0);dummy.scale.set(2.1,.025,.11);dummy.updateMatrix();dashes.setMatrixAt(index,dummy.matrix)});
  dashes.instanceMatrix.needsUpdate=true;parent.add(dashes);return {tiles:cells.length,drawCalls:2};
 }
 function buildSpaceBackdrop(THREE,seed=92817){
  const backdrop=new THREE.Group();backdrop.name="space-backdrop";let state=seed>>>0;const random=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296};
  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,depthTest:false,uniforms:{zenith:{value:new THREE.Color(0x14124f)},horizon:{value:new THREE.Color(0x3d2a7e)}},vertexShader:"varying float vY;void main(){vY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:"uniform vec3 zenith;uniform vec3 horizon;varying float vY;void main(){float blend=smoothstep(-0.25,0.8,vY);gl_FragColor=vec4(mix(horizon,zenith,blend),1.0);}"});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(150,20,14),skyMaterial);sky.name="space-sky-gradient";sky.frustumCulled=false;sky.renderOrder=-100;backdrop.add(sky);
  const positions=new Float32Array(BACKGROUND_STAR_COUNT*3),colors=new Float32Array(BACKGROUND_STAR_COUNT*3),starColor=new THREE.Color();
  for(let i=0;i<BACKGROUND_STAR_COUNT;i++){const theta=random()*Math.PI*2,u=random()*2-1,radius=92+random()*46,flat=Math.sqrt(1-u*u);positions[i*3]=Math.cos(theta)*flat*radius;positions[i*3+1]=u*radius;positions[i*3+2]=Math.sin(theta)*flat*radius;starColor.setHex(i%11===0?0x8fefff:i%7===0?0xffc98d:0xffffff);starColor.toArray(colors,i*3)}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));starGeometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({size:1.6,vertexColors:true,transparent:true,opacity:.98,depthWrite:false,depthTest:true}));stars.name="space-starfield";stars.frustumCulled=false;stars.renderOrder=-90;backdrop.add(stars);
  const planet=new THREE.Mesh(new THREE.SphereGeometry(6.5,24,16),new THREE.MeshBasicMaterial({color:0x7666d7,depthWrite:false,depthTest:false}));planet.position.set(-18,28,-70);planet.renderOrder=-80;planet.name="space-distant-planet";backdrop.add(planet);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(9.5,.75,7,48),new THREE.MeshBasicMaterial({color:0x9edcff,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false,depthTest:false}));ring.position.copy(planet.position);ring.rotation.set(1.12,.2,.15);ring.renderOrder=-79;backdrop.add(ring);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(2.5,18,12),new THREE.MeshBasicMaterial({color:0xf2b66d,depthWrite:false,depthTest:false}));moon.position.set(20,22,-75);moon.renderOrder=-80;backdrop.add(moon);
  backdrop.userData={assetId:"space.background",stars:BACKGROUND_STAR_COUNT,planets:2,drawCalls:5};return backdrop;
 }
 function disposeResources(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(object=>{
   if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.filter(Boolean).forEach(material=>{materials.add(material);Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value)})});
  });textures.forEach(texture=>texture.dispose?.());materials.forEach(material=>material.dispose?.());geometries.forEach(geometry=>geometry.dispose?.());
  return {geometries:geometries.size,materials:materials.size,textures:textures.size};
 }
 function create(THREE){
  const group=new THREE.Group();group.name="space-world";group.userData={destination:"space",layout:{url:LEVEL_URL,status:"loading"},assets:{source:"KayKit: Space Base Bits",license:"CC0-1.0",status:"loading",loadedAssetIds:[],errors:[]},npcs:{aliens:0,nonAliens:0}};
  const collisionBoxes=[],alienMixers=[],alienGrounding=[],alienObjects=[],placementObjects=[];let disposed=false,level=null,spacing=null,roadInfo={tiles:0,drawCalls:0},alienShadowInfo={instances:0,drawCalls:0};
  const debugPoses=Object.freeze({
   spawn:{x:2,z:34,angle:.25,height:15,distance:22},
   overview:{x:0,z:0,angle:.38,height:42,distance:52},
   landing:{x:-20.9,z:-14,angle:.15,height:11,distance:17},
   roads:{x:0,z:4,angle:.18,height:17,distance:25},
   cargo:{x:12,z:18,angle:.28,height:11,distance:16},
   aliens:{x:-14,z:-2,angle:.45,height:4.8,distance:6.5,hidePlayer:true},
   alienExtraSmall:{x:-14,z:-2,angle:.32,height:3.4,distance:4.8,hidePlayer:true},
   alienSmall:{x:22,z:-2,angle:-.28,height:3.6,distance:5.1,hidePlayer:true},
   quest:{x:-14,z:2,angle:.2,height:6.2,distance:8.5},
   questCoins:{x:-2,z:1,angle:.34,height:18,distance:23}
  });
  const world={group,bounds:{minX:-39.6,maxX:39.6,minZ:-39.6,maxZ:39.6},spawn:{x:2,z:34},camera:{angle:.25,height:15,distance:22},debugPoses,background:0x020316,name:"Starfall Spaceport",aliens:alienObjects,placementObjects,
   findObject(assetId){return placementObjects.find(entry=>entry.object.userData.assetId===assetId)?.object||null},
   canWalk(x,z){if(x<world.bounds.minX||x>world.bounds.maxX||z<world.bounds.minZ||z>world.bounds.maxZ)return false;return !collisionBoxes.some(box=>Math.abs(x-box.x)<box.halfX+PLAYER_RADIUS&&Math.abs(z-box.z)<box.halfZ+PLAYER_RADIUS)},
   update(dt,isActive=true){if(isActive)alienMixers.forEach(mixer=>mixer.update(dt))},
   debug(){return {layout:group.userData.layout,assets:group.userData.assets,npcs:group.userData.npcs,alienGrounding,alienShadows:alienShadowInfo,placements:placementsFromLevel(level||{map:[]}).length,collisionBoxes:collisionBoxes.length,minimumSpacing:spacing?.minimum??null,roads:roadInfo,background:{stars:BACKGROUND_STAR_COUNT,planets:2},spawn:world.spawn}},
   dispose(){disposed=true;alienMixers.forEach(mixer=>mixer.stopAllAction());group.parent?.remove(group);disposeResources(group)}
  };
  world.ready=Promise.all([loadLevel(),loadAssets(),globalThis.QuaterniusAlienAsset?.load?.(THREE).catch(error=>({variants:[],loadedAssetIds:[],errors:[String(error?.message||error)]}))||Promise.resolve({variants:[],loadedAssetIds:[],errors:["Alien asset runtime is unavailable"]})]).then(([loadedLevel,assets,alienAssets])=>{
   if(disposed)return world;level=loadedLevel;spacing=validateSpacing(level);world.name=level.name||world.name;world.bounds={minX:-level.width/2+PLAYER_RADIUS,maxX:level.width/2-PLAYER_RADIUS,minZ:-level.depth/2+PLAYER_RADIUS,maxZ:level.depth/2-PLAYER_RADIUS};world.spawn=cellCenter(level,level.spawnCol,level.spawnRow);
   group.add(buildSpaceBackdrop(THREE,Number(level.seed)||92817));
   const floor=new THREE.Mesh(new THREE.BoxGeometry(level.width,.3,level.depth),new THREE.MeshStandardMaterial({color:0x2b2851,roughness:.94}));floor.position.y=-.15;floor.receiveShadow=true;floor.userData.assetId="space.terrain.floor";group.add(floor);roadInfo=buildRoads(THREE,level,group);
   const placements=placementsFromLevel(level);alienShadowInfo=buildAlienShadows(THREE,placements.filter(placement=>placement.symbol==="a"),group);
   let aliens=0;
   for(const placement of placements){
    let object;
    if(placement.symbol==="a"){
     aliens++;object=alienFallback(THREE);
     const asset=alienAssets.variants[(aliens-1)%alienAssets.variants.length];
     if(asset){
      const instance=globalThis.QuaterniusAlienAsset.createInstance(THREE,asset,aliens-1,0);object=instance.model;object.userData.placeholder=false;
      if(instance.mixer)alienMixers.push(instance.mixer);
      alienGrounding.push({assetId:asset.spec.id,animation:instance.clipName,x:placement.x,z:placement.z,bottomY:+instance.bounds.min.y.toFixed(4),groundError:+instance.groundError.toFixed(4),groundClearance:+instance.groundClearance.toFixed(4),grounding:instance.grounding});
     }else alienGrounding.push({assetId:"fallback",animation:null,x:placement.x,z:placement.z,bottomY:0,groundError:0});
    }else{
     const prototype=assets.prototypes.get(placement.symbol);object=prototype?prototype.clone(true):placeholder(THREE,placement.spec);object.scale.setScalar(prototype?placement.spec.scale:1);
    }
    object.position.x=placement.x;object.position.z=placement.z;object.name=object.userData.assetId||placement.spec.assetId;object.userData.assetId=object.userData.assetId||placement.spec.assetId;object.userData.level={symbol:placement.symbol,col:placement.col,row:placement.row};
    object.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=true}});group.add(object);
    placementObjects.push({object,placement});if(placement.symbol==="a")alienObjects.push(object);
    if(placement.spec.collidable!==false)collisionBoxes.push({x:placement.x,z:placement.z,halfX:placement.spec.footprint[0]/2,halfZ:placement.spec.footprint[1]/2,assetId:placement.spec.assetId});
   }
   group.userData.layout={url:LEVEL_URL,status:"ready",size:`${level.width}x${level.depth}`,cell:level.cell,minimumSpacing:spacing.minimum,roadTiles:roadInfo.tiles};
   const allErrors=[...assets.errors,...alienAssets.errors],loadedAssetIds=[...assets.loadedAssetIds,...alienAssets.loadedAssetIds];
   group.userData.assets={source:"KayKit: Space Base Bits + Quaternius Ultimate Space Kit",license:"CC0-1.0",status:allErrors.length?(loadedAssetIds.length?"partial":"fallback"):"ready",loadedAssetIds,errors:allErrors};
   group.userData.npcs={aliens,nonAliens:0,alienAsset:alienAssets.variants.length?"ready":"fallback",alienModels:alienAssets.loadedAssetIds,idleAnimations:[...new Set(alienGrounding.map(item=>item.animation).filter(Boolean))],grounded:alienGrounding.every(item=>Math.abs(item.groundError)<.01)};return world;
  }).catch(error=>{group.userData.layout.status="error";group.userData.layout.error=String(error?.message||error);throw error});
  return world;
 }
 return {LEVEL_URL,ASSET_ROOT,ASSET_REGISTRY,ALIEN_SPEC,MIN_SPACING,PLAYER_RADIUS,BACKGROUND_STAR_COUNT,ROAD_SYMBOLS,WALKABLE,parseLevel,cellCenter,placementsFromLevel,roadCells,footprintDistance,spacingReport,validateSpacing,loadLevel,loadAssets,buildRoads,buildAlienShadows,buildSpaceBackdrop,disposeResources,create};
});
