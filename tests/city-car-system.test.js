const assert=require("node:assert/strict"),{CityCarScheduler}=require("../city-car-system.js");
const s=new CityCarScheduler({minDelay:2,maxDelay:2,random:()=>.5});
assert.equal(s.update(1,true),false);assert.equal(s.update(1,true),true);assert.equal(s.update(2,false),false);assert.equal(s.update(0,true),true);s.reset();assert.equal(s.update(-10,true),false);console.log("city car scheduler tests passed");
