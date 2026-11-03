// Presentation only: counts and damage come unchanged from previewVolley/dealHit.
export const WEAPON_EFFECTS=Object.freeze({
 W01:Object.freeze({profile:'pulse',color:'#bcefff',durationMs:680,cadenceMs:30,burstMs:480,width:25,height:18,sound:'sine',hz:280,endHz:110}),
 W02:Object.freeze({profile:'laser',color:'#ff4563',durationMs:560,cadenceMs:48,burstMs:720,width:28,height:8,sound:'sine',hz:980,endHz:260}),
 W03:Object.freeze({profile:'prism',color:'#5ae9ff',durationMs:760,cadenceMs:44,burstMs:500,width:29,height:24,sound:'triangle',hz:720,endHz:420}),
 W04:Object.freeze({profile:'dart',color:'#62ffa4',durationMs:460,cadenceMs:18,burstMs:560,width:27,height:9,sound:'square',hz:145,endHz:65}),
 W05:Object.freeze({profile:'arc',color:'#ba7aff',durationMs:720,cadenceMs:46,burstMs:700,width:32,height:22,sound:'triangle',hz:440,endHz:140}),
 W06:Object.freeze({profile:'needle',color:'#e0adff',durationMs:440,cadenceMs:22,burstMs:360,width:39,height:7,sound:'triangle',hz:1200,endHz:480}),
 W07:Object.freeze({profile:'capsule',color:'#ff7351',durationMs:700,cadenceMs:58,burstMs:580,width:27,height:16,sound:'sawtooth',hz:105,endHz:38})
});
export function weaponEffect(weaponId){return WEAPON_EFFECTS[weaponId]||WEAPON_EFFECTS.W01;}

export function planWeaponSalvos(volleys=[]){
 return volleys.filter(s=>Number.isSafeInteger(Number(s?.bullets))&&Number(s.bullets)>0).map((shot,salvoIndex)=>{
  const fx=weaponEffect(shot.weaponId),count=Math.floor(Number(shot.bullets));
  const raw=i=>i*fx.cadenceMs+(shot.weaponId==='W04'?Math.floor(i/3)*38:0);
  const span=raw(count-1),compression=span>fx.burstMs?fx.burstMs/span:1,startMs=salvoIndex*80;
  const rounds=Array.from({length:count},(_,i)=>{
   const launchMs=startMs+Math.round(raw(i)*compression);
   const bend=shot.weaponId==='W05'?(i%2?-1:1)*(22+i%3*8):shot.weaponId==='W06'?(count===1?0:(i/(count-1)-.5)*36):0;
   return {index:i,launchMs,arrivalMs:launchMs+fx.durationMs,bend};
  });
  return {shot,fx,rounds,startMs,lastLaunchMs:rounds.at(-1).launchMs,arrivalMs:rounds.at(-1).arrivalMs};
 });
}

export function volleyTimeline(volleys){
 const salvos=planWeaponSalvos(volleys);
 if(!salvos.length)return {arrivalMs:0,settleMs:550};
 const arrivalMs=Math.max(...salvos.map(s=>s.arrivalMs));
 return {arrivalMs,settleMs:arrivalMs+650};
}

// Leave visible space between pulsed laser segments, even at maximum ammo.
export function projectileWidth(salvo,distance){
 if(salvo.shot.weaponId!=='W02'||salvo.rounds.length<2)return salvo.fx.width;
 const gap=Math.min(...salvo.rounds.slice(1).map((r,i)=>r.launchMs-salvo.rounds[i].launchMs));
 return Math.min(salvo.fx.width,distance/salvo.fx.durationMs*gap*.55);
}

// A quadratic offset bends the middle of a shot, never its muzzle or target.
// Rotation follows its tangent, including when the enemy fires downwards.
export function projectileFrame(dx,dy,bend,t){
 const length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
 const offset=2*(1-t)*t*bend,tangent=2*(1-2*t)*bend;
 return {x:dx*t+nx*offset,y:dy*t+ny*offset,angle:Math.atan2(dy+ny*tangent,dx+nx*tangent)*180/Math.PI};
}
