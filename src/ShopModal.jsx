import React, { useState, useEffect } from 'react';
import FleetCollectionWorkshop from './FleetCollectionWorkshop.jsx';
import { playSound } from './audio';
import {ShipShopPanel} from './ShipCollectionPanels.jsx';

const SHOP_TABS = [
  { id: 'ships', label: 'Navi', icon: '🛸' },
  { id: 'decks', label: 'Carte e mazzi', icon: '🃏' },
  { id: 'resources', label: 'Risorse', icon: '💎' }
];

export default function ShopModal({
  initialTab = 'ships',
  // Risorse & Store Packages
  onUpgradeShip,
  stardust = 0,
  diamonds = 0,
  voidCrystals = 0,
  primordialMatter = 0,
  ether = 0,
  onBuyStorePackage,
  // Navigazione
  fromLoadout = false,
  onBackToLoadout,
  onCloseToHome
}) {
  const requestedTab = initialTab === 'abilities' ? 'decks' : (initialTab || 'ships');
  const openingTab = SHOP_TABS.some(tab => tab.id === requestedTab) ? requestedTab : 'ships';
  const [activeTab, setActiveTab] = useState(openingTab);
  useEffect(() => {
    setActiveTab(openingTab);
  }, [openingTab]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 4, 12, 0.98)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 35000, padding: 'clamp(4px, 1vh, 8px)', boxSizing: 'border-box' }}>
      <div className="cyber-panel" style={{ padding: 'clamp(6px, 1.2vh, 10px)', maxWidth: '900px', width: '100%', height: '98dvh', maxHeight: '98dvh', display: 'flex', flexDirection: 'column', border: '2px solid #00f2fe', boxShadow: '0 0 40px rgba(0, 242, 254, 0.55)', position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
        
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
          
          {/* CARTE DELLA NUOVA FLOTTA — usa la stessa collezione del duello 3D. */}
          {activeTab === 'decks' && <FleetCollectionWorkshop/>}

          {/* RISORSE */}
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

    </div>
  );
}
