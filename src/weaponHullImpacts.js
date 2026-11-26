// A hit is an action on a real hull, not just camera shake. These profiles
// describe contact only; HP, targets, salvo counts and timings stay in combat.
import {clamp01,weaponHullFrame} from './weaponCinematicStyle.js';

const contacts=Object.freeze({
 'ionic-comb':{kind:'electric-grid',radius:.85,sparks:14,smoke:false},
 'ionic-dart':{kind:'helix-discharge',radius:.85,sparks:14,smoke:false},
 'ionic-whip':{kind:'electric-snap',radius:.85,sparks:14,smoke:false},
 'ionic-flash':{kind:'white-discharge',radius:.8,sparks:14,smoke:false},
 'gravity-maul':{kind:'compression-detonation',radius:1.13,sparks:18,smoke:true},
 'steel-rail':{kind:'armor-punch',radius:.85,sparks:17,smoke:false},
 'thermal-reclaimer':{kind:'plasma-bloom',radius:1.17,sparks:13,smoke:true},
 'magnetic-grapple':{kind:'jaw-bite',radius:.73,sparks:14,smoke:false},
 induction:{kind:'induction-rupture',radius:.96,sparks:15,smoke:false},
 'cascade-piercer':{kind:'drill-breach',radius:.84,sparks:17,smoke:true},
 'wandering-shrapnel':{kind:'fragmentation-burst',radius:1.04,sparks:20,smoke:true}
});
export function weaponHullImpactProfile(profile,shot){
 const material=contacts[profile?.kind];
 if(!profile?.approved||!material||!shot?.fires||shot.defenseBlocked)return null;
 const intermediate=(shot.salvoCount||1)>1&&!shot.salvoLast;
 // A real round can receive zero HP from exact integer salvo allocation.
 // It makes a small armor ping, never a fireball or a fictitious hull wound.
 const damaging=shot.actualDamage>0;
 return {...material,tier:profile.tier,damaging,intermediate,
  radius:material.radius*(intermediate?.72:1)*(shot.finisher?1.12:1)*(damaging?1:.40),
  sparks:damaging?(intermediate?8:material.sparks+profile.tier*3):4,
  smoke:material.smoke&&damaging,
  durationMs:profile.impactMs,
  flashMs:profile.kind==='gravity-maul'?95:profile.kind==='thermal-reclaimer'?165:80,
  version:4};
}
// Live ship motion and the contact canvas consume the same pose, including
// the smaller intermediate salvo kicks. Passing light cannot erase a recoil.
export function weaponImpactHullFrame(profile,shot,age,{reduced=false}={}){
 const pose=weaponHullFrame(profile.kind,age,profile.impactMs,{tier:profile.tier,
  direction:shot.who==='A'?-1:1,reduced,blocked:!!shot.defenseBlocked||!shot.fires});
 if((shot.salvoCount||1)>1&&!shot.salvoLast){
  for(const k of ['x','y','roll','pitch','lift','thrust'])pose[k]*=.5;
  pose.light*=.7;
 }
 if(shot.fires&&shot.actualDamage<=0){
  for(const k of ['x','y','roll','pitch','lift','thrust'])pose[k]=0;
  pose.light*=.3;
 }
 return pose;
}
export function weaponHullContactPoint(point,pose){
 return {...point,x:point.x+pose.x,y:point.y+pose.y+pose.lift};
}
// Readable local explosions. Size follows the measured ship, not the screen
// or the amount of HP; a stronger rarity never hides the entire fleet.
export function weaponHullImpactRadius(point,contact){
 const hull=Math.max(17,Math.min(38,Number(point.radius)||25));
 return Math.min(52,hull*contact.radius*(1+contact.tier*.045));
}
export const hullImpactEnvelope=(age,duration)=>age<0||age>=duration?0:
 Math.min(1,age/12+.25)*(1-clamp01(age/duration))**1.25;
