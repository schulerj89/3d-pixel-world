(function organizeWorldMenu(){
  const drawer=document.getElementById("hudDrawer");
  const menuButton=document.getElementById("hudMenuButton");
  if(!drawer||!menuButton||drawer.querySelector(".worldMenuShell"))return;

  const destinationDetails={
    menuGoBakery:{icon:"🍽️",name:"Restaurant",detail:"Cook & serve"},
    menuGoHouse:{image:"assets/ui/gvesster/house.png?v=__BUILD_VERSION__",name:"My House",detail:"Build & decorate"},
    menuGoBeach:{icon:"🏖️",name:"Beach",detail:"Explore the shore"},
    menuGoSpace:{image:"assets/ui/gvesster/rocket.png?v=__BUILD_VERSION__",name:"Space",detail:"Visit the station"},
    menuGoCity:{image:"assets/ui/city.svg?v=__BUILD_VERSION__",name:"City",detail:"Tour downtown"},
    menuGoCastle:{icon:"🏰",name:"Castle",detail:"Enter the kingdom"}
  };

  const shell=document.createElement("div");
  shell.className="worldMenuShell";
  const header=document.createElement("div");
  header.className="worldMenuHeader";
  header.innerHTML='<div><span aria-hidden="true">🌎</span><span><b id="worldMenuTitle">World Menu</b><small>Where do you want to go?</small></span></div><button class="worldMenuClose" type="button" aria-label="Close world menu">×</button>';

  const places=document.createElement("section");
  places.className="worldMenuSection worldMenuPlaces";
  places.setAttribute("aria-labelledby","worldMenuPlacesLabel");
  places.innerHTML='<h2 id="worldMenuPlacesLabel">Places</h2><div class="worldMenuDestinations"></div>';
  const destinations=places.querySelector(".worldMenuDestinations");
  Object.entries(destinationDetails).forEach(([id,details])=>{
    const button=document.getElementById(id);
    if(!button)return;
    button.classList.add("worldMenuDestination");
    button.setAttribute("aria-label",`Go to ${details.name}`);
    const visual=details.image?`<img class="gameIcon" src="${details.image}" alt="">`:`<span class="worldMenuEmoji" aria-hidden="true">${details.icon}</span>`;
    button.innerHTML=`${visual}<span class="worldMenuDestinationCopy"><b>${details.name}</b><small>${details.detail}</small></span>`;
    destinations.appendChild(button);
  });

  const context=document.createElement("section");
  context.className="worldMenuSection worldMenuContext";
  context.setAttribute("aria-label","Restaurant rooms");
  const roomTeleport=document.getElementById("roomTeleport");
  if(roomTeleport){
    roomTeleport.querySelector("b")?.replaceChildren("Restaurant rooms");
    context.appendChild(roomTeleport);
  }

  const utilities=document.createElement("section");
  utilities.className="worldMenuSection worldMenuUtilities";
  utilities.setAttribute("aria-label","Game options");
  ["firstPageButton","avatarButton","musicToggle"].forEach(id=>{
    const button=document.getElementById(id);
    if(button)utilities.appendChild(button);
  });

  drawer.replaceChildren(shell);
  shell.append(header,places,context,utilities);
  drawer.classList.add("worldMenuDrawer");
  drawer.setAttribute("role","dialog");
  drawer.setAttribute("aria-modal","false");
  drawer.setAttribute("aria-labelledby","worldMenuTitle");

  function closeMenu({restoreFocus=true}={}){
    drawer.classList.remove("open");
    menuButton.setAttribute("aria-expanded","false");
    if(restoreFocus)menuButton.focus();
  }

  header.querySelector(".worldMenuClose").addEventListener("click",()=>closeMenu());
  drawer.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    event.preventDefault();
    closeMenu();
  });
  new MutationObserver(()=>{
    if(drawer.classList.contains("open"))header.querySelector(".worldMenuClose").focus({preventScroll:true});
  }).observe(drawer,{attributes:true,attributeFilter:["class"]});
})();
