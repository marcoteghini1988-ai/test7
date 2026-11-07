// Runtime isolato delle 6 carte Oggetto Epico. Nessuna scrittura di wallet,
// inventario, stato campagna o ricompense PvP. Usa carte numeriche realmente
// presenti nel mazzo ed effetti validi soltanto per i cicli indicati.
import {TACTICAL_EPIC_CARDS,tacticalEpicActive} from './tacticalEpicCards.js';

export function activateTacticalEpic(side,id,round,choice=0,log=[]){
 const rule=TACTICAL_EPIC_CARDS[id];
 if(!rule)throw new Error('Epico sconosciuto '+id);
 side.epic.active={id,untilRound:round+rule.cycles-1,startedRound:round};
 side.epic.used.push(id);
 if(id==='epic_item_7')side.heated=false;
 if(id==='epic_item_1'){
  const deck=side.numeric.deck;
  const index=Math.min(choice,Math.min(10,deck.length)-1);
  if(index>0)deck.unshift(deck.splice(index,1)[0]);
  side.epic.peek=deck.slice(0,10).map(c=>({value:c.value,suit:c.suit}));
 }
 if(id==='epic_item_3')side.epic.drawChoice=choice;
 log.push(side.key+': '+rule.name+' attivato per '+rule.cycles+
  (rule.cycles===1?' scontro':' scontri')+' (carta consumata)');
}
export function expireTacticalEpic(side,round){
 if(side.epic?.active&&side.epic.active.untilRound<round)side.epic.active=null;
 if(side.epic?.exchangeUntilRound<round){
  side.epic.exchangeCredits=0;
  side.epic.exchangeUntilRound=0;
 }
}
export function tacticalEpicProtectsFromHeat(side,round){
 return tacticalEpicActive(side,'epic_item_7',round);
}
export function tacticalEpicMatriceDamage(side,round,op){
 return tacticalEpicActive(side,'epic_item_9',round)&&['pair','trips'].includes(op)&&
  side.weapons.some(w=>w.kind==='Accumulo')?2:0;
}
export function tacticalEpicNumericChoice(side,round){
 return tacticalEpicActive(side,'epic_item_3',round)&&side.epic.active.startedRound===round?
  side.epic.drawChoice??0:0;
}
export function resolveTacticalEpicAfterCombat(sides,round,impacts,log=[]){
 // Evaluate both sides from the SAME authoritative impacts. No client A/B bias.
 const total=impacts.reduce((sum,e)=>sum+Math.max(0,e.damage||0),0);
 for(const key of ['A','B']){
  const side=sides[key],incoming=impacts.some(e=>e.by!==key&&(e.damage||0)>0);
  if(tacticalEpicActive(side,'epic_item_6',round)&&incoming){
   side.epic.exchangeCredits=1;
   side.epic.exchangeUntilRound=round+1;
   side.epic.peek=side.numeric.deck.slice(0,6).map(c=>({value:c.value,suit:c.suit}));
   log.push(key+': Pendolo: prossime 6 numeriche rivelate, +1 ricambio nel prossimo ciclo');
  }
  if(tacticalEpicActive(side,'epic_item_8',round)&&total>0){
   const preview=Math.floor(total/10);
   side.epic.dustPreview+=preview; // Demo only, never real Polvere Stellare.
   const sync=Math.min(10,Math.floor(total/5));
   side.sync=Math.min(100,side.sync+sync);
   log.push(key+': Calice: +'+sync+' Sincronia, +'+preview+
    ' Polvere simulata (NESSUNA ricompensa reale)');
  }
 }
}
