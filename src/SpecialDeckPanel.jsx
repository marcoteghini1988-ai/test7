import React,{useState,useEffect} from 'react';
import {SPECIAL_CARD_CATALOG,specialCardMaxCopies} from './specialCards.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {officialSpecialVisualMeta} from './officialSpecialVisualMeta.js';
import {fleetCardEffect} from './fleetCardEngine.js';
import {isBossCharacterCard} from './bossCharacterCards.js';
import BossCharacterPortrait from './BossCharacterPortrait.jsx';
import PvpTerrainPortrait from './PvpTerrainPortrait.jsx';
import {isPvpTerrain} from './pvpTerrainCards.js';
import {isTacticalEpic} from './tacticalEpicCards.js';
import {isModuleCard,readLegacyModuleLevels,MODULE_STORAGE_KEY} from './tacticalEquipmentCards.js';
import {LEGACY_EPIC_KEYS,readLegacyEpicProgress} from './officialEpicOwnership.js';
import {officialSpecialLoadoutAccess} from './officialSpecialLoadoutAccess.js';
import {
 SPECIAL_TYPES,SPECIAL_DECK_SIZE,SPECIAL_DECK_COPY_LIMIT,SPECIAL_COLLECTION_KEY,
 readSpecialCollection,updateSpecialCollection,specialDeckCounts,
 validateSpecialDeck,equipSpecialDeck,openSpecialPack
} from './specialDeckBuilder.js';
import './SpecialDeckPanel.css';

// Reusable Hangar + pre-battle editor. A corrupt save is never overwritten.
function readSafe(){
 try{return {collection:readSpecialCollection(),epicSlotLimit:readLegacyEpicProgress().slotLimit,
  moduleLevels:readLegacyModuleLevels(),error:''};}
 catch{return {collection:null,error:'Salvataggio del mazzo speciale non leggibile. Nessun dato è stato modificato.'};}
}
export default function SpecialDeckPanel({compact=false,onSaved}){
 const [snapshot,setSnapshot]=useState(readSafe);
 const [draft,setDraft]=useState(null);
 const [status,setStatus]=useState('');
 const [saving,setSaving]=useState(false);
 const collection=snapshot.collection,types=draft??collection?.loadout??[];
 const counts=specialDeckCounts(types),check=collection?validateSpecialDeck(collection,types):{valid:false};
 const epicSlotLimit=snapshot.epicSlotLimit??0;
 const epicEquipped=types.filter(isTacticalEpic).length;
 const epicsValid=epicEquipped<=epicSlotLimit;
 const access=officialSpecialLoadoutAccess(types,{
  epicSlotLimit,moduleLevels:snapshot.moduleLevels});
 const accessValid=access.valid;
 const changed=!!collection&&draft!==null&&
  (types.length!==collection.loadout.length||types.some((t,i)=>t!==collection.loadout[i]));
 const refresh=()=>setSnapshot(readSafe());
 useEffect(()=>{
  const sync=e=>{if(e.key===SPECIAL_COLLECTION_KEY||e.key===null||Object.values(LEGACY_EPIC_KEYS).includes(e.key)||e.key===MODULE_STORAGE_KEY){refresh();setDraft(null);}};
  window.addEventListener('storage',sync);
  return()=>window.removeEventListener('storage',sync);
 },[]);
 const updateDraft=(type,amount)=>{
  if(saving||!collection)return;
  if(amount>0){
   if(types.length>=SPECIAL_DECK_SIZE||
     counts[type]>=Math.min(specialCardMaxCopies(type),collection.owned[type])||
     (isTacticalEpic(type)&&epicEquipped>=epicSlotLimit)||
     (isModuleCard(type)&&(!Number.isInteger(snapshot.moduleLevels?.[type])||
      snapshot.moduleLevels[type]<1||snapshot.moduleLevels[type]>9)))return;
   setDraft([...types,type]);
  }else{
   const index=types.lastIndexOf(type);
   if(index<0)return;
   setDraft(types.filter((_,i)=>i!==index));
  }
  setStatus('');
 };
 function save(){
  if(!collection||!changed||!check.valid||!accessValid||saving)return;
  setSaving(true);
  try{
   // I salvataggi di acquisto/fusione possono essere cambiati anche
   // mentre il pannello e' aperto: ricontrollarli prima della scrittura.
   const fresh=officialSpecialLoadoutAccess(types,{
    epicSlotLimit:readLegacyEpicProgress().slotLimit,
    moduleLevels:readLegacyModuleLevels()});
   if(!fresh.valid)throw new Error(fresh.reason==='epic_slots'?
    'Slot Epici non ancora sbloccati. Aggiorna l’inventario.':
    'Modulo non acquistato o livello non valido. Aggiorna l’inventario.');
   const next=updateSpecialCollection(current=>equipSpecialDeck(current,types));
   setSnapshot(readSafe());setDraft(null);
   setStatus('Mazzo speciale salvato. Verrà usato alla prossima battaglia.');
   onSaved?.(next.loadout);
  }catch(error){setStatus(error.message||'Impossibile salvare il mazzo speciale.');refresh();}
  finally{setSaving(false);}
 }
 function openPack(){
  if(!collection||saving)return;
  setSaving(true);
  try{
   let result;
   const next=updateSpecialCollection(current=>{
    result=openSpecialPack(current);
    return result.collection;
   });
   setSnapshot(readSafe());
   if(result?.opened)setStatus('Pacchetto aperto: '+result.drawn.map(t=>SPECIAL_CARD_CATALOG[t].short).join(' + ')+'. Carte aggiunte alla collezione.');
   else setStatus('Nessun pacchetto disponibile.');
  }catch(error){setStatus(error.message||'Apertura non riuscita.');refresh();}
  finally{setSaving(false);}
 }
 const body=<section className="special-deck-editor" aria-label="Costruzione mazzo speciale">
  <p>Nel nuovo duello di flotta esiste un solo mazzo da 24 carte speciali: niente numeriche, Poker o formule. Schieri da 1 a 3 navicelle possedute e giochi fino a 2 speciali a round. Puoi equipaggiare fino a 6 copie ordinarie e una per Personaggio Boss, Oggetto Epico o Modulo acquistato. Personaggi e reliquie conservano la loro durata; i moduli si attivano solo quando li giochi.</p>
  {snapshot.error&&<p role="alert">{snapshot.error}</p>}
  {collection&&<>
   <div className="special-deck-summary">
    <strong>{types.length}/{SPECIAL_DECK_SIZE} speciali</strong>
    <span>Pacchetti da aprire: <b>{collection.packCredits}</b></span>
    <span>Pacchetti aperti: {collection.openedPacks}</span>
    <span>Slot Epici sbloccati: <b>{epicSlotLimit}/2</b> · equipaggiati <b>{epicEquipped}</b></span>
   </div>
   <div className="special-deck-types">
    {SPECIAL_TYPES.map(type=>{
     const info=SPECIAL_CARD_CATALOG[type],n=counts[type],owned=collection.owned[type];
     const visual=officialSpecialVisualMeta(type);
     return <div className="special-deck-entry" key={type}
      data-role={visual?.role} data-rarity={visual?.rarity??undefined}>
      <div className="special-deck-entry-copy">
       {isBossCharacterCard(type)&&<BossCharacterPortrait type={type} className="special-deck-boss-portrait"/>}
       {isPvpTerrain(type)&&<PvpTerrainPortrait type={type} className="special-deck-boss-portrait"/>}
       {officialSpecialArtPath(type)&&<img className="special-deck-art" src={officialSpecialArtPath(type)} alt={info.name} loading="lazy"/>}
       <strong>{type==='tactic-numeric-recycle'?'RICAMBIO TATTICO':type==='tactic-bomb'?'BOMBA EMP':info.short}</strong>
       <div className="special-deck-visual-tags">
        <span>{visual?.role??'SPECIALE'}</span>
        {visual?.rarity&&<span className="special-deck-tier">{visual.rarity}</span>}
        {visual?.limited==='BOSS'&&<span className="special-deck-tier">BOSS</span>}
       </div>
       <small>{isBossCharacterCard(type)?'PERSONAGGIO BOSS · 2 ROUND · ':''}{fleetCardEffect(type).description}</small>
       {isBossCharacterCard(type)&&!owned&&<small>Si sblocca sconfiggendo il boss del pianeta.</small>}
       {isPvpTerrain(type)&&<small>Terreno attivo per 2 round · il boss impone il proprio scenario. Non si ottiene nei pacchetti correnti.</small>}
       {isTacticalEpic(type)&&<small>Oggetto Epico · sblocco dal Varco fuso nella Cripta. Una copia per tipo, massimo due nel mazzo; uno slot a L20/primo Varco, due a L60.</small>}
       {isModuleCard(type)&&<small>{(owned?'Modulo acquistato · livello '+(snapshot.moduleLevels?.[type]??'?'):'Modulo non posseduto')+' · Carta abilità: 1 copia, giocabile tra le cinque speciali; non si trova nei pacchetti normali.'}</small>}
      </div>
      <div className="special-deck-quantity">
       <button type="button" aria-label={'Rimuovi '+info.name} disabled={saving||!n}
        onClick={()=>updateDraft(type,-1)}>−</button>
       <span aria-label={'Equipaggiate '+n+' possedute '+owned}>{n}/{owned}</span>
       <button type="button" aria-label={'Aggiungi '+info.name}
        disabled={saving||types.length>=SPECIAL_DECK_SIZE||n>=Math.min(owned,specialCardMaxCopies(type))||(isTacticalEpic(type)&&epicEquipped>=epicSlotLimit)||(isModuleCard(type)&&(!Number.isInteger(snapshot.moduleLevels?.[type])||snapshot.moduleLevels[type]<1||snapshot.moduleLevels[type]>9))}
        onClick={()=>updateDraft(type,1)}>+</button>
      </div>
     </div>;
    })}
   </div>
   {types.length!==SPECIAL_DECK_SIZE&&<p role="status">Mancano {SPECIAL_DECK_SIZE-types.length} carte per completare il mazzo.</p>}
   {!check.valid&&types.length===SPECIAL_DECK_SIZE&&<p role="status">Il mazzo non rispetta i limiti delle copie possedute.</p>}
   {!epicsValid&&<p role="status">Slot Epici insufficienti: aumenta il livello pilota oppure stabilizza un Varco nella Cripta.</p>}
   {access.reason==='module_not_unlocked'&&<p role="status">Modulo non acquistato o livello non valido: verifica lo sblocco nell'Hangar prima di salvarlo nel mazzo.</p>}
   <div className="special-deck-actions">
    <button type="button" disabled={saving||!changed||!check.valid||!accessValid} onClick={save}>SALVA MAZZO</button>
    <button type="button" disabled={saving||collection.packCredits<1} onClick={openPack}>
     APRI PACCHETTO · 3 CARTE
    </button>
    <button type="button" disabled={saving||!changed} onClick={()=>{setDraft(null);setStatus('Modifiche annullate.');}}>ANNULLA</button>
   </div>
   <small>I Personaggi Boss si ricevono solo dopo la vittoria contro il rispettivo boss, non nei pacchetti. Dopo lo sblocco possono sostituire una delle 24 speciali. </small>
   <small>Il primo successo in un nuovo settore Campagna/Avventura assegna un pacchetto. Le prove e i successi ripetuti nello stesso settore non ne assegnano altri. Prezzi e rarità dei pacchetti non sono ancora definiti.</small>
  </>}
  {status&&<p role="status" className="special-deck-notice">{status}</p>}
 </section>;
 return compact?<details className="special-deck-collapsible">
  <summary>MAZZO CARTE SPECIALI · {collection?collection.loadout.length+' carte':'salvataggio non disponibile'}</summary>
  {body}
 </details>:body;
}
