// Stesso generatore deterministico del combattimento: nessun Math.random.
export function shuffleFleetCards(cards,state){
 const result=[...cards];
 for(let i=result.length-1;i>0;i--){
  state.rng=(1664525*(state.rng>>>0)+1013904223)>>>0;
  const j=(state.rng>>>0)%(i+1);
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}

// Un solo punto per tutte le pescate, incluse quelle degli effetti speciali.
// Lo snapshot serve soltanto alla presentazione: non duplica carte giocabili.
export function recycleFleetDiscard(battle,side){
 if(side.deck.length||!side.discard.length)return false;
 const cards=[...side.discard];
 side.deck=shuffleFleetCards(cards,battle);
 side.discard=[];
 side.deckShuffle={serial:(side.deckShuffle?.serial||0)+1,cards,
  ply:battle.ply,round:battle.round};
 return true;
}
