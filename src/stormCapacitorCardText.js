import en from './fleetNext/stormCapacitorTexts.en.json' with {type:'json'};
import it from './fleetNext/stormCapacitorTexts.it.json' with {type:'json'};
import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
export {CARD_TEXT_REGIONS} from './probeHammerCardText.js';
export function cardWords(c,locale='en'){
 const d=locale==='it'?it:en;
 return {name:d.name,description:d.description.replaceAll('{base}',String(c.damage)).replaceAll('{bonus}',String(c.bonus)),
  values:[...d.title,d.weapon,d.rarities[c.rarity],d.energy,d.cost,d.duration,c.duration,d.turns,
   d.damage,c.damage+' '+d.base,c.bonus+' '+d.support,d.requirement,...d.conditions,d.target,d.shots]};
}
export function textFields(c,locale='en'){
 const values=cardWords(c,locale).values;
 const layout=[[1536,416,102,''],[1536,502,102,''],[1536,2925,91,''],[1536,4250,91,''],
  [1045,3202,68,'minor'],[1180,3355,80,'strong'],[2024,3202,88,'minor'],[1930,3355,152,'number'],[2220,3355,94,'strong'],
  [1045,3547,76,'minor'],[1188,3650,111,'number'],[1045,3750,62,'strong'],[2056,3547,61,'minor'],
  [2056,3620,62,'strong'],[2056,3692,62,'strong'],[2056,3764,57,'strong'],[1138,3933,100,'strong'],[2160,3933,87,'strong']];
 const widths=[1690,1690,800,810,1040,700,760,180,420,1010,670,1030,1050,1050,1050,1050,700,750];
 return layout.map(([x,y,size,weight],i)=>{
  const text=String(values[i]),spacing=weight==='minor'?3:1,stroke=weight==='number'?10:weight==='strong'?8:7;
  for(const ch of text)if(metrics.advances[ch]==null)throw Error('Missing font glyph: '+ch);
  const advance=[...text].reduce((n,ch)=>n+metrics.advances[ch],0)/metrics.unitsPerEm;
  return {x,y,size:Math.min(size,(widths[i]-stroke*2-spacing*(text.length-1))/advance),weight,text,maxWidth:widths[i],advance,spacing,stroke,mathPrefix:i===11?'plus':null};
 });
}
