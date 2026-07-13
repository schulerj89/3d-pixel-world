// Two-step startup flow: chibi colors first, world selection second.
(function(global){
 const root=document.getElementById("startCard");
 const customize=document.getElementById("customizeLooks");
 const worlds=document.getElementById("customizeRealm");
 const next=document.getElementById("wizardNextButton");
 const back=document.getElementById("wizardBackButton");
 if(!root||!customize||!worlds||!next||!back)return;

 const compactLandscape=global.matchMedia("(orientation: landscape) and (max-height: 540px)");
 const colorControls=[
  ["startHairColor","hair"],
  ["startSkin","skin"],
  ["startPants","pants or skirt"],
  ["startOutfitColor","outfit"]
 ];

 function addColorCycler(id,label){
  const palette=document.getElementById(id);
  if(!palette||palette.closest(".colorCycleTrack"))return;
  const track=document.createElement("div");
  track.className="colorCycleTrack";
  const previous=document.createElement("button");
  const following=document.createElement("button");
  previous.type=following.type="button";
  previous.className=following.className="colorCycleButton";
  previous.innerHTML="&#8592;";following.innerHTML="&#8594;";
  previous.setAttribute("aria-label",`Previous ${label} color`);
  following.setAttribute("aria-label",`Next ${label} color`);
  palette.before(track);track.append(previous,palette,following);

  const swatches=()=>Array.from(palette.querySelectorAll(".swatch"));
  const selectedIndex=()=>Math.max(0,swatches().findIndex(swatch=>swatch.classList.contains("selected")));
  function sync(){
   const compact=compactLandscape.matches;
   const choices=swatches();
   const active=selectedIndex();
   track.classList.toggle("compact",compact);
   previous.hidden=following.hidden=!compact;
   previous.tabIndex=following.tabIndex=compact?0:-1;
   choices.forEach((swatch,index)=>{
    swatch.hidden=compact&&index!==active;
    swatch.tabIndex=compact?(index===active?0:-1):0;
   });
  }
  function cycle(offset){
   const choices=swatches();
   if(!choices.length)return;
   choices[(selectedIndex()+offset+choices.length)%choices.length].click();
   sync();
  }
  previous.addEventListener("click",()=>cycle(-1));
  following.addEventListener("click",()=>cycle(1));
  new MutationObserver(sync).observe(palette,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  if(compactLandscape.addEventListener)compactLandscape.addEventListener("change",sync);
  else compactLandscape.addListener?.(sync);
  sync();
 }
 colorControls.forEach(control=>addColorCycler(...control));

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
