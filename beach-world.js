// Lazy, asset-backed beach destination using audited CC0 packs and Three.js Water.
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.BeachWorld=api;root.worldFactories=root.worldFactories||{};root.worldFactories.beach=api.create}
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__",PLAYER_RADIUS=.36;
 const CONFIG=Object.freeze({halfWidth:40,nearZ:40,farZ:-40,waterEdgeZ:-5.5,deepWaterZ:-25,spawn:{x:0,z:15},camera:{angle:.22,height:10.5,distance:15.5}});
 const CITY_FILES=Object.freeze(["building_A","building_C","building_E","building_G","road_straight","road_straight_crossing","bench","streetlight","car_hatchback","car_taxi"]);
 const NATURE_ROOT="assets/models/beach-nature/";
 const NATURE_FILES=Object.freeze(["tree_palm","tree_palmBend","tree_palmDetailedTall","rock_smallA","rock_smallB"]);
 const NPC_SPECS=Object.freeze([
  {id:"marina",file:"mini-skate/character-skate-girl.glb",x:-6,z:5,turn:2.8,height:2.55},
  {id:"kai",file:"mini-skate/character-skate-boy.glb",x:12,z:5,turn:-2.8,height:2.55},
  {id:"sol",file:"mini-characters/character-female-a.glb",x:-18,z:8,turn:2.6,height:2.6},
  {id:"tala",file:"mini-characters/character-female-c.glb",x:1,z:10,turn:2.9,height:2.6},
  {id:"milo",file:"mini-characters/character-male-b.glb",x:18,z:8,turn:-2.6,height:2.6}
 ]);
 const DEBUG_POSES=Object.freeze({
  spawn:{name:"beach-spawn",x:0,z:15,angle:.22,height:10.5,distance:15.5},
  overview:{name:"beach-overview",x:0,z:5,angle:.18,height:34,distance:46,hidePlayer:true},
  waterShore:{name:"beach-water-shore",x:0,z:-4.7,angle:.08,height:7,distance:12},
  waterWading:{name:"beach-water-wading",x:0,z:-11,angle:.12,height:6.5,distance:10},
  cafeFront:{name:"beach-cafe-front",x:-14,z:17,angle:Math.PI,height:8,distance:13},
  surfShopFront:{name:"beach-surf-shop-front",x:14,z:17,angle:Math.PI,height:8,distance:13},
  townRoad:{name:"beach-town-road",x:0,z:24,angle:0,height:9,distance:18},
  townBuildings:{name:"beach-town-buildings",x:0,z:40,angle:Math.PI,height:12,distance:24,hidePlayer:true},
  npcGroup:{name:"beach-npc-group",x:0,z:10,angle:Math.PI,height:12,distance:24,hidePlayer:true},
  tokenDash:{name:"beach-token-dash",x:-3,z:5,angle:Math.PI,height:10,distance:18},
  tokenDashConversation:{name:"beach-token-dash-conversation",x:-5.2,z:7.6,angle:2.8,height:6.2,distance:9},
  npcMarina:{name:"beach-npc-marina-full-body",x:-6,z:5,angle:Math.PI,height:4.2,distance:7,hidePlayer:true},
  npcKai:{name:"beach-npc-kai-full-body",x:12,z:5,angle:Math.PI,height:4.2,distance:7,hidePlayer:true},
  npcSol:{name:"beach-npc-sol-full-body",x:-18,z:8,angle:Math.PI,height:4.2,distance:7,hidePlayer:true},
  npcTala:{name:"beach-npc-tala-full-body",x:1,z:10,angle:Math.PI,height:4.2,distance:7,hidePlayer:true},
  npcMilo:{name:"beach-npc-milo-full-body",x:18,z:8,angle:Math.PI,height:4.2,distance:7,hidePlayer:true}
 });

 function loadGLTF(loader,url){return new Promise((resolve,reject)=>loader.load(`${url}?v=${BUILD_VERSION}`,resolve,undefined,reject))}
 function loadTexture(THREE,url){return new Promise((resolve,reject)=>new THREE.TextureLoader().load(`${url}?v=${BUILD_VERSION}`,resolve,undefined,reject))}
 function normalizeObject(THREE,object,targetHeight){
  object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());
  const scale=targetHeight/Math.max(size.y,.001);object.scale.setScalar(scale);object.updateMatrixWorld(true);
  const scaledBox=new THREE.Box3().setFromObject(object);object.position.y-=scaledBox.min.y;return{scale,sourceHeight:size.y};
 }
 function markMeshes(object){object.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false}});return object}
 function rectangle(id,x,z,halfX,halfZ){return{id,minX:x-halfX,maxX:x+halfX,minZ:z-halfZ,maxZ:z+halfZ}}
 function fallbackBuilding(THREE,id,color,height){const mesh=new THREE.Mesh(new THREE.BoxGeometry(8,height,8),new THREE.MeshLambertMaterial({color}));mesh.position.y=height/2;mesh.userData={assetId:id,placeholder:true};return mesh}

 function create(THREE){
  const group=new THREE.Group();group.name="beach-world";
  const collisions=[],mixers=[],npcRoots=[],npcById=new Map(),loadedAssetIds=[],errors=[];
  let traffic=null,water=null,waterNormals=null,disposed=false,active=false;
  group.userData={destination:"beach",assets:{status:"loading",loadedAssetIds,errors},water:{status:"fallback",implementation:"MeshPhongMaterial"},npcs:{count:NPC_SPECS.length,animated:0,actors:[]}};

  const skyGeometry=new THREE.SphereGeometry(95,24,12),skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:"varying float vSkyY;void main(){vSkyY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:"varying float vSkyY;void main(){float h=smoothstep(-0.12,0.72,vSkyY);gl_FragColor=vec4(mix(vec3(0.72,0.91,1.0),vec3(0.20,0.59,0.88),h),1.0);}"}),sky=new THREE.Mesh(skyGeometry,skyMaterial);
  sky.name="beach-gradient-sky";sky.renderOrder=-1000;sky.frustumCulled=false;sky.userData={assetId:"beach.procedural-gradient-sky",drawCalls:1};group.add(sky);

  const sandMaterial=new THREE.MeshLambertMaterial({color:0xf2d38d}),sand=new THREE.Mesh(new THREE.BoxGeometry(80,.28,45.5),sandMaterial);
  sand.position.set(0,-.08,17.25);sand.receiveShadow=false;sand.name="beach-sand";group.add(sand);
  const fallbackWaterMaterial=new THREE.MeshPhongMaterial({color:0x168fa7,specular:0xb8f4ff,shininess:70,transparent:true,opacity:.9}),fallbackWater=new THREE.Mesh(new THREE.PlaneGeometry(80,34.5,16,8),fallbackWaterMaterial);
  fallbackWater.rotation.x=-Math.PI/2;fallbackWater.position.set(0,.04,-22.75);fallbackWater.name="beach-water-fallback";group.add(fallbackWater);
  const foamMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",fragmentShader:"varying vec2 vUv;void main(){float feather=sin(3.14159265*vUv.y);float broken=.78+.22*sin(vUv.x*53.0+sin(vUv.x*17.0)*2.0);gl_FragColor=vec4(0.91,1.0,1.0,.62*pow(max(feather,0.0),.7)*broken);}"});
  const foamPositions=[],foamUvs=[],foamIndices=[],foamSegments=48;
  for(let i=0;i<=foamSegments;i++){const t=i/foamSegments,x=-39+t*78,wave=Math.sin(t*19)*.12+Math.sin(t*43)*.045,z=-5.82+wave;foamPositions.push(x,.075,z,x,.075,z-.5-Math.sin(t*31)*.08);foamUvs.push(t,0,t,1);if(i<foamSegments){const n=i*2;foamIndices.push(n,n+1,n+2,n+1,n+3,n+2)}}
  const foamGeometry=new THREE.BufferGeometry();foamGeometry.setAttribute("position",new THREE.Float32BufferAttribute(foamPositions,3));foamGeometry.setAttribute("uv",new THREE.Float32BufferAttribute(foamUvs,2));foamGeometry.setIndex(foamIndices);foamGeometry.computeBoundingBox();foamGeometry.computeBoundingSphere();const foam=new THREE.Mesh(foamGeometry,foamMaterial);foam.name="beach-irregular-shore-foam";group.add(foam);

  const buildingPlacements=[
   {id:"beach-cafe",file:"building_A",x:-14,z:12,rotation:Math.PI,color:0xe89072,height:6.6},
   {id:"surf-shop",file:"building_E",x:14,z:12,rotation:Math.PI,color:0x58aeb5,height:9.4},
   {id:"seashell-hotel",file:"building_C",x:-30,z:37,rotation:Math.PI,color:0x5c91b5,height:11.9},
   {id:"ice-cream-shop",file:"building_A",x:-14,z:37,rotation:Math.PI,color:0xe1aa58,height:6.6},
   {id:"ocean-outfitters",file:"building_E",x:14,z:37,rotation:Math.PI,color:0x4f9a72,height:9.4},
   {id:"sunset-inn",file:"building_G",x:30,z:37,rotation:Math.PI,color:0xd86d5b,height:11.9}
  ];
  buildingPlacements.forEach(spec=>{const fallback=fallbackBuilding(THREE,spec.id,spec.color,spec.height);fallback.position.x=spec.x;fallback.position.z=spec.z;fallback.rotation.y=spec.rotation;fallback.visible=false;fallback.name=`${spec.id}-fallback`;group.add(fallback);spec.fallback=fallback;collisions.push(rectangle(spec.id,spec.x,spec.z,4,4))});

  traffic=globalThis.CityCarSystem?new globalThis.CityCarSystem(THREE,{maxCars:4,minDelay:1.8,maxDelay:3.4,carScale:8,lanes:[
   {id:"beach-eastbound",start:{x:-42,z:25.5},end:{x:42,z:25.5},y:.5,speedMin:6,speedMax:8.5,fadeDistance:9},
   {id:"beach-westbound",start:{x:42,z:30.5},end:{x:-42,z:30.5},y:.5,speedMin:6,speedMax:8.5,fadeDistance:9}
  ]}):null;if(traffic)group.add(traffic.root);

  async function installWater(){
   if(!globalThis.ThreeWater?.Water)throw new Error("Three.js Water addon is unavailable");
   waterNormals=await loadTexture(THREE,"assets/textures/water/waternormals.jpg");waterNormals.wrapS=waterNormals.wrapT=THREE.RepeatWrapping;
   water=new globalThis.ThreeWater.Water(new THREE.PlaneGeometry(80,34.5),{textureWidth:256,textureHeight:256,waterNormals,sunDirection:new THREE.Vector3(.6,.8,.25),sunColor:0xffffff,waterColor:0x168fa7,distortionScale:3.2,fog:Boolean(group.fog)});
   water.rotation.x=-Math.PI/2;water.position.set(0,.04,-22.75);water.name="beach-reflective-water";water.userData={assetId:"three.r160.water",license:"MIT",reflectionTarget:"256x256"};
   group.remove(fallbackWater);fallbackWater.geometry.dispose();fallbackWaterMaterial.dispose();group.add(water);loadedAssetIds.push("three.r160.water","three.r160.waternormals");group.userData.water={status:"ready",implementation:"Three.js Water r160",reflectionTarget:"256x256"};
  }
  async function installCityAssets(){
   if(!globalThis.CityWorld?.loadAssets)throw new Error("City asset loader is unavailable");
   const assets=await globalThis.CityWorld.loadAssets(undefined,CITY_FILES);errors.push(...assets.errors.map(error=>`city: ${error}`));loadedAssetIds.push(...assets.loadedAssetIds);
   for(const spec of buildingPlacements){const prototype=assets.prototypes.get(spec.file);if(!prototype){spec.fallback.visible=true;continue}const object=markMeshes(prototype.clone(true));object.scale.setScalar(4);object.position.set(spec.x,.15,spec.z);object.rotation.y=spec.rotation;object.name=spec.id;object.userData={assetId:`kaykit.city.${spec.file}`,source:"KayKit City Builder Bits",license:"CC0-1.0",placeholder:false};group.add(object)}
   const roadPrototype=assets.prototypes.get("road_straight"),crossingPrototype=assets.prototypes.get("road_straight_crossing");
   for(let i=0;i<9;i++){const prototype=(i===2||i===6)&&crossingPrototype?crossingPrototype:roadPrototype;if(!prototype)continue;const road=markMeshes(prototype.clone(true));road.scale.setScalar(4.5);road.position.set(-36+i*9,.01,28);road.rotation.y=Math.PI/2;road.name=`beach-road-${i}`;road.userData={assetId:`kaykit.city.${prototype===crossingPrototype?"road_straight_crossing":"road_straight"}`,placeholder:false};group.add(road)}
   const bench=assets.prototypes.get("bench"),streetlight=assets.prototypes.get("streetlight");
   [[-23,22,0],[0,22,0],[23,22,0]].forEach(([x,z,rotation],index)=>{if(!bench)return;const object=markMeshes(bench.clone(true));object.scale.setScalar(4);object.position.set(x,.2,z);object.rotation.y=rotation;object.name=`beach-bench-${index}`;group.add(object)});
   [[-37,22],[37,22],[-37,34],[37,34]].forEach(([x,z],index)=>{if(!streetlight)return;const object=markMeshes(streetlight.clone(true));object.scale.setScalar(4);object.position.set(x,.2,z);object.rotation.y=index<2?Math.PI:0;object.name=`beach-streetlight-${index}`;group.add(object)});
   const carTemplates=[assets.prototypes.get("car_hatchback"),assets.prototypes.get("car_taxi")].filter(Boolean);if(carTemplates.length)traffic?.installTemplates(carTemplates,8);
  }
  async function installNatureAndNpcs(){
   const Loader=globalThis.ThreeGLTFLoader?.GLTFLoader;if(!Loader)throw new Error("GLTF loader is unavailable");const loader=new Loader(),nature=new Map();
   await Promise.all(NATURE_FILES.map(async file=>{try{const gltf=await loadGLTF(loader,`${NATURE_ROOT}${file}.glb`);nature.set(file,gltf.scene);loadedAssetIds.push(`kenney.nature.${file}`)}catch(error){errors.push(`nature ${file}: ${error?.message||error}`)}}));
   const palms=[[-24,-1,"tree_palm"],[-21,8,"tree_palmBend"],[-20,19,"tree_palmDetailedTall"],[-8,19,"tree_palmBend"],[7,20,"tree_palmDetailedTall"],[20,7,"tree_palmBend"],[23,19,"tree_palmDetailedTall"]];
   palms.forEach(([x,z,file],index)=>{const prototype=nature.get(file);if(!prototype)return;const object=markMeshes(prototype.clone(true));normalizeObject(THREE,object,5.4+(index%3)*.7);object.position.x=x;object.position.z=z;object.rotation.y=(index*.83)%6.28;object.name=`beach-palm-${index}`;object.userData={assetId:`kenney.nature.${file}`,license:"CC0-1.0"};group.add(object)});
   [[-27,-4,"rock_smallA"],[25,-3,"rock_smallB"],[-5,-3,"rock_smallB"]].forEach(([x,z,file],index)=>{const prototype=nature.get(file);if(!prototype)return;const object=markMeshes(prototype.clone(true));normalizeObject(THREE,object,.65+index*.12);object.position.x=x;object.position.z=z;object.name=`beach-rock-${index}`;group.add(object)});
   for(const spec of NPC_SPECS){try{const gltf=await loadGLTF(loader,`assets/models/beach-npcs/${spec.file}`),actor=markMeshes(gltf.scene);const grounding=normalizeObject(THREE,actor,spec.height);actor.position.x=spec.x;actor.position.z=spec.z;actor.rotation.y=spec.turn;actor.name=`beach-npc-${spec.id}`;actor.userData={assetId:`kenney.${spec.file}`,npcId:spec.id,npcName:spec.id[0].toUpperCase()+spec.id.slice(1),license:"CC0-1.0",clip:"idle",grounding};group.add(actor);npcRoots.push(actor);npcById.set(spec.id,actor);const clip=gltf.animations.find(item=>item.name.toLowerCase()==="idle");let animated=false;if(clip){const mixer=new THREE.AnimationMixer(actor);mixer.clipAction(clip).play();mixers.push(mixer);animated=true;group.userData.npcs.animated++}group.userData.npcs.actors.push({id:spec.id,height:spec.height,assetId:actor.userData.assetId,clip:clip?.name||null,animated,grounding});loadedAssetIds.push(actor.userData.assetId)}catch(error){errors.push(`npc ${spec.id}: ${error?.message||error}`);group.userData.npcs.actors.push({id:spec.id,animated:false,error:String(error?.message||error)})}}
  }

  const world={group,bounds:{minX:-39.45,maxX:39.45,minZ:-39.45,maxZ:39.45},spawn:CONFIG.spawn,camera:CONFIG.camera,background:0x9edfff,name:"Sunny Beach",debugPoses:DEBUG_POSES,npcs:npcRoots,findNpc:id=>npcById.get(id)||null,
   canWalk(x,z){if(x<world.bounds.minX||x>world.bounds.maxX||z<world.bounds.minZ||z>world.bounds.maxZ)return false;return!collisions.some(box=>x>box.minX-PLAYER_RADIUS&&x<box.maxX+PLAYER_RADIUS&&z>box.minZ-PLAYER_RADIUS&&z<box.maxZ+PLAYER_RADIUS)},
   update(dt,isActive,camera){active=Boolean(isActive);traffic?.setEnabled(active);if(!active)return;if(camera)sky.position.copy(camera.position);traffic?.update(dt,camera?.position);mixers.forEach(mixer=>mixer.update(dt));if(water?.material?.uniforms?.time)water.material.uniforms.time.value+=dt*.65},
   debug(){return{assets:group.userData.assets,water:group.userData.water,npcs:group.userData.npcs,collisions:collisions.length,traffic:traffic?.metrics()||null,poses:Object.keys(DEBUG_POSES),budget:{maxAssetBytes:8*1024*1024,maxRenderCalls:140,reflectionTarget:"256x256"},active}},
   dispose(){if(disposed)return;disposed=true;traffic?.destroy();mixers.forEach((mixer,index)=>{mixer.stopAllAction();mixer.uncacheRoot(npcRoots[index])});water?.dispose?.();waterNormals?.dispose?.();group.parent?.remove(group);globalThis.CityWorld?.disposeResources?.(group)},destroy(){this.dispose()}
  };
  world.ready=Promise.allSettled([installWater(),installCityAssets(),installNatureAndNpcs()]).then(results=>{results.forEach(result=>{if(result.status==="rejected")errors.push(result.reason?.message||String(result.reason))});if(disposed)return world;const criticalReady=group.userData.water.status==="ready"&&loadedAssetIds.some(id=>id.startsWith("kaykit.city."))&&group.userData.npcs.animated>0;group.userData.assets.status=errors.length?(criticalReady?"partial":"fallback"):"ready";return world});
  return world;
 }
 return{CONFIG,CITY_FILES,NATURE_FILES,NPC_SPECS,DEBUG_POSES,PLAYER_RADIUS,normalizeObject,rectangle,create};
});
