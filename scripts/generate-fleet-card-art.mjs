// Generatore deterministico, basato esclusivamente sui cataloghi ufficiali (250+129).
// npm: node scripts/generate-fleet-card-art.mjs
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const C={"attack":{"base":"#ff594c","soft":"#ffb054","name":"ATTACCO","glyph":"⟡"},"defense":{"base":"#37ceff","soft":"#b1f2ff","name":"DIFESA","glyph":"⬡"},"character":{"base":"#eb64e1","soft":"#ffd0fb","name":"PERSONAGGIO","glyph":"♛"},"terrain":{"base":"#2be3a2","soft":"#afffe4","name":"TERRENO","glyph":"◈"},"support":{"base":"#ffb24d","soft":"#ffe2a4","name":"SUPPORTO","glyph":"✚"},"control":{"base":"#9e8fff","soft":"#ded4ff","name":"CONTROLLO","glyph":"◎"}};
const R={"Comune":{"base":"#a9b9cc","bright":"#f1f8ff","name":"COMUNE","level":1},"Rara":{"base":"#24cfff","bright":"#d2fbff","name":"RARA","level":2},"Epica":{"base":"#bb60ff","bright":"#f5caff","name":"EPICA","level":3},"Leggendaria":{"base":"#ffc447","bright":"#fff0ad","name":"LEGGENDARIA","level":4}};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0}
function rng(seed){let x=seed||1;return ()=>((x=(Math.imul(1664525,x)+1013904223)>>>0)/4294967296)}
function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function lineBreak(s,length=30,limit=4){let words=String(s||"").replace(/\s+/g," ").trim().split(" "),out=[],line="";for(let word of words){if((line+" "+word).trim().length>length&&line){out.push(line);line=word}else line+=(line?" ":"")+word}if(line)out.push(line);if(out.length>limit){out=out.slice(0,limit);out[limit-1]=out[limit-1].replace(/[ .,:;]+$/,"")+"…"}return out}
function normalizeCard(o,source){
 const cat=source==="general"?o.categoria:o.category,sub=source==="general"?o.sottotipo:"";
 const kind=sub==="Terreno"?"terrain":sub==="Personaggio"||/Personaggio/i.test(cat)?"character":
  sub==="Difesa"||/Difesa/i.test(cat)?"defense":
  cat==="Attacco"||/Combo|Fusione/i.test(cat)?"attack":
  /Controllo/i.test(cat)?"control":/Supporto|Scudiera|Tattica|Strategia/i.test(cat)?"support":"attack";
 return {id:o.id,name:o.nome||o.name||o.id,kind,rarity:o.rarita||o.rarityDraft||"Comune",
  effect:o.effetto||o.effectProposed||"",family:o.famiglia||o.families?.[0]||"",
  ship:o.shipId||"",source};
}
function artScene(c,seed){
 const rand=rng(seed^0x894ec321);
 const f=C[c.kind]||C.support;
 let sky="",details="";
 for(let i=0;i<78;i++){
  const x=Math.floor(42+rand()*427),y=Math.floor(224+rand()*288),s=(.5+rand()*2.3).toFixed(1);
  sky+=`<circle cx="${x}" cy="${y}" r="${s}" fill="${i%6? "#b9d7ff":f.base}" opacity="${(.16+rand()*.65).toFixed(2)}"/>`;
 }
 const angle=((seed%5)-2)*9;
 const cx=245+(seed%55)-27,cy=367+(seed%37)-18;
 const ship=(x,y,s=1,rot=0)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
 <path d="M-154 5 L-95 -35 L-37 -36 L-13 -70 L17 -70 L50 -35 L120 -27 L154 6 L102 24 L46 22 L8 69 L-19 70 L-65 23 L-121 24 Z" fill="#273852" stroke="${f.soft}" stroke-width="3"/>
 <path d="M-115 7 L-30 -18 L20 -45 L38 -15 L116 7 L21 16 L0 46 L-29 14Z" fill="#516b8a" stroke="#afc9df" stroke-width="1.3"/>
 <path d="M-83 4 L-24 -2 L28 2 L94 7" fill="none" stroke="${f.base}" stroke-width="7" opacity=".8"/>
 <path d="M-31 24 L-9 53 L6 23" fill="${f.base}" opacity=".85"/>
 <path d="M-135 -1 L-169 7 L-135 16" fill="${f.base}" opacity=".9"/>
 <path d="M-110 -22 L-81 -23 L-60 -40 L-93 -37 Z" fill="#99c4e8" opacity=".6"/>
 </g>`;
 const rings=(x,y,rad=120)=>`<g fill="none" stroke="${f.base}" opacity=".72">
  <circle cx="${x}" cy="${y}" r="${rad}" stroke-width="3" stroke-dasharray="3 11"/>
  <circle cx="${x}" cy="${y}" r="${rad*.7}" stroke-width="1.5" stroke-dasharray="28 12 9 12"/>
  <circle cx="${x}" cy="${y}" r="${rad*.35}" stroke-width="1.5"/>
  <path d="M${x-rad-19} ${y}H${x+rad+19} M${x} ${y-rad-19}V${y+rad+19}" stroke-width="1" opacity=".5"/>
 </g>`;
 if(c.kind==="attack"){
  const y=335+(seed%70);
  details=`${ship(185,y,.72,angle)}
  <g filter="url(#beamGlow)"><path d="M190 ${y+1} L442 ${y-110} M180 ${y+18} L455 ${y+56}" stroke="${f.base}" stroke-width="9" stroke-linecap="round"/><path d="M190 ${y+1} L442 ${y-110} M180 ${y+18} L455 ${y+56}" stroke="#fff3c2" stroke-width="2.4"/></g>
  ${rings(395,y-28,75)}<circle cx="404" cy="${y-23}" r="26" fill="${f.base}" opacity=".21"/>
  <path d="M382 ${y-23}l23 -34l-6 27l35 7l-32 4l12 35z" fill="#ffcf74" opacity=".85"/>`;
 }else if(c.kind==="defense"){
  details=`${ship(cx,cy,.71,angle)}<ellipse cx="${cx}" cy="${cy}" rx="159" ry="127" fill="${f.base}" opacity=".12" stroke="${f.soft}" stroke-width="6"/>
  <ellipse cx="${cx}" cy="${cy}" rx="174" ry="140" fill="none" stroke="${f.base}" stroke-width="8" opacity=".3" filter="url(#beamGlow)"/>
  ${Array.from({length:9},(_,i)=>`<path d="M${cx-149+i*36} ${cy-92}l-27 41l27 41l48 0l26-41l-26-41z" fill="none" stroke="${f.soft}" stroke-width="2" opacity=".22"/>`).join("")}
  <path d="M70 ${cy-15}L${cx-135} ${cy-17}M434 ${cy-8}L${cx+141} ${cy-17}" stroke="#ffba78" stroke-width="6" opacity=".8"/>`;
 }else if(c.kind==="character"){
  const hue=seed%3;
  details=`<g transform="translate(${cx} 401) rotate(${angle*.27})">
   <path d="M-144 117Q-151 -7 -86 -42L-44 -57L37 -57L92 -30Q143 13 147 117Z" fill="${hue===0?"#3b3657":hue===1?"#273a5a":"#4d354e"}" stroke="${f.base}" stroke-width="5"/>
   <path d="M-76 103L-56 -38L-2 3L52 -34L76 103Z" fill="#596780" stroke="${f.soft}" stroke-width="2"/>
   <path d="M-40 5L-12 32L21 6L-1 75Z" fill="${f.base}" opacity=".9"/>
   <path d="M-63 -65Q-76 -172 -2 -189Q70 -180 62 -80L44 -38Q1 11 -45 -40Z" fill="#76849c" stroke="${f.soft}" stroke-width="5"/>
   <path d="M-75 -113Q-61 -196 -6 -203Q64 -191 73 -116L39 -135L-54 -129Z" fill="#1b2b42" stroke="${f.base}" stroke-width="6"/>
   <path d="M-56 -83L45 -83L35 -63L-45 -63Z" fill="${f.soft}" opacity=".85"/>
   <path d="M-81 -9L-112 17L-79 53L-56 6Z M76 -10L105 17L74 53L46 5Z" fill="${f.base}" opacity=".35"/>
  </g><path d="M75 488L75 268L121 268 M387 245H435V487" stroke="${f.base}" stroke-width="3" fill="none" opacity=".4"/>`;
 }else if(c.kind==="terrain"){
  const heights=Array.from({length:9},()=>45+Math.round(rand()*140));
  let x=35;
  const peaks=heights.map((h,i)=>{let d=`M${x-25} 516L${x+24} ${516-h}L${x+75} 516Z`;x+=50;return `<path d="${d}" fill="${i%2?'#1a4b55':'#29566b'}" stroke="${f.base}" stroke-width="2" opacity=".8"/>`}).join("");
  details=`<circle cx="${cx+93}" cy="315" r="${55+seed%26}" fill="${f.base}" opacity=".14" stroke="${f.soft}" stroke-width="5"/>
  <circle cx="${cx+96}" cy="310" r="${69+seed%30}" fill="none" stroke="${f.base}" stroke-width="2" opacity=".5"/>
  ${peaks}<path d="M35 494Q130 450 228 499T476 492V529H35Z" fill="${f.base}" opacity=".17"/>
  ${Array.from({length:5},(_,i)=>`<path d="M${85+70*i} 512l${10+(seed+i)%16} -${39+i*9}l${10+i*3} ${39+i*9}" stroke="${f.soft}" stroke-width="3" fill="${f.base}" opacity=".65"/>`).join("")}`;
 }else if(c.kind==="control"){
  details=`${rings(cx,cy,124)}${rings(cx+32,cy-33,70)}
   <path d="M113 460L165 404L210 438L279 290L369 346L428 259" fill="none" stroke="${f.soft}" stroke-width="8" filter="url(#beamGlow)"/>
   ${Array.from({length:7},(_,i)=>{let x=98+i*53,y=312+((seed+i*29)%130);return `<circle cx="${x}" cy="${y}" r="10" fill="${f.base}" stroke="#e7edff" stroke-width="3"/><path d="M${x} ${y}L${cx} ${cy}" stroke="${f.base}" stroke-dasharray="3 8" opacity=".25"/>`}).join("")}
   <path d="M170 280L170 250L194 250M360 460H405V423" fill="none" stroke="${f.soft}" stroke-width="4"/>`;
 }else{
  details=`${ship(cx,cy,.66,angle)}${rings(cx+19,cy-2,100)}
  <path d="M${cx+10} ${cy-120}V${cy-40} M${cx-31} ${cy-80}H${cx+53}" stroke="${f.soft}" stroke-width="16" opacity=".7" filter="url(#beamGlow)"/>
  <path d="M${cx+10} ${cy-120}V${cy-40} M${cx-31} ${cy-80}H${cx+53}" stroke="#fff" stroke-width="5"/>
  <path d="M62 266l61 -34l32 38l-15 67l-62 19Z M356 459l66 -28l24 48l-58 29Z" fill="#2b5967" stroke="${f.base}" stroke-width="4"/>`;
 }
 return `<g clip-path="url(#artClip)"><rect x="37" y="217" width="438" height="310" fill="url(#spaceSky)"/>
 <circle cx="${380-seed%220}" cy="${310+seed%155}" r="${148+seed%45}" fill="url(#planet)" opacity=".34"/>
 <path d="M12 477Q218 430 508 357" fill="none" stroke="${f.base}" stroke-width="27" opacity=".12"/>
 ${sky}${details}
 <path d="M44 246V232H87 M424 232h42v39 M44 477v39h40 M428 515h38v-40" stroke="${f.soft}" stroke-width="3" fill="none" opacity=".67"/>
 </g>`;
}
function makeSvg(c){
 const fam=C[c.kind]||C.support,rar=R[c.rarity]||R.Comune,seed=hash(c.id);
 const titleLines=lineBreak(c.name,23,3),effectLines=lineBreak(c.effect,43,5);
 const titleSize=titleLines.length===1?34:titleLines.length===2?30:26;
 const titleStart=titleLines.length===1?113:titleLines.length===2?99:88;
 const effectSize=effectLines.length>=5?17.4:19;
 const effectY=591;
 const brand=c.ship?`ESCLUSIVA ${c.ship}`:c.source==="general"?"GENERALE":"ESCLUSIVA";
 const safeId=esc(c.id);
 const familyName=esc(c.family||fam.name);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="768" viewBox="0 0 512 768" role="img" aria-label="${esc(c.name)} · ${esc(fam.name)} · ${esc(rar.name)}">
 <defs>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset=".24" stop-color="#66768a"/><stop offset=".42" stop-color="#142136"/><stop offset=".77" stop-color="#080e1c"/><stop offset="1" stop-color="#66798e"/></linearGradient>
  <linearGradient id="rim" x1=".15" y1="0" x2=".87" y2="1"><stop stop-color="${rar.bright}"/><stop offset=".2" stop-color="${rar.base}"/><stop offset=".52" stop-color="#19283c"/><stop offset=".78" stop-color="${rar.base}"/><stop offset="1" stop-color="${rar.bright}"/></linearGradient>
  <linearGradient id="spaceSky" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#080d22"/><stop offset=".49" stop-color="#142846"/><stop offset=".82" stop-color="#091222"/><stop offset="1" stop-color="#070d18"/></linearGradient>
  <radialGradient id="planet"><stop stop-color="${fam.base}" stop-opacity=".65"/><stop offset=".52" stop-color="#194761" stop-opacity=".42"/><stop offset="1" stop-color="#0a1529" stop-opacity=".05"/></radialGradient>
  <linearGradient id="titlePanel" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0a1426"/><stop offset="1" stop-color="#202c43"/></linearGradient>
  <linearGradient id="rarityShine" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#070d19"/><stop offset=".48" stop-color="${rar.base}" stop-opacity=".30"/><stop offset="1" stop-color="#070d19"/></linearGradient>
  <filter id="rimGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${rar.level+1.3}"/></filter>
  <filter id="beamGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="artClip"><rect x="37" y="217" width="438" height="310" rx="8"/></clipPath>
 </defs>
 <path d="M37 7H473L505 39V724L474 760H38L8 730V39Z" fill="#030712" stroke="${rar.base}" stroke-width="10" filter="url(#rimGlow)"/>
 <path d="M37 7H473L505 39V724L474 760H38L8 730V39Z" fill="url(#metal)" stroke="${rar.base}" stroke-width="5"/>
 <path d="M43 19H468L492 43V718L467 747H43L21 723V47Z" fill="#050c1b" stroke="url(#rim)" stroke-width="${rar.level+1.1}"/>
 <path d="M43 19H468L492 43V718L467 747H43L21 723V47Z" fill="none" stroke="${rar.bright}" stroke-width="1.8" opacity=".75"/>
 <path d="M61 39H450" stroke="${rar.bright}" stroke-width="2" opacity=".82"/>
 <text x="256" y="53" text-anchor="middle" fill="#e9f5ff" font-size="18" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">ECLISSI STELLARE</text>
 <path d="M39 65H474V186H39Z" fill="url(#titlePanel)" stroke="#506a82" stroke-width="2"/>
 <path d="M45 73H96L108 85V147L96 158H45Z" fill="${fam.base}" fill-opacity=".13" stroke="${fam.base}" stroke-width="3"/>
 <text x="77" y="128" text-anchor="middle" fill="${fam.soft}" font-family="Arial, sans-serif" font-size="40" font-weight="bold">${fam.glyph}</text>
 ${titleLines.map((t,i)=>`<text x="121" y="${titleStart+i*(titleSize+5)}" fill="#f7faff" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="800">${esc(t)}</text>`).join("")}
 <path d="M42 190H470L455 213H58Z" fill="${fam.base}" fill-opacity=".20" stroke="${fam.base}" stroke-width="2.7"/>
 <text x="256" y="208" text-anchor="middle" fill="${fam.soft}" font-family="Arial,sans-serif" font-size="18" font-weight="900" letter-spacing="2">${fam.name}</text>
 ${artScene(c,seed)}
 <rect x="36" y="216" width="440" height="312" rx="7" fill="none" stroke="${rar.base}" stroke-width="3"/>
 <path d="M40 531H473V564H40Z" fill="#051524" stroke="${fam.base}" stroke-width="2"/>
 <text x="54" y="553" fill="${fam.soft}" font-family="Arial,sans-serif" font-size="15" font-weight="bold" letter-spacing="1">${esc(brand)}</text>
 <text x="460" y="553" text-anchor="end" fill="#e4f0ff" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${familyName.slice(0,26)}</text>
 <rect x="39" y="570" width="434" height="133" rx="6" fill="#081427" stroke="#426076" stroke-width="2"/>
 ${effectLines.map((t,i)=>`<text x="55" y="${effectY+i*23}" fill="#e6effb" font-size="${effectSize}" font-family="Arial,sans-serif">${esc(t)}</text>`).join("")}
 <rect x="58" y="711" width="395" height="37" rx="6" fill="url(#rarityShine)" stroke="${rar.base}" stroke-width="2.5"/>
 <path d="M75 727l11 -10l11 10l-11 14Z" fill="${rar.bright}" stroke="${rar.base}" stroke-width="2"/>
 <text x="256" y="738" fill="${rar.bright}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="900" letter-spacing="2">${rar.name}</text>
 <text x="454" y="747" fill="#afbac9" font-family="Arial,sans-serif" font-size="9" text-anchor="end" opacity=".9">${safeId}</text>
 </svg>`;
}
const a=JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogGeneral.json'),'utf8')).carte;
const b=JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogExclusive.json'),'utf8')).cards;
const cards=[...a.map(c=>normalizeCard(c,'general')),...b.map(c=>normalizeCard(c,'exclusive'))];
if(cards.length!==379||new Set(cards.map(c=>c.id)).size!==379)throw Error('Catalogo diverso da 379');
const dest=resolve(ROOT,'public/assets/fleet-next-cards');mkdirSync(dest,{recursive:true});
for(const card of cards)writeFileSync(resolve(dest,card.id+'.svg'),makeSvg(card));
console.log('Generate '+cards.length+' carte SVG ufficiali, con funzione e rarità');
