(function(root){
  const ASSET_ROOT="assets/textures/house-walls";
  const surfaces=Object.freeze({
    interior:Object.freeze({
      id:"polyhaven/painted_plaster_wall",
      file:"interior-painted-plaster.webp",
      fallbackColor:0xd8d0c7,
      roughness:.92,
      tileWorldSize:3
    }),
    exterior:Object.freeze({
      id:"polyhaven/exterior_wall_cladding",
      file:"exterior-wall-cladding.webp",
      fallbackColor:0x8e887d,
      roughness:.88,
      tileWorldSize:2
    })
  });
  const sourcePromises=new Map();
  const requestedIds=new Set();
  const loadedIds=new Set();
  const errors=[];

  function requireThree(){
    if(!root.THREE)throw new Error("THREE is unavailable");
    return root.THREE;
  }

  function loadSource(surface){
    const spec=surfaces[surface];
    if(!spec)return Promise.reject(new Error(`Unknown house wall surface: ${surface}`));
    if(sourcePromises.has(surface))return sourcePromises.get(surface);
    requestedIds.add(spec.id);
    const THREE=requireThree();
    const promise=new Promise((resolve,reject)=>{
      if(!THREE.TextureLoader){reject(new Error("THREE.TextureLoader is unavailable"));return}
      new THREE.TextureLoader().load(
        `${ASSET_ROOT}/${spec.file}?v=__BUILD_VERSION__`,
        texture=>{
          texture.name=spec.id;
          texture.colorSpace=THREE.SRGBColorSpace;
          loadedIds.add(spec.id);
          resolve(texture);
        },
        undefined,
        reject
      );
    }).catch(error=>{
      errors.push({id:spec.id,message:error?.message||String(error)});
      throw error;
    });
    sourcePromises.set(surface,promise);
    return promise;
  }

  function positive(value,fallback){
    return Number.isFinite(value)&&value>0?value:fallback;
  }

  function configureMap(source,spec,options){
    const THREE=requireThree();
    const map=source.clone();
    const tileSize=positive(options.tileWorldSize,spec.tileWorldSize);
    const width=positive(options.width,tileSize);
    const height=positive(options.height,tileSize);
    map.wrapS=THREE.RepeatWrapping;
    map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(width/tileSize,height/tileSize);
    map.colorSpace=THREE.SRGBColorSpace;
    const maximum=options.renderer?.capabilities?.getMaxAnisotropy?.()||1;
    map.anisotropy=Math.min(8,maximum);
    map.needsUpdate=true;
    return map;
  }

  function create(surface,options={}){
    const THREE=requireThree();
    const spec=surfaces[surface];
    if(!spec)throw new Error(`Unknown house wall surface: ${surface}`);
    const material=new THREE.MeshStandardMaterial({
      color:options.fallbackColor??spec.fallbackColor,
      roughness:options.roughness??spec.roughness,
      metalness:0,
      side:options.side??THREE.FrontSide
    });
    material.name=`house-wall-${surface}`;
    material.userData.wallSurface=surface;
    material.userData.textureId=spec.id;
    material.userData.textureStatus="loading";
    material.userData.textureReady=loadSource(surface).then(source=>{
      material.map=configureMap(source,spec,options);
      material.color.set(options.tint??0xffffff);
      material.userData.textureStatus="ready";
      material.needsUpdate=true;
      return material;
    }).catch(()=>{
      material.userData.textureStatus="fallback";
      return material;
    });
    return material;
  }

  root.HouseWallMaterials={
    create,
    preload:(surface)=>loadSource(surface),
    surfaces,
    debug:()=>( {
      loadedIds:[...loadedIds],
      pendingIds:[...requestedIds].filter(id=>!loadedIds.has(id)),
      errors:[...errors]
    })
  };
})(typeof window!=="undefined"?window:globalThis);
