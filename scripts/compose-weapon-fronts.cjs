// Compone anteprime con cornici PNG autentiche; non scrive negli asset giocabili.
// node scripts/compose-weapon-fronts.cjs manifest.json output-dir [test7-root]
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const manifestFile=path.resolve(process.argv[2]);
const batchRoot=path.dirname(manifestFile);
const output=path.resolve(process.argv[3]||path.join(batchRoot,'fronti'));
const root=path.resolve(process.argv[4]||path.join(__dirname,'..'));
const W=3072,H=4608;
const fontConfig=path.join(os.tmpdir(),`eclissi-card-font-${process.pid}.xml`);
fs.writeFileSync(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${path.join(root,'docs/riferimenti-carte/font')}</dir><cachedir>${os.tmpdir()}/eclissi-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=fontConfig;
const sharp=require('sharp');sharp.cache(false);sharp.concurrency(2);
const refs=path.join(root,'docs/riferimenti-carte');
const bases=path.join(refs,'basi-rarita-ufficiali-2026-11-24');
const stickers=path.join(refs,'adesivi-slot-2026-11-24');
const slots=JSON.parse(fs.readFileSync(path.join(stickers,'manifest.json'))).rendering.centersPxAt3072Frame;
const colors={comune:['#e5edf1','#a9b9c4','#d0dce2'],rara:['#fff0d6','#d38c5b','#f3c393'],epica:['#ffffff','#8799a9','#e4edf4'],leggendaria:['#ffffff','#74dafa','#d99ff3']};
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,size,s,cls='')=>`<text x="${x}" y="${y}" font-size="${size}" class="${cls}">${xml(s)}</text>`;
function characteristics(c,color){
 const recovery=c.recoveryPercent!=null;
 const panel=c.panel||{};
 const customRight=panel.rightLabel?text(2056,3547,panel.rightLabelSize||78,panel.rightLabel,'minor')+
  panel.rightLines.map((line,index)=>text(2056,panel.rightLines.length===1?3700:3652+index*100,
   panel.rightValueSize||100,line,'strong')).join(''):null;
 return `<g filter="url(#soft)">
  <path d="M655 3482H2417M660 3817H2412" fill="none" stroke="${color[2]}" stroke-width="5" opacity=".57"/>
  <path d="M1536 3468L1550 3482L1536 3496L1522 3482ZM1536 3803L1550 3817L1536 3831L1522 3817Z" fill="${color[0]}" opacity=".82"/>
  ${text(1045,3202,85,'ELEMENT','minor')}${text(1158,3355,102,'METAL','strong')}
  ${text(2024,3202,88,'DURATION','minor')}
  <g transform="translate(1752 3352)"><circle r="79" fill="#13223a" fill-opacity=".34" stroke="${color[2]}" stroke-width="10"/>
   <path d="M0-50V0L33 23" fill="none" stroke="${color[0]}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle r="9" fill="${color[0]}"/></g>
  ${text(1930,3355,152,c.duration,'number')}${text(2220,3355,104,c.duration===1?'TURN':'TURNS','strong')}
  ${text(1042,3547,panel.damageLabel?78:88,panel.damageLabel||'BASE DAMAGE','minor')}
  <g transform="translate(754 3700)"><path d="M-91-42L-47-81L-18-44L20-96L52-42L94-22L52 7L82 54L30 52L10 96L-20 56L-63 72L-63 34L-97 8L-59-15Z" fill="url(#material)" stroke="#182535" stroke-width="9" stroke-linejoin="round"/><circle r="21" fill="${color[0]}" stroke="#263c52" stroke-width="7"/></g>
  ${text(1114,3700,159,c.damage+' HP','number')}
  ${recovery?text(2056,3547,82,'REAL HULL LOSS','minor')+
   `<g transform="translate(1830 3668)"><path d="M-26 0H26M0-26V26" fill="none" stroke="#121a23" stroke-width="22"/><path d="M-26 0H26M0-26V26" fill="none" stroke="${color[0]}" stroke-width="12"/></g>`+
   text(2056,3668,130,c.recoveryPercent,'number')+
   `<g transform="translate(2290 3668)" fill="none" stroke="${color[0]}" stroke-width="11"><path d="M-29 36L29-36"/><circle cx="-24" cy="-29" r="14"/><circle cx="24" cy="29" r="14"/></g>`+
   text(1860,3770,70,'MAX','strong')+
   `<path d="M1985 3750V3790M1965 3770H2005" stroke="${color[0]}" stroke-width="8"/>`+
   text(2180,3770,70,c.maxBonus+' HP','strong'):
   customRight||text(2056,3547,82,'DEFENSES / TERRAIN','minor')+text(2056,3700,126,'APPLY','strong')}
  <g transform="translate(735 3933)"><circle r="61" fill="none" stroke="${color[2]}" stroke-width="13"/><circle r="16" fill="${color[0]}"/><path d="M0-92V-46M0 46V92M-92 0H-46M46 0H92" stroke="${color[0]}" stroke-width="13" stroke-linecap="round"/></g>
  ${text(1138,3933,panel.targets?108:115,panel.targets||'1 TARGET','strong')}<circle cx="1536" cy="3933" r="10" fill="${color[0]}" opacity=".85"/>
  <g transform="translate(1740 3933)"><path d="M-80-29H-17L32-63L84 0L32 63L-17 29H-80M-101-60H-59M-104 59H-62" fill="none" stroke="${color[2]}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/></g>
  ${text(panel.action?2160:2076,3933,panel.action?95:recovery?104:115,panel.action||(recovery?'1 / TURN':'1 SHOT'),'strong')}
 </g>`;
}
function labels(c){
 const color=colors[c.raritySlug],prism=c.raritySlug==='leggendaria';
 return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
  <linearGradient id="material" x1="0" y1="0" x2="${prism?'1':'.35'}" y2="${prism?'0':'1'}">${prism?'<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>':`<stop stop-color="${color[0]}"/><stop offset=".52" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[2]}"/>`}</linearGradient>
  <filter id="soft"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter>
  <style>text{font-family:'Eclissi Vettore',sans-serif;text-anchor:middle;dominant-baseline:middle;fill:url(#material);stroke:#121a23;stroke-width:7;paint-order:stroke fill;letter-spacing:1px}.strong{stroke-width:9;font-weight:600}.number{stroke-width:12;font-weight:600}.minor{stroke-width:7;letter-spacing:4px}</style>
 </defs><g filter="url(#soft)">${text(1536,416,102,c.titleLines[0])}${text(1536,502,105,c.titleLines[1])}${text(1536,2925,91,'WEAPON')}${text(1536,4250,91,c.rarityLabel)}</g>${characteristics(c,color)}</svg>`);
}
function backing(centers){return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="slot"><stop stop-color="#29323b"/><stop offset=".77" stop-color="#131a22"/><stop offset="1" stop-color="#090d13"/></radialGradient></defs>${[centers.sinistra,centers.destra].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="177" fill="url(#slot)"/>`).join('')}</svg>`);}
async function scene(c){
 const file=path.resolve(batchRoot,c.artPath);
 let blurred=await sharp(file).resize(2900,2265,{fit:'cover'}).blur(28).toBuffer();
 if(c.recoveryPercent!=null||c.cleanBackdrop){
  // Cielo senza copie delle alette in alto; il piano originale prosegue in basso.
  const sky=await sharp(file).extract({left:0,top:0,width:c.cleanBackdrop?24:110,height:c.cleanBackdrop?220:560}).resize(2900,1040,{fit:'fill'}).blur(50).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let y=0;y<sky.info.height;y++)for(let x=0;x<sky.info.width;x++)sky.data[(y*sky.info.width+x)*4+3]=Math.round(255*Math.max(0,Math.min(1,(sky.info.height-1-y)/160)));
  const skyLayer=await sharp(sky.data,{raw:sky.info}).png().toBuffer();
  blurred=await sharp(blurred).composite([{input:skyLayer,left:0,top:0}]).png().toBuffer();
 }
 const front=await sharp(file).resize(2660,1995,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let y=0;y<front.info.height;y++)for(let x=0;x<front.info.width;x++){
  const fade=Math.min(1,x/28,(front.info.width-1-x)/28,y/28,(front.info.height-1-y)/28);
  const i=(y*front.info.width+x)*4+3;front.data[i]=Math.round(front.data[i]*Math.max(0,fade));
 }
 const foreground=await sharp(front.data,{raw:front.info}).png().toBuffer();
 const layer=await sharp({create:{width:W,height:H,channels:4,background:'#00000000'}}).composite([
  {input:blurred,left:86,top:598},{input:foreground,left:Math.round((W-front.info.width)/2),top:Math.round(1745-front.info.height/2)}
 ]).png().toBuffer();
 // La maschera è il foro originale della cornice, non una sagoma inventata.
 return sharp(layer).composite([{input:path.join(batchRoot,'maschere',c.raritySlug+'.png'),blend:'dest-in'}]).png().toBuffer();
}
async function main(){
 const manifest=JSON.parse(fs.readFileSync(manifestFile));
 if(manifest.status!=='anteprime complete in attesa di approvazione grafica')throw Error('Manifest non marcato come anteprima');
 fs.mkdirSync(output,{recursive:true});fs.mkdirSync(path.join(batchRoot,'livelli-testo'),{recursive:true});
 const category=await sharp(path.join(stickers,'categorie/arma.png')).resize(300,300).toBuffer();
 const element=await sharp(path.join(stickers,'elementi/metallo.png')).resize(300,300).toBuffer();
 const statElement=await sharp(path.join(stickers,'elementi/metallo.png')).resize(170,170).toBuffer();
 for(const c of manifest.cards.filter(card=>(!process.argv[5]||card.familyId===process.argv[5])&&
  (!process.argv[6]||card.id===process.argv[6]))){
  const center=slots[c.raritySlug],type=labels(c),art=await scene(c);
  fs.writeFileSync(path.join(batchRoot,'livelli-testo',c.id+'.svg'),type);
  const result=await sharp(art).composite([
   {input:backing(center),left:0,top:0},{input:path.join(bases,c.raritySlug+'.png'),left:0,top:0},
   {input:category,left:center.sinistra[0]-150,top:center.sinistra[1]-150},
   {input:element,left:center.destra[0]-150,top:center.destra[1]-150},
   {input:type,left:0,top:0},{input:statElement,left:612,top:3267}
  ]).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
  const target=path.join(output,c.id+'.png');fs.writeFileSync(target,result);
  console.log(JSON.stringify({id:c.id,path:target,width:W,height:H,bytes:result.length}));
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(fontConfig,{force:true}));
