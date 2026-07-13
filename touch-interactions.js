(function preventGameTouchSelection(){
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
