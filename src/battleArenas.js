// Eclissi Stellare — punto 42: arene tattiche simmetriche, separate dagli sfondi
// cosmetici di DeepSpaceUniverseCanvas e dai negozi. Nessun pay-to-win.
// Ogni bonus scatta solo su una manovra o un impatto realmente valido.
const entries=[
 ['titanium','Piattaforma di Titanio','TITANIO','Arena neutra: nessun modificatore'],
 ['debris','Cintura dei Detriti','DETRITI','Danno allo scudo madre −8%, dopo le intercettazioni; vitali e scudiere invariati'],
 ['plasma','Corridoio di Plasma','PLASMA','Danno delle scariche autorizzate con tre numeriche +6%'],
 ['ionic','Nebulosa Ionica','IONICA','Durata della ionizzazione applicata con vera carta Ionica −25%'],
 ['resonance','Camera di Risonanza','RISONANZA','+1 Sincronia per ogni calcolo valido registrato; il limite resta 100']
];
export const BATTLE_ARENAS=Object.freeze(Object.fromEntries(entries.map(
 ([id,name,shortLabel,description])=>[id,Object.freeze({id,name,shortLabel,description})]
)));
export const BATTLE_ARENA_IDS=Object.freeze(Object.keys(BATTLE_ARENAS));
export function battleArena(id){return BATTLE_ARENAS[id]||BATTLE_ARENAS.titanium;}
export function arenaForBattle(level=1,mode='campaign',overrideId=null){
 if(typeof overrideId==='string'&&Object.hasOwn(BATTLE_ARENAS,overrideId))return battleArena(overrideId);
 // Adventure: real campaign sector indexes; other modes stay neutral.
 if(!['campaign','adventure'].includes(mode))return battleArena('titanium');
 const n=Math.floor(Number(level));
 if(!Number.isFinite(n)||n<1)return battleArena('titanium');
 return battleArena(BATTLE_ARENA_IDS[(n-1)%BATTLE_ARENA_IDS.length]);
}
const mother=side=>side?.fleet?.[0]?.defense?.kind==='mother'?side.fleet[0].defense:null;
// Invoke ONLY after the live engine has verified the calculation and ammunition.
export function arenaAttackFactor(arenaId,context={}){
 if(arenaId!=='plasma'||context.legalAttack!==true||
  !Array.isArray(context.cards)||context.cards.length!==3||
  context.cards.some(c=>!c||!Number.isInteger(c.value)||c.value<1||c.value>13))return 1;
 return 1.06;
}
// Only mother-bound shield packets, never interceptions/escort HP or vital signatures.
export function arenaMotherDefenseFactor(arenaId,defender,context={}){
 if(arenaId!=='debris'||context.vitalId!=null||context.escortIndex!=null||
  !(mother(defender)?.shield?.hp>0))return 1;
 return .92;
}
export function applyArenaIonResistance(side,arenaId,applied=[],nowMs=0){
 if(arenaId!=='ionic'||!Array.isArray(applied)||!applied.includes('shot-ion'))return side;
 const until=side?.strategicStatuses?.ionizedUntil;
 if(!(Number.isFinite(until)&&until>nowMs))return side;
 // Reduce remaining duration, never invent a new status effect.
 const nextUntil=nowMs+Math.ceil((until-nowMs)*.75);
 return {...side,strategicStatuses:{...side.strategicStatuses,ionizedUntil:nextUntil}};
}
export function applyArenaCalculationSync(side,arenaId,credited=0){
 if(arenaId!=='resonance'||!(Number(credited)>0)||!side?.maneuvers)return side;
 const current=Math.max(0,Math.min(100,Number(side.maneuvers.sync)||0));
 if(current>=100)return side;
 return {...side,maneuvers:{...side.maneuvers,sync:Math.min(100,current+1)}};
}
