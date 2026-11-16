import test from 'node:test';
import assert from 'node:assert/strict';
import {projectFleetSlots,fleetEventText,fleetTurnNotice} from './fleetNext/battlePresentation.js';
const trap={id:'test-hidden-trap',source:'fixture',hidden:true,untilPly:null};
const side={defenses:[trap],attackSlots:[null,null,null],defenseSlots:[null,null]};
test('Slot Difesa e Trappola restano presenti anche senza vecchie carte attive',()=>{
 const slots=projectFleetSlots(side,[],'A');
 assert.equal(slots.length,6);assert.equal(slots[0],null);
 assert.equal(slots[2].id,'test-hidden-trap');
});
test('La trappola coperta non comunica identità e provenienza all’avversario',()=>{
 const publicView=projectFleetSlots(side,[],'B');
 assert.deepEqual(publicView[2],{hidden:true,pending:false});
 assert.doesNotMatch(JSON.stringify(publicView),/test-hidden-trap|fixture/);
});
test('La preparazione avversaria è notificata senza rivelarne la carta',()=>{
 const event={kind:'trap-set',who:'B',text:'test-hidden-trap preparata'};
 assert.equal(fleetEventText(event),'L’avversario prepara una trappola coperta.');
 assert.doesNotMatch(fleetTurnNotice([event]),/test-hidden-trap/);
});
