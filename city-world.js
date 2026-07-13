// Data-driven 126x126 city built from KayKit: City Builder Bits.
(function(root,factory){
 const parser=root?.levelTemplateParser||(typeof module!=="undefined"&&module.exports?require("./level-template-parser.js"):null);
 const cars=root?.CityCarSystem||(typeof module!=="undefined"&&module.exports?require("./city-car-system.js").CityCarSystem:null);
 const api=factory(parser,cars);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.CityWorld=api;root.worldFactories=root.worldFactories||{};root.worldFactories.city=api.create}
})(typeof globalThis!=="undefined"?globalThis:this,function(levelParser,CityCarSystem){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__";
 const LEVEL_URL=`levels/city-126.txt?v=${BUILD_VERSION}`;
 const ASSET_ROOT="assets/models/city-builder-bits/";
 const SIDEWALK_TEXTURE_URL=`assets/textures/city/patterned-paving-diffuse-1k.jpg?v=${BUILD_VERSION}`;
 const CITY_SKY_TEXTURE_URL=`assets/textures/city/kloofendal-48d-partly-cloudy-puresky-1k.jpg?v=${BUILD_VERSION}`;
 const MIN_SPACING=2,PLAYER_RADIUS=.36,BUILDING_SCALE=4,ROAD_SCALE=4.5,PROP_SCALE=4,CAR_SCALE=7;
 const ROAD_BASE_Y=.01,ROAD_SURFACE_Y=ROAD_BASE_Y+.1*ROAD_SCALE,CURB_HEIGHT=.12,SIDEWALK_SURFACE_Y=ROAD_SURFACE_Y+CURB_HEIGHT,CAR_WHEEL_SOURCE_OFFSET=.06105,CAR_WHEEL_OFFSET=CAR_WHEEL_SOURCE_OFFSET*CAR_SCALE,CAR_LANE_Y=ROAD_SURFACE_Y+CAR_WHEEL_OFFSET;
 const PROP_FACING_FLIP=Math.PI,SKY_RADIUS=140;
 const BUILDINGS=Object.freeze({
  A:{assetId:"city.building.a",file:"building_A",footprint:[8,8],size:[8,6.6,8],color:0xd86d5b},
  B:{assetId:"city.building.b",file:"building_B",footprint:[8,8],size:[8,6.6,8],color:0xe1aa58},
  C:{assetId:"city.building.c",file:"building_C",footprint:[8,8],size:[8,11.92,8],color:0x5c91b5},
  D:{assetId:"city.building.d",file:"building_D",footprint:[8,8],size:[8,11.88,8],color:0x4f9a72},
  E:{assetId:"city.building.e",file:"building_E",footprint:[8.04,8],size:[8.04,9.4,8],color:0xc7654f},
  F:{assetId:"city.building.f",file:"building_F",footprint:[8.04,8],size:[8.04,9.4,8],color:0x547c9b},
  G:{assetId:"city.building.g",file:"building_G",footprint:[8.04,8],size:[8.04,11.92,8],color:0xd55656},
  H:{assetId:"city.building.h",file:"building_H",footprint:[8.04,8],size:[8.04,12.2,8],color:0x4f9b6b}
 });
 const MODEL_FILES=Object.freeze([
  ...Object.values(BUILDINGS).map(spec=>spec.file),"road_straight","road_straight_crossing","road_junction",
  "trafficlight_A","trafficlight_B","trafficlight_C","streetlight","bench","firehydrant","dumpster","watertower",
  "car_hatchback","car_police","car_sedan","car_stationwagon","car_taxi"
 ]);
 const CAR_FILES=Object.freeze(["car_hatchback","car_police","car_sedan","car_stationwagon","car_taxi"]);
 const ROAD_SYMBOLS=new Set(["-","|","+","X"]),WALKABLE=new Set([".",...ROAD_SYMBOLS]);

 function parseLevel(text){
  if(!levelParser?.parse)throw new Error("City level parser is unavailable");
  const level=levelParser.parse(text),known=new Set([...Object.keys(BUILDINGS),...WALKABLE]),unknown=new Set(level.map.join("").split("").filter(symbol=>!known.has(symbol)));
  if(unknown.size)throw new Error(`Unknown city level symbols: ${[...unknown].join(",")}`);
  const spawns=[];level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(symbol==="X")spawns.push([col,row])}));
  if(spawns.length!==1||spawns[0][0]!==level.spawnCol||spawns[0][1]!==level.spawnRow)throw new Error("City spawn metadata must point to its single X symbol");
  validateSpacing(level);validateRoads(level);return level;
 }
 function cellCenter(level,col,row){return{x:-level.width/2+(col+.5)*level.cell,z:-level.depth/2+(row+.5)*level.cell}}
 function symbolAtWorld(level,x,z){const col=Math.floor((x+level.width/2)/level.cell),row=Math.floor((z+level.depth/2)/level.cell);return level.map[row]?.[col]}
 function surfaceYAt(level,x,z){return ROAD_SYMBOLS.has(symbolAtWorld(level,x,z))?ROAD_SURFACE_Y:SIDEWALK_SURFACE_Y}
 function buildingPlacements(level){
  const placements=[];level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{const spec=BUILDINGS[symbol];if(spec)placements.push({symbol,col,row,...cellCenter(level,col,row),spec,rotation:row===0?0:Math.PI})}));return placements;
 }
 function footprintDistance(a,b){const dx=Math.max(0,Math.abs(a.x-b.x)-(a.spec.footprint[0]+b.spec.footprint[0])/2),dz=Math.max(0,Math.abs(a.z-b.z)-(a.spec.footprint[1]+b.spec.footprint[1])/2);return Math.hypot(dx,dz)}
 function spacingReport(level){const placements=buildingPlacements(level);let minimum=Infinity,pair=null;for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){const distance=footprintDistance(placements[i],placements[j]);if(distance<minimum){minimum=distance;pair=[placements[i],placements[j]]}}return{minimum:Number.isFinite(minimum)?minimum:Infinity,pair,count:placements.length,cell:level.cell}}
 function validateSpacing(level){const report=spacingReport(level);if(level.cell<9)throw new Error(`City cell size ${level.cell} is too tight for two full car lanes; use at least 9 world units`);if(report.minimum+1e-6<MIN_SPACING){const[a,b]=report.pair;throw new Error(`City buildings ${a.symbol}@${a.col},${a.row} and ${b.symbol}@${b.col},${b.row} are only ${report.minimum.toFixed(2)} units apart`)}return report}
 function validateRoads(level){
  const symbolAt=(col,row)=>level.map[row]?.[col];let junctions=0,roadTiles=0;
  level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(!ROAD_SYMBOLS.has(symbol))return;roadTiles++;if(symbol==="+"){junctions++;if(!ROAD_SYMBOLS.has(symbolAt(col-1,row))||!ROAD_SYMBOLS.has(symbolAt(col+1,row))||!ROAD_SYMBOLS.has(symbolAt(col,row-1))||!ROAD_SYMBOLS.has(symbolAt(col,row+1)))throw new Error(`City junction at ${col},${row} is not connected on all four sides`)}}));
  if(junctions<4)throw new Error("City layout needs at least four connected junctions");return{roadTiles,junctions};
 }
 function loadLevel(fetchImpl=globalThis.fetch){if(typeof fetchImpl!=="function")return Promise.reject(new Error("City layout requires fetch"));return fetchImpl(LEVEL_URL).then(response=>{if(!response.ok)throw new Error(`City level request failed (${response.status})`);return response.text()}).then(parseLevel)}
 function loadGLTF(loader,url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject))}
 function loadSidewalkTexture(THREE){return new Promise(resolve=>{if(!THREE?.TextureLoader)return resolve({texture:null,error:"City sidewalk texture loader is unavailable"});new THREE.TextureLoader().load(SIDEWALK_TEXTURE_URL,texture=>{texture.wrapS=texture.wrapT=THREE.RepeatWrapping;if("colorSpace" in texture&&THREE.SRGBColorSpace)texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;resolve({texture,error:null})},undefined,error=>resolve({texture:null,error:`patterned-paving: ${error?.message||error}`}) )})}
 function loadCitySkyTexture(THREE){return new Promise(resolve=>{if(!THREE?.TextureLoader)return resolve({texture:null,error:"City sky texture loader is unavailable"});new THREE.TextureLoader().load(CITY_SKY_TEXTURE_URL,texture=>{if("colorSpace" in texture&&THREE.SRGBColorSpace)texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;resolve({texture,error:null})},undefined,error=>resolve({texture:null,error:`partly-cloudy-sky: ${error?.message||error}`}) )})}
 async function loadAssets(Loader=globalThis.ThreeGLTFLoader?.GLTFLoader,files=MODEL_FILES){
  if(!Loader)return{prototypes:new Map(),loadedAssetIds:[],errors:["City GLTF loader is unavailable"],texture:null};
  const loader=new Loader(),prototypes=new Map(),errors=[];
  await Promise.all(files.map(async file=>{try{const gltf=await loadGLTF(loader,`${ASSET_ROOT}${file}.gltf?v=${BUILD_VERSION}`);prototypes.set(file,gltf.scene)}catch(error){errors.push(`${file}: ${error?.message||error}`)}}));
  let sharedTexture=null;for(const prototype of prototypes.values())prototype.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{if(!material.map)return;if(!sharedTexture)sharedTexture=material.map;else if(material.map!==sharedTexture){material.map.dispose?.();material.map=sharedTexture;material.needsUpdate=true}})});
  return{prototypes,loadedAssetIds:[...prototypes.keys()].map(file=>`kaykit.city.${file}`),errors,texture:sharedTexture};
 }
 function placeholder(THREE,size,color){const geometry=new THREE.BoxGeometry(...size),material=new THREE.MeshLambertMaterial({color}),mesh=new THREE.Mesh(geometry,material);mesh.position.y=size[1]/2;mesh.userData.placeholder=true;return mesh}
 function cloneAsset(THREE,assets,file,scale,fallbackSize,fallbackColor){const prototype=assets.prototypes.get(file),object=prototype?prototype.clone(true):placeholder(THREE,fallbackSize,fallbackColor);if(prototype)object.scale.setScalar(scale);object.userData.placeholder=!prototype;object.userData.sourceFile=file;object.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false}});return object}
 function flipPropFacing(rotation){return rotation+PROP_FACING_FLIP}
 function createSkyDome(THREE,texture){if(!texture)return null;const geometry=new THREE.SphereGeometry(SKY_RADIUS,32,16),material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false}),sky=new THREE.Mesh(geometry,material);sky.name="city-partly-cloudy-sky";sky.rotation.y=Math.PI/2;sky.frustumCulled=false;sky.renderOrder=-1000;sky.userData={assetId:"polyhaven.kloofendal-48d-partly-cloudy-puresky.derived-1k",source:"Poly Haven",license:"CC0-1.0",drawCalls:1};return sky}
 function instancedAsset(THREE,assets,file,placements,scale,fallbackSize,fallbackColor){let source=null;assets.prototypes.get(file)?.traverse(object=>{if(!source&&object.isMesh)source=object});const geometry=source?.geometry||new THREE.BoxGeometry(...fallbackSize),material=source?.material||new THREE.MeshLambertMaterial({color:fallbackColor}),mesh=new THREE.InstancedMesh(geometry,material,placements.length),matrix=new THREE.Matrix4(),position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scaleVector=new THREE.Vector3(scale,scale,scale);placements.forEach((placement,index)=>{position.set(placement.x,placement.y,placement.z);quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),placement.rotation);matrix.compose(position,quaternion,scaleVector);mesh.setMatrixAt(index,matrix)});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.castShadow=mesh.receiveShadow=false;mesh.userData={assetId:`city.${file.replaceAll("_","-")}`,sourceFile:file,placeholder:!source,instances:placements.length};return mesh}
 function disposeResources(root){const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(object=>{if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.filter(Boolean).forEach(material=>{materials.add(material);Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value)})})});textures.forEach(texture=>texture.dispose?.());materials.forEach(material=>material.dispose?.());geometries.forEach(geometry=>geometry.dispose?.());return{geometries:geometries.size,materials:materials.size,textures:textures.size}}
 function addQuad(data,vertices,normal,uvs){const base=data.positions.length/3;vertices.forEach(vertex=>data.positions.push(...vertex));for(let i=0;i<4;i++)data.normals.push(...normal);data.uvs.push(...uvs);data.indices.push(base,base+1,base+2,base,base+2,base+3)}
 function sidewalkGeometryData(level){
  const top={positions:[],normals:[],uvs:[],indices:[]},curb={positions:[],normals:[],uvs:[],indices:[]},textureWorldSize=3.2,repeat=level.cell/textureWorldSize,isRoad=(col,row)=>ROAD_SYMBOLS.has(level.map[row]?.[col]);let tiles=0,curbFaces=0;
  level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(ROAD_SYMBOLS.has(symbol))return;tiles++;const center=cellCenter(level,col,row),x0=center.x-level.cell/2,x1=center.x+level.cell/2,z0=center.z-level.cell/2,z1=center.z+level.cell/2,b=ROAD_SURFACE_Y,t=SIDEWALK_SURFACE_Y;
   addQuad(top,[[x0,t,z0],[x0,t,z1],[x1,t,z1],[x1,t,z0]],[0,1,0],[x0/textureWorldSize,z0/textureWorldSize,x0/textureWorldSize,z1/textureWorldSize,x1/textureWorldSize,z1/textureWorldSize,x1/textureWorldSize,z0/textureWorldSize]);
   if(isRoad(col-1,row)){addQuad(curb,[[x0,b,z0],[x0,b,z1],[x0,t,z1],[x0,t,z0]],[-1,0,0],[0,0,repeat,0,repeat,1,0,1]);curbFaces++}
   if(isRoad(col+1,row)){addQuad(curb,[[x1,b,z1],[x1,b,z0],[x1,t,z0],[x1,t,z1]],[1,0,0],[0,0,repeat,0,repeat,1,0,1]);curbFaces++}
   if(isRoad(col,row-1)){addQuad(curb,[[x1,b,z0],[x0,b,z0],[x0,t,z0],[x1,t,z0]],[0,0,-1],[0,0,repeat,0,repeat,1,0,1]);curbFaces++}
   if(isRoad(col,row+1)){addQuad(curb,[[x0,b,z1],[x1,b,z1],[x1,t,z1],[x0,t,z1]],[0,0,1],[0,0,repeat,0,repeat,1,0,1]);curbFaces++}
  }));return{top,curb,tiles,curbFaces};
 }
 function makeGeometry(THREE,data){const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(data.positions,3));geometry.setAttribute("normal",new THREE.Float32BufferAttribute(data.normals,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(data.uvs,2));geometry.setIndex(data.indices);geometry.computeBoundingBox();geometry.computeBoundingSphere();return geometry}
 function roadLanes(level){
  const half=level.width/2,rows=[],cols=[];level.map.forEach((line,row)=>{if(line.includes("-"))rows.push(row)});for(let col=0;col<level.map[0].length;col++)if(level.map.some(line=>line[col]==="|"))cols.push(col);
  const lanes=[],offset=2.1,settings={y:CAR_LANE_Y,speedMin:8,speedMax:12,fadeDistance:16};rows.forEach(row=>{const z=cellCenter(level,0,row).z;lanes.push({id:`east-west-${row}-east`,start:{x:-half,z:z-offset},end:{x:half,z:z-offset},...settings},{id:`east-west-${row}-west`,start:{x:half,z:z+offset},end:{x:-half,z:z+offset},...settings})});
  cols.forEach(col=>{const x=cellCenter(level,col,0).x;lanes.push({id:`north-south-${col}-north`,start:{x:x+offset,z:half},end:{x:x+offset,z:-half},...settings},{id:`north-south-${col}-south`,start:{x:x-offset,z:-half},end:{x:x-offset,z:half},...settings})});return lanes;
 }
 function create(THREE){
  const group=new THREE.Group();group.name="city-world";group.userData={destination:"city",layout:{url:LEVEL_URL,status:"loading"},assets:{source:"KayKit: City Builder Bits",license:"CC0-1.0",status:"loading",loadedAssetIds:[],errors:[]}};
  const collisionBoxes=[];let disposed=false,level=null,spacing=null,roads=null,traffic=null,sky=null;
  const debugPoses=Object.freeze({
   spawn:{x:4.5,z:58.5,angle:.24,height:21.6,distance:32.4},overview:{x:0,z:0,angle:.4,height:86.4,distance:100.8,hidePlayer:true},
   buildingsNorth:{x:-13.5,z:-51.3,angle:0,height:12.6,distance:21.6},buildingsCenter:{x:-58.5,z:-30.6,angle:Math.PI,height:12.6,distance:21.6},buildingsSouth:{x:-58.5,z:14.4,angle:Math.PI,height:12.6,distance:21.6},
   buildingA:{x:-58.5,z:-51.3,angle:0,height:12.6,distance:21.6},buildingB:{x:-13.5,z:-51.3,angle:0,height:12.6,distance:21.6},buildingC:{x:31.5,z:-51.3,angle:0,height:12.6,distance:21.6},
   buildingD:{x:-58.5,z:-30.6,angle:Math.PI,height:12.6,distance:21.6},buildingE:{x:-22.5,z:-30.6,angle:Math.PI,height:12.6,distance:21.6},buildingF:{x:13.5,z:-30.6,angle:Math.PI,height:12.6,distance:21.6},
   buildingG:{x:-58.5,z:14.4,angle:Math.PI,height:12.6,distance:21.6},buildingH:{x:-22.5,z:14.4,angle:Math.PI,height:12.6,distance:21.6},
   trafficLights:{x:4.5,z:13.5,angle:0,height:9.9,distance:16.2},streetLights:{x:4.5,z:49.5,angle:Math.PI/2,height:6.3,distance:14.4},skyStreet:{x:4.5,z:49.5,angle:0,height:3.2,distance:24,hidePlayer:true},roadGrounding:{x:4.5,z:49.5,angle:0,height:5.5,distance:10.5},sidewalkGrounding:{x:13.5,z:58.5,angle:Math.PI/2,height:5.5,distance:10.5},carsEast:{x:0,z:56.7,angle:0,height:9,distance:18},carsNorth:{x:56.7,z:0,angle:Math.PI/2,height:9,distance:18},carsFadeEast:{x:-47,z:56.7,angle:0,height:7,distance:15,hidePlayer:true}
  });
  const world={group,bounds:{minX:-62.6,maxX:62.6,minZ:-62.6,maxZ:62.6},spawn:{x:4.5,z:58.5},camera:{angle:.24,height:21.6,distance:32.4},debugPoses,background:0xb8def0,name:"Chibi City",
   canWalk(x,z){if(x<world.bounds.minX||x>world.bounds.maxX||z<world.bounds.minZ||z>world.bounds.maxZ)return false;return!collisionBoxes.some(box=>Math.abs(x-box.x)<box.halfX+PLAYER_RADIUS&&Math.abs(z-box.z)<box.halfZ+PLAYER_RADIUS)},
   surfaceYAt(x,z){return level?surfaceYAt(level,x,z):ROAD_SURFACE_Y},
   update(dt,player){traffic?.update(dt,player)},
   prepareDebugPose(poseId){if(poseId==="carsEast")return traffic?.debugFormation("east-west-")||false;if(poseId==="carsNorth")return traffic?.debugFormation("north-south-")||false;if(poseId==="carsFadeEast")return traffic?.debugFadeFormation("east-west-")||false;if(["trafficLights","streetLights","skyStreet","overview"].includes(poseId)){traffic?.setEnabled(false);return true}return false},
   debug(){return{layout:group.userData.layout,assets:group.userData.assets,buildings:collisionBoxes.length,minimumSpacing:spacing?.minimum??null,roads,traffic:traffic?.metrics()||null,surfaces:{road:ROAD_SURFACE_Y,sidewalk:SIDEWALK_SURFACE_Y,carRoot:CAR_LANE_Y},scale:{building:BUILDING_SCALE,road:ROAD_SCALE,prop:PROP_SCALE,car:CAR_SCALE},sky:{assetId:"polyhaven.kloofendal-48d-partly-cloudy-puresky.derived-1k",loaded:Boolean(sky),radius:SKY_RADIUS,drawCalls:sky?1:0},propFacingFlip:PROP_FACING_FLIP,carToChibiHeightRatio:+((.45*CAR_SCALE)/3).toFixed(2),poses:Object.keys(debugPoses)}},
   dispose(){disposed=true;traffic?.destroy();group.parent?.remove(group);disposeResources(group)}
  };
  world.ready=Promise.all([loadLevel(),loadAssets(),loadSidewalkTexture(THREE),loadCitySkyTexture(THREE)]).then(([loadedLevel,assets,sidewalkTexture,skyTexture])=>{
   if(disposed)return world;level=loadedLevel;spacing=validateSpacing(level);roads=validateRoads(level);world.name=level.name||world.name;world.bounds={minX:-level.width/2+PLAYER_RADIUS,maxX:level.width/2-PLAYER_RADIUS,minZ:-level.depth/2+PLAYER_RADIUS,maxZ:level.depth/2-PLAYER_RADIUS};world.spawn=cellCenter(level,level.spawnCol,level.spawnRow);
   const sidewalkData=sidewalkGeometryData(level),sidewalkMaterial=new THREE.MeshLambertMaterial({color:sidewalkTexture.texture?0xffffff:0xb8b5ad,map:sidewalkTexture.texture||null}),curbMaterial=new THREE.MeshLambertMaterial({color:0x8c939a}),sidewalk=new THREE.Mesh(makeGeometry(THREE,sidewalkData.top),sidewalkMaterial),curbs=new THREE.Mesh(makeGeometry(THREE,sidewalkData.curb),curbMaterial);
   sidewalk.name="city-patterned-sidewalk";sidewalk.frustumCulled=false;sidewalk.receiveShadow=false;sidewalk.userData={assetId:"polyhaven.patterned-paving.diffuse-1k",layout:"merged-cell-tops",tiles:sidewalkData.tiles};curbs.name="city-curbs";curbs.frustumCulled=false;curbs.receiveShadow=false;curbs.userData={assetId:"city.sidewalk.curbs",faces:sidewalkData.curbFaces};group.add(sidewalk,curbs);
   sky=createSkyDome(THREE,skyTexture.texture);if(sky)group.add(sky);
   for(const placement of buildingPlacements(level)){const object=cloneAsset(THREE,assets,placement.spec.file,BUILDING_SCALE,placement.spec.size,placement.spec.color);object.position.set(placement.x,SIDEWALK_SURFACE_Y,placement.z);object.rotation.y=placement.rotation;object.name=placement.spec.assetId;object.userData.assetId=placement.spec.assetId;object.userData.level={symbol:placement.symbol,col:placement.col,row:placement.row,rotation:placement.rotation};group.add(object);collisionBoxes.push({x:placement.x,z:placement.z,halfX:placement.spec.footprint[0]/2,halfZ:placement.spec.footprint[1]/2,assetId:placement.spec.assetId})}
   const trafficPlacements={trafficlight_B:[],trafficlight_C:[]};let lightCount=0,streetlightCount=0;level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(!ROAD_SYMBOLS.has(symbol))return;const center=cellCenter(level,col,row),file=symbol==="+"?"road_junction":"road_straight",road=cloneAsset(THREE,assets,file,ROAD_SCALE,[level.cell,.1*ROAD_SCALE,level.cell],0x555b62);road.position.set(center.x,ROAD_BASE_Y,center.z);road.rotation.y=symbol==="-"?Math.PI/2:0;road.name=`city-road-${col}-${row}`;road.userData.assetId=`city.road.${symbol==="+"?"junction":"straight"}`;group.add(road);
    if(symbol==="+"){[["trafficlight_C",3.1,3.1,Math.PI],["trafficlight_B",-3.1,-3.1,0],["trafficlight_C",-3.1,3.1,Math.PI/2],["trafficlight_B",3.1,-3.1,-Math.PI/2]].forEach(([lightFile,dx,dz,rotation])=>trafficPlacements[lightFile].push({x:center.x+dx,y:SIDEWALK_SURFACE_Y,z:center.z+dz,rotation:flipPropFacing(rotation)}));lightCount+=4}
    else if((row+col)%4===0){const horizontal=symbol==="-",lamp=cloneAsset(THREE,assets,"streetlight",PROP_SCALE,[.9,3.9,.35],0x404852);lamp.position.set(center.x+(horizontal?0:3.2),SIDEWALK_SURFACE_Y,center.z+(horizontal?3.2:0));lamp.rotation.y=flipPropFacing(horizontal?Math.PI/2:0);lamp.name=`city-streetlight-${streetlightCount++}`;lamp.userData.assetId="city.street-light";group.add(lamp)}
   }));for(const file of ["trafficlight_B","trafficlight_C"]){const signals=instancedAsset(THREE,assets,file,trafficPlacements[file],PROP_SCALE,[.9,3.9,.7],0xf2b632);signals.name=`city-${file}-instances`;group.add(signals)}
   traffic=new CityCarSystem(THREE,{lanes:roadLanes(level),maxCars:4,minDelay:.8,maxDelay:1.7,carScale:CAR_SCALE});group.add(traffic.root);traffic.setEnabled(true);const carTemplates=CAR_FILES.map(file=>assets.prototypes.get(file)).filter(Boolean);if(carTemplates.length)traffic.installTemplates(carTemplates,CAR_SCALE);
   const assetErrors=[...assets.errors,...(sidewalkTexture.error?[sidewalkTexture.error]:[]),...(skyTexture.error?[skyTexture.error]:[])],loadedAssetIds=[...assets.loadedAssetIds,...(sidewalkTexture.texture?["polyhaven.patterned-paving.diffuse-1k"]:[]),...(skyTexture.texture?["polyhaven.kloofendal-48d-partly-cloudy-puresky.derived-1k"]:[])];group.userData.layout={url:LEVEL_URL,status:"ready",size:`${level.width}x${level.depth}`,cell:level.cell,minimumSpacing:spacing.minimum,roadTiles:roads.roadTiles,junctions:roads.junctions,roadSurfaceY:ROAD_SURFACE_Y,sidewalkSurfaceY:SIDEWALK_SURFACE_Y,sidewalkTiles:sidewalkData.tiles};group.userData.assets={source:"KayKit: City Builder Bits + Poly Haven Patterned Paving + Kloofendal 48d Partly Cloudy Pure Sky",license:"CC0-1.0",status:assetErrors.length?(loadedAssetIds.length?"partial":"fallback"):"ready",loadedAssetIds,errors:assetErrors,trafficLights:lightCount,streetlights:streetlightCount};return world;
  }).catch(error=>{group.userData.layout.status="error";group.userData.layout.error=String(error?.message||error);throw error});
  return world;
 }
 return{LEVEL_URL,ASSET_ROOT,SIDEWALK_TEXTURE_URL,CITY_SKY_TEXTURE_URL,BUILDINGS,MODEL_FILES,CAR_FILES,MIN_SPACING,PLAYER_RADIUS,BUILDING_SCALE,ROAD_SCALE,PROP_SCALE,CAR_SCALE,ROAD_BASE_Y,ROAD_SURFACE_Y,SIDEWALK_SURFACE_Y,CAR_WHEEL_SOURCE_OFFSET,CAR_WHEEL_OFFSET,CAR_LANE_Y,PROP_FACING_FLIP,SKY_RADIUS,parseLevel,cellCenter,symbolAtWorld,surfaceYAt,buildingPlacements,footprintDistance,spacingReport,validateSpacing,validateRoads,sidewalkGeometryData,roadLanes,loadLevel,loadAssets,loadSidewalkTexture,loadCitySkyTexture,flipPropFacing,createSkyDome,disposeResources,create};
});
