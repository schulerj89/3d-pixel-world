// Kitchen recipes, blender interactions, order completion, camera touch, and stock flow.
// Blender interaction
const blenderBtn=document.getElementById("blenderButton");
const smoothieMsg=document.getElementById("smoothieMessage");
let blenderBusy=false;
setInterval(()=>{
 const station=KITCHEN_STATIONS.blender;
 const near=Math.hypot(P.position.x-station.x,P.position.z-station.z)<2.7;
 blenderBtn.style.display="none";
},120);
blenderBtn.onclick=()=>{
 if(blenderBusy)return;
 blenderBusy=true;
 runBlenderEffect();
 blenderBtn.textContent="🌀 BLENDING...";
 smoothieMsg.style.display="block";
 smoothieMsg.textContent="🍓 Adding strawberries, banana, and fruit!";
 let shakes=0;
 const timer=setInterval(()=>{
  blenderStation.rotation.y=(shakes%2?.035:-.035);
  shakes++;
  if(shakes>18){
   clearInterval(timer);blenderStation.rotation.y=0;
   blenderBtn.textContent="🥤 USE BLENDER";
   smoothieMsg.textContent="🥤 Your berry-banana smoothie is ready!";
   setTimeout(()=>smoothieMsg.style.display="none",2500);
   blenderBusy=false;
  }
 },80);
};


// Milkshake ingredient system
const shakePanel=document.getElementById("shakePanel");
const shakeList=document.getElementById("shakeList");
const shakeResult=document.getElementById("shakeResult");
const addStrawBtn=document.getElementById("addStraw");
let shakeIngredients=[],madeShake=null,strawAdded=false;
function updateShakeList(){
 shakeList.textContent="Blender: "+(shakeIngredients.length?shakeIngredients.map(x=>({strawberry:"🍓 Strawberry",banana:"🍌 Banana",milk:"🥛 Milk",chocolate:"🍫 Chocolate"}[x])).join(", "):"Empty");
}
setInterval(()=>{
 const station=KITCHEN_STATIONS.blender;
 const near=Math.hypot(P.position.x-station.x,P.position.z-station.z)<2.7;
 shakePanel.style.display=(currentPlace==="bakery"&&inKitchen===true&&near)?"block":"none";
 blenderBtn.style.display="none";
},100);
document.querySelectorAll("[data-shake]").forEach(b=>b.onclick=()=>{
 const item=b.dataset.shake;
 if(!shakeIngredients.includes(item)){shakeIngredients.push(item);updateShakeList();shakeResult.textContent=({strawberry:"Strawberry added! 🍓",banana:"Banana added! 🍌",milk:"Milk added! 🥛",chocolate:"Chocolate added! 🍫"}[item])}
});
document.getElementById("blendShake").onclick=()=>{
 if(!shakeIngredients.includes("milk")){shakeResult.textContent="Add milk first! 🥛";return}
 if(shakeIngredients.includes("strawberry")){
  madeShake="strawberry";shakeResult.textContent="🍓 Strawberry milkshake made! Add a straw!";
 }else if(shakeIngredients.includes("chocolate")){
  madeShake="chocolate";shakeResult.textContent="🍫 Chocolate milkshake made! Add a straw!";
 }else{
  shakeResult.textContent="Add strawberry or chocolate!";return;
 }
 shakeIngredients=[];updateShakeList();addStrawBtn.style.display="block";strawAdded=false;
};
addStrawBtn.onclick=()=>{
 if(!madeShake)return;
 strawAdded=true;addStrawBtn.style.display="none";
 shakeResult.innerHTML=(madeShake==="strawberry"?"🍓 Strawberry":"🍫 Chocolate")+" milkshake ready! <span style='font-size:28px'>🥤</span><br>Red and white striped straw added! ❤️🤍";
};


// Show the milkshake station only while the player is in the kitchen.
setInterval(()=>{
 const page4Open=currentPlace==="bakery"&&inKitchen===true;
 blenderStation.visible=page4Open;
 if(!page4Open){document.getElementById("shakePanel").style.display="none";document.getElementById("blenderButton").style.display="none";}
},80);


function hideMilkshakeIngredientTags(){
 ["tagStrawberry","tagBanana","tagMilk","tagChocolate"].forEach(id=>{
   const el=document.getElementById(id);
   if(el) el.style.display="none";
 });
}

// Floating labels for milkshake ingredients in the kitchen.
const ingredientTags = [
  {id:"tagStrawberry", pos:new THREE.Vector3(-3.65,3.45,-19.6)},
  {id:"tagBanana", pos:new THREE.Vector3(-2.7,3.45,-19.6)},
  {id:"tagMilk", pos:new THREE.Vector3(-.8,3.45,-19.6)},
  {id:"tagChocolate", pos:new THREE.Vector3(3.25,3.45,-19.6)}
];
function updateIngredientTags(){
  const page4Open = currentPlace==="bakery" && inKitchen===true && inStorage!==true;
  const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.2;
  ingredientTags.forEach(t=>{
    const el=document.getElementById(t.id);
    if(!page4Open||!nearShelf){el.style.display="none";return;}
    const v=t.pos.clone().project(C);
    if(v.z<-1||v.z>1){el.style.display="none";return;}
    el.style.display="block";
    el.style.left=((v.x*.5+.5)*innerWidth-el.offsetWidth/2)+"px";
    el.style.top=((-v.y*.5+.5)*innerHeight-el.offsetHeight-8)+"px";
  });
}
setInterval(updateIngredientTags,80);


// ===== Recipe target system + cleaner kitchen HUD =====
let makeTarget="cupcake";
const targetInfo={
 cupcake:{mode:"food",recipe:0,name:"🧁 Cupcake",need:["Egg","Milk","Flour"]},
 cookies:{mode:"food",recipe:1,name:"🍪 Cookies",need:["Butter","Flour","Sugar"]},
 cake:{mode:"food",recipe:2,name:"🎂 Cake",need:["Egg","Milk","Flour","Sugar"]},
 sweetBread:{mode:"food",recipe:3,name:"🍞 Sweet Bread",need:["Flour","Milk","Sugar","Butter"]},
 croissant:{mode:"food",recipe:4,name:"🥐 Croissant",need:["Flour","Milk","Butter"]},
 strawberryShake:{mode:"shake",name:"🍓 Strawberry Milkshake",need:["Milk","Strawberry"]},
 chocolateShake:{mode:"shake",name:"🍫 Chocolate Milkshake",need:["Milk","Chocolate"]}
};
function prettyIngredient(n){
 return ({Egg:"🥚 Egg",Milk:"🥛 Milk",Flour:"🌾 Flour",Sugar:"🍬 Sugar",Butter:"🧈 Butter",Strawberry:"🍓 Strawberry",Banana:"🍌 Banana",Chocolate:"🍫 Chocolate"})[n]||n;
}
function shakeHaveNames(){return shakeIngredients.map(x=>({strawberry:"Strawberry",banana:"Banana",milk:"Milk",chocolate:"Chocolate"})[x]);}
function targetDoneNames(){
 const t=targetInfo[makeTarget];
 return t.mode==="food"?t.need.slice(0,addedIngredients):shakeHaveNames();
}
function targetMissing(){
 const t=targetInfo[makeTarget],done=targetDoneNames();
 return t.need.filter(n=>!done.includes(n));
}
function refreshMakingPanel(){
 const t=targetInfo[makeTarget];
 document.querySelectorAll("#makeChoices button").forEach(b=>b.classList.toggle("activeChoice",b.dataset.make===makeTarget));
 document.getElementById("recipeName").textContent=t.name;
 const done=targetDoneNames();
 ingredientList.innerHTML="";
 t.need.forEach(n=>{
   const d=document.createElement("div");
   const ok=done.includes(n);
   d.className="ingredient"+(ok?" done":"");
   d.textContent=(ok?"✅ ":"⬜ ")+prettyIngredient(n);
   ingredientList.appendChild(d);
 });
 document.getElementById("makeFood").style.display="none";
}
showRecipe=refreshMakingPanel;
document.querySelectorAll("#makeChoices button").forEach(b=>b.addEventListener("pointerdown",e=>{
 e.preventDefault();
 makeTarget=b.dataset.make;
 const t=targetInfo[makeTarget];
 if(t.mode==="food"){
   recipeIndex=t.recipe;addedIngredients=0;
 }else{
   shakeIngredients=[];madeShake=null;strawAdded=false;updateShakeList();
   document.getElementById("addStraw").style.display="none";
   document.getElementById("shakeResult").textContent="";
 }
 refreshMakingPanel();
 document.getElementById("msg").textContent="Now making "+t.name+"! The ingredients you need are glowing. ✨";
}));

// Replace the old shelf buttons with one recipe-aware button.
function replaceShelfButton(id){
 const old=document.getElementById(id);
 const fresh=old.cloneNode(true);
 old.parentNode.replaceChild(fresh,old);
 return fresh;
}
const smartFoodGrab=replaceShelfButton("ingredientGrab");
const smartShakeGrab=replaceShelfButton("shakeGrab");

function ingredientIsActive(name){
 const t=targetInfo[makeTarget];
 if(t.mode==="food"){
   const needed=t.need[addedIngredients];
   return name===needed;
 }
 return t.need.includes(name)&&!shakeHaveNames().includes(name);
}
function updateSmartShelfButtons(){
 document.body.classList.toggle("kitchen-clean",inKitchen);
 smartFoodGrab.style.display="none";
 smartShakeGrab.style.display="none";
 if(!inKitchen||!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 let point=selectedIngredient.position.clone();point.y+=1.0;point.project(C);
 const left=((point.x*.5+.5)*innerWidth-68)+"px";
 const top=((-point.y*.5+.5)*innerHeight-42)+"px";
 const t=targetInfo[makeTarget];
 const btn=t.mode==="food"?smartFoodGrab:smartShakeGrab;
 btn.style.left=left;btn.style.top=top;
 btn.innerHTML=(t.mode==="food"?"🍰 GRAB FOR RECIPE":"🥤 ADD TO BLENDER")+"<br>"+selectedIngredient.userData.emoji+" "+name;
 btn.style.display="block";
}
smartFoodGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 addedIngredients++;
 refreshMakingPanel();
 document.getElementById("msg").textContent=selectedIngredient.userData.emoji+" "+name+" activated and added! ✨";
 if(targetMissing().length===0)document.getElementById("msg").textContent+=" You have everything—go to the stove!";
});
smartShakeGrab.addEventListener("pointerdown",e=>{
 e.preventDefault();
 if(!selectedIngredient)return;
 const name=selectedIngredient.userData.ingredient;
 if(!ingredientIsActive(name))return;
 const map={Strawberry:"strawberry",Banana:"banana",Milk:"milk",Chocolate:"chocolate"};
 shakeIngredients.push(map[name]);updateShakeList();refreshMakingPanel();
 document.getElementById("msg").textContent=selectedIngredient.userData.emoji+" "+name+" activated and added to the blender! ✨";
 if(targetMissing().length===0)document.getElementById("msg").textContent+=" You have everything—walk to the blender!";
});

// Glow only the ingredients needed for the chosen item.
let glowClock=0;
function updateActiveIngredients(){
 glowClock+=.12;
 ingredientModels.forEach(item=>{
   const active=ingredientIsActive(item.userData.ingredient);
   const s=active?1.08+Math.sin(glowClock)*.05:.92;
   item.scale.setScalar(s);
   item.traverse(o=>{
     if(o.isMesh&&o.material){
       o.material.transparent=true;
       o.material.opacity=active?1:.42;
       if("emissive" in o.material){
         o.material.emissive.setHex(active?0x332800:0x000000);
         o.material.emissiveIntensity=active?.8:0;
       }
     }
   });
 });
}
setInterval(()=>{updateSmartShelfButtons();updateActiveIngredients()},80);

// Make the blender produce only the selected shake.
const oldBlend=document.getElementById("blendShake");
const newBlend=oldBlend.cloneNode(true);oldBlend.parentNode.replaceChild(newBlend,oldBlend);
newBlend.addEventListener("pointerdown",e=>{
 e.preventDefault();
 const t=targetInfo[makeTarget];
 if(t.mode!=="shake"){shakeResult.textContent="Choose a milkshake first!";return}
 if(targetMissing().length){shakeResult.textContent="You still need: "+targetMissing().map(prettyIngredient).join(", ");return}
 runBlenderEffect();
 madeShake=makeTarget==="strawberryShake"?"strawberry":"chocolate";
 shakeResult.textContent=t.name+" made! Add the striped straw! 🥤";
 addStrawBtn.style.display="block";
});
refreshMakingPanel();


// ===== FINAL MILKSHAKE UI CLEANUP =====
const blenderReadyIcon=document.getElementById("blenderReadyIcon");

// The old overlay and old floating add button are no longer used.
document.getElementById("shakePanel").style.display="none";
document.getElementById("shakeGrab").style.display="none";

function finalMilkshakeUI(){
  document.getElementById("shakePanel").style.display="none";
  document.getElementById("shakeGrab").style.display="none";

  const target=targetInfo[makeTarget];
  const shakeSelected=target && target.mode==="shake";
  const allReady=shakeSelected && targetMissing().length===0 && !madeShake;
 const station=KITCHEN_STATIONS.blender;
 const nearBlender=Math.hypot(P.position.x-station.x,P.position.z-station.z)<3.2;
  const show=inKitchen && currentPlace==="bakery" && allReady && nearBlender;

  if(!show){
    blenderReadyIcon.style.display="none";
    return;
  }

  // Keep the icon directly over the real blender.
  const p=new THREE.Vector3(station.x,2.65,station.z).project(C);
  if(p.z<-1||p.z>1){
    blenderReadyIcon.style.display="none";
    return;
  }
  blenderReadyIcon.style.display="block";
  blenderReadyIcon.style.left=((p.x*.5+.5)*innerWidth-39)+"px";
  blenderReadyIcon.style.top=((-p.y*.5+.5)*innerHeight-88)+"px";
}

blenderReadyIcon.addEventListener("pointerdown",e=>{
  e.preventDefault();
  e.stopPropagation();
  const target=targetInfo[makeTarget];
  if(!target || target.mode!=="shake" || targetMissing().length)return;

  runBlenderEffect();
  madeShake=makeTarget==="strawberryShake"?"strawberry":"chocolate";
  blenderReadyIcon.style.display="none";
  addStrawBtn.style.display="block";
  shakeResult.textContent=target.name+" made! Add the red-and-white striped straw! ❤️🤍";
  document.getElementById("msg").textContent=target.name+" is blended! Add the striped straw. 🥤";
});

// Make the straw button appear as a compact icon near the blender instead of opening the overlay.
addStrawBtn.style.position="fixed";
addStrawBtn.style.zIndex="411";
addStrawBtn.style.width="76px";
addStrawBtn.style.height="76px";
addStrawBtn.style.borderRadius="50%";
addStrawBtn.style.fontSize="0";
addStrawBtn.innerHTML="🥤";
addStrawBtn.style.background="#fff";
addStrawBtn.style.border="4px solid #ff5577";

function positionStrawIcon(){
  if(addStrawBtn.style.display==="none" || !inKitchen || !madeShake)return;
  const station=KITCHEN_STATIONS.blender;
  const p=new THREE.Vector3(station.x,2.65,station.z).project(C);
  addStrawBtn.style.left=((p.x*.5+.5)*innerWidth-38)+"px";
  addStrawBtn.style.top=((-p.y*.5+.5)*innerHeight-88)+"px";
}

setInterval(()=>{
  finalMilkshakeUI();
  positionStrawIcon();
},80);


// ===== BAKERY ORDER TV + CHECK BUTTON =====
(function(){
 const checkBtn=document.getElementById("checkHouse");
 const orders=document.getElementById("orders");

 checkBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   if(typeof showHouse==="function") showHouse();
   // Put the player at the open front side of the house, facing inward.
   P.position.set(0,0,HOUSE_HALF_DEPTH-1.25);
   P.rotation.set(0,Math.PI,0);
   cameraHeight=HOUSE_CONFIG.camera.height;
   cameraDistance=HOUSE_CONFIG.camera.distance;
   C.position.set(0,cameraHeight,HOUSE_HALF_DEPTH+cameraDistance*.55);
   C.lookAt(0,1.2,1.3);
   orders.style.display="none";
   document.getElementById("msg").textContent="Teleported to the front of your house! 🏠✨";
 });

 // The bakery order TV belongs in the kitchen.
 setInterval(()=>{
   const page4=currentPlace==="bakery"&&inKitchen===true&&inStorage!==true;
   bakeryOrderTV.visible=page4;
   if(!page4) orders.style.display="none";
 },100);

 // Refresh the bakery TV orders whenever the kitchen becomes active.
 const oldEnterKitchen=enterKitchen;
 enterKitchen=function(){
   oldEnterKitchen();
   newOrders();
   orders.style.display="block";
 };
})();


// ===== FINAL RELIABLE INGREDIENT GRAB BUTTON =====
(function(){
  const fixedGrab=document.getElementById("fixedIngredientGrab");

  // Hide the older floating grab buttons so they cannot overlap or steal taps.
  const oldFood=document.getElementById("ingredientGrab");
  const oldShake=document.getElementById("shakeGrab");
  if(oldFood) oldFood.style.setProperty("display","none","important");
  if(oldShake) oldShake.style.setProperty("display","none","important");

  function currentNeededIngredient(){
    const t=targetInfo[makeTarget];
    if(!t)return null;
    if(t.mode==="food") return t.need[addedIngredients] || null;
    const already=shakeHaveNames();
    return t.need.find(name=>!already.includes(name)) || null;
  }

  function updateFixedGrab(){
    if(!inKitchen || !selectedIngredient){
      fixedGrab.style.display="none";
      return;
    }

    const name=selectedIngredient.userData.ingredient;
    const needed=currentNeededIngredient();

    // Only show the button when standing by the correct ingredient.
    if(!needed || name!==needed){
      fixedGrab.style.display="none";
      return;
    }

    const t=targetInfo[makeTarget];
    fixedGrab.style.background=t.mode==="shake"?"#ff9ed2":"#ffd86b";
    fixedGrab.innerHTML=(t.mode==="shake"?"🥤 ADD TO BLENDER":"🍰 GRAB FOR RECIPE")
      +"<br>"+selectedIngredient.userData.emoji+" "+name;
    fixedGrab.style.display="block";
  }

  function grabCurrentIngredient(e){
    e.preventDefault();
    e.stopPropagation();

    if(!inKitchen || !selectedIngredient)return;

    const t=targetInfo[makeTarget];
    const name=selectedIngredient.userData.ingredient;
    const needed=currentNeededIngredient();

    if(!t || !needed || name!==needed){
      document.getElementById("msg").textContent="Walk closer to the glowing ingredient you need. ✨";
      return;
    }

    if(t.mode==="food"){
      addedIngredients++;
      refreshMakingPanel();
      document.getElementById("msg").textContent=
        selectedIngredient.userData.emoji+" "+name+" grabbed for "+t.name+"! ✅";
      if(targetMissing().length===0){
        document.getElementById("msg").textContent+=" You have everything—go to the stove! 🔥";
      }
    }else{
      const map={Strawberry:"strawberry",Banana:"banana",Milk:"milk",Chocolate:"chocolate"};
      const key=map[name];
      if(key && !shakeIngredients.includes(key)) shakeIngredients.push(key);
      updateShakeList();
      refreshMakingPanel();
      document.getElementById("msg").textContent=
        selectedIngredient.userData.emoji+" "+name+" added to the blender! ✅";
      if(targetMissing().length===0){
        document.getElementById("msg").textContent+=" You have everything—go to the blender! 🥤";
      }
    }

    fixedGrab.style.display="none";
  }

  fixedGrab.addEventListener("pointerdown",grabCurrentIngredient);
  fixedGrab.addEventListener("click",e=>e.preventDefault());

  setInterval(updateFixedGrab,70);
})();


// ===== CUPS, STRIPED STRAWS, AND BLENDER LIQUID =====
(function(){
  const accessoryGrab=document.getElementById("blenderAccessoryGrab");

  // New 3D props near the blender station.
  function localBox(w,h,d,c,x,y,z){
    const m=new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({color:c,transparent:false})
    );
    m.position.set(x,y,z);
    m.castShadow=true;
    m.receiveShadow=true;
    blenderStation.add(m);
    return m;
  }

  // Stack of cups
  localBox(.55,.08,.55,0xd7b08b,-5.15,1.02,-2.35); // tray
  const cup1=localBox(.32,.35,.32,0xffffff,-5.15,1.28,-2.35);
  const cup2=localBox(.30,.33,.30,0xf9f9f9,-5.15,1.58,-2.35);
  const cup3=localBox(.28,.31,.28,0xf4f4f4,-5.15,1.86,-2.35);

  // Bowl of red-and-white striped straws
  localBox(.62,.16,.52,0xd9a05b,-4.2,1.02,-2.35); // bowl
  localBox(.09,.62,.09,0xffffff,-4.34,1.42,-2.28);
  localBox(.09,.62,.09,0xffffff,-4.20,1.45,-2.35);
  localBox(.09,.62,.09,0xffffff,-4.06,1.40,-2.42);
  localBox(.03,.62,.11,0xff4b63,-4.34,1.42,-2.28);
  localBox(.03,.62,.11,0xff4b63,-4.20,1.45,-2.35);
  localBox(.03,.62,.11,0xff4b63,-4.06,1.40,-2.42);

  // Liquid inside the blender jar.
  const chocolateBlend=localBox(.44,.34,.40,0x6a3d24,-3.8,1.42,-2.4);
  const strawberryBlend=localBox(.44,.34,.40,0xff90b4,-3.8,1.42,-2.4);
  chocolateBlend.visible=false;
  strawberryBlend.visible=false;

  let hasMilkshakeCup=false;
  let hasStripedStraw=false;

  // We will use the real cup/straw workflow instead of the old straw icon.
  addStrawBtn.style.display="none";
  addStrawBtn.onclick=()=>{};
  addStrawBtn.style.pointerEvents="none";

  function page4Open(){
    return currentPlace==="bakery" && inKitchen===true;
  }

  function cupWorld(){
    return new THREE.Vector3(blenderStation.position.x-5.15,1.86,blenderStation.position.z-2.35);
  }
  function strawWorld(){
    return new THREE.Vector3(blenderStation.position.x-4.2,1.55,blenderStation.position.z-2.35);
  }

  function updateBlendVisual(){
    const hasChoco = shakeIngredients.includes("chocolate") || madeShake==="chocolate";
    const hasBerry = shakeIngredients.includes("strawberry") || madeShake==="strawberry";
    const hasMilk = shakeIngredients.includes("milk") || madeShake==="chocolate" || madeShake==="strawberry";

    chocolateBlend.visible = page4Open() && hasChoco && hasMilk;
    strawberryBlend.visible = page4Open() && hasBerry && hasMilk && !hasChoco;
  }

  function updateAccessoryButton(){
    accessoryGrab.style.display="none";
    if(!page4Open()) return;

    // Hide the old straw icon every frame so it cannot clutter the screen.
    addStrawBtn.style.display="none";

    const nearCup=Math.hypot(P.position.x-cupWorld().x,P.position.z-cupWorld().z)<2.2;
    const nearStraw=Math.hypot(P.position.x-strawWorld().x,P.position.z-strawWorld().z)<2.2;

    // If a shake is finished, guide the player through cup then straw.
    if(madeShake && !hasMilkshakeCup && nearCup){
      accessoryGrab.style.background="#9fe2ff";
      accessoryGrab.innerHTML="🥤 GRAB CUP";
      accessoryGrab.dataset.action="cup";
      accessoryGrab.style.display="block";
      return;
    }

    if(madeShake && hasMilkshakeCup && !hasStripedStraw && nearStraw){
      accessoryGrab.style.background="#ffd4de";
      accessoryGrab.innerHTML="❤️🤍 GRAB STRAW";
      accessoryGrab.dataset.action="straw";
      accessoryGrab.style.display="block";
      return;
    }

    // Optional free grabbing even before blending.
    if(!madeShake && nearCup){
      accessoryGrab.style.background="#e9f8ff";
      accessoryGrab.innerHTML=hasMilkshakeCup?"🥤 CUP READY":"🥤 GRAB CUP";
      accessoryGrab.dataset.action="cup";
      accessoryGrab.style.display="block";
      return;
    }
    if(!madeShake && nearStraw){
      accessoryGrab.style.background="#fff1f4";
      accessoryGrab.innerHTML=hasStripedStraw?"❤️🤍 STRAW READY":"❤️🤍 GRAB STRAW";
      accessoryGrab.dataset.action="straw";
      accessoryGrab.style.display="block";
      return;
    }
  }

  accessoryGrab.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    const action=accessoryGrab.dataset.action;

    if(action==="cup"){
      hasMilkshakeCup=true;
      document.getElementById("msg").textContent=
        madeShake ? "You grabbed a cup! Now grab a striped straw. 🥤" : "You grabbed a cup! It is ready for a milkshake. 🥤";
    }

    if(action==="straw"){
      hasStripedStraw=true;
      strawAdded=true;
      if(madeShake){
        const name = madeShake==="strawberry" ? "🍓 Strawberry" : "🍫 Chocolate";
        shakeResult.innerHTML=name+" milkshake ready! <span style='font-size:28px'>🥤</span><br>Red and white striped straw added! ❤️🤍";
        document.getElementById("msg").textContent="Your milkshake is finished with a striped straw! ❤️🤍";
      }else{
        document.getElementById("msg").textContent="You grabbed a striped straw! ❤️🤍";
      }
    }

    accessoryGrab.style.display="none";
  });

  // Reset cup/straw progress when a new shake is blended.
  const oldBlendButton=blenderReadyIcon;
  oldBlendButton.addEventListener("pointerdown",()=>{
    hasMilkshakeCup=false;
    hasStripedStraw=false;
    strawAdded=false;
  });

  // If the player switches away from milkshakes, keep props but stop the completion logic.
  setInterval(()=>{
    updateAccessoryButton();
    updateBlendVisual();
    if(!page4Open()){
      accessoryGrab.style.display="none";
      addStrawBtn.style.display="none";
    }
  },70);
})();


// ===== Finish Orders =====
(function(){
 const finishOrdersBtn=document.getElementById("finishOrders");

 finishOrdersBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   servedCount+=3;
   money+=15;
   updateMoney();
   newOrders();
   document.getElementById("msg").textContent="Finished! Here are the next 3 orders. ✅📺";
 });

})();


// ===== TOUCH DRAG CAMERA CONTROL =====
(function(){
  const gameArea=document.getElementById("game");
  let draggingCamera=false;
  let dragId=null;
  let lastX=0,lastY=0;
  let pinching=false;
  let pinchDistance=0;

  function interactiveTarget(el){
    return !!el.closest("button, #pad, #housePanel, #orders, #recipePanel, #avatarShop, #tvControlsPanel, #tvScreen, #furnitureMover");
  }

  gameArea.addEventListener("pointerdown",e=>{
    if(interactiveTarget(e.target)) return;
    if(e.pointerType==="touch"&&pinching)return;
    draggingCamera=true;
    dragId=e.pointerId;
    lastX=e.clientX;
    lastY=e.clientY;
    gameArea.setPointerCapture(e.pointerId);
  });

  gameArea.addEventListener("pointermove",e=>{
    if(e.pointerType==="touch"&&pinching)return;
    if(!draggingCamera || e.pointerId!==dragId) return;
    const dx=e.clientX-lastX;
    const dy=e.clientY-lastY;
    lastX=e.clientX;
    lastY=e.clientY;

    cameraAngle-=dx*0.012;
    cameraHeight=Math.max(3.2,Math.min(11,cameraHeight+dy*0.02));
  });

  function stopDrag(e){
    if(e.pointerId!==dragId) return;
    draggingCamera=false;
    dragId=null;
  }
  function releasePointer(e){
    if(e.pointerId===dragId){draggingCamera=false;dragId=null}
  }
  gameArea.addEventListener("pointerup",releasePointer);
  gameArea.addEventListener("pointercancel",releasePointer);

  // Safari/iPadOS does not consistently deliver the second pointer to the
  // canvas once the first pointer has been captured. Native two-touch events
  // are reliable, including when the gesture starts over the rendered canvas.
  function touchDistance(touches){
    return Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  }
  gameArea.addEventListener("touchstart",e=>{
    if(e.touches.length!==2)return;
    e.preventDefault();
    pinching=true;
    draggingCamera=false;
    dragId=null;
    pinchDistance=touchDistance(e.touches);
  },{passive:false});
  gameArea.addEventListener("touchmove",e=>{
    if(!pinching||e.touches.length<2)return;
    e.preventDefault();
    const distance=touchDistance(e.touches);
    if(pinchDistance>0){
      cameraDistance=THREE.MathUtils.clamp(cameraDistance+(pinchDistance-distance)*.035,4.5,20);
    }
    pinchDistance=distance;
  },{passive:false});
  function finishPinch(e){
    if(e.touches.length<2){pinching=false;pinchDistance=0}
  }
  gameArea.addEventListener("touchend",finishPinch,{passive:true});
  gameArea.addEventListener("touchcancel",finishPinch,{passive:true});

  // Also disable the old look pad behavior variables if they exist.
  if(typeof looking!=="undefined") looking=false;
  if(typeof lookX!=="undefined") lookX=0;
  if(typeof lookY!=="undefined") lookY=0;
})();


// ===== PAGE 5 STOCK BOXES + PAGE 4 RESTOCK SYSTEM =====
(function(){
 const restockShelfBtn=document.getElementById("restockShelf");
 const stockLabels=[...Array(8)].map((_,i)=>document.getElementById("boxLabel"+i));
 const stockBoxInfo=[
   {name:"Strawberry",emoji:"🍓",color:0xff7ca1,x:15.1,y:3.18,z:-18.75},
   {name:"Banana",emoji:"🍌",color:0xffda56,x:16.35,y:3.18,z:-18.75},
   {name:"Egg",emoji:"🥚",color:0xfff4d6,x:23.15,y:3.18,z:-18.75},
   {name:"Milk",emoji:"🥛",color:0xeaf8ff,x:24.4,y:3.18,z:-18.75},
   {name:"Flour",emoji:"🌾",color:0xf2d7a7,x:15.15,y:3.18,z:-10.15},
   {name:"Sugar",emoji:"🍬",color:0xffb6d8,x:16.4,y:3.18,z:-10.15},
   {name:"Butter",emoji:"🧈",color:0xffdf6a,x:23.15,y:3.18,z:-10.15},
   {name:"Chocolate",emoji:"🍫",color:0x6b351f,x:24.4,y:3.18,z:-10.15}
 ];
 window.stockBoxes=[];
 const stockBoxes=window.stockBoxes;

 function makeStockBox(info){
   const g=new THREE.Group();
   g.position.set(info.x,info.y,info.z);
   g.userData={name:info.name+" Box",emoji:"📦",held:false,stockIngredient:info.name,stockEmoji:info.emoji};
   function part(w,h,d,c,x,y,z){
     const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));
     m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
   }
   // box body
   part(.95,.7,.62,0xc89c72,0,0,0);
   part(.99,.08,.66,0x9d734d,0,.39,0);
   // colored food sticker
   part(.46,.28,.04,0xffffff,0,.04,.33);
   part(.22,.22,.04,info.color,-.12,.05,.35);
   part(.14,.14,.04,info.color,.1,.05,.35);
   page5Group.add(g);
   stockBoxes.push(g);
   grabItems.push(g);
   return g;
 }
 stockBoxInfo.forEach(makeStockBox);

 function setIngredientStock(name,on){
   ingredientModels.forEach(m=>{
     if(m.userData.ingredient===name){
       m.visible=on;
       m.userData.stocked=on;
     }
   });
 }
 function setAllIngredientStock(on){
   ingredientModels.forEach(m=>{
     m.visible=on;
     m.userData.stocked=on;
   });
 }
 ingredientModels.forEach(m=>m.userData.stocked=true);

 function updateStorageBoxLabels(){
   stockBoxes.forEach((box,i)=>{
     const el=stockLabels[i];
     if(!el)return;
     if(currentPlace!=="bakery" || inStorage!==true || !box.visible || box.userData.held){
       el.style.display="none";
       return;
     }
     const p=box.position.clone();
     p.y+=.78;
     p.project(C);
     if(p.z<-1 || p.z>1){el.style.display="none";return;}
     el.style.display="block";
     el.textContent=box.userData.stockEmoji+" "+box.userData.stockIngredient;
     el.style.left=((p.x*.5+.5)*innerWidth-el.offsetWidth/2)+"px";
     el.style.top=((-p.y*.5+.5)*innerHeight-el.offsetHeight-10)+"px";
   });
 }

 function updateRestockButton(){
   if(!(currentPlace==="bakery" && inKitchen===true && inStorage!==true && heldItem && heldItem.userData && heldItem.userData.stockIngredient)){
     restockShelfBtn.style.display="none";
     return;
   }
   const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.3;
   if(!nearShelf){
     restockShelfBtn.style.display="none";
     return;
   }
   const p=new THREE.Vector3(-.1,3.6,-19.6).project(C);
   if(p.z<-1 || p.z>1){
     restockShelfBtn.style.display="none";
     return;
   }
   restockShelfBtn.style.display="block";
   restockShelfBtn.style.left=((p.x*.5+.5)*innerWidth-72)+"px";
   restockShelfBtn.style.top=((-p.y*.5+.5)*innerHeight-24)+"px";
   restockShelfBtn.innerHTML="📦 RESTOCK<br>"+heldItem.userData.stockEmoji+" "+heldItem.userData.stockIngredient;
 }

 restockShelfBtn.addEventListener("pointerdown",e=>{
   e.preventDefault();
   e.stopPropagation();
   if(!(heldItem && heldItem.userData && heldItem.userData.stockIngredient))return;

   const ingredientName=heldItem.userData.stockIngredient;
   setIngredientStock(ingredientName,true);

   // consume the box and remove it from the game
   const usedBox=heldItem;
   usedBox.userData.held=false;
   usedBox.visible=false;
   if(usedBox.parent) usedBox.parent.remove(usedBox);
   const gi=grabItems.indexOf(usedBox);
   if(gi>=0) grabItems.splice(gi,1);
   const sb=stockBoxes.indexOf(usedBox);
   if(sb>=0) stockBoxes.splice(sb,1);

   heldItem=null;
   itemLabel.textContent="Hands: Empty";
   grabButton.innerHTML="🤲<br>GRAB";
   restockShelfBtn.style.display="none";

   const left=ingredientModels.filter(m=>!m.visible).length;
   document.getElementById("msg").textContent=
     "You restocked "+ingredientName+" on the kitchen shelf! "+(left===0?"Everything is restocked! ✨":"There are still "+left+" empty shelf spots.");
 });

 // After a full set of 3 bakery orders is finished, the shelf runs out.
 const finishOrdersBtn2=document.getElementById("finishOrders");
 finishOrdersBtn2.addEventListener("pointerdown",()=>{
   setAllIngredientStock(false);
   selectedIngredient=null;
   const a=document.getElementById("fixedIngredientGrab");
   const b=document.getElementById("ingredientGrab");
   const c=document.getElementById("shakeGrab");
   if(a)a.style.display="none";
   if(b)b.style.display="none";
   if(c)c.style.display="none";
   document.getElementById("msg").textContent="You finished 3 orders, so the shelf is empty now! Walk or teleport to storage and bring back stock boxes. 📦";
 });

 setInterval(()=>{
   updateStorageBoxLabels();
   updateRestockButton();
 },70);
})();
