const assert=require("assert");
const fs=require("fs");
const path=require("path");
const Orders=require("../restaurant-order-system.js");
const Cooking=require("../restaurant-cooking-system.js");

const orderSystem=new Orders.RestaurantOrderSystem({maxActive:4,now:()=>1});
const orders={
 snapshot:()=>orderSystem.snapshot(),
 markMade:(id,productId)=>orderSystem.markMade(id,productId),
 subscribe:(type,listener)=>orderSystem.subscribe(type,listener)
};
const order=orderSystem.enqueue({customerId:"cook-a",customerName:"Ari",productId:"garden-plate"}).order;
const cooking=new Cooking.RestaurantCookingSystem({orders});

assert.deepStrictEqual(cooking.pickUp("bun"),{ok:false,reason:"not-needed"},"players cannot grab ingredients outside the front recipe");
assert(cooking.pickUp("tomato").ok,"the first recipe ingredient can be held");
assert.strictEqual(cooking.pickUp("carrot").reason,"hands-full","the player carries only one ingredient at a time");
assert(cooking.putOnStove().ok,"held food can be placed on the stove");
assert.deepStrictEqual(cooking.progressFor(order.id),{added:["tomato"],cooked:false},"stove progress persists per order");
assert.strictEqual(cooking.cook().reason,"ingredients-missing","a two-item recipe cannot cook with only one item");
assert(cooking.pickUp("carrot").ok&&cooking.putOnStove().ok,"the second ingredient can complete the stove setup");
assert.strictEqual(cooking.snapshot().readyToCook,true,"all required ingredients enable the cook interaction");
assert(cooking.cook().ok,"the prepared recipe marks the order made");
assert.strictEqual(orderSystem.snapshot().active[0].status,Orders.OrderStatus.MADE,"cooking unlocks service without paying yet");
assert.deepStrictEqual(cooking.snapshot().stoveIngredients,[],"ingredient props clear from the stove after cooking");
assert.strictEqual(cooking.pickUp("tomato").reason,"order-already-cooked","made orders cannot collect duplicate food");
assert(orderSystem.completeFront().ok,"only the cooked front order can be checked off and served");

const root=path.join(__dirname,"..");
const worldSource=fs.readFileSync(path.join(root,"restaurant-world.js"),"utf8");
assert(worldSource.includes('world:"restaurant"')&&worldSource.includes("putOnStove"),"ingredient and stove actions must use the shared proximity action system");
console.log("restaurant cooking: one-item carry, two-item recipe, stove gating, cooked service, and visual action wiring validated");
