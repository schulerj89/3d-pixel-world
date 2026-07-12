// Reusable attachment slots for voxel characters. Wearables parented to a slot
// inherit that body part's animation without the animation loop knowing about
// individual costumes.
(function(global){
 class ThreeCharacterAttachmentRig{
  constructor(parts){
   this.slots={};
   Object.entries(parts).forEach(([name,part])=>{
    if(!part)return;
    const slot=new THREE.Group();
    slot.name=`attachment-${name}`;
    part.add(slot);
    this.slots[name]=slot;
   });
  }
  attach(slotName,object,position=[0,0,0],rotation=[0,0,0]){
   const slot=this.slots[slotName];
   if(!slot)throw new Error(`Unknown character attachment slot: ${slotName}`);
   object.position.set(...position);
   object.rotation.set(...rotation);
   slot.add(object);
   return object;
  }
 }
 global.ThreeCharacterAttachmentRig=ThreeCharacterAttachmentRig;
})(window);
