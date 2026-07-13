(function(){
 "use strict";
 window.worldFactories=window.worldFactories||{};

 // Keep this embedded fallback aligned with forest-level.txt. The parser is
 // public so tooling can preview/validate the same compact level language.
 const LEVEL_TEMPLATE=`
name: Grand Whimsy Forest
size: 240x240
cell: 8
seed: 73421
spawn: 14,24
legend: F=forest P=path C=clearing L=lake G=glen R=rock-garden
map:
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFLLLLFFFFFPFFFFFFFFFFFFFFF
FFFFFLLLLFFFFFPFFFFFFFFFFFFFFF
FFFFFLLLLFFFFFPFFFFFFFFFFFFFFF
FFFFFLLLLFFFFCCCFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFGGFFFFFFPFFFFFFFRRFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFPPPPPPPPPPPPPPPPPPPPPPPPPPFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFLLLLFFFFF
FFFFFFFFFFFFFCCCFFFFFLLLLFFFFF
FFFFFFFFFFFFFFPFFFFFFLLLLFFFFF
FFFFFFFFFFFFFFPFFFFFFLLLLFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFCCFFFFFFFPFFFFFFFFGGFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF
FFFFFFFFFFFFFFPFFFFFFFFFFFFFFF`;

 function parseLevel(text){
  const lines=text.trim().split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const values={},map=[];let readingMap=false;
  for(const line of lines){
   if(line==="map:"){readingMap=true;continue}
   if(readingMap){map.push(line);continue}
   const split=line.indexOf(":");if(split>0)values[line.slice(0,split).trim()]=line.slice(split+1).trim();
  }
  const [width,depth]=(values.size||"240x240").split("x").map(Number);
  const [spawnCol,spawnRow]=(values.spawn||"14,24").split(",").map(Number);
  return {name:values.name||"Forest",width,depth,cell:Number(values.cell)||8,seed:Number(values.seed)||1,spawnCol,spawnRow,map};
 }
 const LEVEL=(window.levelTemplateParser?.parse||parseLevel)(LEVEL_TEMPLATE),HALF=LEVEL.width/2;
 const CHUNK_COLS=LEVEL.width/LEVEL.cell,CHUNK_ROWS=LEVEL.depth/LEVEL.cell;
 // A 13x13 visible ring replaces the former 5x5 ring. The extra cached ring
 // avoids generation churn without increasing draw calls.
 const VISIBLE_RADIUS=6,KEEP_RADIUS=7;
 const MAX_VISIBLE_CHUNKS=(VISIBLE_RADIUS*2+1)**2,MAX_ACTIVE_CHUNKS=(KEEP_RADIUS*2+1)**2;
 const CONFIG={size:LEVEL.width,halfSize:HALF,spawn:cellCenter(LEVEL.spawnCol,LEVEL.spawnRow),camera:{angle:.28,height:12,distance:18}};
 function cellCenter(col,row){return {x:-HALF+col*LEVEL.cell+LEVEL.cell/2,z:-HALF+row*LEVEL.cell+LEVEL.cell/2}}
 function hash(seed,a,b,c=0){let n=(seed^Math.imul(a+101,374761393)^Math.imul(b+137,668265263)^Math.imul(c+17,2246822519))>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}

 window.forestLevel={parse:parseLevel,template:LEVEL_TEMPLATE,level:LEVEL};
 window.worldFactories.forest={
  metadata:{id:"forest",label:LEVEL.name,size:{width:LEVEL.width,depth:LEVEL.depth},lazy:true,levelTemplate:"forest-level.txt",seed:LEVEL.seed},
  create(scene){
   const root=new THREE.Group();root.name="forest-world";scene.add(root);
   const resources=[],chunks=new Map(),collisionByChunk=new Map(),modelAssets=new Map(),modelPromises=new Map(),failedModels=new Set();
   let destroyed=false,lastCenterKey="";
   const stats={activeChunks:0,visibleChunks:0,createdChunks:0,disposedChunks:0,treeInstances:0,flowerInstances:0,rockInstances:0,animalInstances:0,animalCount:0,visibleAnimals:0,animalModelDrawCalls:0,lastChunkBuildMs:0,assetErrors:[],loadedAssetIds:[]};
   const material=(color,options={})=>{const value=new THREE.MeshLambertMaterial({color,...options});resources.push(value);return value};
   const geometry=value=>{resources.push(value);return value};
   const mats={grass:material(0x78bd63),path:material(0xd8bb7b),water:material(0x58b9ce,{transparent:true,opacity:.78}),trunk:material(0x815638),leaf:material(0x398d55),flower:material(0xff79ad),rock:material(0x87939a),brown:material(0x9b6547),white:material(0xfff4dd),orange:material(0xe8793d)};
   const geos={ground:geometry(new THREE.BoxGeometry(LEVEL.cell,.22,LEVEL.cell)),trunk:geometry(new THREE.CylinderGeometry(.24,.36,3,6)),crown:geometry(new THREE.DodecahedronGeometry(1.25,0)),flower:geometry(new THREE.SphereGeometry(.13,5,4)),rock:geometry(new THREE.DodecahedronGeometry(.48,0)),animalBody:geometry(new THREE.SphereGeometry(.5,7,5)),animalHead:geometry(new THREE.SphereGeometry(.32,7,5))};
   const matrix=new THREE.Matrix4(),quat=new THREE.Quaternion();
   const key=(col,row)=>`${col},${row}`;
   const symbolAt=(col,row)=>LEVEL.map[row]?.[col]||"F";
   const isPath=symbol=>symbol==="P"||symbol==="C"||symbol==="G";

   function makeBatch(geo,mat,capacity,name){
    const mesh=new THREE.InstancedMesh(geo,mat,capacity);mesh.name=name;mesh.count=0;mesh.castShadow=false;mesh.receiveShadow=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);return mesh;
   }
   const batches={
    grass:makeBatch(geos.ground,mats.grass,MAX_VISIBLE_CHUNKS,"forest-ground-grass"),
    path:makeBatch(geos.ground,mats.path,MAX_VISIBLE_CHUNKS,"forest-ground-path"),
    water:makeBatch(geos.ground,mats.water,MAX_VISIBLE_CHUNKS,"forest-ground-water"),
    trunk:makeBatch(geos.trunk,mats.trunk,MAX_VISIBLE_CHUNKS*9,"forest-tree-trunks"),
    crown:makeBatch(geos.crown,mats.leaf,MAX_VISIBLE_CHUNKS*9,"forest-tree-crowns"),
    flower:makeBatch(geos.flower,mats.flower,MAX_VISIBLE_CHUNKS*6,"forest-flowers"),
    rock:makeBatch(geos.rock,mats.rock,MAX_VISIBLE_CHUNKS*10,"forest-rocks")
   };
   function writeBatch(mesh,placements){
    mesh.count=Math.min(mesh.instanceMatrix.count,placements.length);
    for(let i=0;i<mesh.count;i++){
     const p=placements[i];matrix.compose(new THREE.Vector3(p.x,p.y,p.z),quat,new THREE.Vector3(p.sx||1,p.sy||1,p.sz||1));mesh.setMatrixAt(i,matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
   }
   function buildChunk(col,row){
    const started=performance.now(),symbol=symbolAt(col,row),center=cellCenter(col,row);
    const data={col,row,floor:symbol==="L"?"water":(isPath(symbol)?"path":"grass"),center,trunks:[],crowns:[],flowers:[],rocks:[],collisions:[]};
    const treeCount=isPath(symbol)?(symbol==="C"?1:2):(symbol==="L"?0:5+Math.floor(hash(LEVEL.seed,col,row)*4));
    for(let i=0;i<treeCount;i++){
     const x=center.x+(hash(LEVEL.seed,col,row,i*2)-.5)*6.7,z=center.z+(hash(LEVEL.seed+9,col,row,i*2+1)-.5)*6.7;
     if(isPath(symbol)&&Math.abs(x-center.x)<2.25)continue;
     const scale=.8+hash(LEVEL.seed+31,col,row,i)*.45;
     data.trunks.push({x,y:1.5*scale,z,sx:scale,sy:scale,sz:scale});data.crowns.push({x,y:3.35*scale,z,sx:scale,sy:scale,sz:scale});data.collisions.push({x,z,r:.55*scale});
    }
    const flowerCount=symbol==="L"?0:(isPath(symbol)?3:6);
    for(let i=0;i<flowerCount;i++)data.flowers.push({x:center.x+(hash(LEVEL.seed+53,col,row,i)-.5)*7,y:.22,z:center.z+(hash(LEVEL.seed+71,col,row,i)-.5)*7});
    const rockCount=symbol==="R"?10:(symbol==="F"?2:0);
    for(let i=0;i<rockCount;i++){const s=.45+hash(LEVEL.seed+91,col,row,i)*.75;data.rocks.push({x:center.x+(hash(LEVEL.seed+101,col,row,i)-.5)*6.5,y:.3*s,z:center.z+(hash(LEVEL.seed+121,col,row,i)-.5)*6.5,sx:s,sy:s*.65,sz:s});}
    const chunkKey=key(col,row);chunks.set(chunkKey,data);collisionByChunk.set(chunkKey,data.collisions);stats.createdChunks++;stats.lastChunkBuildMs=+(performance.now()-started).toFixed(2);
   }
   function removeChunk(chunkKey){if(!chunks.has(chunkKey))return;chunks.delete(chunkKey);collisionByChunk.delete(chunkKey);stats.disposedChunks++;}
   function rebuildVisible(centerCol,centerRow){
    const placements={grass:[],path:[],water:[],trunk:[],crown:[],flower:[],rock:[]};let visibleChunks=0;
    chunks.forEach(data=>{
     if(Math.abs(data.col-centerCol)>VISIBLE_RADIUS||Math.abs(data.row-centerRow)>VISIBLE_RADIUS)return;
     visibleChunks++;placements[data.floor].push({x:data.center.x,y:-.12,z:data.center.z});placements.trunk.push(...data.trunks);placements.crown.push(...data.crowns);placements.flower.push(...data.flowers);placements.rock.push(...data.rocks);
    });
    Object.entries(batches).forEach(([name,batch])=>writeBatch(batch,placements[name]));
    stats.visibleChunks=visibleChunks;stats.treeInstances=placements.trunk.length;stats.flowerInstances=placements.flower.length;stats.rockInstances=placements.rock.length;
   }

   const animalSpots=[
    {x:-12,z:92,species:"deer",turn:.2},{x:12,z:76,species:"fox",turn:-.7},{x:-56,z:8,species:"wolf",turn:1.1},
    {x:44,z:-12,species:"deer",turn:-1.5},{x:-72,z:-72,species:"fox",turn:.8},{x:76,z:-84,species:"wolf",turn:2.4}
   ];
   const animalRoot=new THREE.Group();animalRoot.name="forest-animal-landmarks";root.add(animalRoot);
   const residents=animalSpots.map((spot,index)=>{
    const group=new THREE.Group();group.name=`forest-${spot.species}-${index}`;group.position.set(spot.x,0,spot.z);group.rotation.y=spot.turn;group.visible=false;animalRoot.add(group);
    const fallback=new THREE.Group();fallback.name="primitive-fallback";group.add(fallback);
    const body=new THREE.Mesh(geos.animalBody,spot.species==="wolf"?mats.white:mats.brown);body.position.set(0,.75,0);body.scale.set(spot.species==="deer"?1.2:1,.8,1.1);fallback.add(body);
    const head=new THREE.Mesh(geos.animalHead,spot.species==="fox"?mats.orange:mats.brown);head.position.set(0,1.35,-.38);fallback.add(head);
    return {...spot,group,fallback,model:null,near:false};
   });
   stats.animalCount=residents.length;
   function installModel(resident,asset){
    if(resident.model)return;const model=new THREE.Mesh(asset.geometry,asset.material);model.name=`quaternius-${resident.species}`;model.scale.setScalar(.45);model.position.y=.01;model.castShadow=false;model.receiveShadow=false;resident.group.add(model);resident.model=model;resident.fallback.visible=false;
   }
   function ensureModel(species){
    if(modelAssets.has(species)){residents.filter(item=>item.species===species).forEach(item=>installModel(item,modelAssets.get(species)));return}
    if(modelPromises.has(species)||failedModels.has(species))return;
    if(!window.QuaterniusForestAnimals){failedModels.add(species);stats.assetErrors.push(`${species}: model loader unavailable`);return}
    const promise=window.QuaterniusForestAnimals.load(THREE,species).then(asset=>{
     modelPromises.delete(species);if(destroyed){asset.dispose();return}modelAssets.set(species,asset);stats.loadedAssetIds.push(`quaternius-${species}`);residents.filter(item=>item.species===species).forEach(item=>installModel(item,asset));
    }).catch(error=>{modelPromises.delete(species);failedModels.add(species);stats.assetErrors.push(`${species}: ${error.message}`)});
    modelPromises.set(species,promise);
   }
   function updateAnimals(playerX,playerZ){
    let visible=0,models=0;
    residents.forEach(resident=>{
     const distance=Math.hypot(playerX-resident.x,playerZ-resident.z);
     resident.near=resident.near?distance<23:distance<18;resident.group.visible=resident.near;
     if(resident.near){visible++;ensureModel(resident.species);if(resident.model)models++;}
    });
    stats.visibleAnimals=visible;stats.animalInstances=visible;stats.animalModelDrawCalls=models;
   }
   function update(playerX,playerZ){
    const col=Math.max(0,Math.min(CHUNK_COLS-1,Math.floor((playerX+HALF)/LEVEL.cell))),row=Math.max(0,Math.min(CHUNK_ROWS-1,Math.floor((playerZ+HALF)/LEVEL.cell)));
    updateAnimals(playerX,playerZ);
    const centerKey=key(col,row);if(centerKey===lastCenterKey)return;lastCenterKey=centerKey;
    const wanted=new Set(),candidates=[];
    for(let dz=-KEEP_RADIUS;dz<=KEEP_RADIUS;dz++)for(let dx=-KEEP_RADIUS;dx<=KEEP_RADIUS;dx++){
     const x=col+dx,z=row+dz;if(x>=0&&x<CHUNK_COLS&&z>=0&&z<CHUNK_ROWS)candidates.push({col:x,row:z,d:dx*dx+dz*dz});
    }
    candidates.sort((a,b)=>a.d-b.d).forEach(item=>{const chunkKey=key(item.col,item.row);wanted.add(chunkKey);if(!chunks.has(chunkKey))buildChunk(item.col,item.row)});
    [...chunks.keys()].forEach(chunkKey=>{if(!wanted.has(chunkKey))removeChunk(chunkKey)});
    stats.activeChunks=chunks.size;rebuildVisible(col,row);
   }
   function canWalk(x,z){
    if(x<-HALF+.35||x>HALF-.35||z<-HALF+.35||z>HALF-.35)return false;update(x,z);
    const col=Math.floor((x+HALF)/LEVEL.cell),row=Math.floor((z+HALF)/LEVEL.cell);if(symbolAt(col,row)==="L")return false;
    return !(collisionByChunk.get(key(col,row))||[]).some(tree=>Math.hypot(x-tree.x,z-tree.z)<tree.r);
   }
   update(CONFIG.spawn.x,CONFIG.spawn.z);
   return {
    root,config:CONFIG,update,canWalk,
    metadata:{...window.worldFactories.forest.metadata,maxActiveChunks:MAX_ACTIVE_CHUNKS,maxVisibleChunks:MAX_VISIBLE_CHUNKS,totalChunks:CHUNK_COLS*CHUNK_ROWS,chunkSize:LEVEL.cell,generationLookAheadUnits:VISIBLE_RADIUS*LEVEL.cell,animalShowDistance:18,drawCallBudget:140,instanceBudgetPerActiveSet:4200},
    debug(){return {...stats,maxActiveChunks:MAX_ACTIVE_CHUNKS,maxVisibleChunks:MAX_VISIBLE_CHUNKS,totalChunks:CHUNK_COLS*CHUNK_ROWS,chunkSize:LEVEL.cell,generationLookAheadUnits:VISIBLE_RADIUS*LEVEL.cell,animalShowDistance:18,animalHideDistance:23,seed:LEVEL.seed,worldSize:`${LEVEL.width}x${LEVEL.depth}`,activeChunkKeys:[...chunks.keys()]};},
    destroy(){destroyed=true;scene.remove(root);Object.values(batches).forEach(batch=>batch.dispose?.());chunks.clear();collisionByChunk.clear();modelAssets.forEach(asset=>asset.dispose());modelAssets.clear();resources.forEach(item=>item.dispose?.())}
   };
  }
 };
})();
