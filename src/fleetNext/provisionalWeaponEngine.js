// Eclissi Stellare — effetti HP delle Carte Arma con bilanciamento PROVVISORIO.
// Usa i medesimi controlli di Difese, Terreni, copertura e limiti della nave madre.
import {hologramCombatEscorts} from './nextHolographicWeapons.js';
import {weaponEnergyContributions} from './weaponEnergyFeedback.js';
import {PROVISIONAL_ADVANCED_WEAPON_BY_ID} from './provisionalWeaponProfiles.js';
import {weaponFiresOnOwnTurn,consumeMortarEnergy,mortarAmmunition} from './confirmedAdvancedWeaponMechanics.js';

const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const ownStage=(machine,ply)=>1+(ply-machine.deployedPly)/2;
const activeMachine=(m,ply,h)=>m.damageMode==='designed-shot'&&
 m.weaponProfile?.provisional&&h.unitEnabled(m,ply)&&!h.unitSilenced(m,ply)&&
 !h.weaponSlotLocked(m.ownerSide||h.side,m.slot,ply)&&
 weaponFiresOnOwnTurn(m.deployedPly,ply,m.weaponProfile.durationTurns||1);
const physical=unit=>!!unit&&unit.hp>0&&!unit.destroyed;
const jawRole=m=>m.weaponProfile?.pattern==='magnetic-grapple'?'a':m.weaponProfile?.pattern==='alloy-collision'?'b':null;
const money=(percent,maxHp)=>Math.max(1,Math.round(maxHp*percent/100));
function spendOwnHp(side,percent,{allAllies=false}={}){
 const ships=allAllies?[side.ships[0],...(side.escorts||[]).filter(physical)]:[side.ships[0]];
 const entries=[];
 for(const unit of ships){
  const amount=Math.min(unit.hp,money(percent,unit.maxHp));
  unit.hp=Math.max(0,unit.hp-amount);
  if(unit!==side.ships[0]){
   unit.destroyed=unit.hp<=0;unit.supportObservedHp=unit.hp;
  }
  entries.push({id:unit.id||'mother',damage:amount});
 }
 return entries;
}
// Il Mortaio ha precedenza sulla Speciale della madre quando usa Energia Fuoco.
// La quantità di munizioni è stabilita dalla pila fisica; le altre Energie restano intatte.
export function reserveProvisionalMortarFuel(b,ctx,h){
 const side=b.sides[ctx.who],result={};
 for(const m of side.machines||[]){
  const p=m.weaponProfile;
  if(p?.pattern!=='magma-mortar'||!activeMachine(m,b.ply,{...h,side})||
   side.fireBlocked||side.fireDisabledUntil>b.ply)continue;
  const count=Math.min(p.maxExtraShots||0,mortarAmmunition(side,p.ammoMode));
  let consumed=0;
  for(let i=0;i<count;i++)if(consumeMortarEnergy(side,p.ammoMode))consumed++;
  result[m.id]=consumed;
 }
 ctx.provisionalMortarShots=result;
 return result;
}
// Danno continuativo a ritmo di turno, non un secondo attacco gratuito della madre.
// Le protezioni ordinarie intercettano il colpo iniziale, non un incendio già applicato.
export function tickProvisionalBurns(b,events,{limitedMotherDamage,emit}){
 if(b.ruleset!=='hp-sync-v2')return;
 for(const [who,side] of Object.entries(b.sides||{})){
  side.provisionalBurns??=[];
  const alive=[];
  for(const burn of side.provisionalBurns){
   if(b.ply<burn.nextPly){alive.push(burn);continue;}
   if(burn.remaining<=0||side.ships[0].hp<=0)continue;
   const hit=Math.min(side.ships[0].hp,limitedMotherDamage(side.ships[0],burn.damage,b.ply));
   side.ships[0].hp=Math.max(0,side.ships[0].hp-hit);
   burn.remaining--;burn.nextPly=b.ply+1;
   events.push(emit(b,who,'weapon-burn',burn.name+' · bruciatura '+hit+' HP',{
    cardId:burn.cardId,actualDamage:hit,remainingTurns:burn.remaining}));
   if(burn.remaining>0)alive.push(burn);
  }
  side.provisionalBurns=alive;
 }
}
export function resolveProvisionalWeaponShots(b,ctx,events,order,h){
 const side=b.sides[ctx.who],enemy=b.sides[h.other(ctx.who)];
 const ready=(side.machines||[]).filter(m=>activeMachine(m,b.ply,{...h,side}));
 if(!ready.length)return null;
 h.startNebulaVolley(ctx);
 const status=side.provisionalWeaponStatus??={};
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,targets:[],played:[]};
 const mother=()=>{const unit=h.motherPart(enemy.ships[0],'weapons');
  return enemy.ships[0].hp>0&&unit?{kind:'part',unit}:null;};
 const every=()=>[...hologramCombatEscorts(enemy,b.ply).filter(physical).map(unit=>({kind:'escort',unit})),
  ...(mother()?[mother()]:[])];
 const byId=(id)=>every().find(t=>t.unit.id===id)||null;
 const ordinary=()=>{
  const guards=h.protectingFleetUnits(enemy,b.ply);
  const chosen=h.selectedEnemyTarget(enemy,order,b.ply);
  if(chosen&&(!guards.length||!['part','module'].includes(chosen.kind)))return chosen;
  if(guards.length)return {kind:guards[0].kind,unit:guards[0].unit};
  return mother();
 };
 const opposite=(except)=>every().find(t=>t.unit.id!==except)||null;
 const freshIonic=ctx.cards.reduce((n,id)=>{
  const spec=h.card(id)?.effectSpec;
  return n+(spec?.type==='energy'&&spec.elementId==='ionic'?spec.charges||1:0);
 },0);
 const spendFreshIonic=cost=>{
  if(freshIonic-(ctx.provisionalFreshEnergySpent||0)<cost||
   !h.spendElementalEnergy(side,'ionic',cost))return false;
  ctx.provisionalFreshEnergySpent=(ctx.provisionalFreshEnergySpent||0)+cost;return true;
 };
 const hitOnce=(m,hit,n,impacts)=>{
  const target=hit.target||ordinary();
  if(!target||target.kind==='escort'&&!physical(target.unit))return 0;
  const nominal=Math.max(1,Math.round(hit.base||0));
  const power=h.arsenalBonus(side,m,b.ply,nominal);
  const old=ctx.attackElement,priorPiercing=ctx.iceNeedlePiercing||false;
  ctx.attackElement=m.weaponElementId;
  if(hit.ignoreOrdinaryDefenses)ctx.iceNeedlePiercing=true;
  const beforeHp=target.unit.hp,previousOverflow=ctx.trackWeaponOverflow;
  ctx.trackWeaponOverflow=m.weaponProfile?.pattern==='cascade-piercer';
  const actual=side.fireBlocked||side.fireDisabledUntil>b.ply||power<=0?
   {damage:0,target}:h.linceHit(b,ctx,events,target,power,m.sourceCardId,order,
    !!hit.ignoreCover,hit.ignoreOrdinaryDefenses?99:0);
  ctx.iceNeedlePiercing=priorPiercing;ctx.attackElement=old;
  ctx.trackWeaponOverflow=previousOverflow;
  const kind=actual.target?.kind||target.kind,unit=actual.target?.unit||target.unit;
  const damage=actual.damage||0;
  if(damage){
   const field={part:'damage',escort:'escortDamage',machine:'machineDamage',module:'moduleDamage'}[kind];
   if(field)shot[field]+=damage;
   shot.targets.push({kind,id:unit.id,damage,destroyed:!!unit.destroyed});
  }
  impacts.push({index:n+1,nominalDamage:nominal,actualDamage:damage,defenseBlocked:!!actual.blocked,
   targetKind:kind,targetId:unit?.id||null,destroyed:kind==='part'?enemy.ships[0].hp<=0:!!unit?.destroyed});
  return {damage,target:actual.target||target,beforeHp,excessDamage:actual.excessDamage||0};
 };
 const event=(m,kind,label,data={})=>{const e=h.emit(b,ctx.who,kind,label,{
  cardId:m.sourceCardId,machineId:m.id,machineSlot:m.slot,
  elementId:m.weaponElementId,...data});events.push(e);return e;};
 for(const m of ready){
  if(side.ships[0].hp<=0||enemy.ships[0].hp<=0)break;
  const p=m.weaponProfile,pattern=p.pattern,stage=ownStage(m,b.ply),hits=[];
  if(!Number.isInteger(stage)||stage<1)continue;
  const comboSide=side.provisionalWeaponStatus??={};
  let planned=[],coreFeedback=null,probeFeedback=null,commandFeedback=null,stormFeedback=null;
  if(pattern==='magma-mortar'){
   const extras=ctx.provisionalMortarShots?.[m.id]||0;
   planned=[{base:p.baseDamage},...Array.from({length:extras},()=>({base:p.extraDamage}))];
  }else if(pattern==='incinerator'){
   planned=[{base:stage===1?p.baseDamage:p.secondDamage}];
  }else if(pattern==='binary-overload'){
   if(stage===2||stage===4){
    const loss=spendOwnHp(side,stage===2?p.motherCostPercent:p.allyCostPercent,
     {allAllies:stage===4});
    event(m,'weapon-self-cost',m.name+' · sacrificio HP',{
     stage,loss,selfDamage:loss.reduce((n,v)=>n+v.damage,0)});
   }else if(stage===5){
    const coupler=(side.machines||[]).some(unit=>physical(unit)&&
     unit.weaponProfile?.pattern==='thermal-coupler'&&h.unitEnabled(unit,b.ply));
    planned=every().map(target=>({target,base:Math.round(
     (target.kind==='part'?enemy.ships[0].maxHp:target.unit.maxHp)*p.damageStages[4]/100)+
      (coupler?p.couplerBonusDamage||30:0),ignoreCover:target.kind==='part'}));
   }else{
    const target=ordinary();
    if(target)planned=[{target,base:Math.round(
     (target.kind==='part'?enemy.ships[0].maxHp:target.unit.maxHp)*
     p.damageStages[stage-1]/100)}];
   }
  }else if(pattern==='thermal-coupler'){
   if(stage===1){
    const loss=spendOwnHp(side,p.motherCostPercent);
    event(m,'weapon-self-cost',m.name+' · alimentazione HP',{loss});
   }
   planned=[{base:p.baseDamage}];
  }else if(pattern==='ice-needle'){
   const ice=b.terrain?.id==='T01'||h.terrainCatalog[b.terrain?.id]?.elementId==='cryogenic';
   const live=hologramCombatEscorts(enemy,b.ply).filter(physical).slice(0,2),power=ice?p.terrainSupportDamage:p.supportDamage;
   planned=live.map(unit=>({target:{kind:'escort',unit},base:power}));
   if(ice&&live.length===2&&mother())planned.push({target:mother(),
    base:power*2,ignoreCover:true,ignoreOrdinaryDefenses:true});
  }else if(pattern==='boreal-binary'){
   planned=[{target:ordinary(),base:p.baseDamage+p.secondDamage}];
  }else if(pattern==='character-turret'){
   const first=ordinary(),extra=side.commander?.id&&side.commander.untilPly>b.ply;
   planned=[{target:first,base:p.baseDamage}];
   if(extra){
    const second=opposite(first?.unit?.id);
    if(second)planned.push({target:second,base:p.extraDamage,
     ignoreCover:second.kind==='part'});
   }
  }else if(pattern==='low-tide'){
   if(stage!==1)continue; // Non sovrascrivere la carica nel secondo turno.
   const total=Math.min(p.maxDiscardCards,(side.discard?.length||0)+(enemy.discard?.length||0));
   const base=p.baseDamage+total*p.damagePerDiscard;
   planned=[{base}];
   comboSide.lowTide={ply:b.ply,power:base};
  }else if(pattern==='high-tide'){
   const low=comboSide.lowTide;
   if(!low||low.ply!==b.ply-2)continue;
   for(const holder of [side,enemy])
    for(const d of [...holder.defenses])h.discardDefense(holder,d.source);
   planned=[{base:Math.min(p.maxDamage,low.power*p.comboMultiplier)}];
   comboSide.lowTide=null;
  }else if(pattern==='wandering-shrapnel'){
   const target=stage>1?opposite(m.previousTargetId)||ordinary():ordinary();
   planned=[{target,base:p.baseDamage}];
  }else if(pattern==='thermal-reclaimer'){
   const lostHp=Math.max(0,(side.weaponObservedHpLoss||0)-(m.observedHpLoss||0));
   planned=[{base:p.baseDamage+Math.min(p.maxExtraDamage,
    Math.round(lostHp*p.damageConversionPercent/100))}];
  }else if(pattern==='metal-base-shot')planned=[{base:p.baseDamage}];
  else if(jawRole(m)){
   comboSide.jawRevision=true;
   const locked=m.jawLatch&&byId(m.jawLatch.targetId);
   const sibling=ready.find(other=>jawRole(other)&&jawRole(other)!==jawRole(m)&&other.jawLatch&&byId(other.jawLatch.targetId));
   let target=locked||ordinary();
   if(!locked&&sibling&&every().length>1&&target?.unit.id===sibling.jawLatch.targetId)target=opposite(sibling.jawLatch.targetId);
   m.jawWasLatched=!!locked;
   m.jawPhase=stage===3?(jawRole(m)==='a'?'tear':'release'):locked?'pull':'latch';
   planned=target?[{target,base:Math.round(p.baseDamage*(stage===3?1+(p.finalTearBonusPercent||0)/100:1)),
    ignoreCover:target.kind==='part'&&!!sibling}]:[];
  }else if(pattern==='cascade-piercer')planned=[{base:p.baseDamage}];
  else if(pattern==='growing-thunder-core'){
   const wasBroken=!!m.chargeBroken;
   let energySpent=0,energyContributions=[];
   if(stage>1&&!m.chargeBroken){
    const contributors=weaponEnergyContributions(side,'ionic',{cost:p.freshEnergyCost},h.card);
    if(m.lastChargePly!==b.ply-2||!spendFreshIonic(p.freshEnergyCost))
     m.chargeBroken=true;
    else{energySpent=p.freshEnergyCost;energyContributions=contributors;}
   }
   m.lastChargePly=b.ply;
   coreFeedback={coreChargeStage:m.chargeBroken?1:stage,coreChargeBroken:!!m.chargeBroken,
    coreChargeLost:!wasBroken&&!!m.chargeBroken,energySpent,energyContributions};
   planned=[{base:m.chargeBroken?p.damageStages[0]:p.damageStages[stage-1]}];
  }else if(pattern==='ion-probe')planned=[{base:p.baseDamage}];
  else if(pattern==='thunder-hammer'){
   const signal=comboSide.ionProbe;
   probeFeedback={probeMarkBefore:signal?{...signal}:null,probeMarkConsumed:!!signal};
   // Il segnale segue il vero bersaglio colpito, compresi gli altri
   // componenti della madre. Una presa non più valida lascia il tiro base.
   let marked=null;
   if(signal&&signal.expiresPly>b.ply){
    const candidate=signal.targetKind?
     h.selectedEnemyTarget(enemy,{targetKind:signal.targetKind,targetId:signal.id,partId:signal.id},b.ply):
     byId(signal.id)||h.selectedEnemyTarget(enemy,{targetKind:'part',targetId:signal.id,partId:signal.id},b.ply);
    if(candidate?.unit?.id===signal.id)marked=candidate;
   }
   const target=marked||ordinary();
   planned=[{target,base:p.baseDamage}];
   if(marked)planned.push({target:marked,base:p.comboBonusDamage});
   comboSide.ionProbe=null;
  }else if(pattern==='command-lance'){
   if(side.commander?.id&&side.commander.untilPly>b.ply){
    commandFeedback={characterCardId:side.commander.id};
    planned=[{base:p.baseDamage+p.characterBonusDamage}];
   }
  }
  else if(pattern==='storm-capacitor'){
   const contributors=weaponEnergyContributions(side,'ionic',{cost:p.energyCost},h.card);
   if(!spendFreshIonic(p.energyCost)){
    event(m,'weapon-no-energy',m.name+' · Energia Fulmine insufficiente',{stage});
   }else{
    const supports=(side.escorts||[]).filter(physical);
    stormFeedback={energySpent:p.energyCost,energyContributions:contributors,
     contributingSupportIds:supports.map(unit=>unit.id),supportCount:supports.length};
    planned=[{base:p.baseDamage+supports.length*p.perSupportDamage}];
   }
  }else if(pattern==='wind-cycloreactor'){
   planned=every().map(target=>({target,base:p.damageStages[stage-1],
    ignoreCover:target.kind==='part'}));
  }
  for(let n=0;n<planned.length;n++){
   if(enemy.ships[0].hp<=0)break;
   const instruction=planned[n];
   if(instruction.target===null)continue;
   const r=hitOnce(m,instruction,n,hits);
   if(!r||!r.damage)continue;
   if(pattern==='wandering-shrapnel')m.previousTargetId=r.target.unit?.id;
   if(jawRole(m))m.jawLatch={targetKind:r.target.kind,targetId:r.target.unit.id,launchPly:m.deployedPly,
    untilPly:m.deployedPly+2*p.durationTurns};
   if(pattern==='ion-probe'){
    comboSide.ionProbe={id:r.target.unit.id,targetKind:r.target.kind,ply:b.ply,expiresPly:b.ply+3,sourceCardId:m.sourceCardId};
    probeFeedback={probeMarkAfter:{...comboSide.ionProbe}};
   }
   if(pattern==='incinerator'&&stage===1){
    const discarded=(side.discard||[]).filter(id=>h.card(id)?.kind==='attack').length;
    const burn=Math.min(p.burnMaxDamage??Number.POSITIVE_INFINITY,
     Math.max(p.burnMinimum,discarded*p.burnPerDiscard));
    enemy.provisionalBurns??=[];
    enemy.provisionalBurns.push({cardId:m.sourceCardId,name:m.name,damage:Math.round(burn*(m.holoMultiplier??1)),
     remaining:p.burnTurns,nextPly:b.ply+1});
   }
   if(pattern==='thermal-coupler'){
    const add=money(p.healOnHitPercent,side.ships[0].maxHp);
    const actual=Math.min(add,r.damage,side.ships[0].maxHp-side.ships[0].hp);
    side.ships[0].hp+=actual;
    if(actual)event(m,'weapon-heal',m.name+' · recupera '+actual+' HP',{actualHealing:actual});
   }
   if(pattern==='cascade-piercer'&&r.target.kind==='escort'&&r.target.unit.hp<=0&&r.excessDamage>0){
    const used=new Set(hits.map(x=>x.targetKind+':'+x.targetId));
    const next=every().find(t=>!used.has(t.kind+':'+t.unit.id));
    const energyContributions=next?weaponEnergyContributions(side,'metallic',{cost:p.energyTransferCost},h.card):[];
    if(next&&h.spendElementalEnergy(side,'metallic',p.energyTransferCost)){
     planned.push({target:next,base:r.excessDamage,ignoreCover:next.kind==='part'});
     event(m,'weapon-cascade',m.name+' · trasferimento del danno eccedente',
      {energySpent:p.energyTransferCost,cascadeIndex:hits.length,energyContributions});
    }
   }
  }
  if(pattern==='wind-cycloreactor'&&hits.some(x=>x.actualDamage>0)){
   const seconds=p.freezeSeconds[stage-1];
   enemy.provisionalHandFrozenUntilMs=Math.max(
    enemy.provisionalHandFrozenUntilMs||0,ctx.nowMs+1000*seconds);
   event(m,'weapon-hand-freeze',m.name+' · mano bloccata '+seconds+' secondi',
    {seconds,untilMs:enemy.provisionalHandFrozenUntilMs});
  }
  shot.played.push(m.sourceCardId);
  const sum=hits.reduce((n,x)=>n+x.actualDamage,0);
  event(m,'weapon-provisional-shot',m.name+' · '+sum+' HP',{
   pattern,stage,baseNominalDamage:p.baseDamage,hitCount:hits.length,impacts:hits,actualDamage:sum,provisional:true,
   ...(commandFeedback||{}),
   ...(coreFeedback||{}),
   ...(probeFeedback||{}),
   ...(stormFeedback||{}),
   ...(jawRole(m)?{jawRole:jawRole(m),jawPhase:m.jawPhase,jawWasLatched:m.jawWasLatched,launchPly:m.deployedPly}:{}),
  });
 }
 // Entrambe funzionano da sole per tre turni. Il secondo aggancio valido
 // attiva un solo urto della coppia, anche se posate nello stesso turno.
 const jaws=ready.filter(m=>jawRole(m)&&m.jawLatch&&!m.jawComboUsed&&byId(m.jawLatch.targetId));
 const a=jaws.find(m=>jawRole(m)==='a'),z=jaws.find(m=>jawRole(m)==='b');
 if(a&&z&&!side.fireBlocked&&!(side.fireDisabledUntil>b.ply)&&enemy.ships[0].hp>0){
  const targets=[...new Set([a.jawLatch.targetId,z.jawLatch.targetId])].map(byId).filter(Boolean);
  const floor=targets.length===1&&every().length===1;
  if(targets.length===2||floor){
   const impacts=[];
   for(const [i,target]of targets.entries())hitOnce(z,{target,base:z.weaponProfile.comboBonusDamage||z.weaponProfile.baseDamage,
    ignoreCover:target.kind==='part'},i,impacts);
   event(z,'weapon-provisional-shot',z.name+' · schianto delle Ganasce',{
    pattern:'alloy-collision',jawCombo:true,contactMode:floor?'floor':'pair',jawMachineIds:[a.id,z.id],
    jawOrigins:[{cardId:a.sourceCardId,launchPly:a.deployedPly,machineSlot:a.slot},{cardId:z.sourceCardId,launchPly:z.deployedPly,machineSlot:z.slot}],
    stage:ownStage(z,b.ply),impacts,hitCount:impacts.length,actualDamage:impacts.reduce((n,v)=>n+v.actualDamage,0),provisional:true});
   for(const m of [a,z]){
    m.jawComboUsed=true;m.jawLatch=null;
    // L'eventuale ultimo strappo confluisce nel rilascio dello schianto.
    const activation=events.findLast(e=>e.kind==='weapon-provisional-shot'&&!e.jawCombo&&e.machineId===m.id);
    if(activation){activation.jawReleaseAfterCombo=true;if(activation.jawPhase==='tear'||activation.jawPhase==='release')activation.jawPhase='pull';}
    event(m,'weapon-jaw-release',m.name+' · rilascio dopo lo schianto',{reason:'combo'});
   }
  }
 }
 for(const m of ready.filter(jawRole)){
  if(ownStage(m,b.ply)>=m.weaponProfile.durationTurns){
   if(m.jawLatch)event(m,'weapon-jaw-release',m.name+' · fine aggancio',{reason:'expired'});
   m.jawLatch=null;
  }
 }
 return shot;
}
