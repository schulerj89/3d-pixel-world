(function(){
  const ROOT="assets/models/furniture-bits";
  const specs=Object.freeze({
    sofa:{file:"couch_pillows",seatAnchor:{x:0,y:.35,z:.13}},
    table:{file:"table_low"},
    bed:{file:"bed_double_A"},
    lamp:{file:"lamp_standing"},
    chair:{file:"chair_A",seatAnchor:{x:0,y:.3,z:.03}},
    rug:{file:"rug_rectangle_stripes_A",castShadow:false},
    dresser:{file:"cabinet_medium_decorated"},
    plant:{file:"cactus_medium_A"},
    armchair:{file:"armchair_pillows"},
    stool:{file:"chair_stool"},
    diningTable:{file:"table_medium_long"},
    sideTable:{file:"table_small"},
    tableLamp:{file:"lamp_table"},
    smallCactus:{file:"cactus_small_A"},
    // Keep the house appliance identical to the proven restaurant fixture.
    fridge:{file:"fridge_A_decorated",url:"assets/models/restaurant/kaykit-restaurant-kit.glb",sourceScene:"fridge_A_decorated",scale:1.4,collision:[1.4,1.568],size:[2.8,3.5,3.136]}
  });
  const prototypePromises=new Map();
  const requestedIds=new Set();
  const loadedIds=new Set();
  const errors=[];

  function assetId(spec){return spec.sourceScene?`restaurant.kitchen.fridge`:`kaykit-furniture-bits/${spec.file}`}
  function loadPrototype(spec){
    const key=spec.url||spec.file;
    if(prototypePromises.has(key))return prototypePromises.get(key);
    const promise=new Promise((resolve,reject)=>{
      const Loader=window.ThreeGLTFLoader?.GLTFLoader||window.THREE?.GLTFLoader;
      if(!Loader){reject(new Error("GLTFLoader is unavailable"));return}
      new Loader().load(
        `${spec.url||`${ROOT}/${spec.file}.gltf`}?v=__BUILD_VERSION__`,
        gltf=>{
          const prototype=spec.sourceScene?(gltf.scenes?.find(scene=>scene.children?.[0]?.name===spec.sourceScene)||gltf.scene.getObjectByName(spec.sourceScene)):gltf.scene;
          if(!prototype){reject(new Error(`Missing source scene: ${spec.sourceScene}`));return}
          resolve(prototype);
        },
        undefined,
        reject
      );
    });
    prototypePromises.set(key,promise);
    return promise;
  }

  function cloneMaterial(material){
    return Array.isArray(material)?material.map(item=>item.clone()):material.clone();
  }

  function attach(group,kind){
    const spec=specs[kind];
    if(!spec)return null;
    const id=assetId(spec);
    requestedIds.add(id);
    group.userData.assetId=id;
    group.userData.assetStatus="loading";
    return loadPrototype(spec).then(prototype=>{
      if(!group.parent){group.userData.assetStatus="detached";return group}
      const model=prototype.clone(true);
      model.name=id;
      model.userData.assetId=id;
      if(spec.scale)model.scale.setScalar(spec.scale);
      model.traverse(object=>{
        if(!object.isMesh)return;
        object.material=cloneMaterial(object.material);
        object.castShadow=spec.castShadow!==false;
        object.receiveShadow=true;
      });
      group.add(model);
      if(group.userData.fallbackRoot)group.userData.fallbackRoot.visible=false;
      if(spec.seatAnchor)group.userData.seatAnchor={...spec.seatAnchor};
      if(spec.collision)group.userData.collision=[...spec.collision];
      if(spec.size)group.userData.assetSize=[...spec.size];
      group.userData.assetRoot=model;
      group.userData.assetStatus="ready";
      loadedIds.add(id);
      return group;
    }).catch(error=>{
      group.userData.assetStatus="fallback";
      errors.push({id,message:error?.message||String(error)});
      console.warn(`Furniture asset failed to load: ${id}`,error);
      return group;
    });
  }

  window.FurnitureAssets={
    attach,
    has:kind=>Boolean(specs[kind]),
    specs,
    debug:()=>({
      loadedIds:[...loadedIds],
      pendingIds:[...requestedIds].filter(id=>!loadedIds.has(id)),
      errors:[...errors]
    })
  };
})();
