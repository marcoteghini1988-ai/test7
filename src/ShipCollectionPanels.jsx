// Hangar madri: quattro rarità collezionabili, nessun livello numerico esposto.
// I livelli del motore sono proiezioni interne per non rifare la plancia 3D.
import React,{useEffect,useState} from 'react';
import {getShipDefinition,PHASE1_SHIPS} from './fleetNext/shipCore.js';
import {ShipCard} from './ShipPresentation.jsx';
import FleetCollectionWorkshop from './FleetCollectionWorkshop.jsx';
import SupportHangarPanel from './SupportHangarPanel.jsx';
import {SHIP_COLLECTION_KEY,equipShipCards,readShipCollection,updateShipCollection} from './shipCollection.js';
import {SHIP_CAMPAIGN_UNLOCKS} from './shipCampaignRewards.js';
import {EXCLUSIVE_CARDS} from './fleetNext/rules.js';
import {activeFleetElements,FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {elementalAbility} from './fleetNext/elementalAbilities.js';
import {SHIP_RARITIES,rarityIndex,rarityPurchaseCost,rarityEvolutionCost,
 rarityMayBeAcquired,nativeMotherRarity,nextShipRarity,
 combatLevelForRarity,RARITY_DUPLICATE_COPIES} from './fleetNext/shipRarity.js';
import {readRarityCampaign} from './fleetNext/rarityCampaign.js';
import {readFleetInventory} from './fleetNext/collection.js';
import {purchaseMotherCopy,evolveMotherCopy} from './shipRarityShop.js';
import './ShipCollectionPanels.css';

function readCollection(){try{return readShipCollection();}catch{return null;}}
function useShipCollection(){
 const [collection,setCollection]=useState(readCollection);
 useEffect(()=>{
  const refresh=event=>{if(event.key===SHIP_COLLECTION_KEY||event.key===null)setCollection(readCollection());};
  window.addEventListener('storage',refresh);
  return ()=>window.removeEventListener('storage',refresh);
 },[]);
 return [collection,setCollection];
}
export function ShipProgressionDetails({shipId,rarita=nativeMotherRarity(shipId)}){
 const level=combatLevelForRarity(shipId,rarita);
 const elements=activeFleetElements(shipId,level);
 return <div className="ship-progression" aria-label={'Rarità '+shipId}>
  <p><b>Rarità: {rarita}</b> · Elementi: {elements.map(id=>FLEET_ELEMENTS[id].name).join(' / ')}</p>
  {elements.map(id=><p key={id}>{FLEET_ELEMENTS[id].symbol+' '+FLEET_ELEMENTS[id].name}
   {' · Forte contro '+FLEET_ELEMENTS[id].beats.map(x=>FLEET_ELEMENTS[x].name).join(' e ')}
   {' · Debole contro '+FLEET_ELEMENTS[id].weakTo.map(x=>FLEET_ELEMENTS[x].name).join(' e ')}</p>)}
  <p>Abilità elementale: <b>{elementalAbility(shipId)?.name}</b>.
   Vantaggio elementale +25% danni, svantaggio −50%.</p>
  <p>Le 10 esclusive della madre restano uniche per modello; le rarità avanzate
   consentono di utilizzarne sempre di più. Le fusioni delle carte supporto sono separate.</p>
 </div>;
}
export function ShipShopPanel(){
 const [collection,setCollection]=useShipCollection();
 const [credits,setCredits]=useState(()=>readFleetInventory().credits);
 const [progress,setProgress]=useState(()=>{try{return readRarityCampaign();}catch{return {highestSector:1,rarity:'Comune'};}});
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  const reload=()=>{
   setCollection(readCollection());
   try{setCredits(readFleetInventory().credits);setProgress(readRarityCampaign());}catch{}
  };
  window.addEventListener('eclissi-shop-changed',reload);
  window.addEventListener('storage',reload);
  return ()=>{window.removeEventListener('eclissi-shop-changed',reload);window.removeEventListener('storage',reload);};
 },[setCollection]);
 const refresh=result=>{
  setMessage(result.ok?('Carta ottenuta: '+result.rarita+' · '+result.price+' Crediti spesi'):result.reason);
  if(result.ok){
   setCollection(result.collection);setCredits(result.inventory.credits);
   window.dispatchEvent(new Event('eclissi-shop-changed'));
  }
 };
 const buy=(shipId,rarita)=>{
  if(busy)return;setBusy(true);
  try{refresh(purchaseMotherCopy(shipId,rarita));}finally{setBusy(false);}
 };
 const evolve=instanceId=>{
  if(busy)return;setBusy(true);
  try{refresh(evolveMotherCopy(instanceId));}finally{setBusy(false);}
 };
 return <section className="ship-collection-panel es-math-scope" aria-label="Catalogo navicelle per rarità">
  <h4>Catalogo madri · Comune, Rara, Epica, Leggendaria</h4>
  <p>Ogni copia possiede la propria rarità. Le prime madri possono diventare Leggendarie
   e competere con le ultime: il vantaggio reale dipende da elementi e abilità.</p>
  <p>Rarità sbloccata dalla campagna: <b>{progress.rarity}</b>
   {' · settore raggiunto '+progress.highestSector+' · Crediti Stellari '+credits.toLocaleString('it-IT')+' ✦'}</p>
  {collection?<p>Carte madri possedute: {collection.cards.length} · 12 modelli ufficiali</p>:
   <p role="alert">Il salvataggio non è leggibile; nessuna carta è stata sovrascritta.</p>}
  {message&&<p role="status">{message}</p>}
  <div className="ship-collection-grid">
   {PHASE1_SHIPS.map(ship=>{
    const owned=collection?.cards.filter(c=>c.shipId===ship.id)||[];
    const native=nativeMotherRarity(ship.id);
    const first=owned.find(c=>c.rarita===native)||owned[0];
    const campaign=SHIP_CAMPAIGN_UNLOCKS.find(x=>x.shipId===ship.id);
    const preview=owned.reduce((best,c)=>rarityIndex(c.rarita)>rarityIndex(best)?c.rarita:best,native);
    return <div key={ship.id} className="ship-shop-offer">
     <ShipCard shipId={ship.id} rarita={preview} level={combatLevelForRarity(ship.id,preview)}
      status={owned.length?owned.length+' copie possedute · rarità massima '+preview:
       campaign?'Sblocco modello · settore '+campaign.sector:'Madre iniziale'} fleetProgression/>
     <ShipProgressionDetails shipId={ship.id} rarita={preview}/>
     <p>Copie: {SHIP_RARITIES.filter(r=>rarityIndex(r)>=rarityIndex(native))
      .map(r=>r+' '+owned.filter(c=>c.rarita===r).length).join(' · ')}</p>
     {collection&&owned.length>0&&<details><summary>Acquista una copia di questa madre</summary>
      {SHIP_RARITIES.filter(r=>rarityIndex(r)>=rarityIndex(native)).map(r=>{
       const price=rarityPurchaseCost('mother',r);
       const unlocked=rarityMayBeAcquired(r,native,progress.highestSector);
       return <button type="button" className="ship-upgrade-button" key={r}
        disabled={!unlocked||credits<price||busy}
        onClick={()=>buy(ship.id,r)}>
        {unlocked?'ACQUISTA '+r+' · '+price+' ✦':r+' · rarità bloccata'}</button>;
      })}
     </details>}
     {owned.map(copy=>{
      const next=nextShipRarity(copy.rarita);
      const matching=owned.filter(x=>x.rarita===copy.rarita).length;
      const ready=next&&matching>=RARITY_DUPLICATE_COPIES&&
       rarityMayBeAcquired(next,native,progress.highestSector);
      const price=next?rarityEvolutionCost('mother',next):null;
      return <div key={copy.instanceId}>
       <small>{copy.instanceId+' · '+copy.rarita}</small>
       {next&&<button type="button" className="ship-upgrade-button"
        disabled={!ready||credits<price||busy}
        onClick={()=>evolve(copy.instanceId)}>
        {'EVOLVI IN '+next+' · 3 copie '+copy.rarita+' + '+price+' ✦'}
       </button>}
      </div>;
     })}
    </div>;
   })}
  </div>
  <p>L'evoluzione consuma due copie della stessa rarità, ne conserva una per la
   collezione e crea la carta successiva. Prezzi provvisori, nessun acquisto con denaro reale.</p>
 </section>;
}
export function ShipHangarPanel({onOpenCatalog}){
 const [collection,setCollection]=useShipCollection();
 const [draft,setDraft]=useState(null);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState('');
 const loadout=(draft??collection?.loadout??[]).slice(0,1);
 const changed=draft!==null&&loadout[0]!==collection?.loadout[0];
 const toggle=id=>{
  try{equipShipCards(collection,[id]);setDraft([id]);setMessage('');}
  catch(e){setMessage(e.message);}
 };
 const save=async()=>{
  setSaving(true);
  try{
   const updated=await updateShipCollection(current=>equipShipCards(current,loadout));
   setCollection(updated);setDraft(null);setMessage('Madre salvata.');
  }catch{setMessage('Formazione non salvata; la copia precedente è conservata.');}
  finally{setSaving(false);}
 };
 return <section className="ship-collection-panel ship-hangar es-math-scope" aria-label="Flotta Hangar">
  <h4>Hangar · collezione delle madri</h4>
  {collection?<><p>Seleziona UNA carta madre posseduta. Due copie dello stesso modello possono
   avere rarità differenti. I due supporti si scelgono separatamente.</p>
   <ol className="ship-collection-formation" aria-label="Madre equipaggiata">
    {loadout.map(id=>{const c=collection.cards.find(x=>x.instanceId===id);
     return <li key={id}>{c?getShipDefinition(c.shipId).nome+' · '+c.rarita:'Carta non disponibile'}</li>;})}
   </ol>
   <div className="ship-collection-grid">
    {collection.cards.map(c=><div className="ship-shop-offer" key={c.instanceId}>
     <ShipCard shipId={c.shipId} rarita={c.rarita} level={combatLevelForRarity(c.shipId,c.rarita)}
      fleetProgression selected={loadout.includes(c.instanceId)}
      onSelect={()=>toggle(c.instanceId)} disabled={saving}
      status={c.rarita+' · '+c.instanceId}/>
     <ShipProgressionDetails shipId={c.shipId} rarita={c.rarita}/>
    </div>)}
   </div></>:<p role="alert">Impossibile leggere la collezione.</p>}
  {message&&<p role="status">{message}</p>}
  <SupportHangarPanel/>
  <FleetCollectionWorkshop initialTab="exclusive"/>
  <div className="ship-collection-actions">
   <button type="button" className="cyber-btn" onClick={onOpenCatalog} disabled={saving}>Catalogo madri</button>
   <button type="button" className="cyber-btn cyber-btn-primary" onClick={save}
    disabled={!collection||!loadout.length||!changed||saving}>Salva flotta</button>
  </div>
 </section>;
}
