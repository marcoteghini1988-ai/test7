import React, { useState, useEffect } from 'react';
import { OFFICIAL_NUMERIC_BACK_IDS, officialNumericDeckBackName, officialNumericDeckBackPath } from './officialDeckBackArt.js';
import { TACTICAL_MODULE_CARDS, moduleCardType } from './tacticalEquipmentCards.js';
import { fleetAdvancedCardProfile } from './fleetSpecialProfiles.js';
import { officialSpecialArtPath } from './officialSpecialCardArt.js';
import { playSound } from './audio';
import {activeNumericBossAbilities,numericBossDeck} from './bossNumericDecks.js';
import {ShipShopPanel} from './ShipCollectionPanels.jsx';

const currentDeckPassives=(id,level)=>numericBossDeck(id)?activeNumericBossAbilities(id,level).map(x=>x.unlocked?x.name+' · Grado '+x.grade+'/3 · '+x.description.replace('%',x.value+'%').replace('in secondi',': '+x.value+' secondi'):x.name+' · sblocco L'+x.unlockAt).join(' | '):null;

const normalizeRarity = (r) => {
  if (!r) return 'Comune';
  const low = String(r).toLowerCase();
  if (low === 'common' || low === 'comune') return 'Comune';
  if (low === 'rare' || low === 'rara') return 'Rara';
  if (low === 'super_rare' || low === 'super rara' || low === 's.rari' || low === 's.rara' || low === 'epica' || low === 'epic') return 'Epica';
  if (low === 'legendary' || low === 'leggendaria' || low === 'legg.') return 'Leggendaria';
  return r;
};

// Matrice costi e requisiti unificata per Mazzi e Moduli (Fasce 1, 2, 3)
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

const UPGRADE_PILOT_REQS = Object.freeze({
  1: 1, 2: 12, 3: 25, 4: 35, 5: 48, 6: 60, 7: 70, 8: 82, 9: 95
});

const SHOP_TABS = [
  { id: 'ships', label: 'Navi', icon: '🛸' },
  { id: 'decks', label: 'Mazzi', icon: '🃏' },
  { id: 'abilities', label: 'Moduli', icon: '⚡' },
  { id: 'resources', label: 'Risorse', icon: '💎' }
];

export default function ShopModal({
  initialTab = 'ships',
  // Mazzi
  selectedDeck,
  deckInventory = {},
  allDecks = [],
  onSelectDeck,
  onUpgradeDeck,
  // Moduli
  abilities = {},
  allAbilities = [],
  onUnlockAbility,
  onUpgradeAbility,
  // Risorse & Store Packages
  onUpgradeShip,
  stardust = 0,
  diamonds = 0,
  voidCrystals = 0,
  primordialMatter = 0,
  ether = 0,
  level = 1,
  onBuyStorePackage,
  // Navigazione
  fromLoadout = false,
  onBackToLoadout,
  onCloseToHome
}) {
  const requestedTab = initialTab || 'ships';
  const openingTab = SHOP_TABS.some(tab => tab.id === requestedTab) ? requestedTab : 'ships';
  const [activeTab, setActiveTab] = useState(openingTab);
  useEffect(() => {
    setActiveTab(openingTab);
  }, [openingTab]);

  // FILTRI DI RARITÀ
  const [deckRarityFilter, setDeckRarityFilter] = useState('all');
  const [abilityRarityFilter, setAbilityRarityFilter] = useState('all');

  // STATI DI ISPEZIONE E FEEDBACK
  const [inspectedItem, setInspectedItem] = useState(null);
  const [upgradeConfirm, setUpgradeConfirm] = useState(null);
  const [dopamineBurst, setDopamineBurst] = useState(null);
  const [localHint, setLocalHint] = useState(null);

  const showHint = (msg) => {
    setLocalHint(msg);
    setTimeout(() => setLocalHint(null), 2400);
  };

  const rarityFilterBar = [
    { id: 'all', name: 'Tutti', color: '#00f2fe' },
    { id: 'Comune', name: 'Comuni', color: '#10b981' },
    { id: 'Rara', name: 'Rari', color: '#38bdf8' },
    { id: 'Epica', name: 'Epici', color: '#c084fc' },
    { id: 'Leggendaria', name: 'Legg.', color: '#facc15' }
  ];

  const renderRarityFilter = (currentFilter, setFilter) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '3px', width: '100%', marginBottom: '0.5rem', flexShrink: 0, boxSizing: 'border-box' }}>
      {rarityFilterBar.map(cat => {
        const isSelected = currentFilter === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => {
              try { playSound('click'); } catch (_) {}
              setFilter(cat.id);
            }}
            className="cyber-btn"
            style={{
              padding: 'clamp(2px, 0.6vh, 4px) 1px',
              fontSize: 'clamp(0.55rem, 1.6vw, 0.68rem)',
              fontWeight: 900,
              width: '100%',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              borderRadius: '5px',
              background: isSelected ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' : 'rgba(15, 23, 42, 0.85)',
              borderColor: isSelected ? cat.color : 'rgba(255, 255, 255, 0.15)',
              color: isSelected ? '#fff' : '#cbd5e1',
              boxShadow: isSelected ? `0 0 8px ${cat.color}88` : 'none'
            }}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );

  const triggerDopamineCelebration = (title, subtitle) => {
    try { playSound('epic_item_trigger'); } catch (_) {}
    try { setTimeout(() => playSound('win'), 250); } catch (_) {}
    setDopamineBurst({ title, subtitle });
    setTimeout(() => setDopamineBurst(null), 2200);
  };

  const executeConfirmedUpgrade = () => {
    if (!upgradeConfirm) return;
    const { type, id, nextLvl, cost, title } = upgradeConfirm;

    if (type === 'deck') {
      if (typeof onUpgradeDeck === 'function') onUpgradeDeck(id);
      triggerDopamineCelebration(title, `INVIATO AL CANTIERE (LIV. ${nextLvl})!`);
    } else if (type === 'ability') {
      // Un callback rifiutato (risorse, livello, cantiere pieno) non
      // deve mostrare una falsa conferma di acquisto.
      const started = typeof onUpgradeAbility === 'function' && onUpgradeAbility(id) === true;
      if (started) triggerDopamineCelebration(title, `INVIATO AL CANTIERE (LIV. ${nextLvl})!`);
      else showHint('Potenziamento non avviato: verifica requisiti e risorse.');
    }
    setUpgradeConfirm(null);
  };

  const inspectedModule = inspectedItem?.type === 'ability'
    ? TACTICAL_MODULE_CARDS[moduleCardType(inspectedItem.data.id)]
    : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35000, padding: 'clamp(4px, 1vh, 8px)', boxSizing: 'border-box' }}>
      <div className="cyber-panel" style={{ padding: 'clamp(6px, 1.2vh, 10px)', maxWidth: '900px', width: '100%', height: '98dvh', maxHeight: '98dvh', display: 'flex', flexDirection: 'column', border: '2px solid #00f2fe', boxShadow: '0 0 40px rgba(0, 242, 254, 0.55)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
        
        {/* TOAST HINT FLUTTUANTE */}
        {localHint && (
          <div className="cyber-panel" style={{ position: 'absolute', top: '38px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(2, 6, 23, 0.96)', border: '1.5px solid #00f2fe', padding: '4px 14px', borderRadius: '6px', zIndex: 70000, fontSize: 'clamp(0.65rem, 1.8vw, 0.78rem)', color: '#fff', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(0, 242, 254, 0.6)' }}>
            {localHint}
          </div>
        )}

        {/* BARRA SUPERIORE */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.14)', paddingBottom: '3px', marginBottom: '4px', flexShrink: 0, zIndex: 12, position: 'relative', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {fromLoadout && (
              <button onClick={onBackToLoadout} className="cyber-btn cyber-btn-primary" style={{ padding: '2px 5px', fontSize: '0.62rem', fontWeight: 900 }}>
                ← Area
              </button>
            )}
            <h3 style={{ margin: 0, color: '#00f2fe', fontSize: 'clamp(0.85rem, 2.4vw, 1.15rem)', fontWeight: 900, textShadow: '0 0 10px rgba(0, 242, 254, 0.6)' }}>
              Bazar Galattico
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ display: 'flex', gap: '4px', fontSize: 'clamp(0.55rem, 1.5vw, 0.65rem)', background: 'rgba(2, 6, 23, 0.85)', padding: '2px 5px', borderRadius: '5px', border: '1px solid rgba(0, 242, 254, 0.35)', fontWeight: 'bold' }}>
              <span style={{ color: '#facc15' }}>🌟{stardust}</span>
              <span style={{ color: '#f5d0fe' }}>💎{diamonds}</span>
              <span style={{ color: '#e879f9' }}>🔮{ether}</span>
              <span style={{ color: '#38bdf8' }}>💠{voidCrystals}</span>
              <span style={{ color: '#d946ef' }}>🟣{primordialMatter}</span>
            </div>
            <button onClick={onCloseToHome} className="cyber-btn" style={{ padding: '2px 6px', fontSize: '0.65rem', background: '#ef4444', borderColor: '#f87171', fontWeight: 900 }}>
              🏠
            </button>
          </div>
        </div>

        {/* TAB PRINCIPALI */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SHOP_TABS.length}, minmax(0, 1fr))`, gap: '2px', width: '100%', marginBottom: '4px', flexShrink: 0, zIndex: 11, position: 'relative', boxSizing: 'border-box' }}>
          {SHOP_TABS.map(t => {
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { try { playSound('click'); } catch (_) {} setActiveTab(t.id); }}
                className="cyber-btn"
                style={{
                  padding: 'clamp(3px, 0.8vh, 6px) 1px',
                  width: '100%',
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: isTabActive ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' : 'rgba(15, 23, 42, 0.85)',
                  borderColor: isTabActive ? '#00f2fe' : 'rgba(255,255,255,0.18)',
                  color: isTabActive ? '#fff' : '#cbd5e1',
                  boxShadow: isTabActive ? '0 0 10px rgba(0, 242, 254, 0.5)' : 'none'
                }}
              >
                <span style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', lineHeight: 1 }}>{t.icon}</span>
                <span style={{ fontSize: 'clamp(0.52rem, 1.4vw, 0.68rem)', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', marginTop: '1px' }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTENUTO SCHEDE */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', paddingRight: '2px', position: 'relative', zIndex: 5 }}>
          {activeTab === 'ships' && <ShipShopPanel stardust={stardust} onUpgradeShip={onUpgradeShip}/>}
          
          {/* TAB: MAZZI */}
          {activeTab === 'decks' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {renderRarityFilter(deckRarityFilter, setDeckRarityFilter)}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.65rem' }}>
                {(Array.isArray(allDecks) ? allDecks : []).filter(d => OFFICIAL_NUMERIC_BACK_IDS.includes(d?.id) && (deckRarityFilter === 'all' || normalizeRarity(d.rarity) === deckRarityFilter)).map(deck => {
                  const isStarter = deck.id === 'neutral_starter';
                  const deckData = deckInventory?.[deck.id] || { level: 1, unlocked: isStarter };
                  const isOwned = Boolean(deckData.unlocked);
                  const curLvl = deckData.level || 1;
                  const isEquipped = selectedDeck === deck.id;
                  const maxLvl = numericBossDeck(deck.id)?.maxLevel ?? 1;
                  const nextCostConfig = UNIFIED_UPGRADE_COSTS[curLvl + 1] || null;
                  const reqPilotLvl = UPGRADE_PILOT_REQS[curLvl + 1] || 1;

                  return (
                    <div key={deck.id} className="cyber-panel" style={{ padding: '0.65rem', border: isEquipped ? '2px solid #00f2fe' : (isOwned ? `1.5px solid ${deck.color}` : '1px dashed rgba(255,255,255,0.2)'), display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.55rem', background: deck.color || '#94a3b8', color: '#020617', padding: '1px 5px', borderRadius: '3px', fontWeight: 900, textTransform: 'uppercase' }}>
                            {deck.rarity || 'Comune'}
                          </span>
                          {isOwned && <span style={{ fontSize: '0.58rem', color: '#10b981', fontWeight: 900 }}>Liv. {curLvl}/{maxLvl}</span>}
                        </div>

                        <div 
                          onClick={() => setInspectedItem({ type: 'deck', data: deck, curLvl, isUnlocked: isOwned, isEquipped })}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', margin: '3px 0' }}
                          title="Tocca per ingrandire"
                        >
                          <img src={officialNumericDeckBackPath(deck.id)} alt={officialNumericDeckBackName(deck.id)} width={50} height={75} loading="lazy" decoding="async" />
                          <span style={{ fontSize: '0.52rem', color: '#38bdf8', marginTop: '2px', textDecoration: 'underline' }}>
                            🔍 Ingrandisci
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: deck.color, textAlign: 'center' }}>{officialNumericDeckBackName(deck.id)}</div>
                        <div style={{ background: 'rgba(2, 6, 23, 0.75)', padding: '0.4rem', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)', margin: '3px 0', fontSize: '0.62rem', lineHeight: 1.3 }}>
                          <div style={{ color: '#facc15', fontWeight: 900 }}>PASSIVA:</div>
                          <div style={{ color: '#6ee7b7' }}>{currentDeckPassives(deck.id,curLvl) || '52 carte numeriche'}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <button 
                          onClick={() => {
                            if (typeof onSelectDeck === 'function') onSelectDeck(deck.id);
                            if (isOwned) showHint(`✓ Mazzo ${officialNumericDeckBackName(deck.id)} equipaggiato!`);
                          }} 
                          className={`cyber-btn ${isEquipped ? '' : (isOwned ? 'cyber-btn-primary' : 'cyber-btn-warning')}`} 
                          style={{ padding: '0.35rem', fontSize: '0.65rem', fontWeight: 900 }}
                        >
                          {isEquipped ? '✓ IN USO' : isOwned ? 'EQUIPAGGIA' : `Sblocca (${deck.unlockCostDiamonds || 10} 💎)`}
                        </button>

                        {isOwned && !isStarter && curLvl < maxLvl && nextCostConfig && (
                          <button 
                            onClick={() => {
                              try { playSound('click'); } catch (_) {}
                              setUpgradeConfirm({
                                type: 'deck',
                                id: deck.id,
                                title: officialNumericDeckBackName(deck.id),
                                curLvl,
                                nextLvl: curLvl + 1,
                                reqLevel: reqPilotLvl,
                                cost: {
                                  dust: nextCostConfig.dust,
                                  diamonds: 0,
                                  voidCrystals: nextCostConfig.voidCrystals || 0,
                                  primordialMatter: nextCostConfig.primordialMatter || 0
                                },
                                currentBonus: currentDeckPassives(deck.id,curLvl) || '52 carte numeriche',
                                nextBonus: currentDeckPassives(deck.id,curLvl + 1)
                              });
                            }} 
                            className="cyber-btn cyber-btn-warning" 
                            style={{ padding: '0.35rem', fontSize: '0.65rem', fontWeight: 900 }}
                          >
                            ⚡ MIGLIORA A LIV. {curLvl + 1} ➔
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MODULI */}
          {activeTab === 'abilities' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {renderRarityFilter(abilityRarityFilter, setAbilityRarityFilter)}
              <p style={{ margin: '0.25rem 0.5rem 0.55rem', fontSize: '0.65rem', color: '#b6cbdc' }}>
                Dopo lo sblocco, inserisci le Carte Modulo nel Mazzo Speciale dall’Hangar.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.65rem' }}>
                {(Array.isArray(allAbilities) ? allAbilities : []).filter(a => a && TACTICAL_MODULE_CARDS[moduleCardType(a.id)]).filter(a => !['ophiuchus','supreme_eclipse'].includes(a.id) || Boolean(abilities?.[a.id]?.unlocked)).filter(a => abilityRarityFilter === 'all' || normalizeRarity(a.rarity) === abilityRarityFilter).map(ab => {
                  const abData = abilities?.[ab.id] || { level: 1, unlocked: false };
                  const moduleCard = TACTICAL_MODULE_CARDS[moduleCardType(ab.id)];
                  const isOwned = Boolean(abData.unlocked);
                  const curLvl = abData.level || 1;
                  const maxLvl = ab.maxLevel || 3;
                  const nextCostConfig = UNIFIED_UPGRADE_COSTS[curLvl + 1] || null;
                  const reqPilotLvl = UPGRADE_PILOT_REQS[curLvl + 1] || 1;

                  return (
                    <div key={ab.id} className="cyber-panel" style={{ padding: '0.65rem', border: isOwned ? `1.5px solid ${ab.color}` : '1px dashed rgba(255,255,255,0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                          <span style={{ fontSize: '0.55rem', background: ab.color, color: '#020617', padding: '1px 5px', borderRadius: '3px', fontWeight: 900, textTransform: 'uppercase' }}>
                            {ab.rarity || 'Comune'}
                          </span>
                          {isOwned && <span style={{ fontSize: '0.58rem', color: '#10b981', fontWeight: 900 }}>Liv. {curLvl}/{maxLvl}</span>}
                        </div>

                        <div 
                          onClick={() => setInspectedItem({ type: 'ability', data: ab, curLvl })}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', margin: '3px 0' }}
                          title="Tocca per ingrandire"
                        >
                          <img src={officialSpecialArtPath(moduleCard.id)} alt={moduleCard.name} width={50} height={75} loading="lazy" decoding="async" />
                          <span style={{ fontSize: '0.52rem', color: '#38bdf8', marginTop: '2px', textDecoration: 'underline' }}>
                            🔍 Ingrandisci
                          </span>
                        </div>

                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: ab.color, textAlign: 'center' }}>{moduleCard.name}</div>
                        <div style={{ background: 'rgba(2, 6, 23, 0.75)', padding: '0.4rem', borderRadius: '5px', border: '1px solid rgba(255,255,255,0.08)', margin: '3px 0', fontSize: '0.62rem', lineHeight: 1.3 }}>
                          <div style={{ color: '#c084fc', fontWeight: 900 }}>EFFETTO DELLA CARTA</div>
                          <div style={{ color: '#cbd5e1' }}>{fleetAdvancedCardProfile(moduleCard.id)?.description||moduleCard.description}</div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {isOwned ? (
                          <>
                            {curLvl < maxLvl && nextCostConfig && (
                              <button 
                                onClick={() => {
                                  try { playSound('click'); } catch (_) {}
                                  setUpgradeConfirm({
                                    type: 'ability',
                                    id: ab.id,
                                    title: moduleCard.name,
                                    curLvl,
                                    nextLvl: curLvl + 1,
                                    reqLevel: reqPilotLvl,
                                    cost: {
                                      dust: nextCostConfig.dust,
                                      diamonds: 0,
                                      voidCrystals: nextCostConfig.voidCrystals || 0,
                                      primordialMatter: nextCostConfig.primordialMatter || 0
                                    },
                                    currentBonus: 'Carta Modulo al livello ' + curLvl,
                                    nextBonus: 'Carta Modulo al livello ' + (curLvl + 1)
                                  });
                                }} 
                                className="cyber-btn cyber-btn-warning" 
                                style={{ padding: '0.35rem', fontSize: '0.65rem', fontWeight: 900 }}
                              >
                                ⚡ MIGLIORA A LIV. {curLvl + 1} ➔
                              </button>
                            )}
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              if (typeof onUnlockAbility === 'function') onUnlockAbility(ab.id);
                            }} 
                            className="cyber-btn cyber-btn-primary" 
                            style={{ padding: '0.4rem', fontSize: '0.68rem', fontWeight: 900 }}
                          >
                            Sblocca ({ab.unlockCostDust || 150} 🌟)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 7: RISORSE */}
          {activeTab === 'resources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#00f2fe', fontWeight: 900, marginBottom: '3px' }}>⚡ CREDITI ENERGETICI</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    { name: '50 ⚡', amount: 50, cost: 3, type: 'credits' },
                    { name: '120 ⚡', amount: 120, cost: 6, type: 'credits' },
                    { name: '300 ⚡', amount: 300, cost: 12, type: 'credits' }
                  ].map((p, i) => (
                    <button key={i} onClick={() => { if (typeof onBuyStorePackage === 'function') onBuyStorePackage(p); }} className="cyber-btn cyber-btn-primary" style={{ padding: '0.45rem 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>{p.name}</span>
                      <strong style={{ color: '#fde047' }}>{p.cost} 💎</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 900, marginBottom: '3px' }}>💔 VITE & RIANIMAZIONI</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {[
                    { name: '+1 Vita 💔', amount: 1, cost: 3, type: 'lives' },
                    { name: 'Ricarica Max', amount: 3, cost: 8, type: 'lives' }
                  ].map((p, i) => (
                    <button key={i} onClick={() => { if (typeof onBuyStorePackage === 'function') onBuyStorePackage(p); }} className="cyber-btn" style={{ padding: '0.45rem 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderColor: '#f87171' }}>
                      <span>{p.name}</span>
                      <strong style={{ color: '#fde047' }}>{p.cost} 💎</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#facc15', fontWeight: 900, marginBottom: '3px' }}>🌟 POLVERE STELLARE</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    { name: '+300 🌟', amount: 300, cost: 5, type: 'stardust' },
                    { name: '+800 🌟', amount: 800, cost: 10, type: 'stardust' },
                    { name: '+2.000 🌟', amount: 2000, cost: 20, type: 'stardust' }
                  ].map((p, i) => (
                    <button key={i} onClick={() => { if (typeof onBuyStorePackage === 'function') onBuyStorePackage(p); }} className="cyber-btn cyber-btn-warning" style={{ padding: '0.45rem 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>{p.name}</span>
                      <strong style={{ color: '#fff' }}>{p.cost} 💎</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#e879f9', fontWeight: 900, marginBottom: '3px' }}>🔮 ETERE COSMICO</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {[
                    { name: '+3 Etere 🔮', amount: 3, cost: 6, type: 'ether' },
                    { name: '+8 Etere 🔮', amount: 8, cost: 14, type: 'ether' }
                  ].map((p, i) => (
                    <button key={i} onClick={() => { if (typeof onBuyStorePackage === 'function') onBuyStorePackage(p); }} className="cyber-btn cyber-btn-ether" style={{ padding: '0.45rem 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span>{p.name}</span>
                      <strong style={{ color: '#fde047' }}>{p.cost} 💎</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 900, marginBottom: '3px' }}>💠 MINERALI SUBSPAZIALI</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                  {[
                    { name: '+2 Cristalli 💠', amount: 2, cost: 10, type: 'void_crystals' },
                    { name: '+1 Materia 🟣', amount: 1, cost: 15, type: 'primordial_matter' }
                  ].map((p, i) => (
                    <button key={i} onClick={() => { if (typeof onBuyStorePackage === 'function') onBuyStorePackage(p); }} className="cyber-btn" style={{ padding: '0.45rem 2px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderColor: '#00f2fe' }}>
                      <span style={{ color: '#38bdf8' }}>{p.name}</span>
                      <strong style={{ color: '#fde047' }}>{p.cost} 💎</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* OVERLAY ISPEZIONE A SCHERMO INTERO */}
      {inspectedItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(1, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40000, padding: '1rem' }}>
          <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto', border: '2px solid #00f2fe', boxShadow: '0 0 60px rgba(0, 242, 254, 0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <button 
              onClick={() => {
                setInspectedItem(null);
              }} 
              className="cyber-btn" 
              style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', borderColor: '#f87171', padding: '0.3rem 0.7rem', fontWeight: 900 }}
            >
              ✕ Chiudi
            </button>

            {/* ISPEZIONE MAZZO */}
            {inspectedItem.type === 'deck' && (
              <>
                <div style={{ fontSize: '0.7rem', color: inspectedItem.data?.color, fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                  MAZZO NUMERICO • {inspectedItem.data?.rarity || 'COMUNE'}
                </div>
                <h2 style={{ color: inspectedItem.data?.color, margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 900 }}>
                  {officialNumericDeckBackName(inspectedItem.data.id)}
                </h2>
                <div style={{ margin: '8px 0 16px 0' }}>
                  <img src={officialNumericDeckBackPath(inspectedItem.data.id)} alt={officialNumericDeckBackName(inspectedItem.data.id)} width={100} height={150} />
                </div>
                <div style={{ width: '100%', background: 'rgba(15, 23, 42, 0.85)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <div style={{ color: '#facc15', fontWeight: 900, marginBottom: '4px' }}>EFFETTO PASSIVO:</div>
                  {currentDeckPassives(inspectedItem.data.id,inspectedItem.curLvl) || '52 carte numeriche'}
                </div>
              </>
            )}

            {/* ISPEZIONE MODULO */}
            {inspectedModule && (
              <>
                <div style={{ fontSize: '0.7rem', color: inspectedItem.data?.color, fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>
                  CARTA MODULO
                </div>
                <h2 style={{ color: inspectedItem.data?.color, margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: 900 }}>
                  {inspectedModule.name}
                </h2>
                <div style={{ margin: '12px 0 16px 0' }}>
                  <img src={officialSpecialArtPath(inspectedModule.id)} alt={inspectedModule.name} width={100} height={150} />
                </div>
                <div style={{ width: '100%', background: 'rgba(15, 23, 42, 0.85)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <div style={{ color: '#00f2fe', fontWeight: 900, marginBottom: '4px' }}>EFFETTO IN BATTAGLIA</div>
                  {fleetAdvancedCardProfile(inspectedModule.id)?.description||inspectedModule.description}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* MODALE DI CONFERMA MIGLIORAMENTO */}
      {upgradeConfirm && (() => {
        const canAffordDust = stardust >= (upgradeConfirm.cost?.dust || 0);
        const canAffordDiamonds = diamonds >= (upgradeConfirm.cost?.diamonds || 0);
        const canAffordVoid = voidCrystals >= (upgradeConfirm.cost?.voidCrystals || 0);
        const canAffordPrimordial = primordialMatter >= (upgradeConfirm.cost?.primordialMatter || 0);
        const canAffordLevel = !upgradeConfirm.reqLevel || level >= upgradeConfirm.reqLevel;
        const canAffordAll = canAffordDust && canAffordDiamonds && canAffordVoid && canAffordPrimordial && canAffordLevel;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 45000, padding: '1rem' }}>
            <div className="cyber-panel" style={{ padding: '1.25rem', maxWidth: '440px', width: '100%', textAlign: 'center', border: '2px solid #facc15', boxShadow: '0 0 45px rgba(250, 204, 21, 0.55)' }}>
              <div style={{ fontSize: '0.65rem', color: '#facc15', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>
                CONFERMA POTENZIAMENTO TATTICO
              </div>
              <h3 style={{ color: '#fff', margin: '4px 0 10px 0', fontSize: '1.2rem', fontWeight: 900 }}>
                {upgradeConfirm.title}
              </h3>

              <div style={{ background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.25), rgba(15, 23, 42, 0.9))', border: '1.5px solid #00f2fe', borderRadius: '8px', padding: '8px', marginBottom: '10px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Passaggio di Grado:</span>
                  <strong style={{ fontSize: '0.82rem', color: '#facc15' }}>Liv. {upgradeConfirm.curLvl} ➔ Liv. {upgradeConfirm.nextLvl}</strong>
                </div>

                <div style={{ fontSize: '0.65rem', color: '#cbd5e1', marginBottom: '3px' }}>
                  <span style={{ color: '#94a3b8' }}>Attuale:</span> {upgradeConfirm.currentBonus}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 900 }}>
                  <span>Nuovo:</span> {upgradeConfirm.nextBonus}
                </div>
              </div>

              <div style={{ background: 'rgba(2, 6, 23, 0.85)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '12px', textAlign: 'left', fontSize: '0.68rem' }}>
                <div style={{ color: '#facc15', fontWeight: 900, marginBottom: '4px' }}>RISORSE RICHIESTE:</div>
                {upgradeConfirm.cost?.dust > 0 && (
                  <div style={{ color: canAffordDust ? '#6ee7b7' : '#f87171', marginBottom: '2px' }}>
                    • Polvere Stellare: <strong>{upgradeConfirm.cost.dust} 🌟</strong> (Disponibile: {stardust})
                  </div>
                )}
                {upgradeConfirm.cost?.diamonds > 0 && (
                  <div style={{ color: canAffordDiamonds ? '#6ee7b7' : '#f87171', marginBottom: '2px' }}>
                    • Diamanti: <strong>{upgradeConfirm.cost.diamonds} 💎</strong> (Disponibili: {diamonds})
                  </div>
                )}
                {upgradeConfirm.cost?.voidCrystals > 0 && (
                  <div style={{ color: canAffordVoid ? '#6ee7b7' : '#f87171', marginBottom: '2px' }}>
                    • Cristalli di Vuoto: <strong>{upgradeConfirm.cost.voidCrystals} 💠</strong> (Disponibili: {voidCrystals})
                  </div>
                )}
                {upgradeConfirm.cost?.primordialMatter > 0 && (
                  <div style={{ color: canAffordPrimordial ? '#6ee7b7' : '#f87171', marginBottom: '2px' }}>
                    • Materia Primordiale: <strong>{upgradeConfirm.cost.primordialMatter} 🟣</strong> (Disponibile: {primordialMatter})
                  </div>
                )}
                {upgradeConfirm.reqLevel > 1 && (
                  <div style={{ color: canAffordLevel ? '#6ee7b7' : '#f87171', marginTop: '2px' }}>
                    • Requisito Pilota: <strong>Livello {upgradeConfirm.reqLevel}</strong> (Tuo Livello: {level})
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => setUpgradeConfirm(null)} 
                  className="cyber-btn" 
                  style={{ flex: 1, padding: '0.55rem' }}
                >
                  Annulla
                </button>
                <button
                  disabled={!canAffordAll}
                  onClick={executeConfirmedUpgrade}
                  className="cyber-btn cyber-btn-warning"
                  style={{ flex: 1.6, padding: '0.55rem', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  {canAffordAll ? 'CONFERMA MIGLIORA ➔' : 'RISORSE INSUFFICIENTI'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* OVERLAY GRATIFICAZIONE VISIVA */}
      {dopamineBurst && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50000, pointerEvents: 'none' }}>
          <div className="cyber-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '3px solid #facc15', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, rgba(15, 23, 42, 0.98) 75%)', boxShadow: '0 0 60px rgba(250, 204, 21, 0.85), 0 0 30px #fff', animation: 'spotlightPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 20px #facc15)' }}>⚡</div>
            <div style={{ fontSize: '0.8rem', color: '#fde047', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
              OPERAZIONE AVVIATA CON SUCCESSO!
            </div>
            <h1 style={{ color: '#fff', margin: '4px 0', fontSize: '1.5rem', fontWeight: 900, textShadow: '0 0 15px #00f2fe' }}>
              {dopamineBurst.title}
            </h1>
            <div style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 900, letterSpacing: '1px' }}>
              {dopamineBurst.subtitle}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
