// Fonte verificabile dei progressi grafici: nessuno stato basato sulle chat.
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {describeEffect,SIMPLE_RULES_REVISION} from '../src/fleetNext/simpleEffects.js';
import {BOSS_CARDS} from '../src/fleetNext/bossCards.js';
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const cards=[
 ...JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogGeneral.json'),'utf8')).carte,
 ...JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogExclusive.json'),'utf8')).cards
].filter(c=>c.nativeFace!==true);
const activeIds=new Set(cards.map(c=>c.id));
const faces=resolve(ROOT,'public/assets/fleet-next-cards');
const illustrations=resolve(ROOT,'public/assets/fleet-card-illustrations');
const fail=m=>{throw new Error('[CARTE] '+m)};
const decode=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
function checkEffect(svg,card,grade=1){
 const expected=describeEffect(card,grade);
 const group=svg.match(new RegExp('<g data-current-effect="'+card.id+'"[^>]*>([\\s\\S]*?)<\\/g>'));
 if(!group)fail('Testo regole visibile mancante '+card.id+' grado '+grade);
 const visible=[...group[1].matchAll(/<text\b[^>]*>(.*?)<\/text>/g)].map(m=>decode(m[1])).join(' ');
 if(visible!==expected)fail('Testo troncato o diverso dal motore '+card.id+' grado '+grade);
 if(!group[0].includes('data-effect-grade="'+grade+'"'))fail('Grado del testo incoerente '+card.id);
 if(grade===1&&expected!==(card.effetto||card.effectProposed))fail('Testo catalogo diverso dal motore '+card.id);
 return svg.indexOf(group[0]);
}
const approvedRoot=resolve(ROOT,'public/assets/fleet-approved-fronts');
const approvedManifest=JSON.parse(readFileSync(resolve(approvedRoot,'manifest.json'),'utf8'));
const approvedMap=new Map(approvedManifest.cards.filter(item=>activeIds.has(item.id)).map(item=>[item.id,item]));
const approvedFiles=readdirSync(approvedRoot).filter(f=>f.endsWith('.webp')&&activeIds.has(f.slice(0,-5)));
if(approvedMap.size!==approvedManifest.cards.filter(item=>activeIds.has(item.id)).length||approvedFiles.length!==approvedMap.size)
 fail('Fronti approvati duplicati o mancanti');

function kind(c){
 const cat=c.categoria||c.category||'',sub=c.sottotipo||'';
 return sub==='Terreno'?'terrain':sub==='Personaggio'||/Personaggio/i.test(cat)?'character':
  sub==='Difesa'||/Difesa/i.test(cat)?'defense':
  cat==='Attacco'||/Combo|Fusione/i.test(cat)?'attack':
  /Controllo/i.test(cat)?'control':
  /Supporto|Scudiera|Tattica|Strategia/i.test(cat)?'support':'attack';
}
const src=new Set(cards.map(c=>c.id));
if(cards.length!==19||src.size!==19)fail('Fronti illustrati dei Personaggi fuori sincronizzazione');
const faceIds=readdirSync(faces).filter(x=>x.endsWith('.svg')&&activeIds.has(x.slice(0,-4))).map(x=>x.slice(0,-4));
if(faceIds.length!==19||faceIds.some(x=>!src.has(x)))fail('Fronte SVG attivo mancante');
const assets=readdirSync(illustrations).filter(x=>x.endsWith('.webp')&&activeIds.has(x.slice(0,-5)));
const perFunction={},hdIds=[],missing=[];
for(const c of cards){
 const id=c.id,svg=readFileSync(resolve(faces,id+'.svg'),'utf8'),type=kind(c);
 const currentTextStart=checkEffect(svg,c);
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

 const approved=approvedMap.get(id);
 if(approved){
  if(approved.name!==(c.nome||c.name)||approved.role!==(c.sottotipo||c.category)||
   approved.rarity!==(c.rarita||c.rarityDraft)||approved.effect!==(c.effetto||c.effectProposed))
   fail('Identità o regole correnti non sincronizzate '+id);
  if(approved.rulesRevision!==SIMPLE_RULES_REVISION||!approved.originalApprovedEffect)
   fail('Provenienza approvazione o revisione regole assente '+id);
  const full=resolve(approvedRoot,id+'.webp');
  if(!existsSync(full))fail('WEBP approvato mancante '+id);
  const content=readFileSync(full);
  if(content.toString('ascii',0,4)!=='RIFF'||content.toString('ascii',8,12)!=='WEBP')
   fail('Formato WEBP non valido '+id);
  const anchor=svg.indexOf('data-approved-front="'+id+'"');
  if(anchor<0)fail('Fronte approvato non visibile nel gioco '+id);
  if(currentTextStart<=svg.indexOf('/>',anchor))fail('Regole correnti coperte dal vecchio testo raster '+id);
  if(createHash('sha256').update(content).digest('hex')!==approved.originalApprovedAssetSha256)
   fail('Sorgente approvata modificata senza nuovo controllo '+id);
  const match=svg.slice(anchor).match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  if(!match||!Buffer.from(match[1],'base64').equals(content))
   fail('Fronte approvato non sincronizzato '+id);
 }else if(svg.includes('data-approved-front='))fail('Fronte approvato senza manifest '+id);
 perFunction[type]=role;
}
const upgrades=resolve(ROOT,'public/assets/fleet-next-card-upgrades');
const exclusive=cards.filter(c=>c.shipId);
const upgradeFiles=readdirSync(upgrades).filter(f=>f.endsWith('.svg')&&activeIds.has(f.replace(/-g[23]\.svg$/,'')));
if(upgradeFiles.length!==exclusive.length*2)fail('Varianti di grado mancanti o extra');
for(const card of exclusive)for(const grade of [2,3]){
 const filename=resolve(upgrades,card.id+'-g'+grade+'.svg');
 if(!existsSync(filename))fail('Variante di grado mancante '+card.id+' grado '+grade);
 const svg=readFileSync(filename,'utf8');checkEffect(svg,card,grade);
 const original=resolve(illustrations,card.id+'.webp');
 if(existsSync(original)){
  const embedded=svg.match(/href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/);
  if(!embedded||!Buffer.from(embedded[1],'base64').equals(readFileSync(original)))fail('Arte diversa nella variante '+card.id);
 }
}
const bossRoot=resolve(ROOT,'public/assets/fleet-next-boss-cards');
const bossCards=Object.values(BOSS_CARDS),bossFiles=readdirSync(bossRoot).filter(f=>f.endsWith('.svg'));
if(bossCards.length!==12||bossFiles.length!==12)fail('Fronti Boss mancanti o extra');
for(const card of bossCards){
 const svg=readFileSync(resolve(bossRoot,card.id+'.svg'),'utf8');checkEffect(svg,card);
 if(!svg.includes('data-boss-portrait="'+card.id+'"'))fail('Ritratto Boss originale mancante '+card.id);
 if(!svg.includes('>BOSS</text>')||!svg.includes('>PERSONAGGIO</text>'))fail('Ruolo o rarità Boss errati '+card.id);
 if(svg.includes('ECLISSI STELLARE'))fail('Marchio non consentito sul fronte Boss '+card.id);
}
if(assets.some(f=>!src.has(f.slice(0,-5))))fail('WebP orfana');
if(hdIds.length!==assets.length)fail('Conteggio HD divergente');
if(approvedFiles.some(x=>!src.has(x.slice(0,-5))||!approvedMap.has(x.slice(0,-5))))
 fail('Fronte approvato orfano');
const state={total:cards.length,hd:hdIds.length,approved:approvedMap.size,pending:missing.length,upgradeFaces:upgradeFiles.length,bossFaces:bossCards.length,rulesChecked:cards.length+upgradeFiles.length+bossCards.length,perFunction,
 next:missing.slice(0,15),updatedFrom:'repository'};
if(process.argv.includes('--json'))console.log(JSON.stringify(state,null,2));
else console.log('CARTE: '+state.hd+'/'+state.total+' HD, '+state.pending+' ancora vettoriali; '+Object.entries(perFunction).map(([k,v])=>k+':'+v.hd+'/'+v.total).join(' | '));
