// Eclissi Stellare — profili numerici di 21 Armi speciali originali.
// Il flag tecnico profile.provisional e' usato dal motore dei colpi:
// NON indica che questi numeri siano ancora in attesa di una nuova taratura.
// Dal 22 novembre tutti i 235 valori di battaglia sono prossimi al definitivo.
export const WEAPON_BALANCE_POLICY=Object.freeze({revision:'near-final-2026-11-22-235-v1',
 status:'near-final',finalBalanceAfter:'solo correzioni mirate a carte e combinazioni',
 preservesExistingWeaponMechanics:true});
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
      "maxExtraShots": 2,
      "durationTurns": 3,
      "provisional": true
    },
    "description": "Per 3 tuoi turni spara 20 HP, più fino a 2 colpi extra da 8 HP. Ogni colpo extra consuma una carica fisica Energia Fuoco; le cariche rimanenti e gli altri elementi restano nella pila."
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
      "burnMaxDamage": 12,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Spara 22 HP e 16 HP al turno successivo. Il primo colpo riuscito applica una bruciatura di 5 turni: 2 HP per propria Carta Attacco negli scarti al momento dell'impatto, minimo 2 HP e massimo 12 HP per turno, senza ricalcolo."
  },
  {
    "id": "weapon-designed-plasma-sistema-binario",
    "name": "Cannone Binario a Sovraccarico",
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
      "couplerBonusDamage": 30,
      "provisional": true
    },
    "description": "Per 5 tuoi turni: colpo dell'8% degli HP massimi nemici, perdita del 6% degli HP massimi della tua madre, colpo del 16%, perdita del 4% degli HP massimi di ogni alleata operativa, poi 20% a ogni nave nemica. I costi possono essere letali."
  },
  {
    "id": "weapon-designed-plasma-accoppiatore-termofagico",
    "name": "Cannone Accoppiatore Termofagico",
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
    "name": "Perforatore dell’Inverno Nero",
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
    "name": "Cannone Acceleratore Boreale",
    "rarita": "Rara",
    "profile": {
      "pattern": "boreal-binary",
      "baseDamage": 16,
      "secondDamage": 20,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Unisce due impulsi Ghiaccio da 16 e 20 HP in un singolo colpo da 36 HP sul bersaglio scelto, con una verifica difensiva."
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
    "name": "Cannone di Bassa Marea",
    "rarita": "Rara",
    "profile": {
      "pattern": "low-tide",
      "baseDamage": 14,
      "damagePerDiscard": 2,
      "maxDiscardCards": 30,
      "durationTurns": 2,
      "provisional": true
    },
    "description": "Un colpo da 14 HP e 2 HP extra per ciascuna carta nei due scarti (massimo 30 contate); prepara Cannone di Alta Marea per il turno proprio successivo."
  },
  {
    "id": "weapon-designed-refrigerant-alta-marea",
    "name": "Cannone di Alta Marea",
    "rarita": "Epica",
    "profile": {
      "pattern": "high-tide",
      "baseDamage": 18,
      "comboMultiplier": 4,
      "maxDamage": 120,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Giocabile solo nel turno proprio successivo a Cannone di Bassa Marea. Travolge le Difese e le Trappole di entrambi i giocatori e colpisce con 4 volte la potenza caricata, massimo 120 HP."
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
    "name": "Artiglieria Termobalistica di Recupero",
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
    "name": "Arpioni a Ganasce Magnetiche",
    "rarita": "Rara",
    "profile": {
      "pattern": "magnetic-grapple",
      "baseDamage": 14,
      "durationTurns": 3,
      "finalTearBonusPercent": 50,
      "provisional": true
    },
    "description": "Ganascia A autonoma: una presa, tre turni propri. Trazione da 14 HP nei primi due; strappo con +50% al terzo. Con B agganciata, uno schianto e rilascio dei ganci."
  },
  {
    "id": "weapon-designed-metallic-collassatore-lega",
    "name": "Cannone Collassatore di Lega",
    "rarita": "Epica",
    "profile": {
      "pattern": "alloy-collision",
      "baseDamage": 24,
      "comboBonusDamage": 24,
      "durationTurns": 3,
      "provisional": true
    },
    "description": "Ganascia B autonoma: una presa, 24 HP per tre turni propri. Con A ancora agganciata, uno schianto da 24 HP per nave coinvolta, oppure 24 HP sulla sola nave contro il piano. La combo non si ripete; poi i due ganci si rilasciano."
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
    "name": "Cannone a Nucleo di Folgore Crescente",
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
    "name": "Sonda Ionica d’Assalto",
    "rarita": "Comune",
    "profile": {
      "pattern": "ion-probe",
      "baseDamage": 14,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Un colpo Fulmine da 14 HP; sul bersaglio colpito lascia un segnale che permette la combinazione con Impattatore Folgorico nello stesso turno o nel prossimo turno proprio."
  },
  {
    "id": "weapon-designed-ionic-martello-tuono",
    "name": "Impattatore Folgorico",
    "rarita": "Rara",
    "profile": {
      "pattern": "thunder-hammer",
      "baseDamage": 28,
      "comboBonusDamage": 18,
      "durationTurns": 1,
      "provisional": true
    },
    "description": "Colpo Fulmine da 28 HP; se il bersaglio è segnato da Sonda Ionica d’Assalto, un secondo impatto autonomo da 18 HP consuma il segnale."
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
    "description": "Richiede un Personaggio alleato attivo: un colpo Fulmine da 24 HP più 14 HP di bonus Personaggio, per 38 HP nominali."
  },
  {
    "id": "weapon-designed-ionic-condensatore-tempesta",
    "name": "Cannone Condensatore della Tempesta Stellare",
    "rarita": "Epica",
    "profile": {
      "pattern": "storm-capacitor",
      "baseDamage": 18,
      "perSupportDamage": 8,
      "durationTurns": 3,
      "energyCost": 1,
      "provisional": true
    },
    "description": "Per 3 tuoi turni, se giochi una nuova Energia Fulmine ne consuma 1 carica e spara 18 HP +8 HP per ogni supporto alleato vivo, senza sacrificare HP."
  },
  {
    "id": "weapon-transferred-aerial-cicloreattore",
    "name": "Cannone Cicloreattore Grandinifero",
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
        3,
        4
      ],
      "durationTurns": 3,
      "provisional": true
    },
    "description": "Per 3 tuoi turni colpisce ogni nave nemica da 8/12/16 HP e congela la mano del rivale per 2/3/4 secondi mentre il timer continua."
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
