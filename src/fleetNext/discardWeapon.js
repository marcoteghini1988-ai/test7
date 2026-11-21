// Prima Carta Arma di Supporto confermata: scala solo con i propri scarti.
// Danno 10 / +10 / x2 confermato; rarita Epica, una copia; acquisto in seguito.
export const DISCARD_WEAPON_ID='weapon-memory-plasma';

export const DISCARD_WEAPON=Object.freeze({
 id:DISCARD_WEAPON_ID,
 name:'Cannone dei Frammenti',nome:'Cannone dei Frammenti',
 category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
 kind:'support',playable:true,nativeFace:true,
 rarita:'Epica',rarityPending:false,acquisitionPending:true,
 maxCopiesPerDeck:1,copyLimitPending:false,
 elementId:'plasma',visualKey:'element-fire',visualSymbol:'🔥',
 effectSpec:Object.freeze({
  type:'deployMachine',hp:1,power:0,durationTurns:1,
  damageMode:'discard-attacks',elementId:'plasma',
  baseDamage:10,perDiscardAttack:10,energyMultiplier:2,maxNominalDamage:120
 }),
 effectProposed:'Arma Fuoco per un turno: 10 HP di danno base, +10 HP per ogni tua Carta Attacco negli scarti. Se nei tuoi scarti è presente almeno una Carta Energia Fuoco, raddoppia il danno totale una sola volta. Gli scarti avversari non contano. Danno nominale massimo 120 HP per attivazione.',
 visualBrief:'Cannone spaziale che assorbe frammenti luminosi delle carte Attacco scartate e scarica una raffica di plasma. Immagine definitiva da approvare.'
});
export const DISCARD_WEAPONS=Object.freeze([DISCARD_WEAPON]);
export const DISCARD_WEAPON_BY_ID=Object.freeze({[DISCARD_WEAPON_ID]:DISCARD_WEAPON});
