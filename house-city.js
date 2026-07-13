// Performance-conscious city block surrounding My House.
(function(){
 const CONFIG={size:70,playerRadius:.38,buildingClearance:.18,road:{z:17,width:10},budgets:{drawCalls:18,triangles:12000,instances:180}};
 window.createHouseCity=function(THREE){
  const root=new THREE.Group();root.name="house-city-block";
  const resources=new Set(),collisions=[],matrix=new THREE.Matrix4(),color=new THREE.Color();
  const own=v=>(resources.add(v),v),mat=(c,o={})=>own(new THREE.MeshLambertMaterial({color:c,...o})),geo=(w,h,d)=>own(new THREE.BoxGeometry(w,h,d));
  const add=(g,m,x,y,z)=>{const v=new THREE.Mesh(g,m);v.position.set(x,y,z);v.castShadow=v.receiveShadow=false;root.add(v);return v};
  add(geo(CONFIG.size,.12,CONFIG.size),mat(0x72b55b),0,-.12,0).name="city-grass";
  add(geo(CONFIG.size,.08,CONFIG.road.width),mat(0x424852),0,-.015,CONFIG.road.z).name="city-road";
  const walkMat=mat(0xc8c5bd);add(geo(CONFIG.size,.11,2.2),walkMat,0,.025,10.9);add(geo(CONFIG.size,.11,2.2),walkMat,0,.025,23.1);
  const dashCount=12,dashes=new THREE.InstancedMesh(geo(2.5,.035,.18),mat(0xffdf68),dashCount);
  for(let i=0;i<dashCount;i++){matrix.makeTranslation(-30.25+i*5.5,.055,17);dashes.setMatrixAt(i,matrix)}
  dashes.instanceMatrix.needsUpdate=true;dashes.computeBoundingSphere();root.add(dashes);
  const BUILDINGS=[{x:-27,z:-22,w:10,d:11,h:15,c:0x8296b3},{x:-14,z:-24,w:9,d:9,h:20,c:0xb98579},{x:25,z:-22,w:12,d:10,h:18,c:0x788e86},{x:26,z:1,w:10,d:10,h:23,c:0x9a83a9},{x:-27,z:2,w:9,d:10,h:17,c:0xc29667},{x:27,z:29,w:11,d:8,h:14,c:0x738eac}];
  const buildings=new THREE.Group();buildings.name="city-buildings";root.add(buildings);
  BUILDINGS.forEach((b,i)=>{const building=add(geo(b.w,b.h,b.d),mat(b.c),b.x,b.h/2,b.z);buildings.attach(building);collisions.push({minX:b.x-b.w/2,maxX:b.x+b.w/2,minZ:b.z-b.d/2,maxZ:b.z+b.d/2,id:`city-building-${i+1}`})});
  const transforms=[];BUILDINGS.forEach(b=>{const cols=Math.max(2,Math.floor(b.w/2.1)),rows=Math.max(3,Math.floor(b.h/2.5));for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)transforms.push({x:b.x-b.w*.38+c*(b.w*.76/(cols-1)),y:1.8+r*2.25,z:b.z+b.d/2+.031})});
  const windows=new THREE.InstancedMesh(geo(1.05,1.15,.055),mat(0xbde8ff,{emissive:0x183648,emissiveIntensity:.35}),transforms.length);
  transforms.forEach((p,i)=>{matrix.makeTranslation(p.x,p.y,p.z);windows.setMatrixAt(i,matrix)});windows.instanceMatrix.needsUpdate=true;windows.computeBoundingSphere();root.add(windows);
  const lampPositions=[];for(let x=-28;x<=28;x+=8)lampPositions.push({x,z:10.7},{x,z:23.3});
  const poles=new THREE.InstancedMesh(geo(.12,3.4,.12),mat(0x39424a),lampPositions.length),lamps=new THREE.InstancedMesh(geo(.55,.28,.55),mat(0xffe3a1,{emissive:0xffbf55,emissiveIntensity:.55}),lampPositions.length);
  lampPositions.forEach((p,i)=>{matrix.makeTranslation(p.x,1.7,p.z);poles.setMatrixAt(i,matrix);matrix.makeTranslation(p.x,3.42,p.z);lamps.setMatrixAt(i,matrix)});poles.instanceMatrix.needsUpdate=lamps.instanceMatrix.needsUpdate=true;poles.computeBoundingSphere();lamps.computeBoundingSphere();root.add(poles,lamps);
  const traffic=window.CityCarSystem?new window.CityCarSystem(THREE,{maxCars:10,minDelay:1.25,maxDelay:2.8,lanes:[
   {id:"eastbound",start:{x:-36,z:14.7},end:{x:36,z:14.7},speedMin:5.5,speedMax:8,fadeDistance:8},
   {id:"westbound",start:{x:36,z:19.3},end:{x:-36,z:19.3},speedMin:5.5,speedMax:8,fadeDistance:8}
  ]}):null;
  if(traffic)root.add(traffic.root);
  function canWalk(x,z){const edge=CONFIG.size/2-CONFIG.playerRadius;if(x<-edge||x>edge||z<-edge||z>edge)return false;const p=CONFIG.playerRadius+CONFIG.buildingClearance;return !collisions.some(b=>x>b.minX-p&&x<b.maxX+p&&z>b.minZ-p&&z<b.maxZ+p)}
  function setActive(active){traffic?.setEnabled(active)}
  function update(dt,player,camera){traffic?.update(dt,camera?.position)}
  function debug(){return {size:CONFIG.size,buildingCount:BUILDINGS.length,windowInstances:transforms.length,lampInstances:lampPositions.length,collisionCount:collisions.length,traffic:traffic?.metrics()||null,budgets:{...CONFIG.budgets},estimatedModuleDrawCalls:traffic?75:15,estimatedModuleTriangles:BUILDINGS.length*12+transforms.length*12+lampPositions.length*24+dashCount*12+36+(traffic?1200:0)}}
  function dispose(){traffic?.destroy();root.removeFromParent();resources.forEach(v=>v.dispose());resources.clear()}
  return {group:root,root,config:CONFIG,collisions,exteriorSpawn:{x:0,z:9.5},canWalk,setActive,update,debug,dispose,destroy:dispose};
 };
})();
