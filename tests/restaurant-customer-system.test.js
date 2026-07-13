const assert=require("assert");
const {CustomerState,DEFAULT_CONFIG,StraightCustomerLine,RestaurantCustomerSystem}=require("../restaurant-customer-system.js");

const line=new StraightCustomerLine();
assert.strictEqual(line.maxActive,4,"restaurant queue must cap active customers at four");
assert.deepStrictEqual(line.snapshot().map(point=>point.z),[17.25,17.25,17.25,17.25],"all queue slots must form a programmatically straight line");
assert.deepStrictEqual(line.snapshot().map(point=>+point.x.toFixed(2)),[0,1.65,3.3,4.95]);
assert.throws(()=>new StraightCustomerLine({maxActive:5}),/one to four/);

const avatars=[],events=[];
const system=new RestaurantCustomerSystem({moveSpeed:20,fadeDuration:.2,avatarFactory:({id,variant})=>{
 const avatar={id,variant,motions:[],positions:[],facings:[],opacities:[],disposed:false,setPosition(x,z){this.positions.push({x,z})},faceDirection(x,z){this.facings.push({x,z})},setMotion(motion){this.motions.push(motion)},setOpacity(opacity){this.opacities.push(opacity)},update(){},dispose(){this.disposed=true}};avatars.push(avatar);return avatar;
},onEvent:event=>events.push(event)});
for(let index=1;index<=5;index++)system.enqueue({id:`order-${index}`,productId:`item-${index}`});
assert.strictEqual(system.customers.length,4);assert.deepStrictEqual(system.debug().pending,["order-5"]);assert.deepStrictEqual(system.debug().active.map(customer=>customer.variant),[0,1,2,3],"four lightweight costume variants must cycle deterministically");
assert.strictEqual(system.completeOrder("order-1"),false,"an order cannot release its customer before the customer is waiting");
for(let frame=0;frame<20;frame++)system.update(.1);
assert(system.debug().active.every(customer=>customer.state===CustomerState.WAITING));
system.debug().active.forEach((customer,index)=>{assert.strictEqual(customer.z,17.25);assert(Math.abs(customer.x-index*DEFAULT_CONFIG.lineSpacing)<.001)});
assert(avatars.every(avatar=>avatar.motions.includes("walk")&&avatar.motions.includes("idle")),"customers must switch between real walk and idle animation hooks");
avatars.forEach((avatar,index)=>{const facing=avatar.facings.at(-1),x=index*DEFAULT_CONFIG.lineSpacing;assert(Math.abs(facing.x+x)<.001&&Math.abs(facing.z-(DEFAULT_CONFIG.waitingFaceTarget.z-17.25))<.001,"waiting customers must face the register instead of their lateral travel direction")});
assert.strictEqual(system.completeOrder("missing"),false);assert.strictEqual(system.completeOrder("order-1"),true);assert.strictEqual(system.findByOrder("order-1").orderCompleted,true);
for(let frame=0;frame<40;frame++)system.update(.1);
assert.strictEqual(system.findByOrder("order-1"),null,"completed customers must fade and be removed at the front door");
assert(avatars[0].opacities.some(opacity=>opacity<1),"front-door exit must fade the customer");assert(avatars[0].disposed);
assert.strictEqual(system.customers.length,4,"a pending order may enter only after the completed customer finishes fading out");assert.strictEqual(system.findByOrder("order-5").state!==CustomerState.REMOVED,true);
assert(events.some(event=>event.type==="customer:fading"&&event.orderId==="order-1"));assert(events.some(event=>event.type==="customer:left"&&event.orderId==="order-1"));
const before=system.debug();assert.strictEqual(before.maxActive,4);assert.strictEqual(before.line.length,4);
system.dispose();assert.strictEqual(system.customers.length,0);assert.strictEqual(system.disposed,true);
console.log("restaurant customer system: four-slot straight queue, completion-gated exit, door fade, and refill validated");
