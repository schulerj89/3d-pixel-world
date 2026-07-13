(function(){
  window.worldFactories=window.worldFactories||{};
  window.worldFactories.space=function(THREE){
    const group=new THREE.Group();group.name="space-world";
    const resources=[];const geometry=(g)=>{resources.push(g);return g};const material=(m)=>{resources.push(m);return m};
    const mats={ground:material(new THREE.MeshStandardMaterial({color:0x322d59,roughness:.92})),metal:material(new THREE.MeshStandardMaterial({color:0x8793aa,metalness:.45,roughness:.55})),dark:material(new THREE.MeshStandardMaterial({color:0x22263a,roughness:.75})),glow:material(new THREE.MeshBasicMaterial({color:0x70f4ff})),purple:material(new THREE.MeshStandardMaterial({color:0x8b5cf6,roughness:.7})),alien:material(new THREE.MeshStandardMaterial({color:0x72e38c,roughness:.8})),skin:material(new THREE.MeshStandardMaterial({color:0xd7a77f,roughness:.85})),white:material(new THREE.MeshStandardMaterial({color:0xe9f4ff,roughness:.5})),visor:material(new THREE.MeshStandardMaterial({color:0x5bcce8,metalness:.25,roughness:.25}))};
    const box=geometry(new THREE.BoxGeometry(1,1,1)),sphere=geometry(new THREE.SphereGeometry(.5,10,8)),cylinder=geometry(new THREE.CylinderGeometry(.5,.5,1,10)),cone=geometry(new THREE.ConeGeometry(.5,1,10));
    const rockGeometry=geometry(new THREE.DodecahedronGeometry(.5,0)),craterGeometry=geometry(new THREE.TorusGeometry(.5,.13,5,16));
    function mesh(g,m,x,y,z,sx=1,sy=1,sz=1,parent=group){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=false;parent.add(o);return o}
    const floor=mesh(box,mats.ground,0,-.15,0,70,.3,70);floor.receiveShadow=true;
    // Large landmarks break the 70x70 moon field into readable districts.
    [[-23,-22,7],[22,21,6],[-21,20,5],[22,-19,5]].forEach(([x,z,size],i)=>{
      mesh(cylinder,i%2?mats.dark:mats.metal,x,.12,z,size,.25,size);
      mesh(cylinder,mats.glow,x,.27,z,size*.72,.035,size*.72);
    });
    const dome=mesh(sphere,mats.visor,0,1.1,-25,7,3.1,7);dome.material=mats.visor;

    // Repeated surface details are instanced to keep draw calls low on tablets.
    const matrix=new THREE.Matrix4(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
    const rocks=new THREE.InstancedMesh(rockGeometry,mats.dark,72);
    for(let i=0;i<72;i++){
      const a=i*2.399963,r=8+(i*13%27),x=Math.cos(a)*r,z=Math.sin(a)*r,s=.35+(i%7)*.13;
      rotation.setFromEuler(new THREE.Euler((i%5)*.17,(i%11)*.31,(i%3)*.12));scale.set(s*1.35,s,s);
      matrix.compose(new THREE.Vector3(x,s*.32,z),rotation,scale);rocks.setMatrixAt(i,matrix)
    }rocks.instanceMatrix.needsUpdate=true;rocks.castShadow=rocks.receiveShadow=false;group.add(rocks);
    const craters=new THREE.InstancedMesh(craterGeometry,mats.dark,20);
    for(let i=0;i<20;i++){
      const a=i*1.73,r=10+(i*9%23),s=1.2+(i%5)*.42;
      rotation.setFromEuler(new THREE.Euler(Math.PI/2,0,(i%4)*.25));scale.set(s,1,s*.72);
      matrix.compose(new THREE.Vector3(Math.cos(a)*r,.025,Math.sin(a)*r),rotation,scale);craters.setMatrixAt(i,matrix)
    }craters.instanceMatrix.needsUpdate=true;craters.castShadow=craters.receiveShadow=false;group.add(craters);
    [mats.glow,mats.purple].forEach((crystalMaterial,colorIndex)=>{
      const crystals=new THREE.InstancedMesh(cone,crystalMaterial,18);
      for(let i=0;i<18;i++){
        const n=i*2+colorIndex,a=n*2.17,r=12+(n*7%21),s=.5+(n%4)*.13;
        rotation.setFromEuler(new THREE.Euler(0,a,(n%3-1)*.14));scale.set(s,1.3+s,s);
        matrix.compose(new THREE.Vector3(Math.cos(a)*r,.65,Math.sin(a)*r),rotation,scale);crystals.setMatrixAt(i,matrix)
      }crystals.instanceMatrix.needsUpdate=true;crystals.castShadow=crystals.receiveShadow=false;group.add(crystals)
    });
    // Beacon lights mark the outer traversal ring.
    const beaconPosts=new THREE.InstancedMesh(cylinder,mats.metal,16),beaconLights=new THREE.InstancedMesh(sphere,mats.glow,16);
    for(let i=0;i<16;i++){
      const a=i/16*Math.PI*2,x=Math.cos(a)*30,z=Math.sin(a)*30;
      rotation.identity();matrix.compose(new THREE.Vector3(x,.8,z),rotation,new THREE.Vector3(.16,1.6,.16));beaconPosts.setMatrixAt(i,matrix);
      matrix.compose(new THREE.Vector3(x,1.7,z),rotation,new THREE.Vector3(.24,.24,.24));beaconLights.setMatrixAt(i,matrix)
    }beaconPosts.instanceMatrix.needsUpdate=true;beaconLights.instanceMatrix.needsUpdate=true;group.add(beaconPosts,beaconLights);
    // Simple satellites and communication dishes add distinct silhouettes.
    [[-11,-17],[13,-13],[-16,8],[15,12]].forEach(([x,z],i)=>{
      mesh(cylinder,mats.metal,x,1,z,.3,2,.3);const dish=mesh(sphere,mats.white,x,2.15,z,1.4,.18,1.4);dish.rotation.x=.35;dish.rotation.y=i*1.4;
      mesh(box,mats.purple,x-1.15,1.1,z,1.8,.08,.8);mesh(box,mats.purple,x+1.15,1.1,z,1.8,.08,.8)
    });
    // Decorative stars hover above the central route.
    const stars=new THREE.InstancedMesh(sphere,mats.glow,28);
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2,r=17+(i%4)*3;rotation.identity();matrix.compose(new THREE.Vector3(Math.cos(a)*r,3+(i%4)*.75,Math.sin(a)*r),rotation,new THREE.Vector3(.08,.08,.08));stars.setMatrixAt(i,matrix)}stars.instanceMatrix.needsUpdate=true;group.add(stars);
    const alienFallbacks=[];let disposed=false,alienAsset=null;
    group.userData.alienAsset={status:"primitive-fallback",source:"Quaternius Animated Alien Pack",license:"CC0-1.0"};
    function npc(kind,x,z,sitting=false,turn=0){const n=new THREE.Group(),visual=new THREE.Group(),isAlien=kind==="alien",body=isAlien?mats.purple:mats.white,face=isAlien?mats.alien:mats.skin;n.add(visual);
      mesh(box,body,0,sitting?1:1.45,0,.78,.9,.48,visual);mesh(sphere,face,0,sitting?1.72:2.2,0,.86,.92,.82,visual);
      if(isAlien){mesh(sphere,mats.dark,-.16,sitting?1.82:2.3,.39,.12,.18,.08,visual);mesh(sphere,mats.dark,.16,sitting?1.82:2.3,.39,.12,.18,.08,visual);mesh(cone,mats.alien,-.2,sitting?2.3:2.78,0,.15,.55,.15,visual);mesh(cone,mats.alien,.2,sitting?2.3:2.78,0,.15,.55,.15,visual)}
      else mesh(box,mats.visor,0,sitting?1.8:2.28,.39,.58,.28,.08,visual);
      [-.48,.48].forEach(ax=>mesh(box,body,ax,sitting?1.15:1.42,0,.2,.75,.22,visual));
      [-.22,.22].forEach(lx=>{const leg=mesh(box,body,lx,sitting?.58:.55,sitting?.35:0,.25,.82,.28,visual);if(sitting)leg.rotation.x=Math.PI/2});
      if(sitting)mesh(box,mats.metal,0,.42,0,1.25,.14,.7,n);
      n.position.set(x,0,z);n.rotation.y=turn;n.userData.npcType=kind;group.add(n);if(isAlien)alienFallbacks.push({visual,sitting})
    }
    [{k:"alien",x:-6,z:-5},{k:"alien",x:7,z:-6,s:true,t:2.5},{k:"alien",x:-18,z:16,t:1},{k:"astronaut",x:5,z:7},{k:"astronaut",x:20,z:17,s:true,t:-2},{k:"astronaut",x:-19,z:-18,t:2.8},{k:"alien",x:2,z:-2,s:true},{k:"astronaut",x:12,z:-21,t:.8},{k:"alien",x:23,z:-10,t:-1.2},{k:"astronaut",x:-24,z:5,s:true,t:2}].forEach(v=>npc(v.k,v.x,v.z,v.s,v.t));
    if(window.QuaterniusAlienAsset){
      group.userData.alienAsset.status="loading";
      window.QuaterniusAlienAsset.load(THREE).then(asset=>{
        if(disposed){asset.dispose();return}
        alienAsset=asset;
        alienFallbacks.forEach(({visual,sitting})=>{
          visual.clear();const model=new THREE.Mesh(asset.geometry,asset.material);
          const modelScale=sitting?.72:.9;model.scale.setScalar(modelScale);model.position.y=sitting?.44:0;
          model.castShadow=model.receiveShadow=false;visual.add(model)
        });
        group.userData.alienAsset.status="loaded";
        group.userData.alienAsset.instances=alienFallbacks.length;
      }).catch(error=>{if(!disposed){group.userData.alienAsset.status="fallback-error";console.warn("Using primitive alien fallback",error)}})
    }
    const structures=window.spaceStructureFactory?window.spaceStructureFactory(THREE):null;
    if(structures)group.add(structures.group);
    const bounds={minX:-34.3,maxX:34.3,minZ:-34.3,maxZ:34.3};
    const collisionBoxes=structures?.collisionBoxes||[];
    return {group,bounds,spawn:{x:0,z:29},camera:{angle:.25,height:15,distance:22},background:0x090b24,name:"Moonlight Space Station",
      canWalk(x,z){const radius=.32;if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return false;return !collisionBoxes.some(box=>x>box.minX-radius&&x<box.maxX+radius&&z>box.minZ-radius&&z<box.maxZ+radius)},
      dispose(){disposed=true;alienAsset?.dispose();structures?.dispose();group.parent?.remove(group);resources.forEach(r=>r.dispose?.())}};
  };
})();
