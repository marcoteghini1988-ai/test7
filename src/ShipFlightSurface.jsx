import React,{useId} from 'react';
import {shipFlightProfile} from './fleetFlightPresentation.js';

export default function ShipFlightSurface({shipId,side,kind='mother',layer='reactors',alive=true}){
 const id='flight-'+useId().replace(/[^a-zA-Z0-9_-]/g,'');
 const profile=shipFlightProfile(shipId,side);
 if(!alive||!profile)return null;
 const ground=layer==='ground';
 return <svg className={'f3d-flight-surface f3d-flight-surface--'+kind+
  (ground?' f3d-flight-ground':' f3d-flight-reactors')}
  viewBox="0 0 1000 1000" aria-hidden="true" focusable="false"
  data-flight-model={shipId} data-flight-layer={layer} data-flight-side={side}>
  <defs>
   <radialGradient id={id+'-shadow'}><stop stopColor="#00030a" stopOpacity=".85"/>
    <stop offset=".6" stopColor="#00040b" stopOpacity=".58"/>
    <stop offset="1" stopColor="#00040b" stopOpacity="0"/></radialGradient>
   <radialGradient id={id+'-spill'}><stop stopColor={profile.color} stopOpacity=".45"/>
    <stop offset=".45" stopColor={profile.color} stopOpacity=".18"/>
    <stop offset="1" stopColor={profile.color} stopOpacity="0"/></radialGradient>
   <linearGradient id={id+'-plume'} x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#f1ffff" stopOpacity=".82"/>
    <stop offset=".23" stopColor={profile.color} stopOpacity=".78"/>
    <stop offset=".7" stopColor={profile.color} stopOpacity=".38"/>
    <stop offset="1" stopColor={profile.color} stopOpacity="0"/>
   </linearGradient>
   <linearGradient id={id+'-core'} x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#ffffff" stopOpacity=".94"/>
    <stop offset=".45" stopColor="#e8ffff" stopOpacity=".7"/>
    <stop offset="1" stopColor={profile.color} stopOpacity="0"/>
   </linearGradient>
   <clipPath id={id+'-jet'}><path d="M-30 0C-31 45-14 110 0 180C14 110 31 45 30 0Z"/></clipPath>
  </defs>
  {ground?<>
   <ellipse className="f3d-flight-floor-shadow" cx="500" cy="625" rx="365" ry="78" fill={'url(#'+id+'-shadow)'}/>
   {profile.ports.map((port,index)=><ellipse key={index} className="f3d-flight-floor-light"
    cx={port.x*1000} cy={Math.min(.94,port.y+.12)*1000} rx="100" ry="38"
    fill={'url(#'+id+'-spill)'} style={{'--reactor-phase':(-index*.19)+'s'}}/>)}
  </>:profile.ports.map((port,index)=><g key={index}
   data-reactor-port={index} data-exhaust-direction={port.direction}
   transform={'translate('+port.x*1000+' '+port.y*1000+') scale('+port.width*1000/60+' '+port.direction*port.length*1000/180+')'}>
   <g className="f3d-reactor-plume" style={{'--reactor-phase':(-index*.23-(side==='enemy'?.17:0))+'s',
    '--reactor-color':profile.color}}>
    <path d="M-30 0C-31 45-14 110 0 180C14 110 31 45 30 0Z" fill={'url(#'+id+'-plume)'}/>
    <path d="M-13 0C-13 35-6 87 0 136C6 87 13 35 13 0Z" fill={'url(#'+id+'-core)'}/>
    <g clipPath={'url(#'+id+'-jet)'}>
     <path className="f3d-reactor-flow" d="M-6 4C3 44-4 96 0 172"
      fill="none" stroke="#eeffff" strokeWidth="6" strokeDasharray="11 34" strokeLinecap="round"/>
     <path className="f3d-reactor-flow f3d-reactor-flow--secondary" d="M10 3C-3 47 5 91 0 166"
      fill="none" stroke={profile.color} strokeWidth="5" strokeDasharray="8 24" strokeLinecap="round"/>
    </g>
   </g>
  </g>)}
 </svg>;
}
