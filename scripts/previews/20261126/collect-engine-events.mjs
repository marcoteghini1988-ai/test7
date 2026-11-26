import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {fleetWeaponProjectiles} from '../../../src/maglioBattleVisuals.js';
import {ALL_WEAPON_CARDS} from '../../../src/fleetNext/weaponRarityEvolutions.js';
import {FAMILIES,reviewOrigin} from './review-spec.mjs';
const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const cases=[];
for(const f of FAMILIES.filter(f=>!['magnetic-grapple','alloy-collision'].includes(f.kind)))for(const card of ALL_WEAPON_CARDS.filter(c=>(c.weaponFamilyId||c.id)===f.id)){
 const options=[{mode:'base',supports:f.kind==='cascade-piercer',energyCards:0}];
 if(f.kind==='thermal-reclaimer')options.push({mode:'boost',secondTurn:true});
 if(f.kind==='induction')for(const energyCards of [0,1,2])options.push({mode:'shield-'+energyCards,supports:true,withDefense:true,energyCards});
 if(f.kind==='cascade-piercer')options.push({mode:'cascade',supports:true,cascadeMode:'two',energyCards:2});
 for(const option of options){
  const before=createMaglioReviewBattle({...option,cardId:card.id,nowMs:0}),r=resolvePreparedFleetTurn(before,'A',option.secondTurn?{...order,cards:[],pass:true}:order,2000);
  if(!r.ok)throw Error(r.reason);
  const aggregate=r.events.filter(e=>e.cardId===card.id&&['weapon-base-shot','weapon-designed-shot','weapon-provisional-shot'].includes(e.kind));
  const projectiles=fleetWeaponProjectiles(r.events).filter(e=>e.cardId===card.id);
  const state=b=>Object.fromEntries(Object.entries(b.sides).map(([who,s])=>[who,{motherHp:s.ships[0].hp,escorts:s.escorts.map(e=>({id:e.id,hp:e.hp,destroyed:e.destroyed})),energy:s.energyPile,charges:s.elementalCharges,defenses:s.defenses,discard:s.discard}]));
  cases.push({key:card.id+':'+option.mode,kind:f.kind,mode:option.mode,cardId:card.id,aggregate:aggregate.map(e=>({damage:e.actualDamage,hits:e.impacts?.map(h=>({targetKind:h.targetKind,targetId:h.targetId,actualDamage:h.actualDamage})),count:e.projectileCount})),state:state(r.battle),before:state(before),projectiles:projectiles.map((p,i)=>({damage:p.actualDamage,salvoCount:p.salvoCount,targetKind:p.targetKind,targetId:p.targetId,origin:p.cascadeTransfer?null:reviewOrigin(p,i)}))});
 }
}
process.stdout.write(JSON.stringify(cases));
