import React,{useMemo,useState} from 'react';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,SHIP_CONFIGS,NEXT_COMMON_CARDS,DISMANTLE_CARDS,ENERGY_CARDS,
 eligibleExclusives,exclusiveUnlocked,shipMaxLevel,cardFacePath,card,cardCopyLimit} from './fleetNext/rules.js';
import {readNextDeckSelection,saveNextDeckSelection,buildNextBaseDeck,buyNextCommonCard,NEXT_CARD_COSTS,NEXT_TEMP_WEAPON_IDS} from './fleetNext/nextDeckLoadout.js';
import {describeEffect,canUpgradeEffect,SIMPLE_RULES} from './fleetNext/simpleEffects.js';
import {exclusiveRarityAtLevel,exclusiveRarityMilestones} from './fleetNext/exclusiveEvolution.js';
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
     {definition?.visualSymbol|| (definition?.effectSpec?.type==='fusion'?'⟐':definition?.effectSpec?.type==='bypass'?'➶':'⬡')}</span>
    {large&&<span style={{fontSize:9,lineHeight:1.3}}>{text}</span>}
   </div>;
 }
 return <img src={cardFacePath(id,grade)}
  width={width} height={width*1.5} loading="lazy" decoding="async"
  alt={'Carta '+name} style={{width,aspectRatio:'2 / 3',height:'auto',display:'block',
   objectFit:'contain',flexShrink:0,margin:large?'0 auto 7px':undefined}}/>;
}


export default function FleetCollectionWorkshop({initialTab='exclusive'}){
 const allowed=['exclusive','generic','characters','boss'];
 const [inventory,setInventory]=useState(()=>readFleetInventory());
 const [selectedDeck,setSelectedDeck]=useState(()=>readNextDeckSelection());
 const [tab,setTab]=useState(allowed.includes(initialTab)?initialTab:'exclusive');
 const [notice,setNotice]=useState('');
 const [motherId,setMotherId]=useState(()=>readFleetInventory().equippedMother);
 const ownedShips=useMemo(()=>{try{return readShipCollection().cards||[];}catch{return [];}},[]);
 const shipOptions=ownedShips.length?ownedShips:[{shipId:motherId,level:1}];
 const motherOwned=shipOptions.find(s=>s.shipId===motherId)||shipOptions[0];
 const activeMother=motherOwned.shipId,motherLevel=motherOwned.level||1;
 const deckInfo=buildNextBaseDeck(inventory,activeMother,motherLevel,selectedDeck);
 const extraCards=[...NEXT_TEMP_WEAPON_IDS.map(card).filter(Boolean),...Object.values(GENERAL_CARDS),...Object.values(BOSS_CARDS)];
 function buyCommon(id){
  const purchase=buyNextCommonCard(inventory,id);
  if(!purchase.ok){setNotice(purchase.reason);return;}
  try{
   setInventory(writeFleetInventory(purchase.inventory));
   setNotice('Carta acquistata. Ora puoi aggiungerla al mazzo.');
  }catch(e){setNotice('Acquisto non salvato: '+(e?.message||'Errore'));}
 }
 function editDeck(id,add){
  const current=[...deckInfo.baseDeck];
  if(add)current.push(id);
  else {
   const index=current.lastIndexOf(id);
   if(index<0)return;
   current.splice(index,1);
  }
  const result=saveNextDeckSelection(inventory,activeMother,motherLevel,current);
  if(!result.ok){setNotice(result.reason);return;}
  setSelectedDeck(result.deck);
  setNotice('Nuovo mazzo salvato · '+(deckInfo.exclusiveCount+current.length)+'/40');
 }
 function genericCardTile(c){
  const owned=inventory.owned[c.id]||0,equipped=deckInfo.baseDeck.filter(id=>id===c.id).length;
  const copies=Math.min(owned,cardCopyLimit(c.id));
  const price=[...NEXT_COMMON_CARDS,...DISMANTLE_CARDS,...ENERGY_CARDS].some(def=>def.id===c.id)?NEXT_CARD_COSTS[c.rarita]:null;
  return <div key={c.id} style={box}>
   <FleetCardArt id={c.id} name={c.nome||c.name} large/>
   <strong>{c.nome||c.name}</strong>
   <div style={small}>{c.rarita||'Comune'} · {c.sottotipo||c.category||c.kind}</div>
   <p style={small}>{describeEffect(c)}</p>
   <p style={small}>Possedute: {owned} · Nel mazzo: {equipped} · Massimo: {cardCopyLimit(c.id)}</p>
   <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
    <button style={btn} disabled={equipped>=copies||deckInfo.baseDeck.length>=deckInfo.capacity}
      onClick={()=>editDeck(c.id,true)}>AGGIUNGI</button>
    <button style={btn} disabled={!equipped} onClick={()=>editDeck(c.id,false)}>RIMUOVI</button>
    {price!=null&&<button style={btn} onClick={()=>buyCommon(c.id)}
      disabled={owned>=cardCopyLimit(c.id)||inventory.credits<price}>
      ACQUISTA · {locale(price)} ✦</button>}
   </div>
  </div>;
 }
 const exclusives=eligibleExclusives(activeMother,motherLevel).filter(c=>
  Object.hasOwn(EXCLUSIVE_CARDS,c.id)&&!c.id.startsWith('prog-'));
 const lockedExclusives=Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===activeMother&&
  !exclusives.some(unlocked=>unlocked.id===c.id));
 const actualUnlockLevel=c=>{
  const max=shipMaxLevel(activeMother)||5;
  for(let level=1;level<=max;level++)if(exclusiveUnlocked(c.id,activeMother,level))return level;
  return null;
 };
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
  <p style={small}>Il nuovo mazzo contiene fino a 40 carte totali: le esclusive sbloccate della madre si aggiungono automaticamente, le generiche vengono scelte dalla collezione. Le vecchie carte ritirate restano archiviate.</p>
  <details style={small}><summary style={{cursor:'pointer',color:'#d5ecff'}}>Come si leggono gli effetti</summary>
   <ul style={{paddingLeft:18,lineHeight:1.45}}>{SIMPLE_RULES.map(rule=><li key={rule}>{rule}</li>)}</ul></details>
  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
   {[['exclusive','Esclusive'],['generic','Mazzo · Generiche'],['characters','Personaggi'],['boss','Personaggi Boss']].map(([id,label])=>
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
   <p style={small}>Esclusive sbloccate: {exclusives.length}/10. Le altre dipendono dal livello della madre e dai supporti operativi. Le immagini definitive arriveranno dopo il progetto grafico.</p>
   {!!lockedExclusives.length&&<details style={small}><summary style={{cursor:'pointer'}}>Prossimi sblocchi ({lockedExclusives.length})</summary>
    <ol>{lockedExclusives.map(c=><li key={c.id}>{c.name} · L{actualUnlockLevel(c)??'?'}{c.requirements?' · '+c.requirements:''}</li>)}</ol>
   </details>}
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {exclusives.map(c=>{
     const grade=inventory.exclusiveUpgrades[c.id]||1,cost=exclusiveUpgradeCost(grade+1);
     const rarity=exclusiveRarityAtLevel(c,motherLevel);
     const upcomingRarity=exclusiveRarityMilestones(activeMother).find(stage=>stage.minLevel>motherLevel);
     const upgradeable=canUpgradeEffect(c,grade),requiredLevel=grade===1?3:5;
     return <div key={c.id} style={box}>
      <FleetCardArt id={c.id} name={c.name||c.nome} grade={grade} large/>
      <strong>{c.name||c.nome}</strong>
      <div style={small}>Rarità {rarity} · Grado effetto {grade}/3 · {c.category||c.categoria}</div>
      {upcomingRarity&&<div style={small}>Prossima rarità {upcomingRarity.rarity} · navicella L{upcomingRarity.minLevel}</div>}
      <p style={small}>{describeEffect(c,grade)}</p>
      {c.requirements&&<p style={small}>{c.requirements}</p>}
      {upgradeable?<>
       <p style={small}>Grado {grade+1}: {describeEffect(c,grade+1)}</p>
       <button style={btn} onClick={()=>upgrade(c.id)} disabled={motherLevel<requiredLevel}>
        {motherLevel<requiredLevel?'NAVICELLA LIVELLO '+requiredLevel:'POTENZIA · '+locale(cost)+' Crediti'}</button>
      </>:<small style={small}>Effetto al massimo</small>}
     </div>;
    })}
   </div>
  </div>}
  {tab==='generic'&&<>
   <p style={small}><strong>NUOVO MAZZO · {deckInfo.total}/40</strong> — {deckInfo.exclusiveCount} esclusive della madre + {deckInfo.baseDeck.length}/{deckInfo.capacity} generiche scelte. Scegli fino ai posti disponibili; le copie si pescano dal mazzo in battaglia. Prezzi provvisori, il bilanciamento arriverà dopo.</p>
   {deckInfo.discarded.length>0&&<p style={{...small,color:'#ffe19e'}}>Alcune carte non sono più disponibili per questa navicella o superano il limite. Il mazzo utilizzato sarà ridotto automaticamente.</p>}
   <h3 style={{fontSize:13}}>10 Carte Energia elementali · accumulo 1–4 cariche</h3>
   <p style={small}>Le Energie vengono aggiunte al mazzo generico; ogni carta caricata consuma una delle 3 giocate del turno. L’abilità unica della nave si attiva dalla plancia.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {ENERGY_CARDS.map(genericCardTile)}
   </div>
   <h3 style={{fontSize:13}}>33 nuove carte dei sistemi e Buco Nero</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {NEXT_COMMON_CARDS.map(genericCardTile)}
   </div>
   <h3 style={{fontSize:13}}>4 carte Attacco · Smontaggio Forzato</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {DISMANTLE_CARDS.map(genericCardTile)}
   </div>
   <h3 style={{fontSize:13}}>Armi temporanee, Personaggi e Boss posseduti</h3>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {extraCards.filter(c=>inventory.owned[c.id]>0).map(genericCardTile)}
   </div>
  </>}
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
