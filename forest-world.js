(function(){
 "use strict";
 window.worldFactories=window.worldFactories||{};
 const CONFIG={size:30,halfSize:15,spawn:{x:0,z:12},camera:{angle:.28,height:10,distance:15}};

 window.worldFactories.forest={
  metadata:{id:"forest",label:"Whimsy Forest",size:{width:30,depth:30},lazy:true},
  create(scene){
   const root=new THREE.Group();root.name="forest-world";scene.add(root);
   const resources=[];
   const material=(color,options={})=>{const value=new THREE.MeshStandardMaterial({color,roughness:1,...options});resources.push(value);return value};
   const geometry=value=>{resources.push(value);return value};
   const add=(geo,mat,x,y,z,parent=root)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh};
   const mats={grass:material(0x78bd63),path:material(0xd8bb7b),trunk:material(0x815638),leaf:material(0x398d55),leaf2:material(0x57aa57),rock:material(0x87939a),pink:material(0xff79ad),yellow:material(0xffd85f),white:material(0xfff4dd),brown:material(0x9b6547),orange:material(0xe8793d),gray:material(0x9da5a8),black:material(0x252934)};
   const ground=add(geometry(new THREE.BoxGeometry(30,.25,30)),mats.grass,0,-.13,0);ground.receiveShadow=true;
   add(geometry(new THREE.PlaneGeometry(4.2,27)),mats.path,0,.015,1).rotation.x=-Math.PI/2;
   add(geometry(new THREE.CircleGeometry(5.1,24)),mats.path,0,.025,-2).rotation.x=-Math.PI/2;

   const treeSpots=[[-12,-12],[-8,-11],[-4,-12],[5,-12],[9,-11],[13,-12],[-13,-7],[-9,-6],[10,-7],[13,-5],[-13,0],[-10,3],[11,1],[13,4],[-13,8],[-9,10],[-5,12],[6,11],[10,9],[13,12],[-7,5],[8,5]];
   const trunkGeo=geometry(new THREE.CylinderGeometry(.28,.42,3.4,7)),crownGeo=geometry(new THREE.DodecahedronGeometry(1.45,0));
   const trunks=new THREE.InstancedMesh(trunkGeo,mats.trunk,treeSpots.length),crowns=new THREE.InstancedMesh(crownGeo,mats.leaf,treeSpots.length*2),matrix=new THREE.Matrix4();
   treeSpots.forEach(([x,z],i)=>{matrix.makeTranslation(x,1.7,z);trunks.setMatrixAt(i,matrix);matrix.compose(new THREE.Vector3(x,3.55,z),new THREE.Quaternion(),new THREE.Vector3(1.15,1,1.15));crowns.setMatrixAt(i*2,matrix);matrix.compose(new THREE.Vector3(x+.45,4.35,z-.18),new THREE.Quaternion(),new THREE.Vector3(.72,.72,.72));crowns.setMatrixAt(i*2+1,matrix)});
   trunks.castShadow=crowns.castShadow=false;trunks.receiveShadow=crowns.receiveShadow=false;root.add(trunks,crowns);

   const flowerSpots=[[-6,-5],[-5,-4],[-7,1],[-5,3],[5,-6],[7,-5],[5,3],[7,6],[-6,8],[4,9],[-11,6],[11,-1]];
   const stems=new THREE.InstancedMesh(geometry(new THREE.CylinderGeometry(.035,.045,.45,5)),mats.leaf2,flowerSpots.length),blooms=new THREE.InstancedMesh(geometry(new THREE.SphereGeometry(.16,6,4)),mats.pink,flowerSpots.length);
   flowerSpots.forEach(([x,z],i)=>{matrix.makeTranslation(x,.23,z);stems.setMatrixAt(i,matrix);matrix.makeTranslation(x,.5,z);blooms.setMatrixAt(i,matrix)});stems.castShadow=blooms.castShadow=false;root.add(stems,blooms);
   [[-8,-2,.7],[8,-2,.55],[-4,7,.45],[4,-9,.6],[10,11,.5]].forEach(([x,z,s])=>{const rock=add(geometry(new THREE.DodecahedronGeometry(s,0)),mats.rock,x,s*.55,z);rock.scale.y=.65});

   function part(parent,geo,mat,x,y,z){return add(geo,mat,x,y,z,parent)}
   const animalGeos={body:geometry(new THREE.SphereGeometry(.55,8,6)),head:geometry(new THREE.SphereGeometry(.38,8,6)),leg:geometry(new THREE.CylinderGeometry(.09,.11,.65,6)),ear:geometry(new THREE.ConeGeometry(.13,.42,5)),tail:geometry(new THREE.ConeGeometry(.16,.6,6)),eye:geometry(new THREE.SphereGeometry(.045,5,4))};
   function animal({species,x,z,pose="stand",turn=0,color=mats.brown}){
    const npc=new THREE.Group(),resting=pose==="rest",sitting=pose==="sit",bodyY=resting?.48:sitting?.72:1.05;
    const body=part(npc,animalGeos.body,color,0,bodyY,0);body.scale.set(species==="bear"?1.3:1.05,resting?.62:.82,species==="deer"?1.35:1);
    const head=part(npc,animalGeos.head,color,0,bodyY+(resting?.18:.65),-.55);head.scale.set(species==="rabbit"?.8:1,species==="deer"?1.12:1,1);
    [-.22,.22].forEach(ex=>{const ear=part(npc,animalGeos.ear,color,ex,bodyY+(resting?.47:1.12),-.58);if(species==="bear")ear.scale.set(1,.45,1)});
    if(!resting)[-.3,.3].forEach(lx=>[-.2,.25].forEach(lz=>{const leg=part(npc,animalGeos.leg,color,lx,sitting?.35:.42,lz);if(sitting)leg.rotation.x=Math.PI/2}));
    const tail=part(npc,animalGeos.tail,species==="fox"?0:.35,bodyY+.1,.56);tail.rotation.x=Math.PI/2;tail.scale.setScalar(species==="fox"?1.4:.65);
    [-.14,.14].forEach(ex=>part(npc,animalGeos.eye,mats.black,ex,bodyY+(resting?.22:.72),-.9));
    npc.position.set(x,0,z);npc.rotation.y=turn;npc.userData={npc:true,species,pose};npc.traverse(obj=>{if(obj.isMesh)obj.castShadow=false});root.add(npc);
   }
   [
    {species:"deer",x:-4,z:-2,pose:"stand",turn:.5,color:mats.brown},
    {species:"rabbit",x:4,z:-1,pose:"sit",turn:-.4,color:mats.white},
    {species:"fox",x:-6,z:6,pose:"rest",turn:1.2,color:mats.orange},
    {species:"bear",x:7,z:7,pose:"sit",turn:-1.7,color:mats.brown},
    {species:"rabbit",x:6,z:-7,pose:"stand",turn:2.4,color:mats.gray},
    {species:"deer",x:-7,z:-7,pose:"rest",turn:.2,color:mats.brown}
   ].forEach(animal);

   const blockingTrees=treeSpots.map(([x,z])=>({x,z,r:.72}));
   return {
    root,config:CONFIG,metadata:{...window.worldFactories.forest.metadata,instances:treeSpots.length*3+flowerSpots.length*2,animalCount:6},
    canWalk(x,z){if(x<-14.35||x>14.35||z<-14.35||z>14.35)return false;return !blockingTrees.some(tree=>Math.hypot(x-tree.x,z-tree.z)<tree.r)},
    destroy(){scene.remove(root);root.traverse(obj=>{if(obj.isMesh||obj.isInstancedMesh){obj.geometry?.dispose();if(Array.isArray(obj.material))obj.material.forEach(item=>item.dispose());else obj.material?.dispose()}});resources.forEach(item=>item.dispose?.())}
   };
  }
 };
})();
