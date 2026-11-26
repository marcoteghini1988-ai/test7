// Quattro carte STRATEGIA Smontaggio Forzato, senza asset grafici.
 // La rarità governa numero di componenti e durata in turni avversari.
 const variants=[
  ['c','Comune',1,1,'Smonta temporaneamente 1 componente aggiunto o potenziato della nave avversaria per 1 turno avversario.'],
  ['r','Rara',1,2,'Smonta temporaneamente 1 componente aggiunto o potenziato della nave avversaria per 2 turni avversari.'],
  ['e','Epica',2,2,'Smonta fino a 2 componenti aggiunti o potenziati della nave avversaria per 2 turni avversari.'],
  ['l','Leggendaria',99,2,'Riporta la navicella avversaria alla configurazione operativa iniziale di livello 1 per 2 turni avversari. I componenti e i potenziamenti aggiunti tornano alla scadenza.']
 ];
 export const DISMANTLE_CARDS=Object.freeze(variants.map(([code,rarita,count,turns,description])=>{
  const id='atk-dismantle-'+code;
  return Object.freeze({id,designId:'design-attack-dismantle-'+code,name:'Smontaggio Forzato',
   nome:'Smontaggio Forzato',category:'Strategia',categoria:'Strategia',
   sottotipo:'Smontaggio temporaneo',rarita,kind:'attack',playable:true,
   nativeFace:true, effectProposed:description,
   effectSpec:Object.freeze({type:'dismantle',count,turns,mode:code==='l'?'base':'components'})});
 }));
 export const DISMANTLE_BY_ID=Object.freeze(Object.fromEntries(DISMANTLE_CARDS.map(c=>[c.id,c])));
 export const dismantleCard=id=>DISMANTLE_BY_ID[id]||null;
