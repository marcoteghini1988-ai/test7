// Hangar dei 13 supporti: una rarità per copia, senza livelli di miglioramento.
import React,{useEffect,useState} from 'react';
import {SUPPORT_COLLECTION_KEY,readSupportCollection,writeSupportCollection,
 equipSupportInstance,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {SUPPORT_CATALOG,supportDefinition} from './fleetNext/supportCatalog.js';
import {FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {SUPPORT_SLOT_CAMPAIGN_UNLOCKS} from './fleetNext/supportCampaign.js';
import {readFleetInventory} from './fleetNext/collection.js';
import {readRarityCampaign} from './fleetNext/rarityCampaign.js';
import {SHIP_RARITIES,rarityIndex,rarityMayBeAcquired,nextShipRarity,
 rarityPurchaseCost,rarityEvolutionCost,RARITY_DUPLICATE_COPIES} from './fleetNext/shipRarity.js';
import {purchaseSupportCopy,evolveSupportCopy} from './fleetNext/supportShop.js';

const cardStyle={padding:10,border:'1px solid #36678c',borderRadius:8,
 background:'#071a2de9',color:'#e3f2ff',minWidth:180,flex:'1 1 180px'};
const controlStyle={background:'#102e45',color:'#fff',border:'1px solid #6e9bbf',
 borderRadius:6,padding:7,width:'100%'};
const buttonStyle={...controlStyle,width:'auto',fontWeight:700,cursor:'pointer'};
const safeRead=()=>{try{return {inventory:readSupportCollection(),error:''};}
 catch{return {inventory:null,error:'Il salvataggio supporti non è leggibile; nessun dato è stato sovrascritto.'};}};
export default function SupportHangarPanel(){
 const [state,setState]=useState(safeRead),[draft,setDraft]=useState(null);
 const [notice,setNotice]=useState('');
 const [credits,setCredits]=useState(()=>readFleetInventory().credits);
 const [progress,setProgress]=useState(()=>{try{return readRarityCampaign();}catch{return {rarity:'Comune',highestSector:1};}});
 const collection=state.inventory,equipped=draft??collection?.equipped??[null,null];
 useEffect(()=>{
  const refresh=()=>{
   setState(safeRead());setDraft(null);
   try{setCredits(readFleetInventory().credits);setProgress(readRarityCampaign());}catch{}
  };
  window.addEventListener('storage',refresh);
  window.addEventListener('eclissi-shop-changed',refresh);
  return ()=>{
   window.removeEventListener('storage',refresh);
   window.removeEventListener('eclissi-shop-changed',refresh);
  };
 },[]);
 const roster=collection?equippedSupportRoster({...collection,equipped}):[];
 const action=(result,description)=>{
  if(!result.ok){setNotice(result.reason);return;}
  setState({inventory:result.collection,error:''});setDraft(null);
  setCredits(result.inventory.credits);
  setNotice(description+' · '+result.rarita+' · '+result.price+' ✦');
  window.dispatchEvent(new Event('eclissi-shop-changed'));
 };
 const buy=(id,rarita)=>action(purchaseSupportCopy(id,rarita),'Carta supporto acquistata');
 const evolve=id=>action(evolveSupportCopy(id),'Evoluzione della carta supporto completata');
 const select=(slot,id)=>{
  if(!collection)return;
  try{setDraft(equipSupportInstance({...collection,equipped},slot,id||null).equipped);setNotice('');}
  catch(e){setNotice(e.message);}
 };
 const save=()=>{
  if(!collection)return;
  try{
   const latest=readSupportCollection();
   const saved=writeSupportCollection({...latest,equipped});
   setState({inventory:saved,error:''});setDraft(null);
   setNotice('Supporti equipaggiati per le prossime partite.');
  }catch(e){setNotice('Formazione non salvata: '+e.message);}
 };
 return <section aria-label="Navicelle di supporto indipendenti" style={{
  padding:10,border:'1px solid #326488',borderRadius:8,
  background:'#081b2dee',color:'#e6f5ff',margin:'10px 0'
 }}>
  <h4>Carte navicella · 13 supporti indipendenti</h4>
  <p>Due slot permanenti sbloccati nella campagna. Ogni copia ha rarità ed elemento propri;
   cambiando madre i supporti rimangono equipaggiati.</p>
  {state.error&&<p role="alert">{state.error}</p>}
  {collection&&<>
   <p>Copie possedute: {collection.owned.length} · Slot: {collection.unlockedSlots}/2
    {' · Rarità sbloccata: '+progress.rarity+' · Crediti '+credits.toLocaleString('it-IT')+' ✦'}</p>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {[0,1].map(slot=>{
     const unlocked=slot<collection.unlockedSlots;
     const milestone=SUPPORT_SLOT_CAMPAIGN_UNLOCKS[slot];
     const chosen=roster.find(s=>s.slot===slot);
     return <div key={slot} style={cardStyle}>
      <strong>{'SLOT SUPPORTO '+(slot+1)}</strong>
      {!unlocked?<p>Bloccato · completa il settore {milestone.sector}</p>:<>
       <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:76}}>
        {chosen?<img src={chosen.visual} alt={chosen.name} loading="lazy"
         style={{maxHeight:74,maxWidth:140,objectFit:'contain'}}/>:
         <span>Slot libero</span>}
       </div>
       <label htmlFor={'support-formation-'+slot}>Carta supporto equipaggiata</label>
       <select id={'support-formation-'+slot} style={controlStyle}
        value={equipped[slot]||''} onChange={e=>select(slot,e.target.value)}>
        <option value="">Slot libero</option>
        {collection.owned.map(item=>{
         const model=supportDefinition(item.supportId);
         return <option key={item.instanceId} value={item.instanceId}
          disabled={equipped.some((x,i)=>i!==slot&&x===item.instanceId)}>
          {model?.name||item.supportId} · {item.rarita} · {item.instanceId}
         </option>;
        })}
       </select>
       {chosen&&<small>{chosen.name} · {chosen.rarita} · {chosen.skillName}
        {' · '+(FLEET_ELEMENTS[chosen.elementId]?.name||'Elemento non definito')}
        {' · Fusione '+(chosen.rarita==='Leggendaria'?'disponibile':'richiede Leggendaria')}</small>}
      </>}
     </div>;
    })}
   </div>
   <p>Le 13 Carte Navicella Fusione restano carte speciali Leggendarie,
    giocabili su un supporto Leggendario non ancora fuso. Nessun HP recuperato.</p>
   <details><summary>Acquista una copia di supporto · 13 modelli</summary>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:8}}>
     {SUPPORT_CATALOG.map(model=><div key={model.id} style={cardStyle}>
      <img src={model.visual} alt={model.name} loading="lazy"
       style={{height:74,maxWidth:'100%',objectFit:'contain'}}/>
      <strong style={{display:'block'}}>{model.name}</strong>
      <small style={{display:'block'}}>{model.skillName+' · '+FLEET_ELEMENTS[model.elementId]?.name}</small>
      {SHIP_RARITIES.filter(r=>rarityIndex(r)>=rarityIndex(model.rarita)).map(r=>{
       const price=rarityPurchaseCost('support',r),unlocked=rarityMayBeAcquired(r,model.rarita,progress.highestSector);
       return <button type="button" key={r} style={buttonStyle}
        disabled={!unlocked||credits<price}
        onClick={()=>buy(model.id,r)}>
        {unlocked?'COMPRA '+r+' · '+price+' ✦':r+' · bloccata'}</button>;
      })}
     </div>)}
    </div>
   </details>
   <details><summary>Evolvi le copie usando tre carte uguali</summary>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:8}}>
     {collection.owned.map(unit=>{
      const model=supportDefinition(unit.supportId),next=nextShipRarity(unit.rarita);
      const matching=collection.owned.filter(x=>x.supportId===unit.supportId&&x.rarita===unit.rarita).length;
      const allowed=!!next&&matching>=RARITY_DUPLICATE_COPIES&&
       rarityMayBeAcquired(next,model?.rarita,progress.highestSector);
      const cost=next?rarityEvolutionCost('support',next):null;
      return <div key={unit.instanceId} style={cardStyle}>
       <strong style={{display:'block'}}>{model?.name||unit.supportId}</strong>
       <small style={{display:'block'}}>{unit.instanceId+' · '+unit.rarita+' · '+matching+'/3 copie'}</small>
       {next?<button type="button" style={buttonStyle}
        disabled={!allowed||credits<cost} onClick={()=>evolve(unit.instanceId)}>
        {'EVOLVI IN '+next+' · '+cost+' ✦'}</button>:<small>Rarità massima: Leggendaria</small>}
      </div>;
     })}
    </div>
   </details>
   <p>L'evoluzione usa due doppioni e conserva una copia precedente. La fusione
    giocata sul campo è una meccanica separata.</p>
   {notice&&<p role="status">{notice}</p>}
   <button type="button" style={buttonStyle} onClick={save}
    disabled={!draft||draft.every((v,i)=>v===collection.equipped[i])}>SALVA SUPPORTI</button>
  </>}
 </section>;
}
