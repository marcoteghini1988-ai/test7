import en from './fleetNext/cardTexts.en.json' with {type:'json'};
import it from './fleetNext/cardTexts.it.json' with {type:'json'};
import {WEAPON_NEAR_FINAL_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {getCardTextLocale,normalizeCardTextLocale} from './cardTextLocale.js';
import {LOCALIZED_WEAPON_CARD_IDS,hasCardTextLayer,cardTextBasePath,CARD_TEXT_REGIONS} from './cardTextAssets.js';
export {LOCALIZED_WEAPON_CARD_IDS,hasCardTextLayer,cardTextBasePath} from './cardTextAssets.js';
import fontMetrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
import {probeHammerVariant} from './probeHammerSpec.js';
import {cardWords,textFields} from './probeHammerCardText.js';
import {commandLanceVariant} from './commandLanceSpec.js';
import {cardWords as lanceWords,textFields as lanceFields} from './commandLanceCardText.js';
import {stormCapacitorVariant} from './stormCapacitorSpec.js';
import {cardWords as stormWords,textFields as stormFields,stormCardTextSvg} from './stormCapacitorCardText.js';
const stormCard=id=>{const v=stormCapacitorVariant(id),p=WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec.weaponProfile;return v&&{...v,duration:p.durationTurns,damage:p.baseDamage,bonus:p.perSupportDamage};};
const dictionaries={en,it};
const probeCard=id=>{const v=probeHammerVariant(id),c=WEAPON_NEAR_FINAL_BY_ID[id],p=c?.effectSpec.weaponProfile;return v&&{...v,duration:p.durationTurns,damage:p.baseDamage,bonus:p.comboBonusDamage||0};};
const lanceCard=id=>{const v=commandLanceVariant(id),p=WEAPON_NEAR_FINAL_BY_ID[id]?.effectSpec.weaponProfile;return v&&{...v,duration:p.durationTurns,damage:p.baseDamage,bonus:p.characterBonusDamage};};
const format=(text,values)=>text.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
export function localizedCardText(definition,locale=getCardTextLocale()){
 if(!definition)return null;
 const dictionary=dictionaries[normalizeCardTextLocale(locale)];
 if(stormCapacitorVariant(definition.id)){const w=stormWords(stormCard(definition.id),normalizeCardTextLocale(locale));return {name:w.name,description:w.description,category:w.values[2],rarity:w.values[3]};}
 if(commandLanceVariant(definition.id)){const w=lanceWords(lanceCard(definition.id),normalizeCardTextLocale(locale));return {name:w.name,description:w.description,category:w.values[2],rarity:w.values[3]};}
 if(probeHammerVariant(definition.id)){const c=probeCard(definition.id),w=cardWords(c,normalizeCardTextLocale(locale));return {name:w.name,description:w.description,category:w.values[2],rarity:w.values[3]};}
 if(hasCardTextLayer(definition.id)){
  const source=WEAPON_NEAR_FINAL_BY_ID[definition.id],p=source.effectSpec.weaponProfile;
  return {name:dictionary.coreName,description:format(dictionary.coreDescription,{stages:p.damageStages.join(' / '),turns:p.durationTurns}),
   category:dictionary.weapon,rarity:dictionary.rarities[source.rarita]};
 }
 if(definition.effectSpec?.type==='energy'){
  const spec=definition.effectSpec,element=dictionary.elements[spec.elementId]||spec.elementId;
  return {name:format(dictionary.energyName,{element}),description:format(dictionary.energyDescription,{element,charges:spec.charges||1,chargeWord:(spec.charges||1)===1?dictionary.charge:dictionary.charges}),
   category:dictionary.energy,rarity:dictionary.rarities[definition.rarita]};
 }
 return null;
}
export const cardTextName=definition=>localizedCardText(definition)?.name||definition?.nome||definition?.name;
export const cardTextDescription=(definition,fallback)=>localizedCardText(definition)?.description||fallback;
export function cardTextFields(id,locale=getCardTextLocale()){
 if(!hasCardTextLayer(id))return null;
 if(stormCapacitorVariant(id))return stormFields(stormCard(id),normalizeCardTextLocale(locale)).map(f=>({...f,size:Number(f.size.toFixed(3))}));
 if(commandLanceVariant(id))return lanceFields(lanceCard(id),normalizeCardTextLocale(locale)).map(f=>({...f,size:Number(f.size.toFixed(3))}));
 if(probeHammerVariant(id))return textFields(probeCard(id),normalizeCardTextLocale(locale)).map(f=>({...f,size:Number(f.size.toFixed(3))}));
 const d=dictionaries[normalizeCardTextLocale(locale)],c=WEAPON_NEAR_FINAL_BY_ID[id],p=c.effectSpec.weaponProfile;
 const values=[...d.coreTitle,d.weapon,d.rarities[c.rarita],d.elementLabel,d.lightning,d.durationLabel,
  p.durationTurns,p.durationTurns===1?d.turn:d.turns,d.damageLabel,p.damageStages.join(' / '),d.rechargeLabel,
  ...d.rechargeLines,d.target,d.action];
 const layout=[[1536,416,102,''],[1536,502,105,''],[1536,2925,91,''],[1536,4250,91,''],
  [1045,3202,85,'minor'],[1158,3355,80,'strong'],[2024,3202,88,'minor'],[1930,3355,152,'number'],
  [2220,3355,104,'strong'],[1042,3547,78,'minor'],[1190,3700,80,'number'],[2056,3547,64,'minor'],
  [2056,3620,64,'strong'],[2056,3692,64,'strong'],[2056,3764,64,'strong'],[1138,3933,108,'strong'],[2160,3933,95,'strong']];
 const widths=[1690,1690,800,810,900,720,760,180,390,1010,650,1040,1000,1000,1000,620,720];
 return layout.map(([x,y,size,weight],i)=>{
  const text=String(values[i]),spacing=weight==='minor'?4:1,stroke=weight==='number'?12:weight==='strong'?9:7;
  const advance=[...text].reduce((n,c)=>n+(fontMetrics.advances[c]??fontMetrics.advances['M']),0)/fontMetrics.unitsPerEm;
  const fitted=Math.min(size,(widths[i]-stroke*2-spacing*Math.max(0,text.length-1))/advance);
  return {x,y,size:Number(fitted.toFixed(3)),weight,text,maxWidth:widths[i]};
 });
}
const colors={Comune:['#e5edf1','#a9b9c4','#d0dce2'],Rara:['#fff0d6','#d38c5b','#f3c393'],Epica:['#ffffff','#8799a9','#e4edf4'],Leggendaria:['#ffffff','#74dafa','#d99ff3']};
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function cardTextSvgContents(id,locale=getCardTextLocale(),unique='card'){
 if(stormCapacitorVariant(id))return stormCardTextSvg(stormCard(id),normalizeCardTextLocale(locale),unique).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 const fields=cardTextFields(id,locale);if(!fields)return '';
 const c=WEAPON_NEAR_FINAL_BY_ID[id],p=colors[c.rarita],prism=c.rarita==='Leggendaria';
 const prefix='card-text-'+unique.replace(/[^a-zA-Z0-9_-]/g,''),gradient=prefix+'-material',shadow=prefix+'-shadow',clip=prefix+'-clip';
 const stops=prism?'<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>':`<stop stop-color="${p[0]}"/><stop offset=".52" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/>`;
 return `<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="${prism?'1':'.35'}" y2="${prism?'0':'1'}">${stops}</linearGradient><filter id="${shadow}"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter><clipPath id="${clip}">${CARD_TEXT_REGIONS.map(r=>`<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}"/>`).join('')}</clipPath></defs>`+
  `<g clip-path="url(#${clip})"><g filter="url(#${shadow})" fill="url(#${gradient})" stroke="#121a23" paint-order="stroke fill" text-anchor="middle" dominant-baseline="middle" font-family="Eclissi Vettore, sans-serif">`+
  fields.map(f=>`<text x="${f.x}" y="${f.y}" font-size="${f.size}" font-weight="${f.weight==='strong'||f.weight==='number'?600:400}" stroke-width="${f.weight==='number'?12:f.weight==='strong'?9:7}" letter-spacing="${f.weight==='minor'?4:1}">${xml(f.text)}</text>`).join('')+'</g></g>';
}
