import React,{useId} from 'react';
import {META,PHASE1_SHIPS,SUIT_SIGNS,getShipDefinition,newVessel,shipSuits} from './mathDuelEngine.js';
import {engineSurface,weaponMount,weaponMuzzleCount} from './mathFleetGeometry.js';
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

export const WEAPON_COLORS={H:'#ff576b',D:'#58e6ff',C:'#4aff9b',S:'#c176ff','*':'#ecfcff'};
export const WEAPON_SIGNS={...SUIT_SIGNS,'*':'◎'};
export const CARD_SUIT_COLORS={'♥':'#ff727d','♦':'#68d6ff','♠':'#c47dff','♣':'#74eacb'};
const SUIT_NAMES={H:'Cuori',D:'Quadri',C:'Fiori',S:'Picche'};
export function comboLabel(weapon){
 const [codes,limit]=weapon.combo.split('@'),symbols=codes.split('+').map(s=>WEAPON_SIGNS[s]).join(' + ');
 return limit?`Memoria ${symbols} · entro ${limit} calcoli`:`Combo ${symbols}`;
}
function WeaponMount({side,vessel,weapon,registerGunRef,index,effect,muzzleIndex=0}){
 const mount=weaponMount(side,vessel.id,weapon.id,muzzleIndex),metalId=`metal-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
 if(!mount)return null;
 const event=effect?.side===side?effect.volleys.find(s=>s.vesselIndex===index&&s.weaponId===weapon.id):null;
 const salvo=effect?.side===side?effect.salvos.find(s=>s.shot.vesselIndex===index&&s.shot.weaponId===weapon.id):null;
 const rounds=salvo?.rounds.filter(r=>r.muzzleIndex===muzzleIndex)||[];
 const accumulating=weapon.tipo==='Accumulo',charge=accumulating?Math.min(1,(event?.charge??weapon.charge??0)/weapon.soglia_munizioni):0;
 const color=WEAPON_COLORS[weapon.seme_trigger]||'#e8ffff';
 const armor=shipEvolution(vessel.id,vessel.level)&&vessel.level>=3?vessel.level===5?2:1:0;
 return <span className={`weapon-mount integrated-mount mount-${mount.profile}${accumulating?' charging':''}${rounds.length?' firing':''}${event?.charging?' charge-received':''}`} data-weapon={weapon.id} data-muzzle-index={muzzleIndex} data-charge={Math.round(charge*100)} data-armor={armor||undefined}
  style={{left:`${mount.point[0]*100}%`,top:`${mount.point[1]*100}%`,width:`${mount.width*(1+armor*.12)*100}%`,height:`${mount.length*(1+armor*.08)*100}%`,'--gun':color,
   ...(rounds.length?{'--recoil-delay':`${rounds[0].launchMs}ms`,'--recoil-duration':`${Math.max(24,(rounds.at(-1).launchMs-rounds[0].launchMs)/Math.max(1,rounds.length-1))}ms`,'--recoil-count':rounds.length}:{})}}
  title={`${weapon.nome}: ${WEAPON_SIGNS[weapon.seme_trigger]||'◎'} · ${weapon.tipo} · ${weapon.damage} danni/proiettile${accumulating?` · Carica ${event?.charge??weapon.charge??0}/${weapon.soglia_munizioni}`:''}${weapon.combo?` · ${comboLabel(weapon)}`:''}`}>
  <svg className="weapon-hardware" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
   <defs><linearGradient id={metalId}><stop offset="0" stopColor="#101826"/><stop offset=".3" stopColor="#8198ab"/><stop offset=".5" stopColor="#dbe4ea"/><stop offset=".72" stopColor="#3b4b60"/><stop offset="1" stopColor="#101826"/></linearGradient></defs>
   <path d="M28 16 72 16 86 85 68 96 32 96 14 85Z" fill={`url(#${metalId})`} stroke="#111c2b" strokeWidth="5"/>
   {mount.profile==='adaptive'&&<><path d="M32 54 32 15Q50-8 68 15V54" fill="#142533" stroke="#b3d9e9" strokeWidth="6"/><ellipse cx="50" cy="8" rx="14" ry="7" fill={color}/><path d="M31 68H69M31 80H69" stroke="#70c7e4" strokeWidth="5"/></>}
   {mount.profile==='laser'&&<><path d="M39 8H61V75H39Z" fill="#35141e" stroke="#f3adb7" strokeWidth="5"/><path d="M46 8V60" stroke={color} strokeWidth="10"/><ellipse cx="50" cy="4" rx="12" ry="5" fill="#ffbec8"/><path d="M25 59H35M65 59H75M25 75H35M65 75H75" stroke={color} strokeWidth="6"/></>}
   {mount.profile==='prism'&&<><path d="M50 2 73 32 67 69 50 87 33 69 27 32Z" fill="#092d49" stroke="#77d9f1" strokeWidth="4"/><path d="M50 8 66 35 50 75 34 35Z" fill={color} opacity={.22+charge*.78}/><path d="M50 8V75M34 35H66" stroke="#dcfaff" strokeWidth="3"/><path d="M25 88H75" stroke="#102839" strokeWidth="8"/><path d={`M25 88H${25+charge*50}`} stroke={color} strokeWidth="8"/></>}
   {mount.profile==='gatling'&&<><path d="M28 54V6H43V54M57 54V6H72V54M44 63V0H56V63" fill="#182b26" stroke="#a9c0ad" strokeWidth="4"/><path d="M23 39H77V51H23Z" fill="#435650" stroke="#111d1a" strokeWidth="4"/><path d="M33 7H40M60 7H67M47 2H53" stroke={color} strokeWidth="6"/><path d="M33 76H67" stroke={color} strokeWidth="5"/></>}
   {mount.profile==='arc'&&<><path d="M22 69Q8 26 36 5L42 16Q24 37 35 66M78 69Q92 26 64 5L58 16Q76 37 65 66" fill="#483556" stroke="#c7a5e2" strokeWidth="4"/><ellipse cx="50" cy="10" rx="8" ry="10" fill={color}/><path d="M29 55Q50 80 71 55M34 70Q50 90 66 70" fill="none" stroke={color} strokeWidth="5"/></>}
   {mount.profile==='needles'&&<><path d="M24 58 30 7 37 58M42 62 50 0 58 62M63 58 70 7 76 58" fill="#bda1d2" stroke="#31213e" strokeWidth="4"/><path d="M23 64H77V77H23Z" fill="#392748" stroke="#9b7eb6" strokeWidth="4"/><path d="M30 8 33 25M50 3V24M70 8 67 25" stroke={color} strokeWidth="4"/></>}
   {mount.profile==='drum'&&<><path d="M40 8H60V43H40Z" fill="#201e29" stroke="#b1a7b4" strokeWidth="5"/><ellipse cx="50" cy="5" rx="12" ry="5" fill={color}/><ellipse cx="50" cy="63" rx="32" ry="25" fill="#28222c" stroke="#bda6ac" strokeWidth="6"/><path d="M27 48V78M42 41V85M58 41V85M73 48V78" stroke="#624852" strokeWidth="5"/><ellipse cx="50" cy="63" rx="24" ry="18" fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${charge*132} 132`} opacity={.3+charge*.7}/></>}
   {mount.profile==='twin'&&<><path d="M36 6H64V74H36Z" fill="#481f29" stroke="#dfb88a" strokeWidth="5"/><path d="M44 7V61M56 7V61" stroke={color} strokeWidth="5"/><ellipse cx="50" cy="4" rx="13" ry="5" fill="#fff0db"/><path d="M23 66H77M25 78H75" stroke="#bda078" strokeWidth="6"/></>}
   {mount.profile==='crystal'&&<><path d="M37 5H63L70 76 50 91 30 76Z" fill="#183844" stroke="#b4efff" strokeWidth="5"/><path d="M50 0 61 22 50 72 39 22Z" fill={color} opacity={.35+charge*.65}/><path d="M50 0V72M39 22H61" stroke="#eafcff" strokeWidth="3"/><path d="M25 89H75" stroke="#182d39" strokeWidth="7"/><path d={`M25 89H${25+50*charge}`} stroke={color} strokeWidth="7"/></>}
   {mount.profile==='coil'&&<><path d="M35 12H65V83H35Z" fill="#17352e" stroke="#a4cbbf" strokeWidth="4"/>{[22,39,56,73].map(y=><ellipse key={y} cx="50" cy={y} rx="26" ry="10" fill="none" stroke={color} strokeWidth="6"/>)}<path d="M44 3H56V80H44Z" fill="#dafff0" opacity=".65"/></>}
   {mount.profile==='cross'&&<><path d="M17 73 29 5 43 68M57 68 71 5 83 73" fill="#3b2b52" stroke="#bc9dd7" strokeWidth="5"/><path d="M29 5 50 28 71 5M27 25 50 45 73 25" fill="none" stroke="#86ffc1" strokeWidth="4"/><path d="M29 5 71 5" stroke={color} strokeWidth="6"/></>}
   {mount.profile==='photon'&&<><path d="M34 20H66V79H34Z" fill="#493042" stroke="#f7c9c4" strokeWidth="5"/><ellipse cx="50" cy="16" rx="22" ry="14" fill="#ffb6ad" stroke="#fff4e6" strokeWidth="4"/><ellipse cx="50" cy="16" rx="10" ry="7" fill="#fff8ec"/><path d="M26 54H74M29 71H71" stroke="#f7c9c4" strokeWidth="5"/></>}
   {mount.profile==='facet'&&<><path d="M50 1 74 35 68 79 50 95 32 79 26 35Z" fill="#775831" stroke="#ffe2a0" strokeWidth="5"/><path d="M50 4 66 35 50 81 34 35Z" fill="#ffc85f"/><path d="M50 4V81M34 35H66" stroke="#fffae3" strokeWidth="3"/></>}
   {mount.profile==='plasma'&&<><path d="M31 68V20H69V68Z" fill="#352642" stroke="#c6b2e7" strokeWidth="5"/><ellipse cx="50" cy="28" rx="27" ry="23" fill="#452063" stroke="#c09bff" strokeWidth="4"/><ellipse cx="50" cy="28" rx="16" ry="14" fill={color} opacity={.18+charge*.8}/><path d="M18 73H82M25 85H75" stroke="#8d70b1" strokeWidth="5"/><path d={`M25 85H${25+50*charge}`} stroke={color} strokeWidth="6"/></>}
   {mount.profile==='harpoon'&&<><path d="M37 6H63V84H37Z" fill="#24313b" stroke="#d1e1e7" strokeWidth="6"/><path d="M50 0 60 24H54V68H46V24H40Z" fill="#ecfbff"/>{[36,51,66,81].map(y=><path key={y} d={`M29 ${y}H71`} stroke="#819baf" strokeWidth="5"/>)}</>}
   {mount.profile==='compressor'&&<><ellipse cx="50" cy="49" rx="34" ry="37" fill="#173a2c" stroke="#b6d3bb" strokeWidth="6"/><ellipse cx="50" cy="43" rx="24" ry="26" fill="#07231d" stroke={color} strokeWidth="5"/><ellipse cx="50" cy="43" rx="14" ry="16" fill={color} opacity={.15+charge*.85}/><path d="M15 42H85M50 9V77" stroke="#bbffd5" strokeWidth="3" opacity=".5"/><path d={`M21 88H${21+58*charge}`} stroke={color} strokeWidth="7"/></>}
   {mount.profile==='eclipse-core'&&<><path d="M20 83 29 18 50 2 71 18 80 83 50 94Z" fill="#241733" stroke="#e8b56b" strokeWidth="6"/><ellipse cx="50" cy="26" rx="20" ry="17" fill="#0b0715" stroke={color} strokeWidth="5"/><path d="M29 61H71M26 77H74" stroke="#a995be" strokeWidth="4"/></>}
   {mount.profile==='void-core'&&<><path d="M29 10H71L83 74 67 92H33L17 74Z" fill="#1d2f48" stroke="#eee3d5" strokeWidth="5"/><ellipse cx="50" cy="30" rx="22" ry="21" fill="#0d0b22" stroke={color} strokeWidth="5"/><path d="M50 4V15M50 45V62M21 30H32M68 30H79" stroke="#e4daff" strokeWidth="5"/></>}
   {armor>0&&<><path d="M16 23 34 17 35 31 29 71 14 79 9 59ZM84 23 66 17 65 31 71 71 86 79 91 59Z" fill={`url(#${metalId})`} stroke="#202d3f" strokeWidth="5"/>
    <path d="M20 32 16 54M80 32 84 54" stroke={color} strokeWidth="5"/></>}
   {armor===2&&<><path d="M26 77 42 67H58L74 77 69 95H31Z" fill="#8294a7" stroke="#1d2b3a" strokeWidth="5"/>
    <path d="M36 83H64M42 90H58" stroke={color} strokeWidth="5"/></>}
  </svg>
  <span ref={node=>registerGunRef?.(side,index,`${weapon.id}${muzzleIndex?`/${muzzleIndex}`:''}`,node)} className="weapon-tip muzzle-anchor"/>
 </span>;
}
export function MountedWeapons({side,vessel,index,effect,registerGunRef}){
 return <span className="ship-hardpoints">{vessel.weapons.flatMap(weapon=>
  Array.from({length:weaponMuzzleCount(weapon.id)},(_,muzzleIndex)=><WeaponMount key={`${weapon.id}/${muzzleIndex}`}
   side={side} vessel={vessel} weapon={weapon} index={index} effect={effect} muzzleIndex={muzzleIndex} registerGunRef={registerGunRef}/>))}</span>;
}

function ShipCardModel({vessel,engines}){
 return <span className="ship-card-render complete-ship" aria-hidden="true">
  <svg viewBox="0 0 1000 1000">
   <ShipArtwork side="player" vessel={vessel}/>
   {engines.filter(op=>op==='times'||op==='divide').map(op=>{
    const {point,radius}=engineSurface('player',vessel.id,op);
    const [x,y]=point.map(n=>n*1000),[rx,ry]=radius.map(n=>n*1000);
    return <g key={op} data-card-reactor={op}><ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#24384b" stroke="#98a8b6" strokeWidth="12"/>
     <ellipse cx={x} cy={y} rx={rx*.47} ry={ry*.47} fill={SHIP_GLOW[vessel.id]}/></g>;
   })}
  </svg>
  <MountedWeapons side="player" vessel={vessel}/>
 </span>;
}

export function ShipCard({shipId,level,vessel=newVessel(shipId,level),selected,onSelect,status,disabled,compact=false}){
 const Tag=onSelect?'button':'article';
 const interactive=onSelect?{type:'button','aria-pressed':selected,onClick:onSelect,disabled}:{};
 const engines=Object.keys(vessel.engines);
 const totalHp=Object.values(vessel.engines).reduce((hp,engine)=>hp+engine.max,0);
 const suits=shipSuits(vessel.id);
 const cardSuits=suits.length?suits:Object.keys(SUIT_SIGNS);
 const combos=vessel.weapons.filter(weapon=>weapon.combo);
 return <Tag className={`ship-card${selected?' on':''}`} data-ship-card={vessel.id} data-rarity={vessel.rarity} data-level={vessel.level} {...interactive}>
  <span className="ship-card-face">
   <span className="ship-card-index">
    <span className="ship-card-suits" role="img" aria-label={suits.length?cardSuits.map(suit=>SUIT_NAMES[suit]).join(', '):'Tutti i semi'}>
     {cardSuits.map(suit=><b key={suit} aria-hidden="true" style={{color:CARD_SUIT_COLORS[WEAPON_SIGNS[suit]]}}>{WEAPON_SIGNS[suit]}</b>)}
    </span>
    <b className="ship-card-level">L{vessel.level}</b>
   </span>
   <span className="ship-card-name">{vessel.name}</span>
   <span className="ship-card-role">{getShipDefinition(vessel.id).ruolo}</span>
   <span className="ship-card-stats">
    <span><b>{totalHp}</b> HP</span>
    <span><b>{vessel.weapons.length}</b> {vessel.weapons.length===1?'arma':'armi'}</span>
   </span>
   <span className="ship-card-operations" aria-label={`Motori ${engines.map(op=>META[op].name).join(', ')}`}>
    {engines.map(op=><b key={op} data-card-engine={op}>{META[op].sign}</b>)}
   </span>
   <span className="ship-card-meta"><span>{vessel.rarity}</span><span>{vessel.id}</span></span>
  </span>
  {onSelect&&<span className="ship-card-selection" aria-hidden="true">{selected?'✓':'+'}</span>}
  {!compact&&<ShipCardModel vessel={vessel} engines={engines}/>}
  {!compact&&combos.length>0&&<span className="ship-card-combo">{combos.map(comboLabel).join(' · ')}</span>}
  {status&&<span className="ship-card-status">{status}</span>}
 </Tag>;
}
