const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const game=fs.readFileSync(path.join(root,"game.js"),"utf8");
const house=fs.readFileSync(path.join(root,"house-system.js"),"utf8");
const generator=fs.readFileSync(path.join(root,"scripts","generate-elevenlabs-space-audio.ps1"),"utf8");
const music=path.join(root,"assets","audio","space-starlight-stroll.mp3");
const coin=path.join(root,"assets","audio","space-coin-chime.mp3");

assert(html.includes('id="spaceMusic" preload="metadata" src="assets/audio/space-starlight-stroll.mp3?v=__BUILD_VERSION__"'),"Space must load the new ElevenLabs track");
assert(!html.includes("cosmic-playground.mp3"),"the previous Space track must not remain wired");
assert(html.includes('id="spaceCoinSound" preload="metadata" src="assets/audio/space-coin-chime.mp3?v=__BUILD_VERSION__"'),"coin chime must be metadata-only until used");
assert(game.includes("window.playGameSoundEffect=(id,volume=.5)=>"),"sound effects use one reusable audio element");
assert(!game.includes("new Audio("),"sound playback must not allocate Audio objects per pickup");
assert(game.includes('audio:{music:window.getMusicDebug?.()||null,effects:window.getSoundEffectDebug?.()||null}'),"game QA hook must expose music and sound readiness");
assert(house.includes('window.playGameSoundEffect?.("spaceCoinSound",.68)'),"Space coin collection must trigger the chime");

for(const [label,file,min,max] of [["music",music,500*1024,1500*1024],["coin chime",coin,1024,50*1024]]){
 assert(fs.existsSync(file),`${label} asset is missing`);
 const bytes=fs.readFileSync(file);
 assert(bytes.length>=min&&bytes.length<=max,`${label} must stay inside its browser payload budget`);
 assert(bytes.subarray(0,3).toString("ascii")==="ID3"||(bytes[0]===0xff&&(bytes[1]&0xe0)===0xe0),`${label} must be an MP3`);
}

assert(generator.includes("$env:ELEVENLABS_API_KEY"),"generator must read its credential from the broker environment");
assert(!/xi-api-key\s*[=:]\s*[\"'][A-Za-z0-9_-]{10,}/i.test(generator),"generator must not contain a plaintext API key");
console.log("space audio tests passed");
