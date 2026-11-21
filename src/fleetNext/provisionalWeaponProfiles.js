// Eclissi Stellare — statistiche temporanee approvate per il collaudo delle 21 Armi.
// I valori non sono il bilanciamento finale. NON creare carte aggiuntive.
const RAW=[
  {
    "id": "weapon-designed-plasma-mortaio-magmatico",
    "name": "Mortaio Magmatico",
    "rarita": "Rara",
    "profile": {
      "pattern": "magma-mortar",
      "baseDamage": 20,
      "extraDamage": 8,
      "ammoMode": "per-charge",
      "maxExtraShots": 99,
      "durationTurns": 3,
      "provisional": true
    },
    "description": "Per 3 tuoi turni spara 20 HP. Ogni carica fisica Energia Fuoco disponibile produce un colpo extra da 8 HP e viene consumata; le Energie di altri elementi restano nella pila."
  },
  {
    "id": "weapon-designed-plasma-inceneritore-rotante",
    "name": "Inceneritore a Plasma Rotante",
    "rarita": "Epica",
    "profile": {
      "pattern": "incinerator",
      "baseDamage": 22,
      "secondDamage": 16,
      "burnTurns": 5,
      "burnPerDiscard": 2,
      "burnMinimum": 2,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Spara 22 HP e 16 HP al turno successivo. Il primo colpo riuscito applica una bruciatura di 5 turni: 2 HP per propria Carta Attacco negli scarti al momento dell'impatto, minimo 2 HP, senza ricalcolo."
  },
  {
    "id": "weapon-designed-plasma-sistema-binario",
    "name": "Sistema Binario a Sovraccarico",
    "rarita": "Leggendaria",
    "profile": {
      "pattern": "binary-overload",
      "baseDamage": 20,
      "damageStages": [
        8,
        0,
        16,
        0,
        20
      ],
      "durationTurns": 5,
      "motherCostPercent": 6,
      "allyCostPercent": 4,
      "provisional": true
    },
    "description": "Per 5 tuoi turni: colpo dell'8% degli HP massimi nemici, perdita del 6% degli HP massimi della tua madre, colpo del 16%, perdita del 4% degli HP massimi di ogni alleata operativa, poi 20% a ogni nave nemica. I costi possono essere letali."
  },
  {
    "id": "weapon-designed-plasma-accoppiatore-termofagico",
    "name": "Accoppiatore Termofagico",
    "rarita": "Epica",
    "profile": {
      "pattern": "thermal-coupler",
      "baseDamage": 20,
      "durationTurns": 2,
      "motherCostPercent": 3,
      "healOnHitPercent": 2,
      "binarioBonusDamage": 30,
      "provisional": true
    },
    "description": "Richiede Sistema Binario installato. Spara 20 HP per 2 tuoi turni, costa il 3% HP massimi della madre al primo utilizzo e restituisce il 2% HP massimi se colpisce. Potenzia di 30 HP il colpo finale del Binario."
  },
  {
    "id": "weapon-designed-cryogenic-ago-inverno-nero",
    "name": "Ago dell'Inverno Nero",
    "rarita": "Comune",
    "profile": {
      "pattern": "ice-needle",
      "baseDamage": 12,
      "supportDamage": 12,
      "terrainSupportDamage": 15,
      "durationTurns": 1,
      "rarityEvolution": [
        "Comune",
        "Rara",
        "Epica",
        "Leggendaria"
      ],
      "provisional": true
    },
    "description": "Colpisce entrambi i supporti per 12 HP ciascuno. Con Terreno Ghiaccio: 15 HP ciascuno e 30 HP perforanti alla madre; il perforante ignora le Difese ordinarie. Danni per rarità da ribilanciare."
  },
  {
    "id": "weapon-designed-cryogenic-acceleratore-boreale",
    "name": "Acceleratore Boreale Binario",
    "rarita": "Rara",
    "profile": {
      "pattern": "boreal-binary",
      "baseDamage": 13,
      "secondDamage": 17,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Lancia due colpi Ghiaccio autonomi da 13 e 17 HP; preferisce due bersagli diversi, ognuno con una verifica difensiva."
  },
  {
    "id": "weapon-designed-refrigerant-torretta-crioguidata",
    "name": "Torretta Crioguidata",
    "rarita": "Rara",
    "profile": {
      "pattern": "character-turret",
      "baseDamage": 22,
      "extraDamage": 14,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Spara 22 HP. Con un Personaggio attivo spara anche 14 HP su un bersaglio diverso, se disponibile."
  },
  {
    "id": "weapon-designed-refrigerant-bassa-marea",
    "name": "Bassa Marea",
    "rarita": "Rara",
    "profile": {
      "pattern": "low-tide",
      "baseDamage": 14,
      "damagePerDiscard": 2,
      "maxDiscardCards": 30,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Un colpo da 14 HP e 2 HP extra per ciascuna carta nei due scarti (massimo 30 contate); prepara Alta Marea per il turno proprio successivo."
  },
  {
    "id": "weapon-designed-refrigerant-alta-marea",
    "name": "Alta Marea",
    "rarita": "Epica",
    "profile": {
      "pattern": "high-tide",
      "baseDamage": 18,
      "comboMultiplier": 4,
      "maxDamage": 120,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Giocabile solo nel turno proprio successivo a Bassa Marea. Travolge le Difese e le Trappole di entrambi i giocatori e colpisce con 4 volte la potenza caricata, massimo 120 HP."
  },
  {
    "id": "weapon-designed-metallic-artiglieria-schegge",
    "name": "Artiglieria delle Schegge Erranti",
    "rarita": "Rara",
    "profile": {
      "pattern": "wandering-shrapnel",
      "baseDamage": 20,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Un colpo da 20 HP nel turno di posa e uno nel proprio turno successivo, scegliendo un bersaglio differente quando possibile."
  },
  {
    "id": "weapon-designed-metallic-recuperatore-termobalistico",
    "name": "Recuperatore Termobalistico",
    "rarita": "Epica",
    "profile": {
      "pattern": "thermal-reclaimer",
      "baseDamage": 18,
      "damageConversionPercent": 60,
      "maxExtraDamage": 54,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Un colpo autonomo da 18 HP più il 60% degli HP realmente persi dalla tua flotta da quando l'arma è installata (massimo +54 HP). Due turni, non si combina con Artiglieria."
  },
  {
    "id": "weapon-designed-metallic-obice-pioggia-schegge",
    "name": "Obice a Pioggia di Schegge",
    "rarita": "Comune",
    "profile": {
      "pattern": "metal-base-shot",
      "baseDamage": 27,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Un colpo Metallo autonomo da 27 HP sul bersaglio scelto."
  },
  {
    "id": "weapon-designed-metallic-ganasce-magnetiche",
    "name": "Ganasce Magnetiche",
    "rarita": "Rara",
    "profile": {
      "pattern": "magnetic-grapple",
      "baseDamage": 14,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Due arpioni infliggono 14 HP a due navicelle diverse; se colpiscono, conservano i bersagli agganciati per Collassatore di Lega nel tuo turno successivo."
  },
  {
    "id": "weapon-designed-metallic-collassatore-lega",
    "name": "Collassatore di Lega",
    "rarita": "Epica",
    "profile": {
      "pattern": "alloy-collision",
      "baseDamage": 24,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Richiede Ganasce Magnetiche nel turno proprio precedente; fa collidere i bersagli agganciati infliggendo 24 HP ciascuno (Difese individuali)."
  },
  {
    "id": "weapon-designed-metallic-perforatore-cascata",
    "name": "Perforatore a Cascata",
    "rarita": "Epica",
    "profile": {
      "pattern": "cascade-piercer",
      "baseDamage": 38,
      "durationTurns": 3,
      "energyTransferCost": 1,
      "provisional": true
    },
    "description": "Per 3 tuoi turni spara 38 HP. Se distrugge un bersaglio, può trasferire i danni eccedenti al successivo spendendo 1 carica Energia Metallo; ogni bersaglio verifica la propria Difesa."
  },
  {
    "id": "weapon-designed-ionic-nucleo-folgore",
    "name": "Nucleo della Folgore Crescente",
    "rarita": "Rara",
    "profile": {
      "pattern": "growing-thunder-core",
      "baseDamage": 24,
      "damageStages": [
        24,
        36,
        54
      ],
      "durationTurns": 3,
      "freshEnergyCost": 1,
      "provisional": true
    },
    "description": "Spara 24/36/54 HP in 3 turni; per salire allo stadio successivo occorre giocare una nuova Energia Fulmine a ogni turno proprio e consumarne una carica. Se un caricamento manca, resta a 24 HP."
  },
  {
    "id": "weapon-designed-ionic-sonda-ionica",
    "name": "Sonda Ionica",
    "rarita": "Comune",
    "profile": {
      "pattern": "ion-probe",
      "baseDamage": 14,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Un colpo Fulmine da 14 HP; sul bersaglio colpito lascia un segnale che permette la combinazione con Martello del Tuono nello stesso turno o nel prossimo turno proprio."
  },
  {
    "id": "weapon-designed-ionic-martello-tuono",
    "name": "Martello del Tuono",
    "rarita": "Rara",
    "profile": {
      "pattern": "thunder-hammer",
      "baseDamage": 28,
      "comboBonusDamage": 18,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Colpo Fulmine da 28 HP; se il bersaglio è segnato da Sonda Ionica, un secondo impatto autonomo da 18 HP consuma il segnale."
  },
  {
    "id": "weapon-designed-ionic-lancia-comando-ionico",
    "name": "Lancia del Comando Ionico",
    "rarita": "Rara",
    "profile": {
      "pattern": "command-lance",
      "baseDamage": 24,
      "characterBonusDamage": 14,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Un colpo Fulmine da 24 HP; sale a 38 HP se è attivo un Personaggio alleato."
  },
  {
    "id": "weapon-designed-ionic-condensatore-tempesta",
    "name": "Condensatore della Tempesta Stellare",
    "rarita": "Epica",
    "profile": {
      "pattern": "storm-capacitor",
      "baseDamage": 18,
      "perSupportDamage": 8,
      "durationTurns": 3,
      "energyCost": 1,
      "provisional": true
    },
    "description": "Per 3 tuoi turni consuma 1 carica Energia Fulmine a turno e spara 18 HP +8 HP per ogni supporto alleato operativo, senza sacrificare HP."
  },
  {
    "id": "weapon-transferred-aerial-cicloreattore",
    "name": "Cicloreattore Grandinifero",
    "rarita": "Epica",
    "profile": {
      "pattern": "wind-cycloreactor",
      "baseDamage": 8,
      "damageStages": [
        8,
        12,
        16
      ],
      "freezeSeconds": [
        2,
        4,
        6
      ],
      "durationTurns": 3,
      "provisional": true
    },
    "description": "Per 3 tuoi turni colpisce ogni nave nemica da 8/12/16 HP e congela la mano del rivale per 2/4/6 secondi mentre il timer continua."
  }
];
export const PROVISIONAL_ADVANCED_WEAPONS=Object.freeze(RAW.map(r=>Object.freeze({
 ...r,profile:Object.freeze(r.profile),balancePending:true,provisionalBalance:true
})));
export const PROVISIONAL_ADVANCED_WEAPON_BY_ID=Object.freeze(
 Object.fromEntries(PROVISIONAL_ADVANCED_WEAPONS.map(x=>[x.id,x])));
if(PROVISIONAL_ADVANCED_WEAPONS.length!==21||
 Object.keys(PROVISIONAL_ADVANCED_WEAPON_BY_ID).length!==21)
 throw Error('21 Carte Arma provvisorie richieste');
