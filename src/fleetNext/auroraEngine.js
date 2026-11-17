// Regole reali delle 10 esclusive Aurora-0. Nessun bonus sostitutivo.
import {linceModuleSlot,recoveredModuleForMount} from './linceEngine.js';
import {prismaModuleSlot} from './prismaEngine.js';
import {corvoModuleSlot} from './corvoEngine.js';
import {falcoModuleSlot} from './falcoEngine.js';
import {mantaModuleSlot} from './mantaEngine.js';
import {sharkModuleSlot} from './sharkEngine.js';
import {nebulaModuleSlot} from './nebulaEngine.js';
import {stormModuleSlot} from './stormEngine.js';
import {royalModuleSlot} from './royalEngine.js';
import {obsidianModuleSlot} from './obsidianEngine.js';
import {arkModuleSlot} from './arkEngine.js';
export const AURORA_ACTIONS=Object.freeze({
 'nx-n00-01':'optics',
 'nx-n00-02':'burst',
 'nx-n00-03':'dismantle',
 'nx-n00-04':'sacrificial-veil',
 'nx-n00-05':'adapt',
 'ex-n00-01':'cartographer',
 'nx-n00-07':'piercing-barrel',
 'nx-n00-08':'modular-armor',
 'nx-n00-09':'forked-cannon',
 'nx-n00-10':'reconfigure'
});
export const AURORA_MODULE_SLOTS=Object.freeze({
 'nx-n00-01':'utility','nx-n00-07':'weapon',
 'nx-n00-08':'utility','nx-n00-09':'weapon'
});
export const AURORA_ATTACK_ACTIONS=Object.freeze(['burst','dismantle']);
export const isAuroraAction=id=>Object.hasOwn(AURORA_ACTIONS,id);
export const isAuroraModule=id=>Object.hasOwn(AURORA_MODULE_SLOTS,id);
export const auroraModuleSlot=id=>AURORA_MODULE_SLOTS[id]||null;
const disabledHost=(side,slot)=>side?.ships?.[0]?.parts?.some(p=>
 p.id===(slot==='weapon'?'weapons':'generator')&&p.dismantled);
export const installedModule=(side,slot)=>disabledHost(side,slot)?null:(side?.modules||{})[slot]||null;
export const moduleSlotForCard=id=>auroraModuleSlot(id)||linceModuleSlot(id)||
 prismaModuleSlot(id)||corvoModuleSlot(id)||falcoModuleSlot(id)||mantaModuleSlot(id)||
 sharkModuleSlot(id)||nebulaModuleSlot(id)||stormModuleSlot(id)||royalModuleSlot(id)||
 obsidianModuleSlot(id)||arkModuleSlot(id)||null;
export const liveModules=side=>Object.values(side?.modules||{}).filter(m=>
 m&&m.hp>0&&!m.destroyed&&!disabledHost(side,m.slot));
export function removeModule(side,slot){
 const module=installedModule(side,slot);
 if(!module)return null;
 side.modules[slot]=null;
 side.discard.push(module.cardId);
 if(module.cardId==='nx-r02-01'&&side.manta)side.manta.energy=0;
 if(module.cardId==='nx-e02-09'&&side.storm){side.storm.charge=false;side.storm.chargeStoredPly=-999;}
 if(module.cardId==='nx-r01-01'&&side.falco?.pending?.held&&
  side.falco.pending.capacitorModuleId===module.id){
  side.discard.push(side.falco.pending.cardId);
  side.falco.pending=null;
 }
 if(side.auroraVeil?.moduleId===module.id)side.auroraVeil=null;
 return module;
}
export function mountModule(side,def,ownPartId=null){
 const slot=auroraModuleSlot(def.id)||linceModuleSlot(def.id)||prismaModuleSlot(def.id)||corvoModuleSlot(def.id)||falcoModuleSlot(def.id)||mantaModuleSlot(def.id)||sharkModuleSlot(def.id)||nebulaModuleSlot(def.id)||stormModuleSlot(def.id)||royalModuleSlot(def.id)||obsidianModuleSlot(def.id)||arkModuleSlot(def.id);
 if(!slot)return {ok:false,reason:'Questa carta non è un componente montabile'};
 if(side.heldModules?.[slot]||disabledHost(side,slot))
  return {ok:false,reason:'Alloggiamento temporaneamente smontato'};
 const old=installedModule(side,slot);
 if(old?.cardId===def.id)return {ok:false,reason:'Modulo identico già montato'};
 if(old)removeModule(side,slot);
 const restored=recoveredModuleForMount(side,def.id);
 const arkIndex=side.ark?.recoveredModules?.indexOf(def.id)??-1;
 const arkRecovered=arkIndex>=0;
 if(arkRecovered)side.ark.recoveredModules.splice(arkIndex,1);
 const entry={id:restored?.id||'module:'+def.id+':'+(side.moduleSerial=(side.moduleSerial||0)+1),
  cardId:def.id,name:def.name||def.nome,slot,hp:restored?.hp??(arkRecovered?1:2),maxHp:restored?.maxHp??2,
  destroyed:false,attachedPartId:restored?.attachedPartId||
   (def.id==='nx-n00-08'?ownPartId:null),
  mountedAtTurn:side.turnCount||0,activatedPly:restored?.activatedPly??-1,
  disabledUntilPly:restored?.disabledUntilPly??0,lastDisabledPly:restored?.lastDisabledPly??-999};
 side.modules[slot]=entry;
 return {ok:true,entry,replaced:old||null};
}
export function reconfigurationOptions(side,lookup,level=1){
 return liveModules(side).flatMap(module=>(side.deck||[])
  .filter(id=>id!==module.cardId&&auroraModuleSlot(id)===module.slot&&
   lookup(id)?.minShipLevelDraft<=level&&lookup(id)?.playable!==false)
  .map(cardId=>({slot:module.slot,cardId,name:lookup(cardId)?.name||cardId})));
}
export function auroraPrecondition(def,side,lookup,level=1){
 const action=AURORA_ACTIONS[def?.id];
 if(!action)return '';
 if(side?.ships?.[0]?.id!=='N00')return 'Esclusiva utilizzabile soltanto con Aurora-0';
 if(level<(def.minShipLevelDraft||1))return 'Livello Aurora insufficiente';
 const mother=side.ships[0];
 const alive=id=>mother.parts.some(p=>p.id===id&&p.hp>0&&!p.destroyed);
 if(isAuroraModule(def.id)){
  if(!alive(auroraModuleSlot(def.id)==='weapon'?'weapons':'generator'))
   return 'Sistema necessario al modulo distrutto';
  if(installedModule(side,auroraModuleSlot(def.id))?.cardId===def.id)
   return 'Questo modulo è già montato';
 }
 if(['burst','dismantle'].includes(action)&&!alive('weapons'))
  return 'Arsenale distrutto: il comando non può partire';
 if(action==='sacrificial-veil'&&!liveModules(side).length)
  return 'Devi avere un modulo operativo da sacrificare';
 if(action==='adapt'&&!(side.hand||[]).some(id=>id!==def.id&&lookup(id)?.shipId==='N00'))
  return 'Non hai un’altra esclusiva Aurora da mettere sotto il mazzo';
 if(action==='reconfigure'&&!reconfigurationOptions(side,lookup,level).length)
  return 'Non hai un modulo alternativo compatibile nel mazzo';
 if(action==='cartographer'&&!alive(mother.parts.some(p=>p.id==='bridge')?'bridge':'generator'))
  return 'Sistema del Personaggio distrutto';
 return '';
}
