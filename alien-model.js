(function(root){
  "use strict";
  const DEFAULT_URL="assets/models/alien/quaternius-alien.obj?v=__BUILD_VERSION__";
  const MATERIAL_COLORS={
    Main:[0.12,0.48,0.44],Stripe:[0.16,0.08,0.22],Eyes:[0.015,0.02,0.035],
    Nails:[0.11,0.06,0.08],White:[0.72,0.84,0.88]
  };
  let sourceTextPromise=null;

  function readBounds(geometry){
    geometry.computeBoundingBox();
    const box=geometry.boundingBox;
    if(!box?.min||!box?.max)throw new Error("Alien geometry did not produce a bounding box");
    return {
      min:{x:box.min.x,y:box.min.y,z:box.min.z},
      max:{x:box.max.x,y:box.max.y,z:box.max.z},
      size:{x:box.max.x-box.min.x,y:box.max.y-box.min.y,z:box.max.z-box.min.z}
    };
  }

  function groundedY(bounds,scale=1,surfaceY=0){
    if(!bounds?.min||!Number.isFinite(bounds.min.y))throw new Error("Alien bounds are required for grounding");
    return surfaceY-bounds.min.y*scale;
  }

  function parseAlienObj(THREE,text){
    const vertices=[],normals=[],positions=[],normalData=[],colors=[];
    let currentColor=MATERIAL_COLORS.Main;
    const lines=text.split(/\r?\n/);
    for(const line of lines){
      if(line.startsWith("v ")){
        const values=line.trim().split(/\s+/);vertices.push([+values[1],+values[2],+values[3]]);
      }else if(line.startsWith("vn ")){
        const values=line.trim().split(/\s+/);normals.push([+values[1],+values[2],+values[3]]);
      }else if(line.startsWith("usemtl ")){
        currentColor=MATERIAL_COLORS[line.slice(7).trim()]||MATERIAL_COLORS.Main;
      }else if(line.startsWith("f ")){
        const corners=line.trim().split(/\s+/).slice(1).map(token=>{
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
    if(!positions.length)throw new Error("Alien OBJ contained no faces");
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normalData,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    readBounds(geometry);geometry.computeBoundingSphere();
    return geometry;
  }

  function fetchSource(url){
    if(!sourceTextPromise)sourceTextPromise=fetch(url).then(response=>{
      if(!response.ok)throw new Error(`Alien model request failed (${response.status})`);
      return response.text();
    }).catch(error=>{sourceTextPromise=null;throw error});
    return sourceTextPromise;
  }

  const api={
    source:{name:"Animated Alien Pack",author:"Quaternius",license:"CC0-1.0",url:"https://quaternius.com/packs/animatedalien.html"},
    parse:parseAlienObj,
    readBounds,
    groundedY,
    async load(THREE,url=DEFAULT_URL){
      const geometry=parseAlienObj(THREE,await fetchSource(url));
      const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.04});
      return {geometry,material,bounds:readBounds(geometry),dispose(){geometry.dispose();material.dispose()}};
    }
  };
  root.QuaterniusAlienAsset=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
