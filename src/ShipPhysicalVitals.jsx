import React,{useId} from 'react';
import {ShipArtwork} from './ShipPresentation.jsx';
import {engineSurface,weaponMount} from './mathFleetGeometry.js';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';

// Same raster-hull masking technique used by the recovery-era BossBattle3D.
// The four gameplay vitals are no longer detached HUD blocks.
export function physicalVitalCondition(part){
 if(part.hp<=0)return 'destroyed';
 const ratio=part.max>0?part.hp/part.max:0;
 return ratio<=.3?'critical':ratio<=.65?'damaged':'intact';
}
export function physicalVitalSurfaces(side,vessel,id){
 if(id==='engine')return ['plus','minus'].map(op=>engineSurface(side,vessel.id,op));
 if(id==='weapons'){
  const mounts=vessel.weapons.map(w=>weaponMount(side,vessel.id,w.id)).filter(Boolean).slice(0,2);
  return mounts.length?mounts.map(m=>({point:m.point,radius:[.051,.056]})):
   [engineSurface(side,vessel.id,'minus')];
 }
 if(id==='shieldGenerator')return [engineSurface(side,vessel.id,'times')];
 // The bridge sits on the central hull; its system is separate from engine exhaust.
 return [{point:[.5,side==='enemy'?.48:.52],radius:[.064,.069]}];
}
function DamageArea({surface,fill}){
 const [x,y]=surface.point.map(v=>v*1000),[rx,ry]=surface.radius.map(v=>v*1000);
 const tail=surface.exhaustY;
 const points=tail==null?null:[
  [x-rx*.65,y],[x+rx*.65,y],[x+rx*.25,tail*1000],[x-rx*.25,tail*1000]
 ].map(pair=>pair.join(',')).join(' ');
 return <g fill={fill}><ellipse cx={x} cy={y} rx={rx} ry={ry}/>
  {points&&<polygon points={points}/>}</g>;
}
export default function ShipPhysicalVitals({
 side,vessel,defense,hullRef,selectedVital,onSelectVital,canTarget=false,
 knownVitals=[],impactedVitals=[]
}){
 const uid=useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const parts=VITAL_IDS.map(id=>({
  id,part:defense.parts[id],surfaces:physicalVitalSurfaces(side,vessel,id)
 }));
 const damaged=parts.filter(p=>physicalVitalCondition(p.part)!=='intact');
 return <svg ref={hullRef} className="fleet-ship-img official-physical-hull"
  viewBox="0 0 1000 1000" role="img"
  aria-label={vessel.name+' · componenti fisici della nave'}>
  <defs>
   <mask id={'hull-healthy-'+uid} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
    <rect width="1000" height="1000" fill="white"/>
    {damaged.flatMap(p=>p.surfaces.map((surface,i)=>
     <DamageArea key={p.id+'-'+i} surface={surface} fill="black"/>))}
   </mask>
   {damaged.map(p=><React.Fragment key={p.id}>
    <clipPath id={'hull-part-'+uid+'-'+p.id}>
     {p.surfaces.map((surface,i)=><DamageArea key={i} surface={surface}/>)}
    </clipPath>
    <filter id={'hull-burn-'+uid+'-'+p.id} colorInterpolationFilters="sRGB">
     <feColorMatrix type="saturate" values={physicalVitalCondition(p.part)==='destroyed'?.05:.42}/>
     <feComponentTransfer>
      {['R','G','B'].map(channel=>React.createElement('feFunc'+channel,{
       key:channel,type:'linear',slope:physicalVitalCondition(p.part)==='destroyed'?.22:
        physicalVitalCondition(p.part)==='critical'?.42:.68
      }))}
     </feComponentTransfer>
    </filter>
   </React.Fragment>)}
  </defs>
  {/* Original illustrated hull remains intact outside the damaged components. */}
  <ShipArtwork side={side} vessel={vessel}
   mask={damaged.length?'url(#hull-healthy-'+uid+')':undefined}/>
  {damaged.map(p=><g key={p.id}
   clipPath={'url(#hull-part-'+uid+'-'+p.id+')'}
   filter={'url(#hull-burn-'+uid+'-'+p.id+')'}>
   <ShipArtwork side={side} vessel={vessel}/>
  </g>)}
  {parts.map(({id,part,surfaces})=>{
   const condition=physicalVitalCondition(part),selected=side==='enemy'&&selectedVital===id&&part.hp>0;
   const enabled=side==='enemy'&&canTarget&&part.hp>0;
   const recent=impactedVitals.includes(id),known=part.exposed||knownVitals.includes(id);
   return <g key={id} data-vital-id={id} data-condition={condition}
    className={'official-hull-part'+(selected?' chosen':'')+(recent?' recently-hit':'')+
     (recent&&part.hp<=0?' just-destroyed':'')+(known?' exposed':' protected')}
    role={enabled?'button':undefined} tabIndex={enabled?0:undefined}
    aria-label={enabled?VITAL_LABELS[id]+' · '+part.hp+' HP · '+(part.exposed?'esposto':'protetto'):undefined}
    aria-pressed={enabled?selected:undefined}
    onClick={enabled?()=>onSelectVital?.(id):undefined}
    onKeyDown={enabled?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelectVital?.(id);}}:undefined}>
    <title>{VITAL_LABELS[id]+': '+part.hp+'/'+part.max+' HP · '+
     (part.hp<=0?'DISTRUTTO':part.exposed?'ESPOSTO':'PROTETTO')}</title>
    {surfaces.map((surface,i)=>{
     const [x,y]=surface.point.map(n=>n*1000),[rx,ry]=surface.radius.map(n=>n*1000);
     return <g key={i} transform={'translate('+x+' '+y+')'}>
      <ellipse className="official-hull-part-core" rx={rx*.6} ry={ry*.6}/>
      <ellipse className="official-hull-part-ring" rx={rx*.72} ry={ry*.72}/>
      {condition!=='intact'&&<path className="official-hull-crack"
       d={'M'+(-rx*.48)+' '+(-ry*.3)+' L'+(-rx*.10)+' '+(-ry*.08)+
        ' L'+(-rx*.24)+' '+(ry*.34)+' L'+(rx*.2)+' '+(ry*.08)+' L'+(rx*.48)+' '+(ry*.36)}/>}
      {condition==='destroyed'&&<>
       <ellipse className="official-hull-wreck" rx={rx*.44} ry={ry*.43}/>
       <circle className="official-hull-smoke" r={Math.max(rx,ry)*.65}/>
      </>}
      {recent&&<circle className="official-hull-impact" r={Math.max(rx,ry)*.85}/>}
      <ellipse className="official-hull-hit-zone" rx={Math.max(rx*.95,55)} ry={Math.max(ry*.95,55)}/>
     </g>;
    })}
   </g>;
  })}
 </svg>;
}
