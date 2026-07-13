const assert=require("assert");
const fs=require("fs");
const path=require("path");
const asset=require("../alien-model.js");

class Attribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize}}
class Geometry{
  constructor(){this.attributes={}}
  setAttribute(name,attribute){this.attributes[name]=attribute}
  computeBoundingBox(){
    const values=this.attributes.position.array,min={x:Infinity,y:Infinity,z:Infinity},max={x:-Infinity,y:-Infinity,z:-Infinity};
    for(let i=0;i<values.length;i+=3){
      min.x=Math.min(min.x,values[i]);min.y=Math.min(min.y,values[i+1]);min.z=Math.min(min.z,values[i+2]);
      max.x=Math.max(max.x,values[i]);max.y=Math.max(max.y,values[i+1]);max.z=Math.max(max.z,values[i+2]);
    }
    this.boundingBox={min,max};
  }
  computeBoundingSphere(){this.boundingSphere=true}
}
const THREE={BufferGeometry:Geometry,Float32BufferAttribute:Attribute};
const text=fs.readFileSync(path.join(__dirname,"..","assets","models","alien","quaternius-alien.obj"),"utf8");
const geometry=asset.parse(THREE,text);

assert(geometry.attributes.position.count>8000,"expected the complete triangulated alien mesh");
assert.strictEqual(geometry.attributes.position.count,geometry.attributes.normal.count);
assert.strictEqual(geometry.attributes.position.count,geometry.attributes.color.count);
assert(geometry.boundingBox&&geometry.boundingSphere,"bounds should be ready for rendering/culling");
const bounds=asset.readBounds(geometry);
assert(bounds.min.y<0&&bounds.max.y>2.9,"expected authored alien vertical bounds");
for(const [scale,surfaceY] of [[.9,0],[.72,.49]]){
  const y=asset.groundedY(bounds,scale,surfaceY);
  assert(Math.abs(y+bounds.min.y*scale-surfaceY)<1e-8,"scaled model bottom should match its support surface");
}
const colors=new Set();
for(let i=0;i<geometry.attributes.color.array.length;i+=3){
  colors.add(Array.from(geometry.attributes.color.array.slice(i,i+3)).map(v=>v.toFixed(2)).join(","));
}
assert.strictEqual(colors.size,5,"all five authored material regions should survive as vertex colors");
console.log(`alien model: ${geometry.attributes.position.count/3} triangles, ${colors.size} vertex-color regions`);
