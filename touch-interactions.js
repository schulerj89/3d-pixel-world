(function(global){
  const DEFAULTS=Object.freeze({minScale:.18,maxScale:2.25,absoluteMin:1.8,absoluteMax:80});

  function positiveNumber(value,label){
    if(!Number.isFinite(value)||value<=0)throw new TypeError(`${label} must be a positive finite number`);
    return value;
  }

  function createPinchZoomController(options={}){
    const config={...DEFAULTS,...options};
    positiveNumber(config.minScale,"minScale");
    positiveNumber(config.maxScale,"maxScale");
    positiveNumber(config.absoluteMin,"absoluteMin");
    positiveNumber(config.absoluteMax,"absoluteMax");
    if(config.minScale>=config.maxScale)throw new RangeError("minScale must be less than maxScale");
    if(config.absoluteMin>=config.absoluteMax)throw new RangeError("absoluteMin must be less than absoluteMax");

    let active=false;
    let initialTouchDistance=0;
    let initialCameraDistance=0;
    let worldCameraDistance=null;
    let lastAppliedDistance=null;
    let worldContext;
    let hasWorldContext=false;

    function begin(touchDistance,cameraDistance,context){
      positiveNumber(touchDistance,"touchDistance");
      positiveNumber(cameraDistance,"cameraDistance");

      // A distance changed by world navigation is a new baseline. A distance
      // produced by the prior pinch keeps the same bounds across gestures.
      const contextChanged=hasWorldContext&&context!==worldContext;
      if(worldCameraDistance===null||lastAppliedDistance===null||contextChanged||Math.abs(cameraDistance-lastAppliedDistance)>.01){
        worldCameraDistance=cameraDistance;
      }
      worldContext=context;
      hasWorldContext=true;
      active=true;
      initialTouchDistance=touchDistance;
      initialCameraDistance=cameraDistance;
      lastAppliedDistance=cameraDistance;
      return cameraDistance;
    }

    function update(touchDistance){
      if(!active)return null;
      positiveNumber(touchDistance,"touchDistance");
      const minimum=Math.max(config.absoluteMin,worldCameraDistance*config.minScale);
      const maximum=Math.min(config.absoluteMax,worldCameraDistance*config.maxScale);
      // Use the complete gesture ratio. This is independent of screen density
      // and the number/frequency of touchmove events the browser emits.
      const next=initialCameraDistance*(touchDistance/initialTouchDistance);
      lastAppliedDistance=Math.max(minimum,Math.min(maximum,next));
      return lastAppliedDistance;
    }

    function end(){active=false}

    function bounds(){
      if(worldCameraDistance===null)return null;
      return {
        minimum:Math.max(config.absoluteMin,worldCameraDistance*config.minScale),
        maximum:Math.min(config.absoluteMax,worldCameraDistance*config.maxScale)
      };
    }

    return Object.freeze({begin,update,end,bounds,isActive:()=>active});
  }

  const api=Object.freeze({createPinchZoomController});
  global.gameCameraGestures=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);

(function preventGameTouchSelection(){
  if(typeof document==="undefined")return;
  const interactiveGameSurface=[
    "#game", "#pad", "#lookPad", "button", "label",
    "#hudDrawer", "#kitchenTools", "#roomTeleport", ".buildCatalogTray"
  ].join(",");
  const editable="input,textarea,select,[contenteditable='true']";

  // iOS Safari treats a rapid pair of taps as a text-selection gesture. Cancel
  // only that browser default; the buttons' normal click events still run.
  document.addEventListener("dblclick",event=>{
    if(event.target.closest(editable))return;
    if(event.target.closest(interactiveGameSurface))event.preventDefault();
  },{passive:false});
})();
