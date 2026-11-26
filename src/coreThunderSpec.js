// Tempi della revisione scenica 2 approvata; condivisi da partita e anteprima.
export const CORE_FAMILY='weapon-designed-ionic-nucleo-folgore';
export const CORE_KIND='growing-thunder-core';
export const CORE_TIMING=Object.freeze({charge:880,flight:1250,impact:1150,total:4000});
export const coreFrame=(profile,shot={})=>({rarity:profile.rarity,who:shot.who,
 stage:shot.stage||1,currentStage:shot.coreChargeStage||1,
 broken:!!shot.coreChargeBroken,blocked:!!shot.defenseBlocked,
 recharge:shot.energySpent>0});
