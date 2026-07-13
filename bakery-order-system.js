(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.BakeryOrders=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const OrderStatus=Object.freeze({CREATED:"created",ACTIVE:"active",COMPLETED:"completed",CANCELLED:"cancelled"});
 const ProductCatalog=Object.freeze({
  cupcake:Object.freeze({id:"cupcake",name:"Cupcake",emoji:"🧁",reward:5}),cookies:Object.freeze({id:"cookies",name:"Cookies",emoji:"🍪",reward:5}),cake:Object.freeze({id:"cake",name:"Cake",emoji:"🎂",reward:5}),croissant:Object.freeze({id:"croissant",name:"Croissant",emoji:"🥐",reward:5}),sweetBread:Object.freeze({id:"sweetBread",name:"Sweet Bread",emoji:"🍞",reward:5}),strawberryShake:Object.freeze({id:"strawberryShake",name:"Strawberry Milkshake",emoji:"🍓",reward:5}),chocolateShake:Object.freeze({id:"chocolateShake",name:"Chocolate Milkshake",emoji:"🍫",reward:5})
 });
 const aliases=Object.freeze({"sweet bread":"sweetBread",sweetbread:"sweetBread",sweet_bread:"sweetBread","strawberry milkshake":"strawberryShake",strawberryshake:"strawberryShake",strawberry_shake:"strawberryShake","chocolate milkshake":"chocolateShake",chocolateshake:"chocolateShake",chocolate_shake:"chocolateShake"});
 function productIdOf(value){if(value&&typeof value==="object")value=value.productId||value.id;if(typeof value!=="string")return null;const raw=value.trim();if(ProductCatalog[raw])return raw;const normalized=raw.toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g,"").trim();return aliases[normalized]||Object.keys(ProductCatalog).find(id=>id.toLowerCase()===normalized)||null;}
 class Order{
  constructor({id,productId,createdAt=0}){const normalized=productIdOf(productId);if(!id)throw new Error("Order requires an id");if(!normalized)throw new Error("Unknown product: "+productId);this.id=id;this.productId=normalized;this.status=OrderStatus.CREATED;this.createdAt=createdAt;this.completedAt=null;this.cancelledAt=null;}
  activate(){if(this.status!==OrderStatus.CREATED)throw new Error("Only a created order can become active");this.status=OrderStatus.ACTIVE;return this;}
  complete(at){if(this.status!==OrderStatus.ACTIVE)return false;this.status=OrderStatus.COMPLETED;this.completedAt=at;return true;}
  cancel(at){if(this.status===OrderStatus.COMPLETED||this.status===OrderStatus.CANCELLED)return false;this.status=OrderStatus.CANCELLED;this.cancelledAt=at;return true;}
  snapshot(){return {id:this.id,productId:this.productId,product:{...ProductCatalog[this.productId]},status:this.status,createdAt:this.createdAt,completedAt:this.completedAt,cancelledAt:this.cancelledAt};}
 }
 class CustomerOrder{
  constructor({id,customerId,customerName="Customer",order,joinedAt=0}){if(!id||!customerId||!(order instanceof Order))throw new Error("CustomerOrder requires id, customerId, and Order");this.id=id;this.customerId=customerId;this.customerName=customerName;this.order=order;this.joinedAt=joinedAt;}
  snapshot(){return {id:this.id,customerId:this.customerId,customerName:this.customerName,joinedAt:this.joinedAt,order:this.order.snapshot()};}
 }
 class OrderManager{
  constructor({maxActive=3,productSequence=Object.keys(ProductCatalog),customerFactory,rewardSink,now}={}){if(!Number.isInteger(maxActive)||maxActive<1)throw new Error("maxActive must be a positive integer");if(!Array.isArray(productSequence)||!productSequence.length)throw new Error("productSequence cannot be empty");this.maxActive=maxActive;this.productSequence=productSequence.map(id=>{const n=productIdOf(id);if(!n)throw new Error("Unknown product: "+id);return n;});this.customerFactory=customerFactory||((n)=>({id:"customer-"+String(n).padStart(4,"0"),name:"Customer "+n}));this.rewardSink=typeof rewardSink==="function"?rewardSink:()=>{};this.now=typeof now==="function"?now:()=>Date.now();this.active=[];this.completed=[];this.totalRewards=0;this._nextOrder=1;this._nextCustomer=1;this._nextAssociation=1;this._nextProduct=0;this._listeners=new Map();}
  subscribe(name,listener){if(typeof listener!=="function")throw new Error("Listener must be a function");if(!this._listeners.has(name))this._listeners.set(name,new Set());this._listeners.get(name).add(listener);return ()=>this._listeners.get(name)?.delete(listener);}
  _emit(type,payload){const event=Object.freeze({type,...payload,snapshot:this.snapshot()});for(const fn of this._listeners.get(type)||[])fn(event);for(const fn of this._listeners.get("*")||[])fn(event);}
  start(){this.refill();return this.snapshot();}
  refill(){while(this.active.length<this.maxActive){const n=this._nextCustomer++,raw=this.customerFactory(n);if(!raw||!raw.id)throw new Error("customerFactory must return an object with an id");const productId=this.productSequence[this._nextProduct++%this.productSequence.length],order=new Order({id:"order-"+String(this._nextOrder++).padStart(4,"0"),productId,createdAt:this.now()}).activate(),association=new CustomerOrder({id:"customer-order-"+String(this._nextAssociation++).padStart(4,"0"),customerId:String(raw.id),customerName:raw.name||"Customer",order,joinedAt:this.now()});this.active.push(association);this._emit("order:added",{customerOrder:association.snapshot()});}return this.active.map(item=>item.snapshot());}
  submitProduct(product){
   const productId=productIdOf(product);
   if(!productId){const result={ok:false,reason:"unknown-product",productId:null,reward:0};this._emit("product:rejected",result);return result;}
   const association=this.active[0];
   if(!association||association.order.status!==OrderStatus.ACTIVE){const result={ok:false,reason:"no-active-order",productId,reward:0};this._emit("product:rejected",result);return result;}
   if(association.order.productId!==productId){const result={ok:false,reason:"front-order-mismatch",productId,expectedProductId:association.order.productId,reward:0};this._emit("product:rejected",result);return result;}
   if(!association.order.complete(this.now())){const result={ok:false,reason:"order-not-active",productId,reward:0};this._emit("product:rejected",result);return result;}
   this.active.shift();this.completed.push(association);
   const reward=ProductCatalog[productId].reward;this.totalRewards+=reward;this.rewardSink(reward,association.snapshot());
   this._emit("order:completed",{customerOrder:association.snapshot(),productId,reward,totalRewards:this.totalRewards});this.refill();
   return {ok:true,reason:null,productId,reward,customerOrder:association.snapshot()};
  }
  cancel(orderId){const index=this.active.findIndex(item=>item.order.id===orderId);if(index<0)return false;const association=this.active[index];if(!association.order.cancel(this.now()))return false;this.active.splice(index,1);this._emit("order:cancelled",{customerOrder:association.snapshot()});this.refill();return true;}
  snapshot(){return {maxActive:this.maxActive,active:this.active.map(item=>item.snapshot()),completed:this.completed.map(item=>item.snapshot()),totalRewards:this.totalRewards,counters:{nextOrder:this._nextOrder,nextCustomer:this._nextCustomer,nextAssociation:this._nextAssociation,nextProduct:this._nextProduct}};}
  debug(){return this.snapshot();}
 }
 return Object.freeze({OrderStatus,ProductCatalog,productIdOf,Order,CustomerOrder,OrderManager});
});
