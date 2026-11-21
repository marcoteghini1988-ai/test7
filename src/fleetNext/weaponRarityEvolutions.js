// Evoluzioni delle Carte Arma: stessa identita', stessa meccanica, rarita' crescente.
// Valori provvisori: bilanciamento proporzionato alla crescita degli HP delle navi.
// Non genera immagini, non modifica le armi originali e non allunga i turni.
// Trifase I/II/III sono tre carte in SEQUENZA di combattimento, ognuna con
// una sua evoluzione di rarita': i due concetti sono intenzionalmente distinti.
import {APPROVED_BASE_WEAPONS} from './approvedBaseWeapons.js';
import {CONFIRMED_WEAPON_CARDS} from './confirmedWeaponCards.js';
import {MULTI_WEAPON_CARDS} from './multiWeaponCards.js';
import {DESIGNED_WEAPON_CARDS} from './designedWeaponCards.js';
import {CONFIRMED_TRANSFER_WEAPONS} from './confirmedTransferredWeapons.js';
import {DISCARD_WEAPONS} from './discardWeapon.js';
import {TEMP_SUPPORT_WEAPONS} from './temporarySupportWeapons.js';
import {SHIP_RARITIES} from './shipRarity.js';
import {MOTHER_RARITY_SCALING} from './motherBalance.js';
import {scaleObject,description,weaponPrintCandidate} from './weaponBalanceCalibration.js';

// Per mantenere una simile durata negli scontri alla pari, la potenza nominale
// segue gli HP delle navi, NON il tempo del timer. Non e' un moltiplicatore
// automatico alla partita: crea valori distinti sulle singole carte.
const HP_SCALE=Object.freeze(Object.fromEntries(SHIP_RARITIES.map((r,i)=>
 [r,MOTHER_RARITY_SCALING[i].hp])));
const COPIES=Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
const SUFFIX=Object.freeze({Rara:'r',Epica:'e',Leggendaria:'l'});
export const WEAPON_BASE_CARDS=Object.freeze([
 ...APPROVED_BASE_WEAPONS,...CONFIRMED_WEAPON_CARDS,...MULTI_WEAPON_CARDS,
 ...DESIGNED_WEAPON_CARDS,...CONFIRMED_TRANSFER_WEAPONS,
 ...DISCARD_WEAPONS,...TEMP_SUPPORT_WEAPONS
]);
function evolveOne(base,rarita,previousId){
 const index=SHIP_RARITIES.indexOf(base.rarita),next=SHIP_RARITIES.indexOf(rarita);
 if(index<0||next<=index)throw Error('Evoluzione arma non valida '+base.id);
 // Fattore HP originario. I coefficienti WEAPON_RARITY_POWER rimangono
 // esclusivamente nella matrice diagnostica fino al collaudo delle nuove regole.
 const factor=HP_SCALE[rarita]/HP_SCALE[base.rarita];
 const spec=Object.freeze(scaleObject(base.effectSpec,factor));
 const id=base.id+'-rarity-'+SUFFIX[rarita];
 const maxCopies=base.maxCopiesPerDeck===1?1:COPIES[rarita];
 return Object.freeze({...base,id,name:base.name,nome:base.name,rarita,
  rarity:rarita,weaponFamilyId:base.id,originRarity:base.rarita,
  evolutionOf:previousId,evolutionStage:next-index,isWeaponEvolution:true,
  playable:true,nativeFace:true,acquisitionPending:false,balancePending:true,
  maxCopiesPerDeck:maxCopies,effectSpec:spec,
  effectProposed:description(base,spec),
  visualBrief:(base.visualBrief||'Arma '+base.name)+
   ' Evoluzione '+rarita+': armamento piu potente, stessa funzione e stesso elemento.'
 });
}
export const EVOLVED_WEAPON_CARDS=Object.freeze(WEAPON_BASE_CARDS.flatMap(base=>{
 const start=SHIP_RARITIES.indexOf(base.rarita);
 if(start<0)throw Error('Rarita di origine non valida: '+base.id);
 let previousId=base.id;
 return SHIP_RARITIES.slice(start+1).map(r=>{
  const evolved=evolveOne(base,r,previousId);previousId=evolved.id;return evolved;
 });
}));
export const ALL_WEAPON_CARDS=Object.freeze([...WEAPON_BASE_CARDS,...EVOLVED_WEAPON_CARDS]);
export const ALL_WEAPON_BY_ID=Object.freeze(Object.fromEntries(ALL_WEAPON_CARDS.map(c=>[c.id,c])));
 // Un catalogo separato di valori candidati da mostrare prima della grafica.
 // Non altera ALL_WEAPON_CARDS, usato dagli attuali combattimenti e test.
 export const WEAPON_PRINT_CANDIDATES=Object.freeze(ALL_WEAPON_CARDS.map(weaponPrintCandidate));
 export const WEAPON_PRINT_CANDIDATE_BY_ID=Object.freeze(Object.fromEntries(
  WEAPON_PRINT_CANDIDATES.map(card=>[card.id,card])
 ));
export const WEAPON_EVOLUTION_FAMILIES=Object.freeze(Object.fromEntries(
 WEAPON_BASE_CARDS.map(base=>[base.id,Object.freeze([
  base,...EVOLVED_WEAPON_CARDS.filter(c=>c.weaponFamilyId===base.id)
 ])])
));
export const weaponFamily=id=>{
 const c=ALL_WEAPON_BY_ID[id];return c?WEAPON_EVOLUTION_FAMILIES[c.weaponFamilyId||c.id]:null;
};
export const weaponAtRarity=(id,rarita)=>weaponFamily(id)?.find(c=>c.rarita===rarita)||null;
export const weaponNextEvolution=id=>{
 const f=weaponFamily(id),c=ALL_WEAPON_BY_ID[id];if(!f||!c)return null;
 const next=SHIP_RARITIES[SHIP_RARITIES.indexOf(c.rarita)+1];
 return next?f.find(w=>w.rarita===next)||null:null;
};
if(WEAPON_BASE_CARDS.length!==73||EVOLVED_WEAPON_CARDS.length!==162||
 ALL_WEAPON_CARDS.length!==235||Object.keys(ALL_WEAPON_BY_ID).length!==235||
 Object.keys(WEAPON_EVOLUTION_FAMILIES).length!==73||
 WEAPON_BASE_CARDS.some(c=>!weaponAtRarity(c.id,'Leggendaria')))
 throw Error('Progressione delle 73 famiglie di Armi non completa');
