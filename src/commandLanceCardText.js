import en from './fleetNext/commandLanceTexts.en.json' with {type:'json'};
import it from './fleetNext/commandLanceTexts.it.json' with {type:'json'};
import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
export {CARD_TEXT_REGIONS} from './probeHammerCardText.js';
export function cardWords(c,locale='en'){
 const d=locale==='it'?it:en;
 return {name:d.name,description:d.description.replace('{damage}',String(c.damage+c.bonus)),
  values:[...d.title,d.weapon,d.rarities[c.rarity],d.element,d.lightning,d.duration,c.duration,d.turn,
   d.damage,(c.damage+c.bonus)+' HP',d.requires,...d.requirement,d.target,d.shots]};
}
export function textFields(c,locale='en'){
 const values=cardWords(c,locale).values;
 const layout=[[1536,416,102,''],[1536,502,105,''],[1536,2925,91,''],[1536,4250,91,''],[1045,3202,85,'minor'],[1158,3355,80,'strong'],[2024,3202,88,'minor'],[1930,3355,152,'number'],[2220,3355,104,'strong'],[1042,3547,78,'minor'],[1165,3700,138,'number'],[2056,3547,68,'minor'],[2056,3620,68,'strong'],[2056,3692,68,'strong'],[2056,3764,68,'strong'],[1138,3933,108,'strong'],[2160,3933,95,'strong']];
 const widths=[1690,1690,800,810,900,720,760,180,390,1010,700,1040,1000,1000,1000,620,720];
 return layout.map(([x,y,size,weight],i)=>{
  const text=String(values[i]),spacing=weight==='minor'?4:1,stroke=weight==='number'?12:weight==='strong'?9:7;
  for(const char of text)if(metrics.advances[char]==null)throw Error('Missing font glyph: '+char);
  const advance=[...text].reduce((n,ch)=>n+metrics.advances[ch],0)/metrics.unitsPerEm;
  return {x,y,size:Math.min(size,(widths[i]-stroke*2-spacing*(text.length-1))/advance),weight,text,maxWidth:widths[i],advance,spacing,stroke};
 });
}
