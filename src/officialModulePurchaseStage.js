// Guardiano condiviso dell'ordine degli acquisti Moduli.
// Non definisce prezzi, valuta o progresso: quelli restano nel Bazar.
// Evita acquisti duplicati e potenziamenti che saltano lo sblocco reale.
export function officialModulePurchaseStage(owned,action,maxLevel=9){
 if(action!=='unlock'&&action!=='upgrade')return 'invalid_action';
 if(!Number.isInteger(maxLevel)||maxLevel<1||maxLevel>9)return 'invalid_max_level';
 if(action==='unlock')return owned?.unlocked===true?'already_owned':'ok';
 if(owned?.unlocked!==true)return 'not_owned';
 if(!Number.isInteger(owned.level)||owned.level<1||owned.level>maxLevel)
  return 'invalid_level';
 if(owned.level>=maxLevel)return 'max_level';
 return 'ok';
}
