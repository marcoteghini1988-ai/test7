import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
export const PROBE='weapon-designed-ionic-sonda-ionica',HAMMER='weapon-designed-ionic-martello-tuono';
const other=who=>who==='A'?'B':'A';
const familyCard=(family,rarity)=>WEAPON_NEAR_FINAL_VALUES.find(c=>(c.weaponFamilyId||c.id)===family&&c.rarita===rarity);
export function probeHammerSequence({rarity='Rara',who='A',mode='combo',supports=false,targetPart='weapons',hammerTargetPart=targetPart}={}){
 const probe=familyCard(PROBE,rarity),hammer=familyCard(HAMMER,rarity);
 if(!probe||mode!=='probe-only'&&!hammer)throw Error('Variante non esistente');
 let b=createMaglioReviewBattle({nowMs:0,cardId:probe.id,supports,shipB:'C01'}),clock=1000;
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(60).fill('energy-ionic');s.energyPile=[];s.elementalCharges={};
  for(const e of s.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;e.hp=350;e.maxHp=350;}
 }
 const frames=[],turns=[];
 const target=()=>supports?{targetKind:'escort',targetId:b.sides[other(who)].escorts[0].id}:{targetKind:'part',targetId:targetPart,partId:targetPart};
 const play=(side,ids=[],order={})=>{
  b.sides[side].hand=[...ids];const before=structuredClone(b);
  const r=resolvePreparedFleetTurn(b,side,{pass:true,cards:ids.map((_,i)=>i),...target(),...order},clock);clock+=5000;
  if(!r.ok)throw Error(r.reason);b=r.battle;
  const events=r.events.filter(e=>e.kind==='weapon-provisional-shot'&&[probe.id,hammer?.id].includes(e.cardId));
  for(const event of events)frames.push({cardId:event.cardId,kind:event.cardId===probe.id?'probe':'hammer',who:side,rarity,mode,event,disabledBefore:!!before.sides[side].fireBlocked||before.sides[side].fireDisabledUntil>before.ply,before,after:structuredClone(b)});
  turns.push({side,ids,events:r.events});return r;
 };
 const shield=(remaining=1)=>{
  const s=b.sides[other(who)],source='probe-hammer-preview-defense';
  s.defenses.push({id:'gen-227',source,hidden:false,untilPly:99});
  s.protections.push({id:'gen-227',source,kind:'protect',target:supports?'escort':'part',partId:targetPart,escortSlot:0,remaining,untilPly:99});
 };
 if(who==='B')play('A');
 if(mode==='probe-blocked')shield();
 if(mode==='target-dies')b.sides[other(who)].escorts[0].hp=1;
 if(mode==='first-hit-kills')b.sides[other(who)].escorts[0].hp=rarity==='Rara'?30:rarity==='Epica'?75:105;
 if(mode==='weapon-blocked')b.sides[who].fireDisabledUntil=99;
 const initial=structuredClone(b);
 if(mode==='hammer-alone')play(who,[hammer.id]);
 else if(mode==='reverse')play(who,[hammer.id,probe.id]);
 else if(['next-turn','expired','hammer-blocked'].includes(mode)){
  play(who,[probe.id]);play(other(who));
  if(mode==='expired'){play(who);play(other(who));}
  if(mode==='hammer-blocked')shield(2);
  play(who,[hammer.id],supports?{}:{targetKind:'part',targetId:hammerTargetPart,partId:hammerTargetPart});
 }else if(mode==='probe-only')play(who,[probe.id]);
 else play(who,[probe.id,hammer.id]);
 return {rarity,who,mode,supports,targetPart,probeId:probe.id,hammerId:hammer?.id,initial,battle:b,turns,frames};
}
export function probeHammerCases(){
 return [...['Comune','Rara','Epica','Leggendaria'].map(rarity=>probeHammerSequence({rarity,mode:'probe-only'})),
  ...['Rara','Epica','Leggendaria'].flatMap(rarity=>[probeHammerSequence({rarity,mode:'hammer-alone'}),probeHammerSequence({rarity,mode:'combo'}),probeHammerSequence({rarity,mode:'next-turn',supports:true})]),
  probeHammerSequence({mode:'reverse'}),probeHammerSequence({mode:'probe-blocked'}),probeHammerSequence({mode:'hammer-blocked'}),probeHammerSequence({mode:'expired'}),
  probeHammerSequence({mode:'target-dies',supports:true}),probeHammerSequence({mode:'first-hit-kills',supports:true}),
  probeHammerSequence({mode:'next-turn',targetPart:'generator',hammerTargetPart:'weapons'}),probeHammerSequence({who:'B',supports:true}),probeHammerSequence({mode:'weapon-blocked'})];
}
