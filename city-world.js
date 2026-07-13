// Data-driven 98x98 city built from KayKit: City Builder Bits.
(function(root,factory){
 const parser=root?.levelTemplateParser||(typeof module!=="undefined"&&module.exports?require("./level-template-parser.js"):null);
 const cars=root?.CityCarSystem||(typeof module!=="undefined"&&module.exports?require("./city-car-system.js").CityCarSystem:null);
 const api=factory(parser,cars);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root){root.CityWorld=api;root.worldFactories=root.worldFactories||{};root.worldFactories.city=api.create}
})(typeof globalThis!=="undefined"?globalThis:this,function(levelParser,CityCarSystem){
 "use strict";
 const BUILD_VERSION="__BUILD_VERSION__";
 const LEVEL_URL=`levels/city-98.txt?v=${BUILD_VERSION}`;
 const ASSET_ROOT="assets/models/city-builder-bits/";
 const MIN_SPACING=2,PLAYER_RADIUS=.36,BUILDING_SCALE=4,ROAD_SCALE=3.5,PROP_SCALE=4,CAR_SCALE=8;
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
 function buildingPlacements(level){
  const placements=[];level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{const spec=BUILDINGS[symbol];if(spec)placements.push({symbol,col,row,...cellCenter(level,col,row),spec,rotation:row===0?0:Math.PI})}));return placements;
 }
 function footprintDistance(a,b){const dx=Math.max(0,Math.abs(a.x-b.x)-(a.spec.footprint[0]+b.spec.footprint[0])/2),dz=Math.max(0,Math.abs(a.z-b.z)-(a.spec.footprint[1]+b.spec.footprint[1])/2);return Math.hypot(dx,dz)}
 function spacingReport(level){const placements=buildingPlacements(level);let minimum=Infinity,pair=null;for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){const distance=footprintDistance(placements[i],placements[j]);if(distance<minimum){minimum=distance;pair=[placements[i],placements[j]]}}return{minimum:Number.isFinite(minimum)?minimum:Infinity,pair,count:placements.length,cell:level.cell}}
 function validateSpacing(level){const report=spacingReport(level);if(level.cell<7)throw new Error(`City cell size ${level.cell} is too tight for the enlarged city kit; use at least 7 world units`);if(report.minimum+1e-6<MIN_SPACING){const[a,b]=report.pair;throw new Error(`City buildings ${a.symbol}@${a.col},${a.row} and ${b.symbol}@${b.col},${b.row} are only ${report.minimum.toFixed(2)} units apart`)}return report}
 function validateRoads(level){
  const symbolAt=(col,row)=>level.map[row]?.[col];let junctions=0,roadTiles=0;
  level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(!ROAD_SYMBOLS.has(symbol))return;roadTiles++;if(symbol==="+"){junctions++;if(!ROAD_SYMBOLS.has(symbolAt(col-1,row))||!ROAD_SYMBOLS.has(symbolAt(col+1,row))||!ROAD_SYMBOLS.has(symbolAt(col,row-1))||!ROAD_SYMBOLS.has(symbolAt(col,row+1)))throw new Error(`City junction at ${col},${row} is not connected on all four sides`)}}));
  if(junctions<4)throw new Error("City layout needs at least four connected junctions");return{roadTiles,junctions};
 }
 function loadLevel(fetchImpl=globalThis.fetch){if(typeof fetchImpl!=="function")return Promise.reject(new Error("City layout requires fetch"));return fetchImpl(LEVEL_URL).then(response=>{if(!response.ok)throw new Error(`City level request failed (${response.status})`);return response.text()}).then(parseLevel)}
 function loadGLTF(loader,url){return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject))}
 async function loadAssets(Loader=globalThis.ThreeGLTFLoader?.GLTFLoader){
  if(!Loader)return{prototypes:new Map(),loadedAssetIds:[],errors:["City GLTF loader is unavailable"],texture:null};
  const loader=new Loader(),prototypes=new Map(),errors=[];
  await Promise.all(MODEL_FILES.map(async file=>{try{const gltf=await loadGLTF(loader,`${ASSET_ROOT}${file}.gltf?v=${BUILD_VERSION}`);prototypes.set(file,gltf.scene)}catch(error){errors.push(`${file}: ${error?.message||error}`)}}));
  let sharedTexture=null;for(const prototype of prototypes.values())prototype.traverse(object=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.filter(Boolean).forEach(material=>{if(!material.map)return;if(!sharedTexture)sharedTexture=material.map;else if(material.map!==sharedTexture){material.map.dispose?.();material.map=sharedTexture;material.needsUpdate=true}})});
  return{prototypes,loadedAssetIds:[...prototypes.keys()].map(file=>`kaykit.city.${file}`),errors,texture:sharedTexture};
 }
 function placeholder(THREE,size,color){const geometry=new THREE.BoxGeometry(...size),material=new THREE.MeshLambertMaterial({color}),mesh=new THREE.Mesh(geometry,material);mesh.position.y=size[1]/2;mesh.userData.placeholder=true;return mesh}
 function cloneAsset(THREE,assets,file,scale,fallbackSize,fallbackColor){const prototype=assets.prototypes.get(file),object=prototype?prototype.clone(true):placeholder(THREE,fallbackSize,fallbackColor);if(prototype)object.scale.setScalar(scale);object.userData.placeholder=!prototype;object.userData.sourceFile=file;object.traverse(child=>{if(child.isMesh){child.castShadow=false;child.receiveShadow=false}});return object}
 function disposeResources(root){const geometries=new Set(),materials=new Set(),textures=new Set();root?.traverse(object=>{if(object.geometry)geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.filter(Boolean).forEach(material=>{materials.add(material);Object.values(material).forEach(value=>{if(value?.isTexture)textures.add(value)})})});textures.forEach(texture=>texture.dispose?.());materials.forEach(material=>material.dispose?.());geometries.forEach(geometry=>geometry.dispose?.());return{geometries:geometries.size,materials:materials.size,textures:textures.size}}
 function roadLanes(level){
  const half=level.width/2,rows=[],cols=[];level.map.forEach((line,row)=>{if(line.includes("-"))rows.push(row)});for(let col=0;col<level.map[0].length;col++)if(level.map.some(line=>line[col]==="|"))cols.push(col);
  const lanes=[];rows.forEach((row,index)=>{const z=cellCenter(level,0,row).z+(index%2?1.1:-1.1),forward=index%2===0;lanes.push({id:`east-west-${row}`,start:{x:forward?-half:half,z},end:{x:forward?half:-half,z},speedMin:8,speedMax:12,fadeDistance:12.6})});
  cols.forEach((col,index)=>{const x=cellCenter(level,col,0).x+(index%2?1.1:-1.1),forward=index%2===0;lanes.push({id:`north-south-${col}`,start:{x,z:forward?-half:half},end:{x,z:forward?half:-half},speedMin:8,speedMax:12,fadeDistance:12.6})});return lanes;
 }
 function create(THREE){
  const group=new THREE.Group();group.name="city-world";group.userData={destination:"city",layout:{url:LEVEL_URL,status:"loading"},assets:{source:"KayKit: City Builder Bits",license:"CC0-1.0",status:"loading",loadedAssetIds:[],errors:[]}};
  const collisionBoxes=[];let disposed=false,level=null,spacing=null,roads=null,traffic=null;
  const debugPoses=Object.freeze({
   spawn:{x:3.5,z:45.5,angle:.24,height:16.8,distance:25.2},overview:{x:0,z:0,angle:.4,height:67.2,distance:78.4,hidePlayer:true},
   buildingsNorth:{x:-10.5,z:-39.9,angle:0,height:9.8,distance:16.8},buildingsCenter:{x:-45.5,z:-23.8,angle:Math.PI,height:9.8,distance:16.8},buildingsSouth:{x:-45.5,z:11.2,angle:Math.PI,height:9.8,distance:16.8},
   buildingA:{x:-45.5,z:-39.9,angle:0,height:9.8,distance:16.8},buildingB:{x:-10.5,z:-39.9,angle:0,height:9.8,distance:16.8},buildingC:{x:24.5,z:-39.9,angle:0,height:9.8,distance:16.8},
   buildingD:{x:-45.5,z:-23.8,angle:Math.PI,height:9.8,distance:16.8},buildingE:{x:-17.5,z:-23.8,angle:Math.PI,height:9.8,distance:16.8},buildingF:{x:10.5,z:-23.8,angle:Math.PI,height:9.8,distance:16.8},
   buildingG:{x:-45.5,z:11.2,angle:Math.PI,height:9.8,distance:16.8},buildingH:{x:-17.5,z:11.2,angle:Math.PI,height:9.8,distance:16.8},
   trafficLights:{x:3.5,z:10.5,angle:0,height:7.7,distance:12.6},carsEast:{x:0,z:44.1,angle:0,height:8.4,distance:16.8},carsNorth:{x:44.1,z:0,angle:Math.PI/2,height:8.4,distance:16.8}
  });
  const world={group,bounds:{minX:-48.6,maxX:48.6,minZ:-48.6,maxZ:48.6},spawn:{x:3.5,z:45.5},camera:{angle:.24,height:16.8,distance:25.2},debugPoses,background:0xb8def0,name:"Chibi City",
   canWalk(x,z){if(x<world.bounds.minX||x>world.bounds.maxX||z<world.bounds.minZ||z>world.bounds.maxZ)return false;return!collisionBoxes.some(box=>Math.abs(x-box.x)<box.halfX+PLAYER_RADIUS&&Math.abs(z-box.z)<box.halfZ+PLAYER_RADIUS)},
   update(dt,player){traffic?.update(dt,player)},
   prepareDebugPose(poseId){if(poseId==="carsEast")return traffic?.debugFormation("east-west-")||false;if(poseId==="carsNorth")return traffic?.debugFormation("north-south-")||false;return false},
   debug(){return{layout:group.userData.layout,assets:group.userData.assets,buildings:collisionBoxes.length,minimumSpacing:spacing?.minimum??null,roads,traffic:traffic?.metrics()||null,scale:{building:BUILDING_SCALE,road:ROAD_SCALE,prop:PROP_SCALE,car:CAR_SCALE},carToChibiHeightRatio:+((.45*CAR_SCALE)/3).toFixed(2),poses:Object.keys(debugPoses)}},
   dispose(){disposed=true;traffic?.destroy();group.parent?.remove(group);disposeResources(group)}
  };
  world.ready=Promise.all([loadLevel(),loadAssets()]).then(([loadedLevel,assets])=>{
   if(disposed)return world;level=loadedLevel;spacing=validateSpacing(level);roads=validateRoads(level);world.name=level.name||world.name;world.bounds={minX:-level.width/2+PLAYER_RADIUS,maxX:level.width/2-PLAYER_RADIUS,minZ:-level.depth/2+PLAYER_RADIUS,maxZ:level.depth/2-PLAYER_RADIUS};world.spawn=cellCenter(level,level.spawnCol,level.spawnRow);
   const floorGeometry=new THREE.BoxGeometry(level.width,.1,level.depth),floorMaterial=new THREE.MeshBasicMaterial({color:0xc7c6bd}),floor=new THREE.Mesh(floorGeometry,floorMaterial);
   floor.position.set(0,-.07,0);floor.frustumCulled=false;floor.receiveShadow=false;floor.userData={assetId:"city.sidewalk.base",layout:"single-mesh",width:level.width,depth:level.depth};group.add(floor);
   for(const placement of buildingPlacements(level)){const object=cloneAsset(THREE,assets,placement.spec.file,BUILDING_SCALE,placement.spec.size,placement.spec.color);object.position.set(placement.x,0,placement.z);object.rotation.y=placement.rotation;object.name=placement.spec.assetId;object.userData.assetId=placement.spec.assetId;object.userData.level={symbol:placement.symbol,col:placement.col,row:placement.row,rotation:placement.rotation};group.add(object);collisionBoxes.push({x:placement.x,z:placement.z,halfX:placement.spec.footprint[0]/2,halfZ:placement.spec.footprint[1]/2,assetId:placement.spec.assetId})}
   let junctionIndex=0,lightCount=0,streetlightCount=0;level.map.forEach((line,row)=>[...line].forEach((symbol,col)=>{if(!ROAD_SYMBOLS.has(symbol))return;const center=cellCenter(level,col,row),file=symbol==="+"?"road_junction":(symbol==="-"?"road_straight":"road_straight"),road=cloneAsset(THREE,assets,file,ROAD_SCALE,[level.cell,.12,level.cell],0x555b62);road.position.set(center.x,.01,center.z);road.rotation.y=symbol==="-"?Math.PI/2:0;road.name=`city-road-${col}-${row}`;road.userData.assetId=`city.road.${symbol==="+"?"junction":"straight"}`;group.add(road);
    if(symbol==="+"){[[2.4,2.4,Math.PI],[-2.4,-2.4,0]].forEach(([dx,dz,rotation],corner)=>{const light=cloneAsset(THREE,assets,corner?"trafficlight_B":"trafficlight_C",PROP_SCALE,[.9,3.9,.7],0xf2b632);light.position.set(center.x+dx,.06,center.z+dz);light.rotation.y=rotation;light.name=`city-trafficlight-${junctionIndex}-${corner}`;light.userData.assetId="city.traffic-light";group.add(light);lightCount++});junctionIndex++}
    else if((row+col)%4===0){const horizontal=symbol==="-",lamp=cloneAsset(THREE,assets,"streetlight",PROP_SCALE,[.9,3.9,.35],0x404852);lamp.position.set(center.x+(horizontal?0:2.5),.06,center.z+(horizontal?2.5:0));lamp.rotation.y=horizontal?Math.PI/2:0;lamp.name=`city-streetlight-${streetlightCount++}`;lamp.userData.assetId="city.street-light";group.add(lamp)}
   }));
   traffic=new CityCarSystem(THREE,{lanes:roadLanes(level),maxCars:4,minDelay:.8,maxDelay:1.7,carScale:CAR_SCALE});group.add(traffic.root);traffic.setEnabled(true);const carTemplates=CAR_FILES.map(file=>assets.prototypes.get(file)).filter(Boolean);if(carTemplates.length)traffic.installTemplates(carTemplates,CAR_SCALE);
   group.userData.layout={url:LEVEL_URL,status:"ready",size:`${level.width}x${level.depth}`,cell:level.cell,minimumSpacing:spacing.minimum,roadTiles:roads.roadTiles,junctions:roads.junctions};group.userData.assets={source:"KayKit: City Builder Bits",license:"CC0-1.0",status:assets.errors.length?(assets.loadedAssetIds.length?"partial":"fallback"):"ready",loadedAssetIds:assets.loadedAssetIds,errors:assets.errors,trafficLights:lightCount,streetlights:streetlightCount};return world;
  }).catch(error=>{group.userData.layout.status="error";group.userData.layout.error=String(error?.message||error);throw error});
  return world;
 }
 return{LEVEL_URL,ASSET_ROOT,BUILDINGS,MODEL_FILES,CAR_FILES,MIN_SPACING,PLAYER_RADIUS,BUILDING_SCALE,ROAD_SCALE,PROP_SCALE,CAR_SCALE,parseLevel,cellCenter,buildingPlacements,footprintDistance,spacingReport,validateSpacing,validateRoads,roadLanes,loadLevel,loadAssets,disposeResources,create};
});
