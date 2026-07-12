(function(){
 "use strict";
 window.worldFactories=window.worldFactories||{};

 // Keep this embedded fallback aligned with forest-level.txt. The parser is
 // public so tooling can preview/validate the same compact level language.
 const LEVEL_TEMPLATE=`
name: Whimsy Forest
size: 80x80
cell: 8
seed: 73421
spawn: 4,8
legend: F=forest P=path C=clearing L=lake G=glen R=rock-garden
map:
FFFFPFFFFF
FFCFPFFGFF
FFFFPFFFFF
FPPPPPPPFF
FPFFPFFPFF
FPFCCCFRFF
FPFCPCFFFF
FPPPPPPPLF
FFFFPFFFFF
FFFFPFFFFF`;

 function parseLevel(text){
  const lines=text.trim().split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
  const values={},map=[];let readingMap=false;
  for(const line of lines){
   if(line==="map:"){readingMap=true;continue}
   if(readingMap){map.push(line);continue}
   const split=line.indexOf(":");if(split>0)values[line.slice(0,split).trim()]=line.slice(split+1).trim();
  }
  const [width,depth]=(values.size||"80x80").split("x").map(Number);
  const [spawnCol,spawnRow]=(values.spawn||"5,8").split(",").map(Number);
  return {name:values.name||"Forest",width,depth,cell:Number(values.cell)||8,seed:Number(values.seed)||1,spawnCol,spawnRow,map};
 }
 const LEVEL=parseLevel(LEVEL_TEMPLATE),HALF=LEVEL.width/2;
 const CONFIG={size:LEVEL.width,halfSize:HALF,spawn:cellCenter(LEVEL.spawnCol,LEVEL.spawnRow),camera:{angle:.28,height:12,distance:18}};
 function cellCenter(col,row){return {x:-HALF+col*LEVEL.cell+LEVEL.cell/2,z:-HALF+row*LEVEL.cell+LEVEL.cell/2}}
 function hash(seed,a,b,c=0){let n=(seed^Math.imul(a+101,374761393)^Math.imul(b+137,668265263)^Math.imul(c+17,2246822519))>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}

 window.forestLevel={parse:parseLevel,template:LEVEL_TEMPLATE,level:LEVEL};
 window.worldFactories.forest={
  metadata:{id:"forest",label:LEVEL.name,size:{width:LEVEL.width,depth:LEVEL.depth},lazy:true,levelTemplate:"forest-level.txt",seed:LEVEL.seed},
  create(scene){
   const root=new THREE.Group();root.name="forest-world";scene.add(root);
   const resources=[],chunks=new Map(),collisionByChunk=new Map();
   const stats={activeChunks:0,createdChunks:0,disposedChunks:0,treeInstances:0,flowerInstances:0,rockInstances:0,animalInstances:0,animalCount:0,lastChunkBuildMs:0};
   const material=(color,options={})=>{const value=new THREE.MeshLambertMaterial({color,...options});resources.push(value);return value};
   const geometry=value=>{resources.push(value);return value};
   const mats={grass:material(0x78bd63),path:material(0xd8bb7b),water:material(0x58b9ce,{transparent:true,opacity:.78}),trunk:material(0x815638),leaf:material(0x398d55),flower:material(0xff79ad),rock:material(0x87939a),brown:material(0x9b6547),white:material(0xfff4dd),orange:material(0xe8793d),black:material(0x252934)};
   const geos={ground:geometry(new THREE.BoxGeometry(LEVEL.cell,.22,LEVEL.cell)),trunk:geometry(new THREE.CylinderGeometry(.24,.36,3,6)),crown:geometry(new THREE.DodecahedronGeometry(1.25,0)),flower:geometry(new THREE.SphereGeometry(.13,5,4)),rock:geometry(new THREE.DodecahedronGeometry(.48,0)),animalBody:geometry(new THREE.SphereGeometry(.5,7,5)),animalHead:geometry(new THREE.SphereGeometry(.32,7,5))};
   const matrix=new THREE.Matrix4(),quat=new THREE.Quaternion();
   const key=(col,row)=>`${col},${row}`;
   const symbolAt=(col,row)=>LEVEL.map[row]?.[col]||"F";
   const isPath=symbol=>symbol==="P"||symbol==="C"||symbol==="G";

   function makeInstances(geo,mat,placements,kind,parent){
    if(!placements.length)return;
    const mesh=new THREE.InstancedMesh(geo,mat,placements.length);mesh.name=`forest-${kind}`;
    placements.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),quat,new THREE.Vector3(p.sx||1,p.sy||1,p.sz||1));mesh.setMatrixAt(i,matrix)});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);stats[`${kind}Instances`]+=placements.length;
   }
   function buildChunk(col,row){
    const started=performance.now(),symbol=symbolAt(col,row),center=cellCenter(col,row),group=new THREE.Group();group.name=`forest-chunk-${col}-${row}`;root.add(group);
    const floor=new THREE.Mesh(geos.ground,symbol==="L"?mats.water:(isPath(symbol)?mats.path:mats.grass));floor.position.set(center.x,-.12,center.z);floor.receiveShadow=false;group.add(floor);
    const trunks=[],crowns=[],flowers=[],rocks=[],collisions=[];
    const treeCount=isPath(symbol)?(symbol==="C"?1:2):(symbol==="L"?0:5+Math.floor(hash(LEVEL.seed,col,row)*4));
    for(let i=0;i<treeCount;i++){
     const x=center.x+(hash(LEVEL.seed,col,row,i*2)-.5)*6.7,z=center.z+(hash(LEVEL.seed+9,col,row,i*2+1)-.5)*6.7;
     // Leave a broad corridor through path chunks.
     if(isPath(symbol)&&Math.abs(x-center.x)<2.25)continue;
     const scale=.8+hash(LEVEL.seed+31,col,row,i)*.45;
     trunks.push({x,y:1.5*scale,z,sx:scale,sy:scale,sz:scale});crowns.push({x,y:3.35*scale,z,sx:scale,sy:scale,sz:scale});collisions.push({x,z,r:.55*scale});
    }
    const flowerCount=symbol==="L"?0:(isPath(symbol)?3:6);
    for(let i=0;i<flowerCount;i++)flowers.push({x:center.x+(hash(LEVEL.seed+53,col,row,i)-.5)*7,y:.22,z:center.z+(hash(LEVEL.seed+71,col,row,i)-.5)*7});
    const rockCount=symbol==="R"?10:(symbol==="F"?2:0);
    for(let i=0;i<rockCount;i++){const s=.45+hash(LEVEL.seed+91,col,row,i)*.75;rocks.push({x:center.x+(hash(LEVEL.seed+101,col,row,i)-.5)*6.5,y:.3*s,z:center.z+(hash(LEVEL.seed+121,col,row,i)-.5)*6.5,sx:s,sy:s*.65,sz:s});}
    makeInstances(geos.trunk,mats.trunk,trunks,"tree",group);makeInstances(geos.crown,mats.leaf,crowns,"tree",group);makeInstances(geos.flower,mats.flower,flowers,"flower",group);makeInstances(geos.rock,mats.rock,rocks,"rock",group);
    chunks.set(key(col,row),group);collisionByChunk.set(key(col,row),collisions);stats.createdChunks++;stats.activeChunks=chunks.size;stats.lastChunkBuildMs=+(performance.now()-started).toFixed(2);
   }
   function removeChunk(chunkKey){const chunk=chunks.get(chunkKey);if(!chunk)return;root.remove(chunk);chunks.delete(chunkKey);collisionByChunk.delete(chunkKey);stats.disposedChunks++;stats.activeChunks=chunks.size;}
   function update(playerX,playerZ){
    const col=Math.max(0,Math.min(9,Math.floor((playerX+HALF)/LEVEL.cell))),row=Math.max(0,Math.min(9,Math.floor((playerZ+HALF)/LEVEL.cell))),wanted=new Set();
    const candidates=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const x=col+dx,z=row+dz;if(x>=0&&x<10&&z>=0&&z<10)candidates.push({col:x,row:z,d:dx*dx+dz*dz})}
    candidates.sort((a,b)=>a.d-b.d).forEach(item=>{const chunkKey=key(item.col,item.row);wanted.add(chunkKey);if(!chunks.has(chunkKey))buildChunk(item.col,item.row)});
    [...chunks.keys()].forEach(chunkKey=>{if(!wanted.has(chunkKey))removeChunk(chunkKey)});
    stats.treeInstances=stats.flowerInstances=stats.rockInstances=0;
    chunks.forEach(chunk=>chunk.traverse(obj=>{if(!obj.isInstancedMesh)return;if(obj.name==="forest-tree")stats.treeInstances+=obj.count;else if(obj.name==="forest-flower")stats.flowerInstances+=obj.count;else if(obj.name==="forest-rock")stats.rockInstances+=obj.count;}));
   }
   function canWalk(x,z){
    if(x<-HALF+.35||x>HALF-.35||z<-HALF+.35||z>HALF-.35)return false;update(x,z);
    const col=Math.floor((x+HALF)/LEVEL.cell),row=Math.floor((z+HALF)/LEVEL.cell);if(symbolAt(col,row)==="L")return false;
    return !(collisionByChunk.get(key(col,row))||[]).some(tree=>Math.hypot(x-tree.x,z-tree.z)<tree.r);
   }
   // Six friendly forest residents are landmark NPCs rather than chunk-owned
   // objects, so they never pop out while the player approaches a clearing.
   const animalSpots=[[-20,-28],[-12,4],[4,4],[12,4],[20,-20],[28,20]];
   const animalBodies=animalSpots.map(([x,z],i)=>({x,y:.75,z,sx:i===3?1.3:1,sy:.8,sz:1.1}));
   const animalHeads=animalSpots.map(([x,z],i)=>({x,y:1.35,z:z-.38,sx:i===1?.82:1,sy:1,sz:1}));
   makeInstances(geos.animalBody,mats.brown,animalBodies,"animal",root);makeInstances(geos.animalHead,mats.orange,animalHeads,"animal",root);stats.animalCount=animalSpots.length;
   update(CONFIG.spawn.x,CONFIG.spawn.z);
   return {
    root,config:CONFIG,update,canWalk,
    metadata:{...window.worldFactories.forest.metadata,maxActiveChunks:9,chunkSize:LEVEL.cell,drawCallBudget:32,instanceBudgetPerActiveSet:260},
    debug(){return {...stats,maxActiveChunks:9,chunkSize:LEVEL.cell,seed:LEVEL.seed,worldSize:`${LEVEL.width}x${LEVEL.depth}`,activeChunkKeys:[...chunks.keys()]};},
    destroy(){scene.remove(root);chunks.clear();collisionByChunk.clear();resources.forEach(item=>item.dispose?.())}
   };
  }
 };
})();
