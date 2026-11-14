import React,{useMemo,useState} from 'react';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,PREMADE_DECKS,CARD_PRICES,PACK_PRICE,
 FLEET_BASE_DECK_SIZE,SHIP_CONFIGS,cardCopyLimit,countDeck,
 deckFromCounts,validateBaseDeck,eligibleExclusives} from './fleetNext/rules.js';
import {readShipCollection} from './shipCollection.js';
import {readFleetInventory,writeFleetInventory,equipFleetBaseDeck,
 buyGeneralCard,buyPrebuiltDeck,buyFleetPack,
 upgradeFleetExclusive,exclusiveUpgradeCost} from './fleetNext/collection.js';

const box={padding:'9px',background:'#071a2de9',border:'1px solid #36678c',
 borderRadius:'8px',color:'#e3f2ff'};
const btn={background:'#17496b',color:'white',border:'1px solid #79a9c9',
 borderRadius:'6px',padding:'7px 9px',fontSize:'11px',fontWeight:700};
const small={fontSize:'11px',color:'#a4c7dd'};
const locale=n=>Number(n||0).toLocaleString('it-IT');
export default function FleetCollectionWorkshop(){
 const [inventory,setInventory]=useState(()=>readFleetInventory());
 const [draft,setDraft]=useState(()=>readFleetInventory().deck);
 const [tab,setTab]=useState('shop');
 const [rarity,setRarity]=useState('Tutte');
 const [category,setCategory]=useState('Tutte');
 const [query,setQuery]=useState('');
 const [selected,setSelected]=useState(null);
 const [notice,setNotice]=useState('');
 const [packResults,setPackResults]=useState([]);
 const [motherId,setMotherId]=useState(()=>readFleetInventory().equippedMother);
 const baseCounts=useMemo(()=>countDeck(draft),[draft]);
 const ownedShips=useMemo(()=>{
  try{return readShipCollection().cards||[];}catch{return [];}
 },[]);
 const motherOwned=ownedShips.find(s=>s.shipId===motherId);
 const motherLevel=motherOwned?.level||1;
 const allCards=Object.values(GENERAL_CARDS);
 const filtered=useMemo(()=>allCards.filter(c=>
  (rarity==='Tutte'||c.rarita===rarity)&&
  (category==='Tutte'||c.categoria===category)&&
  (!query||(c.nome+' '+c.effetto+' '+c.famiglia).toLowerCase().includes(query.toLowerCase()))
 ),[rarity,category,query]);
 function apply(result,success){
  if(!result.ok){setNotice(result.reason||'Operazione non riuscita');return;}
  try{
   const safe=writeFleetInventory(result.inventory);
   setInventory(safe);setDraft([...safe.deck]);
   setNotice(success||'Operazione completata');
  }catch(e){setNotice('Salvataggio non riuscito: '+e.message);}
 }
 function buy(id){apply(buyGeneralCard(inventory,id,1),'Carta acquistata: '+GENERAL_CARDS[id]?.nome);}
 function add(id){
  if(draft.length>=FLEET_BASE_DECK_SIZE){setNotice('Mazzo pieno: togli una carta prima di aggiungerne');return;}
  if((baseCounts[id]||0)>=cardCopyLimit(id)){setNotice('Limite copie raggiunto');return;}
  if((baseCounts[id]||0)>=(inventory.owned[id]||0)){setNotice('Non possiedi altre copie');return;}
  setDraft(d=>[...d,id]);setNotice('');
 }
 function remove(id){
  const i=draft.indexOf(id);
  if(i<0)return;setDraft(d=>d.filter((_,index)=>index!==i));setNotice('');
 }
 function saveDeck(){
  const check=validateBaseDeck(draft,inventory);
  if(!check.valid){setNotice(check.reason);return;}
  apply(equipFleetBaseDeck(inventory,draft),'Mazzo da 40 carte equipaggiato');
 }
 function buyPack(){
  const result=buyFleetPack(inventory);
  if(!result.ok){setNotice(result.reason);return;}
  setPackResults(result.cards);apply(result,'Pacchetto aperto: 3 carte aggiunte');
 }
 function buyDeck(id){
  const result=buyPrebuiltDeck(inventory,id);
  apply(result,result.ok?'Mazzo acquistato ed equipaggiato':'');
 }
 function upgrade(id){
  const result=upgradeFleetExclusive(inventory,id,motherId,motherLevel);
  apply(result,result.ok?'Carta esclusiva potenziata al grado '+result.grade:'');
 }
 const categories=['Tutte','Attacco','Difesa','Controllo','Supporto','Strategia'];
 return <div style={{...box,display:'flex',flexDirection:'column',gap:'9px',
  minHeight:'310px',fontSize:'12px'}}>
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'7px',flexWrap:'wrap'}}>
   <div><strong style={{fontSize:'14px'}}>CARTE E MAZZI DI FLOTTA</strong>
    <div style={small}>250 carte generali · 129 esclusive · 10 mazzi pronti</div></div>
   <strong style={{color:'#ffe394'}}>✦ {locale(inventory.credits)} Crediti Stellari</strong>
  </div>
  <div style={{display:'flex',gap:'5px',flexWrap:'wrap'}}>
   {[['shop','Carte singole'],['decks','Il mio mazzo'],['ready','Mazzi pronti'],['packs','Pacchetti'],['exclusive','Esclusive']].map(([id,label])=>
    <button key={id} style={{...btn,background:tab===id?'#236d9a':'#122e4a'}} onClick={()=>setTab(id)}>
     {label}</button>)}
  </div>
  {notice&&<div role="status" style={{...small,color:'#ffe1a7'}}>{notice}</div>}
  {tab==='shop'&&<div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
   <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cerca carta o effetto"
     style={{...box,flex:'2 1 120px',minWidth:0}}/>
    <select value={rarity} onChange={e=>setRarity(e.target.value)} style={{...box,flex:1,minWidth:90}}>
     {['Tutte','Comune','Rara','Epica','Leggendaria'].map(x=><option key={x}>{x}</option>)}</select>
    <select value={category} onChange={e=>setCategory(e.target.value)} style={{...box,flex:1,minWidth:90}}>
     {categories.map(x=><option key={x}>{x}</option>)}</select>
   </div>
   <div style={small}>{filtered.length} carte trovate · mostrate fino a 70 per volta</div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))',gap:'6px'}}>
    {filtered.slice(0,70).map(c=><div key={c.id} style={box}>
     <strong>{c.nome}</strong><div style={small}>{c.rarita} · {c.sottotipo}</div>
     <p style={{...small,minHeight:42,lineHeight:1.3}}>{c.effetto}</p>
     <div style={small}>Possedute: {inventory.owned[c.id]||0} · Limite nel mazzo: {cardCopyLimit(c.id)}</div>
     <div style={{display:'flex',gap:4,marginTop:7}}>
      <button style={btn} onClick={()=>buy(c.id)}>Compra {locale(CARD_PRICES[c.rarita])}</button>
      <button style={btn} onClick={()=>setSelected(selected===c.id?null:c.id)}>Info</button>
     </div>
     {selected===c.id&&<p style={small}>Contromossa: {c.controgioco}</p>}
    </div>)}
   </div>
  </div>}
  {tab==='decks'&&<>
   <div style={small}>Mazzo base: {draft.length}/40 · Le esclusive della madre si aggiungono automaticamente.
    Puoi usare doppioni entro il limite della rarità.</div>
   <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
    <button style={btn} onClick={saveDeck} disabled={draft.length!==40}>SALVA ED EQUIPAGGIA</button>
    <button style={btn} onClick={()=>setDraft([...inventory.deck])}>ANNULLA MODIFICHE</button>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:6}}>
    <div style={box}>
     <strong>Carte nel mazzo</strong>
     {Object.entries(baseCounts).map(([id,n])=><div key={id} style={{display:'flex',gap:6,alignItems:'center',marginTop:5}}>
      <span style={{flex:1}}>{GENERAL_CARDS[id]?.nome} ×{n}</span>
      <button style={btn} onClick={()=>remove(id)} aria-label={'Rimuovi '+id}>−</button>
     </div>)}
    </div>
    <div style={box}>
     <strong>Carte possedute da aggiungere</strong>
     {Object.entries(inventory.owned).filter(([id,n])=>n>0&&GENERAL_CARDS[id]).map(([id,n])=>
      <div key={id} style={{display:'flex',gap:6,alignItems:'center',marginTop:5}}>
       <span style={{flex:1}}>{GENERAL_CARDS[id].nome} ({baseCounts[id]||0}/{Math.min(n,cardCopyLimit(id))})</span>
       <button style={btn} onClick={()=>add(id)} disabled={draft.length>=40||
        (baseCounts[id]||0)>=Math.min(n,cardCopyLimit(id))}>+</button>
      </div>)}
    </div>
   </div>
  </>}
  {tab==='ready'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:7}}>
   {PREMADE_DECKS.map(deck=>{
    const missing=Object.entries(deck.carteGenerali).reduce((sum,[id,n])=>
     sum+Math.max(0,n-(inventory.owned[id]||0))*CARD_PRICES[GENERAL_CARDS[id].rarita],0);
    return <div key={deck.id} style={box}>
     <strong>{deck.nome}</strong><div style={small}>{deck.categoria} · 40 carte · {deck.strategia}</div>
     <p style={small}>Prezzo delle sole carte mancanti: {locale(missing)} Crediti</p>
     <button style={btn} onClick={()=>buyDeck(deck.id)}>
      {missing?'ACQUISTA ED EQUIPAGGIA':'EQUIPAGGIA'} </button>
    </div>;
   })}
  </div>}
  {tab==='packs'&&<div style={box}>
   <strong>Pacchetto casuale · 3 carte</strong>
   <p style={small}>Probabilità per singola carta: Comune 65%, Rara 25%, Epica 8%, Leggendaria 2%.
    Sono escluse le carte esclusive delle navicelle e i Personaggi Boss.</p>
   <button style={btn} onClick={buyPack}>APRI · {PACK_PRICE} Crediti</button>
   {packResults.length>0&&<p>Estratte: {packResults.map(id=>GENERAL_CARDS[id]?.nome).join(' · ')}</p>}
  </div>}
  {tab==='exclusive'&&<div style={{display:'flex',flexDirection:'column',gap:7}}>
   <label style={small}>Navicella posseduta:
    <select style={{...box,marginLeft:6}} value={motherId} onChange={e=>setMotherId(e.target.value)}>
     {ownedShips.map(c=><option key={c.shipId} value={c.shipId}>
      {SHIP_CONFIGS[c.shipId]?.name||c.shipId} · L{c.level}</option>)}
    </select>
   </label>
   <p style={small}>Le carte esclusive sbloccate vengono inserite automaticamente nel mazzo.
    I miglioramenti manuali restano salvati passando da una nave all'altra.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:7}}>
    {eligibleExclusives(motherId,motherLevel).map(c=>{
     const grade=inventory.exclusiveUpgrades[c.id]||1;
     const cost=exclusiveUpgradeCost(grade+1);
     return <div key={c.id} style={box}>
      <strong>{c.name}</strong><div style={small}>Grado {grade}/3 · {c.category}</div>
      <p style={small}>{c.effectProposed}</p>
      {grade<3&&<button style={btn} onClick={()=>upgrade(c.id)}>
       POTENZIA · {locale(cost)} Crediti</button>}
     </div>;
    })}
   </div>
  </div>}
 </div>;
}
