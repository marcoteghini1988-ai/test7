// Ponte dei piloti difensivi verso il nuovo duello LIVE. Nessuna abilità
// produce un colpo o modifica le firme dei vitali. Le percentuali
// si applicano soltanto a pacchetti REALI sulla barriera madre.
import {commanderAbilityStatus,commanderDefenseFactor,
 rememberCommanderImpact} from './commanderAbilities.js';
const DEFENSE_TRIGGERS=new Set(['first_mother_hit','ionized_self','high_shield',
 'escort_lost','last_vital','two_damaged_vitals','no_shield']);
function liveView(side){
 return {...side,fleet:[{defense:side.defense}],
  escorts:side.escorts.map(e=>({...e,defense:{destroyed:e.hp<=0}})),
  strategicStatuses:{...side.strategicStatuses,
   ionizedUntil:side.ionized?1:0,corrodedUntil:side.corroded?1:0}};
}
export function liveCommanderDefensePacket(attacker,defender,packet){
 const info=commanderAbilityStatus(defender);
 if(!(packet>0)||!info||!DEFENSE_TRIGGERS.has(info.trigger))
  return {damage:packet,prevented:0,active:false};
 const factor=commanderDefenseFactor(liveView(defender),liveView(attacker),{nowMs:0});
 if(factor>=1){
  defender.commander.defenseRemainder=0;
  return {damage:packet,prevented:0,active:false};
 }
 const remainder=Number.isInteger(defender.commander.defenseRemainder)?
  defender.commander.defenseRemainder:0;
 const points=packet*Math.round((1-factor)*100)+remainder;
 const prevented=Math.min(packet,Math.floor(points/100));
 // Conserva il resto soltanto quando questa abilità era davvero attiva;
 // la memoria first_mother_hit viene eliminata al primo colpo reale.
 defender.commander.defenseRemainder=points%100;
 return {damage:packet-prevented,prevented,active:true,id:info.id,percentage:info.value};
}
export function liveCommanderRememberShot(attacker,defender,damage){
 if(!(damage>0))return;
 const snapshot=rememberCommanderImpact(liveView(attacker),liveView(defender),
  {nowMs:0},{damage,motherDamage:damage});
 if(attacker.commander)attacker.commander=snapshot.attacker.commander;
 if(defender.commander)defender.commander=snapshot.defender.commander;
}
export const LIVE_DEFENSIVE_PILOT_TRIGGERS=Object.freeze([...DEFENSE_TRIGGERS]);
