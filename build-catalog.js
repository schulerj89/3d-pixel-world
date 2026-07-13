(function createBuildCatalog(){
  const tools=document.getElementById("buildingTools");
  const catalog=tools?.querySelector(".furnitureCatalog");
  const editor=tools?.querySelector(".furnitureEditor");
  const originalDone=document.getElementById("saveHouse");
  if(!tools||!catalog||!editor||!originalDone)return;
  tools.classList.add("buildCatalogTray");
  tools.setAttribute("aria-label","Build catalog");
  document.body.appendChild(tools);
  const header=document.createElement("div");
  header.className="buildCatalogHeader";
  header.innerHTML='<div><b>Build & decorate</b><small>Choose an item, then place it in your room</small></div><div class="buildCatalogHeaderActions"><button class="buildCatalogView" type="button" aria-expanded="true">View room</button><button class="buildCatalogDone" type="button">✓ Done</button></div>';
  const navigation=document.createElement("div");
  navigation.className="buildCatalogNav";
  navigation.setAttribute("role","tablist");
  navigation.setAttribute("aria-label","Furniture categories");
  const categories=[["all","✨","All"],["living","🛋️","Living"],["bedroom","🛏️","Bedroom"],["kitchen","🍳","Kitchen"],["decor","💡","Decor"],["electronics","📺","Tech"]];
  categories.forEach(([key,icon,label],index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="buildCategory"+(index===0?" active":"");
    button.dataset.category=key;
    button.setAttribute("role","tab");
    button.setAttribute("aria-selected",String(index===0));
    button.innerHTML=`<span>${icon}</span>${label}`;
    navigation.appendChild(button);
  });
  catalog.querySelectorAll("[data-f]").forEach(button=>{
    const label=button.dataset.buildLabel||button.textContent.trim().replace(/^\S+\s*/,"")||button.dataset.f.replace(/^./,letter=>letter.toUpperCase());
    button.classList.add("buildItemCard");
    button.innerHTML=`<span class="buildItemIcon" aria-hidden="true">${button.dataset.buildIcon||"🏠"}</span><b>${label}</b><small>Tap to add</small>`;
  });
  const rail=document.createElement("div");
  rail.className="buildCatalogRail";
  const previous=document.createElement("button");
  previous.type="button";previous.className="buildScrollButton";previous.setAttribute("aria-label","Previous furniture");previous.textContent="‹";
  const next=document.createElement("button");
  next.type="button";next.className="buildScrollButton";next.setAttribute("aria-label","Next furniture");next.textContent="›";
  catalog.parentNode.insertBefore(rail,catalog);
  rail.append(previous,catalog,next);
  tools.prepend(navigation);
  tools.prepend(header);
  tools.appendChild(editor);
  const viewButton=header.querySelector(".buildCatalogView");
  function setCollapsed(collapsed){
    tools.classList.toggle("collapsed",collapsed);
    document.body.classList.toggle("build-tray-collapsed",collapsed);
    viewButton.setAttribute("aria-expanded",String(!collapsed));
    viewButton.textContent=collapsed?"Show tools":"View room";
  }
  window.setBuildCatalogCollapsed=setCollapsed;
  viewButton.addEventListener("click",()=>setCollapsed(!tools.classList.contains("collapsed")));
  function scrollCatalog(direction){catalog.scrollBy({left:direction*Math.max(120,catalog.clientWidth*.72),behavior:"smooth"})}
  previous.addEventListener("click",()=>scrollCatalog(-1));
  next.addEventListener("click",()=>scrollCatalog(1));
  function selectCategory(category){
    navigation.querySelectorAll(".buildCategory").forEach(button=>{
      const selected=button.dataset.category===category;
      button.classList.toggle("active",selected);
      button.setAttribute("aria-selected",String(selected));
    });
    catalog.querySelectorAll("[data-f]").forEach(button=>button.hidden=category!=="all"&&button.dataset.buildCategory!==category);
    catalog.scrollTo({left:0,behavior:"smooth"});
  }
  navigation.addEventListener("click",event=>{const button=event.target.closest(".buildCategory");if(button)selectCategory(button.dataset.category)});
  header.querySelector(".buildCatalogDone").addEventListener("click",()=>originalDone.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true})));
  setCollapsed(false);
})();
