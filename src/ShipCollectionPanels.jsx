import React, {useEffect, useState} from 'react';
import {getShipDefinition, PHASE1_SHIPS} from './mathDuelEngine.js';
import {ShipCard} from './ShipPresentation.jsx';
import FleetCollectionWorkshop from './FleetCollectionWorkshop.jsx';
import {SHIP_COLLECTION_KEY, equipShipCards, readShipCollection, updateShipCollection} from './shipCollection.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {shipUpgradeDustCost} from './shipUpgrades.js';
import {getShipProgression,getShipProgressionLevels,shipProgressionProfile} from './fleetNext/progression.js';
import './ShipCollectionPanels.css';

function readCollection() {
  try {
    return readShipCollection();
  } catch {
    return null;
  }
}

function useShipCollection() {
  const [collection, setCollection] = useState(readCollection);
  useEffect(() => {
    function refresh(event) {
      if (event.key === SHIP_COLLECTION_KEY || event.key === null) setCollection(readCollection());
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);
  return [collection, setCollection];
}

export function ShipProgressionDetails({shipId,level=1}){
 const current=getShipProgression(shipId,level);
 const profile=shipProgressionProfile(shipId);
 return <div className="ship-progression" aria-label={'Progressione '+shipId}>
  <p>{current.vitalIds.length} vitali · {current.escortCount} supporti
   {current.escortGrades.length?' · gradi '+current.escortGrades.join('/') : ''}
   {current.reserveCount?' · '+current.reserveCount+' in riserva':''}
   {current.fusionLimit?' · '+current.fusionLimit+(current.fusionLimit===1?' fusione':' fusioni'):''}
  </p>
  <details><summary>I cinque livelli</summary>
   <p>{profile.description}</p>
   <ol>{getShipProgressionLevels(shipId).map(stage=><li key={stage.level} aria-current={stage.level===level?'step':undefined}>
    <b>Livello {stage.level}</b><span>{stage.unlocks.join(' · ')}</span>
   </li>)}</ol>
  </details>
 </div>;
}

export function ShipShopPanel({stardust=0,onUpgradeShip=null}) {
  const [collection,setCollection] = useShipCollection();
  const [preview,setPreview] = useState('');
  const [upgrading,setUpgrading] = useState(false);
  const [message,setMessage] = useState('');
  async function upgrade(card){
    if(!card||upgrading||!onUpgradeShip)return;
    const target=card.level+1,cost=shipUpgradeDustCost(card.shipId,target);
    if(cost===null||!Number.isFinite(stardust)||stardust<cost)return;
    setUpgrading(true);
    try{
     const done=await onUpgradeShip(card.instanceId,target,cost);
     if(done){setCollection(readCollection());setMessage('Navicella potenziata al livello '+target);}
     else setMessage('Potenziamento non eseguito. Verifica le risorse.');
    }catch{setMessage('Potenziamento non salvato: la carta precedente è conservata.');}
    finally{setUpgrading(false);}
  }
  return <section className="ship-collection-panel es-math-scope" aria-label="Catalogo navicelle">
    <h4>Catalogo navicelle</h4>
    <p>Ottieni nuove carte-navicella vincendo i settori chiave della Campagna. Ogni navicella ottenuta è permanente. I cinque livelli migliorano la nave e, quando previsti dal suo modello, i supporti e le fusioni.</p>
    {collection
      ? <p>Carte possedute · {collection.cards.length} su {PHASE1_SHIPS.length}</p>
      : <p role="status">Il salvataggio della collezione è illeggibile. Puoi consultare il catalogo.</p>}
    <label className="ship-collection-preview">
      Livello di anteprima
      <select value={preview} onChange={event => setPreview(event.target.value)}>
        <option value="">Livelli attuali</option>
        {[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>Anteprima L{level}</option>)}
      </select>
    </label>
    {message&&<p role="status">{message}</p>}
    <div className="ship-collection-grid">
      {PHASE1_SHIPS.map(ship => {
        const card = collection?.cards.find(entry => entry.shipId === ship.id);
        const equipped = card && collection.loadout[0]===card.instanceId;
        const milestone=SHIP_CAMPAIGN_UNLOCKS.find(item=>item.shipId===ship.id);
        const status = card
          ? `${equipped ? 'Equipaggiata' : 'Posseduta'} · L${card.level}${card.level === 5 ? ' · Livello massimo' : ''}`
          : collection ? milestone?'Campagna · vittoria settore '+milestone.sector:'Da ottenere' : 'Proprietà non disponibile';
        const nextLevel=card?.level<5?card.level+1:null;
        const cost=nextLevel?shipUpgradeDustCost(ship.id,nextLevel):null;
        return <div key={ship.id} className="ship-shop-offer">
          <ShipCard shipId={ship.id} level={Number(preview) || card?.level || 1} status={status} fleetProgression/>
          <ShipProgressionDetails shipId={ship.id} level={Number(preview) || card?.level || 1}/>
          {nextLevel&&<button type="button" className="ship-upgrade-button"
            disabled={upgrading||!!preview||!onUpgradeShip||!Number.isFinite(stardust)||stardust<cost}
            onClick={()=>upgrade(card)}>
            POTENZIA L{nextLevel} · {cost} 🌟
          </button>}
        </div>;
      })}
    </div>
  </section>;
}

export function ShipHangarPanel({onOpenCatalog}) {
  const [collection, setCollection] = useShipCollection();
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const loadout = (draft ?? collection?.loadout ?? []).slice(0,1);
  const changed = draft !== null && (
    loadout.length !== collection?.loadout.length ||
    loadout.some((id, index) => id !== collection.loadout[index])
  );

  function toggle(id) {
    const next = [id]; // La madre equipaggiata è UNA: le altre carte restano possedute.
    try {
      if (next.length) equipShipCards(collection, next);
      setDraft(next);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await updateShipCollection(current => equipShipCards(current, loadout));
      setCollection(updated);
      setDraft(null);
      setMessage('Flotta salvata.');
    } catch {
      setMessage('Impossibile salvare la flotta. Riapri l’Hangar e riprova.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="ship-collection-panel ship-hangar es-math-scope" aria-label="Flotta Hangar">
    <h4>Hangar della flotta</h4>
    {collection ? <>
      <p>Seleziona la carta MADRE da utilizzare nel prossimo duello. Supporti, gradi e fusioni dipendono dal modello e dal suo livello. Aurora resta senza supporti. Cambiare madre conserva le altre carte possedute.</p>
      <ol className="ship-collection-formation" aria-label="Navicella madre equipaggiata">
        {loadout.map(id => {
          const card = collection.cards.find(entry => entry.instanceId === id);
          return <li key={id}>{card ? `${getShipDefinition(card.shipId).nome} · L${card.level}` : 'Carta non disponibile'}</li>;
        })}
      </ol>
      <div className="ship-collection-grid">
        {collection.cards.map(card => <div key={card.instanceId} className="ship-shop-offer">
         <ShipCard shipId={card.shipId} level={card.level} fleetProgression
          selected={loadout.includes(card.instanceId)} onSelect={() => toggle(card.instanceId)} disabled={saving}
          status={card.level === 5 ? 'Livello massimo' : `Potenziamento successivo · L${card.level + 1}`}/>
         <ShipProgressionDetails shipId={card.shipId} level={card.level}/>
        </div>)}
      </div>
    </> : <p role="status">Il salvataggio della collezione è illeggibile.</p>}
    {message && <p role="status">{message}</p>}
    <FleetCollectionWorkshop initialTab="exclusive"/>
    <div className="ship-collection-actions">
      <button type="button" className="cyber-btn" onClick={onOpenCatalog} disabled={saving}>Catalogo navi</button>
      <button type="button" className="cyber-btn cyber-btn-primary" onClick={save}
        disabled={!collection || !loadout.length || !changed || saving}>Salva flotta</button>
    </div>
  </section>;
}
