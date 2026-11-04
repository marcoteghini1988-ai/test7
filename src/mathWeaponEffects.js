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
 W16:Object.freeze({profile:'orbit',color:'#90ffc0',durationMs:830,cadenceMs:40,burstMs:560,width:36,height:32,sound:'sine',hz:120,endHz:34}),
 W17:Object.freeze({profile:'corona',color:'#ff624f',durationMs:610,cadenceMs:49,burstMs:620,width:37,height:28,sound:'sawtooth',hz:450,endHz:180}),
 W18:Object.freeze({profile:'nucleus',color:'#74daff',durationMs:800,cadenceMs:46,burstMs:540,width:34,height:32,sound:'triangle',hz:570,endHz:300}),
 W19:Object.freeze({profile:'vector',color:'#87ff8d',durationMs:490,cadenceMs:43,burstMs:590,width:44,height:24,sound:'sawtooth',hz:630,endHz:170}),
 W20:Object.freeze({profile:'shuriken',color:'#d080ff',durationMs:590,cadenceMs:37,burstMs:610,width:29,height:26,sound:'triangle',hz:650,endHz:210}),
 W21:Object.freeze({profile:'comb',color:'#58ffab',durationMs:530,cadenceMs:44,burstMs:580,width:37,height:27,sound:'triangle',hz:310,endHz:95}),
 W22:Object.freeze({profile:'magnetic',color:'#ff547e',durationMs:480,cadenceMs:56,burstMs:690,width:43,height:10,sound:'square',hz:875,endHz:320}),
 W23:Object.freeze({profile:'talon',color:'#ff922d',durationMs:580,cadenceMs:45,burstMs:580,width:32,height:24,sound:'sawtooth',hz:280,endHz:125}),
 W24:Object.freeze({profile:'shock',color:'#ffd45c',durationMs:790,cadenceMs:48,burstMs:580,width:37,height:32,sound:'sine',hz:190,endHz:43}),
 W25:Object.freeze({profile:'rebirth',color:'#ce86ff',durationMs:680,cadenceMs:54,burstMs:670,width:43,height:27,sound:'triangle',hz:1040,endHz:185}),
 W26:Object.freeze({profile:'hex-chain',color:'#67ffad',durationMs:570,cadenceMs:41,burstMs:600,width:39,height:23,sound:'square',hz:225,endHz:100}),
 W27:Object.freeze({profile:'solar-crystal',color:'#ffdc75',durationMs:820,cadenceMs:51,burstMs:580,width:34,height:31,sound:'triangle',hz:810,endHz:465}),
 W28:Object.freeze({profile:'shadow-arrow',color:'#ad7dff',durationMs:450,cadenceMs:32,burstMs:560,width:39,height:12,sound:'triangle',hz:1160,endHz:260}),
 W29:Object.freeze({profile:'bipolar',color:'#ff789e',durationMs:500,cadenceMs:55,burstMs:650,width:43,height:15,sound:'sawtooth',hz:480,endHz:100}),
 W30:Object.freeze({profile:'royal',color:'#ff6747',durationMs:600,cadenceMs:43,burstMs:620,width:33,height:25,sound:'sine',hz:1050,endHz:560}),
 W31:Object.freeze({profile:'meteor',color:'#77ddff',durationMs:780,cadenceMs:47,burstMs:560,width:39,height:29,sound:'triangle',hz:335,endHz:118}),
 W32:Object.freeze({profile:'cyclone',color:'#71ff9a',durationMs:540,cadenceMs:41,burstMs:570,width:37,height:25,sound:'sawtooth',hz:580,endHz:205}),
 W33:Object.freeze({profile:'eclipse',color:'#c784ff',durationMs:570,cadenceMs:49,burstMs:820,width:42,height:19,sound:'sawtooth',hz:245,endHz:55}),
 W34:Object.freeze({profile:'gravity',color:'#b67cff',durationMs:510,cadenceMs:42,burstMs:625,width:36,height:24,sound:'triangle',hz:660,endHz:150}),
 W35:Object.freeze({profile:'fulcrum',color:'#5cffac',durationMs:780,cadenceMs:47,burstMs:570,width:36,height:30,sound:'sine',hz:425,endHz:65}),
 W36:Object.freeze({profile:'gemini',color:'#a3e8ff',durationMs:660,cadenceMs:45,burstMs:615,width:40,height:28,sound:'triangle',hz:780,endHz:205}),
 W37:Object.freeze({profile:'titan',color:'#ffad5f',durationMs:690,cadenceMs:54,burstMs:630,width:44,height:29,sound:'square',hz:145,endHz:42}),
 W38:Object.freeze({profile:'howitzer',color:'#bc91ea',durationMs:805,cadenceMs:47,burstMs:575,width:43,height:32,sound:'sine',hz:92,endHz:28}),
 W39:Object.freeze({profile:'crimson-star',color:'#ff5d8c',durationMs:610,cadenceMs:39,burstMs:610,width:37,height:26,sound:'sawtooth',hz:850,endHz:285}),
 W40:Object.freeze({profile:'starlight',color:'#ffd977',durationMs:560,cadenceMs:41,burstMs:590,width:36,height:23,sound:'triangle',hz:1350,endHz:520}),
 W41:Object.freeze({profile:'flora',color:'#75ff7c',durationMs:790,cadenceMs:45,burstMs:550,width:36,height:33,sound:'sine',hz:290,endHz:88}),
 W42:Object.freeze({profile:'void-ark',color:'#a993ff',durationMs:600,cadenceMs:46,burstMs:820,width:39,height:31,sound:'sawtooth',hz:185,endHz:38})
});
export function weaponEffect(weaponId){return WEAPON_EFFECTS[weaponId]||WEAPON_EFFECTS.W01;}

export function planWeaponSalvos(volleys=[]){
 return volleys.filter(s=>Number.isSafeInteger(Number(s?.bullets))&&Number(s.bullets)>0).map((shot,salvoIndex)=>{
  const fx=weaponEffect(shot.weaponId),count=Math.floor(Number(shot.bullets));
  const raw=i=>i*fx.cadenceMs+(shot.weaponId==='W04'?Math.floor(i/3)*38:0);
  const span=raw(count-1),compression=span>fx.burstMs?fx.burstMs/span:1,startMs=salvoIndex*80;
  const rounds=Array.from({length:count},(_,i)=>{
   const launchMs=startMs+Math.round(raw(i)*compression);
   const bend=shot.weaponId==='W05'?(i%2?-1:1)*(22+i%3*8):['W06','W17','W30','W40'].includes(shot.weaponId)?(count===1?0:(i/(count-1)-.5)*36):['W11','W13','W14','W20','W23','W25','W32','W34','W36'].includes(shot.weaponId)?(i%2?-1:1)*16:0;
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
 if(!['W02','W08','W22','W33'].includes(salvo.shot.weaponId)||salvo.rounds.length<2)return salvo.fx.width;
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
