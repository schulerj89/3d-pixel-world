// Landscape-first title screen with a disposable animated Styloo chibi preview.
(function(global){
 const screen=document.getElementById("titleScreen");
 const mount=document.getElementById("titleCharacterPreview");
 const start=document.getElementById("titleStartButton");
 if(!screen||!mount||!start)return;

 let renderer=null,scene=null,camera=null,mixer=null,model=null,frame=0,resizeObserver=null,lastTime=performance.now(),modelHeight=0;
 const compactLandscape=global.matchMedia("(orientation: landscape) and (max-height: 540px)");
 const debug={status:"loading",asset:"styloo-chibi-student.glb",clip:"anim_iddle",disposed:false,error:null,framing:null};
 global.getTitleScreenDebug=()=>({...debug,renderInfo:renderer?{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}:null});
 const assetUrl="assets/models/character/styloo-chibi-student.glb?v=__BUILD_VERSION__";

 function frameModel(){
  if(!camera)return;
  if(compactLandscape.matches){
   const targetY=1.5,distance=6.1;
   camera.position.set(0,targetY,distance);camera.lookAt(0,targetY,0);
   debug.framing={mode:"compact-grounded",height:modelHeight||null,targetY,distance};
  }else{
   camera.position.set(0,1.34,5.4);camera.lookAt(0,1.26,0);
   debug.framing={mode:"default",height:modelHeight,fill:null,targetY:1.26,distance:5.4};
  }
 }
 function resize(){
  if(!renderer||!camera)return;
  const width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);
  renderer.setPixelRatio(Math.min(global.devicePixelRatio||1,1.5));
  renderer.setSize(width,height,false);camera.aspect=width/height;frameModel();camera.updateProjectionMatrix();
 }
 function render(time){
  const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;mixer?.update(dt);
  renderer?.render(scene,camera);frame=requestAnimationFrame(render);
 }
 function disposeModel(target){
  target?.traverse(object=>{if(!object.isMesh)return;object.geometry?.dispose?.();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>{if(!material)return;Object.values(material).forEach(value=>value?.isTexture&&value.dispose());material.dispose?.()})});
 }
 function dispose(){
  cancelAnimationFrame(frame);resizeObserver?.disconnect();global.removeEventListener("resize",resize);mixer?.stopAllAction();
  disposeModel(model);
  renderer?.dispose();renderer?.forceContextLoss?.();mount.replaceChildren();renderer=scene=camera=mixer=model=null;
  debug.status="disposed";debug.disposed=true;
 }
 function closeTitle(){
  global.startGameMusic?.();screen.hidden=true;screen.setAttribute("aria-hidden","true");dispose();
  document.getElementById("customizeHeading")?.focus({preventScroll:true});
 }
 start.addEventListener("click",closeTitle,{once:true});

 const Loader=global.ThreeGLTFLoader?.GLTFLoader;
 if(!global.THREE||!Loader){debug.status="fallback";debug.error="Three.js GLTF loader unavailable";mount.classList.add("titlePreviewUnavailable");return}
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(28,1,.1,30);camera.position.set(0,1.34,5.4);camera.lookAt(0,1.26,0);
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);mount.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xfff6ff,0x9b7bb6,2.2));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(3,5,4);scene.add(key);const fill=new THREE.DirectionalLight(0xffa9dc,1.4);fill.position.set(-3,2,2);scene.add(fill);
 if(global.ResizeObserver){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(mount)}else global.addEventListener("resize",resize);
 resize();
 new Loader().load(assetUrl,gltf=>{
  if(screen.hidden){disposeModel(gltf.scene);return}
  model=gltf.scene;model.name="title-chibi-preview";model.scale.setScalar(1.04);model.rotation.y=0;
  const bounds=new THREE.Box3().setFromObject(model);modelHeight=bounds.max.y-bounds.min.y;model.position.y=-bounds.min.y;frameModel();camera.updateProjectionMatrix();
  model.traverse(object=>{if(object.isMesh){object.frustumCulled=false;object.castShadow=false;object.receiveShadow=false}});
  scene.add(model);mixer=new THREE.AnimationMixer(model);const idle=gltf.animations.find(clip=>clip.name==="anim_iddle");if(idle)mixer.clipAction(idle).play();
  debug.status="ready";
 },undefined,error=>{debug.status="fallback";debug.error=String(error?.message||error);mount.classList.add("titlePreviewUnavailable");console.warn("Title chibi preview unavailable.",error)});
 frame=requestAnimationFrame(render);
 global.addEventListener("pagehide",dispose,{once:true});
})(window);
