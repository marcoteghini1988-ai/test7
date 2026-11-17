// Vespa di Vetro (C02): dieci abilità e condizioni reali.
// Nessun effetto viene convertito in un bonus generico.
export const PRISMA_ACTIONS=Object.freeze({
 'nx-c02-01':'prismatic-lens',
 'nx-c02-02':'reflected-shard',
 'nx-c02-03':'machine-deflection',
 'nx-c02-04':'false-reflection',
 'ex-c02-01':'prisma-artisan',
 'nx-c02-06':'lens-cut',
 'nx-c02-07':'broken-geometry',
 'nx-c02-08':'prisma-custody',
 'nx-c02-09':'segmented-mirror',
 'nx-c02-10':'crystal-rose'
});
export const PRISMA_MODULE_SLOTS=Object.freeze({
 'nx-c02-01':'weapon',
 'nx-c02-09':'utility'
});
export const PRISMA_ATTACK_ACTIONS=Object.freeze([
 'reflected-shard','broken-geometry','crystal-rose'
]);
export const isPrismaModule=id=>Object.hasOwn(PRISMA_MODULE_SLOTS,id);
export const prismaModuleSlot=id=>PRISMA_MODULE_SLOTS[id]||null;
export const isPrismaAction=id=>Object.hasOwn(PRISMA_ACTIONS,id);
export const livePrismaUnits=(side,ply=0)=>[
 ...(side?.escorts||[]).filter(e=>e.hp>0&&!e.destroyed&&
  (e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&e.linked!==false)
   .map(unit=>({kind:'escort',unit})),
 ...(side?.machines||[]).filter(m=>m.hp>0&&!m.destroyed&&
  (m.disabledUntilPly||0)<=ply&&(m.jammedUntilPly||0)<=ply)
   .map(unit=>({kind:'machine',unit}))
];
export function ensurePrismaState(side){
 side.prisma??={
  shard:null,shardGeneratedPly:-999,artisanShiftPly:-999,
  shieldMoveTarget:null
 };
 return side.prisma;
}
export function prismaPrecondition(def,side,battle=null){
 const action=PRISMA_ACTIONS[def?.id];
 if(!action)return '';
 const mother=side?.ships?.[0],ply=battle?.ply||0;
 if(mother?.id!=='C02')return 'Carta esclusiva della Vespa di Vetro';
 if(mother.level<(def.minShipLevelDraft||1))return 'Livello Vespa insufficiente';
 const active=id=>mother.parts.some(p=>p.id===id&&p.hp>0&&!p.destroyed);
 const modules=side.modules||{};
 if(isPrismaModule(def.id)){
  const slot=prismaModuleSlot(def.id);
  if(!active(slot==='weapon'?'weapons':'generator'))return 'Alimentazione del modulo non operativa';
  if(modules[slot]?.cardId===def.id)return 'Modulo già montato';
 }
 if(PRISMA_ATTACK_ACTIONS.includes(action)&&!active('weapons'))
  return 'Arsenale distrutto';
 const selfUnits=livePrismaUnits(side,ply);
 const enemy=battle?battle.sides.A===side?battle.sides.B:battle.sides.A:null;
 const enemyUnits=enemy?livePrismaUnits(enemy,ply):[];
 if(action==='machine-deflection'&&selfUnits.filter(e=>e.kind==='machine').length<2)
  return 'Prisma di deviazione richiede due macchine operative';
 if(action==='false-reflection'&&![
  ...selfUnits,...mother.parts.filter(p=>p.hp>0&&!p.destroyed).map(unit=>({kind:'part',unit}))
 ].length)return 'Nessun bersaglio alleato da proteggere';
 if(action==='lens-cut'&&enemy&&!enemyUnits.some(({kind,unit})=>
  (enemy.protections||[]).some(p=>p.remaining>0&&p.untilPly>ply&&
   (kind==='escort'&&p.target==='escort'&&p.escortSlot===unit.slot||
    kind==='machine'&&p.target==='machine'&&p.machineSlot===unit.slot)&&
   enemy.defenses?.some(d=>d.source===p.source&&!d.hidden))))
  return 'Nessuna protezione scoperta su una unità nemica';
 if(action==='broken-geometry'&&enemy&&enemyUnits.length<2)
  return 'Geometria spezzata richiede due unità nemiche vive';
 if(action==='prisma-custody'){
  if(!active('command'))return 'La Centralina è necessaria';
  if(!selfUnits.some(x=>x.kind==='escort'&&x.unit.slot===0))
   return 'Primo supporto non operativo';
  if(!(side.protections||[]).some(p=>p.target==='part'&&p.partId==='generator'&&
   p.remaining>0&&p.untilPly>ply&&
   side.defenses?.some(d=>d.source===p.source&&!d.hidden)))
   return 'Nessuna protezione scoperta sul Generatore da spostare';
 }
 if(action==='crystal-rose'){
  if(!active('command')||selfUnits.filter(x=>x.kind==='escort').length<2)
   return 'Rosa di cristallo richiede entrambi i supporti operativi e la Centralina';
  if(enemy&&!enemyUnits.length)return 'Nessuna unità nemica raggiungibile';
 }
 if(action==='reflected-shard'&&enemy&&!enemyUnits.length)
  return 'Nessuna unità nemica raggiungibile';
 return '';
}
