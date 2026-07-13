const assert=require("assert");
const facing=require("../character-facing.js");

const places=["bakery","city","castle","house","beach","space"];
const directions=[
 {name:"north",x:0,z:-1,yaw:Math.PI},
 {name:"south",x:0,z:1,yaw:0},
 {name:"east",x:1,z:0,yaw:Math.PI/2},
 {name:"west",x:-1,z:0,yaw:-Math.PI/2},
 {name:"north-east",x:1,z:-1,yaw:Math.PI*3/4}
];

assert.strictEqual(facing.STYLOO_MODEL_FORWARD_AXIS,"+z");
assert.strictEqual(facing.STYLOO_MODEL_FORWARD_CORRECTION,0);
assert.strictEqual(facing.correctionForModelForward("-z"),Math.PI);

for(const place of places){
 const root={rotation:{y:.42}};
 const visual={rotation:{y:12},userData:{}};
 facing.attachVisual(visual,facing.STYLOO_MODEL_FORWARD_AXIS);
 assert.strictEqual(visual.rotation.y,0,`${place}: Styloo visual must retain its native +Z front`);
 for(const direction of directions){
  assert(facing.faceMovement(root,direction.x,direction.z),`${place}/${direction.name}: movement should turn root`);
  assert(Math.abs(root.rotation.y-direction.yaw)<1e-12,`${place}/${direction.name}: incorrect root yaw`);
  assert.strictEqual(visual.rotation.y,0,`${place}/${direction.name}: per-frame turn must not leak into model correction`);
 }
 const before=root.rotation.y;
 assert.strictEqual(facing.faceMovement(root,0,0),false,`${place}: idle should not turn root`);
 assert.strictEqual(root.rotation.y,before,`${place}: idle should preserve last facing`);
}

assert.throws(()=>facing.correctionForModelForward("forward"),/Unsupported/);
assert.throws(()=>facing.yawFromMovement(NaN,0),/finite/);
console.log("character facing: Styloo +Z front tracks movement in all six worlds without double rotation");
