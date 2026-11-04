// Presentation only: counts and damage come unchanged from previewVolley/dealHit.
export const WEAPON_EFFECTS=Object.freeze({
 W01:Object.freeze({profile:'pulse',color:'#bcefff',durationMs:680,cadenceMs:30,burstMs:480,width:25,height:18,sound:'sine',hz:280,endHz:110}),
 W02:Object.freeze({profile:'laser',color:'#ff4563',durationMs:560,cadenceMs:48,burstMs:720,width:28,height:8,sound:'sine',hz:980,endHz:260}),
 W03:Object.freeze({profile:'prism',color:'#5ae9ff',durationMs:760,cadenceMs:44,burstMs:500,width:29,height:24,sound:'triangle',hz:720,endHz:420}),
 W04:Object.freeze({profile:'dart',color:'#62ffa4',durationMs:460,cadenceMs:18,burstMs:560,width:27,height:9,sound:'square',hz:145,endHz:65}),
 W05:Object.freeze({profile:'arc',color:'#ba7aff',durationMs:720,cadenceMs:46,burstMs:700,width:32,height:22,sound:'triangle',hz:440,endHz:140}),
 W06:Object.freeze({profile:'needle',color:'#e0adff',durationMs:440,cadenceMs:22,burstMs:360,width:39,height:7,sound:'triangle',hz:1200,endHz:480}),
 W07:Object.freeze({profile:'capsule',color:'#ff7351',durationMs:700,cadenceMs:58,burstMs:580,width:27,height:16,sound:'sawtooth',hz:105,endHz:38}),
 W08:Object.freeze({profile:'twin',color:'#ff365d',durationMs:540,cadenceMs:54,burstMs:700,width:30,height:9,sound:'square',hz:620,endHz:210}),
 W09:Object.freeze({profile:'diamond',color:'#69dfff',durationMs:790,cadenceMs:42,burstMs:500,width:35,height:27,sound:'triangle',hz:640,endHz:310}),
 W10:Object.freeze({profile:'ion',color:'#76ffb0',durationMs:480,cadenceMs:34,burstMs:540,width:43,height:23,sound:'sawtooth',hz:380,endHz:120}),
 W11:Object.freeze({profile:'cross-ion',color:'#ce8cff',durationMs:570,cadenceMs:46,burstMs:600,width:44,height:29,sound:'sawtooth',hz:520,endHz:175}),
 W12:Object.freeze({profile:'photon',color:'#ff9c99',durationMs:620,cadenceMs:40,burstMs:600,width:23,height:21,sound:'sine',hz:820,endHz:460}),
 W13:Object.freeze({profile:'facet',color:'#ffdc78',durationMs:650,cadenceMs:36,burstMs:600,width:29,height:23,sound:'triangle',hz:930,endHz:540}),
 W14:Object.freeze({profile:'shadow',color:'#b77aff',durationMs:810,cadenceMs:44,burstMs:520,width:34,height:31,sound:'sine',hz:95,endHz:42}),
 W15:Object.freeze({profile:'lance',color:'#d9f0ff',durationMs:500,cadenceMs:50,burstMs:650,width:47,height:12,sound:'triangle',hz:240,endHz:75}),
 W16:Object.freeze({profile:'orbit',color:'#90ffc0',durationMs:830,cadenceMs:40,burstMs:560,width:36,height:32,sound:'sine',hz:120,endHz:34})
});
export function weaponEffect(weaponId){return WEAPON_EFFECTS[weaponId]||WEAPON_EFFECTS.W01;}

export function planWeaponSalvos(volleys=[]){
 return volleys.filter(s=>Number.isSafeInteger(Number(s?.bullets))&&Number(s.bullets)>0).map((shot,salvoIndex)=>{
  const fx=weaponEffect(shot.weaponId),count=Math.floor(Number(shot.bullets));
  const raw=i=>i*fx.cadenceMs+(shot.weaponId==='W04'?Math.floor(i/3)*38:0);
  const span=raw(count-1),compression=span>fx.burstMs?fx.burstMs/span:1,startMs=salvoIndex*80;
  const rounds=Array.from({length:count},(_,i)=>{
   const launchMs=startMs+Math.round(raw(i)*compression);
   const bend=shot.weaponId==='W05'?(i%2?-1:1)*(22+i%3*8):shot.weaponId==='W06'?(count===1?0:(i/(count-1)-.5)*36):['W11','W13','W14'].includes(shot.weaponId)?(i%2?-1:1)*16:0;
   return {index:i,launchMs,arrivalMs:launchMs+fx.durationMs,bend,muzzleIndex:shot.weaponId==='W08'?i%2:0};
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
 if(!['W02','W08'].includes(salvo.shot.weaponId)||salvo.rounds.length<2)return salvo.fx.width;
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
