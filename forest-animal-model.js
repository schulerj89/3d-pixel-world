(function(root){
  "use strict";
  const BASE_URL="assets/models/forest-animals";
  const MODEL_NAMES=new Set(["deer","fox","wolf"]);
  const sourcePromises=new Map();

  function parseMtl(text){
    const colors={},fallback=[0.42,0.28,0.16];
    let current="Main";
    for(const raw of text.split(/\r?\n/)){
      const line=raw.trim();
      if(line.startsWith("newmtl "))current=line.slice(7).trim();
      else if(line.startsWith("Kd ")){
        const values=line.split(/\s+/).slice(1,4).map(Number);
        if(values.length===3&&values.every(Number.isFinite))colors[current]=values;
      }
    }
    colors.Main=colors.Main||fallback;
    return colors;
  }

  function parseObj(THREE,objText,mtlText){
    const materialColors=parseMtl(mtlText),vertices=[],normals=[],positions=[],normalData=[],colors=[];
    let currentColor=materialColors.Main;
    for(const raw of objText.split(/\r?\n/)){
      const line=raw.trim();
      if(line.startsWith("v "))vertices.push(line.split(/\s+/).slice(1,4).map(Number));
      else if(line.startsWith("vn "))normals.push(line.split(/\s+/).slice(1,4).map(Number));
      else if(line.startsWith("usemtl "))currentColor=materialColors[line.slice(7).trim()]||materialColors.Main;
      else if(line.startsWith("f ")){
        const corners=line.split(/\s+/).slice(1).map(token=>{
          const parts=token.split("/");return {v:+parts[0]-1,n:parts[2]?+parts[2]-1:-1};
        });
        for(let triangle=1;triangle<corners.length-1;triangle++){
          [corners[0],corners[triangle],corners[triangle+1]].forEach(corner=>{
            positions.push(...vertices[corner.v]);
            normalData.push(...(normals[corner.n]||[0,1,0]));
            colors.push(...currentColor);
          });
        }
      }
    }
    if(!positions.length)throw new Error("Forest animal OBJ contained no faces");
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normalData,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    return geometry;
  }

  function fetchPair(name){
    if(!MODEL_NAMES.has(name))return Promise.reject(new Error(`Unknown forest animal: ${name}`));
    if(!sourcePromises.has(name)){
      const prefix=`${BASE_URL}/${name}`;
      sourcePromises.set(name,Promise.all([
        fetch(`${prefix}.obj?v=__BUILD_VERSION__`),fetch(`${prefix}.mtl?v=__BUILD_VERSION__`)
      ]).then(async responses=>{
        const failed=responses.find(response=>!response.ok);
        if(failed)throw new Error(`Forest animal request failed (${failed.status})`);
        return Promise.all(responses.map(response=>response.text()));
      }).catch(error=>{sourcePromises.delete(name);throw error}));
    }
    return sourcePromises.get(name);
  }

  const api={
    source:{name:"Ultimate Animated Animal Pack",author:"Quaternius",license:"CC0-1.0",url:"https://quaternius.com/packs/ultimateanimatedanimals.html"},
    parseMtl,parseObj,
    async load(THREE,name){
      const [objText,mtlText]=await fetchPair(name);
      const geometry=parseObj(THREE,objText,mtlText);
      const material=new THREE.MeshLambertMaterial({vertexColors:true});
      return {geometry,material,dispose(){geometry.dispose();material.dispose()}};
    }
  };
  root.QuaterniusForestAnimals=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
