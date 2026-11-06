// Functional damage to the FOUR mother systems. All percentages are playtest values.
// Numerical-card suits only route ammunition; they never create repairs or damage effects.
export const SYSTEM_DAMAGE_THRESHOLD=.50;
export const SYSTEM_PENALTIES=Object.freeze({
 engine:.75,weapons:.50,command:.60, // full KO: preserve point-24 values
 damagedEngine:.90,damagedWeapons:.80,damagedCommand:.85,
 damagedGeneratorRepair:.50
});
export const SYSTEM_CONSEQUENCES=Object.freeze({
 engine:'Motore KO: potenza di fuoco della flotta ridotta del 25%',
 weapons:'Sistema armi KO: potenza della madre dimezzata',
 shieldGenerator:'Generatore scudi KO: barriera collassata e riparazioni disattivate',
 command:'Centralina KO: scudiere senza intercettazione, fuoco ridotto del 40%'
});
export const SYSTEM_DAMAGE_MESSAGES=Object.freeze({
 engine:'Motore danneggiato: potenza di fuoco della flotta ridotta del 10%',
 weapons:'Sistema armi danneggiato: potenza della madre ridotta del 20%',
 shieldGenerator:'Generatore danneggiato: riparazioni dello scudo dimezzate',
 command:'Centralina danneggiata: potenza delle scudiere ridotta del 15%'
});
export const vitalOffline=(defense,id)=>defense?.kind==='mother'&&defense.parts?.[id]?.hp===0;
// Invalid/legacy defenses have no artificial penalties.
export function systemState(defense,id){
 if(defense?.kind!=='mother'||!defense.parts?.[id])return 'unknown';
 const p=defense.parts[id];
 if(!Number.isFinite(p.hp)||!Number.isFinite(p.max)||p.max<=0)return 'unknown';
 if(p.hp<=0)return 'destroyed';
 return p.hp/p.max<=SYSTEM_DAMAGE_THRESHOLD?'damaged':'healthy';
}
export function systemCondition(defense,id){
 const part=defense?.parts?.[id],state=systemState(defense,id);
 return {id,state,hp:part?.hp??null,max:part?.max??null,
  ratio:part?.max>0?Math.max(0,Math.min(1,part.hp/part.max)):null};
}
function efficiency(defense,id,damagedValue,destroyedValue){
 switch(systemState(defense,id)){
  case 'destroyed':return destroyedValue;
  case 'damaged':return damagedValue;
  default:return 1;
 }
}
export function gunEfficiency(defense,kind='mother'){
 if(defense?.kind!=='mother')return 1;
 let power=efficiency(defense,'engine',SYSTEM_PENALTIES.damagedEngine,SYSTEM_PENALTIES.engine);
 if(kind==='mother')power*=efficiency(defense,'weapons',SYSTEM_PENALTIES.damagedWeapons,SYSTEM_PENALTIES.weapons);
 if(kind==='escort')power*=efficiency(defense,'command',SYSTEM_PENALTIES.damagedCommand,SYSTEM_PENALTIES.command);
 return power;
}
export function effectiveGunDamage(defense,kind,rawDamage){
 const raw=Number.isFinite(rawDamage)&&rawDamage>0?Math.floor(rawDamage):0;
 if(!raw)return 0;
 // Small tolerance prevents binary floating point from turning exactly 45 into 44.
 return Math.max(1,Math.floor(raw*gunEfficiency(defense,kind)+1e-9));
}
export function shieldRepairEfficiency(defense){
 return efficiency(defense,'shieldGenerator',SYSTEM_PENALTIES.damagedGeneratorRepair,0);
}
export function escortsCoordinated(defense){return !vitalOffline(defense,'command');}
