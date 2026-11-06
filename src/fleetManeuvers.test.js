import test from 'node:test';
import assert from 'node:assert/strict';
import {MANEUVER_RULES,newManeuverState,recordManeuverEvent,changeFormation,startFusion,
 advanceManeuvers,cancelFusion,maneuverStatus,prepareSideForAmmoRouting,
 mergeRoutedEscorts,adjustOutgoingVolley,interceptManeuverVolley} from './fleetManeuvers.js';
const escort=(slot,hp=40)=>({id:'N00:e:'+slot,slot,weapon:{interceptShare:.20},
 defense:{kind:'escort',destroyed:false,shield:{hp,max:60}}});
function side({shieldA=40,shieldB=50,engine=20,command=20}={}){
 return {fleet:[{id:'N00',defense:{kind:'mother',shield:{hp:100,max:100},
 parts:{engine:{hp:engine},weapons:{hp:20},shieldGenerator:{hp:20},command:{hp:command}}}}],
 escorts:[escort(0,shieldA),escort(1,shieldB)]};
}
const charged=()=>({...newManeuverState(),sync:100});
test('defaults, sync cap and replay protection',()=>{
 const original=newManeuverState();assert.equal(original.formation,'balanced');
 let n=original;
 for(let i=0;i<10;i++)n=recordManeuverEvent(n,{id:'c'+i,type:'valid_calculation'}).state;
 assert.equal(n.sync,100);
 assert.equal(recordManeuverEvent(n,{id:'c0',type:'valid_calculation'}).credited,0);
 assert.equal(recordManeuverEvent(n,{id:'bad',type:'escort_interception',amount:0}).credited,0);
});
test('formation cooldown and command system',()=>{
 const a=changeFormation(newManeuverState(),side(),'guard',500);
 assert.equal(a.changed,true);
 assert.equal(changeFormation(a.state,side(),'assault',2500).changed,false);
 assert.equal(changeFormation(a.state,side(),'assault',10500).changed,true);
 assert.equal(changeFormation(newManeuverState(),side({command:0}),'guard',100).reason,'command_offline');
});
test('fusion requires sync and live escort plus mother systems',()=>{
 assert.equal(startFusion(newManeuverState(),side(),0,'barrier',0).reason,'not_enough_sync');
 assert.equal(startFusion(charged(),side({engine:0}),0,'barrier',0).reason,'mother_not_ready');
 assert.equal(startFusion(charged(),side({shieldA:0}),0,'barrier',0).reason,'escort_unavailable');
});
test('fusion lasts 12 seconds and starts cooldown after end',()=>{
 const start=startFusion(charged(),side(),0,'barrier',1000);
 assert.equal(start.started,true);assert.equal(start.state.sync,0);
 assert.equal(start.state.fusion.endsAt,1000+MANEUVER_RULES.fusionDurationMs);
 assert.equal(advanceManeuvers(start.state,side(),12999).fusion.mode,'barrier');
 const ended=advanceManeuvers(start.state,side(),13000);
 assert.equal(ended.fusion,null);
 assert.equal(startFusion(charged(),side(),0,'barrier',13001).started,true);
 assert.equal(startFusion({...ended,sync:100},side(),0,'barrier',13001).reason,'fusion_cooldown');
});
test('interrupted fusion is not free',()=>{
 const a=startFusion(charged(),side(),1,'strike',200).state;
 assert.equal(advanceManeuvers(a,side({shieldB:0}),500).fusion,null);
 const detached=cancelFusion(a,side(),600);
 assert.equal(detached.cancelled,true);
 assert.equal(startFusion({...detached.state,sync:100},side(),0,'barrier',1000).started,false);
});
test('docked escort does not receive routed ammunition',()=>{
 const s=side();s.maneuvers=startFusion(charged(),s,0,'strike',1).state;
 const routed=prepareSideForAmmoRouting(s,1000);
 assert.equal(routed.side.escorts.length,1);
 assert.equal(routed.side.escorts[0].slot,1);
 const rebuilt=mergeRoutedEscorts(s,[{...s.escorts[1],weapon:{charge:9}}]);
 assert.equal(rebuilt.length,2);assert.equal(rebuilt[1].weapon.charge,9);
 assert.equal(rebuilt[0],s.escorts[0]);
});
test('guard versus assault damages are conditional and rounded',()=>{
 const base={shots:[{damage:21,bullets:3,escortSlot:0},{damage:40,bullets:2}],totalDamage:61};
 const g=side();g.maneuvers={...newManeuverState(),formation:'guard'};
 assert.equal(adjustOutgoingVolley(base,g,0).shots[0].damage,17);
 const a=side();a.maneuvers={...newManeuverState(),formation:'assault'};
 assert.equal(adjustOutgoingVolley(base,a,0).shots[0].damage,23);
 const fused=side();fused.maneuvers=startFusion(charged(),fused,0,'strike',0).state;
 const fired=adjustOutgoingVolley(base,fused,1,{targetKind:'motherShield'});
 assert.equal(fired.shots[0].damage,0);
 assert.equal(fired.shots[1].damage,50);
 assert.equal(adjustOutgoingVolley(base,fused,1,{targetKind:'motherVital'}).shots[1].damage,40);
});
test('barrier consumes real shield, not invulnerable virtual HP',()=>{
 const s=side({shieldA:23,shieldB:20});s.maneuvers=startFusion(charged(),s,0,'barrier',1).state;
 const r=interceptManeuverVolley(s,100,1000,()=>.20);
 assert.equal(r.intercepted,43);
 assert.equal(r.escorts[0].defense.shield.hp,0);
 assert.equal(r.escorts[1].defense.shield.hp,0);
 assert.equal(r.remaining,57);
});
test('no defense when command destroyed',()=>{
 const s=side({command:0});s.maneuvers=newManeuverState();
 const r=interceptManeuverVolley(s,60,1000,()=>.2);
 assert.equal(r.intercepted,0);assert.equal(r.remaining,60);
});
test('status exposes remaining cooldown without changing shield',()=>{
 const s=side(),st=startFusion(charged(),s,1,'barrier',0).state;
 assert.equal(maneuverStatus(st,s,3000).fusionRemainingMs,9000);
 assert.equal(s.escorts[1].defense.shield.hp,50);
});
