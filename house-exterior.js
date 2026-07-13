// Lightweight house facade and exterior interaction anchors. The surrounding
// city can be supplied independently through window.createHouseCity.
(function(){
 "use strict";
 window.createHouseExterior=function(THREE){
  const group=new THREE.Group();group.name="house-exterior";
  const resources=[];
  const material=color=>{const value=new THREE.MeshStandardMaterial({color,roughness:.9});resources.push(value);return value};
  const wall=material(0xffe5ef),trim=material(0xffffff),doorMat=material(0x6e9fd3),wood=material(0x9b6846),metal=material(0x527080),green=material(0x75b96e);
  const box=(w,h,d,mat,x,y,z,parent=group)=>{const geometry=new THREE.BoxGeometry(w,h,d);resources.push(geometry);const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh};
  // Match the authoritative 24 x 20 interior shell. The facade pieces align
  // with the split south wall and leave a true two-unit doorway at X=-1..1.
  box(11,5,.24,wall,-6.5,2.5,9.88);box(11,5,.24,wall,6.5,2.5,9.88);
  box(2,1.05,.24,wall,0,4.48,9.88);box(2.7,.18,.65,trim,0,3.91,9.98);
  const door=box(2.05,3.75,.18,doorMat,0,1.88,10.04);door.name="house-front-door";door.userData.actionAnchor={x:0,y:2.15,z:0};
  box(.13,.13,.18,metal,.72,1.95,.14,door);
  box(4.5,.22,2.2,wood,0,.08,10.95);box(2.3,.1,6.2,trim,0,.02,14.9);
  const mailbox=new THREE.Group();mailbox.name="house-mailbox";mailbox.position.set(-6,0,13.6);group.add(mailbox);
  box(.18,1.55,.18,wood,0,.77,0,mailbox);box(1.15,.72,.72,metal,0,1.62,0,mailbox);
  box(.08,.75,.08,doorMat,.62,1.78,0,mailbox);box(.42,.1,.28,doorMat,.78,2.1,0,mailbox);mailbox.userData.actionAnchor={x:0,y:2.5,z:0};
  box(24,.08,10,green,0,-.02,14.9);
  function dispose(){group.parent?.remove(group);resources.forEach(item=>item.dispose?.())}
  return {group,door,mailbox,interiorSpawn:{x:0,z:8},exteriorSpawn:{x:0,z:12.6},dispose};
 };
})();
