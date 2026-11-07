// Preset di PROVA del duello simultaneo. Non regalano carte alla collezione.
// Ogni configurazione ha 24 istanze reali; 5 vengono pescate in mano.
import {TACTICAL_STARTER_TYPES,validateTacticalLoadout} from './simultaneousDuelEngine.js';
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';

const FAMILIES=Object.freeze({
 assault:['tactic-power-shift','tactic-kinetic','shot-corrosion','shot-piercing','fusion-strike','tactic-numeric-recycle'],
 defense:['tactic-reactive','tactic-impact','support-shield-repair','tactical-cover','fusion-barrier','tactic-counter'],
 control:['tactic-scan','shot-ion','tactic-suppress','shot-corrosion','tactic-counter','tactic-numeric-recycle'],
 fusion:['fusion-barrier','fusion-strike','fusion-twin','fusion-triad','support-escort-repair','tactical-cover']
});
export const TACTICAL_PRESETS=Object.freeze({
 starter:{label:'Bilanciato',types:[...TACTICAL_STARTER_TYPES]},
 ...Object.fromEntries(Object.entries(FAMILIES).map(([id,types])=>[id,{
  label:({assault:'Assedio',defense:'Difensivo',control:'Controllo',fusion:'Fusioni'})[id],
  types:types.flatMap(type=>Array(4).fill(type))
 }]))
});
for(const [id,preset] of Object.entries(TACTICAL_PRESETS)){
 if(!validateTacticalLoadout(preset.types))throw new Error('Preset non valido: '+id);
 Object.freeze(preset.types);Object.freeze(preset);
}
export const TACTICAL_BOSS_PLANS=Object.freeze({
 1:{style:'baluardo',targets:['shieldGenerator','weapons','engine','command'],
  types:['tactic-reactive','tactic-counter','tactic-impact','support-shield-repair','tactical-cover','fusion-barrier']},
 2:{style:'assalto',targets:['weapons','shieldGenerator','engine','command'],
  types:['tactic-kinetic','tactic-power-shift','shot-piercing','shot-corrosion','fusion-strike','tactic-suppress']},
 3:{style:'ricambio',targets:['shieldGenerator','command','weapons','engine'],
  types:['tactic-numeric-recycle','tactic-scan','support-shield-repair','support-status-purge','tactic-counter','tactic-impact']},
 6:{style:'controtempo',targets:['weapons','command','engine','shieldGenerator'],
  types:['tactic-counter','tactic-impact','tactic-reactive','tactical-cover','shot-corrosion','tactic-scan']},
 7:{style:'ionico',targets:['command','shieldGenerator','weapons','engine'],
  types:['shot-ion','tactic-suppress','shot-piercing','tactic-scan','tactic-counter','tactic-reactive']},
 8:{style:'scorta',targets:['weapons','engine','shieldGenerator','command'],
  types:['fusion-twin','fusion-barrier','tactical-cover','support-escort-repair','tactic-impact','tactic-counter']},
 9:{style:'chirurgico',targets:['shieldGenerator','command','weapons','engine'],
  types:['tactic-scan','tactic-counter','tactic-power-shift','shot-corrosion','tactic-numeric-recycle','shot-piercing']},
 11:{style:'interferenza',targets:['engine','shieldGenerator','command','weapons'],
  types:['shot-ion','shot-corrosion','tactic-counter','tactic-scan','tactic-suppress','tactic-power-shift']},
 14:{style:'rigenerazione',targets:['shieldGenerator','weapons','command','engine'],
  types:['support-shield-repair','support-status-purge','support-escort-repair','tactical-cover','tactic-reactive','tactic-impact']},
 17:{style:'fusione_assalto',targets:['command','shieldGenerator','engine','weapons'],
  types:['fusion-strike','fusion-triad','tactic-kinetic','tactic-power-shift','shot-corrosion','shot-piercing']},
 19:{style:'eruzione',targets:['weapons','shieldGenerator','command','engine'],
  types:['tactic-kinetic','shot-corrosion','shot-piercing','tactic-power-shift','tactic-suppress','tactic-numeric-recycle']},
 20:{style:'difesa_finale',targets:['engine','command','weapons','shieldGenerator'],
  types:['tactic-impact','tactic-reactive','shot-ion','support-status-purge','tactic-counter','tactic-scan']}
});
const BOSS_IDS=Object.keys(PHASE16D_BOSS_PROFILES);
if(BOSS_IDS.length!==12||BOSS_IDS.some(id=>!TACTICAL_BOSS_PLANS[id]))
 throw new Error('I 12 boss esistenti non corrispondono ai nuovi mazzi tattici.');
const FALLBACK=['tactic-power-shift','tactic-kinetic','tactic-scan','tactic-reactive','tactic-impact','tactic-counter','tactic-numeric-recycle','support-shield-repair'];
export function tacticalBossProfile(planetId){
 const id=Number(planetId),boss=PHASE16D_BOSS_PROFILES[id],plan=TACTICAL_BOSS_PLANS[id];
 return boss&&plan?{...plan,id,name:boss.name,ability:boss.ability,description:boss.description}:null;
}
export function buildTacticalBossDeck(planetId,level=5,enemyLevel=3){
 const profile=tacticalBossProfile(planetId);
 if(!profile)throw new Error('Pianeta boss inesistente');
 const escortCount=level>=5?2:level>=3?1:0;
 const enemyHasEscorts=enemyLevel>=3;
 const choices=profile.types.flatMap(type=>Array(4).fill(type));
 const counts={};
 const useful=type=>{
  if(type==='fusion-twin'||type==='fusion-triad')return escortCount>=2;
  if(['fusion-barrier','fusion-strike','tactical-cover','support-escort-repair'].includes(type))return escortCount>=1;
  if(['tactic-suppress','shot-piercing'].includes(type))return enemyHasEscorts;
  return true;
 };
 const final=[];
 for(const type of choices){
  let candidate=type;
  if(!useful(type)||((counts[type]||0)>=6)){
   candidate=FALLBACK.find(t=>useful(t)&&(counts[t]||0)<4&&!profile.types.includes(t))
     ??FALLBACK.find(t=>useful(t)&&(counts[t]||0)<6);
  }
  if(!candidate)throw new Error('Non è possibile costruire il mazzo boss');
  counts[candidate]=(counts[candidate]||0)+1;final.push(candidate);
 }
 if(!validateTacticalLoadout(final))throw new Error('Mazzo boss non valido');
 return final;
}
