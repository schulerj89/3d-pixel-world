(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.RestaurantOrders=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 const OrderStatus=Object.freeze({WAITING:"waiting",MADE:"made",COMPLETED:"completed",CANCELLED:"cancelled"});
 const DEFAULT_ORDER_DEFINITIONS=Object.freeze([
  Object.freeze({id:"strawberry-plate",name:"Strawberry Plate",emoji:"🍓",reward:8}),
  Object.freeze({id:"burger-meal",name:"Burger Meal",emoji:"🍔",reward:12}),
  Object.freeze({id:"dinner-plate",name:"Dinner Plate",emoji:"🍽️",reward:16}),
  Object.freeze({id:"sweet-treat",name:"Sweet Treat",emoji:"🧁",reward:10})
 ]);

 function requiredText(value,label){if(typeof value!=="string"||!value.trim())throw new Error(label+" must be a non-empty string");return value.trim()}
 function copyDefinition(value){return {id:value.id,name:value.name,emoji:value.emoji,reward:value.reward}}

 class OrderCatalog{
  constructor(definitions=DEFAULT_ORDER_DEFINITIONS){
   if(!Array.isArray(definitions)||!definitions.length)throw new Error("Order catalog needs at least one definition");
   this._items=new Map();
   definitions.forEach(raw=>{
    const definition={id:requiredText(raw?.id,"Product id"),name:requiredText(raw?.name,"Product name"),emoji:requiredText(raw?.emoji,"Product emoji"),reward:Number(raw?.reward)};
    if(!Number.isFinite(definition.reward)||definition.reward<0)throw new Error("Product reward must be a non-negative number");
    if(this._items.has(definition.id))throw new Error("Duplicate product definition: "+definition.id);
    this._items.set(definition.id,Object.freeze(definition));
   });
   Object.freeze(this);
  }
  has(id){return this._items.has(id)}
  get(id){const item=this._items.get(id);return item?copyDefinition(item):null}
  list(){return [...this._items.values()].map(copyDefinition)}
 }

 class RestaurantOrder{
  constructor({id,customerId,customerName="Guest",definition,createdAt=0}){
   this.id=requiredText(id,"Order id");this.customerId=requiredText(customerId,"Customer id");this.customerName=requiredText(customerName,"Customer name");
   if(!definition)throw new Error("Product definition is required");
   this.definition=Object.freeze(copyDefinition(definition));this.status=OrderStatus.WAITING;this.createdAt=createdAt;this.madeAt=null;this.completedAt=null;this.cancelledAt=null;
  }
  markMade(productId,at){if(this.status!==OrderStatus.WAITING||productId!==this.definition.id)return false;this.status=OrderStatus.MADE;this.madeAt=at;return true}
  complete(at){if(this.status!==OrderStatus.MADE)return false;this.status=OrderStatus.COMPLETED;this.completedAt=at;return true}
  cancel(at){if(this.status===OrderStatus.COMPLETED||this.status===OrderStatus.CANCELLED)return false;this.status=OrderStatus.CANCELLED;this.cancelledAt=at;return true}
  snapshot(){return {id:this.id,customerId:this.customerId,customerName:this.customerName,product:copyDefinition(this.definition),status:this.status,createdAt:this.createdAt,madeAt:this.madeAt,completedAt:this.completedAt,cancelledAt:this.cancelledAt}}
 }

 class RestaurantOrderSystem{
  constructor({catalog=new OrderCatalog(),maxActive=4,now=()=>Date.now(),idFactory,rewardSink,productSequence}={}){
   if(!(catalog instanceof OrderCatalog))throw new Error("catalog must be an OrderCatalog");
   if(!Number.isInteger(maxActive)||maxActive<1||maxActive>4)throw new Error("maxActive must be between 1 and 4");
   this.catalog=catalog;this.maxActive=maxActive;this.now=typeof now==="function"?now:()=>Date.now();this.rewardSink=typeof rewardSink==="function"?rewardSink:()=>{};
   this.idFactory=typeof idFactory==="function"?idFactory:index=>"restaurant-order-"+String(index).padStart(4,"0");
   const sequence=productSequence||catalog.list().map(item=>item.id);
   if(!Array.isArray(sequence)||!sequence.length||sequence.some(id=>!catalog.has(id)))throw new Error("productSequence must contain known catalog ids");
   this.productSequence=[...sequence];this.active=[];this.completed=[];this.cancelled=[];this.totalRewards=0;this._nextId=1;this._nextProduct=0;this._listeners=new Map();
  }
  subscribe(type,listener){if(typeof listener!=="function")throw new Error("Listener must be a function");if(!this._listeners.has(type))this._listeners.set(type,new Set());this._listeners.get(type).add(listener);return ()=>this._listeners.get(type)?.delete(listener)}
  _emit(type,detail){const event=Object.freeze({type,...detail,snapshot:this.snapshot()});for(const listener of this._listeners.get(type)||[])listener(event);for(const listener of this._listeners.get("*")||[])listener(event);return event}
  _find(orderId){return this.active.find(order=>order.id===orderId)||null}
  enqueue({customerId,customerName="Guest",productId}={}){
   if(this.active.length>=this.maxActive)return {ok:false,reason:"queue-full",order:null};
   const chosen=productId||this.productSequence[this._nextProduct++%this.productSequence.length],definition=this.catalog.get(chosen);
   if(!definition)return {ok:false,reason:"unknown-product",order:null};
   const order=new RestaurantOrder({id:this.idFactory(this._nextId++),customerId,customerName,definition,createdAt:this.now()});this.active.push(order);
   const snapshot=order.snapshot();this._emit("order:added",{order:snapshot});return {ok:true,reason:null,order:snapshot};
  }
  markMade(orderId,productId){
   const order=this._find(orderId);if(!order)return {ok:false,reason:"order-not-found",order:null};
   if(order.status!==OrderStatus.WAITING)return {ok:false,reason:"order-not-waiting",order:order.snapshot()};
   if(productId!==order.definition.id)return {ok:false,reason:"product-mismatch",expectedProductId:order.definition.id,order:order.snapshot()};
   order.markMade(productId,this.now());const snapshot=order.snapshot();this._emit("order:made",{order:snapshot});return {ok:true,reason:null,order:snapshot};
  }
  complete(orderId){
   const order=this._find(orderId);if(!order)return {ok:false,reason:"order-not-found",reward:0,order:null};
   if(order.status!==OrderStatus.MADE)return {ok:false,reason:"order-not-made",reward:0,order:order.snapshot()};
   if(this.active[0]!==order)return {ok:false,reason:"order-not-front",reward:0,order:order.snapshot()};
   order.complete(this.now());this.active.splice(this.active.indexOf(order),1);this.completed.push(order);
   const reward=order.definition.reward;this.totalRewards+=reward;const snapshot=order.snapshot();this.rewardSink(reward,snapshot);
   this._emit("order:completed",{order:snapshot,reward,totalRewards:this.totalRewards});return {ok:true,reason:null,reward,order:snapshot};
  }
  completeFront(){const order=this.active[0];return order?this.complete(order.id):{ok:false,reason:"order-not-found",reward:0,order:null}}
  fulfill(orderId,productId){const made=this.markMade(orderId,productId);return made.ok?this.complete(orderId):{...made,reward:0}}
  cancel(orderId){const order=this._find(orderId);if(!order)return false;if(!order.cancel(this.now()))return false;this.active.splice(this.active.indexOf(order),1);this.cancelled.push(order);this._emit("order:cancelled",{order:order.snapshot()});return true}
  snapshot(){return {maxActive:this.maxActive,active:this.active.map(order=>order.snapshot()),completed:this.completed.map(order=>order.snapshot()),cancelled:this.cancelled.map(order=>order.snapshot()),totalRewards:this.totalRewards,nextProductIndex:this._nextProduct}}
  debug(){return this.snapshot()}
 }

 class RestaurantOrderMenu{
  constructor({system,document:doc,collapsed=true,onFulfill}={}){
   if(!(system instanceof RestaurantOrderSystem))throw new Error("RestaurantOrderMenu requires a RestaurantOrderSystem");
   if(!doc?.createElement)throw new Error("RestaurantOrderMenu requires a document");
   this.system=system;this.document=doc;this.onFulfill=typeof onFulfill==="function"?onFulfill:(orderId,productId)=>system.fulfill(orderId,productId);
   this.root=doc.createElement("section");this.root.id="restaurantOrderMenu";this.root.className="restaurantOrderMenu";this.root.setAttribute("aria-label","Restaurant orders");
   this.toggle=doc.createElement("button");this.toggle.type="button";this.toggle.className="restaurantOrderMenu__toggle";this.toggle.setAttribute("aria-controls","restaurantOrderList");
   this.list=doc.createElement("div");this.list.id="restaurantOrderList";this.list.className="restaurantOrderMenu__list";this.list.setAttribute("role","list");this.root.append(this.toggle,this.list);
   this.toggle.addEventListener("click",()=>this.setCollapsed(this.toggle.getAttribute("aria-expanded")==="true"));
   this.unsubscribe=system.subscribe("*",()=>this.render());this.setCollapsed(collapsed);this.render();
  }
  mount(parent=this.document.body){parent.appendChild(this.root);return this}
  setCollapsed(collapsed){this.collapsed=Boolean(collapsed);this.root.classList.toggle("is-collapsed",this.collapsed);this.toggle.setAttribute("aria-expanded",String(!this.collapsed));this.list.hidden=this.collapsed;this.render();return this}
  render(){
   const orders=this.system.snapshot().active;this.toggle.textContent=`📋 Orders (${orders.length})`;this.list.replaceChildren();
   if(!orders.length){const empty=this.document.createElement("p");empty.className="restaurantOrderMenu__empty";empty.textContent="No orders waiting";this.list.appendChild(empty);return}
   orders.forEach((order,index)=>{const row=this.document.createElement("div");row.className="restaurantOrderMenu__order";row.setAttribute("role","listitem");row.dataset.orderId=order.id;const summary=this.document.createElement("span");summary.textContent=`${order.product.emoji} ${order.product.name}`;const reward=this.document.createElement("strong");reward.textContent=`$${order.product.reward}`;row.append(summary,reward);if(index===0){const made=order.status===OrderStatus.MADE,make=this.document.createElement("button");make.type="button";make.className="restaurantOrderMenu__make";make.textContent=made?"Serve order":"Make & serve";make.setAttribute("aria-label",`${made?"Serve":"Make"} ${order.product.name} for ${order.customerName}`);make.addEventListener("click",()=>made?this.system.complete(order.id):this.onFulfill(order.id,order.product.id));row.appendChild(make)}this.list.appendChild(row)});
  }
  destroy(){this.unsubscribe?.();this.root.remove()}
 }

 function browserEventName(type){return type==="order:added"?"restaurant-order-added":type==="order:completed"?"restaurant-order-completed":null}
 function createBrowserRuntime(root=globalThis){
  if(!root?.document)return null;
  const system=new RestaurantOrderSystem({maxActive:4,rewardSink:(amount,order)=>root.gameEconomy?.add?.(amount,"restaurant-order:"+order.id)});
  const menu=new RestaurantOrderMenu({system,document:root.document}).mount();
  system.subscribe("*",event=>{const name=browserEventName(event.type);if(name&&typeof root.CustomEvent==="function"&&root.dispatchEvent)root.dispatchEvent(new root.CustomEvent(name,{detail:event}))});
  const runtime=Object.freeze({system,menu,start:(requests=[])=>{requests.forEach(request=>system.enqueue(request));return system.snapshot()},enqueue:request=>system.enqueue(request),markMade:(orderId,productId)=>system.markMade(orderId,productId),completeOrder:orderId=>system.complete(orderId),completeFront:()=>system.completeFront(),fulfill:(orderId,productId)=>system.fulfill(orderId,productId),subscribe:(type,listener)=>system.subscribe(type,listener),snapshot:()=>system.snapshot(),debug:()=>system.debug()});
  root.restaurantOrders=runtime;return runtime;
 }

 return Object.freeze({OrderStatus,DEFAULT_ORDER_DEFINITIONS,OrderCatalog,RestaurantOrder,RestaurantOrderSystem,RestaurantOrderMenu,createBrowserRuntime});
});

if(typeof window!=="undefined"&&window.document){
 const start=()=>{if(!window.restaurantOrders)window.RestaurantOrders.createBrowserRuntime(window)};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
}
