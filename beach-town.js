// Low-cost beach town edge: reusable geometry, instanced details, and pooled traffic.
(function(){
 "use strict";
 window.createBeachTown=function(THREE){
  const root=new THREE.Group();root.name="beach-town";
  const resources=new Set(),collisions=[],matrix=new THREE.Matrix4();
  const own=value=>(resources.add(value),value),box=own(new THREE.BoxGeometry(1,1,1));
  const material=color=>own(new THREE.MeshLambertMaterial({color}));
  const mats={road:material(0x414a55),walk:material(0xd6d0c3),line:material(0xffdb5c),white:material(0xfff6de),coral:material(0xff8176),aqua:material(0x43bfc1),pink:material(0xf28fbd),yellow:material(0xffcf58),blue:material(0x6aa8d8),glass:material(0xbceaff),door:material(0x357b8b)};
  function mesh(mat,x,y,z,sx,sy,sz,parent=root){const object=new THREE.Mesh(box,mat);object.position.set(x,y,z);object.scale.set(sx,sy,sz);object.receiveShadow=object.castShadow=false;parent.add(object);return object}
  mesh(mats.road,0,.025,28,80,.1,10);
  const sidewalks=new THREE.InstancedMesh(box,mats.walk,2);
  [21.9,34.1].forEach((z,i)=>{matrix.compose(new THREE.Vector3(0,.09,z),new THREE.Quaternion(),new THREE.Vector3(80,.18,2.2));sidewalks.setMatrixAt(i,matrix)});sidewalks.instanceMatrix.needsUpdate=true;sidewalks.computeBoundingSphere();root.add(sidewalks);
  const dashCount=15,dashes=new THREE.InstancedMesh(box,mats.line,dashCount);
  for(let i=0;i<dashCount;i++){matrix.compose(new THREE.Vector3(-36.4+i*5.2,.1,28),new THREE.Quaternion(),new THREE.Vector3(2.7,.035,.18));dashes.setMatrixAt(i,matrix)}
  dashes.instanceMatrix.needsUpdate=true;dashes.computeBoundingSphere();root.add(dashes);
  const BUILDINGS=[
   {id:"seashell-hotel",x:-32,z:37,w:12,d:6,h:13,mat:mats.coral},{id:"ice-cream-shop",x:-18,z:37,w:10,d:6,h:7,mat:mats.pink},
   {id:"ocean-outfitters",x:18,z:37,w:11,d:6,h:8,mat:mats.aqua},{id:"sunset-inn",x:32,z:37,w:12,d:6,h:14,mat:mats.blue}
  ],windows=[],doors=[],signs=[],awnings=[];
  BUILDINGS.forEach(building=>{
   const group=new THREE.Group();group.name=building.id;root.add(group);
   mesh(building.mat,building.x,building.h/2,building.z,building.w,building.h,building.d,group);
   signs.push({x:building.x,y:2.85,z:building.z-building.d/2-.16,w:building.w*.72});
   awnings.push({x:building.x,y:2.28,z:building.z-building.d/2-.38,w:building.w*.78});
   doors.push({x:building.x,y:1.05,z:building.z-building.d/2-.13});
   const columns=Math.max(2,Math.floor(building.w/2.5)),rows=Math.max(1,Math.floor((building.h-4)/2.4));
   for(let row=0;row<rows;row++)for(let column=0;column<columns;column++)windows.push({x:building.x-building.w*.36+column*(building.w*.72/(columns-1)),y:4.2+row*2.15,z:building.z-building.d/2-.13});
   collisions.push({id:building.id,minX:building.x-building.w/2,maxX:building.x+building.w/2,minZ:building.z-building.d/2,maxZ:building.z+building.d/2});
  });
  const windowMesh=new THREE.InstancedMesh(box,mats.glass,windows.length),doorMesh=new THREE.InstancedMesh(box,mats.door,doors.length),signMesh=new THREE.InstancedMesh(box,mats.white,signs.length),awningMesh=new THREE.InstancedMesh(box,mats.coral,awnings.length);
  windows.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion(),new THREE.Vector3(1.15,1.15,.16));windowMesh.setMatrixAt(i,matrix)});
  doors.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion(),new THREE.Vector3(1.35,2.1,.18));doorMesh.setMatrixAt(i,matrix)});
  signs.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion(),new THREE.Vector3(p.w,.65,.24));signMesh.setMatrixAt(i,matrix)});
  awnings.forEach((p,i)=>{matrix.compose(new THREE.Vector3(p.x,p.y,p.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(.13,0,0)),new THREE.Vector3(p.w,.16,1.25));awningMesh.setMatrixAt(i,matrix)});
  [windowMesh,doorMesh,signMesh,awningMesh].forEach(instanced=>{instanced.instanceMatrix.needsUpdate=true;instanced.computeBoundingSphere();root.add(instanced)});
  const traffic=window.CityCarSystem?new window.CityCarSystem(THREE,{maxCars:4,minDelay:1.8,maxDelay:3.6,lanes:[
   {id:"beach-eastbound",start:{x:-42,z:25.5},end:{x:42,z:25.5},speedMin:6,speedMax:8.5,fadeDistance:9},
   {id:"beach-westbound",start:{x:42,z:30.5},end:{x:-42,z:30.5},speedMin:6,speedMax:8.5,fadeDistance:9}
  ]}):null;
  if(traffic)root.add(traffic.root);
  let active=false;
  function update(dt,isActive,camera){if(Boolean(isActive)!==active){active=Boolean(isActive);traffic?.setEnabled(active)}if(active)traffic?.update(dt,camera?.position)}
  function debug(){return{size:80,buildingCount:BUILDINGS.length,windowInstances:windows.length,traffic:traffic?.metrics()||null,collisionCount:collisions.length,estimatedDrawCalls:traffic?35:11}}
  function dispose(){traffic?.destroy();root.removeFromParent();resources.forEach(resource=>resource.dispose());resources.clear()}
  return{group:root,collisions,update,debug,dispose,destroy:dispose};
 };
})();
