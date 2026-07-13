const assert=require("assert");
const Validator=require("../house-layout-validator.js");
const HouseSpaceSpec=require("../house-space-spec.js");

function plan(overrides={}){
 const map=[
  "########################",
  "#.F........#...........#",
  "#..........#.....B.....#",
  "#..........#...........#",
  "#..........#...........#",
  "#..........#...........#",
  "#..........#...........#",
  "#..........#...........#",
  "#..........#...........#",
  "####DDD##########DDD####",
  "#..............#.......#",
  "#..............D.......#",
  "#..............D...T...#",
  "#....S.........D.......#",
  "#..............#.......#",
  "#..............#########",
  "#......................#",
  "#......................#",
  "#......................#",
  "##########EEEE##########"
 ];
 return {
  width:24,depth:20,cell:1,entranceWidth:4,map,
  rooms:[{id:"kitchen",col:1,row:1,width:10,depth:8},{id:"bedroom",col:12,row:1,width:11,depth:8},{id:"living",col:1,row:10,width:14,depth:9},{id:"dining",col:16,row:10,width:7,depth:5},{id:"entry",col:16,row:16,width:7,depth:3}],
  fixtures:[{id:"refrigerator",symbol:"F",room:"kitchen",col:2,row:1,facing:"north"},{id:"double-bed",symbol:"B",room:"bedroom",col:17,row:2,facing:"free"},{id:"sofa",symbol:"S",room:"living",col:5,row:13,facing:"free"},{id:"dining-table",symbol:"T",room:"dining",col:19,row:12,facing:"free"}],
  ...overrides
 };
}
function replaceCell(level,col,row,symbol){const map=[...level.map];map[row]=map[row].slice(0,col)+symbol+map[row].slice(col+1);return {...level,map}}
function codes(level){return Validator.audit(level).issues.map(issue=>issue.code)}

const good=Validator.validate(plan());
assert(good.valid,"well-formed sectioned plan must pass");
assert.deepStrictEqual(good.metrics,{width:24,depth:20,rooms:5,doorRuns:4,reachableCells:362});
assert(HouseSpaceSpec.validatePlan(plan()).valid,"HouseSpaceSpec must expose the same CI/browser QA contract");

assert(codes(replaceCell(plan(),0,7,".")).includes("open-perimeter"),"a wall gap must fail enclosure QA");
assert(codes(replaceCell(plan(),0,0,"E")).includes("corner-seam"),"a door cannot replace a load-bearing exterior corner");
assert(codes(replaceCell(plan(),11,5,".")).includes("unmarked-wall-gap"),"a broken divider seam must be labeled as a valid doorway");

const narrow=plan({map:plan().map.map((row,index)=>index===9?"#####DD##########DD#####":row)});
assert(Validator.audit(narrow).issues.filter(issue=>issue.code==="door-width").length>=2,"one/two-unit doorways must fail the 3-4 unit entry contract");
const wide=plan({map:plan().map.map((row,index)=>index===9?"###DDDDD########DDDD####":row)});
assert(codes(wide).includes("door-width"),"five-unit openings must also fail the entry contract");

const doorSeam=replaceCell(replaceCell(plan(),3,9,"D"),2,9,".");
assert(codes(doorSeam).includes("door-seam"),"door runs must terminate against walls");
const doorBlock=replaceCell(replaceCell(plan(),4,8,"D"),5,8,"D");
assert(codes(doorBlock).includes("door-block"),"two-dimensional door overlaps must be rejected");

const unreachable=plan({map:plan().map.map((row,index)=>index===9?"########################":row)});
assert(codes(unreachable).includes("unreachable-room"),"rooms isolated from the entrance must fail reachability QA");
const missing=plan({rooms:plan().rooms.filter(room=>room.id!=="bedroom")});
assert(codes(missing).includes("missing-room"),"required section records must be present");
const overlap=plan({rooms:[...plan().rooms,{id:"office",col:2,row:2,width:3,depth:3}]});
assert(codes(overlap).includes("room-overlap"),"overlapping room rectangles must fail");

const duplicateFixture=plan({fixtures:[...plan().fixtures,{id:"lamp",symbol:"S",room:"living",col:5,row:13,facing:"free"}]});
assert(codes(duplicateFixture).includes("fixture-overlap"),"two saved anchors may not occupy one cell");
const badAnchor=replaceCell(plan(),2,1,"#");
assert(codes(badAnchor).includes("fixture-anchor"),"fixture records may not drift onto wall cells");
const blockedFridge=replaceCell(plan(),2,2,"#");
assert(codes(blockedFridge).includes("fixture-clearance"),"wall-facing fixtures need a clear approach cell");

assert.throws(()=>Validator.validate(narrow),error=>error instanceof Validator.HouseLayoutValidationError&&/door-width/.test(error.message),"validate must expose a CI-friendly aggregate error");
console.log("house layout validator: enclosure, seams, 3-4u entries, reachability, rooms, anchors, and clearance validated");
