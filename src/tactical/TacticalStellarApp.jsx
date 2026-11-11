import React, { useEffect, useRef, useState } from 'react';
import Core from './engine.js';
import DeepSpaceUniverseCanvas from '../DeepSpaceUniverseCanvas.jsx';

const KEY = 'eclissi_stellare_react_tattica_2_1';
const read = (key, fallback) => { try { const raw=localStorage.getItem(`${KEY}:${key}`); return raw?JSON.parse(raw):fallback; } catch { return fallback; } };
const clone = (o) => structuredClone(o);
const dateKey = () => new Date().toLocaleDateString('en-CA');
const pct = (value,max) => `${Math.max(0,Math.min(100,max?value/max*100:0))}%`;
const signed = n => n>0?`+${n}`:String(n);

function SvgShip({enemy=false, boss=false, glow=false}) {
  return <svg className={`stellar-ship-svg ${enemy?'foe':''} ${glow?'glowing':''}`} viewBox="0 0 340 160" role="img" aria-label={enemy?'Nave avversaria':'Nave del giocatore'}>
    <defs><linearGradient id={enemy?'hullF':'hullP'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={enemy?'#a36d75':'#7191bd'}/><stop offset=".35" stopColor="#1c3457"/><stop offset="1" stopColor={enemy?'#442237':'#0b243b'}/></linearGradient><filter id={enemy?'glowF':'glowP'}><feGaussianBlur stdDeviation="4"/></filter></defs>
    <path d="M170 8 L202 60 L296 92 L324 137 L225 129 L205 151 L136 151 L115 129 L16 137 L44 92 L138 60 Z" fill={`url(#${enemy?'hullF':'hullP'})`} stroke={enemy?'#ff8b9f':'#5cc9ec'} strokeWidth="2.5"/>
    <path d="M170 16 L192 74 L207 130 L170 150 L133 130 L148 74 Z" fill="#111c32" stroke="#6997b6" strokeWidth="1.5"/>
    <path d="M170 25 L188 82 L170 115 L152 82 Z" fill={enemy?'#d56683':'#68d5f7'} opacity=".82"/>
    <path d="M58 112 L129 94 M211 94 L282 112" stroke="#89b4d7" strokeWidth="8" opacity=".5"/>
    {[87,253].map(x=><g key={x}><rect x={x-13} y="79" width="26" height="33" rx="7" fill="#1e3150" stroke="#85b9dc"/><path d={`M${x-5} 80 L${x-5} 50 L${x+5} 50 L${x+5} 80`} fill="#2a4869" stroke="#78def6" strokeWidth="2"/><circle cx={x} cy="77" r="7" fill={enemy?'#ff9bae':'#82f3ff'} /></g>)}
    <path d="M121 133 L133 156 L150 133 M190 133 L207 156 L219 133" fill="none" stroke={enemy?'#ff7288':'#69eaf8'} strokeWidth="7" strokeLinecap="round"/>
    {boss&&<path d="M96 86 L65 33 L123 55 M244 86 L275 33 L217 55" stroke="#ffbd70" strokeWidth="5" fill="none"/>}
  </svg>;
}
function IconButton({children,onClick,className='',disabled=false,title=''}) {return <button type="button" title={title} className={`es-btn ${className}`} onClick={onClick} disabled={disabled}>{children}</button>}
function HpBar({label,hp,max,shield=0,enemy=false}) {return <div className="es-hp"><div className="es-hp-head"><strong>{label}</strong><span>{Math.ceil(hp)} / {max} HP</span></div><div className="es-progress"><i style={{width:pct(hp,max),background:enemy?'linear-gradient(90deg,#e05a78,#ffbc89)':'linear-gradient(90deg,#28c59d,#77f6d4)'}}/></div><div className="es-hp-shield">⬡ SCUDO {shield}</div></div>}
function SectionHead({eyebrow,title,desc}) {return <header className="es-section-head"><span>{eyebrow}</span><h2>{title}</h2>{desc&&<p>{desc}</p>}</header>}

export default function TacticalStellarApp() {
  const [profile,setProfile] = useState(()=>Core.loadProfile(read('profile',null)));
  const [battle,setBattle] = useState(()=>read('battle',null));
  const [screen,setScreen] = useState('home');
  const [modal,setModal]=useState(null);
  const [selectedSystem,setSelectedSystem]=useState(0);
  const [notice,setNotice]=useState('');
  const [impact,setImpact]=useState(null);
  const timerStamp=useRef(Date.now());
  const pendingPersist=useRef(null);
  const lastSaved=useRef(0);
  const playerTurn=screen==='battle'&&battle?.phase==='player'&&!battle?.over&&!modal;
  const notify=(msg)=>setNotice(msg);

  useEffect(()=>{if(!notice)return;const timeout=setTimeout(()=>setNotice(''),2800);return ()=>clearTimeout(timeout);},[notice]);
  useEffect(()=>{if(!impact)return;const timeout=setTimeout(()=>setImpact(null),950);return ()=>clearTimeout(timeout);},[impact]);
  useEffect(()=>{
    const save=()=>{try{localStorage.setItem(`${KEY}:profile`,JSON.stringify(profile));localStorage.setItem(`${KEY}:battle`,JSON.stringify(battle));lastSaved.current=Date.now();}catch{/* spazio locale non disponibile */}};
    const delay=Math.max(0,900-(Date.now()-lastSaved.current));
    if(delay===0)save();else pendingPersist.current=setTimeout(save,delay);
    const flush=()=>save();
    window.addEventListener('pagehide',flush);
    return ()=>{clearTimeout(pendingPersist.current);window.removeEventListener('pagehide',flush);};
  },[profile,battle]);
  useEffect(()=>{timerStamp.current=Date.now();},[screen,modal]);
  useEffect(()=>{
    if(!playerTurn)return;
    let stamp=Date.now();
    const interval=setInterval(()=>{
      const now=Date.now(), elapsed=(now-stamp)/1000;stamp=now;
      if(document.hidden)return;
      const delta=Math.min(1.1,Math.max(0,elapsed));
      setBattle(prev=>{
        if(!prev||prev.phase!=='player'||prev.over)return prev;
        const next={...prev,turnRemaining:Math.max(0,prev.turnRemaining-delta)};
        if(next.turnRemaining===0)Core.passTurn(next,'Tempo esaurito');
        return next;
      });
    },200);
    return ()=>clearInterval(interval);
  },[playerTurn]);

  const finishBattle=(b, baseProfile=profile)=>{
    const p=clone(baseProfile);
    if(!b.result?.etherSettled){
      if(b.mode!=='training'&&b.sector>=15)p.ether=Math.min(99,p.ether+b.player.ether);
      b.result.etherSettled=true;
    }
    if(b.result.win)Core.reward(p,b);else Core.recordDefeat(p,b);
    setProfile(p);setBattle({...b});setModal(null);setScreen('result');
  };
  useEffect(()=>{
    if(screen!=='battle'||!battle||battle.phase!=='enemy'||battle.over||modal)return;
    const id=setTimeout(()=>{
      const next=clone(battle);
      const output=Core.enemyTurn(next,profile);
      if(output.hit)setImpact({kind:'hurt',damage:output.damage});
      if(next.over)finishBattle(next);else setBattle(next);
    },900);
    return ()=>clearTimeout(id);
  // Depend only on phase changes: battle timer does not tick while enemy acts.
  },[screen,battle?.phase,battle?.round,battle?.id,modal]);

  const start=(mode='campaign',sector=profile.sector,difficulty='normal')=>{
    const p=clone(profile);
    const b=Core.newBattle(p,{mode,sector,difficulty});
    if(sector>=15&&mode!=='training'){
      const charge=Math.min(6,p.ether);
      p.ether-=charge;b.player.ether=charge;
    }
    setProfile(p);setBattle(b);setScreen('battle');setModal(null);setImpact(null);timerStamp.current=Date.now();
  };
  const resume=()=>{if(!battle||battle.over)return;setScreen('battle');setModal(null);timerStamp.current=Date.now();};
  const quit=()=>{
    if(!battle||battle.over){setScreen('home');setModal(null);return;}
    const b=clone(battle);b.over=true;b.phase='defeat';b.result={win:false,reason:'Ritirata'};finishBattle(b);
  };
  const updateProfile=(fn)=>{const p=clone(profile);const r=fn(p);if(r?.ok===false){notify(r.error);return;}setProfile(p);if(r?.ok)notify('Aggiornamento completato');};
  const changeBattle=(fn)=>{
    if(!battle||battle.over||battle.phase!=='player'||modal)return;
    const b=clone(battle),p=clone(profile);const out=fn(b,p);
    if(out?.ok===false){notify(out.error);return;}
    if(b.over){finishBattle(b,p);return;}
    setProfile(p);setBattle(b);
  };
  const selectCard=id=>changeBattle(b=>{
    const a=b.selected.indexOf(id);if(a>=0)b.selected.splice(a,1);else if(b.selected.length<4)b.selected.push(id);else return {ok:false,error:'Puoi scegliere al massimo quattro carte.'};return {ok:true};
  });
  const selectTarget=idx=>changeBattle(b=>{b.selectedTarget=idx;return {ok:true};});
  const attack=()=>changeBattle((b,p)=>{const outcome=Core.attack(b,p);if(outcome.ok)setImpact({kind:'hit',damage:outcome.damage,op:outcome.op});return outcome;});
  const exchange=byEther=>changeBattle((b,p)=>Core.exchange(b,p,byEther));
  const pass=()=>changeBattle(b=>Core.passTurn(b));
  const navigate=to=>{setScreen(to);setModal(null);};
  useEffect(()=>{
    const listener=(event)=>{
      if(screen!=='battle'||modal||battle?.phase!=='player')return;
      if(event.key==='Escape'){event.preventDefault();setModal('pause');}
      if(event.key==='Enter'){event.preventDefault();attack();}
      if(/^[1-7]$/.test(event.key)){const card=battle.hand[Number(event.key)-1];if(card){event.preventDefault();selectCard(card.id);}}
    };
    window.addEventListener('keydown',listener);return()=>window.removeEventListener('keydown',listener);
  },[screen,modal,battle]);

  const st=battle&&!battle.over?Core.solutionState(battle):null;
  const systemInfo=Core.getSectorInfo(profile.sector);
  const profileStats=Core.stats(profile);
  const canPlayDaily=!profile.daily[dateKey()]?.finished;

  return <div className={`es-app ${profile.options.reduceMotion?'es-reduced-motion':''}`}>
    <DeepSpaceUniverseCanvas currentEnvironmentId={screen==='battle'?'event_horizon':'deep_space'} planetNumber={screen==='battle'?null:Math.min(10,systemInfo.system)} isPaused={!!modal}/>
    <div className="es-screen-layer">
    {screen!=='battle'&&<header className="es-topbar"><button className="es-logo" onClick={()=>navigate('home')}><b>✦ ECLISSI STELLARE</b><small>TATTICA STELLARE · V2.1 REACT</small></button><div className="es-currency"><span>◈ {profile.credits}</span><span>◇ {profile.ether}</span><span>LV {profile.level}</span></div></header>}
    {screen==='home'&&<main className="es-page es-home">
      <div className="es-hero">
        <p className="es-overline">COMANDO DELLA FLOTTA · SISTEMA {systemInfo.system}/12</p>
        <h1>ECLISSI<br/><em>STELLARE</em></h1>
        <p>Costruisci combinazioni numeriche, colpisci i punti vulnerabili e conquista la galassia. Ogni carta è una scelta.</p>
        <div className="es-hero-ship"><SvgShip/><span>INCROCIATORE · PRONTO AL DECOLLO</span></div>
      </div>
      <div className="es-home-actions">
        <div className="es-feature-card"><div className="es-feature-title"><span>◉ CAMPAGNA</span><b>SETTORE {profile.sector} / 120</b></div><h2>{systemInfo.name}</h2><div className="es-progress"><i style={{width:pct(profileStats.cleared,120)}}/></div><IconButton className="primary large" onClick={()=>start()}>▶ INIZIA MISSIONE</IconButton>{battle&&!battle.over&&<IconButton className="outline" onClick={resume}>↪ RIPRENDI COMBATTIMENTO</IconButton>}</div>
        <div className="es-action-grid"><IconButton onClick={()=>navigate('map')}>◎ MAPPA <small>120 settori</small></IconButton><IconButton onClick={()=>navigate('hangar')}>⚙ HANGAR <small>Carte e moduli</small></IconButton><IconButton onClick={()=>navigate('academy')}>◇ ACCADEMIA <small>Regole e tattiche</small></IconButton><IconButton onClick={()=>setModal('arena')}>⚔ ARENA <small>Offline · 3 livelli</small></IconButton><IconButton disabled={!canPlayDaily} onClick={()=>start('daily',1+([...dateKey()].reduce((a,c)=>a*31+c.charCodeAt(0),0)>>>0)%Math.max(1,profile.unlocked))}>✧ SFIDA GIORNALIERA <small>{canPlayDaily?'Nuova battaglia':'Completata oggi'}</small></IconButton><IconButton onClick={()=>start('training',1)}>◈ ADDESTRAMENTO <small>90 secondi</small></IconButton></div>
        <div className="es-home-foot"><IconButton onClick={()=>navigate('records')}>▤ REGISTRO</IconButton><IconButton onClick={()=>setModal('settings')}>⚙ IMPOSTAZIONI</IconButton></div>
      </div>
    </main>}

    {screen==='map'&&<main className="es-page"><SectionHead eyebrow="CAMPAGNA INTERSTELLARE" title="Mappa galattica" desc="12 sistemi stellari, 120 settori. I boss sono ai settori 10, 20, 30 e così via."/>
      <div className="es-system-grid">{Core.SYSTEMS.map((s,i)=><button key={s.name} className={`es-system ${selectedSystem===i?'current':''} ${profile.unlocked<(i*10+1)?'locked':''}`} onClick={()=>setSelectedSystem(i)} style={{'--system-color':s.color}}><b>{String(i+1).padStart(2,'0')}</b><strong>{s.name}</strong><small>{profile.unlocked<i*10+1?'BLOCCATO':`${Object.keys(profile.best).filter(k=>Math.floor((Number(k)-1)/10)===i).length}/10 completati`}</small></button>)}</div>
      <section className="es-panel"><h3>{Core.SYSTEMS[selectedSystem].name}</h3><p>Scegli un settore sbloccato. Ogni decimo settore custodisce un boss.</p><div className="es-sector-grid">{Array.from({length:10},(_,idx)=>selectedSystem*10+idx+1).map(n=><button key={n} className={`es-sector ${profile.best[n]?'cleared':''} ${n===profile.unlocked?'active':''}`} disabled={n>profile.unlocked} onClick={()=>start('campaign',n)}><b>{n%10===0?'♛':String(n)}</b><small>{profile.best[n]?'★'.repeat(profile.best[n]):n>profile.unlocked?'🔒':n%10===0?'BOSS':'ATTACCA'}</small></button>)}</div></section>
      <BottomNav onNavigate={navigate}/>
    </main>}

    {screen==='hangar'&&<main className="es-page"><SectionHead eyebrow="OFFICINA DELLA FLOTTA" title="Hangar" desc="Le famiglie influenzano ogni attacco. Potenzia le carte e scegli un modulo di bordo."/>
      <h3 className="es-minor-title">FAMIGLIE DI CARTE · 12 VALORI CIASCUNA</h3><div className="es-upgrade-grid">{Object.entries(Core.FAMILIES).map(([id,fam])=>{const lv=profile.upgrades[id]||1,price=Core.upgradePrice(profile,id);return <article className="es-upgrade-card" key={id} style={{'--family-color':fam.color}}><div><span>{fam.symbol} {fam.name}</span><strong>Livello {lv}/5</strong><small>{fam.desc}</small><IconButton className="outline" disabled={lv===5||profile.credits<price} onClick={()=>updateProfile(p=>Core.upgradeFamily(p,id))}>{lv===5?'MASSIMO':`POTENZIA · ◈ ${price}`}</IconButton></div></article>})}</div>
      <h3 className="es-minor-title">MODULI DI BORDO</h3><div className="es-modules">{Object.entries(Core.MODULES).map(([id,m])=>{const owned=profile.owned.includes(id),equipped=profile.equipped===id,price=Core.modulePrice(profile,id);return <div key={id} className="es-module"><div className="es-module-icon">{m.icon}</div><div><b>{m.name}</b><small>{m.desc} · Settore {m.unlock}</small></div><IconButton className={equipped?'positive':'outline'} disabled={equipped||(!owned&&(profile.unlocked<m.unlock||profile.credits<price))} onClick={()=>owned?updateProfile(p=>Core.equipModule(p,id)):updateProfile(p=>Core.buyModule(p,id))}>{equipped?'ATTIVO':owned?'EQUIPAGGIA':`◈ ${price}`}</IconButton>{owned&&<IconButton className="outline small" disabled={(profile.moduleLevels[id]||1)>=4||profile.credits<price} onClick={()=>updateProfile(p=>Core.buyModule(p,id))}>LV {profile.moduleLevels[id]||1} ↗</IconButton>}</div>})}</div><BottomNav onNavigate={navigate}/></main>}

    {screen==='academy'&&<main className="es-page"><SectionHead eyebrow="ISTRUZIONI DI COMBATTIMENTO" title="Accademia" desc="Impara le regole, poi mettile alla prova in una battaglia senza conseguenze per la campagna."/>
    <div className="es-lessons">{[
      ['01','Scegli un bersaglio','Tre sistemi della nave nemica espongono un numero e un’operazione diversa. Colpirli produce conseguenze tattiche.'],
      ['02','Combina da 2 a 4 carte','Seleziona carte numeriche nell’ordine desiderato. Applica l’operazione mostrata: il risultato deve coincidere esattamente con il bersaglio.'],
      ['03','Più difficoltà, più danno','Addizione: 10 HP · Sottrazione: 12 HP · Moltiplicazione: 16 HP · Divisione: 20 HP. Le famiglie di carte aggiungono abilità.'],
      ['04','Cambiare costa','Primo cambio: +3 HP al nemico. Secondo: −3 secondi. Terzo: −3 HP a te. Dal settore 15, due Etere permettono un cambio alternativo.'],
      ['05','Controlla i sistemi nemici','SCUDI azzera la protezione; ARMAMENTI indebolisce il nemico; REATTORE aumenta il rendimento; MOTORI rallenta le capacità nemiche.'],
      ['06','Il turno ha un limite','Hai 60 o 90 secondi per scegliere, cambiare e attaccare. Un colpo riuscito conclude il tuo turno. Il computer risponde subito, senza farti attendere un minuto.'],
      ['07','Nessuna soluzione garantita','I bersagli non vengono creati per le tue carte. Se non hai un risultato raggiungibile, valuta sacrifici, Etere o il PASSA che fornisce scudo.']
    ].map(([n,t,d])=><article key={n} className="es-lesson"><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div><IconButton className="primary large" onClick={()=>start('training',1)}>▶ PROVA L'ADDESTRAMENTO</IconButton><BottomNav onNavigate={navigate}/></main>}

    {screen==='records'&&<main className="es-page"><SectionHead eyebrow="DATI DEL PILOTA" title="Registro di bordo" desc="I progressi vengono salvati localmente in questo browser."/><div className="es-records">{[['VITTORIE',profile.wins],['SCONFITTE',profile.losses],['PERCENTUALE',profileStats.winrate+'%'],['STELLE',profileStats.stars],['SETTORI',profileStats.cleared],['LIVELLO',profile.level]].map(([k,v])=><div key={k}><small>{k}</small><strong>{v}</strong></div>)}</div><section className="es-panel"><h3>ULTIMI COMBATTIMENTI</h3>{profile.history.length?profile.history.slice(0,25).map((h,i)=><div className="es-history" key={i}><b style={{color:h.win?'#73efc4':'#ff8d9d'}}>{h.win?'VITTORIA':'SCONFITTA'}</b><span>{h.mode==='campaign'?`Settore ${h.sector}`:h.mode==='arena'?'Arena':h.mode==='daily'?'Sfida quotidiana':'Addestramento'}</span><span>{h.stars?'★'.repeat(h.stars):'—'}</span></div>):<p>Nessuna partita registrata.</p>}</section><BottomNav onNavigate={navigate}/></main>}

    {screen==='battle'&&battle&&<main className="es-battle"><header className="es-battle-header"><button onClick={()=>setModal('pause')}>Ⅱ PAUSA</button><div><strong>{battle.info.boss?'⚠ BOSS · ':''}{battle.info.enemy}</strong><small>SETTORE {battle.sector} · ROUND {battle.round}</small></div><span className="es-round">{battle.phase==='player'?'IL TUO TURNO':'NEMICO'}</span></header>
      <section className={`es-battle-arena ${impact?'es-shaking':''}`}>
        <div className="es-foe-zone"><HpBar label={battle.info.boss?battle.info.bossName:'NAVE NEMICA'} hp={battle.enemy.hp} max={battle.enemy.maxHp} shield={battle.enemy.shield} enemy/><div className="es-foe-ship"><SvgShip enemy boss={battle.info.boss}/></div>{battle.info.boss&&<div className="es-boss-trait">⚠ {battle.enemy.trait?.name}</div>}</div>
        <div className="es-targets-heading"><span>◈ PUNTI VULNERABILI</span><span>SELEZIONA UN BERSAGLIO</span></div>
        <div className="es-target-row">{battle.targets.map((target,i)=><button key={target.id} disabled={battle.phase!=='player'} className={`es-target ${battle.selectedTarget===i?'active':''}`} onClick={()=>selectTarget(i)}><span>{target.glyph} {target.label}</span><strong>{target.op} <b>{signed(target.value)}</b></strong><small>{Core.OPS[target.op].label}</small><em>−{Core.OPS[target.op].damage} BASE</em></button>)}</div>
        <div className="es-battle-center"><div className={`es-timer ${battle.turnRemaining<=10?'danger':''}`} style={{'--timer-pct':pct(battle.turnRemaining,(battle.mode==='training'?90:profile.options.turnTime)+(profile.equipped==='scanner'?(profile.moduleLevels.scanner||1)*8:0))}}><b>{Math.ceil(battle.turnRemaining)}</b><span>SEC</span></div><div className="es-formula"><small>COMBINAZIONE IN CORSO</small><strong>{battle.selected.length?`${st?.cards.map(c=>c.value).join(` ${st?.op} `)} = ${st?.value===null?'NON VALIDA':st?.value}`:'SELEZIONA 2–4 CARTE'}</strong><p className={st?.ready?'success':''}>{battle.phase==='enemy'?'L’avversario sta calcolando…':st?.ready?'BERSAGLIO CENTRATO · PRONTO A COLPIRE':`${battle.selected.length}/4 CARTE · OBIETTIVO ${st?.goal}`}</p></div></div>
        <div className="es-player-zone"><div className="es-player-ship"><SvgShip/></div><HpBar label="TUA NAVE" hp={battle.player.hp} max={battle.player.maxHp} shield={battle.player.shield}/><span className="es-energy-amount">◇ ETERE {battle.player.ether}</span></div>
        {impact&&<div key={`${impact.kind}-${impact.damage}`} className={`es-impact es-${impact.kind}`}><strong>{impact.kind==='hit'?'COLPO A SEGNO':'NAVE COLPITA'}</strong><b>−{impact.damage} HP</b></div>}
      </section>
      <section className="es-hand-panel"><div className="es-hand-title"><b>LA TUA MANO</b><span>7 CARTE · SELEZIONE MAX 4</span></div><div className="es-hand">{battle.hand.map((card,i)=>{const f=Core.FAMILIES[card.family],selected=battle.selected.indexOf(card.id);return <button key={card.id} className={`es-number-card ${selected>=0?'selected':''}`} disabled={battle.phase!=='player'} style={{'--card-accent':f.color}} onClick={()=>selectCard(card.id)} aria-label={`${f.name} ${card.value}`}><small>{selected>=0?`${selected+1}°`:f.symbol}</small><b>{card.value}</b><span>{f.name}</span></button>})}</div><div className="es-legend">{Object.entries(Core.FAMILIES).map(([id,f])=><span key={id} style={{color:f.color}}>{f.symbol} {f.name} LV {profile.upgrades[id]}</span>)}</div></section>
      <section className="es-battle-actions"><IconButton className={`primary large ${st?.ready?'ready':''}`} onClick={attack} disabled={battle.phase!=='player'||!st?.ready}>ϟ COLPISCI <small>{st?.ready?'SCATENA L’ATTACCO':'CENTRA IL NUMERO'}</small></IconButton><div className="es-secondary-actions"><IconButton onClick={()=>exchange(false)} disabled={battle.phase!=='player'||battle.selected.length!==1||battle.exchangesTurn>=3}>↻ CAMBIA<small>{['+3 HP NEMICO','−3 SEC','−3 HP TUOI','ESAURITI'][battle.exchangesTurn]}</small></IconButton><IconButton onClick={()=>exchange(true)} disabled={battle.phase!=='player'||battle.selected.length!==1||battle.player.ether<2||(battle.mode!=='training'&&battle.sector<15)}>◇ ETERE<small>CAMBIA · COSTO 2</small></IconButton><IconButton onClick={pass} disabled={battle.phase!=='player'}>⏭ PASSA<small>+4 SCUDO</small></IconButton></div></section>
      <div className="es-battle-log" role="status">{battle.log[0]}</div>
    </main>}

    {screen==='result'&&battle&&<main className="es-page es-result"><div className={`es-result-crest ${battle.result?.win?'win':'lose'}`}>{battle.result?.win?'✦':'◇'}</div><SectionHead eyebrow="COMBATTIMENTO TERMINATO" title={battle.result?.win?'VITTORIA':'SCONFITTA'} desc={battle.result?.win?'Hai conquistato il settore. Ogni scelta ha contato.':(battle.result?.reason||'La nave è stata neutralizzata. Riprova con un’altra strategia.')}/><div className="es-stars">{battle.result?.win?'★'.repeat(battle.result.rewards?.stars||1):'NESSUNA STELLA'}</div><div className="es-records"><div><small>ROUND</small><strong>{battle.round}</strong></div><div><small>COLPI</small><strong>{battle.hits}</strong></div><div><small>HP</small><strong>{Math.ceil(battle.player.hp)}</strong></div></div>{battle.result?.rewards&&<div className="es-rewards"><span>◈ +{battle.result.rewards.credits} CREDITI</span><span>✧ +{battle.result.rewards.xp} XP</span></div>}<div className="es-result-actions"><IconButton className="primary large" onClick={()=>start(battle.mode,battle.result?.win&&battle.mode==='campaign'?Math.min(120,battle.sector+1):battle.sector,battle.difficulty)}>{battle.result?.win&&battle.mode==='campaign'&&battle.sector<120?'▶ PROSSIMO SETTORE':'↻ GIOCA ANCORA'}</IconButton><IconButton className="outline large" onClick={()=>navigate('map')}>◎ MAPPA GALATTICA</IconButton><IconButton className="outline" onClick={()=>navigate('home')}>⌂ RITORNA ALLA BASE</IconButton></div></main>}

    {modal&&<div className="es-modal-overlay"><div className="es-dialog" role="dialog" aria-modal="true">
      {modal==='pause'&&<><span className="es-overline">COMBATTIMENTO SOSPESO</span><h2>PAUSA TATTICA</h2><p>Il tempo resta fermo mentre decidi. Puoi riprendere o abbandonare la battaglia.</p><IconButton className="primary large" onClick={()=>{setModal(null);timerStamp.current=Date.now();}}>▶ RIPRENDI</IconButton><IconButton className="outline" onClick={()=>setModal('confirm-quit')}>ABBANDONA BATTAGLIA</IconButton></>}
      {modal==='confirm-quit'&&<><h2>CONFERMI LA RITIRATA?</h2><p>La battaglia verrà registrata come sconfitta.</p><IconButton className="danger" onClick={quit}>SÌ, ABBANDONA</IconButton><IconButton className="outline" onClick={()=>setModal('pause')}>NO, CONTINUA</IconButton></>}
      {modal==='arena'&&<><h2>ARENA OFFLINE</h2><p>Tre difficoltà contro il computer, senza sbloccare settori.</p>{[['easy','CADETTO'],['normal','PILOTA'],['hard','VETERANO']].map(([v,t])=><IconButton key={v} className="outline" onClick={()=>start('arena',Math.max(1,profile.sector),v)}>{t}</IconButton>)}<IconButton onClick={()=>setModal(null)}>CHIUDI</IconButton></>}
      {modal==='settings'&&<><h2>IMPOSTAZIONI</h2><p>Le nuove impostazioni del tempo si applicano alla prossima battaglia.</p><div className="es-setting"><b>Tempo per turno</b><div><IconButton className={profile.options.turnTime===60?'active':''} onClick={()=>updateProfile(p=>{p.options.turnTime=60;})}>60 S</IconButton><IconButton className={profile.options.turnTime===90?'active':''} onClick={()=>updateProfile(p=>{p.options.turnTime=90;})}>90 S</IconButton></div></div><div className="es-setting"><b>Animazioni ridotte</b><IconButton onClick={()=>updateProfile(p=>{p.options.reduceMotion=!p.options.reduceMotion;})}>{profile.options.reduceMotion?'SÌ':'NO'}</IconButton></div><IconButton className="primary" onClick={()=>setModal(null)}>CHIUDI</IconButton></>}
    </div></div>}
    {notice&&<div className="es-toast" role="status">{notice}</div>}
    </div>
  </div>;
}
function BottomNav({onNavigate}) {return <nav className="es-bottom-nav"><button onClick={()=>onNavigate('home')}>⌂ BASE</button><button onClick={()=>onNavigate('map')}>◎ MAPPA</button><button onClick={()=>onNavigate('hangar')}>⚙ HANGAR</button><button onClick={()=>onNavigate('academy')}>◇ GUIDA</button></nav>}
