import React from 'react';
import {thermalChargeForShot} from './metalWeaponBattleVisuals.js';

export default function MetalWeaponShotAccents({shot,profile,start,to,gradientId}){
 const thermal=profile.kind==='thermal-reclaimer',tier=profile.tier;
 const charge=thermalChargeForShot(shot),edge=shot.who==='A'?790:10;
 const inside=shot.who==='A'?-1:1,hit=start+profile.flightMs;
 const amount=.45+charge.ratio*.55;
 return <g data-effect-sequence={profile.sequence} data-recovered-bonus={charge.extra}>
  <g transform={'translate(225 '+edge+')'}>
   <g className="metal-weapon-charge" style={{'--metal-charge-delay':start-profile.chargeMs+'ms',
    '--metal-charge-ms':profile.chargeMs+'ms'}}>
    {thermal?<>
     {[0,1,2].map(i=>{
      const x=(i-1)*44,y=inside*(i===1?62:37);
      return <path key={i} d={'M'+x+' '+y+' Q'+(x*.6)+' '+(inside*12)+' 0 0'}
       fill="none" stroke={i%2?profile.secondary:profile.glow} strokeWidth={1.5+charge.ratio*1.5}
       className="metal-collector-flow" style={{'--collector-phase':i*55+'ms'}}/>;
     })}
     <ellipse rx={14+charge.ratio*7} ry="7" fill={profile.core} opacity={amount}/>
     {tier===3&&[0,1,2].map(i=><path key={i}
      d={'M'+(-26+i*18)+' '+(inside*4)+' l8 '+(inside*18)+' l8 '+(-inside*18)}
      fill="none" stroke={i%2?'#dfb6ff':'#adf1ff'} strokeWidth="1.2"/>)}
    </>:<>
     <path d={'M-13 '+(inside*28)+' L-7 0 M13 '+(inside*28)+' L7 0'}
      fill="none" stroke={profile.secondary} strokeWidth="2"/>
     {tier>=1&&<path d={'M-24 '+(inside*18)+' Q0 '+(-inside*8)+' 24 '+(inside*18)}
      fill="none" stroke={profile.glow} strokeWidth="1.1"/>}
     {tier>=2&&<ellipse rx="27" ry="8" fill="none" stroke={profile.core} strokeWidth="1.4"/>}
     {tier===3&&<path d="M-36 0 L0-12 L36 0 L0 12 Z" fill="none" stroke="#b9e8ff"/>}
    </>}
   </g>
   <g className={'metal-muzzle metal-muzzle--'+(thermal?'thermal':'rail')}
    style={{'--maglio-flight-delay':start+'ms'}}>
    <ellipse rx={thermal?23:16} ry={thermal?9:5} fill={profile.core}/>
    <path d={'M-22 '+(inside*5)+' L0 '+(inside*(thermal?32:22))+' L22 '+(inside*5)}
     fill="none" stroke={profile.glow} strokeWidth={thermal?3:1.6}/>
   </g>
  </g>
  <g transform={'translate('+to.x+' '+to.y+') scale('+profile.impactScale+')'}>
   <g className={'metal-weapon-impact '+(thermal?'metal-thermal-impact':'metal-rail-impact')}
    style={{'--maglio-impact-delay':hit+'ms'}}>
    <ellipse rx={thermal?42:28+tier*3} ry={thermal?29:18+tier*2} fill={'url(#'+gradientId+')'}/>
    {thermal?<>
     {[0,1,2].map(i=><path key={i} className="metal-impact-petal"
      transform={'rotate('+i*120+')'} d="M0 0 C-26-10-29-28-10-34 C5-37 17-15 0 0 Z"
      fill="none" stroke={i%2?profile.secondary:profile.core} strokeWidth={1.5+charge.ratio}
      style={{'--petal-delay':hit+i*(tier===3?80:45)+'ms'}}/>)}
     <ellipse className="metal-heat-lens" rx={25+charge.ratio*10} ry="14"
      fill="none" stroke={profile.glow} strokeWidth="3"/>
     {tier===3&&[0,1,2].map(i=><path key={i} className="metal-prism-fracture"
      transform={'rotate('+i*120+')'} d="M0-13 L10-27 L0-40 L-10-27 Z"
      fill="none" stroke={i%2?'#e3baff':'#aeefff'} strokeWidth="1.3"/>)}
    </>:<>
     <path d="M-5 9 L1-10 L8-19 M-13-2 L3 1 L16-6" fill="none" stroke={profile.core} strokeWidth="2.1"/>
     {Array.from({length:4+tier*2},(_,i)=>{
      const a=i*Math.PI*2/(4+tier*2),x=Math.cos(a),y=Math.sin(a)*.7;
      return <path key={i} className="metal-steel-fragment"
       d={'M'+x*12+' '+y*12+' l'+x*(11+tier*3)+' '+y*(11+tier*3)}
       stroke={i%2?profile.secondary:profile.glow} strokeWidth={i%3===0?2.1:1.1}/>;
     })}
     {tier>=1&&<ellipse className="metal-impact-collar" rx="27" ry="14" fill="none" stroke={profile.secondary}/>} 
     {tier>=2&&[0,1].map(i=><ellipse key={i} className="metal-impact-petal"
      rx={30+i*8} ry={16+i*4} fill="none" stroke={i?profile.glow:profile.core}
      style={{'--petal-delay':hit+100+i*95+'ms'}}/>)}
     {tier===3&&[0,1,2].map(i=><path key={i} className="metal-prism-fracture"
      transform={'rotate('+i*120+')'} d="M0-14 L7-29 L0-36 L-7-29 Z"
      fill="none" stroke={i%2?'#e9c7ff':'#bbf6ff'} strokeWidth="1.4"/>)}
    </>}
   </g>
  </g>
 </g>;
}
