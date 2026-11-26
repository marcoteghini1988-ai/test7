// Solo Node, attivazione esplicita con --import. Non scrive nei sorgenti live.
// HP invariati. Include la correzione candidata del bypass che conserva la Difesa.
import {registerHooks} from 'node:module';
registerHooks({load(url,context,next){
 const r=next(url,context);
 if(url.endsWith('/src/fleetNext/combat.js')){
  let s=typeof r.source==='string'?r.source:Buffer.from(r.source).toString();
  const edits=[
   ['  p.remaining--;\n  if(!bypass&&p.id=', '  if(!(bypass&&ctx.reviewKeepBypassedDefense))p.remaining--;\n  if(!bypass&&p.id='],
   ['   const previousNebulaPierce=ctx.nebulaPierceLeft||0;', '   const previousPreserve=ctx.reviewKeepBypassedDefense;ctx.reviewKeepBypassedDefense=pattern===\'induction\'&&piercing;\n   const previousNebulaPierce=ctx.nebulaPierceLeft||0;'],
   ['   ctx.nebulaPierceLeft=previousNebulaPierce;', '   ctx.reviewKeepBypassedDefense=previousPreserve;\n   ctx.nebulaPierceLeft=previousNebulaPierce;']
  ];
  for(const [before,after]of edits){if(!s.includes(before))throw Error('Controllo bypass cambiato');s=s.replace(before,after);}
  return {...r,source:s};
 }
 if(url.endsWith('/src/weaponKinematics.js')){
  const text=typeof r.source==='string'?r.source:Buffer.from(r.source).toString();
  const before='p=a.clone().lerp(b,u);';
  if(!text.includes(before))throw Error('Curva cambiata: ricontrollare la prospettiva');
  return {...r,source:text.replace(before,'p=boardPointToWorld({x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u},camera);')};
 }
 if(!url.endsWith('/src/fleetNext/approvedWeaponSalvos.js'))return r;
 let s=typeof r.source==='string'?r.source:Buffer.from(r.source).toString();
 const replace=(before,after)=>{if(!s.includes(before))throw Error('Sorgente cambiato: '+before);s=s.replace(before,after);};
 replace("[1,3,6,9],['piston','orbital-trident','double-orbit','gravity-storm']","[2,3,5,7],['rotating-hammers','rotating-hammers','rotating-hammers','rotating-hammers']");
 replace("[3,6,9,7],['staccato','crossfire','triple-battery','six-plus-lance']","[1,1,1,1],['single-cannonball','single-cannonball','single-cannonball','single-cannonball']");
 replace("[0,0,3,6],[null,null,'thermal-lob','plasma-spiral']","[0,0,3,3],[null,null,'thermal-lob','thermal-lob']");
 replace("const p=approvedWeaponSalvo(data.cardId);if(!p||p.count===0)return data;",`let p=approvedWeaponSalvo(data.cardId);if(!p||p.count===0)return data;
 if(p.familyId==='weapon-designed-metallic-recuperatore-termobalistico'){
  const base=p.tier===3?23:18;
  const boosted=(data.impacts||[]).some(h=>h.nominalDamage>base);
  p={...p,count:boosted?6:3,finisher:false};
 }`);
 return {...r,source:s};
}});
