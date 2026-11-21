// Cinque Carte Arma decise: due combinabili e tre armi con colpo autonomo.
// HP tratti dalle decisioni 19-20 novembre, ancora in attesa di bilanciamento globale.
import {calibratedWeaponCard} from './weaponBalanceCalibration.js';
import {FLEET_ELEMENTS} from './elementalAffinities.js';
const RAW=[["weapon-new-cryogenic-03","Balestra di Nebbia Gelata","cryogenic","Comune",18,"polarity-shot","positive"],["weapon-new-cryogenic-05","Dardiera della Brina Inversa","cryogenic","Rara",24,"polarity-shot","negative"],["weapon-confirmed-plasma-nucleo","Cannone a Nucleo Incandescente","plasma","Comune",28,"base-shot",null],["weapon-confirmed-metallic-maglio","Maglio Ferrogravitazionale","metallic","Comune",30,"base-shot",null],["weapon-confirmed-metallic-slitta","Cannone a Slitta d'Acciaio","metallic","Comune",24,"base-shot",null]];
const COPIES={Comune:5,Rara:4,Epica:3,Leggendaria:2};
export const CONFIRMED_WEAPON_CARDS=Object.freeze(RAW.map(([id,name,elementId,rarita,damage,mode,polarity])=>{
 const element=FLEET_ELEMENTS[elementId],cryo=mode==='polarity-shot';
 if(!element||!COPIES[rarita]||!Number.isInteger(damage)||damage<1)throw Error('Arma errata: '+id);
 return calibratedWeaponCard(Object.freeze({id,name,nome:name,kind:'support',categoria:'Supporto',
  category:'Arma di supporto',sottotipo:'Arma temporanea',playable:true,nativeFace:true,
  rarita,maxCopiesPerDeck:COPIES[rarita],elementId,visualKey:element.vfx,
  visualSymbol:element.symbol,acquisitionPending:false,balancePending:true,
  effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,damageMode:mode,elementId,
   baseDamage:damage,durationTurns:1,...(cryo?{crystalPolarity:polarity,comboBonus:16}:{})}),
  effectProposed:cryo?'Colpisce direttamente la madre con '+damage+' HP nominali. Se infligge HP reali lascia un cristallo '+polarity+'. Il colpo della polarità opposta, nello stesso turno o nel prossimo turno proprio, innesca +16 HP nominali. Difese e resistenze restano valide.':
   'Colpo autonomo da '+damage+' HP nominali a un bersaglio; Difese, copertura e Terreni applicabili.'
 }));
}));
export const CONFIRMED_WEAPON_BY_ID=Object.freeze(Object.fromEntries(CONFIRMED_WEAPON_CARDS.map(c=>[c.id,c])));
