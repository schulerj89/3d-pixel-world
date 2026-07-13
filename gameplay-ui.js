// Furniture shop, shared inventory UI, and final house TV/pickup presentation.
// ===== HOUSE FURNITURE SHOP =====
(function(){
  const shop=document.getElementById("houseShop");
  const openBtn=document.getElementById("openHouseShop");
  const closeBtn=document.getElementById("closeHouseShop");
  const message=document.getElementById("houseShopMessage");

  const names={
    bookshelf:"Bookshelf",
    rug:"Cozy Rug",
    dresser:"Dresser",
    plant:"House Plant",
    desk:"Desk",
    vanity:"Vanity"
  };

  function openShop(){
    if(currentPlace!=="house"){
      document.getElementById("msg").textContent="Go to your house to use the furniture shop. 🏠";
      return;
    }
    shop.style.display="flex";
    message.textContent="You have $"+money+". Choose new furniture! ✨";
  }

  function closeShop(){
    shop.style.display="none";
  }

  openBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    openShop();
  });

  closeBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    closeShop();
  });

  shop.addEventListener("pointerdown",e=>{
    if(e.target===shop)closeShop();
  });

  document.querySelectorAll("[data-buy-furniture]").forEach(btn=>{
    btn.addEventListener("pointerdown",e=>{
      e.preventDefault();
      e.stopPropagation();

      const kind=btn.dataset.buyFurniture;
      const price=Number(btn.dataset.price);

      if(money<price){
        message.textContent="You need $"+price+" for the "+names[kind]+". You have $"+money+".";
        return;
      }

      money-=price;
      updateMoney();
      addFurniture(kind);
      selectedFurnitureIndex=furniture.length-1;
      updateFurnitureLabel();

      message.textContent="You bought a "+names[kind]+"! It was added to your house. 🎉";
      document.getElementById("msg").textContent="New furniture added! 🏠✨";
    });
  });

  // Shop only belongs to the house.
  setInterval(()=>{
    if(currentPlace!=="house") shop.style.display="none";
  },120);
})();


// ===== FINAL: INSIDE-HOUSE TELEPORT + 4-SLOT STOCK INVENTORY =====
(function(){
  // Replace CHECK so only the final inside-house teleport runs.
  const oldCheck=document.getElementById("checkHouse");
  const check=oldCheck.cloneNode(true);
  oldCheck.parentNode.replaceChild(check,oldCheck);

  check.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    if(typeof showHouse==="function") showHouse();

    // Spawn safely inside the middle of the house.
    P.position.set(HOUSE_CONFIG.spawn.x,0,HOUSE_CONFIG.spawn.z);
    P.rotation.set(0,Math.PI,0);
    cameraAngle=HOUSE_CONFIG.camera.angle;
    cameraHeight=HOUSE_CONFIG.camera.height;
    cameraDistance=HOUSE_CONFIG.camera.distance;
    C.position.set(
      P.position.x+Math.sin(cameraAngle)*cameraDistance,
      cameraHeight,
      P.position.z+Math.cos(cameraAngle)*cameraDistance
    );
    C.lookAt(0,1.2,0);

    document.getElementById("orders").style.display="none";
    document.getElementById("msg").textContent="Teleported inside your house! 🏠✨";
  });

  // Replace old box and restock buttons so old one-box listeners cannot interfere.
  const oldBoxBtn=document.getElementById("boxGrabButton");
  const boxBtn=oldBoxBtn.cloneNode(true);
  oldBoxBtn.parentNode.replaceChild(boxBtn,oldBoxBtn);

  const oldRestock=document.getElementById("restockShelf");
  const restockBtn=oldRestock.cloneNode(true);
  oldRestock.parentNode.replaceChild(restockBtn,oldRestock);

  const inventoryBox=document.getElementById("inventoryBox");
  const stockInventory=[]; // up to four {name, emoji}
  const MAX_STOCK=4;

  // Stock boxes are handled only by this inventory system.
  function allStockBoxes(){ return window.stockBoxes || []; }

  allStockBoxes().forEach(box=>{
    const i=grabItems.indexOf(box);
    if(i>=0) grabItems.splice(i,1);
  });

  function nearestBox(){
    let best=null,bestD=2.5;
    allStockBoxes().forEach(box=>{
      if(!box || !box.visible || box.userData.held || box.userData.collected)return;
      const d=Math.hypot(box.position.x-P.position.x,box.position.z-P.position.z);
      if(d<bestD){best=box;bestD=d;}
    });
    return best;
  }

  let lastInventorySignature="";
  let lastInventoryVisible=null;

  function renderInventory(){
    const showInventory =
      currentPlace==="bakery" &&
      (inStorage===true || (inKitchen===true && inStorage!==true));

    if(lastInventoryVisible!==showInventory){
      inventoryBox.style.display=showInventory?"block":"none";
      lastInventoryVisible=showInventory;
    }

    if(!showInventory)return;

    const signature=stockInventory.map(item=>item.name).join("|");
    if(signature===lastInventorySignature)return;
    lastInventorySignature=signature;

    let slots="";
    for(let i=0;i<MAX_STOCK;i++){
      const item=stockInventory[i];
      slots+=item
        ? `<div class="inventorySlot filled">${item.emoji}<br>${item.name}</div>`
        : `<div class="inventorySlot">Empty</div>`;
    }

    inventoryBox.innerHTML=
      `<b>📦 Stock Inventory ${stockInventory.length}/${MAX_STOCK}</b>`+
      `<div id="inventorySlots">${slots}</div>`+
      `<span class="small">Kitchen and storage only</span>`;
  }

  function updateBoxButton(){
    if(!(currentPlace==="bakery" && inStorage===true)){
      boxBtn.style.display="none";
      return;
    }

    if(stockInventory.length>=MAX_STOCK){
      boxBtn.style.display="none";
      return;
    }

    const box=nearestBox();
    if(!box){
      boxBtn.style.display="none";
      return;
    }

    const p=box.position.clone();
    p.y+=1.1;
    p.project(C);
    if(p.z<-1||p.z>1){
      boxBtn.style.display="none";
      return;
    }

    boxBtn.style.display="block";
    boxBtn.innerHTML="🤲 GRAB BOX<br>"+box.userData.stockEmoji+" "+box.userData.stockIngredient;
    boxBtn.style.left=((p.x*.5+.5)*innerWidth-boxBtn.offsetWidth/2)+"px";
    boxBtn.style.top=((-p.y*.5+.5)*innerHeight-boxBtn.offsetHeight-8)+"px";
  }

  boxBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();

    if(stockInventory.length>=MAX_STOCK){
      document.getElementById("msg").textContent="Your stock inventory is full. You can carry 4 boxes. 📦";
      return;
    }

    const box=nearestBox();
    if(!box){
      document.getElementById("msg").textContent="Walk closer to a stock box. 📦";
      return;
    }

    stockInventory.push({
      name:box.userData.stockIngredient,
      emoji:box.userData.stockEmoji
    });

    box.userData.collected=true;
    box.visible=false;
    if(box.parent) box.parent.remove(box);

    const gi=grabItems.indexOf(box);
    if(gi>=0)grabItems.splice(gi,1);

    boxBtn.style.display="none";
    renderInventory();
    document.getElementById("msg").textContent=
      "Added "+box.userData.stockEmoji+" "+box.userData.stockIngredient+
      " to inventory! "+stockInventory.length+"/4 slots used. 📦";
  });

  function updateRestockButton(){
    if(!(currentPlace==="bakery" && inKitchen===true && inStorage!==true && stockInventory.length>0)){
      restockBtn.style.display="none";
      return;
    }

    const nearShelf=Math.hypot(P.position.x-(-.1),P.position.z-(-19.6))<5.3;
    if(!nearShelf){
      restockBtn.style.display="none";
      return;
    }

    const item=stockInventory[0];
    const p=new THREE.Vector3(-.1,3.6,-19.6).project(C);
    if(p.z<-1||p.z>1){
      restockBtn.style.display="none";
      return;
    }

    restockBtn.style.display="block";
    restockBtn.innerHTML="📦 RESTOCK<br>"+item.emoji+" "+item.name;
    restockBtn.style.left=((p.x*.5+.5)*innerWidth-restockBtn.offsetWidth/2)+"px";
    restockBtn.style.top=((-p.y*.5+.5)*innerHeight-28)+"px";
  }

  restockBtn.addEventListener("pointerdown",e=>{
    e.preventDefault();
    e.stopPropagation();
    if(!stockInventory.length)return;

    const item=stockInventory.shift();

    ingredientModels.forEach(model=>{
      if(model.userData.ingredient===item.name){
        model.visible=true;
        model.userData.stocked=true;
      }
    });

    renderInventory();
    document.getElementById("msg").textContent=
      "Restocked "+item.emoji+" "+item.name+" on the kitchen shelf! ✨";
  });

  // Keep the inventory visible throughout the game.
  renderInventory();

  setInterval(()=>{
    updateBoxButton();
    updateRestockButton();
    renderInventory();
  },120);
})();


// ===== HOUSE TV CHANNEL ART, ROOM LABEL, CHECK HUD, RUG FIX =====
(function(){
  const roomLabel=document.getElementById("roomName");
  const channelArt=document.getElementById("channelArt");

  let tvTexture=null;
  let tvPage=0;

  const svgArt={
    news:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#78c8ff"/>
      <rect y="105" width="300" height="45" fill="#234d7d"/>
      <rect x="18" y="18" width="112" height="54" rx="8" fill="#fff"/>
      <text x="74" y="42" text-anchor="middle" font-size="17" font-weight="bold" fill="#234d7d">TINY TOWN</text>
      <text x="74" y="62" text-anchor="middle" font-size="17" font-weight="bold" fill="#e43f63">NEWS</text>
      <circle cx="205" cy="63" r="25" fill="#f2bb91"/>
      <rect x="180" y="88" width="50" height="42" rx="8" fill="#7c5cff"/>
      <rect x="242" y="50" width="11" height="65" rx="5" fill="#333"/>
      <circle cx="247" cy="44" r="13" fill="#777"/>
      <text x="150" y="140" text-anchor="middle" font-size="13" fill="#fff">Breaking stories from around town!</text>
    </svg>`,
    chef:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#ffe1a6"/>
      <rect y="106" width="300" height="44" fill="#d98b52"/>
      <rect x="32" y="54" width="95" height="53" rx="8" fill="#fff"/>
      <circle cx="200" cy="55" r="24" fill="#f2bb91"/>
      <rect x="176" y="78" width="48" height="50" rx="8" fill="#fff"/>
      <path d="M176 35 Q200 8 224 35" fill="#fff"/>
      <ellipse cx="90" cy="93" rx="35" ry="10" fill="#777"/>
      <circle cx="78" cy="83" r="8" fill="#ff6b83"/>
      <circle cx="96" cy="81" r="8" fill="#6bcf63"/>
      <text x="150" y="142" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">CHEF GARY'S KITCHEN</text>
    </svg>`,
    island:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#79d7ff"/>
      <circle cx="255" cy="28" r="20" fill="#ffe66d"/>
      <path d="M0 100 Q75 75 150 100 T300 100 V150 H0Z" fill="#48b9d1"/>
      <ellipse cx="150" cy="110" rx="78" ry="26" fill="#f4d58a"/>
      <rect x="146" y="45" width="8" height="55" fill="#8b5a2b"/>
      <path d="M150 48 Q112 30 120 14 Q143 22 150 48" fill="#4bbf66"/>
      <path d="M150 48 Q188 30 180 14 Q157 22 150 48" fill="#4bbf66"/>
      <circle cx="112" cy="92" r="16" fill="#f2bb91"/>
      <circle cx="188" cy="92" r="16" fill="#d99568"/>
      <text x="150" y="142" text-anchor="middle" font-size="15" font-weight="bold" fill="#7a3a5d">ISLAND HEARTS</text>
    </svg>`,
    monsters:`<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="150" fill="#3e356b"/>
      <circle cx="40" cy="25" r="3" fill="#fff"/><circle cx="85" cy="17" r="2" fill="#fff"/>
      <circle cx="250" cy="30" r="3" fill="#fff"/><circle cx="220" cy="15" r="2" fill="#fff"/>
      <path d="M0 120 L45 62 L88 120 Z" fill="#24563d"/>
      <path d="M65 120 L120 48 L175 120 Z" fill="#2e704d"/>
      <path d="M145 120 L205 55 L265 120 Z" fill="#24563d"/>
      <circle cx="115" cy="84" r="27" fill="#ffd54f"/>
      <circle cx="188" cy="89" r="25" fill="#78d66e"/>
      <circle cx="108" cy="78" r="4" fill="#222"/><circle cx="122" cy="78" r="4" fill="#222"/>
      <circle cx="181" cy="83" r="4" fill="#222"/><circle cx="195" cy="83" r="4" fill="#222"/>
      <text x="150" y="142" text-anchor="middle" font-size="15" font-weight="bold" fill="#fff">POCKET PALS ADVENTURES</text>
    </svg>`
  };

  const channelPageThemes={
    news:[["TOP STORY","#e43f63","#fff3a8"],["WEATHER","#2176ae","#bde8ff"],["HAPPY NEWS","#7c5cff","#d7cfff"]],
    chef:[["RAINBOW PASTA","#d85b78","#ffe0e8"],["BAKING TIME","#b76532","#ffe0b5"],["TASTE TEST","#438a5e","#d6f5dc"]],
    island:[["BEACH DAY","#d65b83","#ffe0ed"],["TREASURE HUNT","#a56a24","#ffe3a3"],["SUNSET PARTY","#754ca8","#e4d4ff"]],
    monsters:[["FOREST QUEST","#17765a","#bff5df"],["CRYSTAL CAVE","#5557bd","#d8d9ff"],["PAL PARADE","#b94787","#ffd3ed"]]
  };
  function channelPageArt(name,page=tvPage){
    const theme=(channelPageThemes[name]||channelPageThemes.news)[page%3];
    const palettes={
      news:["#75cfff","#244d7b","#ef476f"],chef:["#ffe0aa","#d28350","#ffffff"],
      island:["#76d9ff","#3cb9cb","#f3d082"],monsters:["#393262","#24573e","#ffd64d"]
    };
    const [sky,ground,accent]=palettes[name]||palettes.news;
    if(page%3===0)return `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="150" fill="${sky}"/><rect y="106" width="300" height="44" fill="${ground}"/><rect x="18" y="18" width="112" height="68" rx="9" fill="white"/><rect x="30" y="31" width="88" height="11" fill="${theme[1]}"/><rect x="30" y="51" width="62" height="8" fill="${accent}"/><rect x="30" y="68" width="78" height="7" fill="#b8c6d8"/><circle cx="211" cy="57" r="27" fill="${name==="monsters"?accent:"#f2bb91"}"/><rect x="183" y="85" width="56" height="47" rx="9" fill="${theme[1]}"/><circle cx="203" cy="53" r="4" fill="#222"/><circle cx="219" cy="53" r="4" fill="#222"/></svg>`;
    if(page%3===1)return `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="150" fill="${theme[2]}"/><circle cx="54" cy="38" r="23" fill="${accent}"/><path d="M0 116 Q52 62 103 114 T205 105 T300 112 V150 H0Z" fill="${ground}"/><path d="M18 118L76 57l46 61 55-82 62 82 34-48 27 48" fill="none" stroke="${theme[1]}" stroke-width="13" stroke-linejoin="round"/><g fill="white"><ellipse cx="145" cy="32" rx="35" ry="13"/><ellipse cx="220" cy="57" rx="43" ry="16"/></g><g fill="${accent}"><circle cx="124" cy="94" r="15"/><rect x="112" y="107" width="24" height="31" rx="7"/><circle cx="244" cy="99" r="15"/><rect x="232" y="112" width="24" height="27" rx="7"/></g></svg>`;
    return `<svg viewBox="0 0 300 150" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="${theme[1]}"/><stop offset="1" stop-color="${sky}"/></linearGradient></defs><rect width="300" height="150" fill="url(#g)"/><path d="M0 122 Q60 82 120 122 T240 122 T300 122 V150 H0Z" fill="${ground}"/><g fill="${accent}"><circle cx="55" cy="59" r="24"/><circle cx="150" cy="43" r="29"/><circle cx="245" cy="66" r="22"/></g><g fill="#222"><circle cx="48" cy="56" r="3"/><circle cx="62" cy="56" r="3"/><circle cx="141" cy="39" r="4"/><circle cx="159" cy="39" r="4"/><circle cx="239" cy="63" r="3"/><circle cx="251" cy="63" r="3"/></g><g fill="${theme[2]}"><rect x="40" y="83" width="30" height="43" rx="9"/><rect x="132" y="76" width="36" height="55" rx="10"/><rect x="231" y="87" width="28" height="40" rx="8"/></g><circle cx="104" cy="24" r="4" fill="white"/><circle cx="204" cy="31" r="5" fill="white"/><circle cx="274" cy="21" r="3" fill="white"/></svg>`;
  }
  function updateTVPageLabel(){document.getElementById("tvPage").textContent=(tvPage+1)+" / 3"}

  function setRoomLabel(){
    if(currentPlace==="bakery"){
      roomLabel.style.display="block";
      if(inStorage===true) roomLabel.textContent="Bakery Storage";
      else if(inKitchen===true) roomLabel.textContent="Bakery Kitchen";
      else roomLabel.textContent="Main Bakery";
    }else{
      roomLabel.style.display="none";
    }
  }

  function houseTV(){
    return furniture.find(f=>f.userData.kind==="tv"&&f.visible!==false);
  }

  function positionTVScreen(){
    // Channel artwork is rendered on the 3D screen, never as a floating panel.
    const screenPanel=document.getElementById("tvScreen");
    if(screenPanel)screenPanel.style.display="none";
  }

  function paintTVScreen(name){
    const tv=houseTV();
    const screen=tv&&tv.userData.tvScreen;
    if(!screen)return;
    if(!tvIsOn){
      if(tvTexture){tvTexture.dispose();tvTexture=null}
      screen.material.map=null;
      screen.material.color.setHex(0x151923);
      screen.material.needsUpdate=true;
      return;
    }
    const svg=channelPageArt(name);
    const image=new Image();
    image.onload=()=>{
      const canvas=document.createElement("canvas");
      canvas.width=600;canvas.height=300;
      canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);
      if(tvTexture)tvTexture.dispose();
      tvTexture=new THREE.CanvasTexture(canvas);
      tvTexture.colorSpace=THREE.SRGBColorSpace;
      screen.material.color.setHex(0xffffff);
      screen.material.map=tvTexture;
      screen.material.needsUpdate=true;
    };
    image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }

  function updateTVPresentation(){
    setRoomLabel();
    positionTVScreen();
  }

  function changeTVPage(direction){
    if(!tvIsOn){document.getElementById("msg").textContent="Press Power first. 📺";return}
    tvPage=(tvPage+direction+3)%3;updateTVPageLabel();paintTVScreen(currentChannel);
  }
  document.getElementById("tvPrevious").addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();changeTVPage(-1)});
  document.getElementById("tvNext").addEventListener("pointerdown",e=>{e.preventDefault();e.stopPropagation();changeTVPage(1)});
  updateTVPageLabel();
  document.getElementById("tvPower").addEventListener("click",()=>paintTVScreen(currentChannel));

  // Route every channel change to the physical TV texture pipeline.
  const oldShowTVChannel=showTVChannel;
  showTVChannel=function(name){
    oldShowTVChannel(name);
    paintTVScreen(name);
    channelArt.style.display="none";
    channelArt.replaceChildren();

    // Keep the original emoji actors hidden because the SVG channel now animates.
    document.getElementById("actor1").style.display="none";
    document.getElementById("actor2").style.display="none";
    document.getElementById("tvProp").style.display="none";
    document.getElementById("speech").style.display="none";
  };

  // Keep CHECK away from the top-right HUD.
  const check=document.getElementById("checkHouse");
  check.style.left="12px";
  check.style.right="auto";
  check.style.top="58px";

  // Ensure already-added rugs are visible too.
  furniture.filter(f=>f.userData.kind==="rug").forEach(rug=>{
    rug.position.y=.16;
    rug.visible=true;
  });

  setInterval(updateTVPresentation,100);
})();
