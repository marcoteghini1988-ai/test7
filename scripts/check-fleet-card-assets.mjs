// Fonte verificabile dei progressi grafici: nessuno stato basato sulle chat.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const cards=[
 ...JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogGeneral.json'),'utf8')).carte,
 ...JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogExclusive.json'),'utf8')).cards
];
const faces=resolve(ROOT,'public/assets/fleet-next-cards');
const illustrations=resolve(ROOT,'public/assets/fleet-card-illustrations');
const fail=m=>{throw new Error('[CARTE] '+m)};
function kind(c){
 const cat=c.categoria||c.category||'',sub=c.sottotipo||'';
 return sub==='Terreno'?'terrain':sub==='Personaggio'||/Personaggio/i.test(cat)?'character':
  sub==='Difesa'||/Difesa/i.test(cat)?'defense':
  cat==='Attacco'||/Combo|Fusione/i.test(cat)?'attack':
  /Controllo/i.test(cat)?'control':
  /Supporto|Scudiera|Tattica|Strategia/i.test(cat)?'support':'attack';
}
const src=new Set(cards.map(c=>c.id));
if(cards.length!==379||src.size!==379)fail('Catalogo fuori sincronizzazione');
const faceIds=readdirSync(faces).filter(x=>x.endsWith('.svg')).map(x=>x.slice(0,-4));
if(faceIds.length!==379||faceIds.some(x=>!src.has(x)))fail('Fronte SVG extra o mancante');
const assets=readdirSync(illustrations).filter(x=>x.endsWith('.webp'));
const perFunction={},hdIds=[],missing=[];
for(const c of cards){
 const id=c.id,svg=readFileSync(resolve(faces,id+'.svg'),'utf8'),type=kind(c);
 if(!svg.includes('width="512" height="768"')||!svg.includes('viewBox="0 0 512 768"'))fail('Formato non 2:3 '+id);
 if(svg.includes('ECLISSI STELLARE'))fail('Marchio non consentito sulla carta '+id);
 const file=resolve(illustrations,id+'.webp'),hd=existsSync(file);
 const role=perFunction[type]??{total:0,hd:0,pending:0};
 role.total++;
 if(hd){
  const m=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  if(!svg.includes('data-hd-art="'+id+'"')||!m)fail('Immagine HD non incorporata '+id);
  if(!Buffer.from(m[1],'base64').equals(readFileSync(file)))fail('WebP/SVG non sincronizzati '+id);
  hdIds.push(id);role.hd++;
 }else{
  if(svg.includes('data-hd-art="'+id+'"'))fail('Fronte HD senza sorgente '+id);
  missing.push({id,name:c.nome||c.name,rarity:c.rarita||c.rarityDraft,kind:type});
  role.pending++;
 }
 perFunction[type]=role;
}
if(assets.some(f=>!src.has(f.slice(0,-5))))fail('WebP orfana');
if(hdIds.length!==assets.length)fail('Conteggio HD divergente');
const state={total:cards.length,hd:hdIds.length,pending:missing.length,perFunction,
 next:missing.slice(0,15),updatedFrom:'repository'};
if(process.argv.includes('--json'))console.log(JSON.stringify(state,null,2));
else console.log('CARTE: '+state.hd+'/'+state.total+' HD, '+state.pending+' ancora vettoriali; '+Object.entries(perFunction).map(([k,v])=>k+':'+v.hd+'/'+v.total).join(' | '));
