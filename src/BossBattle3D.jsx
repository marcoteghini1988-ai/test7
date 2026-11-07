// Compatibilità boss e poteri ancora da migrare: è la plancia 3D ufficiale precedente, NON una sandbox.
import React,{useState,useEffect,useRef,useLayoutEffect,useId} from 'react';

import {ENGINE_KEYS,META,newShip,initialBattle,inspectCalculationCards,rankLabel,aiChoose,findMoves,findThreeCardMoves,dealHit,consumeAttack,sacrificeCard,etherChange,isDestroyed,deckExhausted,deckVerdict,healthScore,generateTargets,supportedOperators,validFleet,previewVolley,vesselDestroyed,nextAttackTarget,memoryComboStatus,resetComboMemory,nextAiActionDelay} from './mathDuelEngine.js';
import {enginePoint,boardPoint,fleetFormation,engineHudShift,engineHudPlacement,engineVisualState,engineSurface,weaponMuzzleCount} from './mathFleetGeometry.js';
import {planWeaponSalvos,volleyTimeline,projectileFrame,projectileWidth,projectileSourceIndex} from './mathWeaponEffects.js';
import {ASSET_ROOT,CARD_SUIT_COLORS,SHIP_GLOW,ShipArtwork,ShipCard,MountedWeapons,WEAPON_SIGNS,WEAPON_COLORS,comboLabel} from './ShipPresentation.jsx';
import {ESCORT_ROLE_HELP,attackTargetKind} from './escortTactics.js';
import {collectionBattleOptions,equipShipCards,readShipCollection,updateShipCollection} from './shipCollection.js';
import SpecialDeckPanel from './SpecialDeckPanel.jsx';
import {readSpecialCollection,claimFirstWinSpecialPack,specialDeckCounts} from './specialDeckBuilder.js';
import {VITAL_IDS,VITAL_LABELS,remainingExposureSlots,exposeMotherPart,matchesVitalSignature} from './vitalDefense.js';
import {activeArmaments} from './escortArmory.js';
import {commanderFromInventory,FLEET_COMMANDER_DEFAULT_ID} from './fleetCommander.js';
import {commanderAbilityStatus} from './commanderAbilities.js';
import {resolveCombatImpact} from './resolveCombatImpact.js';
import {prepareMotherDuelOptions,chooseCampaignRivalCommander} from './motherDuelLoadout.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {applyArenaCalculationSync,arenaTacticalBriefing,arenaEnvironment} from './battleArenas.js';
import ArenaEnvironment from './ArenaEnvironment.jsx';
import BattleCombatFeedback from './BattleCombatFeedback.jsx';
import {spentCardTrail,launchBattleCue,impactBattleCue,specialBattleCue} from './battleFeedback.js';
import {systemState} from './fleetSystems.js';
import {chooseCombatMove} from './aiBattleTactics.js';
import {recoverStalledHand,battlePacingReport} from './battlePacing.js';
import {vitalSignatureLabel,primaryVitalMathGate} from './modelSignatures.js';
import {maneuverStatus,changeFormation,cancelFusion,recordManeuverEvent,prepareSideForAmmoRouting} from './fleetManeuvers.js';
import {playSpecialCard,findFusionCardIndex,findCoverCardIndex,findVolleyCardIndex,specialCardDefinition,specialCardReadiness} from './specialCards.js';
import {armedShotEffects,strategicStatus,STRATEGIC_EFFECT_LABELS,shotCombinationName} from './strategicShots.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {numericBossDeck,activeNumericBossAbilities,applyBossNumericSync} from './bossNumericDecks.js';
import './MathDuelBattle.css';
import './MathDuelIntro.css';
const ARENA_BACKGROUND=`${ASSET_ROOT}/mathduel/arena_titanio_9x16.webp`;
const INTRO_STAGES=[
 {id:'deal',label:'Distribuzione delle carte',duration:1150},
 {id:'deploy',label:'Schieramento delle flotte',duration:1900},
 {id:'materialize',label:'Materializzazione delle navi',duration:850},
 {id:'arm',label:'Armi e motori in linea',duration:850},
];
function ArenaBackdrop(){
 return <div className="space-back metal-arena" aria-hidden="true" style={{backgroundImage:`url('${ARENA_BACKGROUND}')`}}/>;
}
const label=rankLabel;
const clone=v=>structuredClone(v);
function tone(name){
 try{
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());
  if(ctx.state==='suspended')ctx.resume();
  const profiles={
   shot:{wave:'sawtooth',start:180,end:46,duration:.21,volume:.024},
   special:{wave:'triangle',start:520,end:1020,duration:.25,volume:.019},
   impact:{wave:'triangle',start:220,end:74,duration:.18,volume:.020},
   critical:{wave:'sawtooth',start:170,end:39,duration:.29,volume:.026},
   charge:{wave:'sine',start:320,end:600,duration:.17,volume:.014}
  };
  const p=profiles[name]||{wave:'sine',start:470,end:650,duration:.2,volume:.019};
  const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;
  o.type=p.wave;o.frequency.setValueAtTime(p.start,now);
  o.frequency.exponentialRampToValueAtTime(p.end,now+p.duration);
  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(p.volume,now+.015);
  g.gain.exponentialRampToValueAtTime(.0001,now+p.duration);
  o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+p.duration+.01);
 }catch{}
}
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
  {/* Texture raster della nave a piena opacità: la vecchia sagoma piatta
       non deve mai coprire l'illustrazione originale. */}
  <ShipArtwork side={side} vessel={vessel} onLoad={()=>setLoaded(true)}
   mask={damaged.length?`url(#${id}-healthy)`:undefined}/>
  {/* Le zone danneggiate riutilizzano la STESSA texture dettagliata,
       filtrata solo nell'area colpita; niente sostituzione con disegni SVG. */}
  {damaged.map(e=><g key={e.op} clipPath={`url(#${id}-${e.op}-area)`}
    filter={`url(#${id}-${e.op}-burn)`} aria-hidden="true">
    <ShipArtwork side={side} vessel={vessel}/>
   </g>)}
 </svg>;
}
function Engine({side,op,vessel,target,selected,onSelect,enabled,hit,available,engineRef,formation,impactDelay,mathMode=false}){
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
  aria-label={mathMode?`Operazione ${META[op].name}, bersaglio ${target??'non disponibile'}`:`${side==='enemy'?'Nemico':'Tu'}: ${vessel.name}, motore ${META[op].name}, ${engine.hp} di ${engine.max} HP, bersaglio ${target??'non disponibile'}`}>
  <span ref={engineRef} className="engine-anchor" aria-hidden="true"/>
  <span className="engine-core" aria-hidden="true"><i className="engine-iris"/><svg className="engine-fracture" viewBox="0 0 100 100"><path d="M13 23 42 40 30 62 63 54 87 82M61 12 52 38 73 27M32 65 24 86"/></svg></span>
  <span className="vessel-engine-hud">
   <strong>{dead?'✕':enabled&&target!=null?`${META[op].sign}${target}`:META[op].sign}</strong>
   <small>{mathMode?'CALC':dead?'KO':`${engine.hp} HP`}</small>
   {!mathMode&&<i className="vessel-engine-meter"><em style={{width:`${ratio*100}%`}}/></i>}
  </span>
  {dead&&<span className="vessel-smoke"/>}
 </button>;
}

function EscortPods({side,escorts=[],selected,onSelect,registerRef,disabled,incoming=[],outgoing=[]}){
 const enemy=side==='enemy';
 return <div className="escort-pods">
  {escorts.map((escort,index)=>{
   const d=escort.defense,dead=d.destroyed;
   const Tag=enemy?'button':'span';
   const props=enemy?{type:'button',onClick:()=>onSelect?.(index),disabled:disabled||dead,'aria-pressed':selected===index&&!dead}:{};
   const sign=d.signature?.op==='minus'?'−':d.signature?.op==='plus'?'+':'✦';
   const label=dead?'DISTRUTTA':d.shield.hp>0?`${d.shield.hp}/${d.shield.max} SCUDO`:`FINALE ${sign} ${d.signature?.target??'?'}`;
   return <Tag key={escort.id} {...props}
    className={`escort-pod escort-slot-${index+1}${enemy&&selected===index?' selected':''}${dead?' destroyed':''}${incoming.some(fx=>fx.escortIndex===index)?' under-fire':''}${outgoing.some(salvo=>salvo.shot.escortSlot===index)?' firing':''}`}
    aria-label={`${escort.name}, ${escort.weapon?.role||'Scudiera'}: ${label}`}
    title={`${escort.weapon?.name} · ${escort.weapon?.role}: ${ESCORT_ROLE_HELP[escort.weapon?.role]||''}`}>
    <span className="escort-ship-hull" ref={node=>registerRef?.(side,index,node)}>
     <img src={`${ASSET_ROOT}/escorts/${escort.parentShipId}_escort_${index+1}.svg`}
      alt="" draggable={false} loading="eager" decoding="async"/>
    </span>
    <b>SCUDIERA {index+1}</b>
    <strong className="escort-role">{escort.weapon?.role}</strong>
    <span className="escort-hp-meter"><i style={{width:`${Math.round(d.shield.hp/d.shield.max*100)}%`}}/></span>
    <small>{label}</small>
   </Tag>;
  })}
 </div>;
}
function Ship({side,ship,targets,focused,onSelectShip,selectedTarget,onTarget,phase,intro,effects=[],availableOps,registerShipRef,registerEngineRef,registerGunRef,registerEscortRef,onSelectEscort,selectedEscort}){
 const enemy=side==='enemy',targetable=enemy&&phase==='ready';
 const formation=fleetFormation(ship.fleet.length,side);
 const maneuver=ship.maneuvers?maneuverStatus(ship.maneuvers,ship,Date.now()):null;
 const attacking=effects.filter(e=>e.side===side).at(-1)??null;
 const incoming=effects.filter(e=>e.side!==side);
 const hit=incoming.some(e=>e.escortIndex==null&&e.targetShip===focused);
 return <div data-fleet-size={ship.fleet.length} data-formation={maneuver?.formation||'balanced'} data-fusion={maneuver?.fusion?.mode||'off'} data-fusion-slot={maneuver?.fusion?.escortSlot??'none'} className={`ship-zone ship-${side}${hit?' ship-struck':''}${effects.length?' ship-in-combat':''}`}>
  <div className="fleet-ships">
   {ship.fleet.map((v,i)=>{
    const focusedShip=i===focused,dead=vesselDestroyed(v);
    return <div key={i} data-ship={v.id} data-level={v.level} data-vessel-index={i} className={`fleet-ship-wrap complete-ship${focusedShip?' focused':''}${dead?' dead-ship':''}`}
     style={{left:`${formation.centers[i]/450*100}%`,top:formation.top,width:formation.size,height:formation.size,
      '--engine-size':`${formation.engineSize}px`,'--engine-hud-width':`${formation.hudWidth}px`,zIndex:focusedShip?3:1}}>
     <ShipSkin key={v.id} side={side} vessel={v} imageRef={node=>registerShipRef?.(side,i,node)}/>
     <MountedWeapons side={side} vessel={v} index={i} effect={attacking} registerGunRef={registerGunRef}/>
     {ENGINE_KEYS.map(op=><Engine key={op} side={side} op={op} vessel={v} formation={formation} mathMode={v.defense?.kind==='mother'}
      target={targets?.[op]} selected={enemy&&focusedShip&&selectedTarget===op} onSelect={()=>onTarget?.(i,op)} enabled={targetable}
      available={!enemy||availableOps.includes(op)} hit={incoming.some(e=>e.escortIndex==null&&e.targetShip===i&&e.op===op)}
      engineRef={node=>registerEngineRef?.(side,i,op,node)} impactDelay={incoming.find(e=>e.escortIndex==null&&e.targetShip===i&&e.op===op)?.arrivalMs}/>) }
     {(intro==='deploy'||intro==='materialize')&&<div className="intro-vessel-card" aria-hidden="true"
      style={{'--deploy-delay':`${i*90+(enemy?90:0)}ms`}}><ShipCard vessel={v} compact/></div>}
    </div>;
   })}
   <div className={'engine-thruster '+(enemy?'red':'blue')}/>
  </div>
  <EscortPods side={side} escorts={ship.escorts} selected={selectedEscort} onSelect={onSelectEscort} registerRef={registerEscortRef} disabled={!!intro||phase!=='ready'} incoming={incoming} outgoing={attacking?.salvos||[]}/>
  <div className={`fleet-picker-inline${ship.fleet.length===1?' single-ship':''}`}>{ship.fleet.map((v,i)=><button key={i} type="button"
   className={focused===i?'focus':''} onClick={()=>onSelectShip?.(i)} aria-pressed={focused===i}
   style={{left:`${formation.centers[i]/450*100}%`,width:Math.min(160,formation.size-8)}}
   disabled={!!intro||(enemy&&phase!=='ready')} title={`${v.name} · ${v.level}`}>
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
function Projectile({effect,rootRef,engineRefs,gunRefs,escortRefs}){
 const [geometry,setGeometry]=useState(null);
 useLayoutEffect(()=>{
  // Read the exact vessel's motor after React commits. Every vessel stays mounted.
  const targetSide=effect?.side==='player'?'enemy':'player';
  const node=effect?.escortIndex!=null?escortRefs.current[targetSide][effect.escortIndex]:engineRefs.current[targetSide][`${effect?.targetShip}/${effect?.op}`];
  const target=rootCoords(rootRef.current,node);
  if(!effect||!target){setGeometry(null);return;}
  const shots=effect.salvos.flatMap(salvo=>{
   const s=salvo.shot;
   const sources=Array.from({length:s.escortSlot!=null?1:weaponMuzzleCount(s.weaponId)},(_,muzzleIndex)=>{
    const source=s.escortSlot!=null?escortRefs.current[effect.side][s.escortSlot]:
     gunRefs.current[effect.side][`${s.vesselIndex}/${s.weaponId}${muzzleIndex?`/${muzzleIndex}`:''}`];
    return rootCoords(rootRef.current,source);
   });
   if(sources.some(source=>!source))return [];
   const rounds=salvo.rounds.map(round=>{
    const [x,y]=sources[projectileSourceIndex(s,round)],dx=target[0]-x,dy=target[1]-y;
    return {...round,x,y,dx,dy,roundWidth:projectileWidth(salvo,Math.hypot(dx,dy))};
   });
   return [{...salvo,rounds}];
  });
  setGeometry({target,shots});
 },[effect?.id,rootRef,engineRefs,gunRefs,escortRefs]);
 if(!effect||!geometry)return null;
 const {target,shots}=geometry;
 return <div className={`vfx-layer${effect.destroyed||effect.systemDisabled?' motor-break':''}`} aria-hidden="true" data-arrival-ms={effect.arrivalMs}>
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
 {effect.resolved&&(effect.systemDisabled||effect.destroyed||effect.systemDamaged)&&
  <span className={'battle-impact-ring'+(effect.systemDisabled||effect.destroyed?' battle-impact-ko':' battle-impact-damaged')}
   style={{left:target[0],top:target[1]}}/>}
 {effect.resolved&&Array.isArray(effect.strategicApplied)&&effect.strategicApplied.length>0&&
  <span className={'battle-impact-status'+
   (effect.strategicApplied.includes('shot-ion')?' battle-status-ion':' battle-status-corrosion')}
   style={{left:target[0],top:target[1]}}/>}
 {effect.damage>0&&<div className="impact-number delayed-impact" style={{left:target[0]-52,top:target[1]-64,color:effect.primaryColor||'#ffdf83','--impact-delay':`${effect.resolved?0:effect.arrivalMs}ms`}}>−{effect.damage}</div>}
 {shots.length===0&&<div className="charge-notice">{effect.volleys.some(s=>s.charging)?'MUNIZIONI IN CARICA':effect.memoryPending?'MEMORIA AGGIORNATA':'NESSUNA ARMA ATTIVATA'}</div>}
 </div>;
}
function Hand({cards,selected,onSelect,disabled}){return <div className="hand" aria-label="Le tue sette carte">{cards.map((c,i)=><button key={c.id} title={`${label(c.value)} ${c.suit}`} disabled={disabled} className={'number-card'+(selected.includes(i)?' active':'')} style={{'--suit':CARD_SUIT_COLORS[c.suit],'--deal-index':i}} onClick={()=>onSelect(i)}><span className="card-suit">{c.suit}</span><strong>{label(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}</div>}
function MemoryCombos({ship}){
 const weapons=ship.fleet.filter(v=>!vesselDestroyed(v)).flatMap(v=>v.weapons.filter(w=>w.tipo==='Combo a memoria'));
 if(!weapons.length)return null;
 return <div className="memory-combos" aria-label="Combo a memoria">{weapons.map(w=>{
  const {required,limit,history,totals}=memoryComboStatus(w);
  const seen=required.filter(s=>totals[s]>0);
  return <div key={w.id} className="memory-combo" data-weapon={w.id} title={comboLabel(w)}
   aria-label={`${w.nome}, ${history.length} su ${limit} calcoli, semi raccolti ${seen.map(s=>WEAPON_SIGNS[s]).join(' ')||'nessuno'}`}>
   <b>{w.id==='W33'?'Giudizio':'Arca'}</b>
   {required.map(s=><i key={s} className={totals[s]>0?'collected':''} style={{color:WEAPON_COLORS[s]}}>{WEAPON_SIGNS[s]}</i>)}
   <small>{history.length}/{limit}</small>
  </div>;
 })}</div>;
}
function Formula({game}){
 const cards=game.selected.map(i=>game.player.hand[i]).filter(Boolean);
 const goal=game.targets[game.target];
 const inspection=cards.length>=2?inspectCalculationCards(game.target,cards,goal):null;
 const selectedVital=game.targetEscort==null?game.enemy.fleet[game.targetShip]?.defense?.parts?.[game.targetVital]:null;
 const matchedPoker=selectedVital?.exposed&&selectedVital.signature?.kind==='any'?
  selectedVital.signature.options.find(sig=>sig.kind==='poker'&&matchesVitalSignature(sig,cards)):null;
 const calculationAccepted=!!(inspection?.valid||matchedPoker);
 const preview=calculationAccepted?previewVolley(game.player,cards,game.weaponFocus||'auto',
 {targetKind:attackTargetKind(game.enemy,{escortIndex:game.targetEscort,vitalId:game.targetEscort==null?game.targetVital:null})}):null;
 const alternative=cards.length>=2&&!calculationAccepted?supportedOperators(game.player)
  .find(op=>op!==game.target&&game.enemy.fleet[game.targetShip]?.engines[op]?.hp>0&&
   inspectCalculationCards(op,cards,game.targets[op]).valid):null;
 const fmt=v=>Number.isInteger(v)?String(v):Number.isFinite(v)?String(Math.round(v*100)/100).replace('.',','):'—';
 const displayed=inspection?.order||cards.map(card=>card.value);
 const expression=displayed.map(label).join(' '+META[game.target].sign+' ');
 const kind=cards.length===3?'3 CARTE':'2 CARTE';
 return <div className={`formula${calculationAccepted?' valid':inspection?' invalid':''}`} aria-live="polite" aria-label="Slot bersaglio e calcolo numerico">
  <b className="formula-target">BERSAGLIO · {game.targetEscort!=null?'SCUDIERA '+(game.targetEscort+1):game.targetVital?VITAL_LABELS[game.targetVital]||'MADRE':'MADRE'}</b>
  <span>{matchedPoker?`POKER ${matchedPoker.pattern==='pair'?'COPPIA':'TRIS'} ✓`:
   inspection?`${expression} = ${fmt(inspection.result)}`:`${META[game.target].sign} ${goal}`}</span>
  <small>{calculationAccepted?(preview.totalDamage?`${kind} · BERSAGLIO ${goal} ✓ · FUOCO ${preview.totalDamage} HP`:
   `BERSAGLIO ${goal} ✓ · ${preview.shots.some(s=>s.charging)?'CARICA':preview.memoryPending?'MEMORIA':'NESSUNA ARMA ATTIVA'}`):
   inspection?(alternative?`BERSAGLIO ${goal} ✗ · USA ${META[alternative].sign} ${game.targets[alternative]}`:
    `BERSAGLIO ${goal} ✗ · RISULTATO ${fmt(inspection.result)}`):
    `SELEZIONA 2 O 3 CARTE (${cards.length}/3)`}</small>
 </div>;
}
function FleetSetup({onClose,onEquip,collection}){
 const [loadout,setLoadout]=useState((collection?.loadout??[]).slice(0,1));
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 function toggleOwned(id){
  if(saving||!collection)return;
  const next=[id];
  try{
   equipShipCards(collection,next);
   setLoadout(next);
   setError('');
  }catch(e){setError(e.message);}
 }
 async function equip(){
  setSaving(true);
  try{await onEquip(loadout);}
  catch{setSaving(false);setError('Impossibile salvare la flotta. Riapri la collezione e riprova.');}
 }
 return <div className="modal-shade"><div className="help-card fleet-setup">
  <h2>FLOTTA E COLLEZIONE</h2>
  {collection?<><p>Carte possedute <b>{collection.cards.length}</b>. Scegli la navicella MADRE da schierare: le scudiere si sbloccano ai livelli 3 e 5. Le altre carte restano nella collezione.</p>
   <div className="fleet-setup-list">{collection.cards.map(card=><ShipCard key={card.instanceId} shipId={card.shipId} level={card.level}
    selected={loadout.includes(card.instanceId)} onSelect={()=>toggleOwned(card.instanceId)}/>)}</div>
   {error&&<p className="fleet-match-warning" role="alert">{error}</p>}
  </>:<p className="fleet-match-warning" role="alert">Il salvataggio della collezione non è leggibile. Nessuna modifica sarà applicata.</p>}
  <SpecialDeckPanel compact/>
  <div className="fleet-setup-actions">
   <button className="es-button" disabled={saving} onClick={onClose}>ANNULLA</button>
   <button className="es-button primary" disabled={saving||!collection||!loadout.length} onClick={equip}>SALVA E SCHIERA</button>
  </div>
 </div></div>;
}
const VITAL_SHORT={engine:'MOTORE',weapons:'ARMI',shieldGenerator:'SCUDI',command:'COMANDO'};
function MotherDefenseControls({defense,selected,onChoose,selectedEscort,onChooseMother}){
 const available=remainingExposureSlots(defense);
 const pct=defense.shield.max?Math.max(0,Math.round(defense.shield.hp/defense.shield.max*100)):0;
 return <div className="vital-panel" role="group" aria-label="Scudi e parti vitali della madre nemica">
  <div className="vital-shield">
   <button className={`mother-target${selectedEscort==null?' selected':''}`} type="button" onClick={onChooseMother} aria-pressed={selectedEscort==null}>MADRE</button>
   <b>SCUDO</b>
   <span className="vital-shield-track"><i style={{width:`${pct}%`}}/></span>
   <strong>{defense.shield.hp}/{defense.shield.max}</strong>
   <small>{available>0?`Scegli ${available}`:'75 · 50 · 25 · 0%'}</small>
  </div>
  <div className="vital-parts">
   {VITAL_IDS.map(id=>{
    const part=defense.parts[id],dead=part.hp<=0,exposed=part.exposed;
    const condition=systemState(defense,id);
    const selectable=!dead&&(exposed||available>0);
    return <button key={id} type="button" disabled={!selectable} aria-pressed={selected===id&&!dead}
      className={`vital-part${dead?' destroyed':''}${condition==='damaged'?' impaired':''}${exposed?' exposed':''}${selected===id&&!dead?' chosen':''}`}
      data-system-state={condition}
      title={`${VITAL_LABELS[id]}: ${part.hp}/${part.max} HP · ${vitalSignatureLabel(part.signature)} · ${dead?'Distrutta':condition==='damaged'?'Danneggiata (efficienza ridotta)':exposed?'Vulnerabile':'Protetta'}`}
      onClick={()=>onChoose(id)}>
      <b>{VITAL_SHORT[id]}</b>
      <span className="vital-part-track"><i style={{width:`${Math.round(part.hp/part.max*100)}%`}}/></span>
      <small>{dead?'KO':condition==='damaged'?`AVARIA ${part.hp}`:`${part.hp} HP`}</small>
      {exposed&&primaryVitalMathGate(part.signature)&&<em className="vital-signature-hint">
    {META[primaryVitalMathGate(part.signature).op]?.sign||'?'} {primaryVitalMathGate(part.signature).target} · 2/3{part.signature.kind==='any'?' O POKER':''}
   </em>}
     </button>;
   })}
  </div>
 </div>;
}
function readCollection(){
 try{return readShipCollection();}catch{return null;}
}
export default function MathDuelBattle({nickname,gameMode,sectorNumber=1,displaySector='',ether=0,selectedBossDeck='neutral_starter',bossDeckInventory={},selectedPilot='pilot_com_1',pilotInventory={},commanderDisplayName='',bossPlanetId=null,bossSectorLevel=null,onEtherConsumed,onResult,onExit}){
 const [scale,setScale]=useState(1);
 const [collection,setCollection]=useState(readCollection);
 const [introIndex,setIntroIndex]=useState(0);
 const [reducedIntro,setReducedIntro]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 function bossChoices(practice=false){
  const chosen=numericBossDeck(selectedBossDeck),owned=bossDeckInventory?.[selectedBossDeck];
  const playerId=chosen&&owned?.unlocked?chosen.id:'neutral_starter';
  const playerLevel=playerId==='neutral_starter'?1:Math.min(chosen.maxLevel,Math.max(1,Number(owned.level)||1));
  const planet=bossPlanetId!=null?PHASE16A_CAMPAIGN_PLANETS.find(p=>p.id===Number(bossPlanetId)):
   PHASE16A_CAMPAIGN_PLANETS[Math.floor((sectorNumber-1)/10)];
  const isBossSector=gameMode==='adventure'?Number(bossSectorLevel)===10:sectorNumber%10===0;
  const enemyId=!practice&&['adventure','campaign'].includes(gameMode)&&isBossSector?planet?.deck:null;
  const boss=numericBossDeck(enemyId);
  return {playerBossDeckId:playerId,playerBossDeckLevel:playerLevel,
   enemyBossDeckId:boss?.id||'neutral_starter',enemyBossDeckLevel:boss?Math.min(boss.maxLevel,1+Math.floor((sectorNumber-1)/20)):1};
 }
 function commanderChoices(practice=false,motherOptions={}){
  const commander=commanderFromInventory(selectedPilot,pilotInventory);
  const enemyId=motherOptions.enemyFleetIds?.[0]||'N00';
  const rival=chooseCampaignRivalCommander({
   mode:gameMode,globalSector:sectorNumber,planetId:bossPlanetId,
   planetSector:bossSectorLevel,shipId:enemyId,
   shipLevel:motherOptions.enemyShipLevels?.[enemyId]??motherOptions.shipLevel,
   practice});
  return {playerCommanderId:commander?.id??null,playerCommanderLevel:commander?.level??1,
   enemyCommanderId:rival.id,enemyCommanderLevel:rival.level};
 }
 function startBattle(options,practice=false){
  // Owned special cards are read from their independent persistent collection.
  // Never overwrite an unreadable save or block the battle.
  let specialDeckTypes=null;
  try{specialDeckTypes=readSpecialCollection().loadout;}catch{}
  const motherOptions=prepareMotherDuelOptions(options,{
   mode:gameMode,globalSector:sectorNumber,planetId:bossPlanetId,
   planetSector:bossSectorLevel,practice});
  const b=initialBattle(Math.max(1,sectorNumber),
   {...motherOptions,...bossChoices(practice),...commanderChoices(practice,motherOptions),
    arenaPlanetId:bossPlanetId,arenaSectorLevel:bossSectorLevel,specialDeckTypes},Math.random,gameMode);
  b.practice=practice;
  b.phase='intro';
  if(!practice)b.player.ether=Math.max(0,Number(ether)||0);
  return b;
 }
 const [game,setGame]=useState(()=>startBattle(collection?collectionBattleOptions(collection):{}));
 const [maneuverMenu,setManeuverMenu]=useState(false);
 const [showSpecialDetails,setShowSpecialDetails]=useState(false);
 const [specialEscortSlot,setSpecialEscortSlot]=useState(0);
 const [uiClock,setUiClock]=useState(Date.now);
 useEffect(()=>{const timer=setInterval(()=>setUiClock(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const maneuverHUD=game.player?.maneuvers?maneuverStatus(game.player.maneuvers,game.player,uiClock):null;
 const armedEffects=armedShotEffects(game.player);
 const ownStrategicStatus=strategicStatus(game.player,uiClock);
 useEffect(()=>{updateShipCollection(current=>current).catch(()=>{/* Keep an unreadable save intact. */});},[]);
 const rootRef=useRef(null);
 const shipRefs=useRef({player:{},enemy:{}});
 const engineRefs=useRef({player:{},enemy:{}});
 const gunRefs=useRef({player:{},enemy:{}});
 const escortRefs=useRef({player:{},enemy:{}});
 const gameRef=useRef(game);gameRef.current=game;
 const registerShipRef=(side,index,node)=>{if(node)shipRefs.current[side][index]=node; else delete shipRefs.current[side][index];};
 const registerEngineRef=(side,index,op,node)=>{const key=`${index}/${op}`;if(node)engineRefs.current[side][key]=node; else delete engineRefs.current[side][key];};
 const registerEscortRef=(side,index,node)=>{if(node)escortRefs.current[side][index]=node;else delete escortRefs.current[side][index];};
 const registerGunRef=(side,index,id,node)=>{const key=`${index}/${id}`;if(node)gunRefs.current[side][key]=node;else delete gunRefs.current[side][key];};const [help,setHelp]=useState(false),[fleetMenu,setFleetMenu]=useState(false),[message,setMessage]=useState('');const queue=useRef([]),resultClaimed=useRef(false),attackSerial=useRef(0),cueSerial=useRef(0);
 const pauseClockRef=useRef(false),pauseStartRef=useRef(0);
 pauseClockRef.current=help||fleetMenu;
 function later(f,ms){const handle=setTimeout(f,ms);queue.current.push(handle);return handle;}
 useEffect(()=>()=>queue.current.forEach(clearTimeout),[]);
 useEffect(()=>{const resize=()=>setScale(Math.max(.3,Math.min(window.innerWidth/450,window.innerHeight/800)));resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 function write(b){gameRef.current=b;setGame(b)}
 // Solo il tempo di decisione dell'IA si ferma in Aiuto e Flotta.
 useEffect(()=>{
  const paused=help||fleetMenu,now=Date.now();
  if(paused){
   if(!pauseStartRef.current)pauseStartRef.current=now;
  }else if(pauseStartRef.current){
   const elapsed=now-pauseStartRef.current;pauseStartRef.current=0;
   const b=gameRef.current;
   if(b.phase==='ready'&&b.aiDueAt){
    write({...b,aiDueAt:b.aiDueAt+elapsed});
   }
  }
 },[help,fleetMenu]);
 const intro=game.phase==='intro'?INTRO_STAGES[introIndex]:null;
 function finishIntro(){
  const b=gameRef.current;
  if(b.phase==='intro'){
   const now=Date.now(),delay=nextAiActionDelay(Math.random,b.level,b.mode);
   write({...b,phase:'ready',aiDueAt:now+delay,combatStartedAt:now});
  }
 }
 useEffect(()=>{
  if(!intro)return;
  const timer=setTimeout(()=>{
   if(introIndex===INTRO_STAGES.length-1)finishIntro();
   else setIntroIndex(introIndex+1);
  },reducedIntro?180:intro.duration);
  return()=>clearTimeout(timer);
 },[intro,introIndex,reducedIntro]);
 function notice(text){setMessage(text);later(()=>setMessage(''),2200)}
 function finish(b,winner,reason){return {...b,actor:'none',phase:'finished',winner,reason};}
 function resolveOutcome(b){
  if(b.effects?.some(effect=>!effect.resolved))return b;
  if(isDestroyed(b.player))return finish(b,'enemy','La tua flotta è stata distrutta');
  if(isDestroyed(b.enemy))return finish(b,'player','Flotta avversaria distrutta');
  if(deckExhausted(b.player,b.enemy))return finish(b,deckVerdict(b.player,b.enemy),'Mazzo esaurito: confronto integrità delle flotte');
  return b;
 }
 function retarget(b){
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  const state=next?{...b,...next}:b;
  const escort=state.targetEscort!=null?state.enemy.escorts?.[state.targetEscort]:null;
  if(state.targetEscort!=null&&(!escort||escort.defense.destroyed))
   return {...state,targetEscort:null,targetVital:null};
  const part=state.enemy.fleet[0]?.defense?.parts?.[state.targetVital];
  return part&&part.hp>0&&part.exposed?state:{...state,targetVital:null};
 }
 function orderManeuver(formation){
  const b=gameRef.current;
  if(b.phase!=='ready'||!b.player?.maneuvers)return;
  const n=clone(b),result=changeFormation(n.player.maneuvers,n.player,formation,Date.now());
  n.player.maneuvers=result.state;
  n.notice=result.changed?'FORMAZIONE: '+({balanced:'EQUILIBRATA',guard:'GUARDIA',assault:'ASSALTO'}[formation]||formation):
   result.reason==='formation_cooldown'?'Formazione in ricarica':result.reason==='command_offline'?'Centralina disattivata':result.reason==='fusion_active'?'Attendi la fine della fusione':'Ordine non disponibile';
  write(n);
 }
 function playTacticalCard(cardIndex){
  const b=gameRef.current;
  if(b.phase!=='ready'||!b.player?.maneuvers)return;
  const n=clone(b);
  const result=playSpecialCard(n.player,cardIndex,{escortSlot:specialEscortSlot},Date.now());
  if(result.played){
   n.player=result.side;
   n.combatCue=specialBattleCue({id:++cueSerial.current,side:'player',
    played:true,definition:result.definition,amount:result.amount});
   tone('special');
   n.notice=result.definition.family==='volley'?'COLPO STRATEGICO ARMATO: '+result.definition.name:
    result.definition.family==='support'?'SUPPORTO: '+result.definition.name+
     (result.amount?' · +'+result.amount+' HP':''):
    'CARTA SPECIALE: '+result.definition.name+
     (['twin','triad'].includes(result.definition.mode)?' · DUE SCUDIERE':
      ' · SCUDIERA '+(specialEscortSlot+1));
   n.logs=[n.notice,...n.logs].slice(0,6);
   setManeuverMenu(false);
  }else{
   n.notice=({
    card_missing:'La carta speciale non è nella mano',
    not_enough_sync:'Sincronia insufficiente (richiesta: 100)',
    fusion_active:'Una fusione è già attiva',
    cover_active:'Copertura tattica già pronta',
    already_armed:'Questa speciale è già preparata',
    volley_slots_full:'Puoi preparare al massimo due effetti per scarica',
    defensive_escort_required:'La copertura usa soltanto la prima scudiera',
    command_offline:'Centralina madre distrutta',
    fusion_cooldown:'Fusione in ricarica',
    escort_unavailable:'Scegli una scudiera con scudo attivo',
    mother_not_ready:'Motore o centralina non disponibili',
    shield_full:'Scudo madre già al massimo',
    generator_destroyed:'Generatore scudi distrutto: non puoi riparare',
    repair_unavailable:'Riparazione temporaneamente non disponibile',
    no_negative_status:'Nessuna Ionizzazione o Corrosione attiva',
    ability_unavailable:'Abilità non ancora disponibile'
   })[result.reason]||'Carta speciale non utilizzabile';
  }
  write(n);
 }
 function recoverNumericHand(){
  const b=gameRef.current;
  if(b.phase!=='ready'||b.actor!=='player')return;
  const res=recoverStalledHand(b.player,b.enemy,b.targets,Date.now());
  if(res.recovered){
   const next=clone(b);
   next.player=res.side;
   next.selected=[];
   next.notice='RICAMBIO NUMERICO: 1 carta sostituita, senza consumare speciali';
   next.logs=[next.notice,...next.logs].slice(0,6);
   write(next);
  }else{
   notice(({legal_move_available:'Hai già almeno un attacco valido',
    cooldown:'Ricambio in ricarica',
    insufficient_hand:'Carte insufficienti',
    no_draw_pile:'Non ci sono carte disponibili da pescare'})[res.reason]||'Ricambio non disponibile');
  }
 }
 function undock(){
  const b=gameRef.current,n=clone(b),result=cancelFusion(n.player.maneuvers,n.player,Date.now());
  n.player.maneuvers=result.state;
  n.notice=result.cancelled?'SGANCIO COMPLETATO':'Nessuna fusione attiva';
  write(n);setManeuverMenu(false);
 }
 function fire(side,move){
  const b=gameRef.current;
  if(b.phase!=='ready'||b.actor!=='player'||deckExhausted(b.player,b.enemy))return;
  const receiver=side==='player'?'enemy':'player';
  const attacker=b[side],goal=b.targets[move.op],
   indices=Array.isArray(move.indices)?move.indices:[move.i,move.j],
   cards=indices.map(i=>attacker.hand[i]);
  if(![2,3].includes(indices.length)||new Set(indices).size!==indices.length||cards.some(card=>!card)){
   if(side==='player')notice('Seleziona 2 o 3 carte valide e diverse');return;
  }
  if(!supportedOperators(attacker).includes(move.op)){if(side==='player')notice('Operazione non disponibile');return;}
  const defendingMother=b[receiver].fleet[move.targetShip]?.defense;
  const chosenVital=side==='player'?b.targetVital:move.vitalId;
  const candidateVital=move.escortIndex==null?
   defendingMother?.parts?.[chosenVital]:null;
  const canExposeAI=side==='enemy'&&defendingMother?.kind==='mother'&&
   remainingExposureSlots(defendingMother)>0;
  const pokerProof=(candidateVital?.exposed||canExposeAI)&&candidateVital?.signature?.kind==='any'?
   candidateVital.signature.options.find(sig=>sig.kind==='poker'&&matchesVitalSignature(sig,cards)):null;
  if(!inspectCalculationCards(move.op,cards,goal).valid&&!pokerProof){
   const reset=resetComboMemory(attacker);
   if(reset!==attacker)write({...b,[side]:reset});
   if(side==='player')notice(`Calcolo non valido: bersaglio ${goal}`);
   return;
  }
  let prepared=b,defender=prepared[receiver],vitalId=null;
  const escortIndex=Number.isInteger(move.escortIndex)?move.escortIndex:null;
  const escort=escortIndex!=null?defender.escorts?.[escortIndex]:null;
  if(escortIndex!=null&&(!escort||escort.defense.destroyed)){
   if(side==='player')notice('Scudiera non disponibile');return;
  }
  if(escort&&escort.defense.shield.hp===0&&escort.defense.signature?.op!==move.op){
   if(side==='player')notice('Scudiera senza scudo: usa l’operazione finale indicata');return;
  }
  const mother=escortIndex==null?defender.fleet[move.targetShip]?.defense:null;
  if(mother?.kind==='mother'){
   if(side==='player'){
    const part=mother.parts[b.targetVital];
    if(part?.exposed&&part.hp>0){
     const required=primaryVitalMathGate(part.signature);
     if(required?.op&&required.op!==move.op&&!pokerProof){notice('Firma del vitale: '+vitalSignatureLabel(part.signature));return;}
     vitalId=b.targetVital;
    }
    else if(mother.shield.hp===0){notice('Lo scudo è esaurito: scegli una parte vitale da colpire');return;}
   }else{
    // The AI is allowed to target a vital only when its NUMERIC/POKER hand
    // satisfies that particular model signature. No silent wasted volleys.
    const id=move.vitalId,part=mother.parts?.[id];
    if(part?.hp>0&&matchesVitalSignature(part.signature,cards)){
     if(part.exposed)vitalId=id;
     else if(remainingExposureSlots(mother)>0){
      const exposed=exposeMotherPart(mother,id);
      if(exposed.exposed){
       vitalId=id;
       prepared=clone(b);
       prepared[receiver].fleet[move.targetShip].defense=exposed.defense;
       defender=prepared[receiver];
      }
     }
    }
    if(!vitalId&&mother.shield.hp===0)return;
   }
  }
  if((defender.fleet[move.targetShip]?.engines?.[move.op]?.hp||0)<=0){
   if(side==='player')notice('Operazione non disponibile');return;
  }
  const proof=escortIndex!=null?{escortIndex,cards}:vitalId?{vitalId,cards,signatureOverride:{kind:'math',op:move.op,target:goal}}:{};
  const strike=dealHit(defender,attacker,move.op,goal,cards,move.targetShip,proof,side==='player'?b.weaponFocus:'auto'),
   timing=volleyTimeline(strike.volley),salvos=planWeaponSalvos(strike.volley),
   strongest=[...strike.volley].sort((a,b)=>(b.damage||0)-(a.damage||0))[0];
  const targetMotherShield=escortIndex==null&&vitalId==null&&
   defender.fleet[move.targetShip]?.defense?.kind==='mother'&&
   defender.fleet[move.targetShip].defense.shield.hp>0;
  const firedStrategicEffects=targetMotherShield&&strike.rawDamage>0?
   armedShotEffects(attacker):[];
  const effect={
   id:++attackSerial.current,side,op:move.op,targetShip:move.targetShip,
   environmentStage:arenaEnvironment(prepared.arena?.id,prepared.round).stage,
   spentCards:spentCardTrail(cards,indices,side),
   unmodifiedVolleyDamage:strike.volley.reduce((sum,shot)=>sum+Math.max(0,(shot.damage||0)-(shot.maneuverBonus||0)),0),
   vitalId,escortIndex,pokerProof:pokerProof?.pattern??null,rawDamage:strike.rawDamage,damage:0,destroyed:false,resolved:false,
   strikeEffects:firedStrategicEffects,strikeCombo:shotCombinationName(firedStrategicEffects),
   volleys:strike.volley,salvos,memoryPending:strike.memoryPending,
   arrivalMs:timing.arrivalMs,primaryColor:WEAPON_COLORS[strongest?.suit]||'#ffdf83',
   shipCount:attacker.fleet.length,sourceFocus:side==='player'?b.shownPlayer:b.targetShip
  };
  const next=clone(prepared);
  next[side]=consumeAttack(strike.attacker,indices);
  if(firedStrategicEffects.length)next[side].armedVolleyEffects=[];
  if(next[side].maneuvers){
   const credited=recordManeuverEvent(next[side].maneuvers,
    {id:'calc:'+effect.id+':'+side,type:'valid_calculation'});
   next[side]=applyBossNumericSync(applyArenaCalculationSync(
     {...next[side],maneuvers:credited.state},next.arena?.id,credited.credited,effect.environmentStage),credited.credited);
  }
  if(side==='player'){next.selected=[];next.targetShip=move.targetShip;}
  else next.shownPlayer=move.targetShip;
  next.effects=[...(prepared.effects||[]),effect];next.round+=1;
  next.combatCue=launchBattleCue({id:effect.id,side,cards,rawDamage:effect.rawDamage,
   shots:strike.volley,effects:firedStrategicEffects});
  // AI acts defensively only after a real mother-bound salvo has launched.
  // It must own and consume a Copertura Tattica card, just like the player.
  if(side==='player'&&escortIndex==null&&effect.rawDamage>0&&next.enemy?.maneuvers){
   const coverIndex=findCoverCardIndex(next.enemy);
   const motherShield=next.enemy.fleet[0]?.defense?.shield;
   if(coverIndex>=0&&motherShield&&effect.rawDamage>=Math.max(12,motherShield.max*.15)){
    const cover=playSpecialCard(next.enemy,coverIndex,{escortSlot:0},Date.now());
    if(cover.played)next.enemy=cover.side;
   }
  }
  const doctrinalShots=strike.volley.filter(shot=>shot.tacticalDoctrine);
  next.notice=doctrinalShots.length?
   'BONUS FLOTTA: '+doctrinalShots.map(shot=>shot.tacticalDoctrine).join(' / '):
   side==='player'?'Attacco lanciato: prepara il prossimo':'L’IA ha sparato: puoi continuare';
  write(next);
  if(salvos.length)volleySound(salvos);else tone('charge');
  later(()=>{
   const active=gameRef.current;
   if(active.phase==='finished'||!active.effects?.some(e=>e.id===effect.id))return;
   const state=clone(active),idx=state.effects.findIndex(e=>e.id===effect.id);
   if(state.effects[idx].resolved)return;
   // Firma fissa per modello ancora da definire; solo il prototipo riusa il bersaglio matematico corrente.
   const options=escortIndex!=null?{escortIndex,cards}:vitalId?{vitalId,cards,signatureOverride:{kind:'math',op:move.op,target:goal}}:{};
   options.hitId=effect.id+':'+receiver;
   options.strikeEffects=effect.strikeEffects;
   options.nowMs=Date.now();
   const context={op:effect.op,cards,vitalId:effect.vitalId,escortIndex:effect.escortIndex,nowMs:options.nowMs,legalAttack:true,
    environmentStage:effect.environmentStage,
    weaponKey:strongest?.weaponId||strongest?.id||null,reshufflesAtLaunch:attacker.reshuffles||0,
    escortShot:strike.volley.some(shot=>shot.escortSlot!=null),motherShot:strike.volley.some(shot=>shot.escortSlot==null),strikeEffects:effect.strikeEffects};
   // Stesso risolutore dei test integrati: nessuna formula duplicata nella UI.
   const resolution=resolveCombatImpact({
    attacker:state[side],defender:state[receiver],arenaId:state.arena?.id,
    effect,context,options
   });
   const {result,balance}=resolution;
   state[side]=resolution.attacker;
   state[receiver]=resolution.defender;
   if(escortIndex!=null&&result.damage>0&&state[side].maneuvers){
    const credited=recordManeuverEvent(state[side].maneuvers,
     {id:'escortHit:'+effect.id+':'+side,type:'escort_hit',amount:result.damage});
    state[side]=applyBossNumericSync({...state[side],maneuvers:credited.state},credited.credited);
   }
   const previousBalance=state.balanceMetrics||{};
   state.balanceMetrics={
    resolvedImpacts:(previousBalance.resolvedImpacts||0)+1,
    playerImpacts:(previousBalance.playerImpacts||0)+(side==='player'?1:0),
    enemyImpacts:(previousBalance.enemyImpacts||0)+(side==='enemy'?1:0),
    passiveCaps:(previousBalance.passiveCaps||0)+(balance.passiveCapApplied?1:0),
    fusionStackCaps:(previousBalance.fusionStackCaps||0)+(balance.fusionStackCapApplied?1:0),
    defenseCaps:(previousBalance.defenseCaps||0)+(balance.motherDefenseCapApplied?1:0),
    peakImpacts:(previousBalance.peakImpacts||0)+(effect.environmentStage==='surge'?1:0),
    specialImpacts:(previousBalance.specialImpacts||0)+(result.strategicApplied?.length?1:0)
   };
   state.effects[idx]={...state.effects[idx],resolved:true,damage:result.damage,destroyed:result.destroyed,
    systemDisabled:result.systemDisabled||null,systemDamaged:result.systemDamaged||null,
    strategicApplied:result.strategicApplied||[]};
   state.combatCue=impactBattleCue({id:effect.id,side,result,effect});
   if(result.damage>0)tone(result.destroyed||result.systemDisabled?'critical':'impact');
   const systemLog=result.systemMessage?`${side==='player'?'NEMICO':'TU'}: ${result.systemMessage}`:null;
   const tacticalCombo=result.strategicApplied?.length===2?shotCombinationName(result.strategicApplied):null;
   const strategicLog=result.strategicApplied?.length?
    'EFFETTO SPECIALE: '+(tacticalCombo||result.strategicApplied.map(id=>STRATEGIC_EFFECT_LABELS[id]).join(' + ')):null;
   if(systemLog||strategicLog)state.notice=[systemLog,strategicLog].filter(Boolean).join(' · ');
   state.logs=[...(systemLog?[systemLog]:[]),...(strategicLog?[strategicLog]:[]),
    `${side==='player'?'TU':'IA'}: ${effect.pokerProof?'FIRMA POKER '+(effect.pokerProof==='pair'?'COPPIA':'TRIS'):cards.map(card=>card.value+card.suit).join(' '+META[move.op].sign+' ')+' = '+goal} — ${result.damage} HP ${escortIndex!=null?'SCUDIERA '+(escortIndex+1):vitalId?VITAL_SHORT[vitalId]:'SCUDO'}`,
    ...(result.shieldCollapsed>0?[`GENERATORE DISTRUTTO: -${result.shieldCollapsed} HP scudo`]:[]),
    ...state.logs].slice(0,6);
   write(resolveOutcome(retarget(state)));
  },timing.arrivalMs);
  later(()=>{
   const active=gameRef.current;
   if(!active.effects?.some(e=>e.id===effect.id))return;
   const state={...active,effects:active.effects.filter(e=>e.id!==effect.id)};
   write(resolveOutcome(state));
  },timing.settleMs);
 }
 function attack(){const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  if(!next){notice('Nessun motore nemico attaccabile');return;}
  if(next.targetShip!==b.targetShip||next.target!==b.target){
   write({...b,...next});notice('Bersaglio distrutto: motore successivo selezionato');return;
  }
  if(![2,3].includes(b.selected.length)){notice('Seleziona 2 o 3 carte');return;}
  fire('player',{op:b.target,targetShip:b.targetShip,escortIndex:b.targetEscort,indices:[...b.selected]});}
 function pick(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const next=clone(b);next.selected=next.selected.includes(i)?next.selected.filter(x=>x!==i):next.selected.length>=3?[...next.selected.slice(1),i]:[...next.selected,i];write(next);tone('click');}
 function selectEscort(index){
  const b=gameRef.current,escort=b.enemy.escorts?.[index];
  if(b.phase!=='ready'||!b.vitalPrototype||!escort||escort.defense.destroyed)return;
  const op=escort.defense.shield.hp===0?escort.defense.signature?.op:b.target;
  write({...b,targetEscort:index,targetVital:null,target:op||b.target,targetShip:0,
   notice:escort.defense.shield.hp===0?`Scudiera ${index+1}: completa la formula finale`:`Scudiera ${index+1}: abbassa lo scudo`});
 }
 function selectMother(){
  const b=gameRef.current;
  if(b.phase!=='ready'||!b.vitalPrototype)return;
  write({...b,targetEscort:null,targetVital:null,notice:'Bersaglio: navicella madre'});
 }
 function selectVitalPart(id){
  const b=gameRef.current;
  if(b.phase!=='ready'||b.actor!=='player'||!b.vitalPrototype)return;
  const defense=b.enemy.fleet[0]?.defense;
  if(!defense?.parts?.[id]||defense.parts[id].hp<=0)return;
  if(defense.parts[id].exposed){
   const required=primaryVitalMathGate(defense.parts[id].signature);
   write({...b,targetVital:id,targetEscort:null,...(required?.op?{target:required.op}:{})});
   return;
  }
  const result=exposeMotherPart(defense,id);
  if(!result.exposed){notice('Abbassa prima lo scudo fino alla prossima soglia');return;}
  const next=clone(b);
  next.enemy.fleet[0].defense=result.defense;
  next.targetVital=id;next.targetEscort=null;
  const required=primaryVitalMathGate(result.defense.parts[id].signature);
  if(required?.op)next.target=required.op;
  next.notice=`Parte esposta: ${VITAL_LABELS[id]} · ${vitalSignatureLabel(result.defense.parts[id].signature)}`;
  write(next);
 }
 function selectEngine(index,op){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(!supportedOperators(b.player).includes(op)){notice('La tua flotta non ha ancora questo motore operativo');return;}if((b.enemy.fleet[index]?.engines[op]?.hp||0)<=0)return;write({...b,targetShip:index,target:op});}
 function chooseEnemy(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;
  const v=b.enemy.fleet[i];if(!v||vesselDestroyed(v))return;
  const target=nextAttackTarget(b.player,b.enemy,i,b.target);
  if(!target||target.targetShip!==i){notice('Questa nave non ha motori attaccabili con le operazioni disponibili');return;}
  write({...b,...target});}
 function change(withEther){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(b.selected.length!==1){notice('Seleziona UNA carta da cambiare');return;}
  const n=clone(b),i=n.selected[0];if(withEther){const ship=etherChange(n.player,i);if(!ship){notice('Etere insufficiente o mazzo vuoto');return;}n.player=ship;if(!b.practice)onEtherConsumed?.(1);n.notice='Carta sostituita con Etere';}
  else{const swap=sacrificeCard(n.player,i,n.enemy,null);if(!swap){notice('Non puoi cambiare altre carte');return;}n.player=swap.ship;n.enemy=swap.opponent;n.notice=`Sacrificio ${n.player.sacrifices}/3: ${swap.detail}`;}
  n.selected=[];n.logs=[n.notice,...n.logs].slice(0,6);write(resolveOutcome(n));
 }
 // L'IA usa un intervallo indipendente. Un attacco in animazione viene
 // terminato prima di risolvere un eventuale tentativo IA già maturo.
 useEffect(()=>{
  const timer=setInterval(()=>{
   const b=gameRef.current;
   if(pauseClockRef.current||b.phase!=='ready'||b.actor!=='player'||!b.aiDueAt||Date.now()<b.aiDueAt)return;
   const n=clone(b),now=Date.now(),delay=nextAiActionDelay(Math.random,b.level,b.mode);
   n.aiDueAt=now+delay;
   if(n.enemy.maneuvers){
    const status=maneuverStatus(n.enemy.maneuvers,n.enemy,now);
    n.enemy.maneuvers=status.state;
    if(status.sync>=100&&!status.fusion&&!status.cover&&status.availableEscorts.some(x=>x.available)){
     const target=status.availableEscorts.find(x=>x.available);
     const shield=n.enemy.fleet[0].defense.shield;
     const defensive=shield.hp<shield.max*.55;
     const duo=status.availableEscorts.filter(x=>x.available).length===2;
     const priorities=defensive?['twin','barrier','triad','strike']:
      ['triad','strike','barrier','twin'];
     const available=priorities.map(mode=>({mode,index:findFusionCardIndex(n.enemy,mode)}))
      .find(candidate=>candidate.index>=0&&
       (!['twin','triad'].includes(candidate.mode)||duo));
     if(available){
      const played=playSpecialCard(n.enemy,available.index,{escortSlot:target.slot},now);
      if(played.played)n.enemy=played.side;
     }
    }else if(!status.fusion&&status.formation==='balanced'&&status.availableEscorts.length){
     n.enemy.maneuvers=changeFormation(status.state,n.enemy,'guard',now).state;
    }
   }
   // The AI must own and spend these support cards, as the human does.
   if(n.enemy?.maneuvers&&n.enemy.fleet[0]?.defense?.kind==='mother'){
    for(const type of ['support-status-purge','support-shield-repair']){
     const enemyDefense=n.enemy.fleet[0].defense;
     const active=strategicStatus(n.enemy,now);
     const useful=type==='support-status-purge'?
      !!(active.ionizedUntil||active.corrodedUntil):
      enemyDefense.shield.hp<enemyDefense.shield.max*.65;
     if(!useful)continue;
     const index=(n.enemy.specialHand||[]).findIndex(card=>card.type===type);
     if(index<0)continue;
     const played=playSpecialCard(n.enemy,index,{escortSlot:0},now);
     if(played.played)n.enemy=played.side;
    }
   }
   // AI spends one owned card to restore a still-alive escort shield.
   if(n.enemy?.maneuvers&&n.enemy.fleet[0]?.defense?.kind==='mother'){
    const damagedEscort=(n.enemy.escorts||[]).findIndex(escort=>
     escort?.defense&&!escort.defense.destroyed&&escort.defense.shield?.max>0&&
     escort.defense.shield.hp<escort.defense.shield.max*.55);
    if(damagedEscort>=0){
     const index=(n.enemy.specialHand||[]).findIndex(card=>card.type==='support-escort-repair');
     if(index>=0){
      const played=playSpecialCard(n.enemy,index,{escortSlot:damagedEscort},now);
      if(played.played)n.enemy=played.side;
     }
    }
   }
   let move=chooseCombatMove(n.enemy,n.player,n.targets,Math.random);
   // Stalled AI may use an already-approved numeric exchange, without
   // changing the player's continuous clock or conjuring free ammunition.
   if(!move&&n.enemy.sacrifices<3&&
      (n.enemy.deck.length||(n.enemy.recycleNumericDeck&&n.enemy.discard.length))&&n.enemy.hand.length){
    const swap=sacrificeCard(n.enemy,Math.floor(Math.random()*n.enemy.hand.length),n.player,null);
    if(swap){
     n.enemy=swap.ship;n.player=swap.opponent;
     move=chooseCombatMove(n.enemy,n.player,n.targets,Math.random);
    }
   }
   if(!move&&n.enemy.recycleNumericDeck){
    const rescued=recoverStalledHand(n.enemy,n.player,n.targets,now,Math.random);
    if(rescued.recovered){
     n.enemy=rescued.side;
     move=chooseCombatMove(n.enemy,n.player,n.targets,Math.random);
    }
   }
   if(isDestroyed(n.player)){write(finish(n,'enemy','Flotta distrutta'));return;}
   if(isDestroyed(n.enemy)){write(finish(n,'player','Flotta nemica distrutta'));return;}
   if(deckExhausted(n.player,n.enemy)){write(resolveOutcome(n));return;}
   if(move){
    const live=(n.player.escorts||[]).map((escort,index)=>({escort,index}))
     .filter(({escort})=>!escort.defense.destroyed);
    if(!move.vitalId&&live.length&&Math.random()<.45){
     const chosen=live[Math.floor(Math.random()*live.length)];
     const op=chosen.escort.defense.shield.hp===0?chosen.escort.defense.signature?.op:move.op;
     const candidate=op===move.op?move:findMoves(n.enemy,n.player,n.targets).find(m=>m.op===op&&m.targetShip===0);
     if(candidate)move={...candidate,targetShip:0,escortIndex:chosen.index};
    }
    // The AI uses exactly the same special-card inventory and consumption as the player.
    if(move.escortIndex==null&&n.player.fleet[0]?.defense?.kind==='mother'&&
       n.player.fleet[0].defense.shield.hp>0&&n.enemy?.maneuvers){
     for(const kind of ['shot-piercing','shot-ion','shot-corrosion']){
      if(armedShotEffects(n.enemy).length>=2)break;
      const index=findVolleyCardIndex(n.enemy,[kind]);
      if(index<0)continue;
      const played=playSpecialCard(n.enemy,index,{escortSlot:0},Date.now());
      if(played.played)n.enemy=played.side;
     }
    }
    write(n);fire('enemy',move);
   }
   else{n.notice='L’IA cerca una combinazione valida';write(n);}
  },250);
  return()=>clearInterval(timer);
 },[]);
 function openFleet(){
  const b=gameRef.current;
  if(b.round!==1||b.player.discard.length||b.phase!=='ready'){notice('La flotta si configura prima del primo attacco');return;}
  setCollection(readCollection());setFleetMenu(true);
 }
 async function saveLoadout(loadout){
  const next=await updateShipCollection(current=>equipShipCards(current,loadout));
  const b=gameRef.current;
  const options=prepareMotherDuelOptions(collectionBattleOptions(next),{
   mode:b.mode,globalSector:b.level,planetId:bossPlanetId,
   planetSector:bossSectorLevel,practice:!!b.practice});
  setCollection(next);
  const {fleet}=newShip(b.level,false,options);
  let equippedTypes=null;
  try{equippedTypes=readSpecialCollection().loadout;}catch{}
  const existingTypes=[...(b.player.specialHand||[]),...(b.player.specialDeck||[]),
   ...(b.player.specialDiscard||[])].map(card=>card.type);
  const counts=specialDeckCounts(existingTypes);
  const wantedCounts=specialDeckCounts(equippedTypes);
  const sameSpecialDeck=!equippedTypes||Object.keys(wantedCounts).every(type=>counts[type]===wantedCounts[type]);
  const unchanged=sameSpecialDeck&&fleet.length===b.player.fleet.length&&fleet.every((v,i)=>v.id===b.player.fleet[i].id&&v.level===b.player.fleet[i].level);
  if(unchanged){/* La flotta equipaggiata è già attiva. */}
  else{
   // Un nuovo schieramento richiede una vera nuova partita: non mescolare
   // firme, bersagli, mazzi numerici e HP dello scontro precedente.
   setIntroIndex(0);
   write(startBattle(options,!!b.practice));
  }
  setFleetMenu(false);
 }
 async function exitBattle(){
  const b=gameRef.current;
  if(b?.phase==='finished'&&!b.practice&&!resultClaimed.current){
   resultClaimed.current=true;
   let specialPackEarned=false,shipRewardEarned=null;
   if(b.winner==='player'&&['adventure','campaign'].includes(b.mode)){
    try{specialPackEarned=claimFirstWinSpecialPack(b.mode,sectorNumber).granted;}
    catch{/* A damaged collection cannot block the ordinary battle reward. */}
    try{
     const ship=await claimCampaignShipUnlock(b.mode,sectorNumber);
     if(ship.granted)shipRewardEarned=ship.shipId;
    }catch{/* La ricompensa navicella non azzera il salvataggio. */}
   }
   const h=healthScore(b.player);
   if(b.mode!=='pvp')onResult?.(b.winner,{turnsElapsed:b.round,remainingHpPct:h,
    starsEarned:[true,h>=.65,h>=.9],
    matchStats:{damageDealt:Math.round((1-healthScore(b.enemy))*100),
     turnsElapsed:b.round,specialPackEarned,shipRewardEarned,...battlePacingReport(b,Date.now())}});
  }
  onExit?.();
 }
 const availableOps=supportedOperators(game.player);
 const playerSystemAlerts=game.vitalPrototype?VITAL_IDS
  .map(id=>({id,state:systemState(game.player.fleet[0].defense,id)}))
  .filter(item=>item.state==='damaged'||item.state==='destroyed')
  .map(item=>VITAL_SHORT[item.id]+(item.state==='destroyed'?' KO':' AVARIA'))
  .join(' · '):'';
 const maneuverArmaments=activeArmaments(game.player.maneuvers?prepareSideForAmmoRouting(game.player,uiClock).side:game.player);
 const ambient=arenaEnvironment(game.arena?.id,game.round);
 return <div className="es-math-scope game-viewport" role="region" aria-label="Duello matematico spaziale">
  <div ref={rootRef} className="es-root" data-intro={intro?.id} data-intro-motion={intro&&reducedIntro?'reduced':undefined}
   style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <ArenaBackdrop/>
   <ArenaEnvironment arenaId={game.arena?.id} round={game.round}/>
   <BattleCombatFeedback cue={game.combatCue} effects={game.effects} intro={!!intro}/>
   <div className="top-brand">ECLISSI <b>STELLARE</b><small title={game.arena?.description} aria-label={'Arena tattica: '+(game.arena?.name||'Piattaforma di Titanio')}>{'ARENA · '+(game.arena?.shortLabel||'TITANIO')}</small></div>
   {!ambient.neutral&&<div className={'arena-phase-indicator arena-phase-'+ambient.stage}
     style={{'--arena-accent':ambient.accent}}
     title="La fase cambia ogni tre attacchi matematici validi complessivi, di entrambe le flotte."
     role="status" aria-live="polite" aria-label={'Condizione ambientale '+ambient.label+', '+ambient.calculationsUntilChange+' attacchi validi al cambio'}>
     <strong>{ambient.label}</strong><small>CAMBIO FRA {ambient.calculationsUntilChange}</small>
   </div>}
   <div className="toolbar"><button onClick={()=>setHelp(true)} disabled={!!intro} aria-label="Regole">?</button><button onClick={openFleet} disabled={!!intro} title="Flotta e collezione" aria-label="Flotta">⚙</button><button className="math-exit" onClick={()=>{if(game.phase==='finished'||window.confirm('Abbandonare la battaglia?'))exitBattle()}} aria-label="Torna al menu">⌂</button></div>
   <div className={'enemy-status'+(game.enemy.bossNumericDeck?' boss-marked':'')}
     title={'COMANDANTE NEMICO: '+(commanderAbilityStatus(game.enemy)?.name||'Cadetto')}><div className="portrait">◆</div><div><b>{gameMode==='pvp'?'IA SIMULATA · NON ONLINE':'AVVERSARIO'} {displaySector&&`• ${displaySector}`}{game.enemy.bossNumericDeck?' · '+numericBossDeck(game.enemy.bossNumericDeck.id)?.name:''}</b><small>CMD {commanderAbilityStatus(game.enemy)?.name||'BASE'} · {game.vitalPrototype?`SCUDO ${game.enemy.fleet[0].defense.shield.hp}/${game.enemy.fleet[0].defense.shield.max} · VITALI ${VITAL_IDS.filter(id=>game.enemy.fleet[0].defense.parts[id].hp>0).length}/4`:`INTEGRITÀ FLOTTA ${Math.round(healthScore(game.enemy)*100)}%`}</small></div><Pips ship={game.enemy}/></div>
   <Ship side="enemy" ship={game.enemy} targets={!intro&&game.actor==='player'?game.targets:null} focused={game.targetShip} onSelectShip={chooseEnemy} selectedTarget={game.target} onTarget={selectEngine} phase={game.phase} intro={intro?.id} effects={game.effects} onSelectEscort={selectEscort} selectedEscort={game.targetEscort} registerEscortRef={registerEscortRef} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   {intro?<div className="battle-intro">
    <div className="battle-intro-status" role="status">{intro.label}
     {intro.id==='arm'&&game.enemy.bossNumericDeck?
      ' · BOSS '+(numericBossDeck(game.enemy.bossNumericDeck.id)?.name||'') :''}</div>
    <div className="battle-intro-actions">
     {!reducedIntro&&<button type="button" className="es-button" onClick={()=>setReducedIntro(true)}>Riduci movimento</button>}
     <button type="button" className="es-button primary" onClick={finishIntro}>Salta intro</button>
    </div>
   </div>:(game.vitalPrototype?<MotherDefenseControls defense={game.enemy.fleet[0].defense} selected={game.targetVital} selectedEscort={game.targetEscort} onChoose={selectVitalPart} onChooseMother={selectMother}/>:<div className="center-bar"><span className="round-tag">COLPI {game.round-1}</span><MemoryCombos ship={game.player}/><div className="timer-pill"><strong>CONTINUO</strong></div></div>)}
   <Ship side="player" ship={game.player} targets={null} focused={game.shownPlayer} onSelectShip={i=>write({...gameRef.current,shownPlayer:i})} phase="idle" intro={intro?.id} effects={game.effects} registerEscortRef={registerEscortRef} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   <div className="deck left deck-special" aria-label="Mazzo delle carte speciali">
    <div className="deck-graphic">✧</div><small>SPECIALI</small><strong>{game.player.specialDeck?.length||0}</strong>
   </div>
   <div className="deck left deck-number" aria-label="Mazzo delle carte numeriche">
    <div className="deck-graphic">✦</div><small>NUMERI</small><strong>{game.player.deck.length}</strong>
   </div>
   <div className="deck right" aria-label="Scarti delle carte numeriche">
    <div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{game.player.discard.length}</strong>
   </div>
   <div className="special-board" role="group" aria-label="Le tue cinque carte speciali, indipendenti dalle sette numeriche">
    {[0,1,2,3,4].map(i=>{
     const card=game.player.specialHand?.[i];
     const definition=card?specialCardDefinition(card):null;
     const readiness=card?specialCardReadiness(game.player,i,specialEscortSlot,uiClock):null;
     return <button key={card?.id||'empty-'+i} type="button"
      className={'special-board-card'+(card?' special-'+card.type:' is-empty')}
      data-family={definition?.family||'empty'}
      title={definition?.description||'Slot speciale vuoto'}
      disabled={!!intro||game.phase!=='ready'||!readiness?.ready}
      onClick={()=>playTacticalCard(i)}>
      <span className="special-board-glyph" aria-hidden="true">{definition?.family==='fusion'?'◆':
       definition?.family==='defense'?'⬡':definition?.family==='volley'?'✦':
       definition?.family==='support'?'✚':'✧'}</span>
      <strong>{definition?.short||'VUOTO'}</strong>
      <small>{'S'+(i+1)}</small>
     </button>;
    })}
    <button type="button" className="special-board-info" aria-expanded={showSpecialDetails}
      aria-label="Informazioni sulle cinque carte speciali"
      onClick={()=>setShowSpecialDetails(v=>!v)}>{showSpecialDetails?'×':'i'}</button>
    {showSpecialDetails&&<div className="special-board-explain" role="region" aria-label="Descrizione delle carte speciali">
     <b>CARTE SPECIALI IN MANO</b>
     {(game.player.specialHand||[]).map((card,i)=>{
      const info=specialCardDefinition(card);
      return <p key={card.id}><strong>{i+1}. {info?.short||card.type}</strong>
       <span>{info?.description||'Descrizione non disponibile'}</span></p>;
     })}
    </div>}
   </div>
   <Hand cards={game.player.hand} selected={game.selected} onSelect={pick} disabled={game.phase!=='ready'||game.actor!=='player'}/>
   <div className="play-controls">{!intro&&<Formula game={game}/>}<button className="es-button attack" onClick={attack} disabled={game.phase!=='ready'}>ATTACCA ➤</button></div>
   <div className="utility-bar"><button onClick={()=>change(false)} disabled={game.phase!=='ready'}>CAMBIA <b>{game.player.sacrifices}/3</b></button><button onClick={()=>change(true)} disabled={game.phase!=='ready'||!game.player.ether}>ETERE <b>{game.player.ether}</b></button><button onClick={openFleet} disabled={!!intro}>FLOTTA ⚙</button>
    <button onClick={()=>setManeuverMenu(value=>!value)} disabled={game.phase!=='ready'||!maneuverHUD}>MANOVRE {maneuverHUD?maneuverHUD.sync+'%':''}</button></div>
   {maneuverMenu&&maneuverHUD&&game.phase==='ready'&&<div className="maneuver-panel">
     <header><b>MANOVRE DI FLOTTA</b><button onClick={()=>setManeuverMenu(false)}>CHIUDI</button></header>
     {game.vitalPrototype&&!intro&&<label className="maneuver-weapon-focus" aria-label="Seleziona arma da caricare">
    <span>ARMA</span>
    <select value={maneuverArmaments.some(gun=>gun.id===game.weaponFocus)?game.weaponFocus:'auto'}
      onChange={event=>write({...gameRef.current,weaponFocus:event.target.value})}>
     <option value="auto">AUTOMATICA · una sola arma per carta</option>
     {maneuverArmaments.map(gun=><option key={gun.id} value={gun.id}>
      {gun.kind==='escort'?'SCUDIERA '+(gun.slot+1):'MADRE'} · {gun.name} ({gun.suits.map(suit=>WEAPON_SIGNS[suit]||suit).join(' ')})
     </option>)}
    </select>
     </label>}
     <div className="maneuver-sync"><span>SINCRONIA {maneuverHUD.sync}/100</span><div><i style={{width:maneuverHUD.sync+'%'}}/></div></div>
     <p>FORMAZIONE</p>
     <div className="maneuver-options">
       <button className={maneuverHUD.formation==='balanced'?'active':''} onClick={()=>orderManeuver('balanced')}>EQUILIBRATA</button>
       <button className={maneuverHUD.formation==='guard'?'active':''} onClick={()=>orderManeuver('guard')}>GUARDIA</button>
       <button className={maneuverHUD.formation==='assault'?'active':''} onClick={()=>orderManeuver('assault')}>ASSALTO</button>
     </div>
     <div className="maneuver-options">
      <button type="button" onClick={recoverNumericHand}
       disabled={uiClock<(game.player.recoveryReadyAt||0)}>
       RICAMBIO NUMERICO{uiClock<(game.player.recoveryReadyAt||0)?
        ' · '+Math.ceil((game.player.recoveryReadyAt-uiClock)/1000)+'s':''}
      </button>
     </div>
     <small>Disponibile solo se nessun calcolo o firma attaccabile è realizzabile: cambia una carta vera, senza crearne.</small>
     <p>MAZZO SPECIALE · MANO {game.player.specialHand?.length||0}/5</p>
     {armedEffects.length>0&&<strong className="strategic-armed-status">{shotCombinationName(armedEffects)?'COMBO PRONTA: '+shotCombinationName(armedEffects):
 'COLPO PRONTO '+armedEffects.length+'/2: '+armedEffects.map(id=>STRATEGIC_EFFECT_LABELS[id]).join(' + ')}</strong>}
     {maneuverHUD.cover&&<strong className="tactical-cover-status">COPERTURA PRONTA · {Math.ceil(maneuverHUD.coverRemainingMs/1000)}s · SCUDIERA 1</strong>}
     <div className="special-escort-target" role="group" aria-label="Scudiera bersaglio delle speciali">
      {(game.player.escorts||[]).map((escort,slot)=><button key={escort.id}
       className={specialEscortSlot===slot?'active':''}
       disabled={!!escort.defense?.destroyed}
       onClick={()=>setSpecialEscortSlot(slot)}>SCUDIERA {slot+1}</button>)}
     </div>
     <small>Fusioni: carta + 100 Sincronia. Copertura: scudiera 1 protegge la madre. Puoi combinare 2 diversi colpi speciali per la stessa scarica. Riparazione Scudo, Riparazione Scudiera e Pulizia Sistemi consumano carte vere e funzionano solo quando utili. Seleziona la scudiera da riparare; una scudiera distrutta non può essere rianimata. Mano sempre a 5.</small>
     {maneuverHUD.fusion&&<div className="maneuver-options"><span>{({barrier:'BARRIERA',strike:'ASSALTO',twin:'GEMELLARE',triad:'TRINA'})[maneuverHUD.fusion.mode]||'FUSIONE'} - {Math.ceil(maneuverHUD.fusionRemainingMs/1000)}s</span><button onClick={undock}>SGANCIA</button></div>}
   </div>}
   <div className="player-status"><b title={(game.player.commander?'Comandante '+(commanderAbilityStatus(game.player)?.name||commanderDisplayName||game.player.commander.id)+' L'+game.player.commander.level+(commanderAbilityStatus(game.player)?' · '+commanderAbilityStatus(game.player).description+' +'+commanderAbilityStatus(game.player).value+'% · ':' · '):'Nessun comandante · ')+(game.player.bossNumericDeck?activeNumericBossAbilities(game.player.bossNumericDeck.id,game.player.bossNumericDeck.level).filter(ability=>ability.unlocked).map(ability=>ability.name+' · Grado '+ability.grade+'/3').join(' | '):'Mazzo neutro · nessuna passiva')}>TU{game.player.bossNumericDeck?' · '+numericBossDeck(game.player.bossNumericDeck.id)?.name+' L'+game.player.bossNumericDeck.level:''}{game.player.commander?' · CMD L'+game.player.commander.level:''}</b><span className="my-hp">{game.vitalPrototype?`SCUDO ${game.player.fleet[0].defense.shield.hp}/${game.player.fleet[0].defense.shield.max} · PARTI ${VITAL_IDS.filter(id=>game.player.fleet[0].defense.parts[id].hp>0).length}/4`:`FLOTTA ${Math.round(healthScore(game.player)*100)}%`}</span><Pips ship={game.player}/><small>{playerSystemAlerts?playerSystemAlerts+' · ':''}{ownStrategicStatus.ionizedUntil?'IONIZZATA · ':''}{ownStrategicStatus.corrodedUntil?'SCUDO CORROSO · ':''}{message||game.notice}</small></div>
   {game.effects?.map(effect=><Projectile key={effect.id} effect={effect} rootRef={rootRef} engineRefs={engineRefs} gunRefs={gunRefs} escortRefs={escortRefs}/>)}
   {game.phase==='finished'&&<div className="modal-shade"><div className="result-card" data-outcome={game.winner}><div className="battle-result-emblem" aria-hidden="true">
    {game.winner==='player'?'✦':game.winner==='draw'?'◇':'✕'}</div><h1>{game.winner==='player'?'VITTORIA':game.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{game.reason}</p><div className="result-score"><span>TUA FLOTTA <b>{Math.round(healthScore(game.player)*100)}%</b></span><span>AVVERSARIO <b>{Math.round(healthScore(game.enemy)*100)}%</b></span></div><button className="es-button primary" onClick={exitBattle}>CONFERMA E TORNA</button></div></div>}
   {help&&<div className="modal-shade"><div className="help-card"><h2>REGOLE DEL DUELLO</h2>
    <h3>CONDIZIONI ARENA: {game.arena?.name||'Piattaforma di Titanio'}</h3>
    {(()=>{const briefing=arenaTacticalBriefing(game.arena?.id,{
      player:game.player,enemy:game.enemy,round:game.round,selectedCount:game.selected?.length
     });return <><p>{briefing.introduction}</p>{briefing.conditions.map(condition=>
      <p key={condition.id}><strong>{condition.label}.</strong> {condition.activation} <em>{condition.strategy}</em>{condition.status?' '+condition.status:''}</p>
     )}</>})()}<p>{game.vitalPrototype?'DUELLO MADRE 1 CONTRO 1: lo scudo protegge quattro parti vitali. A 75%, 50%, 25% e 0% puoi scegliere una parte da esporre; un calcolo valido la danneggia. Vinci quando tutte e quattro le parti nemiche arrivano a zero HP. Le firme definitive di ogni navicella sono ancora da progettare. Le scudiere ai lati della madre si sbloccano a L3 e L5, hanno scudi propri e possono intercettare i colpi. La formula finale è temporanea; le immagini delle scudiere sono nella cartella delle risorse.':'FLOTTE MULTIPLE (versione precedente): ogni nave monta le operazioni disponibili con i relativi HP. Le scudiere collegate alla madre saranno aggiunte successivamente.'}</p><p>MAZZI SEPARATI: sette carte numeriche per i calcoli e cinque speciali nella mano tattica. Copertura Tattica usa una speciale e, per il prossimo impatto entro 15 secondi, assorbe fino al 75% del colpo sfruttando lo scudo reale della prima scudiera; non crea HP. Dal pulsante MANOVRE scegli una scudiera e gioca una carta Fusione Barriera o Fusione Assalto: la Sincronia 100 è necessaria, ma non attiva la fusione da sola. Ogni speciale giocata viene rimpiazzata immediatamente. La scudiera agganciata non può sparare autonomamente.</p><p>Il combattimento è continuo: il giocatore non ha turni né timer e può attaccare quando ha una combinazione pronta, anche mentre altri proiettili sono in volo. L’IA decide inizialmente ogni 35–40 secondi e diventa progressivamente più veloce nei settori alti della campagna. I bersagli numerici restano fissi fino alla fine della partita. Puoi selezionare due oppure tre carte numeriche: con tre carte si applica la stessa operazione due volte in sequenza, con risultati intermedi interi positivi. Alcuni modelli consentono anche COPPIA o TRIS come firma alternativa dei vitali esposti: non servono poteri aggiuntivi dei semi. Ogni vitale ha una firma matematica di prova assegnata all’inizio della battaglia e mostrata sul bersaglio; i requisiti Poker definitivi rimangono da bilanciare. Le quattro parti vitali hanno HP localizzati: quando scendono al 50% o meno entrano in AVARIA con penalità reali, a zero diventano KO. Motore, armi, generatore scudi e centralina hanno effetti differenti; la distruzione del generatore azzera lo scudo. Tocca una nave nemica, scegli uno dei suoi motori e seleziona due carte. A=1, J=11, Q=12, K=13; la sottrazione e la divisione possono invertire le carte, ma la divisione deve essere esatta. Il risultato esatto fa scattare tutte le armi della flotta attivate dai semi delle carte.</p><p>I VALORI delle carte sono proiettili: 8♣ × 3♦ = 24 significa 8 proiettili ♣ e 3 ♦; il 24 sblocca il tiro, non è il danno. L'arma determina il danno per proiettile. Alcune armi accumulano munizioni. Le combo simultanee richiedono entrambi i semi indicati nella stessa coppia di carte.</p><p>Le combo a memoria raccolgono i semi degli ultimi 3 o 4 calcoli corretti. Quando trovi tutti i semi richiesti, l’arma spara le munizioni del proprio seme raccolte nella finestra. Dopo lo sparo o un calcolo errato la memoria dell’arma si svuota.</p><p>La nave universale spara con qualsiasi seme ma ha poca potenza. Il primo cambio carta dà +3 HP al nemico, il secondo ha una penalità ancora da definire per il combattimento senza turni e il terzo −3 HP a te. Il numero di carte e il limite del mazzo sono provvisori. A mazzo esaurito prevale l'integrità percentuale della flotta.</p><p>⚙ FLOTTA schiera le carte possedute.</p><button className="es-button primary" onClick={()=>setHelp(false)}>CHIUDI</button></div></div>}
   {fleetMenu&&<FleetSetup collection={collection} onEquip={saveLoadout} onClose={()=>setFleetMenu(false)}/>}
  </div>
 </div>;
}
