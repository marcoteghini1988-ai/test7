// Registro delle 35 Armi progettate nel novembre 2026 e assenti dal motore.
// Non importa la proposta storica da 100: contiene Carte Attacco non approvate.
// Gli effetti senza danno/costo/timing definito sono visibili come PROGETTO,
// ma non possono essere giocati né acquistati: niente potenza inventata.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
const DESIGNS=[
  {
    "id": "weapon-designed-plasma-mortaio-magmatico",
    "elementId": "plasma",
    "name": "Mortaio Magmatico",
    "rarita": "Rara",
    "profile": null,
    "description": "Mortaio di tre turni con colpo base e raffiche alimentate esclusivamente da Energia Fuoco. Da scegliere colpo per carta fisica oppure per carica e HP dei colpi.",
    "durationTurns": 3,
    "onlyEnergy": "plasma",
    "physicalCardOrCharge": "da definire"
  },
  {
    "id": "weapon-designed-plasma-inceneritore-rotante",
    "elementId": "plasma",
    "name": "Inceneritore a Plasma Rotante",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma di due turni; applica bruciatura per cinque turni. Il danno della bruciatura è calcolato una volta sugli scarti al momento dell'applicazione (2 HP per carta nell'esempio da confermare).",
    "durationTurns": 2,
    "burnTurns": 5,
    "referenceDamagePerDiscard": 2
  },
  {
    "id": "weapon-designed-plasma-sistema-binario",
    "elementId": "plasma",
    "name": "Sistema Binario a Sovraccarico",
    "rarita": "Da definire",
    "profile": null,
    "description": "Ciclo di cinque turni propri: sovraccarichi percentuali e perdite di HP alleati, anche letali; ultimo turno supercolpo alle navicelle nemiche. Tempi e priorità non ancora collaudati.",
    "durationTurns": 5,
    "proposedPhases": [
      "8% danno",
      "-6% HP madre",
      "16% danno",
      "-4% HP massimi alleati",
      "20% HP massimi a ogni nemica"
    ]
  },
  {
    "id": "weapon-designed-plasma-accoppiatore-termofagico",
    "elementId": "plasma",
    "name": "Accoppiatore Termofagico",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma gemella del Sistema Binario, giocabile solo dopo la prima; ricarica con sottrazione di HP e possibilità di recupero. Manca il danno finale e la scelta degli slot.",
    "prerequisite": "sistema-binario"
  },
  {
    "id": "weapon-designed-plasma-obice-crogiolo",
    "elementId": "plasma",
    "name": "Obice a Crogiolo Pressurizzato",
    "rarita": "Da definire",
    "profile": {
      "pattern": "target-dependent",
      "supportDamage": 32,
      "motherDamage": 22
    },
    "description": "Colpo autonomo: 32 HP contro una navicella di supporto, 22 HP contro la nave madre; senza consumo Energia o bruciatura."
  },
  {
    "id": "weapon-designed-plasma-batteria-tre-ugelli",
    "elementId": "plasma",
    "name": "Batteria Termica a Tre Ugelli",
    "rarita": "Rara",
    "profile": {
      "pattern": "multi",
      "baseDamage": 12,
      "shots": 3
    },
    "description": "Tre colpi autonomi da 12 HP, risolti separatamente con le Difese."
  },
  {
    "id": "weapon-designed-plasma-lanciafiamme-ventaglio",
    "elementId": "plasma",
    "name": "Lanciafiamme a Ventaglio",
    "rarita": "Comune",
    "profile": {
      "pattern": "sweep",
      "baseDamage": 14
    },
    "description": "Un colpo da 14 HP su ciascuna navicella avversaria operativa, incluse le due di supporto e la madre."
  },
  {
    "id": "weapon-designed-plasma-torretta-piroclastica",
    "elementId": "plasma",
    "name": "Torretta di Puntamento Piroclastico",
    "rarita": "Rara",
    "profile": {
      "pattern": "character",
      "baseDamage": 26,
      "bonusPercent": 35,
      "characterName": "Artificiere"
    },
    "description": "Un colpo da 26 HP, aumentato del 35% se il Personaggio Artificiere di Bordo è effettivamente attivo."
  },
  {
    "id": "weapon-designed-plasma-condensatore-pirobalistico",
    "elementId": "plasma",
    "name": "Condensatore Pirobalistico",
    "rarita": "Rara",
    "profile": {
      "pattern": "energy-tier",
      "damages": [
        18,
        30,
        42
      ],
      "maxEnergy": 2
    },
    "description": "Un colpo da 18/30/42 HP secondo 0/1/2 Energie Fuoco fisiche disponibili; consumo futuro da definire."
  },
  {
    "id": "weapon-designed-cryogenic-ago-inverno-nero",
    "elementId": "cryogenic",
    "name": "Ago dell'Inverno Nero",
    "rarita": "Da definire",
    "profile": null,
    "description": "Colpisce i due supporti nemici. Con Terreno Ghiaccio migliora i danni e aggiunge un perforante sulla madre pari alla somma dei due colpi; quattro rarità in evoluzione, danni da fissare.",
    "rarityEvolution": [
      "Comune",
      "Rara",
      "Epica",
      "Leggendaria"
    ]
  },
  {
    "id": "weapon-designed-cryogenic-cannone-condensazione",
    "elementId": "cryogenic",
    "name": "Cannone a Condensazione Glaciale",
    "rarita": "Da definire",
    "profile": {
      "pattern": "single",
      "baseDamage": 20
    },
    "description": "Un colpo Ghiaccio da 20 HP nominali sul bersaglio scelto; valori di bilanciamento provvisori."
  },
  {
    "id": "weapon-designed-cryogenic-batteria-dardi-polari",
    "elementId": "cryogenic",
    "name": "Batteria di Dardi Polari",
    "rarita": "Da definire",
    "profile": {
      "pattern": "spread",
      "baseDamage": 8,
      "shots": 3
    },
    "description": "Tre colpi da 8 HP distribuibili fra madre e supporti, ciascuno soggetto alle Difese."
  },
  {
    "id": "weapon-designed-cryogenic-acceleratore-boreale",
    "elementId": "cryogenic",
    "name": "Acceleratore Boreale Binario",
    "rarita": "Da definire",
    "profile": null,
    "description": "Carta Arma Ghiaccio a scarica binaria progettata; sequenza degli attacchi e danni ancora da chiudere."
  },
  {
    "id": "weapon-designed-cryogenic-compressore-impulso",
    "elementId": "cryogenic",
    "name": "Compressore Criogenico a Impulso",
    "rarita": "Rara",
    "profile": {
      "pattern": "energy-charge-burst",
      "baseDamage": 18,
      "bonusDamage": 10,
      "maxBonus": 2
    },
    "description": "Un colpo da 18 HP più 10 HP per carica Ghiaccio presente, fino a due cariche; consumo non specificato, non sottrae Energie automaticamente."
  },
  {
    "id": "weapon-designed-refrigerant-idrocannone-doppia-mandata",
    "elementId": "refrigerant",
    "name": "Idrocannone a Doppia Mandata",
    "rarita": "Da definire",
    "profile": {
      "pattern": "repeat",
      "baseDamage": 18
    },
    "description": "Un colpo da 18 HP per due turni propri consecutivi; due colpi totali.",
    "durationTurns": 2
  },
  {
    "id": "weapon-designed-refrigerant-torretta-crioguidata",
    "elementId": "refrigerant",
    "name": "Torretta Crioguidata",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Acqua trasferita dal Ghiaccio; con Personaggio compatibile può sparare un secondo colpo su un altro bersaglio. Danni ancora da definire."
  },
  {
    "id": "weapon-designed-refrigerant-bassa-marea",
    "elementId": "refrigerant",
    "name": "Bassa Marea",
    "rarita": "Da definire",
    "profile": null,
    "description": "Prima arma della coppia su due turni consecutivi; accumula la potenza dagli scarti reali dei due giocatori. Base HP per scarto da definire.",
    "combo": "alta-marea"
  },
  {
    "id": "weapon-designed-refrigerant-alta-marea",
    "elementId": "refrigerant",
    "name": "Alta Marea",
    "rarita": "Da definire",
    "profile": null,
    "description": "Seconda arma della coppia: deve seguire Bassa Marea al turno proprio successivo, travolge Difese e Trappole di entrambi e moltiplica la potenza accumulata fino a quattro volte. Danno base non definito.",
    "combo": "bassa-marea",
    "maxMultiplier": 4
  },
  {
    "id": "weapon-designed-refrigerant-diffusore-marea",
    "elementId": "refrigerant",
    "name": "Diffusore di Marea a Ventaglio",
    "rarita": "Rara",
    "profile": {
      "pattern": "energy-fan",
      "damages": [
        24,
        18,
        16
      ],
      "maxEnergy": 2
    },
    "description": "Con zero/una/due Energie Acqua in pila colpisce rispettivamente una nave da 24 HP, due navi da 18 HP ciascuna, o tre navi da 16 HP ciascuna. Energie non consumate finché non è definito il relativo costo."
  },
  {
    "id": "weapon-designed-refrigerant-ariete-fosse",
    "elementId": "refrigerant",
    "name": "Ariete delle Fosse Abissali",
    "rarita": "Da definire",
    "profile": {
      "pattern": "energy-tier",
      "damages": [
        22,
        36,
        48
      ],
      "maxEnergy": 2
    },
    "description": "Un colpo da 22/36/48 HP secondo zero/una/due Energie Acqua presenti. Valori da bilanciare."
  },
  {
    "id": "weapon-designed-metallic-artiglieria-schegge",
    "elementId": "metallic",
    "name": "Artiglieria delle Schegge Erranti",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Metallo trasferita dal Ghiaccio, attacco distribuito su due turni; danno per colpo da precisare. Non è combinata con Recuperatore Termobalistico.",
    "durationTurns": 2
  },
  {
    "id": "weapon-designed-metallic-recuperatore-termobalistico",
    "elementId": "metallic",
    "name": "Recuperatore Termobalistico",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Metallo trasferita da Fuoco; trasforma i danni subiti realmente dalla propria flotta in potenza offensiva. Formula numerica non fissata, non combinata con Artiglieria."
  },
  {
    "id": "weapon-designed-metallic-rivetti-magnetici",
    "elementId": "metallic",
    "name": "Batteria di Rivetti Magnetici",
    "rarita": "Comune",
    "profile": {
      "pattern": "spread",
      "baseDamage": 10,
      "shots": 3
    },
    "description": "Tre colpi autonomi da 10 HP distribuibili tra bersagli diversi."
  },
  {
    "id": "weapon-designed-metallic-obice-pioggia-schegge",
    "elementId": "metallic",
    "name": "Obice a Pioggia di Schegge",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma base Metallo già nominata e progettata; valore numerico del colpo non rintracciato con certezza."
  },
  {
    "id": "weapon-designed-metallic-ganasce-magnetiche",
    "elementId": "metallic",
    "name": "Ganasce Magnetiche",
    "rarita": "Da definire",
    "profile": null,
    "description": "Prima arma della coppia Metallo: due arpioni agganciano due navicelle, infliggendo danni; prepara la collisione nel turno proprio successivo. Valori HP mancanti.",
    "combo": "collassatore-lega"
  },
  {
    "id": "weapon-designed-metallic-collassatore-lega",
    "elementId": "metallic",
    "name": "Collassatore di Lega",
    "rarita": "Da definire",
    "profile": null,
    "description": "Seconda arma della coppia Metallo: dopo Ganasce Magnetiche attiva il campo e fa collidere le navicelle agganciate. Danno e soglie non fissati.",
    "combo": "ganasce-magnetiche"
  },
  {
    "id": "weapon-designed-metallic-frantumatore-induzione",
    "elementId": "metallic",
    "name": "Frantumatore a Induzione",
    "rarita": "Da definire",
    "profile": {
      "pattern": "induction",
      "baseDamage": 22
    },
    "description": "Un colpo da 22 HP. Con una Energia Metallo supera una Difesa valida, con due la distrugge e colpisce. Valori da bilanciare."
  },
  {
    "id": "weapon-designed-metallic-perforatore-cascata",
    "elementId": "metallic",
    "name": "Perforatore a Cascata",
    "rarita": "Da definire",
    "profile": null,
    "description": "Un colpo può trasferire HP eccedenti al bersaglio successivo consumando Energia Metallo, ma colpo iniziale, durata e costo preciso non sono definitivi. Difese e Trappole valgono per ogni bersaglio.",
    "damageReference": 35,
    "durationConflict": [
      1,
      3
    ]
  },
  {
    "id": "weapon-designed-metallic-impatto-comandante",
    "elementId": "metallic",
    "name": "Impatto del Comandante d'Acciaio",
    "rarita": "Da definire",
    "profile": {
      "pattern": "character-health",
      "damages": [
        26,
        34,
        42
      ],
      "thresholds": [
        25,
        50
      ],
      "characterName": "Comandante"
    },
    "description": "Colpo autonomo da 26 HP. Con Personaggio Comandante compatibile, il danno sale a 34 HP se la madre ha perso almeno il 25% degli HP o a 42 HP se ne ha persi almeno il 50%."
  },
  {
    "id": "weapon-designed-ionic-nucleo-folgore",
    "elementId": "ionic",
    "name": "Nucleo della Folgore Crescente",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Fulmine per tre turni: nuova Energia nei turni successivi consente la supercarica; se manca, resta al danno minimo fino alla scadenza senza riprendere la progressione. Danni non fissati.",
    "durationTurns": 3,
    "energyEveryNewTurn": true
  },
  {
    "id": "weapon-designed-ionic-sonda-ionica",
    "elementId": "ionic",
    "name": "Sonda Ionica",
    "rarita": "Da definire",
    "profile": null,
    "description": "Prima delle due Armi Fulmine combinabili con Martello del Tuono; effetto di coppia e danni da definire.",
    "combo": "martello-tuono"
  },
  {
    "id": "weapon-designed-ionic-martello-tuono",
    "elementId": "ionic",
    "name": "Martello del Tuono",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Fulmine combinabile con Sonda Ionica; danno e sequenza della combinazione da definire.",
    "combo": "sonda-ionica"
  },
  {
    "id": "weapon-designed-ionic-lancia-comando-ionico",
    "elementId": "ionic",
    "name": "Lancia del Comando Ionico",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Fulmine collegata a un Personaggio compatibile; meccanica numerica da definire."
  },
  {
    "id": "weapon-designed-ionic-condensatore-tempesta",
    "elementId": "ionic",
    "name": "Condensatore della Tempesta Stellare",
    "rarita": "Da definire",
    "profile": null,
    "description": "Arma Fulmine per tre turni, alimentata da una Energia per turno; più navicelle alleate operative ne amplificano il danno senza sacrificare HP. Danno base ancora da definire.",
    "durationTurns": 3,
    "consumeEnergyEachTurn": 1
  },
  {
    "id": "weapon-designed-ionic-giudizio-temporale",
    "elementId": "ionic",
    "name": "Giudizio del Temporale",
    "rarita": "Da definire",
    "profile": {
      "pattern": "percent",
      "damagePercent": 20
    },
    "description": "Una scarica autonoma nominale pari al 20% degli HP massimi del bersaglio (esempio 1000→200 HP). La carta occupa lo slot fino a 3 turni; non spara di nuovo senza ulteriore giocata. Difese applicabili.",
    "durationTurns": 3,
    "activationTimingPending": true
  }
];
const RARITY_LIMIT={"Comune":5,"Rara":4,"Epica":3,"Leggendaria":2};
const MODES=Object.freeze(['single','multi','sweep','character','energy-tier',
 'target-dependent','spread','energy-charge-burst','repeat','energy-fan',
 'induction','character-health','percent']);
export const DESIGNED_WEAPON_CARDS=Object.freeze(DESIGNS.map(s=>{
 const element=FLEET_ELEMENTS[s.elementId];
 if(!element||s.profile&&!MODES.includes(s.profile.pattern))throw Error('Progetto Arma non valido: '+s.id);
 const playable=!!s.profile;
 const p=playable?Object.freeze({...s.profile}):null;
 const spec=playable?Object.freeze({type:'deployMachine',hp:1,power:0,
  elementId:s.elementId,damageMode:'designed-shot',durationTurns:s.durationTurns||1,
  weaponProfile:p}):Object.freeze({type:'plannedWeapon',elementId:s.elementId,
  review:'Richiede valori di danno/costo/durata già deliberati'});
 return Object.freeze({id:s.id,name:s.name,nome:s.name,
  category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',kind:'support',
  elementId:s.elementId,visualKey:element.vfx,visualSymbol:element.symbol,
  rarita:s.rarita,rarityPending:!Object.hasOwn(RARITY_LIMIT,s.rarita),
  playable,nativeFace:true,acquisitionPending:true,balancePending:true,
  reviewRequired:!playable,designOnly:!playable,
  maxCopiesPerDeck:RARITY_LIMIT[s.rarita]||1,
  effectSpec:spec,effectProposed:s.description,
  designNotes:Object.freeze({durationTurns:s.durationTurns||null,
   combo:s.combo||null,damageReference:s.damageReference||null,
   durationConflict:s.durationConflict||null,activationTimingPending:!!s.activationTimingPending,
   source:'Decisioni Carte Arma 19-20 novembre 2026'})
 });
}));
export const DESIGNED_WEAPON_BY_ID=Object.freeze(Object.fromEntries(
 DESIGNED_WEAPON_CARDS.map(c=>[c.id,c])));
export const DESIGNED_WEAPONS_PLAYABLE=Object.freeze(DESIGNED_WEAPON_CARDS.filter(c=>c.playable));
export const DESIGNED_WEAPONS_PENDING=Object.freeze(DESIGNED_WEAPON_CARDS.filter(c=>!c.playable));
if(DESIGNED_WEAPON_CARDS.length!==35||DESIGNED_WEAPONS_PLAYABLE.length!==15||
 DESIGNED_WEAPONS_PENDING.length!==20||Object.keys(DESIGNED_WEAPON_BY_ID).length!==35)
 throw Error('Registro delle armi progettate incompleto');
