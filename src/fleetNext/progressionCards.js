// Carte necessarie alle regole di progressione. I fronti approvati del catalogo
// restano indipendenti: queste carte usano il renderer testuale della plancia.
import {describeEffect} from './simpleEffects.js';

const general=(id,nome,categoria,sottotipo,effectSpec,controgioco)=>{
 const card={id,nome,name:nome,rarita:'Comune',categoria,sottotipo,
  kind:categoria==='Attacco'?'attack':'support',famiglia:'flotta',
  migliorabile:false,effectSpec:Object.freeze(effectSpec),controgioco,
  nativeFace:true};
 return Object.freeze({...card,effetto:describeEffect(card)});
};
const fusion=(shipId,shipName,minShipLevelDraft,maxCopiesInAutoPackageDraft)=>{
 const name='Fusione — '+shipName;
 const card={id:'prog-fusion-'+shipId.toLowerCase(),shipId,shipName,name,nome:name,
  rarityDraft:'Leggendaria',category:'Fusione',kind:'support',nativeFace:true,
  minShipLevelDraft,requiredOwnParts:Object.freeze(['command']),requiredEscortCount:0,
  maxCopiesInAutoPackageDraft,effectSpec:Object.freeze({type:'fusion'}),
  counterplay:'Distruggi o disattiva un supporto necessario prima della fusione.'};
 return Object.freeze({...card,effectProposed:describeEffect(card)});
};

export const PROGRESSION_CARDS=Object.freeze(Object.fromEntries([
 general('prog-bypass','Attacco diretto','Attacco','Attacco',
  {type:'bypass'},'Difese e Trappole continuano a funzionare.'),
 fusion('L01','Eclisse Reale',5,1),
 fusion('L03','Titano Ossidiana',3,1),
 fusion('L04','Arca Astrale',1,2)
].map(card=>[card.id,card])));

export const PROGRESSION_GENERAL_CARDS=Object.freeze(Object.fromEntries(
 Object.entries(PROGRESSION_CARDS).filter(([,card])=>!card.shipId)
));
export const PROGRESSION_CARD_IDS=Object.freeze(Object.keys(PROGRESSION_CARDS));
export const isProgressionCard=id=>Object.hasOwn(PROGRESSION_CARDS,id);
