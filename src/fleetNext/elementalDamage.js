// Danni elementali delle flotte (ruleset HP).
// Vale per TUTTI gli attacchi delle navicelle, normali o speciali.
// Il rapporto fra tipi non cambia gli HP massimi e non regala potenza gratuita.
//
// Vantaggio: 125%; svantaggio 75% con madri bilanciate, 50% storiche; neutro 100%.
// I resti frazionari sono custoditi per coppia di elementi sul difensore:
// due colpi da 1 HP sfavorevoli infliggono insieme 1 HP, non 0 né 2.
import {FLEET_ELEMENTS,elementalRelation} from './elementalAffinities.js';

export const ELEMENTAL_DAMAGE_PERCENT=Object.freeze({
 advantage:125,neutral:100,disadvantage:50
});
// Solo le madri con la nuova scala HP usano una penalità meno estrema.
export const BALANCED_ELEMENTAL_DISADVANTAGE=75;
const DENOMINATOR=4;

export function elementalDamagePercent(attackerElement,defenderElement,balanced=false){
 const relation=elementalRelation(attackerElement,defenderElement);
 return relation>0?ELEMENTAL_DAMAGE_PERCENT.advantage:
  relation<0?(balanced?BALANCED_ELEMENTAL_DISADVANTAGE:
   ELEMENTAL_DAMAGE_PERCENT.disadvantage):ELEMENTAL_DAMAGE_PERCENT.neutral;
}

export function applyElementalDamage(defender,attackerElement,defenderElement,baseDamage,
 {terrainAttackPercent=0,terrainDefensePercent=0,terrainKey=null,terrainAttackBase=null}={}){
 const base=Math.max(0,Math.floor(Number(baseDamage)||0));
 const relation=elementalRelation(attackerElement,defenderElement);
 const balanced=Number.isFinite(defender?.ships?.[0]?.defensePercent);
 const percent=elementalDamagePercent(attackerElement,defenderElement,balanced);
 // A parità di Terreno, i bonus sono SEMPRE della stessa percentuale,
 // anche in svantaggio. Il carry conserva i piccoli colpi frazionari.
 // Moltiplichiamo una sola volta attacco, relazione e resistenza difensiva.
 const attack=Number.isInteger(terrainAttackPercent)?Math.max(0,Math.min(16,terrainAttackPercent)):0;
 const defense=Number.isInteger(terrainDefensePercent)?Math.max(0,Math.min(16,terrainDefensePercent)):0;
 if(base&&(attack||defense)){
  const denominator=1000000;
  const key=attackerElement+':'+defenderElement+':terrain:'+String(terrainKey||'active');
  const previous=defender?.elementalDamageRemainders?.[key]||0;
  // Se una parte della salva proviene da un'Arma di elemento differente,
  // solo la quota con l'elemento del Terreno riceve il bonus della madre.
  const eligible=terrainAttackBase==null?base:
   Math.max(0,Math.min(base,Math.floor(Number(terrainAttackBase)||0)));
  const scaled=(base*100+eligible*attack)*percent*(100-defense)+previous;
  const damage=Math.floor(scaled/denominator),carry=scaled%denominator;
  if(defender){
   defender.elementalDamageRemainders??={};
   if(carry)defender.elementalDamageRemainders[key]=carry;
   else delete defender.elementalDamageRemainders[key];
  }
  return Object.freeze({original:base,damage,relation,percent,carry,
   attackerElement,defenderElement,terrainAttackPercent:attack,terrainDefensePercent:defense});
 }
 if(!base||!relation)return Object.freeze({
  original:base,damage:base,relation,percent,
  carry:0,attackerElement,defenderElement
 });
 const carryKey=attackerElement+':'+defenderElement;
 const remainder=defender?.elementalDamageRemainders?.[carryKey]||0;
 const numerator=percent/25;
 const scaled=base*numerator+remainder;
 const damage=Math.floor(scaled/DENOMINATOR);
 const carry=scaled%DENOMINATOR;
 if(defender){
  defender.elementalDamageRemainders??={};
  if(carry)defender.elementalDamageRemainders[carryKey]=carry;
  else delete defender.elementalDamageRemainders[carryKey];
 }
 return Object.freeze({original:base,damage,relation,percent,carry,
  attackerElement,defenderElement});
}

export const elementalDamageDescription=result=>{
 if(!result||result.relation===0)return 'Impatto elementale neutrale';
 const element=FLEET_ELEMENTS[result.attackerElement]?.name||result.attackerElement;
 return result.relation>0?
  element+' efficace: +25% danni ('+result.original+' → '+result.damage+')':
  element+' contrastato: danni ridotti del '+(100-result.percent)+'% ('+
   result.original+' → '+result.damage+')';
};
