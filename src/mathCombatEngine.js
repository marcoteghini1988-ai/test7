/**
 * ECLISSI STELLARE - motore matematico unico, indipendente da React.
 * Le carte hanno soltanto il valore stampato (A=1, J=11, Q=12, K=13).
 * I semi sono identificativi grafici, non operatori né abilita' segrete.
 */
export const OPERATION_DAMAGE = Object.freeze({ '+': 10, '-': 12, '*': 16, '/': 20 });
export const SUIT_SYMBOLS = Object.freeze({ hearts:'♥', diamonds:'♦', clubs:'♣', spades:'♠' });
const POOLS = Object.freeze({
  '+': [8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,24],
  '-': [1,2,3,4,5,6,7,8,9,10,11,12],
  '*': [12,14,15,16,18,20,21,24,28,30,32,36,40,42,48,54,60],
  '/': [2,3,4,5,6,7,8,9,10,11,12]
});
export function numericValue(card) {
  if (!card || card.isJoker || card.suit === 'joker') return null;
  const r = String(card.displayVal ?? card.rank ?? card.value ?? '').trim().toUpperCase();
  const val = r === 'A' ? 1 : r === 'J' ? 11 : r === 'Q' ? 12 : r === 'K' ? 13 : Number(r);
  return Number.isInteger(val) && val >= 1 && val <= 13 ? val : null;
}
export function mathematicalDamage(op, cardCount = 2) {
  if (!(op in OPERATION_DAMAGE)) return 0;
  // +2 per carta aggiuntiva: una formula lunga e' una scelta costosa.
  return OPERATION_DAMAGE[op] + Math.max(0, Math.min(2, cardCount - 2)) * 2;
}
export function generateMathTargets({ rng = Math.random, turn = 0, existingBomb = null, bomb = false } = {}) {
  // Bersagli indipendenti dalla mano: le carte potrebbero non bastare.
  // Divisione e moltiplicazione ruotano sul terzo bersaglio.
  const ops = ['+', '-', turn % 2 === 0 ? '*' : '/'];
  return ops.map((op, index) => {
    if (index === 2 && bomb && existingBomb?.type === 'math' && existingBomb.turnsRemaining > 0) return existingBomb;
    const pool = POOLS[op];
    const raw = Number(rng());
    const safe = Number.isFinite(raw) ? Math.min(0.999999999, Math.max(0, raw)) : 0;
    const obj = {type:'math',op,target:pool[Math.floor(safe * pool.length)],damage:OPERATION_DAMAGE[op]};
    if (index === 2 && bomb) return {...obj,isBomb:true,turnsRemaining:3};
    return obj;
  });
}
function* subsets(cards, min = 2, max = 4, start = 0, used = []) {
  if (used.length >= min) yield [...used];
  if (used.length === max) return;
  for (let i = start; i < cards.length; i++) {
    used.push(cards[i]);
    yield* subsets(cards,min,max,i+1,used);
    used.pop();
  }
}
function* permutations(items, placed=[]) {
  if (!items.length) {yield placed; return;}
  for(let i=0;i<items.length;i++) yield* permutations([...items.slice(0,i),...items.slice(i+1)],[...placed,items[i]]);
}
function evaluate(values,op) {
  if (op === '+') return values.reduce((s,n)=>s+n,0);
  if (op === '*') return values.reduce((s,n)=>s*n,1);
  if (op === '-') return values.slice(1).reduce((s,n)=>s-n,values[0]);
  if (op === '/') return values.slice(1).reduce((s,n)=>n===0?NaN:s/n,values[0]);
  return NaN;
}
export function solveMath(cards, obj, {minCards=2,maxCards=4}={}) {
  if(!obj || !(obj.op in OPERATION_DAMAGE) || !Number.isFinite(Number(obj.target))) return null;
  const valid=(cards||[]).filter(c=>numericValue(c)!==null);
  for(const set of subsets(valid,minCards,Math.min(maxCards,valid.length))){
    const orderings=(obj.op==='+'||obj.op==='*')?[set]:permutations(set);
    for(const ordered of orderings){
      const vals=ordered.map(numericValue);
      const result=evaluate(vals,obj.op);
      if(Number.isFinite(result)&&Math.abs(result-Number(obj.target))<1e-7){
        const glyph=obj.op==='*'?'×':obj.op==='/'?'÷':obj.op;
        return {cardsUsed:set,orderedCards:ordered,operands:vals,formula:vals.join(` ${glyph} `)+` = ${obj.target}`, result,
          op:obj.op,target:Number(obj.target),damage:mathematicalDamage(obj.op,set.length)};
      }
    }
  }
  return null;
}
export function bestMathSolution(cards, objectives) {
  let best=null;
  for(let i=0;i<(objectives||[]).length;i++){
    const solved=solveMath(cards,objectives[i]);
    if(solved && (!best||solved.damage>best.damage))best={...solved,objectiveIndex:i,resolvedObj:objectives[i],found:true};
  }
  return best;
}
export function planMathAiTurn(board,hand,objectives,{maxNewCards=3}={}) {
  const validBoard=(board||[]).filter(Boolean);
  const validHand=(hand||[]).filter(Boolean);
  let best=null;
  // Pianifica un attacco usando le proprie carte e quelle gia' sul banco.
  // Il numero di carte sostituite o aggiunte non supera tre.
  for(const target of (objectives||[]).map((obj,i)=>({obj,i}))){
    const pool=[...validBoard,...validHand];
    for(const chosen of subsets(pool,2,4)){
      const drawn=chosen.filter(c=>validHand.includes(c));
      if(drawn.length>maxNewCards||drawn.length>5-validBoard.filter(c=>chosen.includes(c)).length)continue;
      const sol=solveMath(chosen,target.obj,{minCards:chosen.length,maxCards:chosen.length});
      if(!sol)continue;
      const candidate={...sol,found:true,objectiveIndex:target.i,resolvedObj:target.obj,handCardsToPlay:drawn};
      if(!best || candidate.damage>best.damage || (candidate.damage===best.damage&&drawn.length<best.handCardsToPlay.length))best=candidate;
    }
  }
  return best;
}
