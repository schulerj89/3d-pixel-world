// Keeps world movement yaw separate from an imported model's fixed forward-axis correction.
(function(global){
 const MODEL_FORWARD_CORRECTIONS=Object.freeze({
  "+z":0,
  "-z":Math.PI,
  "+x":-Math.PI/2,
  "-x":Math.PI/2
 });

 function correctionForModelForward(axis="+z"){
  const correction=MODEL_FORWARD_CORRECTIONS[String(axis).toLowerCase()];
  if(correction===undefined)throw new Error(`Unsupported character model forward axis: ${axis}`);
  return correction;
 }

 function yawFromMovement(worldX,worldZ){
  if(!Number.isFinite(worldX)||!Number.isFinite(worldZ))throw new TypeError("Movement components must be finite numbers");
  return Math.atan2(worldX,worldZ);
 }

 function faceMovement(root,worldX,worldZ,epsilon=.0001){
  if(!root?.rotation)throw new TypeError("A character root with a rotation is required");
  if(Math.hypot(worldX,worldZ)<=epsilon)return false;
  root.rotation.y=yawFromMovement(worldX,worldZ);
  return true;
 }

 function attachVisual(visual,modelForward="+z"){
  if(!visual?.rotation)throw new TypeError("A character visual with a rotation is required");
  const correction=correctionForModelForward(modelForward);
  // This is an absolute, one-time import correction, never an accumulated turn.
  visual.rotation.y=correction;
  visual.userData=visual.userData||{};
  visual.userData.modelForwardAxis=modelForward;
  visual.userData.modelForwardCorrection=correction;
  return correction;
 }

 const api=Object.freeze({
  MODEL_FORWARD_CORRECTIONS,
  STYLOO_MODEL_FORWARD_AXIS:"+z",
  STYLOO_MODEL_FORWARD_CORRECTION:0,
  correctionForModelForward,
  yawFromMovement,
  faceMovement,
  attachVisual
 });
 global.characterFacing=api;
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
