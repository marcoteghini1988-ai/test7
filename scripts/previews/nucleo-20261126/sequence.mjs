// Anteprima isolata: gli HP e le cariche arrivano dal vero motore.
import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {weaponFamily,WEAPON_NEAR_FINAL_BY_ID} from '../../../src/fleetNext/weaponRarityEvolutions.js';
export const FAMILY='weapon-designed-ionic-nucleo-folgore';
export const RARITIES=['Rara','Epica','Leggendaria'];
const other=who=>who==='A'?'B':'A';
export function coreReviewSequence({rarity='Rara',who='A',mode='charged',supports=false,turns=3}={}){
 const card=weaponFamily(FAMILY).find(c=>c.rarita===rarity);
 if(!card)throw Error('Rarità del Nucleo non valida');
 const printed=WEAPON_NEAR_FINAL_BY_ID[card.id];
 let b=createMaglioReviewBattle({cardId:card.id,nowMs:0,supports,shipB:'R02'}),clock=1000;
 for(const s of Object.values(b.sides)){s.hand=[];s.deck=Array(30).fill('energy-ionic');s.energyPile=[];s.elementalCharges={};}
 const turn=(side,ids)=>{
  b.sides[side].hand=[...ids];
  const result=resolvePreparedFleetTurn(b,side,{pass:true,cards:ids.map((_,i)=>i),
   targetKind:supports?'escort':'part',targetId:supports?b.sides[other(side)].escorts[0]?.id:'weapons',partId:'weapons'},clock);
  clock+=5000;if(!result.ok)throw Error(result.reason);b=result.battle;return result;
 };
 if(who==='B')turn('A',[]);
 if(mode==='old-only'){
  b.sides[who].energyPile=['energy-ionic','energy-ionic'];
  b.sides[who].elementalCharges={ionic:2};
 }
 if(mode==='blocked'){
  const s=b.sides[other(who)],source='core-preview-public-defense';
  s.defenses.push({id:'gen-227',source,hidden:false,untilPly:99});
  s.protections.push({id:'gen-227',source,kind:'protect',target:supports?'escort':'part',
   escortSlot:0,partId:'weapons',remaining:1,untilPly:99});
 }
 const frames=[];
 for(let stage=1;stage<=turns;stage++){
  const ids=stage===1?[card.id]:mode==='old-only'||mode==='broken'&&stage===2?[]:['energy-ionic'];
  const before=structuredClone(b),beforePile=b.sides[who].energyPile.length;
  const result=turn(who,ids);
  const event=result.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===card.id);
  const machine=b.sides[who].machines.find(m=>m.sourceCardId===card.id);
  if(!event||event.hitCount!==1)throw Error('Atteso un unico colpo reale per turno');
  const broken=!!machine?.chargeBroken,impact=event.impacts[0];
  const fresh=ids.filter(id=>id==='energy-ionic').length;
  const afterPile=b.sides[who].energyPile.length,spent=beforePile+fresh-afterPile;
  const currentStage=broken?1:stage;
  frames.push({cardId:card.id,rarity,who,mode,stage,currentStage,broken,
   recharge:stage>1&&spent>0,freshEnergy:fresh,energyBefore:beforePile,
   energyAfter:afterPile,energySpent:spent,displayedNominal:printed.effectSpec.weaponProfile.damageStages[currentStage-1],
   actualDamage:event.actualDamage,targetKind:impact.targetKind,targetId:impact.targetId,
   blocked:impact.defenseBlocked,destroyed:impact.destroyed,event,
   before,after:structuredClone(b),events:result.events});
  if(stage<turns)turn(other(who),[]);
 }
 // Dopo il terzo colpo si osserva anche la scadenza al successivo turno proprio.
 let expires=false;
 if(turns===3){turn(other(who),[]);const r=turn(who,[]);
  expires=!r.battle.sides[who].machines.some(m=>m.sourceCardId===card.id)&&r.battle.sides[who].discard.includes(card.id);
 }
 return {cardId:card.id,rarity,who,mode,supports,frames,expires};
}

export function coreReviewCases(){
 return [...RARITIES.map(rarity=>coreReviewSequence({rarity})),
  coreReviewSequence({rarity:'Epica',mode:'broken'}),
  coreReviewSequence({rarity:'Rara',mode:'old-only'}),
  coreReviewSequence({rarity:'Rara',who:'B',supports:true,turns:1}),
  coreReviewSequence({rarity:'Rara',mode:'blocked',supports:true,turns:1})];
}
