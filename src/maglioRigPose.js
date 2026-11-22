// Cinematica di presentazione: la base non fa parte degli snodi animati.
export const MAGLIO_REST_PITCH=8*Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a),0,1);return x*x*(3-2*x);};
export const maglioRestYaw=side=>side==='enemy'?Math.PI:0;
export const shortestAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
export function solveMaglioAim(side,target,pivot){
 const rest=maglioRestYaw(side),dx=target.x-pivot.x,dy=target.y-pivot.y,dz=target.z-pivot.z;
 const distance=Math.hypot(dx,dz);
 if(distance<1e-6)return {yaw:rest,pitch:MAGLIO_REST_PITCH};
 const yaw=rest+clamp(shortestAngle(Math.atan2(-dx,-dz)-rest),-1.25,1.25);
 return {yaw,pitch:clamp(Math.atan2(dy,distance),-8*Math.PI/180,23*Math.PI/180)};
}
export function maglioRigPose({side,ageMs=0,aim,fires=false,reducedMotion=false}){
 const rest=maglioRestYaw(side),idle={yaw:rest,pitch:MAGLIO_REST_PITCH,recoil:0,charge:0};
 if(!fires||ageMs<0||ageMs>=2200)return idle;
 const target=aim||idle;
 if(reducedMotion)return {...idle,...(ageMs<1750?{yaw:target.yaw,pitch:target.pitch}:{})};
 const turn=smooth(180,690,ageMs)*(1-smooth(1280,1840,ageMs));
 const recoil=ageMs<810||ageMs>1160?0:.19*Math.sin(Math.PI*(ageMs-810)/350);
 const charge=smooth(310,705,ageMs)*(1-smooth(790,990,ageMs));
 return {yaw:rest+shortestAngle(target.yaw-rest)*turn,
  pitch:MAGLIO_REST_PITCH+(target.pitch-MAGLIO_REST_PITCH)*turn,recoil,charge};
}
