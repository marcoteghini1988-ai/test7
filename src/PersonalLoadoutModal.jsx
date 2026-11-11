import React from 'react';
import {getPilotById} from './pilotsSystem';
import {commanderAbility} from './commanderAbilities.js';
import {OFFICIAL_NUMERIC_BACK_IDS,officialNumericDeckBackName,officialNumericDeckBackPath} from './officialDeckBackArt.js';
import {ShipHangarPanel} from './ShipCollectionPanels.jsx';

export default function PersonalLoadoutModal({
  nickname = 'Pilota',
  level = 1,
  xp = 0,
  xpThreshold = 100,
  // Le 8 Risorse
  credits = 0,
  lives = 3,
  maxLives = 3,
  stardust = 0,
  walletCap = 1500,
  diamonds = 0,
  ether = 0,
  voidCrystals = 0,
  primordialMatter = 0,
  tankConfig = { maxVoid: 4, maxPrimordial: 2 },
  scannerSeconds = 0,
  // Estrattore di Etere
  isEtherUnlocked = false,
  extractorLevel = 1,
  extractorStored = 0,
  extractorConfig,
  nextExtractorConfig,
  onHarvestEther,
  onUpgradeExtractor,
  // Comandante e mazzo numerico
  selectedPilot = 'pilot_com_1',
  pilotInventory = {},
  selectedDeck = 'neutral_starter',
  currentDeckObj,
  deckInventory = {},
  // Navigazione Shop & Chiusura
  onOpenShopTab,
  onClose
}) {
  const currentPilotObj = getPilotById(selectedPilot) || {};
  const commander = commanderAbility(selectedPilot);
  const pilotLvl = pilotInventory?.[selectedPilot]?.level || 1;
  const deckReady = selectedDeck === 'neutral_starter' ||
    (OFFICIAL_NUMERIC_BACK_IDS.includes(selectedDeck) && deckInventory?.[selectedDeck]?.unlocked === true);
  const deckColor = deckReady ? currentDeckObj?.color || '#38bdf8' : '#38bdf8';
  const deckLvl = deckInventory?.[selectedDeck]?.level || 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.97)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 31000, padding: 'clamp(4px, 1.5vmin, 12px)' }}>
      <div className="cyber-panel" style={{ padding: '0.85rem 1rem', maxWidth: '580px', width: '100%', maxHeight: '94dvh', display: 'flex', flexDirection: 'column', border: '2px solid #00f2fe', boxShadow: '0 0 50px rgba(0, 242, 254, 0.55)', boxSizing: 'border-box' }}>
        
        {/* Intestazione */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 242, 254, 0.3)', paddingBottom: '0.35rem', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.58rem', color: '#facc15', fontWeight: 900, textTransform: 'uppercase' }}>
              CENTRO DI COMANDO • SCHEDA & ASSETTO
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 900 }}>
              {nickname} <span style={{ color: '#00f2fe', fontSize: '0.8rem' }}>(Liv. {level})</span>
            </h3>
          </div>
          <button className="cyber-btn" onClick={onClose} style={{ padding: '0.2rem 0.55rem', background: '#ef4444', borderColor: '#f87171', fontWeight: 900 }}>✕</button>
        </div>

        {/* 1. CRUSCOTTO DELLE 8 RISORSE */}
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', padding: '0.4rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '0.55rem' }}>
          <div style={{ fontSize: '0.52rem', color: '#facc15', fontWeight: 900, marginBottom: '2px', textTransform: 'uppercase' }}>
            STATO RISORSE GLOBALI
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '0.62rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              <span style={{ color: '#00f2fe' }}>⚡ Crediti:</span> <strong>{credits}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <span style={{ color: '#fca5a5' }}>💔 Vite:</span> <strong>{lives}/{maxLives}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
              <span style={{ color: '#fef08a' }}>🌟 Polvere:</span> <strong>{stardust}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
              <span style={{ color: '#f5d0fe' }}>💎 Diamanti:</span> <strong>{diamonds}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(232, 121, 249, 0.3)' }}>
              <span style={{ color: '#e879f9' }}>🔮 Etere:</span> <strong>{ether}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              <span style={{ color: '#38bdf8' }}>💠 Vuoto:</span> <strong>{voidCrystals}/{tankConfig?.maxVoid || 4}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(217, 70, 239, 0.3)' }}>
              <span style={{ color: '#d946ef' }}>🟣 Materia:</span> <strong>{primordialMatter}/{tankConfig?.maxPrimordial || 2}</strong>
            </div>
            <div style={{ background: 'rgba(2, 6, 23, 0.8)', padding: '2px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              <span style={{ color: '#7dd3fc' }}>⏱️ Scanner:</span> <strong>{scannerSeconds}s</strong>
            </div>
          </div>
        </div>

        {/* CONTENUTO SCORREVOLE */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.55rem', paddingRight: '0.2rem' }}>
          <ShipHangarPanel onOpenCatalog={() => onOpenShopTab('ships')}/>
          
          {/* 2. SCHEDA PILOTA & STATUS */}
          <div style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.25), rgba(15, 23, 42, 0.85))', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #00f2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#fff' }}>Grado Pilota: Livello {level}</div>
              <div style={{ fontSize: '0.6rem', color: '#cbd5e1', marginTop: '2px' }}>
                XP: <strong>{xp} / {xpThreshold}</strong> | Fascia {level >= 66 ? '3' : level >= 31 ? '2' : '1'}
              </div>
            </div>
          </div>

          {/* 3. REATTORE ESTRATTORE ETERE */}
          {isEtherUnlocked && (
            <div className="cyber-panel" style={{ padding: '0.5rem 0.75rem', border: '1.5px solid #e879f9', background: 'rgba(88, 28, 135, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.58rem', color: '#f0abfc', fontWeight: 900 }}>🔮 {extractorConfig?.name || 'Estrattore d\'Etere'} (Liv.{extractorLevel}/4)</div>
                <div style={{ fontSize: '0.65rem', color: '#fff', fontWeight: 'bold' }}>
                  Accumulo: <span style={{ color: '#e879f9' }}>{extractorStored} / {extractorConfig?.maxStore || 4} 🔮</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  disabled={extractorStored <= 0}
                  onClick={onHarvestEther}
                  className="cyber-btn cyber-btn-ether"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.62rem', fontWeight: 900 }}
                >
                  Raccogli ({extractorStored} 🔮)
                </button>
                {nextExtractorConfig && (
                  <button
                    onClick={onUpgradeExtractor}
                    className="cyber-btn"
                    style={{ padding: '0.3rem 0.5rem', fontSize: '0.6rem', borderColor: '#e879f9' }}
                  >
                    Migliora ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. ASSETTO OPERATIVO PLANCIA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ fontSize: '0.55rem', color: '#facc15', fontWeight: 900, textTransform: 'uppercase' }}>
              ASSETTO OPERATIVO PLANCIA
            </div>

            {/* Pilota */}
            <div className="cyber-panel" style={{ padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${currentPilotObj.color || '#00f2fe'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.52rem', color: '#facc15', fontWeight: 800 }}>COMANDANTE</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: currentPilotObj.color || '#00f2fe' }}>{commander?.name || 'Scegli un comandante'}</div>
                  <div style={{ fontSize: '0.58rem', color: '#cbd5e1' }}>Grado {pilotLvl}/5 • {commander?.role || 'Flotta'}</div>
                </div>
              </div>
              <button onClick={() => onOpenShopTab('characters')} className="cyber-btn cyber-btn-primary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.62rem', fontWeight: 900 }}>
                GESTISCI ➔
              </button>
            </div>

            {/* Mazzo Tattico */}
            <div className="cyber-panel" style={{ padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${deckColor}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {deckReady && <img src={officialNumericDeckBackPath(selectedDeck)} alt="" width={28} height={42} />}
                <div>
                  <div style={{ fontSize: '0.52rem', color: '#facc15', fontWeight: 800 }}>MAZZO NUMERICO</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: currentDeckObj?.color || '#fff' }}>{deckReady ? officialNumericDeckBackName(selectedDeck) : 'Scegli un mazzo numerico'}</div>
                  {deckReady && <div style={{ fontSize: '0.58rem', color: '#cbd5e1' }}>Livello {deckLvl}</div>}
                </div>
              </div>
              <button onClick={() => onOpenShopTab('decks')} className="cyber-btn cyber-btn-warning" style={{ padding: '0.3rem 0.55rem', fontSize: '0.62rem', fontWeight: 900 }}>
                GESTISCI ➔
              </button>
            </div>

          </div>

          {/* 5. ACCESSO RAPIDO SHOP & RIFORNIMENTI */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '0.2rem' }}>
            <button
              onClick={() => onOpenShopTab('resources')}
              className="cyber-btn cyber-btn-warning"
              style={{ flex: 1, padding: '0.6rem', fontSize: '0.72rem', fontWeight: 900 }}
            >
              🛒 Rifornimenti
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
