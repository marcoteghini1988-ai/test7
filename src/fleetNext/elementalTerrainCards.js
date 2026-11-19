// Eclissi Stellare - Catalogo progettato di 30 Terreni elementali x 4 rarita'.
// Carte giocabili nella modalità HP. Le immagini definitive saranno aggiunte dopo
// il collaudo; i Terreni ambientali storici dei boss restano compatibili.
// Valori iniziali da collaudare prima di attivare gli effetti nel combattimento.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
import {SHIP_RARITIES,RARITY_DUPLICATE_COPIES,nextShipRarity} from './shipRarity.js';

const MODELS=Object.freeze([
  [
    "plasma",
    "Forgia delle Stelle",
    "Bastione Magmatico",
    "Corona di Plasma"
  ],
  [
    "refrigerant",
    "Correnti Impetuose",
    "Fondale Protettivo",
    "Marea Primordiale"
  ],
  [
    "cryogenic",
    "Tempesta Criogenica",
    "Muraglia di Brina",
    "Regno del Permafrost"
  ],
  [
    "ionic",
    "Tempesta di Archi Ionici",
    "Gabbia di Faraday",
    "Nucleo delle Saette"
  ],
  [
    "mineral",
    "Faglia Sismica",
    "Fortezza di Basalto",
    "Cuore del Pianeta"
  ],
  [
    "aerial",
    "Ciclone Stellare",
    "Barriera dei Venti",
    "Orizzonte Turbolento"
  ],
  [
    "radiant",
    "Lancia dell'Aurora",
    "Cupola Radiante",
    "Alba Celeste"
  ],
  [
    "void",
    "Vortice delle Tenebre",
    "Velo del Vuoto",
    "Eclisse Profonda"
  ],
  [
    "metallic",
    "Pioggia di Titanio",
    "Fortezza Ferrica",
    "Cittadella Meccanica"
  ],
  [
    "gravity",
    "Pozzo Gravitazionale",
    "Scudo Orbitale",
    "Singolarità Controllata"
  ]
]);
const MODES=Object.freeze([
 Object.freeze({id:'ATT',type:'offensivo',index:0}),
 Object.freeze({id:'DEF',type:'difensivo',index:1}),
 Object.freeze({id:'EQ',type:'equilibrato',index:2})
]);
const TIERS=Object.freeze([
 Object.freeze({rarity:'Comune',suffix:'C',single:10,dual:5}),
 Object.freeze({rarity:'Rara',suffix:'R',single:12,dual:6}),
 Object.freeze({rarity:'Epica',suffix:'E',single:14,dual:7}),
 Object.freeze({rarity:'Leggendaria',suffix:'L',single:16,dual:8})
]);

export const ELEMENTAL_TERRAIN_UPGRADE_RULE=Object.freeze({
 requiredSameModelAndRarityCopies:RARITY_DUPLICATE_COPIES,
 consumedDuplicateCopies:RARITY_DUPLICATE_COPIES-1,
 sourceCopyRemains:true,
 grantsOneCopyAtNextRarity:true,
 needsStellarCredits:true,
 stellarCreditCost:null // Da definire: non usare 0 come prezzo automatico.
});
export const ELEMENTAL_TERRAIN_GLOBAL_RULE=Object.freeze({
 affectsBothPlayers:true,
 onlyOneActive:true,
 permanentUntilReplacedOrCountered:true,
 bonusTriggersOnEveryCompatibleAction:true,
 bonusApplicationsPerAction:1,
 stacksWithItself:false,
 changesMaxHp:false,
 changesHealing:false,
 changesRegeneration:false
});

export const ELEMENTAL_TERRAIN_CARDS=Object.freeze(MODELS.flatMap(([elementId,...names])=>
 MODES.flatMap(mode=>TIERS.map(tier=>{
  const percent=mode.id==='EQ'?tier.dual:tier.single;
  const attackPercent=mode.id==='DEF'?0:percent;
  const defensePercent=mode.id==='ATT'?0:percent;
  const elementName=FLEET_ELEMENTS[elementId]?.name;
  if(!elementName)throw Error('Elemento non esistente per un Terreno: '+elementId);
  const id='ET-'+elementId.toUpperCase()+'-'+mode.id+'-'+tier.suffix;
  const effect=mode.id==='ATT'?'Attacchi':mode.id==='DEF'?'Difese':'Attacchi e difese';
  const description=effect+' di elemento '+elementName+
   ': +'+percent+'%'+(mode.id==='EQ'?' a entrambi':'')+
   '. Effetto continuo per entrambi i giocatori finche questo Terreno resta attivo.';
  return Object.freeze({
   id,cardId:id,name:names[mode.index],nome:names[mode.index],
   category:'Terreno',categoria:'Terreno',sottotipo:'Terreno',
   family:'terrain',kind:'terrain',variant:mode.type,elementId,elementName,
   rarita:tier.rarity,rarity:tier.rarity,visualSymbol:FLEET_ELEMENTS[elementId].symbol,
   nativeFace:true,playable:true,attackPercent,defensePercent,
   description,effectProposed:description,
   effectSpec:Object.freeze({type:'elementalTerrain',cardId:id,elementId,
    attackPercent,defensePercent}),
   permanent:true,affectsBothPlayers:true,
   activationLimitPerTurn:null
  });
 }))
));
export const ELEMENTAL_TERRAIN_BY_ID=Object.freeze(
 Object.fromEntries(ELEMENTAL_TERRAIN_CARDS.map(card=>[card.id,card]))
);
export const terrainElementalCard=id=>ELEMENTAL_TERRAIN_BY_ID[id]||null;
export const terrainNextRarity=rarity=>nextShipRarity(rarity);

if(SHIP_RARITIES.join(',')!=='Comune,Rara,Epica,Leggendaria'||
 MODELS.length!==10||ELEMENTAL_TERRAIN_CARDS.length!==120||
 new Set(ELEMENTAL_TERRAIN_CARDS.map(card=>card.id)).size!==120||
 ELEMENTAL_TERRAIN_CARDS.some(card=>!FLEET_ELEMENTS[card.elementId]))
 throw Error('Catalogo dei Terreni elementali incoerente');
