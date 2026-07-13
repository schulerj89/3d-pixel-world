// Portable dialogue, interaction, and cinematic-camera orchestration.
(function(global,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(global){
  global.createConversationSystem=api.createConversationSystem;
  global.createConversationDOMView=api.createConversationDOMView;
  global.createThreeConversationCameraAdapter=api.createThreeConversationCameraAdapter;
 }
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";

 const STATES=Object.freeze({IDLE:"idle",ENTERING:"entering",ACTIVE:"active",ACTING:"acting",EXITING:"exiting"});
 const clamp01=value=>Math.max(0,Math.min(1,value));
 const smoothstep=value=>{const t=clamp01(value);return t*t*(3-2*t)};
 const resolved=value=>Promise.resolve(value);

 function createNoopView(){return {showPrompt(){},hidePrompt(){},showConversation(){},renderNode(){},setBusy(){},hideConversation(){},destroy(){}}}

 function normalizeDefinition(raw){
  if(!raw||typeof raw!=="object")throw new Error("Conversation definition is required");
  const nodes=raw.nodes||{};
  const ids=Object.keys(nodes);
  if(!ids.length)throw new Error("Conversation requires at least one node");
  const start=raw.start||ids[0];
  if(!nodes[start])throw new Error(`Unknown starting conversation node: ${start}`);
  return Object.assign({},raw,{id:raw.id||`conversation-${Math.random().toString(36).slice(2)}`,start,nodes});
 }

 function createConversationSystem(options){
  const settings=options||{};
  const view=settings.view||createNoopView();
  const camera=settings.camera||{capture:()=>null,focus:()=>resolved(),restore:()=>resolved()};
  const runAction=typeof settings.runAction==="function"?settings.runAction:async(action,context)=>typeof action.run==="function"?action.run(context):undefined;
  const getTargetPosition=settings.getTargetPosition||((target,out)=>{
   if(target&&typeof target.getWorldPosition==="function")return target.getWorldPosition(out||target.position);
   return target&&target.position;
  });
  const entries=[];
  const listeners=new Set();
  let state=STATES.IDLE;
  let active=null;
  let nearby=null;
  let nodeId=null;
  let previousCamera=null;
  let context={};
  let operation=0;
  let destroyed=false;

  function snapshot(){
   return Object.freeze({state,conversationId:active&&active.definition.id,nodeId,nearbyId:nearby&&nearby.definition.id,busy:state!==STATES.IDLE&&state!==STATES.ACTIVE});
  }
  function emit(type,detail){
   const event=Object.freeze({type,detail:detail||null,snapshot:snapshot()});
   listeners.forEach(listener=>listener(event));
   if(typeof settings.onEvent==="function")settings.onEvent(event);
  }
  function setState(next,detail){state=next;view.setBusy(next!==STATES.ACTIVE);emit("state",Object.assign({state:next},detail))}
  function getNode(){return active&&active.definition.nodes[nodeId]}
  function render(){
   const node=getNode();
   if(!node)return;
   view.renderNode({
    conversationId:active.definition.id,nodeId,
    speaker:typeof node.speaker==="function"?node.speaker(context):node.speaker||active.definition.speaker||"",
    text:typeof node.text==="function"?node.text(context):node.text||"",
    actions:(node.actions||[]).filter(action=>!action.when||action.when(context)).map(action=>({id:action.id,label:typeof action.label==="function"?action.label(context):action.label||action.id}))
   });
   emit("node",{nodeId});
  }
  function resolveEntry(targetOrEntry){
   return entries.find(entry=>entry===targetOrEntry||entry.target===targetOrEntry||entry.definition.id===targetOrEntry)||null;
  }
  function register(target,definition){
   if(!target)throw new Error("Conversation target is required");
   const entry={target,definition:normalizeDefinition(definition)};
   entries.push(entry);
   if(target.userData&&settings.attachToUserData!==false)target.userData.conversation=entry.definition;
   return entry;
  }
  function unregister(targetOrEntry){
   const entry=resolveEntry(targetOrEntry),index=entries.indexOf(entry);
   if(index<0)return false;
   if(active===entry)end("unregistered");
   if(nearby===entry){nearby=null;view.hidePrompt()}
   entries.splice(index,1);return true;
  }
  function subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener)}

  async function start(targetOrEntry,startContext){
   if(destroyed||state!==STATES.IDLE)return false;
   const entry=resolveEntry(targetOrEntry||nearby);
   if(!entry)return false;
   const token=++operation;
   active=entry;nearby=null;nodeId=entry.definition.start;context=Object.assign({},startContext||{});
   previousCamera=typeof camera.capture==="function"?camera.capture():null;
   view.hidePrompt();view.showConversation({speaker:entry.definition.speaker||""});setState(STATES.ENTERING);
   emit("start",{conversationId:entry.definition.id,target:entry.target});
   try{await resolved(camera.focus(entry.target,entry.definition.camera||{},context))}
   catch(error){if(token===operation)await end("camera-error");throw error}
   if(token!==operation||destroyed)return false;
   setState(STATES.ACTIVE);render();return true;
  }
  async function goTo(next){
   if(!next)return end("complete");
   if(!active.definition.nodes[next])throw new Error(`Unknown conversation node: ${next}`);
   nodeId=next;setState(STATES.ACTIVE);render();return true;
  }
  async function choose(actionId){
   if(state!==STATES.ACTIVE)return false;
   const node=getNode();
   const action=(node.actions||[]).find(candidate=>candidate.id===actionId&&(!candidate.when||candidate.when(context)));
   if(!action)return false;
   const token=++operation;setState(STATES.ACTING,{actionId});emit("action",{actionId,phase:"start"});
   try{
    const result=await resolved(runAction(action,{target:active.target,definition:active.definition,node,nodeId,context,system:api}));
    if(token!==operation||destroyed)return false;
    emit("action",{actionId,phase:"complete",result});
    if(action.end||(result&&result.end))return end("action");
    return goTo(result&&result.next!==undefined?result.next:action.next||node.next);
   }catch(error){
    if(token===operation){setState(STATES.ACTIVE,{actionId,error});render();emit("error",{actionId,error})}
    return false;
   }
  }
  function advance(){
   if(state!==STATES.ACTIVE)return false;
   const node=getNode(),actions=(node.actions||[]).filter(action=>!action.when||action.when(context));
   if(actions.length===1)return choose(actions[0].id);
   if(actions.length>1)return false;
   return goTo(node.next);
  }
  async function end(reason){
   if(state===STATES.IDLE)return false;
   const token=++operation,entry=active,saved=previousCamera;
   setState(STATES.EXITING,{reason:reason||"dismissed"});emit("end",{reason:reason||"dismissed",phase:"start"});
   try{if(typeof camera.restore==="function")await resolved(camera.restore(saved,{reason:reason||"dismissed",target:entry&&entry.target}))}
   finally{
    if(token===operation){view.hideConversation();active=null;nodeId=null;context={};previousCamera=null;setState(STATES.IDLE);emit("end",{reason:reason||"dismissed",phase:"complete"})}
   }
   return true;
  }
  function updateInteraction(playerPosition,updateContext){
   if(state!==STATES.IDLE||!playerPosition){nearby=null;view.hidePrompt();return null}
   let best=null,bestDistance=Infinity;
   for(const entry of entries){
    const definition=entry.definition;
    if(definition.enabled&& !definition.enabled(updateContext||{}))continue;
    const position=getTargetPosition(entry.target,settings.scratchPosition);
    if(!position)continue;
    const dx=position.x-playerPosition.x,dz=position.z-playerPosition.z;
    const distance=Math.sqrt(dx*dx+dz*dz),range=Math.max(.1,Number(definition.range)||3);
    if(distance<=range&&(distance<bestDistance||(distance===bestDistance&&(definition.priority||0)>(best&&best.definition.priority||0)))){best=entry;bestDistance=distance}
   }
   nearby=best;
   if(best)view.showPrompt({id:best.definition.id,label:best.definition.prompt||"Talk",target:best.target,distance:bestDistance});else view.hidePrompt();
   return best;
  }
  function interact(interactionContext){return start(nearby,interactionContext)}
  function handleInput(event){
   if(!event||event.defaultPrevented)return false;
   if(state===STATES.IDLE&&(event.key==="e"||event.key==="E")){if(!nearby)return false;event.preventDefault();interact();return true}
   if(state!==STATES.ACTIVE)return false;
   if(event.key==="Escape"){event.preventDefault();end("dismissed");return true}
   if(event.key==="Enter"||event.key===" "){event.preventDefault();advance();return true}
   const index=Number(event.key)-1,node=getNode(),actions=node&&(node.actions||[]).filter(action=>!action.when||action.when(context));
   if(Number.isInteger(index)&&actions&&actions[index]){event.preventDefault();choose(actions[index].id);return true}
   return false;
  }
  function destroy(){destroyed=true;++operation;entries.length=0;listeners.clear();view.destroy();active=nearby=null;state=STATES.IDLE}
  const api={register,unregister,start,end,advance,choose,updateInteraction,interact,handleInput,subscribe,snapshot,destroy,get state(){return state},STATES};
  if(typeof view.bind==="function")view.bind(api);
  return api;
 }

 function createConversationDOMView(options){
  const settings=options||{},doc=settings.document||document,root=settings.root||doc.body;
  const prompt=doc.createElement("button");prompt.type="button";prompt.className="conversation-prompt";prompt.hidden=true;
  const panel=doc.createElement("section");panel.className="conversation-panel";panel.hidden=true;panel.setAttribute("role","dialog");panel.setAttribute("aria-live","polite");
  const speaker=doc.createElement("h2"),text=doc.createElement("p"),actions=doc.createElement("div"),hint=doc.createElement("p");
  speaker.className="conversation-speaker";text.className="conversation-text";actions.className="conversation-actions";hint.className="conversation-hint";hint.textContent="Enter to continue  /  Esc to leave";
  panel.append(speaker,text,actions,hint);root.append(prompt,panel);
  let system=null;
  prompt.addEventListener("click",()=>system&&system.interact());
  actions.addEventListener("click",event=>{const button=event.target.closest("[data-conversation-action]");if(button&&system)system.choose(button.dataset.conversationAction)});
  return {
   bind(value){system=value},
   showPrompt(data){prompt.textContent=`E  ${data.label}`;prompt.hidden=false;prompt.setAttribute("aria-label",data.label)},hidePrompt(){prompt.hidden=true},
   showConversation(){panel.hidden=false},
   renderNode(node){speaker.textContent=node.speaker;speaker.hidden=!node.speaker;text.textContent=node.text;actions.replaceChildren(...node.actions.map((action,index)=>{const button=doc.createElement("button");button.type="button";button.dataset.conversationAction=action.id;button.textContent=`${index+1}. ${action.label}`;return button}))},
   setBusy(busy){panel.setAttribute("aria-busy",String(Boolean(busy)));actions.querySelectorAll("button").forEach(button=>button.disabled=busy)},
   hideConversation(){panel.hidden=true;actions.replaceChildren()},destroy(){prompt.remove();panel.remove()}
  };
 }

 function createThreeConversationCameraAdapter(options){
  const settings=options||{},THREE=settings.THREE,camera=settings.camera,controls=settings.controls;
  if(!THREE||!camera)throw new Error("Three conversation camera requires THREE and camera");
  const duration=Math.max(0,Number(settings.duration)||650),raf=settings.requestAnimationFrame||requestAnimationFrame,caf=settings.cancelAnimationFrame||cancelAnimationFrame,now=settings.now||(()=>performance.now());
  let frame=0,pendingResolve=null;
  function capture(){return {position:camera.position.clone(),quaternion:camera.quaternion.clone(),zoom:camera.zoom,target:controls&&controls.target?controls.target.clone():null}}
  function poseFor(target,config){
   const box=new THREE.Box3().setFromObject(target),center=new THREE.Vector3();
   if(box.isEmpty())target.getWorldPosition(center);else box.getCenter(center);
   center.y+=Number(config.lookOffsetY)||0;
   const front=new THREE.Vector3(0,0,1);
   if(config.front)front.set(config.front.x||0,config.front.y||0,config.front.z||0);
   else front.applyQuaternion(target.getWorldQuaternion(new THREE.Quaternion()));
   front.y=0;if(front.lengthSq()<.001)front.set(0,0,1);front.normalize();
   const height=Number.isFinite(config.height)?config.height:Math.max(1.4,box.isEmpty()?1.8:box.max.y-box.min.y);
   const position=center.clone().addScaledVector(front,Number(config.distance)||3.5);position.y=center.y+height*.35;
   const quaternion=new THREE.Quaternion();new THREE.Object3D().position.copy(position);
   const helper=new THREE.Object3D();helper.position.copy(position);helper.lookAt(center);quaternion.copy(helper.quaternion);
   return {position,quaternion,zoom:camera.zoom,target:center};
  }
  function transition(destination,customDuration){
   if(!destination)return resolved();
   if(frame){caf(frame);frame=0;if(pendingResolve)pendingResolve()}
   const source=capture(),started=now(),ms=Math.max(0,customDuration===undefined?duration:customDuration);
   return new Promise(resolve=>{
    pendingResolve=resolve;
    function tick(){
     const alpha=ms?clamp01((now()-started)/ms):1,t=smoothstep(alpha);
     camera.position.lerpVectors(source.position,destination.position,t);camera.quaternion.slerpQuaternions(source.quaternion,destination.quaternion,t);
     if(Number.isFinite(destination.zoom)){camera.zoom=source.zoom+(destination.zoom-source.zoom)*t;camera.updateProjectionMatrix()}
     if(controls&&controls.target&&destination.target)controls.target.lerpVectors(source.target||controls.target,destination.target,t);
     if(controls&&typeof controls.update==="function")controls.update();
     if(alpha<1)frame=raf(tick);else{
      // Orbit-style controls may derive a slightly different quaternion during update.
      // Force every captured value back verbatim on the final restoration frame.
      camera.position.copy(destination.position);camera.quaternion.copy(destination.quaternion);
      if(Number.isFinite(destination.zoom)){camera.zoom=destination.zoom;camera.updateProjectionMatrix()}
      if(controls&&controls.target&&destination.target)controls.target.copy(destination.target);
      frame=0;pendingResolve=null;resolve();
     }
    }
    tick();
   });
  }
  return {capture,focus:(target,config)=>transition(poseFor(target,config),config.duration),restore:saved=>transition(saved,saved&&saved.duration)};
 }

 return {STATES,createConversationSystem,createConversationDOMView,createThreeConversationCameraAdapter};
});
