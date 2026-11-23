import React,{useLayoutEffect,useRef,useState} from 'react';
import {card,cardFacePath,cardRole} from './fleetNext/rules.js';
import {projectFleetSlots,projectMachineBerths} from './fleetNext/battlePresentation.js';
import {maglioHammerCount,maglioVariant} from './maglioBattleVisuals.js';
import './MaglioBattleEffects.css';

const point=(rect,board)=>({
 x:((rect.left+rect.width/2)-board.left)*450/board.width,
 y:((rect.top+rect.height/2)-board.top)*800/board.height
});

function targetForShot(root,shot){
 const fleet=root.querySelector(`[data-fleet-side="${shot.who==='A'?'B':'A'}"]`);
 if(shot.targetKind==='part')return fleet?.querySelector('.official-mother');
 return [...(fleet?.querySelectorAll('[data-combat-id]')||[])].find(el=>
  el.dataset.combatId===shot.targetId&&el.dataset.combatKind===shot.targetKind);
}

function placementTarget(root,side,ply,cardIds,id){
 const definition=card(id);
 if(definition?.effectSpec?.type==='deployMachine'){
  const berth=projectMachineBerths(side,cardIds,ply).findIndex(entry=>!entry);
  return root.querySelector(`[data-fleet-weapon-slot="${Math.max(0,berth)}"]`);
 }
 const current=projectFleetSlots(side,cardIds,'A');
 const next=projectFleetSlots(side,[...cardIds,id],'A');
 let index=next.findIndex((entry,i)=>entry?.id===id&&entry?.pending&&!current[i]);
 if(index<0){
  const role=cardRole(id);
  index=definition?.effectSpec?.type==='energy'?5:role==='character'?0:
   role==='defense'?(definition?.effectSpec?.type==='trap'?2:1):4;
 }
 return root.querySelector(`[data-fleet-card-slot="A-${index}"]`);
}

// Le tre carte percorrono la distanza reale fra mano e slot della plancia.
function measurePlacements(root,selectedCards,playerSide,ply,board){
 if(!playerSide)return [];
 const already=[];
 return selectedCards.flatMap((entry,index)=>{
  const source=root.querySelector(`[data-fleet-hand-index="${entry.index}"]`);
  const target=placementTarget(root,playerSide,ply,already,entry.id);
  already.push(entry.id);
  if(!source||!target)return [];
  const a=point(source.getBoundingClientRect(),board);
  const b=point(target.getBoundingClientRect(),board);
  return [{...entry,index,from:a,to:b,art:cardFacePath(entry.id,entry.grade)}];
 });
}

const visualCards=(shots,selectedCards)=>{
 const cards=[...selectedCards];
 for(const shot of shots){
  if(cards.some(c=>c.id===shot.cardId))continue;
  cards.push({id:shot.cardId,grade:1});
 }
 return cards.filter(c=>cardFacePath(c.id,c.grade));
};

export default function MaglioBattleEffects({shots=[],selectedCards=[],playerSide,ply,nonce}){
 const ref=useRef(null),[paths,setPaths]=useState([]),[placements,setPlacements]=useState([]);
 const reveals=visualCards(shots,selectedCards);
 const shotStart=980+reveals.length*520;
 useLayoutEffect(()=>{
  const root=ref.current?.closest('.f3d-approved-layout');
  if(!root)return;
  const hitTargets=new Set();
  const measure=()=>{
   const board=root.getBoundingClientRect();
   if(!board.width||!board.height)return;
   setPlacements(measurePlacements(root,selectedCards,playerSide,ply,board));
   setPaths(shots.filter(s=>s.fires).flatMap(shot=>{
    const target=targetForShot(root,shot);
    if(!target)return [];
    const to=point(target.getBoundingClientRect(),board);
    const from={x:225+(shot.machineSlot===0?-13:13),y:shot.who==='A'?824:-24};
    const count=maglioHammerCount(shot.cardId)||1;
    const start=shotStart+(shot.delayMs||0);
    target.classList.add('f3d-ship-hit');
    target.style.setProperty('--ship-hit-delay',start+(count-1)*82+470+'ms');
    hitTargets.add(target);
    return [{shot,from,to,count,start}];
   }));
  };
  measure();
  const observer=new ResizeObserver(measure);observer.observe(root);
  return ()=>{
   observer.disconnect();
   for(const target of hitTargets){
    target.classList.remove('f3d-ship-hit');
    target.style.removeProperty('--ship-hit-delay');
   }
  };
 },[shots,selectedCards,playerSide,ply,nonce,shotStart]);

 return <div ref={ref} className="maglio-battle-stage" aria-hidden="true"
  data-weapon-effects={paths.length} data-card-flights={placements.length}>
  {placements.map(({id,index,from,to,art})=>art&&<img key={nonce+'-place-'+index}
   className="maglio-card-flight" src={art} alt="" draggable={false}
   style={{left:from.x-29,top:from.y-43,'--card-dx':to.x-from.x+'px',
    '--card-dy':to.y-from.y+'px','--card-delay':index*110+'ms'}}/>)}
  {reveals.map(({id,grade},index)=>{
   const destination=index<selectedCards.length?placements[index]?.to:null;
   return <img key={nonce+'-reveal-'+index+'-'+id}
    className="maglio-card-reveal" src={cardFacePath(id,grade)} alt="" draggable={false}
    style={{'--reveal-delay':650+index*520+'ms',
     '--reveal-x':(destination?.x??225)-225+'px',
     '--reveal-y':(destination?.y??379.5)-379.5+'px'}}/>;
  })}
  <svg className="maglio-battle-effects" viewBox="0 0 450 800" focusable="false">
   <defs>
    <radialGradient id={'maglio-impact-'+nonce}>
     <stop offset="0" stopColor="#fff9dc"/>
     <stop offset=".24" stopColor="#ffe3a4" stopOpacity=".92"/>
     <stop offset=".58" stopColor="#ffab4b" stopOpacity=".4"/>
     <stop offset="1" stopColor="#c15d1d" stopOpacity="0"/>
    </radialGradient>
   </defs>
   {paths.map(({shot,from,to,count,start},index)=>{
    const hammer=!!maglioVariant(shot.cardId);
    const impactDelay=start+(count-1)*82+470;
    return <g key={nonce+'-shot-'+index} className="maglio-shot"
     data-shooter={shot.who} data-target-kind={shot.targetKind}
     data-target-id={shot.targetId} data-actual-damage={shot.actualDamage}
     data-projectiles={count}>
     {Array.from({length:count},(_,i)=>{
      const spread=i-(count-1)/2;
      const fromX=from.x+spread*3,toX=to.x+spread*6;
      const toY=to.y+(i%2?4:-4);
      const angle=Math.atan2(toY-from.y,toX-fromX)*180/Math.PI+90;
      return <g key={i} className="maglio-pulse-travel"
       style={{'--maglio-from-x':fromX+'px','--maglio-from-y':from.y+'px',
        '--maglio-to-x':toX+'px','--maglio-to-y':toY+'px',
        '--maglio-flight-delay':start+i*82+'ms'}}>
       <g transform={'rotate('+angle+')'}>
        {hammer?<>
         <ellipse rx="16" ry="20" fill="#ff9b32" opacity=".18"/>
         <path d="M-3 17L-3-7M3 17L3-7" stroke="#ffd382" strokeWidth="2"/>
         <path d="M-17-17L17-17L17-5L-17-5Z" fill="#3c5362" stroke="#ffe4a0" strokeWidth="2"/>
         <path d="M-12-15H12M-15-9H15" stroke="#fff4c2" strokeWidth="1.4"/>
         <path d="M-7 20L0 25L7 20" fill="none" stroke="#ffb145" strokeWidth="2"/>
        </>:<>
         <ellipse rx="8" ry="18" fill="#8eeaff" opacity=".2"/>
         <path d="M0-18L6 5L0 15L-6 5Z" fill="#9deaff" stroke="#f1ffff" strokeWidth="1.2"/>
        </>}
       </g>
      </g>;
     })}
     <g transform={'translate('+to.x+' '+to.y+') scale('+(maglioVariant(shot.cardId)?.impactScale||1)+')'}
      style={{'--maglio-impact-delay':impactDelay+'ms'}}>
      <g className="maglio-gravity-impact">
       <ellipse rx="53" ry="38" fill={'url(#maglio-impact-'+nonce+')'}/>
       <ellipse className="maglio-impact-ring" rx="27" ry="17" fill="none" stroke="#fff0c3" strokeWidth="2"/>
       <ellipse className="maglio-impact-ring maglio-impact-ring--outer" rx="37" ry="22" fill="none" stroke="#ffad48" strokeWidth="1.2"/>
       <path d="M-30-9L-12-3M11 4L32 10M-9 22L-3 8M3-9L8-23M-24 14L-9 5M10-4L27-14"
        stroke="#ffe6b1" strokeWidth="1.4" strokeLinecap="round"/>
      </g>
     </g>
    </g>;
   })}
  </svg>
 </div>;
}
