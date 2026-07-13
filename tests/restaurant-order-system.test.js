const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.join(__dirname,"..");
const Orders=require("../restaurant-order-system.js");

const catalog=new Orders.OrderCatalog();
const definitions=catalog.list();
assert.strictEqual(definitions.length,4,"default restaurant catalog should offer four extensible recipes");
assert(new Set(definitions.map(item=>item.reward)).size>1,"restaurant recipes should pay different dollar rewards");
assert(definitions.every(item=>item.id&&item.name&&item.emoji&&Number.isFinite(item.reward)),"catalog definitions need typed display and reward fields");
assert(definitions.every(item=>item.ingredients.length>=1&&item.ingredients.length<=2),"every recipe must require no more than two ingredients");
assert(definitions.flatMap(item=>item.ingredients).every(item=>item.id&&item.name&&item.emoji&&item.sourceScene),"ingredient definitions need display art and a source scene");

let tick=100,rewards=[];
const system=new Orders.RestaurantOrderSystem({catalog,maxActive:4,now:()=>tick++,rewardSink:(amount,order)=>rewards.push({amount,order})});
const events=[];system.subscribe("*",event=>events.push(event));
const added=[
 system.enqueue({customerId:"guest-a",customerName:"Ari",productId:"garden-plate"}),
 system.enqueue({customerId:"guest-b",customerName:"Bea",productId:"burger-meal"}),
 system.enqueue({customerId:"guest-c",customerName:"Cal",productId:"steak-dinner"}),
 system.enqueue({customerId:"guest-d",customerName:"Dee",productId:"ham-cheese"})
];
assert(added.every(result=>result.ok),"four customers may hold active restaurant orders");
assert.deepStrictEqual(system.enqueue({customerId:"guest-e"}),{ok:false,reason:"queue-full",order:null},"a fifth order must wait outside the four-customer queue");
assert.strictEqual(system.snapshot().active.length,4);
assert.strictEqual(system.complete(added[0].order.id).reason,"order-not-made","customers cannot finish before food is made");
assert.strictEqual(system.markMade(added[0].order.id,"burger-meal").reason,"product-mismatch","the made product must match the customer's order");
assert.strictEqual(system.snapshot().active[0].status,Orders.OrderStatus.WAITING);
assert(system.markMade(added[1].order.id,"burger-meal").ok,"a later order may be prepared while it waits");
assert.strictEqual(system.complete(added[1].order.id).reason,"order-not-front","prepared customers retain straight-line FIFO departure order");
assert(system.markMade(added[0].order.id,"garden-plate").ok);
const completed=system.completeFront();
assert(completed.ok,"the made front order can complete");
assert.strictEqual(completed.reward,8);
assert.deepStrictEqual(rewards.map(item=>item.amount),[8],"reward sink is invoked exactly once at completion");
assert.strictEqual(system.complete(added[0].order.id).reason,"order-not-found","completed orders cannot pay twice");
const second=system.completeFront();
assert(second.ok&&second.reward===12,"the already-made next customer can leave once they reach the front");
assert.deepStrictEqual(rewards.map(item=>item.amount),[8,12]);
assert(events.some(event=>event.type==="order:added"&&event.order.customerId==="guest-a"),"queue integration receives customer identity on add");
assert(events.some(event=>event.type==="order:completed"&&event.order.customerId==="guest-a"&&event.reward===8),"queue integration receives customer identity and reward on completion");

const deterministic=new Orders.RestaurantOrderSystem({now:()=>7,productSequence:["burger-meal","ham-cheese"]});
assert.strictEqual(deterministic.enqueue({customerId:"one"}).order.product.id,"burger-meal");
assert.strictEqual(deterministic.enqueue({customerId:"two"}).order.product.id,"ham-cheese");
assert.strictEqual(deterministic.debug().active[0].id,"restaurant-order-0001","debug snapshots and ids must be deterministic");
assert(deterministic.markMade("restaurant-order-0001","burger-meal").ok);
const served=deterministic.completeFront();
assert(served.ok&&served.reward===12,"cooked orders provide a visible serve-and-reward path");

const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"restaurant-order-system.css"),"utf8");
const source=fs.readFileSync(path.join(root,"restaurant-order-system.js"),"utf8");
assert(html.includes('restaurant-order-system.css?v=__BUILD_VERSION__')&&html.includes('restaurant-order-system.js?v=__BUILD_VERSION__'),"restaurant order UI assets must be cache-versioned in the app");
assert(html.includes('restaurant-cooking-system.css?v=__BUILD_VERSION__')&&html.includes('restaurant-cooking-system.js?v=__BUILD_VERSION__'),"restaurant cooking assets must be cache-versioned in the app");
assert(css.includes("body.restaurant-mode .restaurantOrderMenu{display:block}"),"order menu only displays during restaurant gameplay");
assert(css.includes("body.restaurant-mode #money{display:flex!important}"),"restaurant rewards preserve the existing money display");
assert(css.includes("min-height:44px")&&css.includes("env(safe-area-inset-right)"),"compact order menu retains a safe touch target and landscape inset");
assert(source.includes('"restaurant-order-added"')&&source.includes('"restaurant-order-completed"'),"browser bridge exposes stable customer queue events");
assert(source.includes('root.gameEconomy?.add?.(amount,"restaurant-order:"+order.id)'),"restaurant rewards use the existing economy callback");
assert(source.includes('image.src=ingredientImageDataUrl(ingredient)')&&source.includes('Cook at the kitchen stove'),"order cards must show recipe images and defer completion until cooking");
console.log("restaurant orders: four-customer FIFO lifecycle, varied rewards, completion events, economy hook, and collapsible HUD validated");
