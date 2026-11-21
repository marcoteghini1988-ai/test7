// Cinque Armi Acqua/Ghiaccio con meccaniche definite 20 novembre 2026.
// Danni nominali da bilanciare, nessuna carta addizionale inventata.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
const DESIGNS=[
  {
    "id": "weapon-confirmed-refrigerant-compression",
    "name": "Cannone a Compressione Abissale",
    "elementId": "refrigerant",
    "rarita": "Comune",
    "mode": "base-shot",
    "baseDamage": 26,
    "durationTurns": 1
  },
  {
    "id": "weapon-confirmed-refrigerant-gemellata",
    "name": "Batteria Idrobalistica Gemellata",
    "elementId": "refrigerant",
    "rarita": "Rara",
    "mode": "double-shot",
    "baseDamage": 16,
    "shots": 2,
    "durationTurns": 1
  },
  {
    "id": "weapon-confirmed-cryogenic-pistoni",
    "name": "Torretta a Pistoni Glaciali",
    "elementId": "cryogenic",
    "rarita": "Comune",
    "mode": "repeat-shot",
    "baseDamage": 16,
    "durationTurns": 2
  },
  {
    "id": "weapon-confirmed-cryogenic-obice-polare",
    "name": "Obice a Frantumazione Polare",
    "elementId": "cryogenic",
    "rarita": "Comune",
    "mode": "sweep-shot",
    "baseDamage": 12,
    "durationTurns": 1
  },
  {
    "id": "weapon-confirmed-cryogenic-scarica-brina",
    "name": "Batteria a Scarica di Brina",
    "elementId": "cryogenic",
    "rarita": "Epica",
    "mode": "energy-burst-shot",
    "baseDamage": 20,
    "extraDamage": 10,
    "maxExtraShots": 2,
    "durationTurns": 1
  }
];
const COPIES={Comune:5,Rara:4,Epica:3,Leggendaria:2};
export const MULTI_WEAPON_CARDS=Object.freeze(DESIGNS.map(s=>{
 const elem=FLEET_ELEMENTS[s.elementId];
 if(!elem||!COPIES[s.rarita])throw Error('Progetto Arma non valido: '+s.id);
 const detail=s.mode==='base-shot'?'un colpo da '+s.baseDamage+' HP':
  s.mode==='double-shot'?'due colpi distinti da '+s.baseDamage+' HP ciascuno':
  s.mode==='repeat-shot'?'un colpo da '+s.baseDamage+' HP per due tuoi turni':
  s.mode==='sweep-shot'?'un colpo da '+s.baseDamage+' HP a ciascuna nave nemica':
  'un colpo da '+s.baseDamage+' HP, più fino a '+s.maxExtraShots+' colpi da '+s.extraDamage+' HP con altrettante Carte Energia '+elem.name+' fisiche nella pila, senza consumarle';
 return Object.freeze({id:s.id,name:s.name,nome:s.name,
  categoria:'Supporto',category:'Arma di supporto',sottotipo:'Arma temporanea',
  kind:'support',playable:true,nativeFace:true,rarita:s.rarita,
  elementId:s.elementId,visualKey:elem.vfx,visualSymbol:elem.symbol,
  acquisitionPending:false,balancePending:true,maxCopiesPerDeck:COPIES[s.rarita],
  effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,
   damageMode:s.mode,elementId:s.elementId,baseDamage:s.baseDamage,
   durationTurns:s.durationTurns,...(s.shots?{shotCount:s.shots}:{}),
   ...(s.extraDamage?{extraDamage:s.extraDamage,maxExtraShots:s.maxExtraShots}:{})}),
  effectProposed:'Arma '+elem.name+': '+detail+'. Difese, Terreni e relazioni elementali applicabili.'
 });
}));
export const MULTI_WEAPON_BY_ID=Object.freeze(Object.fromEntries(MULTI_WEAPON_CARDS.map(c=>[c.id,c])));
if(MULTI_WEAPON_CARDS.length!==5||Object.keys(MULTI_WEAPON_BY_ID).length!==5)throw Error('Armi Acqua/Ghiaccio incomplete');
