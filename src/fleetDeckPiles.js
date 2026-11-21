export const FLEET_DECK_SHUFFLE_MS=1600;
export const FLEET_PILE_CARD_THICKNESS=.52;

export function fleetPileDepth(count){
 return Math.min(28,Math.max(0,count)*FLEET_PILE_CARD_THICKNESS);
}

export function fleetPileView(side,shuffle=null){
 const recycling=shuffle&&shuffle.serial===side.deckShuffle?.serial;
 return {
  deckCount:side.deck.length,
  discardCards:recycling?shuffle.cards:side.discard,
  recycling:!!recycling,
  flyingCards:recycling?shuffle.cards.slice(-8):[]
 };
}
