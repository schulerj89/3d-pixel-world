(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else root.levelTemplateParser=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 function parse(text){
  const values={},map=[];let readingMap=false;
  String(text).split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("#")).forEach(line=>{
   if(line==="map:"){readingMap=true;return}
   if(readingMap){map.push(line);return}
   const split=line.indexOf(":");if(split>0)values[line.slice(0,split).trim()]=line.slice(split+1).trim();
  });
  const [width,depth]=(values.size||"0x0").split("x").map(Number),cell=Number(values.cell)||1;
  const [spawnCol,spawnRow]=(values.spawn||"0,0").split(",").map(Number);
  if(!width||!depth||map.length!==depth/cell||map.some(row=>row.length!==width/cell))throw new Error("Level map dimensions do not match size/cell metadata");
  return {...values,width,depth,cell,spawnCol,spawnRow,map,symbolAt:(col,row)=>map[row]?.[col]};
 }
 return {parse};
});
