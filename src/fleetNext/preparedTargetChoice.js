// Scelta di fine turno solo fra le navicelle di supporto ancora operative.
export function choosableSupportTargets(protectors=[]){
 return protectors.filter(t=>t?.kind==='escort'&&t.hp>0)
  .sort((a,b)=>a.slot-b.slot);
}
export function shouldChooseSupportTarget(protectors=[],{bypass=false,skipShot=false}={}){
 return !bypass&&!skipShot&&choosableSupportTargets(protectors).length>1;
}
