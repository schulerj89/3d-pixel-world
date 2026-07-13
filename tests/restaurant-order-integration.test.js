const assert=require("assert");
const Orders=require("../restaurant-order-system.js");
const Customers=require("../restaurant-customer-system.js");
const Integration=require("../restaurant-order-integration.js");

const orderSystem=new Orders.RestaurantOrderSystem({maxActive:4,now:(()=>{let value=0;return ()=>++value})()});
const orderRuntime={
 snapshot:()=>orderSystem.snapshot(),
 enqueue:request=>orderSystem.enqueue(request),
 subscribe:(type,listener)=>orderSystem.subscribe(type,listener),
 start(requests){requests.forEach(request=>orderSystem.enqueue(request));return orderSystem.snapshot()}
};
const customers=new Customers.RestaurantCustomerSystem({moveSpeed:20,fadeDuration:.1});
const bridge=new Integration.RestaurantOrderQueueBridge({orders:orderRuntime,customers});
bridge.start();

assert.strictEqual(orderSystem.snapshot().active.length,4,"bridge seeds four typed restaurant orders");
assert.strictEqual(customers.debug().active.length,4,"the same four order ids create the visible customer line");
assert.deepStrictEqual(customers.debug().active.map(item=>item.orderId),orderSystem.snapshot().active.map(item=>item.id));

const front=orderSystem.snapshot().active[0];
assert(orderSystem.fulfill(front.id,front.product.id).ok,"the front order can be made and served through the domain API");
assert.deepStrictEqual(bridge.debug().pendingCompletions,[front.id],"an early completion waits until its entering customer reaches the line");
for(let frame=0;frame<50;frame++)customers.update(.1);

assert.strictEqual(bridge.debug().pendingCompletions.length,0,"the deferred completion releases once the customer is waiting");
assert.strictEqual(orderSystem.snapshot().active.length,4,"a fresh order is created only after the served customer fades at the door");
assert.strictEqual(customers.debug().active.length,4,"the straight line refills to four after removal");
assert(!customers.findByOrder(front.id),"the served customer leaves the restaurant permanently");
assert(orderSystem.snapshot().active.some(order=>order.customerName==="Emi"),"refill rotates through extendable customer identities");

bridge.dispose();customers.dispose();
console.log("restaurant integration: order ids, deferred service, door fade, and post-removal refill validated");
