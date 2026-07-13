"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {STATES,createConversationSystem}=require("../conversation-system.js");

function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}}
function makeView(){
 const calls=[];
 return {calls,bind(system){this.system=system},showPrompt:data=>calls.push(["prompt",data]),hidePrompt:()=>calls.push(["hidePrompt"]),showConversation:data=>calls.push(["show",data]),renderNode:data=>calls.push(["node",data]),setBusy:value=>calls.push(["busy",value]),hideConversation:()=>calls.push(["hide"]),destroy:()=>calls.push(["destroy"])};
}

(async()=>{
 const view=makeView(),focusGate=deferred(),restoreGate=deferred();
 const savedCamera={position:{x:8,y:9,z:10},quaternion:{x:0,y:0,z:0,w:1},zoom:1.5,target:{x:2,y:1,z:3}};
 const cameraCalls=[];
 const camera={capture(){cameraCalls.push(["capture"]);return savedCamera},focus(target,config){cameraCalls.push(["focus",target,config]);return focusGate.promise},restore(snapshot,detail){cameraCalls.push(["restore",snapshot,detail]);return restoreGate.promise}};
 const actionCalls=[];
 const system=createConversationSystem({view,camera,runAction:async(action,ctx)=>{actionCalls.push([action.id,ctx.target]);return action.result}});
 assert.equal(view.system,system,"DOM-style views are bound automatically");
 const alien={position:{x:2,y:-.1,z:1},userData:{}};
 const entry=system.register(alien,{id:"alien-guide",speaker:"Zee",prompt:"Speak",range:3,camera:{distance:4},start:"hello",nodes:{
  hello:{text:"Can you help?",actions:[{id:"yes",label:"Yes",next:"task"},{id:"no",label:"No",end:true}]},
  task:{text:ctx=>`Collect ${ctx.count} coins.`,actions:[{id:"accept",label:"Accept",result:{end:true}}]}
 }});
 assert.equal(alien.userData.conversation.id,"alien-guide","definition may be attached declaratively to a Three object");
 assert.equal(system.updateInteraction({x:0,z:0}),entry);
 assert.equal(view.calls.at(-1)[0],"prompt");
 const starting=system.interact({count:5});
 assert.equal(system.state,STATES.ENTERING);
 assert.equal(await system.interact(),false,"repeat interactions are ignored while entering");
 assert.equal(cameraCalls[0][0],"capture");
 focusGate.resolve();await starting;
 assert.equal(system.state,STATES.ACTIVE);
 assert.equal(view.calls.filter(call=>call[0]==="node").at(-1)[1].text,"Can you help?");
 assert.equal(await system.choose("missing"),false);
 assert.equal(await system.choose("yes"),true);
 assert.equal(system.snapshot().nodeId,"task");
 assert.equal(view.calls.filter(call=>call[0]==="node").at(-1)[1].text,"Collect 5 coins.");
 const ending=system.choose("accept");
 await Promise.resolve();
 assert.equal(system.state,STATES.EXITING);
 assert.equal(cameraCalls.at(-1)[0],"restore");
 assert.strictEqual(cameraCalls.at(-1)[1],savedCamera,"the exact captured camera state is restored");
 restoreGate.resolve();await ending;
 assert.equal(system.state,STATES.IDLE);
 assert.deepEqual(actionCalls.map(call=>call[0]),["yes","accept"]);

 const localPosition={x:1,y:0,z:2,clone(){return {x:this.x,y:this.y,z:this.z}}};
 const nestedTarget={position:localPosition,userData:{},getWorldPosition(out){out.x=11;out.y=0;out.z=12;return out}};
 const portable=createConversationSystem({view:makeView()});
 const nestedEntry=portable.register(nestedTarget,{id:"nested",range:30,nodes:{hello:{text:"Hi"}}});
 assert.equal(portable.updateInteraction({x:10,z:10}),nestedEntry,"proximity uses the target's world position");
 assert.deepEqual({x:localPosition.x,y:localPosition.y,z:localPosition.z},{x:1,y:0,z:2},"world-position queries must not corrupt the target's local transform");
 portable.destroy();

 const instantView=makeView(),events=[];
 const instant=createConversationSystem({view:instantView,camera:{capture:()=>({exact:true}),focus:()=>{},restore:()=>{}},onEvent:event=>events.push(event.type)});
 const consoleObject={position:{x:0,z:0},userData:{}};
 instant.register(consoleObject,{id:"console",nodes:{one:{text:"Status nominal.",next:"two"},two:{text:"Done."}}});
 instant.updateInteraction({x:0,z:0});
 let prevented=0;
 assert.equal(instant.handleInput({key:"E",preventDefault(){prevented++}}),true);
 await Promise.resolve();
 assert.equal(instant.state,STATES.ACTIVE);
 assert.equal(instant.handleInput({key:"Enter",preventDefault(){prevented++}}),true);
 await Promise.resolve();
 assert.equal(instant.snapshot().nodeId,"two");
 assert.equal(instant.handleInput({key:"Escape",preventDefault(){prevented++}}),true);
 await Promise.resolve();
 assert.equal(instant.state,STATES.IDLE);
 assert.equal(prevented,3);
 assert.ok(events.includes("start")&&events.includes("node")&&events.includes("end"),"debug events expose lifecycle changes");
 assert.equal(instant.unregister(consoleObject),true);
 instant.destroy();
 assert.equal(instantView.calls.at(-1)[0],"destroy");

 assert.throws(()=>createConversationSystem().register({},{}),/at least one node/);
 const source=fs.readFileSync(path.join(__dirname,"..","conversation-system.js"),"utf8");
 assert.match(source,/Number\.isFinite\(config\.targetHeight\)/,"animated actors can provide a stable root-relative camera target");
 assert.match(source,/const helper=camera\.clone\(\)/,"camera framing uses the camera's -Z forward axis");
 assert.match(source,/prompt\.textContent=data\.label/,"touch prompt does not advertise an E key");
 assert.match(source,/button\.textContent=action\.label/,"touch actions do not advertise number-key shortcuts");
 assert.doesNotMatch(source,/Enter to continue|Esc to leave|conversation-hint/,"conversation UI has no keyboard instruction copy");
 console.log("conversation-system tests passed");
})().catch(error=>{console.error(error);process.exitCode=1});
