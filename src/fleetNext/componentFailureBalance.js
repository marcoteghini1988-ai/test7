// Regole CONFERMATE per i componenti quando scade il loro timer.
// I secondi dei timer sono ancora in fase di bilanciamento; questo modulo
// descrive gli effetti, non introduce un timer fittizio o un'altra plancia.
export const COMPONENT_FAILURE_BALANCE=Object.freeze({
 weapons:Object.freeze({weaponPowerPercent:70,attackCardSlots:2}),
 command:Object.freeze({interceptPercent:75,motherLeakPercent:25}),
 bridge:Object.freeze({manualEscortTarget:false,characterSlotEnabled:false})
});
export const componentTimerExpired=(side,id)=>{
 const state=side?.componentTimers?.[id];
 return state===true||state?.expired===true||
  !!state?.running&&Number.isFinite(state.remainingSeconds)&&state.remainingSeconds<=0;
};
export const attackCardCapacity=side=>componentTimerExpired(side,'weapons')?
 COMPONENT_FAILURE_BALANCE.weapons.attackCardSlots:3;
export const arsenalEffectiveDamage=(side,nominal)=>componentTimerExpired(side,'weapons')?
 Math.max(0,Math.round(Math.max(0,Number(nominal)||0)*.70)):nominal;
export const centralinaMinimumLeak=side=>componentTimerExpired(side,'command')?
 COMPONENT_FAILURE_BALANCE.command.motherLeakPercent:0;
export const characterSlotEnabled=side=>!componentTimerExpired(side,'bridge');

// Quando la Plancia e' fuori uso non si sceglie liberamente quale supporto
// avversario colpire per primo. I colpi con aggiramento/bersaglio obbligato
// rimangono regolati dalle rispettive Carte Arma e non sono riscritti qui.
export function planciaRestrictedTargetOrder(side,foe,order={}){
 if(!componentTimerExpired(side,'bridge'))return order;
 if(order.targetKind!=='escort'&&order.escortSlot==null)return order;
 const first=[...(foe?.escorts||[])].filter(e=>e.hp>0&&!e.destroyed&&!e.reserve)
  .sort((a,b)=>(a.slot||0)-(b.slot||0))[0];
 if(!first)return order;
 return {...order,targetKind:'escort',targetId:first.id,escortSlot:first.slot};
}
