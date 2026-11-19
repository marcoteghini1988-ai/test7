// Eclissi Stellare — 15 abilità condivise delle scudiere indipendenti.
import {supportRegenerationPerSecond,supportPoisonPerSecond,
 supportLastShieldHeal,supportCapacitorDamage,hasBalancedMother} from './confirmedCardBalance.js';
import {limitedMotherDamage} from './motherBalance.js';
// La progressione delle singole scudiere e i valori numerici sono provvisori.
// Nessuna scudiera spara autonomamente: l'unica scarica offensiva è una passiva.
export const SUPPORT_SKILL_LABELS=Object.freeze({
 'weapon-double':'Carte Arma potenziate',
 'regeneration':'Rigenerazione continua',
 'last-shield':'Super-scudiera',
 'trap-silence':'Soppressione Trappole',
 'terrain-half':'Terreni avversari dimezzati',
 'terrain-immunity':'Protezione ambientale',
 'capacitor':'Accumulo e scarica di fulmini',
 'extra-draw':'Pescata aggiuntiva',
 'sacrifice':'Sacrificio volontario',
 'reactive-poison':'Veleno reattivo',
 'normal-boost':'Aumento attacchi normali',
 'special-boost':'Aumento Attacco Speciale',
 'energy-discount':'Sconto Carte Energia',
 'death-storm':'Tempesta alla distruzione',
 'death-energy':'Conversione Energetica'
});
export const SUPPORT_SKILL_DESCRIPTIONS=Object.freeze({
 'weapon-double':'Raddoppia la potenza delle Carte Arma Attacco che aggiungono danno.',
 'regeneration':'Recupera gradualmente HP della madre durante i secondi del turno avversario.',
 'last-shield':'Possiede molti HP e alla distruzione restituisce HP alla madre.',
 'trap-silence':'Le Trappole nemiche si possono piazzare ma non si attivano finché questo supporto è operativo.',
 'terrain-half':'Dimezza la durata di una Carta Terreno giocata dall’avversario.',
 'terrain-immunity':'La madre ignora gli effetti negativi del Terreno ma conserva quelli positivi.',
 'capacitor':'Accumula cariche a fine turno e rilascia una scarica di fulmini senza spari ordinari.',
 'extra-draw':'Pesca una carta aggiuntiva a fine turno; massimo tre giocate resta invariato.',
 'sacrifice':'Se possiede almeno l’80% degli HP, puoi sacrificarla per danneggiare direttamente la madre avversaria.',
 'reactive-poison':'Quando viene colpita avvelena la madre e i supporti nemici: −0,1 HP al secondo durante il successivo turno di chi l’ha colpita.',
 'normal-boost':'Aumenta percentualmente il danno del tiro normale della madre.',
 'special-boost':'Aumenta percentualmente la potenza dell’Attacco Speciale della madre.',
 'energy-discount':'Riduce di una carica, fino a un minimo di una, il costo dell’Attacco Speciale.',
 'death-storm':'Alla distruzione scatena fulmini che eliminano le Carte Personaggio e Attacco attive sul campo nemico.',
 'death-energy':'Alla distruzione si converte in cariche per la barra Energia della nave madre.'
});
// Ogni riga corrisponde alle due copie base di una famiglia. Effetti ripetuti
// sono intenzionali e i giocatori possono montarne anche due uguali.
export const SUPPORT_SKILL_ASSIGNMENTS=Object.freeze({
 N00:['regeneration','weapon-double'],
 C01:['last-shield','normal-boost'],
 C02:['terrain-immunity','trap-silence'],
 C03:['reactive-poison','extra-draw'],
 R01:['normal-boost','weapon-double'],
 R02:['trap-silence','energy-discount'],
 R04:['last-shield','sacrifice'],
 E01:['terrain-immunity','terrain-half'],
 E02:['death-storm','capacitor'],
 L01:['special-boost','weapon-double'],
 L03:['death-storm','last-shield'],
 L04:['death-energy','capacitor']
});
export const supportSkillFor=(originShipId,slot)=>
 SUPPORT_SKILL_ASSIGNMENTS[originShipId]?.[slot]||null;
// Un solo modello per navicella; la scelta della passiva tra le due
// vecchie varianti conserva tutte le 15 meccaniche già implementate.
// Assegnazioni provvisorie fino alla fase di bilanciamento dei 13 modelli.
export const NATIVE_SUPPORT_SKILL_SLOTS=Object.freeze({
 N00:0,C01:0,C02:1,C03:1,R01:0,R02:1,R04:1,
 E01:0,E02:1,L01:1,L03:0,L04:1
});
export const nativeSupportSlotFor=id=>NATIVE_SUPPORT_SKILL_SLOTS[id]??0;
export const nativeSupportSkillFor=id=>supportSkillFor(id,nativeSupportSlotFor(id));


if(Object.keys(SUPPORT_SKILL_ASSIGNMENTS).length!==12||
 Object.keys(SUPPORT_SKILL_LABELS).length!==15||
 Object.values(SUPPORT_SKILL_ASSIGNMENTS).some(pair=>pair.length!==2||
  pair.some(id=>!SUPPORT_SKILL_LABELS[id]))||
 Object.keys(SUPPORT_SKILL_LABELS).some(skill=>
  !Object.values(SUPPORT_SKILL_ASSIGNMENTS).some(pair=>pair.includes(skill))))
 throw Error('Le 34 scudiere devono assegnare tutte e 15 le abilità condivise');

const idsFor=e=>Array.isArray(e?.supportSkillIds)?e.supportSkillIds:
 e?.supportSkillId?[e.supportSkillId]:[];
export const livingSkillSupports=(side,skillId,ply=0)=>
 side?.independentSupportRoster?
 (side.escorts||[]).flatMap(e=>e.hp>0&&!e.destroyed&&
  e.linked!==false&&(e.disabledUntilPly||0)<=ply&&(e.jammedUntilPly||0)<=ply&&
  (e.silencedUntilPly||0)<=ply?
  idsFor(e).filter(id=>id===skillId).map(()=>e):[]):[];
export const skillCount=(side,skillId,ply=0)=>livingSkillSupports(side,skillId,ply).length;
export const trapsSuppressed=(battle,ownerSide)=>{
 const otherSide=battle?.sides?.A===ownerSide?battle?.sides?.B:
  battle?.sides?.B===ownerSide?battle?.sides?.A:null;
 return skillCount(otherSide,'trap-silence',battle?.ply||0)>0;
};
export const terrainImmunity=(side,ply)=>skillCount(side,'terrain-immunity',ply)>0;
export const terrainHalf=(side,ply)=>skillCount(side,'terrain-half',ply)>0;
export const effectiveSupportEnergyCost=(side,ability,ply=0)=>
 ability?Math.max(1,ability.cost-(ability.kind==='attack'?
 skillCount(side,'energy-discount',ply):0)):null;
export const supportSpecialBoost=(side,power,ply=0)=>
 Math.max(0,Math.round(power*(1+.25*skillCount(side,'special-boost',ply))));
export const supportNormalBoost=(side,power,ply=0)=>
 Math.max(0,Math.round(power*(1+.25*skillCount(side,'normal-boost',ply))));
export const supportWeaponCardBoost=(side,amount,ply=0)=>
 amount*Math.pow(2,Math.min(2,skillCount(side,'weapon-double',ply)));

const roundTenth=x=>Math.round(Math.max(0,x)*10)/10;
const available=b=>b?.phase==='playing'&&
 Object.values(b.sides||{}).some(side=>side?.independentSupportRoster);
const note=(b,who,kind,text,detail={})=>{
 const event={round:b.round,ply:b.ply,who,kind,text,...detail};
 b.log=[...(b.log||[]),event].slice(-80);
 return event;
};

// Rileva danni REALI dopo gli attacchi. Nessun trigger per i colpi bloccati.
// Una sola attivazione di veleno per supporto e turno, mai ripetuta per
// ogni secondo. I supporti con 0 HP non riattivano effetti permanenti.
export function settleIndependentSupportDamage(b,attackerWho=null){
 if(!available(b))return [];
 const events=[];
 for(const [who,side] of Object.entries(b.sides)){
  for(const e of side.escorts||[]){
   const last=Number.isFinite(e.supportObservedHp)?e.supportObservedHp:e.maxHp;
   if(e.hp<last&&idsFor(e).includes('reactive-poison')&&e.hp>0&&
    attackerWho!==null&&who!==attackerWho){
    e.poisonReadyPly=b.ply+2;
    events.push(note(b,who,'support-poison',e.name+
     ' prepara Veleno reattivo per il prossimo turno di chi l’ha colpita',
     {supportId:e.catalogSupportId,readyPly:e.poisonReadyPly}));
   }
   e.supportObservedHp=e.hp;
   if(e.hp>0&&!e.destroyed||e.supportDeathResolved)continue;
   e.hp=0;e.destroyed=true;e.linked=false;e.supportDeathResolved=true;
   if(idsFor(e).includes('last-shield')){
    const mother=side.ships[0],healed=Math.min(supportLastShieldHeal(mother),Math.max(0,mother.maxHp-mother.hp));
    mother.hp+=healed;
    events.push(note(b,who,'support-death',e.name+
     ' si spegne: +'+healed+' HP alla madre',{skillId:'last-shield',healed}));
   }
   if(idsFor(e).includes('death-storm')){
    const enemy=b.sides[who==='A'?'B':'A'];
    const previousAttacks=(enemy.attackSlots||[]).filter(Boolean);
    const commander=enemy.commander;
    if(commander){enemy.discard.push(commander.id);enemy.commander=null;}
    enemy.attackSlots=[];
    enemy.stagedComboCards=[];
    events.push(note(b,who,'support-death',e.name+
     ' scatena una pioggia di fulmini: Personaggio e Attacchi avversari distrutti',
     {skillId:'death-storm',clearedAttacks:previousAttacks.length,
      clearedCharacter:!!commander}));
   }
   if(idsFor(e).includes('death-energy')){
    side.elementalCharges??={};
    const element=side.ships[0].element;
    const current=Object.values(side.elementalCharges).reduce((n,v)=>n+(v||0),0);
    const charge=Math.min(2,Math.max(0,4-current));
    side.elementalCharges[element]=(side.elementalCharges[element]||0)+charge;
    events.push(note(b,who,'support-death',e.name+' diventa '+charge+
     ' cariche Energia per la madre',
     {skillId:'death-energy',element,charge}));
   }
  }
 }
 return events;
}

export function advanceIndependentSupportTime(battle,nowMs){
 if(!available(battle)||!Number.isFinite(nowMs))return {battle,events:[],changed:false};
 const started=Number.isFinite(battle.turnStartedAtMs)?battle.turnStartedAtMs:
  battle.deadlineMs-30000;
 const elapsed=Math.max(0,Math.min(30,Math.floor((Math.min(nowMs,battle.deadlineMs)-started)/1000)));
 const consumed=Math.max(0,Math.floor(battle.supportSecondsProcessed||0));
 if(elapsed<=consumed)return {battle,events:[],changed:false};
 const b=JSON.parse(JSON.stringify(battle)),events=[];
 for(let sec=consumed;sec<elapsed&&b.phase==='playing';sec++){
  const activeSide=b.sides[b.turn],opponent=b.sides[b.turn==='A'?'B':'A'];
  for(const e of livingSkillSupports(opponent,'regeneration',b.ply)){
   const m=opponent.ships[0];
   if(m.hp>0&&m.hp<m.maxHp)m.hp=Math.min(m.maxHp,
    roundTenth(m.hp+supportRegenerationPerSecond(m)));
  }
  for(const e of livingSkillSupports(opponent,'reactive-poison',b.ply)){
   if(e.poisonReadyPly!==b.ply)continue;
   const victims=[activeSide.ships[0],...(activeSide.escorts||[])];
   for(const target of victims){
    if(target.hp>0&&!target.destroyed){
     target.hp=roundTenth(Math.max(0,target.hp-supportPoisonPerSecond(target,activeSide.ships[0])));
     if(target!==activeSide.ships[0]&&target.hp===0){
      target.destroyed=true;target.linked=false;
     }
    }
   }
  }
  events.push(...settleIndependentSupportDamage(b,null));
  if(b.sides.A.ships[0].hp<=0||b.sides.B.ships[0].hp<=0){
   const deadA=b.sides.A.ships[0].hp<=0,deadB=b.sides.B.ships[0].hp<=0;
   b.phase='finished';b.winner=deadA&&deadB?'draw':deadA?'B':'A';
   b.finishReason='La nave madre ha esaurito gli HP durante un effetto temporizzato.';
   b.finishedAtMs=Math.min(nowMs,b.deadlineMs);
   events.push(note(b,'system','finish','Fine partita per danno nel tempo'));
  }
 }
 b.supportSecondsProcessed=elapsed;
 b.lastEvents=events.length?events:b.lastEvents;
 return {battle:b,events,changed:true};
}


// Il condensatore accumula senza armi ordinarie: solo alla terza carica
// rilascia una scarica alle unità nemiche.
export function resolveIndependentSupportOwnTurn(b,who){
 if(!available(b))return [];
 const side=b.sides[who],enemy=b.sides[who==='A'?'B':'A'],events=[];
 for(const e of livingSkillSupports(side,'capacitor',b.ply)){
  e.supportCharge=(e.supportCharge||0)+1;
  if(e.supportCharge<3)continue;
  e.supportCharge=0;
  let motherDamage=0,supportDamage=0;
  for(const target of [enemy.ships[0],...(enemy.escorts||[])])
   if(target.hp>0&&!target.destroyed){
    const raw=supportCapacitorDamage(target,enemy.ships[0]);
    const actual=target===enemy.ships[0]?
     limitedMotherDamage(target,raw,b.ply):Math.min(target.hp,raw);
    target.hp=roundTenth(Math.max(0,target.hp-actual));
    if(target===enemy.ships[0])motherDamage+=actual;
    else{
     supportDamage+=actual;
     if(target.hp===0){target.destroyed=true;target.linked=false;}
    }
   }
  events.push(note(b,who,'support-lightning',e.name+
   ' scarica fulmini sulle unità nemiche (−'+motherDamage+' HP alla madre)',
   {supportId:e.catalogSupportId,
    damagePerUnit:hasBalancedMother(enemy.ships[0])?null:1,
    motherDamage,supportDamage}));
 }
 events.push(...settleIndependentSupportDamage(b,who));
 return events;
}
