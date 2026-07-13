const assert=require("assert");

global.window=global;
global.localStorage={getItem(){return JSON.stringify({skin:0xd99568,hair:0x222222,shirt:0x55c985,pants:0x292b35})}};
let facingAttachments=0;
global.characterFacing={STYLOO_MODEL_FORWARD_AXIS:"+z",STYLOO_MODEL_FORWARD_CORRECTION:0,
 attachVisual(visual,axis){facingAttachments++;assert.strictEqual(axis,"+z");visual.rotation.y=0;return 0}};
function root(){return {children:[{visible:true}],userData:{},add(child){this.children.push(child)},remove(child){this.children=this.children.filter(item=>item!==child)}}}
global.playerAvatarRoot=root();global.avatarPreviewRoot=root();
const clips=["anim_iddle","anim_walk","anim_run"].map(name=>({name}));
class Loader{load(_url,resolve){resolve({scene:{name:"",scale:{setScalar(){}},rotation:{},userData:{},traverse(){}},animations:clips})}}
class AnimationMixer{
 constructor(){this.actions=new Map()}
 clipAction(clip){
  const action={clip,reset(){return this},setEffectiveTimeScale(){return this},setEffectiveWeight(){return this},fadeIn(){return this},play(){return this},fadeOut(){return this}};
  this.actions.set(clip.name,action);return action;
 }
 update(){}
}
global.ThreeGLTFLoader={GLTFLoader:Loader};global.THREE={AnimationMixer};
require("../humanoid-character.js");

setImmediate(()=>{
 assert.strictEqual(getCharacterAssetDebug().status,"ready");
 assert.strictEqual(getCharacterAssetDebug().fallback,false);
 assert.strictEqual(getCharacterAssetDebug().source,"Styloo Chibi Characters v1.2 / studentpr.glb");
 assert.strictEqual(getCharacterAssetDebug().orientation.forwardAxis,"+z");
 assert.strictEqual(getCharacterAssetDebug().orientation.yawOffsetRadians,0);
 assert.strictEqual(facingAttachments,2,"world and wardrobe visuals must use the shared facing system");
 assert.strictEqual(playerAvatarRoot.userData.characterAsset,"styloo-chibi-student-v1.2");
 assert.strictEqual(playerAvatarRoot.userData.characterForwardAxis,"+z");
 assert(playerAvatarRoot.children[0].visible===false,"voxel fallback should hide only after successful validation");
 customHumanoidCharacter.update(.016,true,.45);assert.strictEqual(getCharacterAssetDebug().state,"walk");
 customHumanoidCharacter.update(.016,true,1);assert.strictEqual(getCharacterAssetDebug().state,"run");
 customHumanoidCharacter.update(.016,false,0);assert.strictEqual(getCharacterAssetDebug().state,"idle");
 console.log("humanoid character system: validated idle/walk/run state selection");
});
