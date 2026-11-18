// Progressione autonoma dei supporti: uguale per tutti i tredici modelli.
// E' indipendente dalla progressione L1-L20 delle madri e dagli slot campagna.
// HP/scala numerica sono provvisori: saranno ribilanciati dopo il catalogo carte.
export const SUPPORT_MAX_LEVEL=5;
export const SUPPORT_LEVELS=Object.freeze([1,2,3,4,5]);
export function boundedSupportLevel(level=1){
 const value=Number(level);
 return Number.isFinite(value)?Math.max(1,Math.min(SUPPORT_MAX_LEVEL,Math.floor(value))):1;
}
export function supportLevelProfile(level=1){
 const current=boundedSupportLevel(level);
 return Object.freeze({level:current,maxLevel:SUPPORT_MAX_LEVEL,
  potential:Math.round(100*(current-1)/(SUPPORT_MAX_LEVEL-1)),
  passiveGrade:current,fullyEvolved:current===SUPPORT_MAX_LEVEL,
  nextLevel:current<SUPPORT_MAX_LEVEL?current+1:null});
}
export function supportHpAtLevel(baseHp,level=1){
 const hp=Number(baseHp);
 if(!Number.isFinite(hp)||hp<=0)throw Error('HP base del supporto non validi');
 // Solo una piccola progressione provvisoria; nessun nuovo scudo o slot.
 return Math.round(hp)+Math.max(1,Math.round(hp*0.05))*(boundedSupportLevel(level)-1);
}
export const isMaxSupportLevel=level=>boundedSupportLevel(level)===SUPPORT_MAX_LEVEL;
