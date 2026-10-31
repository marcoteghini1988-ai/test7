import React, { useState, useEffect, useRef } from 'react';
// R9 — PvP locale contro IA. Nessuna connessione a servizi esterni.
import { SciFiIcon } from './visualAssets';
import { COMPETITIVE_BOOTSTRAP, seededCompetitionRng } from './pvpBootstrap.js';

// Il riferimento nullo conserva la compatibilita' con vecchie schermate,
// impedendo in ogni caso richieste remote. Non e' una credenziale.
export const db = null;
export const ONLINE_POKER_ENABLED = false;

// ============================================================================
// 1.1 PARAMETRI ECONOMICI & REGOLE PVP
// ============================================================================
export const PVP_TRAINING_ENTRY_CREDITS = 5;
export const PVP_ELITE_DAILY_MATCHES_CAP = 10;
export const PVP_LOSS_TROPHIES = 10;
export const PVP_WIN_CREDITS = 5;       // Rimborso esatto del ticket d'ingresso (giocata a costo zero per chi vince)
export const PVP_WIN_STARDUST = 60;     // Farming polvere stellare incrementato per la Fascia 2
export const PVP_LOSS_STARDUST = 15;
export const PVP_WIN_XP = 80;
export const PVP_LOSS_XP = 25;

// SCAGLIONI TROFEI A STELLE (SOLO LEGA ÉLITE)
export const PVP_ELITE_STAR_REWARDS = Object.freeze({
  1: { 
    stars: 1, 
    percent: 50, 
    trophies: 15, 
    voidCrystals: 1, 
    primordialMatter: 0, 
    chancePrimordial: 0, 
    label: "Vittoria Tattica (+15 🏆, +1 💠)" 
  },
  2: { 
    stars: 2, 
    percent: 75, 
    trophies: 22, 
    voidCrystals: 1, 
    primordialMatter: 0, 
    chancePrimordial: 0.5, 
    label: "Vittoria Dominante (+22 🏆, +1 💠, 50% 🟣)" 
  },
  3: { 
    stars: 3, 
    percent: 100, 
    trophies: 30, 
    diamonds: 1, 
    voidCrystals: 1, 
    primordialMatter: 1, 
    chancePrimordial: 1.0, 
    label: "Vittoria Perfetta (+30 🏆, +1 💎, +1 💠, +1 🟣)" 
  }
});

// SBLOCCO MODALITÀ PVP DAL PROGRESSO NEI SETTORI AVVENTURA (ALLINEATO A SETTORE 11)
export const PVP_MODE_UNLOCKS = Object.freeze({
  classic: { sector: 11, label: 'Classica (4 Operazioni & Poker)' },
  vector: { sector: 21, label: 'Vettore Geometrico' },
  double_stage: { sector: 41, label: 'Convergenza (Banco 2+2 & Poker)' },
  tris: { sector: 61, label: 'Tris Stellare' }
});

export const isPvPModeUnlocked = (mode, currentSector = 1) => {
  const entry = PVP_MODE_UNLOCKS[mode];
  const req = (typeof entry === 'object' && entry !== null) ? entry.sector : (typeof entry === 'number' ? entry : 11);
  return currentSector >= req;
};

// ============================================================================
// 1.2 ROTAZIONE GIORNALIERA ÉLITE & SFIDA DELLA 3ª STELLA
// ============================================================================
export const getDailyPvPMode = () => {
  const day = new Date().getDay(); // 0 = Dom, 1 = Lun, ..., 6 = Sab
  if (day === 0) {
    return {
      mode: 'tris',
      title: 'Tris Stellare',
      desc: 'Incastro a 5 Carte [Tavolo Op1 C2 + C3 + C4 + C5 = Target / Parità]',
      star3Challenge: {
        title: 'Armonia Galattica',
        desc: 'Chiudi almeno un incastro con una combinazione pokeristica a 5 carte (da Coppia a Scala Reale).'
      }
    };
  }
  if (day === 1 || day === 4) {
    return {
      mode: 'classic',
      title: 'Modalità Classica',
      desc: '3 Piedistalli Tattici (Calcolo Puro, Pattern Poker, Bomba 3T)',
      star3Challenge: {
        title: 'Precisione Razionale',
        desc: 'Metti a segno almeno un attacco vincente con la Divisione [/] o una Combo 4 Semi.'
      }
    };
  }
  if (day === 2 || day === 5) {
    return {
      mode: 'vector',
      title: 'Vettore Geometrico',
      desc: 'Composizione Radar Vettoriale',
      star3Challenge: {
        title: 'Efficienza Balistica',
        desc: 'Centra il radar sommando algebricamente al massimo 2 carte nel Nucleo.'
      }
    };
  }
  return {
    mode: 'double_stage',
    title: 'Duello di Convergenza',
    desc: 'Banco Comune: centra il Target condiviso in 2 turni concatenati (2+2 carte) e domina con la figura Poker',
    star3Challenge: {
      title: 'Precisione di Convergenza',
      desc: 'Centra il Target condiviso o vinci il duello con il minor Delta o la migliore figura Poker.'
    }
  };
};

export const getWeeklyLeaderboardKey = (date = new Date()) => {
  // Stessa settimana su dispositivi in fusi diversi; rollover in Europe/Rome.
  const romeDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const d = new Date(`${romeDate}T00:00:00Z`);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `settimana_${d.getUTCFullYear()}_${weekNo}`;
};

// ============================================================================
// 1.3 POOL DEI 33 PILOTI PER GENERAZIONE AVVERSARI E CLASSIFICHE
// ============================================================================
const POOL_PILOTS = Object.freeze([
  'pilot_com_1', 'pilot_com_2', 'pilot_com_3', 'pilot_com_4',
  'pilot_boss_1', 'pilot_boss_2', 'pilot_boss_3', 'pilot_boss_4',
  'pilot_boss_5', 'pilot_boss_6', 'pilot_boss_7', 'pilot_boss_8',
  'pilot_boss_9', 'pilot_boss_10', 'pilot_boss_11', 'pilot_boss_12',
  'pilot_rare_1', 'pilot_rare_2', 'pilot_rare_3', 'pilot_rare_4',
  'pilot_epic_1', 'pilot_epic_2', 'pilot_epic_3', 'pilot_epic_4',
  'pilot_leg_1', 'pilot_leg_2', 'pilot_leg_3', 'pilot_leg_4',
  'pilot_leg_5', 'pilot_leg_6', 'pilot_boss_18', 'pilot_boss_19', 'pilot_boss_20'
]);

// Helper per generare una Carta Base valida per il banco di Convergenza o Tris
export const generatePvpBaseCard = () => {
  const suits = [
    { id: 'hearts', symbol: '♥', color: '#f43f5e' },
    { id: 'diamonds', symbol: '♦', color: '#00f2fe' },
    { id: 'clubs', symbol: '♣', color: '#10b981' },
    { id: 'spades', symbol: '♠', color: '#c084fc' }
  ];
  const s = suits[Math.floor(Math.random() * suits.length)];
  const rawVal = Math.floor(Math.random() * 13) + 1;
  let displayVal = rawVal.toString();
  if (rawVal === 1) displayVal = 'A';
  else if (rawVal === 11) displayVal = 'J';
  else if (rawVal === 12) displayVal = 'Q';
  else if (rawVal === 13) displayVal = 'K';

  return {
    id: `base_${s.id}_${rawVal}_${Math.random().toString(36).substring(2, 6)}`,
    value: rawVal,
    displayVal,
    suit: s.id,
    symbol: s.symbol,
    color: s.color,
    isCourt: rawVal >= 11,
    isJoker: false,
    isGolden: false
  };
};

// ============================================================================
// 1.4 GENERATORE PROCEDURALE NOMI AD ALTA ENTROPIA (>150.000 COMBINAZIONI)
// ============================================================================
const CLAN_TAGS = [
  '[VOID]', '[APEX]', '[NOVA]', '[ECL]', '[TITAN]', '[WARP]', '[PULSE]', '[NEO]',
  '[ZERO]', '[CHRONO]', '[AURA]', '[NEXUS]', '[HYPER]', '[AETHER]', '[ZENITH]',
  '[SOLAR]', '[DRIFT]', '[VALK]', '[OMEGA]', '[PRIME]'
];

const REAL_NAMES = [
  'Marco', 'Matteo', 'Luca', 'Davide', 'Elena', 'Sofia', 'Chiara', 'Gabriel', 'Noemi',
  'Alessandro', 'Lorenzo', 'Leonardo', 'Giulia', 'Sara', 'Andrea', 'Tommaso', 'Federico',
  'Edoardo', 'Diego', 'Simone', 'Alex', 'Lucas', 'Sarah', 'Liam', 'Noah', 'Ethan',
  'Mason', 'Oliver', 'Logan', 'Emma', 'Chloe', 'Ava', 'Dylan', 'Dmitri', 'Viktor',
  'Kael', 'Boris', 'Nikolai', 'Ivan', 'Sasha', 'Milan', 'Andrei', 'Sven', 'Erik',
  'Lars', 'Astrid', 'Freja', 'Magnus', 'Carlos', 'Mateo', 'Javier', 'Lucia', 'Yuki',
  'Ren', 'Kenji', 'Haruto', 'Kaito', 'Jin', 'Shin', 'Akira'
];

const SCI_FI_PREFIXES = [
  'Nova', 'Star', 'Cosmo', 'Astro', 'Solar', 'Lunar', 'Nebula', 'Zenith', 'Polaris',
  'Orion', 'Eclipse', 'Pulsar', 'Quasar', 'Helix', 'Abyss', 'Comet', 'Aurora', 'Vortex',
  'Quantum', 'Cyber', 'Neon', 'Hyper', 'Vector', 'Matrix', 'Flux', 'Protocol', 'Glitch',
  'Shadow', 'Dark', 'Iron', 'Apex', 'Phantom', 'Ghost', 'Strike', 'Viper', 'Titan'
];

const SCI_FI_SUFFIXES = [
  'Pilot', 'Commander', 'Hunter', 'Blade', 'Knight', 'Rider', 'Scout', 'Gunner',
  'Captain', 'Operative', 'Striker', 'Vanguard', 'Trooper', 'Prime', 'Zero', 'Core',
  'Edge', 'Drift', 'Shift', 'Pulse', 'Hawk', 'Gale', 'Shard', 'Scythe', 'Reign',
  'TTV', 'Pro', 'God', 'Main', 'Exe'
];

export const generateProceduralName = (rng = Math.random) => {
  const pattern = Math.floor(rng() * 6);
  const useClan = rng() < 0.18;
  const clan = useClan ? CLAN_TAGS[Math.floor(rng() * CLAN_TAGS.length)] : '';

  let baseName = '';
  switch (pattern) {
    case 0: {
      const base = REAL_NAMES[Math.floor(rng() * REAL_NAMES.length)];
      const sep = rng() > 0.5 ? '_' : '.';
      const num = Math.floor(rng() * 90) + 10;
      baseName = `${base}${sep}${num}`;
      break;
    }
    case 1: {
      const pre = SCI_FI_PREFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      const suf = SCI_FI_SUFFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      baseName = `${pre}${suf}`;
      break;
    }
    case 2: {
      const base = rng() > 0.5 
        ? REAL_NAMES[Math.floor(rng() * REAL_NAMES.length)] 
        : SCI_FI_PREFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      baseName = base;
      break;
    }
    case 3: {
      const pre = SCI_FI_PREFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      const base = SCI_FI_SUFFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      const num = Math.floor(rng() * 90) + 10;
      baseName = `${pre}_${base}${num}`;
      break;
    }
    case 4: {
      const base = SCI_FI_PREFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      const slang = rng() > 0.5 ? 'TTV' : 'Pro';
      baseName = `${base}_${slang}`;
      break;
    }
    default: {
      const base = REAL_NAMES[Math.floor(rng() * REAL_NAMES.length)];
      const role = SCI_FI_SUFFIXES[Math.floor(rng() * SCI_FI_PREFIXES.length)];
      baseName = `${base}${role}`;
      break;
    }
  }

  return clan ? `${clan}${baseName}` : baseName;
};

// ============================================================================
// 1.5 GENERATORE GHOST BOT SINGOLO (BILANCIAMENTO CANALE & HARDPOINT)
// ============================================================================
export const generateGhostProfile = (playerLevel = 1, playerTrophies = 0, channel = 'training') => {
  const botNick = generateProceduralName();

  let botLevel = Number(playerLevel) || 1;
  let botTrophies = 0;

  if (channel === 'elite') {
    botLevel = Math.max(80, Math.min(100, (Number(playerLevel) || 80) + (Math.floor(Math.random() * 5) - 2)));
    botTrophies = Math.max(100, Number(playerTrophies || 100) + (Math.floor(Math.random() * 80) - 40));
  } else {
    botLevel = Number(playerLevel) || 1;
  }

  const poolDecks = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'scorpio',
    'planet_char_1', 'planet_char_2', 'planet_char_6', 'planet_char_15', 'planet_char_20'
  ];
  const botDeck = poolDecks[Math.floor(Math.random() * poolDecks.length)];
  const botPilot = POOL_PILOTS[Math.floor(Math.random() * POOL_PILOTS.length)];

  let botDeckLevel = 1;
  if (botLevel >= 66) botDeckLevel = Math.min(9, Math.floor((botLevel - 65) / 5) + 7);
  else if (botLevel >= 31) botDeckLevel = Math.min(6, Math.floor((botLevel - 30) / 6) + 4);
  else botDeckLevel = Math.min(3, Math.max(1, Math.floor(botLevel / 10) + 1));

  return {
    id: `ghost_${Math.random().toString(36).substring(2, 9)}`,
    nickname: botNick,
    level: botLevel,
    deckLevel: botDeckLevel,
    trophies: botTrophies,
    deck: botDeck,
    ability: botDeck,
    pilot: botPilot,
    channel,
    equippedWeapons: ['wp_gatling', 'wp_xbow', 'wp_thunderstrike', 'wp_orbital_cannon'],
    weaponsLevels: {
      wp_gatling: botDeckLevel,
      wp_xbow: botDeckLevel,
      wp_thunderstrike: botDeckLevel,
      wp_orbital_cannon: botDeckLevel
    },
    isBot: true
  };
};

// ============================================================================
// 1.6 CLASSIFICA SETTIMANALE PERSISTENTE CON 500 PILOTI & SIMULAZIONE GIORNALIERA
// ============================================================================
const STORAGE_LEADERBOARD_KEY = 'eclissi_persistent_leaderboard';

// Ogni client ricostruisce gli stessi bot dalla chiave settimana e dal giorno di Roma.
// Una vecchia classifica casuale nel localStorage non prevale sui dati condivisi.
const competitionRomeDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(date);

const mondayOfWeek = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

export const getPersistentLeaderboardData = (currentWeekKey, dateStr = competitionRomeDate()) => {
  if (!COMPETITIVE_BOOTSTRAP.enabled) return [];
  const monday = mondayOfWeek(dateStr);
  let state = generateNewWeeklyRoster(currentWeekKey, monday);
  for (let day = 1; day <= 6; day++) {
    const d = new Date(`${monday}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + day);
    const activeDate = d.toISOString().slice(0, 10);
    if (activeDate > dateStr) break;
    state = { ...state, pilots: simulateDailyLeaderboardGrowth(state, activeDate), lastSimulatedDate: activeDate };
  }
  // Preserviamo il formato per verifiche offline e compatibilità col vecchio archivio.
  try { localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(state)); } catch (_) {}
  return state.pilots;
};

function generateNewWeeklyRoster(currentWeekKey, monday) {
  const poolDecks = [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio',
    'sagittarius', 'capricorn', 'aquarius', 'pisces', 'planet_char_1', 'planet_char_2',
    'planet_char_6', 'planet_char_9', 'planet_char_15', 'planet_char_20'
  ];

  const totalPilots = COMPETITIVE_BOOTSTRAP.eliteRosterSize;
  const rng = seededCompetitionRng(`elite_roster_${currentWeekKey}`);
  const pilots = [];
  const usedNames = new Set();

  for (let i = 0; i < totalPilots; i++) {
    let name = generateProceduralName(rng);
    while (usedNames.has(name)) {
      name = generateProceduralName(rng);
    }
    usedNames.add(name);

    let minT, maxT, minL, maxL;
    if (i < 20) {
      minT = 850; maxT = 1200; minL = 92; maxL = 100;
    } else if (i < 100) {
      minT = 600; maxT = 849; minL = 86; maxL = 94;
    } else if (i < 300) {
      minT = 350; maxT = 599; minL = 82; maxL = 88;
    } else {
      minT = 100; maxT = 349; minL = 80; maxL = 84;
    }

    const trophies = Math.floor(rng() * (maxT - minT + 1)) + minT;
    const level = Math.floor(rng() * (maxL - minL + 1)) + minL;
    const wins = Math.max(1, Math.floor(trophies / 22));
    const losses = Math.max(0, Math.floor(wins * 0.45));

    pilots.push({
      id: `pilot_${i + 1}`,
      nickname: name,
      level,
      deck: poolDecks[i % poolDecks.length],
      pilot: POOL_PILOTS[i % POOL_PILOTS.length],
      trophies,
      wins,
      losses,
      isBot: true
    });
  }

  pilots.sort((a, b) => b.trophies - a.trophies);

  const payload = {
    weekKey: currentWeekKey,
    version: 2,
    lastSimulatedDate: monday,
    pilots
  };

  return payload;
}

function simulateDailyLeaderboardGrowth(stored, todayStr) {
  if (stored.lastSimulatedDate === todayStr) {
    return stored.pilots;
  }

  const rng = seededCompetitionRng(`elite_growth_${stored.weekKey}_${todayStr}`);
  const updatedPilots = stored.pilots.map((pilot, idx) => {
    let delta = 0;
    if (idx < 50) {
      delta = Math.floor(rng() * 70) + 70;
    } else if (idx < 250) {
      delta = Math.floor(rng() * 60) + 30;
    } else {
      delta = Math.floor(rng() * 50) - 20;
    }

    const nextTrophies = Math.max(100, pilot.trophies + delta);
    const extraWins = delta > 0 ? Math.floor(delta / 22) : 0;
    const extraLosses = delta < 0 ? Math.abs(Math.floor(delta / 10)) : 1;

    return {
      ...pilot,
      trophies: nextTrophies,
      wins: pilot.wins + extraWins,
      losses: pilot.losses + extraLosses,
      pilot: pilot.pilot || POOL_PILOTS[idx % POOL_PILOTS.length]
    };
  });

  updatedPilots.sort((a, b) => b.trophies - a.trophies);

  const payload = {
    ...stored,
    lastSimulatedDate: todayStr,
    pilots: updatedPilots
  };

  return updatedPilots;
}

// ============================================================================
// 2.0 PVP SIMULATO OFFLINE — matchmaking e avversario IA
// ============================================================================
export function MatchmakingLobby({
  myNickname, myLevel, myTrophies, myPilot='pilot_com_1',
  pvpChannel='training', selectedMode='classic', onMatchFound, onCancel
}) {
  const [searchTime, setSearchTime] = useState(0);
  // Non riavviare l'abbinamento al re-render della schermata principale.
  const foundCallback = useRef(onMatchFound);
  foundCallback.current = onMatchFound;
  const cancelCallback = useRef(onCancel);
  cancelCallback.current = onCancel;
  useEffect(() => {
    const clock = setInterval(() => setSearchTime(t => t + 1), 1000);
    const waiting = setTimeout(() => {
      const opponent = generateGhostProfile(myLevel, myTrophies, pvpChannel);
      const activeMode = pvpChannel === 'elite' ? getDailyPvPMode().mode : selectedMode;
      foundCallback.current({
        roomId: `room_pvp_bot_${Date.now()}`,
        myPlayerId: `offline_${Date.now()}`,
        myPilot, opponent, isHost: true,
        isGhostMatch: true, isOnlinePoker: false,
        channel: pvpChannel, mode: activeMode,
      });
    }, COMPETITIVE_BOOTSTRAP.realOpponentSearchMs);
    return () => {clearInterval(clock); clearTimeout(waiting);};
  }, [myLevel, myTrophies, myPilot, pvpChannel, selectedMode]);
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(2,4,12,.96)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:30000,padding:'1rem'}}>
      <div className="cyber-panel" style={{padding:'1.75rem',maxWidth:400,width:'100%',textAlign:'center',border:'2px solid #00f2fe'}}>
        <div style={{fontSize:11,color:'#facc15',fontWeight:900}}>ARENA DI SIMULAZIONE · OFFLINE</div>
        <h3 style={{color:'#00f2fe',fontWeight:900}}>{pvpChannel==='elite'?'Lega Élite Simulata':'Canale Addestramento'}</h3>
        <div className="radar-ring" style={{width:80,height:80,margin:'20px auto'}} />
        <p>Preparazione avversario IA... ({searchTime}s)</p>
        <p style={{fontSize:12,color:'#94a3b8'}}>Non stai affrontando una persona reale. La partita e i risultati sono locali.</p>
        <button className="cyber-btn" onClick={()=>cancelCallback.current?.()} style={{width:'100%',padding:10,borderColor:'#ef4444'}}>Annulla</button>
      </div>
    </div>
  );
}

// ============================================================================
// 3.0 MODALE CLASSIFICA SETTIMANALE ÉLITE
// ============================================================================
export function WeeklyLeaderboardModal({ myNickname, myTrophies, myPlayerId, myLevel, onClose }) {
  const currentWeekKey = getWeeklyLeaderboardKey();
  const [pilots] = useState(() => getPersistentLeaderboardData(currentWeekKey));
  const dailyMode = getDailyPvPMode();
  const effectiveMyLevel = Number(myLevel) > 1
    ? Number(myLevel)
    : Number(localStorage.getItem('eclissi_level') || 1);
  const combinedList = [
    ...pilots.filter(p=>p.id !== myPlayerId),
    {id:myPlayerId,nickname:myNickname,trophies:myTrophies,isPlayer:true,
      level:effectiveMyLevel,wins:Math.floor(myTrophies/22),losses:2}
  ].sort((a,b)=>b.trophies-a.trophies);
  const displayedTrophies=myTrophies;
  const verifiedPodium=new Map(); // Nessun premio di classifica online in modalita' simulata.

  const playerRankIndex = combinedList.findIndex(p => p.isPlayer);
  const myRank = playerRankIndex + 1;

  const top10 = combinedList.slice(0, 10);
  const showAroundMe = myRank > 10;
  const aroundMe = showAroundMe 
    ? combinedList.slice(Math.max(10, playerRankIndex - 2), Math.min(combinedList.length, playerRankIndex + 3))
    : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 25000, padding: '1rem' }}>
      <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '520px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1.5px solid #facc15', boxShadow: '0 0 45px rgba(250, 204, 21, 0.45)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.4rem', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ color: '#fde047', margin: 0, fontWeight: '900', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SciFiIcon name="trophy" size={20} color="#fde047" /> Classifica Élite Simulata (500 piloti IA)
            </h3>
            <div style={{ fontSize: '0.62rem', color: '#cbd5e1' }}>
              I tuoi Trofei: <strong style={{ color: '#facc15' }}>{displayedTrophies} 🏆</strong> | Posizione: <strong style={{ color: '#00f2fe' }}>#{myRank}</strong>
            </div>
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '0.2rem 0.5rem', background: '#ef4444', borderColor: '#f87171' }}>X</button>
        </div>

        <div style={{color:'#67e8f9',fontSize:'0.71rem',marginBottom:8}}>Classifica offline di simulazione: non rappresenta giocatori reali.</div>
        <div style={{ background: 'rgba(234, 179, 8, 0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #facc15', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.62rem', color: '#fde047', fontWeight: 'bold' }}>MODALITÀ ÉLITE DI OGGI:</div>
          <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '900' }}>{dailyMode.title}</div>
          <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>{dailyMode.desc}</div>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '0.65rem', padding: '0 0.3rem 0.4rem' }}>Tutti gli avversari in classifica sono simulati. I trofei ottenuti sono salvati solo su questo dispositivo.</div>
        <div style={{ color: '#fbbf24', fontSize: '0.64rem', padding: '0 0.3rem 0.45rem' }}>Nessun premio podio mondiale: le ricompense dei duelli contro IA restano quelle locali previste dal gioco.</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: '900', textTransform: 'uppercase' }}>
            ★ Top 10 Lega Élite Simulata
          </div>
          {top10.map((pilot, idx) => {
            const isMe = pilot.isPlayer;
            const rankNum = idx + 1;
            const eligibleRank = verifiedPodium.get(pilot.id);
            const rankBadge = `${rankNum}°` + (eligibleRank ? ` · ${[100,50,25][eligibleRank-1]} 💎* (reali)` : '');

            return (
              <div
                key={pilot.id || idx}
                className="cyber-panel"
                style={{
                  padding: '0.45rem 0.65rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isMe ? 'rgba(8, 145, 178, 0.45)' : (rankNum <= 3 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(15, 23, 42, 0.8)'),
                  border: isMe ? '1.5px solid #00f2fe' : (rankNum <= 3 ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)')
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '900', color: rankNum <= 3 ? '#fde047' : '#94a3b8' }}>
                    {rankBadge}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: isMe ? '#00f2fe' : '#fff' }}>
                      {pilot.nickname} {isMe && '(Tu)'}
                    </div>
                    <div style={{ fontSize: '0.58rem', color: '#cbd5e1' }}>Liv. {pilot.level} • {pilot.wins}V / {pilot.losses}P</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '900', color: '#facc15' }}>
                  {pilot.trophies} 🏆
                </div>
              </div>
            );
          })}

          {showAroundMe && (
            <>
              <div style={{ fontSize: '0.65rem', color: '#00f2fe', fontWeight: '900', textTransform: 'uppercase', marginTop: '0.5rem' }}>
                ↕ Intorno alla tua posizione (#{myRank})
              </div>
              {aroundMe.map((pilot, idx) => {
                const isMe = pilot.isPlayer;
                const pos = Math.max(10, playerRankIndex - 2) + idx + 1;
                const eligibleRank = verifiedPodium.get(pilot.id);
                return (
                  <div
                    key={pilot.id || `around_${idx}`}
                    className="cyber-panel"
                    style={{
                      padding: '0.45rem 0.65rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isMe ? 'rgba(8, 145, 178, 0.45)' : 'rgba(15, 23, 42, 0.8)',
                      border: isMe ? '1.5px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '900', color: isMe ? '#00f2fe' : '#94a3b8' }}>
                        #{pos}{eligibleRank ? ` · ${[100,50,25][eligibleRank-1]} 💎* (reali)` : ''}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: isMe ? '#00f2fe' : '#fff' }}>
                          {pilot.nickname} {isMe && '(Tu)'}
                        </div>
                        <div style={{ fontSize: '0.58rem', color: '#cbd5e1' }}>Liv. {pilot.level} • {pilot.wins}V / {pilot.losses}P</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '900', color: isMe ? '#00f2fe' : '#facc15' }}>
                      {pilot.trophies} 🏆
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchmakingLobby;
