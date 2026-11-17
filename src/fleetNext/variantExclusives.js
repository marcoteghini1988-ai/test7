// Nove carte originali per ciascuna delle cinque varianti; il Personaggio ex-* resta invariato.
// Effetti volutamente brevi, eseguibili dal motore delle carte semplici (nessun blueprint fittizio).
import {describeEffect,validateEffectSpec} from './simpleEffects.js';

const VARIANT_DESIGNS=[
 [
  "C04",
  "Dardo Cremisi",
  "Comune",
  [
   [
    "Raffica cremisi",
    "Attacco",
    {
     "type": "power",
     "amount": 1
    },
    "I propulsori spalancano una doppia scia rossa."
   ],
   [
    "Mira incandescente",
    "Attacco",
    {
     "type": "pierce",
     "amount": 1
    },
    "Il mirino di bordo apre un varco nella protezione."
   ],
   [
    "Paratia lampo",
    "Difesa",
    {
     "type": "protect",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Una lastra rossa si espande davanti alla madre."
   ],
   [
    "Disturbo termico",
    "Tattica",
    {
     "type": "weaken",
     "amount": 1
    },
    "L'onda di calore altera il tiro nemico."
   ],
   [
    "Ricalcolo cremisi",
    "Tattica",
    {
     "type": "exchange",
     "amount": 1
    },
    "Una carta scartata si trasforma in nuova pescata."
   ],
   [
    "Soccorso del dardo",
    "Tattica",
    {
     "type": "repair",
     "target": "escort",
     "amount": 1
    },
    "Un drone raggiunge il supporto danneggiato."
   ],
   [
    "Impulso preparato",
    "Attacco",
    {
     "type": "charge",
     "amount": 1
    },
    "Un condensatore rosso immagazzina energia per il turno successivo."
   ],
   [
    "Contromossa scarlatta",
    "Difesa",
    {
     "type": "counter",
     "amount": 1,
     "turns": 1
    },
    "La paratia rimanda una scarica verso le armi nemiche."
   ],
   [
    "Serratura solare",
    "Tattica",
    {
     "type": "disarm"
    },
    "Un'interferenza magnetica arresta l'attacco avversario."
   ]
  ]
 ],
 [
  "R03",
  "Iride",
  "Rara",
  [
   [
    "Prisma di cura",
    "Tattica",
    {
     "type": "repair",
     "target": "escort",
     "amount": 1
    },
    "Un raggio iridescente ripara una scudiera."
   ],
   [
    "Schermo rifrangente",
    "Difesa",
    {
     "type": "protect",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Un prisma protegge le strutture della madre."
   ],
   [
    "Tiro iridato",
    "Attacco",
    {
     "type": "power",
     "amount": 1
    },
    "Un fascio arcobaleno converge sul bersaglio."
   ],
   [
    "Lente di precisione",
    "Attacco",
    {
     "type": "pierce",
     "amount": 1
    },
    "La lente concentra il colpo fra due corazze."
   ],
   [
    "Risonanza azzurra",
    "Tattica",
    {
     "type": "weaken",
     "amount": 1
    },
    "Onde azzurre disturbano le armi avversarie."
   ],
   [
    "Rifrazione vitale",
    "Difesa",
    {
     "type": "regenerate",
     "trigger": "hit",
     "amount": 1,
     "turns": 1
    },
    "La luce del primo colpo ripara il componente danneggiato."
   ],
   [
    "Scambio prismatico",
    "Tattica",
    {
     "type": "exchange",
     "amount": 1
    },
    "Un ologramma sostituisce una carta della mano."
   ],
   [
    "Luce ritardata",
    "Attacco",
    {
     "type": "charge",
     "amount": 1
    },
    "Un cristallo carica l'attacco del turno successivo."
   ],
   [
    "Trappola speculare",
    "Trappola",
    {
     "type": "trap",
     "trigger": "terrain",
     "action": "cancel"
    },
    "Una superficie a specchio impedisce l'ingresso di un terreno."
   ]
  ]
 ],
 [
  "E03",
  "Fenice",
  "Epica",
  [
   [
    "Ala di fiamma",
    "Attacco",
    {
     "type": "power",
     "amount": 1
    },
    "La Fenice apre le ali e accende i cannoni."
   ],
   [
    "Schermo di cenere",
    "Difesa",
    {
     "type": "protect",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Una nuvola ardente arresta il primo colpo."
   ],
   [
    "Rinascita termica",
    "Difesa",
    {
     "type": "regenerate",
     "trigger": "hurt",
     "amount": 1,
     "turns": 1
    },
    "Le scintille riparano dopo aver subito un danno."
   ],
   [
    "Soffio di brace",
    "Tattica",
    {
     "type": "weaken",
     "amount": 1
    },
    "Un vortice incandescente turba l'attacco avversario."
   ],
   [
    "Scambio di scintille",
    "Tattica",
    {
     "type": "exchange",
     "amount": 1
    },
    "Una carta si consuma e ne appare una nuova."
   ],
   [
    "Folgore di cenere",
    "Attacco",
    {
     "type": "pierce",
     "amount": 1
    },
    "Una saetta attraversa uno strato protettivo."
   ],
   [
    "Conversione termica",
    "Tattica",
    {
     "type": "repair",
     "target": "escort",
     "amount": 1
    },
    "Il calore diventa energia di riparazione per una scudiera."
   ],
   [
    "Controfiamma",
    "Difesa",
    {
     "type": "counter",
     "amount": 1,
     "turns": 1
    },
    "La barriera sprigiona un colpo di ritorno."
   ],
   [
    "Cannone delle ceneri",
    "Tattica",
    {
     "type": "deployMachine",
     "hp": 4,
     "power": 1
    },
    "Un cannone temporaneo rinasce dalle braci."
   ]
  ]
 ],
 [
  "E04",
  "Orizzonte",
  "Epica",
  [
   [
    "Bastione frontale",
    "Difesa",
    {
     "type": "protect",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Una barriera geometrica si chiude davanti alla madre."
   ],
   [
    "Scarto d'orizzonte",
    "Difesa",
    {
     "type": "dodge",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "La flotta scivola fuori dall'asse del colpo."
   ],
   [
    "Faro di tiro",
    "Attacco",
    {
     "type": "pierce",
     "amount": 1
    },
    "Un faro apre una linea precisa fra le difese."
   ],
   [
    "Impatto della fortezza",
    "Attacco",
    {
     "type": "power",
     "amount": 1
    },
    "Il bastione libera una salva compatta."
   ],
   [
    "Interdizione obliqua",
    "Tattica",
    {
     "type": "weaken",
     "amount": 1
    },
    "Una griglia energetica scompone il tiro nemico."
   ],
   [
    "Ripara-baluardo",
    "Tattica",
    {
     "type": "repair",
     "target": "escort",
     "amount": 1
    },
    "Bracci di servizio intervengono sulla scudiera ferita."
   ],
   [
    "Freno del vuoto",
    "Tattica",
    {
     "type": "disarm"
    },
    "Un blocco gravitazionale ferma l'attacco successivo."
   ],
   [
    "Ritorsione del bastione",
    "Difesa",
    {
     "type": "counter",
     "amount": 1,
     "turns": 1
    },
    "La corazza restituisce energia al nemico."
   ],
   [
    "Carica portante",
    "Attacco",
    {
     "type": "charge",
     "amount": 2
    },
    "Un nucleo massiccio accumula energia per il turno dopo."
   ]
  ]
 ],
 [
  "L02",
  "Singolarità",
  "Leggendaria",
  [
   [
    "Taglio di singolarità",
    "Attacco",
    {
     "type": "pierce",
     "amount": 1
    },
    "La gravità apre una fenditura nella protezione."
   ],
   [
    "Pressione gravitazionale",
    "Tattica",
    {
     "type": "weaken",
     "amount": 2
    },
    "Una sfera oscura riduce la potenza nemica."
   ],
   [
    "Scudo di curvatura",
    "Difesa",
    {
     "type": "dodge",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Lo spazio incurvato devia il colpo."
   ],
   [
    "Frattura temporale",
    "Attacco",
    {
     "type": "power",
     "amount": 2
    },
    "Due impulsi attraversano un istante sospeso."
   ],
   [
    "Scambio di orbite",
    "Tattica",
    {
     "type": "exchange",
     "amount": 2
    },
    "Due carte ruotano nell'orbita di una stella nera."
   ],
   [
    "Orbite difensive",
    "Difesa",
    {
     "type": "protect",
     "target": "all",
     "amount": 1,
     "turns": 1
    },
    "Anelli gravitazionali avvolgono la nave madre."
   ],
   [
    "Blocco del nucleo",
    "Tattica",
    {
     "type": "disarm"
    },
    "Il nucleo trattiene l'attacco nemico in un vortice."
   ],
   [
    "Curvatura riflessa",
    "Difesa",
    {
     "type": "counter",
     "amount": 1,
     "turns": 1
    },
    "L'energia del colpo torna verso le armi avversarie."
   ],
   [
    "Satellite di antimateria",
    "Tattica",
    {
     "type": "deployMachine",
     "hp": 5,
     "power": 1
    },
    "Un satellite temporaneo carica l'arsenale."
   ]
  ]
 ]
];
const KIND={Attacco:'attack',Difesa:'defense',Trappola:'defense',Tattica:'support'};
const entries=VARIANT_DESIGNS.flatMap(([shipId,shipName,rarity,designs])=>
 designs.map(([name,category,effectSpec,visualBrief],index)=>{
  const number=index+2;
  const id='nx-'+shipId.toLowerCase()+'-'+String(number).padStart(2,'0');
  const minShipLevelDraft=number<=6?1:number-5;
  const requiredEscortCount=number>=9?2:number>=7?1:0;
  const requiredOwnParts=number>=7?Object.freeze(['command']):Object.freeze([]);
  const requirements=requiredEscortCount
   ?'Richiede Centralina attiva e '+requiredEscortCount+' navicell'+(requiredEscortCount===1?'a':'e')+' di supporto operative.'
   :'Nessun supporto aggiuntivo richiesto.';
  const c={id,shipId,shipName,name,nome:name,category,kind:KIND[category],
   rarityDraft:rarity,effectSpec:Object.freeze(effectSpec),minShipLevelDraft,
   requiredOwnParts,requiredEscortCount,requirements,
   maxCopiesInAutoPackageDraft:1,upgradeType:'manual_only_ship_exclusive',
   visualBrief,counterplay:'L’avversario può bloccare il colpo, impedire il requisito o neutralizzare il sistema interessato.',
   nativeFace:true,playable:true,exclusiveToShip:true,status:'simple-effect-executable-v1'};
  const invalid=validateEffectSpec(c.effectSpec);
  if(invalid)throw Error(id+': '+invalid);
  return Object.freeze({...c,effectProposed:describeEffect(c)});
 }));
export const VARIANT_EXCLUSIVE_CARDS=Object.freeze(Object.fromEntries(entries.map(c=>[c.id,c])));
export const VARIANT_EXCLUSIVE_IDS=Object.freeze(VARIANT_DESIGNS.map(row=>row[0]));
if(entries.length!==45||Object.keys(VARIANT_EXCLUSIVE_CARDS).length!==45||
 VARIANT_EXCLUSIVE_IDS.some(id=>entries.filter(c=>c.shipId===id).length!==9))
 throw Error('Carte esclusive delle cinque varianti incomplete');
