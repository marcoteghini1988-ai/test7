// Renderer fisico delle navi usato dalla battaglia attuale.
import React,{useId,useState} from 'react';
import {META} from './fleetNext/shipCore.js';
import {enginePoint,engineHudShift,engineHudPlacement,engineVisualState,engineSurface} from './mathFleetGeometry.js';
import {SHIP_GLOW,ShipArtwork} from './ShipPresentation.jsx';

function EngineArea({surface,fill}){
 const [x,y]=surface.point.map(n=>n*1000),[rx,ry]=surface.radius.map(n=>n*1000);
 return <g fill={fill}><ellipse cx={x} cy={y} rx={rx} ry={ry}/>
  {surface.exhaustY!=null&&<polygon points={`${x-rx*.65},${y} ${x+rx*.65},${y} ${x+rx*.25},${surface.exhaustY*1000} ${x-rx*.25},${surface.exhaustY*1000}`}/>}</g>;
}
export function ShipSkin({side,vessel,imageRef}){
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
export function Engine({side,op,vessel,target,selected,onSelect,enabled,hit,available,engineRef,formation,impactDelay,mathMode=false,vitalLabel=null,vitalName=null}){
 const engine=vessel.engines[op];if(!engine)return null;
 const dead=engine.hp<=0,ratio=Math.max(0,engine.hp/engine.max);
 const state=engineVisualState(engine),surface=engineSurface(side,vessel.id,op),aux=op==='times'||op==='divide';
 const [px,py]=enginePoint(side,vessel.id,op);
 const narrow=false; // Nessuna madre ufficiale richiede la correzione della variante esclusa.
 return <button type="button" style={{left:`${px*100}%`,top:`${py*100}%`,
  '--hud-shift':`${engineHudShift(side,vessel.id,op,formation.size,formation.hudWidth)}px`,'--hit-delay':`${impactDelay||0}ms`,
  '--core-width':`${surface.radius[0]*2*formation.size}px`,'--core-height':`${surface.radius[1]*2*formation.size}px`,'--engine-color':SHIP_GLOW[vessel.id]||'#5edbff',
  ...(narrow?{'--engine-width':`${Math.min(24,formation.size*.11-2)}px`}:{})}}
  className={`vessel-engine ve-${op} ve-${side} hud-${engineHudPlacement(side,vessel.id,op)}${aux?' auxiliary-engine':''}${selected&&!dead?' selected':''}${dead?' dead':''}${hit?' hit':''}`}
  disabled={!enabled||dead||!available} data-state={state} onClick={()=>onSelect?.(op)}
  aria-pressed={!!selected}
  aria-label={vitalName?`${side==='enemy'?'Nemico':'Tu'}: ${vessel.name}, ${vitalName}, ${engine.hp} di ${engine.max} HP`:(mathMode?`Operazione ${META[op].name}, bersaglio ${target??'non disponibile'}`:`${side==='enemy'?'Nemico':'Tu'}: ${vessel.name}, motore ${META[op].name}, ${engine.hp} di ${engine.max} HP, bersaglio ${target??'non disponibile'}`)}>
  <span ref={engineRef} className="engine-anchor" aria-hidden="true"/>
  <span className="engine-core" aria-hidden="true"><i className="engine-iris"/><svg className="engine-fracture" viewBox="0 0 100 100"><path d="M13 23 42 40 30 62 63 54 87 82M61 12 52 38 73 27M32 65 24 86"/></svg></span>
  <span className="vessel-engine-hud">
   <strong>{dead?'✕':vitalLabel|| (enabled&&target!=null?`${META[op].sign}${target}`:META[op].sign)}</strong>
   <small>{vitalName?(dead?'KO':`${engine.hp} HP`):mathMode?'CALC':dead?'KO':`${engine.hp} HP`}</small>
   {!mathMode&&<i className="vessel-engine-meter"><em style={{width:`${ratio*100}%`}}/></i>}
  </span>
  {dead&&<span className="vessel-smoke"/>}
 </button>;
}
