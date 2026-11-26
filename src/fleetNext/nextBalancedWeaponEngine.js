// Risoluzione delle nuove Armi del 26/11; usa l'unica pipeline di danno del combattimento.
import {hologramCombatEscorts} from './nextHolographicWeapons.js';
import {weaponEnergyContributions} from './weaponEnergyFeedback.js';
const alive=u=>!!u&&u.hp>0&&!u.destroyed;
const stage=(m,ply)=>1+(ply-m.deployedPly)/2;
const other=who=>who==='A'?'B':'A';
const profile=m=>m?.weaponProfile;
const is=(m,slug)=>profile(m)?.nextBalanced&&profile(m).slug===slug;
const compatible=(a,z)=>profile(a)?.rarita===profile(z)?.rarita;
const ready=(m,side,ply,h)=>profile(m)?.nextBalanced&&h.unitEnabled(m,ply)&&
 !h.unitSilenced(m,ply)&&!h.weaponSlotLocked(side,m.slot,ply)&&
 Number.isInteger(stage(m,ply))&&stage(m,ply)>=1&&stage(m,ply)<=profile(m).durationTurns;
const liveMachines=(side,ply,h)=>side.machines.filter(m=>ready(m,side,ply,h));
const empty=()=>({damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,targets:[],played:[]});
const record=(out,hit)=>{
 if(!hit?.damage||!hit.target)return;
 const {kind,unit}=hit.target,field={part:'damage',escort:'escortDamage',machine:'machineDamage',module:'moduleDamage'}[kind];
 if(field)out[field]+=hit.damage;
 out.targets.push({kind,id:unit.id,damage:hit.damage,destroyed:!!unit.destroyed});
};
const mother=(side,h)=>side.ships[0].hp>0&&h.motherPart(side.ships[0],'weapons')?
 {kind:'part',unit:h.motherPart(side.ships[0],'weapons')}:null;
const all=(side,h)=>[...hologramCombatEscorts(side,h.ply??0).filter(alive).map(unit=>({kind:'escort',unit})),...(mother(side,h)?[mother(side,h)]:[])];
const identity=t=>t?.kind==='part'?'mother':t?.unit?.id;
const legal=(target,side,ply,h)=>!!target&&alive(target.unit)&&
 (!['part','module'].includes(target.kind)||!h.protectingFleetUnits(side,ply).length);
const ordinary=(enemy,order,ply,h,except=[])=>{
 const selected=h.selectedEnemyTarget(enemy,order,ply);
 if(legal(selected,enemy,ply,h)&&!except.includes(identity(selected)))return selected;
 const guards=h.protectingFleetUnits(enemy,ply).filter(t=>!except.includes(t.unit.id));
 if(guards.length)return {kind:guards[0].kind,unit:guards[0].unit};
 const t=mother(enemy,h);
 return legal(t,enemy,ply,h)&&!except.includes('mother')?t:null;
};
const event=(b,who,events,m,h,kind,data={})=>events.push(h.emit(b,who,kind,m.name,{
 cardId:m.sourceCardId,machineId:m.id,machineSlot:m.slot,elementId:m.weaponElementId,...data}));
const split=(total,n)=>Array.from({length:n},(_,i)=>Math.floor(total/n)+(i<total%n?1:0));
function rawLoss(side,unit,amount){
 if(!alive(unit))return 0;
 const hp=Math.min(unit.hp,Math.max(0,Math.round(amount)));
 unit.hp-=hp;if(unit!==side.ships[0]&&unit.hp<=0){unit.destroyed=true;unit.linked=false;}
 side.weaponObservedHpLoss=(side.weaponObservedHpLoss||0)+hp;
 return hp;
}
function selfFleet(side){return [side.ships[0],...side.escorts.filter(alive)];}
function directHit(b,ctx,events,m,raw,target,order,h,{bypass=false,alreadyPowered=false}={}){
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 if(!target||!alive(target.unit)||!alive(side.ships[0])||!alive(enemy.ships[0])||
  side.fireBlocked||side.fireDisabledUntil>b.ply||!(raw>0))return {damage:0,target};
 const power=alreadyPowered?Math.round(raw):h.arsenalBonus(side,m,b.ply,Math.round(raw));
 if(!(power>0))return {damage:0,target};
 const prior=ctx.attackElement;ctx.attackElement=m.weaponElementId;
 try{return h.linceHit(b,ctx,events,target,power,m.sourceCardId,order,bypass,0);}
 finally{ctx.attackElement=prior;}
}
function spend(b,ctx,events,m,cost,h){
 const side=b.sides[ctx.who],energyContributions=weaponEnergyContributions(side,m.weaponElementId,{cost},h.card);
 if(!h.spendElementalEnergy(side,m.weaponElementId,cost)){
  event(b,ctx.who,events,m,h,'next-weapon-no-energy',{cost,stage:stage(m,b.ply)});return false;
 }
 event(b,ctx.who,events,m,h,'next-weapon-energy',{energySpent:cost,energyContributions});return true;
}
// Quota della plancia in tre fasce: due posizioni centrali per lato per fascia,
// armi nei rispettivi alloggiamenti (T1/T2), moduli e terreno al T3.
// Sono conteggiate carte fisiche persistenti, non copie grafiche degli scarti.
export function nextShadowCount(b,stage){
 let count=0;
 for(const side of Object.values(b.sides)){
  if(stage>=1){
   count+=Number(!!side.commander?.id);
   count+=(side.defenses||[]).filter(d=>!d.hidden).length;
   count+=(side.machines||[]).filter(m=>alive(m)&&m.slot===0).length;
  }
  if(stage>=2){
   count+=(side.defenses||[]).filter(d=>d.hidden).length;
   count+=(side.machines||[]).filter(m=>alive(m)&&m.slot===1).length;
   // Le strategie attuali ancora da scartare saranno conteggiate via ctx,
   // non quelle del precedente turno, già negli scarti.
  }
  if(stage>=3){
   count+=(side.energyPile||[]).length;
   count+=Object.values(side.modules||{}).filter(m=>m?.cardId&&alive(m)).length;
   count+=(side.systemCardEffects||[]).filter(e=>e.cardId||e.id).length;
  }
 }
 if(stage>=3&&b.terrain?.cardId)count++;
 return count;
}
export function nextWeaponUnavailableReason(def,side,b,selectedCardIds,lookup){
 const p=def.effectSpec?.weaponProfile;if(!p?.nextBalanced)return '';
 if(!def.playable)return def.blockedReason||'Arma non ancora disponibile';
 if(side.ruleset!=='hp-sync-v2')return 'Richiede la partita con HP sincronizzati';
 const ply=b?.ply??0;
 if(['replicatore-olografico','proiettore-olografico'].includes(p.slug)&&((side.machines||[]).some(m=>m.weaponProfile?.slug===p.slug&&alive(m)&&(m.untilPly==null||m.untilPly>ply))||selectedCardIds.filter(id=>lookup(id)?.effectSpec?.weaponProfile?.slug===p.slug).length>1))
  return 'Una sola arma olografica per famiglia contemporaneamente';
 if(p.slug==='eclissi-quantistica'&&side.nextEclipsePending&&side.nextEclipsePending.releasePly>ply)
  return 'È già presente un proiettile nascosto in attesa';
 if(p.slug==='convertitore-cinetico'){
  const present=selectedCardIds.some(id=>{const q=lookup(id)?.effectSpec?.weaponProfile;return q?.slug==='boato-cosmico'&&q.rarita===p.rarita;});
  const token=side.nextBoato;
  if(!present&&!(token&&!token.used&&token.ply===ply-2&&token.rarita===p.rarita))
   return 'Serve Boato Cosmico di pari rarità in questo turno o nel proprio precedente';
 }
 if(p.slug==='tenebre-infinite'&&!(side.machines||[]).some(m=>is(m,'oscurita-gravitazionale')&&alive(m)&&stage(m,ply)===3))
  return 'Giocabile soltanto al terzo turno di Generatore di Oscurità Gravitazionale';
 return '';
}
export function prepareNextSingularity(b,ctx,h){
 const side=b.sides[ctx.who];
 const machine=liveMachines(side,b.ply,h).find(m=>is(m,'implosore-singolarita'));
 if(machine&&!side.fireBlocked&&!(side.fireDisabledUntil>b.ply)&&h.arsenalBonus(side,machine,b.ply,1)>0)ctx.nextAbsorber=machine;
}
export function absorbNextWeaponShot(b,ctx,events,cardId,power,h){
 const m=ctx.nextAbsorber;
 if(!m||!alive(m)||cardId===m.sourceCardId||!(power>0)||h.card(cardId)?.effectSpec?.type!=='deployMachine')return false;
 m.nextAbsorbed=(m.nextAbsorbed||0)+power;
 event(b,ctx.who,events,m,h,'next-weapon-absorb',{absorbedCardId:cardId,absorbedDamage:power,storedDamage:m.nextAbsorbed});
 return true;
}
export function finishNextSingularity(b,ctx,events,order,h){
 const m=ctx.nextAbsorber;if(!m||stage(m,b.ply)!==2)return null;
 ctx.nextAbsorber=null;
 const total=m.nextAbsorbed||0;m.nextAbsorbed=0;
 const out=empty(),target=ordinary(b.sides[other(ctx.who)],order,b.ply,h);
 const nominal=Math.round(total*(1+profile(m).boostPercent/100)*(m.holoMultiplier??1));
 h.startNebulaVolley(ctx);
 const hit=directHit(b,ctx,events,m,nominal,target,order,h,{alreadyPowered:true});record(out,hit);
 event(b,ctx.who,events,m,h,'next-weapon-shot',{pattern:profile(m).pattern,stage:2,nominalDamage:nominal,
  actualDamage:hit.damage||0,storedDamage:total,impacts:target?[{nominalDamage:nominal,actualDamage:hit.damage||0,targetKind:hit.target?.kind,targetId:hit.target?.unit.id}]:[]});
 return out;
}
export function resolveNextBalancedWeaponShots(b,ctx,events,order,h){
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)],ply=b.ply;
 const machines=liveMachines(side,ply,h);
 if(!machines.length)return null;
 const out=empty();h.startNebulaVolley(ctx);
 // A prima di B e spinta prima delle altre armi; nessuna dipendenza dall'ordine dei due slot.
 const priorities={'spinta-eolica':-10,'macigni-tettonici':-5,'boato-cosmico':-5,'drone-parassita':-5,'oscurita-gravitazionale':-5,
  'collettore-frammenti':5,'convertitore-cinetico':5,'estrattore-materia-oscura':5,'tenebre-infinite':5};
 machines.sort((a,z)=>(priorities[profile(a).slug]||0)-(priorities[profile(z).slug]||0)||a.slot-z.slot);
 const pair=(m,slug)=>machines.find(x=>is(x,slug)&&compatible(m,x));
 const target=()=>ordinary(enemy,order,ply,h);
 for(const m of machines){
  if(!alive(side.ships[0])||!alive(enemy.ships[0]))break;
  if(side.fireBlocked||side.fireDisabledUntil>ply||h.arsenalBonus(side,m,ply,1)<=0)continue;
  const p=profile(m),s=stage(m,ply),impacts=[];
  const hit=(raw,t=target(),bypass=false)=>{
   const r=directHit(b,ctx,events,m,raw,t,order,h,{bypass});
   record(out,r);
   if(t)impacts.push({nominalDamage:raw,actualDamage:r.damage||0,defenseBlocked:!!r.blocked,
    targetKind:r.target?.kind||t.kind,targetId:r.target?.unit.id||t.unit.id});
   return r;
  };
  const allHit=raw=>{for(const t of all(enemy,h))hit(raw,t,t.kind==='part');};
  const recoil=(units,total)=>{
   const damage=split(total,units.length),loss=units.map((u,i)=>({id:u.id,damage:rawLoss(side,u,damage[i])}));
   event(b,ctx.who,events,m,h,'next-weapon-recoil',{loss,selfDamage:loss.reduce((n,e)=>n+e.damage,0)});
   return loss.reduce((n,e)=>n+e.damage,0);
  };
  switch(p.slug){
   case 'marea-laterale':{
    const r=hit(p.baseDamage);
    if(r.damage>0&&p.commandRate>0&&enemy.componentTimers?.command&&!enemy.componentTimers.command.expired){
     const old=enemy.nextCommandAcceleration;
     enemy.nextCommandAcceleration={remaining:15,rate:Math.max(p.commandRate,old?.rate||0),processedPly:-1,processed:0};
     event(b,ctx.who,events,m,h,'next-weapon-command-acceleration',{extraPerSecond:p.commandRate,durationSeconds:15});
    }break;
   }
   case 'pressione-isobarica':{
    if(s===1){const r=hit(p.baseDamage);m.nextIsobarTarget=identity(r.target);}
    else{
     const t=all(enemy,h).find(t=>identity(t)===m.nextIsobarTarget);
     if(legal(t,enemy,ply,h))hit(2*p.baseDamage,t);else hit(p.baseDamage);
    }break;
   }
   case 'sismico-tettonico':
    if(s===1){m.nextQuake=spend(b,ctx,events,m,2,h);if(m.nextQuake)allHit(p.baseDamage);}
    else if(m.nextQuake&&spend(b,ctx,events,m,1,h))allHit(p.secondDamage);
    break;
   case 'tempeste-silicee':{
    const st=(m.nextSiliceStage||0)+1;
    if(st<=3&&spend(b,ctx,events,m,st,h)){
     m.nextSiliceStage=st;enemy.nextCoverSuppressedPly=ply;
     allHit(st*p.baseDamage);
     event(b,ctx.who,events,m,h,'next-weapon-tempest',{tempestStage:st,coverSuppressed:true});
    }break;
   }
   case 'macigni-tettonici':{
    hit(p.baseDamage);
    const collector=pair(m,'collettore-frammenti');
    if(collector){collector.nextFragments=p.recoilDamage;collector.nextFragmentsPly=ply;
     event(b,ctx.who,events,m,h,'next-weapon-fragments-caught',{damageRecovered:p.recoilDamage,collectorCardId:collector.sourceCardId});}
    else recoil(selfFleet(side).filter(alive),p.recoilDamage);
    break;
   }
   case 'collettore-frammenti':
    if(m.nextFragmentsPly===ply){
     const targets=all(enemy,h),total=p.baseDamage+m.nextFragments;
     const portions=split(total,targets.length);targets.forEach((t,i)=>hit(portions[i],t,t.kind==='part'));
     m.nextFragments=0;m.nextFragmentsPly=-1;
    }else hit(p.baseDamage);
    break;
   case 'vortici-ciclonici':
    if(spend(b,ctx,events,m,p.energyCost,h)){const count=(enemy.discard||[]).length;
     allHit(count*p.damagePerDiscard);event(b,ctx.who,events,m,h,'next-weapon-vortex',{discardCount:count,discardPreserved:true});}
    break;
   case 'spinta-eolica':{
    if(!spend(b,ctx,events,m,p.energyCost,h))break;
    const supportHits=enemy.escorts.filter(alive).map(unit=>hit(p.baseDamage,{kind:'escort',unit}));
    if(supportHits.some(r=>r.damage>0)){
     enemy.nextCoverSuppressedPly=ply;enemy.nextForceMotherPly=ply;
     event(b,ctx.who,events,m,h,'next-weapon-push',{untilPly:ply+1});
    }break;
   }
   case 'boato-cosmico':{
    const allies=selfFleet(side).filter(alive),collision=[];
    // Gli schianti sono simultanei: il contraccolpo si applica anche allo slot vuoto.
    for(const own of allies){
     const opposite=own===side.ships[0]?mother(enemy,h):
      enemy.escorts.find(u=>alive(u)&&u.slot===own.slot);
     const t=own===side.ships[0]?opposite:opposite?{kind:'escort',unit:opposite}:null;
     if(t)hit(p.baseDamage,t,t.kind==='part');
     collision.push({id:own.id,damage:rawLoss(side,own,Math.round(p.baseDamage*.25))});
    }
    const value=collision.reduce((n,x)=>n+x.damage,0);
    side.nextBoato={ply,rarita:p.rarita,value,used:false};
    event(b,ctx.who,events,m,h,'next-weapon-recoil',{loss:collision,selfDamage:value});
    break;
   }
   case 'convertitore-cinetico':{
    const token=side.nextBoato;
    if(token&&!token.used&&[ply,ply-2].includes(token.ply)&&token.rarita===p.rarita){
     token.used=true;hit(token.value);event(b,ctx.who,events,m,h,'next-weapon-recoil-convert',{recoilDamage:token.value});
    }break;
   }
   case 'concentrazione-solare':hit(p.damages[Math.max(0,Math.min(2,3-ctx.cards.length))]);break;
   case 'fotoni-riflessi':{
    const start=events.length,r=hit(p.baseDamage);
    const defense=events.slice(start).some(e=>e.who===other(ctx.who)&&e.cardId&&h.card(e.cardId)?.kind==='defense');
    if(r.blocked&&defense){
     side.elementalCharges??={};side.elementalCharges.radiant=(side.elementalCharges.radiant||0)+p.energyGain;
     event(b,ctx.who,events,m,h,'next-weapon-reflected-energy',{energyGain:p.energyGain,virtualCharges:true});
    }break;
   }
   case 'replicatore-olografico':case 'proiettore-olografico':break;
   case 'eclissi-quantistica':{
    const delay=validEclipseChoice(order.nextEclipseTurn)?order.nextEclipseTurn:eclipseRandom(b);
    if(side.nextEclipsePending)break;
    const base=h.arsenalBonus(side,m,ply,p.baseDamage),bonus=h.arsenalBonus(side,m,ply,p.baseDamage+p.bonusDamage);
    side.nextEclipsePending={machine:{...m,untilPly:null},chosenDelay:delay,guess:null,
     releasePly:ply+2*delay,basePower:base,bonusPower:bonus};
    if(!m.cardDiscarded){side.discard.push(m.sourceCardId);m.cardDiscarded=true;}
    side.machines=side.machines.filter(x=>x.id!==m.id);
    event(b,ctx.who,events,m,h,'next-weapon-eclipse-hidden',{windowTurns:3});
    break;
   }
   case 'inversione-vitale':{
    const gap=Math.max(0,enemy.ships[0].hp-side.ships[0].hp);
    hit(p.baseDamage+Math.min(p.maxExtraDamage,Math.floor(gap*p.gapPercent/100)));break;
   }
   case 'drone-parassita':{
    if(s===1)m.nextDroneTarget=identity(target());
    const t=all(enemy,h).find(t=>identity(t)===m.nextDroneTarget);
    if(legal(t,enemy,ply,h)){
     const r=hit(p.baseDamage,t);m.nextDroneStored=(m.nextDroneStored||0)+(r.damage||0);
    }break;
   }
   case 'estrattore-materia-oscura':{
    const drone=pair(m,'drone-parassita');
    if(!drone){hit(p.baseDamage);break;}
    const stored=drone.nextDroneStored||0;drone.nextDroneStored=0;
    const unit=selfFleet(side).filter(u=>alive(u)&&u.hp<u.maxHp).sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];
    if(unit&&stored>0){
     const amount=Math.min(stored,unit.maxHp-unit.hp);unit.hp+=amount;
     event(b,ctx.who,events,m,h,'next-weapon-heal',{targetId:unit.id,actualHealing:amount,storedHp:stored});
    }break;
   }
   case 'massa-inerziale':
    if(s===1)m.nextMassTarget=identity(target());
    m.nextMassReactionPly=ply+1;
    event(b,ctx.who,events,m,h,'next-weapon-mass',{targetId:m.nextMassTarget,stage:s});
    break;
   case 'implosore-singolarita':break; // Rilascio dopo tutte le altre armi.
   case 'oscurita-gravitazionale':{
    const partner=machines.find(x=>is(x,'tenebre-infinite')&&s===3);
    const field=nextShadowCount(b,s)+(s>=2?ctx.cards.filter(id=>h.card(id)?.kind==='attack').length:0);
    const discards=partner?(side.discard||[]).length+(enemy.discard||[]).length:0;
    hit((field+discards)*p.baseDamage);
    event(b,ctx.who,events,m,h,'next-weapon-shadow',{coveragePercent:[33,66,100][s-1],fieldCards:field,discardCards:discards,
     partnerCardId:partner?.sourceCardId||null});break;
   }
   case 'tenebre-infinite':break;
   default:throw Error('Arma nuova non gestita '+p.slug);
  }
  if(impacts.length)event(b,ctx.who,events,m,h,'next-weapon-shot',{pattern:p.pattern,stage:s,impacts,hitCount:impacts.length,
   actualDamage:impacts.reduce((n,e)=>n+e.actualDamage,0)});
  if(m.deployedPly===ply)out.played.push(m.sourceCardId);
 }
 return out;
}
export function resolveNextOpponentReactions(b,ctx,events,h){
 const who=other(ctx.who),owner=b.sides[who],enemy=b.sides[ctx.who];
 for(const m of owner.machines.flatMap(m=>[m,...(m.replicaState&&alive(m)&&m.untilPly>b.ply?[m.replicaState]:[])]).filter(m=>is(m,'massa-inerziale')&&alive(m)&&m.nextMassReactionPly===b.ply)){
  m.nextMassReactionPly=-1;
  if(!ctx.cards.length||!alive(owner.ships[0])||!alive(enemy.ships[0])||!h.unitEnabled(m,b.ply)||h.unitSilenced(m,b.ply))continue;
  const target=all(enemy,h).find(t=>identity(t)===m.nextMassTarget);
  if(!legal(target,enemy,b.ply,h))continue;
  const reaction={who,cards:[],order:{},pierceLeft:0,nebulaVolleySerial:0,nebulaSeen:new Map(),
   stormHitIds:new Set(),stormEscortVictims:new Set(),power:0,attackElement:m.weaponElementId};
  h.startNebulaVolley(reaction);
  const nominal=ctx.cards.length*profile(m).perCardDamage;
  const r=directHit(b,reaction,events,m,nominal,target,{},h);
  event(b,who,events,m,h,'next-weapon-shot',{pattern:profile(m).pattern,opponentCards:ctx.cards.length,
   stage:stage(m,b.ply-1),impacts:[{targetKind:r.target?.kind,targetId:r.target?.unit.id,nominalDamage:nominal,actualDamage:r.damage||0}],
   actualDamage:r.damage||0});
 }
}
// 15 secondi effettivi di tempo del giocatore colpito; il tempo strategico
// ordinario resta invariato, l'extra della sola Centralina è permanente.
export function advanceNextCommandAcceleration(timed,nowMs,h){
 const b0=timed.battle,who=b0?.turn,s0=b0?.sides?.[who],status=s0?.nextCommandAcceleration;
 if(b0?.phase!=='playing'||!status?.remaining||!s0.componentTimers?.command||s0.componentTimers.command.expired)return timed;
 const elapsed=Math.max(0,Math.min(30,Math.floor((Math.min(nowMs,b0.deadlineMs)-b0.turnStartedAtMs)/1000)));
 const processed=status.processedPly===b0.ply?status.processed:0;
 const seconds=Math.min(status.remaining,Math.max(0,elapsed-processed));if(!seconds)return timed;
 const b=timed.changed?b0:h.clone(b0),side=b.sides[who],st=side.nextCommandAcceleration,timer=side.componentTimers.command;
 st.processedPly=b.ply;st.processed=processed+seconds;st.remaining-=seconds;
 const extra=Math.min(timer.remainingSeconds,seconds*st.rate);
 side.nextCommandExtraSeconds=(side.nextCommandExtraSeconds||0)+extra;
 timer.remainingSeconds=Math.max(0,timer.remainingSeconds-extra);timer.expired=timer.remainingSeconds===0;
 const events=[...timed.events];
 events.push(h.emit(b,who,'next-weapon-command-tick','Centralina · deterioramento accelerato',{component:'command',extraSeconds:extra,remainingSeconds:timer.remainingSeconds}));
 if(timer.expired){events.push(h.emit(b,who,'component-expired','Centralina esaurita',{component:'command'}));st.remaining=0;h.enforceDestroyedSystems(side,b.ply);}
 return {battle:b,events,changed:true};
}

 // Lo stato locale contiene i segreti; i soli eventi/UI non li rivelano.
 // Il futuro PvP online dovrà custodirli sul server.
const validEclipseChoice=n=>Number.isInteger(n)&&n>=1&&n<=3;
const eclipseRandom=b=>{b.rng=(Math.imul(1664525,b.rng>>>0)+1013904223)>>>0;return 1+((b.rng>>>16)%3);};
export function lockNextEclipseGuess(b,ctx,events,order,h){
 const pending=b.sides[other(ctx.who)].nextEclipsePending;
 if(!pending||pending.guess!==null)return;
 pending.guess=validEclipseChoice(order.nextEclipseGuess)?order.nextEclipseGuess:eclipseRandom(b);
 event(b,ctx.who,events,pending.machine,h,'next-weapon-eclipse-guess-locked',{predictionLocked:true});
}
export function releaseNextEclipse(b,ctx,events,order,h){
 const side=b.sides[ctx.who],pending=side.nextEclipsePending;
 if(!pending||pending.releasePly!==b.ply)return null;
 side.nextEclipsePending=null;
 if(pending.machine.holoOwnerCardId&&!(side.machines||[]).some(m=>m.id===pending.machine.id&&alive(m)&&(m.holoOwnerUntilPly??m.untilPly)>b.ply))return null;
 const m=pending.machine,correct=pending.guess===pending.chosenDelay,
  nominal=correct?pending.basePower:pending.bonusPower;
 const enemy=b.sides[other(ctx.who)],target=ordinary(enemy,order,b.ply,h),out=empty();
 h.startNebulaVolley(ctx);
 let r={damage:0,target};
 if(target&&alive(side.ships[0])&&alive(enemy.ships[0])&&nominal>0){
  const prior=ctx.attackElement;ctx.attackElement=m.weaponElementId;
  try{r=h.linceHit(b,ctx,events,target,nominal,m.sourceCardId,order,false,0);}
  finally{ctx.attackElement=prior;}
 }
 record(out,r);
 event(b,ctx.who,events,m,h,'next-weapon-eclipse-reveal',{chosenDelay:pending.chosenDelay,guess:pending.guess,
  correct,nominalDamage:nominal,actualDamage:r.damage||0,targetId:r.target?.unit.id});
 event(b,ctx.who,events,m,h,'next-weapon-shot',{pattern:profile(m).pattern,stage:1,actualDamage:r.damage||0,
  impacts:target?[{targetKind:r.target?.kind,targetId:r.target?.unit.id,nominalDamage:nominal,actualDamage:r.damage||0}]:[]});
 return out;
}
