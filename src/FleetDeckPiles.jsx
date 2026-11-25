import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {card,cardRole,cardFacePath} from './fleetNext/rules.js';
import {FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {OFFICIAL_FLEET_DRAW_BACK} from './officialDeckBackArt.js';
import {FLEET_DECK_SHUFFLE_MS,fleetPileDepth,fleetPileView} from './fleetDeckPiles.js';
import './FleetDeckPiles.css';
import WeaponSalvoCardMarks from './WeaponSalvoCardMarks.jsx';

const FALLBACK_ART={attack:'shot-ion',energy:'shot-ion',defense:'tactical-cover',
 trap:'tactic-reactive',character:'module-card-planet_char_1',
 terrain:'tactic-vulnerability-rift',support:'support-shield-repair',control:'tactic-suppress'};
const ROLE_LABELS={attack:'ATTACCO',energy:'ENERGIA',defense:'DIFESA',trap:'TRAPPOLA',
 character:'PERSONAGGIO',terrain:'TERRENO',support:'SUPPORTO',control:'CONTROLLO'};

export function FleetPileCardFace({id}){
 const def=card(id),role=def?.effectSpec?.type==='energy'?'energy':
  def?.kind==='trap'?'trap':cardRole(id)||'support';
 const art=cardFacePath(id);
 const fallback='/assets/special-cards/'+(FALLBACK_ART[role]||FALLBACK_ART.support)+'.png';
 const name=def?.nome||def?.name||id;
 return <span className={'fleet-pile-face'+(art?' fleet-pile-face--art':'')}
  data-family={role} data-rarity={def?.rarita||'Comune'}>
  <img src={art||fallback} alt="" draggable={false}
   onError={e=>{if(e.currentTarget.getAttribute('src')!==fallback)e.currentTarget.src=fallback;}}/>
  {art&&<WeaponSalvoCardMarks cardId={id}/>}
  {!art&&<><small>{FLEET_ELEMENTS[def?.elementId]?.symbol||'✦'} {ROLE_LABELS[role]||'SPECIALE'}</small>
   <b>{name}</b></>}
 </span>;
}

export function FleetPileCardBack({src}){
 return <span className="fleet-pile-back" data-custom-back={!!src}>
  {src?<img src={src} alt="" draggable={false}/>:<svg viewBox="0 0 58 87" aria-hidden="true" focusable="false">
   <path d="M7 3H51L55 7V80L51 84H7L3 80V7Z"/>
   <path d="M12 6H8L6 8V13M46 6H50L52 8V13M6 74V79L8 81H12M46 81H50L52 79V74"/>
   <path d="M29 39L34 43.5L29 48L24 43.5ZM29 41.5L31.5 43.5L29 45.5L26.5 43.5Z"/>
  </svg>}
 </span>;
}

function FleetCardPile({kind,count,cards=[],backSrc,recycling}){
 const top=cards[cards.length-1],discard=kind==='discard';
 const topName=top&&(card(top)?.nome||card(top)?.name||top);
 const label=discard?'Scarti: '+count+' carte'+(topName?' · '+topName:''):'Mazzo: '+count+' carte rimaste';
 const depth=fleetPileDepth(count);
 const layers=Math.min(count,48);
 return <div className={'fleet-card-pile fleet-card-pile--'+kind} role="img" aria-label={label}
  title={label} data-count={count} data-empty={!count} data-recycling={recycling||undefined}
  style={{'--pile-depth':depth+'px'}}>
  <span className="fleet-pile-floor" aria-hidden="true"/>
  {count>0&&<span className="fleet-pile-stack" aria-hidden="true">
   <span className="fleet-pile-edge fleet-pile-edge--front"/>
   <span className="fleet-pile-edge fleet-pile-edge--right"/>
   {Array.from({length:layers},(_,i)=><span className="fleet-pile-layer" key={i}
    style={{transform:'translateZ('+(depth*i/layers)+'px)'}}/>)}
   {discard&&cards.slice(-3,-1).map((id,i)=><span key={id+':'+i} className="fleet-pile-under-card"
    style={{transform:'translate3d('+(i?1.4:-1.1)+'px,'+(i?1:-1.2)+'px,'+
     Math.max(0,depth-(2-i)*.7)+'px) rotateZ('+(i?1.4:-1.6)+'deg)'}}><FleetPileCardFace id={id}/></span>)}
   <span className="fleet-pile-top" style={{transform:'translateZ('+depth+'px)'+(discard?' rotateZ(-1.4deg)':'')}}>
    {discard?<FleetPileCardFace id={top}/>:<FleetPileCardBack src={backSrc}/>}
   </span>
  </span>}
  <small className="fleet-pile-label" aria-hidden="true">{discard?'SCARTI':'MAZZO'}</small>
 </div>;
}

export default function FleetDeckPiles({side,backSrc=side.deckBackPath||OFFICIAL_FLEET_DRAW_BACK}){
 const serial=side.deckShuffle?.serial||0;
 const seen=useRef(serial);
 const timeout=useRef(null);
 const [shuffle,setShuffle]=useState(null);
 useLayoutEffect(()=>{
  window.clearTimeout(timeout.current);
  if(!serial){seen.current=0;setShuffle(null);return;}
  if(serial===seen.current)return;
  seen.current=serial;
  const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches?1:FLEET_DECK_SHUFFLE_MS;
  setShuffle({...side.deckShuffle,duration});
  timeout.current=window.setTimeout(()=>setShuffle(null),duration);
  return ()=>window.clearTimeout(timeout.current);
 },[serial]);
 useEffect(()=>()=>window.clearTimeout(timeout.current),[]);
 const view=fleetPileView(side,shuffle);
 return <div className="fleet-card-piles" role="group" aria-label="Mazzo e scarti"
  data-shuffling={view.recycling||undefined}
  style={{'--shuffle-duration':(shuffle?.duration||FLEET_DECK_SHUFFLE_MS)+'ms'}}>
  <FleetCardPile kind="discard" count={view.discardCards.length} cards={view.discardCards}
   recycling={view.recycling}/>
  <FleetCardPile kind="draw" count={view.deckCount} backSrc={backSrc} recycling={view.recycling}/>
  {view.recycling&&<div className="fleet-pile-transfer" key={shuffle.serial} aria-hidden="true">
   {view.flyingCards.map((id,i)=><span className="fleet-pile-flying-card" key={i}
    style={{'--flight-index':i,'--flight-angle':(i-3.5)*3+'deg',
     '--flight-start-depth':fleetPileDepth(shuffle.cards.length)+'px',
     '--flight-end-depth':fleetPileDepth(view.deckCount)+'px'}}>
    <span className="fleet-pile-flying-front"><FleetPileCardFace id={id}/></span>
    <span className="fleet-pile-flying-back"><FleetPileCardBack src={backSrc}/></span>
   </span>)}
  </div>}
  {view.recycling&&<span className="fleet-pile-announcement" role="status">Rimescolamento di {shuffle.cards.length} carte negli scarti</span>}
 </div>;
}
