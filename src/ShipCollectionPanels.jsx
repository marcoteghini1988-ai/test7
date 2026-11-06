import React, {useEffect, useState} from 'react';
import {getShipDefinition, PHASE1_SHIPS} from './mathDuelEngine.js';
import {ShipCard} from './ShipPresentation.jsx';
import SpecialDeckPanel from './SpecialDeckPanel.jsx';
import {SHIP_COLLECTION_KEY, equipShipCards, readShipCollection, updateShipCollection} from './shipCollection.js';
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

export function ShipShopPanel() {
  const [collection] = useShipCollection();
  const [preview, setPreview] = useState('');
  return <section className="ship-collection-panel es-math-scope" aria-label="Catalogo navicelle">
    <h4>Catalogo navicelle</h4>
    <p>Ottieni nuove carte-navicella vincendo i settori chiave della Campagna. Ogni navicella ottenuta è permanente; i livelli successivi saranno gestiti nei potenziamenti.</p>
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
    <div className="ship-collection-grid">
      {PHASE1_SHIPS.map(ship => {
        const card = collection?.cards.find(entry => entry.shipId === ship.id);
        const equipped = card && collection.loadout[0]===card.instanceId;
        const status = card
          ? `${equipped ? 'Equipaggiata' : 'Posseduta'} · L${card.level}${card.level === 5 ? ' · Livello massimo' : ''}`
          : collection ? 'Da ottenere' : 'Proprietà non disponibile';
        return <ShipCard key={ship.id} shipId={ship.id} level={Number(preview) || card?.level || 1} status={status}/>;
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
      <p>Seleziona la carta MADRE da utilizzare nel prossimo duello. Le scudiere si attivano automaticamente ai livelli 3 e 5. Cambiare madre non elimina le altre carte possedute.</p>
      <ol className="ship-collection-formation" aria-label="Navicella madre equipaggiata">
        {loadout.map(id => {
          const card = collection.cards.find(entry => entry.instanceId === id);
          return <li key={id}>{card ? `${getShipDefinition(card.shipId).nome} · L${card.level}` : 'Carta non disponibile'}</li>;
        })}
      </ol>
      <div className="ship-collection-grid">
        {collection.cards.map(card => <ShipCard key={card.instanceId} shipId={card.shipId} level={card.level}
          selected={loadout.includes(card.instanceId)} onSelect={() => toggle(card.instanceId)} disabled={saving}
          status={card.level === 5 ? 'Livello massimo' : `Potenziamento successivo · L${card.level + 1}`}/>)}
      </div>
    </> : <p role="status">Il salvataggio della collezione è illeggibile.</p>}
    {message && <p role="status">{message}</p>}
    <SpecialDeckPanel/>
    <div className="ship-collection-actions">
      <button type="button" className="cyber-btn" onClick={onOpenCatalog} disabled={saving}>Catalogo navi</button>
      <button type="button" className="cyber-btn cyber-btn-primary" onClick={save}
        disabled={!collection || !loadout.length || !changed || saving}>Salva flotta</button>
    </div>
  </section>;
}
