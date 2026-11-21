// Trasferimenti approvati 20/11: le identità restano quelle già progettate.
// Nessuna rarità, immagine, costo o danno definitivo viene inventato.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
import {pendingAdvancedWeaponRule} from './confirmedAdvancedWeaponMechanics.js';
import {PROVISIONAL_ADVANCED_WEAPON_BY_ID} from './provisionalWeaponProfiles.js';
const WIND_DRAFT=PROVISIONAL_ADVANCED_WEAPON_BY_ID['weapon-transferred-aerial-cicloreattore'];

const sirioElement=FLEET_ELEMENTS.mineral,windElement=FLEET_ELEMENTS.aerial;
export const CONFIRMED_TRANSFER_WEAPONS=Object.freeze([
 Object.freeze({
  id:'weapon-transferred-mineral-sirio',
  name:'Sputacristalli di Sirio',nome:'Sputacristalli di Sirio',
  category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
  kind:'support',playable:true,nativeFace:true,rarita:'Comune',rarityPending:false,
  acquisitionPending:false,balancePending:true,maxCopiesPerDeck:5,
  elementId:'mineral',visualKey:sirioElement.vfx,visualSymbol:sirioElement.symbol,
  visualBrief:'Arma trasferita da Ghiaccio a Terra. Grafica fisica definitiva da approvare.',
  effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,
   damageMode:'designed-shot',elementId:'mineral',durationTurns:1,
   weaponProfile:Object.freeze({pattern:'weapon-slot-freeze',baseDamage:10,freezeTurns:1})}),
  effectProposed:'Arma Terra: un colpo autonomo da 10 HP nominali. Se causa danno effettivo, congela uno slot Arma nemico per il prossimo turno proprio del rivale: se occupato non spara, se vuoto non accetta una nuova Arma. Poi si sblocca.'
 }),
 Object.freeze({
  id:'weapon-transferred-aerial-cicloreattore',
  name:'Cicloreattore Grandinifero',nome:'Cicloreattore Grandinifero',
  category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
  kind:'support',playable:true,designOnly:false,reviewRequired:false,nativeFace:true,
  rarita:WIND_DRAFT.rarita,rarityPending:false,acquisitionPending:false,balancePending:true,
  provisionalBalance:true,
  confirmedMechanic:pendingAdvancedWeaponRule('weapon-transferred-aerial-cicloreattore'),
  missingDecisions:Object.freeze([]),maxCopiesPerDeck:3,elementId:'aerial',
  visualKey:windElement.vfx,visualSymbol:windElement.symbol,
  visualBrief:'Arma trasferita da Ghiaccio a Vento; grafica finale da approvare.',
  effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,elementId:'aerial',
   damageMode:'designed-shot',durationTurns:3,weaponProfile:WIND_DRAFT.profile}),
  effectProposed:WIND_DRAFT.description
 })
]);
export const CONFIRMED_TRANSFER_WEAPON_BY_ID=Object.freeze(
 Object.fromEntries(CONFIRMED_TRANSFER_WEAPONS.map(c=>[c.id,c])));
if(CONFIRMED_TRANSFER_WEAPONS.length!==2||
 Object.keys(CONFIRMED_TRANSFER_WEAPON_BY_ID).length!==2)
 throw Error('Trasferimenti Arma incompleti');
