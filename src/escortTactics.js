// Specializzazioni di flotta, separate dalle sette abilità di ruolo.
// Dati provvisori: il seme della carta non determina alcun effetto automatico.
const doctrine=(name,target,attack,intercept)=>Object.freeze({name,target,attack,intercept});
export const ESCORT_DOCTRINES=Object.freeze({
 N00:doctrine('Scorta Aurora','escortShield',.05,0),
 C01:doctrine('Fuoco Solare','motherShield',.06,.01),
 C02:doctrine('Taglio di Cristallo','motherShield',.07,.015),
 C03:doctrine('Richiamo del Corvo','escortShield',.08,.012),
 C04:doctrine('Penombra Cremisi','motherVital',.07,.015),
 R01:doctrine('Circuito Binario','motherShield',.08,.02),
 R02:doctrine('Marea Ionica','escortShield',.09,.018),
 R03:doctrine('Frazione Iride','motherVital',.09,.02),
 R04:doctrine('Morsa del Vuoto','motherShield',.10,.022),
 E01:doctrine('Campo Nebulosa','motherVital',.10,.027),
 E02:doctrine('Scarica Tempesta','escortShield',.11,.021),
 E03:doctrine('Forgia Fenice','motherVital',.12,.026),
 E04:doctrine('Linea Orizzonte','escortShield',.12,.03),
 L01:doctrine('Corona di Guerra','motherVital',.13,.032),
 L02:doctrine('Eclissi Tattica','escortShield',.14,.028),
 L03:doctrine('Giudizio d’Assedio','motherShield',.15,.035),
 L04:doctrine('Sovranità Stellare','motherVital',.16,.04)
});

import {escortsCoordinated} from './fleetSystems.js';
// Sette ruoli delle scudiere. Valori provvisori: i semi caricano, non potenziano.
export const ESCORT_ROLE_HELP=Object.freeze({
 Guardia:'Scudo madre al 50% o meno: +8% intercettazione.',
 Intercettore:'Colpi diretti ai vitali: +10% intercettazione.',
 Baluardo:'Scudo madre al 25% o meno: +12% intercettazione.',
 Assalto:'Colpi allo scudo delle scudiere: +25% danni.',
 Incursore:'Colpi ai vitali esposti: +25% danni.',
 Assedio:'Colpi allo scudo generale della madre: +35% danni.',
 Artiglieria:'Colpi agli scudi della madre o scudiere: +20% danni.'
});
const MULTIPLIERS=Object.freeze({
 Assalto:Object.freeze({escortShield:1.25}),
 Incursore:Object.freeze({motherVital:1.25}),
 Assedio:Object.freeze({motherShield:1.35}),
 Artiglieria:Object.freeze({motherShield:1.20,escortShield:1.20})
});
export function attackTargetKind(defender,options={}){
 if(options.escortIndex!==undefined&&options.escortIndex!==null){
  const escort=defender?.escorts?.[options.escortIndex];
  if(!escort)return 'invalid';
  return escort.defense?.shield.hp>0?'escortShield':'escortFinisher';
 }
 return options.vitalId?'motherVital':'motherShield';
}
export function tacticalEscortDamage(role,baseDamage,context=null,escort=null,motherDefense=null){
 const raw=Number.isFinite(baseDamage)&&baseDamage>0?Math.floor(baseDamage):0;
 if(!raw)return {damage:0,bonus:0,multiplier:1};
 const multiplier=MULTIPLIERS[role]?.[context?.targetKind]??1;
 const family=ESCORT_DOCTRINES[escort?.parentShipId];
 const connected=motherDefense?.kind==='mother'&&escortsCoordinated(motherDefense);
 const affinity=connected&&family?.target===context?.targetKind?family.attack:0;
 const damage=Math.max(0,Math.floor(raw*(multiplier+affinity)+1e-9));
 return {damage,bonus:damage-raw,multiplier,doctrine:affinity?family.name:null,familyBonus:affinity};
}
export function defensiveEscortShare(escort,motherDefense,options={}){
 const value=Number(escort?.weapon?.interceptShare);
 let share=Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
 if(motherDefense?.kind!=='mother')return share;
 const ratio=motherDefense.shield?.max>0?motherDefense.shield.hp/motherDefense.shield.max:1;
 switch(escort?.weapon?.role){
  case 'Guardia':if(ratio<=.5)share+=.08;break;
  case 'Baluardo':if(ratio<=.25)share+=.12;break;
  case 'Intercettore':if(options?.vitalId)share+=.10;break;
 }
 if(ratio<=.5&&escortsCoordinated(motherDefense))
  share+=ESCORT_DOCTRINES[escort?.parentShipId]?.intercept||0;
 return Math.min(.45,share);
}
