const assert=require("assert");
const fs=require("fs");
const path=require("path");
const root=path.resolve(__dirname,"..");
const {parse}=require(path.join(root,"house-layout.js"));

const source=`
; My House unit-grid integration fixture (the authoritative file is supplied by HouseSpaceSpec)
name: My House
size: 24x20
cell: 1
origin: -12,-12.5
wall-thickness: 0.25
wall-height: 5
minimum-clearance: 1
primary-clearance: 2
appliance-aisle: 2
entrance-width: 4
room: kitchen,1,1,10,8
room: bedroom,12,1,11,8
room: living,1,10,14,9
room: dining,16,10,7,5
room: entry,16,16,7,3
fixture: refrigerator,F,kitchen,2,1,north
map:
########################
#.F........#...........#
#..........#...........#
#..........#...........#
#..........#...........#
#..........#...........#
#..........#...........#
#..........#...........#
#..........#...........#
####DDDD########DDDD####
#..............#.......#
#..............D.......#
#..............D.......#
#..............D.......#
#..............#.......#
#..............#########
#......................#
#......................#
#......................#
##########EEEE##########`;
const layout=parse(source);

assert.strictEqual(layout.source,"house-main-level.txt","runtime must identify the shared authoritative level file");
assert.strictEqual(layout.gridCell,1,"one map cell must equal one world unit");
assert.deepStrictEqual(layout.spacings,{tight:1,doorway:2,aisle:2},"layout must preserve audited one-unit and two-unit spacing");
assert.deepStrictEqual([layout.width,layout.depth],[24,20],"revamped house must be 24x20 units");
for(const required of["living","kitchen","bedroom","dining","entry"])assert(layout.rooms.some(room=>room.id===required),`missing sectioned room: ${required}`);

assert.deepStrictEqual(layout.openings.filter(opening=>opening.symbol==="D").map(opening=>opening.width).sort(),[3,4,4],"interior entries must reserve three or four units");
assert(layout.openings.some(opening=>opening.symbol==="D"&&opening.orientation==="V"&&opening.width===3),"vertical room entry must preserve its authored orientation");
assert(layout.openings.some(opening=>opening.symbol==="E"&&opening.width===4),"map must expose the enclosed four-unit exterior entrance");
assert(layout.walls.every(wall=>wall.type==="line"&&wall.thickness===.25),"walls must render as thin line segments instead of overlapping one-unit boxes");

for(const sample of[
 {x:-6,z:-6.5,room:"kitchen"},{x:6,z:-6.5,room:"bedroom"},{x:-5,z:2.5,room:"living"},
 {x:7,z:-.5,room:"dining"},{x:7,z:4.5,room:"entry"},{x:0,z:5.5,room:"living"}
]){
 assert.strictEqual(layout.roomAt(sample.x,sample.z),sample.room,`${sample.room} sample must resolve to its section`);
 assert(layout.canWalk(sample.x,sample.z,0.28),`${sample.room} sample must be walkable`);
}
assert(!layout.canWalk(-11.5,-12,0.28),"solid perimeter cell must block walking");
assert(!layout.canWalk(-11.5,-3,0.28),"solid room divider must block walking");
assert(layout.canWalk(-6.5,-3,0.28),"four-unit kitchen entry must be walkable");
assert(layout.canWalk(3.5,0,0.28),"three-unit living/dining entry must be walkable");
assert(layout.canWalk(0,7,0.28),"exterior E entrance approach must be walkable");
assert(!layout.canWalk(0,7.3,0.28),"bounds must keep the player inside until the entrance action runs");

assert.throws(()=>parse(source.replace("cell: 1","cell: 2")),/one-unit grid/,"non-unit grids must be rejected");
assert.throws(()=>parse(source.replace("minimum-clearance: 1","minimum-clearance: 2")),/1-unit and 2-unit/,"spacing contract changes must be rejected");
assert.throws(()=>parse(source.replace("#......................#","........................")),/perimeter/,"open exterior side walls must be rejected");

const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const system=fs.readFileSync(path.join(root,"house-system.js"),"utf8");
assert(html.indexOf("house-layout.js")<html.indexOf("house-system.js"),"layout adapter must load before the house runtime");
assert(system.includes('HouseLayout?.load("house-main-level.txt")'),"runtime must consume the authoritative shared text level");
assert(system.includes("activeHouseLayout.canWalk"),"house movement must use map-cell-aware collision");
assert(system.includes("window.getHouseLayoutDebug"),"browser QA must expose layout, spacing, room, shell, and walkability metadata");

console.log("house layout adapter: 24x20 one-unit map, five sections, 3/4-unit entries, enclosure, collision, and QA metadata validated");
