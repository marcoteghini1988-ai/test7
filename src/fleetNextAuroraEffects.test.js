import test from 'node:test';
import assert from 'node:assert/strict';
import {card,exclusiveUnlocked,effectiveDeck} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,availableFleetTargets,
 effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule} from './fleetNext/auroraEngine.js';

const make=(options={})=>{
 const b=createFleetNextBattle({shipA:'N00',shipB:'N00',levelA:5,levelB:5,
  deckA:[],deckB:[],mode:'pvp',seed:1988,...options});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];side.discard=[];}
 return b;
};
function play(b,who,selected=[],order={}){
 b.turn=who;b.sides[who].hand=[...selected];
 const result=resolveFleetNextTurn(b,who,
  {cards:selected.map((_,i)=>i),targetKind:'part',targetId:'weapons',partId:'weapons',
   pass:true,...order},b.ply*30000+1000);
 assert.equal(result.ok,true,result.reason);
 return result;
}
const mother=(side,id='weapons')=>side.ships[0].parts.find(p=>p.id===id);
const install=(side,id,part='generator')=>{
 const r=mountModule(side,card(id),part);assert.equal(r.ok,true,r.reason);return r.entry;
};

test('Aurora: dieci esclusive personali, sei disponibili al livello uno e zero esclusive altrui',()=>{
 const defs=['nx-n00-01','nx-n00-02','nx-n00-03','nx-n00-04','nx-n00-05',
  'ex-n00-01','nx-n00-07','nx-n00-08','nx-n00-09','nx-n00-10'];
 assert.equal(new Set(defs).size,10);
 for(const id of defs){assert.equal(card(id).shipId,'N00');assert.notEqual(card(id).playable,false);}
 assert.equal(defs.filter(id=>exclusiveUnlocked(id,'N00',1)).length,6);
 assert.ok(defs.every(id=>exclusiveUnlocked(id,'N00',5)));
 assert.ok(defs.every(id=>!exclusiveUnlocked(id,'C01',5)));
 const ids=effectiveDeck([], 'N00',5);
 assert.equal(defs.filter(id=>ids.includes(id)).length,10);
});
test('Montaggio: l’arma resta sul campo, ha due integrità e la carta non va negli scarti',()=>{
 const b=make(),r=play(b,'A',['nx-n00-07']);
 const module=r.battle.sides.A.modules.weapon;
 assert.equal(module.cardId,'nx-n00-07');assert.equal(module.hp,2);
 assert.equal(r.battle.sides.A.discard.includes('nx-n00-07'),false);
});
test('Ottica: il giocatore può invertire le prime due carte al primo montaggio',()=>{
 const b=make();b.sides.A.deck=['gen-216','gen-217','gen-218'];
 const r=play(b,'A',['nx-n00-01'],{deckTopFlip:true}),side=r.battle.sides.A;
 assert.equal(side.modules.utility.cardId,'nx-n00-01');
 assert.equal(side.hand[0],'gen-217');
 assert.equal(side.hand[1],'gen-216');
});
test('Raffica: due colpi leggeri separati, nessun tiro base aggiunto',()=>{
 const b=make({shipB:'C03',levelB:1}),unit=b.sides.B.escorts[0];
 unit.hp=2;const other=b.sides.B.escorts[1].hp;
 const r=play(b,'A',['nx-n00-02'],{targetKind:'escort',targetId:unit.id,escortSlot:unit.slot,pass:false});
 assert.equal(r.battle.sides.B.escorts[0].hp,0);
 assert.equal(r.battle.sides.B.escorts[1].hp,other);
 assert.equal(r.shot.escortDamage,2);
});
test('Tiro di smontaggio: due danni a un modulo, senza distruggere un vitale',()=>{
 const b=make(),mod=install(b.sides.B,'nx-n00-08');
 const initial=mother(b.sides.B).hp;
 const r=play(b,'A',['nx-n00-03'],{targetKind:'module',targetId:mod.id,moduleSlot:mod.slot,pass:false});
 assert.equal(r.shot.moduleDamage,2);
 assert.equal(r.battle.sides.B.modules.utility,null);
 assert.equal(mother(r.battle.sides.B).hp,initial);
});
test('Un colpo base può bersagliare e danneggiare un modulo raggiungibile',()=>{
 const b=make(),mod=install(b.sides.B,'nx-n00-01');
 assert.ok(availableFleetTargets(b.sides.B).some(t=>t.kind==='module'&&t.id===mod.id));
 const r=play(b,'A',[],{targetKind:'module',targetId:mod.id,moduleSlot:mod.slot,pass:false});
 assert.equal(r.shot.moduleDamage,1);
 assert.equal(r.battle.sides.B.modules.utility.hp,1);
});
test('Corazza modulare: assorbe il colpo contro il vitale associato e viene distrutta',()=>{
 const b=make();install(b.sides.B,'nx-n00-08','generator');
 const hp=mother(b.sides.B,'generator').hp;
 const r=play(b,'A',[],{targetKind:'part',targetId:'generator',partId:'generator',pass:false});
 assert.equal(mother(r.battle.sides.B,'generator').hp,hp);
 assert.equal(r.battle.sides.B.modules.utility,null);
});
test('Velo di salvataggio: il prossimo colpo distrugge un modulo al posto del Generatore',()=>{
 const b=make();install(b.sides.B,'nx-n00-01');
 const played=play(b,'B',['nx-n00-04'],{ownPartId:'generator'});
 assert.ok(played.battle.sides.B.auroraVeil);
 const hp=mother(played.battle.sides.B,'generator').hp;
 const attack=play(played.battle,'A',[],{targetKind:'part',targetId:'generator',partId:'generator',pass:false});
 assert.equal(mother(attack.battle.sides.B,'generator').hp,hp);
 assert.equal(attack.battle.sides.B.modules.utility,null);
 assert.equal(attack.battle.sides.B.auroraVeil,null);
});
test('Cartografo: guarda quattro carte e prende il modulo scelto, solo all’ingresso',()=>{
 const b=make();b.sides.A.deck=['gen-216','nx-n00-07','gen-217','nx-n00-08','gen-218'];
 const r=play(b,'A',['ex-n00-01'],{cartographerPickId:'nx-n00-08'}),side=r.battle.sides.A;
 assert.ok(side.hand.includes('nx-n00-08'));
 assert.equal(side.commander.repeatsRemaining,0);
});
test('Adattamento: scarta dal ciclo una esclusiva e seleziona una fra tre carte',()=>{
 const b=make();b.sides.A.hand=['nx-n00-05','nx-n00-07'];
 b.sides.A.deck=['gen-216','gen-217','gen-218','gen-226'];
 const result=resolveFleetNextTurn(b,'A',
  {cards:[0],pass:true,exchangeCardId:'nx-n00-07',peekPickId:'gen-217'},1000);
 assert.equal(result.ok,true,result.reason);
 assert.ok(result.battle.sides.A.hand.includes('gen-217'));
 assert.ok(result.battle.sides.A.deck.concat(result.battle.sides.A.hand).includes('nx-n00-07'));
});
test('Riconfigurazione sostituisce il modulo con un altro dello stesso alloggiamento',()=>{
 const b=make();install(b.sides.A,'nx-n00-07');
 b.sides.A.deck=['nx-n00-09'];
 const r=play(b,'A',['nx-n00-10'],{reconfigureSlot:'weapon',reconfigureCardId:'nx-n00-09'});
 assert.equal(r.battle.sides.A.modules.weapon.cardId,'nx-n00-09');
 assert.equal(r.battle.sides.A.modules.weapon.hp,2);
});
test('Cannone biforcato: un tiro base diventa due colpi leggeri su unità differenti',()=>{
 const b=make({shipB:'C03',levelB:1});
 install(b.sides.A,'nx-n00-09');const units=b.sides.B.escorts;
 const before=units.map(e=>e.hp);
 const r=play(b,'A',[],{pass:false,targetKind:'escort',targetId:units[0].id,escortSlot:units[0].slot,
  secondaryTargetKind:'escort',secondaryTargetId:units[1].id});
 assert.equal(r.shot.escortDamage,2);
 assert.equal(r.battle.sides.B.escorts[0].hp,before[0]-1);
 assert.equal(r.battle.sides.B.escorts[1].hp,before[1]-1);
});
test('Canna perforante supera una sola protezione, senza concedere Aggiramento',()=>{
 const b=make(),enemy=b.sides.B;install(b.sides.A,'nx-n00-07');
 const hp=mother(enemy).hp;
 enemy.defenses=[{id:'gen-227',source:'scudo-prova',untilPly:10}];
 enemy.protections=[{id:'gen-227',source:'scudo-prova',kind:'protect',
  target:'part',partId:'weapons',remaining:1,untilPly:10}];
 const r=play(b,'A',[],{targetKind:'part',targetId:'weapons',pass:false});
 assert.equal(mother(r.battle.sides.B).hp,hp-1);
 assert.equal(r.battle.sides.A.modules.weapon.activatedPly,0);
 assert.equal(r.battle.sides.B.protections.length,0);
});
test('Adattamento non consuma carte se tutte le altre esclusive sono già in gioco',()=>{
 const b=make();b.sides.A.hand=['nx-n00-05','nx-n00-07'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/Adattamento/);
 assert.equal(JSON.stringify(b),before);
});
test('Tutte le esclusive sono eseguibili, ma restano vincolate alla propria nave',()=>{
 const b=make({shipA:'N00'});
 const def=card('nx-l04-02');
 assert.notEqual(def.playable,false);
 assert.match(effectUnavailableReason(def,b.sides.A,b),/solo con Arca Astrale/);
});
