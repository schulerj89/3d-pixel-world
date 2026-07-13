const assert=require("assert");
const fs=require("fs");
const path=require("path");
const asset=require("../alien-model.js");

class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize}}
class Geometry{
  constructor(){this.attributes={}}
  setAttribute(name,attribute){this.attributes[name]=attribute}
  computeBoundingBox(){this.boundingBox=true}
  computeBoundingSphere(){this.boundingSphere=true}
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attribute};
const text=fs.readFileSync(path.join(__dirname,"..","assets","models","alien","quaternius-alien.obj"),"utf8");
const geometry=asset.parse(THREE,text);

assert(geometry.attributes.position.count>8000,"expected the complete triangulated alien mesh");
assert.strictEqual(geometry.attributes.position.count,geometry.attributes.normal.count);
assert.strictEqual(geometry.attributes.position.count,geometry.attributes.color.count);
assert(geometry.boundingBox&&geometry.boundingSphere,"bounds should be ready for rendering/culling");
const colors=new Set();
for(let i=0;i<geometry.attributes.color.array.length;i+=3){
  colors.add(Array.from(geometry.attributes.color.array.slice(i,i+3)).map(v=>v.toFixed(2)).join(","));
}
assert.strictEqual(colors.size,5,"all five authored material regions should survive as vertex colors");
console.log(`alien model: ${geometry.attributes.position.count/3} triangles, ${colors.size} vertex-color regions`);
