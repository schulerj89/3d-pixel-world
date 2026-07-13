// Lightweight house facade and exterior interaction anchors. The surrounding
// city can be supplied independently through window.createHouseCity.
(function(root){
 "use strict";
 const geometry=Object.freeze({bounds:Object.freeze({minX:-12,maxX:12,minZ:-12.5,maxZ:7.5}),skinThickness:.08,skinReveal:.01,frontSkinZ:7.55,backSkinZ:-12.55,westSkinX:-12.05,eastSkinX:12.05,frontRuns:Object.freeze([Object.freeze({start:-12,end:-2}),Object.freeze({start:2,end:12})]),entranceWidth:4,doorWidth:3.5});
 root.HouseExteriorGeometry=geometry;
 root.createHouseExterior=function(THREE){
  const group=new THREE.Group();group.name="house-exterior";
  const resources=[];
  const material=color=>{const value=new THREE.MeshStandardMaterial({color,roughness:.9});resources.push(value);return value};
  const texturedWall=(width,height)=>{
   const value=window.HouseWallMaterials?.create("exterior",{width,height,renderer:window.R})||material(0x8e887d);
   if(!resources.includes(value))resources.push(value);return value;
  };
  const wall=texturedWall(10,5),sideWall=texturedWall(20,5),backWall=texturedWall(24,5),trim=material(0xf4efe7),doorMat=material(0x456f82),wood=material(0x7a5138),metal=material(0x527080),green=material(0x75b96e);
  const box=(w,h,d,mat,x,y,z,parent=group)=>{const geometry=new THREE.BoxGeometry(w,h,d);resources.push(geometry);const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh};
  // The larger shell grows backward so the facade remains safely separated
  // from the existing sidewalk and road. Cladding covers every outer face.
  for(const run of geometry.frontRuns)box(run.end-run.start,5,geometry.skinThickness,wall,(run.start+run.end)/2,2.5,geometry.frontSkinZ);
  box(4,1.05,geometry.skinThickness,texturedWall(4,1.05),0,4.48,geometry.frontSkinZ);box(4,.18,.65,trim,0,3.91,7.58);
  box(geometry.skinThickness,5,20,sideWall,geometry.westSkinX,2.5,-2.5);box(geometry.skinThickness,5,20,sideWall,geometry.eastSkinX,2.5,-2.5);
  box(24,5,geometry.skinThickness,backWall,0,2.5,geometry.backSkinZ);
  const door=box(geometry.doorWidth,3.75,.12,doorMat,0,1.88,7.62);door.name="house-front-door";door.userData.actionAnchor={x:0,y:2.15,z:0};
  box(.18,3.75,.18,trim,-1.91,1.88,7.58);box(.18,3.75,.18,trim,1.91,1.88,7.58);
  box(.13,.13,.18,metal,.72,1.95,.14,door);
  box(4.5,.22,2.2,wood,0,.08,8.45);box(2.3,.1,6.2,trim,0,.02,12.4);
  const mailbox=new THREE.Group();mailbox.name="house-mailbox";mailbox.position.set(-6,0,11.1);group.add(mailbox);
  box(.18,1.55,.18,wood,0,.77,0,mailbox);box(1.15,.72,.72,metal,0,1.62,0,mailbox);
  box(.08,.75,.08,doorMat,.62,1.78,0,mailbox);box(.42,.1,.28,doorMat,.78,2.1,0,mailbox);mailbox.userData.actionAnchor={x:0,y:2.5,z:0};
  box(24,.08,7.5,green,0,-.02,11.25);
  function dispose(){group.parent?.remove(group);resources.forEach(item=>item.dispose?.())}
  return {group,door,mailbox,interiorSpawn:{x:0,z:5.5},exteriorSpawn:{x:0,z:9.5},dispose};
 };
})(typeof window!=="undefined"?window:globalThis);
