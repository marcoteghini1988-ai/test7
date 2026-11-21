// Trasferimenti approvati 20/11: le identità restano quelle già progettate.
// Nessuna rarità, immagine, costo o danno definitivo viene inventato.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
import {pendingAdvancedWeaponRule} from './confirmedAdvancedWeaponMechanics.js';

const sirioElement=FLEET_ELEMENTS.mineral,windElement=FLEET_ELEMENTS.aerial;
export const CONFIRMED_TRANSFER_WEAPONS=Object.freeze([
 Object.freeze({
  id:'weapon-transferred-mineral-sirio',
  name:'Sputacristalli di Sirio',nome:'Sputacristalli di Sirio',
  category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
  kind:'support',playable:true,nativeFace:true,rarita:'Comune',rarityPending:false,
  acquisitionPending:true,balancePending:true,maxCopiesPerDeck:5,
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
  kind:'support',playable:false,designOnly:true,reviewRequired:true,nativeFace:true,
  rarita:'Da definire',rarityPending:true,acquisitionPending:true,balancePending:true,
  confirmedMechanic:pendingAdvancedWeaponRule('weapon-transferred-aerial-cicloreattore'),
  missingDecisions:pendingAdvancedWeaponRule('weapon-transferred-aerial-cicloreattore').missing,
  maxCopiesPerDeck:1,elementId:'aerial',
  visualKey:windElement.vfx,visualSymbol:windElement.symbol,
  visualBrief:'Arma trasferita da Ghiaccio a Vento; grafica finale da approvare.',
  effectSpec:Object.freeze({type:'plannedWeapon',elementId:'aerial',
   review:'Da chiudere danno per bersaglio e durata del congelamento mano'}),
  effectProposed:'Arma Vento, tre turni propri, colpisce nave madre e supporti. Nella bozza precedente: danni 6/12/18 HP e blocco mano 2/4/6 secondi nei tre turni, timer attivo. Valori provvisori: resta non giocabile finché non sono approvati danni per ciascun bersaglio e congelamento.'
 })
]);
export const CONFIRMED_TRANSFER_WEAPON_BY_ID=Object.freeze(
 Object.fromEntries(CONFIRMED_TRANSFER_WEAPONS.map(c=>[c.id,c])));
if(CONFIRMED_TRANSFER_WEAPONS.length!==2||
 Object.keys(CONFIRMED_TRANSFER_WEAPON_BY_ID).length!==2)
 throw Error('Trasferimenti Arma incompleti');
