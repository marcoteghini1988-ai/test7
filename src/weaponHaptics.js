// I browser non confermano la presenza di un motore aptico: true = richiesta
// accettata, mai prova di una vibrazione fisica. Preferenza separata dai suoni.
export const HAPTICS_KEY='eclissi_haptics_enabled';
export function weaponHapticPattern(kind,phase,tier=2){
 if(kind==='magnetic-grapple')return phase==='charge'?[10,45,10]:
  phase==='fire'?[14]:phase==='impact'?tier===3?[24,28,16,28,10]:tier===2?[22,30,14]:[22]:[];
 if(kind==='alloy-collision')return phase==='charge'?[12,65,12]:
  phase==='fire'?[16,70,20,70,24]:phase==='impact'?tier===3?[120,35,45,40,20]:[95,35,32]:phase==='release'?[12]:[];
 if(kind==='induction')return phase==='charge'?tier===3?[8,35,8,35,8,35,12]:[8,45,8,45,8]:
  phase==='fire'?[18]:phase==='impact'?tier===3?[36,25,14,25,8]:[32,30,12]:phase==='defense'?[12,25,18]:phase==='block'?[10]:[];
 if(kind==='cascade-piercer')return phase==='charge'?[8,50,10,45,12]:
  phase==='fire'?[22]:phase==='transfer'?[12,25,9]:phase==='impact'?tier===3?[34,25,12,25,8]:[32,25,12]:[];
 if(kind==='wandering-shrapnel')return phase==='charge'?tier>=2?[8,60,10]:[8]:
  phase==='fire'?[18]:phase==='impact'?tier===3?[32,25,14,25,8]:tier===2?[28,30,10]:[27]:[];
 return [];
}
export function hapticsEnabled(storage=globalThis.localStorage){
 try{return storage?.getItem(HAPTICS_KEY)!=='false';}catch{return true;}
}
export function cancelWeaponHaptics(nav=globalThis.navigator){
 try{nav?.vibrate?.(0);}catch{/* Nessuna conseguenza sul combattimento. */}
}
export function setHapticsEnabled(enabled){
 try{globalThis.localStorage?.setItem(HAPTICS_KEY,String(!!enabled));}catch{/* Sessione privata. */}
 if(!enabled)cancelWeaponHaptics();return !!enabled;
}
export function requestWeaponHaptic(kind,phase,tier,{nav=globalThis.navigator,
 doc=globalThis.document,storage=globalThis.localStorage}={}){
 const pattern=weaponHapticPattern(kind,phase,tier);
 const result=status=>({status,pattern,physicalVerified:false});
 if(!pattern.length)return result('none');
 if(!hapticsEnabled(storage))return result('muted');
 if(doc?.visibilityState!=='visible')return result('hidden');
 if(typeof nav?.vibrate!=='function')return result('unsupported');
 if(nav.userActivation&&nav.userActivation.hasBeenActive===false)return result('needs-activation');
 try{return result(nav.vibrate(pattern)?'requested':'rejected');}
 catch{return result('unsupported');}
}
