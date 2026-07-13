// Shared transient notifications. The observer also upgrades legacy direct
// #msg text assignments, so every existing interaction gets the same timeout.
(function(){
 "use strict";
 const element=document.getElementById("msg");
 if(!element)return;
 element.setAttribute("role","status");
 element.setAttribute("aria-live","polite");
 let holdTimer=0,fadeTimer=0,clearing=false,duration=3000;
 function schedule(){
  if(clearing)return;
  clearTimeout(holdTimer);clearTimeout(fadeTimer);
  element.classList.remove("notification-fade");
  if(!element.textContent.trim())return;
  holdTimer=setTimeout(()=>{
   element.classList.add("notification-fade");
   fadeTimer=setTimeout(()=>{
    clearing=true;element.textContent="";element.classList.remove("notification-fade");clearing=false;
   },350);
  },duration);
 }
 new MutationObserver(schedule).observe(element,{childList:true,characterData:true,subtree:true});
 window.showNotification=(message,options={})=>{
  duration=Math.max(0,Number(options.duration)||3000);
  element.textContent=String(message||"");schedule();
 };
})();
