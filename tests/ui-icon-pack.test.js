const assert=require("assert");
const fs=require("fs");
const path=require("path");

const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const html=read("index.html"),game=read("game.js"),css=read("styles.css");
const iconRoot=path.join(root,"assets","ui","gvesster");

for(const name of ["coin.png","house.png","planet.png","rocket.png","shopping-bag.png"]){
 const file=path.join(iconRoot,name),buffer=fs.readFileSync(file);
 assert.strictEqual(buffer.toString("hex",0,8),"89504e470d0a1a0a",`${name} must be a valid PNG`);
 assert(html.includes(`${name}?v=__BUILD_VERSION__`)||game.includes(`${name}?v=__BUILD_VERSION__`),`${name} must be used with cache busting`);
}

assert(html.includes('id="moneyValue"'),"currency HUD must preserve a stable text update target");
assert(game.includes('getElementById("moneyValue").textContent'),"money updates must not remove the coin icon");
assert(/id="goHouse"[^>]*><img[^>]+house\.png/.test(html),"realm picker must use the house icon");
assert(/id="goSpace"[^>]*><img[^>]+rocket\.png/.test(html),"realm picker must use the space icon");
assert(css.includes(".gameIcon")&&css.includes(".realmIcon"),"icon sizing must be centralized and responsive");
assert(fs.existsSync(path.join(iconRoot,"LICENSE.txt"))&&fs.existsSync(path.join(iconRoot,"SOURCE.md")),"third-party terms and provenance must ship with the icons");

console.log("gvesster UI icons: assets, attribution, cache busting, and stable money updates validated");
