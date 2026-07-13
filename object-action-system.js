// Reusable screen-space actions anchored to objects in the Three.js world.
(function(){
 "use strict";

 function createObjectActionSystem(options){
  if(!options||!options.THREE||!options.camera||!options.renderer){
   throw new Error("Object actions require THREE, camera, and renderer");
  }
  const THREE=options.THREE;
  const camera=options.camera;
  const renderer=options.renderer;
  const root=options.root||document.body;
  const getPlayerPosition=options.getPlayerPosition||(()=>null);
  const getWorld=options.getWorld||(()=>null);
  const isBuildMode=options.isBuildMode||(()=>false);
  const actions=[];
  let active=null;

  const button=document.createElement("button");
  button.type="button";
  button.className="object-action-button";
  button.hidden=true;
  button.setAttribute("aria-hidden","true");
  const iconElement=document.createElement("span");
  iconElement.className="object-action-icon";
  iconElement.setAttribute("aria-hidden","true");
  const labelElement=document.createElement("span");
  labelElement.className="object-action-label";
  button.append(iconElement,labelElement);
  root.appendChild(button);

  const anchor=new THREE.Vector3();
  const player=new THREE.Vector3();
  const projected=new THREE.Vector3();

  function setHidden(){
   active=null;
   button.hidden=true;
   button.setAttribute("aria-hidden","true");
   button.style.removeProperty("transform");
  }

  function matchesWorld(action,currentWorld){
   if(action.world==null)return true;
   return typeof action.world==="function"
    ? Boolean(action.world(currentWorld))
    : action.world===currentWorld;
  }

  function getAnchor(action,target){
   if(typeof action.getAnchor==="function"){
    const supplied=action.getAnchor(target,anchor);
    if(supplied&&supplied!==anchor)anchor.copy(supplied);
   }else{
    action.box.setFromObject(target);
    if(action.box.isEmpty())target.getWorldPosition(anchor);
    else action.box.getCenter(anchor),anchor.y=action.box.max.y;
   }
   anchor.y+=action.anchorOffset;
   return anchor;
  }

  function register(target,config){
   if(!target)throw new Error("Object action target is required");
   const settings=config||{};
   const action={
    target,
    icon:settings.icon||"✨",
    label:settings.label||"Interact",
    range:Math.max(.1,Number(settings.range)||2.5),
    priority:Number(settings.priority)||0,
    anchorOffset:Number.isFinite(settings.anchorOffset)?settings.anchorOffset:.4,
    world:settings.world,
    enabled:typeof settings.enabled==="function"?settings.enabled:null,
    getAnchor:settings.getAnchor,
    onAction:typeof settings.onAction==="function"?settings.onAction:()=>{},
    box:new THREE.Box3(),
    position:new THREE.Vector3()
   };
   actions.push(action);
   return action;
  }

  function unregister(actionOrTarget){
   const index=actions.findIndex(item=>item===actionOrTarget||item.target===actionOrTarget);
   if(index<0)return false;
   if(active===actions[index])setHidden();
   actions.splice(index,1);
   return true;
  }

  function update(context){
   const state=context||{};
   if(state.hidden||state.buildMode===true||isBuildMode())return setHidden();
   const source=state.playerPosition||getPlayerPosition();
   if(!source)return setHidden();
   player.copy(source);
   const currentWorld=state.world===undefined?getWorld():state.world;
   let best=null,bestDistance=Infinity;
   for(let i=0;i<actions.length;i++){
    const action=actions[i],target=action.target;
    if(!target||target.visible===false||!target.parent||!matchesWorld(action,currentWorld))continue;
    if(action.enabled&&!action.enabled(state,action))continue;
    target.getWorldPosition(action.position);
    const dx=action.position.x-player.x,dz=action.position.z-player.z;
    const distance=Math.sqrt(dx*dx+dz*dz);
    if(distance>action.range)continue;
    if(!best||action.priority>best.priority||(action.priority===best.priority&&distance<bestDistance)){
     best=action;bestDistance=distance;
    }
   }
   if(!best)return setHidden();
   getAnchor(best,best.target);projected.copy(anchor).project(camera);
   if(projected.z<-1||projected.z>1||projected.x<-1||projected.x>1||projected.y<-1||projected.y>1)return setHidden();
   const rect=renderer.domElement.getBoundingClientRect();
   if(!rect.width||!rect.height)return setHidden();
   const left=rect.left+(projected.x+1)*rect.width*.5;
   const top=rect.top+(1-projected.y)*rect.height*.5;
   active=best;
   const icon=typeof best.icon==="function"?best.icon(best.target,best):best.icon;
   const label=typeof best.label==="function"?best.label(best.target,best):best.label;
   iconElement.textContent=String(icon||"✨");
   labelElement.textContent=String(label||"Interact");
   button.setAttribute("aria-label",String(label||"Interact"));
   button.style.transform=`translate3d(${Math.round(left)}px,${Math.round(top)}px,0) translate(-50%,-100%)`;
   button.hidden=false;
   button.setAttribute("aria-hidden","false");
  }

  button.addEventListener("click",event=>{
   if(!active)return;
   event.preventDefault();
   active.onAction(active.target,active);
  });

  function destroy(){actions.length=0;active=null;button.remove()}
  return {register,unregister,update,hide:setHidden,destroy,button};
 }

 window.createObjectActionSystem=createObjectActionSystem;
})();
