// Eclissi Stellare — 10 affinità e profili delle 17 madri.
// La compatibilità non cambia i danni della modalità HP: le future Carte Energia
// attiveranno un colpo elementale distinto dagli spari normali già esistenti.
import {shipMaxLevel} from './progression.js';

const RAW_ELEMENTS=Object.freeze({
 plasma:{name:'Fuoco',symbol:'🔥',beats:['mineral','cryogenic'],shot:'Raffica di Plasma',vfx:'element-fire'},
 refrigerant:{name:'Acqua',symbol:'💧',beats:['plasma','metallic'],shot:'Onda Idrodinamica',vfx:'element-water'},
 cryogenic:{name:'Ghiaccio',symbol:'❄️',beats:['aerial','refrigerant'],shot:'Lancia Criogenica',vfx:'element-ice'},
 ionic:{name:'Fulmine',symbol:'⚡',beats:['refrigerant','void'],shot:'Scarica Ionica',vfx:'element-lightning'},
 mineral:{name:'Terra',symbol:'🪨',beats:['ionic','gravity'],shot:'Impatto Tectonico',vfx:'element-earth'},
 aerial:{name:'Vento',symbol:'🌪️',beats:['radiant','plasma'],shot:'Vortice di Pressione',vfx:'element-wind'},
 radiant:{name:'Luce',symbol:'☀️',beats:['void','ionic'],shot:'Raggio Radiante',vfx:'element-light'},
 void:{name:'Ombra',symbol:'🌑',beats:['metallic','aerial'],shot:'Fenditura Oscura',vfx:'element-shadow'},
 metallic:{name:'Metallo',symbol:'⚙️',beats:['gravity','mineral'],shot:'Sciame Metallico',vfx:'element-metal'},
 gravity:{name:'Gravità',symbol:'🪐',beats:['cryogenic','radiant'],shot:'Impulso Gravitazionale',vfx:'element-gravity'}
});

export const FLEET_ELEMENTS=Object.freeze(Object.fromEntries(
 Object.entries(RAW_ELEMENTS).map(([id,definition])=>[id,Object.freeze({
  ...definition,beats:Object.freeze([...definition.beats]),
  weakTo:Object.freeze(Object.keys(RAW_ELEMENTS).filter(other=>RAW_ELEMENTS[other].beats.includes(id)))
 })])
));

// Primario in prima posizione; secondo elemento è una possibilità strategica
// acquisita progredendo, non un secondo bonus che si somma al primo.
export const FLEET_ELEMENT_IDENTITIES=Object.freeze({
 N00:Object.freeze(['ionic']),C01:Object.freeze(['plasma']),
 C02:Object.freeze(['refrigerant']),C03:Object.freeze(['void','ionic']),
 C04:Object.freeze(['aerial','plasma']),R01:Object.freeze(['metallic','aerial']),
 R02:Object.freeze(['ionic','refrigerant']),R03:Object.freeze(['radiant','mineral']),
 R04:Object.freeze(['void','mineral']),E01:Object.freeze(['cryogenic','void']),
 E02:Object.freeze(['aerial','ionic']),E03:Object.freeze(['plasma','radiant']),
 E04:Object.freeze(['mineral','gravity']),L01:Object.freeze(['radiant','void']),
 L02:Object.freeze(['gravity','ionic']),L03:Object.freeze(['mineral','metallic']),
 L04:Object.freeze(['refrigerant','radiant'])
});

export const fleetElements=id=>FLEET_ELEMENT_IDENTITIES[id]||Object.freeze([]);
export function secondaryElementUnlockLevel(shipId){
 if(fleetElements(shipId).length<2)return null;
 const max=shipMaxLevel(shipId);
 return max?Math.min(max,Math.max(2,Math.ceil(max*.65))):null;
}
export function activeFleetElements(shipId,level=1){
 const all=fleetElements(shipId),unlock=secondaryElementUnlockLevel(shipId);
 const n=Math.floor(Number(level)||1);
 return Object.freeze(unlock&&n>=unlock?[...all]:all.slice(0,1));
}
export function fleetElementNames(shipId,level=null){
 const ids=level==null?fleetElements(shipId):activeFleetElements(shipId,level);
 return ids.map(id=>FLEET_ELEMENTS[id].name);
}
export function fleetElementWeaknesses(shipId){
 const id=fleetElements(shipId)[0];
 return id?FLEET_ELEMENTS[id].weakTo:[];
}
export function elementalAttackProfile(shipId,level=1){
 const ids=activeFleetElements(shipId,level);
 return Object.freeze({
  primary:ids[0]?FLEET_ELEMENTS[ids[0]]:null,
  secondary:ids[1]?FLEET_ELEMENTS[ids[1]]:null,
  availableElements:ids,
  energyCardRequired:true,
  normalShotUnchanged:true,
  combatBonusEnabled:false
 });
}

const beats=(a,b)=>FLEET_ELEMENTS[a]?.beats.includes(b)===true;
export const elementalRelation=(attackElement,defenseElement)=>
 beats(attackElement,defenseElement)?1:beats(defenseElement,attackElement)?-1:0;

// Confronto per la selezione della flotta, NON valore da aggiungere al danno.
// Peso primario 3, secondario 1: la seconda affinità può aiutare una nave
// senza garantire due vantaggi completi. Due chiamate invertite sono simmetriche.
export function projectedElementalMatchup(attackerShipId,defenderShipId,
 attackerLevel=shipMaxLevel(attackerShipId),defenderLevel=shipMaxLevel(defenderShipId)){
 const a=activeFleetElements(attackerShipId,attackerLevel);
 const b=activeFleetElements(defenderShipId,defenderLevel);
 if(!a.length||!b.length)return Object.freeze({score:0,status:'unknown'});
 const raw=3*elementalRelation(a[0],b[0])+
  (a[1]?elementalRelation(a[1],b[0]):0)+
  (b[1]?elementalRelation(a[0],b[1]):0)+
  (a[1]&&b[1]?elementalRelation(a[1],b[1]):0);
 const score=Math.sign(raw);
 return Object.freeze({score,status:score>0?'favorevole':score<0?'sfavorevole':'neutrale'});
}

const keys=Object.keys(FLEET_ELEMENTS);
if(keys.length!==10||Object.keys(FLEET_ELEMENT_IDENTITIES).length!==17||
 Object.values(FLEET_ELEMENT_IDENTITIES).some(ids=>ids.length<1||ids.length>2||
  new Set(ids).size!==ids.length||ids.some(id=>!FLEET_ELEMENTS[id]))||
 keys.some(id=>FLEET_ELEMENTS[id].beats.length!==2||
  FLEET_ELEMENTS[id].weakTo.length!==2||
  FLEET_ELEMENTS[id].beats.includes(id)||
  FLEET_ELEMENTS[id].beats.some(other=>FLEET_ELEMENTS[other].beats.includes(id))))
 throw Error('Matrice a dieci elementi non bilanciata o famiglie incomplete');
