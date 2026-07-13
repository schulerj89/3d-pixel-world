(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.RestaurantOrderIntegration=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 const DEFAULT_CUSTOMERS=Object.freeze([
  Object.freeze({customerId:"restaurant-guest-001",customerName:"Ari",productId:"garden-plate"}),
  Object.freeze({customerId:"restaurant-guest-002",customerName:"Bea",productId:"burger-meal"}),
  Object.freeze({customerId:"restaurant-guest-003",customerName:"Cal",productId:"steak-dinner"}),
  Object.freeze({customerId:"restaurant-guest-004",customerName:"Dee",productId:"ham-cheese"})
 ]);
 const CUSTOMER_NAMES=Object.freeze(["Ari","Bea","Cal","Dee","Emi","Finn","Gia","Hiro"]);

 class RestaurantOrderQueueBridge{
  constructor({orders,customers,initialCustomers=DEFAULT_CUSTOMERS,maxActive=4}={}){
   if(!orders?.snapshot||!orders?.enqueue||!orders?.subscribe||!orders?.start)throw new Error("Order bridge requires an order runtime");
   if(!customers?.enqueue||!customers?.completeOrder||!customers?.subscribe)throw new Error("Order bridge requires a customer system");
   this.orders=orders;this.customers=customers;this.initialCustomers=initialCustomers.map(request=>({...request}));this.maxActive=Math.min(4,Math.max(1,Number(maxActive)||4));this.nextGuest=this.initialCustomers.length;this.pendingCompletions=new Set();this.disposers=[];this.started=false;this.disposed=false;
  }
  start(){
   if(this.disposed)throw new Error("Cannot start a disposed order bridge");if(this.started)return this.snapshot();this.started=true;
   this.disposers.push(this.orders.subscribe("*",event=>this._onOrderEvent(event)),this.customers.subscribe(event=>this._onCustomerEvent(event)));
   const orderSnapshot=this.orders.snapshot(),active=orderSnapshot.active||[],known=[...active,...(orderSnapshot.completed||[])];
   this.nextGuest=Math.max(this.nextGuest,...known.map(order=>Number(String(order.customerId||"").match(/(\d+)$/)?.[1])||0));
   if(active.length){active.forEach(order=>this.customers.enqueue(order));for(let slot=active.length;slot<this.maxActive;slot++){if(!this.refill()?.ok)break}}
   else this.orders.start(this.initialCustomers.slice(0,this.maxActive));
   return this.snapshot();
  }
  _onOrderEvent(event){
   if(event.type==="order:added"&&event.order)this.customers.enqueue(event.order);
   if(event.type==="order:completed"&&event.order){if(!this.customers.completeOrder(event.order.id))this.pendingCompletions.add(event.order.id)}
  }
  _onCustomerEvent(event){
   if(event.type==="customer:waiting"&&this.pendingCompletions.delete(event.orderId))this.customers.completeOrder(event.orderId);
   if(event.type==="customer:left")this.refill();
  }
  refill(){
   if(this.disposed)return null;const active=this.orders.snapshot().active||[];if(active.length>=this.maxActive)return null;
   const index=this.nextGuest++,request={customerId:`restaurant-guest-${String(index+1).padStart(3,"0")}`,customerName:CUSTOMER_NAMES[index%CUSTOMER_NAMES.length]};
   return this.orders.enqueue(request);
  }
  snapshot(){return {started:this.started,maxActive:this.maxActive,pendingCompletions:[...this.pendingCompletions],orders:this.orders.snapshot(),customers:this.customers.debug()}}
  debug(){return this.snapshot()}
  dispose(){if(this.disposed)return;this.disposed=true;this.disposers.splice(0).forEach(dispose=>dispose?.());this.pendingCompletions.clear()}
 }

 return Object.freeze({DEFAULT_CUSTOMERS,CUSTOMER_NAMES,RestaurantOrderQueueBridge});
});
