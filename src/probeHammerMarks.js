import {PROBE_FAMILY,probeHammerVariant} from './probeHammerSpec.js';
const other=who=>who==='A'?'B':'A';
export function activeProbeMarks(battle){
 const marks=[];
 for(const [who,side]of Object.entries(battle.sides||{})){
  const signal=side.provisionalWeaponStatus?.ionProbe;if(!signal||signal.expiresPly<=battle.ply)continue;
  const enemy=battle.sides[other(who)],kind=signal.targetKind||((enemy.escorts||[]).some(e=>e.id===signal.id)?'escort':'part');
  const unit=kind==='part'?enemy.ships[0].parts.find(p=>p.id===signal.id):
   (kind==='escort'?enemy.escorts:kind==='machine'?enemy.machines:enemy.modules)?.find(u=>u.id===signal.id);
  if(!unit||unit.destroyed||kind!=='part'&&unit.hp<=0||enemy.ships[0].hp<=0)continue;
  const cardId=signal.sourceCardId||PROBE_FAMILY;
  marks.push({who,targetKind:kind,targetId:signal.id,cardId,rarity:probeHammerVariant(cardId)?.rarity||'Comune',expiresPly:signal.expiresPly,persisted:true,at:0,until:Infinity});
 }
 return marks;
}
export function probeMarkTimeline(battle,shots,shotStart,profileFor){
 const marks=activeProbeMarks(battle).map(m=>({...m}));
 const stamp=s=>shotStart+(s.delayMs||0)+(profileFor(s.cardId,s)?.flightMs||470);
 for(const shot of shots){
  const v=probeHammerVariant(shot.cardId),impactAt=stamp(shot);
  if(v?.kind==='probe'&&shot.fires&&!shot.defenseBlocked&&!shot.destroyed){
   for(const mark of marks)if(mark.who===shot.who)mark.until=Math.min(mark.until,impactAt+35);
   marks.push({who:shot.who,targetKind:shot.targetKind,targetId:shot.targetId,cardId:shot.cardId,rarity:v.rarity,
    at:impactAt+35,until:Infinity});
  }
  if(v?.kind==='hammer'&&(shot.impactIndex||0)===0&&shot.probeMarkConsumed){
   const group=shots.filter(s=>s.visualGroupId===shot.visualGroupId&&s.who===shot.who);
   const at=group.some(s=>s.fires||s.defenseBlocked)?Math.max(...group.map(stamp)):shotStart+100;
   for(const mark of marks)if(mark.who===shot.who&&mark.at<=at)mark.until=Math.min(mark.until,at);
  }
  if(shot.destroyed&&shot.fires)for(const mark of marks)
   if(mark.who===shot.who&&mark.targetId===shot.targetId&&mark.targetKind===shot.targetKind)
    mark.until=Math.min(mark.until,impactAt);
 }
 return marks.filter(m=>m.until>m.at);
}
export const probeMarkFade=(mark,age)=>age<mark.at?0:Math.max(0,Math.min(1,(mark.until+220-age)/220));
