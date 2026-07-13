const assert=require("assert");

global.window=global;
global.localStorage={getItem(){return JSON.stringify({skin:0xd99568,hair:0x222222,shirt:0x55c985,pants:0x292b35})}};
function root(){return {children:[{visible:true}],userData:{},add(child){this.children.push(child)},remove(child){this.children=this.children.filter(item=>item!==child)}}}
global.playerAvatarRoot=root();global.avatarPreviewRoot=root();
const clips=["CharacterArmature|Idle","CharacterArmature|Walk","CharacterArmature|Run"].map(name=>({name}));
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
 assert(playerAvatarRoot.children[0].visible===false,"voxel fallback should hide only after successful validation");
 customHumanoidCharacter.update(.016,true,.45);assert.strictEqual(getCharacterAssetDebug().state,"walk");
 customHumanoidCharacter.update(.016,true,1);assert.strictEqual(getCharacterAssetDebug().state,"run");
 customHumanoidCharacter.update(.016,false,0);assert.strictEqual(getCharacterAssetDebug().state,"idle");
 console.log("humanoid character system: validated idle/walk/run state selection");
});
