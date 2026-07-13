// Two-step startup flow: chibi colors first, world selection second.
(function(global){
 const root=document.getElementById("startCard");
 const customize=document.getElementById("customizeLooks");
 const worlds=document.getElementById("customizeRealm");
 const next=document.getElementById("wizardNextButton");
 const back=document.getElementById("wizardBackButton");
 if(!root||!customize||!worlds||!next||!back)return;

 function show(step,{focus=false}={}){
  const worldStep=step==="worlds";
  root.dataset.step=worldStep?"worlds":"customize";
  customize.hidden=worldStep;worlds.hidden=!worldStep;
  customize.setAttribute("aria-hidden",String(worldStep));worlds.setAttribute("aria-hidden",String(!worldStep));
  if(focus)(worldStep?document.getElementById("worldPickerHeading"):document.getElementById("customizeHeading")).focus({preventScroll:true});
 }
 next.addEventListener("click",()=>show("worlds",{focus:true}));
 back.addEventListener("click",()=>show("customize",{focus:true}));
 global.showPregameCustomization=()=>show("customize",{focus:true});
 global.showWorldPicker=()=>show("worlds",{focus:true});
 global.PregameWizard=Object.freeze({showCustomization:global.showPregameCustomization,showWorldPicker:global.showWorldPicker,currentStep:()=>root.dataset.step});
 show("customize");
})(window);
