// Selettore dei supporti realmente posseduti: due slot indipendenti dalla madre.
// Le immagini sono i modelli di supporto SVG preesistenti, non nuove Carte Fusione.
import React,{useEffect,useState} from 'react';
import {SUPPORT_COLLECTION_KEY,readSupportCollection,writeSupportCollection,
 equipSupportInstance,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {SUPPORT_CATALOG,supportDefinition} from './fleetNext/supportCatalog.js';
import {FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {SUPPORT_MAX_LEVEL} from './fleetNext/supportProgression.js';
import {SUPPORT_SLOT_CAMPAIGN_UNLOCKS} from './fleetNext/supportCampaign.js';

const cardStyle={padding:10,border:'1px solid #36678c',borderRadius:8,
 background:'#071a2de9',color:'#e3f2ff',minWidth:180,flex:'1 1 180px'};
const controlStyle={background:'#102e45',color:'#fff',border:'1px solid #6e9bbf',
 borderRadius:6,padding:7,width:'100%'};
const buttonStyle={...controlStyle,width:'auto',fontWeight:700,cursor:'pointer'};
const safeRead=()=>{try{return {inventory:readSupportCollection(),error:''};}
 catch{return {inventory:null,error:'Il salvataggio supporti non è leggibile; nessun dato è stato sovrascritto.'};}};

export default function SupportHangarPanel(){
 const [state,setState]=useState(safeRead);
 const [draft,setDraft]=useState(null);
 const [notice,setNotice]=useState('');
 const collection=state.inventory;
 const equipped=draft??collection?.equipped??[null,null];
 useEffect(()=>{
  const refresh=event=>{
   if(event.key===SUPPORT_COLLECTION_KEY||event.key===null){
    setState(safeRead());setDraft(null);
   }
  };
  window.addEventListener('storage',refresh);
  return ()=>window.removeEventListener('storage',refresh);
 },[]);
 const roster=collection?equippedSupportRoster({...collection,equipped}):[];
 function select(slot,id){
  if(!collection)return;
  try{
   const current=equipSupportInstance({...collection,equipped},slot,id||null);
   setDraft(current.equipped);setNotice('');
  }catch(error){setNotice(error.message);}
 }
 function save(){
  if(!collection)return;
  try{
   const latest=readSupportCollection();
   const result=writeSupportCollection({...latest,equipped});
   setState({inventory:result,error:''});setDraft(null);
   setNotice('Supporti equipaggiati: saranno schierati già a inizio partita.');
  }catch(error){setNotice('Formazione non salvata: '+error.message);}
 }
 return <section aria-label="Navicelle di supporto indipendenti" style={{
  padding:10,border:'1px solid #326488',borderRadius:8,
  background:'#081b2dee',color:'#e6f5ff',margin:'10px 0'
 }}>
  <h4>Carte navicella · supporti scelti prima della battaglia</h4>
  <p>Gli slot si sbloccano in modo permanente con la campagna.
   Le due navicelle si scelgono prima della battaglia e mantengono
   la stessa formazione anche quando cambi nave madre.</p>
  {state.error&&<p role="alert">{state.error}</p>}
  {collection&&<>
   <p>Modelli ufficiali di supporto: {SUPPORT_CATALOG.length} · Copie possedute: {collection.owned.length}
    {' · Slot sbloccati: '+collection.unlockedSlots+'/2'}</p>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {[0,1].map(slot=>{
     const unlocked=slot<collection.unlockedSlots;
     const milestone=SUPPORT_SLOT_CAMPAIGN_UNLOCKS[slot];
     const chosen=roster.find(s=>s.slot===slot);
     return <div key={slot} style={cardStyle}>
      <strong>{'SLOT SUPPORTO '+(slot+1)}</strong>
      {!unlocked?<p>Bloccato · vittoria settore {milestone.sector} della campagna</p>:<>
       <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:76}}>
        {chosen?<img src={chosen.visual} alt={chosen.name} loading="lazy"
         style={{maxHeight:74,maxWidth:140,objectFit:'contain'}}/>:
         <span>Nessun supporto selezionato</span>}
       </div>
       <label htmlFor={'support-formation-'+slot}>Navicella equipaggiata</label>
       <select id={'support-formation-'+slot} style={controlStyle}
        value={equipped[slot]||''}
        onChange={e=>select(slot,e.target.value)}>
        <option value="">Slot libero</option>
        {collection.owned.map(item=>{
         const source=supportDefinition(item.supportId);
         return <option key={item.instanceId} value={item.instanceId}
          disabled={equipped.some((x,i)=>i!==slot&&x===item.instanceId)}>
          {source?.name||item.supportId} · L{item.level}/{SUPPORT_MAX_LEVEL} · copia {item.instanceId}
         </option>;
        })}
       </select>
       {chosen&&<small>{chosen.name} · {chosen.role} · livello proprio {chosen.level}/{SUPPORT_MAX_LEVEL}
        {' · elemento proprio: '+(FLEET_ELEMENTS[chosen.elementId]?.name||'da definire')}
        {' · fusione: '+(chosen.level>=SUPPORT_MAX_LEVEL?'MAX pronto':'bloccata fino al livello MAX')}</small>}
      </>}
     </div>;
    })}
   </div>
   <p>Una Carta Navicella Fusione Leggendaria può fondersi soltanto con un supporto al livello massimo. La carta rappresenta già una navicella MAX; mantiene gli HP del supporto in campo.</p>
   <p>Le prime due copie si ottengono ai traguardi di sblocco. Le altre
    potranno essere acquistate o ottenute separatamente quando
    completeremo il negozio e i miglioramenti dei supporti.</p>
   {notice&&<p role="status">{notice}</p>}
   <button type="button" style={buttonStyle} onClick={save}
    disabled={!draft||draft.every((v,i)=>v===collection.equipped[i])}>
    SALVA SUPPORTI
   </button>
  </>}
 </section>;
}
