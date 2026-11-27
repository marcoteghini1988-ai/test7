import en from './fleetNext/stormCapacitorTexts.en.json' with {type:'json'};
import it from './fleetNext/stormCapacitorTexts.it.json' with {type:'json'};
import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
import {CARD_TEXT_REGIONS} from './cardTextAssets.js';
export {CARD_TEXT_REGIONS} from './cardTextAssets.js';
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

const colors={Comune:['#e5edf1','#a9b9c4','#d0dce2'],Rara:['#fff0d6','#d38c5b','#f3c393'],Epica:['#ffffff','#8799a9','#e4edf4'],Leggendaria:['#ffffff','#74dafa','#d99ff3']};
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function stormCardTextSvg(c,locale='en',unique='card'){
 const p=colors[c.rarity],prefix='card-text-'+unique.replace(/[^a-zA-Z0-9_-]/g,''),prism=c.rarity==='Leggendaria';
 const stops=prism?'<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>':`<stop stop-color="${p[0]}"/><stop offset=".52" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="4608" viewBox="0 0 3072 4608"><defs><linearGradient id="${prefix}-material" x1="0" y1="0" x2="${prism?'1':'.35'}" y2="${prism?'0':'1'}">${stops}</linearGradient><filter id="${prefix}-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter><clipPath id="${prefix}-clip">${CARD_TEXT_REGIONS.map(r=>`<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}"/>`).join('')}</clipPath></defs><g clip-path="url(#${prefix}-clip)"><g filter="url(#${prefix}-shadow)" fill="url(#${prefix}-material)" stroke="#121a23" paint-order="stroke fill" text-anchor="middle" dominant-baseline="middle" font-family="Eclissi Vettore, sans-serif">${textFields(c,locale).map(f=>`${f.mathPrefix?`<path d="M${f.x-(f.advance*f.size+f.spacing*(f.text.length-1))/2-36} ${f.y}h28m-14 -14v28" fill="none" stroke="url(#${prefix}-material)" stroke-width="7"/>`:''}<text x="${f.x}" y="${f.y}" font-size="${f.size.toFixed(3)}" font-weight="${f.weight==='strong'||f.weight==='number'?600:400}" stroke-width="${f.stroke}" letter-spacing="${f.spacing}">${xml(f.text)}</text>`).join('')}</g></g></svg>`;
}
