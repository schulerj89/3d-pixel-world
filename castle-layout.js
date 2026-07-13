(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CastleLayout=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 const UPPER_Y=4.35;
 function isRamp(x,z){return x>-12.35&&x<-8.85&&z>-10.15&&z<10.15}
 function isUpperFloor(x,z){
  if(x<=-12.95||x>=12.95||z<=-12.9||z>=12.9)return false;
  return !(x>-12.95&&x<-8.05&&z>-10.2&&z<10.3);
 }
 function elevationAt(x,z,currentY=0){
  if(isRamp(x,z))return Math.max(0,Math.min(UPPER_Y,(10-z)/20*UPPER_Y));
  return currentY>2.25&&isUpperFloor(x,z)?UPPER_Y:0;
 }
 function crossesOpeningRail(previousX,x,z,previousY,nextY){
  if(previousY<=2.25&&nextY<=2.25||z<=-9.95||z>=10.35)return false;
  return previousX<=-8.5&&x>-8.5||previousX>=-8.5&&x<-8.5;
 }
 function crossesRampSideRail(previousX,previousZ,x,z,previousY,nextY){
  if(previousZ<=-10.15&&z<=-10.15||previousZ>=10.15&&z>=10.15)return false;
  if(previousY<.15&&nextY<.15&&!isRamp(previousX,previousZ)&&!isRamp(x,z))return false;
  const crosses=line=>previousX<=line&&x>line||previousX>=line&&x<line;
  return crosses(-12.1)||crosses(-9.1);
 }
 function crossesFrontOpeningRail(previousX,previousZ,x,z,previousY,nextY){
  if(previousY<=2.25&&nextY<=2.25)return false;
  const inOpeningWidth=(previousX>-12.75&&previousX<-8.05)||(x>-12.75&&x<-8.05);
  return inOpeningWidth&&(previousZ<=10.25&&z>10.25||previousZ>=10.25&&z<10.25);
 }
 return {UPPER_Y,isRamp,isUpperFloor,elevationAt,crossesOpeningRail,crossesRampSideRail,crossesFrontOpeningRail};
});
