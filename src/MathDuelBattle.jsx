import React,{useState,useEffect,useRef} from 'react';
import {ENGINE_KEYS,META,PHASE1_SHIPS,SUIT_SIGNS,SUIT_KEYS,initialBattle,evaluatePair,aiChoose,dealHit,consumeAttack,sacrificeCard,etherChange,isDestroyed,deckExhausted,deckVerdict,healthScore,generateTargets,supportedOperators,validFleet,previewVolley,vesselDestroyed} from './mathDuelEngine.js';
import './MathDuelBattle.css';
const URL='/assets/mathduel/';const SHIPS='/assets/mathfleet/';
const suits={'♥':'#ff727d','♦':'#68d6ff','♠':'#c47dff','♣':'#74eacb'};
const bulletColors={H:'#ff576b',D:'#58e6ff',C:'#4aff9b',S:'#c176ff','*':'#ecfcff'};
const label=v=>v===1?'A':v===11?'J':v===12?'Q':v===13?'K':String(v);
const clone=v=>structuredClone(v);
function tone(name){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;o.type=name==='shot'?'sawtooth':'sine';o.frequency.setValueAtTime(name==='shot'?180:470,now);o.frequency.exponentialRampToValueAtTime(name==='shot'?46:650,now+.19);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.025,now+.014);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+.23);}catch{}}
function Engine({side,op,vessel,target,selected,onSelect,enabled,hit,available}){
 const e=vessel.engines[op];const absent=!e,down=e&&e.hp<=0;const pos={plus:'lt',minus:'rt',times:'lb',divide:'rb'}[op];
 const ratio=e?e.hp/e.max:0;const state=absent?'locked':down?'destroyed':ratio<=.3?'critical':ratio<=.65?'damaged':'intact';
 return <button type="button" disabled={!enabled||absent||down||!available} onClick={()=>onSelect?.(op)}
  className={`engine e-${pos} e-${side}${selected?' selected':''}${down?' dead':''}${enabled?' clickable':''}${hit?' hit':''}${absent?' engine-locked':''}`}
  aria-label={`${side==='enemy'?'Nemico':'Tu'}: ${META[op].name}, ${e?.hp||0} HP, bersaglio ${target??''}`}>
  {!absent&&<img className="motor-sprite" src={`${SHIPS}motor_${op}_${state}.png`} alt=""/>}
  <span className="engine-sign" style={{color:META[op].color}}>{META[op].sign}</span>
  <span className="engine-info"><span className="engine-target">{absent?'NON MONTATO':down?'DISTRUTTO':enabled?`${META[op].sign} ${target}`:META[op].name}</span>
   <span className="engine-health">{e?`${e.hp} / ${e.max} HP`:'—'}</span><span className="engine-track"><i style={{width:`${ratio*100}%`}}/></span></span>
  {down&&<span className="motor-smoke"/>}
 </button>;
}
function shipX(index,count,focused){if(index===focused)return 225;const others=Array.from({length:count},(_,i)=>i).filter(i=>i!==focused);if(count===2)return index<focused?130:320;return index===others[0]?115:335;}
function Ship({side,ship,targets,focused,onSelectShip,selectedTarget,onTarget,phase,effect,availableOps}){
 const enemy=side==='enemy';const vessel=ship.fleet[focused]||ship.fleet[0];const targetable=enemy&&phase==='ready';
 const active=ship.fleet.filter(v=>!vesselDestroyed(v));
 return <div className={`ship-zone ship-${side}${effect&&effect.side!==side?' ship-struck':''}`}>
  <div className="fleet-ships">
   {ship.fleet.map((v,i)=><img key={i} className={`fleet-ship-img ${i===focused?'focused':''}${vesselDestroyed(v)?' dead-ship':''}`}
    style={{left:`${shipX(i,ship.fleet.length,focused)/450*100}%`,zIndex:i===focused?2:1}}
    src={`${SHIPS}${v.id}.png`} alt="" draggable="false"/>)}
   <div className={'engine-thruster '+(enemy?'red':'blue')}/>
  </div>
  {ENGINE_KEYS.map(op=><Engine key={op} side={side} op={op} vessel={vessel} target={targets?.[op]} selected={enemy&&selectedTarget===op}
   onSelect={onTarget} enabled={targetable} available={!enemy||availableOps.includes(op)} hit={!!effect&&effect.side!==side&&effect.op===op&&effect.targetShip===focused}/>)}
  <div className="fleet-picker-inline">{ship.fleet.map((v,i)=><button key={i} type="button" className={focused===i?'focus':''}
   onClick={()=>onSelectShip?.(i)} disabled={enemy&&phase!=='ready'} title={`${v.name} · ${v.level}`}>
   <span className={`fleet-dot${vesselDestroyed(v)?' lost':''}`}/>{v.name.split(' ')[0]} L{v.level}</button>)}</div>
  {active.length===0&&<span className="fleet-eliminated">FLOTTA DISTRUTTA</span>}
 </div>;
}
function Pips({ship}){return <div className="pips">{ship.fleet.map((v,i)=><span key={i} className={vesselDestroyed(v)?'broken':'good'}/>)}</div>}
const coord={enemy:{plus:[62,145],minus:[388,145],times:[62,230],divide:[388,230]},player:{plus:[62,395],minus:[388,395],times:[62,490],divide:[388,490]}};
function Projectile({effect}){
 if(!effect)return null;const target=coord[effect.side==='player'?'enemy':'player'][effect.op];
 const shots=effect.volleys.filter(x=>x.bullets>0);const count=shots.length;
 return <div className="vfx-layer" aria-hidden="true">
  {shots.map((s,i)=>{const x=shipX(s.vesselIndex,effect.shipCount,effect.sourceFocus),y=effect.side==='player'?521:249,dx=target[0]-x,dy=target[1]-y,color=bulletColors[s.suit]||'#fff';return <div key={`${s.weaponId}-${i}`}>
   <div className={`projectile shot-${s.suit==='*'?'universal':s.suit.toLowerCase()}`} style={{left:x,top:y,width:Math.hypot(dx,dy),transform:`rotate(${Math.atan2(dy,dx)*180/Math.PI}deg)`,'--beam-color':color,'--shot-delay':`${i*.11}s`}}><span/><b>{s.bullets}×</b></div>
   <div className="shot-label" style={{left:x,top:y-25,color}}>{s.weapon}</div>
  </div>})}
  {effect.damage>0&&<><img className="impact" src={`${URL}impact.png`} style={{left:target[0]-70,top:target[1]-70,'--impact-color':'#79e2ff'}} alt=""/><div className="impact-ring" style={{left:target[0]-50,top:target[1]-50,borderColor:'#ffdf83'}}/><div className="impact-number" style={{left:target[0]-52,top:target[1]-78,color:'#ffdf83'}}>−{effect.damage}</div><div className="vfx-flash" style={{'--beam-color':'#ffb75b'}}/></>}
  {shots.length===0&&<div className="charge-notice">MUNIZIONI IN CARICA</div>}
 </div>;
}
function Hand({cards,selected,onSelect,disabled}){return <div className="hand" aria-label="Le tue sette carte">{cards.map((c,i)=><button key={c.id} title={`${label(c.value)} ${c.suit}`} disabled={disabled} className={'number-card'+(selected.includes(i)?' active':'')} style={{'--suit':suits[c.suit]}} onClick={()=>onSelect(i)}><span className="card-suit">{c.suit}</span><strong>{label(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}</div>}
function Formula({game}){const [a,b]=game.selected.map(i=>game.player.hand[i]);const goal=game.targets[game.target],ok=a&&b?evaluatePair(game.target,a.value,b.value,goal):null;const preview=ok?previewVolley(game.player,[a,b]):null;return <div className={`formula${ok?' valid':game.selected.length===2?' invalid':''}`}><span>{ok?`${ok.a} ${META[game.target].sign} ${ok.b} = ${goal}`:a&&b?`${a.value} ${META[game.target].sign} ${b.value} = ?`:`${META[game.target].sign} ${goal}`}</span><small>{ok?`FUOCO ${preview.totalDamage} HP POTENZIALI`:a&&b?'RISULTATO ERRATO':'SELEZIONA DUE CARTE'}</small></div>}
function FleetSetup({onClose,onStart,selected,setSelected,level,setLevel,sector}){
 const toggle=id=>{const next=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];if(validFleet(next))setSelected(next);};
 return <div className="modal-shade"><div className="help-card fleet-setup"><h2>FLOTTA — FASE 1</h2><p>La prima nave è <b>Aurora-0</b>, universale. Le quattro comuni sono disponibili qui per provare il combattimento: non sono acquisti dello Shop R12.</p>
  <div className="fleet-setup-list">{PHASE1_SHIPS.map(s=><button key={s.id} className={selected.includes(s.id)?'on':''} onClick={()=>toggle(s.id)}><img src={`${SHIPS}${s.id}.png`} alt=""/><span><b>{s.nome}</b><small>{s.n_armi} {s.n_armi===1?'arma':'armi'} · {s.motori_iniziali}–{s.motori_massimi} motori</small></span><strong>{selected.includes(s.id)?'✓':'+'}</strong></button>)}</div>
  <label className="fleet-level-row">Livello di prova (non acquistato) <b>{level}</b><input type="range" min="1" max="5" value={level} onChange={e=>setLevel(Number(e.target.value))}/></label>
  <p>Massimo 3 navi. L'universale è unica; ogni seme può attivare al massimo due navi specializzate. Le operazioni si sbloccano secondo il livello del modello.</p>
  <div className="fleet-setup-actions"><button className="es-button" onClick={onClose}>ANNULLA</button><button className="es-button primary" onClick={onStart}>INIZIA DUELLO</button></div></div></div>;
}
export default function MathDuelBattle({nickname,gameMode,sectorNumber=1,displaySector='',ether=0,onEtherConsumed,onResult,onExit}){
 const [scale,setScale]=useState(1);const [fleetIds,setFleetIds]=useState(['N00']);const [testLevel,setTestLevel]=useState(1);
 const [game,setGame]=useState(()=>{const b=initialBattle(Math.max(1,sectorNumber),{fleetIds:['N00']},Math.random,gameMode);b.player.ether=Math.max(0,Number(ether)||0);return b;});
 const gameRef=useRef(game);gameRef.current=game;const [help,setHelp]=useState(false),[fleetMenu,setFleetMenu]=useState(false),[message,setMessage]=useState('');const queue=useRef([]),resultClaimed=useRef(false);
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
  return b;
 }
 function fire(side,move){const b=gameRef.current;if(b.phase==='finished'||b.phase==='animating'||b.actor!==side)return;
  const attackShip=b[side],receiver=side==='player'?'enemy':'player',defShip=b[receiver],goal=b.targets[move.op],cards=[attackShip.hand[move.i],attackShip.hand[move.j]];
  if(cards.some(x=>!x)||!evaluatePair(move.op,cards[0].value,cards[1].value,goal)||!supportedOperators(attackShip).includes(move.op)){if(side==='player')notice('Calcolo non valido oppure operazione non disponibile');return;}
  const index=move.targetShip??0,e=defShip.fleet[index]?.engines[move.op];if(!e||e.hp<=0){if(side==='player')notice('Motore non disponibile');return;}
  const strike=dealHit(defShip,attackShip,move.op,goal,cards,index);
  const anim={...clone(b),...(side==='enemy'?{shownPlayer:index}:{targetShip:index}),phase:'animating',selected:[],effect:{side,op:move.op,targetShip:index,damage:strike.damage,volleys:strike.volley,shipCount:attackShip.fleet.length,sourceFocus:side==='player'?b.shownPlayer:b.targetShip}};
  write(anim);tone(strike.damage>0?'shot':'click');
  later(()=>{const active=gameRef.current;if(active.phase!=='animating')return;const next=clone(active),attacker=next[side];const used=[attacker.hand[move.i],attacker.hand[move.j]];
   const impact=dealHit(next[receiver],attacker,move.op,goal,used,index);next[side]=consumeAttack(impact.attacker,[move.i,move.j]);next[receiver]=impact.defender;
   next.logs=[`${side==='player'?'TU':'IA'}: ${used[0].value}${used[0].suit} ${META[move.op].sign} ${used[1].value}${used[1].suit} = ${goal} — ${impact.damage} HP`,...next.logs].slice(0,6);
   write(transition(next,side));
  },1100);
 }
 function attack(){const b=gameRef.current;if(b.phase!=='ready'||b.selected.length!==2){notice('Seleziona due carte');return;}fire('player',{op:b.target,targetShip:b.targetShip,i:b.selected[0],j:b.selected[1]});}
 function pick(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const next=clone(b);next.selected=next.selected.includes(i)?next.selected.filter(x=>x!==i):next.selected.length>=2?[next.selected[1],i]:[...next.selected,i];write(next);tone('click');}
 function selectEngine(op){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(!supportedOperators(b.player).includes(op)){notice('La tua flotta non ha ancora questo motore operativo');return;}if((b.enemy.fleet[b.targetShip]?.engines[op]?.hp||0)<=0)return;write({...b,target:op});}
 function chooseEnemy(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const v=b.enemy.fleet[i];if(!v||vesselDestroyed(v))return;const op=ENGINE_KEYS.find(k=>(v.engines[k]?.hp||0)>0&&supportedOperators(b.player).includes(k))||b.target;write({...b,targetShip:i,target:op});}
 function change(withEther){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(b.selected.length!==1){notice('Seleziona UNA carta da cambiare');return;}
  const n=clone(b),i=n.selected[0];if(withEther){const ship=etherChange(n.player,i);if(!ship){notice('Etere insufficiente o mazzo vuoto');return;}n.player=ship;onEtherConsumed?.(1);n.notice='Carta sostituita con Etere';}
  else{const swap=sacrificeCard(n.player,i,n.enemy,n.seconds);if(!swap){notice('Non puoi cambiare altre carte');return;}n.player=swap.ship;n.enemy=swap.opponent;n.seconds=swap.seconds;n.notice=`Sacrificio ${n.player.sacrifices}/3: ${swap.detail}`;}
  n.selected=[];n.logs=[n.notice,...n.logs].slice(0,6);write(isDestroyed(n.player)?finish(n,'enemy','Flotta distrutta durante un sacrificio'):deckExhausted(n.player,n.enemy)?finish(n,deckVerdict(n.player,n.enemy),'Mazzo esaurito'):n);
 }
 function pass(){const b=gameRef.current;if(b.phase==='ready'&&b.actor==='player')write(transition(b,'player'));}
 useEffect(()=>{if(help||fleetMenu||game.actor!=='player'||game.phase!=='ready')return;const timer=setInterval(()=>{const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;if(b.seconds<=1)write(transition({...b,seconds:0},'player'));else write({...b,seconds:b.seconds-1});},1000);return()=>clearInterval(timer);},[game.actor,game.phase,help,fleetMenu]);
 useEffect(()=>{if(game.actor!=='enemy'||game.phase!=='thinking')return;const timer=later(()=>{const b=gameRef.current;if(b.phase!=='thinking'||b.actor!=='enemy')return;let n=clone(b),move=aiChoose(n.enemy,n.player,n.targets);if(!move&&n.enemy.sacrifices<3&&n.enemy.deck.length){const swap=sacrificeCard(n.enemy,Math.floor(Math.random()*n.enemy.hand.length),n.player,60);if(swap){n.enemy=swap.ship;n.player=swap.opponent;write(n);move=aiChoose(n.enemy,n.player,n.targets);}}
  if(isDestroyed(n.enemy)){write(finish(n,'player','Flotta nemica distrutta'));return;}if(deckExhausted(n.player,n.enemy)){write(finish(n,deckVerdict(n.player,n.enemy),'Mazzo terminato'));return;}if(move){write(n);fire('enemy',move);}else write(transition(n,'enemy'));
 },1000);return()=>clearTimeout(timer);},[game.actor,game.phase,game.round]);
 function restartWithFleet(){if(!validFleet(fleetIds))return;const b=initialBattle(Math.max(1,sectorNumber),{fleetIds,shipLevel:testLevel},Math.random,gameMode);b.player.ether=Math.max(0,Number(ether)||0);write(b);setFleetMenu(false);resultClaimed.current=false;}
 function exitBattle(){const b=gameRef.current;if(b?.phase==='finished'&&!resultClaimed.current){resultClaimed.current=true;const h=healthScore(b.player);onResult?.(b.winner,{turnsElapsed:b.round,remainingHpPct:h,starsEarned:[true,h>=.65,h>=.9],matchStats:{damageDealt:Math.round((1-healthScore(b.enemy))*100),turnsElapsed:b.round}});}onExit?.();}
 const availableOps=supportedOperators(game.player);
 return <div className="es-math-scope game-viewport" role="region" aria-label="Duello matematico spaziale">
  <div className="es-root" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <div className="space-back" style={{backgroundImage:`url('${URL}space_battle_bg.jpg')`}}/>
   <div className="top-brand">ECLISSI <b>STELLARE</b></div>
   <div className="toolbar"><button onClick={()=>setHelp(true)} aria-label="Regole">?</button><button onClick={()=>{if(game.round===1&&game.player.discard.length===0)setFleetMenu(true);else notice('La flotta si configura prima del primo attacco');}} title="Flotta di prova" aria-label="Flotta">⚙</button><button className="math-exit" onClick={()=>{if(game.phase==='finished'||window.confirm('Abbandonare la battaglia?'))exitBattle()}} aria-label="Torna al menu">⌂</button></div>
   <div className="enemy-status"><div className="portrait">◆</div><div><b>AVVERSARIO {displaySector&&`• ${displaySector}`}</b><small>INTEGRITÀ FLOTTA {Math.round(healthScore(game.enemy)*100)}%</small></div><Pips ship={game.enemy}/></div>
   <Ship side="enemy" ship={game.enemy} targets={game.actor==='player'?game.targets:null} focused={game.targetShip} onSelectShip={chooseEnemy} selectedTarget={game.target} onTarget={selectEngine} phase={game.phase} effect={game.effect} availableOps={availableOps}/>
   <div className="center-bar"><span className="round-tag">TURNO {game.round}</span><div className={'timer-pill'+(game.seconds<=10?' urgent':'')}><strong>{game.actor==='player'?`${game.seconds}s`:game.actor==='enemy'?'AVVERSARIO':'COLPO'}</strong></div></div>
   <Ship side="player" ship={game.player} targets={game.actor==='enemy'?game.targets:null} focused={game.shownPlayer} onSelectShip={i=>write({...gameRef.current,shownPlayer:i})} phase="idle" effect={game.effect} availableOps={availableOps}/>
   <div className="deck left"><div className="deck-graphic">✦</div><small>MAZZO</small><strong>{game.player.deck.length}</strong></div><div className="deck right"><div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{game.player.discard.length}</strong></div>
   <Hand cards={game.player.hand} selected={game.selected} onSelect={pick} disabled={game.phase!=='ready'||game.actor!=='player'}/>
   <div className="play-controls"><Formula game={game}/><button className="es-button attack" onClick={attack} disabled={game.phase!=='ready'}>ATTACCA ➤</button></div>
   <div className="utility-bar"><button onClick={()=>change(false)} disabled={game.phase!=='ready'}>CAMBIA <b>{game.player.sacrifices}/3</b></button><button onClick={()=>change(true)} disabled={game.phase!=='ready'||!game.player.ether}>ETERE <b>{game.player.ether}</b></button><button onClick={pass} disabled={game.phase!=='ready'}>PASSA »</button><button onClick={()=>{if(game.round===1&&!game.player.discard.length)setFleetMenu(true);else setHelp(true)}}>FLOTTA ⚙</button></div>
   <div className="player-status"><b>TU</b><span className="my-hp">FLOTTA {Math.round(healthScore(game.player)*100)}%</span><Pips ship={game.player}/><small>{message||game.notice}</small></div>
   {game.effect&&<Projectile effect={game.effect}/>}
   {game.phase==='finished'&&<div className="modal-shade"><div className="result-card"><h1>{game.winner==='player'?'VITTORIA':game.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{game.reason}</p><div className="result-score"><span>TUA FLOTTA <b>{Math.round(healthScore(game.player)*100)}%</b></span><span>AVVERSARIO <b>{Math.round(healthScore(game.enemy)*100)}%</b></span></div><button className="es-button primary" onClick={exitBattle}>CONFERMA E TORNA</button></div></div>}
   {help&&<div className="modal-shade"><div className="help-card"><h2>REGOLE DEL DUELLO</h2><p>Ogni nave monta inizialmente + e −; alcuni modelli sbloccano × e ÷. Tutti i motori installati devono essere distrutti per eliminare una nave. Vinci distruggendo tutta la flotta nemica.</p><p>Ogni turno dura 60 secondi. Tocca una nave nemica, scegli uno dei suoi motori e seleziona due carte. Il risultato esatto fa scattare tutte le armi della flotta attivate dai semi delle carte.</p><p>I VALORI delle carte sono proiettili: 8♣ × 3♦ = 24 significa 8 proiettili ♣ e 3 ♦; il 24 sblocca il tiro, non è il danno. L'arma determina il danno per proiettile. Alcune armi accumulano munizioni.</p><p>La nave universale spara con qualsiasi seme ma ha poca potenza. Il primo cambio carta dà +3 HP al nemico, il secondo costa 3 secondi e il terzo −3 HP a te. A mazzo esaurito prevale l'integrità percentuale della flotta.</p><p>⚙ FLOTTA è una selezione di prova per la fase 1: non modifica acquisti o salvataggi dello Shop R12.</p><button className="es-button primary" onClick={()=>setHelp(false)}>CHIUDI</button></div></div>}
   {fleetMenu&&<FleetSetup selected={fleetIds} setSelected={setFleetIds} level={testLevel} setLevel={setTestLevel} onClose={()=>setFleetMenu(false)} onStart={restartWithFleet} sector={sectorNumber}/>}
  </div>
 </div>;
}
