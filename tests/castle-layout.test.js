const assert=require("node:assert/strict");
const layout=require("../castle-layout.js");

assert.equal(layout.isUpperFloor(0,0),true,"main upper deck should span the hall");
assert.equal(layout.isUpperFloor(-10.6,0),false,"the ramp opening must remain clear");
assert.equal(layout.isUpperFloor(-10.6,-11.6),true,"the upper landing must meet the ramp top");
assert.equal(layout.elevationAt(-10.6,10,0),0,"ramp begins on the first floor");
assert.equal(layout.elevationAt(-10.6,-10,0),layout.UPPER_Y,"ramp reaches the second floor");
assert.equal(layout.elevationAt(0,0,layout.UPPER_Y),layout.UPPER_Y,"upper deck retains elevation");
assert.equal(layout.elevationAt(0,0,0),0,"ground-floor player remains below the deck");
assert.equal(layout.crossesOpeningRail(-8.7,-8.3,0,layout.UPPER_Y,layout.UPPER_Y),true);
assert.equal(layout.crossesOpeningRail(-8.7,-8.3,-10.1,layout.UPPER_Y,layout.UPPER_Y),false,"ramp top stays open");
assert.equal(layout.crossesRampSideRail(-10.5,0,-8.9,0,2,2),true,"ramp rails prevent side exits");
assert.equal(layout.crossesRampSideRail(-10.5,-10.3,-8.9,-10.4,layout.UPPER_Y,layout.UPPER_Y),false,"top landing remains open");
assert.equal(layout.crossesFrontOpeningRail(-10.5,11,-10.5,10,layout.UPPER_Y,2),true,"front landing rail prevents falls");
console.log("castle layout tests passed");
