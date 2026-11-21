// 22 Carte Arma base deliberate il 20 novembre 2026.
// Effetti indipendenti dagli Attacchi, senza illustrazioni provvisorie nel gioco.
import {calibratedWeaponCard} from './weaponBalanceCalibration.js';
import {FLEET_ELEMENTS} from './elementalAffinities.js';
const DESIGNS=[
  {
    "id": "weapon-base-ionic-01",
    "designId": "draft-base-ionic-01-20261120",
    "elementId": "ionic",
    "name": "Cannone a Pettine Ionico di Vega",
    "rarita": "Comune",
    "baseDamage": 20,
    "visualBrief": "Cinque archetti elettrici paralleli convergono in un unico proiettile azzurro; esplosione a griglia sottile"
  },
  {
    "id": "weapon-base-ionic-02",
    "designId": "draft-base-ionic-02-20261120",
    "elementId": "ionic",
    "name": "Lanciadardi a Spirale di Tesla",
    "rarita": "Comune",
    "baseDamage": 24,
    "visualBrief": "Un dardo blu-violetto avvolto da una doppia elica di scintille ruota mentre attraversa il campo"
  },
  {
    "id": "weapon-base-ionic-03",
    "designId": "draft-base-ionic-03-20261120",
    "elementId": "ionic",
    "name": "Sferzatore Ionico di Rame Lunare",
    "rarita": "Comune",
    "baseDamage": 28,
    "visualBrief": "Una frusta di elettricità color rame si piega a zig-zag e si chiude sul bersaglio in un solo impatto"
  },
  {
    "id": "weapon-base-ionic-04",
    "designId": "draft-base-ionic-04-20261120",
    "elementId": "ionic",
    "name": "Cannone del Lampo Bianco",
    "rarita": "Rara",
    "baseDamage": 34,
    "visualBrief": "Un condensatore apre quattro diaframmi e libera un lampo bianco rettilineo con bagliore accecante brevissimo"
  },
  {
    "id": "weapon-base-mineral-01",
    "designId": "draft-base-mineral-01-20261120",
    "elementId": "mineral",
    "name": "Lanciagruppi di Selce",
    "rarita": "Comune",
    "baseDamage": 21,
    "visualBrief": "Una nube di frammenti di selce si compatta a mezz'aria in un unico impatto, con polvere minerale chiara"
  },
  {
    "id": "weapon-base-mineral-02",
    "designId": "draft-base-mineral-02-20261120",
    "elementId": "mineral",
    "name": "Battipalo di Magnetite",
    "rarita": "Comune",
    "baseDamage": 26,
    "visualBrief": "Un palo di roccia ferrosa nera viene scagliato in linea retta e sprigiona scintille color ocra al contatto"
  },
  {
    "id": "weapon-base-mineral-03",
    "designId": "draft-base-mineral-03-20261120",
    "elementId": "mineral",
    "name": "Obice della Crosta Spaccata",
    "rarita": "Rara",
    "baseDamage": 35,
    "visualBrief": "Un guscio di placche rocciose concentriche si richiude e frantuma il bersaglio in una singola esplosione di detriti"
  },
  {
    "id": "weapon-base-aerial-01",
    "designId": "draft-base-aerial-01-20261120",
    "elementId": "aerial",
    "name": "Lancia di Pressione Lamellare",
    "rarita": "Comune",
    "baseDamage": 19,
    "visualBrief": "Una lamina d'aria quasi invisibile lascia soltanto un taglio di rifrazione che attraversa il tavolo"
  },
  {
    "id": "weapon-base-aerial-02",
    "designId": "draft-base-aerial-02-20261120",
    "elementId": "aerial",
    "name": "Cannone Vorticatore a Doppia Turbina",
    "rarita": "Comune",
    "baseDamage": 25,
    "visualBrief": "Due vortici trasparenti controrotanti si fondono davanti alla bocca di fuoco in una raffica unica"
  },
  {
    "id": "weapon-base-aerial-03",
    "designId": "draft-base-aerial-03-20261120",
    "elementId": "aerial",
    "name": "Arpione di Bora Astrale",
    "rarita": "Rara",
    "baseDamage": 33,
    "visualBrief": "Una punta aerodinamica si avvita in una scia argentata con spirali di vapore freddo, senza trascinare la nave"
  },
  {
    "id": "weapon-base-radiant-01",
    "designId": "draft-base-radiant-01-20261120",
    "elementId": "radiant",
    "name": "Raggio Tracciante di Eliotropio",
    "rarita": "Comune",
    "baseDamage": 22,
    "visualBrief": "Un filo laser dorato si accende tra quattro mirini luminosi e produce un punto di impatto netto"
  },
  {
    "id": "weapon-base-radiant-02",
    "designId": "draft-base-radiant-02-20261120",
    "elementId": "radiant",
    "name": "Batteria a Ventaglio di Fotoni Curvi",
    "rarita": "Comune",
    "baseDamage": 27,
    "visualBrief": "Raggi iridescenti disegnano archi separati e convergono tutti sullo stesso bersaglio"
  },
  {
    "id": "weapon-base-radiant-03",
    "designId": "draft-base-radiant-03-20261120",
    "elementId": "radiant",
    "name": "Cannone Incisore dell'Alba",
    "rarita": "Comune",
    "baseDamage": 30,
    "visualBrief": "Una lama triangolare di luce ambrata discende come un'incisione e svanisce in pulviscolo brillante"
  },
  {
    "id": "weapon-base-radiant-04",
    "designId": "draft-base-radiant-04-20261120",
    "elementId": "radiant",
    "name": "Cannone ad Anello del Sole Spezzato",
    "rarita": "Rara",
    "baseDamage": 36,
    "visualBrief": "Un grande anello solare si contrae in una sfera minuscola e scoppia in un unico bagliore al contatto"
  },
  {
    "id": "weapon-base-void-01",
    "designId": "draft-base-void-01-20261120",
    "elementId": "void",
    "name": "Perforatore dell'Antiluce",
    "rarita": "Comune",
    "baseDamage": 18,
    "visualBrief": "Un ago nero assorbe per un istante le stelle lungo la traiettoria; nessuna perforazione delle Difese"
  },
  {
    "id": "weapon-base-void-02",
    "designId": "draft-base-void-02-20261120",
    "elementId": "void",
    "name": "Cannone di Cenere Nera",
    "rarita": "Comune",
    "baseDamage": 23,
    "visualBrief": "Un nucleo di scorie scure con braci viola percorre il campo e si disgrega al contatto"
  },
  {
    "id": "weapon-base-void-03",
    "designId": "draft-base-void-03-20261120",
    "elementId": "void",
    "name": "Lama d’Eclisse Franta",
    "rarita": "Comune",
    "baseDamage": 29,
    "visualBrief": "Un arco a mezzaluna opaco taglia l'immagine in diagonale, poi si dissolve in schegge d'ombra"
  },
  {
    "id": "weapon-base-void-04",
    "designId": "draft-base-void-04-20261120",
    "elementId": "void",
    "name": "Fucile del Crepuscolo Profondo",
    "rarita": "Rara",
    "baseDamage": 37,
    "visualBrief": "Un impulso quasi invisibile inverte brevemente i colori dello spazio dietro il bersaglio al momento dell'impatto"
  },
  {
    "id": "weapon-base-gravity-01",
    "designId": "draft-base-gravity-01-20261120",
    "elementId": "gravity",
    "name": "Martello a Massa Piegata",
    "rarita": "Comune",
    "baseDamage": 22,
    "visualBrief": "Rottami sospesi si raggruppano in un martello di gravità che si schianta sul bersaglio"
  },
  {
    "id": "weapon-base-gravity-02",
    "designId": "draft-base-gravity-02-20261120",
    "elementId": "gravity",
    "name": "Cannone Fusore a Orbite Gemelle",
    "rarita": "Comune",
    "baseDamage": 26,
    "visualBrief": "Due piccoli nuclei in orbita si fondono in un'unica sfera d'urto, senza colpi secondari"
  },
  {
    "id": "weapon-base-gravity-03",
    "designId": "draft-base-gravity-03-20261120",
    "elementId": "gravity",
    "name": "Emettitore a Catenaria di Distorsione",
    "rarita": "Comune",
    "baseDamage": 31,
    "visualBrief": "Una linea di spazio incurvato avanza come un'onda geometrica e si chiude in un punto"
  },
  {
    "id": "weapon-base-gravity-04",
    "designId": "draft-base-gravity-04-20261120",
    "elementId": "gravity",
    "name": "Obice a Compressione Assiale",
    "rarita": "Rara",
    "baseDamage": 38,
    "visualBrief": "Un cono di gravità deforma otticamente il bersaglio verso il centro, poi rilascia una singola onda circolare"
  }
];
const COPIES=Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
export const APPROVED_BASE_WEAPONS=Object.freeze(DESIGNS.map(s=>{
 const element=FLEET_ELEMENTS[s.elementId];
 if(!element||!COPIES[s.rarita]||!Number.isInteger(s.baseDamage)||s.baseDamage<=0)
  throw Error('Carta Arma base non valida: '+s.id);
 return calibratedWeaponCard(Object.freeze({
  id:s.id,designId:s.designId,name:s.name,nome:s.name,
  category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
  kind:'support',playable:true,nativeFace:true,rarita:s.rarita,
  rarityPending:false,acquisitionPending:false,maxCopiesPerDeck:COPIES[s.rarita],
  elementId:s.elementId,visualKey:element.vfx,visualSymbol:element.symbol,
  visualBrief:s.visualBrief+' · Modello 3D finale ancora da realizzare.',
  effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,
   damageMode:'base-shot',elementId:s.elementId,baseDamage:s.baseDamage,durationTurns:1}),
  effectProposed:'Arma '+element.name+': infligge un colpo autonomo da '+s.baseDamage+
   ' HP nominali a un bersaglio avversario. Un solo impatto alla risoluzione del turno; Difese, Trappole, supporti e Terreni si applicano normalmente.'
 }));
}));
export const APPROVED_BASE_WEAPON_BY_ID=Object.freeze(Object.fromEntries(
 APPROVED_BASE_WEAPONS.map(c=>[c.id,c])));
if(APPROVED_BASE_WEAPONS.length!==22||Object.keys(APPROVED_BASE_WEAPON_BY_ID).length!==22)
 throw Error('Registro Armi base non completo');
