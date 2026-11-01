import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ENGINE_KEYS, META, TOTAL_LEVELS, campaignInfo,
  initialBattle, evaluatePair, aiChoose, dealHit, consumeAttack,
  sacrificeCard, etherChange, isDestroyed, deckExhausted, deckVerdict,
  healthScore, totalHP, generateTargets
} from './mathDuelEngine.js';
import './MathDuelApp.css';

const URL='/assets/mathduel/';
const STORAGE='eclissi_stellare_motor_duel_v1';
const BATTLE_SAVE='eclissi_stellare_active_motor_duel_v1';
const defaultProfile={unlocked:1,credits:120,wins:0,losses:0,best:0,upgrades:{plus:0,minus:0,times:0,divide:0},sound:true};
function readStorage(k,d){try{const x=JSON.parse(localStorage.getItem(k));return x&&typeof x==='object'?x:d;}catch{return d;}}
const suitColors={'♥':'#ff727d','♦':'#ffbd75','♠':'#adceff','♣':'#74eacb'};
function labelValue(v){return v===1?'A':v===11?'J':v===12?'Q':v===13?'K':String(v);}
function engineLabel(k){return `${META[k].sign} ${META[k].name}`;}
function alpha(i){return Math.min(1,Math.max(0,i));}
function playSound(name, enabled){if(!enabled)return;try{
  const ctx = window.__esAudioContext || (window.__esAudioContext=new (window.AudioContext||window.webkitAudioContext)());
  if(ctx.state==='suspended')ctx.resume(); const osc=ctx.createOscillator();const gain=ctx.createGain();
  osc.type=name==='blast'?'sawtooth':name==='error'?'triangle':'sine';let freq=name==='blast'?100:name==='success'?620:name==='error'?155:400;
  osc.frequency.setValueAtTime(freq,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(name==='blast'?45:name==='success'?880:180,ctx.currentTime+.13);
  gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.032,ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.2);
  osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.23);
}catch{}}
function clone(x){return structuredClone(x)}
const pauseText='Le carte non bastano? Cambia fino a tre carte pagando i sacrifici o usa Etere.';
function Button({children,onClick,className='',disabled=false,title,style}){return <button title={title} style={style} onClick={onClick} disabled={disabled} className={'es-button '+className}>{children}</button>}
function Engine({side,op,ship,target,selected,onClick,active,burst}){
 const e=ship.engines[op],dead=e.hp<=0;
 const hp=e.hp/e.max*100;
 const pos={plus:'lt',minus:'rt',times:'lb',divide:'rb'}[op];
 return <button type="button" className={'engine e-'+pos+' e-'+side+(selected?' selected':'')+(dead?' dead':'')+(active?' clickable':'')+(burst?' hit':'')} onClick={onClick} disabled={!active||dead} aria-label={`${side==='enemy'?'Nemico':'Giocatore'}, ${META[op].name}, bersaglio ${target}, HP ${e.hp} di ${e.max}`}>
  <span className="engine-sign" style={{color: META[op].color}}>{META[op].sign}</span>
  <span className="engine-info"><span className="engine-target">{dead?'DISTRUTTO':active?`${META[op].sign} ${target}`:`${META[op].name}`}</span><span className="engine-health">{e.hp}/{e.max} HP</span><span className="engine-track"><i style={{width:`${hp}%`}}/></span></span>
 </button>
}
function HpPips({ship}){return <div className="pips" title={`Integrità totale: ${Math.round(healthScore(ship)*100)}%`}>{ENGINE_KEYS.map(k=><span key={k} className={ship.engines[k].hp>0?'good':'broken'} />)}</div>}
function Ship({side,ship,targets,selectedTarget,onTarget,phase,effect}){
 const enemy=side==='enemy';
 return <div className={'ship-zone ship-'+side+(effect?.side!==side && effect ?' ship-struck':'')}>
   <div className={'ship-art '+(enemy?'enemy-art':'player-art') }><img draggable="false" src={`${URL}ship_${enemy?'enemy':'player'}.png`} alt={enemy?'Astronave avversaria 3D':'La tua astronave 3D'}/><div className={'engine-thruster '+(enemy?'red':'blue')}/></div>
   {ENGINE_KEYS.map(k=><Engine key={k} side={side} op={k} ship={ship} target={targets?.[k]} selected={enemy&&selectedTarget===k} active={enemy&&phase==='ready'} onClick={()=>onTarget?.(k)} burst={!!effect&&effect.side!==side&&effect.op===k}/>)}
 </div>
}
const ENGINE_COORDS={enemy:{plus:[62,146],minus:[388,146],times:[62,229],divide:[388,229]},player:{plus:[62,392],minus:[388,392],times:[62,484],divide:[388,484]}};
function Effect({effect}){
 if(!effect)return null;
 const source=effect.side==='player'?[225,506]:[225,232];
 const target=ENGINE_COORDS[effect.side==='player'?'enemy':'player'][effect.op];
 const dx=target[0]-source[0],dy=target[1]-source[1];const len=Math.hypot(dx,dy);const angle=Math.atan2(dy,dx)*180/Math.PI;
 const color={plus:'#50d4ff',minus:'#a6ffad',times:'#ffc35b',divide:'#cb87ff'}[effect.op];
 return <div className="vfx-layer" aria-hidden="true"><div className="projectile" style={{left:source[0],top:source[1],width:len,transform:`rotate(${angle}deg)`,'--beam-color':color}}><span/></div><img className="impact" src={`${URL}impact.png`} style={{left:target[0]-70,top:target[1]-70,'--impact-color':color}}/><div className="impact-ring" style={{left:target[0]-50,top:target[1]-50,borderColor:color}}/><div className="impact-number" style={{left:target[0]-52,top:target[1]-78,color}}>{effect.damagePreview ? `−${effect.damagePreview}`:'COLPITO'}</div><div className="vfx-flash" style={{'--beam-color':color}}/></div>
}
function GameCards({cards,selected,onSelect,disabled}){return <div className="hand" aria-label="Le tue sette carte">{cards.map((c,i)=><button title={`${labelValue(c.value)} di ${c.suit}`} key={c.id} disabled={disabled} className={'number-card'+(selected.includes(i)?' active':'')} onClick={()=>onSelect(i)} style={{'--suit':suitColors[c.suit]}}><span className="card-suit">{c.suit}</span><strong>{labelValue(c.value)}</strong><span className="card-suit second">{c.suit}</span></button>)}</div>}
function FireFormula({battle}){
 const sel=battle.selected;
 const [one,two]=sel.map(i=>battle.player.hand[i]);const target=battle.targets[battle.target];
 let check=one&&two?evaluatePair(battle.target,one.value,two.value,target):null;
 return <div className={'formula '+(check?'valid':sel.length===2?'invalid':'')}><span>{check?`${check.a} ${META[battle.target].sign} ${check.b} = ${target}`:one&&two?`${one.value} ${META[battle.target].sign} ${two.value} = ?`:one?`${one.value} ${META[battle.target].sign} ?`:`${META[battle.target].sign} ${target}`}</span><small>{check?'BERSAGLIO CENTRATO':sel.length===2?'NON CORRISPONDE':'SCEGLI 2 CARTE'}</small></div>
}
export default function MathDuelApp(){
 const [scale,setScale]=useState(1);
 const [profile,setProfile]=useState(()=>({...defaultProfile,...readStorage(STORAGE,{})}));
 const [page,setPage]=useState('home');
 const [battle,setBattle]=useState(null);
 const bRef=useRef(battle);bRef.current=battle;
 const [showHelp,setShowHelp]=useState(false);
 const [toast,setToast]=useState('');const timers=useRef([]);
 const [selectedLevel,setSelectedLevel]=useState(1);
 useEffect(()=>{
   function resize(){setScale(Math.max(.3,Math.min(window.innerWidth/450,window.innerHeight/800)));}
   resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)
 },[]);
 useEffect(()=>{try{localStorage.setItem(STORAGE,JSON.stringify(profile));}catch{}},[profile]);
 useEffect(()=>{try{if(battle&&battle.phase!=='finished')localStorage.setItem(BATTLE_SAVE,JSON.stringify({...battle,phase:battle.actor==='player'?'ready':'thinking',effect:null}));else if(battle?.phase==='finished')localStorage.removeItem(BATTLE_SAVE);}catch{}},[battle]);
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 function delay(fn,ms){const id=setTimeout(fn,ms);timers.current.push(id);return id;}
 function inform(msg){setToast(msg);delay(()=>setToast(''),2000);}
 function commit(b){bRef.current=b;setBattle(b);}
 function start(level,mode='campaign'){
   const n=initialBattle(level,mode==='campaign'?profile.upgrades:{},Math.random,mode);
   commit(n);setSelectedLevel(level);setPage('battle');setShowHelp(false);
 }
 function restore(){const saved=readStorage(BATTLE_SAVE,null);if(saved?.player?.engines&&saved?.enemy?.engines&&saved?.phase!=='finished'){saved.effect=null;saved.phase=saved.actor==='player'?'ready':'thinking';saved.selected=[];commit(saved);setPage('battle')}else inform('Non ci sono battaglie da riprendere')}
 const current=battle;
 function finish(b,winner,reason){b.phase='finished';b.actor='none';b.winner=winner;b.reason=reason;b.effect=null;
  const win=winner==='player';let reward=0;
  if(win && b.mode==='campaign'){reward=campaignInfo(b.level).credits;setProfile(p=>({...p,credits:p.credits+reward,wins:p.wins+1,best:Math.max(p.best,b.level),unlocked:Math.min(TOTAL_LEVELS,Math.max(p.unlocked,b.level+1))}));}
  else if(win){reward=18;setProfile(p=>({...p,credits:p.credits+18,wins:p.wins+1}));}
  else if(winner==='enemy')setProfile(p=>({...p,losses:p.losses+1}));
  b.reward=reward;b.logs=[`${winner==='draw'?'PAREGGIO':win?'VITTORIA':'SCONFITTA'}: ${reason}`,...b.logs].slice(0,6);return b;
 }
 function afterAction(b,side){
   if(isDestroyed(b.player))return finish(b,'enemy','Tutti i tuoi motori sono fuori uso');
   if(isDestroyed(b.enemy))return finish(b,'player','Tutti i motori nemici sono distrutti');
   if(deckExhausted(b.player,b.enemy))return finish(b,deckVerdict(b.player,b.enemy),'Carte del mazzo esaurite: confronto integrità delle navi');
   b.selected=[];b.effect=null;
   if(side==='player'){
     b.actor='enemy';b.phase='thinking';b.targets=generateTargets(Math.random,b.level);b.notice='Il computer sta calcolando…';
   } else {
     b.actor='player';b.phase='ready';b.round+=1;b.seconds=60;b.player.sacrifices=0;b.enemy.sacrifices=0;
     // produzione energetica del motore ÷ soltanto quando ancora integro
     if(b.round%5===0&&b.player.engines.divide.hp>0)b.player.ether=Math.min(3,b.player.ether+1);
     b.targets=generateTargets(Math.random,b.level);b.notice='Nuovi bersagli: scegli un motore e due carte.';
   }
   return b;
 }
 function playAttack(side,move){
   const b=bRef.current;
   if(!b||b.phase==='finished'||b.phase==='animating'||(side==='player'&&b.phase!=='ready'))return;
   if(side==='player' && b.actor!=='player')return;
   const attacker=side==='player'?b.player:b.enemy;
   const defender=side==='player'?b.enemy:b.player;
   const pair=evaluatePair(move.op,attacker.hand[move.i]?.value,attacker.hand[move.j]?.value,b.targets[move.op]);
   if(!pair||defender.engines[move.op].hp<=0){if(side==='player'){inform('Calcolo non valido per il bersaglio');playSound('error',profile.sound);}return;}
   const result=dealHit(defender,attacker,move.op,b.targets[move.op]);
   let x=clone(b);x.phase='animating';x.selected=[];x.effect={side,op:move.op,damagePreview:result.damage};x.notice=side==='player'?'Attacco in corso!':'Contrattacco in arrivo!';commit(x);
   playSound('blast',profile.sound);
   delay(()=>{
     let active=bRef.current;
     if(!active||active.phase!=='animating')return;
     let next=clone(active);const atk=side==='player'?next.player:next.enemy;
     const def=side==='player'?next.enemy:next.player;
     const h=dealHit(def,atk,move.op,next.targets[move.op]);
     if(side==='player'){next.player=consumeAttack(atk,[move.i,move.j]);next.enemy=h.defender;}
     else {next.enemy=consumeAttack(atk,[move.i,move.j]);next.player=h.defender;}
     next.logs=[`${side==='player'?'TU':'IA'}: ${pair.a} ${META[move.op].sign} ${pair.b} = ${pair.result}, ${META[move.op].name} −${h.damage} HP${h.destroyed?' • DISTRUTTO':''}`,...next.logs].slice(0,7);
     commit(afterAction(next,side));
     playSound(h.destroyed?'blast':'success',profile.sound);
   },1150);
 }
 function attack(){const b=bRef.current;if(!b||b.phase!=='ready')return;
   if(b.selected.length!==2){inform('Seleziona due carte');return;}
   const move={op:b.target,i:b.selected[0],j:b.selected[1]};playAttack('player',move);
 }
 function selectCard(index){const b=bRef.current;if(!b||b.actor!=='player'||b.phase!=='ready')return;
   const x=clone(b);x.selected=x.selected.includes(index)?x.selected.filter(i=>i!==index):x.selected.length>=2?[x.selected[1],index]:[...x.selected,index];commit(x);playSound('select',profile.sound);
 }
 function selectEngine(k){const b=bRef.current;if(!b||b.actor!=='player'||b.phase!=='ready'||b.enemy.engines[k].hp<=0)return;const x=clone(b);x.target=k;commit(x);playSound('select',profile.sound)}
 function changeCard(ether=false){const b=bRef.current;if(!b||b.actor!=='player'||b.phase!=='ready')return;
  if(b.selected.length!==1){inform('Seleziona UNA carta da cambiare');return;}
  const x=clone(b),index=x.selected[0];
  if(ether){const ship=etherChange(x.player,index);if(!ship){inform('Etere insufficiente o mazzo vuoto');return;}x.player=ship;x.notice='Carta rimpiazzata usando 1 Etere';}
  else {const z=sacrificeCard(x.player,index,x.enemy,x.seconds);if(!z){inform('Massimo 3 sacrifici o mazzo vuoto');return;}x.player=z.ship;x.enemy=z.opponent;x.seconds=z.seconds;x.notice=`Sacrificio ${x.player.sacrifices}/3: ${z.detail}`;}
  x.selected=[];x.logs=[x.notice,...x.logs].slice(0,7);
  if(isDestroyed(x.player))finish(x,'enemy','I sacrifici hanno distrutto la tua nave');
  else if(deckExhausted(x.player,x.enemy))finish(x,deckVerdict(x.player,x.enemy),'Mazzo esaurito durante il cambio');
  commit(x);playSound('select',profile.sound);
 }
 function passTurn(){const b=bRef.current;if(!b||b.actor!=='player'||b.phase!=='ready')return;let x=clone(b);x.logs=['TU: turno passato',...x.logs].slice(0,7);commit(afterAction(x,'player'));}
 // timer di un minuto, soltanto durante il turno umano
 useEffect(()=>{if(page!=='battle'||showHelp||!battle||battle.actor!=='player'||battle.phase!=='ready')return;
  const id=setInterval(()=>{const x=bRef.current;if(!x||x.actor!=='player'||x.phase!=='ready')return;
    if(x.seconds<=1){const n=clone(x);n.seconds=0;n.logs=['Tempo scaduto, turno passato',...n.logs].slice(0,7);commit(afterAction(n,'player'));}
    else commit({...x,seconds:x.seconds-1});
  },1000);return()=>clearInterval(id);
 },[page,showHelp,battle?.actor,battle?.phase]);
 // L'IA seleziona solo combinazioni che possiede; se necessario cambia carte rispettando i sacrifici.
 useEffect(()=>{if(page!=='battle'||!battle||battle.actor!=='enemy'||battle.phase!=='thinking')return;
  const id=delay(()=>{
   let x=clone(bRef.current);if(x?.actor!=='enemy'||x.phase!=='thinking')return;
   let move=aiChoose(x.enemy,x.player,x.targets,Math.random);
   if(!move && x.enemy.sacrifices<3&&x.enemy.deck.length){
     const z=sacrificeCard(x.enemy,Math.floor(Math.random()*x.enemy.hand.length),x.player,60);
     if(z){x.enemy=z.ship;x.player=z.opponent;x.logs=[`IA cambia carta (${z.detail})`,...x.logs].slice(0,7);move=aiChoose(x.enemy,x.player,x.targets,Math.random);}
   }
   if(isDestroyed(x.enemy)){commit(finish(x,'player','Il nemico ha esaurito i suoi motori'));return;}
   if(deckExhausted(x.player,x.enemy)){commit(finish(x,deckVerdict(x.player,x.enemy),'Mazzo esaurito'));return;}
   if(move){commit(x);playAttack('enemy',move)}else{x.logs=['IA: nessun calcolo possibile, passa',...x.logs].slice(0,7);commit(afterAction(x,'enemy'));}
  },1400);return()=>clearTimeout(id);
 },[page,battle?.actor,battle?.phase,battle?.round]);
 function upgrade(k){const price=65+(profile.upgrades[k]||0)*45;if(profile.credits<price){inform('Crediti insufficienti');return;}if((profile.upgrades[k]||0)>=5){inform('Potenziamento massimo');return;}
   setProfile(p=>({...p,credits:p.credits-price,upgrades:{...p.upgrades,[k]:p.upgrades[k]+1}}));playSound('success',profile.sound);
 }
 const review=battle?.winner==='player';
 return <div className="game-viewport"><div className="es-root" style={{transform:`translate(-50%, -50%) scale(${scale})`}}>
   <div className="space-back" style={{backgroundImage:`url('${URL}space_battle_bg.jpg')`}}/>
   {page==='battle'&&battle ? <>
    <div className="top-brand">ECLISSI <b>STELLARE</b><small>DUELLO MATEMATICO SPAZIALE</small></div>
    <div className="toolbar"><button onClick={()=>setShowHelp(true)} aria-label="Aiuto">?</button><button onClick={()=>setProfile(p=>({...p,sound:!p.sound}))} aria-label="Audio">{profile.sound?'♪':'×'}</button><button onClick={()=>setPage('home')} aria-label="Menu">⌂</button></div>
    <div className="enemy-status"><div className="portrait">◈</div><div><b>{battle.mode==='campaign'?campaignInfo(battle.level).name:'AVVERSARIO IA'}</b><small>INTEGRITÀ {Math.round(healthScore(battle.enemy)*100)}% · MOTORI {ENGINE_KEYS.filter(k=>battle.enemy.engines[k].hp>0).length}/4</small></div><HpPips ship={battle.enemy}/></div>
    <Ship side="enemy" ship={battle.enemy} targets={battle.actor==='player'?battle.targets:null} selectedTarget={battle.target} onTarget={selectEngine} phase={battle.phase} effect={battle.effect}/>
    <div className="center-bar"><span className="round-tag">ROUND {battle.round}</span><div className={'timer-pill'+(battle.seconds<=10?' urgent':'')}>{battle.actor==='player'?'TURNO TUO':battle.actor==='enemy'?'TURNO IA':'RISOLUZIONE'} <strong>{battle.actor==='player'?`${String(Math.floor(battle.seconds/60)).padStart(2,'0')}:${String(battle.seconds%60).padStart(2,'0')}`:'···'}</strong></div></div>
    <Ship side="player" ship={battle.player} targets={battle.actor==='enemy'?battle.targets:null} selectedTarget={null} phase="off" effect={battle.effect}/>
    <div className="deck left"><div className="deck-graphic">✦</div><small>MAZZO</small><strong>{battle.player.deck.length}</strong></div>
    <div className="deck right"><div className="deck-graphic trash">▤</div><small>SCARTI</small><strong>{battle.player.discard.length}</strong></div>
    <GameCards cards={battle.player.hand} selected={battle.selected} onSelect={selectCard} disabled={battle.phase!=='ready'}/>
    <div className="play-controls"><FireFormula battle={battle}/><Button className="attack" onClick={attack} disabled={battle.phase!=='ready'}>ATTACCA <span>➤</span></Button></div>
    <div className="utility-bar"><button onClick={()=>changeCard(false)} disabled={battle.phase!=='ready'}>CAMBIA <b>{battle.player.sacrifices}/3</b></button><button onClick={()=>changeCard(true)} disabled={battle.phase!=='ready'}>ETERE <b>{battle.player.ether}</b></button><button onClick={passTurn} disabled={battle.phase!=='ready'}>PASSA <b>»</b></button><button onClick={()=>setShowHelp(true)}>REGOLAMENTO <b>?</b></button></div>
    <div className="player-status"><b>TU</b><span className="my-hp">NAVE {Math.round(healthScore(battle.player)*100)}%</span><HpPips ship={battle.player}/><small>{battle.notice}</small></div>
    {battle.effect&&<Effect effect={battle.effect}/>}
    {battle.phase==='finished'&&<div className="modal-shade"><div className="result-card"><span className="result-icon">{battle.winner==='player'?'✦':battle.winner==='draw'?'◇':'✕'}</span><h1>{battle.winner==='player'?'VITTORIA':battle.winner==='draw'?'PAREGGIO':'SCONFITTA'}</h1><p>{battle.reason}</p><div className="result-score"><span>La tua nave <b>{Math.round(healthScore(battle.player)*100)}%</b></span><span>Nemico <b>{Math.round(healthScore(battle.enemy)*100)}%</b></span></div>{battle.reward>0&&<p>+{battle.reward} crediti ottenuti</p>}<Button className="primary" onClick={()=>start(battle.level,battle.mode)}>RIVINCITA</Button>{review&&battle.mode==='campaign'&&battle.level<TOTAL_LEVELS&&<Button onClick={()=>start(battle.level+1,'campaign')}>SETTORE SUCCESSIVO</Button>}<Button onClick={()=>setPage('home')}>TORNA ALLA BASE</Button></div></div>}
   </> : <>
    <div className="menu-logo">ECLISSI<br/><b>STELLARE</b><small>DUELLO MATEMATICO SPAZIALE</small></div>
    <div className="menu-showcase"><img className="menu-enemy" src={`${URL}ship_enemy.png`}/><img className="menu-player" src={`${URL}ship_player.png`}/><div className="menu-ambient">✦</div></div>
    {page==='home'&&<div className="menu-panel"><div className="panel-head">BASE STELLARE <span>✦ {profile.credits} CREDITI</span></div><p>Neutralizza tutti e quattro i motori nemici. Ogni bersaglio richiede una diversa operazione matematica.</p><Button className="primary" onClick={()=>{setPage('missions');setSelectedLevel(Math.min(profile.unlocked,TOTAL_LEVELS));}}>CAMPAGNA • SETTORE {profile.unlocked}</Button><Button onClick={()=>start(Math.max(1,Math.min(profile.unlocked,8)),'duel')}>BATTAGLIA RAPIDA CONTRO IA</Button><Button onClick={()=>setPage('hangar')}>HANGAR E POTENZIAMENTI</Button><Button onClick={()=>setShowHelp(true)}>COME SI GIOCA</Button>{readStorage(BATTLE_SAVE,null)&&<Button onClick={restore}>RIPRENDI BATTAGLIA</Button>}<div className="small-stats">Vittorie {profile.wins} · Sconfitte {profile.losses} · Settore massimo {profile.best}</div></div>}
    {page==='missions'&&<div className="menu-panel wide"><div className="panel-head">CAMPAGNA <span>30 SETTORI • 6 GALASSIE</span></div><div className="mission-grid">{Array.from({length:TOTAL_LEVELS},(_,i)=>i+1).map(n=><button key={n} disabled={n>profile.unlocked} onClick={()=>setSelectedLevel(n)} className={(selectedLevel===n?'active ':'')+(n%5===0?'boss ':'')+(n>profile.unlocked?'locked':'')}>{n%5===0?'★ ':''}{n}</button>)}</div><p>SETTORE {selectedLevel}: {campaignInfo(selectedLevel).name}. Ricompensa: {campaignInfo(selectedLevel).credits} crediti.</p><Button className="primary" disabled={selectedLevel>profile.unlocked} onClick={()=>start(selectedLevel,'campaign')}>AVVIA MISSIONE</Button><Button onClick={()=>setPage('home')}>INDIETRO</Button></div>}
    {page==='hangar'&&<div className="menu-panel wide"><div className="panel-head">HANGAR <span>✦ {profile.credits} CREDITI</span></div><p>Rinforza i quattro motori della tua nave. Ogni livello aggiunge 7 HP al motore corrispondente nelle missioni.</p>{ENGINE_KEYS.map(k=><div className="hangar-row" key={k}><div><b style={{color:META[k].color}}>{engineLabel(k)}</b><small>Livello {profile.upgrades[k]||0}/5</small></div><Button disabled={(profile.upgrades[k]||0)>=5||profile.credits<65+(profile.upgrades[k]||0)*45} onClick={()=>upgrade(k)}>+7 HP · ✦ {65+(profile.upgrades[k]||0)*45}</Button></div>)}<Button onClick={()=>setPage('home')}>TORNA ALLA BASE</Button></div>}
   </>}
   {showHelp&&<div className="modal-shade"><div className="help-card"><h2>COME SI GIOCA</h2><p>Ogni nave ha quattro motori: <b>+</b> Scudi, <b>−</b> Evasione, <b>×</b> Attacco, <b>÷</b> Energia. Ciascun motore ha HP indipendenti.</p><p><b>1.</b> Tocca un motore nemico e leggi il suo bersaglio. <b>2.</b> Seleziona due delle sette carte. <b>3.</b> Se il calcolo raggiunge il numero, premi ATTACCA. Il bersaglio cambia a ogni turno.</p><p><b>Durata:</b> 60 secondi per il tuo turno; un colpo valido lo conclude. Il computer usa soltanto le carte nella sua mano.</p><p><b>Cambi:</b> fino a 3 per turno, con penalità progressive: −3 HP alla tua nave, −3 secondi, +3 HP alla nave nemica. Etere cambia una carta senza sacrificio.</p><p><b>Vittoria:</b> distruggi tutti e quattro i motori. Se il mazzo di una nave finisce, vince quella con la percentuale di integrità più alta; a parità, pareggio.</p><p><b>Sistemi:</b> scudi ed evasione limitano i danni, il motore d'attacco li potenzia, quello energia ricarica Etere ogni cinque round. Questi bonus cessano quando il motore viene distrutto.</p><Button className="primary" onClick={()=>setShowHelp(false)}>HO CAPITO</Button></div></div>}
   {toast&&<div className="toast">{toast}</div>}
 </div></div>
}
