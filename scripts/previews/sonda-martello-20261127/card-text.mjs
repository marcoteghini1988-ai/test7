import en from './texts.en.json' with {type:'json'};
import it from './texts.it.json' with {type:'json'};
import metrics from '../../../src/fleetNext/cardTextFontMetrics.json' with {type:'json'};
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
const colors={Comune:['#e5edf1','#a9b9c4','#d0dce2'],Rara:['#fff0d6','#d38c5b','#f3c393'],Epica:['#ffffff','#8799a9','#e4edf4'],Leggendaria:['#ffffff','#74dafa','#d99ff3']};
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function cardTextSvg(c,locale='en'){
 const p=colors[c.rarity],prefix=c.id.replace(/[^a-z0-9-]/g,'')+'-'+locale,prism=c.rarity==='Leggendaria';
 const stops=prism?'<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>':`<stop stop-color="${p[0]}"/><stop offset=".52" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="4608" viewBox="0 0 3072 4608"><defs><linearGradient id="${prefix}-material" x1="0" y1="0" x2="${prism?'1':'.35'}" y2="${prism?'0':'1'}">${stops}</linearGradient><filter id="${prefix}-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter><clipPath id="${prefix}-clip">${CARD_TEXT_REGIONS.map(r=>`<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}"/>`).join('')}</clipPath></defs><g clip-path="url(#${prefix}-clip)"><g filter="url(#${prefix}-shadow)" fill="url(#${prefix}-material)" stroke="#121a23" paint-order="stroke fill" text-anchor="middle" dominant-baseline="middle" font-family="Eclissi Vettore, sans-serif">${textFields(c,locale).map(f=>`<text x="${f.x}" y="${f.y}" font-size="${f.size.toFixed(3)}" font-weight="${f.weight==='strong'||f.weight==='number'?600:400}" stroke-width="${f.stroke}" letter-spacing="${f.spacing}">${xml(f.text)}</text>`).join('')}</g></g></svg>`;
}
