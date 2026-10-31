/* ECLISSI STELLARE — MOTORE NUMERICO v2.0
   Indipendente da rete, framework e presentazione. */
const EclissiCore = (() => {
'use strict';
const OPS = {
 '+': {label:'ADDIZIONE',damage:10,name:'Impulso',color:'#45c7ed'},
 '-': {label:'SOTTRAZIONE',damage:12,name:'Taglio',color:'#a39bff'},
 '×': {label:'MOLTIPLICAZIONE',damage:16,name:'Nova',color:'#ffb04d'},
 '÷': {label:'DIVISIONE',damage:20,name:'Singolarità',color:'#ff6fae'}
};
const FAMILIES = {
 nova:{name:'NOVA',symbol:'✦',icon:'☄',color:'#f78763',desc:'Aumenta i danni'},
 ion:{name:'ION',symbol:'ϟ',icon:'ϟ',color:'#64cbff',desc:'Genera scudo'},
 vita:{name:'VITA',symbol:'✚',icon:'✚',color:'#70e7b3',desc:'Ripristina HP'},
 ether:{name:'ETER',symbol:'◇',icon:'◇',color:'#c5a0ff',desc:'Concentra Etere'}
};
const MODULES = {
 bulwark:{name:'Bastione',icon:'⬡',short:'Scudo iniziale',desc:'Più scudo all’avvio della battaglia',unlock:1,base:90},
 scanner:{name:'Cronoscanner',icon:'◈',short:'Tempo aggiuntivo',desc:'Più secondi per ogni turno',unlock:4,base:105},
 medic:{name:'Biocella',icon:'✚',short:'Riparazione',desc:'Cura HP dopo un attacco riuscito',unlock:8,base:135},
 reactor:{name:'Reattore',icon:'◉',short:'Produzione Etere',desc:'Ottieni Etere ogni due colpi a segno',unlock:15,base:180},
 disruptor:{name:'Distorsore',icon:'⟡',short:'Critico',desc:'Aumenta i danni con × e ÷',unlock:22,base:220}
};
const SYSTEMS = [
 {name:'Orbita terrestre',color:'#4bd4e5',enemy:'Sentinelle orbitali'},
 {name:'Campi di Marte',color:'#e68969',enemy:'Predoni cremisi'},
 {name:'Nebulose di Venere',color:'#d1b4ff',enemy:'Custodi del velo'},
 {name:'Cintura di Cerere',color:'#f6c580',enemy:'Minatori ribelli'},
 {name:'Ombre di Giove',color:'#80caff',enemy:'Legione di Giove'},
 {name:'Anelli di Saturno',color:'#f3d6a1',enemy:'Guardiani degli anelli'},
 {name:'Urano sconosciuto',color:'#82e2ce',enemy:'Spettri ionici'},
 {name:'Nettuno abissale',color:'#6697ff',enemy:'Flotta del profondo'},
 {name:'Confine di Plutone',color:'#c6a8e4',enemy:'Predoni del vuoto'},
 {name:'Grande frattura',color:'#ff8fb5',enemy:'Custodi dei varchi'},
 {name:'Abisso stellare',color:'#a4aaff',enemy:'Intelligenza oscura'},
 {name:'Eclissi finale',color:'#edba82',enemy:'Dominatori dell’eclissi'}
];
const MAX_SECTOR=120;
const BOSS_TRAITS=[
 {name:'BARRIERA ORBITALE',desc:'Rigenera scudi aggiuntivi a ogni turno'},
 {name:'FURIA CREMISI',desc:'Gli attacchi nemici infliggono più danni'},
 {name:'NEBBIA TEMPORALE',desc:'Riduce il tempo a disposizione a ogni turno'},
 {name:'NANOMACCHINE',desc:'Ripara lo scafo nemico tra i turni'},
 {name:'TEMPESTA GIOVIANA',desc:'Ogni terzo turno provoca una scarica extra'},
 {name:'CORAZZA TITANICA',desc:'Rigenera più scudi'},
 {name:'FURTO IONICO',desc:'Prosciuga una parte dello scudo del giocatore'},
 {name:'PRESSIONE ABISSALE',desc:'Riduce gli effetti difensivi della tua nave'},
 {name:'IMBOSCATA GELIDA',desc:'Il nemico attacca con maggiore precisione'},
 {name:'DISTORSIONE DEL VARCO',desc:'Riduce il tempo nelle fasi di alta tensione'},
 {name:'OMBRA TRAFIGGENTE',desc:'I colpi attraversano parte dello scudo'},
 {name:'SECONDA ECLISSI',desc:'Sotto metà HP attiva una seconda fase'}
];
const rand=(a,b,r=Math.random)=>Math.floor(r()*(b-a+1))+a;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const shuffle=(a,r=Math.random)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=rand(0,i,r);[b[i],b[j]]=[b[j],b[i]];}return b;};
const makeDeck=(r=Math.random)=>shuffle(Object.keys(FAMILIES).flatMap(f=>Array.from({length:12},(_,i)=>({id:`${f}_${i+1}`,value:i+1,family:f}))),r);
const freshProfile=()=>({version:2,sector:1,unlocked:1,credits:240,ether:0,xp:0,level:1,wins:0,losses:0,damage:0,best:{},upgrades:{nova:1,ion:1,vita:1,ether:1},owned:['bulwark'],equipped:'bulwark',moduleLevels:{bulwark:1},achievements:[],daily:{},options:{turnTime:60,mute:false,reduceMotion:false},history:[],tutorialSeen:false});
function loadProfile(value){ const fresh=freshProfile(),p=(value&&typeof value==='object')?value:{}; const out={...fresh,...p};out.options={...fresh.options,...p.options};out.upgrades={...fresh.upgrades,...p.upgrades};out.moduleLevels={...fresh.moduleLevels,...p.moduleLevels};out.best={...fresh.best,...p.best};out.owned=Array.isArray(p.owned)?p.owned:fresh.owned;out.achievements=Array.isArray(p.achievements)?p.achievements:[];out.history=Array.isArray(p.history)?p.history:[];out.sector=clamp(Number(out.sector)||1,1,MAX_SECTOR);out.unlocked=clamp(Number(out.unlocked)||1,1,MAX_SECTOR);return out;}
function getSectorInfo(sector){ const s=clamp(Number(sector)||1,1,MAX_SECTOR), idx=Math.floor((s-1)/10);return {...SYSTEMS[idx],sector:s,system:idx+1,stage:((s-1)%10)+1,boss:s%10===0,bossName:`${['Colosso','Arconte','Custode','Titano'][idx%4]} ${SYSTEMS[idx].enemy.split(' ')[0]}`}; }
function rankLevel(xp){return Math.min(100,1+Math.floor(Math.sqrt(Math.max(0,xp)/32)));}
function targetFor(op,r=Math.random,stage=1,round=1){
 const harder=stage>12&&r()<clamp(0.10+(stage-12)/170+(round>4?.10:0),0,.62);
 switch(op){
  case '+':return harder?rand(28,44,r):rand(7,30,r);
  case '-':return harder?rand(-27,-9,r):rand(1,11,r);
  case '×':return harder?rand(7,13,r)*rand(7,12,r):rand(2,10,r)*rand(2,8,r);
  case '÷':return harder?rand(7,11,r):rand(2,7,r);
 }return 10;
}
const PARTS=[{id:'shield',label:'SCUDI',glyph:'⬡',hint:'Azzera gli scudi nemici'}, {id:'weapon',label:'ARMAMENTI',glyph:'ϟ',hint:'Riduce il prossimo attacco'}, {id:'core',label:'REATTORE',glyph:'◉',hint:'Bonus danni ed Etere'}, {id:'engine',label:'MOTORI',glyph:'➤',hint:'Più tempo al prossimo turno'}];
function objectives(round=1,r=Math.random,stage=1){ const parts=shuffle(PARTS,r).slice(0,3),ops=shuffle(['+','-','×','÷'],r); if(round<4&&!ops.slice(0,3).includes('+'))ops[2]='+';return parts.map((part,i)=>({...part,op:ops[i],value:targetFor(ops[i],r,stage,round),id:`${round}_${part.id}`})); }
function evalCards(cards,op){ if(!Array.isArray(cards)||cards.length<2||cards.length>4||!OPS[op])return null;let v=Number(cards[0].value);for(let i=1;i<cards.length;i++){const n=Number(cards[i].value);if(!Number.isFinite(n)||n<=0)return null;if(op==='+')v+=n;else if(op==='-')v-=n;else if(op==='×')v*=n;else if(op==='÷'){if(v%n!==0)return null;v/=n;}if(!Number.isFinite(v)||Math.abs(v)>100000)return null;}return v; }
function solve(hand,op,target){let found=null; const walk=(chosen,remaining)=>{if(found)return;if(chosen.length>=2&&evalCards(chosen,op)===target){found=chosen.map(c=>c.id);return;}if(chosen.length===4)return;for(let i=0;i<remaining.length;i++){walk([...chosen,remaining[i]],[...remaining.slice(0,i),...remaining.slice(i+1)]);if(found)return;}};walk([],hand);return found;}
function draw(game,count){for(let i=0;i<count;i++){if(!game.deck.length){if(!game.discards.length)game.discards=makeDeck();game.deck=shuffle(game.discards);game.discards=[];} const c=game.deck.pop(); if(c)game.hand.push(c);}}
function newBattle(profile,opts={}){ const sector=opts.sector||profile.sector||1, mode=opts.mode||'campaign',difficulty=opts.difficulty||'normal',info=getSectorInfo(sector),d=sector-1,boss=info.boss;
const enemyMax=Math.round((boss?83:48)+d*1.17+(difficulty==='hard'?22:difficulty==='easy'?-7:0));const playerMax=clamp(95+Math.floor((profile.level-1)*1.6),95,185);
const moduleLv=profile.moduleLevels[profile.equipped]||1;
const sh=profile.equipped==='bulwark'?6+moduleLv*5:5;
const game={id:`${Date.now()}_${rand(100,999)}`,mode,difficulty,sector,info,phase:'player',round:1,turns:0,hits:0,exchanges:0,exchangesTurn:0,turnRemaining:(mode==='training'?90:profile.options.turnTime)+(profile.equipped==='scanner'?moduleLv*8:0),selected:[],selectedTarget:0,player:{hp:playerMax,maxHp:playerMax,shield:sh,ether:mode==='training'?4:(sector>=15?Math.min(6,profile.ether):0),combo:0},enemy:{hp:enemyMax,maxHp:enemyMax,shield:boss?12:5,weakened:0,jammed:0,shieldLock:0,trait:boss?BOSS_TRAITS[info.system-1]:null,phaseTwo:false},deck:makeDeck(),discards:[],hand:[],targets:objectives(1,Math.random,sector),log:[boss?`⚠ ${BOSS_TRAITS[info.system-1].name}: ${BOSS_TRAITS[info.system-1].desc}`:`Inizia l'incursione: ${info.enemy}.`],result:null,over:false};draw(game,7);return game;}
function refreshTarget(game){game.targets=objectives(game.round,Math.random,game.sector);game.selectedTarget=0;game.selected=[];game.exchangesTurn=0;}
function selectedCards(game){return game.selected.map(id=>game.hand.find(c=>c.id===id)).filter(Boolean);}
function solutionState(game){const t=game.targets[game.selectedTarget],cards=selectedCards(game);return {value:evalCards(cards,t.op),goal:t.value,ready:cards.length>=2&&evalCards(cards,t.op)===t.value,cards,op:t.op};}
function log(game,text){game.log=[text,...game.log].slice(0,16);}
function exchange(game,profile,byEther=false){if(game.phase!=='player'||game.over)return {ok:false,error:'Non è il tuo turno.'};const sel=selectedCards(game);if(sel.length!==1)return {ok:false,error:'Seleziona una sola carta da cambiare.'};const card=sel[0];if(byEther){if(game.mode!=='training'&&game.sector<15)return {ok:false,error:'Etere sbloccato dal settore 15.'};if(game.player.ether<2)return {ok:false,error:'Servono 2 unità di Etere.'};game.player.ether-=2;}else{if(game.exchangesTurn>=3)return {ok:false,error:'Tre sacrifici già utilizzati.'};const cost=game.exchangesTurn;if(cost===0)game.enemy.hp=Math.min(game.enemy.maxHp+18,game.enemy.hp+3);if(cost===1)game.turnRemaining=Math.max(1,game.turnRemaining-3);if(cost===2)game.player.hp=Math.max(0,game.player.hp-3);game.exchangesTurn++;game.exchanges++;}
const idx=game.hand.findIndex(c=>c.id===card.id);game.hand.splice(idx,1);game.discards.push(card);draw(game,1);game.selected=[];log(game,byEther?'Trasmutazione con 2 Etere.':`Sacrificio ${game.exchangesTurn}/3: carta sostituita.`);if(game.player.hp<=0){game.over=true;game.phase='defeat';game.result={win:false,reason:'Sacrificio fatale'};}return {ok:true};}
function attack(game,profile){if(game.phase!=='player'||game.over)return {ok:false,error:'Il turno non è attivo.'};const st=solutionState(game);if(!st.ready)return {ok:false,error:'La combinazione non raggiunge il bersaglio.'};const target=game.targets[game.selectedTarget];let damage=OPS[target.op].damage;let extra=0,shield=0,heal=0,ether=0;
for(const c of st.cards){const level=profile.upgrades[c.family]||1;if(c.family==='nova')extra+=1+level;if(c.family==='ion')shield+=1+level;if(c.family==='vita')heal+=1+level;if(c.family==='ether')ether+=level;}
if(target.id.includes('core')){extra+=3;ether+=1;}if(target.op==='×'||target.op==='÷'){if(profile.equipped==='disruptor')extra+=4+(profile.moduleLevels.disruptor||1)*3;}
damage+=extra;let shieldBlocked=Math.min(game.enemy.shield,damage);if(target.id.includes('shield')){game.enemy.shield=0;game.enemy.shieldLock=2;shieldBlocked=0;}else game.enemy.shield-=shieldBlocked;
const hpDamage=Math.max(0,damage-shieldBlocked);game.enemy.hp=Math.max(0,game.enemy.hp-hpDamage);
if(target.id.includes('weapon'))game.enemy.weakened=2;if(target.id.includes('engine'))game.enemy.jammed=2;
game.player.shield=Math.min(35,game.player.shield+shield);game.player.hp=Math.min(game.player.maxHp,game.player.hp+heal);game.player.ether=Math.min(18,game.player.ether+ether);
if(profile.equipped==='medic')game.player.hp=Math.min(game.player.maxHp,game.player.hp+2+(profile.moduleLevels.medic||1)*2);
if(game.info.boss&&game.info.system===12&&!game.enemy.phaseTwo&&game.enemy.hp>0&&game.enemy.hp<=game.enemy.maxHp/2){game.enemy.phaseTwo=true;game.enemy.shield+=14;log(game,'⚠ ECLISSI: il boss entra nella seconda fase! +14 scudo.');}
game.hits++;game.player.combo++;if(profile.equipped==='reactor'&&game.hits%2===0)game.player.ether=Math.min(18,game.player.ether+1+(profile.moduleLevels.reactor>=3?1:0));
const ids=new Set(st.cards.map(c=>c.id));game.discards.push(...game.hand.filter(c=>ids.has(c.id)));game.hand=game.hand.filter(c=>!ids.has(c.id));draw(game,st.cards.length);game.turns++;
log(game,`${target.label} colpiti! ${hpDamage} HP inflitti${shieldBlocked?` (${shieldBlocked} assorbiti dagli scudi)`:''}.`);
const result={ok:true,damage:hpDamage,shieldDamage:shieldBlocked,part:target.id,op:target.op};
if(game.enemy.hp<=0){game.phase='victory';game.over=true;game.result={win:true,damage:hpDamage};return result;}
game.phase='enemy';game.selected=[];return result;}
function enemyTurn(game,profile){if(game.over||game.phase!=='enemy')return {ok:false};let hit=false,dmg=0;const d=game.sector,boss=game.info.boss;
const aiHand=makeDeck().slice(0,7);const targetList=objectives(game.round+17,Math.random,game.sector);const sols=targetList.map(t=>({t,sol:solve(aiHand,t.op,t.value)})).filter(x=>x.sol);
const skill=clamp(0.37+d*0.004+(boss?0.06:0)+(boss&&game.info.system===9?0.1:0)+(game.difficulty==='hard'?0.09:game.difficulty==='easy'?-0.12:0)-(game.enemy.jammed?0.15:0),0.32,0.87);
if(sols.length&&Math.random()<skill){const pick=sols.sort((a,b)=>OPS[b.t.op].damage-OPS[a.t.op].damage)[0];let raw=OPS[pick.t.op].damage*(0.65+Math.min(0.35,d/180));if(boss&&game.round%3===0)raw+=5;if(boss&&game.info.system===2)raw+=3;if(boss&&game.info.system===5&&game.round%3===0)raw+=5;if(boss&&game.info.system===12&&game.enemy.phaseTwo)raw+=5;raw=Math.max(3,Math.round(raw)) - (game.enemy.weakened?5:0);raw=Math.max(2,raw);const pierce=boss&&game.info.system===11?3:0;const shieldBlocked=Math.min(game.player.shield,Math.max(0,raw-pierce));game.player.shield-=shieldBlocked;dmg=Math.max(0,raw-shieldBlocked);game.player.hp=Math.max(0,game.player.hp-dmg);hit=true;log(game,`Nemico: ${pick.t.op} ${pick.t.value} → ${dmg} HP subiti${shieldBlocked?` (${shieldBlocked} assorbiti)`:''}.`);}else{log(game,'Il nemico non riesce a centrare il bersaglio.');}
if(!game.enemy.shieldLock)game.enemy.shield=Math.min(boss?24:12,game.enemy.shield+(boss?(game.info.system===1||game.info.system===6?6:3):2));
if(boss&&game.info.system===4&&game.enemy.hp>0)game.enemy.hp=Math.min(game.enemy.maxHp,game.enemy.hp+3);
if(boss&&game.info.system===7)game.player.shield=Math.max(0,game.player.shield-2);
if(boss&&game.info.system===8)game.player.shield=Math.max(0,game.player.shield-1);
const timeJammed=game.enemy.jammed>0;
game.enemy.weakened=Math.max(0,game.enemy.weakened-1);game.enemy.jammed=Math.max(0,game.enemy.jammed-1);game.enemy.shieldLock=Math.max(0,game.enemy.shieldLock-1);
if(game.player.hp<=0){game.over=true;game.phase='defeat';game.result={win:false,reason:'Nave distrutta'};return {ok:true,hit,damage:dmg};}
game.phase='player';game.round++;refreshTarget(game);game.turnRemaining=(game.mode==='training'?90:profile.options.turnTime)+(profile.equipped==='scanner'?(profile.moduleLevels.scanner||1)*8:0)+(timeJammed?8:0);
if(boss&&(game.info.system===3||game.info.system===10))game.turnRemaining=Math.max(22,game.turnRemaining-(game.info.system===10&&game.enemy.phaseTwo?9:5));game.player.shield=Math.min(35,game.player.shield+1);return {ok:true,hit,damage:dmg};}
function passTurn(game,reason='Passaggio volontario'){if(game.phase!=='player'||game.over)return {ok:false};game.player.shield=Math.min(35,game.player.shield+4);game.phase='enemy';game.turns++;game.selected=[];log(game,`${reason}. +4 scudo.`);return {ok:true};}
function reward(profile,game){if(!game.over||!game.result?.win||game.result.rewarded)return null;const boss=game.info.boss;const hpRatio=game.player.hp/game.player.maxHp;const stars=1+(hpRatio>=0.50?1:0)+(hpRatio>=0.80&&game.round<=9?1:0);const amount=(game.mode==='training'?0:Math.round((20+game.sector*2+(boss?50:0))*(game.mode==='daily'?1.5:1)));const xp=game.mode==='training'?0:35+game.sector*3+(boss?45:0);
const today=new Date().toLocaleDateString('en-CA');
const dailyAlreadyDone=game.mode==='daily'&&profile.daily[today]?.finished;
const firstClear=game.mode==='campaign'&&!profile.best[game.sector];let bonus=firstClear?30+(boss?70:0):0;
profile.credits+=dailyAlreadyDone?0:amount+bonus;profile.xp+=dailyAlreadyDone?0:xp;profile.level=rankLevel(profile.xp);profile.wins++;profile.damage+=game.result.damage||0;
if(game.mode==='campaign'){profile.best[game.sector]=Math.max(profile.best[game.sector]||0,stars);if(game.sector===profile.unlocked&&profile.unlocked<MAX_SECTOR)profile.unlocked++;profile.sector=Math.min(profile.unlocked,MAX_SECTOR);if(game.sector>=15&&firstClear)profile.ether=Math.min(99,profile.ether+(boss?3:1));}
if(game.mode==='daily'){const today=new Date().toLocaleDateString('en-CA');profile.daily[today]={stars,finished:true};}
profile.history=[{sector:game.sector,mode:game.mode,win:true,stars,date:Date.now()},...profile.history].slice(0,40);
const r={stars,credits:dailyAlreadyDone?0:amount+bonus,xp:dailyAlreadyDone?0:xp,firstClear,sectorUnlocked:profile.unlocked,ether:game.sector>=15&&firstClear?(boss?3:1):0};game.result.rewarded=true;game.result.rewards=r;return r;}
function recordDefeat(profile,game){if(game.result?.recorded)return;profile.losses++;profile.history=[{sector:game.sector,mode:game.mode,win:false,date:Date.now()},...profile.history].slice(0,40);game.result.recorded=true;}
function upgradePrice(profile,family){const lv=profile.upgrades[family]||1;return 60*lv*lv;}
function upgradeFamily(profile,family){if(!FAMILIES[family])return {ok:false,error:'Famiglia sconosciuta'};const lv=profile.upgrades[family]||1;if(lv>=5)return {ok:false,error:'Livello massimo raggiunto'};const cost=upgradePrice(profile,family);if(profile.credits<cost)return {ok:false,error:'Crediti insufficienti'};profile.credits-=cost;profile.upgrades[family]=lv+1;return {ok:true};}
function modulePrice(profile,id){if(!MODULES[id])return 0;return profile.owned.includes(id)?MODULES[id].base*(profile.moduleLevels[id]||1):MODULES[id].base;}
function buyModule(profile,id){const m=MODULES[id];if(!m)return {ok:false,error:'Modulo inesistente'};if(profile.unlocked<m.unlock)return {ok:false,error:`Si sblocca al settore ${m.unlock}`};const owned=profile.owned.includes(id),lv=profile.moduleLevels[id]||1;if(owned&&lv>=4)return {ok:false,error:'Livello massimo'};const cost=modulePrice(profile,id);if(profile.credits<cost)return {ok:false,error:'Crediti insufficienti'};profile.credits-=cost;if(!owned){profile.owned.push(id);profile.moduleLevels[id]=1;}else profile.moduleLevels[id]=lv+1;return {ok:true};}
function equipModule(profile,id){if(!profile.owned.includes(id))return {ok:false,error:'Modulo non posseduto'};profile.equipped=id;return {ok:true};}
function stats(profile){const best=Object.values(profile.best);return {stars:best.reduce((a,b)=>a+b,0),cleared:best.length,winrate:profile.wins+profile.losses?Math.round(profile.wins/(profile.wins+profile.losses)*100):0};}
const API={OPS,FAMILIES,MODULES,SYSTEMS,BOSS_TRAITS,MAX_SECTOR,PARTS,rand,clamp,makeDeck,freshProfile,loadProfile,getSectorInfo,rankLevel,objectives,evalCards,solve,newBattle,draw,selectedCards,solutionState,exchange,attack,enemyTurn,passTurn,reward,recordDefeat,upgradeFamily,upgradePrice,buyModule,modulePrice,equipModule,stats};
return API;
})();
export default EclissiCore;
