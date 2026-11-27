// Prepares visible review situations through real turns of the combat engine.
import {resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
import {WEAPON_NEAR_FINAL_VALUES} from '../src/fleetNext/weaponRarityEvolutions.js';
import {probeHammerVariant,PROBE_FAMILY,HAMMER_FAMILY} from '../src/probeHammerSpec.js';
export function configureProbeHammerReview(b,{cardId,probeHammerMode='single',blocked=false,withDefense=false,nowMs=Date.now()}={}){
 const variant=probeHammerVariant(cardId);if(!variant)return b;
 const find=family=>WEAPON_NEAR_FINAL_VALUES.find(c=>(c.weaponFamilyId||c.id)===family&&c.rarita===variant.rarity);
 const probe=find(PROBE_FAMILY),hammer=find(HAMMER_FAMILY),mode=hammer?probeHammerMode:'single';
 let state=b;
 const hand=ids=>{for(const side of Object.values(state.sides))side.hand=[...ids,...Array(7-ids.length).fill('energy-ionic')];};
 for(const side of Object.values(state.sides)){
  side.energyPile=[];side.elementalCharges={};side.deck=Array(40).fill('energy-ionic');side.fireDisabledUntil=0;
  for(const escort of side.escorts){escort.skill={requires:[],action:'none'};escort.supportSkillIds=[];escort.supportSkillId=null;}
 }
 if(mode==='single')hand([cardId]);
 else if(mode==='combo')hand([probe.id,hammer.id]);
 else if(mode==='reverse')hand([hammer.id,probe.id]);
 else{
  for(const side of Object.values(state.sides)){
   side.defenses=[];side.protections=[];
   if(mode==='marked-dead'&&side.escorts[0])side.escorts[0].hp=1;
   if(mode==='first-hit-kills'&&side.escorts[0])side.escorts[0].hp={Rara:30,Epica:75,Leggendaria:105}[variant.rarity];
  }
  hand([probe.id]);
  const play=(who,cards)=>{
   const side=state.sides[who==='A'?'B':'A'],target=side.escorts.find(e=>!e.destroyed&&e.hp>0);
   const part=mode==='generator-mark'?'generator':'weapons';
   const result=resolvePreparedFleetTurn(state,who,{cards,pass:true,
    ...(target?{targetKind:'escort',targetId:target.id}:{targetKind:'part',targetId:part,partId:part})},nowMs);
   if(!result.ok)throw Error('Preparazione Sonda/Martello: '+result.reason);state=result.battle;
  };
  play('A',[0]);play('B',[0]);
  if(mode==='expired'){play('A',[]);play('B',[]);}
  hand([hammer.id]);
  if(withDefense||mode==='double-defense')for(const [who,side]of Object.entries(state.sides)){
   const source='review-probe-hammer-shield-'+who;
   side.defenses.push({id:'gen-227',source,hidden:false,untilPly:99});
   side.protections.push({id:'gen-227',source,kind:'protect',target:side.escorts.length?'escort':'part',partId:'weapons',escortSlot:0,remaining:mode==='double-defense'?2:1,untilPly:99});
  }
 }
 if(blocked)state.sides.A.fireDisabledUntil=state.ply+20;
 return state;
}
