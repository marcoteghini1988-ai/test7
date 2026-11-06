// Punto 47 — segnali visivi esclusivamente legati allo stato di battaglia.
// I proiettili e la plancia rimangono quelli originali.
import React from 'react';
import './BattleCombatFeedback.css';

const SUIT_COLORS={'♥':'#ff738f','♦':'#ffb271','♣':'#83eac2','♠':'#91c7ff'};
const glyph={
 launch:'✦',charge:'◌',impact:'◎',blocked:'◇',critical:'✹',
 special:'✧',fusion:'⬡',volley:'➤',support:'✚',defense:'⬟'
};
const rank=value=>value===1?'A':value===11?'J':value===12?'Q':value===13?'K':String(value);

export default function BattleCombatFeedback({cue=null,effects=[],intro=false}){
 if(intro)return null;
 return <>
  {cue&&<div key={cue.id} className={'battle-combat-cue cue-'+cue.kind+' cue-'+cue.side}
    role="status" aria-live="polite" aria-atomic="true" data-cue-id={cue.id}>
    <span className="battle-cue-symbol" aria-hidden="true">{glyph[cue.kind]||'✦'}</span>
    <span className="battle-cue-copy"><strong>{cue.label}</strong><small>{cue.detail}</small></span>
   </div>}
  {effects.filter(effect=>effect?.side==='player'&&Array.isArray(effect.spentCards)&&effect.spentCards.length>0)
   .map(effect=><div className="battle-ammo-flow" aria-hidden="true" key={effect.id}>
    {effect.spentCards.map((card,index)=>{
     const fromX=83+card.index*47,fromY=621,toX=225,toY=463;
     return <span key={card.id} className="battle-ammo-token"
       style={{left:fromX,top:fromY,'--ammo-dx':(toX-fromX)+'px',
        '--ammo-dy':(toY-fromY)+'px',
        '--ammo-color':SUIT_COLORS[card.suit]||'#9edfff',
        '--ammo-delay':(index*65)+'ms'}}>
       <b>{rank(card.value)}</b><i>{card.suit}</i>
      </span>;
    })}
   </div>)}
 </>;
}
