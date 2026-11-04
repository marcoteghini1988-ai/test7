import React,{useState,useEffect,useRef,useLayoutEffect,useId} from 'react';

import {ENGINE_KEYS,META,PHASE1_SHIPS,SUIT_SIGNS,SUIT_KEYS,newVessel,newShip,initialBattle,evaluatePair,inspectCalculation,rankLabel,aiChoose,dealHit,consumeAttack,sacrificeCard,etherChange,isDestroyed,deckExhausted,deckVerdict,healthScore,generateTargets,supportedOperators,validFleet,previewVolley,vesselDestroyed,nextAttackTarget,fleetCompatibility,memoryComboStatus,resetComboMemory} from './mathDuelEngine.js';
import {enginePoint,boardPoint,fleetFormation,engineHudShift,engineHudPlacement,engineVisualState,engineSurface,weaponMount,weaponMuzzleCount} from './mathFleetGeometry.js';
import {planWeaponSalvos,volleyTimeline,projectileFrame,projectileWidth} from './mathWeaponEffects.js';
import {ASSET_ROOT,SHIP_GLOW,ShipArtwork,ShipCard} from './ShipPresentation.jsx';
import {shipEvolution} from './shipEvolution.js';
import {collectionBattleOptions,equipShipCards,readShipCollection,updateShipCollection} from './shipCollection.js';
import './MathDuelBattle.css';
const ARENA_BACKGROUND=`${ASSET_ROOT}/mathduel/arena_titanio_9x16.webp`;
function ArenaBackdrop(){
 return <div className="space-back metal-arena" aria-hidden="true" style={{backgroundImage:`url('${ARENA_BACKGROUND}')`}}/>;
}
const suits={'♥':'#ff727d','♦':'#68d6ff','♠':'#c47dff','♣':'#74eacb'};
const bulletColors={H:'#ff576b',D:'#58e6ff',C:'#4aff9b',S:'#c176ff','*':'#ecfcff'};
const label=rankLabel;
const clone=v=>structuredClone(v);
function tone(name){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;o.type=name==='shot'?'sawtooth':'sine';o.frequency.setValueAtTime(name==='shot'?180:470,now);o.frequency.exponentialRampToValueAtTime(name==='shot'?46:650,now+.19);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.025,now+.014);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+.23);}catch{}}
function volleySound(salvos){try{
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());if(ctx.state==='suspended')ctx.resume();
 // One quiet synthesizer per weapon, with an envelope for every actual round.
 const volume=.022/Math.sqrt(Math.max(1,salvos.length));
 for(const {fx,rounds} of salvos){
  const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;
  o.type=fx.sound;g.gain.setValueAtTime(.0001,now);
  for(const round of rounds){const at=now+round.launchMs/1000,next=rounds[round.index+1],duration=Math.min(.065,next?(next.launchMs-round.launchMs)/1000*.8:.065);
   o.frequency.setValueAtTime(fx.hz,at);o.frequency.exponentialRampToValueAtTime(fx.endHz,at+duration);
   g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(volume,at+.004);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  }
  o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+(rounds.at(-1).launchMs+90)/1000);
 }
}catch{}}
// Position of the FOUR visible engine modules on the actual starship illustration.
// Coordinates follow each sprite's camera view without flipping its orientation.
const GLYPH={H:'♥',D:'♦',C:'♣',S:'♠','*':'◎'};
function comboLabel(weapon){
 const [codes,limit]=weapon.combo.split('@'),symbols=codes.split('+').map(s=>GLYPH[s]).join(' + ');
 return limit?`Memoria ${symbols} · entro ${limit} calcoli`:`Combo ${symbols}`;
}
function EngineArea({surface,fill}){
 const [x,y]=surface.point.map(n=>n*1000),[rx,ry]=surface.radius.map(n=>n*1000);
 return <g fill={fill}><ellipse cx={x} cy={y} rx={rx} ry={ry}/>
  {surface.exhaustY!=null&&<polygon points={`${x-rx*.65},${y} ${x+rx*.65},${y} ${x+rx*.25},${surface.exhaustY*1000} ${x-rx*.25},${surface.exhaustY*1000}`}/>}</g>;
}
function ShipSkin({side,vessel,imageRef}){
 const id=`hull-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`,[loaded,setLoaded]=useState(false);
 const damaged=Object.entries(vessel.engines).map(([op,engine])=>({op,state:engineVisualState(engine),surface:engineSurface(side,vessel.id,op)})).filter(e=>e.state!=='intact');
 return <svg ref={imageRef} className="fleet-ship-img" viewBox="0 0 1000 1000" role="img" aria-label={`${vessel.name}, livello ${vessel.level}`} data-loaded={loaded}>
  <defs>
   <mask id={`${id}-healthy`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000"><rect width="1000" height="1000" fill="white"/>{damaged.map(e=><EngineArea key={e.op} surface={e.surface} fill="black"/>)}</mask>
   {damaged.map(e=><React.Fragment key={e.op}>
    <clipPath id={`${id}-${e.op}-area`}><EngineArea surface={e.surface}/></clipPath>
    <filter id={`${id}-${e.op}-burn`} colorInterpolationFilters="sRGB"><feColorMatrix type="saturate" values={e.state==='destroyed'?'.05':'.45'}/><feComponentTransfer>{['R','G','B'].map(channel=>React.createElement(`feFunc${channel}`,{key:channel,type:'linear',slope:e.state==='destroyed'?.22:e.state==='critical'?.42:.68}))}</feComponentTransfer></filter>
   </React.Fragment>)}
  </defs>
  <ShipArtwork side={side} vessel={vessel} onLoad={()=>setLoaded(true)} mask={damaged.length?`url(#${id}-healthy)`:undefined}/>
  {damaged.map(e=><ShipArtwork key={e.op} side={side} vessel={vessel} clipPath={`url(#${id}-${e.op}-area)`} filter={`url(#${id}-${e.op}-burn)`}/>) }
 </svg>;
}
function WeaponMount({side,vessel,weapon,registerGunRef,index,effect,muzzleIndex=0}){
 const mount=weaponMount(side,vessel.id,weapon.id,muzzleIndex),metalId=`metal-${useId().replace(/[^a-zA-Z0-9_-]/g,'')}`;
 if(!mount)return null;
 const event=effect?.side===side?effect.volleys.find(s=>s.vesselIndex===index&&s.weaponId===weapon.id):null;
 const salvo=effect?.side===side?effect.salvos.find(s=>s.shot.vesselIndex===index&&s.shot.weaponId===weapon.id):null;
 const rounds=salvo?.rounds.filter(r=>r.muzzleIndex===muzzleIndex)||[];
 const accumulating=weapon.tipo==='Accumulo',charge=accumulating?Math.min(1,(event?.charge??weapon.charge??0)/weapon.soglia_munizioni):0;
 const color=bulletColors[weapon.seme_trigger]||'#e8ffff';
 const armor=shipEvolution(vessel.id,vessel.level)&&vessel.level>=3?vessel.level===5?2:1:0;
 return <span className={`weapon-mount integrated-mount mount-${mount.profile}${accumulating?' charging':''}${rounds.length?' firing':''}${event?.charging?' charge-received':''}`} data-weapon={weapon.id} data-muzzle-index={muzzleIndex} data-charge={Math.round(charge*100)} data-armor={armor||undefined}
  style={{left:`${mount.point[0]*100}%`,top:`${mount.point[1]*100}%`,width:`${mount.width*(1+armor*.12)*100}%`,height:`${mount.length*(1+armor*.08)*100}%`,'--gun':color,
   ...(rounds.length?{'--recoil-delay':`${rounds[0].launchMs}ms`,'--recoil-duration':`${Math.max(24,(rounds.at(-1).launchMs-rounds[0].launchMs)/Math.max(1,rounds.length-1))}ms`,'--recoil-count':rounds.length}:{})}}
  title={`${weapon.nome}: ${GLYPH[weapon.seme_trigger]||'◎'} · ${weapon.tipo} · ${weapon.damage} danni/proiettile${accumulating?` · Carica ${event?.charge??weapon.charge??0}/${weapon.soglia_munizioni}`:''}${weapon.combo?` · ${comboLabel(weapon)}`:''}`}>
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
function MountedWeapons({side,vessel,index,effect,registerGunRef}){
 return <span className="ship-hardpoints">{vessel.weapons.flatMap(weapon=>
  Array.from({length:weaponMuzzleCount(weapon.id)},(_,muzzleIndex)=><WeaponMount key={`${weapon.id}/${muzzleIndex}`}
   side={side} vessel={vessel} weapon={weapon} index={index} effect={effect} muzzleIndex={muzzleIndex} registerGunRef={registerGunRef}/>))}</span>;
}
function Engine({side,op,vessel,target,selected,onSelect,enabled,hit,available,engineRef,formation,impactDelay}){
 const engine=vessel.engines[op];if(!engine)return null;
 const dead=engine.hp<=0,ratio=Math.max(0,engine.hp/engine.max);
 const state=engineVisualState(engine),surface=engineSurface(side,vessel.id,op),aux=op==='times'||op==='divide';
 const [px,py]=enginePoint(side,vessel.id,op);
 const narrow=side==='player'&&vessel.id==='C04'&&(op==='plus'||op==='minus');
 return <button type="button" style={{left:`${px*100}%`,top:`${py*100}%`,
  '--hud-shift':`${engineHudShift(side,vessel.id,op,formation.size,formation.hudWidth)}px`,'--hit-delay':`${impactDelay||0}ms`,
  '--core-width':`${surface.radius[0]*2*formation.size}px`,'--core-height':`${surface.radius[1]*2*formation.size}px`,'--engine-color':SHIP_GLOW[vessel.id]||'#5edbff',
  ...(narrow?{'--engine-width':`${Math.min(24,formation.size*.11-2)}px`}:{})}}
  className={`vessel-engine ve-${op} ve-${side} hud-${engineHudPlacement(side,vessel.id,op)}${aux?' auxiliary-engine':''}${selected&&!dead?' selected':''}${dead?' dead':''}${hit?' hit':''}`}
  disabled={!enabled||dead||!available} data-state={state} onClick={()=>onSelect?.(op)}
  aria-pressed={!!selected}
  aria-label={`${side==='enemy'?'Nemico':'Tu'}: ${vessel.name}, motore ${META[op].name}, ${engine.hp} di ${engine.max} HP, bersaglio ${target??'non disponibile'}`}>
  <span ref={engineRef} className="engine-anchor" aria-hidden="true"/>
  <span className="engine-core" aria-hidden="true"><i className="engine-iris"/><svg className="engine-fracture" viewBox="0 0 100 100"><path d="M13 23 42 40 30 62 63 54 87 82M61 12 52 38 73 27M32 65 24 86"/></svg></span>
  <span className="vessel-engine-hud">
   <strong>{dead?'✕':enabled&&target!=null?`${META[op].sign}${target}`:META[op].sign}</strong>
   <small>{dead?'KO':`${engine.hp} HP`}</small>
   <i className="vessel-engine-meter"><em style={{width:`${ratio*100}%`}}/></i>
  </span>
  {dead&&<span className="vessel-smoke"/>}
 </button>;
}
function Ship({side,ship,targets,focused,onSelectShip,selectedTarget,onTarget,phase,effect,availableOps,registerShipRef,registerEngineRef,registerGunRef}){
 const enemy=side==='enemy',targetable=enemy&&phase==='ready';
 const formation=fleetFormation(ship.fleet.length,side);
 const hit=effect&&effect.side!==side&&effect.targetShip===focused;
 return <div data-fleet-size={ship.fleet.length} className={`ship-zone ship-${side}${hit?' ship-struck':''}${effect?' ship-in-combat':''}`}>
  <div className="fleet-ships">
   {ship.fleet.map((v,i)=>{
    const focusedShip=i===focused,dead=vesselDestroyed(v);
    return <div key={i} data-ship={v.id} data-level={v.level} data-vessel-index={i} className={`fleet-ship-wrap complete-ship${focusedShip?' focused':''}${dead?' dead-ship':''}`}
     style={{left:`${formation.centers[i]/450*100}%`,top:formation.top,width:formation.size,height:formation.size,
      '--engine-size':`${formation.engineSize}px`,'--engine-hud-width':`${formation.hudWidth}px`,zIndex:focusedShip?3:1}}>
     <ShipSkin key={v.id} side={side} vessel={v} imageRef={node=>registerShipRef?.(side,i,node)}/>
     <MountedWeapons side={side} vessel={v} index={i} effect={effect} registerGunRef={registerGunRef}/>
     {ENGINE_KEYS.map(op=><Engine key={op} side={side} op={op} vessel={v} formation={formation}
      target={targets?.[op]} selected={enemy&&focusedShip&&selectedTarget===op} onSelect={()=>onTarget?.(i,op)} enabled={targetable}
      available={!enemy||availableOps.includes(op)} hit={!!effect&&effect.side!==side&&effect.targetShip===i&&effect.op===op}
      engineRef={node=>registerEngineRef?.(side,i,op,node)} impactDelay={effect?.arrivalMs}/>) }
    </div>;
   })}
   <div className={'engine-thruster '+(enemy?'red':'blue')}/>
  </div>
  <div className={`fleet-picker-inline${ship.fleet.length===1?' single-ship':''}`}>{ship.fleet.map((v,i)=><button key={i} type="button"
   className={focused===i?'focus':''} onClick={()=>onSelectShip?.(i)} aria-pressed={focused===i}
   style={{left:`${formation.centers[i]/450*100}%`,width:Math.min(160,formation.size-8)}}
   disabled={enemy&&phase!=='ready'} title={`${v.name} · ${v.level}`}>
   <span className={`fleet-dot${vesselDestroyed(v)?' lost':''}`}/>{v.name} · L{v.level}</button>)}</div>
  {ship.fleet.every(vesselDestroyed)&&<span className="fleet-eliminated">FLOTTA DISTRUTTA</span>}
 </div>;
}
function Pips({ship}){return <div className="pips">{ship.fleet.map((v,i)=><span key={i} className={vesselDestroyed(v)?'broken':'good'}/>)}</div>}
function rootCoords(root,node){return root&&node?boardPoint(root.getBoundingClientRect(),node.getBoundingClientRect()):null;}
function RoundGlyph({profile,index}){
 return <svg viewBox="-24 -16 48 32" preserveAspectRatio="none" className="round-glyph" aria-hidden="true">
  {profile==='pulse'&&<><path d="M-23 0H-9M-17-4H-9M-17 4H-9" className="round-tail"/><circle r="8" className="round-fill"/><circle r="11" className="round-line"/><circle r="3" fill="#fff"/></>}
  {profile==='laser'&&<><path d="M-23 0H22" className="round-line" strokeWidth="7"/><path d="M-21 0H20" stroke="#fff1f4" strokeWidth="2"/><path d="M-22-5H-12M-22 5H-12" className="round-tail"/></>}
  {profile==='prism'&&<><path d="M-23-5-18-8-15-5-18-2ZM-21 7-17 3-13 7-17 11" className="round-fill"/><circle cx="3" r="10" className="round-fill"/><path d="M3-10 12 0 3 10-6 0ZM3-10V10M-6 0H12" className="round-line" stroke="#edfeff"/></>}
  {profile==='dart'&&<g transform={`scale(1 ${index%2?-1:1})`}><path d="M-22 0H-9" className="round-tail"/><path d="M-12-3 18 0-12 3-7 0Z" fill="#b6d0c1" stroke="currentColor"/><path d="M-11-3-17-8-4-3M-11 3-17 8-4 3" className="round-fill"/><path d="M-7 0H14" stroke="#effff7"/></g>}
  {profile==='arc'&&<><path d="M-23 10Q-12-7 1-5" className="round-tail"/><path d="M-10-10Q5-11 17 0L-5 11 2 0Z" className="round-fill"/><path d="M-10-10Q8-8 17 0L-5 11" className="round-line" stroke="#f8deff"/></>}
  {profile==='needle'&&<><path d="M-24 0H-11" className="round-tail"/><path d="M-15-2 23 0-15 2-9 0Z" fill="#f9edff"/><path d="M-17-3 21 0-17 3" className="round-line"/></>}
  {profile==='capsule'&&<><path d="M-23-3-14 0-23 3M-20-6-11 0-20 6" className="round-tail"/><rect x="-10" y="-7" width="25" height="14" rx="6" fill="#8e2933" stroke="currentColor" strokeWidth="2"/><path d="M-3-5V5M7-5V5" stroke="#ffdb87" strokeWidth="3"/><ellipse cx="14" rx="4" ry="6" fill="#fff0b8"/></>}
  {profile==='twin'&&<><path d="M-22 0H22" stroke="currentColor" strokeWidth="7"/><path d="M-21 0H20" stroke="#ffe5ce" strokeWidth="2"/><path d="M-19-5H-12M-19 5H-12" className="round-tail"/></>}
  {profile==='diamond'&&<><path d="M-23-3-16-7-12-3-16 1M-21 7-16 3-12 7-16 11" className="round-tail"/><g className="crystal-spin"><path d="M1-14 19 0 1 14-14 0Z" className="round-fill"/><path d="M1-14V14M-14 0H19M1-14 8 0 1 14-5 0Z" className="round-line" stroke="#edfdff"/></g></>}
  {profile==='ion'&&<><path d="M-23 3-13-6-7 4 2-9 8 2 21-3M-11-4-15-13M3-7 8-14M9 1 15 12" className="round-line" strokeWidth="3"/><path d="M-20 3-11-3-5 5 3-6 9 4 22-3" fill="none" stroke="#eaffef" strokeWidth="1"/></>}
  {profile==='cross-ion'&&<><path d="M-23-9-11 6-2-3 8 8 23-8" fill="none" stroke="#76ffba" strokeWidth="3"/><path d="M-23 10-10-6 0 5 10-8 23 7M-12-5-15-13M10 5 15 14" className="round-line" strokeWidth="3"/><circle r="3" fill="#fff"/></>}
  {profile==='photon'&&<><path d="M-23 0H-11" className="round-tail"/><circle r="9" fill="#ffaaa0"/><circle r="5" fill="#fff0dd"/><circle r="13" className="round-line" strokeWidth="1"/><path d="M0-16V-12M0 12V16M-16 0H-12M12 0H16" className="round-line"/></>}
  {profile==='facet'&&<><path d="M-22 4-17-2-12 4Z" className="round-fill"/><path d="M-9-13 20 0-9 13Z" fill="#ffd375" stroke="#fff3c3" strokeWidth="1.5"/><path d="M-9-13-2 0-9 13M-2 0H20" className="round-line" stroke="#a96d27"/></>}
  {profile==='shadow'&&<><path d="M-22 8Q-15-6-5-5M-20-10-12-13-8-6" className="round-tail"/><circle r="12" fill="#38195b" stroke="currentColor" strokeWidth="2"/><path d="M-8-7Q9-14 11 0T-9 8M-10 1 0-6 6 2-2 7" className="round-line"/><circle cx="3" cy="-2" r="3" fill="#f8dfff"/></>}
  {profile==='lance'&&<><path d="M-23-6H8M-23 6H8" className="round-tail"/><path d="M-20-3 8-3 23 0 8 3-20 3-13 0Z" fill="#b7ccd8" stroke="#effaff" strokeWidth="1"/><path d="M-17 0H19" stroke="#fff"/></>}
  {profile==='orbit'&&<><circle r="8" fill="#79f6aa"/><circle r="4" fill="#edfff0"/><g className="orbit-spin"><ellipse rx="19" ry="7" transform="rotate(35)" className="round-line"/><ellipse rx="19" ry="7" transform="rotate(-35)" className="round-line"/><circle cx="18" r="2.5" fill="#eaffed"/></g></>}
  {profile==='corona'&&<><path d="M-22-12Q-5-12 21 0Q-5 12-22 12Q-9 6-12 0Q-9-6-22-12Z" className="round-fill"/><path d="M-12-8 19 0-12 8M-9 0H20" stroke="#fff0cb" fill="none" strokeWidth="2"/></>}
  {profile==='nucleus'&&<><path d="M-13-8 0-15 14-8 19 4 5 14-10 10Z" className="round-fill"/><path d="M0-15 4 1 19 4M4 1 5 14M4 1-13-8M-10 10 4 1 14-8" stroke="#eaffff" fill="none" strokeWidth="2"/><path d="M-23-4H-16M-23 6H-14" className="round-tail"/></>}
  {profile==='vector'&&<><path d="M-22 10-11-7-4 7 4-7 11 0 22-7" className="round-line" strokeWidth="4"/><path d="M-22-9-13 4-4-9 5 9 13 4 22 7" stroke="#ffd468" fill="none" strokeWidth="2"/><circle cx="4" cy="-7" r="3" fill="#fffde7"/></>}
  {profile==='shuriken'&&<g className="crystal-spin"><path d="M0-15 4-5 14-4 6 2 8 13 0 6-11 10-6 1-13-8-3-6Z" className="round-fill"/><path d="M0-15V6M14-4-6 1M8 13-3-6" stroke="#f7ddff" fill="none"/><circle r="3" fill="#fff"/></g>}
  {profile==='comb'&&<><path d="M-21-12Q5-15 19 0Q5 15-21 12M-16-8Q1-10 13 0Q1 10-16 8" className="round-line" strokeWidth="2.5"/><path d="M-18-6H8M-18 0H19M-18 6H8" stroke="#d5ffdb" strokeWidth="2"/></>}
  {profile==='magnetic'&&<><path d="M-23 0H21" stroke="#b264ff" strokeWidth="10"/><path d="M-21 0H22" stroke="currentColor" strokeWidth="5"/><path d="M-20 0H20" stroke="#fff0f5" strokeWidth="2"/></>}
  {profile==='talon'&&<><path d="M-23 11Q-16-5 18-10Q3-3 1 7Q-10 1-23 11Z" className="round-fill"/><path d="M-10 13Q2 1 22-1L13 7Q6 4-10 13Z" fill="#ffd074"/><path d="M-15 5Q-3-5 14-9" stroke="#fff0c8" fill="none" strokeWidth="2"/></>}
  {profile==='shock'&&<><path d="M-8-14Q-21 0-8 14M-15-12Q-24 0-15 12" className="round-line" strokeWidth="2"/><circle cx="6" r="12" className="round-fill"/><circle cx="6" r="6" fill="#fff6c8"/><circle cx="6" r="9" stroke="#fff1a2" fill="none"/></>}
  {profile==='rebirth'&&<><path d="M22 0 12 4Q0 16-16 13L-6 6-23 7-11 0-23-7-6-6-16-13Q0-16 12-4Z" className="round-fill"/><path d="M-15-8Q5-5 13 0Q5 5-15 8M-13 0H19" stroke="#f6deff" fill="none" strokeWidth="2"/></>}
  {profile==='hex-chain'&&<><path d="M-21-4-15-8-9-4V4L-15 8-21 4ZM-8-5-1-10 6-5V5L-1 10-8 5ZM7-6 15-12 23-6V6L15 12 7 6Z" className="round-line" strokeWidth="2"/><path d="M-18 0H20" stroke="#e8ffed" strokeWidth="2"/></>}
  {profile==='solar-crystal'&&<g className="crystal-spin"><path d="M0-15 13-6 11 8 0 15-11 8-13-6Z" className="round-fill"/><path d="M0-15 6-3 0 15-6-3ZM-13-6 0 1 13-6M-11 8 0 1 11 8" stroke="#fff6c2" fill="none" strokeWidth="2"/></g>}
  {profile==='shadow-arrow'&&<><path d="M-23-8-16 0-23 8M-14-8-8 0-14 8" className="round-tail"/><path d="M-10 0H20M8-9 21 0 8 9" className="round-line" strokeWidth="4"/><path d="M-3 0H17" stroke="#f3eaff" strokeWidth="2"/></>}
  {profile==='bipolar'&&<><path d="M-23-6 12-6 23 0-21 0Z" fill="#ff696d"/><path d="M-21 0H23L12 6H-23Z" fill="#a47cff"/><path d="M-22 0H21" stroke="#fff4e8" strokeWidth="2"/><path d="M-22-11H7M-22 11H7" className="round-tail"/></>}
  {profile==='royal'&&<><path d="M-22-9-9-8 1-3M-23 0H7M-21 9-8 8 1 3" className="round-tail"/><ellipse cx="7" rx="14" ry="9" className="round-fill"/><path d="M-10 0H21M0-6 12 0 0 6" stroke="#ffe486" fill="none" strokeWidth="2"/><circle cx="15" r="3" fill="#fff6d3"/></>}
  {profile==='meteor'&&<><path d="M-23-10-12-8M-23 8-12 6M-21 0H-10" className="round-tail"/><path d="M-11-9-2-14 13-12 21-4 17 9 5 14-10 8Z" fill="#273a58" stroke="currentColor" strokeWidth="2"/><path d="M-8-3 0-12 3 1-4 7ZM4 1 12-9 18-4 13 7ZM-1 9 6 3 11 10 5 14Z" className="round-fill"/></>}
  {profile==='cyclone'&&<><path d="M-23-5Q-10-16 4-9T22 1M-19 11Q-6 14 9 6T19-5M-8 2Q-4-6 6-4T12 4" className="round-line" strokeWidth="2.5"/><circle cx="-14" cy="-9" r="2" fill="#f0ffd8"/><circle cx="6" cy="8" r="2" fill="#f0ffd8"/><circle cx="19" cy="-6" r="2" fill="#f0ffd8"/></>}
  {profile==='eclipse'&&<><path d="M-23 0H22" stroke="#1a0729" strokeWidth="12"/><path d="M-23-4Q-15-13-8-4T7-4T22-4M-23 0Q-15 9-8 0T7 0T22 0M-23 4Q-15-3-8 4T7 4T22 4" className="round-line" strokeWidth="2"/></>}
  {profile==='gravity'&&<><ellipse cx="3" rx="11" ry="8" fill="#25143d" stroke="#dbb1ff"/><path d="M-23-10Q-6-16 17-5Q-9-10-23-10ZM-23 10Q-6 16 17 5Q-9 10-23 10Z" className="round-fill"/><path d="M-8 0H15" className="round-line"/></>}
  {profile==='fulcrum'&&<><circle cx="5" r="12" fill="#1c5948" stroke="currentColor" strokeWidth="2"/><path d="M-5-8 2-4 0 2 12-1 9 7 16 4M-21-9-13-3-22 2-12 9" className="round-line" strokeWidth="2"/><circle cx="5" r="5" fill="#e5ffb8"/></>}
  {profile==='gemini'&&<><path d="M-22-9H-9M-21 7H-5" className="round-tail"/><path d="M-10-7 1-15 13-11 11-3 0 1ZM0 6 11-3 23 1 20 11 9 15Z" className="round-fill"/><path d="M1-15 0 1 13-11M11-3 9 15 23 1" fill="none" stroke="#effbff"/></>}
  {profile==='titan'&&<><path d="M-23-13-9-7M-24 0H-8M-23 13-9 7" className="round-tail"/><path d="M-15-9-6-15 12-12 23 0 12 12-6 15-15 9Z" fill="#92472e" stroke="currentColor" strokeWidth="2"/><path d="M-8-8 10-9 19 0 10 9-8 8 0 0Z" className="round-fill"/><path d="M4-8 10 0 4 8M-4 0H18" stroke="#fff2bb" fill="none" strokeWidth="2"/></>}
  {profile==='howitzer'&&<><path d="M-17-14Q-26 0-17 14M-10-14Q-19 0-10 14" className="round-line"/><path d="M-9-9 9-12 21 0 9 12-9 9Z" fill="#241834" stroke="currentColor" strokeWidth="2"/><path d="M-4-10V10M3-10V10M14-7V7" className="round-line"/></>}
  {profile==='crimson-star'&&<><path d="M-24-11Q-13-6 7-5M-24 0Q-13-6 7 0M-24 11Q-13 6 7 5" className="round-line"/><path d="M8-14 13-5 23 0 13 5 8 14 3 5-7 0 3-5Z" className="round-fill"/><circle cx="8" r="4" fill="#fff2da"/></>}
  {profile==='starlight'&&<><path d="M-23-9-15-6M-23 6-14 4" className="round-tail"/><path d="M-10-8-3-14 4-9-4-4ZM1 6 9 2 14 10 7 15ZM5-5 14-12 23-4 15 3Z" className="round-fill"/><path d="M-10-8H4M5-5 23-4M1 6 14 10" stroke="#fff4bf"/></>}
  {profile==='flora'&&<><circle cx="4" r="13" fill="#195735" stroke="currentColor" strokeWidth="2"/><path d="M4 0C-9-12 4-17 4 0C17-12 23 0 4 0C17 13 4 17 4 0C-9 13-15 0 4 0Z" className="round-fill"/><circle cx="4" r="4" fill="#efffc1"/></>}
  {profile==='void-ark'&&<><ellipse cx="4" rx="13" ry="12" fill="#0c0918" stroke="currentColor" strokeWidth="3"/><path d="M4-15V-8M4 8V15M-15 0H-6M14 0H23" stroke="#e5daff" strokeWidth="3"/><ellipse cx="4" rx="7" ry="6" className="round-line"/></>}
 </svg>;
}
function ImpactGlyph({profile}){
 return <svg viewBox="-40 -40 80 80" aria-hidden="true">
  {profile==='pulse'&&<><circle r="16"/><circle r="27" strokeWidth="1"/><path d="M-33 0H-23M23 0H33M0-33V-23M0 23V33M-20-20-14-14M20 20 14 14"/></>}
  {profile==='laser'&&<><path d="M-7-25 3-5-3 6 7 25" strokeWidth="6"/><path d="M-8-23 2-5-4 6 6 23" stroke="#fff4dc" strokeWidth="2"/><path d="M-23-17-13-8M18 13 28 23M-24 6-14 3M16-8 25-16"/></>}
  {profile==='prism'&&<><path d="M0-12 12 0 0 12-12 0ZM-9-20-14-34-19-20-15-15ZM19-15 31-23 26-8ZM19 18 29 32 12 25ZM-19 11-33 20-19 27Z"/><path d="M0-12V12M-12 0H12M-25-4-33-6M8-23 12-33" stroke="#efffff"/></>}
  {profile==='dart'&&<><path d="M-25-14-11-7M-26-3-10 0M-25 9-10 5M13-8 29-17M13 0H31M13 8 29 18"/><path d="M-5-13H3M-7-2H1M-5 9H3" stroke="#e0fff1" strokeWidth="4"/></>}
  {profile==='arc'&&<><path d="M-24 23 24-23" strokeWidth="5"/><path d="M-18 26 27-19M-28 10-20 5M10-24 15-31" stroke="#f3d4ff" strokeWidth="1.5"/><path d="M-10-15-18-28-23-16ZM17 9 31 17 19 24Z"/></>}
  {profile==='needle'&&<><path d="M0-27V27M-13-17 13 17M-10 19 10-19"/><circle r="5" fill="#fff"/><circle r="12" strokeWidth="1"/></>}
  {profile==='capsule'&&<><path d="M-18 19Q-30 3-16-12L-12-3Q-9-23 3-31L8-12 17-18Q34 7 18 23Z" fill="currentColor" stroke="none" opacity=".8"/><path d="M-9 18Q-17 5-4-8L0 2 8-11Q22 11 9 21Z" fill="#ffe8a4" stroke="none"/><path d="M-27-20-30-29M23-18 31-26M-28 13-36 17M25 17 33 23"/></>}
  {profile==='twin'&&<><path d="M-13-24-5 22M5-22 13 24" strokeWidth="4"/><path d="M-25-9-17-3M18 8 27 16M-22 13-15 8M13-10 20-16" stroke="#ffd5b3"/></>}
  {profile==='diamond'&&<><path d="M0-30 9-9 31 0 9 9 0 30-9 9-31 0-9-9Z"/><path d="M-16-16 0-8 16-16 8 0 16 16 0 8-16 16-8 0Z" stroke="#edfeff"/><path d="M0-30V30M-31 0H31" strokeWidth="1"/></>}
  {profile==='ion'&&<><path d="M-28 2-17-17-5-12 4-27 19-12 30-3 18 9 22 25 6 18-8 28-17 13-29 14Z"/><path d="M-17-17-24-29M19-12 29-23M6 18 12 33M-17 13-31 25"/><circle r="9" stroke="#edfff1"/></>}
  {profile==='cross-ion'&&<><path d="M-28-22-8 4 0-7 13 10 28-21" stroke="#8affbd" strokeWidth="3"/><path d="M-28 22-9-5 0 7 12-9 28 22" strokeWidth="3"/><circle r="14" stroke="#efffff"/><circle r="27" strokeWidth="1"/></>}
  {profile==='photon'&&<><path d="M0 0C-28-31 28-31 0 0C31-28 31 28 0 0C28 31-28 31 0 0C-31 28-31-28 0 0Z"/><circle r="7" fill="#fff4df" stroke="none"/></>}
  {profile==='facet'&&<><path d="M0-29 25-14 25 14 0 29-25 14-25-14ZM0-29 4-8 25-14M25 14 5 5 0 29M-25 14-5 3-25-14"/><path d="M4-8-5 3 5 5" stroke="#fff5d2"/></>}
  {profile==='shadow'&&<><circle r="24" strokeWidth="6" opacity=".45"/><path d="M-26 1Q-22-25 0-22T25 4Q21 30-4 23T-26 1M-14-7 4-15 16 4-2 14Z"/><circle r="8" fill="#e4bdff" opacity=".6" stroke="none"/></>}
  {profile==='lance'&&<><path d="M-6-7-13-31 1-17 7-7 30-12 16 0 7 7 12 30-1 17-7 7-30 12-17-1Z"/><path d="M-6-7 7 7M7-7-7 7" stroke="#fff" strokeWidth="3"/></>}
  {profile==='orbit'&&<><circle r="25"/><ellipse rx="34" ry="12" transform="rotate(35)"/><ellipse rx="34" ry="12" transform="rotate(-35)"/><circle r="6" fill="#f4fff0"/><path d="M0-36V-30M0 30V36M-36 0H-30M30 0H36"/></>}
  {profile==='corona'&&<><path d="M-33 5Q0-34 33 5M-27 14Q0-17 27 14M-18 21Q0 3 18 21" strokeWidth="3"/><path d="M0-22V-34M-21-15-27-23M21-15 27-23" stroke="#ffe5bc"/></>}
  {profile==='nucleus'&&<><path d="M0-32 27-16 24 18 0 32-24 18-27-16ZM0-32V32M-27-16 24 18M27-16-24 18"/><circle r="8" fill="#e5ffff"/></>}
  {profile==='vector'&&<><path d="M-31-17-14 1-6-12 9 17 15 4 34 16" strokeWidth="4"/><path d="M-34 16-16 3-10 12 7-16 15-2 30-19" stroke="#ffd669"/><circle r="9"/></>}
  {profile==='shuriken'&&<path d="M0-34 8-9 34-8 12 8 19 34 0 18-22 28-11 6-33-13-8-12Z"/>}
  {profile==='comb'&&<><path d="M-34 4Q0-22 34 4M-28 14Q0-6 28 14M-20 22Q0 10 20 22" strokeWidth="3"/><path d="M-18-3-26-14M-8-8-11-22M0-10V-26M8-8 11-22M18-3 26-14"/></>}
  {profile==='magnetic'&&<><path d="M-32 8Q0-27 32 8M-29 17Q0 4 29 17" stroke="#be78ff"/><path d="M-24-19 22 18" strokeWidth="5"/><circle r="7" fill="#fff0f6"/></>}
  {profile==='talon'&&<><path d="M-26 17Q-10-16 20-25M-11 25Q0-10 28-21M6 29Q12 8 32-8" strokeWidth="4"/><path d="M-29-9-34-18M19 20 27 29" stroke="#fff0b1"/></>}
  {profile==='shock'&&<><circle r="35" strokeWidth="2"/><circle r="24" strokeWidth="4"/><circle r="12" fill="#ffec94" opacity=".8"/></>}
  {profile==='rebirth'&&<><path d="M0 21Q-21 14-33-16L-11-7 0-21 11-7 33-16Q21 14 0 21Z"/><path d="M0 12-20-2M0 12 20-2M0 12V28" stroke="#f9e3ff"/></>}
  {profile==='hex-chain'&&<><path d="M0-29 25-15V15L0 29-25 15V-15Z"/><path d="M0-17 15-8V8L0 17-15 8V-8ZM-25-15-34-21M25 15 34 21M25-15 34-21M-25 15-34 21"/></>}
  {profile==='solar-crystal'&&<><path d="M0-33 21 0 0 33-21 0ZM0-33 7 0 0 33-7 0Z" strokeWidth="2"/><path d="M-33 0H33M-25-19-30-24M25 19 30 24M25-19 30-24M-25 19-30 24" stroke="#fff2ad"/></>}
  {profile==='shadow-arrow'&&<><path d="M-32 0H25M5-21 27 0 5 21M-17-12-4 0-17 12" strokeWidth="3"/><circle r="11" stroke="#f4e7ff"/></>}
  {profile==='bipolar'&&<><path d="M-26-26 25 24" stroke="#ff6f6d" strokeWidth="5"/><path d="M-24 25 26-26" stroke="#aa7dff" strokeWidth="5"/><path d="M0-28 8-7 27 0 8 7 0 28-8 7-27 0-8-7Z" stroke="#fff1df"/></>}
  {profile==='royal'&&<><path d="M-30 8-25-14-12-5 0-23 12-5 25-14 30 8Z" stroke="#ffdd83"/><path d="M-22 16H22M-18 23H18"/><circle r="7" fill="#fff2b9"/></>}
  {profile==='meteor'&&<><path d="M0-30 23-15 30 10 7 30-21 20-30-6Z"/><path d="M0-30 3-4 23-15M30 10 3-4 7 30M-21 20 3-4-30-6" stroke="#e4faff"/></>}
  {profile==='cyclone'&&<><path d="M3 1Q16-15 25 1T8 27Q-20 31-26 9T-9-30Q22-37 33-13" strokeWidth="3"/><circle r="9" stroke="#efffd9"/></>}
  {profile==='eclipse'&&<><circle r="17" fill="#130a21"/><path d="M-30-15Q-15-27 0-12T30-15M-32 0Q-16 13 0 0T32 0M-30 15Q-15 3 0 18T30 15" strokeWidth="3"/></>}
  {profile==='gravity'&&<><ellipse rx="27" ry="12" transform="rotate(38)"/><path d="M-32 2Q-10-21 19-18M32-2Q10 21-19 18" strokeWidth="5"/><circle r="7" fill="#eee0ff"/></>}
  {profile==='fulcrum'&&<><circle r="23"/><path d="M-35 12-18 0-20-16-2-9 8-28 12-11 31-15 18 3 32 13 13 17 10 34-2 18-17 28-14 10Z"/><circle r="8" fill="#e2ffb4"/></>}
  {profile==='gemini'&&<><path d="M-21-27-4-13-12 8-32-2ZM12-8 32 2 21 27 4 13Z" strokeWidth="3"/><path d="M-21-27-12 8M12-8 21 27" stroke="#effaff"/></>}
  {profile==='titan'&&<><path d="M-32 20-25-4-15 5-5-24 4-12 13-30 21-8 31-4 34 20Z" fill="currentColor" opacity=".7"/><path d="M-29 23H29M-19 30H19" stroke="#fff0b0" strokeWidth="3"/></>}
  {profile==='howitzer'&&<><circle r="35" strokeWidth="3"/><circle r="24" fill="#2f2142"/><path d="M-15 0H15M0-15V15M-11-11 11 11M-11 11 11-11" stroke="#f3deff" strokeWidth="2"/></>}
  {profile==='crimson-star'&&<><path d="M0-34 8-10 29-13 15 5 22 27 0 15-22 27-15 5-29-13-8-10Z"/><path d="M-27 3Q-9-14 6 0T29-4M-19 20Q-12-1 0 3T16-21" stroke="#ffbbbf"/></>}
  {profile==='starlight'&&<><path d="M0-33 5-9 26-23 13-4 34 0 13 4 26 23 5 9 0 33-5 9-26 23-13 4-34 0-13-4-26-23-5-9Z"/><circle r="7" fill="#fff7d0"/></>}
  {profile==='flora'&&<><circle r="28"/><path d="M0 0C-31-22 0-34 0 0C24-30 34 0 0 0C32 22 0 34 0 0C-22 32-34 0 0 0Z" stroke="#d9ff9b" strokeWidth="2"/><circle r="7" fill="#edffd3"/></>}
  {profile==='void-ark'&&<><circle r="21" fill="#0a0718" strokeWidth="4"/><circle r="12" stroke="#dcd0ff"/><path d="M0-36V-19M0 19V36M-36 0H-19M19 0H36" stroke="#e4dbff" strokeWidth="4"/></>}
 </svg>;
}
function Projectile({effect,rootRef,engineRefs,gunRefs}){
 const [geometry,setGeometry]=useState(null);
 useLayoutEffect(()=>{
  // Read the exact vessel's motor after React commits. Every vessel stays mounted.
  const targetSide=effect?.side==='player'?'enemy':'player';
  const target=rootCoords(rootRef.current,engineRefs.current[targetSide][`${effect?.targetShip}/${effect?.op}`]);
  if(!effect||!target){setGeometry(null);return;}
  const shots=effect.salvos.flatMap(salvo=>{
   const s=salvo.shot;
   const sources=Array.from({length:weaponMuzzleCount(s.weaponId)},(_,muzzleIndex)=>rootCoords(rootRef.current,gunRefs.current[effect.side][`${s.vesselIndex}/${s.weaponId}${muzzleIndex?`/${muzzleIndex}`:''}`]));
   if(sources.some(source=>!source))return [];
   const rounds=salvo.rounds.map(round=>{
    const [x,y]=sources[round.muzzleIndex||0],dx=target[0]-x,dy=target[1]-y;
    return {...round,x,y,dx,dy,roundWidth:projectileWidth(salvo,Math.hypot(dx,dy))};
   });
   return [{...salvo,rounds}];
  });
  setGeometry({target,shots});
 },[effect,rootRef,engineRefs,gunRefs]);
 if(!effect||!geometry)return null;
 const {target,shots}=geometry;
 return <div className={`vfx-layer${effect.destroyed?' motor-break':''}`} aria-hidden="true" data-arrival-ms={effect.arrivalMs}>
 {shots.map(({shot,fx,rounds,arrivalMs})=><React.Fragment key={`${shot.vesselIndex}/${shot.weaponId}`}>
  {rounds.map(round=>{
   const {x,y,dx,dy,roundWidth}=round;
   const showPulse=round.index===rounds.length-1||round.index%Math.ceil(rounds.length/26)===0;
   const frames=[0,.25,.5,.75,1].map(t=>projectileFrame(dx,dy,round.bend,t));
   const trajectory=Object.fromEntries(frames.flatMap((f,i)=>[[`--x${i}`,`${f.x}px`],[`--y${i}`,`${f.y}px`],[`--a${i}`,`${f.angle}deg`]]));
   return <React.Fragment key={round.index}>
    <span className={`weapon-flight round-${fx.profile}`} data-weapon={shot.weaponId} data-vessel-index={shot.vesselIndex} data-round={round.index} data-muzzle-index={round.muzzleIndex}
     style={{left:x,top:y,...trajectory,'--fx-color':fx.color,'--flight-time':`${fx.durationMs}ms`,'--launch-delay':`${round.launchMs}ms`,'--round-width':`${roundWidth}px`,'--round-height':`${fx.height}px`}}>
     <RoundGlyph profile={fx.profile} index={round.index}/>
    </span>
    {showPulse&&<><span className={`muzzle-flash muzzle-${fx.profile}`} style={{left:x,top:y,color:fx.color,'--launch-delay':`${round.launchMs}ms`,'--muzzle-angle':`${frames[0].angle}deg`}}><i/></span>
    <span className={`weapon-contact contact-${fx.profile}`} style={{left:target[0],top:target[1],color:fx.color,'--contact-delay':`${round.arrivalMs}ms`}}><ImpactGlyph profile={fx.profile}/></span></>}
   </React.Fragment>;
  })}
  <span className={`weapon-impact impact-${fx.profile}`} data-weapon={shot.weaponId} style={{left:target[0],top:target[1],color:fx.color,'--contact-delay':`${arrivalMs}ms`}}><ImpactGlyph profile={fx.profile}/></span>
 </React.Fragment>)}
 {effect.damage>0&&<div className="impact-number delayed-impact" style={{left:target[0]-52,top:target[1]-64,color:effect.primaryColor||'#ffdf83','--impact-delay':`${effect.arrivalMs}ms`}}>−{effect.damage}</div>}
 {shots.length===0&&<div className="charge-notice">{effect.volleys.some(s=>s.charging)?'MUNIZIONI IN CARICA':effect.memoryPending?'MEMORIA AGGIORNATA':'NESSUNA ARMA ATTIVATA'}</div>}
 </div>;
}
function Hand({cards,selected,onSelect,disabled}){return <div className="hand" aria-label="Le tue sette carte">{cards.map((c,i)=><button key={c.id} title={`${label(c.value)} ${c.suit}`} disabled={disabled} className={'number-card'+(selected.includes(i)?' active':'')} style={{'--suit':suits[c.suit]}} onClick={()=>onSelect(i)}><span className="card-suit">{c.suit}</span><strong>{label(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}</div>}
function MemoryCombos({ship}){
 const weapons=ship.fleet.filter(v=>!vesselDestroyed(v)).flatMap(v=>v.weapons.filter(w=>w.tipo==='Combo a memoria'));
 if(!weapons.length)return null;
 return <div className="memory-combos" aria-label="Combo a memoria">{weapons.map(w=>{
  const {required,limit,history,totals}=memoryComboStatus(w);
  const seen=required.filter(s=>totals[s]>0);
  return <div key={w.id} className="memory-combo" data-weapon={w.id} title={comboLabel(w)}
   aria-label={`${w.nome}, ${history.length} su ${limit} calcoli, semi raccolti ${seen.map(s=>GLYPH[s]).join(' ')||'nessuno'}`}>
   <b>{w.id==='W33'?'Giudizio':'Arca'}</b>
   {required.map(s=><i key={s} className={totals[s]>0?'collected':''} style={{color:bulletColors[s]}}>{GLYPH[s]}</i>)}
   <small>{history.length}/{limit}</small>
  </div>;
 })}</div>;
}
function Formula({game}){
 const [a,b]=game.selected.map(i=>game.player.hand[i]);
 const goal=game.targets[game.target];
 const inspection=a&&b?inspectCalculation(game.target,a.value,b.value,goal):null;
 const preview=inspection?.valid?previewVolley(game.player,[a,b]):null;
 const alternative=a&&b&&!inspection.valid?supportedOperators(game.player).find(op=>op!==game.target&&game.enemy.fleet[game.targetShip]?.engines[op]?.hp>0&&evaluatePair(op,a.value,b.value,game.targets[op])):null;
 const fmt=v=>Number.isInteger(v)?String(v):Number.isFinite(v)?String(Math.round(v*100)/100).replace('.',','):'—';
 return <div className={`formula${inspection?.valid?' valid':inspection?' invalid':''}`} aria-live="polite">
   <span>{inspection?`${label(inspection.a)} ${META[game.target].sign} ${label(inspection.b)} = ${fmt(inspection.result)}`:`${META[game.target].sign} ${goal}`}</span>
   <small>{inspection?.valid?(preview.totalDamage?`BERSAGLIO ${goal} ✓ · FUOCO ${preview.totalDamage} HP`: `BERSAGLIO ${goal} ✓ · ${preview.shots.some(s=>s.charging)?'CARICA':preview.memoryPending?'MEMORIA':'NESSUNA ARMA ATTIVA'}`):inspection?(alternative?`BERSAGLIO ${goal} ✗ · USA ${META[alternative].sign} ${game.targets[alternative]}`:`BERSAGLIO ${goal} ✗ · RISULTATO ${fmt(inspection.result)}`):'SELEZIONA DUE CARTE'}</small>
  </div>;
}
function SetupShipCard({shipId,level,selected,onSelect}){
 const vessel=newVessel(shipId,level);
 return <ShipCard vessel={vessel} selected={selected} onSelect={onSelect}
  comboLabels={vessel.weapons.filter(w=>w.combo).map(comboLabel)}><MountedWeapons side="player" vessel={vessel}/></ShipCard>;
}
function FleetSetup({onClose,onStart,onEquip,collection,selected,setSelected,enemySelected,setEnemySelected,level,setLevel}){
 const [practice,setPractice]=useState(false);
 const [side,setSide]=useState('player');
 const [loadout,setLoadout]=useState(collection?.loadout??[]);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 const ids=side==='player'?selected:enemySelected??selected;
 const matchup=fleetCompatibility(selected,enemySelected??selected,level);
 const toggle=id=>{const next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];if(validFleet(next))(side==='player'?setSelected:setEnemySelected)(next);};
 function toggleOwned(id){
  if(saving)return;
  const next=loadout.includes(id)?loadout.filter(x=>x!==id):[...loadout,id];
  try{
   if(next.length) equipShipCards(collection,next);
   setLoadout(next);setError('');
  }catch(e){setError(e.message);}
 }
 async function equip(){
  setSaving(true);
  try{await onEquip(loadout);}
  catch{setSaving(false);setError('Impossibile salvare la flotta. Riapri la collezione e riprova.');}
 }
 return <div className="modal-shade"><div className="help-card fleet-setup"><h2>{practice?'FLOTTA DI PROVA':'FLOTTA E COLLEZIONE'}</h2>
  <div className="fleet-side-toggle"><button type="button" aria-pressed={!practice} onClick={()=>setPractice(false)}>COLLEZIONE</button><button type="button" aria-pressed={practice} disabled={saving} onClick={()=>setPractice(true)}>PROVA</button></div>
  {practice?<><p>Prova tutte le 17 navi del catalogo con livelli temporanei. I risultati di prova non assegnano ricompense.</p>
  <div className="fleet-side-toggle"><button type="button" aria-pressed={side==='player'} onClick={()=>setSide('player')}>LA TUA FLOTTA</button><button type="button" aria-pressed={side==='enemy'} onClick={()=>setSide('enemy')}>AVVERSARIO DI PROVA</button></div>
  {side==='enemy'&&<label className="fleet-match"><input type="checkbox" checked={enemySelected===null} onChange={e=>setEnemySelected(e.target.checked?null:[...selected])}/> Stessa flotta del giocatore</label>}
  <label className="fleet-level-row">Livello di prova (non acquistato) <b>{level}</b><input type="range" min="1" max="5" value={level} onChange={e=>setLevel(Number(e.target.value))}/></label>
  <div className="fleet-setup-list">{PHASE1_SHIPS.map(s=><SetupShipCard key={s.id} shipId={s.id} level={level} selected={ids.includes(s.id)} onSelect={()=>toggle(s.id)}/>)}</div>
  <p>Massimo 3 navi. L'universale è unica; ogni seme può attivare al massimo due navi specializzate. Le operazioni si sbloccano secondo il livello del modello.</p>
  {!matchup.compatible&&<p className="fleet-match-warning" role="status">Flotte non compatibili a L{level}: {matchup.playerMissing.length?`alla tua flotta manca ${matchup.playerMissing.map(op=>META[op].sign).join(', ')}. `:''}{matchup.enemyMissing.length?`All'avversaria manca ${matchup.enemyMissing.map(op=>META[op].sign).join(', ')}.`:''} Scegli una nave con le operazioni mancanti oppure cambia il livello.</p>}
  </>:collection?<><p>Carte possedute <b>{collection.cards.length}</b>. Seleziona da una a tre navi ai loro livelli effettivi.</p>
   <div className="fleet-setup-list">{collection.cards.map(card=><SetupShipCard key={card.instanceId} shipId={card.shipId} level={card.level}
    selected={loadout.includes(card.instanceId)} onSelect={()=>toggleOwned(card.instanceId)}/>)}</div>
   {error&&<p className="fleet-match-warning" role="alert">{error}</p>}
  </>:<p className="fleet-match-warning" role="alert">Il salvataggio della collezione non è leggibile. Puoi accedere alla flotta di prova.</p>}
  <div className="fleet-setup-actions"><button className="es-button" disabled={saving} onClick={onClose}>ANNULLA</button>
   {practice?<button className="es-button primary" disabled={!matchup.compatible} onClick={onStart}>INIZIA DUELLO</button>
    :<button className="es-button primary" disabled={saving||!loadout.length} onClick={equip}>SALVA E SCHIERA</button>}
  </div>
 </div></div>;
}
function readCollection(){
 try{return readShipCollection();}catch{return null;}
}
export default function MathDuelBattle({nickname,gameMode,sectorNumber=1,displaySector='',ether=0,onEtherConsumed,onResult,onExit}){
 const [scale,setScale]=useState(1);const [fleetIds,setFleetIds]=useState(['N00']);const [enemyFleetIds,setEnemyFleetIds]=useState(null);const [testLevel,setTestLevel]=useState(1);
 const [collection,setCollection]=useState(readCollection);
 function startBattle(options,practice=false){
  const b=initialBattle(Math.max(1,sectorNumber),options,Math.random,gameMode);
  b.practice=practice;
  if(!practice)b.player.ether=Math.max(0,Number(ether)||0);
  return b;
 }
 const [game,setGame]=useState(()=>startBattle(collection?collectionBattleOptions(collection):{}));
 useEffect(()=>{updateShipCollection(current=>current).catch(()=>{/* Keep an unreadable save intact. */});},[]);
 const rootRef=useRef(null);
 const shipRefs=useRef({player:{},enemy:{}});
 const engineRefs=useRef({player:{},enemy:{}});
 const gunRefs=useRef({player:{},enemy:{}});
 const realBattleRef=useRef(null);
 const gameRef=useRef(game);gameRef.current=game;
 const registerShipRef=(side,index,node)=>{if(node)shipRefs.current[side][index]=node; else delete shipRefs.current[side][index];};
 const registerEngineRef=(side,index,op,node)=>{const key=`${index}/${op}`;if(node)engineRefs.current[side][key]=node; else delete engineRefs.current[side][key];};
 const registerGunRef=(side,index,id,node)=>{const key=`${index}/${id}`;if(node)gunRefs.current[side][key]=node;else delete gunRefs.current[side][key];};const [help,setHelp]=useState(false),[fleetMenu,setFleetMenu]=useState(false),[message,setMessage]=useState('');const queue=useRef([]),resultClaimed=useRef(false);
 function later(f,ms){const handle=setTimeout(f,ms);queue.current.push(handle);return handle;}
 useEffect(()=>()=>queue.current.forEach(clearTimeout),[]);
 useEffect(()=>{const resize=()=>setScale(Math.max(.3,Math.min(window.innerWidth/450,window.innerHeight/800)));resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 function write(b){gameRef.current=b;setGame(b)}
 function notice(text){setMessage(text);later(()=>setMessage(''),2200)}
 function finish(b,winner,reason){return {...b,actor:'none',phase:'finished',winner,reason,effect:null};}
 function transition(state,side){let b=clone(state);if(isDestroyed(b.player))return finish(b,'enemy','Tutte le tue navicelle sono distrutte');if(isDestroyed(b.enemy))return finish(b,'player','Flotta avversaria distrutta');if(deckExhausted(b.player,b.enemy))return finish(b,deckVerdict(b.player,b.enemy),'Mazzo esaurito: confronto integrità delle flotte');
  b.selected=[];b.effect=null;b.targets=generateTargets(Math.random,b.level);
  if(side==='player'){b.actor='enemy';b.phase='thinking';b.notice='Turno avversario';}
  else{b.actor='player';b.phase='ready';b.round+=1;b.seconds=60;b.player.sacrifices=0;b.enemy.sacrifices=0;b.notice='Nuovi bersagli: seleziona un motore';}
  // Retarget after destruction: never keep selecting a knocked-out engine.
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  if(next){
   const changed=next.targetShip!==b.targetShip||next.target!==b.target;
   b.targetShip=next.targetShip;b.target=next.target;
   if(changed)b.notice=`Motore ${META[next.target].sign} selezionato: ${b.enemy.fleet[next.targetShip].name}`;
  }else if(b.actor==='player')b.notice='Nessun motore nemico attaccabile: passa il turno';
  return b;
 }
 function fire(side,move){const b=gameRef.current;if(b.phase==='finished'||b.phase==='animating'||b.actor!==side)return;
  const attackShip=b[side],receiver=side==='player'?'enemy':'player',defShip=b[receiver],goal=b.targets[move.op],cards=[attackShip.hand[move.i],attackShip.hand[move.j]];
  if(cards.some(x=>!x)){if(side==='player')notice('Seleziona due carte valide');return;}
  if(!supportedOperators(attackShip).includes(move.op)){if(side==='player')notice('Operazione non sbloccata: serve una nave con quel motore operativo');return;}
  const proof=inspectCalculation(move.op,cards[0].value,cards[1].value,goal);
  if(!proof.valid){
   const cleared=resetComboMemory(attackShip),reset=cleared!==attackShip;
   if(reset)write({...b,[side]:cleared});
   if(side==='player')notice(`${label(proof.a)} ${META[move.op].sign} ${label(proof.b)} = ${Number.isInteger(proof.result)?proof.result:Math.round(proof.result*100)/100}. Bersaglio: ${goal}${reset?' · Memoria azzerata':''}`);
   return;
  }
  const index=move.targetShip??0,e=defShip.fleet[index]?.engines[move.op];if(!e||e.hp<=0){if(side==='player')notice('Motore non disponibile');return;}
  const strike=dealHit(defShip,attackShip,move.op,goal,cards,index);
  const timing=volleyTimeline(strike.volley),salvos=planWeaponSalvos(strike.volley);
  const strongest=[...strike.volley].sort((a,b)=>(b.damage||0)-(a.damage||0))[0];
  const anim={...clone(b),...(side==='enemy'?{shownPlayer:index}:{targetShip:index}),phase:'animating',selected:[],effect:{side,op:move.op,targetShip:index,damage:strike.damage,destroyed:strike.destroyed,volleys:strike.volley,salvos,memoryPending:strike.memoryPending,arrivalMs:timing.arrivalMs,primaryColor:bulletColors[strongest?.suit]||'#ffdf83',shipCount:attackShip.fleet.length,sourceFocus:side==='player'?b.shownPlayer:b.targetShip}};
  write(anim);if(salvos.length)volleySound(salvos);else tone('click');
  later(()=>{const active=gameRef.current;if(active.effect!==anim.effect)return;const next=clone(active);
   next[side]=consumeAttack(strike.attacker,[move.i,move.j]);next[receiver]=strike.defender;
   next.logs=[`${side==='player'?'TU':'IA'}: ${cards[0].value}${cards[0].suit} ${META[move.op].sign} ${cards[1].value}${cards[1].suit} = ${goal} — ${strike.damage} HP`,...next.logs].slice(0,6);
   write(transition(next,side));
  },timing.settleMs);
 }
 function attack(){const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  if(!next){notice('Nessun motore nemico attaccabile');return;}
  if(next.targetShip!==b.targetShip||next.target!==b.target){
   write({...b,...next});notice('Bersaglio distrutto: motore successivo selezionato');return;
  }
  if(b.selected.length!==2){notice('Seleziona due carte');return;}
  fire('player',{op:b.target,targetShip:b.targetShip,i:b.selected[0],j:b.selected[1]});}
 function pick(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const next=clone(b);next.selected=next.selected.includes(i)?next.selected.filter(x=>x!==i):next.selected.length>=2?[next.selected[1],i]:[...next.selected,i];write(next);tone('click');}
 function selectEngine(index,op){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(!supportedOperators(b.player).includes(op)){notice('La tua flotta non ha ancora questo motore operativo');return;}if((b.enemy.fleet[index]?.engines[op]?.hp||0)<=0)return;write({...b,targetShip:index,target:op});}
 function chooseEnemy(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;
  const v=b.enemy.fleet[i];if(!v||vesselDestroyed(v))return;
  const target=nextAttackTarget(b.player,b.enemy,i,b.target);
  if(!target||target.targetShip!==i){notice('Questa nave non ha motori attaccabili con le operazioni disponibili');return;}
  write({...b,...target});}
 function change(withEther){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(b.selected.length!==1){notice('Seleziona UNA carta da cambiare');return;}
  const n=clone(b),i=n.selected[0];if(withEther){const ship=etherChange(n.player,i);if(!ship){notice('Etere insufficiente o mazzo vuoto');return;}n.player=ship;if(!b.practice)onEtherConsumed?.(1);n.notice='Carta sostituita con Etere';}
  else{const swap=sacrificeCard(n.player,i,n.enemy,n.seconds);if(!swap){notice('Non puoi cambiare altre carte');return;}n.player=swap.ship;n.enemy=swap.opponent;n.seconds=swap.seconds;n.notice=`Sacrificio ${n.player.sacrifices}/3: ${swap.detail}`;}
  n.selected=[];n.logs=[n.notice,...n.logs].slice(0,6);write(isDestroyed(n.player)?finish(n,'enemy','Flotta distrutta durante un sacrificio'):deckExhausted(n.player,n.enemy)?finish(n,deckVerdict(n.player,n.enemy),'Mazzo esaurito'):n);
 }
 function pass(){const b=gameRef.current;if(b.phase==='ready'&&b.actor==='player')write(transition(b,'player'));}
 useEffect(()=>{if(help||fleetMenu||game.actor!=='player'||game.phase!=='ready')return;const timer=setInterval(()=>{const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;if(b.seconds<=1)write(transition({...b,seconds:0},'player'));else write({...b,seconds:b.seconds-1});},1000);return()=>clearInterval(timer);},[game.actor,game.phase,help,fleetMenu]);
 useEffect(()=>{if(game.actor!=='enemy'||game.phase!=='thinking')return;const timer=later(()=>{const b=gameRef.current;if(b.phase!=='thinking'||b.actor!=='enemy')return;let n=clone(b),move=aiChoose(n.enemy,n.player,n.targets);if(!move&&n.enemy.sacrifices<3&&n.enemy.deck.length){const swap=sacrificeCard(n.enemy,Math.floor(Math.random()*n.enemy.hand.length),n.player,60);if(swap){n.enemy=swap.ship;n.player=swap.opponent;write(n);move=aiChoose(n.enemy,n.player,n.targets);}}
  if(isDestroyed(n.enemy)){write(finish(n,'player','Flotta nemica distrutta'));return;}if(deckExhausted(n.player,n.enemy)){write(finish(n,deckVerdict(n.player,n.enemy),'Mazzo terminato'));return;}if(move){write(n);fire('enemy',move);}else write(transition(n,'enemy'));
 },1000);return()=>clearTimeout(timer);},[game.actor,game.phase,game.round]);
 function openFleet(){
  const b=gameRef.current;
  if(b.round!==1||b.player.discard.length||b.phase!=='ready'){notice('La flotta si configura prima del primo attacco');return;}
  setCollection(readCollection());setFleetMenu(true);
 }
 function restartWithFleet(){
  if(fleetCompatibility(fleetIds,enemyFleetIds??fleetIds,testLevel).compatible){
   if(!gameRef.current.practice)realBattleRef.current=gameRef.current;
   write(startBattle({fleetIds,enemyFleetIds,shipLevel:testLevel},true));setFleetMenu(false);
  }
 }
 async function saveLoadout(loadout){
  const next=await updateShipCollection(current=>equipShipCards(current,loadout));
  const options=collectionBattleOptions(next),b=realBattleRef.current??gameRef.current;
  setCollection(next);
  const {fleet}=newShip(b.level,false,options);
  const unchanged=fleet.length===b.player.fleet.length&&fleet.every((v,i)=>v.id===b.player.fleet[i].id&&v.level===b.player.fleet[i].level);
  if(unchanged){if(b!==gameRef.current)write(b);}
  else{
   write({...b,player:{...b.player,fleet},enemy:{...b.enemy,fleet:clone(fleet)},
    target:'plus',targetShip:0,shownPlayer:0});
  }
  realBattleRef.current=null;setFleetMenu(false);
 }
 function exitBattle(){const b=gameRef.current;if(b?.phase==='finished'&&!b.practice&&!resultClaimed.current){resultClaimed.current=true;const h=healthScore(b.player);onResult?.(b.winner,{turnsElapsed:b.round,remainingHpPct:h,starsEarned:[true,h>=.65,h>=.9],matchStats:{damageDealt:Math.round((1-healthScore(b.enemy))*100),turnsElapsed:b.round}});}onExit?.();}
 const availableOps=supportedOperators(game.player);
 return <div className="es-math-scope game-viewport" role="region" aria-label="Duello matematico spaziale">
  <div ref={rootRef} className="es-root" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <ArenaBackdrop/>
   <div className="top-brand">ECLISSI <b>STELLARE</b></div>
   <div className="toolbar"><button onClick={()=>setHelp(true)} aria-label="Regole">?</button><button onClick={openFleet} title="Flotta e collezione" aria-label="Flotta">⚙</button><button className="math-exit" onClick={()=>{if(game.phase==='finished'||window.confirm('Abbandonare la battaglia?'))exitBattle()}} aria-label="Torna al menu">⌂</button></div>
   <div className="enemy-status"><div className="portrait">◆</div><div><b>AVVERSARIO {game.practice?'• PROVA':displaySector&&`• ${displaySector}`}</b><small>INTEGRITÀ FLOTTA {Math.round(healthScore(game.enemy)*100)}%</small></div><Pips ship={game.enemy}/></div>
   <Ship side="enemy" ship={game.enemy} targets={game.actor==='player'?game.targets:null} focused={game.targetShip} onSelectShip={chooseEnemy} selectedTarget={game.target} onTarget={selectEngine} phase={game.phase} effect={game.effect} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   <div className="center-bar"><span className="round-tag">TURNO {game.round}</span><MemoryCombos ship={game.player}/><div className={'timer-pill'+(game.seconds<=10?' urgent':'')}><strong>{game.actor==='player'?`${game.seconds}s`:game.actor==='enemy'?'AVVERSARIO':'COLPO'}</strong></div></div>
   <Ship side="player" ship={game.player} targets={game.actor==='enemy'?game.targets:null} focused={game.shownPlayer} onSelectShip={i=>write({...gameRef.current,shownPlayer:i})} phase="idle" effect={game.effect} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   <div className="deck left"><div className="deck-graphic">✦</div><small>MAZZO</small><strong>{game.player.deck.length}</strong></div><div className="deck right"><div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{game.player.discard.length}</strong></div>
   <Hand cards={game.player.hand} selected={game.selected} onSelect={pick} disabled={game.phase!=='ready'||game.actor!=='player'}/>
   <div className="play-controls"><Formula game={game}/><button className="es-button attack" onClick={attack} disabled={game.phase!=='ready'}>ATTACCA ➤</button></div>
   <div className="utility-bar"><button onClick={()=>change(false)} disabled={game.phase!=='ready'}>CAMBIA <b>{game.player.sacrifices}/3</b></button><button onClick={()=>change(true)} disabled={game.phase!=='ready'||!game.player.ether}>ETERE <b>{game.player.ether}</b></button><button onClick={pass} disabled={game.phase!=='ready'}>PASSA »</button><button onClick={openFleet}>FLOTTA ⚙</button></div>
   <div className="player-status"><b>TU</b><span className="my-hp">FLOTTA {Math.round(healthScore(game.player)*100)}%</span><Pips ship={game.player}/><small>{message||game.notice}</small></div>
   {game.effect&&<Projectile effect={game.effect} rootRef={rootRef} engineRefs={engineRefs} gunRefs={gunRefs}/>}
   {game.phase==='finished'&&<div className="modal-shade"><div className="result-card"><h1>{game.winner==='player'?'VITTORIA':game.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{game.reason}</p><div className="result-score"><span>TUA FLOTTA <b>{Math.round(healthScore(game.player)*100)}%</b></span><span>AVVERSARIO <b>{Math.round(healthScore(game.enemy)*100)}%</b></span></div><button className="es-button primary" onClick={exitBattle}>CONFERMA E TORNA</button></div></div>}
   {help&&<div className="modal-shade"><div className="help-card"><h2>REGOLE DEL DUELLO</h2><p>Ogni nave monta inizialmente + e −; alcuni modelli sbloccano × e ÷. Tutti i motori installati devono essere distrutti per eliminare una nave. Vinci distruggendo tutta la flotta nemica.</p><p>Ogni turno dura 60 secondi. Tocca una nave nemica, scegli uno dei suoi motori e seleziona due carte. A=1, J=11, Q=12, K=13; la sottrazione e la divisione possono invertire le carte, ma la divisione deve essere esatta. Il risultato esatto fa scattare tutte le armi della flotta attivate dai semi delle carte.</p><p>I VALORI delle carte sono proiettili: 8♣ × 3♦ = 24 significa 8 proiettili ♣ e 3 ♦; il 24 sblocca il tiro, non è il danno. L'arma determina il danno per proiettile. Alcune armi accumulano munizioni. Le combo simultanee richiedono entrambi i semi indicati nella stessa coppia di carte.</p><p>Le combo a memoria raccolgono i semi degli ultimi 3 o 4 calcoli corretti. Quando trovi tutti i semi richiesti, l’arma spara le munizioni del proprio seme raccolte nella finestra. Dopo lo sparo o un calcolo errato la memoria dell’arma si svuota.</p><p>La nave universale spara con qualsiasi seme ma ha poca potenza. Il primo cambio carta dà +3 HP al nemico, il secondo costa 3 secondi e il terzo −3 HP a te. A mazzo esaurito prevale l'integrità percentuale della flotta.</p><p>⚙ FLOTTA schiera le carte possedute. La scheda Prova usa il catalogo e livelli temporanei.</p><button className="es-button primary" onClick={()=>setHelp(false)}>CHIUDI</button></div></div>}
   {fleetMenu&&<FleetSetup collection={collection} onEquip={saveLoadout} selected={fleetIds} setSelected={setFleetIds} enemySelected={enemyFleetIds} setEnemySelected={setEnemyFleetIds} level={testLevel} setLevel={setTestLevel} onClose={()=>setFleetMenu(false)} onStart={restartWithFleet}/>}
  </div>
 </div>;
}
