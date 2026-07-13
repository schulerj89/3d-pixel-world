const assert=require("node:assert/strict"),{cityCarOpacity,CityCarScheduler,CityCarSystem}=require("../city-car-system.js");
const s=new CityCarScheduler({minDelay:2,maxDelay:2,random:()=>.5});
assert.equal(s.update(1,true),false);assert.equal(s.update(1,true),true);assert.equal(s.update(2,false),false);assert.equal(s.update(0,true),true);s.reset();assert.equal(s.update(-10,true),false);console.log("city car scheduler tests passed");
assert.equal(typeof CityCarSystem.prototype.installTemplates,"function","traffic pool must accept KayKit car templates");
assert.equal(typeof CityCarSystem.prototype.debugFormation,"function","traffic pool must support deterministic direction QA");
assert.equal(cityCarOpacity(0,70,9),0);assert.equal(cityCarOpacity(4.5,70,9),.5);assert.equal(cityCarOpacity(35,70,9),1);assert.equal(cityCarOpacity(70,70,9),0);
