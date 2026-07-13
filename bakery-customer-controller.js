(function(global){
 "use strict";
 const DEFAULTS={maxActive:3,moveSpeed:2.25,arriveAt:{x:6.5,z:4.5},queue:[{x:3.8,z:-2.5},{x:3.8,z:-1.15},{x:3.8,z:.2}],exitPath:[{x:5.3,z:1.8},{x:6.8,z:4.8}],labelHeight:3.05};
 function makeOrderLabel(THREE,order){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=128;
  const context=canvas.getContext("2d");context.fillStyle="rgba(40,25,57,.9)";context.beginPath();context.roundRect(8,8,496,112,30);context.fill();
  context.fillStyle="#fff";context.font="700 42px system-ui, sans-serif";context.textAlign="center";context.textBaseline="middle";
  const title=`${order.emoji||"🍰"} ${order.name||"Bakery order"}`;context.fillText(title.length>25?`${title.slice(0,24)}…`:title,256,64);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false});const sprite=new THREE.Sprite(material);
  sprite.scale.set(2.65,.66,1);sprite.renderOrder=20;sprite.userData.dispose=()=>{texture.dispose();material.dispose()};return sprite;
 }
 class BakeryCustomerController{
  constructor(options={}){
   if(!options.THREE||!options.scene||typeof options.createPerson!=="function")throw new Error("BakeryCustomerController requires THREE, scene, and createPerson");
   this.THREE=options.THREE;this.scene=options.scene;this.createPerson=options.createPerson;this.config={...DEFAULTS,...options};
   this.config.arriveAt={...DEFAULTS.arriveAt,...options.arriveAt};this.config.queue=options.queue||DEFAULTS.queue.map(point=>({...point}));
   this.config.exitPath=options.exitPath||DEFAULTS.exitPath.map(point=>({...point}));this.onEvent=typeof options.onEvent==="function"?options.onEvent:()=>{};
   this.customers=[];this.pending=[];this.nextCustomerId=1;this.disposed=false;
  }
  enqueue(order){
   if(this.disposed||!order||order.id==null)return null;const id=String(order.id),existing=this.findByOrder(id);
   if(existing||this.pending.some(item=>item.id===id))return existing?.id||null;const normalized={...order,id};
   if(this.customers.length>=this.config.maxActive||this.customers.some(customer=>customer.state==="entering")){this.pending.push(normalized);return null}return this._spawn(normalized).id;
  }
  _spawn(order){
   const color=order.customerColor??Math.floor(Math.random()*0xffffff),avatar=this.createPerson(color);if(avatar.parent!==this.scene)this.scene.add(avatar);
   avatar.position.set(this.config.arriveAt.x,0,this.config.arriveAt.z);const label=makeOrderLabel(this.THREE,order);label.position.set(0,this.config.labelHeight,0);avatar.add(label);
   const customer={id:`customer-${this.nextCustomerId++}`,order,avatar,label,state:"entering",exitIndex:0};avatar.userData.bakeryCustomerId=customer.id;avatar.userData.orderId=order.id;
   this.customers.push(customer);this._emit("customer-entered",customer);return customer;
  }
  findByOrder(orderId){return this.customers.find(customer=>customer.order.id===String(orderId))||null}
  getFront(){return this.customers.find(customer=>customer.state!=="leaving")||null}
  serveOrder(orderId){const front=this.getFront();if(!front||front.order.id!==String(orderId)||front.state!=="waiting")return false;front.state="leaving";front.exitIndex=0;front.label.visible=false;this._emit("customer-served",front);return true}
  serveCustomer(customerId){const customer=this.customers.find(item=>item.id===customerId);return customer?this.serveOrder(customer.order.id):false}
  update(dt){
   if(this.disposed)return;const step=Math.min(Math.max(Number(dt)||0,0),.1)*this.config.moveSpeed,queueing=this.customers.filter(customer=>customer.state!=="leaving");
   queueing.forEach((customer,index)=>{const target=this.config.queue[Math.min(index,this.config.queue.length-1)],arrived=this._move(customer,target,step),next=arrived?(index===0?"waiting":"queued"):"entering";if(customer.state!==next){customer.state=next;this._emit(next==="waiting"?"customer-ready":"queue-changed",customer)}});
   [...this.customers].filter(customer=>customer.state==="leaving").forEach(customer=>{const target=this.config.exitPath[customer.exitIndex];if(this._move(customer,target,step)&&++customer.exitIndex>=this.config.exitPath.length)this._remove(customer,"customer-left")});this._drainPending();
  }
  _move(customer,target,step){const dx=target.x-customer.avatar.position.x,dz=target.z-customer.avatar.position.z,distance=Math.hypot(dx,dz);if(distance<=.08){customer.avatar.position.set(target.x,customer.avatar.position.y,target.z);return true}const amount=Math.min(step,distance);customer.avatar.position.x+=dx/distance*amount;customer.avatar.position.z+=dz/distance*amount;customer.avatar.rotation.y=Math.atan2(dx,dz);customer.avatar.rotation.z=Math.sin(performance.now()*.012+Number(customer.id.split("-")[1]))*.025;return false}
  _drainPending(){if(this.pending.length&&this.customers.length<this.config.maxActive&&!this.customers.some(customer=>customer.state==="entering"))this._spawn(this.pending.shift())}
  _remove(customer,eventName){customer.label.userData.dispose?.();customer.avatar.remove(customer.label);this.scene.remove(customer.avatar);this.customers=this.customers.filter(item=>item!==customer);this._emit(eventName,customer)}
  _emit(type,customer){this.onEvent({type,customerId:customer.id,order:{...customer.order},state:customer.state})}
  reset(){this.pending.length=0;[...this.customers].forEach(customer=>this._remove(customer,"customer-reset"))}
  dispose(){this.reset();this.disposed=true}
  debug(){return {active:this.customers.map(({id,order,state,avatar})=>({id,orderId:order.id,state,x:+avatar.position.x.toFixed(2),z:+avatar.position.z.toFixed(2)})),pending:this.pending.map(order=>order.id),front:this.getFront()?.id||null,maxActive:this.config.maxActive}}
 }
 global.BakeryCustomerController=BakeryCustomerController;
})(window);
