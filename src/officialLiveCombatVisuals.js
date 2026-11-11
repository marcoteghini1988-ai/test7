import {planWeaponSalvos,weaponEffect} from './mathWeaponEffects.js';

export const LIVE_AMMO_FEED_MS=280;
export const LIVE_VITAL_BLAST_MS=1000;
const CUE_LIFETIME_MS=2800;
const VISIBLE_CUES=new Set(['shot','weapon_charge','numeric_discard','vital_exposed',
 'vital_card','vital_destroyed','vital_hit','special','terrain','character','trap','trap_placed',
 'bomb_explosion','boss_regen','character_regen']);
const shotKey=({by,turn,atMs})=>by+'/'+turn+'/'+atMs;
const opponent=side=>side==='A'?'B':'A';

export const LIVE_VITAL_SPRITES=Object.freeze({
 engine:'vital-engine',weapons:'vital-weapons',shieldGenerator:'vital-generator',command:'vital-command'
});
export const LIVE_FX_SPRITES=Object.freeze(['charge','shield-contact','shield-fracture',
 'trap-wave',...Object.values(LIVE_VITAL_SPRITES)]);

// Il registro descrive azioni già risolte. I ritardi sincronizzano soltanto
// la rappresentazione della salva e della trappola che la intercetta.
export function liveCombatCues(history,now){
 const recent=history.flatMap((event,index)=>{
  if(!VISIBLE_CUES.has(event.kind)||!Number.isFinite(event.atMs)||now-event.atMs>=CUE_LIFETIME_MS)return [];
  if(event.kind==='vital_card'&&event.completed)return [];
  if(event.kind==='numeric_discard'&&event.by!=='A')return [];
  return [{event,index}];
 });
 const shots=new Map(recent.filter(({event})=>event.kind==='shot')
  .map(({event})=>[shotKey(event),event]));
 return recent.map(cue=>{
  const {event}=cue;
  const shot=event.kind==='trap'&&event.trigger==='shield'&&shots.get(shotKey(event));
  return {...cue,delay:shot?LIVE_AMMO_FEED_MS+weaponEffect(shot.weaponId).durationMs-210:0};
 });
}

export function liveDefenseContact({owner,escortIndex,before,after}){
 const delta=after-before;
 const unit=escortIndex==null?'shield':'escort';
 const state=delta>0?'repair':after===0?'break':'hit';
 return {owner,escortIndex,kind:unit+'-'+state,delta};
}

export function liveShotContacts(event){
 const escorts=(event.defenseChanges??[])
  .filter(change=>change.escortIndex!=null&&change.after<change.before)
  .map(liveDefenseContact);
 if(event.damage<=0&&escorts.length)return escorts;
 const shieldKind=event.damage>0?(event.shieldAfter===0?'shield-break':'shield-hit'):
  (event.shieldBefore>0?'shield-guard':'shield-empty');
 return [{owner:opponent(event.by),escortIndex:null,kind:shieldKind,delta:-event.damage},...escorts];
}

// Riusa il rinculo degli armamenti montati con lo stesso tempo di lancio
// dei proiettili LIVE. Le scudiere hanno un punto di fuoco separato.
export function liveMountedWeaponEffect(cues,owner){
 const active=new Map();
 for(const {event,index} of cues){
  if(event.by===owner&&event.shipId==='mother'&&
     (event.kind==='shot'||event.kind==='weapon_charge'))active.set(event.weaponId,{event,index});
 }
 if(!active.size)return null;
 const volleys=[...active.values()].map(({event,index})=>({
  weaponId:event.weaponId,vesselIndex:0,bullets:event.bullets,
  charging:event.kind==='weapon_charge',charge:event.charge,animationKey:index
 }));
 const salvos=volleys.flatMap(shot=>planWeaponSalvos([shot]).map(salvo=>({...salvo,
  rounds:salvo.rounds.map(round=>({...round,launchMs:round.launchMs+LIVE_AMMO_FEED_MS}))
 })));
 return {side:owner==='A'?'player':'enemy',volleys,salvos};
}
