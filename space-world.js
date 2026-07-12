(function(){
  window.worldFactories=window.worldFactories||{};
  window.worldFactories.space=function(THREE){
    const group=new THREE.Group();group.name="space-world";
    const resources=[];const geometry=(g)=>{resources.push(g);return g};const material=(m)=>{resources.push(m);return m};
    const mats={ground:material(new THREE.MeshStandardMaterial({color:0x322d59,roughness:.92})),metal:material(new THREE.MeshStandardMaterial({color:0x8793aa,metalness:.45,roughness:.55})),dark:material(new THREE.MeshStandardMaterial({color:0x22263a,roughness:.75})),glow:material(new THREE.MeshBasicMaterial({color:0x70f4ff})),purple:material(new THREE.MeshStandardMaterial({color:0x8b5cf6,roughness:.7})),alien:material(new THREE.MeshStandardMaterial({color:0x72e38c,roughness:.8})),skin:material(new THREE.MeshStandardMaterial({color:0xd7a77f,roughness:.85})),white:material(new THREE.MeshStandardMaterial({color:0xe9f4ff,roughness:.5})),visor:material(new THREE.MeshStandardMaterial({color:0x5bcce8,metalness:.25,roughness:.25}))};
    const box=geometry(new THREE.BoxGeometry(1,1,1)),sphere=geometry(new THREE.SphereGeometry(.5,10,8)),cylinder=geometry(new THREE.CylinderGeometry(.5,.5,1,10)),cone=geometry(new THREE.ConeGeometry(.5,1,10));
    function mesh(g,m,x,y,z,sx=1,sy=1,sz=1,parent=group){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=false;parent.add(o);return o}
    const floor=mesh(box,mats.ground,0,-.15,0,30,.3,30);floor.receiveShadow=true;
    // A compact moon base, landing pads and crystals make the broad 30x30 area readable.
    mesh(cylinder,mats.metal,-8,.15,-6,5,.3,5);mesh(cylinder,mats.dark,8,.12,6,4,.25,4);
    const dome=mesh(sphere,mats.visor,0,1.1,-9,5,2.4,5);dome.material=mats.visor;
    [[-12,-11],[-11,10],[11,-10],[12,11],[-4,9],[5,-4]].forEach(([x,z],i)=>{const crystal=mesh(cone,i%2?mats.glow:mats.purple,x,.8,z,.65,1.6,.65);crystal.rotation.z=(i%3-1)*.12});
    // Decorative star pylons are instanced and shadow-free.
    const stars=new THREE.InstancedMesh(sphere,mats.glow,18),matrix=new THREE.Matrix4();
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=11+(i%3);matrix.compose(new THREE.Vector3(Math.cos(a)*r,2.5+(i%4)*.75,Math.sin(a)*r),new THREE.Quaternion(),new THREE.Vector3(.08,.08,.08));stars.setMatrixAt(i,matrix)}group.add(stars);
    function npc(kind,x,z,sitting=false,turn=0){const n=new THREE.Group(),isAlien=kind==="alien",body=isAlien?mats.purple:mats.white,face=isAlien?mats.alien:mats.skin;
      mesh(box,body,0,sitting?1:1.45,0,.78,.9,.48,n);mesh(sphere,face,0,sitting?1.72:2.2,0,.86,.92,.82,n);
      if(isAlien){mesh(sphere,mats.dark,-.16,sitting?1.82:2.3,.39,.12,.18,.08,n);mesh(sphere,mats.dark,.16,sitting?1.82:2.3,.39,.12,.18,.08,n);mesh(cone,mats.alien,-.2,sitting?2.3:2.78,0,.15,.55,.15,n);mesh(cone,mats.alien,.2,sitting?2.3:2.78,0,.15,.55,.15,n)}
      else mesh(box,mats.visor,0,sitting?1.8:2.28,.39,.58,.28,.08,n);
      [-.48,.48].forEach(ax=>mesh(box,body,ax,sitting?1.15:1.42,0,.2,.75,.22,n));
      [-.22,.22].forEach(lx=>{const leg=mesh(box,body,lx,sitting?.58:.55,sitting?.35:0,.25,.82,.28,n);if(sitting)leg.rotation.x=Math.PI/2});
      if(sitting)mesh(box,mats.metal,0,.42,0,1.25,.14,.7,n);
      n.position.set(x,0,z);n.rotation.y=turn;n.userData.npcType=kind;group.add(n)
    }
    [{k:"alien",x:-6,z:-5},{k:"alien",x:7,z:-6,s:true,t:2.5},{k:"alien",x:-10,z:5,t:1},{k:"astronaut",x:5,z:7},{k:"astronaut",x:9,z:1,s:true,t:-2},{k:"astronaut",x:-3,z:9,t:2.8},{k:"alien",x:2,z:-2,s:true}].forEach(v=>npc(v.k,v.x,v.z,v.s,v.t));
    return {group,bounds:{minX:-14.3,maxX:14.3,minZ:-14.3,maxZ:14.3},spawn:{x:0,z:11},camera:{angle:.25,height:10,distance:15},background:0x090b24,name:"Moonlight Space Station",dispose(){group.parent?.remove(group);resources.forEach(r=>r.dispose?.())}};
  };
})();
