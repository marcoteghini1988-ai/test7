import React, {useEffect, useState} from 'react';
import {getShipDefinition, PHASE1_SHIPS} from './mathDuelEngine.js';
import {ShipCard} from './ShipPresentation.jsx';
import FleetCollectionWorkshop from './FleetCollectionWorkshop.jsx';
import {SHIP_COLLECTION_KEY, equipShipCards, readShipCollection, updateShipCollection} from './shipCollection.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {shipUpgradeDustCost} from './shipUpgrades.js';
import {getShipProgression,getShipProgressionLevels,shipProgressionProfile,shipMaxLevel} from './fleetNext/progression.js';
import {EXCLUSIVE_CARDS} from './fleetNext/rules.js';
import {fleetElementNames,activeFleetElements,secondaryElementUnlockLevel,FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
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
  {activeFleetElements(shipId,level).map((elementId,index)=><p key={elementId}>
   <b>{index===0?'Elemento principale':'Secondo elemento'}: {FLEET_ELEMENTS[elementId].name}</b>
   {' · Forte contro: '+FLEET_ELEMENTS[elementId].beats.map(id=>FLEET_ELEMENTS[id].name).join(' e ')}
   {' · Debole contro: '+FLEET_ELEMENTS[elementId].weakTo.map(id=>FLEET_ELEMENTS[id].name).join(' e ')}.
  </p>)}
  {secondaryElementUnlockLevel(shipId)&&level<secondaryElementUnlockLevel(shipId)&&
   <p>Seconda affinità: {fleetElementNames(shipId).at(-1)} dal livello {secondaryElementUnlockLevel(shipId)}.</p>}
  <p>Colpi normali invariati. Il futuro colpo elementale richiederà una Carta Energia.</p>
  <p>{current.vitalIds.length} vitali · {current.escortCount} supporti
   {current.escortGrades.length?' · gradi '+current.escortGrades.join('/') : ''}
   {current.reserveCount?' · '+current.reserveCount+' in riserva':''}
   {current.fusionLimit?' · '+current.fusionLimit+(current.fusionLimit===1?' fusione':' fusioni'):''}
  </p>
  <details><summary>I {profile.maxLevel} livelli · traguardo competitivo 100%</summary>
   <p>{profile.description}</p>
   <ol>{getShipProgressionLevels(shipId).map(stage=><li key={stage.level} aria-current={stage.level===level?'step':undefined}>
    <b>Livello {stage.level}</b><span>{[...stage.unlocks,
     ...Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===shipId&&c.minShipLevelDraft===stage.level)
      .map(c=>'Carta esclusiva: '+(c.name||c.nome))].join(' · ')}</span>
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
    <p>Le navicelle ottenute sono permanenti. Ogni famiglia ha un percorso da 5 a 20 livelli: le prime richiedono più miglioramenti, ma tutte raggiungono il 100% del potenziale progettato. I valori HP finali saranno bilanciati dopo le abilità dei supporti.</p>
    {collection
      ? <p>Carte possedute · {collection.cards.length} su {PHASE1_SHIPS.length}</p>
      : <p role="status">Il salvataggio della collezione è illeggibile. Puoi consultare il catalogo.</p>}
    <label className="ship-collection-preview">
      Livello di anteprima
      <select value={preview} onChange={event => setPreview(event.target.value)}>
        <option value="">Livelli attuali</option>
        {Array.from({length:20},(_,i)=>i+1).map(level=><option key={level} value={level}>Anteprima L{level}</option>)}
      </select>
    </label>
    {message&&<p role="status">{message}</p>}
    <div className="ship-collection-grid">
      {PHASE1_SHIPS.map(ship => {
        const card = collection?.cards.find(entry => entry.shipId === ship.id);
        const equipped = card && collection.loadout[0]===card.instanceId;
        const milestone=SHIP_CAMPAIGN_UNLOCKS.find(item=>item.shipId===ship.id);
        const maxLevel=shipMaxLevel(ship.id);
        const status = card
          ? `${equipped ? 'Equipaggiata' : 'Posseduta'} · L${card.level}/${maxLevel}${card.level === maxLevel ? ' · Livello massimo' : ''}`
          : collection ? milestone?'Campagna · vittoria settore '+milestone.sector:'Da ottenere' : 'Proprietà non disponibile';
        const nextLevel=card&&card.level<maxLevel?card.level+1:null;
        const cost=nextLevel?shipUpgradeDustCost(ship.id,nextLevel):null;
        return <div key={ship.id} className="ship-shop-offer">
          <ShipCard shipId={ship.id} level={Math.min(maxLevel,Number(preview) || card?.level || 1)} status={status} fleetProgression/>
          <ShipProgressionDetails shipId={ship.id} level={Math.min(maxLevel,Number(preview) || card?.level || 1)}/>
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
      <p>Seleziona la MADRE per il prossimo duello. Supporti, gradi e fusioni dipendono dalla famiglia e dal livello. Anche Aurora e Lince sbloccano due supporti nella progressione estesa. Cambiare madre conserva le altre navi possedute.</p>
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
          status={card.level === shipMaxLevel(card.shipId) ? 'Livello massimo' : `Potenziamento successivo · L${card.level + 1}/${shipMaxLevel(card.shipId)}`}/>
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
