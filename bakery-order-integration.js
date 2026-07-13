// Kitchen/UI adapter for the authoritative BakeryOrders domain model.
(function(){
 "use strict";
 const panel=document.getElementById("orders"),finish=document.getElementById("finishOrders"),message=document.getElementById("msg");
 const rows=[1,2,3].map(n=>document.getElementById("order"+n));
 let manager=null,prepared=null,lastTarget=null;
 const idOf=value=>window.BakeryOrders?.productIdOf?.(value)||String(value?.productId||value?.id||value?.name||value||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
 const snapshot=()=>manager?.snapshot?.()||manager?.debug?.()||{};
 const activeOrders=()=>{const state=snapshot();return state.activeOrders||state.orders||manager?.activeOrders||[]};
 const frontOrder=()=>activeOrders()[0]||null;
 const productOf=order=>order?.product||order?.productId||order?.item;
 const labelOf=order=>productOf(order)?.label||productOf(order)?.name||order?.productName||order?.productId||"Order";
 const customerOf=order=>order?.customer?.name||order?.customerName||"Customer";
 function ensureManager(){
  if(manager)return true;
  const api=window.BakeryOrders;if(!api?.OrderManager)return false;
  manager=window.bakeryOrderManager||api.manager||new api.OrderManager({maxActive:3,rewardSink:()=>{}});
  window.bakeryOrderManager=manager;
  manager.subscribe?.("*",refresh);manager.start?.();manager.refill?.();return true;
 }
 function chooseFront(order){
  const key=order?.id||order?.orderId;if(!order||key===lastTarget)return;
  const target=idOf(productOf(order));
  if(!targetInfo[target])return;
  makeTarget=target;const info=targetInfo[target];
  if(info.mode==="food"){recipeIndex=info.recipe;addedIngredients=0}else{shakeIngredients=[];madeShake=null;strawAdded=false;updateShakeList()}
  refreshMakingPanel();lastTarget=key;
 }
 function refresh(){
  if(!ensureManager()){rows[0].textContent="Opening bakery…";rows.slice(1).forEach(r=>r.textContent="Waiting for customer…");finish.disabled=true;return}
  const list=activeOrders(),front=list[0];chooseFront(front);
  rows.forEach((row,index)=>{
   const order=list[index];
   if(!order){row.textContent="Waiting for customer…";row.dataset.status="waiting";row.classList.remove("active-order");return}
   const isFront=index===0,status=isFront&&prepared?"ready":"waiting";
   row.textContent=customerOf(order)+" · "+labelOf(order)+" · "+status;
   row.dataset.status=status;row.classList.toggle("active-order",isFront);
  });
  finish.disabled=!front||!prepared;
  finish.textContent=prepared?"✅ Finish & serve":"🍳 Make the first order";
 }
 function productCompleted(value,source){
  if(!ensureManager())return {ok:false,reason:"unavailable"};
  const order=frontOrder();if(!order)return {ok:false,reason:"no-order"};
  const made=idOf(value),wanted=idOf(productOf(order));
  if(made!==wanted){message.textContent="That is not "+labelOf(order)+". "+customerOf(order)+" is still waiting.";refresh();return {ok:false,reason:"mismatch"}}
  if(prepared)return {ok:false,reason:"already-prepared"};
  prepared={product:productOf(order),source,orderId:order.id||order.orderId};
  message.textContent=labelOf(order)+" is ready. Tap Finish & serve!";refresh();return {ok:true};
 }
 function serve(){
  const order=frontOrder();
  if(!order||!prepared){message.textContent="Make the first customer's order before serving.";refresh();return}
  const result=manager.submitProduct(prepared.product);
  if(!result||result.ok===false||result.matched===false){message.textContent=result?.message||"That item does not match the first order.";refresh();return}
  const reward=Number(result.reward??result.payout??0);
  if(reward>0){money+=reward;updateMoney()}servedCount++;
  const servedOrderId=prepared.orderId;prepared=null;lastTarget=null;
  const queue=window.bakeryCustomerController||window.bakeryCustomerQueue||window.BakeryCustomerQueue?.controller||window.BakeryCustomerQueue?.queue;
  const completed=result.order||result.completedOrder||{id:servedOrderId,customerId:result.customerId};
  if(queue?.serveOrder)queue.serveOrder(completed);
  else if(queue?.completeOrder)queue.completeOrder(completed.id||servedOrderId);
  else queue?.serveFrontCustomer?.(completed.id||servedOrderId);
  message.textContent="Order served!"+(reward?" You earned $"+reward+".":"");refresh();
 }
 finish.addEventListener("pointerdown",event=>{event.preventDefault();event.stopPropagation();serve()});
 panel.setAttribute("role","dialog");panel.setAttribute("aria-label","Current bakery orders");
 window.bakeryProductCompleted=productCompleted;
 window.BakeryOrderTracker={refresh,productCompleted,serve,debug:()=>({snapshot:snapshot(),prepared})};
 refresh();setInterval(refresh,1000);
})();
