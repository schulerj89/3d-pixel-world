const assert=require("assert");
const fs=require("fs");
const path=require("path");
const asset=require("../forest-animal-model.js");

class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize}}
class Geometry{
  constructor(){this.attributes={}}
  setAttribute(name,attribute){this.attributes[name]=attribute}
  computeBoundingBox(){this.boundingBox=true}
  computeBoundingSphere(){this.boundingSphere=true}
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attribute};
for(const name of ["deer","fox","wolf"]){
  const base=path.join(__dirname,"..","assets","models","forest-animals",name);
  const geometry=asset.parseObj(THREE,fs.readFileSync(`${base}.obj`,"utf8"),fs.readFileSync(`${base}.mtl`,"utf8"));
  assert(geometry.attributes.position.count>2500,`${name} should contain the complete mesh`);
  assert.strictEqual(geometry.attributes.position.count,geometry.attributes.normal.count);
  assert.strictEqual(geometry.attributes.position.count,geometry.attributes.color.count);
  assert(geometry.boundingBox&&geometry.boundingSphere,`${name} bounds should support frustum culling`);
  console.log(`${name}: ${geometry.attributes.position.count/3} triangles`);
}
