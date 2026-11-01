// Eclissi Stellare: motore numerico puro, indipendente da React e dal rendering.
export const ENGINE_KEYS = ['plus', 'minus', 'times', 'divide'];
export const META = {
  plus:   { sign: '+', name: 'Scudi',      color: '#26baff', title: 'Schermo difensivo' },
  minus:  { sign: '−', name: 'Evasione',   color: '#57e4a1', title: 'Contromisure' },
  times:  { sign: '×', name: 'Attacco',    color: '#ff674d', title: 'Armamento' },
  divide: { sign: '÷', name: 'Energia',    color: '#b780ff', title: 'Alimentazione' },
};
export const BASE_HP = { plus: 72, minus: 72, times: 85, divide: 72 };
export const TOTAL_LEVELS = 30;
export const campaignInfo = (level) => ({
  level, isBoss: level % 5 === 0, world: Math.ceil(level / 5),
  name: level % 5 === 0 ? `Guardiano del settore ${level}` : ['Ricognitore di frontiera','Predone orbitale','Custode delle rovine','Squadrone d’assalto'][(level - 1) % 5],
  credits: 35 + level * 7 + (level % 5 === 0 ? 80 : 0),
});
export function shuffled(a, rng = Math.random) {
  const v = [...a]; for (let i=v.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1));[v[i],v[j]]=[v[j],v[i]]; } return v;
}
export function newDeck(rng=Math.random) { return shuffled(['♥','♦','♣','♠'].flatMap((suit)=>Array.from({length:13}, (_,i)=>({id:`${suit}${i+1}`,suit,value:i+1}))),rng); }
export function newShip(level=1, isEnemy=false, upgrades={}) {
  const boost = isEnemy ? Math.min(45,Math.floor((level-1)*1.35)+(level%5===0?13:0)) : 0;
  const engines={}; for(const k of ENGINE_KEYS){ const max=BASE_HP[k] + boost + (isEnemy?0:(upgrades[k]||0)*7);engines[k]={hp:max,max}; }
  return { engines, hand:[], deck:[], discard:[], sacrifices:0, ether: isEnemy ? 1 : 2 };
}
export function fillHand(ship){ const next={...ship,hand:[...ship.hand],deck:[...ship.deck]};while(next.hand.length<7 && next.deck.length)next.hand.push(next.deck.pop());return next; }
export function createShip(level,isEnemy,upgrades,rng=Math.random){let ship=newShip(level,isEnemy,upgrades);ship.deck=newDeck(rng);return fillHand(ship);}
export function generateTargets(rng=Math.random, level=1){
  const ri=(lo,hi)=>lo+Math.floor(rng()*(hi-lo+1));
  return {plus:ri(6,23), minus:ri(1,11), times:ri(8,39+Math.min(12,Math.floor(level/4))), divide:ri(1,10)};
}
export function calculation(op,a,b) {
  if(op==='plus')return a+b;
  if(op==='minus')return a-b;
  if(op==='times')return a*b;
  if(op==='divide')return b===0?NaN:a/b;
  return NaN;
}
export function evaluatePair(op, first, second, target){
  if(!Number.isFinite(target))return null;
  const f=calculation(op,first,second);if(Number.isInteger(f) && f===target)return {a:first,b:second,result:f};
  if(op==='minus'||op==='divide'){
    const rev=calculation(op,second,first);if(Number.isInteger(rev)&&rev===target)return {a:second,b:first,result:rev};
  }
  return null;
}
export function findMoves(ship,defender,targets){
  const moves=[];
  ENGINE_KEYS.forEach(op=>{
    if(defender.engines[op].hp<=0)return;
    for(let i=0;i<ship.hand.length;i++)for(let j=i+1;j<ship.hand.length;j++){
      const p=evaluatePair(op,ship.hand[i].value,ship.hand[j].value,targets[op]);
      if(p)moves.push({op,i,j,...p});
    }
  });return moves;
}
export function totalHP(ship){return ENGINE_KEYS.reduce((s,k)=>s+ship.engines[k].hp,0);}
export function totalMax(ship){return ENGINE_KEYS.reduce((s,k)=>s+ship.engines[k].max,0);}
export function isDestroyed(ship){return ENGINE_KEYS.every(k=>ship.engines[k].hp<=0);}
export function healthScore(ship){return totalHP(ship)/totalMax(ship);}
export function deckExhausted(player,enemy){return player.deck.length===0 || enemy.deck.length===0;}
export function deckVerdict(player,enemy){const a=healthScore(player),b=healthScore(enemy);return Math.abs(a-b)<0.00001?'draw':a>b?'player':'enemy';}
export function dealHit(defender,attacker,op,target){
  const e=defender.engines[op]; if(!e||e.hp<=0) return {defender,damage:0,destroyed:false};
  // Risultato matematico = danno iniziale. Le difese dei quattro sistemi possono ridurlo.
  let mult=1;
  if(attacker.engines.times.hp>0)mult+=.08;
  if(defender.engines.plus.hp>0 && op!=='plus')mult-=.12;
  if(defender.engines.minus.hp>0 && op!=='minus')mult-=.05;
  const damage=Math.min(e.hp,Math.max(1,Math.round(target*mult)));
  const updated={...defender,engines:{...defender.engines,[op]:{...e,hp:e.hp-damage}}};
  return {defender:updated,damage,destroyed:e.hp>0 && e.hp-damage<=0,raw:target};
}
export function consumeAttack(ship,indices){
  const ids=new Set(indices);const used=ship.hand.filter((_,i)=>ids.has(i));
  return fillHand({...ship,hand:ship.hand.filter((_,i)=>!ids.has(i)),discard:[...ship.discard,...used]});
}
export function sacrificeCard(ship, index, opponent, secondsLeft=60){
  if(ship.sacrifices>=3||ship.deck.length===0||index<0||index>=ship.hand.length)return null;
  const order=ship.sacrifices;let next={...ship,hand:[...ship.hand],deck:[...ship.deck],discard:[...ship.discard],engines:{...ship.engines},sacrifices:order+1};
  const [removed]=next.hand.splice(index,1);next.discard.push(removed); next=fillHand(next);
  let other={...opponent,engines:{...opponent.engines}};let seconds=secondsLeft;let detail='';
  if(order===2){const live=ENGINE_KEYS.filter(k=>next.engines[k].hp>0).sort((a,b)=>next.engines[a].hp-next.engines[b].hp);if(live.length){const k=live[0];next.engines[k]={...next.engines[k],hp:Math.max(0,next.engines[k].hp-3)};}detail='−3 HP alla tua nave';}
  if(order===1){seconds=Math.max(0,seconds-3);detail='−3 secondi';}
  if(order===0){const live=ENGINE_KEYS.filter(k=>other.engines[k].hp>0).sort((a,b)=>other.engines[a].hp-other.engines[b].hp);if(live.length){const k=live[0];other.engines[k]={...other.engines[k],max:other.engines[k].max+3,hp:other.engines[k].hp+3};}detail='+3 HP al nemico';}
  return {ship:next,opponent:other,seconds,detail};
}
export function etherChange(ship,index){if(!ship.ether||ship.deck.length===0||index<0||index>=ship.hand.length)return null;
  const next={...ship,ether:ship.ether-1,hand:[...ship.hand],deck:[...ship.deck],discard:[...ship.discard]};
  const [old]=next.hand.splice(index,1);next.discard.push(old);return fillHand(next);
}
export function aiChoose(ship,defender,targets,rng=Math.random){
  const moves=findMoves(ship,defender,targets);if(!moves.length)return null;
  // prioritizza un motore vicino alla distruzione, senza conoscenza di carte future
  const scored=moves.map(m=>{
    const e=defender.engines[m.op];const lethal=e.hp<=targets[m.op]*1.08;
    const priority=lethal?120:0;
    const systemBonus=m.op==='plus'?9:m.op==='times'?8:m.op==='divide'?5:2;
    return {...m,score:priority+Math.min(targets[m.op],e.hp)+systemBonus+rng()*3};
  }).sort((a,b)=>b.score-a.score);
  return scored[0];
}
export function initialBattle(level=1,upgrades={},rng=Math.random,mode='campaign'){
  return {level,mode,player:createShip(level,false,upgrades,rng),enemy:createShip(level,true,{},rng),
    actor:'player',round:1,seconds:60,targets:generateTargets(rng,level), selected:[],target:'times',
    phase:'ready',effect:null,notice:'Scegli un motore nemico e due carte.',logs:['Battaglia iniziata. Quattro motori da neutralizzare.'],winner:null};
}
