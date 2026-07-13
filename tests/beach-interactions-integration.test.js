const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),read=file=>fs.readFileSync(path.join(root,file),"utf8");
const house=read("house-system.js"),game=read("game.js"),beach=read("beach-world.js"),questCss=read("coin-quest-system.css");

assert.match(house,/id:"beach-token-dash",title:"Boardwalk Token Dash",count:6,timeLimitSeconds:35,reward:20/,"Beach activity must pay exactly $20");
assert.match(house,/window\.CoinQuestSystem\.createCoinQuestSystem/,"Beach must reuse the portable collectible quest system");
assert.match(house,/createSpaceConversationCamera\(\)/,"Beach must reuse the proven conversation camera adapter");
assert.match(house,/window\.createConversationSystem/,"Beach must reuse the shared textbox conversation system");
assert.match(house,/pendingQuestStart="start"/,"Token timer waits for the conversation camera to restore");
assert.match(house,/event\.detail\?\.phase==="complete"/,"Token dash starts only after the textbox closes");
assert.match(house,/onReward:value=>window\.gameEconomy\.add\(value,"beach-token-dash"\)/,"Reward must flow through the shared economy");
assert.match(house,/world\.findNpc\?\.\("marina"\)/,"Marina must be the beach quest giver");
assert.match(house,/dataset\.beachQuestPhase/);assert.match(house,/dataset\.beachQuestTokens/);
assert.match(game,/window\.updateBeachInteractions\?\.\(dt,currentPlace==="beach"\)/,"Beach interaction runtime must update from the game loop");
assert.match(game,/window\.destroyBeachInteractionRuntime\?\.\(\)/,"Beach interaction runtime must be released with its world");
assert.match(game,/beachInteractions:window\.beachInteractionRuntime\?\.debug\?\.\(\)\|\|null/,"Global diagnostics must expose the beach game");
assert.match(beach,/findNpc:id=>npcById\.get\(id\)\|\|null/,"Beach must expose stable NPC lookup for portable interactions");
assert.match(questCss,/\.coin-quest-hud\[hidden\]\{display:none\}/,"Shared quest HUD must remain hidden until a mission starts");

const positionBlock=house.match(/const BEACH_TOKEN_POSITIONS=Object\.freeze\(\[([\s\S]*?)\n\]\);/);
assert(positionBlock,"Beach token positions must be declared");
const positions=[...positionBlock[1].matchAll(/x:([\-\d]+),y:0,z:([\-\d]+)/g)].map(match=>[Number(match[1]),Number(match[2])]);
assert.equal(positions.length,6);assert.equal(new Set(positions.map(position=>position.join(","))).size,6,"All beach token positions must be unique");
assert(positions.every(([x,z])=>Math.abs(x)<20&&z>-1&&z<20),"Token dash stays readable on the open sand");

console.log("beach interactions: shared camera/textbox quest, six unique tokens, and $20 economy reward validated");
