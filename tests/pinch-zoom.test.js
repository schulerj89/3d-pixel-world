const assert=require("assert");
const fs=require("fs");
const path=require("path");
const {createPinchZoomController}=require("../touch-interactions.js");

function close(actual,expected,message){
  assert(Math.abs(actual-expected)<1e-10,`${message}: expected ${expected}, received ${actual}`);
}

const zoom=createPinchZoomController();
zoom.begin(200,25.2,"city");
close(zoom.update(200),25.2,"the first stationary move must not clamp a large-world camera");
close(zoom.update(100),12.6,"bringing fingers together must move the camera closer");
close(zoom.update(300),37.8,"spreading fingers must move the camera farther away");
close(zoom.bounds().minimum,4.536,"zoom-in bound allows a close view in large worlds");
close(zoom.bounds().maximum,56.7,"zoom-out bound is relative to the world's camera distance");

zoom.end();
assert.strictEqual(zoom.update(250),null,"moves after touchend must not mutate zoom");

zoom.begin(160,37.8,"city");
close(zoom.bounds().minimum,4.536,"a continued gesture must retain the original world's bounds");
close(zoom.update(80),18.9,"a new gesture must scale from its own starting distance");

zoom.end();
zoom.begin(100,9,"house:interior");
close(zoom.bounds().minimum,1.8,"programmatic world changes must reset to the close absolute bound");
close(zoom.bounds().maximum,20.25,"small worlds must keep a useful local zoom range");
close(zoom.update(1),1.8,"zoom-in must clamp at the close absolute minimum");
close(zoom.update(1000),20.25,"zoom-out must clamp at the world-relative maximum");

zoom.end();
const equalDistanceWorldChange=createPinchZoomController();
equalDistanceWorldChange.begin(100,15.5,"beach");
close(equalDistanceWorldChange.update(141.93548387096774),22,"the first world can finish at another world's default distance");
equalDistanceWorldChange.end();
equalDistanceWorldChange.begin(100,22,"space");
close(equalDistanceWorldChange.bounds().minimum,3.96,"an explicit world change must rebase even when camera distances happen to match");
close(equalDistanceWorldChange.bounds().maximum,49.5,"the new world must receive its own zoom-out range");

const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const camera=fs.readFileSync(path.join(root,"bakery-system.js"),"utf8");
assert(html.indexOf('src="touch-interactions.js')<html.indexOf('src="bakery-system.js'),"gesture controller must load before camera controls");
assert(camera.includes('if(e.pointerType!=="touch")gameArea.setPointerCapture'),"touch pointers must not be captured before a pinch starts");
assert(camera.includes("pinchZoom.begin(touchDistance(e.touches),cameraDistance,cameraContext())"),"pinch must snapshot touch distance, camera distance, and world context");
assert(camera.includes("cameraDistance=pinchZoom.update(touchDistance(e.touches))"),"pinch updates must use proportional controller output");

console.log("pinch zoom: proportional, directionally correct, world-relative, and touch-capture safe");
