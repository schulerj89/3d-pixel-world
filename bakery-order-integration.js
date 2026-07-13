// Authoritative bridge between order domain, kitchen production, customer queue, rewards, and HUD.
(function(){
 "use strict";
 const api=window.BakeryOrders;
 if(!api?.OrderManager||!window.BakeryCustomerController)return;
 const panel=document.getElementById("orders"),finish=document.getElementById("finishOrders"),message=document.getElementById("msg");
 const rows=[1,2,3].map(number=>document.getElementById("order"+number));
 const CUSTOMER_NAMES=["Mia","Leo","Ava","Noah","Luna","Kai","Ruby","Theo"];
 let prepared=null,lastTarget=null,lastFrame=performance.now();
 const recordOf=association=>association?.order||association;
 const productOf=association=>{const record=recordOf(association);return record?.product||api.ProductCatalog[record?.productId]||null};
 const orderIdOf=association=>recordOf(association)?.id||null;
 const activeOrders=()=>manager.snapshot().active;
 const frontOrder=()=>activeOrders()[0]||null;
 const colorFor=id=>{let value=0;for(const char of String(id))value=(value*31+char.charCodeAt(0))>>>0;return 0x5577aa+(value%0x886644)};
 const manager=new api.OrderManager({
  maxActive:3,
  productSequence:["cupcake","cookies","cake","croissant","sweetBread","strawberryShake","chocolateShake"],
  customerFactory:index=>({id:"customer-"+String(index).padStart(4,"0"),name:CUSTOMER_NAMES[(index-1)%CUSTOMER_NAMES.length]}),
  rewardSink:()=>{}
 });
 const customerController=new window.BakeryCustomerController({
  THREE,scene:S,createPerson:person,maxActive:3,
  onEvent:()=>refresh()
 });
 window.bakeryOrderManager=manager;
 window.bakeryCustomerController=customerController;

 function syncCustomers(){
  activeOrders().forEach(association=>{
   const product=productOf(association),orderId=orderIdOf(association);
   customerController.enqueue({id:orderId,name:product?.name||"Bakery order",emoji:product?.emoji||"🍰",customerId:association.customerId,customerName:association.customerName,customerColor:colorFor(association.customerId)});
  });
 }
 function chooseFront(association){
  const orderId=orderIdOf(association);if(!association||orderId===lastTarget)return;
  const target=recordOf(association).productId;if(!targetInfo[target])return;
  makeTarget=target;const info=targetInfo[target];
  if(info.mode==="food"){recipeIndex=info.recipe;addedIngredients=0}
  else{shakeIngredients=[];madeShake=null;strawAdded=false;updateShakeList()}
  refreshMakingPanel();lastTarget=orderId;
 }
 function queueStateFor(association){return customerController.findByOrder(orderIdOf(association))?.state||"arriving"}
 function refresh(){
  syncCustomers();
  const list=activeOrders(),front=list[0];chooseFront(front);
  rows.forEach((row,index)=>{
   const association=list[index];
   if(!association){row.textContent="Waiting for customer…";row.dataset.status="empty";row.classList.remove("active-order");return}
   const product=productOf(association),isFront=index===0,state=queueStateFor(association);
   const status=isFront&&prepared?"ready to serve":state==="waiting"?"at counter":state==="queued"?"in line":"walking in";
   row.textContent=`${association.customerName} · ${product.emoji} ${product.name} · ${status}`;
   row.dataset.status=isFront&&prepared?"ready":state;row.classList.toggle("active-order",isFront);
  });
  const frontCustomer=customerController.getFront(),frontReady=front&&frontCustomer?.order.id===orderIdOf(front)&&frontCustomer.state==="waiting";
  finish.disabled=!front||!prepared||!frontReady;
  finish.textContent=!prepared?"🍳 Make the first order":frontReady?"✅ Finish & serve":"🚶 Customer walking to counter";
 }
 function productCompleted(value,source){
  const association=frontOrder();if(!association)return {ok:false,reason:"no-order"};
  const made=api.productIdOf(value),wanted=recordOf(association).productId,product=productOf(association);
  if(made!==wanted){message.textContent=`That is not ${product.name}. ${association.customerName} is still waiting.`;return {ok:false,reason:"mismatch",reward:0}}
  if(prepared)return {ok:false,reason:"already-prepared"};
  prepared={productId:made,source,orderId:orderIdOf(association)};
  message.textContent=`${product.emoji} ${product.name} is ready for ${association.customerName}.`;refresh();return {ok:true};
 }
 function serve(){
  const association=frontOrder(),frontCustomer=customerController.getFront();
  if(!association||!prepared){message.textContent="Make the first customer's order before serving.";refresh();return {ok:false,reward:0}}
  if(frontCustomer?.order.id!==orderIdOf(association)||frontCustomer.state!=="waiting"){message.textContent="Wait for the customer to reach the counter.";refresh();return {ok:false,reward:0}}
  const result=manager.submitProduct(prepared.productId);
  if(!result.ok){message.textContent="That item does not match the first customer's order.";refresh();return result}
  customerController.serveOrder(result.customerOrder.order.id);
  money+=result.reward;servedCount++;updateMoney();prepared=null;lastTarget=null;
  window.dispatchEvent(new CustomEvent("bakery-order-served",{detail:result}));
  message.textContent=`Order served! You earned $${result.reward}.`;refresh();return result;
 }
 function loop(now){
  const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
  const visible=currentPlace==="bakery";
  customerController.customers.forEach(customer=>customer.avatar.visible=visible);
  if(visible)customerController.update(dt);
  requestAnimationFrame(loop);
 }
 finish.addEventListener("pointerdown",event=>{event.preventDefault();event.stopPropagation();serve()});
 panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Current bakery orders");
 manager.subscribe("*",refresh);manager.start();refresh();requestAnimationFrame(loop);
 window.bakeryProductCompleted=productCompleted;
 window.BakeryOrderTracker={refresh,productCompleted,serve,debug:()=>({orders:manager.debug(),customers:customerController.debug(),prepared})};
})();
