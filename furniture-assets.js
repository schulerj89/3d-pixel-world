(function(){
  const ROOT="assets/models/furniture-bits";
  const specs=Object.freeze({
    sofa:{file:"couch_pillows"},
    table:{file:"table_low"},
    bed:{file:"bed_double_A"},
    lamp:{file:"lamp_standing"},
    chair:{file:"chair_A"},
    rug:{file:"rug_rectangle_stripes_A",castShadow:false},
    dresser:{file:"cabinet_medium_decorated"},
    plant:{file:"cactus_medium_A"},
    armchair:{file:"armchair_pillows"},
    stool:{file:"chair_stool"},
    diningTable:{file:"table_medium_long"},
    sideTable:{file:"table_small"},
    tableLamp:{file:"lamp_table"},
    smallCactus:{file:"cactus_small_A"}
  });
  const prototypePromises=new Map();
  const requestedIds=new Set();
  const loadedIds=new Set();
  const errors=[];

  function assetId(spec){return `kaykit-furniture-bits/${spec.file}`}
  function loadPrototype(spec){
    if(prototypePromises.has(spec.file))return prototypePromises.get(spec.file);
    const promise=new Promise((resolve,reject)=>{
      const Loader=window.ThreeGLTFLoader?.GLTFLoader||window.THREE?.GLTFLoader;
      if(!Loader){reject(new Error("GLTFLoader is unavailable"));return}
      new Loader().load(
        `${ROOT}/${spec.file}.gltf?v=__BUILD_VERSION__`,
        gltf=>resolve(gltf.scene),
        undefined,
        reject
      );
    });
    prototypePromises.set(spec.file,promise);
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
      model.traverse(object=>{
        if(!object.isMesh)return;
        object.material=cloneMaterial(object.material);
        object.castShadow=spec.castShadow!==false;
        object.receiveShadow=true;
      });
      group.add(model);
      if(group.userData.fallbackRoot)group.userData.fallbackRoot.visible=false;
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
