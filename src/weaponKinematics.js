import {Vector3} from 'three';
import {boardPointToWorld} from './maglioProjectile3D.js';
import {approvedWeaponSalvo} from './fleetNext/approvedWeaponSalvos.js';
import {weaponTravelProgress,clamp01} from './weaponCinematicStyle.js';

function seedOf(shot){
 let n=2166136261;
 for(const c of `${shot.cardId}:${shot.launchPly??shot.grapplePly??shot.ply??0}:${shot.machineSlot||0}:${shot.jawRole?1:shot.stage||1}`)
  n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;
 return n;
}
export function weaponLaunchOrigin(shot){
 if(!['A','B'].includes(shot?.who))return null;
 // Ogni colpo iniziale varia lungo l'intero bordo del proprio lato.
 const seed=seedOf(shot),anchor=shot.cardId.includes('ganasce-magnetiche');
 const index=anchor?(shot.impactIndex||0):(shot.salvoIndex??shot.impactIndex??0);
 const port=anchor?(shot.impactIndex||0)===0?0:4:(index*2+(seed%5))%5;
 const x=26+((seed+index*163)%398);
 const y=812;
 return {x:shot.who==='A'?x:450-x,y:shot.who==='A'?y:800-y,
  edge:shot.who==='A'?'player-launch-band':'opponent-launch-band',port};
}
export function weaponContactPoint(base,shot){
 if((shot.salvoCount||1)<=1)return base;
 const index=shot.salvoIndex||0,count=shot.salvoCount,angle=index*2.399963,
  radius=Math.min(10,(base.radius||22)*.31)*(shot.finisher?.2:.6+.4*index/Math.max(1,count-1));
 return {...base,x:base.x+Math.cos(angle)*radius,y:base.y+Math.sin(angle)*radius*.65};
}
function curvePosition(from,to,shot,t,camera,kind){
 const u=weaponTravelProgress(kind,t),a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera);
 const axis=b.clone().sub(a).normalize(),side=new Vector3(axis.z,0,-axis.x),length=a.distanceTo(b);
 const style=shot.salvoStyle||approvedWeaponSalvo(shot.cardId)?.style||'piston';
 const i=shot.salvoIndex??shot.impactIndex??0,count=shot.salvoCount||1,phase=i*Math.PI*2/Math.max(2,count),env=Math.sin(Math.PI*u);
 const radius=Math.min(2.2,length*.16),p=boardPointToWorld({x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u},camera);
 let spread=0,height=0;
 if(/orbit|gravity-storm/.test(style)){
  const turns=style==='gravity-storm'?1.25:style==='double-orbit'?1:.65,angle=phase+u*Math.PI*2*turns;
  spread=Math.cos(angle)*radius*env;height=(.5+.5*Math.sin(angle))*radius*.60*env;
 }else if(/thermal|plasma/.test(style)){
  spread=Math.cos(phase+u*(style==='plasma-spiral'?Math.PI*2:0))*radius*.50*env;
  height=Math.min(2.6,length*.22)*env;
 }else if(/blade/.test(style)){
  spread=(i%2?1:-1)*radius*.70*env;height=(.10+i%3*.09)*env;
 }else if(/drill/.test(style)){
  spread=Math.cos(phase+u*Math.PI*4)*Math.min(.42,radius)*env;
  height=(.24+Math.sin(phase+u*Math.PI*4)*.17)*env;
 }else if(/anchor|jaws/.test(style)){
  spread=((shot.impactIndex||0)%2?1:-1)*radius*.7*env;
  height=(style==='whip-anchors'?.8:.35)*env;
 }else if(/crossfire|battery|fan|six|storm/.test(style)){
  spread=(i%2?1:-1)*radius*.30*env;height=(i%3)*.14*env;
 }
 p.addScaledVector(side,spread);p.y+=height;
 return p;
}
// Position, tangent, orientation and nose use ONE curve in every renderer.
// Rotating the projectile around its own axis cannot move its nose off target.
export function weaponFlightFrame(from,to,progress,camera,frontZ,{shot={},kind='legacy-pulse'}={}){
 const t=clamp01(progress),nose=curvePosition(from,to,shot,t,camera,kind),h=.00015;
 const direction=curvePosition(from,to,shot,Math.min(1,t+h),camera,kind)
  .sub(curvePosition(from,to,shot,Math.max(0,t-h),camera,kind)).normalize();
 const center=nose.clone().addScaledVector(direction,frontZ),yaw=Math.atan2(-direction.x,-direction.z),pitch=Math.asin(Math.max(-1,Math.min(1,direction.y)));
 const i=shot.salvoIndex??shot.impactIndex??0,spin=kind==='induction'?t*Math.PI*5+i:
  kind==='wandering-shrapnel'?t*Math.PI*4+i*.9:kind==='cascade-piercer'?t*Math.PI*2+i*2.1:
   kind==='magnetic-grapple'?Math.sin(t*Math.PI*2)*.42:kind==='thermal-reclaimer'?Math.sin(t*8+i)*.25:0;
 return {nose,center,direction,yaw,pitch,roll:spin,
  visibleEnd:direction.dot(camera.position.clone().sub(center))>0?'front':'rear'};
}
export function applyWeaponFlightPose(model,pose){
 model.position.copy(pose.center);model.rotation.set(pose.pitch,pose.yaw,pose.roll,'YXZ');
}
