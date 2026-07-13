(function createBuildCatalog(){
  const tools=document.getElementById("buildingTools");
  const catalog=tools?.querySelector(".furnitureCatalog");
  const editor=tools?.querySelector(".furnitureEditor");
  const selectedLabel=editor?.querySelector("#selectedFurniture");
  const originalDone=document.getElementById("saveHouse");
  if(!tools||!catalog||!editor||!selectedLabel||!originalDone)return;

  tools.classList.add("buildCatalogTray");
  tools.setAttribute("aria-label","Build and decorate");
  document.body.appendChild(tools);

  const header=document.createElement("div");
  header.className="buildCatalogHeader";
  header.innerHTML='<div class="buildCatalogTitle"><b>Build &amp; decorate</b><small>Add something new or edit what is selected</small></div><div class="buildCatalogHeaderActions"><button class="buildCatalogView" type="button" aria-expanded="true">View room</button><button class="buildCatalogDone" type="button">&#10003; Done</button></div>';

  const modeTabs=document.createElement("div");
  modeTabs.className="buildModeTabs";
  modeTabs.setAttribute("role","tablist");
  modeTabs.setAttribute("aria-label","Build tools");
  modeTabs.innerHTML='<button class="buildModeTab active" id="buildAddTab" type="button" role="tab" aria-selected="true" aria-controls="buildAddPanel">+ Add furniture</button><button class="buildModeTab" id="buildEditTab" type="button" role="tab" aria-selected="false" aria-controls="buildEditPanel" disabled>Edit selected</button>';

  const navigation=document.createElement("div");
  navigation.className="buildCatalogNav";
  navigation.id="buildCategoryList";
  navigation.setAttribute("role","tablist");
  navigation.setAttribute("aria-label","Furniture categories");
  const categories=[["all","&#10024;","All"],["living","&#128715;","Living"],["bedroom","&#128719;","Bedroom"],["kitchen","&#127859;","Kitchen"],["decor","&#128161;","Decor"],["electronics","&#128250;","Tech"]];
  categories.forEach(([key,icon,label],index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="buildCategory"+(index===0?" active":"");
    button.dataset.category=key;
    button.setAttribute("role","tab");
    button.setAttribute("aria-selected",String(index===0));
    button.tabIndex=index===0?0:-1;
    button.innerHTML=`<span aria-hidden="true">${icon}</span>${label}`;
    navigation.appendChild(button);
  });

  catalog.querySelectorAll("[data-f]").forEach(button=>{
    const label=button.dataset.buildLabel||button.textContent.trim().replace(/^\S+\s*/,"")||button.dataset.f.replace(/^./,letter=>letter.toUpperCase());
    button.classList.add("buildItemCard");
    button.innerHTML=`<span class="buildItemIcon" aria-hidden="true">${button.dataset.buildIcon||"&#127968;"}</span><b>${label}</b><small>Add</small>`;
  });

  const rail=document.createElement("div");
  rail.className="buildCatalogRail";
  const previous=document.createElement("button");
  previous.type="button";
  previous.className="buildScrollButton";
  previous.setAttribute("aria-label","Previous furniture");
  previous.innerHTML="&#8249;";
  const next=document.createElement("button");
  next.type="button";
  next.className="buildScrollButton";
  next.setAttribute("aria-label","Next furniture");
  next.innerHTML="&#8250;";
  catalog.parentNode.insertBefore(rail,catalog);
  rail.append(previous,catalog,next);

  const addPanel=document.createElement("section");
  addPanel.className="buildToolPanel buildAddPanel";
  addPanel.id="buildAddPanel";
  addPanel.setAttribute("role","tabpanel");
  addPanel.setAttribute("aria-labelledby","buildAddTab");
  const addPanelHeader=document.createElement("div");
  addPanelHeader.className="buildAddPanelHeader";
  addPanelHeader.innerHTML='<b>Add furniture</b><button class="buildCategoryToggle" type="button" aria-expanded="true" aria-controls="buildCategoryList">Categories</button>';
  addPanel.append(addPanelHeader,navigation,rail);

  editor.classList.add("buildToolPanel");
  editor.id="buildEditPanel";
  editor.setAttribute("role","tabpanel");
  editor.setAttribute("aria-labelledby","buildEditTab");
  editor.hidden=true;

  tools.prepend(header,modeTabs,addPanel);
  tools.appendChild(editor);

  const viewButton=header.querySelector(".buildCatalogView");
  const editTab=modeTabs.querySelector("#buildEditTab");
  const categoryToggle=addPanelHeader.querySelector(".buildCategoryToggle");
  const removeToggle=editor.querySelector("#buildRemoveToggle");
  const dangerActions=editor.querySelector("#buildDangerActions");
  const shortLandscape=window.matchMedia("(orientation: landscape) and (max-height: 500px)");
  let activeMode="add";
  let categoryPreference=null;

  function hasSelection(){
    const text=selectedLabel.textContent.trim();
    return text.startsWith("Selected:");
  }

  function setDangerExpanded(expanded){
    editor.classList.toggle("danger-open",expanded);
    dangerActions.hidden=!expanded;
    removeToggle.setAttribute("aria-expanded",String(expanded));
    removeToggle.textContent=expanded?"Back":"Remove…";
  }

  function setMode(mode,{focus=false}={}){
    if(mode==="edit"&&!hasSelection())mode="add";
    activeMode=mode;
    modeTabs.querySelectorAll(".buildModeTab").forEach(button=>{
      const selected=button.id===(mode==="add"?"buildAddTab":"buildEditTab");
      button.classList.toggle("active",selected);
      button.setAttribute("aria-selected",String(selected));
      button.tabIndex=selected?0:-1;
      if(selected&&focus)button.focus();
    });
    addPanel.hidden=mode!=="add";
    editor.hidden=mode!=="edit";
    tools.dataset.mode=mode;
    if(mode!=="edit")setDangerExpanded(false);
  }

  function refreshSelectionState(){
    editTab.disabled=!hasSelection();
    editTab.setAttribute("aria-disabled",String(editTab.disabled));
    if(editTab.disabled&&activeMode==="edit")setMode("add");
  }

  function setCategoriesExpanded(expanded,{remember=false}={}){
    if(remember)categoryPreference=expanded;
    addPanel.classList.toggle("categories-collapsed",!expanded);
    navigation.hidden=!expanded;
    categoryToggle.setAttribute("aria-expanded",String(expanded));
    categoryToggle.textContent=expanded?"Hide categories":"Categories";
  }

  function setCollapsed(collapsed){
    tools.classList.toggle("collapsed",collapsed);
    document.body.classList.toggle("build-tray-collapsed",collapsed);
    viewButton.setAttribute("aria-expanded",String(!collapsed));
    viewButton.textContent=collapsed?"Show tools":"View room";
  }

  window.setBuildCatalogCollapsed=setCollapsed;
  viewButton.addEventListener("click",()=>setCollapsed(!tools.classList.contains("collapsed")));
  modeTabs.addEventListener("click",event=>{
    const button=event.target.closest(".buildModeTab");
    if(button&&!button.disabled)setMode(button.id==="buildEditTab"?"edit":"add");
  });
  modeTabs.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight"].includes(event.key))return;
    event.preventDefault();
    setMode(activeMode==="add"&&!editTab.disabled?"edit":"add",{focus:true});
  });
  categoryToggle.addEventListener("click",()=>setCategoriesExpanded(categoryToggle.getAttribute("aria-expanded")!=="true",{remember:true}));
  removeToggle.addEventListener("click",()=>setDangerExpanded(removeToggle.getAttribute("aria-expanded")!=="true"));

  function scrollCatalog(direction){catalog.scrollBy({left:direction*Math.max(120,catalog.clientWidth*.72),behavior:"smooth"})}
  previous.addEventListener("click",()=>scrollCatalog(-1));
  next.addEventListener("click",()=>scrollCatalog(1));

  function selectCategory(category){
    navigation.querySelectorAll(".buildCategory").forEach(button=>{
      const selected=button.dataset.category===category;
      button.classList.toggle("active",selected);
      button.setAttribute("aria-selected",String(selected));
      button.tabIndex=selected?0:-1;
    });
    catalog.querySelectorAll("[data-f]").forEach(button=>button.hidden=category!=="all"&&button.dataset.buildCategory!==category);
    catalog.scrollTo({left:0,behavior:"smooth"});
  }
  navigation.addEventListener("click",event=>{const button=event.target.closest(".buildCategory");if(button)selectCategory(button.dataset.category)});
  navigation.addEventListener("keydown",event=>{
    if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
    const buttons=[...navigation.querySelectorAll(".buildCategory")];
    const current=Math.max(0,buttons.indexOf(document.activeElement));
    const index=event.key==="Home"?0:event.key==="End"?buttons.length-1:(current+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;
    event.preventDefault();
    selectCategory(buttons[index].dataset.category);
    buttons[index].focus();
  });
  catalog.addEventListener("click",event=>{
    if(event.target.closest("[data-f]"))queueMicrotask(()=>{refreshSelectionState();setDangerExpanded(false);setMode("edit")});
  });
  header.querySelector(".buildCatalogDone").addEventListener("click",()=>originalDone.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true})));

  new MutationObserver(refreshSelectionState).observe(selectedLabel,{childList:true,characterData:true,subtree:true});
  let wasEnabled=tools.classList.contains("enabled");
  new MutationObserver(()=>{
    const enabled=tools.classList.contains("enabled");
    if(enabled&&!wasEnabled){
      categoryPreference=null;
      setMode("add");
      setCategoriesExpanded(!shortLandscape.matches);
      refreshSelectionState();
    }
    wasEnabled=enabled;
  }).observe(tools,{attributes:true,attributeFilter:["class"]});
  shortLandscape.addEventListener?.("change",event=>{
    if(categoryPreference===null)setCategoriesExpanded(!event.matches);
  });

  setMode("add");
  setCategoriesExpanded(!shortLandscape.matches);
  refreshSelectionState();
  setCollapsed(false);
})();
