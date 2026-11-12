import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// Optional telemetry passed by the existing battle views to campaign settlement.
type BattleResultMeta = {
  matchStats?: Record<string, unknown>;
  turnsElapsed?: number;
  activeTimeElapsedMs?: number;
  remainingHpPct?: number;
  isDraw?: boolean;
  isPvP?: boolean;
  pvpChannel?: string;
  pvpTrophiesAwarded?: number;
  pvpBonusDiamonds?: number;
  starsEarned?: boolean[];
  usedRevive?: boolean;
};
import { ref, update } from './offlineLegacyNetwork.js';
import { db, PVP_TRAINING_ENTRY_CREDITS, PVP_ELITE_DAILY_MATCHES_CAP, PVP_LOSS_TROPHIES, PVP_WIN_CREDITS, PVP_WIN_STARDUST, PVP_LOSS_STARDUST, PVP_WIN_XP, PVP_LOSS_XP, getDailyPvPMode, getWeeklyLeaderboardKey, MatchmakingLobby, WeeklyLeaderboardModal } from './pvpManager';

import { playBGM, playSound, toggleMuteBGM, toggleMuteSFX } from './audio';
import { SciFiIcon, TacticalVisual, RelicVisual } from './visualAssets';
import DeepSpaceUniverseCanvas from './DeepSpaceUniverseCanvas';
import { PHASE16A_CAMPAIGN_PLANETS, PHASE16A_RIFTS, PHASE16A_EPIC_IDS, PHASE16A_MAX_STARS, PHASE16A_STAR_MILESTONES, getCampaignPlanetIndex, getVisibleCampaignPlanet, getNextCampaignPlanet, getGlobalCampaignSector, getCampaignStarsTotal, migrateCampaignCapsuleClaims } from './newCombat/phase16ACatalog.js';
import { getPhase16EDeckTraits } from './newCombat/phase16EDecks.js';
import {getPhase16HSectorChallenge,getPhase16HBountyProgress} from './newCombat/phase16HProgression.js';
import MathDuelBattle from './MathDuelBattle.jsx';
import {applyVerifiedBossRelic,verifiedBossRelicReward} from './campaignBossRelics.js';
import {readShipCollection,updateShipCollection,upgradeShipCard} from './shipCollection.js';
import {validateShipUpgradePurchase} from './shipUpgrades.js';
import {officialModulePurchaseStage} from './officialModulePurchaseStage.js';
import {recoverOfficialCampaignCredits} from './officialCampaignCreditRegen.js';
import {normalizeOfficialForgeQueue,applyOfficialForgeCompletion,isOfficialForgeJobInQueue} from './officialForgeProgress.js';
import {initialSelectedPilot,missingPilotInventory,terraNineModuleVictory} from './officialLoadoutMilestones.js';
import { validatePhase13Settlement, createPhase13OnceGuard } from './newCombat/phase13Campaign.js';
import { ARMORY_V2_STORAGE_KEY, createPhase7Armory, normalizePhase7Armory } from './newCombat/phase7Armory.js';
import { phase17PilotHp, phase17CampaignXpAward, phase17CampaignDustAward } from './newCombat/phase17Balance.js';




import {
  getRomeDateString,
  getMsUntilRomeMidnight,
  generateDailyChallengeConfig,
  generateDailyGhostLeaderboard,
  getVisibleLeaderboard,
  loadDailyChallengeData,
  saveDailyChallengeData,
  checkDailyResetAndReport,
  consumePendingDailyReward
} from './dailyChallengeEngine';
import { buildDailyPokerResult } from './dailyPokerChallenge.js';

import { PilotCard, evaluatePilotDominance, getPilotById, getSectorEncounterPilot } from './pilotsSystem';









import { initDailyBounties, getForgeParams, calculateStardustOverflow, calculateTelemetryOnDefeat, getPlanetStarsStats, getSectorStars } from './progressionEngine';


import HomeScreen from './HomeScreen';
import PersonalLoadoutModal from './PersonalLoadoutModal';
import ShopModal from './ShopModal';






// 1.1 PARAMETRI DI BILANCIAMENTO, COSTANTI & CAP ECONOMICI
const MAX_PLAYER_LEVEL = 100;

const DAILY_BETTING_DIAMOND_CAP = 10;



// Parametri Scanner Tattico e Colpo Lampo
const SCANNER_TANK_MAX = 60;                    // Capienza massima serbatoio (60 secondi)
const SCANNER_REFILL_INTERVAL_MS = 86400000;     // Ricarica totale gratuita ogni 24 ore (ms)
const SCANNER_DIAMOND_REFILL_RATE = 10;         // 1 Diamante = +10s di ricarica

// Calcola la durata del turno per pianeta (da 60s a 45s)
const getPlanetBaseTurnTime = (planetNum) => {
  const p = Number(planetNum) || 1;
  if (p <= 10) return 60;
  if (p <= 15) return 50;
  return 45;
};


// Determina la modalit  operativa dello scanner per il settore
const getSectorScannerMode = (globalSector = 1, gameMode = 'adventure', bettingTier = 1) => {
  if (gameMode === 'pvp') return 'RESTRICTED';
  if (gameMode === 'pve') {
    if (bettingTier === 4) return 'RESTRICTED';
    return 'TANK_PAID';
  }
  const s = Number(globalSector) || 1;
  if (s >= 81) return 'TANK_PAID';

  const mod20 = ((s - 1) % 20) + 1;
  if (mod20 >= 1 && mod20 <= 5) return 'FREE_FULL';
  if (mod20 >= 6 && mod20 <= 10) return 'FREE_EMERGENCY';
  return 'TANK_PAID';
};


const INITIAL_PLAYER_CREDITS = 200;           // Dotazione iniziale per i primi settori

// SBLOCCHI BASATI SUL PROGRESSO NEI SETTORI DELL'AVVENTURA (1-200)
// Formula Settore Globale = (Pianeta - 1) * 10 + Livello
const BETTING_UNLOCK_ADVENTURE_SECTOR = 11;       // P2 Marte Settore 1 (Settore 11 - Tier 1 & Classica)
const PVP_TRAINING_UNLOCK_SECTOR = 11;            // P2 Marte Settore 1 (Settore 11 - Sblocco Addestramento)
const ETHER_UNLOCK_SECTOR = 15;                   // P2 Marte Settore 5 (Settore 15 - Sblocco Etere & Estrattore)
const DUEL_BETTING_UNLOCK_SECTOR = 41;            // P5 Giove Settore 1 (Settore 41 - Tier 3 & Duello)
const TRIS_BETTING_UNLOCK_SECTOR = 61;            // P7 Urano Settore 1 (Settore 61 - Tier 4 & Tris Stellare)
const PVP_ELITE_UNLOCK_SECTOR = 81;               // P8 Nettuno completato (Settore 81+)


// SBLOCCO UNICO MODULO ABILITÃ€ IBRIDO IN PLANCIA & SLOT EPICI
const ABILITY_MODULE_UNLOCK_CAMPAIGN_SECTOR = 9;  // Sblocco 1Â° e UNICO Slot Modulo AbilitÃ  (Terra Settore 9)
const EPIC_SLOT_1_UNLOCK_LEVEL = 20;               // Sblocco 1Â° Slot Epico a Livello Pilota 20
const EPIC_SLOT_2_UNLOCK_LEVEL = 60;               // Sblocco 2Â° Slot Epico a Livello Pilota 60

// ============================================================================
// 1.1b MATRICE DEI 3 SCAGLIONI DI PROGRESSIONE PILOTA (LEVEL GATING)
//      Fascia 1 (1â€“30): Max Liv. 3 per Mazzi/Moduli, Liv. 1 per Carte Terreno
//      Fascia 2 (31â€“65): Max Liv. 6 per Mazzi/Moduli, Liv. 2 per Carte Terreno
//      Fascia 3 (66â€“100): Max Liv. 9 per Mazzi/Moduli, Liv. 3 per Carte Terreno
// ============================================================================
const PILOT_LEVEL_GATING = Object.freeze({
  TIER_1_MAX_PILOT: 30,
  TIER_2_MAX_PILOT: 65,
  TIER_3_MAX_PILOT: 100,

  // Requisiti minimi di Livello Pilota per il potenziamento di Mazzi e Moduli AbilitÃ  (1â€“9)
  UPGRADE_PILOT_REQS: Object.freeze({
    1: 1,   // Sblocco iniziale
    2: 12,  // Fascia 1
    3: 25,  // Fascia 1 (Cap massimo per la Fascia 1)
    4: 35,  // Fascia 2 (Sblocco 2Âª AbilitÃ  attiva/passiva)
    5: 48,  // Fascia 2
    6: 60,  // Fascia 2 (Cap massimo per la Fascia 2)
    7: 70,  // Fascia 3 (Sblocco 3Âª AbilitÃ  attiva/passiva)
    8: 82,  // Fascia 3
    9: 95   // Fascia 3 (Apoteosi Finale)
  }),

});

// Helper unificato: Requisito Livello Pilota per Mazzo / Modulo AbilitÃ 
const getRequiredPilotLevelForUpgrade = (targetLevel) => {
  return PILOT_LEVEL_GATING.UPGRADE_PILOT_REQS[targetLevel] || 1;
};

// Helper unificato: Requisito Livello Pilota per Carte Terreno
// Helper: Massimo livello sbloccabile in base al livello attuale del Pilota
const getMaxAllowedLevelForPilot = (pilotLevel, maxItemCap = 9) => {
  const pLvl = Number(pilotLevel) || 1;
  let tierCap = 3;
  if (pLvl >= 66) tierCap = 9;
  else if (pLvl >= 31) tierCap = 6;
  return Math.min(tierCap, maxItemCap);
};

// ============================================================================
// MATRICE COSTI MIGLIORAMENTI UNIFICATA (MAZZI, ABILITÃ€ E TERRENI)
// Fascia 1 (Liv. 1â€“3): Solo Polvere Stellare 🌟
// Fascia 2 (Liv. 4â€“6): Polvere Stellare 🌟 + Cristalli di Vuoto ðŸ’ 
// Fascia 3 (Liv. 7â€“9): Polvere Stellare 🌟 + Cristalli ðŸ’  + Materia Primordiale 🟣
// ============================================================================
const UNIFIED_UPGRADE_COSTS = Object.freeze({
  2: { dust: 450, voidCrystals: 0, primordialMatter: 0 },
  3: { dust: 1100, voidCrystals: 0, primordialMatter: 0 },
  4: { dust: 2200, voidCrystals: 2, primordialMatter: 0 },
  5: { dust: 3500, voidCrystals: 4, primordialMatter: 0 },
  6: { dust: 5000, voidCrystals: 6, primordialMatter: 0 },
  7: { dust: 7500, voidCrystals: 8, primordialMatter: 2 },
  8: { dust: 10500, voidCrystals: 10, primordialMatter: 3 },
  9: { dust: 15000, voidCrystals: 12, primordialMatter: 5 }
});

// ============================================================================
// GENERATORE DELLA 3Âª STELLA DETERMINISTICA (CAMPAGNA 120 SETTORI)
// ============================================================================
// FASE 16H: sfide basate esclusivamente sulle statistiche del nuovo Poker.
const getSectorSpecialChallenge = getPhase16HSectorChallenge;


// ============================================================================
// REGISTRO DELLE 40 CAPSULE DI RIFORNIMENTO (OGNI 15 STELLE FINO A 600 â­)
// ============================================================================
const getStarCapsuleReward = (milestone) => {
  const m = Number(milestone) || 15;
  const idx = Math.max(1, Math.min(PHASE16A_STAR_MILESTONES.length, Math.floor(m / 15)));
  let dust = 120 + idx * 40;
  let diamonds = (idx % 2 === 0) ? Math.floor(idx / 2) : 0;
  let ether = Math.min(10, Math.floor(idx / 4) + 1);
  let voidCrystals = (idx >= 15 && idx % 5 === 0) ? 1 : 0;
  let primordialMatter = (idx >= 30 && idx % 5 === 0) ? 1 : 0;
  let unlockItem = null;

  if (m === 180) {
    unlockItem = { type: 'ability', id: 'singularity_core', name: 'Modulo SingolaritÃ  (Buco Nero)' };
  } else if (m === 360) {
    dust = 3000;
    diamonds = 30;
    ether = 15;
    voidCrystals = 5;
    primordialMatter = 3;
  }

  return { milestone: m, dust, diamonds, ether, voidCrystals, primordialMatter, unlockItem };
};

// Costante di fallback provvisoria per trofei


// Formula Curva Vitale Universale del Giocatore (HP Pilota 50â€“400)
// HP Pilota = min(400, 50 + floor(Livello / 5) * 17.5)
const calculateUniversalPlayerHp = (lvl) => phase17PilotHp(lvl);

// Calcola il Settore Globale dell'Avventura raggiunto dal giocatore (1-200)
const calculateGlobalAdventureSector = (maxPlanet = 1, unlockedLevelsMap = { 1: 1 }) =>
  getGlobalCampaignSector(maxPlanet, unlockedLevelsMap);

// Accumulatore di Carica Modulo Tattico Scalare per Pianeta (30 / 45 / 60 HP)
const getAbilityChargeThreshold = (planet = 1) => {
  const p = Number(planet) || 1;
  if (p <= 5) return 30;   // Pianeti 1â€“5: 30 HP di danno cumulativo per il 100%
  if (p <= 10) return 45;  // Pianeti 6â€“10: 45 HP di danno cumulativo per il 100%
  return 60;               // Pianeti 11â€“20: 60 HP di danno cumulativo per il 100%
};

// Helper Centralizzato: Verifica Sconfitta Boss Pianeta (Settore 10 Completato)
const isPlanetBossDefeated = (planetNum, unlockedLevelsMap = {}, maxPlanet = 1) => {
  const p = Number(planetNum) || 1;
  const maxLvlInPlanet = Number(unlockedLevelsMap?.[p]) || 1;
  const currentMaxPlanet = Number(maxPlanet) || 1;
  return maxLvlInPlanet > 10 || currentMaxPlanet > p;
};


const getStardustWalletCap = (lvl) => {
  const currentLvl = Number(lvl) || 1;
  if (currentLvl >= 85) return 20000; // Fascia 3 Endgame: Apoteosi L9 (15.000) e Leggendari (18.000)
  if (currentLvl >= 66) return 12500; // Fascia 3 Ingresso: Upgrade L7 (7.500) e L8 (10.500)
  if (currentLvl >= 50) return 7500;  // Fascia 2 Picco: Upgrade L6 (5.000) e Piloti Rari Grado 5
  if (currentLvl >= 31) return 5000;  // Fascia 2 Ingresso: Upgrade L4 (2.200) e L5 (3.500)
  if (currentLvl >= 15) return 2500;  // Fascia 1 Avanzata: Upgrade L3 (1.100)
  return 1500;                        // Fascia 1 Base: Starter e L2 (450)
};


// Milestone Vite: Sostituzione dello sblocco slot a Liv. 30 con +1 Vita Massima Permanente
const getMaxLivesForLevel = (lvl) => {
  const currentLvl = Number(lvl) || 1;
  let extra = 0;
  if (currentLvl >= 15) extra++;
  if (currentLvl >= 30) extra++; // Sostituzione sblocco 2Â° slot: +1 Vita permanente
  if (currentLvl >= 50) extra++;
  if (currentLvl >= 75) extra++;
  return 3 + extra;
};

// ============================================================================
// 1.2 DATABASE SCOMMESSE DEL BANCO: RADDOPPIO PURO (2X) SU 4 TAVOLI
//     L'IA   DINAMICA A SPECCHIO (HP +15% E LIVELLO MAZZO N+1)
// ============================================================================
const BETTING_LEVELS = Object.freeze({
  1: {
    level: 1,
    resource: 'stardust',
    name: "Banco della Polvere Stellare",
    icon: "🌟",
    unit: "Polvere 🌟",
    minBet: 100,
    maxBet: 2500,
    step: 50,
    costCredits: 10,
    aiPower: 0.82,
    reqAdventureSector: BETTING_UNLOCK_ADVENTURE_SECTOR, // Settore 11
    xp: 60,
    desc: "Punta da 100 a 2.500 🌟: vincendo raddoppi la cifra (2x) contro un'IA a specchio."
  },
  2: {
    level: 2,
    resource: 'voidCrystals',
    name: "Tavolo dei Cristalli di Vuoto",
    icon: "💠",
    unit: "Cristalli 💠",
    minBet: 1,
    maxBet: 4,
    step: 1,
    costCredits: 20,
    aiPower: 0.84,
    reqAdventureSector: DUEL_BETTING_UNLOCK_SECTOR, // Settore 41
    xp: 150,
    desc: "Punta da 1 a 4 💠: vincendo raddoppi la cifra (2x) per chiudere gli upgrade di Fascia 2."
  },
  3: {
    level: 3,
    resource: 'primordialMatter',
    name: "Azzardo Materia Primordiale",
    icon: "🟣",
    unit: "Materia 🟣",
    minBet: 1,
    maxBet: 2,
    step: 1,
    costCredits: 30,
    aiPower: 0.86,
    reqAdventureSector: TRIS_BETTING_UNLOCK_SECTOR, // Settore 61
    xp: 300,
    desc: "Punta da 1 a 2 🟣: vincendo raddoppi la cifra (2x) per raggiungere l'Apoteosi."
  },
  4: {
    level: 4,
    resource: 'diamonds',
    name: "Tavolo dei Diamanti Galattici",
    icon: "💎",
    unit: "Diamanti 💎",
    minBet: 1,
    maxBet: 5,
    step: 1,
    costCredits: 40,
    aiPower: 0.88,
    reqAdventureSector: PVP_ELITE_UNLOCK_SECTOR, // Settore 81 (Post-Nettuno)
    xp: 500,
    desc: "Punta da 1 a 5 💎: vincendo raddoppi la valuta premium (Tetto: max +10 💎 netti al giorno)."
  }
});





// ============================================================================
// 1.4 ECONOMIA SUBSPAZIALE & SILO SERBATOI
// ============================================================================
const SUBSPACE_TANK_LEVELS = {
  1: { level: 1, name: 'Silo Subspaziale Cadetto', maxVoid: 4, maxPrimordial: 0, costDust: 0, reqLevel: 1 },
  2: { level: 2, name: 'Camera di Risonanza Quantica', maxVoid: 8, maxPrimordial: 3, costDust: 2000, reqLevel: 31 },
  3: { level: 3, name: 'Matrice di Contenimento Singolarit ', maxVoid: 16, maxPrimordial: 8, costDust: 6000, reqLevel: 66 }
};


const EPIC_ITEM_UPGRADE_COSTS = {
  1: { level: 1, dust: 0, voidCrystals: 0, primordialMatter: 0 },
  2: { level: 2, dust: 600, voidCrystals: 3, primordialMatter: 0 },
  3: { level: 3, dust: 1800, voidCrystals: 0, primordialMatter: 2 }
};

// ============================================================================
// 1.5 REGISTRO COMPLETO DELLE REGOLE DI GIOCO (RULES_DATABASE)
// ============================================================================
const RULES_DATABASE = Object.freeze([
  {
    id: 'rule_1',
    num: '01',
    title: 'Calcolo & Minimo 2 Carte',
    tag: 'FONDAMENTA',
    color: '#00f2fe',
    summary: 'Per eseguire un attacco servono obbligatoriamente da 2 a 4 carte. Formule a carta singola sono bloccate.',
    details: [
      'Seleziona un bersaglio numerico attivo sulla plancia centrale tra quelli proposti.',
      'Scegli da 2 a 4 carte dalla tua mano la cui combinazione con l\'operatore richiesto raggiunge esattamente il valore target.',
      'Danni Base Fissi Simmetrici (Giocatore e Nemico): [+] 10 HP | [-] 12 HP | [*] 16 HP | [/] 20 HP.',
      'Toggle Aiuti di Calcolo: se impostato su OFF, radar e plancia nascondono ogni calcolo automatico o suggerimento (A + B = ?).'
    ]
  },
  {
    id: 'rule_2',
    num: '02',
    title: 'I 4 Semi & Sinergie con Carta Dorata',
    tag: 'EFFETTI SEMI',
    color: '#f43f5e',
    summary: 'Ogni seme attiva un effetto immediato. La Carta Dorata raddoppia e potenzia la risonanza del proprio seme.',
    details: [
      'â™¥ Cuori (Cura HP): +8% HP Massimi (+12% con Mazzo Toro). Carta Dorata: +16% HP Massimi (+24% Toro).',
      'â™¦ Quadri (Polvere): +2 Polvere Stellare 🌟. Carta Dorata: +20 Polvere Stellare 🌟 e 10% probabilitÃ  +1 Diamante 💎.',
      'â™£ Fiori (Tempo Extra): +5s nel Serbatoio (Cap +30s). Carta Dorata: +15s nel Serbatoio e +1 Etere Cosmico 🔮.',
      'â™  Picche (Danno Extra): +3 HP danno aggiuntivo. Carta Dorata: +8 HP Danno Puro Extra (ignora difese).',
      'Combo 4 Semi: combinare Cuori, Quadri, Fiori e Picche in una formula attiva Critico x2.0 (+30🌟, +1💎, +10% HP). Con Carta Dorata sale a Critico x3.0 (+50🌟, +2💎).'
    ]
  },
    {
    id: 'rule_3',
    num: '03',
    title: 'Modalità Tris Stellare a 5 Carte',
    tag: 'FORMULA AD INCASTRO',
    color: '#a855f7',
    summary: 'Risolvi la formula (Tavolo [Op1] C2) + C3 + C4 + C5 = Target (o PARI/DISPARI) liberando la Doppia Esplosione.',
    details: [
      'Formula a 5 Carte: 1 carta fissa al tavolo + 4 carte scelte liberamente dalla tua mano.',
      'Struttura del Calcolo: il primo blocco usa l\'operatore libero scelto (+, -, *, /), le restanti carte vengono obbligatoriamente sommate.',
      'Bersagli Multipli: Bersaglio 1 (Numero esatto), Bersaglio 2 (Filtro PARI o DISPARI), Bersaglio 3 (Nucleo Bomba a 3 turni).',
      'Doppia Esplosione: a t=0ms impatto dell\'operatore math ([+] 10, [-] 12, [*] 16, [/] 20 HP); a t=350ms detonazione della combinazione Poker.',
      'Valori Poker a 5 Carte: Carta Alta 8 HP, Coppia 10 HP, Doppia Coppia 12 HP, Tris 14 HP, Scala 16 HP, Colore 17 HP, Full 18 HP, Poker 19 HP, Scala Reale 20 HP.',
      'Fase di Scarica Finale: dopo l\'attacco, tocca 1 delle 3 carte rimaste in mano per sacrificare il suo seme e attivare i poteri di risonanza.'
    ]
  },

  {
    id: 'rule_4',
    num: '04',
    title: 'Modulo Abilità Ibrido (3 Colpi a Segno)',
    tag: 'SLOT UNICO IBRIDO',
    color: '#10b981',
    summary: '1 solo slot attivo in plancia. Ogni colpo a segno ricarica 1 tacca su 3: a 3 colpi premi ATTIVA per rilasciare tutti i poteri sbloccati.',
    details: [
      'Slot Unico Ibrido: sbloccato ed equipaggiato in plancia al Settore 9 dell\'Avventura (Terra).',
      'Ricarica a 3 Colpi: ogni attacco andato a segno carica 1/3 del Modulo (100% in 3 turni).',
      'Attivazione Simultanea: al 100% il pulsante pulsa ed eroga insieme tutti gli effetti sbloccati (Fascia 1, 2 e 3).',
      'Faccia Nera Dadi: estrarre la Faccia Nera carica istantaneamente il modulo al 100%.'
    ]
  },
    {
    id: 'rule_5',
    num: '05',
    title: 'Barra Malus (Sabotaggio Rapido a 20 Pt)',
    tag: 'SISTEMA TATTICO',
    color: '#fb923c',
    summary: 'Premia la velocità di calcolo: ogni colpo a segno converte il tempo residuo in carica (da 1 a 10 punti) per sabotare il nemico.',
    details: [
      'Carica a Tempo: ogni colpo assegna da 1 a 10 punti (massimo 10pt per risposte rapide entro 8s, minimo 1pt al limite).',
      'Soglia 20 Punti: raggiunti i 20 punti la barra esplode sabotando l\'avversario con carry-over dei punti eccedenti.',
      'Passa Turno / Timeout: non assegnano alcun punto alla barra (si carica solo colpendo a segno).',
      'I 4 Sabotaggi: Perdita 10 HP diretti, Blocco Modulo nemico per 2 turni, Mano ridotta a 5 carte o Salto Turno.'
    ]
  },



  {
    id: 'rule_6',
    num: '06',
    title: 'Dadi Quantici Digitali 2D',
    tag: 'REQUISITO ALGEBRICO',
    color: '#c084fc',
    summary: 'Risolvi calcoli con tutti e 4 gli operatori (+, -, *, /) per caricare e lanciare i Dadi.',
    details: [
      'Ogni operatore completato accende una tacca sui dadi.',
      'Completati tutti e 4 gli operatori, puoi lanciare il dado ed estrarre moltiplicatori ed effetti speciali (Faccia Nera = Carica AbilitÃ  100%, Faccia Rossa = Scarica Malus).',
      'Facce Semi: erogano massicci bonus di HP percentuali, Polvere Stellare, Tempo o Danno Diretto.'
    ]
  },
  {
    id: 'rule_7',
    num: '07',
    title: 'ModalitÃ  Vettore Geometrico',
    tag: 'RADAR BALISTICO',
    color: '#06b6d4',
    summary: 'Manovra il radar coordinando gli impulsi cardinali verso il valore target (10-55).',
    details: [
      'Destra: impulso di Addizione [+].',
      'Alto: impulso di Sottrazione [-].',
      'Sinistra: impulso di Moltiplicazione [*].',
      'Basso: impulso di Divisione [/].',
      'Scala Danni in base alle carte usate: 2 Carte = 20 HP, 3 Carte = 15 HP, 4 Carte = 10 HP, 5+ = 5 HP.'
    ]
  },
    {
    id: 'rule_8',
    num: '08',
    title: 'Duello di Convergenza',
    tag: 'BANCO COMUNE 2+2',
    color: '#eab308',
    summary: 'Sfida su Banco Comune: centra il Target condiviso in 2 turni concatenati (2+2 carte) e domina con la figura Poker.',
    details: [
      'Banco Comune: 1 Carta Base, 1 Numero Target condiviso e 1 Nucleo Bomba a 3 turni.',
      'Turno 1 (Apertura): gioca 2 carte dalla mano per concatenare (Base [Op1] C1) [Op2] C2 e fissare il tuo Parziale T1.',
      'Turno 2 (Chiusura): mano ripristinata a 7 carte; gioca altre 2 carte su (Parziale T1 [Op3] C3) [Op4] C4 per chiudere la traiettoria.',
      'Verdetto & Danni: vince chi ha il Delta (distanza) minore dal Target; in parità di Delta spareggia il rango Poker delle 5 carte (Base + 4 giocate). Danni: 8-20 HP da figura Poker (+3 HP perforanti se Bullseye Delta 0).'
    ]
  },

  {
    id: 'rule_9',
    num: '09',
    title: 'Boss Multi-Fase & Reset Mazzo a 54 Carte',
    tag: 'CAMPAGNA 120 SETTORI',
    color: '#ec4899',
    summary: 'I Boss scalano da 1 a 4 fasi sequenziali con cambio dinamico di plancia e ricarica integrale mazzo.',
    details: [
      'Pianeti 1-10: 1 Fase (Boss Gaia Terra 75 HP, Boss Marte 100 HP con Anello di Möbius).',
      'Pianeti 11-13: 2 Fasi (Boss Europa P11 260 HP -> Classica 130 HP + Vettore 130 HP).',
      'Pianeti 14-16: 2 Fasi (Boss Proxima b P14 320 HP -> Vettore 160 HP + Convergenza 160 HP).',
      'Pianeti 17-19: 3 Fasi (Boss Haumea P17 420 HP -> Classica 140 HP + Vettore 140 HP + Convergenza 140 HP).',
      'Boss Finale Encelado (P20): quattro fasi e abilità boss proprie. Nessun Oggetto Epico equipaggiato dall\'IA.',
      'Reset Mazzo a 54 Carte: ad ogni passaggio di fase, mazzo e scarti di entrambi i contendenti vengono resettati, ricaricati e rimescolati a 54 carte con pesca di una nuova mano.'
    ]
  },
  {
    id: 'rule_10',
    num: '10',
    title: 'PvP a Doppio Canale (Addestramento & Élite)',
    tag: 'DUELLI ONLINE',
    color: '#3b82f6',
    summary: 'Circuito separato per farming senza rischio e competizione simulata offline a 10 partite giornaliere.',
    details: [
      'Canale A - Addestramento & Farming (Sblocco Settore 11 Avventura): Costa 5 Crediti ⚡, nessun impatto sui Trofei, ideale per farming XP e Polvere.',
      'Canale B - Lega Élite Simulata (Sblocco Settore 81 Avventura / Post-Nettuno): 10 Partite Giornaliere a costo 0 Crediti visualizzate sul pulsante "Gioca (10/10)", +25 Trofei per vittoria / -10 per sconfitta.',
      'Rotazione Giornaliera Élite: Lun/Gio Classica, Mar/Ven Vettore, Mer/Sab Convergenza, Domenica Tris Stellare.',
      'Podio simulato: nessun premio mondiale reale; restano le ricompense locali dei duelli.'
    ]
  },

  {
    id: 'rule_11',
    num: '11',
    title: 'Cripta delle SingolaritÃ  & 10 Oggetti Epici',
    tag: 'MANUFATTI DIMENSIONALI',
    color: '#6366f1',
    summary: 'Collassa i 10 Varchi Gravitazionali fondendo le 20 Reliquie Boss per forgiare Manufatti Epici.',
    details: [
      'Equipaggia fino a 2 Oggetti Epici in plancia (1Â° Slot sbloccato a Liv. 20, 2Â° Slot a Liv. 60).',
      'Costo 0, utilizzabili 1 volta per scontro, max 1 per turno.',
      'Include: Anello di MÃ¶bius, Forcella Neutonica, Astrolabio, Stele d\'Ombra, Pistone Gravimetrico, Pendolo Entropico, Monolite Dielettrico, Calice a Vortice, Matrice Poliedrica, Nucleo SingolaritÃ .',
      'Migliorabili fino al Livello 3 usando Cristalli di Vuoto ðŸ’  e Materia Primordiale 🟣 immagazzinati nel Silo.'
    ]
  },
  {
    id: 'rule_12',
    num: '12',
    title: 'Curva Vitale Universale & I 3 Scaglioni Pilota',
    tag: 'PROGRESSIONE GLOBALE',
    color: '#14b8a6',
    summary: 'HP pilota unificati (50â€“400 HP), sblocco slot unico al Settore 9 e progressione rigida su 3 fasce di livello.',
    details: [
      'Formula HP Universale: HP = min(400, 50 + floor(Livello / 5) * 17.5).',
      '1 Solo Slot Modulo AbilitÃ : sbloccato al Settore 9 dell\'Avventura (nessun alloggiamento aggiuntivo a Liv. 30 o 61).',
      'Fascia 1 (Liv. 1â€“30): Max Liv. 3 per Mazzi e Moduli AbilitÃ ; Liv. 1 per Carte Terreno.',
      'Fascia 2 (Liv. 31â€“65): Max Liv. 6 per Mazzi e Moduli AbilitÃ  (2Âª abilitÃ  attiva/passiva); Liv. 2 per Carte Terreno (con riarmo tramite Etere).',
      'Fascia 3 (Liv. 66â€“100): Max Liv. 9 per Mazzi e Moduli AbilitÃ  (3Âª abilitÃ  / Apoteosi); Liv. 3 per Carte Terreno.',
      'Slot Epici: 1Â° Slot a Liv. 20, 2Â° Slot a Liv. 60.',
         'Cap Portafoglio Polvere : 1.500 (Liv. 1-14) -> 2.500 (Liv. 15-30) -> 5.000 (Liv. 31-49) -> 7.500 (Liv. 50-65) -> 12.500 (Liv. 66-84) -> 20.000 (Liv. 85+).'

    ]
  }
]);



// 1.4 DANNI FISSI SIMMETRICI MODALITÃ€ CLASSICA PER OPERATORE (IDENTICI PER PLAYER E IA)
const getClassicOpDamage = (op) => {
  switch (op) {
    case '/': return 20;
    case '*': return 16;
    case '-': return 12;
    case '+': default: return 10;
  }
};

// 1.5 DANNI FISSI MODALITÃ€ VETTORE PER NUMERO DI CARTE IMPIEGATE
const getVectorCardDamage = (cardsCount) => {
  const count = Number(cardsCount) || 0;
  if (count <= 2) return 20;
  if (count === 3) return 15;
  if (count === 4) return 10;
  return 5;
};

// 1.5b HELPER LETTURA SEME & VALORE EFFETTIVO CARTA
const getCardSuit = (card) => {
  if (!card) return null;
  if (card.isJoker) return 'joker';
  if (card.suit) return card.suit;
  if (typeof card.id === 'string') {
    if (card.id.startsWith('hearts') || card.id === 'hearts') return 'hearts';
    if (card.id.startsWith('diamonds') || card.id === 'diamonds') return 'diamonds';
    if (card.id.startsWith('spades') || card.id === 'spades') return 'spades';
    if (card.id.startsWith('clubs') || card.id === 'clubs') return 'clubs';
  }
  return 'hearts';
};

const getCardEffectiveValue = (card, activeAnomaly = null) => {
  if (!card) return 0;
  const baseVal = Number(card.value) || 0;
  const suit = getCardSuit(card);
  if (activeAnomaly?.id === 'hearts_res' && suit === 'hearts') {
    return baseVal * 2;
  }
  return baseVal;
};

const calculateExpressionResult = (cards, op, activeAnomaly = null) => {
  if (!cards || cards.length === 0) return 0;
  const validCards = cards.filter(Boolean);
  if (validCards.length === 0) return 0;

  const vals = validCards.map(c => getCardEffectiveValue(c, activeAnomaly));
  if (vals.length === 1) return vals[0];

  switch (op) {
    case '+':
      return vals.reduce((acc, v) => acc + v, 0);
    case '-':
      return vals.reduce((acc, v, idx) => (idx === 0 ? v : acc - v), 0);
    case '*':
      return vals.reduce((acc, v) => acc * v, 1);
    case '/':
      if (vals.some((v, idx) => idx > 0 && Math.abs(v) < 1e-7)) return NaN;
      return vals.reduce((acc, v, idx) => (idx === 0 ? v : acc / v), 0);
    default:
      return 0;
  }
};

// 1.6 VALUTATORE COMBINAZIONI POKER A 5 CARTE (TABELLA DANNI UNIVERSALE & RANGO SPAREGGIO)
const evaluate5CardPokerHand = (cards) => {
  if (!cards || cards.length < 5) {
    return { type: 'incomplete', name: 'Incompleta', rank: 0, damage: 0, color: '#94a3b8', desc: 'Incompleta (0 HP)' };
  }

  const validCards = cards.filter(Boolean);
  if (validCards.length < 5) {
    return { type: 'incomplete', name: 'Incompleta', rank: 0, damage: 0, color: '#94a3b8', desc: 'Incompleta (0 HP)' };
  }


  const values: number[] = validCards.map(c => Number(c.value) || 0).sort((a, b) => a - b);
  const suits = validCards.map(c => getCardSuit(c));

  const counts: Record<number, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const freq = Object.values(counts).sort((a, b) => b - a);

  const nonJokerSuits = suits.filter(s => s && s !== 'joker');
  const isFlush = nonJokerSuits.length >= 4 && new Set(nonJokerSuits).size === 1;

  let isStraight = false;
  const uniqueVals = [...new Set(values)];
  if (uniqueVals.length === 5) {
    if (uniqueVals[4] - uniqueVals[0] === 4) {
      isStraight = true;
    } else if (uniqueVals[0] === 1 && uniqueVals[1] === 10 && uniqueVals[2] === 11 && uniqueVals[3] === 12 && uniqueVals[4] === 13) {
      isStraight = true;
    }
  }

  if (isStraight && isFlush) {
    return { type: 'royal_flush', name: 'Scala Reale', rank: 9, damage: 20, color: '#facc15', desc: 'Scala Reale / a Colore (-20 HP)' };
  }
  if (freq[0] === 4) {
    return { type: 'four_of_a_kind', name: 'Poker', rank: 8, damage: 19, color: '#ec4899', desc: 'Poker (-19 HP)' };
  }
  if (freq[0] === 3 && freq[1] === 2) {
    return { type: 'full_house', name: 'Full', rank: 7, damage: 18, color: '#c084fc', desc: 'Full: Tris + Coppia (-18 HP)' };
  }
  if (isFlush) {
    return { type: 'flush', name: 'Colore', rank: 6, damage: 17, color: '#38bdf8', desc: 'Colore: 5 carte stesso seme (-17 HP)' };
  }
  if (isStraight) {
    return { type: 'straight', name: 'Scala', rank: 5, damage: 16, color: '#a855f7', desc: 'Scala (-16 HP)' };
  }
  if (freq[0] === 3) {
    return { type: 'three_of_a_kind', name: 'Tris', rank: 4, damage: 14, color: '#ef4444', desc: 'Tris (-14 HP)' };
  }
  if (freq[0] === 2 && freq[1] === 2) {
    return { type: 'two_pair', name: 'Doppia Coppia', rank: 3, damage: 12, color: '#f59e0b', desc: 'Doppia Coppia (-12 HP)' };
  }
  if (freq[0] === 2) {
    return { type: 'one_pair', name: 'Coppia', rank: 2, damage: 10, color: '#10b981', desc: 'Coppia (-10 HP)' };
  }

  return { type: 'high_card', name: 'Carta Alta', rank: 1, damage: 8, color: '#94a3b8', desc: 'Carta Alta (-8 HP)' };
};

// Alias per compatibilità con Tris Stellare
const evaluateTrisStellareCombination = evaluate5CardPokerHand;

// 1.6b RISOLUZIONE MODALITÀ CONVERGENZA: PROSSIMITÀ (DELTA) & POKER A 5 CARTE
const resolveConvergenceDuel = (pFinalVal, aiFinalVal, targetVal, p5Cards, ai5Cards) => {
  const deltaP = Math.abs(pFinalVal - targetVal);
  const deltaAi = Math.abs(aiFinalVal - targetVal);

  const pCombo = evaluate5CardPokerHand(p5Cards);
  const aiCombo = evaluate5CardPokerHand(ai5Cards);

  let winner = 'draw';
  let isBullseye = false;
  let tieBreakReason = null;

  if (deltaP < deltaAi) {
    winner = 'player';
    isBullseye = (deltaP === 0);
  } else if (deltaAi < deltaP) {
    winner = 'ai';
    isBullseye = (deltaAi === 0);
  } else {
    // Parità di Delta: spareggio sul rango Poker delle 5 carte
    if (pCombo.rank > aiCombo.rank) {
      winner = 'player';
      isBullseye = (deltaP === 0);
      tieBreakReason = `Spareggio Poker: ${pCombo.name} batte ${aiCombo.name}`;
    } else if (aiCombo.rank > pCombo.rank) {
      winner = 'ai';
      isBullseye = (deltaAi === 0);
      tieBreakReason = `Spareggio Poker: ${aiCombo.name} batte ${pCombo.name}`;
    } else {
      winner = 'draw';
      tieBreakReason = 'Perfetta Parità di Delta e Figura Poker';
    }
  }

  const winningCombo = winner === 'player' ? pCombo : (winner === 'ai' ? aiCombo : null);
  const baseDamage = winningCombo ? winningCombo.damage : 0;
  const bullseyeBonus = isBullseye ? 3 : 0; // Regola del Centro Perfetto: +3 HP perforanti

  return {
    winner,
    deltaP,
    deltaAi,
    isBullseye,
    pCombo,
    aiCombo,
    winningCombo,
    tieBreakReason,
    baseDamage,
    bullseyeBonus,
    damage: baseDamage + bullseyeBonus
  };
};


// Risoluzione formula a 5 carte con convalida parità intera
const evaluateTrisStellare = (tableCard, c2, c3, c4, c5, op1, targetObj, activeAnomaly = null) => {
  if (!tableCard || !c2 || !c3 || !c4 || !c5) {
    return { isValid: false, result: 0, mathDamage: 0, pokerDamage: 0, totalDamage: 0, combo: null };
  }

  const vTable = getCardEffectiveValue(tableCard, activeAnomaly);
  const v2 = getCardEffectiveValue(c2, activeAnomaly);
  const v3 = getCardEffectiveValue(c3, activeAnomaly);
  const v4 = getCardEffectiveValue(c4, activeAnomaly);
  const v5 = getCardEffectiveValue(c5, activeAnomaly);

  let step1 = 0;
  if (op1 === '+') step1 = vTable + v2;
  else if (op1 === '-') step1 = vTable - v2;
  else if (op1 === '*') step1 = vTable * v2;
  else if (op1 === '/') step1 = v2 !== 0 ? vTable / v2 : NaN;

  if (isNaN(step1)) {
    return { isValid: false, result: NaN, mathDamage: 0, pokerDamage: 0, totalDamage: 0, combo: null };
  }

  const finalResult = step1 + v3 + v4 + v5;
  if (isNaN(finalResult)) {
    return { isValid: false, result: NaN, mathDamage: 0, pokerDamage: 0, totalDamage: 0, combo: null };
  }

  let isValid = false;
  if (targetObj?.isParity) {
    const isInt = Number.isInteger(finalResult);
    if (isInt) {
      const isEven = Math.abs(finalResult) % 2 === 0;
      isValid = (targetObj.parityType === 'PARI' && isEven) || (targetObj.parityType === 'DISPARI' && !isEven);
    } else {
      isValid = false;
    }
  } else {
    const expectedTarget = Number(targetObj?.target ?? targetObj) || 0;
    isValid = Math.abs(finalResult - expectedTarget) < 1e-5;
  }

  const mathDamage = getClassicOpDamage(op1);
  const combo = evaluateTrisStellareCombination([tableCard, c2, c3, c4, c5]);
  const pokerDamage = combo.damage;
  const totalDamage = mathDamage + pokerDamage;

  return {
    isValid,
    step1: Math.round(step1 * 100) / 100,
    result: Math.round(finalResult * 100) / 100,
    mathDamage,
    pokerDamage,
    totalDamage,
    combo,
    cardsUsed: [c2, c3, c4, c5]
  };
};



// ============================================================================
// 1.6b2 DATABASE COMBINAZIONI POKERISTICHE MODALITÀ CLASSICA (IBRIDO)
// ============================================================================
const CLASSIC_POKER_PATTERNS = Object.freeze([
  { id: 'one_pair', name: 'COPPIA', cardsCount: 2, damage: 10, desc: '2 carte dello stesso valore (-10 HP)' },
  { id: 'two_pair', name: 'DOPPIA COPPIA', cardsCount: 4, damage: 12, desc: '2 coppie distinte (-12 HP)' },
  { id: 'three_of_a_kind', name: 'TRIS', cardsCount: 3, damage: 14, desc: '3 carte dello stesso valore (-14 HP)' },
  { id: 'straight', name: 'SCALA', cardsCount: 5, damage: 16, desc: '5 carte in sequenza continua (-16 HP)' },
  { id: 'flush', name: 'COLORE', cardsCount: 5, damage: 17, desc: '5 carte dello stesso seme (-17 HP)' },
  { id: 'full_house', name: 'FULL', cardsCount: 5, damage: 18, desc: '1 Tris + 1 Coppia (-18 HP)' },
  { id: 'four_of_a_kind', name: 'POKER', cardsCount: 4, damage: 19, desc: '4 carte dello stesso identico valore (-19 HP)' },
  { id: 'royal_flush', name: 'SCALA REALE', cardsCount: 5, damage: 20, desc: '5 carte consecutive dello stesso seme (-20 HP)' }
]);



const validateClassicPokerPattern = (cards, patternId) => {
  if (!cards || !patternId) return false;
  const validCards = cards.filter(Boolean);
  const targetDef = CLASSIC_POKER_PATTERNS.find(p => p.id === patternId);
  if (!targetDef) return false;
  if (validCards.length !== targetDef.cardsCount) return false;

  const jokers = validCards.filter(c => c.isJoker || c.suit === 'joker').length;
  const nonJokers = validCards.filter(c => !c.isJoker && c.suit !== 'joker');
  const nonJokerVals: number[] = nonJokers.map(c => Number(c.value) || 0).sort((a, b) => a - b);
  const nonJokerSuits = nonJokers.map(c => getCardSuit(c));

  const counts: Record<number, number> = {};
  nonJokerVals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  const freq = Object.values(counts).sort((a, b) => b - a);

  switch (patternId) {
    case 'one_pair': {
      if (jokers >= 1) return true;
      return (freq[0] || 0) >= 2;
    }
    case 'two_pair': {
      if (jokers >= 2) return true;
      if (jokers === 1) return (freq[0] || 0) >= 2;
      return (freq[0] || 0) >= 2 && (freq[1] || 0) >= 2;
    }
    case 'three_of_a_kind': {
      return ((freq[0] || 0) + jokers) >= 3;
    }
    case 'straight': {
      const uniqueVals = [...new Set(nonJokerVals)];
      if (uniqueVals.length + jokers < 5) return false;
      const checkSpan = (vals) => {
        if (vals.length === 0) return true;
        return (vals[vals.length - 1] - vals[0] <= 4);
      };
      if (checkSpan(uniqueVals)) return true;
      const broadwayVals = uniqueVals.map(v => v === 1 ? 14 : v).sort((a, b) => a - b);
      return checkSpan(broadwayVals);
    }
    case 'flush': {
      const suitSet = new Set(nonJokerSuits);
      return suitSet.size <= 1;
    }
    case 'full_house': {
      if (jokers >= 2) return true;
      if (jokers === 1) return ((freq[0] || 0) >= 2 && (freq[1] || 0) >= 2) || ((freq[0] || 0) >= 3);
      return (freq[0] || 0) >= 3 && (freq[1] || 0) >= 2;
    }
    case 'four_of_a_kind': {
      return ((freq[0] || 0) + jokers) >= 4;
    }
    case 'royal_flush': {
      const suitSet = new Set(nonJokerSuits);
      if (suitSet.size > 1) return false;
      const uniqueVals = [...new Set(nonJokerVals)];
      if (uniqueVals.length + jokers < 5) return false;
      const checkSpan = (vals) => {
        if (vals.length === 0) return true;
        return (vals[vals.length - 1] - vals[0] <= 4);
      };
      if (checkSpan(uniqueVals)) return true;
      const broadwayVals = uniqueVals.map(v => v === 1 ? 14 : v).sort((a, b) => a - b);
      return checkSpan(broadwayVals);
    }
    default:
      return false;
  }
};

// ============================================================================
// 1.6c REGISTRO DEI 12 ARCHETIPI NUCLEO INSTABILE (BERSAGLIO BOMBA)
// ============================================================================

const BOMB_ARCHETYPES = Object.freeze([
  // AREA 1: BALISTICA & DIFESA
  {
    id: 'fracture',
    title: 'Bomba a Frattura',
    icon: '💥',
    color: '#ef4444',
    minSector: 6,
    successDesc: '+30 HP danno puro al nemico',
    failDesc: 'Il nemico recupera +25 HP'
  },
  {
    id: 'barrier',
    title: 'Bomba a Barriera',
    icon: '🛡️',
    color: '#38bdf8',
    minSector: 6,
    successDesc: 'Scudo barriera da 25 HP',
    failDesc: 'Subisci 15 HP di danno diretto'
  },
  {
    id: 'vampiric',
    title: 'Bomba Vampirica',
    icon: 'ðŸ©¸',
    color: '#f43f5e',
    minSector: 6,
    successDesc: 'Ruba 15 HP al nemico curando te',
    failDesc: 'Il nemico ruba 15 HP a te'
  },

  // AREA 2: ECONOMIA & BOTTINO RARO
  {
    id: 'diamond',
    title: 'Bomba di Diamanti',
    icon: '💎',
    color: '#00f2fe',
    minSector: 6,
    successDesc: '+1 Diamante 💎 e +50 Polvere 🌟',
    failDesc: 'Azzeramento polvere stellare del match'
  },
  {
    id: 'ether',
    title: "Bomba d'Etere",
    icon: '🔮',
    color: '#d946ef',
    minSector: 16,
    successDesc: '+3 Etere Cosmico 🔮 istantaneo',
    failDesc: "Brucia tutto l'Etere della battaglia (0 🔮)"
  },
  {
    id: 'stardust_core',
    title: 'Bomba di Plasma Stellare',
    icon: '🌟',
    color: '#facc15',
    minSector: 6,
    successDesc: '+100 Polvere Stellare 🌟 immediata',
    failDesc: 'Perdi 40 Polvere Stellare 🌟'
  },

  // AREA 3: CONTROLLO TATTICO & MODULI
  {
    id: 'overcharge',
    title: 'Bomba a Sovraccarico',
    icon: 'âš¡',
    color: '#fde047',
    minSector: 6,
    successDesc: 'Modulo abilitÃ  ibrido al 100%',
    failDesc: 'Blocco modulo attivo per 2 turni'
  },
  {
    id: 'purge',
    title: 'Bomba di Spurgo',
    icon: 'ðŸ§¯',
    color: '#10b981',
    minSector: 6,
    successDesc: 'Azzera la barra malus nemica (0 tacche)',
    failDesc: 'Barra malus al massimo (Contraccolpo)'
  },
  {
    id: 'quantum',
    title: 'Bomba Quantica',
    icon: 'ðŸŽ²',
    color: '#c084fc',
    minSector: 6,
    successDesc: 'Accende tutte e 4 le tacche Dadi Quantici',
    failDesc: 'Azzera le tacche accumulate sui Dadi'
  },

  // AREA 4: GESTIONE MAZZO & TEMPO
  {
    id: 'temporal',
    title: 'Bomba Temporale',
    icon: 'â³',
    color: '#eab308',
    minSector: 6,
    successDesc: 'Serbatoio tempo al massimo (+30s)',
    failDesc: 'Serbatoio a 0s e prossimo timer a 15s'
  },
  {
    id: 'holographic',
    title: 'Bomba Olografica',
    icon: 'â˜…',
    color: '#e879f9',
    minSector: 6,
    successDesc: 'Carta piÃ¹ bassa diventa Jolly Quantico â˜…',
    failDesc: 'Prossima mano ridotta a sole 5 carte'
  },
  {
    id: 'resonance',
    title: 'Bomba di Risonanza',
    icon: 'ðŸƒ',
    color: '#a855f7',
    minSector: 6,
    successDesc: 'Raddoppia effetti semi (â™¥,â™¦,â™£,â™ ) per 2 turni',
    failDesc: 'Disattiva sinergie dei semi per 2 turni'
  }
]);

// 1.8 LOCALIZZAZIONE LINGUISTICA A 6 LINGUE (IT, EN, DE, ES, FR, ZH)
const LANGUAGES = Object.freeze({
  it: {
    welcome: "Benvenuto a Bordo",
    start: "Inizia a Giocare",
    homeTitle: "Eclissi Stellare",
    homeSubtitle: "Allena la Mente con il Calcolo Strategico",
    adv: "Campagna Stellare",
    pve: "Scommesse del Banco",
    pvp: "Duello Online 1v1",
    pvpTraining: "PvP Addestramento",
    pvpElite: "Lega Ã‰lite Mondiale",
    trisMode: "Tris Stellare",
    leaderboard: "Classifica Simulata",
    decks: "Collezione Mazzi",
    abilitiesMenu: "Modulo AbilitÃ  Ibrido",
    epicItemsMenu: "Varchi & Epici",
    environments: "Sfondi e Pianeti",
    back: "Indietro",
    playSelected: "Attacca",
    passTurn: "Passa Turno",
    abandon: "Ritirati",
    winTitle: "Hai Vinto!",
    loseTitle: "Hai Perso",
    settingsTitle: "Impostazioni",
    musicToggle: "Musica di Sottofondo",
    sfxToggle: "Effetti Sonori",
    activeState: "ATTIVO",
    disabledState: "DISATTIVATO",
    langSelect: "Lingua"
  },
  en: {
    welcome: "Welcome Aboard",
    start: "Start Playing",
    homeTitle: "Stellar Eclipse",
    homeSubtitle: "Train Your Brain with Strategic Math",
    adv: "Stellar Campaign",
    pve: "Dealer Betting",
    pvp: "1v1 Online Duel",
    pvpTraining: "Training PvP",
    pvpElite: "Global Elite League",
    trisMode: "Stellar Trio",
    leaderboard: "Weekly Leaderboard",
    decks: "Deck Collection",
    abilitiesMenu: "Hybrid Ability Module",
    epicItemsMenu: "Rifts & Epics",
    environments: "Celestial Vault",
    back: "Back",
    playSelected: "Attack",
    passTurn: "Pass Turn",
    abandon: "Retreat",
    winTitle: "Victory!",
    loseTitle: "Defeat",
    settingsTitle: "Settings",
    musicToggle: "Music",
    sfxToggle: "Sound Effects",
    activeState: "ACTIVE",
    disabledState: "OFF",
    langSelect: "Language"
  },
  de: {
    welcome: "Willkommen an Bord",
    start: "Jetzt Spielen",
    homeTitle: "Sternen-Finsternis",
    homeSubtitle: "Gehirntraining mit strategischer Mathematik",
    adv: "Sternen-Kampagne",
    pve: "Bank-Wetten",
    pvp: "1v1 Online-Duell",
    pvpTraining: "Trainings-PvP",
    pvpElite: "Weltweite Elite-Liga",
    trisMode: "Sternen-Trio",
    leaderboard: "WÃ¶chentliche Bestenliste",
    decks: "Deck-Sammlung",
    abilitiesMenu: "Hybrides FÃ¤higkeitsmodul",
    epicItemsMenu: "Risse & Epische",
    environments: "HimmelsgewÃ¶lbe",
    back: "ZurÃ¼ck",
    playSelected: "Angriff",
    passTurn: "Zug Beenden",
    abandon: "Aufgeben",
    winTitle: "Gewonnen!",
    loseTitle: "Verloren",
    settingsTitle: "Einstellungen",
    musicToggle: "Musik",
    sfxToggle: "Soundeffekte",
    activeState: "AKTIV",
    disabledState: "AUS",
    langSelect: "Sprache"
  },
  es: {
    welcome: "Bienvenido a Bordo",
    start: "Empezar a Jugar",
    homeTitle: "Eclipse Estelar",
    homeSubtitle: "Entrena tu Mente con CÃ¡lculo EstratÃ©gico",
    adv: "CampaÃ±a Estelar",
    pve: "Apuestas de la Banca",
    pvp: "Duelo Online 1v1",
    pvpTraining: "PvP de Entrenamiento",
    pvpElite: "Liga Ã‰lite Mundial",
    trisMode: "TrÃ­o Estelar",
    leaderboard: "ClasificaciÃ³n Semanal",
    decks: "ColecciÃ³n de Mazos",
    abilitiesMenu: "MÃ³dulo Habilidad HÃ­brido",
    epicItemsMenu: "Grietas y Ã‰picos",
    environments: "BÃ³veda Celeste",
    back: "Volver",
    playSelected: "Atacar",
    passTurn: "Pasar Turno",
    abandon: "Retirarse",
    winTitle: "Â¡Has Ganado!",
    loseTitle: "Has Perdido",
    settingsTitle: "ConfiguraciÃ³n",
    musicToggle: "MÃºsica",
    sfxToggle: "Efectos de Sonido",
    activeState: "ACTIVO",
    disabledState: "DESACTIVADO",
    langSelect: "Idioma"
  },
  fr: {
    welcome: "Bienvenue Ã  Bord",
    start: "Jouer Maintenant",
    homeTitle: "Ã‰clipse Stellaire",
    homeSubtitle: "EntraÃ®nez votre Cerveau par le Calcul StratÃ©gique",
    adv: "Campagne Stellaire",
    pve: "Paris de la Banque",
    pvp: "Duel en Ligne 1v1",
    pvpTraining: "PvP d'EntraÃ®nement",
    pvpElite: "Ligue Ã‰lite Mondiale",
    trisMode: "Trio Stellaire",
    leaderboard: "Classement Hebdomadaire",
    decks: "Collection de Decks",
    abilitiesMenu: "Module CapacitÃ© Hybride",
    epicItemsMenu: "Failles & Ã‰piques",
    environments: "VoÃ»te CÃ©leste",
    back: "Retour",
    playSelected: "Attaquer",
    passTurn: "Passer Tour",
    abandon: "Abandonner",
    winTitle: "Victoire !",
    loseTitle: "DÃ©faite",
    settingsTitle: "ParamÃ¨tres",
    musicToggle: "Musique",
    sfxToggle: "Effets Sonores",
    activeState: "ACTIF",
    disabledState: "DÃ‰SACTIVÃ‰",
    langSelect: "Langue"
  },
  zh: {
    welcome: "æ¬¢è¿Žç™»èˆ°",
    start: "å¼€å§‹å¯¹å±€",
    homeTitle: "æ˜Ÿèš€æˆ˜æ£‹",
    homeSubtitle: "æ•°å­¦ç­–ç•¥æ€ç»´è®­ç»ƒ",
    adv: "æ˜Ÿé™…æˆ˜å½¹",
    pve: "åº„å®¶å¯¹å†³",
    pvp: "1v1å®žæ—¶åœ¨çº¿å¯¹å†³",
    pvpTraining: "è®­ç»ƒæ®µä½æˆ˜",
    pvpElite: "å…¨çƒç²¾è‹±è”èµ›",
    trisMode: "æ˜Ÿé™…ä¸‰é˜¶ç®—é˜µ",
    leaderboard: "æ¯å‘¨å¤©æ¢¯æ¦œ",
    decks: "å¡ç»„æ”¶è—",
    abilitiesMenu: "å¤åˆæŠ€èƒ½æ¨¡å—",
    epicItemsMenu: "è£‚éš™ä¸Žå²è¯—ç‰©",
    environments: "ç©¹é¡¶æ˜Ÿç©º",
    back: "è¿”å›ž",
    playSelected: "å‡ºç‰Œæ”»å‡»",
    passTurn: "ç»“æŸå›žåˆ",
    abandon: "è®¤è¾“é€€å‡º",
    winTitle: "å¯¹å±€èƒœåˆ©ï¼",
    loseTitle: "å¯¹å±€å¤±è´¥",
    settingsTitle: "ç³»ç»Ÿè®¾ç½®",
    musicToggle: "èƒŒæ™¯éŸ³ä¹",
    sfxToggle: "æˆ˜æ–—éŸ³æ•ˆ",
    activeState: "å¼€å¯",
    disabledState: "å…³é—­",
    langSelect: "è¯­è¨€é€‰æ‹©"
  }
});

// 1.9 SEMI BALISTICI & SINERGIE TEMPORALI / ECONOMICHE / CURE PERCENTUALI
const SUITS = Object.freeze([
  { id: 'hearts', name: 'Cuori', symbol: '♥', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.85)', synergy: '+8% HP Max Cura (+12% Toro) | Dorato: +16% (+24%)' },
  { id: 'diamonds', name: 'Quadri', symbol: '♦', color: '#00f2fe', glow: 'rgba(0, 242, 254, 0.85)', synergy: '+2 Polvere 🌟 | Dorato: +20 🌟 e 10% 💎' },
  { id: 'spades', name: 'Picche', symbol: '♠', color: '#c084fc', glow: 'rgba(192, 132, 252, 0.85)', synergy: '+3 HP Danno Diretto | Dorato: +8 HP Puro' },
  { id: 'clubs', name: 'Fiori', symbol: '♣', color: '#10b981', glow: 'rgba(16, 185, 129, 0.85)', synergy: '+5s Serbatoio Tempo | Dorato: +15s e +1🔮' }
]);

// 1.10 FACCE DADI QUANTICI 2D (DISPLAY B)

// 1.11 POOL DEI 4 MALUS TATTICI


// 1.12 MODIFICATORI AMBIENTALI & ANOMALIE DI CAMPO
const ADVENTURE_MODIFIERS = Object.freeze([
  { id: 'standard', name: 'Campo Neutro e Stabile', desc: 'Nessun effetto speciale attivo.' },
  { id: 'fast_timer', name: 'Tempo Rapido', desc: 'Timer di turno ridotto a 30 secondi.' },
  { id: 'no_pass', name: 'Blocco Cambio Carte', desc: 'Impossibile cambiare le carte della mano.' },
  { id: 'boss_combined', name: 'Sfida Boss', desc: 'Timer ridotto e attacchi nemici rinforzati.' }
]);



// 1.13 LIVELLI ESTRATTORE ETERE COSMICO
const EXTRACTOR_LEVELS = Object.freeze({
  1: { level: 1, name: 'Estrattore Base', intervalMs: 28800000, maxStore: 4, battleCap: 2, costDust: 0, reqLevel: 1 },
  2: { level: 2, name: 'Condensatore Tachionico', intervalMs: 21600000, maxStore: 6, battleCap: 3, costDust: 300, reqLevel: 10 },
  3: { level: 3, name: 'Matrice di Risonanza', intervalMs: 14400000, maxStore: 8, battleCap: 4, costDust: 700, reqLevel: 20 },
  4: { level: 4, name: 'Reattore a Punto Zero', intervalMs: 7200000, maxStore: 12, battleCap: 6, costDust: 1500, reqLevel: 35 }
});


// ============================================================================
// 1.16 DATABASE DEI 33 MAZZI & MODULI ABILITÃ€ IBRIDI (3, 6 O 9 LIVELLI)
//      OGNI ELEMENTO DEFINISCE:
//      - Passiva del Mazzo: traits attivi cumulativi (da getDeckActiveTraits)
//      - Attiva del Modulo Ibrido: poteri sbloccati simultaneamente al 100% carica
//      - UpgradeCosts: vincoli precisi di Pilota e Risorse per ciascun livello
// ============================================================================
const ALL_ABILITIES = Object.freeze([
  // MAZZO STARTER BASE (Fisso a Livello 1)
  {
    id: 'neutral_starter',
    name: 'Mazzo Neutro Cadetto',
    element: 'Neutro',
    type: 'starter',
    tier: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'ST',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.55)',
    desc: 'Mazzo di addestramento standard da 54 carte. Nessuna passiva e nessun modulo attivo.',
    deckPassiveDesc: 'Mazzo Neutro Cadetto (Standard di addestramento).',
    deckTrait: {},
    unlockCostDust: 0,
    unlockCostDiamonds: 0,
    baseCostDust: 0,
    maxLevel: 1,
    upgradeCosts: {},
    levels: {
      1: { desc: 'Mazzo standard di addestramento (nessuna passiva/attiva).', activeDesc: 'Nessun effetto attivo.', traits: [] }
    },
    bgGradient: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))'
  },

  // ==========================================================================
  // I 12 SEGNI ZODIACALI (4 SINGOLI A 3 LIV. / 8 DOPPI A 6 LIV.)
  // ==========================================================================

  // 1. ARIETE (Comune - Effetto Singolo - Max Livello 3)
  {
    id: 'aries',
    name: 'Ariete (Impatto Diretto)',
    element: 'ENERGIA',
    type: 'zodiac',

    tier: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'AR',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.75)',
    desc: 'Modulo Attivo: Scarica istantanea di Danni Puri. Passiva: Danno su [* /] e Perforazione.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 400, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1000, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: '+4 HP danno su formule con [*] o [/].', activeDesc: 'Scarica 15 HP di Danno Puro.', traits: [{ type: 'op_boost', ops: ['*', '/'], bonus: 4 }], activeDamage: 15 },
      2: { desc: '+6 HP danno su formule con [*] o [/].', activeDesc: 'Scarica 22 HP di Danno Puro.', traits: [{ type: 'op_boost', ops: ['*', '/'], bonus: 6 }], activeDamage: 22 },
      3: { desc: '+9 HP danno su [* /] e ignora 3 HP di scudi.', activeDesc: 'Scarica 30 HP di Danno Puro.', traits: [{ type: 'op_boost', ops: ['*', '/'], bonus: 9 }, { type: 'armor_pierce', pierce: 3 }], activeDamage: 30 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(69, 10, 10, 0.8), rgba(239, 68, 68, 0.4))'
  },

   // 2. TORO (Comune - Effetto Singolo - Max Livello 3)
  {
    id: 'taurus',
    name: 'Toro (Sintesi Biologica)',
    element: 'GRAVITA',
    type: 'zodiac',

    tier: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'TO',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.75)',
    desc: 'Modulo Attivo: Ripristino vitale immediato. Passiva: Cura potenziata carte Cuori.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 400, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1000, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Carte Cuori curano +12% HP Max.', activeDesc: 'Rigenera +18% HP Max.', traits: [{ type: 'suit_heal_boost', suit: 'hearts', bonusPct: 0.12 }], activeHealPct: 0.18 },
      2: { desc: 'Carte Cuori curano +16% HP Max.', activeDesc: 'Rigenera +26% HP Max.', traits: [{ type: 'suit_heal_boost', suit: 'hearts', bonusPct: 0.16 }], activeHealPct: 0.26 },
      3: { desc: 'Carte Cuori curano +20% HP Max e 50% eccesso diventa Danno.', activeDesc: 'Rigenera +35% HP Max.', traits: [{ type: 'suit_heal_boost', suit: 'hearts', bonusPct: 0.20 }, { type: 'overheal_to_damage', ratio: 0.5 }], activeHealPct: 0.35 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.8), rgba(16, 185, 129, 0.4))'
  },

  // 3. GEMELLI (Comune - Effetto Singolo - Max Livello 3)
  {
    id: 'gemini',
    name: 'Gemelli (Efficienza Rapida)',
    element: 'ENTROPIA',
    type: 'zodiac',

    tier: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'GE',
    color: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.75)',
    desc: 'Modulo Attivo: Ricarica immediata Serbatoio Tempo. Passiva: Riserva tempo iniziale.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 400, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1000, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: '+15s riserva tempo iniziale nel serbatoio.', activeDesc: '+15s al Time Tank.', traits: [{ type: 'initial_tank_bonus', bonus: 15 }], activeTime: 15 },
      2: { desc: '+22s riserva tempo iniziale nel serbatoio.', activeDesc: '+22s al Time Tank.', traits: [{ type: 'initial_tank_bonus', bonus: 22 }], activeTime: 22 },
      3: { desc: '+30s riserva tempo iniziale (Cap) e pesca extra in turni rapidi.', activeDesc: '+30s al Time Tank.', traits: [{ type: 'initial_tank_bonus', bonus: 30 }, { type: 'fast_turn_draw', thresholdSeconds: 10, bonusCards: 1 }], activeTime: 30 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(30, 58, 138, 0.8), rgba(0, 242, 254, 0.4))'
  },

  // 4. CANCRO (Comune - Effetto Singolo - Max Livello 3)
  {
    id: 'cancer',
    name: 'Cancro (Pesca Protettiva)',
    element: 'ZERO_ASSOLUTO',
    type: 'zodiac',
    tier: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'CA',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.75)',
    desc: 'Modulo Attivo: Espansione istantanea mano. Passiva: Recupero risorse su Passa/Timeout.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 400, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1000, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Pesca +1 carta extra se passi il turno o subisci timeout.', activeDesc: 'Ricarica subito la mano a 8 carte.', traits: [{ type: 'pass_draw_boost', bonus: 1 }], activeHandSize: 8 },
      2: { desc: 'Pesca +1 carta e curi +5% HP Max se passi o subisci timeout.', activeDesc: 'Ricarica mano a 8 carte e cura +5% HP.', traits: [{ type: 'pass_draw_boost', bonus: 1 }, { type: 'pass_heal_pct', bonusPct: 0.05 }], activeHandSize: 8 },
      3: { desc: 'Pesca +2 carte, curi +10% HP Max e sotto il 40% HP mano sale a 9 carte.', activeDesc: 'Ricarica mano a 9 carte e cura +10% HP.', traits: [{ type: 'pass_draw_boost', bonus: 2 }, { type: 'pass_heal_pct', bonusPct: 0.10 }, { type: 'low_hp_hand_expansion', thresholdPct: 0.4, handSize: 9 }], activeHandSize: 9 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(8, 51, 68, 0.8), rgba(6, 182, 212, 0.4))'
  },

  // 5. LEONE (Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'leo',
    name: 'Leone (Furia di Grazia)',
    element: 'Fuoco',
    type: 'zodiac',
    tier: 2,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'LE',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.75)',
    desc: 'Modulo Ibrido: Danno Diretto + Semplificazione Bersagli. Passiva: Danno di Esecuzione + Danno Moltiplicazione.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 500, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1200, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3000, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: '+8 HP danno se bersaglio nemico ha <30% HP.', activeDesc: 'Scarica 14 HP di Danno Puro.', traits: [{ type: 'execute_damage', threshold: 0.3, bonus: 8 }], activeDamage: 14 },
      2: { desc: '+12 HP danno se bersaglio nemico ha <35% HP.', activeDesc: 'Scarica 20 HP di Danno Puro.', traits: [{ type: 'execute_damage', threshold: 0.35, bonus: 12 }], activeDamage: 20 },
      3: { desc: '+18 HP danno se bersaglio nemico ha <40% HP.', activeDesc: 'Scarica 26 HP di Danno Puro.', traits: [{ type: 'execute_damage', threshold: 0.4, bonus: 18 }], activeDamage: 26 },
      4: { desc: '[2Âª AbilitÃ ] +18 HP esecuzione e +3 HP su formule [*].', activeDesc: 'Scarica 26 HP Puro + Riduce del 20% i bersagli >30.', traits: [{ type: 'execute_damage', threshold: 0.4, bonus: 18 }, { type: 'op_flat_bonus', op: '*', bonus: 3 }], activeDamage: 26, simplifyTargets: 0.20 },
      5: { desc: '+18 HP esecuzione e +5 HP su formule [*].', activeDesc: 'Scarica 26 HP Puro + Riduce del 35% i bersagli >30.', traits: [{ type: 'execute_damage', threshold: 0.4, bonus: 18 }, { type: 'op_flat_bonus', op: '*', bonus: 5 }], activeDamage: 26, simplifyTargets: 0.35 },
      6: { desc: '+22 HP esecuzione e +8 HP su formule [*].', activeDesc: 'Scarica 30 HP Puro + Ricalibra tutti i bersagli a multipli di 5.', traits: [{ type: 'execute_damage', threshold: 0.45, bonus: 22 }, { type: 'op_flat_bonus', op: '*', bonus: 8 }], activeDamage: 30, simplifyTargets: 0.50 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(69, 26, 3, 0.8), rgba(245, 158, 11, 0.4))'
  },

  // 6. VERGINE (Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'virgo',
    name: 'Vergine (Precisione Pura)',
    element: 'Terra',
    type: 'zodiac',
    tier: 2,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'VI',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.75)',
    desc: 'Modulo Ibrido: Blocco AbilitÃ  Nemiche + Polvere Rapida. Passiva: Danno al 1Â° colpo + Estrazione Polvere.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 500, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1200, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3000, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: '+5 HP danno se attacchi al 1Â° tentativo.', activeDesc: 'Blocca abilitÃ  nemiche per 1 turno.', traits: [{ type: 'first_try_boost', bonus: 5 }], lockTurns: 1 },
      2: { desc: '+8 HP danno se attacchi al 1Â° tentativo.', activeDesc: 'Blocca abilitÃ  nemiche per 2 turni.', traits: [{ type: 'first_try_boost', bonus: 8 }], lockTurns: 2 },
      3: { desc: '+12 HP danno se attacchi al 1Â° tentativo.', activeDesc: 'Blocca abilitÃ  nemiche per 2 turni e azzera dadi nemici.', traits: [{ type: 'first_try_boost', bonus: 12 }], lockTurns: 2, resetEnemyDice: true },
      4: { desc: '[2Âª AbilitÃ ] +12 HP 1Â° colpo e +10🌟 su calcolo rapido (<15s).', activeDesc: 'Blocca abilitÃ  per 2 turni + Genera +25🌟.', traits: [{ type: 'first_try_boost', bonus: 12 }, { type: 'perfect_speed_dust', thresholdSeconds: 15, bonusDust: 10 }], lockTurns: 2, grantDust: 25 },
      5: { desc: '+12 HP 1Â° colpo e +15🌟 su calcolo rapido.', activeDesc: 'Blocca abilitÃ  per 2 turni + Genera +40🌟.', traits: [{ type: 'first_try_boost', bonus: 12 }, { type: 'perfect_speed_dust', thresholdSeconds: 15, bonusDust: 15 }], lockTurns: 2, grantDust: 40 },
      6: { desc: '+16 HP 1Â° colpo e +25🌟 su calcolo rapido.', activeDesc: 'Blocca abilitÃ  per 3 turni + Genera +60🌟 e 1💎.', traits: [{ type: 'first_try_boost', bonus: 16 }, { type: 'perfect_speed_dust', thresholdSeconds: 15, bonusDust: 25 }], lockTurns: 3, grantDust: 60, grantDiamonds: 1 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(54, 83, 20, 0.8), rgba(132, 204, 22, 0.4))'
  },

  // 7. BILANCIA (Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'libra',
    name: 'Bilancia (Blindatura Calibrata)',
    element: 'Aria',
    type: 'zodiac',
    tier: 2,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'LI',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.75)',
    desc: 'Modulo Ibrido: Sifone Vitale + Scudo Reattivo. Passiva: Difesa fissa + Furto HP.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 500, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1200, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3000, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Riduce di 3 HP ogni danno subito.', activeDesc: 'Ruba 10 HP al nemico curando te.', traits: [{ type: 'flat_defense', reduction: 3 }], siphonHp: 10 },
      2: { desc: 'Riduce di 5 HP ogni danno subito.', activeDesc: 'Ruba 16 HP al nemico curando te.', traits: [{ type: 'flat_defense', reduction: 5 }], siphonHp: 16 },
      3: { desc: 'Riduce di 7 HP ogni danno subito.', activeDesc: 'Ruba 22 HP al nemico curando te.', traits: [{ type: 'flat_defense', reduction: 7 }], siphonHp: 22 },
      4: { desc: '[2Âª AbilitÃ ] Difesa -7 HP e ogni attacco ruba 3 HP al nemico.', activeDesc: 'Ruba 22 HP + Barriera da 15 HP.', traits: [{ type: 'flat_defense', reduction: 7 }, { type: 'hit_siphon', hp: 3 }], siphonHp: 22, shieldHp: 15 },
      5: { desc: 'Difesa -8 HP e ogni attacco ruba 5 HP.', activeDesc: 'Ruba 26 HP + Barriera da 20 HP.', traits: [{ type: 'flat_defense', reduction: 8 }, { type: 'hit_siphon', hp: 5 }], siphonHp: 26, shieldHp: 20 },
      6: { desc: 'Difesa -10 HP e ogni attacco ruba 7 HP.', activeDesc: 'Ruba 32 HP + Barriera da 30 HP.', traits: [{ type: 'flat_defense', reduction: 10 }, { type: 'hit_siphon', hp: 7 }], siphonHp: 32, shieldHp: 30 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(54, 7, 100, 0.8), rgba(168, 85, 247, 0.4))'
  },

  // 8. SCORPIONE (Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'scorpio',
    name: 'Scorpione (Perforazione Tracciante)',
    element: 'Acqua',
    type: 'zodiac',
    tier: 2,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'SC',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.75)',
    desc: 'Modulo Ibrido: Mutilazione Mano Nemica + Veleno. Passiva: Danni Picche + TossicitÃ  continua.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 500, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1200, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3000, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Carte Picche (â™ ) infliggono +5 HP di danno (invece di +3).', activeDesc: 'Riduce la mano nemica a 5 carte per 1 turno.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 2 }], restrictEnemyHand: 5 },
      2: { desc: 'Carte Picche (â™ ) infliggono +7 HP di danno.', activeDesc: 'Riduce mano nemica a 5 carte per 2 turni.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 4 }], restrictEnemyHand: 5 },
      3: { desc: 'Carte Picche (â™ ) infliggono +10 HP di danno.', activeDesc: 'Riduce mano nemica a 4 carte per 1 turno.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 7 }], restrictEnemyHand: 4 },
      4: { desc: '[2Âª AbilitÃ ] Picche +10 HP e formule con Picche applicano 3 HP veleno per 2T.', activeDesc: 'Mano nemica a 5 carte + Applica 5 HP veleno per 2 turni.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 7 }, { type: 'poison_dot', dotDmg: 3, duration: 2 }], restrictEnemyHand: 5, poisonDmg: 5 },
      5: { desc: 'Picche +12 HP e veleno sale a 5 HP per 2T.', activeDesc: 'Mano nemica a 5 carte + Applica 8 HP veleno per 2 turni.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 9 }, { type: 'poison_dot', dotDmg: 5, duration: 2 }], restrictEnemyHand: 5, poisonDmg: 8 },
      6: { desc: 'Picche +15 HP e veleno sale a 8 HP per 3 turni consecutivi.', activeDesc: 'Mano nemica a 4 carte + Applica 12 HP veleno per 3 turni.', traits: [{ type: 'suit_damage_boost', suit: 'spades', bonus: 12 }, { type: 'poison_dot', dotDmg: 8, duration: 3 }], restrictEnemyHand: 4, poisonDmg: 12 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(80, 7, 36, 0.8), rgba(244, 63, 94, 0.4))'
  },

  // 9. SAGITTARIO (Super Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'sagittarius',
    name: 'Sagittario (Buffer Temporale)',
    element: 'Fuoco',
    type: 'zodiac',
    tier: 3,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'SA',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.75)',
    desc: 'Modulo Ibrido: Annullamento Timeout + Danno Balistico. Passiva: Tempo Fiori + Cecchino Bersagli Alti.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1600, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2500, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3800, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Carte Fiori (â™£) donano +10s al serbatoio tempo.', activeDesc: 'Annulla danni da timeout e dona +15s.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 5 }], timeoutShield: true, activeTime: 15 },
      2: { desc: 'Carte Fiori (â™£) donano +15s al serbatoio tempo.', activeDesc: 'Annulla danni da timeout e dona +25s.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 10 }], timeoutShield: true, activeTime: 25 },
      3: { desc: 'Carte Fiori (â™£) donano +20s al serbatoio tempo.', activeDesc: 'Annulla danni da timeout e riempie Time Tank al 100%.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 15 }], timeoutShield: true, activeTime: 30 },
      4: { desc: '[2Âª AbilitÃ ] Fiori +20s e +5 HP danno se il target centrato Ã¨ >= 30.', activeDesc: 'Time Tank al max (+30s) + Prossimo colpo >30 ha +10 HP danno.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 15 }, { type: 'high_target_snipe', minTarget: 30, bonus: 5 }], activeTime: 30, snipeBonus: 10 },
      5: { desc: 'Fiori +25s e +8 HP danno su target >= 30.', activeDesc: 'Time Tank al max + Prossimo colpo ha +15 HP danno.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 20 }, { type: 'high_target_snipe', minTarget: 30, bonus: 8 }], activeTime: 30, snipeBonus: 15 },
      6: { desc: 'Fiori +30s e +14 HP danno su target >= 30.', activeDesc: 'Time Tank al max + Infligge subito 20 HP e azzera timer nemico.', traits: [{ type: 'suit_time_boost', suit: 'clubs', bonus: 25 }, { type: 'high_target_snipe', minTarget: 30, bonus: 14 }], activeTime: 30, snipeBonus: 20, drainEnemyTime: 20 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(67, 20, 7, 0.8), rgba(249, 115, 22, 0.4))'
  },

  // 10. CAPRICORNO (Super Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'capricorn',
    name: 'Capricorno (Ammortizzatore Rinculo)',
    element: 'Terra',
    type: 'zodiac',
    tier: 3,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'CP',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.75)',
    desc: 'Modulo Ibrido: Assorbimento Danno Nemico + Scarica Malus. Passiva: Dimezza rinculo + ImmunitÃ  danni diretti.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1600, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2500, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3800, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Danni da contraccolpo e timeout ridotti del 50%.', activeDesc: 'Assorbe e annulla il prossimo attacco nemico.', traits: [{ type: 'recoil_halved', reductionPct: 0.50 }], absorbHit: true },
      2: { desc: 'Danni da contraccolpo e timeout ridotti del 65%.', activeDesc: 'Annulla prossimo attacco nemico e scarica 2 tacche malus.', traits: [{ type: 'recoil_halved', reductionPct: 0.65 }], absorbHit: true, dischargeMalus: 2 },
      3: { desc: 'Danni da contraccolpo e timeout ridotti dell\'80%.', activeDesc: 'Annulla prossimo attacco nemico e scarica 4 tacche malus.', traits: [{ type: 'recoil_halved', reductionPct: 0.80 }], absorbHit: true, dischargeMalus: 4 },
      4: { desc: '[2Âª AbilitÃ ] Rinculo ridotto dell\'80% e immunitÃ  totale a Perdita HP Immediata.', activeDesc: 'Annulla prossimo attacco + Azzera totalmente Barra Malus.', traits: [{ type: 'recoil_halved', reductionPct: 0.80 }, { type: 'malus_drain_immunity' }], absorbHit: true, dischargeMalus: 6 },
      5: { desc: 'Rinculo ridotto dell\'85% e immunitÃ  Perdita HP.', activeDesc: 'Annulla attacco, azzera malus e riflette 10 HP al nemico.', traits: [{ type: 'recoil_halved', reductionPct: 0.85 }, { type: 'malus_drain_immunity' }], absorbHit: true, dischargeMalus: 6, reflectDmg: 10 },
            6: { desc: 'Rinculo ridotto del 90% e immunità Perdita HP.', activeDesc: 'Annulla attacco, azzera malus e riflette 20 HP puri.', traits: [{ type: 'recoil_halved', reductionPct: 0.90 }, { type: 'malus_drain_immunity' }], absorbHit: true, dischargeMalus: 6, reflectDmg: 20 }

    },
    bgGradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(148, 163, 184, 0.4))'
  },

  // 11. ACQUARIO (Super Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'aquarius',
    name: 'Acquario (Catalizzatore Etere)',
    element: 'Aria',
    type: 'zodiac',
    tier: 3,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'AQ',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.75)',
    desc: 'Modulo Ibrido: Sintesi Istantanea Etere + Risonanza Dorata. Passiva: Sconto Jolly + Cura Eterea.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1600, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2500, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3800, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Il Jolly Quantico costa 1 Etere (invece di 2).', activeDesc: 'Genera subito +2 Etere Cosmico 🔮.', traits: [{ type: 'joker_cost_discount', discount: 1 }], grantEther: 2 },
      2: { desc: 'Jolly a 1 Etere e inizi ogni match con +1 Etere.', activeDesc: 'Genera subito +3 Etere Cosmico 🔮.', traits: [{ type: 'joker_cost_discount', discount: 1 }, { type: 'initial_ether_bonus', amount: 1 }], grantEther: 3 },
      3: { desc: 'Jolly a 1 Etere e inizi ogni match con +2 Etere.', activeDesc: 'Genera subito +4 Etere Cosmico 🔮.', traits: [{ type: 'joker_cost_discount', discount: 1 }, { type: 'initial_ether_bonus', amount: 2 }], grantEther: 4 },
      4: { desc: '[2Âª AbilitÃ ] Jolly a 1 Etere e spendere Etere cura +10% HP Max.', activeDesc: 'Genera +4 Etere + Trasforma 1 carta in Carta Dorata [2T].', traits: [{ type: 'joker_cost_discount', discount: 1 }, { type: 'initial_ether_bonus', amount: 2 }, { type: 'ether_spend_heal', healPct: 0.10 }], grantEther: 4, makeGolden: true },
      5: { desc: 'Spendere Etere cura +15% HP Max e inizi con +3 Etere.', activeDesc: 'Genera +5 Etere + Trasforma 1 carta in Carta Dorata [2T].', traits: [{ type: 'joker_cost_discount', discount: 1 }, { type: 'initial_ether_bonus', amount: 3 }, { type: 'ether_spend_heal', healPct: 0.15 }], grantEther: 5, makeGolden: true },
      6: { desc: 'Spendere Etere cura +20% HP Max e pescare dal mazzo costa -2 Etere.', activeDesc: 'Genera +6 Etere + 2 Carte Dorate garantite in mano.', traits: [{ type: 'joker_cost_discount', discount: 1 }, { type: 'initial_ether_bonus', amount: 3 }, { type: 'ether_spend_heal', healPct: 0.20 }, { type: 'deck_extract_discount', cost: 2 }], grantEther: 6, makeGolden: true, doubleGolden: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(12, 74, 110, 0.8), rgba(14, 165, 233, 0.4))'
  },

  // 12. PESCI (Super Rara - Effetto Doppio - Max Livello 6)
  {
    id: 'pisces',
    name: 'Pesci (Tolleranza Quantica)',
    element: 'Acqua',
    type: 'zodiac',
    tier: 3,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'PI',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.75)',
    desc: 'Modulo Ibrido: Tolleranza Calcolo Istantanea + Ricarica Tempo. Passiva: Scarto numerico valido + Danno tolleranza.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1600, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2500, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3800, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5500, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Scarto numerico di +-1 dal target valido per l\'attacco.', activeDesc: 'Valida qualsiasi calcolo con scarto +-2 per questo turno.', traits: [{ type: 'tolerance_margin', margin: 1 }], activeMargin: 2 },
      2: { desc: 'Scarto numerico di +-2 dal target valido per l\'attacco.', activeDesc: 'Valida calcoli con scarto +-3 per questo turno.', traits: [{ type: 'tolerance_margin', margin: 2 }], activeMargin: 3 },
      3: { desc: 'Scarto +-2 e calcolo con tolleranza assegna +5s al serbatoio.', activeDesc: 'Valida scarto +-3 e accredita +10s al Time Tank.', traits: [{ type: 'tolerance_margin', margin: 2 }, { type: 'tolerance_time_reward', bonusSeconds: 5 }], activeMargin: 3, activeTime: 10 },
      4: { desc: '[2Âª AbilitÃ ] Scarto +-2, +5s tempo e +5 HP danno con tolleranza.', activeDesc: 'Valida scarto +-4 + Aggiunge +10 HP danno puro all\'attacco.', traits: [{ type: 'tolerance_margin', margin: 2 }, { type: 'tolerance_time_reward', bonusSeconds: 5 }, { type: 'tolerance_flat_dmg', bonus: 5 }], activeMargin: 4, activeDmg: 10 },
      5: { desc: 'Scarto +-2, +8s tempo e +8 HP danno con tolleranza.', activeDesc: 'Valida scarto +-4 + Aggiunge +15 HP danno puro all\'attacco.', traits: [{ type: 'tolerance_margin', margin: 2 }, { type: 'tolerance_time_reward', bonusSeconds: 8 }, { type: 'tolerance_flat_dmg', bonus: 8 }], activeMargin: 4, activeDmg: 15 },
      6: { desc: 'Scarto +-3, +12s tempo e +14 HP danno con tolleranza.', activeDesc: 'Valida scarto +-5 + Aggiunge +25 HP danno puro all\'attacco.', traits: [{ type: 'tolerance_margin', margin: 3 }, { type: 'tolerance_time_reward', bonusSeconds: 12 }, { type: 'tolerance_flat_dmg', bonus: 14 }], activeMargin: 5, activeDmg: 25 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8), rgba(99, 102, 241, 0.4))'
  },

  // ==========================================================================
  // I 20 MAZZI PLANETARI (P1-P4 SINGOLI / P5-P14 DOPPI / P15-P20 TRIPLI)
  // ==========================================================================

  // P1 TERRA (Comune - Singolo - Max Livello 3)
  {
    id: 'planet_char_1',
    name: 'Terra (Gaia)',
    deckPassiveDesc: 'HP iniziali aggiuntivi; protezione al primo colpo dal livello 3.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 1,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'P1',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.75)',
    desc: 'Modulo Attivo: Sovraccarico Ricompense Vittoria. Passiva: Estrazione Polvere da Quadri.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Carte Quadri (â™¦) estraggono +4 Polvere (invece di +2).', activeDesc: '+30% Crediti e Polvere se vinci la partita.', traits: [{ type: 'suit_dust_boost', suit: 'diamonds', bonus: 2 }, { type: 'victory_reward_mult', mult: 1.15 }] },
      2: { desc: 'Carte Quadri (â™¦) estraggono +6 Polvere.', activeDesc: '+50% Crediti e Polvere se vinci la partita.', traits: [{ type: 'suit_dust_boost', suit: 'diamonds', bonus: 4 }, { type: 'victory_reward_mult', mult: 1.30 }] },
      3: { desc: 'Carte Quadri (â™¦) estraggono +9 Polvere e vittoria assegna +50% risorse fisso.', activeDesc: '+80% Crediti e Polvere se vinci la partita.', traits: [{ type: 'suit_dust_boost', suit: 'diamonds', bonus: 7 }, { type: 'victory_reward_mult', mult: 1.50 }] }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(56, 189, 248, 0.35))'
  },


  // P2 MARTE (Comune - Singolo - Max Livello 3)
  {
    id: 'planet_char_2',
    name: 'Marte (Tharsis)',
    deckPassiveDesc: 'Danno crescente nelle salve consecutive, senza critici.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 2,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'P2',
    color: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.75)',
    desc: 'Modulo Attivo: Bombardamento Orbitale. Passiva: Danni progressivi per attacchi consecutivi.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Ogni attacco consecutivo a segno aumenta il danno di +3 HP.', activeDesc: 'Scarica 18 HP di Danno Termico.', traits: [{ type: 'streak_damage_buildup', bonusPerHit: 3 }], activeDamage: 18 },
      2: { desc: 'Ogni attacco consecutivo a segno aumenta il danno di +6 HP.', activeDesc: 'Scarica 25 HP di Danno Termico.', traits: [{ type: 'streak_damage_buildup', bonusPerHit: 6 }], activeDamage: 25 },
      3: { desc: 'Ogni attacco consecutivo +10 HP danno e al 3Â° colpo attiva Critico x1.5.', activeDesc: 'Scarica 35 HP di Danno Termico.', traits: [{ type: 'streak_damage_buildup', bonusPerHit: 10 }, { type: 'streak_crit_trigger', hitsRequired: 3, critMult: 1.5 }], activeDamage: 35 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(244, 63, 94, 0.35))'
  },

  // P3 VENERE (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_3',
    name: 'Venere (Afrodite)',
    deckPassiveDesc: 'Il primo cambio della preparazione cura una piccola quota HP.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 3,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P3',
    color: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.75)',
    desc: 'Modulo Ibrido: Cambio Carte Istantaneo Gratuito + Rigenerazione. Passiva: Annullamento costi cambio carte.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3200, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4800, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Cambiare carte non consuma secondi dal timer.', activeDesc: 'Cambia fino a 3 carte a costo zero.', traits: [{ type: 'free_exchange_time' }], freeExchange: true },
      2: { desc: 'Cambio carte senza perdita di tempo e senza cura avversaria.', activeDesc: 'Cambia 3 carte gratis e cura +8% HP.', traits: [{ type: 'free_exchange_time' }, { type: 'exchange_no_enemy_heal' }], freeExchange: true, healPct: 0.08 },
      3: { desc: 'Cambio carte gratis a 0 HP, no tempo, no cura avversaria.', activeDesc: 'Cambia 3 carte gratis e cura +15% HP.', traits: [{ type: 'free_exchange_time' }, { type: 'exchange_no_enemy_heal' }, { type: 'free_exchange_no_self_dmg' }], freeExchange: true, healPct: 0.15 },
      4: { desc: '[2Âª AbilitÃ ] Cambio carte gratis e cambiare carte rigenera +5% HP Max.', activeDesc: 'Cambia carte gratis, cura +15% HP e rimuove 2 tacche malus.', traits: [{ type: 'free_exchange_time' }, { type: 'exchange_no_enemy_heal' }, { type: 'free_exchange_no_self_dmg' }, { type: 'exchange_heal_pct', bonusPct: 0.05 }], freeExchange: true, healPct: 0.15, purgeMalus: 2 },
      5: { desc: 'Cambiare carte rigenera +8% HP Max.', activeDesc: 'Cambia carte gratis, cura +20% HP e rimuove 3 tacche malus.', traits: [{ type: 'free_exchange_time' }, { type: 'exchange_no_enemy_heal' }, { type: 'free_exchange_no_self_dmg' }, { type: 'exchange_heal_pct', bonusPct: 0.08 }], freeExchange: true, healPct: 0.20, purgeMalus: 3 },
      6: { desc: 'Cambiare carte rigenera +12% HP Max e assegna +5s al Time Tank.', activeDesc: 'Cambia carte gratis, cura +25% HP, azzera malus e dona +15s.', traits: [{ type: 'free_exchange_time' }, { type: 'exchange_no_enemy_heal' }, { type: 'free_exchange_no_self_dmg' }, { type: 'exchange_heal_pct', bonusPct: 0.12 }], freeExchange: true, healPct: 0.25, purgeMalus: 6, addTime: 15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(139, 92, 246, 0.35))'
  },

  // P4 MERCURIO (Comune - Singolo - Max Livello 3)
  {
    id: 'planet_char_4',
    name: 'Mercurio (Termico)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 4,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'P4',
    color: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.75)',
    desc: 'Modulo Attivo: Sovraccarico Dadi Quantici. Passiva: Riduzione requisiti tacche dadi.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Dadi Quantici richiedono 3 operatori (anzichÃ© 4).', activeDesc: 'Accende subito 2 tacche sui Dadi Quantici.', traits: [{ type: 'dice_notches_req', required: 3 }], grantNotches: 2 },
      2: { desc: 'Dadi richiedono 3 operatori e iniziano con 1 tacca accesa.', activeDesc: 'Accende subito 3 tacche sui Dadi Quantici.', traits: [{ type: 'dice_notches_req', required: 3 }, { type: 'dice_start_notch', count: 1 }], grantNotches: 3 },
      3: { desc: 'Dadi richiedono 2 soli operatori e ogni lancio infligge 5 HP danno puro.', activeDesc: 'Attiva istantaneamente il lancio dei Dadi Quantici.', traits: [{ type: 'dice_notches_req', required: 2 }, { type: 'dice_start_notch', count: 1 }, { type: 'dice_roll_burn', damage: 5 }], instantRoll: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(236, 72, 153, 0.35))'
  },

  // P5 GIOVE (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_5',
    name: 'Giove (Grande Macchia)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 5,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P5',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.75)',
    desc: 'Modulo Ibrido: Espansione Mano + Raffica Ciclonica. Passiva: Mano permanentemente a 8/9 carte + Danno carte.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2000, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3200, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 4800, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Mano aumentata permanentemente a 8 carte.', activeDesc: 'Pesca subito +2 carte dal mazzo.', traits: [{ type: 'hand_size_bonus', size: 8 }], drawCards: 2 },
      2: { desc: 'Mano a 8 carte e prima pesca mirata a costo 0 Etere.', activeDesc: 'Pesca +2 carte e la prima pesca mirata Ã¨ gratis.', traits: [{ type: 'hand_size_bonus', size: 8 }, { type: 'first_extract_free' }], drawCards: 2, freeExtract: true },
      3: { desc: 'Mano aumentata permanentemente a 9 carte.', activeDesc: 'Pesca +3 carte dal mazzo.', traits: [{ type: 'hand_size_bonus', size: 9 }, { type: 'first_extract_free' }], drawCards: 3, freeExtract: true },
      4: { desc: '[2Âª AbilitÃ ] Mano a 9 carte e +4 HP danno su formule da 3+ carte.', activeDesc: 'Pesca +3 carte + Infligge 15 HP di Danno Ciclonico.', traits: [{ type: 'hand_size_bonus', size: 9 }, { type: 'first_extract_free' }, { type: 'cards_count_flat_dmg', minCards: 3, bonus: 4 }], drawCards: 3, activeDamage: 15 },
      5: { desc: 'Mano a 9 carte e +7 HP danno su formule da 3+ carte.', activeDesc: 'Pesca +3 carte + Infligge 22 HP di Danno Ciclonico.', traits: [{ type: 'hand_size_bonus', size: 9 }, { type: 'first_extract_free' }, { type: 'cards_count_flat_dmg', minCards: 3, bonus: 7 }], drawCards: 3, activeDamage: 22 },
      6: { desc: 'Mano a 9 carte e +12 HP danno su formule da 3+ carte.', activeDesc: 'Pesca +4 carte + Infligge 30 HP di Danno Ciclonico puro.', traits: [{ type: 'hand_size_bonus', size: 9 }, { type: 'first_extract_free' }, { type: 'cards_count_flat_dmg', minCards: 3, bonus: 12 }], drawCards: 4, activeDamage: 30 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(16, 185, 129, 0.35))'
  },

  // P6 SATURNO (Comune - Singolo - Max Livello 3)
  {
    id: 'planet_char_6',
    name: 'Saturno (Anelli di Crono)',
    deckPassiveDesc: 'Mitiga la prima salva subita nella battaglia.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 6,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'P6',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.75)',
    desc: 'Modulo Attivo: Rallentamento Cronotopico. Passiva: Estensione Barra Malus + Scudo Anulare (-50%).',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Barra Malus richiede 7 tacche (anzichÃ© 6) per il contraccolpo.', activeDesc: 'Sottrae 15s al timer nemico.', traits: [{ type: 'malus_capacity_bonus', extraTicks: 1 }], slowEnemy: 15 },
      2: { desc: 'Barra Malus richiede 8 tacche per il contraccolpo.', activeDesc: 'Sottrae 25s al timer nemico.', traits: [{ type: 'malus_capacity_bonus', extraTicks: 2 }], slowEnemy: 25 },
      3: { desc: 'Barra Malus richiede 9 tacche e Scudo Anulare dimezza (-50%) il primo colpo subito.', activeDesc: 'Dimezza il timer nemico e svuota 15s dal suo Time Tank.', traits: [{ type: 'malus_capacity_bonus', extraTicks: 3 }, { type: 'first_hit_shield', reductionPct: 0.50 }], slowEnemy: 30, drainTank: 15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(245, 158, 11, 0.35))'
  },

  // P7 URANO (Comune - Singolo - Max Livello 3)
  {
    id: 'planet_char_7',
    name: 'Urano (Sentinella Ionica)',
    deckPassiveDesc: 'Mitiga un colpo in un settore con anomalia o interdizione.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 1,
    planetNum: 7,
    rarity: 'Comune',
    category: 'single',
    categoryName: 'Effetto Singolo',
    symbol: 'P7',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.75)',
    desc: 'Modulo Attivo: Blocco Totale Cambio Carte Nemico. Passiva: Bypass anomalie + Sovratensione.',
    unlockCostDust: 150,
    unlockCostDiamonds: 10,
    baseCostDust: 100,
    maxLevel: 3,
    upgradeCosts: {
      2: { dust: 450, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1100, diamonds: 5, reqPilotLevel: 25 }
    },
    levels: {
      1: { desc: 'Bypassa 1 volta per turno l\'operatore bloccato da anomalie.', activeDesc: 'Blocca il cambio carte nemico per 1 turno.', traits: [{ type: 'bypass_anomaly_op', usesPerTurn: 1 }], lockEnemyExchange: 1 },
      2: { desc: 'Bypassa 2 volte per turno l\'operatore bloccato da anomalie.', activeDesc: 'Blocca il cambio carte nemico per 2 turni.', traits: [{ type: 'bypass_anomaly_op', usesPerTurn: 2 }], lockEnemyExchange: 2 },
      3: { desc: 'ImmunitÃ  al blocco operatori e +6 HP danno alternando operatori diversi.', activeDesc: 'Blocca cambio carte nemico per 3 turni e infligge 15 HP di shock.', traits: [{ type: 'bypass_anomaly_op', usesPerTurn: 999 }, { type: 'rotation_ops_boost', bonus: 6 }], lockEnemyExchange: 3, activeDmg: 15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(6, 182, 212, 0.35))'
  },

  // P8 NETTUNO (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_8',
    name: 'Nettuno (Leviatano)',
    deckPassiveDesc: 'Un Jolly Quantico aggiuntivo nel mazzo; un altro dai livelli avanzati.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 8,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P8',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.75)',
    desc: 'Modulo Ibrido: Iniezione Jolly Quantici + Onda Abissale. Passiva: Mazzo personale con piÃ¹ Jolly.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Il tuo mazzo personale contiene 3 Jolly Quantici (anzichÃ© 2).', activeDesc: 'Genera subito 1 Jolly Quantico in mano.', traits: [{ type: 'joker_deck_count', count: 3 }], addJoker: 1 },
      2: { desc: 'Il tuo mazzo contiene 4 Jolly Quantici.', activeDesc: 'Genera 1 Jolly Quantico a valore libero (0 Etere).', traits: [{ type: 'joker_deck_count', count: 4 }], addJoker: 1, freeJokerVal: true },
      3: { desc: 'Il tuo mazzo contiene 5 Jolly Quantici.', activeDesc: 'Genera 2 Jolly Quantici in mano.', traits: [{ type: 'joker_deck_count', count: 5 }], addJoker: 2 },
      4: { desc: '[2Âª AbilitÃ ] Mazzo con 5 Jolly e giocare un Jolly infligge +5 HP danno.', activeDesc: 'Genera 2 Jolly + Scarica 15 HP di Danno Abissale.', traits: [{ type: 'joker_deck_count', count: 5 }, { type: 'joker_play_dmg', bonus: 5 }], addJoker: 2, activeDmg: 15 },
      5: { desc: 'Mazzo con 5 Jolly e giocare un Jolly infligge +8 HP danno.', activeDesc: 'Genera 2 Jolly + Scarica 22 HP di Danno Abissale.', traits: [{ type: 'joker_deck_count', count: 5 }, { type: 'joker_play_dmg', bonus: 8 }], addJoker: 2, activeDmg: 22 },
      6: { desc: 'Mazzo con 6 Jolly e giocare un Jolly infligge +14 HP danno puro.', activeDesc: 'Genera 2 Jolly + Scarica 30 HP Danno Puro e cura +15% HP.', traits: [{ type: 'joker_deck_count', count: 6 }, { type: 'joker_play_dmg', bonus: 14 }], addJoker: 2, activeDmg: 30, healPct: 0.15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(132, 204, 22, 0.35))'
  },

  // P9 PLUTONE (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_9',
    name: 'Plutone (Signore delle Ombre)',
    deckPassiveDesc: 'Sacrifica una piccola quantità di HP per danni aggiuntivi su una salva valida.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 9,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P9',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.75)',
    desc: 'Modulo Ibrido: Scarica Antimateria + Sifone Oscuro. Passiva: Patto di Sangue + Cura Transizione Boss.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Patto di Sangue: sacrifica 2 HP per +8 HP di danno su ogni colpo.', activeDesc: 'Sacrifica 6 HP per infliggere 22 HP di Danno Puro.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 8 }], selfDmg: 6, activeDmg: 22 },
      2: { desc: 'Patto di Sangue: sacrifica 2 HP per +13 HP di danno.', activeDesc: 'Sacrifica 6 HP per infliggere 30 HP di Danno Puro.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 13 }], selfDmg: 6, activeDmg: 30 },
      3: { desc: 'Patto di Sangue: sacrifica 2 HP per +20 HP di danno.', activeDesc: 'Sacrifica 6 HP per infliggere 40 HP di Danno Puro.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 20 }], selfDmg: 6, activeDmg: 40 },
      4: { desc: '[2Âª AbilitÃ ] Danno +20 HP e ogni cambio fase Boss rigenera +25 HP.', activeDesc: 'Sacrifica 6 HP per 40 HP danno + Rigenera subito 20 HP.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 20 }, { type: 'phase_clear_heal', hp: 25 }], selfDmg: 6, activeDmg: 40, healHp: 20 },
      5: { desc: 'Danno +24 HP e cambio fase Boss rigenera +35 HP.', activeDesc: 'Sacrifica 4 HP per 45 HP danno + Rigenera subito 25 HP.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 24 }, { type: 'phase_clear_heal', hp: 35 }], selfDmg: 4, activeDmg: 45, healHp: 25 },
      6: { desc: 'Danno +30 HP puro e cambio fase Boss rigenera +50 HP.', activeDesc: 'Sacrifica 4 HP per 55 HP danno + Rigenera 35 HP e ruba 10s nemici.', traits: [{ type: 'blood_damage', selfDamage: 2, bonusDamage: 30 }, { type: 'phase_clear_heal', hp: 50 }], selfDmg: 4, activeDmg: 55, healHp: 35, drainTime: 10 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(56, 189, 248, 0.35))'
  },

  // P10 TITANO (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_10',
    name: 'Titano (Colosso di Metano)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 10,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P10',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.75)',
    desc: 'Modulo Ibrido: Spine Difensive Reattive + Cappa di Metano. Passiva: Danno riflesso + Protezione da critici.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Spine: riflette 4 HP di danno fisso a ogni colpo subito.', activeDesc: 'Riflette il 40% del prossimo danno subito.', traits: [{ type: 'thorns_damage', value: 4 }], reflectPct: 0.40 },
      2: { desc: 'Spine: riflette 7 HP di danno fisso a ogni colpo subito.', activeDesc: 'Riflette il 60% del prossimo danno subito.', traits: [{ type: 'thorns_damage', value: 7 }], reflectPct: 0.60 },
      3: { desc: 'Spine: riflette 11 HP di danno fisso a ogni colpo subito.', activeDesc: 'Riflette l\'80% del prossimo danno subito.', traits: [{ type: 'thorns_damage', value: 11 }], reflectPct: 0.80 },
      4: { desc: '[2Âª AbilitÃ ] Spine 11 HP e riduce del 50% i danni da colpi critici nemici.', activeDesc: 'Riflette l\'80% danno + Riduce del 50% tutti i danni per 2 turni.', traits: [{ type: 'thorns_damage', value: 11 }, { type: 'crit_damage_reduction', reductionPct: 0.50 }], reflectPct: 0.80, damageCutPct: 0.50 },
      5: { desc: 'Spine 14 HP e riduce del 65% i critici nemici.', activeDesc: 'Riflette il 100% danno + Riduce del 60% i danni per 2 turni.', traits: [{ type: 'thorns_damage', value: 14 }, { type: 'crit_damage_reduction', reductionPct: 0.65 }], reflectPct: 1.00, damageCutPct: 0.60 },
      6: { desc: 'Spine 18 HP e riduce dell\'80% i critici nemici.', activeDesc: 'Riflette il 120% danno + ImmunitÃ  totale ai danni critici per 3 turni.', traits: [{ type: 'thorns_damage', value: 18 }, { type: 'crit_damage_reduction', reductionPct: 0.80 }], reflectPct: 1.20, damageCutPct: 0.75 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(250, 204, 21, 0.35))'
  },

  // P11 EUROPA (Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_11',
    name: 'Europa (Idra Criogenica)',
    deckPassiveDesc: 'Sconto Etere sulle estrazioni mirate dal proprio mazzo.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 11,
    rarity: 'Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P11',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.75)',
    desc: 'Modulo Ibrido: Pesca Mirata Istantanea + Danno Crioidrotermale. Passiva: Sconto Etere pesca + Danno [/].',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Pescare carte mirate dal mazzo costa 2 Etere (anzichÃ© 4).', activeDesc: 'Estrai subito 1 carta mirata dal mazzo a 0 Etere.', traits: [{ type: 'deck_extract_discount', cost: 2 }], freeExtractCount: 1 },
      2: { desc: 'Pescare carte mirate dal mazzo costa 1 Etere.', activeDesc: 'Estrai subito 1 carta mirata a 0 Etere e dona +10s.', traits: [{ type: 'deck_extract_discount', cost: 1 }], freeExtractCount: 1, addTime: 10 },
      3: { desc: 'Pesca mirata a 1 Etere ed estrae fino a 2 carte contemporaneamente.', activeDesc: 'Estrai 2 carte mirate a 0 Etere.', traits: [{ type: 'deck_extract_discount', cost: 1, multiExtract: 2 }], freeExtractCount: 2 },
      4: { desc: '[2Âª AbilitÃ ] Pesca mirata a 1 Etere e +5 HP danno su formule con Divisione [/].', activeDesc: 'Estrai 2 carte mirate + Scarica 16 HP Danno Puro su [/].', traits: [{ type: 'deck_extract_discount', cost: 1, multiExtract: 2 }, { type: 'op_flat_bonus', op: '/', bonus: 5 }], freeExtractCount: 2, activeDamage: 16 },
      5: { desc: 'Pesca mirata a 1 Etere e +8 HP danno su formule con Divisione [/].', activeDesc: 'Estrai 2 carte mirate + Scarica 24 HP Danno Puro su [/].', traits: [{ type: 'deck_extract_discount', cost: 1, multiExtract: 2 }, { type: 'op_flat_bonus', op: '/', bonus: 8 }], freeExtractCount: 2, activeDamage: 24 },
      6: { desc: 'Pesca mirata a 0 Etere e +14 HP danno su formule con Divisione [/].', activeDesc: 'Estrai 3 carte mirate + Scarica 32 HP Danno Puro su [/].', traits: [{ type: 'deck_extract_discount', cost: 0, multiExtract: 3 }, { type: 'op_flat_bonus', op: '/', bonus: 14 }], freeExtractCount: 3, activeDamage: 32 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(168, 85, 247, 0.35))'
  },

  // P12 GANIMEDE (Super Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_12',
    name: 'Ganimede (Titano d\'Acciaio)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 12,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P12',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.75)',
    desc: 'Modulo Ibrido: Attrazione Magnetica + Danno Alta DensitÃ . Passiva: Bonus danno e pesca con 3+ carte.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: '+6 HP danno su formule da 3 o piÃ¹ carte.', activeDesc: 'Scarica 16 HP di Danno Magnetico.', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 6 }], activeDamage: 16 },
      2: { desc: '+11 HP danno su formule da 3 o piÃ¹ carte.', activeDesc: 'Scarica 24 HP di Danno Magnetico.', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 11 }], activeDamage: 24 },
      3: { desc: '+18 HP danno su formule da 3 o piÃ¹ carte.', activeDesc: 'Scarica 32 HP di Danno Magnetico.', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 18 }], activeDamage: 32 },
      4: { desc: '[2Âª AbilitÃ ] Danno +18 HP e chiudere una formula a 3+ carte fa pescare +1 carta.', activeDesc: 'Scarica 32 HP Magnetico + Pesca subito 2 carte dal mazzo.', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 18 }, { type: 'high_density_draw', minCards: 3, drawCount: 1 }], activeDamage: 32, drawCards: 2 },
      5: { desc: 'Danno +22 HP e chiudere a 3+ carte fa pescare +1 carta e cura +5% HP.', activeDesc: 'Scarica 38 HP Magnetico + Pesca 2 carte e cura +10% HP.', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 22 }, { type: 'high_density_draw', minCards: 3, drawCount: 1 }], activeDamage: 38, drawCards: 2, healPct: 0.10 },
      6: { desc: 'Danno +28 HP e chiudere a 3+ carte fa pescare +2 carte e cura +10% HP.', activeDesc: 'Scarica 46 HP Puro + Pesca 3 carte e ricarica Time Tank (+15s).', traits: [{ type: 'high_density_damage', minCards: 3, bonus: 28 }, { type: 'high_density_draw', minCards: 3, drawCount: 2 }], activeDamage: 46, drawCards: 3, addTime: 15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(239, 68, 68, 0.35))'
  },

  // P13 KEPLER-186F (Super Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_13',
    name: 'Kepler-186f (Eco dei Mondi)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 13,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P13',
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.75)',
    desc: 'Modulo Ibrido: Purificazione Ambientale + Risonanza Nana Rossa. Passiva: ImmunitÃ  anomalie + Cura/Danno.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'ImmunitÃ  permanente ad anomalie e modificatori ambientali.', activeDesc: 'Rimuove ogni effetto anomalia attivo dal campo.', traits: [{ type: 'anomaly_immunity' }], clearAnomaly: true },
      2: { desc: 'ImmunitÃ  e curi +5% HP Max se un\'anomalia Ã¨ attiva sul campo.', activeDesc: 'Rimuove anomalia e rigenera +12% HP Max.', traits: [{ type: 'anomaly_immunity' }, { type: 'anomaly_heal_pct', bonusPct: 0.05 }], clearAnomaly: true, healPct: 0.12 },
      3: { desc: 'ImmunitÃ , curi +10% HP Max e infliggi +5 HP danno con anomalie.', activeDesc: 'Rimuove anomalia, rigenera +18% HP e infligge 15 HP danno.', traits: [{ type: 'anomaly_immunity' }, { type: 'anomaly_heal_pct', bonusPct: 0.10 }, { type: 'anomaly_damage_boost', bonus: 5 }], clearAnomaly: true, healPct: 0.18, activeDmg: 15 },
      4: { desc: '[2Âª AbilitÃ ] ImmunitÃ  anomalie e carte Cuori curano +2 HP fissi extra.', activeDesc: 'Rimuove anomalia + Tutte le carte in mano diventano Cuori (â™¥).', traits: [{ type: 'anomaly_immunity' }, { type: 'anomaly_heal_pct', bonusPct: 0.10 }, { type: 'anomaly_damage_boost', bonus: 5 }, { type: 'hearts_flat_heal', bonus: 2 }], clearAnomaly: true, convertHandSuit: 'hearts' },
      5: { desc: 'Carte Cuori curano +4 HP fissi extra e danno anomalie sale a +8 HP.', activeDesc: 'Rimuove anomalia + Converte mano in Cuori e cura +20% HP.', traits: [{ type: 'anomaly_immunity' }, { type: 'anomaly_heal_pct', bonusPct: 0.12 }, { type: 'anomaly_damage_boost', bonus: 8 }, { type: 'hearts_flat_heal', bonus: 4 }], clearAnomaly: true, convertHandSuit: 'hearts', healPct: 0.20 },
      6: { desc: 'Carte Cuori curano +7 HP fissi extra e danno anomalie sale a +14 HP.', activeDesc: 'Rimuove anomalia + Converte mano in Cuori Dorati e cura +30% HP.', traits: [{ type: 'anomaly_immunity' }, { type: 'anomaly_heal_pct', bonusPct: 0.15 }, { type: 'anomaly_damage_boost', bonus: 14 }, { type: 'hearts_flat_heal', bonus: 7 }], clearAnomaly: true, convertHandSuit: 'hearts', healPct: 0.30, makeGolden: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(20, 184, 166, 0.35))'
  },

  // P14 PROXIMA B (Super Rara - Doppio - Max Livello 6)
  {
    id: 'planet_char_14',
    name: 'Proxima b (Generatore del Caos)',
    deckPassiveDesc: 'Neutralizza una volta un Malus che riduce la mano.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 2,
    planetNum: 14,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'P14',
    color: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.75)',
    desc: 'Modulo Ibrido: Neutralizzazione Malus + Furia Caotica. Passiva: ImmunitÃ  totale a contraccolpi + Danno a bassa vita.',
    unlockCostDust: 350,
    unlockCostDiamonds: 20,
    baseCostDust: 200,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 650, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1400, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2200, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3500, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5000, diamonds: 20, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'ImmunitÃ  al malus Mano Ridotta (5 carte).', activeDesc: 'Azzera le tacche della tua Barra Malus.', traits: [{ type: 'malus_hand_immunity' }], resetPlayerMalus: true },
      2: { desc: 'ImmunitÃ  a Mano Ridotta e Blocco AbilitÃ  (2 turni).', activeDesc: 'Azzera Barra Malus e trasferisce 2 tacche al nemico.', traits: [{ type: 'malus_hand_immunity' }, { type: 'malus_lock_immunity' }], resetPlayerMalus: true, transferMalus: 2 },
      3: { desc: 'ImmunitÃ  assoluta a tutti i 7 effetti contraccolpo della Barra Malus.', activeDesc: 'Azzera Barra Malus e riempie istantaneamente la barra nemica (Contraccolpo).', traits: [{ type: 'malus_hand_immunity' }, { type: 'malus_lock_immunity' }, { type: 'full_malus_immunity' }], resetPlayerMalus: true, fillEnemyMalus: true },
      4: { desc: '[2Âª AbilitÃ ] ImmunitÃ  Malus e +6 HP danno su tutti gli attacchi con HP < 50%.', activeDesc: 'Innesca contraccolpo nemico + Scarica 18 HP Danno da Furia.', traits: [{ type: 'malus_hand_immunity' }, { type: 'malus_lock_immunity' }, { type: 'full_malus_immunity' }, { type: 'low_hp_rage_dmg', thresholdPct: 0.5, bonus: 6 }], fillEnemyMalus: true, activeDamage: 18 },
      5: { desc: 'ImmunitÃ  Malus e +10 HP danno con HP < 50%.', activeDesc: 'Innesca contraccolpo nemico + Scarica 26 HP Danno da Furia.', traits: [{ type: 'malus_hand_immunity' }, { type: 'malus_lock_immunity' }, { type: 'full_malus_immunity' }, { type: 'low_hp_rage_dmg', thresholdPct: 0.5, bonus: 10 }], fillEnemyMalus: true, activeDamage: 26 },
      6: { desc: 'ImmunitÃ  Malus e +16 HP danno con HP < 50%.', activeDesc: 'Innesca contraccolpo nemico + Scarica 36 HP Danno Puro e cura +15% HP.', traits: [{ type: 'malus_hand_immunity' }, { type: 'malus_lock_immunity' }, { type: 'full_malus_immunity' }, { type: 'low_hp_rage_dmg', thresholdPct: 0.5, bonus: 16 }], fillEnemyMalus: true, activeDamage: 36, healPct: 0.15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(99, 102, 241, 0.35))'
  },

  // ==========================================================================
  // I 6 MAZZI PLANETARI TRIPLI (P15 - P20) â€” SCALA A 9 LIVELLI (APOTEOSI)
  // ==========================================================================

  // P15 TRAPPIST-1E (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_15',
    name: 'TRAPPIST-1e (Arconte dei Sette)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 15,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P15',
    color: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.75)',
    desc: 'Modulo Ibrido: Percentuale HP Nemico + Sintesi Diamanti + Risonanza Armonica. Passiva: Multi-Seme x3.5 + Diamanti + Cura.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: 'Combo Multi-Seme moltiplica il danno x2.5.', activeDesc: 'Colpisce per il 15% degli HP attuali nemici.', traits: [{ type: 'combo_4suits_mult', mult: 2.5 }], activePercentDamage: 0.15 },
      2: { desc: 'Combo Multi-Seme moltiplica il danno x3.0.', activeDesc: 'Colpisce per il 20% degli HP attuali nemici.', traits: [{ type: 'combo_4suits_mult', mult: 3.0 }], activePercentDamage: 0.20 },
      3: { desc: 'Combo Multi-Seme moltiplica il danno x3.5.', activeDesc: 'Colpisce per il 25% degli HP attuali nemici.', traits: [{ type: 'combo_4suits_mult', mult: 3.5 }], activePercentDamage: 0.25 },
      4: { desc: '[2Âª AbilitÃ ] Multi-Seme x3.5 ed eroga +1 Diamante 💎 garantito.', activeDesc: 'Colpisce per 25% HP nemici + Sintetizza 1 Diamante 💎.', traits: [{ type: 'combo_4suits_mult', mult: 3.5, bonusDiamonds: 1 }], activePercentDamage: 0.25, grantDiamonds: 1 },
      5: { desc: 'Multi-Seme x3.5 ed eroga +2 Diamanti 💎 garantiti.', activeDesc: 'Colpisce per 25% HP nemici + Sintetizza 2 Diamanti 💎.', traits: [{ type: 'combo_4suits_mult', mult: 3.5, bonusDiamonds: 2 }], activePercentDamage: 0.25, grantDiamonds: 2 },
      6: { desc: 'Multi-Seme x3.8 ed eroga +2 Diamanti 💎 e +50 Polvere 🌟.', activeDesc: 'Colpisce per 30% HP nemici + 2 Diamanti 💎 e 50 Polvere 🌟.', traits: [{ type: 'combo_4suits_mult', mult: 3.8, bonusDiamonds: 2 }], activePercentDamage: 0.30, grantDiamonds: 2, grantDust: 50 },
      7: { desc: '[3Âª AbilitÃ ] Multi-Seme x3.8, +2💎 e completare la Multi-Seme rigenera +10% HP Max.', activeDesc: '30% HP nemici + 2 Diamanti + Rigenera +15% HP Max.', traits: [{ type: 'combo_4suits_mult', mult: 3.8, bonusDiamonds: 2 }, { type: 'combo_multisuit_heal', healPct: 0.10 }], activePercentDamage: 0.30, grantDiamonds: 2, healPct: 0.15 },
      8: { desc: 'Multi-Seme x4.0, +3💎 e cura sale a +15% HP Max.', activeDesc: '35% HP nemici + 3 Diamanti + Rigenera +20% HP Max.', traits: [{ type: 'combo_4suits_mult', mult: 4.0, bonusDiamonds: 3 }, { type: 'combo_multisuit_heal', healPct: 0.15 }], activePercentDamage: 0.35, grantDiamonds: 3, healPct: 0.20 },
      9: { desc: 'Apoteosi: Multi-Seme x4.5, +4💎, cura +25% HP e raddoppia tutte le risorse vinte.', activeDesc: 'Colpisce per 40% HP nemici + 4 Diamanti + Rigenera +30% HP Max.', traits: [{ type: 'combo_4suits_mult', mult: 4.5, bonusDiamonds: 4 }, { type: 'combo_multisuit_heal', healPct: 0.25 }, { type: 'victory_reward_mult', mult: 2.0 }], activePercentDamage: 0.40, grantDiamonds: 4, healPct: 0.30 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(217, 70, 239, 0.35))'
  },

  // P16 GLIESE 581G (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_16',
    name: 'Gliese 581g (Custode di Lagrange)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 16,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P16',
    color: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.75)',
    desc: 'Modulo Ibrido: Generatore Etere + Trasmutazione Alto Valore + Equilibrio di Lagrange.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: '+1 Etere Cosmico ogni 2 attacchi andati a segno.', activeDesc: 'Genera +2 Etere Cosmico 🔮.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 2, amount: 1 }], grantEther: 2 },
      2: { desc: '+2 Etere Cosmico ogni 2 attacchi andati a segno.', activeDesc: 'Genera +3 Etere Cosmico 🔮.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 2, amount: 2 }], grantEther: 3 },
      3: { desc: '+2 Etere Cosmico per ogni singolo attacco a segno.', activeDesc: 'Genera +4 Etere Cosmico 🔮.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }], grantEther: 4 },
      4: { desc: '[2Âª AbilitÃ ] Etere a segno e inizi ogni match con +2 Etere Cosmico.', activeDesc: 'Genera +4 Etere + Converte 1 carta della mano al valore 9.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }, { type: 'initial_ether_bonus', amount: 2 }], grantEther: 4, convertCardVal: 9, convertCount: 1 },
      5: { desc: 'Etere a segno e inizi ogni match con +3 Etere Cosmico.', activeDesc: 'Genera +5 Etere + Converte 2 carte della mano al valore 9.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }, { type: 'initial_ether_bonus', amount: 3 }], grantEther: 5, convertCardVal: 9, convertCount: 2 },
      6: { desc: 'Etere a segno e inizi ogni match con +4 Etere Cosmico.', activeDesc: 'Genera +6 Etere + Converte 3 carte della mano al valore 10.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }, { type: 'initial_ether_bonus', amount: 4 }], grantEther: 6, convertCardVal: 10, convertCount: 3 },
      7: { desc: '[3Âª AbilitÃ ] Etere a segno, +4 Etere iniziale e le carte 9-10 infliggono +4 HP danno.', activeDesc: 'Genera +6 Etere, converte 3 carte in 10 e cura +15% HP.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }, { type: 'initial_ether_bonus', amount: 4 }, { type: 'court_card_damage', minVal: 9, bonus: 4 }], grantEther: 6, convertCardVal: 10, convertCount: 3, healPct: 0.15 },
      8: { desc: 'Carte 9-10 infliggono +7 HP danno e +2s nel Time Tank.', activeDesc: 'Genera +7 Etere, converte 3 carte in 10 e cura +20% HP.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 2 }, { type: 'initial_ether_bonus', amount: 4 }, { type: 'court_card_damage', minVal: 9, bonus: 7 }], grantEther: 7, convertCardVal: 10, convertCount: 3, healPct: 0.20 },
      9: { desc: 'Apoteosi: +3 Etere per attacco, +5 Etere iniziale, carte 9-13 infliggono +12 HP puro.', activeDesc: 'Ricarica Etere al massimo, trasforma 3 carte in Re (13) Dorati e cura +30% HP.', traits: [{ type: 'ether_generation_on_hit', hitsRequired: 1, amount: 3 }, { type: 'initial_ether_bonus', amount: 5 }, { type: 'court_card_damage', minVal: 9, bonus: 12 }], grantEther: 10, convertCardVal: 13, convertCount: 3, healPct: 0.30, makeGolden: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(14, 165, 233, 0.35))'
  },

  // P17 HAUMEA (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_17',
    name: 'Haumea (Cristallo di Risonanza)',
    deckPassiveDesc: 'Usare armi di classi diverse consecutivamente concede Boost.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 17,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P17',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.75)',
    desc: 'Modulo Ibrido: Spinta Cinetica + Momento Rotazionale + Mimesi Neurale.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: '+6 HP danno extra se attacchi entro i primi 10s del turno.', activeDesc: 'Aggiunge +15 HP danno al prossimo attacco rapido.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 6 }], activeSpeedDmg: 15 },
      2: { desc: '+10 HP danno extra se attacchi entro 10s.', activeDesc: 'Aggiunge +22 HP danno al prossimo attacco rapido.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 10 }], activeSpeedDmg: 22 },
      3: { desc: '+15 HP danno extra se attacchi entro 10s.', activeDesc: 'Aggiunge +30 HP danno al prossimo attacco rapido.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 15 }], activeSpeedDmg: 30 },
      4: { desc: '[2Âª AbilitÃ ] Danno rapido +15 HP e ogni attacco entro 10s dona +5s al serbatoio.', activeDesc: '+30 HP danno rapido + Dona +15s al Time Tank.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 15 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 5 }], activeSpeedDmg: 30, addTime: 15 },
      5: { desc: 'Danno rapido +18 HP e attacco entro 10s dona +8s al serbatoio.', activeDesc: '+35 HP danno rapido + Dona +22s al Time Tank.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 18 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 8 }], activeSpeedDmg: 35, addTime: 22 },
      6: { desc: 'Danno rapido +22 HP e attacco entro 10s dona +12s al serbatoio.', activeDesc: '+40 HP danno rapido + Riempie Time Tank al massimo (+30s).', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 22 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 12 }], activeSpeedDmg: 40, addTime: 30 },
      7: { desc: '[3Âª AbilitÃ ] Copia istantaneamente e attiva l\'effetto del modulo avversario.', activeDesc: 'Time Tank al max + Copia ed esegue l\'abilitÃ  nemica.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 22 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 12 }, { type: 'copy_enemy_skill' }], addTime: 30, copyEnemySkill: true },
      8: { desc: 'Copia abilitÃ  nemica potenziandola del +30% e danno rapido sale a +26 HP.', activeDesc: 'Time Tank al max + Copia abilitÃ  nemica potenziata del +30%.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 26 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 15 }, { type: 'copy_enemy_skill', boost: 1.3 }], addTime: 30, copyEnemySkill: true, copyBoost: 1.3 },
      9: { desc: 'Apoteosi: Danno rapido +32 HP, +20s nel tank e copia abilitÃ  nemica con danno raddoppiato.', activeDesc: 'Scarica 35 HP puri, riempie il tank e copia abilitÃ  nemica x2.0.', traits: [{ type: 'speed_damage_boost', thresholdSeconds: 10, bonus: 32 }, { type: 'speed_time_bonus', thresholdSeconds: 10, bonusSeconds: 20 }, { type: 'copy_enemy_skill', boost: 2.0 }], activeSpeedDmg: 35, addTime: 30, copyEnemySkill: true, copyBoost: 2.0 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(132, 204, 22, 0.35))'
  },

  // P18 ERIS (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_18',
    name: 'Eris (EntitÃ  della Discordia)',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 18,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P18',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.75)',
    desc: 'Modulo Ibrido: Distruzione Serbatoio Nemico + Danno Puro + Punizione del Vuoto.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: 'Ogni colpo a segno distrugge 10s dal serbatoio tempo nemico.', activeDesc: 'Distrugge subito 15s dal Time Tank nemico.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 10 }], drainTank: 15 },
      2: { desc: 'Ogni colpo a segno distrugge 15s dal serbatoio nemico.', activeDesc: 'Distrugge subito 22s dal Time Tank nemico.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 15 }], drainTank: 22 },
      3: { desc: 'Ogni colpo distrugge 20s dal serbatoio nemico.', activeDesc: 'Svuota totalmente il Time Tank nemico a 0s.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 20 }], drainTank: 30 },
      4: { desc: '[2Âª AbilitÃ ] Distrugge 20s dal serbatoio e infligge +5 HP danno puro.', activeDesc: 'Azzera tank nemico + Infligge 16 HP Danno Puro.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 20 }, { type: 'drain_extra_dmg', bonus: 5 }], drainTank: 30, activeDmg: 16 },
      5: { desc: 'Distrugge 20s dal serbatoio e infligge +8 HP danno puro.', activeDesc: 'Azzera tank nemico + Infligge 24 HP Danno Puro.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 20 }, { type: 'drain_extra_dmg', bonus: 8 }], drainTank: 30, activeDmg: 24 },
      6: { desc: 'Distrugge 25s dal serbatoio e infligge +12 HP danno puro.', activeDesc: 'Azzera tank nemico + Infligge 32 HP Danno Puro.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 25 }, { type: 'drain_extra_dmg', bonus: 12 }], drainTank: 30, activeDmg: 32 },
      7: { desc: '[3Âª AbilitÃ ] Se il serbatoio nemico Ã¨ a 0s, infliggi +8 HP danno extra.', activeDesc: 'Azzera tank nemico, infligge 32 HP danno e +15 HP se tank era a 0s.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 25 }, { type: 'drain_extra_dmg', bonus: 12 }, { type: 'empty_tank_punish', bonus: 8 }], drainTank: 30, activeDmg: 32, emptyTankBonus: 15 },
      8: { desc: 'Se il serbatoio nemico Ã¨ a 0s, infliggi +12 HP danno extra.', activeDesc: 'Azzera tank nemico, infligge 38 HP danno e +22 HP se tank a 0s.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 25 }, { type: 'drain_extra_dmg', bonus: 14 }, { type: 'empty_tank_punish', bonus: 12 }], drainTank: 30, activeDmg: 38, emptyTankBonus: 22 },
      9: { desc: 'Apoteosi: Distrugge 30s, +16 HP danno e +20 HP punizione su serbatoio a zero.', activeDesc: 'Azzera tank nemico, riduce timer a 10s e infligge 50 HP di Danno Puro.', traits: [{ type: 'drain_enemy_tank', drainSeconds: 30 }, { type: 'drain_extra_dmg', bonus: 16 }, { type: 'empty_tank_punish', bonus: 20 }], drainTank: 30, enemyTimerCap: 10, activeDmg: 50 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(249, 115, 22, 0.35))'
  },

  // P19 IO (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_19',
    name: 'Io (Nucleo Magmatico)',
    deckPassiveDesc: 'Salve valide provocano ustione nel successivo scambio.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 19,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P19',
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.75)',
    desc: 'Modulo Ibrido: Eruzione Vulcanica + Ustione Continua + Sovraccarico Moduli.',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: 'Ogni attacco applica 3 danni residui da ustione per 2 turni.', activeDesc: 'Scarica 18 HP di Danno Magmatico.', traits: [{ type: 'burn_damage_passive', burnDmg: 3, duration: 2 }], activeDmg: 18 },
      2: { desc: 'Ogni attacco applica 5 danni residui da ustione per 2 turni.', activeDesc: 'Scarica 25 HP di Danno Magmatico.', traits: [{ type: 'burn_damage_passive', burnDmg: 5, duration: 2 }], activeDmg: 25 },
      3: { desc: 'Ogni attacco applica 7 danni da ustione per 3 turni consecutivi.', activeDesc: 'Scarica 32 HP di Danno Magmatico.', traits: [{ type: 'burn_damage_passive', burnDmg: 7, duration: 3 }], activeDmg: 32 },
      4: { desc: '[2Âª AbilitÃ ] Ustione 7 HP e ogni tick di ustione carica il tuo Modulo del +5%.', activeDesc: 'Scarica 32 HP Danno + Applica 8 HP ustione per 3 turni.', traits: [{ type: 'burn_damage_passive', burnDmg: 7, duration: 3 }, { type: 'burn_tick_charge_module', chargePct: 0.05 }], activeDmg: 32, applyBurn: 8 },
      5: { desc: 'Ustione 9 HP e ogni tick di ustione carica il Modulo del +8%.', activeDesc: 'Scarica 38 HP Danno + Applica 10 HP ustione per 3 turni.', traits: [{ type: 'burn_damage_passive', burnDmg: 9, duration: 3 }, { type: 'burn_tick_charge_module', chargePct: 0.08 }], activeDmg: 38, applyBurn: 10 },
      6: { desc: 'Ustione 12 HP e ogni tick di ustione carica il Modulo del +12%.', activeDesc: 'Scarica 45 HP Danno + Applica 14 HP ustione per 3 turni.', traits: [{ type: 'burn_damage_passive', burnDmg: 12, duration: 3 }, { type: 'burn_tick_charge_module', chargePct: 0.12 }], activeDmg: 45, applyBurn: 14 },
      7: { desc: '[3Âª AbilitÃ ] Danni da moltiplicazione [*] infliggono un ulteriore +6 HP di calore puro.', activeDesc: 'Scarica 45 HP + Applica 14 HP ustione + Ricarica Modulo del 30%.', traits: [{ type: 'burn_damage_passive', burnDmg: 12, duration: 3 }, { type: 'burn_tick_charge_module', chargePct: 0.12 }, { type: 'op_flat_bonus', op: '*', bonus: 6 }], activeDmg: 45, applyBurn: 14, rechargeModule: 0.30 },
      8: { desc: 'Danni da moltiplicazione [*] infliggono +10 HP di calore puro.', activeDesc: 'Scarica 52 HP + Applica 18 HP ustione + Ricarica Modulo del 40%.', traits: [{ type: 'burn_damage_passive', burnDmg: 14, duration: 3 }, { type: 'burn_tick_charge_module', chargePct: 0.15 }, { type: 'op_flat_bonus', op: '*', bonus: 10 }], activeDmg: 52, applyBurn: 18, rechargeModule: 0.40 },
      9: { desc: 'Apoteosi: Ustione 16 HP per 4T, ricarica modulo +15% a tick e +15 HP su moltiplicazione.', activeDesc: 'Scarica 60 HP Puro, applica 20 HP ustione per 4T e ricarica il Modulo al 50%.', traits: [{ type: 'burn_damage_passive', burnDmg: 16, duration: 4 }, { type: 'burn_tick_charge_module', chargePct: 0.15 }, { type: 'op_flat_bonus', op: '*', bonus: 15 }], activeDmg: 60, applyBurn: 20, rechargeModule: 0.50 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(148, 163, 184, 0.35))'
  },
  

  // P20 ENCELADO (Leggendaria - Triplo - Max Livello 9)
  {
    id: 'planet_char_20',
    name: 'Encelado (Sovrano del Vuoto)',
    deckPassiveDesc: 'Una sola rianimazione automatica per battaglia.',
    element: 'Cosmo',
    type: 'planet_char',
    tier: 3,
    planetNum: 20,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'P20',
    color: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.75)',
    desc: 'Modulo Ibrido: Sovrano del Vuoto (Auto-Rianimazione + Zero Assoluto Nemico + Scarica Plasma Puro).',
    unlockCostDust: 750,
    unlockCostDiamonds: 30,
    baseCostDust: 350,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 700, diamonds: 0, reqPilotLevel: 12 },
      3: { dust: 1500, diamonds: 5, reqPilotLevel: 25 },
      4: { dust: 2400, diamonds: 10, reqPilotLevel: 35 },
      5: { dust: 3600, diamonds: 15, reqPilotLevel: 48 },
      6: { dust: 5200, diamonds: 20, reqPilotLevel: 60 },
      7: { dust: 7200, diamonds: 30, reqPilotLevel: 70 },
      8: { dust: 9800, diamonds: 40, reqPilotLevel: 82 },
      9: { dust: 14000, diamonds: 50, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: 'Al primo collasso letale ti rianima a 15 HP senza consumare Vite.', activeDesc: 'Rigenera subito +20% HP Max.', traits: [{ type: 'auto_revive_free', hp: 15 }], activeHealPct: 0.20 },
      2: { desc: 'Al primo collasso letale ti rianima con il 25% degli HP Massimi.', activeDesc: 'Rigenera subito +30% HP Max.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.25 }], activeHealPct: 0.30 },
      3: { desc: 'Al primo collasso letale ti rianima con il 45% degli HP Massimi.', activeDesc: 'Rigenera subito +45% HP Max.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.45 }], activeHealPct: 0.45 },
      4: { desc: '[2Âª AbilitÃ ] Rianimazione 45% e Zero Assoluto riduce di 10s il timer avversario.', activeDesc: 'Rigenera +45% HP Max + Congela 15s dal timer nemico.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.45 }, { type: 'revive_freeze_enemy', freezeSeconds: 10 }], activeHealPct: 0.45, freezeEnemySec: 15 },
      5: { desc: 'Rianimazione 50% e Zero Assoluto riduce di 15s il timer avversario.', activeDesc: 'Rigenera +50% HP Max + Congela 20s dal timer nemico.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.50 }, { type: 'revive_freeze_enemy', freezeSeconds: 15 }], activeHealPct: 0.50, freezeEnemySec: 20 },
      6: { desc: 'Rianimazione 60% e Zero Assoluto riduce di 20s il timer avversario.', activeDesc: 'Rigenera +60% HP Max + Congela 25s dal timer nemico.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.60 }, { type: 'revive_freeze_enemy', freezeSeconds: 20 }], activeHealPct: 0.60, freezeEnemySec: 25 },
      7: { desc: '[3Âª AbilitÃ ] Rianimazione 60%, -20s al nemico e scarica 15 HP di plasma puro alla rinascita.', activeDesc: 'Rigenera +60% HP, congela 25s e scarica 25 HP di Danno Puro.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.60 }, { type: 'revive_freeze_enemy', freezeSeconds: 20 }, { type: 'revive_blast_damage', damage: 15 }], activeHealPct: 0.60, freezeEnemySec: 25, activeDmg: 25 },
      8: { desc: 'Rianimazione 70%, -25s al nemico e scarica 25 HP di plasma puro.', activeDesc: 'Rigenera +70% HP, congela 30s e scarica 35 HP di Danno Puro.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.70 }, { type: 'revive_freeze_enemy', freezeSeconds: 25 }, { type: 'revive_blast_damage', damage: 25 }], activeHealPct: 0.70, freezeEnemySec: 30, activeDmg: 35 },
      9: { desc: 'Apoteosi: Rianimazione 80% HP Max, azzera serbatoio nemico e scarica 40 HP Danno Puro.', activeDesc: 'Rigenera +80% HP Max, azzera timer nemico a 10s e scarica 50 HP Danno Puro.', traits: [{ type: 'auto_revive_free_pct', hpPct: 0.80 }, { type: 'revive_freeze_enemy', freezeSeconds: 30 }, { type: 'revive_blast_damage', damage: 40 }], activeHealPct: 0.80, freezeEnemySec: 30, activeDmg: 50 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(2, 6, 23, 0.9), rgba(6, 182, 212, 0.35))'
  },

  // ==========================================================================
  // SBLOCCHI ESCLUSIVI DELLA ROTTA DELLE CAPSULE STELLARI
  // ==========================================================================

  // 1. MODULO SINGOLARITÃ€ / BUCO NERO (CAPSULA 210 â­)
  {
    id: 'singularity_core',
    name: 'Modulo SingolaritÃ  (Buco Nero)',
    element: 'Cosmo',
    type: 'capsule_exclusive',
    tier: 2,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'BH',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.85)',
    exclusiveStarMilestone: 180,
    desc: 'Modulo Gravitazionale Esclusivo: risucchia salute nemica e implode il tempo di riserva avversario.',
    unlockCostDust: 0,
    unlockCostDiamonds: 0,
    baseCostDust: 300,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 450, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 12 },
      3: { dust: 1100, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 25 },
      4: { dust: 2200, voidCrystals: 2, primordialMatter: 0, reqPilotLevel: 35 },
      5: { dust: 3500, voidCrystals: 4, primordialMatter: 0, reqPilotLevel: 48 },
      6: { dust: 5000, voidCrystals: 6, primordialMatter: 0, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'Passiva: Formule con [* /] assorbono 2 HP.', activeDesc: 'Risucchia il 15% degli HP nemici correnti.', traits: [{ type: 'hit_siphon', hp: 2 }], activePercentSiphon: 0.15 },
      2: { desc: 'Passiva: Formule con [* /] assorbono 4 HP.', activeDesc: 'Risucchia il 20% degli HP nemici correnti.', traits: [{ type: 'hit_siphon', hp: 4 }], activePercentSiphon: 0.20 },
      3: { desc: 'Passiva: Formule con [* /] assorbono 6 HP.', activeDesc: 'Risucchia il 25% degli HP nemici correnti.', traits: [{ type: 'hit_siphon', hp: 6 }], activePercentSiphon: 0.25 },
      4: { desc: '[2Âª AbilitÃ ] Risucchio 6 HP e riduce di 15s il tank nemico.', activeDesc: 'Risucchia il 25% HP nemici + Brucia 15s dal tank nemico.', traits: [{ type: 'hit_siphon', hp: 6 }, { type: 'drain_enemy_tank', drainSeconds: 15 }], activePercentSiphon: 0.25, drainTankSec: 15 },
      5: { desc: 'Risucchio 8 HP e riduce di 20s il tank nemico.', activeDesc: 'Risucchia il 25% HP nemici + Brucia 22s dal tank nemico.', traits: [{ type: 'hit_siphon', hp: 8 }, { type: 'drain_enemy_tank', drainSeconds: 20 }], activePercentSiphon: 0.25, drainTankSec: 22 },
      6: { desc: 'Risucchio 10 HP, brucia 25s e azzera il modulo nemico.', activeDesc: 'Risucchia il 30% HP nemici, svuota il tank a 0s e azzera il modulo avversario.', traits: [{ type: 'hit_siphon', hp: 10 }, { type: 'drain_enemy_tank', drainSeconds: 25 }], activePercentSiphon: 0.30, drainTankSec: 30, resetEnemyModule: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(46, 16, 101, 0.9), rgba(15, 23, 42, 0.95))'
  },

  // 2. MAZZO OPHIUCHUS / IL SERPENTARIO (CAPSULA 390 â­)
  {
    id: 'ophiuchus',
    name: 'Ophiuchus (Il Serpentario)',
    element: 'Cosmo',
    type: 'capsule_exclusive',
    tier: 2,
    rarity: 'Super Rara',
    category: 'double',
    categoryName: 'Effetto Doppio',
    symbol: 'OPH',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.85)',
    exclusiveStarMilestone: 270,
    desc: 'Il 13Â° Segno Escluso: immunitÃ  totale a tutte le anomalie di campo e tossicitÃ  neurotossica progressiva.',
    unlockCostDust: 0,
    unlockCostDiamonds: 0,
    baseCostDust: 300,
    maxLevel: 6,
    upgradeCosts: {
      2: { dust: 450, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 12 },
      3: { dust: 1100, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 25 },
      4: { dust: 2200, voidCrystals: 2, primordialMatter: 0, reqPilotLevel: 35 },
      5: { dust: 3500, voidCrystals: 4, primordialMatter: 0, reqPilotLevel: 48 },
      6: { dust: 5000, voidCrystals: 6, primordialMatter: 0, reqPilotLevel: 60 }
    },
    levels: {
      1: { desc: 'ImmunitÃ  permanente alle anomalie ambientali e +4 HP con Picche (â™ ).', activeDesc: 'Inietta veleno neurotossico (4 HP per 2 turni).', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 4 }], poisonDmg: 4 },
      2: { desc: 'ImmunitÃ  anomalie e +6 HP con Picche (â™ ).', activeDesc: 'Inietta veleno (6 HP per 2 turni).', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 6 }], poisonDmg: 6 },
      3: { desc: 'ImmunitÃ  anomalie e +9 HP con Picche (â™ ).', activeDesc: 'Inietta veleno (9 HP per 3 turni).', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 9 }], poisonDmg: 9 },
      4: { desc: '[2Âª AbilitÃ ] Picche +9 HP e formule da 3+ carte infliggono +6 HP fissi.', activeDesc: 'Inietta veleno 9 HP + Scarica 18 HP di veleno puro.', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 9 }, { type: 'high_density_damage', minCards: 3, bonus: 6 }], poisonDmg: 9, activeDamage: 18 },
      5: { desc: 'Picche +11 HP e formule da 3+ carte infliggono +9 HP fissi.', activeDesc: 'Inietta veleno 12 HP + Scarica 24 HP di veleno puro.', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 11 }, { type: 'high_density_damage', minCards: 3, bonus: 9 }], poisonDmg: 12, activeDamage: 24 },
      6: { desc: 'Picche +14 HP e formule da 3+ carte curano il 10% HP infliggendo +14 HP.', activeDesc: 'Inietta veleno 15 HP, scarica 32 HP Danno Puro e cura +15% HP.', traits: [{ type: 'anomaly_immunity' }, { type: 'suit_damage_boost', suit: 'spades', bonus: 14 }, { type: 'high_density_damage', minCards: 3, bonus: 14 }], poisonDmg: 15, activeDamage: 32, healPct: 0.15 }
    },
    bgGradient: 'linear-gradient(135deg, rgba(6, 78, 59, 0.9), rgba(15, 23, 42, 0.95))'
  },

  // 3. MAZZO SUPREMO: ECLISSI SUPREMA (CAPSULA FINALE 600 â­)
  {
    id: 'supreme_eclipse',
    name: 'Eclissi Suprema (Signore dei Manufatti)',
    element: 'Cosmo',
    type: 'capsule_exclusive',
    tier: 3,
    rarity: 'Leggendaria',
    category: 'triple',
    categoryName: 'Effetto Triplo',
    symbol: 'ECL',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.9)',
    exclusiveStarMilestone: 360,
    desc: 'L\'Apoteosi Galattica (360â­): domina la fisica quantica con la SCARICA OGGETTI, ricaricando ed eseguendo Manufatti Epici a raffica.',
    unlockCostDust: 0,
    unlockCostDiamonds: 0,
    baseCostDust: 500,
    maxLevel: 9,
    upgradeCosts: {
      2: { dust: 450, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 12 },
      3: { dust: 1100, voidCrystals: 0, primordialMatter: 0, reqPilotLevel: 25 },
      4: { dust: 2200, voidCrystals: 2, primordialMatter: 0, reqPilotLevel: 35 },
      5: { dust: 3500, voidCrystals: 4, primordialMatter: 0, reqPilotLevel: 48 },
      6: { dust: 5000, voidCrystals: 6, primordialMatter: 0, reqPilotLevel: 60 },
      7: { dust: 7500, voidCrystals: 8, primordialMatter: 2, reqPilotLevel: 70 },
      8: { dust: 10500, voidCrystals: 10, primordialMatter: 3, reqPilotLevel: 82 },
      9: { dust: 15000, voidCrystals: 12, primordialMatter: 5, reqPilotLevel: 95 }
    },
    levels: {
      1: { desc: 'Fascia 1: Danni base +5 HP. 1 volta per match riarma 1 Oggetto Epico giÃ  consumato.', activeDesc: 'Scarica 20 HP di Danno Cosmico Puro.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 5 }, { type: 'rearm_epic_single' }], activeDamage: 20 },
      2: { desc: 'Danni base +8 HP e ricarica +10s nel Time Tank.', activeDesc: 'Scarica 26 HP di Danno Cosmico Puro.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 8 }, { type: 'rearm_epic_single' }], activeDamage: 26 },
      3: { desc: 'Danni base +12 HP e riarma fino a 2 Oggetti Epici per scontro.', activeDesc: 'Scarica 32 HP di Danno Cosmico Puro.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 12 }, { type: 'rearm_epic_single' }], activeDamage: 32 },
      4: { desc: '[2Âª AbilitÃ ] Fascia 2: Rimosso limite di 1 Epico per turno (puoi usarli insieme!).', activeDesc: 'Scarica 35 HP Puro + Resetta i tempi degli Oggetti Epici.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 12 }, { type: 'remove_epic_turn_limit' }], activeDamage: 35, resetEpics: true },
      5: { desc: 'Danni base +15 HP e usare un Epico rigenera +15% HP.', activeDesc: 'Scarica 40 HP Puro + Ricarica 1 Epico al 100%.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 15 }, { type: 'remove_epic_turn_limit' }], activeDamage: 40, resetEpics: true },
      6: { desc: 'Danni base +18 HP e usare un Epico dona +1 Diamante 💎 (max 2/match).', activeDesc: 'Scarica 46 HP Puro + Ricarica tutti gli Epici.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 18 }, { type: 'remove_epic_turn_limit' }], activeDamage: 46, resetEpics: true },
      7: { desc: '[3Âª AbilitÃ ] Fascia 3: Gli Oggetti Epici infliggono o curano il doppio (+100%).', activeDesc: 'Ricarica tutti gli Epici + Scarica 50 HP di Luce Eclissata.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 20 }, { type: 'double_epic_potency' }, { type: 'remove_epic_turn_limit' }], activeDamage: 50, resetEpics: true },
      8: { desc: 'Epici raddoppiati, danni +25 HP e immunitÃ  totale alle ritorsioni nemico.', activeDesc: 'Scarica 60 HP Puro + Reset totale degli Oggetti Epici.', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 25 }, { type: 'double_epic_potency' }, { type: 'remove_epic_turn_limit' }], activeDamage: 60, resetEpics: true },
      9: { desc: 'APOTEOSI FINALE (360â­): Ricarica infinita Oggetti Epici ogni volta che il Modulo tocca il 100%!', activeDesc: 'Ricarica istantanea di tutti gli Oggetti Epici, azzera timer nemico e infligge 75 HP Puri!', traits: [{ type: 'op_boost', ops: ['+', '-', '*', '/'], bonus: 30 }, { type: 'double_epic_potency' }, { type: 'infinite_epic_overcharge' }], activeDamage: 75, resetEpics: true }
    },
    bgGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.45), rgba(2, 6, 23, 0.98))'
  }
]);


// 1.18 REGISTRO DELLE 20 RELIQUIE PLANETARIE DEI BOSS
const PLANET_BOSS_RELICS = Object.freeze({
  1: { id: 'relic_p1', planetNum: 1, name: 'Reliquia Tellurica', planetName: 'Terra', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.75)', desc: 'Frammento della litosfera primordiale di Gaia a strati piezoelettrici (1/2 per il Varco I).' },
  2: { id: 'relic_p2', planetNum: 2, name: 'Reliquia Magmatica', planetName: 'Marte', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.75)', desc: 'Nucleo ferromagnetico spento del Colosso di Tharsis con vene di plasma (2/2 per il Varco I).' },
  3: { id: 'relic_p3', planetNum: 3, name: 'Reliquia Acida', planetName: 'Venere', color: '#ca8a04', glow: 'rgba(202, 138, 4, 0.75)', desc: 'Condensato chimico ultra-denso e corrosivo della Matriarca Tossica.' },
  4: { id: 'relic_p4', planetNum: 4, name: 'Reliquia Termica', planetName: 'Mercurio', color: '#fb923c', glow: 'rgba(251, 146, 60, 0.75)', desc: 'Lingotto esagonale forgiato all\'apice termico dell\'Arconte Solare.' },
  5: { id: 'relic_p5', planetNum: 5, name: 'Reliquia delle Tempeste', planetName: 'Giove', color: '#ea580c', glow: 'rgba(234, 88, 12, 0.75)', desc: 'Cella toroidale di vortice ciclonico stabilizzato estratta dalla Grande Macchia.' },
  6: { id: 'relic_p6', planetNum: 6, name: 'Reliquia Anulare', planetName: 'Saturno', color: '#facc15', glow: 'rgba(250, 204, 21, 0.75)', desc: 'Prisma ottagonale di silicato di ghiaccio e polvere minerale di Crono.' },
  7: { id: 'relic_p7', planetNum: 7, name: 'Reliquia dei Ghiacci', planetName: 'Urano', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.75)', desc: 'Monolite a freccia ionica in zaffiro polarizzato della Sentinella.' },
  8: { id: 'relic_p8', planetNum: 8, name: 'Reliquia Abissale', planetName: 'Nettuno', color: '#1d4ed8', glow: 'rgba(29, 78, 216, 0.75)', desc: 'Scaglia idrodinamica subspaziale bioluminescente del Leviatano.' },
  9: { id: 'relic_p9', planetNum: 9, name: 'Reliquia d\'Antimateria', planetName: 'Plutone', color: '#64748b', glow: 'rgba(100, 116, 139, 0.75)', desc: 'Tetraedro d\'ombra e materia oscura del Signore delle Ombre.' },
  10: { id: 'relic_p10', planetNum: 10, name: 'Reliquia di Metano', planetName: 'Titano', color: '#b45309', glow: 'rgba(180, 83, 9, 0.75)', desc: 'Goccia criogenica di idrocarburi liquidi pressurizzati del Colosso.' },
  11: { id: 'relic_p11', planetNum: 11, name: 'Reliquia Oceanica', planetName: 'Europa', color: '#0284c7', glow: 'rgba(2, 132, 199, 0.75)', desc: 'Nucleo idrotermale primordiale racchiuso nel ghiaccio tettonico dell\'Idra.' },
  12: { id: 'relic_p12', planetNum: 12, name: 'Reliquia Magnetica', planetName: 'Ganimede', color: '#475569', glow: 'rgba(71, 85, 105, 0.75)', desc: 'Doppio giroscopio in titanite fusa del Titano d\'Acciaio.' },
  13: { id: 'relic_p13', planetNum: 13, name: 'Reliquia Esoplanetaria', planetName: 'Kepler-186f', color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.75)', desc: 'Matrice a diffrazione fotonica binaria dell\'Eco dei Mondi.' },
  14: { id: 'relic_p14', planetNum: 14, name: 'Reliquia Primordiale', planetName: 'Proxima b', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.75)', desc: 'Ancora dipolare gravitazionale del Generatore del Caos.' },
  15: { id: 'relic_p15', planetNum: 15, name: 'Reliquia Armonica', planetName: 'TRAPPIST-1e', color: '#d946ef', glow: 'rgba(217, 70, 239, 0.75)', desc: 'Diapason a 7 risonatori polifonici orbitali dell\'Arconte.' },
  16: { id: 'relic_p16', planetNum: 16, name: 'Reliquia Neutrale', planetName: 'Gliese 581g', color: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.75)', desc: 'Sfera a baricentro di equilibrio perenne del Custode di Lagrange.' },
  17: { id: 'relic_p17', planetNum: 17, name: 'Reliquia Cinetica', planetName: 'Haumea', color: '#84cc16', glow: 'rgba(132, 204, 22, 0.75)', desc: 'Ellissoide cinetico ad asse di rotazione ultra-rapida del Cristallo.' },
  18: { id: 'relic_p18', planetNum: 18, name: 'Reliquia della Discordia', planetName: 'Eris', color: '#f97316', glow: 'rgba(249, 115, 22, 0.75)', desc: 'Scheggia tachionica asimmetrica a campo entropico dell\'EntitÃ .' },
  19: { id: 'relic_p19', planetNum: 19, name: 'Reliquia Vulcanica', planetName: 'Io', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.75)', desc: 'Camera magmatica al plasma sulfureo attivo del Nucleo Magmatico.' },
  20: { id: 'relic_p20', planetNum: 20, name: 'Reliquia del Vuoto', planetName: 'Encelado', color: '#00f2fe', glow: 'rgba(0, 242, 254, 0.75)', desc: 'SingolaritÃ  criomagnetica allo zero assoluto del Sovrano del Vuoto.' }
});



// ============================================================================
// 1.20 REGISTRO DEI 10 VARCHI GRAVITAZIONALI
// ============================================================================
const GRAVITATIONAL_RIFTS = PHASE16A_RIFTS;

// ============================================================================
// 1.21 DATABASE DEI 10 MANUFATTI EPICI DIMENSIONALI
// ============================================================================
const LEGACY_EPIC_ITEMS_DATABASE = Object.freeze([
  {
    id: 'epic_item_1',
    riftNumber: 1,
    name: 'Anello Bifasico di MÃ¶bius',
    codeName: 'Ponte Cronotopico',
    symbol: 'M1',
    color: '#00f2fe',
    glow: 'rgba(0, 242, 254, 0.85)',
    desc: 'Apre un portale quantico per scambiare carte della mano con quelle del futuro pescate dal mazzo.',
    levels: {
      1: { visionTurn: 1, maxCards: 2, label: 'Visione +1 Turno (Scambia fino a 2 carte)' },
      2: { visionTurn: 2, maxCards: 3, label: 'Visione +2 Turni (Scambia fino a 3 carte)' },
      3: { visionTurn: 3, maxCards: 3, label: 'Visione +3 Turni (Apoteosi: Scambio Profondo)' }
    }
  },
  {
    id: 'epic_item_2',
    riftNumber: 2,
    name: 'Forcella a Risoluzione Neutonica',
    codeName: 'Risonanza Bifronte',
    symbol: 'M2',
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.85)',
    desc: 'Fonde algebricamente piÃ¹ carte della mano in un\'unica carta composita ad altissimo valore.',
    levels: {
      1: { maxFuse: 2, label: 'Fusione Neutonica (Fino a 2 carte)' },
      2: { maxFuse: 3, label: 'Fusione Iper-Densa (Fino a 3 carte)' },
      3: { maxFuse: 4, label: 'Apoteosi Composita (Fino a 4 carte fuse)' }
    }
  },
  {
    id: 'epic_item_3',
    riftNumber: 3,
    name: 'Astrolabio a Coordinate Libere',
    codeName: 'Canto della Creazione',
    symbol: 'M3',
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.85)',
    desc: 'Permette di riscrivere manualmente il valore target dei bersagli presenti sulla plancia.',
    levels: {
      1: { maxTargets: 1, label: 'Riscrive 1 Target a scelta' },
      2: { maxTargets: 2, label: 'Riscrive fino a 2 Target' },
      3: { maxTargets: 3, label: 'Apoteosi: Riscrive tutti e 3 i Target' }
    }
  },
  {
    id: 'epic_item_4',
    riftNumber: 4,
    name: 'Stele d\'Ombra Assoluta',
    codeName: 'Velo del Silenzio',
    symbol: 'M4',
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.85)',
    desc: 'Emette un impulso subspaziale che spegne e disattiva completamente la Passiva del mazzo avversario.',
    levels: {
      1: { silenceDurationTurns: 2, label: 'Silenzia Passiva Nemica per 2 turni' },
      2: { silenceDurationTurns: 4, label: 'Silenzia Passiva Nemica per 4 turni' },
      3: { silenceDurationTurns: 999, label: 'Apoteosi: Silenzio Permanente per l\'intero scontro' }
    }
  },
  {
    id: 'epic_item_5',
    riftNumber: 5,
    name: 'Pistone a Impulso Gravimetrico',
    codeName: 'Giudizio Primordiale',
    symbol: 'M5',
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.85)',
    desc: 'Accumula pressione gravitazionale; il prossimo attacco a segno infligge un danno fisso massiccio.',
    levels: {
      1: { overrideDamage: 20, label: 'Prossimo colpo infligge 20 HP fissi' },
      2: { overrideDamage: 25, label: 'Prossimo colpo infligge 25 HP fissi' },
      3: { overrideDamage: 30, label: 'Apoteosi: Prossimo colpo infligge 30 HP fissi' }
    }
  },
  {
    id: 'epic_item_6',
    riftNumber: 6,
    name: 'Pendolo a Inversione d\'Entropia',
    codeName: 'Strappo Temporale',
    symbol: 'M6',
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.85)',
    desc: 'Riavvolge lo stato esatto del duello (HP, mani, mazzi, scarti, timer e moduli) ai turni precedenti.',
    levels: {
      1: { turnsBack: 1, label: 'Riavvolge lo scontro di 1 turno' },
      2: { turnsBack: 2, label: 'Riavvolge lo scontro fino a 2 turni' },
      3: { turnsBack: 3, label: 'Apoteosi: Riavvolge lo scontro fino a 3 turni' }
    }
  },
  {
    id: 'epic_item_7',
    riftNumber: 7,
    name: 'Monolite a Specchi Dielettrici',
    codeName: 'Specchio di Ritorsione',
    symbol: 'M7',
    color: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.85)',
    desc: 'Innalza una barriera reattiva: assorbe il prossimo attacco nemico e lo riflette amplificato.',
    levels: {
      1: { reflectMultiplier: 1.0, label: 'Riflette il 100% del danno subito' },
      2: { reflectMultiplier: 1.5, label: 'Riflette il 150% del danno subito' },
      3: { reflectMultiplier: 2.0, label: 'Apoteosi: Riflette il 200% del danno subito' }
    }
  },
  {
    id: 'epic_item_8',
    riftNumber: 8,
    name: 'Calice di Drenaggio a Vortice',
    codeName: 'Sifone dell\'Abisso',
    symbol: 'M8',
    color: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.85)',
    desc: 'Azzera le barre energia dei moduli avversari e sovraccarica istantaneamente i moduli alleati.',
    levels: {
      1: { chargePercent: 1.0, label: 'Svuota nemico, ricarica moduli al 100%' },
      2: { chargePercent: 1.5, label: 'Svuota nemico, ricarica moduli al 150%' },
      3: { chargePercent: 2.0, label: 'Apoteosi: Doppio uso immediato (200%)' }
    }
  },
  {
    id: 'epic_item_9',
    riftNumber: 9,
    name: 'Matrice Poliedrica di ProbabilitÃ ',
    codeName: 'Furia dei Dadi Celesti',
    symbol: 'M9',
    color: '#84cc16',
    glow: 'rgba(132, 204, 22, 0.85)',
    desc: 'Attiva una raffica istantanea di lanci dei Dadi Quantici 2D senza intagli algebrici richiesti.',
    levels: {
      1: { rollCount: 3, label: 'Raffica di 3 lanci Dadi cumulativi' },
      2: { rollCount: 4, label: 'Raffica di 4 lanci Dadi cumulativi' },
      3: { rollCount: 5, label: 'Apoteosi: Raffica di 5 lanci Dadi cumulativi' }
    }
  },
  {
    id: 'epic_item_10',
    riftNumber: 10,
    name: 'Nucleo a SingolaritÃ  Compressa',
    codeName: 'Tempesta dell\'Eclissi',
    symbol: 'M10',
    color: '#facc15',
    glow: 'rgba(250, 204, 21, 0.85)',
    desc: 'Innesca la modalitÃ  Raffica Continua: mano sempre ricaricata a 7 carte e bersagli rigenerati subito.',
    levels: {
      1: { durationSeconds: 60, label: 'Tempesta dell\'Eclissi per 60 secondi' },
      2: { durationSeconds: 75, label: 'Tempesta dell\'Eclissi per 75 secondi' },
      3: { durationSeconds: 90, label: 'Apoteosi: Tempesta dell\'Eclissi per 90 secondi' }
    }
  }
]);


// FASE 16C — catalogo attivo della Cripta. I 10 record legacy restano disponibili
// per la migrazione dei salvataggi, ma solo questi 6 sono oggetti dei nuovi varchi.
const EPIC_16C_DESCRIPTIONS = Object.freeze({
  epic_item_1: ['Anello Bifasico di Möbius','Sotto il 30% HP: analizza mano e mazzo e prepara la migliore figura utilizzabile nelle prossime 10 pescate (una volta per battaglia).'],
  epic_item_6: ['Pendolo d’Entropia','Dopo danni subiti: per 10 secondi rivela le prossime sei carte e rende gratuiti i due cambi nella preparazione successiva.'],
  epic_item_7: ['Monolite Dielettrico','Le tre armi equipaggiate non vanno mai in surriscaldamento. Munizioni e combinazioni rimangono necessarie.'],
  epic_item_8: ['Calice di Drenaggio','Converte danni inflitti e ricevuti in Polvere Stellare aggiuntiva, accreditata a fine battaglia.'],
  epic_item_9: ['Matrice di Probabilità','Sotto il 30% HP: puoi sparare una sola volta con un’arma Pesante usando Coppia o Tris.'],
  epic_item_3: ['Astrolabio a Coordinate Libere','Quando il Dado Quantico è pronto, mostra due risultati casuali: il giocatore ne sceglie uno.'],
});
const EPIC_ITEMS_DATABASE = Object.freeze(PHASE16A_EPIC_IDS.map((id,index)=>{
  const original=LEGACY_EPIC_ITEMS_DATABASE.find(item=>item.id===id);
  const [name,desc]=EPIC_16C_DESCRIPTIONS[id];
  const levels=Object.fromEntries([1,2,3].map(level=>[level,{
    ...original.levels[level],label:`Livello ${level} · ${desc}`
  }]));
  return Object.freeze({...original,riftNumber:index+1,name,desc,levels});
}));


// 2.2 DATI DEI 20 PIANETI E NOMI DEI 200 SETTORI
const realPlanetNames = Object.freeze([
  "Terra", "Marte", "Venere", "Mercurio", "Giove", "Saturno", "Urano", "Nettuno", "Plutone", "Titano",
  "Europa", "Ganimede", "Kepler-186f", "Proxima b", "TRAPPIST-1e", "Gliese 581g", "Haumea", "Eris", "Io", "Encelado"
]);


const PLANET_ZONE_NAMES = Object.freeze([
  ["Valle di Cristallo", "Cratere Boreale", "Avamposto Alpha", "Piana dei Venti", "Barriera Ovest", "Tempio Sommerso", "Gola Silenziosa", "Polo Magnetico", "Faglia Profonda", "Guardiano di Gaia"],
  ["Duna Cremisi", "Canyon Eolico", "Bacino di Vetro", "Rovine di Tharsis", "Avamposto Marziano", "Valle Marineris", "Labirinto Notturno", "Caldera Spenta", "Soglia del Plasma", "Colosso di Tharsis"],
  ["Nuvole di Acido", "Valle dei Fiori", "Cratere Luminoso", "Tempio di Afrodite", "Piana di Zolfo", "Altopiano Dorato", "Sorgente Celeste", "Barriera Radiante", "Santuario del Sole", "Matriarca Tossica"],
  ["Bacino Solare", "Cratere di Mercurio", "Piana di Metallo", "Avamposto Termico", "Faglia di Calore", "Rovine di Piombo", "Sito di Fusione", "Santuario del Fuoco", "Tempio della Forgia", "Arconte Solare"],
  ["Oceano di Ammoniaca", "Tempesta Perenne", "Anello di Ghiaccio", "Nucleo di Metano", "Piattaforma Galleggiante", "Vortice di Nubi", "Abisso Elettrico", "Soglia della GravitÃ ", "Cuore Gassoso", "Occhio del Vortice"],
  ["Anelli di Ghiaccio", "Tempesta di Pulviscolo", "Monolito Esagonale", "Fortezza di Titanite", "Piazzale dei Venti", "Avamposto Saturniano", "Landa Dorata", "Roccaforte di Crono", "Soglia Eterea", "Crono il Distruttore"],
  ["Tempesta Polare", "Abisso di Ghiaccio", "Cratere di Urano", "Piana Magnetica", "Avamposto Blu", "Rifugio Glaciale", "Landa di Zaffiro", "Fortezza Celeste", "Tempio di Urania", "Sentinella Ionica"],
  ["Abisso Blu", "Cratere di Nettuno", "Piana di Ghiaccio Scuro", "Avamposto Abissale", "Faglia Nettuniana", "Rovine Sommerse", "Landa di Neve", "Cittadella Marina", "Soglia Profonda", "Leviatano Abissale"],
  ["Pianeta Nano", "Cratere di Plutone", "Landa di Ghiaccio Scuro", "Avamposto di Plutone", "Faglia Gelata", "Rovine di Ghiaccio", "Santuario del Buio", "Fortezza di Plutone", "Tempio dell'Oltretomba", "Signore delle Ombre"],
  ["Lago di Metano", "Cratere di Titano", "Piana di Neve", "Avamposto di Titano", "Faglia di Idrocarburi", "Atmosfera Densa", "Santuario del Freddo", "Cittadella di Titano", "Portale Titanico", "Colosso di Metano"],
  ["Oceano Sotterraneo", "Cratere di Europa", "Piana di Ghiaccio", "Avamposto di Europa", "Faglia Marina", "Rovine di Cristallo", "Santuario della Vita", "Fortezza Sotterranea", "Tempio delle Maree", "Idra Criogenica"],
  ["Valle dei Giganti", "Cratere di Ganimede", "Piana di Rupi", "Avamposto Ganimede", "Faglia dei Titani", "Rovine Antiche", "Santuario della Luna", "Cittadella di Ganimede", "Portale di Giove", "Titano d'Acciaio"],
  ["Valle di Ghiaccio", "Cratere di Kepler", "Piana Rossa", "Avamposto Kepler", "Faglia Esoplanetaria", "Rovine di Kepler", "Santuario della Terra", "Fortezza Esoterica", "Portale Stellare", "Eco dei Mondi"],
  ["Valle Sconosciuta", "Cratere di Proxima", "Piana Centauri", "Avamposto Proxima", "Faglia Vicina", "Rovine Alfa", "Santuario di Centauri", "Cittadella di Proxima", "Portale di Alpha", "Generatore del Caos"],
  ["Valle di Vetro", "Cratere di Trappist", "Piana dei Sette", "Avamposto Trappist", "Faglia Armonica", "Rovine di Trappist", "Santuario di Trappist", "Cittadella Armonica", "Portale dei Sette", "Arconte dei Sette"],
  ["Valle di Gliese", "Cratere di Gliese", "Piana di Gliese", "Avamposto Gliese", "Faglia di Gliese", "Rovine di Gliese", "Santuario di Gliese", "Fortezza Gliese", "Portale Gliese", "Custode di Lagrange"],
  ["Valle di Haumea", "Cratere di Haumea", "Piana di Haumea", "Avamposto Haumea", "Faglia di Haumea", "Rovine di Haumea", "Santuario di Haumea", "Fortezza Haumea", "Portale Haumea", "Cristallo di Risonanza"],
  ["Valle di Eris", "Cratere di Eris", "Piana di Eris", "Avamposto Eris", "Faglia di Eris", "Rovine di Eris", "Santuario di Eris", "Cittadella Eris", "Portale Eris", "EntitÃ  della Discordia"],
  ["Valle di Io", "Cratere di Io", "Piana di Io", "Avamposto Io", "Faglia di Io", "Rovine di Io", "Santuario di Io", "Cittadella Io", "Portale Io", "Nucleo Magmatico"],
  ["Valle di Encelado", "Cratere di Encelado", "Piana di Encelado", "Faglia Glaciale", "Rovine Criogeniche", "Sito Geyser", "Santuario del Gelo", "Cittadella di Encelado", "Portale dell'Oceano", "Sovrano del Vuoto (Boss Finale Multi-Fase)"]
]);


// ============================================================================
// 2.4 COMPONENTE VENTAGLI D'ANGOLO DEI 4 ASSI (CORNERACEFAN)
//     CON VISIBILITÃ€ DEL DORSO ESTRUSA E DOPPI INDICI REATTIVI
// ============================================================================
function CornerAceFan({ suitId, selectedDeck, currentDeckObj, corner = 'nw', onClick = undefined }) {
  const suitInfo = SUITS.find(s => s.id === suitId) || SUITS[0];

  return (
    <div
      onClick={onClick}
      className={`corner-ace-fan-container fan-${corner}`}
      title={`Asso di ${suitInfo.name}: ${suitInfo.synergy}`}
    >
      {/* Carta Sotto: Retro del Mazzo Attivo visibilmente sporgente */}
      <div className="corner-card-under">
        <TacticalVisual
          id={selectedDeck}
          type="card_back"
          color={currentDeckObj?.color || '#38bdf8'}
          glowColor={currentDeckObj?.glow || 'rgba(56, 189, 248, 0.65)'}
          width={40}
          height={58}
        />
      </div>

      {/* Carta Sopra: Asso Olografico ad Alta Definizione */}
      <div
        className="corner-card-top fan-ace-card"
        style={{
          border: `1.5px solid ${suitInfo.color}`,
          boxShadow: `0 0 14px ${suitInfo.glow}, inset 0 0 8px ${suitInfo.color}33`
        }}
      >
        <div className="fan-ace-index-tl">
          <span style={{ color: '#ffffff', fontWeight: '900', lineHeight: 1 }}>A</span>
          <span style={{ color: suitInfo.color, lineHeight: 1 }}>{suitInfo.symbol}</span>
        </div>

        <div className="fan-ace-center">
          <span style={{ color: suitInfo.color, textShadow: `0 0 8px ${suitInfo.color}` }}>
            {suitInfo.symbol}
          </span>
        </div>

        <div className="fan-ace-index-br">
          <span style={{ color: '#ffffff', fontWeight: '900', lineHeight: 1 }}>A</span>
          <span style={{ color: suitInfo.color, lineHeight: 1 }}>{suitInfo.symbol}</span>
        </div>
      </div>
    </div>
  );
}


(function injectCyberStyles() {
  if (typeof document === 'undefined') return;
  const styleId = 'eclissi-stellare-global-styles';
  if (document.getElementById(styleId)) return;

  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Rajdhani:wght@600;700;800&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    *::-webkit-scrollbar {
      display: none;
      width: 0px;
      height: 0px;
      background: transparent;
    }

    body, html {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100dvh;
      background-color: #020308;
      color: #f8fafc;
      font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    }

    /* ANIMAZIONI ORBITALI E NODI SPLASH SCREEN */
    .pulse-glow {
      box-shadow: 0 0 35px rgba(0, 242, 254, 0.35), inset 0 0 20px rgba(0, 242, 254, 0.1);
    }

    .orbit-planet-node {
      border-radius: 50%;
      pointer-events: none;
    }

    .orbit-card-node {
      width: 20px;
      height: 30px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98));
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1px;
      pointer-events: none;
    }

    @keyframes spinClockwise { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes spinCounterClockwise { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }


    @keyframes coreStellarPulse {
      0% { transform: scale(0.9); box-shadow: 0 0 15px #00f2fe, 0 0 30px #38bdf8; }
      50% { transform: scale(1.18); box-shadow: 0 0 35px #00f2fe, 0 0 70px #818cf8, 0 0 90px rgba(0, 242, 254, 0.8); }
      100% { transform: scale(0.9); box-shadow: 0 0 15px #00f2fe, 0 0 30px #38bdf8; }
    }

      /* VIEWPORT STRUTTURALE PRINCIPALE ADATTIVO 9:16 */
    .app-viewport-916 {
      width: 100vw;
      max-width: 480px;
      height: 100dvh;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

       .battle-viewport {
      width: 100%;
      height: 100%;
      max-height: 100dvh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0;
      position: relative;
      overflow: hidden;
      min-width: 0;
      box-sizing: border-box;
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }




    .deck-trait-pill {
      font-size: clamp(0.55rem, 1dvh, 0.65rem);
      padding: 1px 6px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(15, 23, 42, 0.75);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 60%;
    }







    /* PANNELLI CYBERPUNK CON GLOW */
    .cyber-panel {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.97) 100%);
      border: 1px solid rgba(0, 242, 254, 0.35);
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.75), inset 0 0 12px rgba(0, 242, 254, 0.08);
      position: relative;
      transition: all 0.25s ease;
    }

        /* PULSANTI TATTICI */
    .cyber-btn {
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-top: 1.5px solid rgba(255, 255, 255, 0.4);
      border-bottom: 2.5px solid rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: transform 0.1s, box-shadow 0.2s, filter 0.2s;
    }
    .cyber-btn:active { transform: scale(0.96); }
    .cyber-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.8); }

    .cyber-btn-primary {
      background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
      border-color: #00f2fe;
      box-shadow: 0 0 14px rgba(0, 242, 254, 0.4);
    }
    .cyber-btn-warning {
      background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
      border-color: #facc15;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.4);
    }
    .cyber-btn-success {
      background: linear-gradient(180deg, #059669 0%, #047857 100%);
      border-color: #10b981;
      box-shadow: 0 0 14px rgba(16, 185, 129, 0.4);
    }
    .cyber-btn-ether {
      background: linear-gradient(180deg, #9333ea 0%, #7e22ce 100%);
      border-color: #e879f9;
      box-shadow: 0 0 14px rgba(232, 121, 249, 0.45);
    }
    .cyber-btn-epic {
      background: linear-gradient(180deg, #eab308 0%, #a16207 100%);
      border-color: #fef08a;
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.6);
      animation: pulseGlow 1.5s infinite alternate;
    }
    .cyber-btn.btn-attack-ready {
      background: linear-gradient(180deg, #059669 0%, #065f46 100%);
      border: 2px solid #34d399;
      box-shadow: 0 0 20px rgba(52, 211, 153, 0.7);
      animation: attackReadyPulse 1s infinite alternate ease-in-out;
    }

    /* CARTE OLOGRAFICHE PLANCIA GIOCATORE */
    .holo-card {
      width: clamp(28px, 7.8vw, 38px);
      height: clamp(42px, 5.8dvh, 52px);
      background: linear-gradient(150deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 3px 2px;
      cursor: pointer;
      position: relative;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.6);
      transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
      flex-shrink: 0;
    }

    .holo-card.court-card { border-color: rgba(250, 204, 21, 0.65); }
    .holo-card.joker-card { border-color: #e879f9; box-shadow: 0 0 12px rgba(232, 121, 249, 0.5); }
    .holo-card.fused-card { border: 2px solid #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.6); }

    .holo-card.selected {
      border: 2px solid #00f2fe;
      box-shadow: 0 0 16px rgba(0, 242, 254, 0.75), inset 0 0 8px rgba(0, 242, 254, 0.4);
      transform: translateY(-8px) scale(1.08);
      background: linear-gradient(150deg, rgba(8, 145, 178, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%);
      z-index: 10;
    }
    .holo-card.exchange-selected {
      border: 2px solid #f59e0b;
      box-shadow: 0 0 14px rgba(245, 158, 11, 0.7);
      transform: translateY(-6px);
      background: linear-gradient(150deg, rgba(180, 83, 9, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%);
    }
    .holo-card.discard-candidate {
      border: 2px solid #00f2fe;
      background: linear-gradient(150deg, rgba(8, 145, 178, 0.45) 0%, rgba(15, 23, 42, 0.98) 100%) !important;
      box-shadow: 0 0 18px rgba(0, 242, 254, 0.85), inset 0 0 10px rgba(250, 204, 21, 0.3) !important;
      animation: resonanceSurgePulse 0.8s infinite alternate ease-in-out;
      cursor: pointer;
    }
    @keyframes resonanceSurgePulse {
      0% { transform: translateY(0) scale(1); box-shadow: 0 0 10px rgba(0, 242, 254, 0.6); }
      100% { transform: translateY(-7px) scale(1.06); box-shadow: 0 0 24px rgba(250, 204, 21, 0.95), 0 0 12px #00f2fe; }
    }


    /* CARTA DORATA & BADGE TURNI RIMASTI [2T] */
    .holo-card.golden-card {
      border: 2px solid #facc15;
      background: linear-gradient(150deg, rgba(234, 179, 8, 0.35) 0%, rgba(15, 23, 42, 0.98) 100%);
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.75), inset 0 0 10px rgba(250, 204, 21, 0.35);
      animation: goldenCardPulse 1.4s infinite alternate ease-in-out;
    }

    /* EFFETTO CARTA PICCHE ELETTRIZZATA (GIOVE P5) */
    .holo-card.electrified-card {
      border: 2px solid #00f2fe !important;
      background: linear-gradient(150deg, rgba(8, 145, 178, 0.45) 0%, rgba(15, 23, 42, 0.98) 100%) !important;
      box-shadow: 0 0 16px rgba(0, 242, 254, 0.9), inset 0 0 10px rgba(0, 242, 254, 0.5) !important;
      animation: electricShockPulse 0.8s infinite alternate ease-in-out !important;
    }
    @keyframes electricShockPulse {
      0% { box-shadow: 0 0 8px #00f2fe, inset 0 0 4px #00f2fe; }
      100% { box-shadow: 0 0 22px #00f2fe, 0 0 10px #fde047, inset 0 0 12px #00f2fe; }
    }

    .holo-card.golden-card.selected {
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 24px rgba(250, 204, 21, 1), 0 0 10px #ffffff, inset 0 0 12px rgba(250, 204, 21, 0.5);
      transform: translateY(-9px) scale(1.1);
    }

    .golden-turns-badge {
      position: absolute;
      top: -12px;
      right: -5px;
      background: linear-gradient(135deg, #d97706, #b45309);
      color: #ffffff;
      font-size: 0.52rem;
      font-weight: 900;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #fde047;
      box-shadow: 0 0 8px rgba(250, 204, 21, 0.85);
      z-index: 15;
      pointer-events: none;
    }
    @keyframes goldenCardPulse {
      0% { box-shadow: 0 0 10px rgba(250, 204, 21, 0.5), inset 0 0 6px rgba(250, 204, 21, 0.2); }
      100% { box-shadow: 0 0 24px rgba(250, 204, 21, 0.95), 0 0 8px rgba(255, 255, 255, 0.6), inset 0 0 12px rgba(250, 204, 21, 0.45); }
    }

    .ai-card-wrapper.ai-golden-card {
      border: 1.5px solid #facc15;
      border-radius: 4px;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.85);
      animation: goldenCardPulse 1.4s infinite alternate ease-in-out;
    }

    .exchange-cost-tag {
      position: absolute;
      top: -15px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(234, 88, 12, 0.95);
      border: 1px solid #fde047;
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 0.52rem;
      font-weight: 900;
      color: #ffffff;
      white-space: nowrap;
      pointer-events: none;
      z-index: 15;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.8);
      animation: pulseGlow 1s infinite alternate;
    }

    .card-prediction-badge {
      position: absolute;
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(2, 6, 23, 0.95);
      border: 1px solid #00f2fe;
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 0.55rem;
      font-weight: 900;
      color: #00f2fe;
      white-space: nowrap;
      pointer-events: none;
      z-index: 15;
    }
    .card-prediction-badge.match-exact {
      border-color: #34d399;
      color: #34d399;
      box-shadow: 0 0 8px #34d399;
    }
    .card-suggest-glow { animation: suggestPulse 1.2s infinite alternate; }

    /* RADAR E BERSAGLI CENTRALI */
    .radar-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px dashed rgba(0, 242, 254, 0.45);
      animation: spinRadar 12s linear infinite;
      pointer-events: none;
    }

    .target-badge-box {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .target-badge-box.smart-matched {
      border-color: #34d399 !important;
      box-shadow: 0 0 18px rgba(52, 211, 153, 0.75) !important;
      animation: pulseGlow 1s infinite alternate;
    }
    .target-badge-box.target-solvable-glow {
      border-color: #facc15 !important;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.6) !important;
    }
    .target-badge-box.incompatible { opacity: 0.35; filter: grayscale(0.5); }

    /* NUCLEO INSTABILE / BERSAGLIO BOMBA */
    .target-badge-bomb {
      border: 1.5px solid #f43f5e !important;
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.35) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
      box-shadow: 0 0 16px rgba(244, 63, 94, 0.5), inset 0 0 8px rgba(244, 63, 94, 0.25) !important;
      animation: bombPulse 1.5s infinite alternate ease-in-out;
      position: relative;
    }
    .target-badge-bomb.critical-turn {
      border: 2px solid #ef4444 !important;
      animation: bombCriticalPulse 0.6s infinite alternate ease-in-out !important;
    }
    .bomb-turns-badge {
      position: absolute;
      top: -8px;
      right: -6px;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.55rem;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 6px;
      border: 1px solid #fca5a5;
      box-shadow: 0 0 8px #ef4444;
      z-index: 10;
    }
    .bomb-telegraph-preview {
      font-size: 0.52rem;
      color: #fde047;
      font-weight: bold;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 90px;
    }
    @keyframes bombPulse {
      from { box-shadow: 0 0 10px rgba(244, 63, 94, 0.4); }
      to { box-shadow: 0 0 20px rgba(244, 63, 94, 0.85); }
    }
    @keyframes bombCriticalPulse {
      from { transform: scale(1); box-shadow: 0 0 14px #ef4444; }
      to { transform: scale(1.04); box-shadow: 0 0 28px #ef4444; }
    }

    .target-damage-badge {
      font-size: 0.6rem;
      font-weight: 800;
      color: #ef4444;
      background: rgba(69, 10, 10, 0.6);
      padding: 1px 4px;
      border-radius: 3px;
      margin-top: 2px;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }
    .target-solvable-badge {
      font-size: 0.55rem;
      font-weight: bold;
      color: #fde047;
      margin-top: 1px;
    }

        .formula-live-board {
      background: rgba(2, 6, 23, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 3px 8px;
      text-align: center;
      font-size: clamp(0.7rem, 1.35dvh, 0.82rem);
      min-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }


    .formula-live-board.locked { border-color: #34d399; background: rgba(6, 78, 59, 0.4); }
    .formula-live-board.mismatch { border-color: rgba(239, 68, 68, 0.5); }

    /* BARRE FASE BOSS PLANETARIO MULTI-BARRA */
    .boss-phase-bar-container {
      display: flex;
      gap: 3px;
      width: 100%;
      height: 7px;
      margin: 3px 0;
    }
    .boss-phase-segment {
      flex: 1;
      height: 100%;
      background: rgba(30, 41, 59, 0.85);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .boss-phase-segment.completed { background: #334155; border-color: rgba(255, 255, 255, 0.05); }
    .boss-phase-segment.active { border-color: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
    .boss-phase-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); transition: width 0.3s ease; }

    /* MODALITÃ€ TRIS STELLARE */
    .tris-slot-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: clamp(3px, 1.2vw, 6px);
      width: 100%;
      padding: 4px 0;
    }
    .tris-table-card {
      width: clamp(38px, 9vw, 46px);
      height: clamp(56px, 8.5dvh, 68px);
      background: linear-gradient(135deg, rgba(88, 28, 135, 0.85), rgba(15, 23, 42, 0.95));
      border: 2px solid #a855f7;
      border-radius: 6px;
      box-shadow: 0 0 14px rgba(168, 85, 247, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 3px 2px;
    }
    .tris-slot-box {
      width: clamp(36px, 8.5vw, 44px);
      height: clamp(54px, 8.2dvh, 66px);
      border: 1.5px dashed rgba(168, 85, 247, 0.5);
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .tris-slot-box.filled {
      border: 1.5px solid #00f2fe;
      background: rgba(8, 145, 178, 0.35);
      box-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
    }
    .tris-combo-banner {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      animation: spotlightPop 0.25s ease-out;
    }

    /* BARRE METER LED CON MICRO-FLASH */
    .led-meter-bar {
      width: 100%;
      height: 6px;
      background: rgba(15, 23, 42, 0.9);
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
    }
    .led-meter-fill {
      height: 100%;
      transition: width 0.3s ease;
      box-shadow: 0 0 8px currentColor;
    }
    .hp-flash-white {
      animation: hpFlashAnim 0.3s ease-out;
    }
    @keyframes hpFlashAnim {
      0% { filter: brightness(3.5) contrast(1.5); }
      100% { filter: brightness(1); }
    }

    /* ========================================================================== */
    /* ALLOGGIAMENTO MODULO ABILITÃ€ IBRIDO UNICO (PLANCIA BATTAGLIA)             */
    /* ========================================================================== */
    .hybrid-ability-module-container {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 0.98) 100%);
      border: 1.5px solid rgba(0, 242, 254, 0.4);
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
      transition: all 0.25s ease;
    }
    .hybrid-ability-module-container.ready {
      border-color: #00f2fe;
      box-shadow: 0 0 16px rgba(0, 242, 254, 0.65), inset 0 0 8px rgba(0, 242, 254, 0.25);
      background: linear-gradient(145deg, rgba(8, 145, 178, 0.35) 0%, rgba(15, 23, 42, 0.95) 100%);
    }

    .ability-ready-pulse {
      animation: abilityChargedPulse 1s infinite alternate ease-in-out;
    }
    @keyframes abilityChargedPulse {
      from { transform: scale(1); box-shadow: 0 0 10px rgba(0, 242, 254, 0.5); }
      to { transform: scale(1.02); box-shadow: 0 0 22px rgba(0, 242, 254, 0.9); }
    }

    /* BANNER NOTIFICHE COMBATTIMENTO & CAMBIO TURNO */
    .turn-banner-container {
      position: fixed;
      top: 42%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 18000;
      pointer-events: none;
    }
    .turn-banner-card {
      padding: 0.8rem 1.8rem;
      border-radius: 12px;
      text-align: center;
      animation: turnBannerPop 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .turn-banner-player {
      background: linear-gradient(135deg, rgba(8, 145, 178, 0.95), rgba(15, 23, 42, 0.98));
      border: 2px solid #00f2fe;
      box-shadow: 0 0 45px rgba(0, 242, 254, 0.75);
    }
    .turn-banner-opponent {
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(15, 23, 42, 0.98));
      border: 2px solid #f43f5e;
      box-shadow: 0 0 45px rgba(244, 63, 94, 0.75);
    }

    /* BANNER SCI-FI A 4 GRADI DI RISOLUZIONE & AURA AL PLASMA */
    .resolution-banner-container {
      position: fixed;
      top: 44%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 22000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .banner-grade-convergenza {
      background: linear-gradient(135deg, rgba(8, 145, 178, 0.95), rgba(15, 23, 42, 0.98));
      border: 2px solid #00f2fe;
      box-shadow: 0 0 35px rgba(0, 242, 254, 0.8), inset 0 0 15px rgba(0, 242, 254, 0.3);
      animation: popConvergenza 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .banner-grade-sincronia {
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(6, 78, 59, 0.98));
      border: 2px solid #10b981;
      box-shadow: 0 0 40px rgba(16, 185, 129, 0.85), inset 0 0 15px rgba(16, 185, 129, 0.35);
      animation: popSincronia 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .banner-grade-risonanza {
      background: linear-gradient(135deg, rgba(202, 138, 4, 0.95), rgba(69, 26, 3, 0.98));
      border: 2px solid #facc15;
      box-shadow: 0 0 45px rgba(250, 204, 21, 0.9), inset 0 0 20px rgba(250, 204, 21, 0.4);
      animation: popRisonanza 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .banner-grade-eclissi {
      background: linear-gradient(135deg, rgba(217, 70, 239, 0.95), rgba(59, 7, 100, 0.98));
      border: 2.5px solid #ffffff;
      box-shadow: 0 0 60px rgba(217, 70, 239, 1), 0 0 25px #ffffff, inset 0 0 25px rgba(217, 70, 239, 0.6);
      animation: popEclissiTotale 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes popConvergenza {
      0% { transform: scale(0.6); opacity: 0; }
      25% { transform: scale(1.08); opacity: 1; }
      75% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.85); opacity: 0; }
    }
    @keyframes popSincronia {
      0% { transform: scale(0.5) rotate(-3deg); opacity: 0; }
      25% { transform: scale(1.12) rotate(0deg); opacity: 1; }
      75% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.85); opacity: 0; }
    }
    @keyframes popRisonanza {
      0% { transform: scale(0.4) rotate(3deg); opacity: 0; }
      20% { transform: scale(1.18) rotate(0deg); opacity: 1; }
      75% { transform: scale(1.02); opacity: 1; }
      100% { transform: scale(0.85); opacity: 0; }
    }
    @keyframes popEclissiTotale {
      0% { transform: scale(0.3); opacity: 0; filter: brightness(3); }
      15% { transform: scale(1.25); opacity: 1; filter: brightness(1.5); }
      75% { transform: scale(1.05); opacity: 1; filter: brightness(1); }
      100% { transform: scale(0.8); opacity: 0; }
    }

    .streak-plasma-active {
      animation: plasmaOvercharge 2s infinite alternate ease-in-out !important;
      border: 1.5px solid #00f2fe !important;
    }
    @keyframes plasmaOvercharge {
      0% { box-shadow: 0 0 15px rgba(0, 242, 254, 0.4), inset 0 0 10px rgba(217, 70, 239, 0.2); }
      50% { box-shadow: 0 0 30px rgba(217, 70, 239, 0.6), inset 0 0 18px rgba(0, 242, 254, 0.4); }
      100% { box-shadow: 0 0 25px rgba(0, 242, 254, 0.7), inset 0 0 15px rgba(217, 70, 239, 0.35); }
    }

    /* SCREEN SHAKES */
    @keyframes screenShakeLight {
      0% { transform: translate(0, 0); }
      25% { transform: translate(-2px, 2px); }
      50% { transform: translate(2px, -2px); }
      75% { transform: translate(-1px, 1px); }
      100% { transform: translate(0, 0); }
    }
    @keyframes screenShakeHeavy {
      0% { transform: translate(0, 0); }
      20% { transform: translate(-5px, 5px); }
      40% { transform: translate(5px, -5px); }
      60% { transform: translate(-4px, -3px); }
      80% { transform: translate(4px, 3px); }
      100% { transform: translate(0, 0); }
    }
    .anim-shake-light { animation: screenShakeLight 0.25s ease-in-out; }
    .anim-shake-heavy { animation: screenShakeHeavy 0.45s ease-in-out; }

    /* FLUSSI NUMERICI FLOTTANTI SPAZIALIZZATI */
    .floating-combat-text {
      position: fixed;
      font-family: 'Orbitron', sans-serif;
      font-size: clamp(1.15rem, 3.2vw, 1.55rem);
      font-weight: 900;
      text-shadow: 0 0 14px currentColor, 0 2px 4px #000;
      pointer-events: none;
      z-index: 19000;
      white-space: nowrap;
    }
    .ftext-top-right {
      top: 18%;
      right: 12%;
      animation: floatDamageRight 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes floatDamageRight {
      0% { transform: translateY(0) scale(0.7); opacity: 0; }
      20% { transform: translateY(-10px) scale(1.2); opacity: 1; }
      80% { transform: translateY(-25px) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(0.85); opacity: 0; }
    }
    .ftext-bottom-left {
      bottom: 22%;
      left: 12%;
      animation: floatHealLeft 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes floatHealLeft {
      0% { transform: translateY(0) scale(0.7); opacity: 0; }
      20% { transform: translateY(-10px) scale(1.15); opacity: 1; }
      80% { transform: translateY(-25px) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(0.85); opacity: 0; }
    }
    .ftext-cascade-left {
      left: 8%;
      animation: floatCascadeLeft 1.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes floatCascadeLeft {
      0% { transform: translateY(0) scale(0.75); opacity: 0; }
      20% { transform: translateY(-8px) scale(1.1); opacity: 1; }
      80% { transform: translateY(-20px) scale(1); opacity: 1; }
      100% { transform: translateY(-35px) scale(0.8); opacity: 0; }
    }

    .vignette-warning-20s {
      position: fixed;
      inset: 0;
      box-shadow: inset 0 0 50px rgba(245, 158, 11, 0.35);
      pointer-events: none;
      z-index: 12000;
      animation: pulseGlow 1.2s infinite alternate;
    }
    .vignette-critical-10s {
      position: fixed;
      inset: 0;
      box-shadow: inset 0 0 75px rgba(239, 68, 68, 0.55);
      pointer-events: none;
      z-index: 12000;
      animation: pulseGlow 0.6s infinite alternate;
    }

    /* HOME PEDESTAL & 4 ASSI 3D */
    .corner-ace-fan-container {
      position: relative;
      cursor: pointer;
      width: 68px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .corner-ace-fan-container:hover {
      transform: scale(1.14);
      z-index: 25;
    }
    .corner-card-under {
      position: absolute;
      z-index: 1;
      transition: transform 0.25s ease, filter 0.25s ease;
      filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.9));
      pointer-events: none;
    }
    .corner-card-top {
      position: absolute;
      z-index: 2;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .fan-nw .corner-card-under { transform: translate(-14px, -3px) rotate(-26deg); }
    .fan-nw .corner-card-top { transform: translate(5px, 2px) rotate(8deg); }
    .fan-nw:hover .corner-card-under { transform: translate(-18px, -5px) rotate(-32deg); }
    .fan-nw:hover .corner-card-top { transform: translate(7px, 3px) rotate(12deg); }

    .fan-ne .corner-card-under { transform: translate(14px, -3px) rotate(26deg); }
    .fan-ne .corner-card-top { transform: translate(-5px, 2px) rotate(-8deg); }
    .fan-ne:hover .corner-card-under { transform: translate(18px, -5px) rotate(32deg); }
    .fan-ne:hover .corner-card-top { transform: translate(-7px, 3px) rotate(-12deg); }

    .fan-sw .corner-card-under { transform: translate(-14px, 3px) rotate(-26deg); }
    .fan-sw .corner-card-top { transform: translate(5px, -2px) rotate(8deg); }
    .fan-sw:hover .corner-card-under { transform: translate(-18px, 5px) rotate(-32deg); }
    .fan-sw:hover .corner-card-top { transform: translate(7px, -3px) rotate(12deg); }

    .fan-se .corner-card-under { transform: translate(14px, 3px) rotate(26deg); }
    .fan-se .corner-card-top { transform: translate(-5px, -2px) rotate(-8deg); }
    .fan-se:hover .corner-card-under { transform: translate(18px, 5px) rotate(32deg); }
    .fan-se:hover .corner-card-top { transform: translate(-7px, -3px) rotate(-12deg); }

    .fan-ace-card {
      width: 36px;
      height: 52px;
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.99) 100%);
      border-radius: 5px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2px 3px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.85);
      user-select: none;
    }
    .fan-ace-index-tl, .fan-ace-index-br {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 0.52rem;
      line-height: 0.9;
    }
    .fan-ace-index-br { transform: rotate(180deg); }
    .fan-ace-center {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.88rem;
      line-height: 1;
    }

    .corner-nw { position: absolute; top: 6px; left: 6px; z-index: 4; }
    .corner-ne { position: absolute; top: 6px; right: 6px; z-index: 4; }
    .corner-sw { position: absolute; bottom: 6px; left: 6px; z-index: 4; }
    .corner-se { position: absolute; bottom: 6px; right: 6px; z-index: 4; }

        .trophy-pedestal-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: auto 0;
    }
    .trophy-beam {
      position: absolute;
      width: clamp(100px, 25vw, 140px);
      height: clamp(130px, 24dvh, 180px);
      background: radial-gradient(ellipse at 50% 50%, rgba(0, 242, 254, 0.25) 0%, transparent 70%);
      pointer-events: none;
      animation: pulseGlow 3s infinite alternate;
    }
    .hero-card-anim { animation: heroFloat 4s infinite alternate ease-in-out; }
    /* ANIMAZIONI DEL VORTICE SINCRONIZZATO ALLA CARTA (4s) */
    @keyframes vortexSwirlOuter {
      0%, 100% {
        transform: scale(0.82, 0.25) rotate(0deg);
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.45), inset 0 0 8px rgba(0, 242, 254, 0.25);
        opacity: 0.7;
      }
      50% {
        transform: scale(1.25, 0.38) rotate(180deg);
        box-shadow: 0 0 32px rgba(0, 242, 254, 1), 0 0 50px rgba(168, 85, 247, 0.7), inset 0 0 20px rgba(0, 242, 254, 0.85);
        opacity: 1;
      }
    }

    @keyframes vortexSpinInner {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-360deg); }
    }

    @keyframes vortexCorePulse {
      0%, 100% { opacity: 0.4; transform: scale(0.65); }
      50% { opacity: 1; transform: scale(1.4); }
    }

    .trophy-base-platform {
      position: relative;
      width: clamp(80px, 20vmin, 105px);
      height: clamp(80px, 20vmin, 105px);
      background: radial-gradient(circle, rgba(0, 242, 254, 0.45) 0%, rgba(14, 116, 144, 0.25) 45%, rgba(2, 6, 23, 0.9) 75%, transparent 100%);
      border: 2px dashed #00f2fe;
      border-radius: 50%;
      margin-top: -34px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: vortexSwirlOuter 4s infinite ease-in-out;
      pointer-events: none;
      z-index: 1;
    }

    .trophy-base-ring {
      width: 65%;
      height: 65%;
      border-radius: 50%;
      border: 1.5px dashed rgba(250, 204, 21, 0.85);
      box-shadow: 0 0 12px rgba(250, 204, 21, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: vortexSpinInner 2s linear infinite;
    }

    .trophy-base-core {
      width: 32%;
      height: 32%;
      border-radius: 50%;
      background: radial-gradient(circle, #ffffff 0%, #00f2fe 70%, transparent 100%);
      box-shadow: 0 0 14px #00f2fe, 0 0 24px #ffffff;
      animation: vortexCorePulse 4s infinite ease-in-out;
    }


    .home-side-btn {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: clamp(0.35rem, 0.8dvh, 0.55rem) 0.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      cursor: pointer;
      font-size: 0.62rem;
      font-weight: 800;
      transition: all 0.2s;
    }
    .home-side-btn:active { transform: scale(0.94); }

    .varchi-relic-pulse {
      border-color: #fde047 !important;
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.85) !important;
      animation: pulseGlow 1.2s infinite alternate ease-in-out;
    }

    .aiuti-toggle-btn {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 900;
      cursor: pointer;
      transition: all 0.2s;
    }
    .aiuti-toggle-btn.on {
      background: rgba(16, 185, 129, 0.25);
      border: 1px solid #10b981;
      color: #6ee7b7;
    }
    .aiuti-toggle-btn.off {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }

    .pvp-channel-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 0.85rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s;
    }
    .pvp-channel-card:active { transform: scale(0.98); }
    .pvp-channel-card.locked { opacity: 0.45; cursor: not-allowed; }
    .pvp-ticket-counter {
      font-size: 0.65rem;
      font-weight: 900;
      color: #fde047;
      background: rgba(234, 179, 8, 0.2);
      border: 1px solid #facc15;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .epic-battle-slot {
      background: rgba(15, 23, 42, 0.9);
      border: 1.5px solid #facc15;
      border-radius: 6px;
      padding: 2px 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.2s;
    }
    .epic-battle-slot.used {
      opacity: 0.4;
      filter: grayscale(0.8);
      cursor: not-allowed;
    }

    /* BANCO TERRENO COPERTO A 5 SLOT */
    .terrain-slot-bar {
      display: flex;
      justify-content: center;
      gap: clamp(3px, 1vw, 6px);
      width: 100%;
      padding: 2px 0;
      perspective: 800px;
    }
      .terrain-slot-card {
      width: clamp(22px, 5.5vw, 30px);
      height: clamp(22px, 3.2dvh, 28px);

      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
      transform-style: preserve-3d;
      flex-shrink: 0;
    }

    .terrain-slot-card.face-down {
      background: linear-gradient(145deg, #0f172a 0%, #020617 100%);
      border: 1.5px solid rgba(0, 242, 254, 0.4);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
    }
    .terrain-slot-card.face-up {
      background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.98));
      transform: rotateY(0deg) scale(1.04);
    }
    .terrain-slot-card.triggered {
      animation: terrainTriggerPulse 1.2s infinite alternate ease-in-out;
    }
    .terrain-slot-card.exhausted {
      opacity: 0.4;
      filter: grayscale(0.85);
      border-style: dashed !important;
    }
    @keyframes terrainTriggerPulse {
      0% { transform: translateY(0) scale(1); box-shadow: 0 0 8px currentColor; }
      50% { transform: translateY(-3px) scale(1.1); box-shadow: 0 0 20px currentColor, 0 0 30px #ffffff; }
      100% { transform: translateY(0) scale(1); box-shadow: 0 0 8px currentColor; }
    }
    .terrain-rearm-btn {
      position: absolute;
      top: -8px;
      right: -6px;
      background: #9333ea;
      color: #ffffff;
      font-size: 0.5rem;
      font-weight: 900;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e879f9;
      box-shadow: 0 0 6px rgba(232, 121, 249, 0.8);
      cursor: pointer;
      z-index: 20;
    }

    /* DIGITAL DICE SCREEN */
    .digital-roll-container {
      display: flex;
      justify-content: center;
      gap: 1.25rem;
      margin: 1rem 0;
    }
    .digital-dice-screen {
      width: clamp(75px, 18vw, 95px);
      height: clamp(85px, 20vw, 110px);
      background: rgba(2, 6, 23, 0.92);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-around;
      padding: 0.4rem;
    }
    .digital-cycling { animation: diceShake 0.1s infinite; }

    /* ANIMAZIONI PROCEDURALI */
    @keyframes spinRadar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulseGlow { from { filter: drop-shadow(0 0 4px currentColor); } to { filter: drop-shadow(0 0 14px currentColor); } }
    @keyframes heroFloat {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(1deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }
    @keyframes attackReadyPulse {
      from { transform: scale(1); box-shadow: 0 0 14px rgba(52, 211, 153, 0.5); }
      to { transform: scale(1.03); box-shadow: 0 0 26px rgba(52, 211, 153, 0.9); }
    }
    @keyframes suggestPulse {
      from { box-shadow: 0 0 6px #00f2fe; }
      to { box-shadow: 0 0 16px #00f2fe; border-color: #00f2fe; }
    }
    @keyframes turnBannerPop {
      0% { transform: scale(0.6); opacity: 0; }
      30% { transform: scale(1.08); opacity: 1; }
      70% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0; }
    }
    @keyframes spotlightPop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes diceShake {
      0% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(-2px, 2px) rotate(-2deg); }
      50% { transform: translate(2px, -1px) rotate(2deg); }
      75% { transform: translate(-1px, -2px) rotate(-1deg); }
      100% { transform: translate(1px, 2px) rotate(1deg); }
    }
    @keyframes animShakeScreen {
      0% { transform: translate(0,0); }
      20% { transform: translate(-4px, 4px); }
      40% { transform: translate(4px, -4px); }
      60% { transform: translate(-3px, -2px); }
      80% { transform: translate(3px, 2px); }
      100% { transform: translate(0,0); }
    }

    .anim-shake { animation: animShakeScreen 0.4s ease-in-out; }
    .anim-damage { animation: animDamageFlash 0.45s ease-out; }
    .anim-heal { animation: animHealFlash 0.45s ease-out; }

    @keyframes animDamageFlash { 0% { background: rgba(220, 38, 38, 0.4); } 100% { background: transparent; } }
    @keyframes animHealFlash { 0% { background: rgba(16, 185, 129, 0.4); } 100% { background: transparent; } }

    /* OVERLAY VFX ABILITÃ€ */
    .vfx-timewarp-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 16000;
      background: radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, transparent 80%);
      animation: pulseGlow 0.4s ease-out;
    }
    .vfx-heal-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 16000;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 80%);
      animation: pulseGlow 0.4s ease-out;
    }
    .vfx-plasma-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 16000;
      background: radial-gradient(circle, rgba(239, 68, 68, 0.28) 0%, transparent 80%);
      animation: pulseGlow 0.4s ease-out;
    }
    .vfx-emp-glitch {
      position: fixed; inset: 0; pointer-events: none; z-index: 16000;
      background: radial-gradient(circle, rgba(192, 132, 252, 0.28) 0%, transparent 80%);
      animation: diceShake 0.4s ease-out;
    }
      .vfx-siphon-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 16000;
      background: radial-gradient(circle, rgba(217, 70, 239, 0.25) 0%, transparent 80%);
      animation: pulseGlow 0.4s ease-out;
    }

  `;
  document.head.appendChild(styleEl);
})();

// ============================================================================
// 3.4 CINEMATICA DI APERTURA VARCO GRAVITAZIONALE NELLA CRIPTA
function RiftCollapseModal({ rift, relic1, relic2, epicItem, onComplete }) {
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    try { playSound('rift_collapse'); } catch (_) {}
    const t1 = setTimeout(() => {
      setPhase(2);
      try { playSound('epic_item_trigger'); } catch (_) {}
    }, 1800);

    const t2 = setTimeout(() => {
      setPhase(3);
    }, 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 32000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.75rem', maxWidth: '440px', width: '100%', textAlign: 'center', border: `2px solid ${rift.color}`, boxShadow: `0 0 50px ${rift.glow}` }}>
        
        {phase === 1 && (
          <div style={{ animation: 'pulseGlow 1s infinite alternate' }}>
            <div style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 'bold', textTransform: 'uppercase' }}>FUSIONE RELIQUIE IN CORSO...</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', margin: '1.25rem 0' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RelicVisual relicId={relic1?.id} size={48} />
                <div style={{ fontSize: '0.65rem', color: relic1?.color, fontWeight: 'bold', marginTop: '4px' }}>{relic1?.planetName}</div>
              </div>
              <span style={{ fontSize: '1.8rem', color: '#00f2fe', alignSelf: 'center' }}>âš¡</span>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RelicVisual relicId={relic2?.id} size={48} />
                <div style={{ fontSize: '0.65rem', color: relic2?.color, fontWeight: 'bold', marginTop: '4px' }}>{relic2?.planetName}</div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>I campi gravitazionali collassano creando una singolaritÃ  stabile...</p>
          </div>
        )}

        {phase >= 2 && (
          <div style={{ animation: 'spotlightPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold', letterSpacing: '1px' }}>VARCO {rift.roman} STABILIZZATO!</div>
            <h2 style={{ color: epicItem.color, margin: '0.3rem 0', fontWeight: '900', fontSize: '1.25rem' }}>
              {epicItem.name}
            </h2>
            <div style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              Â« {epicItem.codeName} Â»
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <TacticalVisual id={epicItem.id} type="epic_item" color={epicItem.color} width={80} height={80} />
            </div>

                        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid #00f2fe', borderRadius: '8px', padding: '0.65rem 0.85rem', margin: '0 0 1.1rem 0', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', fontWeight: 900, color: '#facc15', marginBottom: '4px' }}>
                <span>⚡ COSTO: 0 RISORSE</span>
                <span>⏱️ USO: 1 VOLTA A MATCH</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#ffffff', lineHeight: '1.35', margin: 0, fontWeight: 700 }}>
                {epicItem.desc}
              </p>
            </div>

            <button onClick={onComplete} className="cyber-btn cyber-btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '900' }}>
              Equipaggia in Plancia ➔
            </button>


          </div>
        )}

      </div>
    </div>
  );
}

// ============================================================================
// 3.5 SCHEDA DI BRIEFING SETTORE (STILE FLUTTUANTE SENZA SCATOLE)
// ============================================================================
function CampaignLevelBriefingModal({
  planetNum,
  levelNum,
  playerPilotId = 'pilot_com_1',
  sectorStars = [false, false, false],
  onLaunch,
  onClose,
  credits = 200,
  isUnlocked = true,
  isReplay = false,
  scannerSeconds = 60,
  diamonds = 0,
  onBuyScannerRefill
}) {
  const specialChallenge = typeof getSectorSpecialChallenge === 'function' 
    ? getSectorSpecialChallenge(planetNum, levelNum) 
    : { name: 'Sfida Tattica', desc: 'Obiettivo speciale del settore' };

  const isBoss = levelNum === 10;

  const enemyPilot = typeof getSectorEncounterPilot === 'function'
    ? getSectorEncounterPilot(planetNum, levelNum)
    : null;
  const enemyPilotId = enemyPilot?.id || (isBoss ? `pilot_boss_${planetNum}` : 'pilot_com_1');
  const dominance = typeof evaluatePilotDominance === 'function'
    ? evaluatePilotDominance(playerPilotId, enemyPilotId)
    : null;
  const playerPilotObj = typeof getPilotById === 'function' ? getPilotById(playerPilotId) : null;
  const enemyPilotObj = enemyPilot || (typeof getPilotById === 'function' ? getPilotById(enemyPilotId) : null);

  const planetName = realPlanetNames?.[planetNum - 1] || `Pianeta ${planetNum}`;
  const zoneName = (PLANET_ZONE_NAMES?.[planetNum - 1] || [])[levelNum - 1] || `Settore ${levelNum}`;
  const modeOfSector = getSectorGameType(planetNum, levelNum);
  const cost = (levelNum <= 5 ? 5 : (levelNum <= 9 ? 10 : 15));
  const modifier = getPlanetLevelModifier(planetNum, levelNum);
  const reward = getLevelReward(planetNum, levelNum, isReplay);
  const relic = isBoss ? PLANET_BOSS_RELICS[planetNum] : null;

  let estimatedEnemyHp = 35;
  if (isBoss) {
    if (planetNum === 1) estimatedEnemyHp = 75;
    else if (planetNum === 2) estimatedEnemyHp = 100;
    else if (planetNum === 11) estimatedEnemyHp = 260;
    else if (planetNum === 14) estimatedEnemyHp = 320;
    else if (planetNum === 17) estimatedEnemyHp = 420;
    else if (planetNum === 20) estimatedEnemyHp = 800;
    else estimatedEnemyHp = Math.floor(75 + planetNum * 15);
  } else {
    estimatedEnemyHp = Math.floor(35 + (planetNum - 1) * 12 + levelNum * 2.5);
  }

    const modeLabels = {
    classic: { name: 'Classica (4 Operazioni)', color: '#00f2fe' },
    vector: { name: 'Vettore Geometrico', color: '#38bdf8' },
    double_stage: { name: 'Convergenza (Banco 2+2)', color: '#f59e0b' },
    tris: { name: 'Tris Stellare', color: '#a855f7' }
  };


  const currentModeInfo = modeLabels[modeOfSector] || modeLabels.classic;
  const canAfford = credits >= cost;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.9) 0%, rgba(1, 3, 10, 0.98) 100%)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 33000,
      padding: 'clamp(10px, 2vmin, 20px) 16px',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      
      {/* INTESTAZIONE OLOGRAFICA FLUTTUANTE */}
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
        <div>
          <div style={{
            fontSize: 'clamp(0.6rem, 1.4vmin, 0.72rem)',
            color: isBoss ? '#f87171' : '#facc15',
            fontWeight: 900,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: isBoss ? '0 0 10px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(250, 204, 21, 0.8)'
          }}>
            {isBoss ? '👑 TITANO PLANETARIO' : `SETTORE ${levelNum}/10`}
          </div>
          <h1 style={{
            margin: '2px 0 0 0',
            fontSize: 'clamp(1.2rem, 3vmin, 1.6rem)',
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '1px',
            textShadow: '0 0 14px rgba(255, 255, 255, 0.6)'
          }}>
            {planetName} — {zoneName}
          </h1>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '1.4rem',
            cursor: 'pointer',
            padding: '2px 6px',
            lineHeight: 1
          }}
        >
          ✕
        </button>
      </div>

      {/* CONFRONTO FORZE PILOTI SOSPESE SUL PIANO COSMICO */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(12px, 3.5vmin, 26px)',
        zIndex: 10,
        margin: 'auto 0'
      }}>
        {/* Pilota Giocatore */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ filter: 'drop-shadow(0 0 16px rgba(0, 242, 254, 0.6))' }}>
            <PilotCard pilot={playerPilotId} compact={true} isEquipped={true} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#00f2fe' }}>
            {playerPilotObj?.name || 'Tuo Pilota'}
          </span>
        </div>

        {/* Separatore VS con Verdetto Dominanza */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: dominance?.status === 'PLAYER_DOMINANT' ? '#34d399' : (dominance?.status === 'ENEMY_DOMINANT' ? '#f87171' : '#facc15'),
            textShadow: '0 0 10px currentColor'
          }}>
            VS
          </span>
          <span style={{
            fontSize: '0.52rem',
            fontWeight: 900,
            color: dominance?.status === 'PLAYER_DOMINANT' ? '#34d399' : (dominance?.status === 'ENEMY_DOMINANT' ? '#fca5a5' : '#fde047'),
            letterSpacing: '0.5px'
          }}>
            {dominance?.status === 'PLAYER_DOMINANT' ? '+15% DANNO' : (dominance?.status === 'ENEMY_DOMINANT' ? '-15% DANNO' : '1.0x PARI')}
          </span>
        </div>

        {/* Pilota Nemico */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ filter: isBoss ? 'drop-shadow(0 0 18px rgba(239, 68, 68, 0.7))' : 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))' }}>
            <PilotCard pilot={enemyPilotObj || enemyPilotId} compact={true} isEquipped={false} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 900, color: isBoss ? '#f87171' : '#fff' }}>
            {enemyPilotObj?.name || (isBoss ? 'Titano' : 'Sentinella')}
          </span>
        </div>
      </div>

      {/* DETTAGLI MISSIONE & BERSAGLIO (TESTO FLUTTUANTE SENZA SCATOLE) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        textAlign: 'center',
        zIndex: 10,
        margin: 'auto 0'
      }}>
        <div style={{ fontSize: 'clamp(0.72rem, 1.8vmin, 0.88rem)', fontWeight: 900, color: currentModeInfo.color }}>
          {currentModeInfo.name} • Nemico: <span style={{ color: '#ef4444' }}>{estimatedEnemyHp} HP</span>
        </div>

        {modifier && modifier.id !== 'standard' && (
          <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 700 }}>
            Anomalia: {modifier.name} ({modifier.desc})
          </div>
        )}

        <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>
          Sfida 3ª Stella: <strong style={{ color: '#fde047' }}>{specialChallenge.name}</strong> ({specialChallenge.desc})
        </div>
      </div>

      {/* SBLOCCHI DEL BOSS (SE LIVELLO 10: RELIQUIA + PILOTA + PIANETA SUCCESSIVO) */}
      {isBoss && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
          margin: 'auto 0',
          padding: '6px 0',
          borderTop: '1px solid rgba(250, 204, 21, 0.3)',
          borderBottom: '1px solid rgba(250, 204, 21, 0.3)',
          width: '100%',
          maxWidth: '380px'
        }}>
          <div style={{ fontSize: '0.62rem', color: '#facc15', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
            🏆 BOTTINO ALLA VITTORIA DEL TITANO
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(14px, 4vmin, 24px)' }}>
            {relic && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ filter: 'drop-shadow(0 0 10px #facc15)' }}>
                  <RelicVisual relicId={relic.id} size={28} />
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.65rem', color: '#fde047', fontWeight: 900 }}>{relic.name}</div>
                  <div style={{ fontSize: '0.52rem', color: '#94a3b8' }}>1/2 per il Varco I</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 0 8px #00f2fe)' }}>👤</span>
              <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                <div style={{ fontSize: '0.65rem', color: '#00f2fe', fontWeight: 900 }}>Pilota {enemyPilotObj?.name || 'Gaia'}</div>
                <div style={{ fontSize: '0.52rem', color: '#94a3b8' }}>Sbloccato Gratis</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.58rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.5px' }}>
            ✦ SBLOCCHI: MARTE (P2) • SCOMMESSE DEL BANCO • DUELLI PVP ✦
          </div>
        </div>
      )}

      {/* RICOMPENSE STANDARD (SE NON BOSS) */}
      {!isBoss && reward && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', zIndex: 10 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fef08a' }}>+{reward.stardust} 🌟</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#00f2fe' }}>+{reward.xp} XP</span>
          {reward.diamonds > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#f5d0fe' }}>+{reward.diamonds} 💎</span>}
        </div>
      )}

      {/* PULSANTE CINETICO FLUTTUANTE */}
      <div style={{ width: '100%', maxWidth: '360px', zIndex: 10, marginBottom: 'clamp(4px, 1vmin, 10px)' }}>
        <button
          type="button"
          disabled={!canAfford || !isUnlocked}
          onClick={onLaunch}
          className={`cyber-btn ${isBoss ? 'cyber-btn-warning' : 'cyber-btn-primary'}`}
          style={{
            width: '100%',
            padding: 'clamp(11px, 2.2vmin, 15px)',
            fontSize: 'clamp(0.88rem, 2vmin, 1.05rem)',
            fontWeight: 900,
            letterSpacing: '1px',
            boxShadow: isBoss ? '0 0 25px rgba(250, 204, 21, 0.65)' : '0 0 25px rgba(0, 242, 254, 0.65)'
          }}
        >
          {canAfford ? `CONFERMA & AVVIA (${cost}⚡) ➔` : `Crediti Insufficienti (${cost}⚡)`}
        </button>
      </div>

    </div>
  );
}



// ============================================================================
// 3.11 HUB CRIPTA DELLE SINGOLARITÃ€ (10 VARCHI, PLANCIA CON MISTERO & SERBATOIO)
function EpicItemsHubScreen({
  unlockedRelics = {},
  unlockedRifts = {},
  epicItemsInventory = {},
  equippedEpicItems = [null, null],
  voidCrystals = 0,
  primordialMatter = 0,
  tankLevel = 1,
  hasStabilizedRift1 = false,
  stardust = 0,
  level = 1,
  socketingRelic = null,
  onClearSocketingRelic = () => {},
  onGoToNextPlanet = () => {},
  onEquipItem,
  onUpgradeItem,
  onCollapseRift,
  onUpgradeTank,
  onBack,
  triggerPopup
}) {
  const [activeTab, setActiveTab] = useState('rifts');
  const [selectedRiftForCollapse, setSelectedRiftForCollapse] = useState(null);
  const [selectedItemForUpgrade, setSelectedItemForUpgrade] = useState(null);
  const [socketStep, setSocketStep] = useState(1);

  // Cinematica Reliquia che scende nell'alloggio
  useEffect(() => {
    if (!socketingRelic) return;
    try { playSound('relic_claim'); } catch (_) {}
    const t = setTimeout(() => {
      setSocketStep(2);
      try { playSound('epic_item_trigger'); } catch (_) {}
    }, 1200);
    return () => clearTimeout(t);
  }, [socketingRelic]);


  const tankConfig = SUBSPACE_TANK_LEVELS[tankLevel] || SUBSPACE_TANK_LEVELS[1];
  const nextTankConfig = SUBSPACE_TANK_LEVELS[tankLevel + 1];

  const handleTriggerRiftCollapse = (rift) => {
    if (epicItemsInventory[rift.itemId]?.unlocked) {
      triggerPopup('Questo manufatto è già nel tuo inventario storico: non serve riforgiarlo.');
      return;
    }
    const hasRelic1 = Boolean(unlockedRelics[rift.relicsRequired[0]]);
    const hasRelic2 = Boolean(unlockedRelics[rift.relicsRequired[1]]);
    if (!hasRelic1 || !hasRelic2) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Servono entrambe le Reliquie dei Boss per aprire questo Varco!");
      return;
    }
    const r1 = PLANET_BOSS_RELICS[rift.bossPlanets[0]];
    const r2 = PLANET_BOSS_RELICS[rift.bossPlanets[1]];
    const item = EPIC_ITEMS_DATABASE.find(e => e.id === rift.itemId);
    setSelectedRiftForCollapse({ rift, r1, r2, item });
  };

    return (
    <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '2.5rem', position: 'relative', zIndex: 5, overflowY: 'auto', maxHeight: '90dvh' }}>
      
      {/* CINEMATICA FLUTTUANTE: RELIQUIA CHE ENTRA NELL'ALLOGGIO DEL VARCO */}
      {socketingRelic && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.94) 0%, rgba(1, 3, 10, 0.99) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 38000,
          padding: 'clamp(14px, 3vmin, 28px) 16px',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Intestazione Cosmica */}
          <div style={{ textAlign: 'center', marginTop: 'clamp(4px, 1.5vmin, 16px)' }}>
            <div style={{
              fontSize: 'clamp(0.6rem, 1.4vmin, 0.75rem)',
              color: '#facc15',
              fontWeight: 900,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '0 0 10px rgba(250, 204, 21, 0.8)'
            }}>
              ✦ CRIPTA DELLE SINGOLARITÀ ✦
            </div>
            <h1 style={{
              margin: '3px 0 0 0',
              fontSize: 'clamp(1.3rem, 3.8vmin, 2rem)',
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '1.2px',
              textShadow: '0 0 18px rgba(56, 189, 248, 0.85)'
            }}>
              RELIQUIA ALLOGGIATA!
            </h1>
          </div>

          {/* Animazione di discesa e inserimento nel pozzetto */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            margin: 'auto 0'
          }}>
            <div style={{
              transform: socketStep === 1 ? 'scale(1.5) translateY(-30px)' : 'scale(1.2) translateY(0px)',
              transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              filter: `drop-shadow(0 0 26px ${socketingRelic.color || '#38bdf8'})`
            }}>
              <RelicVisual relicId={socketingRelic.id} size={64} />
            </div>

            {/* Pozzetto / Alloggio di ricezione luminoso */}
            <div style={{
              width: '90px',
              height: '32px',
              borderRadius: '50%',
              border: `2px solid ${socketStep === 2 ? '#38bdf8' : 'rgba(255,255,255,0.2)'}`,
              background: socketStep === 2 ? 'radial-gradient(ellipse at 50% 50%, rgba(56, 189, 248, 0.5) 0%, transparent 70%)' : 'transparent',
              boxShadow: socketStep === 2 ? '0 0 25px rgba(56, 189, 248, 0.85)' : 'none',
              transition: 'all 0.6s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '0.6rem', color: '#fde047', fontWeight: 900 }}>
                {socketStep === 2 ? '1/2 INCASSATA ✓' : 'RICEZIONE...'}
              </span>
            </div>

            {/* Testo Motivazionale */}
            <div style={{ maxWidth: '360px', textAlign: 'center', lineHeight: 1.35, marginTop: '8px' }}>
              <div style={{ fontSize: 'clamp(0.85rem, 2vmin, 1.05rem)', fontWeight: 900, color: '#ffffff' }}>
                « {socketingRelic.name.toUpperCase()} »
              </div>
              <p style={{
                fontSize: 'clamp(0.7rem, 1.6vmin, 0.82rem)',
                color: '#cbd5e1',
                margin: '8px 0 0 0',
                fontWeight: 700,
                textShadow: '0 0 8px rgba(0,0,0,0.9)'
              }}>
                Sconfiggi tutti i <strong style={{ color: '#facc15' }}>12 boss</strong> per conquistare tutte le reliquie e sbloccare i <strong style={{ color: '#00f2fe' }}>6 Manufatti Epici</strong>!
              </p>
            </div>
          </div>

          {/* Pulsanti di Prosecuzione */}
          <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 'clamp(4px, 1vmin, 12px)' }}>
            <button
              type="button"
              className="cyber-btn cyber-btn-primary"
              onClick={onGoToNextPlanet}
              style={{
                width: '100%',
                padding: 'clamp(11px, 2.2vmin, 15px)',
                fontSize: 'clamp(0.88rem, 2vmin, 1.02rem)',
                fontWeight: 900,
                letterSpacing: '1px',
                boxShadow: '0 0 24px rgba(0, 242, 254, 0.75)'
              }}
            >
              ROTTURA ORBITALE: CONTINUA ➔
            </button>

            <button
              type="button"
              className="cyber-btn"
              onClick={onClearSocketingRelic}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}
            >
              Esplora la Cripta
            </button>
          </div>
        </div>
      )}

      <div className="cyber-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '0.85rem 1.1rem', border: '1.5px solid #facc15', boxShadow: '0 0 30px rgba(250, 204, 21, 0.4)' }}>

        <div>
          <h2 style={{ color: '#facc15', margin: 0, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem', textShadow: '0 0 10px rgba(250, 204, 21, 0.6)' }}>
            <SciFiIcon name="epic_item" size={22} color="#facc15" /> Cripta delle SingolaritÃ  &amp; Oggetti Epici
          </h2>
          <div style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#cbd5e1' }}>
            {hasStabilizedRift1 ? (
              <>Serbatoio: <strong style={{ color: '#00f2fe' }}>{voidCrystals}/{tankConfig.maxVoid} ðŸ’ </strong> | <strong style={{ color: '#d946ef' }}>{primordialMatter}/{tankConfig.maxPrimordial} 🟣</strong></>
            ) : (
              <span style={{ color: '#94a3b8' }}>Apri il Varco I per sbloccare i Minerali Rari (ðŸ’  e 🟣)</span>
            )}
          </div>
        </div>
        <button className="cyber-btn" onClick={onBack}>Indietro</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => { try { playSound('click'); } catch (_) {} setActiveTab('rifts'); }}
          className="cyber-btn"
          style={{ flex: 1, padding: '0.65rem', background: activeTab === 'rifts' ? 'linear-gradient(180deg, #d97706 0%, #78350f 100%)' : 'rgba(15, 23, 42, 0.75)', borderColor: activeTab === 'rifts' ? '#facc15' : 'rgba(255,255,255,0.15)', fontWeight: 'bold', fontSize: '0.8rem' }}
        >
          ðŸŒŒ I 6 Varchi Gravitazionali
        </button>
        <button
          onClick={() => { try { playSound('click'); } catch (_) {} setActiveTab('inventory'); }}
          className="cyber-btn"
          style={{ flex: 1, padding: '0.65rem', background: activeTab === 'inventory' ? 'linear-gradient(180deg, #0284c7 0%, #03527e 100%)' : 'rgba(15, 23, 42, 0.75)', borderColor: activeTab === 'inventory' ? '#00f2fe' : 'rgba(255,255,255,0.15)', fontWeight: 'bold', fontSize: '0.8rem' }}
        >
          🛡️ Oggetti Equipaggiati ({equippedEpicItems.filter(Boolean).length}/2)
        </button>
        {hasStabilizedRift1 && (
          <button
            onClick={() => { try { playSound('click'); } catch (_) {} setActiveTab('tank'); }}
            className="cyber-btn"
            style={{ flex: 1, padding: '0.65rem', background: activeTab === 'tank' ? 'linear-gradient(180deg, #7c3aed 0%, #4c1d95 100%)' : 'rgba(15, 23, 42, 0.75)', borderColor: activeTab === 'tank' ? '#c084fc' : 'rgba(255,255,255,0.15)', fontWeight: 'bold', fontSize: '0.8rem' }}
          >
            ðŸ›¢ï¸ Serbatoio (Liv.{tankLevel})
          </button>
        )}
      </div>

      {activeTab === 'rifts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {GRAVITATIONAL_RIFTS.map(rift => {
            const isCollapsed = Boolean(unlockedRifts[rift.id] || epicItemsInventory[rift.itemId]?.unlocked);
            const r1 = PLANET_BOSS_RELICS[rift.bossPlanets[0]];
            const r2 = PLANET_BOSS_RELICS[rift.bossPlanets[1]];
            const hasR1 = Boolean(unlockedRelics[r1.id]);
            const hasR2 = Boolean(unlockedRelics[r2.id]);
            const canCollapse = hasR1 && hasR2 && !isCollapsed;
            const item = EPIC_ITEMS_DATABASE.find(e => e.id === rift.itemId);

            return (
              <div
                key={rift.id}
                className="cyber-panel"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isCollapsed ? `1.5px solid ${rift.color}` : (canCollapse ? '2px solid #facc15' : '1px solid rgba(255,255,255,0.12)'),
                  boxShadow: canCollapse ? '0 0 20px rgba(250, 204, 21, 0.5)' : (isCollapsed ? `0 0 14px ${rift.glow}` : 'none'),
                  opacity: (!hasR1 && !hasR2 && !isCollapsed) ? 0.6 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 'bold' }}>
                      VARCO {rift.roman}
                    </span>
                    <span style={{ fontSize: '0.65rem', background: isCollapsed ? '#059669' : (canCollapse ? '#d97706' : '#334155'), padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                      {isCollapsed ? "APERTO" : (canCollapse ? "PRONTO AD APRIRE" : "SIGILLATO")}
                    </span>
                  </div>

                  <h3 style={{ color: isCollapsed ? '#fff' : (canCollapse ? '#fde047' : '#94a3b8'), fontSize: '0.92rem', margin: '0 0 0.35rem 0', fontWeight: '900' }}>
                    {isCollapsed || hasR1 || hasR2 ? rift.name : `??? [VARCO ${rift.roman}]`}
                  </h3>

                  <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.35', margin: '0 0 0.75rem 0' }}>
                    {isCollapsed ? rift.desc : (canCollapse ? "Hai entrambe le Reliquie: tocca per aprire il Varco e prendere l'oggetto!" : "Batti i Boss dei due pianeti per ottenere le Reliquie necessarie.")}
                  </p>

                  <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    <div style={{ flex: 1, padding: '0.35rem', background: 'rgba(2, 6, 23, 0.75)', borderRadius: '6px', border: hasR1 ? `1px solid ${r1.color}` : '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', opacity: hasR1 ? 1 : 0.45, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <RelicVisual relicId={r1.id} size={28} />
                      <div style={{ fontSize: '0.58rem', color: hasR1 ? r1.color : '#94a3b8', fontWeight: 'bold', marginTop: '2px' }}>{r1.planetName} (Boss)</div>
                    </div>
                    <div style={{ flex: 1, padding: '0.35rem', background: 'rgba(2, 6, 23, 0.75)', borderRadius: '6px', border: hasR2 ? `1px solid ${r2.color}` : '1px dashed rgba(255,255,255,0.15)', textAlign: 'center', opacity: hasR2 ? 1 : 0.45, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <RelicVisual relicId={r2.id} size={28} />
                      <div style={{ fontSize: '0.58rem', color: hasR2 ? r2.color : '#94a3b8', fontWeight: 'bold', marginTop: '2px' }}>{r2.planetName} (Boss)</div>
                    </div>
                  </div>
                </div>

                {isCollapsed ? (
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>
                      âœ“ Oggetto Sbloccato: {item?.name}
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={!canCollapse}
                    onClick={() => handleTriggerRiftCollapse(rift)}
                    className={`cyber-btn ${canCollapse ? 'cyber-btn-epic' : ''}`}
                    style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', fontWeight: '900' }}
                  >
                    {canCollapse ? "Apri Varco Gravitazionale âž”" : "Reliquie Insufficienti"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="cyber-panel" style={{ padding: '1rem', marginBottom: '1.25rem', border: '1.5px solid #00f2fe' }}>
            <h3 style={{ color: '#00f2fe', margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: '900' }}>
              Slot Plancia di Battaglia (Max 2 Oggetti Epici)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                       {[0, 1].map(slotIdx => {
                const isSlotLocked = (slotIdx === 0 && (level || 1) < EPIC_SLOT_1_UNLOCK_LEVEL && !hasStabilizedRift1) ||
                                     (slotIdx === 1 && (level || 1) < EPIC_SLOT_2_UNLOCK_LEVEL);
                const itemId = equippedEpicItems[slotIdx];

                const item = EPIC_ITEMS_DATABASE.find(e => e.id === itemId);
                const itemData = epicItemsInventory[itemId] || { level: 1 };

                return (
                  <div key={slotIdx} className="cyber-panel" style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.85)', border: isSlotLocked ? '1px dashed rgba(239, 68, 68, 0.4)' : (item ? `1.5px solid ${item.color}` : '1px dashed rgba(255,255,255,0.2)'), display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: isSlotLocked ? '#f87171' : '#94a3b8', fontWeight: 'bold' }}>
                        SLOT {slotIdx + 1} {isSlotLocked && `(Sblocco Liv. ${slotIdx === 0 ? EPIC_SLOT_1_UNLOCK_LEVEL : EPIC_SLOT_2_UNLOCK_LEVEL})`}
                      </div>
                      {isSlotLocked ? (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', margin: '1.2rem 0' }}>ðŸ”’ Bloccato</div>
                      ) : item ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                            <TacticalVisual id={item.id} type="epic_item" color={item.color} width={42} height={42} />
                          </div>
                          <div style={{ fontSize: '0.82rem', color: item.color, fontWeight: '900' }}>{item.name}</div>
                          <div style={{ fontSize: '0.65rem', color: '#facc15' }}>Liv. {itemData.level} ({item.codeName})</div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#64748b', margin: '1.2rem 0' }}>Slot Vuoto</div>
                      )}
                    </div>

                    {!isSlotLocked && item && (
                      <button
                        onClick={() => {
                          try { playSound('click'); } catch (_) {}
                          const next = [...equippedEpicItems];
                          next[slotIdx] = null;
                          onEquipItem(next);
                        }}
                        className="cyber-btn"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.65rem', borderColor: '#ef4444', color: '#fca5a5', marginTop: '0.4rem' }}
                      >
                        Rimuovi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {EPIC_ITEMS_DATABASE.map(item => {
              const itemData = epicItemsInventory[item.id];
              const isUnlocked = Boolean(itemData && itemData.unlocked);
              const curLevel = itemData?.level || 1;
              const isEquipped = equippedEpicItems.includes(item.id);
              const isMax = curLevel >= 3;
              const nextUpgradeCost = EPIC_ITEM_UPGRADE_COSTS[curLevel + 1] || null;

              if (!isUnlocked) {
                return (
                  <div
                    key={item.id}
                    className="cyber-panel"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      background: 'linear-gradient(145deg, rgba(8, 12, 28, 0.95), rgba(2, 4, 12, 0.98))',
                      border: '1px dashed rgba(250, 204, 21, 0.35)',
                      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.9)',
                      minHeight: '220px'
                    }}
                  >
                    <div style={{ margin: '0 auto 0.5rem auto', display: 'flex', justifyContent: 'center', filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.4))' }}>
                      <SciFiIcon name="epic_item" size={40} color="#facc15" />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#fde047', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      OGGETTO EPICO {item.riftNumber}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 'bold', margin: '4px 0 8px 0' }}>
                      [MANUFATTO SEGRETO]
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4', margin: 0 }}>
                      Apri il <strong>Varco {item.riftNumber}</strong> nella Cripta per svelare e ottenere questo artefatto speciale.
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="cyber-panel"
                  style={{
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: isEquipped ? '2px solid #00f2fe' : `1.5px solid ${item.color}`,
                    boxShadow: isEquipped ? '0 0 20px rgba(0, 242, 254, 0.5)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', background: curLevel === 3 ? '#d97706' : '#0284c7', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>
                        {curLevel === 3 ? 'LIV. 3 (MAX)' : `LIV. ${curLevel}/3`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '0.4rem 0' }}>
                      <TacticalVisual id={item.id} type="epic_item" color={item.color} width={64} height={64} />
                    </div>

                    <h3 style={{ color: item.color, fontSize: '0.92rem', margin: '0 0 0.2rem 0', fontWeight: '900', textAlign: 'center' }}>
                      {item.name}
                    </h3>
                    <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 'bold', marginBottom: '0.4rem', textAlign: 'center' }}>
                      {item.codeName}
                    </div>

                    <p style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.35', margin: '0 0 0.65rem 0' }}>
                      {item.desc}
                    </p>

                    <div style={{ background: 'rgba(2, 6, 23, 0.75)', padding: '0.45rem', borderRadius: '6px', fontSize: '0.68rem', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '0.75rem' }}>
                      Potere nuovo: <strong>{item.levels[curLevel]?.label}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                    <button
                                            onClick={() => {
                        try { playSound('click'); } catch (_) {}
                        const slot1Open = (level || 1) >= EPIC_SLOT_1_UNLOCK_LEVEL || hasStabilizedRift1;
                        const slot2Open = (level || 1) >= EPIC_SLOT_2_UNLOCK_LEVEL;


                        if (!slot1Open && !slot2Open) {
                          triggerPopup(`Gli Slot per Oggetti Epici si sbloccano a Livello ${EPIC_SLOT_1_UNLOCK_LEVEL}!`);
                          return;
                        }

                        if (isEquipped) {
                          const next = equippedEpicItems.map(id => id === item.id ? null : id);
                          onEquipItem(next);
                        } else {
                          if (equippedEpicItems[0] === null && slot1Open) onEquipItem([item.id, equippedEpicItems[1]]);
                          else if (equippedEpicItems[1] === null && slot2Open) onEquipItem([equippedEpicItems[0], item.id]);
                          else if (slot1Open) onEquipItem([item.id, equippedEpicItems[1]]);
                        }
                      }}
                      className={`cyber-btn ${isEquipped ? '' : 'cyber-btn-primary'}`}
                      style={{ padding: '0.45rem', fontSize: '0.75rem', fontWeight: 'bold' }}
                    >
                      {isEquipped ? "Rimuovi da Plancia" : "Equipaggia in Plancia"}
                    </button>

                    {!isMax && (
                      <button
                        onClick={() => {
                          try { playSound('click'); } catch (_) {}
                          setSelectedItemForUpgrade({ item, curLevel, nextCost: nextUpgradeCost });
                        }}
                        className="cyber-btn cyber-btn-warning"
                        style={{ padding: '0.45rem', fontSize: '0.72rem', fontWeight: 'bold' }}
                      >
                        Potenzia a Liv. {curLevel + 1} âž”
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'tank' && hasStabilizedRift1 && (
        <div className="cyber-panel" style={{ padding: '1.5rem', maxWidth: '560px', margin: '0 auto', border: '1.5px solid #c084fc' }}>
          <h3 style={{ color: '#f0abfc', margin: '0 0 0.5rem 0', fontWeight: '900', fontSize: '1.1rem', textShadow: '0 0 8px rgba(192, 132, 252, 0.6)' }}>
            {tankConfig.name} (Livello {tankLevel}/3)
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '1rem' }}>
            Il Serbatoio conserva i minerali rari (ðŸ’  e 🟣) che ottieni vincendo nei Duelli PvP e nelle Scommesse del Banco.
          </p>

          <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#00f2fe', fontWeight: 'bold' }}>Capienza Cristalli di Vuoto (ðŸ’ ):</span>
              <strong style={{ fontSize: '1rem', color: '#fff' }}>{voidCrystals} / {tankConfig.maxVoid}</strong>
            </div>
            <div className="led-meter-bar" style={{ height: '7px', marginBottom: '1rem' }}>
              <div className="led-meter-fill" style={{ width: `${Math.min(100, (voidCrystals / tankConfig.maxVoid) * 100)}%`, background: '#00f2fe' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#d946ef', fontWeight: 'bold' }}>Capienza Materia Primordiale (🟣):</span>
              <strong style={{ fontSize: '1rem', color: '#fff' }}>{primordialMatter} / {tankConfig.maxPrimordial}</strong>
            </div>
            <div className="led-meter-bar" style={{ height: '7px' }}>
              <div className="led-meter-fill" style={{ width: `${Math.min(100, (primordialMatter / tankConfig.maxPrimordial) * 100)}%`, background: '#d946ef' }} />
            </div>
          </div>

          {nextTankConfig ? (
            <div style={{ background: 'rgba(74, 4, 78, 0.35)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(232, 121, 249, 0.3)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#f5d0fe', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                PROSSIMO LIVELLO: {nextTankConfig.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                Capienza: <strong>{nextTankConfig.maxVoid} ðŸ’  / {nextTankConfig.maxPrimordial} 🟣</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 'bold', marginTop: '0.3rem' }}>
                Costo: {nextTankConfig.costDust} 🌟 | Richiede Livello Pilota {nextTankConfig.reqLevel}
              </div>
            </div>
          ) : (
            <div style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              âœ“ Serbatoio al Massimo Livello!
            </div>
          )}

          {nextTankConfig && (
            <button
              disabled={stardust < nextTankConfig.costDust || (level || 1) < nextTankConfig.reqLevel}
              onClick={() => {
                if (stardust < nextTankConfig.costDust || (level || 1) < nextTankConfig.reqLevel) return;
                try { playSound('ability'); } catch (_) {}
                onUpgradeTank(nextTankConfig.costDust, tankLevel + 1);
              }}
              className="cyber-btn cyber-btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem', fontWeight: '900' }}
            >
              Potenzia Serbatoio ({nextTankConfig.costDust} 🌟)
            </button>
          )}
        </div>
      )}

      {selectedItemForUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 28000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.5rem', maxWidth: '420px', width: '100%', textAlign: 'center', border: '2px solid #facc15', boxShadow: '0 0 45px rgba(250, 204, 21, 0.55)' }}>
            <h3 style={{ color: '#fde047', margin: '0 0 0.35rem 0', fontWeight: '900' }}>
              Potenzia {selectedItemForUpgrade.item.name}
            </h3>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.85rem' }}>
              Passaggio a <strong>Livello {selectedItemForUpgrade.curLevel + 1}</strong>
            </div>

            <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.3rem' }}>COSTI RICHIESTI:</div>
              <div style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: 'bold' }}>â€¢ Polvere Stellare: {selectedItemForUpgrade.nextCost.dust} 🌟 (Hai: {stardust})</div>
              {selectedItemForUpgrade.nextCost.voidCrystals > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#00f2fe', fontWeight: 'bold' }}>â€¢ Cristalli di Vuoto: {selectedItemForUpgrade.nextCost.voidCrystals} ðŸ’  (Hai: {voidCrystals})</div>
              )}
              {selectedItemForUpgrade.nextCost.primordialMatter > 0 && (
                <div style={{ fontSize: '0.8rem', color: '#d946ef', fontWeight: 'bold' }}>â€¢ Materia Primordiale: {selectedItemForUpgrade.nextCost.primordialMatter} 🟣 (Hai: {primordialMatter})</div>
              )}
            </div>

            {(() => {
              const canAfford = stardust >= selectedItemForUpgrade.nextCost.dust &&
                voidCrystals >= selectedItemForUpgrade.nextCost.voidCrystals &&
                primordialMatter >= selectedItemForUpgrade.nextCost.primordialMatter;

              return (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="cyber-btn" onClick={() => setSelectedItemForUpgrade(null)} style={{ flex: 1, padding: '0.55rem' }}>Annulla</button>
                  <button
                    disabled={!canAfford}
                    onClick={() => {
                      if (!canAfford) return;
                      try { playSound('epic_item_trigger'); } catch (_) {}
                      onUpgradeItem(selectedItemForUpgrade.item.id, selectedItemForUpgrade.curLevel + 1, selectedItemForUpgrade.nextCost);
                      setSelectedItemForUpgrade(null);
                    }}
                    className={`cyber-btn ${canAfford ? 'cyber-btn-warning' : ''}`}
                    style={{ flex: 1.5, padding: '0.55rem', fontWeight: '900' }}
                  >
                    Conferma Potenziamento âž”
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {selectedRiftForCollapse && (
        <RiftCollapseModal
          rift={selectedRiftForCollapse.rift}
          relic1={selectedRiftForCollapse.r1}
          relic2={selectedRiftForCollapse.r2}
          epicItem={selectedRiftForCollapse.item}
          onComplete={() => {
            onCollapseRift(selectedRiftForCollapse.rift.id, selectedRiftForCollapse.item.id);
            setSelectedRiftForCollapse(null);
          }}
        />
      )}
    </div>
  );
}




// 4.0 MOTORE CARTE & MAZZI INDIPENDENTI (54 CARTE), ALGORITMI BALISTICI
const PLANET_MODS_TABLE = Object.freeze([
  [0, 0], [2, 3], [3, 1], [1, 3], [2, 1], [3, 2], [1, 2], [2, 3], [3, 1], [1, 3],
  [2, 1], [3, 2], [1, 2], [2, 3], [3, 1], [1, 3], [2, 1], [3, 2], [1, 2], [2, 3]
]);


// 4.1 HELPER RECUPERO TRATTI ATTIVI DEL MAZZO (SCALA CUMULATIVA A 3, 6 E 9 LIVELLI)
const getDeckActiveTraits = (deckId = 'neutral_starter', deckLevel = 1) => {
  if (!deckId || deckId === 'neutral_starter') return [];
  const planetTraits=getPhase16EDeckTraits(deckId,deckLevel);
  if(planetTraits!==null) return planetTraits;
  const deckObj = (typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES.find(a => a.id === deckId) : null);
  if (!deckObj || !deckObj.levels) return [];
  
  const currentLvl = Math.max(1, Math.min(Number(deckLevel) || 1, deckObj.maxLevel || 9));
  const levelData = deckObj.levels[currentLvl];
  if (levelData && Array.isArray(levelData.traits)) {
    return levelData.traits;
  }
  
  // Fallback al livello piÃ¹ alto disponibile
  for (let l = currentLvl; l >= 1; l--) {
    if (deckObj.levels[l]?.traits) return deckObj.levels[l].traits;
  }
  return [];
};

const createRandomCard = (forceJoker = false) => {
  if (forceJoker || Math.random() < 0.05) {
    return {
      id: `joker_${Math.random().toString(36).substring(2, 7)}`,
      suit: 'joker',
      name: 'Jolly Quantico',
      symbol: 'â˜…',
      color: '#e879f9',
      glow: 'rgba(232, 121, 249, 0.75)',
      value: 0,
      displayVal: 'â˜…',
      isJoker: true,
      isCourt: false,
      isGolden: false
    };
  }
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rawVal = Math.floor(Math.random() * 13) + 1;
  let displayVal = rawVal.toString();
  if (rawVal === 1) displayVal = 'A';
  else if (rawVal === 11) displayVal = 'J';
  else if (rawVal === 12) displayVal = 'Q';
  else if (rawVal === 13) displayVal = 'K';

  return {
    id: `${suit.id}_${rawVal}_${Math.random().toString(36).substring(2, 7)}`,
    value: rawVal,
    displayVal,
    suit: suit.id,
    symbol: suit.symbol,
    color: suit.color,
    glow: suit.glow,
    isCourt: rawVal >= 11,
    isJoker: false,
    isGolden: false
  };
};

const createStandardDeck = (deckThemeId = 'neutral_starter', deckLevel = 1, allowJokers = true) => {
  const traits = getDeckActiveTraits(deckThemeId, deckLevel);
  const suitKeys = ['hearts', 'diamonds', 'clubs', 'spades'];
  const fullDeck = [];

  suitKeys.forEach((suitKey) => {
    const suitInfo = SUITS.find(s => s.id === suitKey) || SUITS[0];
    for (let val = 1; val <= 13; val++) {
      let displayVal = val.toString();
      let isCourt = false;

      if (val === 1) displayVal = 'A';
      else if (val === 11) { displayVal = 'J'; isCourt = true; }
      else if (val === 12) { displayVal = 'Q'; isCourt = true; }
      else if (val === 13) { displayVal = 'K'; isCourt = true; }

      fullDeck.push({
        id: `${suitKey}_${val}_${Math.random().toString(36).substring(2, 7)}`,
        value: val,
        displayVal,
        suit: suitKey,
        symbol: suitInfo.symbol,
        color: suitInfo.color,
        glow: suitInfo.glow,
        isCourt,
        isJoker: false,
        isGolden: false
      });
    }
  });

  const jokerTrait = traits.find(t => t.type === 'joker_deck_count');
  const jokerCount = allowJokers ? (jokerTrait ? (jokerTrait.count || 3) : 2) : 0;
  for (let j = 1; j <= jokerCount; j++) {
    fullDeck.push({
      id: `joker_${j}_${Math.random().toString(36).substring(2, 7)}`,
      value: 0,
      displayVal: 'â˜…',
      suit: 'joker',
      symbol: 'â˜…',
      color: '#e879f9',
      glow: 'rgba(232, 121, 249, 0.85)',
      isCourt: false,
      isJoker: true,
      isGolden: false
    });
  }

  return shuffleArray(fullDeck);
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};





// HELPER PERMUTAZIONI CALCOLO (Riconosce l'operazione in qualsiasi ordine di click)
const getMatchingPermutation = (cards, op, target, tolerance, activeAnomaly) => {
  if (!cards || cards.length < 2) return null;
  if (op === '+' || op === '*') {
    const res = calculateExpressionResult(cards, op, activeAnomaly);
    if (!isNaN(res) && Math.abs(res - target) <= (tolerance + 1e-5)) {
      return { result: res, cards };
    }
    return null;
  }
  const permute = (arr) => {
    if (arr.length <= 1) return [arr];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const curr = arr[i];
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      for (const p of permute(rest)) out.push([curr, ...p]);
    }
    return out;
  };
  for (const p of permute(cards)) {
    const res = calculateExpressionResult(p, op, activeAnomaly);
    if (!isNaN(res) && Math.abs(res - target) <= (tolerance + 1e-5)) {
      return { result: res, cards: p };
    }
  }
  return null;
};


// Solutore a 3 Stazioni per Modalità Vettore (Nucleo + Poker a Parità + Allerta Bomba)
const scanVectorSolution = (playerHand, vectorTarget, currentNucleus = null, activeAnomaly = null, parityFilter = 'PARI', bombTarget = null, allowedOps = null, allowedPatterns = null) => {
  if (!playerHand || playerHand.length === 0) return null;
  const baseOps = allowedOps && allowedOps.length > 0 ? allowedOps : ['+', '-', '*', '/'];
  const ops = baseOps.filter(op => op !== activeAnomaly?.blockedOp);

  // 1. SCANSIONE POKER A PARITÀ (STAZIONE 2)
  let bestPoker = null;
  const n = playerHand.length;

  for (let len = 5; len >= 2; len--) {
    if (bestPoker) break;
    const testIndices = [];
    const backtrack = (start, chosen) => {
      if (bestPoker) return;
      if (chosen.length === len) {
        const candidateCards = chosen.map(idx => playerHand[idx]);
        const pRes = evaluateVectorParityPoker(candidateCards, parityFilter);
        if (pRes.isValid) {
          if (allowedPatterns && allowedPatterns.length > 0 && !allowedPatterns.includes(pRes.combo.id)) {
            return;
          }

          // Verifica se le prime 2 carte disinnescano anche la bomba
          const disarmsBomb = bombTarget && candidateCards.length >= 2 &&
            ((Number(candidateCards[0].value) || 0) + (Number(candidateCards[1].value) || 0) === bombTarget);
          
          bestPoker = {
            station: 2,
            cardIndices: [...chosen],
            combo: pRes.combo,
            damage: pRes.damage + (disarmsBomb ? 30 : 0),
            disarmsBomb
          };
        }
        return;
      }
      for (let i = start; i < n; i++) {
        chosen.push(i);
        backtrack(i + 1, chosen);
        chosen.pop();
      }
    };
    backtrack(0, testIndices);
  }

  // 2. SCANSIONE NUCLEO VETTORIALE (STAZIONE 1)
  let bestNucleus = null;

  if (currentNucleus === null) {
    // A 2 carte: c1 [op] c2 = target
    for (let i = 0; i < playerHand.length && !bestNucleus; i++) {
      const v1 = getCardEffectiveValue(playerHand[i], activeAnomaly);
      for (let j = 0; j < playerHand.length && !bestNucleus; j++) {
        if (i === j) continue;
        const v2 = getCardEffectiveValue(playerHand[j], activeAnomaly);
        for (const op of ops) {
          if (op === '/' && Math.abs(v2) < 1e-7) continue;
          let res = op === '+' ? v1 + v2 : op === '-' ? v1 - v2 : op === '*' ? v1 * v2 : v1 / v2;
          if (!isNaN(res) && Math.abs(res - vectorTarget) < 1e-5) {
            const disarmsBomb = bombTarget && (v1 + v2 === bombTarget);
            bestNucleus = {
              station: 1,
              nucleusIndex: i,
              targetCardIndex: j,
              op,
              totalCards: 2,
              damage: 20 + (disarmsBomb ? 30 : 0),
              disarmsBomb
            };
            break;
          }
        }
      }
    }

    // A 3 carte: (c1 [op1] c2) [op2] c3 = target
    if (!bestNucleus && playerHand.length >= 3) {
      for (let i = 0; i < playerHand.length && !bestNucleus; i++) {
        const v1 = getCardEffectiveValue(playerHand[i], activeAnomaly);
        for (let j = 0; j < playerHand.length && !bestNucleus; j++) {
          if (i === j) continue;
          const v2 = getCardEffectiveValue(playerHand[j], activeAnomaly);
          for (const op1 of ops) {
            if (op1 === '/' && Math.abs(v2) < 1e-7) continue;
            let s1 = op1 === '+' ? v1 + v2 : op1 === '-' ? v1 - v2 : op1 === '*' ? v1 * v2 : v1 / v2;
            if (isNaN(s1)) continue;

            for (let k = 0; k < playerHand.length && !bestNucleus; k++) {
              if (k === i || k === j) continue;
              const v3 = getCardEffectiveValue(playerHand[k], activeAnomaly);
              for (const op2 of ops) {
                if (op2 === '/' && Math.abs(v3) < 1e-7) continue;
                let s2 = op2 === '+' ? s1 + v3 : op2 === '-' ? s1 - v3 : op2 === '*' ? s1 * v3 : s1 / v3;
                if (!isNaN(s2) && Math.abs(s2 - vectorTarget) < 1e-5) {
                  const disarmsBomb = bombTarget && (v1 + v2 === bombTarget);
                  bestNucleus = {
                    station: 1,
                    nucleusIndex: i,
                    targetCardIndex: j,
                    op: op1,
                    nextCardIndex: k,
                    op2,
                    totalCards: 3,
                    damage: 15 + (disarmsBomb ? 30 : 0),
                    disarmsBomb
                  };
                  break;
                }
              }
            }
          }
        }
      }
    }
  } else {
    // Nucleo già caricato: cerca chiusura
    const v1 = currentNucleus.value;
    for (let j = 0; j < playerHand.length && !bestNucleus; j++) {
      const v2 = getCardEffectiveValue(playerHand[j], activeAnomaly);
      for (const op of ops) {
        if (op === '/' && Math.abs(v2) < 1e-7) continue;
        let res = op === '+' ? v1 + v2 : op === '-' ? v1 - v2 : op === '*' ? v1 * v2 : v1 / v2;
        if (!isNaN(res) && Math.abs(res - vectorTarget) < 1e-5) {
          bestNucleus = {
            station: 1,
            targetCardIndex: j,
            op,
            totalCards: 1,
            damage: 20
          };
          break;
        }
      }
    }
  }

  // Ritorna la soluzione a priorità più alta (danno maggiore o disinnesco bomba)
  if (bestPoker && bestNucleus) {
    return bestPoker.damage >= bestNucleus.damage ? bestPoker : bestNucleus;
  }
  return bestPoker || bestNucleus || null;
};





// Solutore completo Tris Stellare a 5 Carte: scansiona i 3 bersagli (numerici e parità)
const scanTrisSolution = (playerHand, tableCard, targetsInput, selectedIdx = 0, activeAnomaly = null) => {
  if (!playerHand || playerHand.length < 4 || !tableCard) return null;
  const targets = Array.isArray(targetsInput) 
    ? targetsInput 
    : [{ target: Number(targetsInput) || 24, isParity: false, isBomb: false }];

  const ops = ['+', '-', '*', '/'].filter(op => op !== activeAnomaly?.blockedOp);
  const solutions = {};

  targets.forEach((tObj, tIdx) => {
    let best = null;
    let highestDamage = -1;

    const len = playerHand.length;
    for (let i = 0; i < len; i++) {
      const c2 = playerHand[i];
      if (!c2 || (c2.isJoker && !c2.isTransformed)) continue;

      for (const op of ops) {
        for (let j = 0; j < len; j++) {
          if (j === i) continue;
          const c3 = playerHand[j];
          if (!c3 || (c3.isJoker && !c3.isTransformed)) continue;

          for (let k = j + 1; k < len; k++) {
            if (k === i) continue;
            const c4 = playerHand[k];
            if (!c4 || (c4.isJoker && !c4.isTransformed)) continue;

            for (let m = k + 1; m < len; m++) {
              if (m === i) continue;
              const c5 = playerHand[m];
              if (!c5 || (c5.isJoker && !c5.isTransformed)) continue;

              const res = evaluateTrisStellare(tableCard, c2, c3, c4, c5, op, tObj, activeAnomaly);
              if (res.isValid) {
                if (res.totalDamage > highestDamage) {
                  highestDamage = res.totalDamage;
                  best = {
                    targetIndex: tIdx,
                    cardIndices: [i, j, k, m],
                    op1: op,
                    combo: res.combo,
                    totalDamage: res.totalDamage,
                    mathDamage: res.mathDamage,
                    pokerDamage: res.pokerDamage,
                    weight: res.totalDamage
                  };
                }
              }
            }
          }
        }
      }
    }

    if (best) solutions[tIdx] = best;
  });

  if (solutions[selectedIdx]) return solutions[selectedIdx];

  const allSolIndices = Object.keys(solutions);
  if (allSolIndices.length === 0) return null;

  allSolIndices.sort((a, b) => solutions[b].weight - solutions[a].weight);
  return solutions[allSolIndices[0]];
};



// 4.7 VALUTATORE SINERGIE SEMI CON SUPPORTO ALLA CARTA DORATA
const evaluateSuitBonus = (cards, deckId = 'neutral_starter', deckLevel = 1, maxHp = 50, goldenCardId = null, isSector1 = false) => {
  if (!cards || cards.length === 0 || isSector1) {
    return { heal: 0, dust: 0, timeTankBonus: 0, extraDamage: 0, isFourSuitsCombo: false, damageMultiplier: 1, bonusDiamonds: 0, etherBonus: 0, hasGoldenCard: false };
  }


  const validCards = cards.filter(Boolean);
  const traits = getDeckActiveTraits(deckId, deckLevel);

  const suitsUsed = new Set();
  let heal = 0;
  let dust = 0;
  let timeTankBonus = 0;
  let extraDamage = 0;
  let bonusDiamonds = 0;
  let etherBonus = 0;
  let hasGoldenCard = false;

  const healBoostTrait = traits.find(t => t.type === 'suit_heal_boost' && t.suit === 'hearts');
  const heartRatio = healBoostTrait ? (healBoostTrait.bonusPct || 0.12) : 0.08;
  const heartHealPerCard = Math.max(4, Math.round((Number(maxHp) || 50) * heartRatio));

  const dustBoostTrait = traits.find(t => t.type === 'suit_dust_boost' && t.suit === 'diamonds');
  const diamondBaseDust = dustBoostTrait ? (2 + (dustBoostTrait.bonus || 2)) : 2;

  const timeBoostTrait = traits.find(t => t.type === 'suit_time_boost' && t.suit === 'clubs');
  const clubBaseTime = timeBoostTrait ? (5 + (timeBoostTrait.bonus || 5)) : 5;

  const dmgBoostTrait = traits.find(t => t.type === 'suit_damage_boost' && t.suit === 'spades');
  const spadeBaseDamage = dmgBoostTrait ? (3 + (dmgBoostTrait.bonus || 2)) : 3;

  const flatHeartsTrait = traits.find(t => t.type === 'hearts_flat_heal');
  const flatHeartsBonus = flatHeartsTrait ? (flatHeartsTrait.bonus || 2) : 0;

  validCards.forEach(c => {
    const suitKey = getCardSuit(c);
    const isThisCardGolden = Boolean(c.isGolden || (goldenCardId && c.id === goldenCardId));
    if (isThisCardGolden) hasGoldenCard = true;

    if (suitKey && suitKey !== 'joker') {
      suitsUsed.add(suitKey);

      if (suitKey === 'hearts') {
        if (isThisCardGolden) {
          const goldenHeartHeal = Math.max(8, Math.round((Number(maxHp) || 50) * (heartRatio * 2)));
          heal += (goldenHeartHeal + flatHeartsBonus * 2);
        } else {
          heal += (heartHealPerCard + flatHeartsBonus);
        }
      }

      if (suitKey === 'diamonds') {
        if (isThisCardGolden) {
          dust += 20;
          if (Math.random() < 0.10) bonusDiamonds += 1;
        } else {
          dust += diamondBaseDust;
        }
      }

      if (suitKey === 'clubs') {
        if (isThisCardGolden) {
          timeTankBonus += 15;
          etherBonus += 1;
        } else {
          timeTankBonus += clubBaseTime;
        }
      }

      if (suitKey === 'spades') {
        if (isThisCardGolden) {
          extraDamage += 8;
        } else {
          extraDamage += spadeBaseDamage;
        }
      }
    }
  });

    const isFourSuitsCombo = suitsUsed.size >= 4 && validCards.length >= 4;

  let damageMultiplier = 1;
  if (isFourSuitsCombo) {
    const comboTrait = traits.find(t => t.type === 'combo_4suits_mult');
    const baseMult = comboTrait ? (comboTrait.mult || 2.5) : 2.0;

    if (hasGoldenCard) {
      damageMultiplier = comboTrait ? 3.5 : 3.0;
      bonusDiamonds += 2;
      dust += 50;
    } else {
      damageMultiplier = baseMult;
    }
  }

  return {
    heal,
    dust,
    timeTankBonus,
    extraDamage,
    isFourSuitsCombo,
    damageMultiplier,
    bonusDiamonds,
    etherBonus,
    hasGoldenCard
  };
};

// 4.7b GENERATORE BERSAGLIO NUCLEO INSTABILE (BOMBA)
const generateBombTarget = (currentGlobalSector = 6) => {
  const availableArchetypes = typeof BOMB_ARCHETYPES !== 'undefined' 
    ? BOMB_ARCHETYPES.filter(b => currentGlobalSector >= (b.minSector || 6))
    : [];
  const archetype = availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)] || {
    id: 'fracture',
    title: 'Bomba a Frattura',
    icon: '💥',
    color: '#ef4444',
    successDesc: '+30 HP danno al nemico',
    failDesc: 'Il nemico cura +25 HP'
  };

  const ops = ['+', '-', '*', '/'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let target = 20;

  if (op === '+') target = Math.floor(Math.random() * 25) + 10;
  else if (op === '-') target = Math.floor(Math.random() * 12) + 2;
  else if (op === '*') {
    const factors = [12, 16, 18, 20, 24, 30, 36, 40, 48];
    target = factors[Math.floor(Math.random() * factors.length)];
  } else if (op === '/') {
    const quotients = [2, 3, 4, 5, 6];
    target = quotients[Math.floor(Math.random() * quotients.length)];
  }

    return {
    ...archetype,
    op,
    target,
    turnsRemaining: 3,
    isBomb: true,
    type: archetype.id
  };
};



// Generatore dedicato al bersaglio Bomba per Vettore (Target somma a 2 carte: range 4 - 24)
const generateVectorBombTarget = (currentGlobalSector = 6) => {
  const availableArchetypes = typeof BOMB_ARCHETYPES !== 'undefined' 
    ? BOMB_ARCHETYPES.filter(b => currentGlobalSector >= (b.minSector || 6))
    : [];
  const archetype = availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)] || {
    id: 'fracture',
    title: 'Bomba a Frattura',
    icon: '💥',
    color: '#ef4444',
    successDesc: '+30 HP danno puro al nemico',
    failDesc: 'Subisci 25 HP di danno allo scafo'
  };

  // Target di somma intera componibile con 2 carte (da 4 a 24)
  const target = Math.floor(Math.random() * 21) + 4;

  return {
    ...archetype,
    target,
    turnsRemaining: 3,
    isBomb: true,
    type: archetype.id
  };
};

// Generatore dedicato al bersaglio Bomba per Duello a Doppio Stadio
const generateDuelBombTarget = (currentGlobalSector = 6) => {
  const availableArchetypes = typeof BOMB_ARCHETYPES !== 'undefined'
    ? BOMB_ARCHETYPES.filter(b => currentGlobalSector >= (b.minSector || 6))
    : [];
  const archetype = availableArchetypes[Math.floor(Math.random() * availableArchetypes.length)] || {
    id: 'fracture',
    title: 'Bomba a Frattura',
    icon: '💥',
    color: '#ef4444',
    successDesc: '+30 HP danno puro al nemico',
    failDesc: 'Subisci 25 HP di danno allo scafo'
  };

  const target = Math.floor(Math.random() * 20) + 10;
  return {
    ...archetype,
    target,
    turnsRemaining: 3,
    isBomb: true,
    type: archetype.id
  };
};

// Valutatore Poker a Parità per Modalità Vettore (Stazione 2)

const evaluateVectorParityPoker = (cards, requiredParity = 'PARI') => {
  if (!cards || cards.length < 2) {
    return { isValid: false, combo: null, sum: 0, damage: 0, reason: 'Servono almeno 2 carte' };
  }

  const validCards = cards.filter(Boolean);
  if (validCards.length < 2 || validCards.length > 5) {
    return { isValid: false, combo: null, sum: 0, damage: 0, reason: 'Seleziona da 2 a 5 carte' };
  }

  // 1. Somma algebrica nominale delle carte
  const sum = validCards.reduce((acc, c) => acc + (Number(c.value) || 0), 0);
  const isEven = sum % 2 === 0;
  const parityMatches = (requiredParity === 'PARI' && isEven) || (requiredParity === 'DISPARI' && !isEven);

  if (!parityMatches) {
    return { isValid: false, combo: null, sum, damage: 0, reason: `Somma ${sum} non conforme: richiesto ${requiredParity}` };
  }

  // 2. Riconoscimento Figura Poker
  let recognizedPattern = null;
  for (const p of CLASSIC_POKER_PATTERNS) {
    if (validateClassicPokerPattern(validCards, p.id)) {
      recognizedPattern = p;
      break;
    }
  }

  if (!recognizedPattern) {
    return { isValid: false, combo: null, sum, damage: 0, reason: 'Nessuna combinazione poker valida trovata' };
  }

  return {
    isValid: true,
    combo: recognizedPattern,
    sum,
    damage: recognizedPattern.damage,
    cardsCount: validCards.length
  };
};



const generateTrisStellareObjectives = (
  existingBomb = null,
  currentGlobalSector = 1,
  isBombAllowed = false,
  handCards = [],
  activeAnomaly = null,
  existingTableCard = null
) => {
  const isPersistentBomb = isBombAllowed && existingBomb && existingBomb.turnsRemaining > 0;

  // Preserva la carta tavolo se la bomba è ancora attiva, altrimenti ne pesca una nuova
  const tableCard = (isPersistentBomb && (existingBomb?.tableCard || existingTableCard))
    ? (existingBomb.tableCard || existingTableCard)
    : createRandomCard(false);

  const ops = ['+', '-', '*', '/'].filter(op => op !== activeAnomaly?.blockedOp);
  const getRandomOp = () => (ops.length > 0 ? ops[Math.floor(Math.random() * ops.length)] : '+');

  const validHand = (handCards || []).filter(c => c && !c.isJoker && (c.value || 0) > 0);
  const tableVal = getCardEffectiveValue(tableCard, activeAnomaly);

  // 1. Calcolo Bersaglio 1 (Numero Esatto Garantito a 4 carte: (Tavolo [op] C2) + C3 + C4 + C5)
  let guaranteedTarget = null;
  let guaranteedOp1 = '+';

  if (validHand.length >= 4) {
    const candidates = [];
    const len = validHand.length;

    // Campiona combinazioni di 4 carte reali per trovare target puliti
    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len; j++) {
        if (i === j) continue;
        for (let k = 0; k < len; k++) {
          if (k === i || k === j) continue;
          for (let m = 0; m < len; m++) {
            if (m === i || m === j || m === k) continue;

            const v2 = getCardEffectiveValue(validHand[i], activeAnomaly);
            const v3 = getCardEffectiveValue(validHand[j], activeAnomaly);
            const v4 = getCardEffectiveValue(validHand[k], activeAnomaly);
            const v5 = getCardEffectiveValue(validHand[m], activeAnomaly);

            for (const op of ops) {
              if (op === '/' && (v2 === 0 || tableVal % v2 !== 0)) continue;
              let step1 = 0;
              if (op === '+') step1 = tableVal + v2;
              else if (op === '-') step1 = tableVal - v2;
              else if (op === '*') step1 = tableVal * v2;
              else if (op === '/') step1 = tableVal / v2;

              const total = step1 + v3 + v4 + v5;
              if (Number.isInteger(total) && total >= 18 && total <= 65) {
                candidates.push({ target: total, op1: op });
              }
            }
          }
        }
      }
    }

    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      guaranteedTarget = chosen.target;
      guaranteedOp1 = chosen.op1;
    }
  }

  if (!guaranteedTarget) {
    guaranteedTarget = Math.floor(Math.random() * 30) + 24;
    guaranteedOp1 = getRandomOp();
  }

  const targetNumericObj = {
    target: guaranteedTarget,
    op1: guaranteedOp1,
    isParity: false,
    isBomb: false
  };

  // 2. Calcolo Bersaglio 2 (Filtro Parità: PARI o DISPARI)
  const isEvenChoice = Math.random() < 0.5;
  const targetParityObj = {
    target: null,
    op1: '+',
    isParity: true,
    parityType: isEvenChoice ? 'PARI' : 'DISPARI',
    isBomb: false
  };

  // 3. Calcolo Bersaglio 3 (Bomba a 3 Turni o bersaglio numerico alternativo)
  let thirdTarget;
  if (isBombAllowed) {
    if (isPersistentBomb) {
      thirdTarget = {
        ...existingBomb,
        tableCard,
        isParity: false,
        isBomb: true,
        op1: existingBomb.op1 || getRandomOp()
      };
    } else {
      const rawBomb = generateBombTarget(currentGlobalSector);
      thirdTarget = {
        ...rawBomb,
        tableCard,
        isParity: false,
        turnsRemaining: 3,
        isBomb: true,
        op1: getRandomOp()
      };
    }
  } else {
    let t3 = Math.floor(Math.random() * 35) + 20;
    while (t3 === guaranteedTarget) {
      t3 = Math.floor(Math.random() * 35) + 20;
    }
    thirdTarget = {
      target: t3,
      op1: getRandomOp(),
      isParity: false,
      isBomb: false
    };
  }

  const targets = [targetNumericObj, targetParityObj, thirdTarget];

  return {
    tableCard,
    targets,
    op1: targets[0].op1,
    target: targets[0].target
  };
};





const getSectorGameType = (_planet?: number, _level?: number, _bossPhase?: number) => {
  return 'classic';
};



const getLevelReward = (planet, level, isReplay) => {
  const mult = isReplay ? 0.5 : 1.0;
  let diamondsBonus = 0;
  let dustBase = phase17CampaignDustAward(planet,level,false);

  if (!isReplay) {
    if (level === 5) {
      diamondsBonus = 3;
    }
    if (level === 10) {
      diamondsBonus = Math.floor(6 + planet * 0.5);
      dustBase += (150 + planet * 15);
    }
  }

  return {
    stardust: Math.floor(dustBase * mult),
    diamonds: diamondsBonus,
    xp: phase17CampaignXpAward(planet,level,isReplay)
  };
};

const getXpThresholdForLevel = (lvl) => {
  const currentLvl = Number(lvl) || 1;
  return 120 + (currentLvl * 45) + Math.floor(Math.pow(currentLvl, 1.3) * 15);
};

const getPlanetLevelModifier = (planet, level) => {
  const modPair = PLANET_MODS_TABLE[(planet - 1) % PLANET_MODS_TABLE.length] || [0, 0];
  const modId = level % 2 === 0 ? modPair[0] : modPair[1];
  return ADVENTURE_MODIFIERS[modId] || ADVENTURE_MODIFIERS[0];
};

const getAdventureAiPower = (planet, level) => {
  return Math.min(0.95, 0.65 + (planet - 1) * 0.015 + (level - 1) * 0.005);
};

// HELPER ASSEGNAZIONE MODULO ABILITÃ€ UNICO PER L'AVVERSARIO
const getComputerAbilityForPlanet = (planet) => {
  const p = Number(planet) || 1;
  if (p <= 2) return 'taurus';
  if (p <= 4) return 'aries';
  if (p <= 6) return 'gemini';
  if (p <= 8) return 'leo';
  if (p <= 10) return 'virgo';
  if (p <= 12) return 'libra';
  if (p <= 14) return 'planet_char_14'; // Proxima b
  if (p <= 16) return 'planet_char_16'; // Gliese 581g
  if (p <= 18) return 'planet_char_18'; // Eris
  if (p <= 19) return 'planet_char_19'; // Io
  return 'planet_char_20';              // Encelado
};

// RetrocompatibilitÃ  per chiamate che si aspettano un array
const getComputerEquipmentsForPlanet = (planet) => {
  return [getComputerAbilityForPlanet(planet)];
};

// HELPER CALCOLO LIVELLO MAZZO E MODULO AVVERSARIO SIMMETRICO SUI 3 SCAGLIONI
const getAdventureAiDeckLevel = (planet) => {
  const p = Number(planet) || 1;
  if (p <= 6) {
    return p <= 2 ? 1 : p <= 4 ? 2 : 3;
  } else if (p <= 13) {
    return p <= 9 ? 4 : p <= 11 ? 5 : 6;
  } else {
    return p <= 16 ? 7 : p <= 18 ? 8 : 9;
  }
};

const getLevelUpRewards = (lvl) => ({
  stardust: 80 + lvl * 10,
  diamonds: lvl % 5 === 0 ? 5 : 1,
  lives: (lvl === 15 || lvl === 30 || lvl === 50 || lvl === 75) ? 1 : 0
});

const generateHumanPacing = (isCampaign = false, planet = 1) => {
  let totalTime;
  let profile = 'standard';

  if (isCampaign) {
    if (planet <= 4) {
      totalTime = Math.floor(Math.random() * 4000) + 10000;
    } else {
      totalTime = Math.floor(Math.random() * 5000) + 12000;
    }
  } else {
    const rand = Math.random();
    if (rand < 0.15) {
      profile = 'fast';
      totalTime = Math.floor(Math.random() * 6000) + 8000;
    } else if (rand < 0.75) {
      profile = 'standard';
      totalTime = Math.floor(Math.random() * 10000) + 18000;
    } else if (rand < 0.93) {
      profile = 'overtime';
      totalTime = Math.floor(Math.random() * 10000) + 40000;
    } else {
      profile = 'timeout';
      totalTime = 60000;
    }
  }

  const firstTap = profile === 'fast' ? Math.floor(totalTime * 0.35) : Math.floor(totalTime * 0.30);
  const hasHesitation = profile !== 'fast' && (profile === 'timeout' || Math.random() < 0.4);
  const hesitationTime = Math.floor(totalTime * 0.50);
  const secondTap = Math.floor(totalTime * 0.75);

  return {
    profile,
    totalTime,
    firstTap,
    hasHesitation,
    hesitationTime,
    secondTap,
    executeTime: totalTime
  };
};



const calculateAiTurnVector = (aiHand, vectorTarget, currentNucleus = null, activeAnomaly = null) => {
  if (!aiHand || aiHand.length < 2) return { found: false };

  const ops = ['+', '-', '*', '/'].filter(op => op !== activeAnomaly?.blockedOp);
  const target = vectorTarget;

  for (let i = 0; i < aiHand.length; i++) {
    for (let j = 0; j < aiHand.length; j++) {
      if (i === j) continue;
      const c1 = aiHand[i];
      const c2 = aiHand[j];
      if (!c1 || !c2) continue;

      const v1 = getCardEffectiveValue(c1, activeAnomaly);
      const v2 = getCardEffectiveValue(c2, activeAnomaly);

          for (const op of ops) {
        if (op === '/' && Math.abs(v2) < 1e-7) continue;

        let res = NaN;
        if (op === '+') res = v1 + v2;
        else if (op === '-') res = v1 - v2;
        else if (op === '*') res = v1 * v2;
        else if (op === '/') res = v1 / v2;

        if (!isNaN(res) && Math.abs(res - target) < 1e-5) {

          return {
            found: true,
            cardsCount: 2,
            cardIndices: [i, j],
            cardsUsed: [c1, c2],
            nucleusValue: v1,
            op,
            result: res
          };
        }
      }
    }
  }

  if (aiHand.length >= 3) {
    for (let i = 0; i < aiHand.length; i++) {
      for (let j = 0; j < aiHand.length; j++) {
        if (i === j) continue;
        for (let k = 0; k < aiHand.length; k++) {
          if (k === i || k === j) continue;
          const c1 = aiHand[i], c2 = aiHand[j], c3 = aiHand[k];
          if (!c1 || !c2 || !c3) continue;

          const v1 = getCardEffectiveValue(c1, activeAnomaly);
          const v2 = getCardEffectiveValue(c2, activeAnomaly);
          const v3 = getCardEffectiveValue(c3, activeAnomaly);

          for (const op1 of ops) {
            let s1 = 0;
            if (op1 === '+') s1 = v1 + v2;
            else if (op1 === '-') s1 = v1 - v2;
            else if (op1 === '*') s1 = v1 * v2;
            else if (op1 === '/' && v2 !== 0) s1 = v1 / v2;

            if (isNaN(s1)) continue;

                      for (const op2 of ops) {
              if (op2 === '/' && Math.abs(v3) < 1e-7) continue;

              let s2 = NaN;
              if (op2 === '+') s2 = s1 + v3;
              else if (op2 === '-') s2 = s1 - v3;
              else if (op2 === '*') s2 = s1 * v3;
              else if (op2 === '/') s2 = s1 / v3;

              if (!isNaN(s2) && Math.abs(s2 - target) < 1e-5) {

                return {
                  found: true,
                  cardsCount: 3,
                  cardIndices: [i, j, k],
                  cardsUsed: [c1, c2, c3],
                  nucleusValue: v1,
                  op: `${op1},${op2}`,
                  result: s2
                };
              }
            }
          }
        }
      }
    }
  }

  return { found: false };
};

// SOLUTORE AI MODALITÀ CONVERGENZA: TURNO 1 (2 CARTE SU BASE) & TURNO 2 (2 CARTE SU PARZIALE T1)
const calculateAiTurnConvergence = (
  turnPhase, // 1 (Apertura) o 2 (Chiusura)
  aiHand,
  baseCard,
  targetVal,
  partialT1Val = 0,
  bombTarget = null,
  activeAnomaly = null
) => {
  if (!aiHand || aiHand.length < 2) return { found: false };
  const ops = ['+', '-', '*', '/'].filter(op => op !== activeAnomaly?.blockedOp);
  const n = aiHand.length;

    const evalStep = (vLeft, op, vRight) => {
    if (op === '+') return vLeft + vRight;
    if (op === '-') return vLeft - vRight;
    if (op === '*') return vLeft * vRight;
    if (op === '/') return (vRight !== 0 && Math.abs(vRight) > 1e-7) ? (vLeft / vRight) : NaN;
    return NaN;
  };


  // --- TURNO 1 (APERTURA): (Base [op1] C1) [op2] C2 = Parziale T1 ---
  if (turnPhase === 1) {
    const vBase = getCardEffectiveValue(baseCard, activeAnomaly);
    let bestT1Move = null;
    let minTrajectoryDiff = Infinity;

    for (let i = 0; i < n; i++) {
      const v1 = getCardEffectiveValue(aiHand[i], activeAnomaly);
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const v2 = getCardEffectiveValue(aiHand[j], activeAnomaly);

        for (const op1 of ops) {
          const s1 = evalStep(vBase, op1, v1);
          if (isNaN(s1)) continue;

          for (const op2 of ops) {
            const resT1 = evalStep(s1, op2, v2);
            if (isNaN(resT1)) continue;

            // Priorità 1: Disinnesco bomba in Turno 1
            if (bombTarget && Math.abs(resT1 - bombTarget) < 1e-5) {
              return {
                found: true,
                cardIndices: [i, j],
                cardsUsed: [aiHand[i], aiHand[j]],
                op1,
                op2,
                result: resT1,
                isBombDisarm: true
              };
            }

            // Priorità 2: Traiettoria verso metà del Target
            const trajectoryTarget = Math.max(10, Math.round(targetVal * 0.5));
            const diff = Math.abs(resT1 - trajectoryTarget);
            if (diff < minTrajectoryDiff) {
              minTrajectoryDiff = diff;
              bestT1Move = {
                found: true,
                cardIndices: [i, j],
                cardsUsed: [aiHand[i], aiHand[j]],
                op1,
                op2,
                result: resT1,
                isBombDisarm: false
              };
            }
          }
        }
      }
    }
    return bestT1Move || { found: false };
  }

  // --- TURNO 2 (CHIUSURA): (ParzialeT1 [op3] C3) [op4] C4 = Finale ---
  if (turnPhase === 2) {
    let bestT2Move = null;
    let minDelta = Infinity;

    for (let i = 0; i < n; i++) {
      const v3 = getCardEffectiveValue(aiHand[i], activeAnomaly);
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const v4 = getCardEffectiveValue(aiHand[j], activeAnomaly);

        for (const op3 of ops) {
          const s2 = evalStep(partialT1Val, op3, v3);
          if (isNaN(s2)) continue;

          for (const op4 of ops) {
            const finalRes = evalStep(s2, op4, v4);
            if (isNaN(finalRes)) continue;

            // Disinnesco bomba in Turno 2 se non ancora disinnescata
            const isBombHit = bombTarget && Math.abs(finalRes - bombTarget) < 1e-5;
            const delta = Math.abs(finalRes - targetVal);

            if (delta < minDelta || (isBombHit && delta <= minDelta + 5)) {
              minDelta = delta;
              bestT2Move = {
                found: true,
                cardIndices: [i, j],
                cardsUsed: [aiHand[i], aiHand[j]],
                op1: op3,
                op2: op4,
                result: finalRes,
                isBombDisarm: Boolean(isBombHit)
              };
            }
          }
        }
      }
    }
    return bestT2Move || { found: false };
  }

  return { found: false };
};

// Alias per compatibilità
const calculateAiTurnDoubleStage = calculateAiTurnConvergence;


const calculateAiTurnTrisStellare = (aiHand, tableCard, op1, op2, targetInput, activeAnomaly = null) => {
  if (!aiHand || aiHand.length < 4 || !tableCard) return { found: false };

  const targets = Array.isArray(targetInput)
    ? targetInput
    : [{ target: typeof targetInput === 'number' ? targetInput : (targetInput?.target || 20), isParity: false, isBomb: false }];

  const ops = ['+', '-', '*', '/'].filter(op => op !== activeAnomaly?.blockedOp);
  let bestMove = null;
  let highestDamage = -1;

  for (let tIdx = 0; tIdx < targets.length; tIdx++) {
    const tObj = targets[tIdx];

    const len = aiHand.length;
    for (let i = 0; i < len; i++) {
      const c2 = aiHand[i];
      if (!c2) continue;

      for (const op of ops) {
        for (let j = 0; j < len; j++) {
          if (j === i) continue;
          const c3 = aiHand[j];
          if (!c3) continue;

          for (let k = j + 1; k < len; k++) {
            if (k === i) continue;
            const c4 = aiHand[k];
            if (!c4) continue;

            for (let m = k + 1; m < len; m++) {
              if (m === i) continue;
              const c5 = aiHand[m];
              if (!c5) continue;

              const res = evaluateTrisStellare(tableCard, c2, c3, c4, c5, op, tObj, activeAnomaly);
              if (res.isValid) {
                if (res.totalDamage > highestDamage) {
                  highestDamage = res.totalDamage;
                  bestMove = {
                    found: true,
                    targetIndex: tIdx,
                    targetObj: tObj,
                    cardIndices: [i, j, k, m],
                    cardsUsed: [c2, c3, c4, c5],
                    op1: op,
                    totalDamage: res.totalDamage,
                    mathDamage: res.mathDamage,
                    pokerDamage: res.pokerDamage,
                    combo: res.combo
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  return bestMove || { found: false };
};



// 7.0 COMPONENTE RESOURCE HEADER OLOGRAFICO (CON COPPA ÉLITE ANIMATA)
// ============================================================================
function ResourceHeader({
  nickname = 'Pilota',
  level = 1,
  xp = 0,
  trophies = 0,
  diamonds = 0,
  lives = 3,
  credits = 200,
  creditTimerText = 'MAX',
  setShowProgression,
  onOpenStore,
  onOpenLeaderboard,
  onOpenSettings
}) {

  const [timeLeft, setTimeLeft] = useState({ diamonds: 0, lives: 0 });
  const [trophyBouncing, setTrophyBouncing] = useState(false);
  const maxLives = getMaxLivesForLevel(level);

  const handleTrophyClick = () => {
    try { playSound('click'); } catch (_) {}
    setTrophyBouncing(true);
    setTimeout(() => {
      setTrophyBouncing(false);
      if (typeof onOpenLeaderboard === 'function') onOpenLeaderboard();
    }, 220);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let diaTime = 0;
      const lastDiaStr = localStorage.getItem('lastDiamondReward');
      if (lastDiaStr) {
        const elapsed = now - parseInt(lastDiaStr, 10);
        diaTime = Math.max(0, 604800000 - (elapsed % 604800000));
      } else {
        diaTime = 604800000;
      }
      let liveTime = 0;
      if (lives < maxLives) {
        const lastLifeStr = localStorage.getItem('eclissi_lastLifeUpdate');
        if (lastLifeStr) {
          const elapsedLife = now - parseInt(lastLifeStr, 10);
          liveTime = Math.max(0, 28800000 - (elapsedLife % 28800000));
        }
      }
      setTimeLeft({ diamonds: diaTime, lives: liveTime });
    }, 1000);
    return () => clearInterval(interval);
  }, [level, lives, maxLives]);

  const formatTime = (ms) => {
    if (ms <= 0) return "MAX";
    const ts = Math.floor(ms / 1000), d = Math.floor(ts / 86400), h = Math.floor((ts % 86400) / 3600), m = Math.floor((ts % 3600) / 60), s = ts % 60;
    return d > 0 ? `${d}g ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  const xpThreshold = getXpThresholdForLevel(level);

  return (
    <div id="tour-target-header" style={{ width: '100%', position: 'relative', zIndex: 10, flexShrink: 0, padding: 'clamp(2px, 0.6vmin, 6px) clamp(4px, 1vmin, 8px)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        
        {/* PARTE SINISTRA: COPPA ÉLITE ANIMATA + NOME + LIVELLO + BARRA XP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.6vmin, 12px)' }}>
          
          {/* Coppa Élite interattiva con animazione al tocco */}
          <div
            onClick={handleTrophyClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              cursor: 'pointer',
              transform: trophyBouncing ? 'scale(1.4) rotate(-14deg)' : 'scale(1) rotate(0deg)',
              transition: 'transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            title="Tocca per aprire la Classifica Élite"
          >
            <SciFiIcon name="trophy" size={17} color="#fde047" />
            <span style={{ fontSize: 'clamp(0.72rem, 1.8vmin, 0.88rem)', fontWeight: 900, color: '#facc15', textShadow: '0 0 10px rgba(250, 204, 21, 0.85)' }}>
              {trophies}
            </span>
          </div>

          {/* Nome Giocatore + Livello + Barra Esperienza */}
          <div 
            onClick={() => { try { playSound('click'); } catch (_) {} if (typeof setShowProgression === 'function') setShowProgression(true); }} 
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
            title="Tocca per visualizzare la progressione livelli"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#00f2fe', fontWeight: 900, fontSize: 'clamp(0.75rem, 1.8vmin, 0.9rem)', textShadow: '0 0 10px rgba(0, 242, 254, 0.8)', letterSpacing: '0.5px' }}>
                {nickname}
              </span>
              <span style={{ fontSize: 'clamp(0.55rem, 1.3vmin, 0.68rem)', color: '#94a3b8', fontWeight: 800 }}>
                Lv.{level}
              </span>
            </div>

            {/* Micro-linea laser XP */}
            <div style={{ width: 'clamp(60px, 16vmin, 95px)', height: '2.5px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (xp / xpThreshold) * 100)}%`, height: '100%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }} />
            </div>
          </div>

        </div>

        {/* PARTE DESTRA: CREDITI, VITE E DIAMANTI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vmin, 16px)' }}>
          
          {/* Crediti */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`Crediti: ${credits}⚡ (${creditTimerText})`}>
            <SciFiIcon name="credit" size={14} color="#00f2fe" />
            <span style={{ fontSize: 'clamp(0.7rem, 1.7vmin, 0.85rem)', fontWeight: 900, color: '#00f2fe', textShadow: '0 0 8px rgba(0, 242, 254, 0.7)' }}>
              {credits}
            </span>
          </div>

          {/* Vite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`Vite: ${lives}/${maxLives} (${formatTime(timeLeft.lives)})`}>
            <SciFiIcon name="life" size={14} color="#f43f5e" />
            <span style={{ fontSize: 'clamp(0.7rem, 1.7vmin, 0.85rem)', fontWeight: 900, color: '#fca5a5', textShadow: '0 0 8px rgba(244, 63, 94, 0.7)' }}>
              {lives}
            </span>
          </div>

                    {/* Diamanti */}
          <div 
            onClick={onOpenStore} 
            style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }} 
            title="Tocca per aprire il Negozio"
          >
            <SciFiIcon name="diamond" size={14} color="#d946ef" />
            <span style={{ fontSize: 'clamp(0.7rem, 1.7vmin, 0.85rem)', fontWeight: 900, color: '#f5d0fe', textShadow: '0 0 8px rgba(217, 70, 239, 0.7)' }}>
              {diamonds}
            </span>
          </div>

          {/* Impostazioni ⚙️ */}
          <div 
            onClick={onOpenSettings} 
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '2px', marginLeft: '2px' }} 
            title="Impostazioni"
          >
            <SciFiIcon name="settings" size={15} color="#cbd5e1" />
          </div>

        </div>

      </div>
    </div>
  );
}



// ============================================================================
// MAPPA A NODI DELLA ROTTA DELLE COSTELLAZIONI (24 CAPSULE / 360 STELLE)
// ============================================================================
function StarRouteMapModal({ totalStars = 0, claimedCapsules = {}, onClaim, onClose }) {
  const milestones = PHASE16A_STAR_MILESTONES;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.2rem', maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '2px solid #facc15', boxShadow: '0 0 50px rgba(250, 204, 21, 0.45)' }}>
        
        {/* Header Rotta Stellare */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(250, 204, 21, 0.3)', paddingBottom: '0.5rem', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#fde047', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ROTTA DELLE COSTELLAZIONI
            </div>
            <h3 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>â­</span> {totalStars} / {PHASE16A_MAX_STARS} Stelle Conquistate
            </h3>
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '0.25rem 0.6rem', background: '#ef4444', borderColor: '#f87171' }}>âœ•</button>
        </div>

        {/* Barra di Avanzamento Globale */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#cbd5e1', marginBottom: '3px' }}>
            <span>Avanzamento Totale</span>
            <strong style={{ color: '#facc15' }}>{Math.round((totalStars / PHASE16A_MAX_STARS) * 100)}%</strong>
          </div>
          <div className="led-meter-bar" style={{ height: '7px' }}>
            <div className="led-meter-fill" style={{ width: `${Math.min(100, (totalStars / PHASE16A_MAX_STARS) * 100)}%`, background: 'linear-gradient(90deg, #f59e0b, #facc15)' }} />
          </div>
        </div>

        {/* Mappa a Nodi Sinuosa a Scorrimento */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {milestones.map((m, idx) => {
            const isUnlocked = totalStars >= m;
            const isClaimed = Boolean(claimedCapsules[m]);
            const reward = getStarCapsuleReward(m);
            const isMajorNode = Boolean(reward.unlockItem);

            return (
              <div
                key={m}
                className="cyber-panel"
                style={{
                  padding: isMajorNode ? '0.85rem' : '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  border: isMajorNode 
                    ? (isClaimed ? '1.5px solid #059669' : isUnlocked ? '2px solid #facc15' : '1.5px dashed rgba(250, 204, 21, 0.4)')
                    : (isClaimed ? '1px solid rgba(255,255,255,0.1)' : isUnlocked ? '1.5px solid #00f2fe' : '1px dashed rgba(255,255,255,0.1)'),
                  background: isMajorNode
                    ? (isClaimed ? 'rgba(6, 78, 59, 0.35)' : isUnlocked ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(15, 23, 42, 0.95))' : 'rgba(30, 27, 75, 0.45)')
                    : (isClaimed ? 'rgba(15, 23, 42, 0.5)' : isUnlocked ? 'rgba(8, 145, 178, 0.2)' : 'rgba(15, 23, 42, 0.75)'),
                  boxShadow: isUnlocked && !isClaimed ? (isMajorNode ? '0 0 20px rgba(250, 204, 21, 0.5)' : '0 0 14px rgba(0, 242, 254, 0.35)') : 'none',
                  opacity: isClaimed ? 0.65 : 1
                }}
              >
                {/* Nodo con Indicatore Numerico */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: isMajorNode ? '44px' : '36px',
                      height: isMajorNode ? '44px' : '36px',
                      borderRadius: '50%',
                      background: isClaimed ? '#059669' : isUnlocked ? (isMajorNode ? '#facc15' : '#00f2fe') : '#1e293b',
                      color: isUnlocked && !isClaimed ? '#020617' : '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: isMajorNode ? '0.82rem' : '0.7rem',
                      flexShrink: 0,
                      boxShadow: isUnlocked && !isClaimed ? '0 0 12px currentColor' : 'none'
                    }}
                  >
                    <span>{isClaimed ? 'âœ“' : isMajorNode ? 'â˜…' : `${idx + 1}`}</span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '900', color: isMajorNode ? '#fde047' : '#fff' }}>
                        Traguardo {m} â­
                      </span>
                      {isMajorNode && (
                        <span style={{ fontSize: '0.55rem', background: '#eab308', color: '#020617', padding: '1px 5px', borderRadius: '3px', fontWeight: '900' }}>
                          OGGETTO ESCLUSIVO
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: isMajorNode ? '#6ee7b7' : '#cbd5e1', marginTop: '2px', fontWeight: isMajorNode ? 'bold' : 'normal' }}>
                      {reward.unlockItem ? (
                        <span>ðŸŽ {reward.unlockItem.name} + {reward.dust}🌟 {reward.diamonds > 0 ? `+${reward.diamonds}💎` : ''}</span>
                      ) : (
                        <span>+{reward.dust}🌟 {reward.diamonds > 0 ? `+${reward.diamonds}💎 ` : ''}+{reward.ether}🔮 {reward.voidCrystals > 0 ? `+${reward.voidCrystals}ðŸ’  ` : ''}{reward.primordialMatter > 0 ? `+${reward.primordialMatter}🟣` : ''}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pulsante Riscatta */}
                <button
                  disabled={!isUnlocked || isClaimed}
                  onClick={() => onClaim(m)}
                  className={`cyber-btn ${isUnlocked && !isClaimed ? (isMajorNode ? 'cyber-btn-epic' : 'cyber-btn-success') : ''}`}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    minWidth: '85px',
                    flexShrink: 0
                  }}
                >
                  {isClaimed ? "Riscossa" : isUnlocked ? "RISCATTA âž”" : `-${m - totalStars} â­`}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MODALE BRIEFING & CLASSIFICA SFIDA DEL GIORNO (DAILY CHALLENGE)
// ============================================================================
function DailyChallengeModal({
  dailyData,
  countdownText,
  onLaunch,
  onClose
}) {
  const todayRome = getRomeDateString();
  const config = useMemo(() => generateDailyChallengeConfig(todayRome), [todayRome]);
  const allBots = useMemo(() => generateDailyGhostLeaderboard(todayRome), [todayRome]);
  const visibleBots = useMemo(() => getVisibleLeaderboard(allBots, dailyData.todayResult), [allBots, dailyData.todayResult]);

    const modeLabels = {
    poker: 'Poker · Botta e Risposta',
    classic: 'Classica (4 Operazioni)',
    vector: 'Vettore Geometrico',
    double_stage: 'Convergenza (Banco 2+2)',
    tris: 'Tris Stellare'
  };


  const hasAttempted = Boolean(dailyData.hasAttemptedToday);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 33000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '520px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '2px solid #facc15', boxShadow: '0 0 45px rgba(250, 204, 21, 0.5)' }}>
        
        {/* Intestazione */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(250, 204, 21, 0.3)', paddingBottom: '0.4rem', marginBottom: '0.65rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#fde047', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>
              FREQUENZA QUANTICA GIORNALIERA • {todayRome}
            </div>
            <h3 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚡</span> Sfida del Giorno
            </h3>
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#f87171' }}>X</button>
        </div>

        {/* Box Briefing Assetto Sandbox */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(250, 204, 21, 0.4)', borderRadius: '8px', padding: '0.65rem 0.85rem', marginBottom: '0.75rem', fontSize: '0.68rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#cbd5e1' }}>Modalità: <strong style={{ color: '#00f2fe' }}>{modeLabels[config.mode]}</strong></span>
            <span style={{ color: '#cbd5e1' }}>Timer Turno: <strong style={{ color: '#facc15' }}>{config.mode === 'poker' ? `${config.attackSeconds}/${config.responseSeconds}/${config.preparationSeconds}s` : `${config.turnTime}s (Blitz)`}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#cbd5e1' }}>Mazzo Assegnato: <strong style={{ color: '#38bdf8' }}>{config.mode === 'poker' ? 'Mazzo Poker identico per tutti' : `${config.assignedDeck} (Liv.${config.assignedDeckLevel})`}</strong></span>
            <span style={{ color: '#cbd5e1' }}>Vite Fornite: <strong style={{ color: config.livesProvided > 0 ? '#10b981' : '#ef4444' }}>{config.livesProvided > 0 ? '1 Vita' : '0 Vite (Morte Secca)'}</strong></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ color: '#cbd5e1' }}>Rapporto HP: <strong style={{ color: '#10b981' }}>{config.playerHp} HP</strong> vs <strong style={{ color: '#ef4444' }}>{config.aiHp} HP Nemesi</strong></span>
            <span style={{ color: '#cbd5e1' }}>Scanner: <strong style={{ color: '#ef4444' }}>BLOCCATO 🔒</strong></span>
          </div>
          <div style={{ color: '#fde047', fontSize: '0.62rem', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '3px', marginTop: '3px' }}>
            Regole: 1 solo tentativo ogni 24h solari. Nessun costo crediti. Chiusura alle 23:59:59 (Tempo rimasto: <strong>{countdownText}</strong>).
          </div>
        </div>

        {/* Tabella Classifica 150 Ghost Bot (Pacing Orario 24h) */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.2rem', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.62rem', color: '#facc15', fontWeight: '900', textTransform: 'uppercase' }}>
            Classifica Attiva (Piloti nel Quadrante: {visibleBots.length} • classifica di lancio con IA)
          </div>

          {visibleBots.map((pilot, idx) => {
            const rank = idx + 1;
            const isMe = pilot.isPlayer;

            return (
              <div
                key={pilot.id || idx}
                className="cyber-panel"
                style={{
                  padding: '0.35rem 0.55rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isMe ? 'rgba(8, 145, 178, 0.45)' : (rank <= 3 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(15, 23, 42, 0.8)'),
                  border: isMe ? '1.5px solid #00f2fe' : (rank <= 3 ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: '900', color: rank <= 3 ? '#fde047' : '#94a3b8', minWidth: '22px' }}>
                    #{rank}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isMe ? '#00f2fe' : '#fff' }}>
                      {pilot.nickname} {isMe && '(Tu)'}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#cbd5e1' }}>
                      {pilot.turns} Turni • {Math.round(pilot.timeElapsedMs / 1000)}s • HP {Math.round(pilot.remainingHpPct * 100)}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: '900' }}>
                  {pilot.timeStr || '--:--'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pulsante di Avvio o Stato Tentativo */}
        <div>
          {hasAttempted ? (
            <button
              disabled
              className="cyber-btn"
              style={{ width: '100%', padding: '0.65rem', opacity: 0.5, cursor: 'not-allowed' }}
            >
              {dailyData.todayResult?.victory ? '✓ SFIDA COMPLETATA PER OGGI' : '✗ TENTATIVO CONSUMATO (RITENTA DOMANI)'}
            </button>
          ) : (
            <button
              onClick={() => onLaunch(config)}
              className="cyber-btn cyber-btn-warning"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.88rem', fontWeight: '900' }}
            >
              AVVIA SFIDA (1 TENTATIVO • 0 CREDITI) ➔
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// MODALE REPORT GIORNALIERO ORE 00:00:01 (CONSEGNA PREMI & STREAK)
// ============================================================================
function DailyReportModal({
  reportData,
  onClaim
}) {
  if (!reportData) return null;

  const { placement, totalParticipants, tier, rewards, streakBonus, playerResult, streak } = reportData;

  const tierNames = {
    rank_1: '1° Posto nella Sfida 👑',
    rank_2_3: 'Podio Galattico 🥈🥉',
    top_1_pct: 'Top 1% Élite 🌟',
    top_10_pct: 'Top 10% Maestri ⭐',
    top_25_pct: 'Top 25% Esploratori',
    top_50_pct: 'Top 50% Sopravvissuti',
    base_win: 'Vittoria Standard'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 36000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.5rem', maxWidth: '440px', width: '100%', textAlign: 'center', border: '2px solid #facc15', boxShadow: '0 0 50px rgba(250, 204, 21, 0.65)' }}>
        
        <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: '900', letterSpacing: '1px' }}>
          REPORT SFIDA DEL GIORNO • CLASSIFICA DI LANCIO
        </div>
        <h2 style={{ color: '#fff', margin: '0.2rem 0 0.4rem 0', fontWeight: '900', fontSize: '1.3rem' }}>
          Risultati del {reportData.forDate}
        </h2>

        {/* Piazzamento & Fascia */}
        <div style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(15, 23, 42, 0.95))', border: '1.5px solid #facc15', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.85rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fde047' }}>
            Posizione #{placement} / {totalParticipants}
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>
            Fascia: {tierNames[tier] || 'Vittoria'}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '4px' }}>
            Prestazione: {playerResult?.turns} turni • {Math.round((playerResult?.timeElapsedMs || 0) / 1000)}s • HP {Math.round((playerResult?.remainingHpPct || 0) * 100)}%
          </div>
        </div>

        {/* Serie (Streak) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.85rem', fontSize: '0.85rem', fontWeight: '900', color: '#f97316' }}>
          <span>🔥 SERIE CONSECUTIVA: {streak} GIORNI!</span>
        </div>

        {/* Premi Accreditati */}
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: '900', marginBottom: '4px' }}>
            BOTTINO ACCREDITATO
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap', fontSize: '0.8rem', fontWeight: '900' }}>
            {rewards.dust > 0 && <span style={{ color: '#fef08a' }}>+{rewards.dust} 🌟</span>}
            {rewards.diamonds > 0 && <span style={{ color: '#f5d0fe' }}>+{rewards.diamonds} 💎</span>}
            {rewards.voidCrystals > 0 && <span style={{ color: '#00f2fe' }}>+{rewards.voidCrystals} 💠</span>}
            {rewards.primordialMatter > 0 && <span style={{ color: '#d946ef' }}>+{rewards.primordialMatter} 🟣</span>}
            {rewards.scannerSeconds > 0 && <span style={{ color: '#38bdf8' }}>+{rewards.scannerSeconds}s Scanner</span>}
          </div>

          {streakBonus && (
            <div style={{ marginTop: '6px', fontSize: '0.68rem', color: '#fde047', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '4px' }}>
              🎁 Traguardo Serie: {streakBonus.label} (+{streakBonus.dust} 🌟, +{streakBonus.diamonds} 💎)
            </div>
          )}
        </div>

           <button
          onClick={onClaim}
          className="cyber-btn cyber-btn-warning"
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '900' }}
        >
          RISCATTA E CONTINUA ➔
        </button>

      </div>
    </div>
  );
}

// ============================================================================
// WIDGET MONITORAGGIO CANTIERE DI SINTESI (2 SLOT INDIPENDENTI)
// ============================================================================
function ActiveForgeWidget({ queue = [], onRush, ether = 0 }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!queue || queue.length === 0) return null;

  const formatRemaining = (finishTime) => {
    const sec = Math.max(0, Math.floor((finishTime - Date.now()) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s` : `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div
      style={{
        width: 'calc(100% - 16px)',
        margin: '2px auto 4px auto',
        display: 'grid',
        gridTemplateColumns: queue.length > 1 ? 'repeat(2, 1fr)' : '1fr',
        gap: '6px',
        zIndex: 12
      }}
    >
      {queue.slice(0, 2).map((item) => {
        const canRush = ether >= item.etherRush;

        return (
          <div
            key={item.type + '_' + item.id}
            className="cyber-panel"
            style={{
              padding: '4px 6px',
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.5) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1.5px solid #c084fc',
              boxShadow: '0 0 10px rgba(192, 132, 252, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px'
            }}
          >
            <div style={{ textAlign: 'left', lineHeight: 1.1, minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.52rem', color: '#f0abfc', fontWeight: 900, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                 {item.name}  L.{item.targetLevel}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#facc15', fontWeight: 'bold' }}>
                {formatRemaining(item.finishTime)}
              </div>
            </div>

            <button
              disabled={!canRush}
              onClick={() => onRush(item)}
              className="cyber-btn cyber-btn-ether"
              style={{
                padding: '2px 5px',
                fontSize: '0.55rem',
                fontWeight: 900,
                flexShrink: 0,
                opacity: canRush ? 1 : 0.5
              }}
              title={`Salta tempo (${item.etherRush} Etere)`}
            >
               {item.etherRush} 
            </button>
          </div>
        );
      })}
    </div>
  );
}


// ============================================================================
// MODALE DEI 3 CONTRATTI TATTICI GIORNALIERI (CON PREMIO TRITTICO 3/3)
// ============================================================================
function DailyBountiesModal({
  bounties = [],
  allCompletedClaimed = false,
  onClaim,
  onClaimAllCompleted,
  onClose
}) {
  const completedCount = bounties.filter(b => b.completed).length;
  const allCompleted = bounties.length === 3 && bounties.every(b => b.completed);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '460px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '2px solid #38bdf8', boxShadow: '0 0 40px rgba(56, 189, 248, 0.45)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: '#facc15', fontWeight: '900', letterSpacing: '1px' }}>OBIETTIVI TATTICI (RESET 00:00)</div>
            <h3 style={{ color: '#38bdf8', margin: 0, fontWeight: '900', fontSize: '1.1rem' }}>
               Contratti del Giorno ({completedCount}/3)
            </h3>
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#f87171' }}>X</button>
        </div>

        {/* 1. I 3 CONTRATTI SINGOLI */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem', paddingRight: '0.2rem' }}>
          {bounties.map(bounty => {
            const isDone = bounty.completed;
            const isClaimed = bounty.claimed;
            const pct = Math.min(100, Math.round((bounty.progress / bounty.target) * 100));

            return (
              <div
                key={bounty.id}
                className="cyber-panel"
                style={{
                  padding: '0.7rem',
                  border: isClaimed ? '1px solid rgba(255,255,255,0.1)' : (isDone ? '1.5px solid #10b981' : '1px solid rgba(56, 189, 248, 0.3)'),
                  background: isClaimed ? 'rgba(15, 23, 42, 0.4)' : (isDone ? 'rgba(6, 78, 59, 0.35)' : 'rgba(15, 23, 42, 0.85)'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '900', color: isClaimed ? '#94a3b8' : (isDone ? '#34d399' : '#fff') }}>
                    {bounty.name}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: '900', color: isDone ? '#34d399' : '#facc15' }}>
                    {bounty.progress} / {bounty.target}
                  </span>
                </div>

                <div style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>{bounty.desc}</div>

                <div className="led-meter-bar" style={{ height: '5px', margin: '3px 0' }}>
                  <div className="led-meter-fill" style={{ width: `${pct}%`, background: isDone ? '#10b981' : '#38bdf8' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#fef08a', fontWeight: 'bold' }}>
                    +{bounty.reward.dust}  | +{bounty.reward.credits || 15}  | +{bounty.reward.xp} XP
                  </div>

                  <button
                    disabled={!isDone || isClaimed}
                    onClick={() => onClaim(bounty.id)}
                    className={`cyber-btn ${isDone && !isClaimed ? 'cyber-btn-success' : ''}`}
                    style={{ padding: '0.25rem 0.65rem', fontSize: '0.65rem', fontWeight: '900' }}
                  >
                    {isClaimed ? ' Riscossa' : (isDone ? 'RISCATTA' : 'In Corso')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. CASSA RIFORNIMENTO TRITTICO (3/3 COMPLETATI -> 2 DIAMANTI) */}
        <div
          style={{
            background: allCompleted 
              ? (allCompletedClaimed ? 'rgba(15, 23, 42, 0.6)' : 'linear-gradient(135deg, rgba(217, 70, 239, 0.25), rgba(15, 23, 42, 0.95))')
              : 'rgba(15, 23, 42, 0.5)',
            border: allCompleted 
              ? (allCompletedClaimed ? '1px solid rgba(255,255,255,0.15)' : '1.5px solid #d946ef')
              : '1px dashed rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '0.65rem 0.75rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: (allCompleted && !allCompletedClaimed) ? '0 0 20px rgba(217, 70, 239, 0.4)' : 'none'
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '900', color: allCompleted ? '#f5d0fe' : '#94a3b8' }}>
               CASSA TRITTICO ({completedCount}/3)
            </div>
            <div style={{ fontSize: '0.65rem', color: '#fde047', fontWeight: 'bold' }}>
              Premio: +2  Diamanti   +10s Scanner   +20 
            </div>
          </div>

          <button
            disabled={!allCompleted || allCompletedClaimed}
            onClick={onClaimAllCompleted}
            className={`cyber-btn ${allCompleted && !allCompletedClaimed ? 'cyber-btn-warning' : ''}`}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.72rem',
              fontWeight: '900',
              opacity: (allCompleted && !allCompletedClaimed) ? 1 : 0.4
            }}
          >
            {allCompletedClaimed ? ' Riscossa' : (allCompleted ? 'APRI CASSA ' : 'Bloccata')}
          </button>
        </div>

        <button className="cyber-btn" onClick={onClose} style={{ width: '100%', padding: '0.55rem' }}>
          Chiudi
        </button>
      </div>
    </div>
  );
}




function App() {
  // 1. STATI DI NAVIGAZIONE E PROFILO
    const [step, setStep] = useState('splash');
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('eclissi_lang');
    if (saved) return saved;
    if (typeof navigator !== 'undefined' && navigator.language && !navigator.language.startsWith('it')) {
      return 'en';
    }
    return 'it';
  });

  
  const [nickname, setNickname] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('eclissi_profile') || '{}');
      return p.nickname || '';
    } catch (_) { return ''; }
  });
  const [myPlayerId] = useState(() => {
    let id = localStorage.getItem('eclissi_player_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('eclissi_player_id', id);
    }
    return id;
  });
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('eclissi_level') || '1', 10));
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('eclissi_xp') || '0', 10));
  const [trophies, setTrophies] = useState(() => parseInt(localStorage.getItem('eclissi_trophies') || '0', 10));
  const [pvpWins, setPvpWins] = useState(() => parseInt(localStorage.getItem('eclissi_pvp_wins') || '0', 10));
  const [pvpLosses, setPvpLosses] = useState(() => parseInt(localStorage.getItem('eclissi_pvp_losses') || '0', 10));

  // 2. STATI PvP A DUE CANALI (CON CONTATORE 10/10 ÉLITE GIORNALIERO)
  const [selectedPvPChannel, setSelectedPvPChannel] = useState('training');
  const [selectedPvPMode, setSelectedPvPMode] = useState('classic');

  const [eliteMatchesPlayedToday, setEliteMatchesPlayedToday] = useState(() => {
    const savedDate = localStorage.getItem('eclissi_elite_matches_date');
    const todayStr = new Date().toDateString();
    if (savedDate !== todayStr) {
      localStorage.setItem('eclissi_elite_matches_date', todayStr);
      localStorage.setItem('eclissi_elite_matches_played', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('eclissi_elite_matches_played') || '0', 10);
  });
  const [showPvPChannelModal, setShowPvPChannelModal] = useState(false);
  const [pendingPvPConfirmation, setPendingPvPConfirmation] = useState(null);

  // 3. STATI RELIQUIE, VARCHI & OGGETTI EPICI (2 SLOT A LIV. 20 E LIV. 60)
  const [unlockedRelics, setUnlockedRelics] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_unlocked_relics') || '{}');
    } catch (_) { return {}; }
  });

  const [unlockedRifts, setUnlockedRifts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_unlocked_rifts') || '{}');
    } catch (_) { return {}; }
  });

  const [epicItemsInventory, setEpicItemsInventory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_epic_inventory') || '{}');
    } catch (_) { return {}; }
  });

  const [equippedEpicItems, setEquippedEpicItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_equipped_epic_items') || '[null, null]');
    } catch (_) { return [null, null]; }
  });

  const [voidCrystals, setVoidCrystals] = useState(() => parseInt(localStorage.getItem('eclissi_void_crystals') || '0', 10));
  const [primordialMatter, setPrimordialMatter] = useState(() => parseInt(localStorage.getItem('eclissi_primordial_matter') || '0', 10));
    const [tankLevel, setTankLevel] = useState(() => parseInt(localStorage.getItem('eclissi_tank_level') || '1', 10));
  const [socketingRelic, setSocketingRelic] = useState(null);


  // Dati dei combattimenti precedenti letti dai salvataggi storici.
  const [armoryV2] = useState(() => {
    try { return normalizePhase7Armory(JSON.parse(localStorage.getItem(ARMORY_V2_STORAGE_KEY) || 'null')); }
    catch (_) { return createPhase7Armory(); }
  });

  const [equippedWeapons] = useState(() => {
    try {
      const saved = localStorage.getItem('eclissi_equipped_weapons');
      return saved ? JSON.parse(saved) : ['wp_gatling', 'wp_xbow', 'wp_thunderstrike', 'wp_orbital_cannon'];
    } catch (_) {
      return ['wp_gatling', 'wp_xbow', 'wp_thunderstrike', 'wp_orbital_cannon'];
    }
  });

  const [weaponsLevels] = useState(() => {
    try {
      const saved = localStorage.getItem('eclissi_weapons_levels');
      return saved ? JSON.parse(saved) : { wp_gatling: 1, wp_xbow: 1, wp_thunderstrike: 1, wp_orbital_cannon: 1 };
    } catch (_) {
      return { wp_gatling: 1, wp_xbow: 1, wp_thunderstrike: 1, wp_orbital_cannon: 1 };
    }
  });


  // STATI MODALI ASSETTO & SHOP UNIFICATO
  const [showPersonalLoadout, setShowPersonalLoadout] = useState(false);
  const [showUnifiedShop, setShowUnifiedShop] = useState(false);
  const [unifiedShopDefaultTab, setUnifiedShopDefaultTab] = useState('decks');
  const [shopOpenedFromLoadout, setShopOpenedFromLoadout] = useState(false);



  // STATI SFIDA DEL GIORNO (DAILY CHALLENGE)
  const [dailyData, setDailyData] = useState(() => loadDailyChallengeData());
  const [dailyCountdown, setDailyCountdown] = useState('00:00:00');
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyReportData, setDailyReportData] = useState(null);

   // STATI CONTRATTI GIORNALIERI & CANTIERE DI SINTESI
  const [dailyBountiesState, setDailyBountiesState] = useState(() => initDailyBounties());
  const dailyBountiesStateRef = useRef(dailyBountiesState);
  useEffect(() => { dailyBountiesStateRef.current = dailyBountiesState; }, [dailyBountiesState]);
  const [showBountiesModal, setShowBountiesModal] = useState(false);

  const [forgeQueue, setForgeQueue] = useState(() => {
    try {
      return normalizeOfficialForgeQueue(
        JSON.parse(localStorage.getItem('eclissi_forge_queue') || '[]'));
    } catch (_) { return []; }
  });
  // L'inventario corrente e' quello della coda, non quello catturato da
  // un vecchio timer o da due click ravvicinati sul pulsante Etere.
  const forgeQueueRef=useRef(forgeQueue);
  forgeQueueRef.current=forgeQueue;

  useEffect(() => {
    localStorage.setItem('eclissi_daily_bounties', JSON.stringify(dailyBountiesState));
  }, [dailyBountiesState]);

  useEffect(() => {
    localStorage.setItem('eclissi_forge_queue', JSON.stringify(forgeQueue));
  }, [forgeQueue]);

   



  // Controllo Reset 00:00:01 & Loop Timer Mezzanotte Roma
  useEffect(() => {
    // 1. Controllo report pendente all'avvio
    const resetCheck = checkDailyResetAndReport();
    if (resetCheck.shouldShowReport && resetCheck.reportData) {
      setDailyReportData(resetCheck.reportData);
    }
    setDailyData(loadDailyChallengeData());

    // 2. Timer conto alla rovescia al secondo
    const updateTimer = () => {
      const ms = getMsUntilRomeMidnight();
      const totalSec = Math.max(0, Math.floor(ms / 1000));
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setDailyCountdown(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );

        // Reset istantaneo allo scoccare delle 00:00:00
      if (totalSec === 0) {
        const midnightCheck = checkDailyResetAndReport();
        if (midnightCheck.shouldShowReport && midnightCheck.reportData) {
          setDailyReportData(midnightCheck.reportData);
        }
        setDailyData(loadDailyChallengeData());
        setDailyBountiesState(initDailyBounties(true));
      }

    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // STATI STELLE CAMPAGNA & ROTTA DELLE 24 CAPSULE (MAX 360 â­)

  const [campaignStars, setCampaignStars] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_campaign_stars') || '{}');
    } catch (_) { return {}; }
  });

  const [claimedStarCapsules, setClaimedStarCapsules] = useState(() => {
    try {
      return migrateCampaignCapsuleClaims(JSON.parse(localStorage.getItem('eclissi_claimed_capsules') || '{}'));
    } catch (_) { return {}; }
  });

  const [showStarCapsulesModal, setShowStarCapsulesModal] = useState(false);

  // Calcolo cumulativo istantaneo di tutte le stelle conquistate nella campagna
  const totalCampaignStars = useMemo(() => getCampaignStarsTotal(campaignStars), [campaignStars]);


  // SCHEDA DI BRIEFING SETTORE AVVENTURA
  const [selectedSectorForBriefing, setSelectedSectorForBriefing] = useState(null);

    // Modali Pre-Partita Onboarding Liv. 9 e Liv. 10 rimossi: sblocco integrato in launchSectorBattle


  // 5. Inventari mazzi e progressione delle Carte Modulo giocate dal mazzo speciale
  const [abilities, setAbilities] = useState(() => {
    try {
      const saved = localStorage.getItem('eclissi_abilities');
      return saved ? JSON.parse(saved) : {};
    } catch (_) { return {}; }
  });

  // Blocca doppi click di acquisto fino al prossimo aggiornamento React.
  // Senza questo blocco due eventi immediati vedrebbero lo stesso saldo.
  const modulePurchaseLocks=useRef(new Set());
  useEffect(()=>{modulePurchaseLocks.current.clear();},[abilities,forgeQueue]);

    // STATI DEL SISTEMA PILOTI TATTICI (18 CARTE PILOTA AUTONOME)
  const [selectedPilot, setSelectedPilot] = useState(() => {
    // La selezione storica non sblocca un pilota in assenza del suo inventario.
    return initialSelectedPilot(localStorage.getItem('eclissi_selected_pilot'),
      localStorage.getItem('eclissi_pilot_inventory'));
  });
   const [pilotInventory, setPilotInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('eclissi_pilot_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pilot_starter_1 && !parsed.pilot_com_1) {
          parsed.pilot_com_1 = { level: parsed.pilot_starter_1.level || 1, unlocked: true };
          delete parsed.pilot_starter_1;
        }
        return parsed;
      }
      // Senza salvataggio inventario si possiede solo il pilota iniziale:
      // un ID precedentemente selezionato NON prova lo sblocco.
      return missingPilotInventory();
    } catch (_) {
      return { pilot_com_1: { level: 1, unlocked: true } };
    }
  });


    useEffect(() => {
    localStorage.setItem('eclissi_selected_pilot', selectedPilot);
  }, [selectedPilot]);


  useEffect(() => {
    localStorage.setItem('eclissi_pilot_inventory', JSON.stringify(pilotInventory));
  }, [pilotInventory]);


  const [selectedDeck, setSelectedDeck] = useState(() => {
    return localStorage.getItem('eclissi_selected_deck') || 'neutral_starter';
  });

    // Filtri rimossi: gestiti internamente da PersonalLoadoutModal e ShopModal



  // Inventario Mazzi con Livello di Risonanza (1â€“3 Singoli / 1â€“6 Doppi / 1â€“9 Tripli)
  const [deckInventory, setDeckInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('eclissi_deck_inventory');
      if (saved) return JSON.parse(saved);
      const legacyUnlocked = JSON.parse(localStorage.getItem('eclissi_unlocked_decks') || '{"neutral_starter":true}');
      const initialMap: Record<string, { level: number; unlocked: boolean }> = {};
      Object.keys(legacyUnlocked).forEach(dId => {
        initialMap[dId] = { level: 1, unlocked: true };
      });
      if (!initialMap.neutral_starter) initialMap.neutral_starter = { level: 1, unlocked: true };
      return initialMap;
    } catch (_) {
      return { neutral_starter: { level: 1, unlocked: true } };
    }
  });

  const [equippedEnvironment] = useState(() => localStorage.getItem('eclissi_env') || 'deep_space');

  // 6. RISORSE ED ECONOMIA
  const [stardust, setStardust] = useState(() => parseInt(localStorage.getItem('eclissi_stardust') || '100', 10));
    // STATO SERBATOIO SCANNER (CAP 60s, RESET 24H)
  const [scannerSeconds, setScannerSeconds] = useState(() => {
    const saved = parseInt(localStorage.getItem('eclissi_scanner_seconds') || '60', 10);
    const lastRefill = parseInt(localStorage.getItem('eclissi_last_scanner_refill') || '0', 10);

    if (Date.now() - lastRefill >= SCANNER_REFILL_INTERVAL_MS) {
      localStorage.setItem('eclissi_last_scanner_refill', Date.now().toString());
      localStorage.setItem('eclissi_scanner_seconds', '60');
      return 60;
    }
    return Math.min(SCANNER_TANK_MAX, Math.max(0, saved));
  });

  useEffect(() => {
    localStorage.setItem('eclissi_scanner_seconds', scannerSeconds.toString());
  }, [scannerSeconds]);

    // stardustSiloStored rimosso: l'overflow è calcolato dinamicamente tramite progressionEngine

  const [diamonds, setDiamonds] = useState(() => parseInt(localStorage.getItem('eclissi_diamonds') || '0', 10));
  const [lives, setLives] = useState(() => {
    const current = parseInt(localStorage.getItem('eclissi_lives') || '3', 10);
    const lvl = parseInt(localStorage.getItem('eclissi_level') || '1', 10);
    const maxL = typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(lvl) : 3;
    if (current >= maxL) return current;

    const lastStr = localStorage.getItem('eclissi_lastLifeUpdate');
    if (!lastStr) {
      localStorage.setItem('eclissi_lastLifeUpdate', Date.now().toString());
      return current;
    }

    const elapsed = Date.now() - parseInt(lastStr, 10);
    const recovered = Math.floor(elapsed / 28800000);
    if (recovered > 0) {
      const updated = Math.min(maxL, current + recovered);
      localStorage.setItem('eclissi_lastLifeUpdate', (Date.now() - (elapsed % 28800000)).toString());
      return updated;
    }
    return current;
  });

  // Loop di verifica e ripristino automatico delle Vite
  useEffect(() => {
    const maxL = typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(level) : 3;
    if (lives >= maxL) return;

    const interval = setInterval(() => {
      const lastStr = localStorage.getItem('eclissi_lastLifeUpdate');
      const last = lastStr ? parseInt(lastStr, 10) : Date.now();
      const elapsed = Date.now() - last;

      if (elapsed >= 28800000) {
        setLives(prev => {
          const next = Math.min(maxL, prev + 1);
          localStorage.setItem('eclissi_lastLifeUpdate', Date.now().toString());
          return next;
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [lives, level]);

  const [credits, setCredits] = useState(() => {
    const now=Date.now();
    const maxCredits=typeof INITIAL_PLAYER_CREDITS!=='undefined'?INITIAL_PLAYER_CREDITS:200;
    const rawCredits=localStorage.getItem('eclissi_credits');
    const rawTime=localStorage.getItem('eclissi_last_credit_time');
    const outcome=recoverOfficialCampaignCredits({
      credits:rawCredits===null?maxCredits:Number(rawCredits),
      lastMs:rawTime===null?now:Number(rawTime),nowMs:now,maxCredits
    });
    localStorage.setItem('eclissi_last_credit_time',String(outcome.lastMs));
    return outcome.credits;
  });
  const [creditTimerText, setCreditTimerText] = useState('MAX');

  // Ricarica crediti 1 ogni 3 minuti. Tutto il calcolo offline e online
  // usa la stessa funzione, senza saltare tick o generare saldi NaN.
  useEffect(() => {
    const maxCredits=typeof INITIAL_PLAYER_CREDITS!=='undefined'?INITIAL_PLAYER_CREDITS:200;
    const tick=()=>{
      const now=Date.now();
      const rawTime=localStorage.getItem('eclissi_last_credit_time');
      const result=recoverOfficialCampaignCredits({
        credits,lastMs:rawTime===null?now:Number(rawTime),
        nowMs:now,maxCredits
      });
      if(rawTime===null||Number(rawTime)!==result.lastMs)
        localStorage.setItem('eclissi_last_credit_time',String(result.lastMs));
      if(result.recovered>0)
        setCredits(prev=>prev>=maxCredits?prev:
          Math.min(maxCredits,prev+result.recovered));
      if(result.full){setCreditTimerText('MAX');return;}
      const secTotal=Math.ceil(result.remainingMs/1000);
      const m=Math.floor(secTotal/60),s=secTotal%60;
      setCreditTimerText(`${m}:${s<10?'0':''}${s}`);
    };
    tick();
    const interval=setInterval(tick,1000);
    return ()=>clearInterval(interval);
  }, [credits]);


  const [dailyBettingDiamondsEarned, setDailyBettingDiamondsEarned] = useState(() => {
    const savedDate = localStorage.getItem('eclissi_betting_diamond_date');
    const todayStr = new Date().toDateString();
    if (savedDate !== todayStr) {
      localStorage.setItem('eclissi_betting_diamond_date', todayStr);
      localStorage.setItem('eclissi_daily_betting_diamonds', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('eclissi_daily_betting_diamonds') || '0', 10);
  });

    const [ether, setEther] = useState(() => parseInt(localStorage.getItem('eclissi_ether') || '0', 10));
  const [extractorLevel, setExtractorLevel] = useState(() => parseInt(localStorage.getItem('eclissi_extractor_level') || '1', 10));
  const [extractorStored, setExtractorStored] = useState(() => {
    const stored = parseInt(localStorage.getItem('eclissi_extractor_stored') || '0', 10);
    const lastTime = parseInt(localStorage.getItem('eclissi_extractor_last_time') || Date.now().toString(), 10);
    const lvl = parseInt(localStorage.getItem('eclissi_extractor_level') || '1', 10);
    const cfg = typeof EXTRACTOR_LEVELS !== 'undefined' ? (EXTRACTOR_LEVELS[lvl] || EXTRACTOR_LEVELS[1]) : { intervalMs: 28800000, maxStore: 4 };
    const elapsed = Date.now() - lastTime;
    const gained = Math.floor(elapsed / cfg.intervalMs);
    return Math.min(cfg.maxStore, stored + gained);
  });
  const [extractorLastTime, setExtractorLastTime] = useState(() => parseInt(localStorage.getItem('eclissi_extractor_last_time') || Date.now().toString(), 10));

  // Loop passivo per l'accumulo temporale di Etere Cosmico
  useEffect(() => {
    const checkExtractor = () => {
      const cfg = typeof EXTRACTOR_LEVELS !== 'undefined' ? (EXTRACTOR_LEVELS[extractorLevel] || EXTRACTOR_LEVELS[1]) : { intervalMs: 28800000, maxStore: 4 };
      if (extractorStored >= cfg.maxStore) return;

      const now = Date.now();
      const elapsed = now - extractorLastTime;
      const units = Math.floor(elapsed / cfg.intervalMs);

      if (units > 0) {
        setExtractorStored(prev => Math.min(cfg.maxStore, prev + units));
        setExtractorLastTime(now - (elapsed % cfg.intervalMs));
      }
    };

    checkExtractor();
    const interval = setInterval(checkExtractor, 15000);
    return () => clearInterval(interval);
  }, [extractorLevel, extractorStored, extractorLastTime]);


  // MODALI & CLASSIFICA
  const [showProgression, setShowProgression] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isSearchingPvP, setIsSearchingPvP] = useState(false);
  const [pvpMeta, setPvpMeta] = useState(null);
  const [bgmMutedState, setBgmMutedState] = useState(() => localStorage.getItem('eclissi_muted_bgm') === 'true');
  const [sfxMutedState, setSfxMutedState] = useState(() => localStorage.getItem('eclissi_muted_sfx') === 'true');

  const [showRulesModal, setShowRulesModal] = useState(false);
  const [activeRuleDetail, setActiveRuleDetail] = useState(null);
  const [showExtractorModal, setShowExtractorModal] = useState(false);

  const [gameMode, setGameMode] = useState('adventure');
  const [bettingTier, setBettingTier] = useState(1);
  const [customBetAmount, setCustomBetAmount] = useState(250);
  const [bettingGameType, setBettingGameType] = useState('classic');
  const [activeAdventure, setActiveAdventure] = useState(null);
  const [popupMsg, setPopupMsg] = useState(null);
  const [pendingBetTier, setPendingBetTier] = useState(null);
  const [pendingBetConfirmation, setPendingBetConfirmation] = useState(null);

  const [battleSessionId, setBattleSessionId] = useState(0);
  const [maxUnlockedPlanet, setMaxUnlockedPlanet] = useState(() => parseInt(localStorage.getItem('eclissi_max_planet') || '1', 10));
  const [unlockedLevels, setUnlockedLevels] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eclissi_unlocked_levels') || '{"1":1}');
    } catch (_) {
      return { 1: 1 };
    }
  });
  const [expandedPlanet, setExpandedPlanet] = useState(null);

  // =========================================================================
  // CALCOLI DERIVATI & MEMO GLOBALI
  // =========================================================================
  const etherUnlockThreshold = typeof ETHER_UNLOCK_SECTOR !== 'undefined' ? ETHER_UNLOCK_SECTOR : 15;
  const pvpTrainingUnlockThreshold = typeof PVP_TRAINING_UNLOCK_SECTOR !== 'undefined' ? PVP_TRAINING_UNLOCK_SECTOR : 5;
  const pvpEliteUnlockThreshold = typeof PVP_ELITE_UNLOCK_SECTOR !== 'undefined' ? PVP_ELITE_UNLOCK_SECTOR : 81;
  const bettingUnlockThreshold = typeof BETTING_UNLOCK_ADVENTURE_SECTOR !== 'undefined' ? BETTING_UNLOCK_ADVENTURE_SECTOR : 11;
  const moduleUnlockThreshold = typeof ABILITY_MODULE_UNLOCK_CAMPAIGN_SECTOR !== 'undefined' ? ABILITY_MODULE_UNLOCK_CAMPAIGN_SECTOR : 9;
  const epic1LvlThreshold = typeof EPIC_SLOT_1_UNLOCK_LEVEL !== 'undefined' ? EPIC_SLOT_1_UNLOCK_LEVEL : 20;
  const epic2LvlThreshold = typeof EPIC_SLOT_2_UNLOCK_LEVEL !== 'undefined' ? EPIC_SLOT_2_UNLOCK_LEVEL : 60;
  const maxDailyEliteMatches = typeof PVP_ELITE_DAILY_MATCHES_CAP !== 'undefined' ? PVP_ELITE_DAILY_MATCHES_CAP : 10;
  const trainingEntryCost = typeof PVP_TRAINING_ENTRY_CREDITS !== 'undefined' ? PVP_TRAINING_ENTRY_CREDITS : 5;

  const currentGlobalAdventureSector = useMemo(() => {
    if (typeof calculateGlobalAdventureSector === 'function') {
      return calculateGlobalAdventureSector(maxUnlockedPlanet, unlockedLevels);
    }
    return getGlobalCampaignSector(maxUnlockedPlanet,unlockedLevels);
  }, [maxUnlockedPlanet, unlockedLevels]);

  // Slot Modulo Ibrido sbloccato rigorosamente al raggiungimento del Settore 9 di Terra


  const isEtherUnlocked = useMemo(() => {
    return currentGlobalAdventureSector > etherUnlockThreshold;
  }, [currentGlobalAdventureSector, etherUnlockThreshold]);

  const walletCap = useMemo(() => {
    return typeof getStardustWalletCap === 'function' ? getStardustWalletCap(level) : 1500;
  }, [level]);

  const tankConfig = useMemo(() => {
    if (typeof SUBSPACE_TANK_LEVELS !== 'undefined' && SUBSPACE_TANK_LEVELS[tankLevel]) {
      return SUBSPACE_TANK_LEVELS[tankLevel];
    }
    return { level: 1, name: 'Silo Subspaziale', maxVoid: 4, maxPrimordial: 2 };
  }, [tankLevel]);

  const maxPlayerHp = useMemo(() => {
    return typeof calculateUniversalPlayerHp === 'function' ? calculateUniversalPlayerHp(level) : 50;
  }, [level]);

  const t = useMemo(() => {
    if (typeof LANGUAGES !== 'undefined' && LANGUAGES[lang]) return LANGUAGES[lang];
    if (typeof LANGUAGES !== 'undefined' && LANGUAGES.it) return LANGUAGES.it;
    return { welcome: 'Benvenuto', start: 'Inizia', playSelected: 'Attacca', passTurn: 'Passa Turno', settingsTitle: 'Impostazioni', musicToggle: 'Musica', sfxToggle: 'Effetti', activeState: 'ATTIVO', disabledState: 'DISATTIVATO', langSelect: 'Lingua' };
  }, [lang]);

  const hasStabilizedRift1 = useMemo(() => Object.keys(unlockedRifts).length > 0, [unlockedRifts]);
  const hasTelluricRelic = useMemo(() => Boolean(unlockedRelics['relic_p1']), [unlockedRelics]);

  const currentDeckObj = useMemo(() => {
    if (typeof ALL_ABILITIES !== 'undefined') {
      return ALL_ABILITIES.find(c => c.id === selectedDeck) || ALL_ABILITIES.find(c => c.id === 'neutral_starter') || ALL_ABILITIES[0];
    }
    return { id: 'neutral_starter', name: 'Mazzo Neutro Cadetto', color: '#94a3b8', glow: 'rgba(148,163,184,0.5)' };
  }, [selectedDeck]);

  const currentPlanetName = useMemo(() => {
    const visiblePlanet = getVisibleCampaignPlanet(maxUnlockedPlanet);
    if (typeof realPlanetNames !== 'undefined' && realPlanetNames[visiblePlanet - 1]) {
      return realPlanetNames[visiblePlanet - 1];
    }
    return `Pianeta ${visiblePlanet}`;
  }, [maxUnlockedPlanet]);

  const currentPlanetLevel = (unlockedLevels && unlockedLevels[getVisibleCampaignPlanet(maxUnlockedPlanet)]) || 1;
  
  const currentPlanetZone = useMemo(() => {
    if (typeof PLANET_ZONE_NAMES !== 'undefined' && PLANET_ZONE_NAMES[getVisibleCampaignPlanet(maxUnlockedPlanet) - 1]) {
      return PLANET_ZONE_NAMES[getVisibleCampaignPlanet(maxUnlockedPlanet) - 1][currentPlanetLevel - 1] || `Settore ${currentPlanetLevel}`;
    }
    return `Settore ${currentPlanetLevel}`;
  }, [maxUnlockedPlanet, currentPlanetLevel]);

  const currentSectorMode = useMemo(() => {
    if (typeof getSectorGameType === 'function') {
      return getSectorGameType(getVisibleCampaignPlanet(maxUnlockedPlanet), Math.min(10, currentPlanetLevel));
    }
    return 'classic';
  }, [maxUnlockedPlanet, currentPlanetLevel]);

  const hasCompletedSector1 = useMemo(() => ((unlockedLevels?.[1] || 1) > 1) || (maxUnlockedPlanet > 1), [unlockedLevels, maxUnlockedPlanet]);

    // =========================================================================
  // CALLBACKS & HANDLERS
  // =========================================================================
  const triggerPopup = useCallback((msg) => {
    setPopupMsg(msg);
    setTimeout(() => setPopupMsg(null), 2500);
  }, []);

  // Una sola finalizzazione protegge tutti e quattro gli inventari da
  // regressioni: un progetto vecchio non riduce un livello gia' superiore.
  const finishOfficialForgeJob=useCallback((item)=>{
    const apply=prev=>applyOfficialForgeCompletion(prev,item);
    if(item.type==='deck')setDeckInventory(apply);
    else if(item.type==='ability')setAbilities(apply);
    else if(item.type==='epic')setEpicItemsInventory(apply);
  },[]);

  // TICKER AUTOMATICO CANTIERE CON CONTROLLO IMMEDIATO AL BOOT
  useEffect(() => {
    if(forgeQueue.length===0)return;
    const processCompleted=()=>{
      const now=Date.now(),current=forgeQueueRef.current;
      const completed=current.filter(item=>item.finishTime<=now);
      if(completed.length===0)return;
      // Prenota sincronicamente la rimozione: un intervallo ripetuto
      // (o React StrictMode) non puo' completare due volte lo stesso job.
      forgeQueueRef.current=current.filter(item=>item.finishTime>now);
      setForgeQueue(prev=>prev.filter(item=>
        !isOfficialForgeJobInQueue(completed,item)));
      completed.forEach(item=>{
        finishOfficialForgeJob(item);
        try{playSound('epic_item_trigger');}catch(_){}
        triggerPopup(`⚙️ CANTIERE COMPLETATO:\n${item.name} potenziato a Livello ${item.targetLevel}!`);
      });
    };
    processCompleted();
    const interval=setInterval(processCompleted,3000);
    return ()=>clearInterval(interval);
  },[forgeQueue,finishOfficialForgeJob,triggerPopup]);

  // ACCELERAZIONE TRAMITE ETERE: un vecchio pulsante o un doppio click
  // non puo' applicare due volte lo stesso progetto ne' spendere due volte.
  const forgeEtherRef=useRef(ether);
  forgeEtherRef.current=ether;
  const handleRushForge=useCallback(item=>{
    if(!isOfficialForgeJobInQueue(forgeQueueRef.current,item)){
      triggerPopup('Lavorazione non più disponibile: Cantiere già aggiornato.');
      return false;
    }
    const cost=item.etherRush;
    if(!Number.isSafeInteger(cost)||cost<0){
      triggerPopup('Costo Etere della lavorazione non valido.');
      return false;
    }
    const finished=item.finishTime<=Date.now();
    if(!finished&&forgeEtherRef.current<cost){
      try{playSound('deselect');}catch(_){}
      triggerPopup(`Etere insufficiente! Servono ${cost} 🔮 (Disponibile: ${forgeEtherRef.current}).`);
      return false;
    }
    // Rimuove subito l'identita' completa del job, prima di qualsiasi
    // aggiornamento asincrono React.
    forgeQueueRef.current=forgeQueueRef.current.filter(q=>
      !(q.type===item.type&&q.id===item.id&&
        q.targetLevel===item.targetLevel&&q.finishTime===item.finishTime));
    setForgeQueue(prev=>prev.filter(q=>
      !(q.type===item.type&&q.id===item.id&&
        q.targetLevel===item.targetLevel&&q.finishTime===item.finishTime)));
    if(!finished){
      forgeEtherRef.current-=cost;
      setEther(prev=>Math.max(0,prev-cost));
    }
    finishOfficialForgeJob(item);
    try{playSound('epic_item_trigger');}catch(_){}
    triggerPopup(finished?
      `⚙️ CANTIERE COMPLETATO:\n${item.name} potenziato a Livello ${item.targetLevel}!`:
      `⚡ ACCELERAZIONE COMPLETATA!\n${item.name} potenziato immediatamente a Livello ${item.targetLevel}!`);
    return true;
  },[finishOfficialForgeJob,triggerPopup]);


  const handlePvPMatchFound = useCallback((meta) => {
    setIsSearchingPvP(false);
    setPvpMeta(meta);
    setGameMode('pvp');
    setBattleSessionId(s => s + 1);
    setStep('game');
    // La partita IA è valida come duello di lancio, ma non è presentata come connessione umana.
    if (meta?.isGhostMatch) triggerPopup('Sfida simulata offline: affronti un avversario controllato dal gioco.');
  }, [triggerPopup]);

  const handlePvPCancel = useCallback(() => {
    setIsSearchingPvP(false);
    if (selectedPvPChannel === 'training') {
      setCredits(c => c + trainingEntryCost);
    } else {
      setEliteMatchesPlayedToday(p => Math.max(0, p - 1));
    }
    triggerPopup("Ricerca annullata. Rimborsato.");
  }, [selectedPvPChannel, trainingEntryCost, triggerPopup]);

      const addStardustSafe = useCallback((amount) => {
    setStardust(prev => {
      const maxVoid = tankConfig?.maxVoid || 4;
      const res = calculateStardustOverflow(prev, amount, walletCap, voidCrystals, maxVoid, hasStabilizedRift1);

      
      if (res.crystalsEarned > 0) {
        setVoidCrystals(res.newVoid);
        try { playSound('dust_extract'); } catch (_) {}
        triggerPopup(`🌟 Portafoglio pieno!\nL'eccedenza è stata condensata in +${res.crystalsEarned} Cristallo/i di Vuoto 💠!`);
      } else if (res.isCapped) {
        triggerPopup(`⚠️ Portafoglio al limite massimo (${walletCap} 🌟)!`);
      }
      return res.newDust;
    });
  }, [walletCap, voidCrystals, tankConfig, hasStabilizedRift1, triggerPopup]);



  const addVoidCrystalsSafe = useCallback((amount) => {
    if (!hasStabilizedRift1) return;
    setVoidCrystals(prev => {
      const next = prev + amount;
      if (next >= tankConfig.maxVoid) return tankConfig.maxVoid;
      return next;
    });
  }, [hasStabilizedRift1, tankConfig.maxVoid]);

  const addPrimordialMatterSafe = useCallback((amount) => {
    if (!hasStabilizedRift1) return;
    setPrimordialMatter(prev => {
      const next = prev + amount;
      if (next >= tankConfig.maxPrimordial) return tankConfig.maxPrimordial;
      return next;
    });
  }, [hasStabilizedRift1, tankConfig.maxPrimordial]);

  const addBettingDiamondsSafe = useCallback((amount) => {
    const dailyCap = typeof DAILY_BETTING_DIAMOND_CAP !== 'undefined' ? DAILY_BETTING_DIAMOND_CAP : 10;
    if (dailyBettingDiamondsEarned >= dailyCap) return 0;
    const canEarn = Math.min(amount, dailyCap - dailyBettingDiamondsEarned);
    if (canEarn > 0) {
      setDiamonds(d => d + canEarn);
      setDailyBettingDiamondsEarned(prev => {
        const next = prev + canEarn;
        localStorage.setItem('eclissi_daily_betting_diamonds', next.toString());
        return next;
      });
    }
    return canEarn;
  }, [dailyBettingDiamondsEarned]);

    const handleCollapseRift = useCallback((riftId, itemId) => {
    setUnlockedRifts(prev => ({ ...prev, [riftId]: true }));
    setEpicItemsInventory(prev => ({
      ...prev,
      [itemId]: { level: 1, unlocked: true }
    }));
    // Auto-equipaggia nello Slot 1 se vuoto, oppure nello Slot 2
    setEquippedEpicItems(prev => {
      if (!prev[0]) return [itemId, prev[1]];
      if (!prev[1] && prev[0] !== itemId) return [prev[0], itemId];
      return prev;
    });
    triggerPopup(`🌌 VARCO STABILIZZATO!\nManufatto Epico forgiato ed equipaggiato in Plancia!`);
  }, [triggerPopup]);


    const handleUpgradeEpicItem = useCallback((itemId, targetLevel, cost) => {
        if (forgeQueue.length >= 2) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Entrambi i 2 Slot del Cantiere sono occupati!");
      return;
    }
    if (forgeQueue.some(item => item.id === itemId && item.type === 'epic')) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Questo manufatto   gi  in lavorazione nel Cantiere!");
      return;
    }
    if (stardust < cost.dust || voidCrystals < cost.voidCrystals || primordialMatter < cost.primordialMatter) {
      triggerPopup("Risorse o minerali insufficienti per il potenziamento!");
      return;
    }
    const itemObj = typeof EPIC_ITEMS_DATABASE !== 'undefined' ? EPIC_ITEMS_DATABASE.find(e => e.id === itemId) : null;
    const forgeParams = getForgeParams('epic', targetLevel);

    try { playSound('ability'); } catch (_) {}
    setStardust(s => s - cost.dust);
    if (cost.voidCrystals > 0) setVoidCrystals(v => v - cost.voidCrystals);
    if (cost.primordialMatter > 0) setPrimordialMatter(p => p - cost.primordialMatter);

    setForgeQueue(prev => [...prev, {
      type: 'epic',
      id: itemId,
      name: itemObj?.name?.split(' ')[0] || 'Manufatto',
      targetLevel,
      finishTime: Date.now() + forgeParams.durationMs,
      etherRush: forgeParams.etherRush
    }]);
    triggerPopup(` FORGIATURA AVVIATA!\nManufatto ${itemObj?.name?.split(' ')[0] || ''} in sintesi (Slot ${forgeQueue.length + 1}/2). Pronto tra ${forgeParams.label}.`);

  }, [stardust, voidCrystals, primordialMatter, forgeQueue, triggerPopup]);


  const handleUpgradeSubspaceTank = useCallback((costDust, nextLevel) => {
    if (stardust < costDust) {
      triggerPopup("Polvere Stellare insufficiente!");
      return;
    }
    setStardust(s => s - costDust);
    setTankLevel(nextLevel);
    triggerPopup(`Serbatoio potenziato al Livello ${nextLevel}!`);
  }, [stardust, triggerPopup]);
    // Ricarica serbatoio scanner: 1 Diamante = +10 Secondi
    const handleBuyScannerRefill = useCallback(() => {
    if (scannerSeconds >= SCANNER_TANK_MAX) {
      triggerPopup("Il Serbatoio Scanner è già al massimo (60s)!");
      return;
    }
    if (diamonds < 1) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Ti serve 1 Diamante 💎 per acquistare 10 secondi di Scanner!");
      return;
    }
    try { playSound('ability'); } catch (_) {}
    setDiamonds(d => d - 1);
    setScannerSeconds(s => Math.min(SCANNER_TANK_MAX, s + SCANNER_DIAMOND_REFILL_RATE));
    triggerPopup("+10s Scanner aggiunti al serbatoio! (-1 💎)");
  }, [scannerSeconds, diamonds, triggerPopup]);


  // GESTORE AVVIO SFIDA DEL GIORNO IN SANDBOX ISOLATA
  const handleLaunchDailyChallenge = useCallback((cfg) => {
    const latest=loadDailyChallengeData();
    if(latest.hasAttemptedToday || cfg?.dateStr !== getRomeDateString()) {
      setDailyData(latest); return;
    }
    // 1. Blocco immediato anti-exploit
    const updated = {
      ...latest,
      hasAttemptedToday: true,
      lastCompletedDate: cfg.dateStr
    };
    saveDailyChallengeData(updated);
    setDailyData(updated);

    // 2. Imposta sandbox e avvia
    setShowDailyModal(false);
    setGameMode('daily_challenge');
    setPvpMeta(null);
    setActiveAdventure({
      planet: 7,
      level: 1,
      modifier: { id: 'standard', name: 'Sfida del Giorno', desc: `Regole del giorno: ${cfg.dateStr}` },
      aiPower: 0.85,
      dailyConfig: cfg
    });

    if (typeof playBGM === 'function') playBGM('boss');
    setBattleSessionId(s => s + 1);
    setStep('game');
  }, [dailyData]);

  // GESTORE RISCATTO REPORT GIORNALIERO (ORE 00:00:01)
  const handleClaimDailyReport = useCallback(() => {
    if (!dailyReportData) return;
    // Preleva una sola volta PRIMA dell'accredito: niente doppio riscatto da doppio tap.
    const claim = consumePendingDailyReward(dailyReportData.forDate);
    if (!claim) { setDailyReportData(null); return; }
    const { rewards, streakBonus } = claim.reward;

    try { playSound('epic_item_trigger'); } catch (_) {}

    // Accredito premi piazzamento
    if (rewards.dust > 0) addStardustSafe(rewards.dust);
    if (rewards.diamonds > 0) setDiamonds(d => d + rewards.diamonds);
    if (rewards.voidCrystals > 0) addVoidCrystalsSafe(rewards.voidCrystals);
    if (rewards.primordialMatter > 0) addPrimordialMatterSafe(rewards.primordialMatter);
    if (rewards.scannerSeconds > 0) setScannerSeconds(s => Math.min(SCANNER_TANK_MAX, s + rewards.scannerSeconds));

    // Accredito premi streak milestone
    if (streakBonus) {
      if (streakBonus.dust > 0) addStardustSafe(streakBonus.dust);
      if (streakBonus.diamonds > 0) setDiamonds(d => d + streakBonus.diamonds);
      if (streakBonus.voidCrystals > 0) addVoidCrystalsSafe(streakBonus.voidCrystals);
      if (streakBonus.primordialMatter > 0) addPrimordialMatterSafe(streakBonus.primordialMatter);
      if (streakBonus.scannerRefill) setScannerSeconds(SCANNER_TANK_MAX);
    }

    // Il report è già marcato come consumato nel salvataggio locale.
    setDailyData(claim.data);
    setDailyReportData(null);

    triggerPopup("Premi della Sfida del Giorno riscossi con successo!");
  }, [dailyReportData, addStardustSafe, addVoidCrystalsSafe, addPrimordialMatterSafe, triggerPopup]);


  // =========================================================================
  // GESTORE POTENZIAMENTO MAZZI (3, 6 E 9 LIVELLI CON GATING PILOTA)
  // =========================================================================
    // (handleEquipEntireSet rimosso: non referenziato)


  const handleUpgradeDeck = useCallback((deckId) => {

    const deckObj = typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES.find(a => a.id === deckId) : null;
    if (!deckObj || deckObj.id === 'neutral_starter') {
      triggerPopup("Il Mazzo Neutro Cadetto rimane fisso a Livello 1.");
      return;
    }

    const curData = deckInventory[deckId] || { level: 1, unlocked: false };
    if (!curData.unlocked) {
      triggerPopup("Devi prima sbloccare il mazzo!");
      return;
    }

    const curLvl = curData.level || 1;
    const maxDeckLevel = deckObj.maxLevel || 3;
    if (curLvl >= maxDeckLevel) {
      triggerPopup(`Mazzo giÃ  al Livello Massimo (${maxDeckLevel}/3/6/9)!`);
      return;
    }

    const nextLvl = curLvl + 1;
    const upgradeCostObj = deckObj.upgradeCosts?.[nextLvl];
    const reqPilotLevel = upgradeCostObj?.reqPilotLevel || getRequiredPilotLevelForUpgrade(nextLvl);

    if (level < reqPilotLevel) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`ðŸ”’ Richiede Pilota Livello ${reqPilotLevel} (Attuale: ${level})!`);
      return;
    }

        const costConfig = UNIFIED_UPGRADE_COSTS[nextLvl] || { dust: nextLvl * 500, voidCrystals: 0, primordialMatter: 0 };
    const dustCost = costConfig.dust;
    const voidCost = costConfig.voidCrystals || 0;
    const primCost = costConfig.primordialMatter || 0;

    if (stardust < dustCost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Polvere Stellare insufficiente! Servono ${dustCost} 🌟 (Hai: ${stardust}).`);
      return;
    }

    if (voidCrystals < voidCost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Cristalli di Vuoto insufficienti! Servono ${voidCost} ðŸ’  (Hai: ${voidCrystals}).`);
      return;
    }

    if (primordialMatter < primCost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Materia Primordiale insufficiente! Servono ${primCost} 🟣 (Hai: ${primordialMatter}).`);
      return;
    }

          if (forgeQueue.length >= 2) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Entrambi i 2 Slot del Cantiere sono occupati!");
      return;
    }
    if (forgeQueue.some(item => item.id === deckId && item.type === 'deck')) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Questo mazzo   gi  in lavorazione nel Cantiere!");
      return;
    }

    const forgeParams = getForgeParams('deck', nextLvl);

    try { playSound('ability'); } catch (_) {}
    setStardust(s => s - dustCost);
    if (voidCost > 0) setVoidCrystals(v => v - voidCost);
    if (primCost > 0) setPrimordialMatter(p => p - primCost);

    setForgeQueue(prev => [...prev, {
      type: 'deck',
      id: deckId,
      name: deckObj.name.split(' ')[0],
      targetLevel: nextLvl,
      finishTime: Date.now() + forgeParams.durationMs,
      etherRush: forgeParams.etherRush
    }]);

    triggerPopup(` FORGIATURA AVVIATA!\nMazzo ${deckObj.name.split(' ')[0]} in sintesi (Slot ${forgeQueue.length + 1}/2). Pronto tra ${forgeParams.label}.`);

  }, [deckInventory, level, stardust, voidCrystals, primordialMatter, forgeQueue, triggerPopup]);



    const launchSectorBattle = useCallback((planetNum, levelNum) => {
    const cost = (levelNum <= 5 ? 5 : (levelNum <= 9 ? 10 : 15));

    // Nessuna Carta Modulo o Mazzo Boss viene concessa entrando nel livello.
    // Lo sblocco del settore 9 avviene soltanto dopo VITTORIA confermata.
    // I mazzi numerici dei boss richiedono la vera vittoria e l'acquisto.

    if (credits < cost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Crediti insufficienti! Servono ${cost} Crediti âš¡.`);
      return;
    }

    try { playSound('click'); } catch (_) {}
    setCredits(c => c - cost);
    const modifier = typeof getPlanetLevelModifier === 'function' ? getPlanetLevelModifier(planetNum, levelNum) : null;
    const aiPower = typeof getAdventureAiPower === 'function' ? getAdventureAiPower(planetNum, levelNum) : 0.65;
    
    setSelectedSectorForBriefing(null);
    setGameMode('adventure');
    setPvpMeta(null);
    setActiveAdventure({ planet: planetNum, level: levelNum, modifier, aiPower });
    if (typeof playBGM === 'function') playBGM(levelNum === 10 ? 'boss' : 'battle');
        setBattleSessionId(s => s + 1);
    setStep('game');
  }, [abilities, deckInventory, credits, selectedPilot, triggerPopup]);


  const handleQuickResumeRadar = useCallback(() => {
    const curP = maxUnlockedPlanet || 1;
    const curL = (unlockedLevels && unlockedLevels[curP]) || 1;
    const targetLvl = Math.min(10, curL);
    try { playSound('click'); } catch (_) {}
    setSelectedSectorForBriefing({ planetNum: curP, levelNum: targetLvl });
  }, [maxUnlockedPlanet, unlockedLevels]);

  const unlockAbilityWithDust = useCallback((id) => {
    const ab = typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES.find(a => a.id === id) : null;
    if (!ab) return false;
    if(modulePurchaseLocks.current.size>0||
       officialModulePurchaseStage(abilities[id],'unlock',ab.maxLevel||3)!=='ok'){
      triggerPopup('Modulo già posseduto o acquisto in corso: nessun addebito.');
      return false;
    }
    const cost = ab.unlockCostDust || 150;

    if (ab.type === 'planet_char') {
      const isBossBeaten = typeof isPlanetBossDefeated === 'function' ? isPlanetBossDefeated(ab.planetNum, unlockedLevels, maxUnlockedPlanet) : true;
      if (!isBossBeaten) {
        try { playSound('deselect'); } catch (_) {}
        triggerPopup(`Devi prima sconfiggere il Boss al Settore 10 per abilitare questo modulo!`);
        return false;
      }
    }

    if (stardust < cost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Polvere Stellare insufficiente! Servono ${cost} Polvere 🌟.`);
      return false;
    }

    modulePurchaseLocks.current.add(id);
    try { playSound('ability'); } catch (_) {}
    setStardust(s => s - cost);
    setAbilities(prev => ({ ...prev, [id]: { unlocked: true, level: 1 } }));
    triggerPopup(`Modulo ${ab.name} sbloccato a Livello 1 ed equipaggiabile! (-${cost} 🌟)`);
    return true;
  }, [abilities, unlockedLevels, maxUnlockedPlanet, stardust, triggerPopup]);

  // POTENZIAMENTO MODULO ABILITÃ€ IBRIDO CON GATING PILOTA SUI 3 SCAGLIONI (1â€“9)
  const upgradeAbilityWithDust = useCallback((id) => {
    const ab = typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES.find(a => a.id === id) : null;
    if (!ab) return false;
    const current = abilities[id] || { level: 1, unlocked: false };
    const maxAbLevel = ab.maxLevel || 3;
    const gate=officialModulePurchaseStage(current,'upgrade',maxAbLevel);
    if(gate!=='ok'||modulePurchaseLocks.current.size>0){
      triggerPopup(gate==='not_owned'?
       'Devi prima sbloccare questo Modulo nel Bazar.':
       gate==='max_level'?'Modulo già al livello massimo.':
       'Potenziamento non consentito o già in lavorazione.');
      return false;
    }
    const nextLvl = current.level + 1;

    if (current.level >= maxAbLevel) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Livello massimo raggiunto per questo Modulo (${maxAbLevel})!`);
      return false;
    }

    const reqPilotLvl = getRequiredPilotLevelForUpgrade(nextLvl);
    if ((level || 1) < reqPilotLvl) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`ðŸ”’ Richiede Pilota Livello ${reqPilotLvl} (Fascia ${nextLvl >= 7 ? '3' : nextLvl >= 4 ? '2' : '1'})!`);
      return false;
    }

    const costConfig = UNIFIED_UPGRADE_COSTS[nextLvl] || { dust: nextLvl * 400, voidCrystals: 0, primordialMatter: 0 };
    const costDust = costConfig.dust;
    const costVoid = costConfig.voidCrystals || 0;
    const costPrim = costConfig.primordialMatter || 0;

    if (stardust < costDust) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Polvere Stellare insufficiente. Servono ${costDust} 🌟.`);
      return false;
    }
    if (voidCrystals < costVoid) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Cristalli di Vuoto insufficienti. Servono ${costVoid} ðŸ’ .`);
      return false;
    }
    if (primordialMatter < costPrim) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Materia Primordiale insufficiente. Servono ${costPrim} 🟣.`);
      return false;
    }

      if (forgeQueue.length >= 2) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Entrambi i 2 Slot del Cantiere sono occupati!");
      return false;
    }
    if (forgeQueue.some(item => item.id === id && item.type === 'ability')) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Questo modulo   gi  in lavorazione nel Cantiere!");
      return false;
    }

    const forgeParams = getForgeParams('ability', nextLvl);
    modulePurchaseLocks.current.add(id);

    try { playSound('ability'); } catch (_) {}
    setStardust(s => s - costDust);
    if (costVoid > 0) setVoidCrystals(v => v - costVoid);
    if (costPrim > 0) setPrimordialMatter(p => p - costPrim);

    setForgeQueue(prev => [...prev, {
      type: 'ability',
      id: id,
      name: ab.name.split(' ')[0],
      targetLevel: nextLvl,
      finishTime: Date.now() + forgeParams.durationMs,
      etherRush: forgeParams.etherRush
    }]);

    triggerPopup(` FORGIATURA AVVIATA!\nModulo ${ab.name.split(' ')[0]} in sintesi (Slot ${forgeQueue.length + 1}/2). Pronto tra ${forgeParams.label}.`);
    return true;

  }, [abilities, level, stardust, voidCrystals, primordialMatter, forgeQueue, triggerPopup]);



  const unlockDeck = useCallback((deckId) => {
    const deckObj = typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES.find(a => a.id === deckId) : null;
    if (!deckObj) return;

    const curData = deckInventory[deckId] || { level: 1, unlocked: false };

    if (curData.unlocked) {
      try { playSound('click'); } catch (_) {}
      setSelectedDeck(deckId);
      triggerPopup(`Mazzo ${deckObj.name} (Liv. ${curData.level}) selezionato!`);
      return;
    }

    if (deckObj.type === 'planet_char') {
      const isBossBeaten = typeof isPlanetBossDefeated === 'function' ? isPlanetBossDefeated(deckObj.planetNum, unlockedLevels, maxUnlockedPlanet) : true;
      if (!isBossBeaten) {
        try { playSound('deselect'); } catch (_) {}
        triggerPopup(`Devi prima sconfiggere il Boss al Settore 10 per abilitare questo mazzo!`);
        return;
      }
    }

    const diamondCost = deckObj.unlockCostDiamonds || (deckObj.tier === 3 ? 30 : (deckObj.tier === 2 ? 20 : 10));
    if (diamonds < diamondCost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Ti servono ${diamondCost} Diamanti per sbloccare questo mazzo!`);
      return;
    }

    try { playSound('ability'); } catch (_) {}
    setDiamonds(d => d - diamondCost);
    setDeckInventory(prev => {
      const updated = {
        ...prev,
        [deckId]: { level: 1, unlocked: true }
      };
      localStorage.setItem('eclissi_deck_inventory', JSON.stringify(updated));
      return updated;
    });
    setSelectedDeck(deckId);
    triggerPopup(`Mazzo ${deckObj.name} sbloccato a Livello 1 ed equipaggiato! (-${diamondCost} 💎)`);
  }, [deckInventory, unlockedLevels, maxUnlockedPlanet, diamonds, triggerPopup]);

  const handleBuyStorePackage = useCallback((pkg) => {
    const { type, amount, cost } = pkg;
    if (diamonds < cost) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Diamanti insufficienti! Servono ${cost} Diamanti 💎.`);
      return;
    }

    if (type === 'void_crystals') {
      if (voidCrystals + amount > tankConfig.maxVoid) {
        try { playSound('deselect'); } catch (_) {}
        triggerPopup(`Capienza Serbatoio superata! Potenzia prima il Silo.`);
        return;
      }
      setDiamonds(d => d - cost);
      addVoidCrystalsSafe(amount);
      triggerPopup(`+${amount} Cristalli di Vuoto ðŸ’  salvati nel serbatoio!`);
    } else if (type === 'primordial_matter') {
      if (primordialMatter + amount > tankConfig.maxPrimordial) {
        try { playSound('deselect'); } catch (_) {}
        triggerPopup(`Capienza Serbatoio superata! Potenzia prima il Silo.`);
        return;
      }
      setDiamonds(d => d - cost);
      addPrimordialMatterSafe(amount);
      triggerPopup(`+${amount} Materia Primordiale 🟣 salvata nel serbatoio!`);
    } else if (type === 'lives') {
      setDiamonds(d => d - cost);
      const maxL = typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(level) : 3;
      setLives(l => Math.min(maxL, l + amount));
      triggerPopup(`+${amount} Vite ripristinate con successo!`);
    } else if (type === 'credits') {
      setDiamonds(d => d - cost);
      setCredits(c => c + amount);
      triggerPopup(`+${amount} Crediti aggiunti al conto!`);
    } else if (type === 'stardust') {
      setDiamonds(d => d - cost);
      addStardustSafe(amount);
      triggerPopup(`+${amount} Polvere Stellare ottenuta!`);
    } else if (type === 'ether') {
      setDiamonds(d => d - cost);
      setEther(e => e + amount);
      triggerPopup(`+${amount} Etere Cosmico aggiunto!`);
    }
  }, [diamonds, voidCrystals, primordialMatter, tankConfig, level, addVoidCrystalsSafe, addPrimordialMatterSafe, addStardustSafe, triggerPopup]);

    const handleGameEnd = useCallback((winnerName, battleMeta: BattleResultMeta = {}) => {
    const isPlayerWin = (winnerName === nickname);

       // TRACCIAMENTO GLOBALE CONTRATTI (ATTIVO IN TUTTE LE MODALITÀ: CAMPAGNA, PVE, PVP)
    const stats = battleMeta?.matchStats;
    const currentBounties = dailyBountiesStateRef.current?.bounties;
    if (stats && currentBounties) {
      const completedNow = [];
      let changed = false;

      const updated = currentBounties.map(b => {

        if (b.completed) return b;
        // FASE 16H: contatori reali del Poker, nessun obiettivo legacy impossibile.
        const added = getPhase16HBountyProgress(b.type,stats);

        if (added > 0) {
          changed = true;
          const nextP = Math.min(b.target, b.progress + added);
          const isDone = nextP >= b.target;
          if (isDone) completedNow.push(b.name);
          return { ...b, progress: nextP, completed: isDone };
        }
        return b;
      });

      if (changed) {
        setDailyBountiesState(prev => ({ ...prev, bounties: updated }));
        if (completedNow.length > 0) {
          try { playSound('win'); } catch (_) {}
          triggerPopup(`🎯 CONTRATTO COMPLETATO:\n${completedNow.join(', ')}!`);
        }
      }
    }


    // GESTIONE COMPLETAMENTO SFIDA DEL GIORNO
    if (gameMode === 'daily_challenge') {

      const current = loadDailyChallengeData();
      if (isPlayerWin) {
        current.streak = (current.streak || 0) + 1;
        current.todayResult = {
          victory: true,
          turns: battleMeta.turnsElapsed || 4,
          timeElapsedMs: battleMeta.activeTimeElapsedMs || 32000,
          remainingHpPct: battleMeta.remainingHpPct || 0.65,
          timestamp: Date.now()
        };
        triggerPopup(`🏆 SFIDA DEL GIORNO VINTA!\nSerie: 🔥 ${current.streak} Giorni! Il piazzamento finale arriverà a mezzanotte.`);
      } else {
        current.streak = 0; // Hard reset streak su sconfitta
        current.todayResult = {
          victory: false,
          turns: 0,
          timeElapsedMs: 0,
          remainingHpPct: 0.0,
          timestamp: Date.now()
        };
        triggerPopup("✗ SCONFITTA NELLA SFIDA DEL GIORNO\nSerie azzerata a 0. Nessun recupero possibile.");
      }
      saveDailyChallengeData(current);
      setDailyData(current);
      return;
    }


       if (battleMeta.isDraw) {
      if (gameMode === 'pve') {
        const tier = typeof BETTING_LEVELS !== 'undefined' ? BETTING_LEVELS[bettingTier] : null;
        if (tier) {
          setCredits(c => c + tier.costCredits);
          if (tier.resource === 'stardust') addStardustSafe(customBetAmount);
          if (tier.resource === 'voidCrystals') addVoidCrystalsSafe(customBetAmount);
          if (tier.resource === 'primordialMatter') addPrimordialMatterSafe(customBetAmount);
          if (tier.resource === 'diamonds') setDiamonds(d => d + customBetAmount);
        }
      } else if (battleMeta.isPvP && battleMeta.pvpChannel === 'training') {
        setCredits(c => c + trainingEntryCost);
      }
      triggerPopup("PAREGGIO PER CARTE FINITE!\nNessun vincitore: crediti e risorse rimborsati.");
      return;
    }

    if (battleMeta.isPvP) {
      const isElite = battleMeta.pvpChannel === 'elite';
      const currentWeekKey = typeof getWeeklyLeaderboardKey === 'function' ? getWeeklyLeaderboardKey() : 'current_week';

      if (isPlayerWin) {
        const pvpWinCredits = typeof PVP_WIN_CREDITS !== 'undefined' ? PVP_WIN_CREDITS : 20;
        const pvpWinStardust = typeof PVP_WIN_STARDUST !== 'undefined' ? PVP_WIN_STARDUST : 45;
        const pvpWinXp = typeof PVP_WIN_XP !== 'undefined' ? PVP_WIN_XP : 80;

        const earnedTrophies = isElite ? (battleMeta.pvpTrophiesAwarded || 15) : 0;
        const earnedBonusDiamonds = isElite ? (battleMeta.pvpBonusDiamonds || 0) : 0;
        const newTrophies = trophies + earnedTrophies;
        const newWins = pvpWins + 1;

        if (isElite) {
          setTrophies(newTrophies);
          if (earnedBonusDiamonds > 0) setDiamonds(d => d + earnedBonusDiamonds);
        }
        setPvpWins(newWins);
        if (!isElite) setCredits(c => c + pvpWinCredits);
        addStardustSafe(pvpWinStardust);
        if (hasStabilizedRift1) addVoidCrystalsSafe(1);
        setXp(x => x + pvpWinXp);

        if (typeof db !== 'undefined' && db && isElite) {
          update(ref(db, `leaderboards/${currentWeekKey}/${myPlayerId}`), {
            nickname,
            deck: selectedDeck,
            level,
            trophies: newTrophies,
            wins: newWins,
            losses: pvpLosses,
            lastUpdated: Date.now()
          });
        }
      } else {
        const pvpLossTrophies = typeof PVP_LOSS_TROPHIES !== 'undefined' ? PVP_LOSS_TROPHIES : 10;
        const pvpLossStardust = typeof PVP_LOSS_STARDUST !== 'undefined' ? PVP_LOSS_STARDUST : 15;
        const pvpLossXp = typeof PVP_LOSS_XP !== 'undefined' ? PVP_LOSS_XP : 25;

        const lostTrophies = (isElite && trophies > 100) ? pvpLossTrophies : 0;
        const newTrophies = isElite 
          ? Math.max(100, trophies - lostTrophies) 
          : Math.max(0, trophies - lostTrophies);
        const newLosses = pvpLosses + 1;

        if (isElite) setTrophies(newTrophies);
        setPvpLosses(newLosses);
        addStardustSafe(pvpLossStardust);
        setXp(x => x + pvpLossXp);

        if (typeof db !== 'undefined' && db && isElite) {
          update(ref(db, `leaderboards/${currentWeekKey}/${myPlayerId}`), {
            nickname,
            deck: selectedDeck,
            level,
            trophies: newTrophies,
            wins: pvpWins,
            losses: newLosses,
            lastUpdated: Date.now()
          });
        }

        triggerPopup(`Partita terminata. Consolazione: +${pvpLossStardust} Polvere 🌟, +${pvpLossXp} XP`);
      }
      return;
    }


     if (isPlayerWin) {
      // Le reliquie si assegnano solo per un boss autentico riconosciuto
      // dal motore, in Campagna o Avventura. Nessun premio su settori falsi.
      if ((gameMode === 'adventure' || gameMode === 'campaign') &&
          battleMeta?.matchStats?.bossPlanetId != null) {
        const bossInfo = battleMeta.matchStats;
        const planetId = Number(bossInfo.bossPlanetId);
        const globalSector = Number(bossInfo.sectorNumber);
        const localSector = Number(bossInfo.bossSectorLevel);
        if (Number.isInteger(planetId) && planetId > 0 &&
            Number.isInteger(globalSector) && Number.isInteger(localSector)) {
          setUnlockedRelics(prev => applyVerifiedBossRelic(prev, {
            winner: 'player', mode: gameMode,
            sectorNumber: globalSector, bossPlanetId: planetId,
            bossSectorLevel: localSector
          }).relics);
        }
      }
      if (gameMode === 'adventure' && activeAdventure) {
                const planetNum = activeAdventure.planet;
        const levelNum = activeAdventure.level;
        const sectorKey = `P${planetNum}_L${levelNum}`;
        const newEarned = battleMeta?.starsEarned || [true, false, false];

        setCampaignStars(prev => {
          const prevStars = prev[sectorKey] || [false, false, false];
          const mergedStars = [
            prevStars[0] || newEarned[0],
            prevStars[1] || newEarned[1],
            prevStars[2] || newEarned[2]
          ];
          const updated = { ...prev, [sectorKey]: mergedStars };
          localStorage.setItem('eclissi_campaign_stars', JSON.stringify(updated));
          return updated;
        });


        // Terra S9: premio Modulo SOLO dopo la vittoria, mai al click
        // sul settore o dopo una sconfitta. Il Modulo va poi inserito
        // realmente nel mazzo da 24 speciali per produrre un effetto.
        const terraModule=terraNineModuleVictory({
          winner:'player',mode:gameMode,planetId:planetNum,sectorLevel:levelNum,
          selectedPilot,abilities
        });
        if(terraModule){
          setAbilities(prev => Object.values(prev as Record<string,{unlocked?:boolean}>).some(item=>item?.unlocked===true)
            ? prev : {...prev,[terraModule]:{unlocked:true,level:1}});
          // Il premio e' posseduto, NON equipaggiato come potere gratuito.
          triggerPopup('Settore Terra 9 completato: Carta Modulo '+terraModule+
            ' sbloccata. Equipaggiala nel mazzo speciale per usarla.');
        }

        const maxLvl = unlockedLevels?.[planetNum] || 1;
        const isReplay = levelNum < maxLvl;
        let reward = typeof getLevelReward === 'function' ? getLevelReward(planetNum, levelNum, isReplay) : { stardust: 50, diamonds: 0, xp: 40 };

        // Pilota boss, avanzamento di pianeta e premio doppio soltanto
        // se la vittoria e' il vero boss del settore canonico.
        const bossRelic = verifiedBossRelicReward({
          winner: 'player', mode: gameMode,
          sectorNumber: Number(battleMeta?.matchStats?.sectorNumber),
          bossPlanetId: Number(battleMeta?.matchStats?.bossPlanetId),
          bossSectorLevel: Number(battleMeta?.matchStats?.bossSectorLevel)
        });
        const isBossFight = levelNum === 10 && bossRelic === 'relic_p' + planetNum;
        const isFlawlessBossWin = isBossFight && !battleMeta.usedRevive;

        if (isFlawlessBossWin) {
          reward = {
            ...reward,
            stardust: reward.stardust * 2,
            diamonds: reward.diamonds * 2,
            xp: reward.xp * 2
          };
        }

        addStardustSafe(reward.stardust);
        if (reward.diamonds > 0) setDiamonds(d => d + reward.diamonds);
        setXp(x => x + reward.xp);

        if (isBossFight) {
          // La reliquia viene verificata e assegnata con il risultato
          // ufficiale sopra, non soltanto con il livello del menu.
          // SBLOCCO AUTOMATICO CARTA PILOTA BOSS (COSTO ZERO A GRADO 1)
          const bossPilotId = `pilot_boss_${planetNum}`;
          setPilotInventory(prev => {
            if (prev[bossPilotId]) return prev;
            return {
              ...prev,
              [bossPilotId]: { level: 1, unlocked: true }
            };
          });

          triggerPopup(` BOSS PIANETA ${planetNum} SCONFITTO!\nReliquia acquisita e Carta Pilota sbloccata nell'Hangar!`);

          const nextP = getNextCampaignPlanet(planetNum);
          if (nextP !== null) setMaxUnlockedPlanet(p => Math.max(p, nextP));
          setUnlockedLevels(prev => {
            const nextMap = { ...prev, [planetNum]: 11 };
            if (nextP !== null) {
              nextMap[nextP] = Math.max(prev?.[nextP] || 1, 1);
            }
            return nextMap;
          });
        } else {
          setUnlockedLevels(prev => ({
            ...prev,
            [planetNum]: Math.max(prev?.[planetNum] || 1, levelNum + 1)
          }));
        }

      } else if (gameMode === 'pve') {
        const tier = typeof BETTING_LEVELS !== 'undefined' ? BETTING_LEVELS[bettingTier] : null;
        if (tier) {
          const totalWon = customBetAmount * 2; // Raddoppio secco 2x
          setCredits(c => c + tier.costCredits); // Rimborso ticket

          if (tier.resource === 'stardust') {
            addStardustSafe(totalWon);
          } else if (tier.resource === 'voidCrystals') {
            addVoidCrystalsSafe(totalWon);
          } else if (tier.resource === 'primordialMatter') {
            addPrimordialMatterSafe(totalWon);
          } else if (tier.resource === 'diamonds') {
            // Restituisce la puntata e aggiunge il guadagno netto con il cap giornaliero
            setDiamonds(d => d + customBetAmount);
            addBettingDiamondsSafe(customBetAmount);
          }

          setXp(x => x + (tier.xp || 60));
          triggerPopup(` SCOMMESSA VINTA!\nIncassati ${totalWon} ${tier.unit} (Raddoppio 2x confermato!)`);
        }
      }

    } else {
      // PROTOCOLLO DATI DI TELEMETRIA SULLA SCONFITTA
      const telemetry = calculateTelemetryOnDefeat(battleMeta.turnsElapsed || 1, walletCap);
      setXp(x => x + telemetry.xpEarned);
      addStardustSafe(telemetry.dustEarned);
      triggerPopup(`Sconfitta Tattica.\nDati di Telemetria: +${telemetry.dustEarned} 🌟 Polvere | +${telemetry.xpEarned} XP Pilota!`);
    }

                  }, [nickname, trophies, pvpWins, pvpLosses, selectedDeck, selectedPilot, abilities, level, myPlayerId, hasStabilizedRift1, addStardustSafe, addVoidCrystalsSafe, addPrimordialMatterSafe, addBettingDiamondsSafe, gameMode, bettingTier, customBetAmount, activeAdventure, unlockedLevels, walletCap, triggerPopup]);

    const phase13SettlementGuard=useRef(createPhase13OnceGuard());
    const dailyPokerResultGuard=useRef(new Set());
    const handleDailyPokerComplete=useCallback((game,telemetry)=>{
      const cfg=activeAdventure?.dailyConfig;
      if(!cfg || cfg.mode!=='poker') return false;
      const guardKey=`daily_poker_${battleSessionId}_${cfg.dateStr}`;
      if(dailyPokerResultGuard.current.has(guardKey)) return false;
      let report;
      try { report=buildDailyPokerResult(cfg,game,telemetry); }
      catch(err){ triggerPopup(`Sfida non registrata: ${err.message}`);return false; }
      const data=loadDailyChallengeData();
      // Una vecchia battaglia conclusa dopo mezzanotte non può partecipare alla
      // classifica della giornata successiva.
      if(cfg.dateStr!==getRomeDateString() || data.lastCompletedDate!==cfg.dateStr || data.todayResult) {
        triggerPopup('Sfida già registrata o giornata terminata. Nessun doppio premio.');
        return false;
      }
      dailyPokerResultGuard.current.add(guardKey);
      data.todayResult=report;
      data.streak=report.victory?(data.streak||0)+1:0;
      saveDailyChallengeData(data);
      setDailyData(data);
      setStep('home');
      triggerPopup(report.victory?'Sfida Poker vinta! Risultato in classifica; premio dopo il reset giornaliero.':'Sfida Poker conclusa. Riprova domani.');
      return true;
    },[activeAdventure,battleSessionId,triggerPopup]);

    const handlePhase13CampaignComplete=useCallback((game,context,telemetry)=>{
      const challenge=getSectorSpecialChallenge(context.activeAdventure.planet,context.activeAdventure.level);
      const validation=validatePhase13Settlement(game,context,telemetry,challenge);
      if(!validation.ok){triggerPopup(`Risultato non registrato: ${validation.reason}`);return false;}
      const sessionKey=`phase13_${battleSessionId}_${context.activeAdventure.planet}_${context.activeAdventure.level}`;
      if(!phase13SettlementGuard.current.claim(sessionKey)) return false;
      // Un SOLO punto di accredito: non chiamare mai direttamente setXp / setStardust.
      handleGameEnd(validation.report.outcome==='player'?nickname:
        validation.report.outcome==='draw'?'DRAW_GAME':'Avversario',validation.meta);
      // FASE 16B: accredito una sola volta, vincolo alla guardia della sessione.
      // Le ricompense Dorate/Dado sono conteggiate dal motore con carte reali.
      const extra=game?.phase16B?.earnings;
      if(extra?.dust>0) addStardustSafe(Math.floor(extra.dust));
      if(extra?.diamonds>0) setDiamonds(n=>n+Math.floor(extra.diamonds));
      if(extra?.credits>0) setCredits(n=>n+Math.floor(extra.credits));
      setStep('adv');
      return true;
    },[battleSessionId,nickname,triggerPopup,handleGameEnd,addStardustSafe]);






  const handleNextAdventureLevel = useCallback(() => {
    const savedProfile = localStorage.getItem('eclissi_profile');
    if (!savedProfile) {
      setStep('welcome');
      return;
    }
    if (!activeAdventure) {
      setStep('adv');
      return;
    }
    const currentP = activeAdventure.planet || 1;
    const currentL = activeAdventure.level || 1;
    if (currentL >= 10) {
      setStep('adv');
      return;
    }
    const nextL = currentL + 1;
    setStep('adv');
    setSelectedSectorForBriefing({ planetNum: currentP, levelNum: nextL });
  }, [activeAdventure]);


  const handleHardResetData = useCallback(() => {
    if (typeof window !== 'undefined' && window.confirm("ATTENZIONE: Vuoi azzerare tutti i salvataggi e ripristinare il gioco allo stato iniziale? Tutti i progressi andranno persi.")) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  // GESTORE RISCATTO CAPSULE STELLARI (40 MILESTONE OGNI 15 â­)
  const handleClaimStarCapsule = useCallback((milestone) => {
    if (totalCampaignStars < milestone) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup(`Richiede ${milestone} Stelle! (Ne hai: ${totalCampaignStars})`);
      return;
    }
    if (claimedStarCapsules[milestone]) {
      try { playSound('deselect'); } catch (_) {}
      triggerPopup("Capsula giÃ  riscattata!");
      return;
    }

    const reward = getStarCapsuleReward(milestone);
    try { playSound('epic_item_trigger'); } catch (_) {}

    // Accredito risorse standard
    addStardustSafe(reward.dust);
    if (reward.diamonds > 0) setDiamonds(d => d + reward.diamonds);
    if (reward.ether > 0) setEther(e => e + reward.ether);
    if (reward.voidCrystals > 0) addVoidCrystalsSafe(reward.voidCrystals);
    if (reward.primordialMatter > 0) addPrimordialMatterSafe(reward.primordialMatter);

    if (reward.unlockItem) {
      const { id } = reward.unlockItem;
      setAbilities(prev => prev[id]?.unlocked === true ? prev : { ...prev, [id]: { level: 1, unlocked: true } });
    }

    setClaimedStarCapsules(prev => {
      const updated = { ...prev, [milestone]: true };
      localStorage.setItem('eclissi_claimed_capsules', JSON.stringify(updated));
      return updated;
    });

    triggerPopup(`🌟 CAPSULA ${milestone}â­ RISCATTATA!\n+${reward.dust}🌟 ${reward.diamonds > 0 ? `+${reward.diamonds}💎 ` : ''}${reward.unlockItem ? `\nðŸŽ‰ SBLOCCATO: ${reward.unlockItem.name}!` : ''}`);
  }, [totalCampaignStars, claimedStarCapsules, addStardustSafe, addVoidCrystalsSafe, addPrimordialMatterSafe, triggerPopup]);


    const handleStartBettingGame = useCallback((tierNum, amount, chosenGameType) => {
    const tier = typeof BETTING_LEVELS !== 'undefined' ? BETTING_LEVELS[tierNum] : null;
    if (!tier) return;

    const bet = Number(amount) || tier.minBet;

    if (credits < tier.costCredits) {
      triggerPopup(`Crediti insufficienti! Servono ${tier.costCredits} Crediti .`);
      return;
    }

    if (tier.resource === 'stardust' && stardust < bet) {
      triggerPopup(`Polvere insufficiente! Vuoi puntare ${bet}  ma ne possiedi ${stardust}.`);
      return;
    }
    if (tier.resource === 'voidCrystals' && voidCrystals < bet) {
      triggerPopup(`Cristalli insufficienti! Vuoi puntare ${bet}  ma ne possiedi ${voidCrystals}.`);
      return;
    }
    if (tier.resource === 'primordialMatter' && primordialMatter < bet) {
      triggerPopup(`Materia insufficiente! Vuoi puntare ${bet}  ma ne possiedi ${primordialMatter}.`);
      return;
    }
    if (tier.resource === 'diamonds' && diamonds < bet) {
      triggerPopup(`Diamanti insufficienti! Vuoi puntare ${bet}  ma ne possiedi ${diamonds}.`);
      return;
    }

    // Detrae la puntata e i crediti: se perdi la partita, l'importo   perso
    setCredits(c => c - tier.costCredits);
    if (tier.resource === 'stardust') setStardust(s => s - bet);
    if (tier.resource === 'voidCrystals') setVoidCrystals(v => v - bet);
    if (tier.resource === 'primordialMatter') setPrimordialMatter(p => p - bet);
    if (tier.resource === 'diamonds') setDiamonds(d => d - bet);

    setBettingTier(tierNum);
    setCustomBetAmount(bet);
    setBettingGameType(chosenGameType);
    setGameMode('pve');
    setPvpMeta(null);
    setPendingBetTier(null);
    setPendingBetConfirmation(null);
    setBattleSessionId(s => s + 1);
    setStep('game');
  }, [credits, stardust, voidCrystals, primordialMatter, diamonds, triggerPopup]);


  // =========================================================================
  // EFFETTI GLOBALI & SINCRONIZZAZIONE STORAGE
  // =========================================================================
  useEffect(() => {
    if (typeof playBGM === 'function') {
      if (['home', 'welcome', 'decks', 'abilities', 'environments', 'epic_items'].includes(step)) playBGM('menu');
      else if (step === 'adv') playBGM('adventure');
    }
  }, [step]);

  // Nessun popup invasivo al cambio schermata: navigazione libera ed esplorativa
  useEffect(() => {
    // La Home e i modali rimangono esplorabili senza interruzioni automatiche
  }, [step]);



    useEffect(() => {
    // Spotlight tour automatico disattivato per non bloccare l'ingresso in Home
  }, []);


  // CONTROLLO LEVEL UP PILOTA
  useEffect(() => {
    const neededXp = typeof getXpThresholdForLevel === 'function' ? getXpThresholdForLevel(level) : 120 + level * 50;
    const maxLvl = typeof MAX_PLAYER_LEVEL !== 'undefined' ? MAX_PLAYER_LEVEL : 100;
    if (xp >= neededXp && level < maxLvl) {
      setXp(prev => prev - neededXp);
      setLevel(prev => {
        const nextLvl = prev + 1;
        const rewards = typeof getLevelUpRewards === 'function' ? getLevelUpRewards(nextLvl) : { stardust: 100, diamonds: 1, lives: 0 };
        addStardustSafe(rewards.stardust);
        if (rewards.diamonds > 0) setDiamonds(d => d + rewards.diamonds);
        if (rewards.lives > 0) setLives(l => l + rewards.lives);

        const newHp = typeof calculateUniversalPlayerHp === 'function' ? calculateUniversalPlayerHp(nextLvl) : 50;
        triggerPopup(`ðŸŽ‰ LIVELLO PILOTA ${nextLvl} RAGGIUNTO!\n+${rewards.stardust} 🌟 | +${rewards.diamonds} 💎 | HP: ${newHp}`);
        return nextLvl;
      });
    }
  }, [xp, level, addStardustSafe, triggerPopup]);

  useEffect(() => { localStorage.setItem('eclissi_level', level.toString()); }, [level]);
  useEffect(() => { localStorage.setItem('eclissi_xp', xp.toString()); }, [xp]);
  useEffect(() => { localStorage.setItem('eclissi_trophies', trophies.toString()); }, [trophies]);
  useEffect(() => { localStorage.setItem('eclissi_pvp_wins', pvpWins.toString()); }, [pvpWins]);
  useEffect(() => { localStorage.setItem('eclissi_pvp_losses', pvpLosses.toString()); }, [pvpLosses]);
  useEffect(() => { localStorage.setItem('eclissi_elite_matches_played', eliteMatchesPlayedToday.toString()); }, [eliteMatchesPlayedToday]);
  useEffect(() => { localStorage.setItem('eclissi_abilities', JSON.stringify(abilities)); }, [abilities]);

  useEffect(() => { localStorage.setItem('eclissi_selected_deck', selectedDeck); }, [selectedDeck]);
  useEffect(() => { localStorage.setItem('eclissi_deck_inventory', JSON.stringify(deckInventory)); }, [deckInventory]);
  useEffect(() => { localStorage.setItem('eclissi_stardust', stardust.toString()); }, [stardust]);
    // (Rimossa persistenza ridondante del silo polvere)

  useEffect(() => { localStorage.setItem('eclissi_diamonds', diamonds.toString()); }, [diamonds]);
  useEffect(() => { localStorage.setItem('eclissi_lives', lives.toString()); }, [lives]);
  useEffect(() => { localStorage.setItem('eclissi_credits', credits.toString()); }, [credits]);
    // (Rimossa persistenza ridondante mini tut)

  useEffect(() => { localStorage.setItem('eclissi_ether', ether.toString()); }, [ether]);
  useEffect(() => { localStorage.setItem('eclissi_extractor_level', extractorLevel.toString()); }, [extractorLevel]);
  useEffect(() => { localStorage.setItem('eclissi_extractor_stored', extractorStored.toString()); }, [extractorStored]);
  useEffect(() => { localStorage.setItem('eclissi_extractor_last_time', extractorLastTime.toString()); }, [extractorLastTime]);
  useEffect(() => { localStorage.setItem('eclissi_max_planet', maxUnlockedPlanet.toString()); }, [maxUnlockedPlanet]);
  useEffect(() => { localStorage.setItem('eclissi_unlocked_levels', JSON.stringify(unlockedLevels)); }, [unlockedLevels]);
  useEffect(() => { localStorage.setItem('eclissi_muted_bgm', bgmMutedState.toString()); }, [bgmMutedState]);
  useEffect(() => { localStorage.setItem('eclissi_muted_sfx', sfxMutedState.toString()); }, [sfxMutedState]);
  useEffect(() => { localStorage.setItem('eclissi_unlocked_relics', JSON.stringify(unlockedRelics)); }, [unlockedRelics]);
  useEffect(() => { localStorage.setItem('eclissi_unlocked_rifts', JSON.stringify(unlockedRifts)); }, [unlockedRifts]);
  useEffect(() => { localStorage.setItem('eclissi_epic_inventory', JSON.stringify(epicItemsInventory)); }, [epicItemsInventory]);
  useEffect(() => { localStorage.setItem('eclissi_equipped_epic_items', JSON.stringify(equippedEpicItems)); }, [equippedEpicItems]);
  useEffect(() => { localStorage.setItem('eclissi_void_crystals', voidCrystals.toString()); }, [voidCrystals]);
  useEffect(() => { localStorage.setItem('eclissi_primordial_matter', primordialMatter.toString()); }, [primordialMatter]);
  useEffect(() => { localStorage.setItem('eclissi_tank_level', tankLevel.toString()); }, [tankLevel]);

    const extractorConfig = typeof EXTRACTOR_LEVELS !== 'undefined' && EXTRACTOR_LEVELS[extractorLevel] ? EXTRACTOR_LEVELS[extractorLevel] : { level: 1, name: 'Estrattore', maxStore: 4 };
  const nextExtractorConfig = typeof EXTRACTOR_LEVELS !== 'undefined' ? EXTRACTOR_LEVELS[extractorLevel + 1] : null;

    // --------------------------------------------------------------------------
  // 1. SCHERMATA SPLASH FLUIDA & COERENTE CON LA HOME (SENZA SCATOLE GRIGIE)
  // --------------------------------------------------------------------------
  if (step === 'splash') {
    const handleProceed = () => {
      try { playSound('click'); } catch (_) {}
      const savedProfile = localStorage.getItem('eclissi_profile');

      if (!savedProfile) {
        // Primo avvio: lancia subito Terra Settore 1
        setNickname('Cadetto');
        const modifier = typeof getPlanetLevelModifier === 'function' ? getPlanetLevelModifier(1, 1) : null;
        const aiPower = typeof getAdventureAiPower === 'function' ? getAdventureAiPower(1, 1) : 0.65;
        setGameMode('adventure');
        setPvpMeta(null);
        setActiveAdventure({ planet: 1, level: 1, modifier, aiPower });
        if (typeof playBGM === 'function') playBGM('battle');
        setBattleSessionId(s => s + 1);
        setStep('game');
      } else {
        try {
          const p = JSON.parse(savedProfile);
          setNickname(p.nickname || 'Pilota');
        } catch (_) {}
        setStep('home');
      }
    };

    return (
      <div 
        onClick={handleProceed}
        style={{ 
          width: '100vw', 
          height: '100dvh', 
          maxHeight: '100dvh', 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: 'clamp(14px, 3vmin, 28px) 16px', 
          boxSizing: 'border-box', 
          color: '#fff', 
          cursor: 'pointer' 
        }}
      >
        <DeepSpaceUniverseCanvas currentEnvironmentId={equippedEnvironment} />

        {/* I 4 VENTAGLI D'ANGOLO DEGLI ASSI (IDENTICI ALLA HOME) */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 30 }}>
          <CornerAceFan suitId="hearts" corner="nw" selectedDeck={selectedDeck} currentDeckObj={currentDeckObj} />
        </div>
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 30 }}>
          <CornerAceFan suitId="diamonds" corner="ne" selectedDeck={selectedDeck} currentDeckObj={currentDeckObj} />
        </div>
        <div style={{ position: 'absolute', bottom: '80px', left: '8px', zIndex: 30 }}>
          <CornerAceFan suitId="spades" corner="sw" selectedDeck={selectedDeck} currentDeckObj={currentDeckObj} />
        </div>
        <div style={{ position: 'absolute', bottom: '80px', right: '8px', zIndex: 30 }}>
          <CornerAceFan suitId="clubs" corner="se" selectedDeck={selectedDeck} currentDeckObj={currentDeckObj} />
        </div>

        {/* INTESTAZIONE SUPERIORE FLUTTUANTE */}
        <div style={{ textAlign: 'center', zIndex: 10, marginTop: 'clamp(4px, 1.5vmin, 16px)' }}>
          <div style={{ 
            fontSize: 'clamp(0.6rem, 1.4vmin, 0.75rem)', 
            color: '#facc15', 
            fontWeight: 900, 
            letterSpacing: '2.5px', 
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(250, 204, 21, 0.8)' 
          }}>
            ✦ COMBATTIMENTO MATEMATICO TATTICO ✦
          </div>
          <h1 style={{ 
            margin: '4px 0 0 0', 
            fontSize: 'clamp(1.6rem, 4.5vmin, 2.5rem)', 
            fontWeight: 900, 
            letterSpacing: '3px', 
            color: '#ffffff', 
            textShadow: '0 0 20px rgba(0, 242, 254, 0.9), 0 0 40px rgba(0, 242, 254, 0.5)' 
          }}>
            ECLISSI STELLARE
          </h1>
        </div>

        {/* VANO CENTRALE: FASCIO DI LUCE, CARTA FLUTTUANTE E VORTICE CINETICO */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: 'auto 0', 
          zIndex: 10 
        }}>
          <div className="trophy-beam" />

          {/* CARTA DEL MAZZO FLUTTUANTE (78x116 PX) */}
          <div className="hero-card-anim" style={{ zIndex: 2, width: 78, height: 116, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TacticalVisual
              id={selectedDeck}
              type="card_back"
              color={currentDeckObj?.color || '#38bdf8'}
              glowColor={currentDeckObj?.glow || 'rgba(56, 189, 248, 0.7)'}
              width={78}
              height={116}
            />
          </div>

          {/* VORTICE A 3 STRATI SINCRONIZZATO */}
          <div className="trophy-base-platform">
            <div className="trophy-base-ring">
              <div className="trophy-base-core" />
            </div>
          </div>

          <div style={{ 
            marginTop: '10px', 
            fontSize: 'clamp(0.65rem, 1.5vmin, 0.78rem)', 
            fontWeight: 800, 
            color: '#94a3b8', 
            letterSpacing: '1px' 
          }}>
            TOCCA OVUNQUE PER ENTRARE
          </div>
        </div>

        {/* PULSANTE CINETICO IN BASSO */}
        <div style={{ width: '100%', maxWidth: '360px', zIndex: 10, marginBottom: 'clamp(6px, 1.5vmin, 16px)' }}>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handleProceed(); }} 
            className="cyber-btn cyber-btn-primary" 
            style={{ 
              width: '100%', 
              padding: 'clamp(11px, 2.2vmin, 16px)', 
              fontSize: 'clamp(0.88rem, 2vmin, 1.05rem)', 
              fontWeight: 900,
              letterSpacing: '1.5px',
              boxShadow: '0 0 25px rgba(0, 242, 254, 0.7)'
            }}
          >
            ENTRA IN BATTAGLIA ➔
          </button>
        </div>

      </div>
    );
  }


  // --------------------------------------------------------------------------
  // 2. SELEZIONE LINGUA
  // --------------------------------------------------------------------------
  if (step === 'lang') {

    const isFirstAccess = !localStorage.getItem('eclissi_profile');

    const selectLanguage = (selectedLang) => {
      try { playSound('click'); } catch (_) {}
      setLang(selectedLang);
      localStorage.setItem('eclissi_lang', selectedLang);
      if (isFirstAccess) setStep('welcome');
      else setStep('home');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#fff', position: 'relative' }}>
        <DeepSpaceUniverseCanvas currentEnvironmentId={equippedEnvironment} />
        <div className="cyber-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '380px', width: '90%', position: 'relative', zIndex: 5, border: '1.5px solid #00f2fe', boxShadow: '0 0 30px rgba(0, 242, 254, 0.35)' }}>
          <h2 style={{ color: '#00f2fe', marginTop: 0, fontWeight: '900', textShadow: '0 0 10px rgba(0, 242, 254, 0.5)' }}>Seleziona Lingua</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 1rem 0' }}>Choose language / Scegli la lingua:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
            <button className="cyber-btn" onClick={() => selectLanguage('it')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡®ðŸ‡¹ Italiano</button>
            <button className="cyber-btn" onClick={() => selectLanguage('en')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡¬ðŸ‡§ English</button>
            <button className="cyber-btn" onClick={() => selectLanguage('de')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡©ðŸ‡ª Deutsch</button>
            <button className="cyber-btn" onClick={() => selectLanguage('es')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡ªðŸ‡¸ EspaÃ±ol</button>
            <button className="cyber-btn" onClick={() => selectLanguage('fr')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡«ðŸ‡· FranÃ§ais</button>
            <button className="cyber-btn" onClick={() => selectLanguage('zh')} style={{ padding: '0.75rem', fontSize: '0.82rem' }}>ðŸ‡¨ðŸ‡³ ä¸­æ–‡</button>
          </div>
          <button className="cyber-btn" onClick={() => setStep(isFirstAccess ? 'splash' : 'home')} style={{ width: '100%', marginTop: '1rem', padding: '0.5rem' }}>
            Indietro
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 3. REGISTRAZIONE LICENZA PILOTA & SCELTA STARTER (STILE FLUTTUANTE HOME)
  // --------------------------------------------------------------------------
  if (step === 'welcome') {
    const starterPilots = ['pilot_com_1', 'pilot_com_2', 'pilot_com_3', 'pilot_com_4'];
    const currentChosenPilot = selectedPilot || 'pilot_com_1';

    const handleRegister = (e) => {
      e.preventDefault();
      const finalName = nickname.trim() || 'Pilota Alpha';
      const chosenPilotId = currentChosenPilot;

      try { playSound('epic_item_trigger'); } catch (_) {}

      localStorage.setItem('eclissi_profile', JSON.stringify({ nickname: finalName }));
      localStorage.setItem('eclissi_selected_pilot', chosenPilotId);
      
      const newInventory = {
        [chosenPilotId]: { level: 1, unlocked: true }
      };
      localStorage.setItem('eclissi_pilot_inventory', JSON.stringify(newInventory));

      setNickname(finalName);
      setSelectedPilot(chosenPilotId);
      setPilotInventory(newInventory);
      setStep('home');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100dvh', maxHeight: '100dvh', color: '#ffffff', padding: 'clamp(12px, 2.5vmin, 24px) 16px', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
        <DeepSpaceUniverseCanvas currentEnvironmentId={equippedEnvironment} />
        
        {/* INTESTAZIONE OLOGRAFICA SOSPESA */}
        <div style={{ textAlign: 'center', zIndex: 10, flexShrink: 0, marginTop: 'clamp(4px, 1vmin, 10px)' }}>
          <div style={{ fontSize: 'clamp(0.6rem, 1.4vmin, 0.72rem)', color: '#facc15', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            ADDESTRAMENTO COMPLETATO 🏆
          </div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: 'clamp(1.4rem, 3.8vmin, 1.9rem)', fontWeight: 900, color: '#00f2fe', letterSpacing: '1.5px', textShadow: '0 0 18px rgba(0, 242, 254, 0.85)' }}>
            RILASCIO LICENZA
          </h1>
        </div>

        {/* INPUT NICKNAME LASER MINIMALE (SENZA SCATOLE) */}
        <div style={{ width: '100%', maxWidth: '320px', zIndex: 10, textAlign: 'center', flexShrink: 0 }}>
          <input 
            type="text" 
            required 
            placeholder="INSERISCI IL TUO NICKNAME..." 
            value={nickname === 'Cadetto' ? '' : nickname} 
            onChange={(e) => setNickname(e.target.value)} 
            style={{ 
              width: '100%', 
              padding: '6px 0', 
              background: 'transparent', 
              border: 'none', 
              borderBottom: '2px solid #00f2fe', 
              color: '#fff', 
              outline: 'none', 
              fontSize: 'clamp(0.95rem, 2.2vmin, 1.15rem)', 
              fontWeight: 900, 
              textAlign: 'center', 
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(0, 242, 254, 0.75)',
              boxShadow: '0 4px 12px -4px rgba(0, 242, 254, 0.5)'
            }} 
          />
          <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '6px', fontWeight: 700 }}>
            Tocca la carta per scegliere il tuo Pilota Starter gratuito:
          </div>
        </div>

        {/* LE 4 CARTE REALI SOSPESE SUL PIANO SPAZIALE */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, auto)', 
          gap: 'clamp(10px, 2.5vmin, 20px)', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 10,
          margin: 'auto 0'
        }}>
          {starterPilots.map((pilotId) => {
            const isSelected = currentChosenPilot === pilotId;
            return (
              <div
                key={pilotId}
                onClick={() => {
                  try { playSound('select'); } catch (_) {}
                  setSelectedPilot(pilotId);
                }}
                style={{
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.08)' : 'scale(0.94)',
                  transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.25s ease',
                  filter: isSelected ? 'drop-shadow(0 0 20px rgba(0, 242, 254, 0.95))' : 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85)) opacity(0.72)',
                  position: 'relative'
                }}
              >
                <PilotCard pilot={pilotId} compact={true} isEquipped={isSelected} />

                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#00f2fe',
                    color: '#020617',
                    fontSize: '0.52rem',
                    fontWeight: 900,
                    padding: '1px 8px',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px #00f2fe',
                    whiteSpace: 'nowrap'
                  }}>
                    ✓ ATTIVO
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PULSANTE CINETICO FLUTTUANTE */}
        <div style={{ width: '100%', maxWidth: '360px', zIndex: 10, flexShrink: 0, marginBottom: 'clamp(4px, 1vmin, 10px)' }}>
          <button 
            type="button" 
            onClick={handleRegister} 
            className="cyber-btn cyber-btn-primary" 
            style={{ 
              width: '100%', 
              padding: 'clamp(10px, 2vmin, 15px)', 
              fontSize: 'clamp(0.85rem, 2vmin, 1rem)', 
              fontWeight: 900, 
              letterSpacing: '1px' 
            }}
          >
            CONFERMA & ENTRA ALLA BASE ➔
          </button>
        </div>
      </div>
    );
  }




  // --------------------------------------------------------------------------
  // 4. VISTE MODULARI (AVVENTURA, MAZZI, ABILITÃ€ & SFONDI)
  // --------------------------------------------------------------------------
  // ============================================================================
  // ROTTA ORBITALE STELLARE (STILE FLUTTUANTE SENZA SCATOLE GRIGIE)
  // ============================================================================
  const renderAdventureView = () => {
    const activePlanetNum = getVisibleCampaignPlanet(expandedPlanet || maxUnlockedPlanet || 1);
    const activePlanetIdx = activePlanetNum - 1;
    const campaignPlanetPosition = getCampaignPlanetIndex(activePlanetNum);
    const activePlanetName = realPlanetNames?.[activePlanetIdx] || `Pianeta ${activePlanetNum}`;
    const maxLvlInActivePlanet = unlockedLevels?.[activePlanetNum] || 1;
    const pStats = getPlanetStarsStats(activePlanetNum, campaignStars);

    // Palette colore specifica per pianeta per immergere la vista
    const planetColors = [
      '#00f2fe', '#ef4444', '#f59e0b', '#ec4899', '#10b981',
      '#eab308', '#06b6d4', '#3b82f6', '#64748b', '#d97706',
      '#0284c7', '#6366f1', '#14b8a6', '#f43f5e', '#d946ef',
      '#0ea5e9', '#84cc16', '#f97316', '#dc2626', '#38bdf8'
    ];
    const curPlanetThemeColor = planetColors[activePlanetIdx] || '#00f2fe';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', maxHeight: '100dvh', justifyContent: 'space-between', padding: 'clamp(6px, 1.2vmin, 14px) clamp(8px, 2vmin, 16px)', boxSizing: 'border-box', position: 'relative', zIndex: 10, overflow: 'hidden' }}>
        
        {/* BARRA SUPERIORE FLUTTUANTE: TITOLO + STATS + CRIPTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexShrink: 0, zIndex: 10 }}>
          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div style={{ fontSize: 'clamp(0.55rem, 1.2vmin, 0.65rem)', color: '#facc15', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              CAMPAGNA • 120 SETTORI
            </div>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 2.8vmin, 1.5rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '0.8px', textShadow: '0 0 14px rgba(0, 242, 254, 0.7)' }}>
              ROTTA ORBITALE
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => {
                try { playSound('click'); } catch (_) {}
                setStep('epic_items');
              }}
              className="cyber-btn"
              style={{ padding: '5px 8px', fontSize: 'clamp(0.6rem, 1.3vmin, 0.72rem)', fontWeight: 900, borderColor: '#fde047', color: '#fde047' }}
              title="Apri Cripta dei Manufatti"
            >
              🌌 Cripta
            </button>

            <button
              onClick={() => {
                try { playSound('click'); } catch (_) {}
                setShowStarCapsulesModal(true);
              }}
              className="cyber-btn cyber-btn-warning"
              style={{ padding: '5px 9px', fontSize: 'clamp(0.6rem, 1.3vmin, 0.72rem)', fontWeight: 900 }}
              title="Rotta delle 24 Capsule"
            >
              ⭐ {totalCampaignStars}/{PHASE16A_MAX_STARS}
            </button>

            <button 
              className="cyber-btn" 
              onClick={() => setStep('home')} 
              style={{ padding: '5px 10px', fontSize: 'clamp(0.62rem, 1.3vmin, 0.75rem)' }}
            >
              Base
            </button>
          </div>
        </div>

        {/* NOTIFICA OLOGRAFICA SBLOCCHI AL SETTORE 11+ (SCOMMESSE & PVP) */}
        {currentGlobalAdventureSector >= 11 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 10px',
            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.2) 0%, rgba(2, 6, 23, 0.6) 100%)',
            borderLeft: '2px solid #facc15',
            borderRadius: '4px',
            width: '100%',
            maxWidth: '440px',
            margin: '2px auto 0 auto',
            flexShrink: 0,
            zIndex: 10
          }}>
            <div style={{ fontSize: 'clamp(0.55rem, 1.2vmin, 0.65rem)', color: '#fef08a', fontWeight: 800 }}>
              ✦ CIRCUITI APERTI: BANCO SCOMMESSE (2X) • DUELLI 1v1
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setPendingBetTier(1)}
                className="cyber-btn cyber-btn-warning"
                style={{ padding: '2px 6px', fontSize: '0.52rem', fontWeight: 900 }}
              >
                Banco ➔
              </button>
              <button
                onClick={() => setShowPvPChannelModal(true)}
                className="cyber-btn cyber-btn-ether"
                style={{ padding: '2px 6px', fontSize: '0.52rem', fontWeight: 900 }}
              >
                PvP ➔
              </button>
            </div>
          </div>
        )}

        {/* CAROSELLO SELETTORE PIANETI FLUTTUANTE */}
        <div style={{ width: '100%', flexShrink: 0, zIndex: 10, margin: '4px 0' }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '4px 2px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {PHASE16A_CAMPAIGN_PLANETS.map((planet, pIdx) => {
              const pNum = planet.id;
              const isUnlocked = pNum <= (maxUnlockedPlanet || 1);
              const isCurrent = pNum === activePlanetNum;
              const pName = planet.name;
              const pColor = planetColors[pNum - 1] || '#00f2fe';

              return (
                <div
                  key={pNum}
                  onClick={() => {
                    if (!isUnlocked) {
                      try { playSound('deselect'); } catch (_) {}
                      triggerPopup(`Sconfiggi il Boss del pianeta precedente per raggiungere ${pName}!`);
                      return;
                    }
                    try { playSound('click'); } catch (_) {}
                    setExpandedPlanet(pNum);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isCurrent ? 1 : (isUnlocked ? 0.65 : 0.3),
                    transform: isCurrent ? 'scale(1.08)' : 'scale(0.92)',
                    transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    flexShrink: 0,
                    minWidth: '60px'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isCurrent ? `radial-gradient(circle, ${pColor}55 0%, rgba(2,6,23,0.95) 75%)` : 'rgba(15, 23, 42, 0.8)',
                    border: isCurrent ? `2px solid ${pColor}` : '1.5px solid rgba(255,255,255,0.15)',
                    boxShadow: isCurrent ? `0 0 16px ${pColor}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    <RelicVisual relicId={`relic_p${pNum}`} size={22} />
                    {!isUnlocked && (
                      <span style={{ position: 'absolute', fontSize: '0.65rem' }}>🔒</span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.58rem', fontWeight: 900, color: isCurrent ? pColor : '#cbd5e1', whiteSpace: 'nowrap' }}>
                    {pName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STADIO ORBITALE DEL PIANETA ATTIVO (IL CUORE DELLA MAPPA) */}
        <div style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 0,
          zIndex: 10,
          position: 'relative'
        }}>
          {/* Titolo Pianeta Fluttuante & Dominio */}
          <div style={{ textAlign: 'center', lineHeight: 1.15, marginTop: '2px' }}>
            <span style={{ fontSize: 'clamp(0.6rem, 1.3vmin, 0.72rem)', color: curPlanetThemeColor, fontWeight: 900, letterSpacing: '1px' }}>
              PIANETA {String(campaignPlanetPosition).padStart(2, "0")} • {activePlanetName.toUpperCase()}
            </span>
            <div style={{ fontSize: 'clamp(0.55rem, 1.2vmin, 0.65rem)', color: pStats.isMastered ? '#fde047' : '#94a3b8', fontWeight: 700 }}>
              {pStats.earned}/30 ⭐ {pStats.isMastered ? '👑 DOMINIO PERFETTO' : `(Progresso: ${Math.min(10, maxLvlInActivePlanet)}/10 Settori)`}
            </div>
          </div>

          {/* I 10 NODI ORBITALI SOSPESI NEL VUOTO (2 COLONNE DA 5 O GRIGLIA FLUIDA) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 'clamp(6px, 1.4vmin, 12px) clamp(4px, 1.2vmin, 10px)',
            width: '100%',
            maxWidth: '440px',
            margin: 'auto 0',
            padding: '4px 0',
            boxSizing: 'border-box'
          }}>
            {Array.from({ length: 10 }).map((_, lIdx) => {
              const levelNum = lIdx + 1;
              const isLevelUnlocked = levelNum <= maxLvlInActivePlanet;
              const isCurrentTarget = levelNum === maxLvlInActivePlanet;
              const isBoss = levelNum === 10;
              const cost = (levelNum <= 5 ? 5 : (levelNum <= 9 ? 10 : 15));
              const sStars = getSectorStars(activePlanetNum, levelNum, campaignStars);
              const starsCount = sStars.filter(Boolean).length;

              return (
                <div
                  key={levelNum}
                  onClick={() => {
                    if (!isLevelUnlocked) {
                      try { playSound('deselect'); } catch (_) {}
                      triggerPopup("Devi completare i settori precedenti per sbloccare questa rotta!");
                      return;
                    }
                    try { playSound('click'); } catch (_) {}
                    setSelectedSectorForBriefing({ planetNum: activePlanetNum, levelNum });
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: 'clamp(58px, 11vmin, 76px)',
                    padding: '4px 2px',
                    borderRadius: '8px',
                    cursor: isLevelUnlocked ? 'pointer' : 'not-allowed',
                    background: isBoss
                      ? (isCurrentTarget ? 'radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(2, 6, 23, 0.95) 75%)' : 'rgba(69, 10, 10, 0.6)')
                      : (isCurrentTarget 
                          ? `radial-gradient(circle, ${curPlanetThemeColor}35 0%, rgba(2, 6, 23, 0.9) 75%)` 
                          : (isLevelUnlocked ? 'rgba(15, 23, 42, 0.75)' : 'rgba(2, 6, 23, 0.4)')),
                    border: isBoss 
                      ? (isCurrentTarget ? '2px solid #ef4444' : '1.5px solid rgba(239, 68, 68, 0.5)')
                      : (isCurrentTarget 
                          ? `2px solid ${curPlanetThemeColor}` 
                          : (isLevelUnlocked ? '1px solid rgba(255,255,255,0.18)' : '1px dashed rgba(255,255,255,0.08)')),
                    boxShadow: isCurrentTarget 
                      ? (isBoss ? '0 0 20px rgba(239, 68, 68, 0.85)' : `0 0 16px ${curPlanetThemeColor}`) 
                      : 'none',
                    transform: isCurrentTarget ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    opacity: isLevelUnlocked ? 1 : 0.4,
                    position: 'relative',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Nodo Numero Settore o Icona Corona Boss */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                    <span style={{
                      fontSize: isBoss ? 'clamp(0.75rem, 1.6vmin, 0.9rem)' : 'clamp(0.65rem, 1.4vmin, 0.78rem)',
                      fontWeight: 900,
                      color: isBoss ? '#fca5a5' : (isCurrentTarget ? curPlanetThemeColor : '#ffffff')
                    }}>
                      {isBoss ? '👑 TITANO' : `S.${levelNum}`}
                    </span>
                    <span style={{ fontSize: '0.48rem', color: '#facc15', fontWeight: 800, marginTop: '1px' }}>
                      {cost}⚡
                    </span>
                  </div>

                  {/* Le 3 Stelle Conquistate */}
                  <div style={{ display: 'flex', gap: '1px', justifyContent: 'center' }}>
                    {[0, 1, 2].map(sIdx => (
                      <span key={sIdx} style={{
                        fontSize: 'clamp(0.55rem, 1.1vmin, 0.65rem)',
                        color: sStars[sIdx] ? '#facc15' : 'rgba(255,255,255,0.18)',
                        lineHeight: 1,
                        filter: sStars[sIdx] ? 'drop-shadow(0 0 3px #facc15)' : 'none'
                      }}>
                        ★
                      </span>
                    ))}
                  </div>

                  {/* Particella di Rotta Attiva */}
                  {isCurrentTarget && (
                    <div style={{
                      position: 'absolute',
                      top: '-3px',
                      right: '-3px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: isBoss ? '#ef4444' : curPlanetThemeColor,
                      boxShadow: `0 0 8px ${isBoss ? '#ef4444' : curPlanetThemeColor}`,
                      animation: 'coreStellarPulse 1.5s infinite alternate ease-in-out'
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Prompt Rapido Tattico Inferiore */}
          <div style={{
            fontSize: 'clamp(0.6rem, 1.3vmin, 0.72rem)',
            color: '#cbd5e1',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: '4px'
          }}>
            Tocca un settore per visualizzare il briefing tattico ed entrare in combattimento.
          </div>
        </div>

      </div>
    );
  };


   // (renderDecksView rimosso: integrato in CardsCollectionModal)


  // (renderAbilitiesView e renderEnvironmentsView rimossi: integrati in PersonalLoadoutModal e ShopModal)


  const remainingEliteMatches = Math.max(0, maxDailyEliteMatches - eliteMatchesPlayedToday);


  // --------------------------------------------------------------------------
  // 5. RENDER PRINCIPALE APP & SCHERMATE DI GIOCO
  // --------------------------------------------------------------------------
  return (
    <div className="app-viewport-916">
      {step !== 'game' && <DeepSpaceUniverseCanvas currentEnvironmentId={equippedEnvironment} />}


                {/* Header Risorse Compatto Superiore */}
      {step !== 'game' && (
        <ResourceHeader
          nickname={nickname}
          level={level}
          xp={xp}
          trophies={trophies}
          diamonds={diamonds}
          lives={lives}
          credits={credits}
          creditTimerText={creditTimerText}
          setShowProgression={setShowProgression}
          onOpenStore={() => {
            try { playSound('click'); } catch (_) {}
            setShowStoreModal(true);
          }}
          onOpenLeaderboard={() => {
            try { playSound('click'); } catch (_) {}
            setShowLeaderboardModal(true);
          }}
          onOpenSettings={() => {
            try { playSound('click'); } catch (_) {}
            setShowSettingsModal(true);
          }}
        />
      )}


      {/* Widget Monitoraggio Cantiere a 2 Slot Attivi in Home */}
      {step === 'home' && forgeQueue.length > 0 && (
        <ActiveForgeWidget
          queue={forgeQueue}
          onRush={handleRushForge}
          ether={ether}
        />
      )}


                 {/* VISTE PRINCIPALI */}
                 {/* DUELLO MATEMATICO: sostituisce solo la schermata di combattimento. Tutti i menu R12 rimangono originali. */}
      {step === 'game' && (
        <MathDuelBattle
          key={`math_battle_${battleSessionId}`}
          nickname={nickname}
          gameMode={gameMode}
          selectedBossDeck={selectedDeck}
          bossDeckInventory={deckInventory}
          selectedPilot={getPilotById(selectedPilot)?selectedPilot:null}
          pilotInventory={pilotInventory}
          commanderDisplayName={getPilotById(selectedPilot)?.name || ''}
          bossPlanetId={activeAdventure?.planet ?? null}
          bossSectorLevel={activeAdventure?.level ?? null}
          sectorNumber={gameMode === 'adventure' ? ((activeAdventure?.planet || 1) - 1) * 10 + (activeAdventure?.level || 1) : Math.max(1, level)}
          displaySector={activeAdventure ? `${activeAdventure.planet}-${activeAdventure.level}` : ''}
          ether={ether}
          onEtherConsumed={(n) => setEther(e => Math.max(0, e - n))}
          onResult={(winner, meta) => {
            if(winner !== 'draw') handleGameEnd(winner === 'player' ? nickname : 'Avversario', meta);
          }}
          onExit={() => setStep(gameMode === 'adventure' ? 'adv' : 'home')}
        />
      )}

         {step === 'adv' && renderAdventureView()}



            {step === 'epic_items' && (
        <EpicItemsHubScreen
          unlockedRelics={unlockedRelics}
          unlockedRifts={unlockedRifts}
          epicItemsInventory={epicItemsInventory}
          equippedEpicItems={equippedEpicItems}
          voidCrystals={voidCrystals}
          primordialMatter={primordialMatter}
          tankLevel={tankLevel}
          hasStabilizedRift1={hasStabilizedRift1}
          stardust={stardust}
          level={level}
          socketingRelic={socketingRelic}
          onClearSocketingRelic={() => setSocketingRelic(null)}
                    onGoToNextPlanet={() => {
            const currentP = socketingRelic?.planetNum || 1;
            const nextP = getNextCampaignPlanet(currentP);
            setSocketingRelic(null);
            if (nextP !== null) setMaxUnlockedPlanet(p => Math.max(p, nextP));
            if (nextP !== null) setExpandedPlanet(nextP);
            setStep('adv');
          }}

          onEquipItem={(newEquipped) => setEquippedEpicItems(newEquipped)}
          onUpgradeItem={handleUpgradeEpicItem}
          onCollapseRift={handleCollapseRift}
          onUpgradeTank={handleUpgradeSubspaceTank}
          onBack={() => setStep('home')}
          triggerPopup={triggerPopup}
        />
      )}


                    {/* HOME PRINCIPALE MODULARE */}
      {step === 'home' && (
        <HomeScreen
          nickname={nickname}
          level={level}
          maxPlayerHp={maxPlayerHp}
          selectedDeck={selectedDeck}
          currentDeckObj={currentDeckObj}
          selectedPilot={selectedPilot}
          maxUnlockedPlanet={maxUnlockedPlanet}
          currentPlanetLevel={currentPlanetLevel}
          currentPlanetName={currentPlanetName}
          hasCompletedSector1={hasCompletedSector1}
          handleQuickResumeRadar={handleQuickResumeRadar}
          currentGlobalAdventureSector={currentGlobalAdventureSector}
          dailyData={dailyData}
          dailyCountdown={dailyCountdown}
          onOpenDailyModal={() => setShowDailyModal(true)}
          onOpenLoadout={() => setShowPersonalLoadout(true)}
          onOpenShop={() => {
            setShopOpenedFromLoadout(false);
            setUnifiedShopDefaultTab('decks');
            setShowUnifiedShop(true);
          }}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onOpenBounties={() => setShowBountiesModal(true)}
          onOpenRules={() => setShowRulesModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenAdventure={() => setStep('adv')}
          onOpenBetting={() => setPendingBetTier(1)}
          onOpenPvP={() => setShowPvPChannelModal(true)}
                    trophies={trophies}
          dailyBountiesState={dailyBountiesState}
          triggerPopup={triggerPopup}
        />
      )}



      {/* MODALI & DIALOGHI */}
      {selectedSectorForBriefing && (
        <CampaignLevelBriefingModal
          planetNum={selectedSectorForBriefing.planetNum}
          levelNum={selectedSectorForBriefing.levelNum}
          playerPilotId={selectedPilot}
          sectorStars={getSectorStars(selectedSectorForBriefing.planetNum, selectedSectorForBriefing.levelNum, campaignStars)}
          credits={credits}
          isReplay={selectedSectorForBriefing.levelNum < (unlockedLevels?.[selectedSectorForBriefing.planetNum] || 1)}
          scannerSeconds={scannerSeconds}
          diamonds={diamonds}
          onBuyScannerRefill={handleBuyScannerRefill}
          onLaunch={() => launchSectorBattle(selectedSectorForBriefing.planetNum, selectedSectorForBriefing.levelNum)}
          onClose={() => setSelectedSectorForBriefing(null)}
        />
      )}


                {/* MODALE CONTRATTI TATTICI GIORNALIERI */}
      {showBountiesModal && (
        <DailyBountiesModal
          bounties={dailyBountiesState.bounties || []}
          allCompletedClaimed={Boolean(dailyBountiesState.allCompletedClaimed)}
          onClaim={(bId) => {
            const target = (dailyBountiesState.bounties || []).find(b => b.id === bId);
            if (!target || !target.completed || target.claimed) return;

            try { playSound('epic_item_trigger'); } catch (_) {}
            if (target.reward.dust) addStardustSafe(target.reward.dust);
            if (target.reward.credits) setCredits(c => c + target.reward.credits);
            if (target.reward.xp) setXp(x => x + target.reward.xp);

            triggerPopup(` Contratto Riscosso!\n+${target.reward.dust}  | +${target.reward.credits || 15}  Crediti | +${target.reward.xp} XP`);

            setDailyBountiesState(prev => ({
              ...prev,
              bounties: (prev.bounties || []).map(b => b.id === bId ? { ...b, claimed: true } : b)
            }));
          }}
          onClaimAllCompleted={() => {
            if (dailyBountiesState.allCompletedClaimed) return;
            const allDone = (dailyBountiesState.bounties || []).every(b => b.completed);
            if (!allDone) return;

            try { playSound('win'); } catch (_) {}
            setDiamonds(d => d + 2);
            setCredits(c => c + 20);
            setScannerSeconds(s => Math.min(SCANNER_TANK_MAX, s + 10));

            setDailyBountiesState(prev => ({
              ...prev,
              allCompletedClaimed: true
            }));

            triggerPopup(" CASSA TRITTICO APERTA!\n+2 Diamanti    +10s Scanner Tattico   +20 Crediti ");
          }}
          onClose={() => setShowBountiesModal(false)}
        />
      )}





      {/* MODALE PROGRESSIONE PILOTA 1-100 CON LEVEL GATING AGGIORNATO */}
      {showProgression && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '520px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1.5px solid #00f2fe', boxShadow: '0 0 45px rgba(0, 242, 254, 0.45)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              <h3 style={{ color: '#00f2fe', margin: 0, fontWeight: '900', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SciFiIcon name="trophy" size={20} color="#00f2fe" /> Progressione Pilota (Livelli 1â€“100)
              </h3>
              <button className="cyber-btn" onClick={() => setShowProgression(false)} style={{ padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#f87171' }}>X</button>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.35), rgba(15, 23, 42, 0.85))', padding: '0.75rem', borderRadius: '8px', border: '1px solid #00f2fe', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#fff' }}>{nickname}</div>
                  <div style={{ fontSize: '0.7rem', color: '#facc15', fontWeight: 'bold' }}>
                    Grado Pilota: Livello {level} / 100 ({level >= 66 ? 'Fascia 3' : level >= 31 ? 'Fascia 2' : 'Fascia 1'})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: '#10b981', textShadow: '0 0 8px #10b981' }}>{maxPlayerHp} HP</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Curva Vitale Universale</div>
                </div>
              </div>
              <div style={{ marginTop: '0.4rem', fontSize: '0.68rem', color: '#cbd5e1' }}>
                XP Accumulati: <strong>{xp} / {typeof getXpThresholdForLevel === 'function' ? getXpThresholdForLevel(level) : 120 + level * 50}</strong>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', paddingRight: '0.2rem' }}>
              {Array.from({ length: 100 }).map((_, idx) => {
                const lvlNum = idx + 1;
                const isReached = lvlNum <= level;
                const isCurrent = lvlNum === level;
                const hpOfLevel = typeof calculateUniversalPlayerHp === 'function' ? calculateUniversalPlayerHp(lvlNum) : 50;

                let milestoneText = null;
                if (lvlNum === 9) milestoneText = "ðŸ”“ Sblocco Modulo AbilitÃ  Ibrido";
                else if (lvlNum === 15) milestoneText = "ðŸ’” +1 Vita Massima";
                else if (lvlNum === epic1LvlThreshold) milestoneText = "â­ 1Â° Slot Manufatti Epici";
                else if (lvlNum === 30) milestoneText = "ðŸ’” +1 Vita Massima Permanente";
                else if (lvlNum === 31) milestoneText = "âš¡ Ingresso Fascia 2 (Sblocco Liv. 4-6 Mazzi/Moduli & Liv. 2 Terreni)";
                else if (lvlNum === 50) milestoneText = "ðŸ’” +1 Vita Massima";
                else if (lvlNum === epic2LvlThreshold) milestoneText = "â­ 2Â° Slot Manufatti Epici";
                else if (lvlNum === 61) milestoneText = "💎 +25 Diamanti + Titolo Pilota Veterano";
                else if (lvlNum === 66) milestoneText = "ðŸ”¥ Ingresso Fascia 3 (Sblocco Liv. 7-9 Mazzi/Moduli & Liv. 3 Terreni)";
                else if (lvlNum === 75) milestoneText = "ðŸ’” +1 Vita Massima";
                else if (lvlNum === 95) milestoneText = "🌟 Sblocco Apoteosi Suprema (Livello 9)";

                return (
                  <div
                    key={lvlNum}
                    className="cyber-panel"
                    style={{
                      padding: '0.5rem 0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isCurrent ? 'linear-gradient(135deg, rgba(8, 145, 178, 0.45), rgba(15, 23, 42, 0.9))' : (isReached ? 'rgba(15, 23, 42, 0.85)' : 'rgba(30, 41, 59, 0.4)'),
                      border: isCurrent ? '1.5px solid #00f2fe' : (milestoneText ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)'),
                      opacity: isReached ? 1 : 0.5
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: '900', color: isCurrent ? '#00f2fe' : (isReached ? '#fff' : '#94a3b8') }}>
                        Livello {lvlNum} {isCurrent && <span style={{ color: '#facc15', fontSize: '0.65rem' }}>(Attuale)</span>}
                      </div>
                      {milestoneText && (
                        <div style={{ fontSize: '0.65rem', color: '#fde047', fontWeight: 'bold' }}>{milestoneText}</div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: '900', color: '#10b981' }}>{hpOfLevel} HP</div>
                      <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>+{80 + lvlNum * 10} 🌟</div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

                 {/* 1. SELEZIONE TAVOLO SCOMMESSE (STILE FLUTTUANTE SENZA SCATOLE) */}
      {pendingBetTier !== null && (() => {
        const curTier = BETTING_LEVELS[pendingBetTier] || BETTING_LEVELS[1];
        const playerBalance = curTier.resource === 'stardust' 
          ? stardust 
          : (curTier.resource === 'voidCrystals' ? voidCrystals : (curTier.resource === 'primordialMatter' ? primordialMatter : diamonds));
        
        const maxAllowed = Math.min(curTier.maxBet, playerBalance);
        const currentBet = Math.max(curTier.minBet, Math.min(customBetAmount, maxAllowed || curTier.minBet));

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.92) 0%, rgba(1, 3, 10, 0.98) 100%)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 25000,
            padding: 'clamp(10px, 2vmin, 20px) 16px',
            boxSizing: 'border-box'
          }}>
            
            {/* INTESTAZIONE FLUTTUANTE */}
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 'clamp(0.55rem, 1.2vmin, 0.65rem)', color: '#facc15', fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  RADDOPPIO PURO 2X • DEALER AI
                </div>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 2.8vmin, 1.45rem)', fontWeight: 900, color: '#ffffff' }}>
                  BANCO SCOMMESSE
                </h2>
              </div>
              <button 
                onClick={() => setPendingBetTier(null)} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* SELETTORE RISORSA SU 4 TAVOLI */}
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 800 }}>1. SELEZIONA IL TAVOLO RISORSA:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {[1, 2, 3, 4].map(tNum => {
                  const tObj = BETTING_LEVELS[tNum];
                  const isUnlocked = currentGlobalAdventureSector >= tObj.reqAdventureSector;
                  const isSelected = pendingBetTier === tNum;
                  return (
                    <button
                      key={tNum}
                      disabled={!isUnlocked}
                      onClick={() => {
                        try { playSound('click'); } catch (_) {}
                        setPendingBetTier(tNum);
                        setCustomBetAmount(tObj.minBet);
                      }}
                      className="cyber-btn"
                      style={{
                        padding: '8px 2px',
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        border: isSelected ? '1.5px solid #facc15' : '1px solid rgba(255,255,255,0.12)',
                        background: isSelected ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.45), rgba(15, 23, 42, 0.95))' : 'rgba(15, 23, 42, 0.7)',
                        boxShadow: isSelected ? '0 0 14px rgba(250, 204, 21, 0.5)' : 'none',
                        opacity: isUnlocked ? 1 : 0.35
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{tObj.icon}</span>
                      <span>{isUnlocked ? tObj.unit.split(' ')[0] : `🔒 S.${tObj.reqAdventureSector}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SELETTORE IMPORTO PUNTATA FLUTTUANTE */}
            <div style={{
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '10px 0',
              borderTop: '1px solid rgba(250, 204, 21, 0.25)',
              borderBottom: '1px solid rgba(250, 204, 21, 0.25)'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>
                Disponibilità attuale: <strong style={{ color: '#00f2fe' }}>{playerBalance} {curTier.unit}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '4px 0' }}>
                <button
                  disabled={currentBet <= curTier.minBet}
                  onClick={() => {
                    try { playSound('tick'); } catch (_) {}
                    setCustomBetAmount(prev => Math.max(curTier.minBet, prev - curTier.step));
                  }}
                  className="cyber-btn"
                  style={{ width: '38px', height: '38px', fontSize: '1.2rem', fontWeight: 900 }}
                >
                  -
                </button>

                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047', textShadow: '0 0 12px rgba(250, 204, 21, 0.7)' }}>
                    {currentBet} {curTier.icon}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#94a3b8' }}>
                    Min: {curTier.minBet} • Max: {curTier.maxBet}
                  </div>
                </div>

                <button
                  disabled={currentBet >= maxAllowed}
                  onClick={() => {
                    try { playSound('tick'); } catch (_) {}
                    setCustomBetAmount(prev => Math.min(maxAllowed, prev + curTier.step));
                  }}
                  className="cyber-btn"
                  style={{ width: '38px', height: '38px', fontSize: '1.2rem', fontWeight: 900 }}
                >
                  +
                </button>

                <button
                  disabled={maxAllowed <= curTier.minBet || currentBet === maxAllowed}
                  onClick={() => {
                    try { playSound('click'); } catch (_) {}
                    setCustomBetAmount(maxAllowed);
                  }}
                  className="cyber-btn cyber-btn-warning"
                  style={{ padding: '4px 8px', fontSize: '0.62rem', fontWeight: 900 }}
                >
                  MAX
                </button>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 800 }}>
                Vincita potenziale: <strong>{currentBet * 2} {curTier.unit}</strong> (Netto: +{currentBet})
              </div>
            </div>

                        {/* ACCESSO DIRETTO ALLA SFIDA */}
            <div style={{ width: '100%', maxWidth: '420px', marginTop: '4px' }}>
              <button
                disabled={playerBalance < curTier.minBet}
                onClick={() => {
                  try { playSound('click'); } catch (_) {}
                  setPendingBetConfirmation({
                    tierNum: pendingBetTier,
                    amount: currentBet,
                    gameType: 'classic'
                  });
                }}
                className="cyber-btn cyber-btn-warning"
                style={{
                  width: '100%',
                  padding: '12px 4px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  opacity: playerBalance >= curTier.minBet ? 1 : 0.35
                }}
              >
                PROCEDI AL DUELLO ➔
              </button>
            </div>


          </div>
        );
      })()}

      {/* 2. CONFERMA BRIEFING SCOMMESSA (STILE FLUTTUANTE SENZA SCATOLE) */}
      {pendingBetConfirmation && (() => {
        const tier = BETTING_LEVELS[pendingBetConfirmation.tierNum];
        if (!tier) return null;

        const betAmt = pendingBetConfirmation.amount;
        const winAmt = betAmt * 2;
        const canAffordCredits = credits >= tier.costCredits;
        const playerBalance = tier.resource === 'stardust' 
          ? stardust 
          : (tier.resource === 'voidCrystals' ? voidCrystals : (tier.resource === 'primordialMatter' ? primordialMatter : diamonds));
        const canAffordResource = playerBalance >= betAmt;
        const canPlay = canAffordCredits && canAffordResource;

        const aiEstimatedHp = Math.round(maxPlayerHp * 1.15);
        const playerCurDeckLvl = deckInventory[selectedDeck]?.level || 1;
        const aiEstimatedDeckLvl = Math.min(9, playerCurDeckLvl + 1);

                const modeLabels = {
          classic: 'Classica (4 Operazioni)',
          vector: 'Vettore Geometrico',
          double_stage: 'Convergenza (Banco 2+2)',
          tris: 'Tris Stellare'
        };

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, rgba(2, 6, 23, 0.94) 0%, rgba(1, 3, 10, 0.99) 100%)',

            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 32000,
            padding: 'clamp(12px, 2.5vmin, 24px) 16px',
            boxSizing: 'border-box'
          }}>
            {/* INTESTAZIONE */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <div style={{ fontSize: '0.62rem', color: '#facc15', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                BRIEFING DUELLO A SPECCHIO
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: 'clamp(1.2rem, 3vmin, 1.6rem)', fontWeight: 900, color: '#ffffff' }}>
                {tier.name}
              </h2>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800 }}>
                {modeLabels[pendingBetConfirmation.gameType]}
              </div>
            </div>

            {/* CONFRONTO IA A SPECCHIO */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              width: '100%',
              maxWidth: '380px',
              padding: '10px 0',
              borderTop: '1px solid rgba(250, 204, 21, 0.25)',
              borderBottom: '1px solid rgba(250, 204, 21, 0.25)'
            }}>
              <div style={{ fontSize: '0.62rem', color: '#00f2fe', fontWeight: 900, letterSpacing: '1px' }}>
                PARAMETRI DEALER AI (+15% HP • MAZZO N+1)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', fontSize: '0.8rem' }}>
                <span>Nemico: <strong style={{ color: '#ef4444' }}>{aiEstimatedHp} HP</strong></span>
                <span>Mazzo IA: <strong style={{ color: '#facc15' }}>Liv. {aiEstimatedDeckLvl}</strong></span>
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                Potenza di calcolo: {Math.round(tier.aiPower * 100)}% • Reazione simmetrica
              </div>
            </div>

            {/* PROSPETTO POSTA IN GIOCO & RADDOPPIO */}
            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: '#fca5a5', fontWeight: 900 }}>POSTA A RISCHIO:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: canAffordResource ? '#fde047' : '#ef4444' }}>
                  {betAmt} {tier.unit} + {tier.costCredits}⚡ Crediti
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.6rem', color: '#6ee7b7', fontWeight: 900 }}>INCASSO ALLA VITTORIA (2X):</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#34d399', textShadow: '0 0 14px rgba(52, 211, 153, 0.7)' }}>
                  +{winAmt} {tier.unit}
                </div>
                <div style={{ fontSize: '0.58rem', color: '#38bdf8' }}>
                  (Netto: +{betAmt} • Crediti rimborsati al 100%)
                </div>
              </div>
            </div>

            {/* PULSANTI CONFERMA */}
            <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '6px' }}>
              <button
                disabled={!canPlay}
                onClick={() => handleStartBettingGame(pendingBetConfirmation.tierNum, betAmt, pendingBetConfirmation.gameType)}
                className={`cyber-btn ${canPlay ? 'cyber-btn-warning' : ''}`}
                style={{ width: '100%', padding: '12px', fontSize: '0.92rem', fontWeight: 900, letterSpacing: '1px' }}
              >
                {canPlay ? `CONFERMA & PUNTA ${betAmt} ${tier.icon} ➔` : "Risorse Insufficienti"}
              </button>
              <button 
                className="cyber-btn" 
                onClick={() => setPendingBetConfirmation(null)} 
                style={{ width: '100%', padding: '6px', fontSize: '0.72rem', color: '#94a3b8' }}
              >
                Annulla e Torna Indietro
              </button>
            </div>

          </div>
        );
      })()}



           {/* ==================================================================== */}
      {/* BANCA DEI DIAMANTI & CONVERTITORE VALUTA (SENZA SCATOLE GRIGIE)       */}
      {/* ==================================================================== */}
      {showStoreModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 5, 30, 0.94) 0%, rgba(2, 4, 12, 0.99) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 32000,
          padding: 'clamp(12px, 2.5vmin, 22px) 16px',
          boxSizing: 'border-box'
        }}>
          {/* HEADER BANCA FLUTTUANTE */}
          <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 'clamp(0.55rem, 1.2vmin, 0.65rem)', color: '#d946ef', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
                DEPOSITO CENTRALE SUBSPAZIALE
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: 'clamp(1.15rem, 2.8vmin, 1.55rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '1px', textShadow: '0 0 16px rgba(217, 70, 239, 0.8)' }}>
                BANCA DEI DIAMANTI
              </h2>
            </div>

            <button 
              onClick={() => setShowStoreModal(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>

          {/* BILANCIO ATTIVO DIAMANTI OLOGRAFICO */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '20px',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(217, 70, 239, 0.25) 0%, transparent 80%)',
            border: '1px solid rgba(217, 70, 239, 0.4)',
            boxShadow: '0 0 20px rgba(217, 70, 239, 0.35)',
            margin: '4px 0',
            flexShrink: 0
          }}>
            <SciFiIcon name="diamond" size={20} color="#d946ef" />
            <span style={{ fontSize: 'clamp(1.1rem, 2.6vmin, 1.4rem)', fontWeight: 900, color: '#f5d0fe', textShadow: '0 0 12px #d946ef' }}>
              {diamonds}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#cbd5e1', fontWeight: 700, letterSpacing: '0.5px' }}>
              DIAMANTI DISPONIBILI
            </span>
          </div>

          {/* LISTA PACCHETTI A SCORRIMENTO FLUTTUANTE */}
          <div style={{
            flex: 1,
            width: '100%',
            maxWidth: '420px',
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 1.8vmin, 14px)',
            margin: '4px 0',
            scrollbarWidth: 'none'
          }}>
            
            {/* 1. SEZIONE FUTURA: ACQUISTO CON DENARO REALE (IAP READY) */}
            <div style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
              border: '1px dashed rgba(217, 70, 239, 0.45)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#f5d0fe', fontWeight: 900, letterSpacing: '1px' }}>
                ✦ FORNITURE DIRETTE (PROSSIMAMENTE) ✦
              </div>
              <div style={{ fontSize: '0.58rem', color: '#cbd5e1', marginTop: '2px' }}>
                I pacchetti per l'acquisto di Diamanti con fondi reali saranno attivati nelle prossime versioni di rete.
              </div>
            </div>

            {/* 2. CONVERSIONE: CREDITI ENERGETICI */}
            <div>
              <div style={{ fontSize: '0.65rem', color: '#00f2fe', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                ⚡ CONVERTI IN CREDITI (PER GIOCARE)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { name: '50 ⚡', amount: 50, cost: 3, type: 'credits', bonus: '' },
                  { name: '120 ⚡', amount: 120, cost: 6, type: 'credits', bonus: '+20%' },
                  { name: '300 ⚡', amount: 300, cost: 12, type: 'credits', bonus: '+50%' }
                ].map((pkg, idx) => (
                  <button
                    key={idx}
                    disabled={diamonds < pkg.cost}
                    onClick={() => handleBuyStorePackage(pkg)}
                    className="cyber-btn cyber-btn-primary"
                    style={{
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      opacity: diamonds >= pkg.cost ? 1 : 0.45
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: 900 }}>{pkg.name}</span>
                    <span style={{ fontSize: '0.52rem', color: '#6ee7b7' }}>{pkg.bonus || 'Base'}</span>
                    <span style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 900, marginTop: '2px' }}>
                      {pkg.cost} 💎
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. CONVERSIONE: VITE & RIANIMAZIONI */}
            <div>
              <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                💔 CONVERTI IN VITE
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {[
                  { name: '+1 Vita 💔', amount: 1, cost: 3, type: 'lives', desc: 'Ricarica immediata' },
                  { name: `Max Vite (${typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(level) : 3} 💔)`, amount: typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(level) : 3, cost: 8, type: 'lives', desc: 'Serbatoio al 100%' }
                ].map((pkg, idx) => (
                  <button
                    key={idx}
                    disabled={diamonds < pkg.cost}
                    onClick={() => handleBuyStorePackage(pkg)}
                    className="cyber-btn"
                    style={{
                      padding: '8px 6px',
                      borderColor: '#f43f5e',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      opacity: diamonds >= pkg.cost ? 1 : 0.45
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#fca5a5' }}>{pkg.name}</span>
                    <span style={{ fontSize: '0.52rem', color: '#cbd5e1' }}>{pkg.desc}</span>
                    <span style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 900, marginTop: '2px' }}>
                      {pkg.cost} 💎
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. CONVERSIONE: POLVERE STELLARE */}
            <div>
              <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                🌟 CONVERTI IN POLVERE (UPGRADE MODULI)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { name: '+300 🌟', amount: 300, cost: 5, type: 'stardust' },
                  { name: '+800 🌟', amount: 800, cost: 10, type: 'stardust' },
                  { name: '+2.000 🌟', amount: 2000, cost: 20, type: 'stardust' }
                ].map((pkg, idx) => (
                  <button
                    key={idx}
                    disabled={diamonds < pkg.cost}
                    onClick={() => handleBuyStorePackage(pkg)}
                    className="cyber-btn cyber-btn-warning"
                    style={{
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      opacity: diamonds >= pkg.cost ? 1 : 0.45
                    }}
                  >
                    <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{pkg.name}</span>
                    <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 900, marginTop: '2px' }}>
                      {pkg.cost} 💎
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. CONVERSIONE: ETERE COSMICO (SE SBLOCCATO) */}
            {isEtherUnlocked && (
              <div>
                <div style={{ fontSize: '0.65rem', color: '#e879f9', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                  🔮 CONVERTI IN ETERE (JOLLY & RIARMO)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { name: '+3 Etere 🔮', amount: 3, cost: 6, type: 'ether' },
                    { name: '+8 Etere 🔮', amount: 8, cost: 14, type: 'ether' }
                  ].map((pkg, idx) => (
                    <button
                      key={idx}
                      disabled={diamonds < pkg.cost}
                      onClick={() => handleBuyStorePackage(pkg)}
                      className="cyber-btn cyber-btn-ether"
                      style={{
                        padding: '8px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        opacity: diamonds >= pkg.cost ? 1 : 0.45
                      }}
                    >
                      <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>{pkg.name}</span>
                      <span style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 900, marginTop: '2px' }}>
                        {pkg.cost} 💎
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. CONVERSIONE: MINERALI RARI (SE VARCO 1 APERTO) */}
            {hasStabilizedRift1 && (
              <div>
                <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 900, letterSpacing: '1px', marginBottom: '4px', textTransform: 'uppercase' }}>
                  💠 MINERALI SUBSPAZIALI (PER MANUFATTI)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {[
                    { name: '+2 Cristalli 💠', amount: 2, cost: 10, type: 'void_crystals' },
                    { name: '+1 Materia 🟣', amount: 1, cost: 15, type: 'primordial_matter' }
                  ].map((pkg, idx) => (
                    <button
                      key={idx}
                      disabled={diamonds < pkg.cost}
                      onClick={() => handleBuyStorePackage(pkg)}
                      className="cyber-btn"
                      style={{
                        padding: '8px 6px',
                        borderColor: '#00f2fe',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        opacity: diamonds >= pkg.cost ? 1 : 0.45
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38bdf8' }}>{pkg.name}</span>
                      <span style={{ fontSize: '0.68rem', color: '#fde047', fontWeight: 900, marginTop: '2px' }}>
                        {pkg.cost} 💎
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* PULSANTE CHIUSURA INFERIORE */}
          <div style={{ width: '100%', maxWidth: '360px', flexShrink: 0, marginTop: '4px' }}>
            <button
              onClick={() => setShowStoreModal(false)}
              className="cyber-btn"
              style={{ width: '100%', padding: '10px', fontSize: '0.8rem', color: '#94a3b8' }}
            >
              Torna alla Base
            </button>
          </div>

        </div>
      )}


            {/* Selezione del circuito PvP simulato */}
      {showPvPChannelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '460px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '2px solid #00f2fe', boxShadow: '0 0 45px rgba(0, 242, 254, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '0.4rem', marginBottom: '0.85rem' }}>
              <h3 style={{ color: '#00f2fe', margin: 0, fontWeight: '900', fontSize: '1.1rem', textShadow: '0 0 8px rgba(0, 242, 254, 0.6)' }}>
                Seleziona Circuito PvP Simulato
              </h3>
              <button className="cyber-btn" onClick={() => setShowPvPChannelModal(false)} style={{ background: '#ef4444', borderColor: '#f87171', padding: '0.2rem 0.5rem' }}>X</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Canale Addestramento */}
              {(() => {
                const isTrainingUnlocked = currentGlobalAdventureSector >= pvpTrainingUnlockThreshold;
                return (
                  <div
                    className="cyber-panel"
                    style={{
                      padding: '0.75rem',
                      border: '1.5px solid #38bdf8',
                      background: 'rgba(15, 23, 42, 0.85)',
                      opacity: isTrainingUnlocked ? 1 : 0.5
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#38bdf8' }}>Canale Addestramento</span>
                      <span style={{ fontSize: '0.62rem', background: '#0284c7', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold' }}>{trainingEntryCost} Crediti ⚡</span>
                    </div>
                                        <p style={{ fontSize: '0.68rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>
                      Allenati contro un pilota IA sulla plancia ufficiale.
                    </p>

                                        <button
                      disabled={!isTrainingUnlocked}
                      onClick={() => {
                        try { playSound('click'); } catch (_) {}
                        setSelectedPvPMode('classic');
                        setPendingPvPConfirmation({ channel: 'training', mode: 'classic' });
                      }}
                      className="cyber-btn cyber-btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        fontSize: '0.8rem',
                        fontWeight: '900'
                      }}
                    >
                      {isTrainingUnlocked ? 'ENTRA IN ADDESTRAMENTO ➔' : `🔒 Richiede Settore ${pvpTrainingUnlockThreshold}`}
                    </button>

                  </div>
                );
              })()}

              {/* CANALE B: LEGA ÉLITE SIMULATA */}
              {(() => {
                const isEliteUnlocked = currentGlobalAdventureSector >= pvpEliteUnlockThreshold;
                const canPlayElite = isEliteUnlocked && remainingEliteMatches > 0;
                const dailyMode = getDailyPvPMode();

                return (
                  <div
                    onClick={() => {
                      if (!isEliteUnlocked) {
                        try { playSound('deselect'); } catch (_) {}
                        triggerPopup(`Richiede Settore ${pvpEliteUnlockThreshold} dell'Avventura (Supera il Pianeta 8 Nettuno)!`);
                        return;
                      }
                      if (remainingEliteMatches <= 0) {
                        try { playSound('deselect'); } catch (_) {}
                        triggerPopup("Hai esaurito le 10 partite giornaliere per oggi!");
                        return;
                      }
                      try { playSound('click'); } catch (_) {}
                      setSelectedPvPMode(dailyMode.mode);
                      setPendingPvPConfirmation({ channel: 'elite', mode: dailyMode.mode });
                    }}
                    className={`pvp-channel-card ${!canPlayElite ? 'locked' : ''}`}
                    style={{ borderColor: '#facc15', background: 'rgba(234, 179, 8, 0.1)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#fde047' }}>Lega Élite Simulata</span>
                      <span className="pvp-ticket-counter">Gioca ({remainingEliteMatches}/10)</span>
                    </div>
                    <p style={{ fontSize: '0.68rem', color: '#cbd5e1', margin: 0, lineHeight: '1.3' }}>
                      Affronta piloti IA. Hai 10 duelli Élite al giorno.
                    </p>
                    <div style={{ fontSize: '0.62rem', color: isEliteUnlocked ? '#facc15' : '#f87171', fontWeight: 'bold', marginTop: '2px' }}>
                      {isEliteUnlocked ? (remainingEliteMatches > 0 ? `✓ Sbloccato (Costo 0⚡ | ${remainingEliteMatches} partite rimaste)` : '⚠️ Partite Giornaliere Esaurite') : `🔒 Richiede Settore ${pvpEliteUnlockThreshold} Avventura`}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}


            {/* BRIEFING TATTICO PRE-MATCH PVP & CONFERMA INGRESSO */}
      {pendingPvPConfirmation && (() => {
        const isElite = pendingPvPConfirmation.channel === 'elite';
        const costCredits = isElite ? 0 : trainingEntryCost;
        const canAfford = credits >= costCredits;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 32000, padding: '1rem' }}>

            <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', border: `2px solid ${isElite ? '#facc15' : '#00f2fe'}`, boxShadow: `0 0 45px ${isElite ? 'rgba(250, 204, 21, 0.6)' : 'rgba(0, 242, 254, 0.6)'}` }}>
              
              <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: '900', letterSpacing: '1px' }}>
                DUELLO SIMULATO
              </div>
              <h3 style={{ color: isElite ? '#fde047' : '#00f2fe', margin: '0.2rem 0 0.5rem 0', fontWeight: '900', fontSize: '1.15rem' }}>
                {isElite ? 'Lega Élite Simulata' : 'Addestramento'}
              </h3>

              <div style={{ background: 'rgba(15, 23, 42, 0.85)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '0.85rem', textAlign: 'left', fontSize: '0.72rem', color: '#cbd5e1' }}>
                <p style={{ margin: '0 0 3px' }}>
                  Ingresso <strong style={{ color: canAfford ? '#00f2fe' : '#ef4444' }}>{isElite ? 'gratuito' : `${costCredits} Crediti ⚡`}</strong>
                </p>
                <p style={{ margin: 0 }}>Duello contro l’IA, senza ricompense o variazioni dei trofei.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <button
                  disabled={!canAfford}
                  onClick={() => {
                    if (!isElite) setCredits(c => c - trainingEntryCost);
                    else setEliteMatchesPlayedToday(p => p + 1);

                    setSelectedPvPChannel(pendingPvPConfirmation.channel);
                    setSelectedPvPMode(pendingPvPConfirmation.mode);
                    setPendingPvPConfirmation(null);
                    setShowPvPChannelModal(false);
                    setIsSearchingPvP(true);
                  }}
                  className={`cyber-btn ${isElite ? 'cyber-btn-warning' : 'cyber-btn-primary'}`}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '900' }}
                >
                  {canAfford ? 'AVVIA DUELLO SIMULATO ➔' : `Crediti Insufficienti (${costCredits}⚡)`}
                </button>
                <button className="cyber-btn" onClick={() => setPendingPvPConfirmation(null)} style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem' }}>
                  Annulla
                </button>
              </div>

            </div>
          </div>
        );
      })()}


            {/* Sblocco Modulo Settore 9 integrato direttamente all'avvio in base al Pilota */}


          {/* Sblocco Mazzo con Passiva per Boss Gaia integrato direttamente all'avvio in base al Pilota */}


                 {isSearchingPvP && (
        <MatchmakingLobby
          myNickname={nickname}
          myDeck={selectedDeck}
          myPilot={selectedPilot}
          myLevel={level}
          myTrophies={trophies}
          pvpChannel={selectedPvPChannel}
          selectedMode={selectedPvPMode}
          onMatchFound={handlePvPMatchFound}
          onCancel={handlePvPCancel}
        />
      )}



            {showLeaderboardModal && (
        <WeeklyLeaderboardModal
          myNickname={nickname}
          myPlayerId={myPlayerId}
          myTrophies={trophies}
          myLevel={level}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}


      {/* MODALE REGOLE DI GIOCO */}
      {showRulesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '520px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1.5px solid #00f2fe' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
              <h3 style={{ color: '#00f2fe', margin: 0, fontWeight: '900', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SciFiIcon name="database" size={18} color="#00f2fe" /> Registro delle Regole di Gioco
              </h3>
              <button className="cyber-btn" onClick={() => { setShowRulesModal(false); setActiveRuleDetail(null); }} style={{ padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#f87171' }}>X</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.2rem' }}>
              {typeof RULES_DATABASE !== 'undefined' && RULES_DATABASE.map(rule => (
                <div
                  key={rule.id}
                  onClick={() => setActiveRuleDetail(activeRuleDetail?.id === rule.id ? null : rule)}
                  className="cyber-panel"
                  style={{ padding: '0.65rem', border: `1px solid ${rule.color}`, cursor: 'pointer', background: 'rgba(15, 23, 42, 0.85)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: rule.color }}>{rule.num}. {rule.title}</span>
                    <span style={{ fontSize: '0.6rem', color: '#facc15', fontWeight: 'bold' }}>{rule.tag}</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#cbd5e1', margin: '4px 0 0 0' }}>{rule.summary}</p>
                  {activeRuleDetail?.id === rule.id && (
                    <div style={{ marginTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '0.4rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                      {rule.details.map((d, dIdx) => <div key={dIdx} style={{ marginBottom: '3px' }}>â€¢ {d}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALE ESTRATTORE ETERE */}
      {showExtractorModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1.5px solid #e879f9', boxShadow: '0 0 35px rgba(232, 121, 249, 0.4)' }}>
            <h3 style={{ color: '#f0abfc', margin: '0 0 0.35rem 0', fontWeight: '900' }}>
              {extractorConfig.name} (Liv.{extractorLevel}/4)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 1rem 0' }}>
              Estrae passivamente Etere Cosmico 🔮 nel tempo.
            </p>

            <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#f5d0fe', fontWeight: 'bold' }}>
                Etere Immagazzinato: {extractorStored} / {extractorConfig.maxStore} 🔮
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                Tuo Etere Attuale: {ether} 🔮
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                disabled={extractorStored <= 0}
                onClick={() => {
                  try { playSound('dust_extract'); } catch (_) {}
                  setEther(e => e + extractorStored);
                  setExtractorStored(0);
                  setExtractorLastTime(Date.now());
                  triggerPopup(`Raccolti +${extractorStored} Etere Cosmico!`);
                }}
                className="cyber-btn cyber-btn-ether"
                style={{ padding: '0.65rem', fontWeight: '900' }}
              >
                Raccogli Etere ({extractorStored} 🔮)
              </button>

              {nextExtractorConfig && (
                <button
                  disabled={stardust < nextExtractorConfig.costDust || (level || 1) < nextExtractorConfig.reqLevel}
                  onClick={() => {
                    if (stardust < nextExtractorConfig.costDust || (level || 1) < nextExtractorConfig.reqLevel) return;
                    try { playSound('ability'); } catch (_) {}
                    setStardust(s => s - nextExtractorConfig.costDust);
                    setExtractorLevel(l => l + 1);
                    triggerPopup(`Estrattore potenziato a ${nextExtractorConfig.name}!`);
                  }}
                  className="cyber-btn cyber-btn-primary"
                  style={{ padding: '0.55rem', fontSize: '0.75rem' }}
                >
                  Potenzia Estrattore ({nextExtractorConfig.costDust} 🌟 | Req Liv.{nextExtractorConfig.reqLevel})
                </button>
              )}

              <button className="cyber-btn" onClick={() => setShowExtractorModal(false)} style={{ padding: '0.45rem' }}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE IMPOSTAZIONI */}
      {showSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '380px', width: '100%', textAlign: 'center', border: '1.5px solid #00f2fe' }}>
            <h3 style={{ color: '#00f2fe', margin: '0 0 0.75rem 0', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <SciFiIcon name="settings" size={20} color="#00f2fe" /> {t.settingsTitle}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem' }}>{t.musicToggle}</span>
                <button className="cyber-btn" onClick={() => setBgmMutedState(toggleMuteBGM())} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  {bgmMutedState ? t.disabledState : t.activeState}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem' }}>{t.sfxToggle}</span>
                <button className="cyber-btn" onClick={() => setSfxMutedState(toggleMuteSFX())} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  {sfxMutedState ? t.disabledState : t.activeState}
                </button>
              </div>

                            <button className="cyber-btn" onClick={() => setStep('lang')} style={{ padding: '0.5rem', fontSize: '0.75rem' }}>
                {t.langSelect} (Attuale: {lang.toUpperCase()})
              </button>

              {/* Registro Regole di Gioco */}
              <button 
                className="cyber-btn" 
                onClick={() => {
                  try { playSound('click'); } catch (_) {}
                  setShowSettingsModal(false);
                  setShowRulesModal(true);
                }} 
                style={{ padding: '0.5rem', fontSize: '0.75rem', borderColor: '#00f2fe', color: '#00f2fe', fontWeight: 'bold' }}
              >
                📖 Registro Regole di Gioco
              </button>

              <button className="cyber-btn" onClick={handleHardResetData} style={{ padding: '0.5rem', fontSize: '0.72rem', borderColor: '#ef4444', color: '#fca5a5', marginTop: '0.5rem' }}>
                ⚠️ Ripristino Totale Dati
              </button>

            </div>

            <button className="cyber-btn cyber-btn-primary" onClick={() => setShowSettingsModal(false)} style={{ width: '100%', padding: '0.55rem' }}>
              Chiudi Impostazioni
            </button>
          </div>
        </div>
      )}

         {/* MODALE MAPPA A NODI ROTTA STELLARE (360 STELLE / 24 CAPSULE) */}
      {showStarCapsulesModal && (
        <StarRouteMapModal
          totalStars={totalCampaignStars}
          claimedCapsules={claimedStarCapsules}
          onClaim={handleClaimStarCapsule}
          onClose={() => setShowStarCapsulesModal(false)}
        />
      )}
      
            {/* MODALE SFIDA DEL GIORNO */}
      {showDailyModal && (
        <DailyChallengeModal
          dailyData={dailyData}
          countdownText={dailyCountdown}
          onLaunch={handleLaunchDailyChallenge}
          onClose={() => setShowDailyModal(false)}
        />
      )}

      {/* MODALE REPORT DELLE 00:00:01 (CONSEGNA PREMI & STREAK) */}
      {dailyReportData && (
        <DailyReportModal
          reportData={dailyReportData}
          onClaim={handleClaimDailyReport}
        />
      )}
      
      
            {/* MODALE AREA PERSONALE (HUB DI PLANCIA CON ISPEZIONE & CAMBIO DIRETTO) */}
      {showPersonalLoadout && (
        <PersonalLoadoutModal
          nickname={nickname}
          level={level}
          xp={xp}
          xpThreshold={typeof getXpThresholdForLevel === 'function' ? getXpThresholdForLevel(level) : 120 + level * 50}
          credits={credits}
          lives={lives}
          maxLives={typeof getMaxLivesForLevel === 'function' ? getMaxLivesForLevel(level) : 3}
          stardust={stardust}
          walletCap={walletCap}
          diamonds={diamonds}
          ether={ether}
          voidCrystals={voidCrystals}
          primordialMatter={primordialMatter}
          tankConfig={tankConfig}
          scannerSeconds={scannerSeconds}
          isEtherUnlocked={isEtherUnlocked}
          extractorLevel={extractorLevel}
          extractorStored={extractorStored}
          extractorConfig={extractorConfig}
          nextExtractorConfig={nextExtractorConfig}
          onHarvestEther={() => {
            try { playSound('dust_extract'); } catch (_) {}
            setEther(e => e + extractorStored);
            setExtractorStored(0);
            setExtractorLastTime(Date.now());
            triggerPopup(`Raccolti +${extractorStored} Etere Cosmico!`);
          }}
          onUpgradeExtractor={() => {
            if (!nextExtractorConfig || stardust < nextExtractorConfig.costDust) return;
            try { playSound('ability'); } catch (_) {}
            setStardust(s => s - nextExtractorConfig.costDust);
            setExtractorLevel(l => l + 1);
            triggerPopup(`Estrattore potenziato a ${nextExtractorConfig.name}!`);
          }}
          selectedPilot={selectedPilot}
          pilotInventory={pilotInventory}
          selectedDeck={selectedDeck}
          currentDeckObj={currentDeckObj}
          deckInventory={deckInventory}
          onOpenShopTab={(tabName) => {


            setShowPersonalLoadout(false);
            setShopOpenedFromLoadout(true);
            setUnifiedShopDefaultTab(tabName);
            setShowUnifiedShop(true);
          }}
          onClose={() => setShowPersonalLoadout(false)}
        />
      )}

                                    {/* MODALE BAZAR GALATTICO UNIFICATO (4 TABS) */}
      {showUnifiedShop && (
        <ShopModal
          onUpgradeShip={async (instanceId, targetLevel, shownCost) => {
            try {
              const before=readShipCollection();
              const check=validateShipUpgradePurchase(before,instanceId,targetLevel,stardust);
              if(!check.allowed||check.cost!==shownCost){
                triggerPopup(check.reason==='insufficient_dust'?'Polvere Stellare insufficiente':'Potenziamento non disponibile');
                return false;
              }
              await updateShipCollection(current=>{
                const currentCheck=validateShipUpgradePurchase(current,instanceId,targetLevel,stardust);
                if(!currentCheck.allowed||currentCheck.cost!==shownCost)
                  throw new Error('Il potenziamento non è più valido');
                return upgradeShipCard(current,instanceId,targetLevel);
              });
              setStardust(current=>Math.max(0,current-check.cost));
              triggerPopup('Navicella potenziata al livello '+targetLevel);
              return true;
            } catch {
              triggerPopup('Potenziamento annullato: risorse o salvataggio da verificare');
              return false;
            }
          }}
          initialTab={unifiedShopDefaultTab}


          selectedDeck={selectedDeck}
          deckInventory={deckInventory}
          allDecks={typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES : []}
          onSelectDeck={(id) => unlockDeck(id)}
          onUpgradeDeck={(id) => handleUpgradeDeck(id)}
          abilities={abilities}
          allAbilities={typeof ALL_ABILITIES !== 'undefined' ? ALL_ABILITIES : []}
          onUnlockAbility={(id) => unlockAbilityWithDust(id)}
          onUpgradeAbility={(id) => upgradeAbilityWithDust(id)}

          stardust={stardust}
          diamonds={diamonds}
          voidCrystals={voidCrystals}
          primordialMatter={primordialMatter}
          ether={ether}
          level={level}
          onBuyStorePackage={handleBuyStorePackage}
          fromLoadout={shopOpenedFromLoadout}
          onBackToLoadout={() => {
            setShowUnifiedShop(false);
            setShowPersonalLoadout(true);
          }}
          onCloseToHome={() => {
            setShowUnifiedShop(false);
            setShowPersonalLoadout(false);
          }}
        />
      )}

      {/* Toast Popup Notifiche */}
      {popupMsg && (
        <div className="cyber-panel" style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '0.75rem 1.4rem', textAlign: 'center', borderRadius: '10px', fontWeight: 'bold', zIndex: 35000, pointerEvents: 'none', boxShadow: '0 6px 25px rgba(0,242,254,0.45)', whiteSpace: 'pre-line', border: '1px solid #00f2fe', fontSize: '0.85rem' }}>
          {popupMsg}
        </div>
      )}





    </div>
  );
}


// ============================================================================
// 8.0 INIZIALIZZAZIONE & MOUNTING SUL DOM CON ATTRIBUTI ANTI-TRANSLATE
// ============================================================================
export default App;
