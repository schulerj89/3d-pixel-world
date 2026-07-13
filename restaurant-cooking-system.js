(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.RestaurantCooking=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";

 class RestaurantCookingSystem{
  constructor({orders}={}){
   if(!orders?.snapshot||!orders?.markMade||!orders?.subscribe)throw new Error("Restaurant cooking requires the order runtime");
   this.orders=orders;this.heldIngredient=null;this.sessions=new Map();this.listeners=new Set();this.disposed=false;
   this.unsubscribeOrders=orders.subscribe("*",event=>{if(event.type==="order:completed")this.sessions.delete(event.order.id);this._emit("orders:changed",{orderId:event.order?.id||null})});
  }
  subscribe(listener){if(typeof listener!=="function")throw new Error("Cooking listener must be a function");this.listeners.add(listener);return ()=>this.listeners.delete(listener)}
  activeOrder(){return this.orders.snapshot().active[0]||null}
  _session(order=this.activeOrder()){if(!order)return null;if(!this.sessions.has(order.id))this.sessions.set(order.id,{orderId:order.id,added:[],cooked:false});return this.sessions.get(order.id)}
  _ingredient(order,ingredientId){return order?.product?.ingredients?.find(item=>item.id===ingredientId)||null}
  pickUp(ingredientId){
   if(this.disposed)return {ok:false,reason:"disposed"};const order=this.activeOrder();if(!order)return {ok:false,reason:"no-order"};if(order.status!=="waiting")return {ok:false,reason:"order-already-cooked"};if(this.heldIngredient)return {ok:false,reason:"hands-full",held:this.heldIngredient};
   const ingredient=this._ingredient(order,ingredientId);if(!ingredient)return {ok:false,reason:"not-needed"};const session=this._session(order);if(session.added.includes(ingredient.id))return {ok:false,reason:"already-on-stove"};
   this.heldIngredient={...ingredient,orderId:order.id};this._emit("ingredient:picked-up",{orderId:order.id,ingredient:{...ingredient}});return {ok:true,ingredient:{...ingredient}};
  }
  putOnStove(){
   const order=this.activeOrder(),held=this.heldIngredient;if(!order)return {ok:false,reason:"no-order"};if(!held)return {ok:false,reason:"nothing-held"};if(held.orderId!==order.id)return {ok:false,reason:"wrong-order"};
   const session=this._session(order);if(session.added.includes(held.id))return {ok:false,reason:"already-on-stove"};session.added.push(held.id);this.heldIngredient=null;this._emit("ingredient:stove",{orderId:order.id,ingredient:{...held},added:[...session.added]});return {ok:true,ingredient:{...held},ready:this.readyToCook()};
  }
  readyToCook(){const order=this.activeOrder(),session=this._session(order);return Boolean(order&&order.status==="waiting"&&session&&order.product.ingredients.every(item=>session.added.includes(item.id)))}
  cook(){
   const order=this.activeOrder(),session=this._session(order);if(!order)return {ok:false,reason:"no-order"};if(this.heldIngredient)return {ok:false,reason:"ingredient-still-held"};if(!this.readyToCook())return {ok:false,reason:"ingredients-missing",missing:order.product.ingredients.filter(item=>!session.added.includes(item.id)).map(item=>item.id)};
   const result=this.orders.markMade(order.id,order.product.id);if(!result.ok)return result;session.cooked=true;this._emit("dish:cooked",{orderId:order.id,product:{...order.product}});return {ok:true,order:result.order};
  }
  dropHeld(){if(!this.heldIngredient)return false;const ingredient=this.heldIngredient;this.heldIngredient=null;this._emit("ingredient:dropped",{orderId:ingredient.orderId,ingredient});return true}
  progressFor(orderId){const session=this.sessions.get(String(orderId));return {added:[...(session?.added||[])],cooked:Boolean(session?.cooked)}}
  snapshot(){const order=this.activeOrder(),session=this._session(order);return {activeOrderId:order?.id||null,product:order?.product||null,heldIngredient:this.heldIngredient?{...this.heldIngredient}:null,stoveIngredients:session?.cooked?[]:[...(session?.added||[])],readyToCook:this.readyToCook(),cooked:Boolean(session?.cooked),maxIngredients:2}}
  debug(){return this.snapshot()}
  _emit(type,detail={}){const event=Object.freeze({type,...detail,snapshot:this.snapshot()});this.listeners.forEach(listener=>listener(event));return event}
  dispose(){if(this.disposed)return;this.disposed=true;this.unsubscribeOrders?.();this.listeners.clear();this.sessions.clear();this.heldIngredient=null}
 }

 class RestaurantCookingHud{
  constructor({system,document:doc}={}){
   if(!(system instanceof RestaurantCookingSystem)||!doc?.createElement)throw new Error("Cooking HUD requires a system and document");this.system=system;this.document=doc;
   this.root=doc.createElement("section");this.root.id="restaurantCookingHud";this.root.className="restaurantCookingHud";this.root.setAttribute("aria-label","Restaurant cooking status");this.root.innerHTML='<strong>🍳 Kitchen prep</strong><span class="restaurantCookingHud__held"></span><span class="restaurantCookingHud__stove"></span>';
   this.unsubscribe=system.subscribe(()=>this.render());this.render();
  }
  mount(parent=this.document.body){parent.appendChild(this.root);return this}
  render(){const state=this.system.snapshot(),needed=state.product?.ingredients||[];this.root.querySelector(".restaurantCookingHud__held").textContent=state.heldIngredient?`Holding: ${state.heldIngredient.emoji} ${state.heldIngredient.name}`:"Hands empty";this.root.querySelector(".restaurantCookingHud__stove").textContent=state.cooked?`✅ ${state.product.name} cooked`:state.readyToCook?"🔥 Ready to cook":`Stove: ${state.stoveIngredients.length}/${needed.length||0}`}
  destroy(){this.unsubscribe?.();this.root.remove()}
 }

 function createBrowserRuntime(root=globalThis){
  if(!root?.document||!root.restaurantOrders)return null;const system=new RestaurantCookingSystem({orders:root.restaurantOrders}),hud=new RestaurantCookingHud({system,document:root.document}).mount();
  system.subscribe(event=>{root.restaurantOrders.refreshMenu?.();if(typeof root.CustomEvent==="function")root.dispatchEvent?.(new root.CustomEvent("restaurant-cooking-changed",{detail:event}))});
  const runtime=Object.freeze({system,hud,pickUp:id=>system.pickUp(id),putOnStove:()=>system.putOnStove(),cook:()=>system.cook(),dropHeld:()=>system.dropHeld(),progressFor:id=>system.progressFor(id),subscribe:listener=>system.subscribe(listener),snapshot:()=>system.snapshot(),debug:()=>system.debug(),dispose:()=>{hud.destroy();system.dispose()}});root.restaurantCooking=runtime;root.restaurantOrders.refreshMenu?.();return runtime;
 }

 return Object.freeze({RestaurantCookingSystem,RestaurantCookingHud,createBrowserRuntime});
});

if(typeof window!=="undefined"&&window.document){
 const start=()=>{if(!window.restaurantCooking)window.RestaurantCooking.createBrowserRuntime(window)};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
}
