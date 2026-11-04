import React,{useId} from 'react';
import {META,PHASE1_SHIPS,SUIT_SIGNS} from './mathDuelEngine.js';
import {engineSurface} from './mathFleetGeometry.js';
import {shipEvolution} from './shipEvolution.js';

export const ASSET_ROOT=(import.meta.env.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export const SHIP_GLOW={N00:'#48cfff',C01:'#ff4059',C02:'#3ecfff',C03:'#5dff61',C04:'#d261ff',R01:'#ffb269',R02:'#63ffce',R03:'#d4c3ff',R04:'#9dffd4',E01:'#b097ff',E02:'#8cff83',E03:'#ffb75b',E04:'#68ffb5',L01:'#ffca63',L02:'#c394ff',L03:'#ff914e',L04:'#9df4ff'};
const WEBP_HULLS=new Set(PHASE1_SHIPS.filter(s=>s.rarita!=='Comune').map(s=>s.id));

function HullPlating({side,vessel,upgrade}){
 const id=useId(),{level}=vessel,{color,plate,wing,fin,finish=['#e4edf2','#9babbd','#4d6078','#263446','#8299ad']}=upgrade;
 const [highlight,bevel,panel,shadow,edge]=finish;
 const [left,right,y]=upgrade[side].plate,[wingLeft,wingRight,wingY]=upgrade[side].wing;
 const facing=side==='player'?1:-1;
 const metal=`url(#${id})`;
 return <g data-plating-level={level} strokeLinejoin="round">
  <defs><linearGradient id={id} x1="0" x2=".8" y1="0" y2="1">
   <stop stopColor={highlight}/><stop offset=".27" stopColor={bevel}/><stop offset=".47" stopColor={panel}/><stop offset=".73" stopColor={shadow}/><stop offset="1" stopColor={edge}/>
  </linearGradient></defs>
  {[left,right].map((x,i)=><g key={i} transform={`translate(${x} ${y}) scale(${i===0?1:-1} ${facing})`}>
   <path d={plate} fill={metal} stroke="#152335" strokeWidth="7"/>
   <path d="M-21 0H17M-17 10H9" fill="none" stroke={color} strokeWidth="4"/>
   <circle cx="-20" cy="-10" r="4" fill="#e9f2fa"/><circle cx="23" cy="6" r="4" fill="#182639"/>
  </g>)}
  {level>=3&&[wingLeft,wingRight].map((x,i)=><g key={i} transform={`translate(${x} ${wingY}) scale(${i===0?1:-1} ${facing})`}>
   <path d={wing} fill={metal} stroke="#172132" strokeWidth="9"/>
   <path d="M11-17-22-16-52-29M9 7-19 8-42-3" stroke="#cfdeeb" strokeWidth="4" fill="none"/>
   {level===5&&<><path d={fin} fill={metal} stroke="#152130" strokeWidth="8"/><path d="M-9-9H12M-14 1H9M-16 11H4" stroke={color} strokeWidth="5"/></>}
  </g>)}
  {level>=4&&['plus','minus'].map(op=>{
   const {point,radius}=engineSurface(side,vessel.id,op),[x,y]=point.map(n=>n*1000),[rx,ry]=radius.map(n=>n*1000);
   return <g key={op} transform={`translate(${x} ${y}) scale(${rx/61} ${ry/65*facing})`}>
    <path d="M-54 20-64-2-60-34-38-56-17-61-13-43-31-36-43-14-41 16ZM54 20 64-2 60-34 38-56 17-61 13-43 31-36 43-14 41 16Z" fill={metal} stroke="#203147" strokeWidth="5"/>
    <path d="M-52 7-54-17-47-31M52 7 54-17 47-31" fill="none" stroke={color} strokeWidth="5"/>
   </g>;
  })}
 </g>;
}

export function ShipArtwork({side,vessel,onLoad,...props}){
 const facing=side==='player'?'player_to_enemy':'enemy_to_player';
 const format=WEBP_HULLS.has(vessel.id)?'webp':'png',upgrade=shipEvolution(vessel.id,vessel.level);
 return <g {...props}>
  <image href={`${ASSET_ROOT}/mathfleet/views/${facing}/${vessel.id}_complete.${format}`} width="1000" height="1000" onLoad={onLoad}/>
  {upgrade&&<HullPlating side={side} vessel={vessel} upgrade={upgrade}/>}
 </g>;
}

export function ShipCard({vessel,selected,onSelect,comboLabels,children}){
 const engines=Object.keys(vessel.engines);
 const totalHp=Object.values(vessel.engines).reduce((hp,engine)=>hp+engine.max,0);
 const triggers=[...new Set(vessel.weapons.map(weapon=>weapon.seme_trigger))];
 return <button type="button" className={`ship-card${selected?' on':''}`} data-ship-card={vessel.id} data-rarity={vessel.rarity} data-level={vessel.level} aria-pressed={selected} onClick={onSelect}>
  <span className="ship-card-meta"><span>{vessel.rarity}</span><b>L{vessel.level}</b><span aria-hidden="true">{selected?'✓':'+'}</span></span>
  <span className="ship-card-name">{vessel.name}</span>
  <span className="ship-card-render complete-ship" aria-hidden="true">
   <svg viewBox="0 0 1000 1000">
    <ShipArtwork side="player" vessel={vessel}/>
    {engines.filter(op=>op==='times'||op==='divide').map(op=>{
     const {point,radius}=engineSurface('player',vessel.id,op);
     const [x,y]=point.map(n=>n*1000),[rx,ry]=radius.map(n=>n*1000);
     return <g key={op} data-card-reactor={op}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#24384b" stroke="#98a8b6" strokeWidth="12"/>
      <ellipse cx={x} cy={y} rx={rx*.47} ry={ry*.47} fill={SHIP_GLOW[vessel.id]}/></g>;
    })}
   </svg>
   {children}
  </span>
  <span className="ship-card-stats">
   <span>{vessel.weapons.length} {vessel.weapons.length===1?'arma':'armi'} <b>{triggers.map(s=>SUIT_SIGNS[s]??'◎').join(' ')}</b></span>
   <span>{totalHp} HP</span>
  </span>
  <span className="ship-card-operations" aria-label={`Motori ${engines.map(op=>META[op].name).join(', ')}`}>
   {engines.map(op=><b key={op} data-card-engine={op}>{META[op].sign}</b>)}
  </span>
  {comboLabels.length>0&&<span className="ship-card-combo">{comboLabels.join(' · ')}</span>}
 </button>;
}
