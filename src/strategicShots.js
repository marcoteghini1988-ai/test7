// Eclissi Stellare — Punto 27: effetti strategici dei COLPI, non dei semi.
// Le speciali offensive armano al massimo due modificatori compatibili; sono
// consumate dalla mano speciale. Nessun colpo o status nasce da un seme numerico.
export const VOLLEY_EFFECT_IDS=Object.freeze(['shot-piercing','shot-ion','shot-corrosion']);
// Two differently named offensive cards combine by resolving BOTH existing
// effects. The combo label adds no hidden damage, extra timer or new resource.
export const SHOT_COMBO_NAMES=Object.freeze({
 'shot-ion+shot-piercing':'BRECCIA IONICA',
 'shot-corrosion+shot-piercing':'FRATTURA CORROSIVA',
 'shot-corrosion+shot-ion':'DISGREGAZIONE IONICA'
});
export function shotCombinationName(effects){
 if(!Array.isArray(effects)||effects.length!==2)return null;
 const unique=[...new Set(effects)];
 if(unique.length!==2||unique.some(x=>!VOLLEY_EFFECT_IDS.includes(x)))return null;
 return SHOT_COMBO_NAMES[[...unique].sort().join('+')]??null;
}
export const SHOT_RULES=Object.freeze({
 maxArmed:2,
 piercingBypassShare:.20,             // Scorta aggirata, MAI uno scudo/vitale.
 ionizedInterceptMultiplier:.70,     // Solo intercettazione automatica.
 ionizedDurationMs:12000,
 corrosionShieldVulnerability:.25,   // Solo prossimo vero colpo allo scudo.
 corrosionDurationMs:15000
});
const raw=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
const has=(list,id)=>Array.isArray(list)&&list.includes(id);
export function armedShotEffects(side){
 const armed=side?.armedVolleyEffects||[];
 return Array.isArray(armed)?armed.filter(id=>VOLLEY_EFFECT_IDS.includes(id)).slice(0,SHOT_RULES.maxArmed):[];
}
export function armShotEffect(side,id){
 if(!VOLLEY_EFFECT_IDS.includes(id))return {armed:false,reason:'unknown_effect',side};
 if(side?.fleet?.[0]?.defense?.kind!=='mother')return {armed:false,reason:'ability_unavailable',side};
 const current=armedShotEffects(side);
 if(current.includes(id))return {armed:false,reason:'already_armed',side};
 if(current.length>=SHOT_RULES.maxArmed)return {armed:false,reason:'volley_slots_full',side};
 return {armed:true,reason:'ok',side:{...side,armedVolleyEffects:[...current,id]}};
}
export function consumeArmedShotEffects(side,hasDamage){
 if(!hasDamage)return {side,effects:[]};
 const effects=armedShotEffects(side);
 return {side:effects.length?{...side,armedVolleyEffects:[]}:side,effects};
}
export function strategicStatus(side,nowMs){
 const current=side?.strategicStatuses||{};
 return {
  ionizedUntil:current.ionizedUntil>nowMs?current.ionizedUntil:0,
  corrodedUntil:current.corrodedUntil>nowMs?current.corrodedUntil:0
 };
}
export function previewStrategicImpact(side,rawDamage,effects=[],nowMs=Date.now(),options={}){
 const amount=raw(rawDamage),statuses=strategicStatus(side,nowMs);
 // A mathematical signature is NEVER bypassed or changed.
 const shield=options.escortIndex==null&&options.vitalId==null
  &&side?.fleet?.[0]?.defense?.kind==='mother'&&side.fleet[0].defense.shield.hp>0;
 const piercingBypass=shield&&has(effects,'shot-piercing')
  ?Math.floor(amount*SHOT_RULES.piercingBypassShare):0;
 return {
  statuses,shield,
  interceptedPacket:amount-piercingBypass,
  piercingBypass,corrosionActive:!!(shield&&statuses.corrodedUntil)
 };
}
export function strategicShieldDamage(rawMotherDamage,corrosionActive){
 const amount=raw(rawMotherDamage);
 return amount+(corrosionActive?Math.floor(amount*SHOT_RULES.corrosionShieldVulnerability):0);
}
export function finalizeStrategicImpact(side,prepared,effects=[],nowMs=Date.now(),actualShieldDamage=0){
 let statuses={...prepared.statuses},applied=[];
 if(prepared.shield&&actualShieldDamage>0){
  // Old corrosion is one-shot; a new corrosion charge may refresh it.
  if(prepared.corrosionActive)statuses.corrodedUntil=0;
  if(has(effects,'shot-ion')){
   statuses.ionizedUntil=nowMs+SHOT_RULES.ionizedDurationMs;
   applied.push('shot-ion');
  }
  if(has(effects,'shot-corrosion')){
   statuses.corrodedUntil=nowMs+SHOT_RULES.corrosionDurationMs;
   applied.push('shot-corrosion');
  }
  if(has(effects,'shot-piercing')&&prepared.piercingBypass>0)applied.unshift('shot-piercing');
 }
 return {strategicStatuses:statuses,applied};
}
export const STRATEGIC_EFFECT_LABELS=Object.freeze({
 'shot-piercing':'PERFORAZIONE',
 'shot-ion':'IMPULSO IONICO',
 'shot-corrosion':'CORROSIONE'
});
