import integratedFronts from './fleetNext/approvedWeaponIntegration.json';
import React,{useId} from 'react';
import {approvedWeaponSalvo} from './fleetNext/approvedWeaponSalvos.js';
import './WeaponSalvoCardMarks.css';
import CardTextLayer from './CardTextLayer.jsx';
import {hasCardTextLayer} from './cardTextPresentation.js';

const integratedIds=new Set(integratedFronts.cards.map(c=>c.id));
const slugs=['comune','rara','epica','leggendaria'];
const colors=[['#e5edf1','#a9b9c4','#d0dce2'],['#fff0d6','#d38c5b','#f3c393'],
 ['#ffffff','#8799a9','#e4edf4'],['#ffffff','#74dafa','#d99ff3']];
// Clean pixels copied from the original HD frame, plus scalable text from
// the same live catalog. Approved art, frame and symbols remain intact.
export default function WeaponSalvoCardMarks({cardId,className='',style}){
 const unique=useId().replace(/[^a-zA-Z0-9]/g,''),p=approvedWeaponSalvo(cardId);
 if(hasCardTextLayer(cardId))return <CardTextLayer cardId={cardId} className={className} style={style}/>;
 if(!p||p.count<=1||integratedIds.has(cardId))return null;
 const c=colors[p.tier],matte='/assets/fleet-card-marks/salvo-'+slugs[p.tier]+'.png',gradient='salvo-material-'+unique;
 return <svg className={'weapon-salvo-marks '+className} style={style}
  viewBox="0 0 3072 4608" preserveAspectRatio="none" aria-hidden="true" focusable="false"
  data-salvo-card={cardId} data-salvo-count={p.count}>
  <defs><linearGradient id={gradient} x1="0" y1="0" x2="0.35" y2="1">
   <stop stopColor={c[0]}/><stop offset=".52" stopColor={c[1]}/><stop offset="1" stopColor={c[2]}/>
  </linearGradient></defs>
  <svg x="640" y="3488" width="800" height="130" viewBox="0 0 800 130" overflow="hidden">
   <image href={matte} width="1440" height="170"/>
  </svg>
  <svg x="1850" y="3850" width="640" height="170" viewBox="800 0 640 170" overflow="hidden">
   <image href={matte} width="1440" height="170"/>
  </svg>
  <g fill={'url(#'+gradient+')'} stroke="#121a23" strokeWidth="7" paintOrder="stroke fill"
   textAnchor="middle" dominantBaseline="middle" fontFamily="Eclissi Vettore, sans-serif">
   <text x="1042" y="3547" fontSize="78" letterSpacing="3">TOTAL DAMAGE</text>
   <text x="2140" y="3933" fontSize="106" fontWeight="600" letterSpacing="1" strokeWidth="9">
    {p.style==='six-plus-lance'?'6 + 1':p.count+' SHOTS'}
   </text>
  </g>
 </svg>;
}
