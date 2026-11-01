import React, { useState, useEffect, useRef } from 'react';
import {
 ENGINE_KEYS, META, initialBattle, evaluatePair, aiChoose, dealHit, consumeAttack,
 sacrificeCard, etherChange, isDestroyed, deckExhausted, deckVerdict,
 healthScore, generateTargets
} from './mathDuelEngine.js';
import './MathDuelBattle.css';

// Campo di gioco nuovo; tutto il resto dell'app R12 è gestito dall'App originale.
const URL='/assets/mathduel/';
const suits={'♥':'#ff727d','♦':'#ffbd75','♠':'#adceff','♣':'#74eacb'};
const label=v=>v===1?'A':v===11?'J':v===12?'Q':v===13?'K':String(v);
const clone=v=>structuredClone(v);
function tone(name){try{
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());
 if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=name==='shot'?'sawtooth':'sine';const now=ctx.currentTime;
 o.frequency.setValueAtTime(name==='shot'?180:470,now);o.frequency.exponentialRampToValueAtTime(name==='shot'?46:650,now+.19);
 g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.028,now+.014);g.gain.exponentialRampToValueAtTime(.0001,now+.22);
 o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+.23);
 }catch{}}
function Motor({side,op,ship,target,selected,onSelect,enabled,hit}){
 const e=ship.engines[op];const down=e.hp<=0;const pos={plus:'lt',minus:'rt',times:'lb',divide:'rb'}[op];
 return <button type="button" disabled={!enabled||down} onClick={()=>onSelect?.(op)}
  className={`engine e-${pos} e-${side}${selected?' selected':''}${down?' dead':''}${enabled?' clickable':''}${hit?' hit':''}`}
  aria-label={`${side==='enemy'?'Nemico':'Tu'}: ${META[op].name}, ${e.hp} HP, bersaglio ${target??''}`}>
  <span className="engine-sign" style={{color:META[op].color}}>{META[op].sign}</span>
  <span className="engine-info"><span className="engine-target">{down?'DISTRUTTO':enabled?`${META[op].sign} ${target}`:META[op].name}</span>
   <span className="engine-health">{e.hp} / {e.max} HP</span><span className="engine-track"><i style={{width:`${Math.max(0,e.hp/e.max*100)}%`}}/></span></span>
 </button>;
}
function Ship({side,ship,targets,selectedTarget,onTarget,phase,effect}){
 const enemy=side==='enemy';
 return <div className={`ship-zone ship-${side}${effect&&effect.side!==side?' ship-struck':''}`}>
  <div className={'ship-art '+(enemy?'enemy-art':'player-art')}><img src={`${URL}ship_${side}.png`} alt="" draggable="false"/>
   <div className={'engine-thruster '+(enemy?'red':'blue')}/></div>
  {ENGINE_KEYS.map(op=><Motor key={op} side={side} op={op} ship={ship} target={targets?.[op]}
   selected={enemy&&selectedTarget===op} onSelect={onTarget} enabled={enemy&&phase==='ready'}
   hit={!!effect&&effect.side!==side&&effect.op===op}/>)}
 </div>;
}
function Pips({ship}){return <div className="pips">{ENGINE_KEYS.map(k=><span key={k} className={ship.engines[k].hp>0?'good':'broken'}/>)}</div>}
const coords={enemy:{plus:[62,145],minus:[388,145],times:[62,230],divide:[388,230]},player:{plus:[62,395],minus:[388,395],times:[62,490],divide:[388,490]}};
function Projectile({effect}){
 if(!effect)return null;
 const source=effect.side==='player'?[225,523]:[225,228];
 const target=coords[effect.side==='player'?'enemy':'player'][effect.op];
 const dx=target[0]-source[0],dy=target[1]-source[1];
 const color={plus:'#50d4ff',minus:'#a6ffad',times:'#ffc35b',divide:'#cb87ff'}[effect.op];
 return <div className="vfx-layer" aria-hidden="true">
  <div className="projectile" style={{left:source[0],top:source[1],width:Math.hypot(dx,dy),transform:`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`,'--beam-color':color}}><span/></div>
  <img className="impact" src={`${URL}impact.png`} style={{left:target[0]-70,top:target[1]-70,'--impact-color':color}} alt=""/>
  <div className="impact-ring" style={{left:target[0]-50,top:target[1]-50,borderColor:color}}/>
  <div className="impact-number" style={{left:target[0]-52,top:target[1]-78,color}}>−{effect.damage}</div>
  <div className="vfx-flash" style={{'--beam-color':color}}/>
 </div>;
}
function Hand({cards,selected,onSelect,disabled}){
 return <div className="hand" aria-label="Le tue sette carte">
  {cards.map((c,i)=><button key={c.id} title={`${label(c.value)} ${c.suit}`} disabled={disabled}
   className={'number-card'+(selected.includes(i)?' active':'')} style={{'--suit':suits[c.suit]}}
   onClick={()=>onSelect(i)}><span className="card-suit">{c.suit}</span><strong>{label(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}
 </div>;
}
function Formula({game}){
 const [a,b]=game.selected.map(i=>game.player.hand[i]);const goal=game.targets[game.target];
 const ok=a&&b?evaluatePair(game.target,a.value,b.value,goal):null;
 return <div className={`formula${ok?' valid':game.selected.length===2?' invalid':''}`}>
  <span>{ok?`${ok.a} ${META[game.target].sign} ${ok.b} = ${goal}`:a&&b?`${a.value} ${META[game.target].sign} ${b.value} = ?`:`${META[game.target].sign} ${goal}`}</span>
  <small>{ok?'CALCOLO CORRETTO':a&&b?'RISULTATO ERRATO':'SELEZIONA DUE CARTE'}</small>
 </div>;
}

export default function MathDuelBattle({nickname,gameMode,sectorNumber=1,displaySector='',ether=0,onEtherConsumed,onResult,onExit}){
 const [scale,setScale]=useState(1);
 const [game,setGame]=useState(()=>{
  const initial=initialBattle(Math.max(1,sectorNumber),{},Math.random,gameMode);
  initial.player.ether=Math.max(0,Number(ether)||0);
  return initial;
 });
 const gameRef=useRef(game);gameRef.current=game;
 const [help,setHelp]=useState(false);
 const [message,setMessage]=useState('');
 const queue=useRef([]);
 const resultClaimed=useRef(false);
 function later(f,ms){const handle=setTimeout(f,ms);queue.current.push(handle);return handle}
 useEffect(()=>()=>queue.current.forEach(clearTimeout),[]);
 useEffect(()=>{const resize=()=>setScale(Math.max(.3,Math.min(window.innerWidth/450,window.innerHeight/800)));resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[]);
 function write(next){gameRef.current=next;setGame(next)}
 function notice(text){setMessage(text);later(()=>setMessage(''),2000)}
 function finish(b,winner,reason){return {...b,actor:'none',phase:'finished',winner,reason,effect:null};}
 function transition(state,side){
  let b=clone(state);
  if(isDestroyed(b.player))return finish(b,'enemy','Tutti i tuoi quattro motori sono distrutti');
  if(isDestroyed(b.enemy))return finish(b,'player','Tutti i motori nemici sono distrutti');
  if(deckExhausted(b.player,b.enemy))return finish(b,deckVerdict(b.player,b.enemy),'Mazzo esaurito: confronto integrità delle navicelle');
  b.selected=[];b.effect=null;
  if(side==='player') {b.actor='enemy';b.phase='thinking';b.targets=generateTargets(Math.random,b.level);b.notice='Turno avversario';}
  else {b.actor='player';b.phase='ready';b.round+=1;b.seconds=60;b.player.sacrifices=0;b.enemy.sacrifices=0;b.targets=generateTargets(Math.random,b.level);b.notice='Nuovi numeri: scegli il motore da colpire';}
  return b;
 }
 function fire(side,move){
  const b=gameRef.current;if(!b||b.phase==='finished'||b.phase==='animating'||b.actor!==side)return;
  const attackShip=b[side],defShip=b[side==='player'?'enemy':'player'];
  const goal=b.targets[move.op];const pair=evaluatePair(move.op,attackShip.hand[move.i]?.value,attackShip.hand[move.j]?.value,goal);
  if(!pair||defShip.engines[move.op].hp<=0){if(side==='player')notice('Calcolo non valido');return;}
  const strike=dealHit(defShip,attackShip,move.op,goal);
  const anim={...clone(b),phase:'animating',selected:[],effect:{side,op:move.op,damage:strike.damage}};
  write(anim);tone('shot');
  later(()=>{
   const active=gameRef.current;if(!active||active.phase!=='animating')return;
   const next=clone(active);const attacker=next[side];const receiver=side==='player'?'enemy':'player';
   const impact=dealHit(next[receiver],attacker,move.op,goal);
   next[side]=consumeAttack(attacker,[move.i,move.j]);next[receiver]=impact.defender;
   next.logs=[`${side==='player'?'TU':'IA'}: ${pair.a} ${META[move.op].sign} ${pair.b} = ${goal} — ${impact.damage} HP`,...next.logs].slice(0,6);
   write(transition(next,side));
  },1050);
 }
 function attack(){const b=gameRef.current;if(b.phase!=='ready'||b.selected.length!==2){notice('Seleziona due carte');return;}fire('player',{op:b.target,i:b.selected[0],j:b.selected[1]});}
 function pick(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const next=clone(b);next.selected=next.selected.includes(i)?next.selected.filter(x=>x!==i):next.selected.length>=2?[next.selected[1],i]:[...next.selected,i];write(next);tone('click');}
 function selectEngine(op){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready'||b.enemy.engines[op].hp<=0)return;write({...b,target:op});}
 function change(withEther){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;
  if(b.selected.length!==1){notice('Seleziona UNA carta da cambiare');return;}
  const n=clone(b),i=n.selected[0];
  if(withEther){const ship=etherChange(n.player,i);if(!ship){notice('Etere insufficiente o mazzo vuoto');return;}n.player=ship;onEtherConsumed?.(1);n.notice='Una carta sostituita con Etere';}
  else{const swap=sacrificeCard(n.player,i,n.enemy,n.seconds);if(!swap){notice('Non puoi cambiare altre carte');return;}n.player=swap.ship;n.enemy=swap.opponent;n.seconds=swap.seconds;n.notice=`Sacrificio ${n.player.sacrifices}/3: ${swap.detail}`;}
  n.selected=[];n.logs=[n.notice,...n.logs].slice(0,6);
  write(isDestroyed(n.player)?finish(n,'enemy','Motori distrutti durante un sacrificio'):deckExhausted(n.player,n.enemy)?finish(n,deckVerdict(n.player,n.enemy),'Mazzo esaurito'):n);
 }
 function pass(){const b=gameRef.current;if(b.phase==='ready'&&b.actor==='player')write(transition(b,'player'));}
 useEffect(()=>{if(help||game.actor!=='player'||game.phase!=='ready')return;
  const timer=setInterval(()=>{const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;if(b.seconds<=1)write(transition({...b,seconds:0},'player'));else write({...b,seconds:b.seconds-1});},1000);
  return()=>clearInterval(timer);
 },[game.actor,game.phase,help]);
 useEffect(()=>{if(game.actor!=='enemy'||game.phase!=='thinking')return;
  const timer=later(()=>{let n=clone(gameRef.current);if(n.phase!=='thinking'||n.actor!=='enemy')return;
   let move=aiChoose(n.enemy,n.player,n.targets);
   if(!move&&n.enemy.sacrifices<3&&n.enemy.deck.length){const swap=sacrificeCard(n.enemy,Math.floor(Math.random()*n.enemy.hand.length),n.player,60);if(swap){n.enemy=swap.ship;n.player=swap.opponent;write(n);move=aiChoose(n.enemy,n.player,n.targets);}}
   if(isDestroyed(n.enemy)){write(finish(n,'player','Tutti i motori avversari distrutti'));return;}
   if(deckExhausted(n.player,n.enemy)){write(finish(n,deckVerdict(n.player,n.enemy),'Mazzo terminato'));return;}
   if(move){write(n);fire('enemy',move);}else write(transition(n,'enemy'));
  },1100);return()=>clearTimeout(timer);
 },[game.actor,game.phase,game.round]);
 function exitBattle(){
  const b=gameRef.current;
  if(b?.phase==='finished'&&!resultClaimed.current){resultClaimed.current=true;
   const remainingHpPct=healthScore(b.player);
   const meta={turnsElapsed:b.round,remainingHpPct,starsEarned:[true,remainingHpPct>=.65,remainingHpPct>=.9],matchStats:{damageDealt:Math.round((1-healthScore(b.enemy))*100),turnsElapsed:b.round}};
   onResult?.(b.winner,meta);
  }
  onExit?.();
 }
 return <div className="es-math-scope game-viewport" role="region" aria-label="Battaglia matematica spaziale">
  <div className="es-root" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <div className="space-back" style={{backgroundImage:`url('${URL}space_battle_bg.jpg')`}}/>
   <div className="top-brand">ECLISSI <b>STELLARE</b></div>
   <div className="toolbar"><button onClick={()=>setHelp(true)} aria-label="Regole">?</button><button className="math-exit" onClick={()=>{if(game.phase==='finished'||window.confirm('Abbandonare la battaglia?'))exitBattle()}} aria-label="Torna al menu">⌂</button></div>
   <div className="enemy-status"><div className="portrait">◆</div><div><b>AVVERSARIO {displaySector&&`• ${displaySector}`}</b><small>INTEGRITÀ {Math.round(healthScore(game.enemy)*100)}%</small></div><Pips ship={game.enemy}/></div>
   <Ship side="enemy" ship={game.enemy} targets={game.actor==='player'?game.targets:null} selectedTarget={game.target} onTarget={selectEngine} phase={game.phase} effect={game.effect}/>
   <div className="center-bar"><span className="round-tag">TURNO {game.round}</span><div className={'timer-pill'+(game.seconds<=10?' urgent':'')}><strong>{game.actor==='player'?`${game.seconds}s`:game.actor==='enemy'?'AVVERSARIO':'COLPO'}</strong></div></div>
   <Ship side="player" ship={game.player} targets={game.actor==='enemy'?game.targets:null} phase="idle" effect={game.effect}/>
   <div className="deck left"><div className="deck-graphic">✦</div><small>MAZZO</small><strong>{game.player.deck.length}</strong></div>
   <div className="deck right"><div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{game.player.discard.length}</strong></div>
   <Hand cards={game.player.hand} selected={game.selected} onSelect={pick} disabled={game.phase!=='ready'||game.actor!=='player'}/>
   <div className="play-controls"><Formula game={game}/><button className="es-button attack" onClick={attack} disabled={game.phase!=='ready'}>ATTACCA ➤</button></div>
   <div className="utility-bar"><button onClick={()=>change(false)} disabled={game.phase!=='ready'}>CAMBIA <b>{game.player.sacrifices}/3</b></button><button onClick={()=>change(true)} disabled={game.phase!=='ready'||!game.player.ether}>ETERE <b>{game.player.ether}</b></button><button onClick={pass} disabled={game.phase!=='ready'}>PASSA »</button><button onClick={()=>setHelp(true)}>REGOLE ?</button></div>
   <div className="player-status"><b>TU</b><span className="my-hp">NAVE {Math.round(healthScore(game.player)*100)}%</span><Pips ship={game.player}/><small>{message||game.notice}</small></div>
   {game.effect&&<Projectile effect={game.effect}/>}
   {game.phase==='finished'&&<div className="modal-shade"><div className="result-card"><h1>{game.winner==='player'?'VITTORIA':game.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{game.reason}</p><div className="result-score"><span>TUA NAVE <b>{Math.round(healthScore(game.player)*100)}%</b></span><span>AVVERSARIO <b>{Math.round(healthScore(game.enemy)*100)}%</b></span></div><button className="es-button primary" onClick={exitBattle}>CONFERMA E TORNA</button></div></div>}
   {help&&<div className="modal-shade"><div className="help-card"><h2>REGOLE DEL DUELLO</h2><p>Ogni nave ha quattro motori. Per distruggere il nemico devi portare tutti i suoi motori a 0 HP usando +, −, × e ÷.</p><p>Ogni turno dura 60 secondi e i bersagli cambiano. Tocca un motore, seleziona due delle sette carte e premi ATTACCA se il risultato coincide.</p><p>Il primo cambio aggiunge 3 HP al nemico; il secondo costa 3 secondi; il terzo sottrae 3 HP a un tuo motore. Etere consuma 1 unità dalla riserva già presente nell'app.</p><p>Se finisce il mazzo, vince chi ha la percentuale di integrità maggiore.</p><button className="es-button primary" onClick={()=>setHelp(false)}>CHIUDI</button></div></div>}
  </div>
 </div>;
}
