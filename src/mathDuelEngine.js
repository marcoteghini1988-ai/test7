// Eclissi Stellare — Fase 1: calcolo = grilletto, carte = munizioni, navi = armi integrate.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
export const ENGINE_KEYS=['plus','minus','times','divide'];
export const META={plus:{sign:'+',name:'Addizione',color:'#26baff'},minus:{sign:'−',name:'Sottrazione',color:'#57e4a1'},times:{sign:'×',name:'Moltiplicazione',color:'#ff674d'},divide:{sign:'÷',name:'Divisione',color:'#b780ff'}};
export const SUIT_KEYS={'♥':'H','♦':'D','♣':'C','♠':'S'};
export const SUIT_SIGNS={H:'♥',D:'♦',C:'♣',S:'♠'};
// Rank cards are displayed as letters, while arithmetic always uses 1..13.
export const rankLabel=value=>value===1?'A':value===11?'J':value===12?'Q':value===13?'K':String(value);
export const BASE_HP={plus:72,minus:72,times:85,divide:72};
export const TOTAL_LEVELS=30;
export const PHASE1_SHIPS=PHASE1_CATALOG.ships;
export function shuffled(a,rng=Math.random){const v=[...a];for(let i=v.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;}
export function newDeck(rng=Math.random){return shuffled(['♥','♦','♣','♠'].flatMap(suit=>Array.from({length:13},(_,i)=>({id:`${suit}${i+1}`,suit,value:i+1}))),rng);}
export function getShipDefinition(id){return PHASE1_CATALOG.ships.find(x=>x.id===id)||null;}
export function getWeaponsForShip(id){return PHASE1_CATALOG.weapons.filter(x=>x.nave_id===id);}
export function supportedOperators(side){const found=new Set();for(const v of side.fleet)for(const k of ENGINE_KEYS)if(v.engines[k]?.max>0&&v.engines[k].hp>0)found.add(k);return ENGINE_KEYS.filter(x=>found.has(x));}
export function validFleet(ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>3||ids.some(x=>!getShipDefinition(x))||new Set(ids).size!==ids.length)return false;
 const counts={H:0,D:0,C:0,S:0};
 for(const id of ids){if(id==='N00')continue;const triggers=new Set(getWeaponsForShip(id).flatMap(w=>w.seme_trigger==='*'?[]:[w.seme_trigger]));for(const t of triggers){if(!(t in counts))return false;counts[t]++;if(counts[t]>2)return false;}}
 return true;
}
function shipLevel(id,level){return PHASE1_CATALOG.shipLevels.find(x=>x.nave_id===id&&x.livello===level);}
function gunLevel(id,level){return PHASE1_CATALOG.weaponLevels.find(x=>x.arma_id===id&&x.livello===level);}
export function newVessel(id='N00',level=1){
 const def=getShipDefinition(id);if(!def)throw Error('Nave inesistente '+id);
 const l=Math.max(1,Math.min(5,Math.floor(level)));
 const prog=shipLevel(id,l);if(!prog)throw Error('Progressione assente '+id+'/'+l);
 const engines={};ENGINE_KEYS.forEach((op,i)=>{if(i<prog.motori)engines[op]={hp:prog.hp_per_motore,max:prog.hp_per_motore};});
 return {id,name:def.nome,rarity:def.rarita,level:l,engines,weapons:getWeaponsForShip(id).map(w=>({...w,damage:gunLevel(w.id,l)?.danno_per_proiettile??w.danno_colpo_L1,charge:0})),};
}
export function newShip(_level=1,isEnemy=false,upgrades={}){const ids=Array.isArray(upgrades.fleetIds)&&validFleet(upgrades.fleetIds)?upgrades.fleetIds:['N00'];const level=Number(upgrades.shipLevel)||1;return {fleet:ids.map(id=>newVessel(id,level)),hand:[],deck:[],discard:[],sacrifices:0,ether:isEnemy?1:2};}
export function fillHand(side){const n={...side,hand:[...side.hand],deck:[...side.deck]};while(n.hand.length<7&&n.deck.length)n.hand.push(n.deck.pop());return n;}
export function createShip(level=1,isEnemy=false,upgrades={},rng=Math.random){let s=newShip(level,isEnemy,upgrades);s.deck=newDeck(rng);return fillHand(s);}
// Bersagli teoricamente risolvibili con DUE carte da 1 a 13. Non dipendono
// dalle carte effettivamente in mano: non esiste soluzione garantita per turno.
// Al livello 1 sono favoriti prodotti e quozienti con molte coppie possibili.
export const TARGET_POOLS={
 plus:Array.from({length:19},(_,i)=>i+4),
 minus:Array.from({length:11},(_,i)=>i+1),
 times:[6,8,9,10,12,14,15,16,18,20,21,24,25,27,28,30,32,33,35,36,39,40,42,44,45,48,49,50,52,54,55,56,60,63,64,65,66,70,72,77,78,80,81,84,88,90,91,96,99,100,104,108,110,117,120,121,130,132,143,144,156,169],
 divide:Array.from({length:13},(_,i)=>i+1)
};
function drawTarget(pool,rng){const roll=Number(rng());return pool[Math.min(pool.length-1,Math.max(0,Math.floor((Number.isFinite(roll)?roll:0)*pool.length)))];}
export function generateTargets(rng=Math.random,level=1){
 const difficulty=Math.max(1,Number(level)||1);
 const products=TARGET_POOLS.times.filter(n=>n<=(difficulty>=21?169:difficulty>=11?80:40));
 const quotients=TARGET_POOLS.divide.filter(n=>n<=(difficulty>=21?13:difficulty>=11?10:7));
 return {plus:drawTarget(TARGET_POOLS.plus,rng),minus:drawTarget(TARGET_POOLS.minus,rng),times:drawTarget(products,rng),divide:drawTarget(quotients,rng)};
}
export function calculation(op,a,b){
 if(!ENGINE_KEYS.includes(op)||!Number.isInteger(a)||!Number.isInteger(b)||a<1||a>13||b<1||b>13)return NaN;
 return op==='plus'?a+b:op==='minus'?a-b:op==='times'?a*b:op==='divide'?a/b:NaN;
}
// + e × sono commutative; per − e ÷ le carte possono essere invertite.
// Divisione valida solo con risultato intero e uguale al bersaglio.
export function evaluatePair(op,first,second,target){
 if(!ENGINE_KEYS.includes(op)||!Number.isInteger(target))return null;
 const f=calculation(op,first,second);
 if(Number.isInteger(f)&&f===target)return {a:first,b:second,result:f};
 if(op==='minus'||op==='divide'){
  const r=calculation(op,second,first);
  if(Number.isInteger(r)&&r===target)return {a:second,b:first,result:r};
 }
 return null;
}
// Unica fonte di verità per il messaggio mostrato al giocatore e il controllo ATTACCA.
export function inspectCalculation(op,first,second,target){
 const match=evaluatePair(op,first,second,target);
 if(match)return {...match,valid:true,target};
 const options=[{a:first,b:second,result:calculation(op,first,second)}];
 if(op==='minus'||op==='divide')options.push({a:second,b:first,result:calculation(op,second,first)});
 options.sort((x,y)=>Math.abs(x.result-target)-Math.abs(y.result-target));
 const best=options[0];
 return {...best,valid:false,target,reason:Number.isFinite(best.result)?'target_mismatch':'invalid_cards'};
}
export function totalHP(side){return side.fleet.reduce((sum,v)=>sum+ENGINE_KEYS.reduce((s,k)=>s+(v.engines[k]?.hp||0),0),0);}
export function totalMax(side){return side.fleet.reduce((sum,v)=>sum+ENGINE_KEYS.reduce((s,k)=>s+(v.engines[k]?.max||0),0),0);}
export function vesselDestroyed(v){return ENGINE_KEYS.every(k=>!v.engines[k]||v.engines[k].hp<=0);}
export function isDestroyed(side){return side.fleet.every(vesselDestroyed);}
export function healthScore(side){return totalMax(side)?totalHP(side)/totalMax(side):0;}
export function deckExhausted(a,b){return a.deck.length===0||b.deck.length===0;}
export function deckVerdict(a,b){const x=healthScore(a),y=healthScore(b);return Math.abs(x-y)<1e-5?'draw':x>y?'player':'enemy';}
// Each valid calculation consumes ONLY the 2 selected cards. Their face values are ammo, their suits are triggers.
export function getAmmo(cards){const a={H:0,D:0,C:0,S:0};for(const c of cards)a[SUIT_KEYS[c.suit]]=(a[SUIT_KEYS[c.suit]]||0)+c.value;return a;}
export function previewVolley(side,cards){
 const ammo=getAmmo(cards);const shots=[];const newFleet=side.fleet.map((v,vi)=>({ ...v,weapons:v.weapons.map(w=>({...w}))}));
 for(const [vi,v] of newFleet.entries()){
  if(vesselDestroyed(v))continue;
  for(const w of v.weapons){
   const n=w.seme_trigger==='*'?Object.values(ammo).reduce((a,b)=>a+b,0):ammo[w.seme_trigger]||0;
   if(n===0)continue;
   if(w.tipo==='Combo simultanea'){const requires=(w.combo||'').split('+');if(!requires.every(s=>(ammo[s]||0)>0))continue;}
   if(w.tipo==='Combo a memoria')continue; // non presente nelle cinque navi della Fase 1.
   let count=n,charging=false;
   if(w.tipo==='Accumulo'){
    w.charge=(w.charge||0)+n;const threshold=Math.max(1,w.soglia_munizioni||1);
    if(w.charge<threshold){count=0;charging=true;}
    else{count=threshold;w.charge-=threshold;} // Una sola scarica per calcolo; resto conservato.
   }
   shots.push({vesselIndex:vi,shipId:v.id,weaponId:w.id,weapon:w.nome,suit:w.seme_trigger,bullets:count,damagePerBullet:w.damage,damage:count*w.damage,charging,charge:w.charge||0,kind:w.tipo,visual:w.effetto_visivo});
  }
 }
 return {shots,totalDamage:shots.reduce((s,x)=>s+x.damage,0),fleet:newFleet};
}
export function chooseTarget(side,op,preferredIndex=0){
 const candidates=side.fleet.map((v,i)=>({v,i})).filter(({v})=>(v.engines[op]?.hp||0)>0);
 return candidates.find(x=>x.i===preferredIndex)?.i??candidates[0]?.i??-1;
}
export function dealHit(defender,attacker,op,_target,cards,preferredIndex=0){
 const vi=chooseTarget(defender,op,preferredIndex);if(vi<0)return {defender,attacker,damage:0,destroyed:false,volley:[]};
 const volley=previewVolley(attacker,cards||[]);
 const target=defender.fleet[vi].engines[op];const damage=Math.min(target.hp,volley.totalDamage);
 const fleet=defender.fleet.map((v,i)=>i!==vi?v:{...v,engines:{...v.engines,[op]:{...target,hp:target.hp-damage}}});
 return {defender:{...defender,fleet},attacker:{...attacker,fleet:volley.fleet},damage,destroyed:target.hp>0&&target.hp-damage<=0,volley:volley.shots,targetShip:vi,rawDamage:volley.totalDamage};
}
export function findMoves(side,defender,targets){const moves=[];for(const op of supportedOperators(side)){
  for(let vi=0;vi<defender.fleet.length;vi++){
   if(!(defender.fleet[vi].engines[op]?.hp>0))continue;
   for(let i=0;i<side.hand.length;i++)for(let j=i+1;j<side.hand.length;j++){
    const p=evaluatePair(op,side.hand[i].value,side.hand[j].value,targets[op]);if(p)moves.push({op,i,j,targetShip:vi,...p});
   }
  }
 }return moves;}
export function consumeAttack(side,indices){const s=new Set(indices),used=side.hand.filter((_,i)=>s.has(i));return fillHand({...side,hand:side.hand.filter((_,i)=>!s.has(i)),discard:[...side.discard,...used]});}
function weakestLiveEngine(side){const a=[];for(let i=0;i<side.fleet.length;i++)for(const op of ENGINE_KEYS){const e=side.fleet[i].engines[op];if(e?.hp>0)a.push({i,op,e});}return a.sort((x,y)=>x.e.hp-y.e.hp)[0];}
export function sacrificeCard(side,index,opponent,secondsLeft=60){if(side.sacrifices>=3||side.deck.length===0||index<0||index>=side.hand.length)return null;
 const order=side.sacrifices;let next={...side,hand:[...side.hand],deck:[...side.deck],discard:[...side.discard],fleet:structuredClone(side.fleet),sacrifices:order+1};const [c]=next.hand.splice(index,1);next.discard.push(c);next=fillHand(next);
 let other={...opponent,fleet:structuredClone(opponent.fleet)},seconds=secondsLeft,detail='';
 if(order===0){const w=weakestLiveEngine(other);if(w){w.e.hp+=3;w.e.max+=3;}detail='+3 HP al motore nemico';}
 if(order===1){seconds=Math.max(0,seconds-3);detail='−3 secondi';}
 if(order===2){const w=weakestLiveEngine(next);if(w)w.e.hp=Math.max(0,w.e.hp-3);detail='−3 HP a un tuo motore';}
 return {ship:next,opponent:other,seconds,detail};}
export function etherChange(side,index){if(!side.ether||side.deck.length===0||index<0||index>=side.hand.length)return null;const n={...side,ether:side.ether-1,hand:[...side.hand],deck:[...side.deck],discard:[...side.discard]};const [c]=n.hand.splice(index,1);n.discard.push(c);return fillHand(n);}
export function aiChoose(side,defender,targets,rng=Math.random){const moves=findMoves(side,defender,targets);if(!moves.length)return null;
 return moves.map(m=>{const e=defender.fleet[m.targetShip].engines[m.op],v=previewVolley(side,[side.hand[m.i],side.hand[m.j]]);const dmg=Math.min(e.hp,v.totalDamage);return {...m,score:dmg+(e.hp<=dmg?100:0)+(m.op==='plus'?6:0)+rng()*2};}).sort((a,b)=>b.score-a.score)[0];}
export function initialBattle(level=1,upgrades={},rng=Math.random,mode='campaign'){
 const fleetIds=validFleet(upgrades.fleetIds)?upgrades.fleetIds:['N00'];const shipLevel=Math.max(1,Math.min(5,Number(upgrades.shipLevel)||1));
 // Opponent receives comparable fleet count and vessel engine capacity. AI has no secret advantages.
 const aiIds=validFleet(upgrades.enemyFleetIds)?upgrades.enemyFleetIds:fleetIds;
 return {level,mode,player:createShip(level,false,{fleetIds,shipLevel},rng),enemy:createShip(level,true,{fleetIds:aiIds,shipLevel},rng),
 actor:'player',round:1,seconds:60,targets:generateTargets(rng,level),selected:[],target:'plus',targetShip:0,shownPlayer:0,phase:'ready',effect:null,notice:'Seleziona un motore nemico e due carte.',logs:[],winner:null};
}
