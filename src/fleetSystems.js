// Operational consequences for four mother vital systems.
// Tunable prototype values: suits still ONLY route cards to weapons.
export const SYSTEM_PENALTIES=Object.freeze({engine:.75,weapons:.50,command:.60});
export const SYSTEM_CONSEQUENCES=Object.freeze({
 engine:'Motore KO: potenza di fuoco della flotta ridotta del 25%',
 weapons:'Sistema armi KO: potenza della madre dimezzata',
 shieldGenerator:'Generatore scudi KO: barriera collassata e riparazioni disattivate',
 command:'Centralina KO: scudiere senza intercettazione, fuoco ridotto del 40%'
});
export const vitalOffline=(defense,id)=>defense?.kind==='mother'&&defense.parts?.[id]?.hp===0;
export function gunEfficiency(defense,kind='mother'){
 if(defense?.kind!=='mother')return 1;
 let power=vitalOffline(defense,'engine')?SYSTEM_PENALTIES.engine:1;
 if(kind==='mother'&&vitalOffline(defense,'weapons'))power*=SYSTEM_PENALTIES.weapons;
 if(kind==='escort'&&vitalOffline(defense,'command'))power*=SYSTEM_PENALTIES.command;
 return power;
}
export function effectiveGunDamage(defense,kind,rawDamage){
 const raw=Number.isFinite(rawDamage)&&rawDamage>0?Math.floor(rawDamage):0;
 if(!raw)return 0;
 // Small tolerance prevents binary floating point from turning exactly 45 into 44.
 return Math.max(1,Math.floor(raw*gunEfficiency(defense,kind)+1e-9));
}
export function escortsCoordinated(defense){return !vitalOffline(defense,'command');}
