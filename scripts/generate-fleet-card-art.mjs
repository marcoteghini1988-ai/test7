// Generatore deterministico, basato esclusivamente sui cataloghi ufficiali (250+129).
// npm: node scripts/generate-fleet-card-art.mjs
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const ROOT=resolve(fileURLToPath(new URL('..',import.meta.url)));
const C={"attack":{"base":"#ff594c","soft":"#ffb054","name":"ATTACCO","glyph":"⟡"},"defense":{"base":"#37ceff","soft":"#b1f2ff","name":"DIFESA","glyph":"⬡"},"character":{"base":"#eb64e1","soft":"#ffd0fb","name":"PERSONAGGIO","glyph":"♛"},"terrain":{"base":"#2be3a2","soft":"#afffe4","name":"TERRENO","glyph":"◈"},"support":{"base":"#ffb24d","soft":"#ffe2a4","name":"SUPPORTO","glyph":"✚"},"control":{"base":"#9e8fff","soft":"#ded4ff","name":"CONTROLLO","glyph":"◎"}};
const R={"Comune":{"name":"COMUNE","level":1},"Rara":{"name":"RARA","level":2},"Epica":{"name":"EPICA","level":3},"Leggendaria":{"name":"LEGGENDARIA","level":4}};
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
function terrainScene(c,seed){
 const random=rng(seed^0x72399a81);
 const id=c.id;
 const paths=(amount,fn)=>Array.from({length:amount},(_,i)=>fn(i,random())).join("");
 const rock=(x,y,scale=1,col="#223e53")=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-37 14L-28 -16L-8 -29L27 -19L40 4L19 30L-17 26Z" fill="${col}" stroke="#8bb3c4" stroke-opacity=".45" stroke-width="2"/><path d="M-28 -15L-8 -29L8 -4L-8 5L-37 14Z" fill="#778ca5" opacity=".25"/></g>`;
 const crystal=(x,y,scale=1,tone="#63e6d0")=>`<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-30 24L-17 -35L6 -86L29 -31L35 26Z" fill="${tone}" fill-opacity=".67" stroke="#cbf7ff" stroke-width="2.5"/><path d="M6 -86V23L-16 -31Z" fill="#e6fcff" opacity=".32"/><path d="M6 -86L29 -31L35 26L6 23Z" fill="#062c49" opacity=".65"/></g>`;
 const bolt=(x,y,sc=1,tone="#a5f7ff")=>`<path d="M${x} ${y}l${17*sc} ${45*sc}l${-19*sc} ${18*sc}l${33*sc} ${62*sc}l${-10*sc} ${-54*sc}l${21*sc} ${-31*sc}l${-22*sc} ${-40*sc}" fill="none" stroke="${tone}" stroke-width="${3*sc}" stroke-linejoin="round" filter="url(#beamGlow)"/>`;
 const ground=(color)=>`<path d="M37 453Q96 425 166 458T298 450T475 451V530H37Z" fill="${color}" stroke="#79f2ff" stroke-opacity=".20" stroke-width="3"/>`;
 let s="";
 switch(id){
 case "gen-219": // Distesa Gelida
  s=`<path d="M37 380L86 334L111 355L187 267L236 356L273 315L309 350L375 275L456 365L475 382V525H37Z" fill="#365b89" stroke="#a8daff" stroke-width="3"/>
   <path d="M37 403L110 343L140 373L188 267L239 355L274 314L310 355L375 275L432 337L475 381L456 389L374 317L311 387L272 342L239 399L186 304L139 413L91 377L37 431Z" fill="#b6e7ff" opacity=".90"/>
   <path d="M37 446Q168 403 230 441T475 420V526H37Z" fill="#9bc9e9" stroke="#e8fdff" stroke-width="3"/>
   ${paths(13,(i,r)=>{let x=60+i*29,y=438+(i%4)*13;return `<path d="M${x} ${y}l${13+r*23} ${-9-r*19}l${20+r*9} 8" fill="none" stroke="#edffff" stroke-width="1.5" opacity=".65"/>`})}
   ${crystal(82,447,.63,"#54d9ff")}${crystal(406,440,.95,"#89ddff")}
   <path d="M40 290Q173 250 285 277T475 255" stroke="#3bffee" stroke-width="15" fill="none" opacity=".22"/>`;
  break;
 case "gen-220": // Deserto Magnetico
  s=`<path d="M37 420Q96 364 188 393T342 364T475 375V527H37Z" fill="#ad553a" stroke="#ffcb80" stroke-width="2"/>
   <path d="M37 465Q125 420 201 460T355 425T475 452V527H37Z" fill="#f18b43"/>
   ${paths(5,(i,r)=>`<path d="M${68+i*82} ${443+(i%2)*35}l${22+r*20} -${20+r*25}l${19+r*10} ${24+r*6}" stroke="#7b342c" stroke-width="2" fill="#4a2839"/>`)}
   <g fill="none" stroke="#c375ff" stroke-width="10" stroke-linecap="round" opacity=".9"><path d="M118 378A97 122 0 0 1 150 260"/><path d="M153 310A128 90 0 0 1 393 331"/><path d="M342 363A78 130 0 0 1 427 268"/></g>
   <g fill="none" stroke="#d9b5ff" stroke-width="2"><ellipse cx="250" cy="346" rx="166" ry="45" transform="rotate(-19 250 346)"/><ellipse cx="257" cy="346" rx="133" ry="38" transform="rotate(20 257 346)"/></g>
   ${bolt(258,244,.75,"#d5b2ff")}${rock(414,404,.7,"#502d42")}`;
  break;
 case "gen-221": // Nebbia di Elio
  s=`<path d="M37 444L92 374L149 413L231 336L293 380L374 310L475 399V528H37Z" fill="#33305c" stroke="#868cc9" stroke-width="3"/>
   ${paths(10,(i,r)=>`<ellipse cx="${44+i*43}" cy="${364+(i%4)*33}" rx="${55+r*26}" ry="${23+r*16}" fill="${i%2?'#9182e9':'#81d8fa'}" opacity=".19" filter="url(#beamGlow)"/>`)}
   ${paths(8,(i,r)=>`<circle cx="${82+i*48}" cy="${255+(i%5)*38}" r="${8+r*24}" fill="#b7aaf8" fill-opacity=".09" stroke="#e5d6ff" stroke-width="${1.1+r*1.5}" opacity=".7"/>`)}
   <path d="M37 440Q125 385 225 445T475 426V529H37Z" fill="#7776b8" opacity=".56"/>
   <path d="M37 487Q134 449 247 487T475 475" stroke="#f5e5ff" stroke-width="18" opacity=".35" fill="none"/>
   <circle cx="405" cy="262" r="47" fill="#debaff" opacity=".18" stroke="#edd4ff" stroke-width="2"/>`;
  break;
 case "gen-229": // Palude di Silicio
  s=`${ground("#102c38")}
   ${paths(9,(i,r)=>`<path d="M${49+i*54} 490l${-13+r*28} -${42+r*48}l${19+r*12} -${9+r*19}" stroke="#284d53" stroke-width="${3+r*5}" fill="none"/>`)}
   ${paths(7,(i,r)=>crystal(70+i*62,465-(i%3)*12,.28+r*.45,i%2?"#2dfdbf":"#44baff"))}
   <path d="M37 475Q135 443 235 470T475 464V527H37Z" fill="#1d7d75" opacity=".75"/>
   ${paths(9,(i,r)=>`<ellipse cx="${55+i*49}" cy="${480+r*43}" rx="${15+r*21}" ry="${2+r*4}" fill="none" stroke="#aaffef" stroke-width="1.2" opacity=".48"/>`)}
   <path d="M66 452L115 405L162 412L199 390" stroke="#456e69" stroke-width="9" fill="none"/>
   ${rock(383,439,.5,"#1a5b57")}`;
  break;
 case "gen-230": // Foresta Ionizzata
  s=`${ground("#123c43")}
   ${paths(8,(i,r)=>{const x=60+i*56,y=476;return `<path d="M${x} ${y}Q${x+17} ${y-89} ${x+(r-.5)*32} ${y-153}M${x+8} ${y-70}L${x+43} ${y-113}M${x+5} ${y-105}L${x-31} ${y-138}" fill="none" stroke="#1a5562" stroke-width="${5+r*5}"/><path d="M${x} ${y-118}l-15 -19l27 -12l20 20Z" fill="#12caa9" opacity=".4"/>`})}
   <path d="M37 498Q152 464 256 503T475 495V527H37Z" fill="#115b55"/>
   ${bolt(122,247,.63,"#78eaff")}${bolt(367,230,.7,"#beffff")}
   ${paths(17,(i,r)=>`<circle cx="${52+i*25}" cy="${283+(i%6)*34}" r="${2+r*5}" fill="#6fffe8" opacity=".55"/>`)}`;
  break;
 case "gen-231": // Cintura di Detriti
  s=`<path d="M37 477L147 421L230 472L318 407L475 448V528H37Z" fill="#273040" stroke="#747c8a" stroke-width="2"/>
   <ellipse cx="265" cy="341" rx="188" ry="56" fill="none" stroke="#bcced7" stroke-width="8" stroke-dasharray="38 25" transform="rotate(-18 265 341)" opacity=".44"/>
   ${paths(16,(i,r)=>rock(58+(i*67)%422,270+(i*41)%218,.19+r*.58,i%3?"#354453":"#4e5163"))}
   <path d="M37 490Q150 443 250 490T475 470V525H37Z" fill="#1b2737"/>
   ${paths(5,(i,r)=>`<path d="M${95+i*83} ${392+i%2*32}l${22+r*16} -${7+r*22}l${30+r*11} ${21+r*8}" stroke="#a5b0bf" stroke-width="3" fill="#465064"/>`)}`;
  break;
 case "gen-237": // Mare di Quarzo
  s=`<path d="M37 425Q140 397 260 426T475 411V528H37Z" fill="#196ba2" opacity=".8"/>
   ${paths(6,(i,r)=>crystal(65+i*76,402+(i%3)*8,.54+r*.63,i%2?"#dcaeff":"#6ceaff"))}
   <path d="M37 446Q135 430 245 459T475 438V528H37Z" fill="#2c83ac" opacity=".57"/>
   ${paths(13,(i,r)=>`<path d="M${50+i*33} ${453+(i%4)*17}q${14+r*7} -9 ${28+r*4} 1" fill="none" stroke="${i%3?'#c6f5ff':'#ffcdff'}" stroke-width="${1.2+r*2}" opacity=".72"/>`)}
   <circle cx="375" cy="298" r="71" fill="#a3ffff" opacity=".13" stroke="#9dcdff" stroke-width="3"/>`;
  break;
 case "gen-238": // Faglia di Plasma
  s=`<path d="M37 379L123 405L172 337L236 395L310 330L396 400L475 368V528H37Z" fill="#412536" stroke="#d88759" stroke-width="3"/>
   <path d="M37 486L152 429L217 455L281 394L345 446L475 412V528H37Z" fill="#642b28"/>
   <path d="M37 485L145 465L190 480L253 426L286 454L343 463L397 439L475 468" stroke="#ff4c24" stroke-width="22" fill="none" filter="url(#beamGlow)"/>
   <path d="M37 485L145 465L190 480L253 426L286 454L343 463L397 439L475 468" stroke="#ffe199" stroke-width="5" fill="none"/>
   ${paths(17,(i,r)=>`<circle cx="${60+(i*43)%410}" cy="${243+(i*49)%230}" r="${2+r*5}" fill="#ffac65" opacity=".72"/>`)}
   ${paths(4,(i,r)=>`<path d="M${102+i*95} 443l${17+r*18} -${52+r*62}" stroke="#fb6b36" stroke-width="4" filter="url(#beamGlow)"/>`)}`;
  break;
 case "gen-239": // Tempesta Ionica
  s=`${paths(8,(i,r)=>`<ellipse cx="${25+i*71}" cy="${328+i%4*17}" rx="${76+r*26}" ry="${35+r*16}" fill="${i%2?'#553aa7':'#234f9f'}" opacity=".52"/>`)}
   <path d="M37 427Q110 390 193 425T335 401T475 430V525H37Z" fill="#252953"/>
   <path d="M37 458Q141 411 253 466T475 455" stroke="#7351ce" stroke-width="18" fill="none" opacity=".6"/>
   ${bolt(116,257,.95,"#b7d6ff")}${bolt(253,226,.86,"#f3c2ff")}${bolt(373,257,.82,"#b1ffff")}
   <ellipse cx="266" cy="327" rx="163" ry="92" fill="none" stroke="#c49aff" stroke-width="5" stroke-dasharray="16 13" opacity=".37"/>`;
  break;
 case "gen-245": // Trono di Antimateria
  s=`<circle cx="267" cy="340" r="114" fill="#070710" stroke="#bffeff" stroke-width="12" opacity=".9"/>
   <circle cx="267" cy="340" r="81" fill="#090f21" stroke="#ccf7ff" stroke-width="3"/>
   <circle cx="267" cy="340" r="53" fill="#000" stroke="#9f73ff" stroke-width="8" filter="url(#beamGlow)"/>
   <path d="M37 486L116 443L154 469L188 387L222 453L267 402L310 451L348 388L398 470L475 450V525H37Z" fill="#111a2d" stroke="#86c3dc" stroke-width="3"/>
   <path d="M178 449V353L215 378L265 283L320 379L353 353V451L314 433L267 402L223 434Z" fill="#15263b" stroke="#89e8ff" stroke-width="3"/>
   <path d="M267 292V422" stroke="#e8fcff" stroke-width="8" filter="url(#beamGlow)"/>
   <ellipse cx="267" cy="338" rx="165" ry="50" transform="rotate(-22 267 338)" fill="none" stroke="#b0dcff" stroke-width="5" opacity=".76"/>
   ${paths(11,(i,r)=>`<path d="M${75+i*33} ${450-(i%3)*33}l${r*16-8} -${17+r*32}" stroke="#c3daff" stroke-width="2" opacity=".65"/>`)}`;
  break;
 default:throw new Error("Terreno senza scena dedicata "+id);
 }
 return `<g data-terrain="${id}" data-illustration="unique-scene">${s}</g>`;
}
function artScene(c,seed){
 // Il sorgente HD e' opzionale per qualsiasi categoria. Colore funzione,
 // rarita', nome ed effetto restano sempre generati dai cataloghi ufficiali.
 // WEBP inline, perche' gli SVG in <img> non caricano risorse esterne.
 const source=resolve(ROOT,'public/assets/fleet-card-illustrations',c.id+'.webp');
 if(existsSync(source)){
  const data=readFileSync(source).toString('base64');
  return `<g clip-path="url(#artClip)" data-hd-art="${c.id}"><image x="37" y="217" width="438" height="310" preserveAspectRatio="xMidYMid slice" href="data:image/webp;base64,${data}"/></g>`;
 }

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
  // Nome e identità ambientale: una scena dedicata per ogni Terreno reale.
  details=terrainScene(c,seed);
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
// Dieci sfondi ambiente: solo presentazione, nessuna modifica ai turni.
const TERRAIN_IDS={T01:'gen-219',T02:'gen-238',T03:'gen-239',T04:'gen-220',T05:'gen-231',
 T06:'gen-221',T07:'gen-230',T08:'gen-229',T09:'gen-237',T10:'gen-245'};
const TERRAIN_ATMOSPHERE={
 T01:'#64cfff',T02:'#ff6338',T03:'#aaa1ff',T04:'#ed9c4b',T05:'#a2aabd',
 T06:'#b79dff',T07:'#42ebba',T08:'#34cfa3',T09:'#73bfff',T10:'#bbc0ff'
};
function terrainBackdropSvg(code,card){
 const hue=TERRAIN_ATMOSPHERE[code];
 if(!hue||card.id!==TERRAIN_IDS[code])throw Error('Scenario Terreno invalido: '+code);
 const seed=hash(card.id),random=rng(seed^0x871b1a12);
 const stars=Array.from({length:57},()=>'<circle cx="'+(25+Math.floor(random()*460))+
 '" cy="'+(14+Math.floor(random()*390))+'" r="'+(.4+random()*1.8)+
 '" fill="#fff" opacity="'+(.13+random()*.4)+'"/>').join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1600" viewBox="0 0 512 768"
  role="img" aria-label="Scenario ${esc(card.name)}">
 <defs>
 <linearGradient id="back" x1="0" y1="0" x2=".9" y2="1">
 <stop stop-color="#070b1a"/><stop offset=".6" stop-color="#132038"/>
 <stop offset="1" stop-color="${hue}" stop-opacity=".4"/>
 </linearGradient>
 <filter id="beamGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
 </defs>
 <rect width="512" height="768" fill="url(#back)"/>
 ${stars}
 <circle cx="400" cy="256" r="91" fill="#111b34" stroke="${hue}" stroke-width="4" opacity=".66"/>
 <g opacity=".88" transform="translate(0,70) scale(1,1.28)">${terrainScene(card,seed)}</g>
 <path d="M0 727Q155 657 277 718T512 686V768H0Z" fill="${hue}" opacity=".13"/>
 </svg>`;
}

function makeSvg(c){
 const fam=C[c.kind]||C.support,rar=R[c.rarity]||R.Comune,seed=hash(c.id);
 const metalLight=['','#263446','#526b80','#9fb5c8','#f4fbff'][rar.level];
 const metalWhite=['','#354458','#718da6','#ceddeb','#ffffff'][rar.level];
 const rimOpacity=[0,.12,.36,.66,.98][rar.level];
 const shineOpacity=[0,.1,.22,.52,.94][rar.level];
 const highlightWidth=[0,.5,1.4,2.5,4.1][rar.level];
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
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101824"/><stop offset=".13" stop-color="${metalLight}"/><stop offset=".29" stop-color="#142033"/><stop offset=".53" stop-color="${metalWhite}"/><stop offset=".76" stop-color="#0b1627"/><stop offset="1" stop-color="${metalLight}"/></linearGradient>
  <linearGradient id="rim" x1=".15" y1="0" x2=".87" y2="1"><stop stop-color="${fam.soft}"/><stop offset=".2" stop-color="${fam.base}"/><stop offset=".52" stop-color="#19283c"/><stop offset=".78" stop-color="${fam.base}"/><stop offset="1" stop-color="${fam.soft}"/></linearGradient>
  <linearGradient id="spaceSky" x1="0" y1="0" x2=".9" y2="1"><stop stop-color="#080d22"/><stop offset=".49" stop-color="#142846"/><stop offset=".82" stop-color="#091222"/><stop offset="1" stop-color="#070d18"/></linearGradient>
  <radialGradient id="planet"><stop stop-color="${fam.base}" stop-opacity=".65"/><stop offset=".52" stop-color="#194761" stop-opacity=".42"/><stop offset="1" stop-color="#0a1529" stop-opacity=".05"/></radialGradient>
  <linearGradient id="titlePanel" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0a1426"/><stop offset="1" stop-color="#202c43"/></linearGradient>
  <linearGradient id="rarityShine" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#070d19"/><stop offset=".48" stop-color="${fam.base}" stop-opacity="${shineOpacity}"/><stop offset="1" stop-color="#070d19"/></linearGradient>
  <filter id="rimGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${1+rar.level*1.45}"/></filter>
  <filter id="beamGlow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="4"/></filter>
  <clipPath id="artClip"><rect x="37" y="217" width="438" height="310" rx="8"/></clipPath>
 </defs>
 <path d="M37 7H473L505 39V724L474 760H38L8 730V39Z" fill="#030712" stroke="${fam.base}" stroke-width="${rar.level*2.8}" opacity="${rimOpacity}" filter="url(#rimGlow)"/>
 <path d="M37 7H473L505 39V724L474 760H38L8 730V39Z" fill="url(#metal)" stroke="${fam.base}" stroke-width="${1.8+rar.level*.7}"/>
 <path d="M43 19H468L492 43V718L467 747H43L21 723V47Z" fill="#050c1b" stroke="url(#rim)" stroke-width="${rar.level+1.1}"/>
 <path d="M43 19H468L492 43V718L467 747H43L21 723V47Z" fill="none" stroke="${fam.soft}" stroke-width="${1+rar.level*.35}" opacity="${shineOpacity}"/>
 <path d="M61 39H450" stroke="${fam.soft}" stroke-width="${highlightWidth}" opacity="${shineOpacity}"/>
 <path d="M32 85V51L52 29H135 M376 29H458L482 52V122 M32 648V715L50 735H128 M382 735H460L481 713V647" fill="none" stroke="#f7fcff" stroke-width="${rar.level===4?4:rar.level===3?2:1}" opacity="${rar.level===4?.83:rar.level===3?.26:rar.level===2?.09:0}"/>
 <path d="M61 43H450" stroke="#fff" stroke-width="${rar.level===4?2.5:1}" opacity="${rar.level===4?.94:rar.level===3?.35:0}"/>
 <text x="256" y="53" text-anchor="middle" fill="#e9f5ff" font-size="18" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">ECLISSI STELLARE</text>
 <path d="M39 65H474V186H39Z" fill="url(#titlePanel)" stroke="#506a82" stroke-width="2"/>
 <path d="M45 73H96L108 85V147L96 158H45Z" fill="${fam.base}" fill-opacity=".13" stroke="${fam.base}" stroke-width="3"/>
 <text x="77" y="128" text-anchor="middle" fill="${fam.soft}" font-family="Arial, sans-serif" font-size="40" font-weight="bold">${fam.glyph}</text>
 ${titleLines.map((t,i)=>`<text x="121" y="${titleStart+i*(titleSize+5)}" fill="#f7faff" font-family="Arial,sans-serif" font-size="${titleSize}" font-weight="800">${esc(t)}</text>`).join("")}
 <path d="M42 190H470L455 213H58Z" fill="${fam.base}" fill-opacity=".20" stroke="${fam.base}" stroke-width="2.7"/>
 <text x="256" y="208" text-anchor="middle" fill="${fam.soft}" font-family="Arial,sans-serif" font-size="18" font-weight="900" letter-spacing="2">${fam.name}</text>
 ${artScene(c,seed)}
 <rect x="36" y="216" width="440" height="312" rx="7" fill="none" stroke="${fam.base}" stroke-width="3"/>
 <path d="M40 531H473V564H40Z" fill="#051524" stroke="${fam.base}" stroke-width="2"/>
 <text x="54" y="553" fill="${fam.soft}" font-family="Arial,sans-serif" font-size="15" font-weight="bold" letter-spacing="1">${esc(brand)}</text>
 <text x="460" y="553" text-anchor="end" fill="#e4f0ff" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${familyName.slice(0,26)}</text>
 <rect x="39" y="570" width="434" height="133" rx="6" fill="#081427" stroke="#426076" stroke-width="2"/>
 ${effectLines.map((t,i)=>`<text x="55" y="${effectY+i*23}" fill="#e6effb" font-size="${effectSize}" font-family="Arial,sans-serif">${esc(t)}</text>`).join("")}
 <rect x="58" y="711" width="395" height="37" rx="6" fill="url(#rarityShine)" stroke="${fam.base}" stroke-width="2.5"/>
 <path d="M75 727l11 -10l11 10l-11 14Z" fill="${fam.soft}" stroke="${fam.base}" stroke-width="2"/>
 <text x="256" y="738" fill="${fam.soft}" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="900" letter-spacing="2">${rar.name}</text>
 <text x="454" y="747" fill="#afbac9" font-family="Arial,sans-serif" font-size="9" text-anchor="end" opacity=".9">${safeId}</text>
 </svg>`;
}
const a=JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogGeneral.json'),'utf8')).carte;
const b=JSON.parse(readFileSync(resolve(ROOT,'src/fleetNext/catalogExclusive.json'),'utf8')).cards;
const cards=[...a.map(c=>normalizeCard(c,'general')),...b.map(c=>normalizeCard(c,'exclusive'))];
if(cards.length!==379||new Set(cards.map(c=>c.id)).size!==379)throw Error('Catalogo diverso da 379');
const dest=resolve(ROOT,'public/assets/fleet-next-cards');mkdirSync(dest,{recursive:true});
for(const card of cards)writeFileSync(resolve(dest,card.id+'.svg'),makeSvg(card));
const terrainOut=resolve(ROOT,'public/assets/fleet-terrain-scenes');
mkdirSync(terrainOut,{recursive:true});
for(const [code,id] of Object.entries(TERRAIN_IDS)){
 const terrain=cards.find(c=>c.id===id);
 if(!terrain||terrain.kind!=='terrain')throw Error('Manca scenario '+id);
 writeFileSync(resolve(terrainOut,code+'.svg'),terrainBackdropSvg(code,terrain));
}
console.log('Generate '+cards.length+' fronti verticali: ruolo = tinta; rarita = riflessi e finitura cromata');
