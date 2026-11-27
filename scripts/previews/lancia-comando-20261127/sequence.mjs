import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {COMMAND_LANCE_FAMILY} from '../../../src/commandLanceSpec.js';
const other=who=>who==='A'?'B':'A';
export function lanceSequence({rarity='Rara',who='A',mode='active',supports=false,slot=0}={}){
 const c=WEAPON_NEAR_FINAL_VALUES.find(c=>(c.weaponFamilyId||c.id)===COMMAND_LANCE_FAMILY&&c.rarita===rarity);
 let b=createMaglioReviewBattle({cardId:c.id,nowMs:0,supports,shipB:'C01',slot});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(40).fill('energy-ionic');side.energyPile=[];side.elementalCharges={};
  side.commander=null;
  for(const e of side.escorts){e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
 }
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1).battle;
 const side=b.sides[who],enemy=b.sides[other(who)],characterId='gen-216';
 if(!['missing','same-turn','expired'].includes(mode))side.commander={id:characterId,source:'lance-review-character',untilPly:b.ply+4};
 if(mode==='expired')side.commander={id:characterId,source:'lance-review-character',untilPly:b.ply};
 if(mode==='disabled')side.fireDisabledUntil=99;
 const target=supports?{targetKind:'escort',targetId:enemy.escorts[0].id}:{targetKind:'part',targetId:'weapons',partId:'weapons'};
 if(mode==='defense'){
  enemy.defenses.push({id:'gen-227',source:'lance-review-shield',hidden:false,untilPly:99});
  enemy.protections.push({id:'gen-227',source:'lance-review-shield',kind:'protect',target:supports?'escort':'part',partId:'weapons',escortSlot:0,remaining:1,untilPly:99});
 }
 const ids=mode==='same-turn'?[characterId,c.id]:[c.id];side.hand=[...ids];
 const initial=structuredClone(b),r=resolvePreparedFleetTurn(b,who,{cards:ids.map((_,i)=>i),pass:true,...target},1000);
 const disabledBefore=!!initial.sides[who].fireBlocked||initial.sides[who].fireDisabledUntil>initial.ply;
 const frames=(r.events||[]).filter(e=>e.kind==='weapon-provisional-shot'&&e.cardId===c.id).map(event=>({event,cardId:c.id,disabledBefore}));
 return {rarity,who,mode,supports,slot,cardId:c.id,characterId,initial,battle:r.battle||b,accepted:r.ok,played:!!r.events?.some(e=>e.kind==='machine-deploy'&&e.cardId===c.id),reason:r.reason||'',events:r.events||[],frames};
}
export const lanceCases=()=>[
 ...['Rara','Epica','Leggendaria'].flatMap(rarity=>['A','B'].map(who=>lanceSequence({rarity,who,supports:who==='B'}))),
 ...['same-turn','missing','expired','disabled','defense'].map(mode=>lanceSequence({mode})),
 lanceSequence({rarity:'Leggendaria',mode:'defense',who:'B',supports:true}),
 lanceSequence({rarity:'Epica',slot:1,supports:true})
];
