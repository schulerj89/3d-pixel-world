// Chibi color customization, preview, and persisted house decorating.
const startPage=document.getElementById("startPage"),housePanel=document.getElementById("housePanel");
let furniture=[];
const saved=JSON.parse(localStorage.getItem("my3DWorld")||"{}");
// The Styloo student has one locked outfit/hair mesh; retain only its four color choices.
const legacyShirt=Number(saved.shirt),storedOutfitColor=Number(saved.outfitColor);
const hasStoredOutfit=saved.outfitColor!=null&&Number.isFinite(storedOutfitColor),hasLegacyShirt=saved.shirt!=null&&Number.isFinite(legacyShirt);
saved.outfitColor=hasStoredOutfit?storedOutfitColor:(hasLegacyShirt?legacyShirt:0xb77cff);
delete saved.characterType;delete saved.hairStyle;delete saved.outfit;delete saved.shirt;delete saved.astronautHelmet;
localStorage.setItem("my3DWorld",JSON.stringify(saved));
function selectCustomizationButton(area,button){
 area.querySelectorAll("button").forEach(b=>{const selected=b===button;b.classList.toggle("selected",selected);b.setAttribute("aria-pressed",selected)});
}
function colorButtons(id,colors,apply,selectedColor){
 const area=document.getElementById(id);
 colors.forEach((c,index)=>{let b=document.createElement("button");b.className="swatch";b.style.background="#"+c.toString(16).padStart(6,"0");b.setAttribute("aria-label","Color "+(index+1));b.onclick=()=>{apply(c);selectCustomizationButton(area,b);saveWorld()};area.appendChild(b);if(c===selectedColor)selectCustomizationButton(area,b)})
}


// Bakery blender and fruit counter
const blenderStation=new THREE.Group();
function blenderPart(w,h,d,c,x,y,z){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c,transparent:c===0x99ddff,opacity:c===0x99ddff?.65:1}));
 m.position.set(x,y,z);m.castShadow=true;blenderStation.add(m);return m;
}
blenderPart(1.8,.85,1,0xf1c27d,-3.8,.43,-2.4);
const blenderBase=blenderPart(.65,.35,.55,0xdddddd,-3.8,1.02,-2.4);
const blenderJar=blenderPart(.55,.8,.5,0x99ddff,-3.8,1.58,-2.4);
const blenderLid=blenderPart(.62,.12,.56,0x555555,-3.8,2.03,-2.4);
const blenderPower=blenderPart(.12,.12,.05,0xff5555,-3.8,1.03,-1.89);
// Fruit bowl and voxel fruits
blenderPart(1,.18,.65,0xd9a05b,-2.45,1.02,-2.4);
[
[-2.72,1.22,-2.4,0xff3f55],[-2.45,1.25,-2.36,0xff3f55],
[-2.18,1.22,-2.42,0xffd83d],[-2.57,1.42,-2.4,0xffd83d],
[-2.3,1.43,-2.38,0x66cc55]
].forEach(a=>blenderPart(.24,.24,.24,a[3],a[0],a[1],a[2]));
// Chocolate bar and milk carton for milkshakes
blenderPart(.5,.12,.3,0x6b351f,-1.75,1.18,-2.38);
blenderPart(.38,.65,.38,0xf7f7f7,-1.15,1.32,-2.4);
blenderPart(.3,.12,.3,0x78bfff,-1.15,1.7,-2.4);

// Local blender geometry is centered at (-3.8, -2.4); offset the group so its
// working point lands on the data-driven station coordinate.
blenderStation.position.set(KITCHEN_STATIONS.blender.x+3.8,0,KITCHEN_STATIONS.blender.z+2.4);S.add(blenderStation);
// The milkshake ingredients now live on the shared food-ingredient shelf.
for(let i=5;i<blenderStation.children.length;i++) blenderStation.children[i].visible=false;

// A short, prop-local blender effect. The single reusable audio element prevents
// overlapping copies while animating only the appliance leaves its counter still.
let blenderEffectRunning=false;
function playBlenderSound(durationMs){
 const audio=document.getElementById("blenderSound");
 if(!audio)return;
 audio.pause();
 audio.currentTime=0;
 audio.volume=.28;
 const playPromise=audio.play();
 if(playPromise)playPromise.catch(()=>{});
 clearTimeout(playBlenderSound.stopTimer);
 playBlenderSound.stopTimer=setTimeout(()=>{
  audio.pause();
  audio.currentTime=0;
 },durationMs);
}
function runBlenderEffect(durationMs=1900){
 if(blenderEffectRunning)return;
 blenderEffectRunning=true;playBlenderSound(durationMs);
 const start=performance.now();
 const baseY=blenderBase.position.y,jarY=blenderJar.position.y,lidY=blenderLid.position.y;
 if(blenderPower.material.emissive){blenderPower.material.emissive.setHex(0xff3300);blenderPower.material.emissiveIntensity=1.4}
 function frame(now){
  const elapsed=now-start,fade=Math.min(1,elapsed/100,(durationMs-elapsed)/140),wobble=Math.max(0,fade);
  const shake=Math.sin(elapsed*.12)*.035*wobble;
  blenderBase.position.y=baseY+Math.abs(shake)*.18;
  blenderJar.position.set(-3.8+shake,jarY+Math.abs(shake)*.28,-2.4);
  blenderLid.position.set(-3.8+shake*1.1,lidY+Math.abs(shake)*.28,-2.4);
  blenderJar.rotation.z=shake*.65;blenderLid.rotation.z=shake*.72;
  if(elapsed<durationMs){requestAnimationFrame(frame);return}
  blenderBase.position.y=baseY;blenderJar.position.set(-3.8,jarY,-2.4);blenderLid.position.set(-3.8,lidY,-2.4);
  blenderJar.rotation.z=0;blenderLid.rotation.z=0;
  if(blenderPower.material.emissive){blenderPower.material.emissive.setHex(0);blenderPower.material.emissiveIntensity=0}
  blenderEffectRunning=false;
 }
 requestAnimationFrame(frame);
}
// Real 3D avatar preview on the first page
const previewScene=new THREE.Scene();previewScene.background=new THREE.Color(0xe9f7ff);
const previewCamera=new THREE.PerspectiveCamera(45,210/270,.1,50);previewCamera.position.set(0,2.3,6);previewCamera.lookAt(0,1.2,0);
const previewRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});previewRenderer.setSize(200,260);
const previewHost=document.getElementById("characterPreview3D");previewHost.appendChild(previewRenderer.domElement);
function resizeCharacterPreview(){
 const width=Math.max(1,previewHost.clientWidth),height=Math.max(1,previewHost.clientHeight);
 previewRenderer.setSize(width,height,false);previewCamera.aspect=width/height;previewCamera.updateProjectionMatrix();
}
new ResizeObserver(resizeCharacterPreview).observe(previewHost);resizeCharacterPreview();
previewScene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const previewAvatar=new THREE.Group();previewScene.add(previewAvatar);window.avatarPreviewRoot=previewAvatar;
function previewBox(w,h,d,c,x,y,z){let m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c}));m.position.set(x,y,z);previewAvatar.add(m);return m}
const pvHead=previewBox(.9,.9,.9,0xf2bb91,0,2.2,0),pvShirt=previewBox(1.05,1.05,.65,0xb77cff,0,1.25,0);
const pvArm1=previewBox(.28,.95,.32,0xf2bb91,-.72,1.3,0),pvArm2=previewBox(.28,.95,.32,0xf2bb91,.72,1.3,0);
const pvLeg1=previewBox(.38,.95,.45,0x5870c8,-.25,.28,0),pvLeg2=previewBox(.38,.95,.45,0x5870c8,.25,.28,0);
const pvHairTop=previewBox(.98,.25,.98,0x6b3c35,0,2.68,0),pvHairSide=previewBox(.2,.58,.9,0x6b3c35,-.4,2.35,0);
const playerAttachmentRig=new ThreeCharacterAttachmentRig({head:playerHead,torso:playerShirt,leftArm:playerLeftArm,rightArm:playerRightArm,leftLeg:playerLeftLeg,rightLeg:playerRightLeg});
const previewAttachmentRig=new ThreeCharacterAttachmentRig({head:pvHead,torso:pvShirt,leftArm:pvArm1,rightArm:pvArm2,leftLeg:pvLeg1,rightLeg:pvLeg2});
// Lightweight primitive wearables are shared conceptually by the in-world
// player and preview. Keeping each look in its own group makes switching cheap.
function wearableMesh(parent,geometry,color,x,y,z){
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color}));
 mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function buildWearables(parent,rig){
 const looks={};
 function look(name){const group=new THREE.Group();group.visible=false;parent.add(group);looks[name]={group,colorMeshes:[]};return looks[name]}
 let w=look("Everyday");
 w=look("Princess");
 w.colorMeshes.push(wearableMesh(w.group,new THREE.CylinderGeometry(.72,.98,1.18,8),0xe874ba,0,.83,0));
 wearableMesh(w.group,new THREE.CylinderGeometry(.47,.47,.13,8),0xffd84d,0,2.72,0);
 [-.31,-.1,.1,.31].forEach((x,i)=>wearableMesh(w.group,new THREE.ConeGeometry(.12,.34,4),0xffd84d,x,2.93,i%2?.02:0));
 w=look("Wizard");
 w.colorMeshes.push(wearableMesh(w.group,new THREE.CylinderGeometry(.66,.9,1.2,8),0x6551c9,0,.82,0));
 w.colorMeshes.push(wearableMesh(w.group,new THREE.CylinderGeometry(.65,.65,.10,12),0x6551c9,0,2.72,0));
 const wizardHat=wearableMesh(w.group,new THREE.ConeGeometry(.47,1.05,10),0x6551c9,.08,3.18,0);wizardHat.rotation.z=-.12;w.colorMeshes.push(wizardHat);
 wearableMesh(w.group,new THREE.BoxGeometry(.14,.14,.08),0xffdc55,-.18,3.18,.38);
 w=look("Explorer");
 w.colorMeshes.push(wearableMesh(w.group,new THREE.BoxGeometry(1.09,.24,.68),0xc9934e,0,1.12,0));
 w.colorMeshes.push(wearableMesh(w.group,new THREE.CylinderGeometry(.55,.55,.11,12),0xc9934e,0,2.69,0));
 w.colorMeshes.push(wearableMesh(w.group,new THREE.CylinderGeometry(.38,.43,.24,12),0xc9934e,0,2.82,0));
 wearableMesh(w.group,new THREE.BoxGeometry(.58,.72,.25),0x6e4b2d,0,1.35,-.43);
 wearableMesh(w.group,new THREE.BoxGeometry(.16,.16,.73),0xffd45c,0,1.13,.04);
 w=look("Beach Star");
 w.colorMeshes.push(wearableMesh(w.group,new THREE.BoxGeometry(.86,.38,.57),0x28b9cf,0,.72,0));
 w.colorMeshes.push(wearableMesh(w.group,new THREE.BoxGeometry(1.08,.18,.67),0x28b9cf,0,1.24,.02));
 wearableMesh(w.group,new THREE.TorusGeometry(.73,.13,7,18),0xffcf42,0,1.05,0).rotation.x=Math.PI/2;
 wearableMesh(w.group,new THREE.CylinderGeometry(.54,.54,.08,12),0xf2d36b,0,2.73,0);
 w=look("Astronaut");
 w.attachedMeshes=[];
 function suitPart(slot,geometry,color,position){
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color}));mesh.castShadow=true;
  rig.attach(slot,mesh,position);w.attachedMeshes.push(mesh);return mesh;
 }
 w.colorMeshes.push(suitPart("torso",new THREE.BoxGeometry(1.12,1.12,.72),0xe8edf4,[0,.05,0]));
 w.colorMeshes.push(suitPart("leftArm",new THREE.BoxGeometry(.34,.98,.40),0xe8edf4,[0,.1,0]));
 w.colorMeshes.push(suitPart("rightArm",new THREE.BoxGeometry(.34,.98,.40),0xe8edf4,[0,.1,0]));
 w.colorMeshes.push(suitPart("leftLeg",new THREE.BoxGeometry(.48,.43,.60),0xe8edf4,[0,-.11,.04]));
 w.colorMeshes.push(suitPart("rightLeg",new THREE.BoxGeometry(.48,.43,.60),0xe8edf4,[0,-.11,.04]));
 suitPart("torso",new THREE.BoxGeometry(.74,.82,.28),0x9aa8b8,[0,.14,-.48]);
 suitPart("torso",new THREE.BoxGeometry(.46,.24,.05),0x28384f,[0,.17,.39]);
 [-.14,0,.14].forEach((x,index)=>suitPart("torso",new THREE.BoxGeometry(.08,.08,.06),[0x66d6ff,0xffd34f,0xff6b79][index],[x,.17,.44]));
 w.setVisible=visible=>{w.group.visible=visible;w.attachedMeshes.forEach(mesh=>mesh.visible=visible)};
 return looks;
}
const playerWearables=buildWearables(P,playerAttachmentRig);
const previewWearables=buildWearables(previewAvatar,previewAttachmentRig);
function buildAstronautHelmet(rig){
 const group=new THREE.Group();rig.attach("head",group,[0,.25,0]);
 const shell=wearableMesh(group,new THREE.SphereGeometry(.62,14,10),0xe8edf4,0,0,0);shell.scale.set(1,1.03,.92);
 shell.material.transparent=true;shell.material.opacity=.28;shell.material.roughness=.3;
 const visor=wearableMesh(group,new THREE.SphereGeometry(.53,14,9),0x79c8e8,0,-.01,.10);
 visor.material.transparent=true;visor.material.opacity=.35;visor.material.roughness=.2;visor.scale.set(.88,.72,.92);
 const collar=wearableMesh(group,new THREE.TorusGeometry(.56,.07,6,18),0x9aa8b8,0,-.37,0);collar.rotation.x=Math.PI/2;
 group.visible=false;return group;
}
const playerAstronautHelmet=buildAstronautHelmet(playerAttachmentRig);
const previewAstronautHelmet=buildAstronautHelmet(previewAttachmentRig);
const pvPuffPieces=[];
function addPreviewPuff(x,y,z,s){
 let m=previewBox(.34*s,.34*s,.34*s,0x6b3c35,x,y,z);
 m.visible=false;pvPuffPieces.push(m);
}
PUFF_HAIR_VOXELS.forEach(a=>addPreviewPuff(...a));
const pvLongPieces=[];
function addPreviewLong(x,y,z,w,h,d,rz=0){
 let m=previewBox(w,h,d,0x6b3c35,x,y,z);m.rotation.z=rz;m.visible=false;pvLongPieces.push(m);
}
LONG_HAIR_LAYERS.forEach(a=>addPreviewLong(...a));
const pvShortCurlPieces=[];
function addPreviewShortCurl(x,y,z,s){
 let m=previewBox(.31*s,.31*s,.31*s,0x6b3c35,x,y,z);m.visible=false;pvShortCurlPieces.push(m);
}
SHORT_HAIR_VOXELS.forEach(a=>addPreviewShortCurl(...a));



previewBox(.11,.13,.05,0x202020,-.2,2.25,.47);previewBox(.11,.13,.05,0x202020,.2,2.25,.47);previewBox(.3,.06,.05,0x9b3f55,0,2.02,.47);
let previewDrag=false,lastPreviewX=0;
previewRenderer.domElement.addEventListener("pointerdown",e=>{previewDrag=true;lastPreviewX=e.clientX;previewRenderer.domElement.setPointerCapture(e.pointerId)});
previewRenderer.domElement.addEventListener("pointermove",e=>{if(previewDrag){previewAvatar.rotation.y+=(e.clientX-lastPreviewX)*.02;lastPreviewX=e.clientX}});
previewRenderer.domElement.addEventListener("pointerup",()=>previewDrag=false);
const titleScreen=document.getElementById("titleScreen"),customizeStep=document.getElementById("customizeLooks");
(function previewLoop(){requestAnimationFrame(previewLoop);if(titleScreen?.hidden&&startPage.style.display!=="none"&&!customizeStep.hidden)previewRenderer.render(previewScene,previewCamera)})();

colorButtons("startHairColor",[0x2b1a12,0x6b3c35,0xc9873c,0xf2d36b,0x222222,0xff79b0],c=>{materialColor(playerHairTop,c);materialColor(playerHairSide,c);materialColor(pvHairTop,c);materialColor(pvHairSide,c);playerPuffPieces.forEach(m=>materialColor(m,c));pvPuffPieces.forEach(m=>materialColor(m,c));playerLongPieces.forEach(m=>materialColor(m,c));pvLongPieces.forEach(m=>materialColor(m,c));playerShortCurlPieces.forEach(m=>materialColor(m,c));pvShortCurlPieces.forEach(m=>materialColor(m,c));saved.hair=c},saved.hair??0x6b3c35);
colorButtons("startSkin",[0xf2bb91,0xd99568,0xb97850,0x7b4932,0x4b2b20],c=>{materialColor(playerHead,c);materialColor(playerLeftArm,c);materialColor(playerRightArm,c);saved.skin=c;materialColor(pvHead,c);materialColor(pvArm1,c);materialColor(pvArm2,c)},saved.skin??0xf2bb91);
colorButtons("startOutfitColor",[0xb77cff,0xff73aa,0x55c985,0x5b9cff,0xffc83d],c=>{materialColor(playerShirt,c);materialColor(pvShirt,c);saved.outfitColor=c;setFallbackOutfitColor(c)},saved.outfitColor);
colorButtons("startPants",[0x5870c8,0x292b35,0xd95b91,0x397b55,0xf1f1f1],c=>{materialColor(playerLeftLeg,c);materialColor(playerRightLeg,c);saved.pants=c;materialColor(pvLeg1,c);materialColor(pvLeg2,c)},saved.pants??0x5870c8);
function showEverydayFallback(){
 Object.entries(playerWearables).forEach(([key,value])=>(value.setVisible||((visible)=>value.group.visible=visible))(key==="Everyday"));
 Object.entries(previewWearables).forEach(([key,value])=>(value.setVisible||((visible)=>value.group.visible=visible))(key==="Everyday"));
}
function setFallbackOutfitColor(color){
 Object.values(playerWearables).forEach(value=>value.colorMeshes.forEach(mesh=>materialColor(mesh,color)));
 Object.values(previewWearables).forEach(value=>value.colorMeshes.forEach(mesh=>materialColor(mesh,color)));
}
setFallbackOutfitColor(saved.outfitColor);showEverydayFallback();
playerAstronautHelmet.visible=false;previewAstronautHelmet.visible=false;
if(saved.skin){materialColor(playerHead,saved.skin);materialColor(playerLeftArm,saved.skin);materialColor(playerRightArm,saved.skin)}
materialColor(playerShirt,saved.outfitColor);
if(saved.pants){materialColor(playerLeftLeg,saved.pants);materialColor(playerRightLeg,saved.pants);materialColor(pvLeg1,saved.pants);materialColor(pvLeg2,saved.pants)}
if(saved.skin){materialColor(pvHead,saved.skin);materialColor(pvArm1,saved.skin);materialColor(pvArm2,saved.skin)}
materialColor(pvShirt,saved.outfitColor);
if(saved.hair){materialColor(playerHairTop,saved.hair);materialColor(playerHairSide,saved.hair);materialColor(pvHairTop,saved.hair);materialColor(pvHairSide,saved.hair);playerPuffPieces.forEach(m=>materialColor(m,saved.hair));pvPuffPieces.forEach(m=>materialColor(m,saved.hair));playerLongPieces.forEach(m=>materialColor(m,saved.hair));pvLongPieces.forEach(m=>materialColor(m,saved.hair));playerShortCurlPieces.forEach(m=>materialColor(m,saved.hair));pvShortCurlPieces.forEach(m=>materialColor(m,saved.hair))}
function saveWorld(){saved.money=window.gameEconomy?.getBalance?.()??saved.money;saved.furniture=furniture.filter(x=>x.userData.kind!=="remote").map(x=>({
 kind:x.userData.kind,
 x:x.position.x,
 z:x.position.z,
 rotation:x.rotation.y
}));localStorage.setItem("my3DWorld",JSON.stringify(saved));window.customHumanoidCharacter?.applyCustomization(saved)}
