import React,{useState,useEffect,useRef,useLayoutEffect} from 'react';

import {ENGINE_KEYS,META,PHASE1_SHIPS,SUIT_SIGNS,SUIT_KEYS,initialBattle,evaluatePair,inspectCalculation,rankLabel,aiChoose,dealHit,consumeAttack,sacrificeCard,etherChange,isDestroyed,deckExhausted,deckVerdict,healthScore,generateTargets,supportedOperators,validFleet,previewVolley,vesselDestroyed,nextAttackTarget} from './mathDuelEngine.js';
import {enginePoint,boardPoint,gunPoint,volleyTimeline} from './mathFleetGeometry.js';
import './MathDuelBattle.css';
const URL='/assets/mathduel/';const SHIPS='/assets/mathfleet/';
const suits={'♥':'#ff727d','♦':'#68d6ff','♠':'#c47dff','♣':'#74eacb'};
const bulletColors={H:'#ff576b',D:'#58e6ff',C:'#4aff9b',S:'#c176ff','*':'#ecfcff'};
const label=rankLabel;
const clone=v=>structuredClone(v);
function tone(name){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=window.__eclissiMathAudio||(window.__eclissiMathAudio=new C());if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain(),now=ctx.currentTime;o.type=name==='shot'?'sawtooth':'sine';o.frequency.setValueAtTime(name==='shot'?180:470,now);o.frequency.exponentialRampToValueAtTime(name==='shot'?46:650,now+.19);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.025,now+.014);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g);g.connect(ctx.destination);o.start(now);o.stop(now+.23);}catch{}}
// Position of the FOUR visible engine modules on the actual starship illustration.
// Coordinates follow each sprite's camera view without flipping its orientation.
const GLYPH={H:'♥',D:'♦',C:'♣',S:'♠','*':'◎'};
function Engine({side,op,vessel,target,selected,onSelect,enabled,hit,available,engineRef}){
 const engine=vessel.engines[op];if(!engine)return null;
 const dead=engine.hp<=0,ratio=Math.max(0,engine.hp/engine.max);
 const state=dead?'destroyed':ratio<=.3?'critical':ratio<=.65?'damaged':'intact';
 const [px,py]=enginePoint(side,vessel.id,op);
 return <button type="button" style={{left:`${px*100}%`,top:`${py*100}%`}}
  className={`vessel-engine ve-${op} ve-${side}${selected&&!dead?' selected':''}${dead?' dead':''}${hit?' hit':''}`}
  disabled={!enabled||dead||!available} data-state={state} onClick={()=>onSelect?.(op)}
  aria-label={`${side==='enemy'?'Nemico':'Tu'}: motore ${META[op].name}, ${engine.hp} di ${engine.max} HP, bersaglio ${target??'non disponibile'}`}>
  <img ref={engineRef} className="vessel-engine-art" src={`${SHIPS}motor_${op}_${state}.png`} alt="" draggable="false"/>
  <span className="vessel-engine-hud">
   <strong>{dead?'✕':enabled&&target!=null?`${META[op].sign}${target}`:META[op].sign}</strong>
   <small>{dead?'KO':`${engine.hp} HP`}</small>
   <i className="vessel-engine-meter"><em style={{width:`${ratio*100}%`}}/></i>
  </span>
  {dead&&<span className="vessel-smoke"/>}
 </button>;
}
function shipX(index,count,focused){if(index===focused)return 225;
 const others=Array.from({length:count},(_,i)=>i).filter(i=>i!==focused);
 if(count===2)return index<focused?118:332;
 return index===others[0]?108:342;
}
function Ship({side,ship,targets,focused,onSelectShip,selectedTarget,onTarget,phase,effect,availableOps,registerShipRef,registerEngineRef,registerGunRef}){
 const enemy=side==='enemy',targetable=enemy&&phase==='ready';
 const vessel=ship.fleet[focused]||ship.fleet[0];
 const hit=effect&&effect.side!==side&&effect.targetShip===focused;
 return <div className={`ship-zone ship-${side}${hit?' ship-struck':''}${effect?' ship-in-combat':''}`}>
  <div className="fleet-ships">
   {ship.fleet.map((v,i)=>{
    const focusedShip=i===focused,dead=vesselDestroyed(v),count=v.weapons.length;
    return <div key={i} data-ship={v.id} className={`fleet-ship-wrap complete-ship${focusedShip?' focused':''}${dead?' dead-ship':''}`}
     style={{left:`${shipX(i,ship.fleet.length,focused)/450*100}%`,zIndex:focusedShip?3:1}}>
     <img ref={node=>registerShipRef?.(side,i,node)} className="fleet-ship-img" src={`${SHIPS}views/${side==='player'?'player_to_enemy':'enemy_to_player'}/${v.id}_complete.png`}
      alt={`${v.name}, livello ${v.level}`} draggable="false"/>
     <div className="ship-hardpoints">{v.weapons.map((w,wi)=>{
       const [x,y]=gunPoint(side,count,wi,v.id);
       const charge=w.tipo==='Accumulo'&&w.soglia_munizioni>0?Math.min(100,(w.charge||0)/w.soglia_munizioni*100):100;
       return <div key={w.id}
        className={`weapon-mount weapon-${w.seme_trigger==='*'?'all':w.seme_trigger.toLowerCase()}${w.tipo==='Accumulo'?' charging':''}`}
        style={{left:`${x*100}%`,top:`${y*100}%`,'--gun':bulletColors[w.seme_trigger]||'#e8ffff','--charge':`${charge}%`}}
        title={`${w.nome}: ${GLYPH[w.seme_trigger]||'◎'} · ${w.tipo} · ${w.damage} danni/proiettile`}>
        <span className="weapon-barrel"/><span ref={node=>registerGunRef?.(side,i,w.id,node)} className="weapon-tip"/><span className="weapon-sign">{GLYPH[w.seme_trigger]||'◎'}</span>
       </div>;
     })}</div>
     {focusedShip&&ENGINE_KEYS.map(op=><Engine key={op} side={side} op={op} vessel={v}
      target={targets?.[op]} selected={enemy&&selectedTarget===op} onSelect={onTarget} enabled={targetable}
      available={!enemy||availableOps.includes(op)} hit={!!hit&&effect.op===op}
      engineRef={node=>registerEngineRef?.(side,op,node)}/>) }
    </div>;
   })}
   <div className={'engine-thruster '+(enemy?'red':'blue')}/>
  </div>
  <div className={`fleet-picker-inline${ship.fleet.length===1?' single-ship':''}`}>{ship.fleet.map((v,i)=><button key={i} type="button"
   className={focused===i?'focus':''} onClick={()=>onSelectShip?.(i)}
   disabled={enemy&&phase!=='ready'} title={`${v.name} · ${v.level}`}>
   <span className={`fleet-dot${vesselDestroyed(v)?' lost':''}`}/>{v.name} · L{v.level}</button>)}</div>
  {ship.fleet.every(vesselDestroyed)&&<span className="fleet-eliminated">FLOTTA DISTRUTTA</span>}
 </div>;
}
function Pips({ship}){return <div className="pips">{ship.fleet.map((v,i)=><span key={i} className={vesselDestroyed(v)?'broken':'good'}/>)}</div>}
function rootCoords(root,node){return root&&node?boardPoint(root.getBoundingClientRect(),node.getBoundingClientRect()):null;}
function Projectile({effect,rootRef,engineRefs,gunRefs}){
 const [geometry,setGeometry]=useState(null);
 useLayoutEffect(()=>{
  // Measurements happen AFTER React has committed a change of focused ship.
  // Before this fix the enemy could fire at the engine of the previously displayed ship.
  const targetSide=effect?.side==='player'?'enemy':'player';
  const target=rootCoords(rootRef.current,engineRefs.current[targetSide][effect?.op]);
  if(!effect||!target){setGeometry(null);return;}
  const shots=effect.volleys.filter(x=>x.bullets>0).flatMap((s,i)=>{
   const gun=gunRefs.current[effect.side][`${s.vesselIndex}/${s.weaponId}`];
   const source=rootCoords(rootRef.current,gun);
   if(!source)return [];
   const [x,y]=source,dx=target[0]-x,dy=target[1]-y;
   return [{s,i,x,y,dx,dy,count:Math.max(0,Math.min(26,s.bullets)),
    bulletColor:bulletColors[s.suit]||'#e8ffff'}];
  });
  setGeometry({target,shots});
 },[effect,rootRef,engineRefs,gunRefs]);
 if(!effect||!geometry)return null;
 const {target,shots}=geometry;
 return <div className={`vfx-layer${effect.destroyed?' motor-break':''}`} aria-hidden="true">
 {shots.flatMap(({s,i,x,y,dx,dy,count,bulletColor})=>{
  const spread=count>1?250/Math.max(1,count-1):0;
  const start=i*.06;
  return Array.from({length:count},(_,j)=><span key={`${i}/${j}`}
   className={`tracer-shell tracer-${s.suit==='*'?'all':s.suit.toLowerCase()}`}
   style={{left:x,top:y,'--dx':`${dx}px`,'--dy':`${dy}px`,'--bullet':bulletColor,
   '--delay':`${(start*1000+j*spread)/1000}s`,
   '--angle':`${Math.atan2(dy,dx)*180/Math.PI}deg`}}><i className="tracer-core"/></span>);
 })}
 {effect.damage>0&&<>
  <img className="impact delayed-impact" src={`${URL}impact.png`} style={{left:target[0]-67,top:target[1]-67,'--impact-color':'#9eeaff','--impact-delay':`${effect.arrivalMs}ms`}} alt=""/>
  <div className="impact-ring delayed-impact" style={{left:target[0]-48,top:target[1]-48,borderColor:effect.primaryColor||'#ffdf83','--impact-delay':`${effect.arrivalMs}ms`}}/>
  <div className="impact-number delayed-impact" style={{left:target[0]-52,top:target[1]-64,color:effect.primaryColor||'#ffdf83','--impact-delay':`${effect.arrivalMs}ms`}}>−{effect.damage}</div>
 </>}
 {shots.length===0&&<div className="charge-notice">MUNIZIONI IN CARICA</div>}
 </div>;
}
function Hand({cards,selected,onSelect,disabled}){return <div className="hand" aria-label="Le tue sette carte">{cards.map((c,i)=><button key={c.id} title={`${label(c.value)} ${c.suit}`} disabled={disabled} className={'number-card'+(selected.includes(i)?' active':'')} style={{'--suit':suits[c.suit]}} onClick={()=>onSelect(i)}><span className="card-suit">{c.suit}</span><strong>{label(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}</div>}
function Formula({game}){
 const [a,b]=game.selected.map(i=>game.player.hand[i]);
 const goal=game.targets[game.target];
 const inspection=a&&b?inspectCalculation(game.target,a.value,b.value,goal):null;
 const preview=inspection?.valid?previewVolley(game.player,[a,b]):null;
 const alternative=a&&b&&!inspection.valid?supportedOperators(game.player).find(op=>op!==game.target&&game.enemy.fleet[game.targetShip]?.engines[op]?.hp>0&&evaluatePair(op,a.value,b.value,game.targets[op])):null;
 const fmt=v=>Number.isInteger(v)?String(v):Number.isFinite(v)?String(Math.round(v*100)/100).replace('.',','):'—';
 return <div className={`formula${inspection?.valid?' valid':inspection?' invalid':''}`} aria-live="polite">
   <span>{inspection?`${label(inspection.a)} ${META[game.target].sign} ${label(inspection.b)} = ${fmt(inspection.result)}`:`${META[game.target].sign} ${goal}`}</span>
   <small>{inspection?.valid?(preview.totalDamage?`BERSAGLIO ${goal} ✓ · FUOCO ${preview.totalDamage} HP`: `BERSAGLIO ${goal} ✓ · CARICA / NESSUN COLPO`):inspection?(alternative?`BERSAGLIO ${goal} ✗ · USA ${META[alternative].sign} ${game.targets[alternative]}`:`BERSAGLIO ${goal} ✗ · RISULTATO ${fmt(inspection.result)}`):'SELEZIONA DUE CARTE'}</small>
  </div>;
}
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
 const rootRef=useRef(null);
 const shipRefs=useRef({player:{},enemy:{}});
 const engineRefs=useRef({player:{},enemy:{}});
 const gunRefs=useRef({player:{},enemy:{}});
 const gameRef=useRef(game);gameRef.current=game;
 const registerShipRef=(side,index,node)=>{if(node)shipRefs.current[side][index]=node; else delete shipRefs.current[side][index];};
 const registerEngineRef=(side,op,node)=>{if(node)engineRefs.current[side][op]=node; else delete engineRefs.current[side][op];};
 const registerGunRef=(side,index,id,node)=>{const key=`${index}/${id}`;if(node)gunRefs.current[side][key]=node;else delete gunRefs.current[side][key];};const [help,setHelp]=useState(false),[fleetMenu,setFleetMenu]=useState(false),[message,setMessage]=useState('');const queue=useRef([]),resultClaimed=useRef(false);
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
  // Retarget after destruction: never keep selecting a knocked-out engine.
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  if(next){
   const changed=next.targetShip!==b.targetShip||next.target!==b.target;
   b.targetShip=next.targetShip;b.target=next.target;
   if(changed)b.notice=`Motore ${META[next.target].sign} selezionato: ${b.enemy.fleet[next.targetShip].name}`;
  }else if(b.actor==='player')b.notice='Nessun motore nemico attaccabile: passa il turno';
  return b;
 }
 function fire(side,move){const b=gameRef.current;if(b.phase==='finished'||b.phase==='animating'||b.actor!==side)return;
  const attackShip=b[side],receiver=side==='player'?'enemy':'player',defShip=b[receiver],goal=b.targets[move.op],cards=[attackShip.hand[move.i],attackShip.hand[move.j]];
  if(cards.some(x=>!x)){if(side==='player')notice('Seleziona due carte valide');return;}
  if(!supportedOperators(attackShip).includes(move.op)){if(side==='player')notice('Operazione non sbloccata: serve una nave con quel motore operativo');return;}
  const proof=inspectCalculation(move.op,cards[0].value,cards[1].value,goal);
  if(!proof.valid){if(side==='player')notice(`${label(proof.a)} ${META[move.op].sign} ${label(proof.b)} = ${Number.isInteger(proof.result)?proof.result:Math.round(proof.result*100)/100}. Bersaglio: ${goal}`);return;}
  const index=move.targetShip??0,e=defShip.fleet[index]?.engines[move.op];if(!e||e.hp<=0){if(side==='player')notice('Motore non disponibile');return;}
  const strike=dealHit(defShip,attackShip,move.op,goal,cards,index);
  const timing=volleyTimeline(strike.volley);
  const strongest=[...strike.volley].sort((a,b)=>(b.damage||0)-(a.damage||0))[0];
  const anim={...clone(b),...(side==='enemy'?{shownPlayer:index}:{targetShip:index}),phase:'animating',selected:[],effect:{side,op:move.op,targetShip:index,damage:strike.damage,destroyed:strike.destroyed,volleys:strike.volley,arrivalMs:timing.arrivalMs,primaryColor:bulletColors[strongest?.suit]||'#ffdf83',shipCount:attackShip.fleet.length,sourceFocus:side==='player'?b.shownPlayer:b.targetShip}};
  write(anim);tone(strike.damage>0?'shot':'click');
  later(()=>{const active=gameRef.current;if(active.phase!=='animating')return;const next=clone(active),attacker=next[side];const used=[attacker.hand[move.i],attacker.hand[move.j]];
   const impact=dealHit(next[receiver],attacker,move.op,goal,used,index);next[side]=consumeAttack(impact.attacker,[move.i,move.j]);next[receiver]=impact.defender;
   next.logs=[`${side==='player'?'TU':'IA'}: ${used[0].value}${used[0].suit} ${META[move.op].sign} ${used[1].value}${used[1].suit} = ${goal} — ${impact.damage} HP`,...next.logs].slice(0,6);
   write(transition(next,side));
  },timing.settleMs);
 }
 function attack(){const b=gameRef.current;if(b.phase!=='ready'||b.actor!=='player')return;
  const next=nextAttackTarget(b.player,b.enemy,b.targetShip,b.target);
  if(!next){notice('Nessun motore nemico attaccabile');return;}
  if(next.targetShip!==b.targetShip||next.target!==b.target){
   write({...b,...next});notice('Bersaglio distrutto: motore successivo selezionato');return;
  }
  if(b.selected.length!==2){notice('Seleziona due carte');return;}
  fire('player',{op:b.target,targetShip:b.targetShip,i:b.selected[0],j:b.selected[1]});}
 function pick(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;const next=clone(b);next.selected=next.selected.includes(i)?next.selected.filter(x=>x!==i):next.selected.length>=2?[next.selected[1],i]:[...next.selected,i];write(next);tone('click');}
 function selectEngine(op){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;if(!supportedOperators(b.player).includes(op)){notice('La tua flotta non ha ancora questo motore operativo');return;}if((b.enemy.fleet[b.targetShip]?.engines[op]?.hp||0)<=0)return;write({...b,target:op});}
 function chooseEnemy(i){const b=gameRef.current;if(b.actor!=='player'||b.phase!=='ready')return;
  const v=b.enemy.fleet[i];if(!v||vesselDestroyed(v))return;
  const target=nextAttackTarget(b.player,b.enemy,i,b.target);
  if(!target||target.targetShip!==i){notice('Questa nave non ha motori attaccabili con le operazioni disponibili');return;}
  write({...b,...target});}
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
  <div ref={rootRef} className="es-root" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <div className="space-back" style={{backgroundImage:`url('${URL}space_battle_bg.jpg')`}}/>
   <div className="top-brand">ECLISSI <b>STELLARE</b></div>
   <div className="toolbar"><button onClick={()=>setHelp(true)} aria-label="Regole">?</button><button onClick={()=>{if(game.round===1&&game.player.discard.length===0)setFleetMenu(true);else notice('La flotta si configura prima del primo attacco');}} title="Flotta di prova" aria-label="Flotta">⚙</button><button className="math-exit" onClick={()=>{if(game.phase==='finished'||window.confirm('Abbandonare la battaglia?'))exitBattle()}} aria-label="Torna al menu">⌂</button></div>
   <div className="enemy-status"><div className="portrait">◆</div><div><b>AVVERSARIO {displaySector&&`• ${displaySector}`}</b><small>INTEGRITÀ FLOTTA {Math.round(healthScore(game.enemy)*100)}%</small></div><Pips ship={game.enemy}/></div>
   <Ship side="enemy" ship={game.enemy} targets={game.actor==='player'?game.targets:null} focused={game.targetShip} onSelectShip={chooseEnemy} selectedTarget={game.target} onTarget={selectEngine} phase={game.phase} effect={game.effect} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   <div className="center-bar"><span className="round-tag">TURNO {game.round}</span><div className={'timer-pill'+(game.seconds<=10?' urgent':'')}><strong>{game.actor==='player'?`${game.seconds}s`:game.actor==='enemy'?'AVVERSARIO':'COLPO'}</strong></div></div>
   <Ship side="player" ship={game.player} targets={game.actor==='enemy'?game.targets:null} focused={game.shownPlayer} onSelectShip={i=>write({...gameRef.current,shownPlayer:i})} phase="idle" effect={game.effect} availableOps={availableOps} registerShipRef={registerShipRef} registerEngineRef={registerEngineRef} registerGunRef={registerGunRef}/>
   <div className="deck left"><div className="deck-graphic">✦</div><small>MAZZO</small><strong>{game.player.deck.length}</strong></div><div className="deck right"><div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{game.player.discard.length}</strong></div>
   <Hand cards={game.player.hand} selected={game.selected} onSelect={pick} disabled={game.phase!=='ready'||game.actor!=='player'}/>
   <div className="play-controls"><Formula game={game}/><button className="es-button attack" onClick={attack} disabled={game.phase!=='ready'}>ATTACCA ➤</button></div>
   <div className="utility-bar"><button onClick={()=>change(false)} disabled={game.phase!=='ready'}>CAMBIA <b>{game.player.sacrifices}/3</b></button><button onClick={()=>change(true)} disabled={game.phase!=='ready'||!game.player.ether}>ETERE <b>{game.player.ether}</b></button><button onClick={pass} disabled={game.phase!=='ready'}>PASSA »</button><button onClick={()=>{if(game.round===1&&!game.player.discard.length)setFleetMenu(true);else setHelp(true)}}>FLOTTA ⚙</button></div>
   <div className="player-status"><b>TU</b><span className="my-hp">FLOTTA {Math.round(healthScore(game.player)*100)}%</span><Pips ship={game.player}/><small>{message||game.notice}</small></div>
   {game.effect&&<Projectile effect={game.effect} rootRef={rootRef} engineRefs={engineRefs} gunRefs={gunRefs}/>}
   {game.phase==='finished'&&<div className="modal-shade"><div className="result-card"><h1>{game.winner==='player'?'VITTORIA':game.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{game.reason}</p><div className="result-score"><span>TUA FLOTTA <b>{Math.round(healthScore(game.player)*100)}%</b></span><span>AVVERSARIO <b>{Math.round(healthScore(game.enemy)*100)}%</b></span></div><button className="es-button primary" onClick={exitBattle}>CONFERMA E TORNA</button></div></div>}
   {help&&<div className="modal-shade"><div className="help-card"><h2>REGOLE DEL DUELLO</h2><p>Ogni nave monta inizialmente + e −; alcuni modelli sbloccano × e ÷. Tutti i motori installati devono essere distrutti per eliminare una nave. Vinci distruggendo tutta la flotta nemica.</p><p>Ogni turno dura 60 secondi. Tocca una nave nemica, scegli uno dei suoi motori e seleziona due carte. A=1, J=11, Q=12, K=13; la sottrazione e la divisione possono invertire le carte, ma la divisione deve essere esatta. Il risultato esatto fa scattare tutte le armi della flotta attivate dai semi delle carte.</p><p>I VALORI delle carte sono proiettili: 8♣ × 3♦ = 24 significa 8 proiettili ♣ e 3 ♦; il 24 sblocca il tiro, non è il danno. L'arma determina il danno per proiettile. Alcune armi accumulano munizioni.</p><p>La nave universale spara con qualsiasi seme ma ha poca potenza. Il primo cambio carta dà +3 HP al nemico, il secondo costa 3 secondi e il terzo −3 HP a te. A mazzo esaurito prevale l'integrità percentuale della flotta.</p><p>⚙ FLOTTA è una selezione di prova per la fase 1: non modifica acquisti o salvataggi dello Shop R12.</p><button className="es-button primary" onClick={()=>setHelp(false)}>CHIUDI</button></div></div>}
   {fleetMenu&&<FleetSetup selected={fleetIds} setSelected={setFleetIds} level={testLevel} setLevel={setTestLevel} onClose={()=>setFleetMenu(false)} onStart={restartWithFleet} sector={sectorNumber}/>}
  </div>
 </div>;
}
