// Armi Luce. L'ologramma non entra in side.escorts né nel mazzo.
const alive=u=>!!u&&u.hp>0&&!u.destroyed;
const other=who=>who==='A'?'B':'A';
const slug=m=>m?.weaponProfile?.slug;
const isA=m=>slug(m)==='replicatore-olografico';
const isB=m=>slug(m)==='proiettore-olografico';
const active=(side,m,ply)=>alive(m)&&(m.untilPly==null||m.untilPly>ply)&&
 (m.disabledUntilPly||0)<=ply&&(m.jammedUntilPly||0)<=ply&&(side.weaponSlotLocks?.[m.slot]||0)<=ply;
const ready=(side,m,ply,h)=>active(side,m,ply)&&h.unitEnabled(m,ply)&&!h.unitSilenced(m,ply)&&
 !h.weaponSlotLocked(side,m.slot,ply)&&(ply-m.deployedPly)%2===0&&ply>=m.deployedPly;
const realA=(side,ply)=>side.machines.some(m=>active(side,m,ply)&&(isA(m)||m.holoOwnerCardId));
const realB=(side,ply)=>side.machines.some(m=>active(side,m,ply)&&isB(m)&&!m.holoOwnerCardId);
const factor=(side,ply)=>realA(side,ply)&&realB(side,ply)?1:.7;
const draw=(b,n)=>{b.rng=(Math.imul(1664525,b.rng>>>0)+1013904223)>>>0;return (b.rng>>>8)%n;};
const clone=x=>JSON.parse(JSON.stringify(x));
export function rememberLastWeapon(side,m,ply){
 if(!m.holoOwnerCardId)side.nextLastWeapon={machine:clone(m),serial:m.id,ply,balanceFactor:side.weaponBalanceFactor??null};
}
export function hologramProjection(side,ply){
 const p=side?.nextHologram;
 if(!p||p.untilPly<=ply||!side.machines.some(m=>m.id===p.sourceMachineId&&active(side,m,ply)))return null;
 return p;
}
export function hologramRows(side,ply){
 const p=hologramProjection(side,ply);if(!p)return null;
 return p.positions.map((pos,slot)=>{
  const unit=pos.decoy?p.decoy:side.escorts.find(e=>e.id===pos.realId);
  return alive(unit)?{key:pos.key,slot,unit,decoy:!!pos.decoy}:null;
 }).filter(Boolean);
}
export function hologramCombatEscorts(side,ply){
 const rows=hologramRows(side,ply);return rows?rows.map(r=>r.unit):(side.escorts||[]);
}
export function hologramDisplayEscorts(side,ply){
 const rows=hologramRows(side,ply);if(!rows)return null;
 return rows.map(r=>{
  const {nextHoloDecoy,nextHoloSourceId,...publicUnit}=r.unit;
  return {...publicUnit,id:r.key,slot:r.slot};
 });
}
export function hologramSelectedEscort(side,ply,order){
 const rows=hologramRows(side,ply);
 return rows?.find(r=>order.targetId?r.key===order.targetId:r.slot===order.escortSlot)?.unit||null;
}
export function hologramGuardUnits(side,ply,realGuards){
 const rows=hologramRows(side,ply);if(!rows||!realGuards.length)return realGuards;
 const ids=new Set(realGuards.map(r=>r.id));
 return rows.filter(r=>r.decoy||ids.has(r.unit.id)).map(r=>r.unit);
}
export function prepareHolographicReplica(b,ctx,events,h){
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const real=side.machines.find(m=>isA(m)&&ready(side,m,b.ply,h));
 if(!real||side.fireBlocked||side.fireDisabledUntil>b.ply||h.arsenalBonus(side,real,b.ply,1)<=0)return null;
 const source=enemy.nextLastWeapon;
 if(!source||isA(source.machine)){
  real.replicaState=null;real.replicaSerial=null;
  events.push(h.emit(b,ctx.who,'next-weapon-holo-no-source',real.name+' · nessuna arma replicabile',
   {cardId:real.sourceCardId,machineId:real.id,sourceCardId:source?.machine.sourceCardId||null}));
  return null;
 }
 const same=real.replicaSerial===source.serial;
 const previous=same&&real.replicaState&&real.replicaState.untilPly>b.ply?real.replicaState:null;
 const spec=source.machine.weaponProfile,base=source.machine;
 if(spec?.pattern==='thermal-coupler'&&!side.machines.some(m=>m.id!==real.id&&m.weaponProfile?.pattern==='binary-overload'&&active(side,m,b.ply))){
  real.replicaState=null;real.replicaSerial=source.serial;return null;
 }
 const duration=spec?.durationTurns||Math.max(1,Math.round((base.untilPly-base.deployedPly)/2)||1);
 const copy=previous?clone(previous):{...clone(base),deployedPly:b.ply,untilPly:b.ply+2*duration,
  sequenceEnteredPly:b.ply,sequenceEligible:base.sequenceStage===1,observedHpLoss:side.weaponObservedHpLoss||0};
 const multiplier=factor(side,b.ply);
 Object.assign(copy,{id:real.id,slot:real.slot,source:real.source,hp:real.hp,maxHp:real.maxHp,destroyed:false,
  disabledUntilPly:real.disabledUntilPly||0,jammedUntilPly:real.jammedUntilPly||0,cardDiscarded:true,
  holoOwnerCardId:real.sourceCardId,holoMultiplier:multiplier,holoSourceBalanceFactor:source.balanceFactor,holoOwnerUntilPly:real.untilPly});
 real.replicaSerial=source.serial;
 side.machines=side.machines.map(m=>m===real?copy:m);ctx.holoReplica={real,copy};
 events.push(h.emit(b,ctx.who,'next-weapon-holo-copy',real.name+' · copia '+copy.name,
  {cardId:real.sourceCardId,machineId:real.id,machineSlot:real.slot,copiedCardId:copy.sourceCardId,
   copiedElementId:copy.weaponElementId,multiplier,stage:1+(b.ply-copy.deployedPly)/2}));
 return copy;
}
export function restoreHolographicReplica(b,ctx){
 const state=ctx.holoReplica;if(!state)return;
 const side=b.sides[ctx.who],{real,copy}=state;
 real.replicaState=side.machines.some(m=>m.id===copy.id)&&!copy.destroyed?clone(copy):null;
 if(copy.destroyed||copy.hp<=0){
  real.hp=0;real.destroyed=true;
  if(!real.cardDiscarded){side.discard.push(real.sourceCardId);real.cardDiscarded=true;}
 }
 side.machines=side.machines.filter(m=>m.id!==real.id);
 if(!real.destroyed)side.machines.push(real);
 side.machines.sort((a,z)=>a.slot-z.slot);ctx.holoReplica=null;
}
export function prepareHolographicProjection(b,ctx,events,h){
 const side=b.sides[ctx.who],ply=b.ply;
 const projectors=side.machines.filter(m=>isB(m)&&ready(side,m,ply,h));
 const m=projectors.find(m=>!m.holoOwnerCardId)||projectors[0];
 if(side.nextHologram?.untilPly<=ply)side.nextHologram=null;
 if(!m||side.fireBlocked||side.fireDisabledUntil>ply||h.arsenalBonus(side,m,ply,1)<=0)return;
 const ships=side.escorts.filter(alive);
 if(!ships.length){side.nextHologram=null;return;}
 const original=ships[draw(b,ships.length)];
 const positions=[...ships.map(u=>({realId:u.id})),{decoy:true}];
 for(let i=positions.length-1;i>0;i--){const j=draw(b,i+1);[positions[i],positions[j]]=[positions[j],positions[i]];}
 positions.forEach((p,i)=>p.key='holo-position:'+ply+':'+i);
 const pos=positions.findIndex(p=>p.decoy);
 const decoy={...clone(original),id:positions[pos].key,slot:pos,hp:original.hp,maxHp:original.maxHp,
  destroyed:false,nextHoloDecoy:true,nextHoloSourceId:original.id};
 side.nextHologram={sourceMachineId:m.id,sourceCardId:m.holoOwnerCardId||m.sourceCardId,untilPly:ply+2,positions,decoy};
 events.push(h.emit(b,ctx.who,'next-weapon-holo-shuffle','Proiezione olografica · posizioni rimescolate',
  {cardId:side.nextHologram.sourceCardId,machineId:m.id,positions:positions.map(p=>p.key),visibleSupports:positions.length}));
}
export function interceptHologramHit(b,ctx,events,target,amount,h){
 if(!target?.unit?.nextHoloDecoy||!(amount>0))return false;
 const owner=other(ctx.who),side=b.sides[owner],attacker=b.sides[ctx.who],p=hologramProjection(side,b.ply);
 if(!p||p.decoy.id!==target.unit.id||!alive(p.decoy))return true;
 const hp=p.decoy.hp;p.decoy.hp=0;p.decoy.destroyed=true;target.unit.hp=0;target.unit.destroyed=true;
 const multiplier=factor(side,b.ply),nominal=Math.round(hp*multiplier);
 const guards=h.protectingFleetUnits(attacker,b.ply).filter(g=>!g.unit.nextHoloDecoy);
 const chosen=guards.length?{kind:guards[0].kind,unit:guards[0].unit}:
  h.motherPart(attacker.ships[0],'weapons')?{kind:'part',unit:h.motherPart(attacker.ships[0],'weapons')}:null;
 let r={damage:0,target:chosen};
 events.push(h.emit(b,owner,'next-weapon-holo-destroyed','Ologramma distrutto · attacco assorbito',
  {cardId:p.sourceCardId,machineId:p.sourceMachineId,targetKind:'escort',targetId:p.decoy.id,copiedHp:hp,multiplier,nominalDamage:nominal,absorbed:true}));
 if(chosen&&alive(chosen.unit)&&attacker.ships[0].hp>0&&side.ships[0].hp>0&&nominal>0){
  const reaction={who:owner,cards:[],order:{},power:0,pierceLeft:0,stormHitIds:new Set(),stormEscortVictims:new Set(),nebulaVolleySerial:0,attackElement:'radiant'};
  h.startNebulaVolley(reaction);r=h.linceHit(b,reaction,events,chosen,nominal,p.sourceCardId,{},false,0);
 }
 events.push(h.emit(b,owner,'next-weapon-holo-counter','Contrattacco olografico · '+(r.damage||0)+' HP',
  {cardId:p.sourceCardId,machineId:p.sourceMachineId,nominalDamage:nominal,actualDamage:r.damage||0,
   targetKind:r.target?.kind||null,targetId:r.target?.unit.id||null,defenseBlocked:!!r.blocked,
   impacts:chosen?[{nominalDamage:nominal,actualDamage:r.damage||0,targetKind:r.target?.kind,targetId:r.target?.unit.id}]:[]}));
 return true;
}
