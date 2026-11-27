// Shared approved text metrics: illustration/frame remain unchanged in every language.
import en from './fleetNext/probeHammerTexts.en.json' with {type:'json'};
import it from './fleetNext/probeHammerTexts.it.json' with {type:'json'};
import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
export const CARD_TEXT_REGIONS=[{left:680,top:350,width:1710,height:210},{left:1090,top:2855,width:892,height:140},{left:440,top:3140,width:2195,height:930},{left:1110,top:4180,width:852,height:140}];
const format=(s,c)=>s.replace(/\{(damage|bonus)\}/g,(_,k)=>String(k==='damage'?c.damage:c.bonus));
export function cardWords(c,locale='en'){
 const d=locale==='it'?it:en,s=d[c.kind];
 return {name:s.name,description:format(s.description,c),values:[...s.title,d.weapon,d.rarities[c.rarity],d.element,d.lightning,d.duration,c.duration,d.turn,d.damage,c.damage+' HP',s.rightLabel,...s.rightLines.map(x=>format(x,c)),d.target,s.action]};
}
export function textFields(c,locale='en'){
 const values=cardWords(c,locale).values;
 const layout=[[1536,416,102,''],[1536,502,105,''],[1536,2925,91,''],[1536,4250,91,''],[1045,3202,85,'minor'],[1158,3355,80,'strong'],[2024,3202,88,'minor'],[1930,3355,152,'number'],[2220,3355,104,'strong'],[1042,3547,78,'minor'],[1165,3700,138,'number'],[2056,3547,68,'minor'],[2056,3620,68,'strong'],[2056,3692,68,'strong'],[2056,3764,68,'strong'],[1138,3933,108,'strong'],[2160,3933,95,'strong']];
 const widths=[1690,1690,800,810,900,720,760,180,390,1010,700,1040,1000,1000,1000,620,720];
 return layout.map(([x,y,size,weight],i)=>{const text=String(values[i]),spacing=weight==='minor'?4:1,stroke=weight==='number'?12:weight==='strong'?9:7;
  for(const char of text)if(metrics.advances[char]==null)throw Error('Glifo mancante: '+char);
  const advance=[...text].reduce((n,ch)=>n+metrics.advances[ch],0)/metrics.unitsPerEm;
  return {x,y,size:Math.min(size,(widths[i]-stroke*2-spacing*(text.length-1))/advance),weight,text,maxWidth:widths[i],advance,spacing,stroke};});
}
