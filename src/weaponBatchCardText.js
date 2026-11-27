import metrics from './fleetNext/cardTextFontMetrics.json' with {type:'json'};
import {CARD_TEXT_REGIONS} from './cardTextAssets.js';
export {CARD_TEXT_REGIONS};
import en from './fleetNext/weaponBatchTexts.en.json' with {type:'json'};
import it from './fleetNext/weaponBatchTexts.it.json' with {type:'json'};
const dictionaries={en,it};
export function cardWords(c,locale='en'){
 const row=(dictionaries[locale]||en)[c.id];if(!row)throw Error('Missing approved card text: '+c.id);return row;
}
export function textFields(c,locale='en'){
 const values=cardWords(c,locale).values;
 const layout=[[1536,416,102,''],[1536,502,102,''],[1536,2925,91,''],[1536,4250,91,''],
  [1045,3202,68,'minor'],[1180,3355,83,'strong'],[2024,3202,88,'minor'],[1930,3355,152,'number'],[2220,3355,94,'strong'],
  [1045,3547,76,'minor'],[1188,3650,111,'number'],[1045,3750,62,'strong'],
  [2056,3547,60,'minor'],[2056,3620,60,'strong'],[2056,3692,60,'strong'],[2056,3764,57,'strong'],[1230,3933,82,'strong'],[2235,3933,82,'strong']];
 const widths=[1690,1690,800,810,1040,700,760,180,420,1010,670,1030,1050,1050,1050,1050,630,635];
 return layout.map(([x,y,size,weight],i)=>{
  const text=String(values[i]),spacing=weight==='minor'?3:1,stroke=weight==='number'?10:weight==='strong'?8:7;
  for(const ch of text)if(ch!=='%'&&metrics.advances[ch]==null)throw Error('Missing official font glyph: '+ch);
  const advance=[...text].reduce((n,ch)=>n+(ch==='%'?680:metrics.advances[ch]),0)/metrics.unitsPerEm;
  return {x,y,size:Math.min(size,(widths[i]-stroke*2-spacing*(text.length-1))/advance),weight,text,maxWidth:widths[i],advance,spacing,stroke,mathPrefix:c.kind==='mortar'&&i===11?'plus':null};
 });
}
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function renderField(f,prefix){
 const attrs=`xml:space="preserve" font-size="${f.size.toFixed(3)}" font-weight="${f.weight==='strong'||f.weight==='number'?600:400}" stroke-width="${f.stroke}" letter-spacing="${f.spacing}"`;
 if(f.text.includes('%')){
  const [before,after]=f.text.split('%'),measure=t=>[...t].reduce((n,ch)=>n+metrics.advances[ch],0)/metrics.unitsPerEm*f.size+f.spacing*Math.max(0,t.length-1);
  const total=f.advance*f.size+f.spacing*(f.text.length-1),left=f.x-total/2,x=left+measure(before)+f.spacing,size=f.size,right=x+size*.68+f.spacing;
  const glyph=`<path d="M${x+size*.07} ${f.y+size*.32}L${x+size*.59} ${f.y-size*.32}"/><circle cx="${x+size*.16}" cy="${f.y-size*.22}" r="${size*.085}"/><circle cx="${x+size*.5}" cy="${f.y+size*.22}" r="${size*.085}"/>`;
  return `<text x="${left}" y="${f.y}" text-anchor="start" ${attrs}>${xml(before)}</text><g fill="none" stroke="#121a23" stroke-width="${size*.085}">${glyph}</g><g fill="none" stroke="url(#${prefix}-material)" stroke-width="${size*.045}">${glyph}</g><text x="${right}" y="${f.y}" text-anchor="start" ${attrs}>${xml(after)}</text>`;
 }
 return `${f.mathPrefix?`<path d="M${f.x-(f.advance*f.size+f.spacing*(f.text.length-1))/2-36} ${f.y}h28m-14 -14v28" fill="none" stroke="url(#${prefix}-material)" stroke-width="7"/>`:''}<text x="${f.x}" y="${f.y}" ${attrs}>${xml(f.text)}</text>`;
}
export function cardTextSvg(c,locale='en',unique=null){
 const prefix=unique?'card-text-'+unique.replace(/[^a-zA-Z0-9_-]/g,''):c.id+'-'+locale,prism=c.rarity==='Leggendaria',p=c.rarity==='Rara'?['#fff0d6','#d38c5b','#f3c393']:['#ffffff','#8799a9','#e4edf4'];
 const stops=prism?'<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>':`<stop stop-color="${p[0]}"/><stop offset=".52" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[2]}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="4608" viewBox="0 0 3072 4608"><defs><linearGradient id="${prefix}-material" x1="0" y1="0" x2="${prism?'1':'.35'}" y2="${prism?'0':'1'}">${stops}</linearGradient><filter id="${prefix}-shadow"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter><clipPath id="${prefix}-clip">${CARD_TEXT_REGIONS.map(r=>`<rect x="${r.left}" y="${r.top}" width="${r.width}" height="${r.height}"/>`).join('')}</clipPath></defs><g clip-path="url(#${prefix}-clip)"><g filter="url(#${prefix}-shadow)" fill="url(#${prefix}-material)" stroke="#121a23" paint-order="stroke fill" text-anchor="middle" dominant-baseline="middle" font-family="Eclissi Vettore, sans-serif">${textFields(c,locale).map(f=>renderField(f,prefix)).join('')}</g></g></svg>`;
}
