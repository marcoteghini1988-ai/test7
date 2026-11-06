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
export function tacticalEscortDamage(role,baseDamage,context=null){
 const raw=Number.isFinite(baseDamage)&&baseDamage>0?Math.floor(baseDamage):0;
 if(!raw)return {damage:0,bonus:0,multiplier:1};
 const multiplier=MULTIPLIERS[role]?.[context?.targetKind]??1;
 const damage=Math.max(0,Math.floor(raw*multiplier+1e-9));
 return {damage,bonus:damage-raw,multiplier};
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
 return Math.min(.45,share);
}
