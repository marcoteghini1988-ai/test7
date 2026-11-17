import React,{useMemo,useState} from 'react';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,SHIP_CONFIGS,
 eligibleExclusives,cardFacePath,card} from './fleetNext/rules.js';
import {describeEffect,canUpgradeEffect,SIMPLE_RULES} from './fleetNext/simpleEffects.js';
import {readShipCollection} from './shipCollection.js';
import {readFleetInventory,writeFleetInventory,
 upgradeFleetExclusive,exclusiveUpgradeCost} from './fleetNext/collection.js';
const box={padding:'9px',background:'#071a2de9',border:'1px solid #36678c',borderRadius:'8px',color:'#e3f2ff'};
const btn={background:'#17496b',color:'white',border:'1px solid #79a9c9',borderRadius:'6px',padding:'7px 9px',fontSize:'11px',fontWeight:700};
const small={fontSize:'11px',color:'#a4c7dd'};
const locale=n=>Number(n||0).toLocaleString('it-IT');
// La plancia e lo stile grafico delle carte non cambiano.
// Fronte ufficiale del catalogo, identico in Shop, mazzi ed arena.
function FleetCardArt({id,name,grade=1,large=false}){
 const width=large?114:38;
 if(!cardFacePath(id,grade)){
  const definition=card(id),text=definition?describeEffect(definition,grade):name;
  return <div role="img" aria-label={'Carta '+name+' · '+text}
   style={{width,minHeight:width*1.5,aspectRatio:'2 / 3',flexShrink:0,boxSizing:'border-box',
    padding:large?9:3,border:'2px solid '+(definition?.kind==='attack'?'#ff594c':'#ffb24d'),
    borderRadius:6,background:'linear-gradient(145deg,#19354c,#08121f)',
    color:'#f3f9ff',display:'flex',flexDirection:'column',justifyContent:'space-between',
    margin:large?'0 auto 7px':undefined,overflow:'hidden'}}>
    <strong style={{fontSize:large?12:7,lineHeight:1.2}}>{name}</strong>
    <span aria-hidden="true" style={{fontSize:large?28:17,textAlign:'center'}}>
     {definition?.effectSpec?.type==='fusion'?'⟐':definition?.effectSpec?.type==='bypass'?'➶':'⬡'}</span>
    {large&&<span style={{fontSize:9,lineHeight:1.3}}>{text}</span>}
   </div>;
 }
 return <img src={cardFacePath(id,grade)}
  width={width} height={width*1.5} loading="lazy" decoding="async"
  alt={'Carta '+name} style={{width,aspectRatio:'2 / 3',height:'auto',display:'block',
   objectFit:'contain',flexShrink:0,margin:large?'0 auto 7px':undefined}}/>;
}


export default function FleetCollectionWorkshop({initialTab='exclusive'}){
 const allowed=['exclusive','characters','boss'];
 const [inventory,setInventory]=useState(()=>readFleetInventory());
 const [tab,setTab]=useState(allowed.includes(initialTab)?initialTab:'exclusive');
 const [notice,setNotice]=useState('');
 const [motherId,setMotherId]=useState(()=>readFleetInventory().equippedMother);
 const ownedShips=useMemo(()=>{try{return readShipCollection().cards||[];}catch{return [];}},[]);
 const shipOptions=ownedShips.length?ownedShips:[{shipId:motherId,level:1}];
 const motherOwned=shipOptions.find(s=>s.shipId===motherId)||shipOptions[0];
 const activeMother=motherOwned.shipId,motherLevel=motherOwned.level||1;
 const exclusives=eligibleExclusives(activeMother,motherLevel).filter(c=>
  Object.hasOwn(EXCLUSIVE_CARDS,c.id)&&!c.id.startsWith('prog-'));
 function upgrade(id){
  const result=upgradeFleetExclusive(inventory,id,activeMother,motherLevel);
  if(!result.ok){setNotice(result.reason||'Potenziamento non disponibile');return;}
  try{setInventory(writeFleetInventory(result.inventory));setNotice('Carta esclusiva potenziata al grado '+result.grade);}
  catch(e){setNotice('Salvataggio non riuscito: '+e.message);}
 }
 return <div style={{...box,display:'flex',flexDirection:'column',gap:'9px',minHeight:'310px',fontSize:'12px'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:7,flexWrap:'wrap'}}>
   <div><strong style={{fontSize:14}}>CARTE DELLA FLOTTA</strong>
    <div style={small}>10 esclusive per madre · {Object.keys(GENERAL_CARDS).length} Personaggi generali · {Object.keys(BOSS_CARDS).length} Boss</div></div>
   <strong style={{color:'#ffe394'}}>✦ {locale(inventory.credits)} Crediti Stellari</strong>
  </div>
  <p style={small}>Le esclusive della madre e i Personaggi posseduti entrano automaticamente nella partita. Non serve acquistare o preparare un mazzo da 40 carte.</p>
  <details style={small}><summary style={{cursor:'pointer',color:'#d5ecff'}}>Come si leggono gli effetti</summary>
   <ul style={{paddingLeft:18,lineHeight:1.45}}>{SIMPLE_RULES.map(rule=><li key={rule}>{rule}</li>)}</ul></details>
  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
   {[['exclusive','Esclusive'],['characters','Personaggi'],['boss','Personaggi Boss']].map(([id,label])=>
    <button key={id} style={{...btn,background:tab===id?'#236d9a':'#122e4a'}}
     onClick={()=>{setTab(id);setNotice('');}}>{label}</button>)}
  </div>
  {notice&&<div role="status" style={{...small,color:'#ffe1a7'}}>{notice}</div>}
  {tab==='exclusive'&&<div style={{display:'flex',flexDirection:'column',gap:7}}>
   <label style={small}>Navicella posseduta:
    <select style={{...box,marginLeft:6}} value={activeMother} onChange={e=>setMotherId(e.target.value)}>
     {shipOptions.map(s=><option key={s.shipId} value={s.shipId}>{SHIP_CONFIGS[s.shipId]?.name||s.shipId} · L{s.level||1}</option>)}
    </select>
   </label>
   <p style={small}>Esclusive sbloccate: {exclusives.length}. Le restanti si sbloccano con i livelli della madre. Le immagini definitive saranno progettate successivamente.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {exclusives.map(c=>{
     const grade=inventory.exclusiveUpgrades[c.id]||1,cost=exclusiveUpgradeCost(grade+1);
     const upgradeable=canUpgradeEffect(c,grade),requiredLevel=grade===1?3:5;
     return <div key={c.id} style={box}>
      <FleetCardArt id={c.id} name={c.name||c.nome} grade={grade} large/>
      <strong>{c.name||c.nome}</strong>
      <div style={small}>Grado {grade}/3 · {c.category||c.categoria}</div>
      <p style={small}>{describeEffect(c,grade)}</p>
      {upgradeable?<>
       <p style={small}>Grado {grade+1}: {describeEffect(c,grade+1)}</p>
       <button style={btn} onClick={()=>upgrade(c.id)} disabled={motherLevel<requiredLevel}>
        {motherLevel<requiredLevel?'NAVICELLA LIVELLO '+requiredLevel:'POTENZIA · '+locale(cost)+' Crediti'}</button>
      </>:<small style={small}>Effetto al massimo</small>}
     </div>;
    })}
   </div>
  </div>}
  {tab==='characters'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
   {Object.values(GENERAL_CARDS).map(c=><div key={c.id} style={box}>
    <FleetCardArt id={c.id} name={c.nome} large/><strong>{c.nome}</strong>
    <p style={small}>{c.effetto}</p>
    <small style={small}>{inventory.owned[c.id]?'Posseduto · incluso automaticamente':'Non posseduto'}</small>
   </div>)}
  </div>}
  {tab==='boss'&&<>
   <p style={small}>I Personaggi Boss si ottengono solo sconfiggendo il Boss corrispondente, poi entrano automaticamente tra le carte disponibili.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {Object.values(BOSS_CARDS).map(c=><div key={c.id} style={box}>
     <FleetCardArt id={c.id} name={c.nome} large/><strong>{c.nome}</strong>
     <p style={small}>{c.effetto}</p>
     <small style={small}>{inventory.owned[c.id]?'Ottenuto · incluso automaticamente':'Da ottenere sconfiggendo il Boss'}</small>
    </div>)}
   </div>
  </>}
 </div>;
}
