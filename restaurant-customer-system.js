(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.RestaurantCustomers=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const CustomerState=Object.freeze({ENTERING:"entering",WALKING:"walking",WAITING:"waiting",LEAVING:"leaving",FADING:"fading",REMOVED:"removed"});
 const DEFAULT_CONFIG=Object.freeze({maxActive:4,moveSpeed:2.4,lineAnchor:Object.freeze({x:0,z:17.25}),lineDirection:Object.freeze({x:1,z:0}),lineSpacing:1.65,waitingFaceTarget:Object.freeze({x:0,z:15.08}),entry:Object.freeze({x:-.8,z:19.45}),exitPath:Object.freeze([Object.freeze({x:5.2,z:18.2}),Object.freeze({x:-.8,z:19.15}),Object.freeze({x:-.8,z:20.05})]),fadeAtPathIndex:1,fadeDuration:.65});
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const clonePoint=point=>({x:Number(point.x),z:Number(point.z)});
 class StraightCustomerLine{
  constructor({anchor=DEFAULT_CONFIG.lineAnchor,direction=DEFAULT_CONFIG.lineDirection,spacing=DEFAULT_CONFIG.lineSpacing,maxActive=DEFAULT_CONFIG.maxActive}={}){
   const length=Math.hypot(direction.x,direction.z);if(!length)throw new Error("Customer line direction cannot be zero");
   if(!Number.isInteger(maxActive)||maxActive<1||maxActive>4)throw new Error("Restaurant customer line supports one to four customers");
   this.anchor=clonePoint(anchor);this.direction={x:direction.x/length,z:direction.z/length};this.spacing=Math.max(.8,Number(spacing)||DEFAULT_CONFIG.lineSpacing);this.maxActive=maxActive;
  }
  targetAt(index){if(!Number.isInteger(index)||index<0||index>=this.maxActive)throw new RangeError("Customer line index is outside its capacity");return {x:this.anchor.x+this.direction.x*this.spacing*index,z:this.anchor.z+this.direction.z*this.spacing*index}}
  snapshot(){return Array.from({length:this.maxActive},(_,index)=>({index,...this.targetAt(index)}))}
 }
 class RestaurantCustomerSystem{
  constructor(options={}){
   this.config={...DEFAULT_CONFIG,...options};this.config.entry=clonePoint(options.entry||DEFAULT_CONFIG.entry);this.config.waitingFaceTarget=clonePoint(options.waitingFaceTarget||DEFAULT_CONFIG.waitingFaceTarget);this.config.exitPath=(options.exitPath||DEFAULT_CONFIG.exitPath).map(clonePoint);
   this.line=options.line||new StraightCustomerLine({anchor:options.lineAnchor||DEFAULT_CONFIG.lineAnchor,direction:options.lineDirection||DEFAULT_CONFIG.lineDirection,spacing:options.lineSpacing||DEFAULT_CONFIG.lineSpacing,maxActive:options.maxActive??DEFAULT_CONFIG.maxActive});
   this.avatarFactory=typeof options.avatarFactory==="function"?options.avatarFactory:()=>null;this.onEvent=typeof options.onEvent==="function"?options.onEvent:()=>{};this.customers=[];this.pending=[];this.nextId=1;this.disposed=false;
  }
  enqueue(order){
   if(this.disposed||!order||order.id==null)throw new Error("Restaurant customers require an order with an id");
   const normalized={...order,id:String(order.id)};if(this.findByOrder(normalized.id)||this.pending.some(item=>item.id===normalized.id))return false;
   if(this.customers.length>=this.line.maxActive){this.pending.push(normalized);this._emit("customer:pending",null,normalized);return false}this._spawn(normalized);return true;
  }
  findByOrder(orderId){return this.customers.find(customer=>customer.order.id===String(orderId))||null}
  completeOrder(orderId){const customer=this.findByOrder(orderId);if(!customer||customer.state!==CustomerState.WAITING)return false;customer.orderCompleted=true;customer.state=CustomerState.LEAVING;customer.pathIndex=0;customer.avatar?.setMotion?.("walk");this._emit("customer:leaving",customer);return true}
  update(dt){
   if(this.disposed)return;const seconds=clamp(Number(dt)||0,0,.1),step=seconds*this.config.moveSpeed,lineCustomers=this.customers.filter(customer=>customer.state!==CustomerState.LEAVING&&customer.state!==CustomerState.FADING);
   lineCustomers.forEach((customer,index)=>{const arrived=this._move(customer,this.line.targetAt(index),step);if(arrived){customer.avatar?.faceDirection?.(this.config.waitingFaceTarget.x-customer.position.x,this.config.waitingFaceTarget.z-customer.position.z);if(customer.state!==CustomerState.WAITING){customer.state=CustomerState.WAITING;customer.avatar?.setMotion?.("idle");this._emit("customer:waiting",customer)}}else if(customer.state!==CustomerState.WALKING){customer.state=CustomerState.WALKING;customer.avatar?.setMotion?.("walk");this._emit("customer:walking",customer)}});
   [...this.customers].filter(customer=>customer.state===CustomerState.LEAVING).forEach(customer=>{const target=this.config.exitPath[customer.pathIndex];if(!target)return this._beginFade(customer);if(this._move(customer,target,step)){customer.pathIndex++;if(customer.pathIndex>this.config.fadeAtPathIndex)this._beginFade(customer)}});
   [...this.customers].filter(customer=>customer.state===CustomerState.FADING).forEach(customer=>{customer.fadeElapsed+=seconds;const opacity=1-customer.fadeElapsed/this.config.fadeDuration;customer.avatar?.setOpacity?.(clamp(opacity,0,1));if(opacity<=0)this._remove(customer)});
   this.customers.forEach(customer=>customer.avatar?.update?.(seconds));this._drain();
  }
  _spawn(order){const id=`restaurant-customer-${String(this.nextId++).padStart(3,"0")}`,variant=(this.nextId-2)%4,avatar=this.avatarFactory({id,order,variant})||null,customer={id,order,state:CustomerState.ENTERING,orderCompleted:false,position:{...this.config.entry},pathIndex:0,fadeElapsed:0,variant,avatar};avatar?.setPosition?.(customer.position.x,customer.position.z);avatar?.setMotion?.("walk");this.customers.push(customer);this._emit("customer:entered",customer);return customer}
  _move(customer,target,step){const dx=target.x-customer.position.x,dz=target.z-customer.position.z,distance=Math.hypot(dx,dz);if(distance<=.04){customer.position.x=target.x;customer.position.z=target.z;customer.avatar?.setPosition?.(target.x,target.z);return true}const amount=Math.min(step,distance);customer.position.x+=dx/distance*amount;customer.position.z+=dz/distance*amount;customer.avatar?.setPosition?.(customer.position.x,customer.position.z);customer.avatar?.faceDirection?.(dx/distance,dz/distance);return false}
  _beginFade(customer){if(!customer.orderCompleted)throw new Error("A restaurant customer cannot leave before its order is completed");customer.state=CustomerState.FADING;customer.fadeElapsed=0;customer.avatar?.setMotion?.("idle");this._emit("customer:fading",customer)}
  _remove(customer){customer.state=CustomerState.REMOVED;customer.avatar?.dispose?.();this.customers=this.customers.filter(item=>item!==customer);this._emit("customer:left",customer)}
  _drain(){while(this.pending.length&&this.customers.length<this.line.maxActive)this._spawn(this.pending.shift())}
  _emit(type,customer,order=customer?.order){this.onEvent(Object.freeze({type,customerId:customer?.id||null,orderId:order?.id||null,state:customer?.state||null}))}
  snapshot(){return {maxActive:this.line.maxActive,active:this.customers.map(customer=>({id:customer.id,orderId:customer.order.id,state:customer.state,orderCompleted:customer.orderCompleted,variant:customer.variant,x:+customer.position.x.toFixed(2),z:+customer.position.z.toFixed(2),opacity:customer.state===CustomerState.FADING?+clamp(1-customer.fadeElapsed/this.config.fadeDuration,0,1).toFixed(2):1})),pending:this.pending.map(order=>order.id),line:this.line.snapshot()}}
  debug(){return this.snapshot()}
  reset(){this.pending.length=0;[...this.customers].forEach(customer=>{customer.avatar?.dispose?.();customer.state=CustomerState.REMOVED});this.customers.length=0}
  dispose(){this.reset();this.disposed=true}
 }
 return Object.freeze({CustomerState,DEFAULT_CONFIG,StraightCustomerLine,RestaurantCustomerSystem});
});
