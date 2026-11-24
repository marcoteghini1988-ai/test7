// Ricompone il Maglio Ferrogravitazionale dalle sorgenti: arte, cornice, adesivi e testo.
// `node scripts/build-maglio-fronts.cjs [cartella-output]` (richiede sharp;
// se manca nell'ambiente grafico: `npm install --no-save sharp`).
// Il testo inglese breve è un livello SVG separato: si può localizzare senza
// ridisegnare illustrazione, cornice o adesivi.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs/riferimenti-carte/maglio-ferrogravitazionale-2026-11-24');
const BASES = path.join(ROOT, 'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24');
const STICKERS = path.join(ROOT, 'docs/riferimenti-carte/adesivi-slot-2026-11-24');
const OUTPUT = path.resolve(process.argv[2] || path.join(ROOT, 'public/assets/fleet-weapon-fronts'));
const W = 3072, H = 4608;

const fontDir = path.join(ROOT, 'docs/riferimenti-carte/font');
const config = path.join(os.tmpdir(), `eclissi-fontconfig-${process.pid}.xml`);
fs.writeFileSync(config, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${fontDir}</dir><cachedir>${os.tmpdir()}/fontconfig-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = config;
const sharp = require('sharp');

const cards = [
  {rarity:'comune',label:'COMMON',id:'weapon-confirmed-metallic-maglio',damage:18,
   color:['#e5edf1','#a9b9c4','#d0dce2'],geometry:'Scocca grafite e testa a quattro segmenti'},
  {rarity:'rara',label:'RARE',id:'weapon-confirmed-metallic-maglio-rarity-r',damage:46,
   color:['#fff0d6','#d38c5b','#f3c393'],geometry:'Stabilizzatori giroscopici e collare in bronzo'},
  {rarity:'epica',label:'EPIC',id:'weapon-confirmed-metallic-maglio-rarity-e',damage:109,
   color:['#fff','#8799a9','#e4edf4'],geometry:'Anelli di compressione e piastre in argento'},
  {rarity:'leggendaria',label:'LEGENDARY',id:'weapon-confirmed-metallic-maglio-rarity-l',damage:154,
   color:['#fff','#74dafa','#d99ff3'],geometry:'Gabbia articolata a quattro lame di cristallo prismatico'}
];

function xml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function text(x,y,size,value,extra='') {
  return `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${xml(value)}</text>`;
}
function characteristics({color,damage}) {
  // Griglia della prova confermata Condensatore della Tempesta Stellare:
  // fascia 1: due campi, fascia 2: due campi, fascia 3: bersaglio e colpo.
  // Cambia solo il contenuto del campo, mai il suo posto nella scheda.
  return `<g filter="url(#soft)">
    <path d="M655 3482 H2417 M660 3817 H2412" fill="none" stroke="${color[2]}" stroke-width="5" opacity=".57"/>
    <path d="M1536 3468 L1550 3482 L1536 3496 L1522 3482 Z M1536 3803 L1550 3817 L1536 3831 L1522 3817 Z" fill="${color[0]}" opacity=".82"/>

    ${text(1045,3202,85,'ELEMENT','class="minor"')}
    ${text(1158,3355,102,'METAL','class="strong"')}
    ${text(2024,3202,88,'DURATION','class="minor"')}
    <g transform="translate(1752 3352)">
      <circle r="79" fill="#13223a" fill-opacity=".34" stroke="${color[2]}" stroke-width="10"/>
      <path d="M0 -50 V0 L33 23" fill="none" stroke="${color[0]}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
      <circle r="9" fill="${color[0]}"/>
    </g>
    ${text(1930,3355,152,'1','class="number"')}
    ${text(2220,3355,104,'TURN','class="strong"')}

    ${text(1042,3547,88,'BASE DAMAGE','class="minor"')}
    <g transform="translate(754 3700)">
      <path d="M-91 -42 L-47 -81 L-18 -44 L20 -96 L52 -42 L94 -22 L52 7 L82 54 L30 52 L10 96 L-20 56 L-63 72 L-63 34 L-97 8 L-59 -15 Z" fill="url(#material)" stroke="#182535" stroke-width="9" stroke-linejoin="round"/>
      <circle r="21" fill="${color[0]}" stroke="#263c52" stroke-width="7"/>
    </g>
    ${text(1114,3700,159,`${damage} HP`,'class="number"')}
    ${text(2056,3547,82,'DEFENSES / TERRAIN','class="minor"')}
    ${text(2056,3700,126,'APPLY','class="strong"')}

    <g transform="translate(735 3933)">
      <circle r="61" fill="none" stroke="${color[2]}" stroke-width="13"/>
      <circle r="16" fill="${color[0]}"/>
      <path d="M0 -92 V-46 M0 46 V92 M-92 0 H-46 M46 0 H92" stroke="${color[0]}" stroke-width="13" stroke-linecap="round"/>
    </g>
    ${text(1138,3933,115,'1 TARGET','class="strong"')}
    <circle cx="1536" cy="3933" r="10" fill="${color[0]}" opacity=".85"/>
    <g transform="translate(1740 3933)">
      <path d="M-80 -29 H-17 L32 -63 L84 0 L32 63 L-17 29 H-80 M-101 -60 H-59 M-104 59 H-62" fill="none" stroke="${color[2]}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>
    </g>
    ${text(2076,3933,115,'1 SHOT','class="strong"')}
  </g>`;
}
function labels({color,damage,label,rarity}) {
  // Limiti HD approvati: nome (690,365)-(2380,545); categoria (1100,2870)-(1972,2980);
  // caratteristiche (450,3160)-(2620,4050); rarità (1120,4195)-(1952,4305).
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="material" x1="0" x2="${rarity==='leggendaria'?'1':'0.35'}" y1="0" y2="${rarity==='leggendaria'?'0':'1'}">
        ${rarity==='leggendaria'
          ? '<stop stop-color="#ffffff"/><stop offset=".2" stop-color="#80e5ff"/><stop offset=".46" stop-color="#ffffff"/><stop offset=".78" stop-color="#e5b4fa"/><stop offset="1" stop-color="#ffffff"/>'
          : `<stop stop-color="${color[0]}"/><stop offset=".52" stop-color="${color[1]}"/><stop offset="1" stop-color="${color[2]}"/>`}
      </linearGradient>
      <filter id="soft"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#070e17" flood-opacity=".85"/></filter>
      <style>
        text {font-family:'Eclissi Vettore',sans-serif;text-anchor:middle;dominant-baseline:middle;
          fill:url(#material);stroke:#121a23;stroke-width:7;paint-order:stroke fill;letter-spacing:1px}
        .strong {stroke-width:9;font-weight:600}
        .number {stroke-width:12;font-weight:600}
        .minor {stroke-width:7;letter-spacing:4px}
      </style>
    </defs>
    <g filter="url(#soft)">
      ${text(1536,416,102,'FERROGRAVITATIONAL')}
      ${text(1536,502,105,'MAUL')}
      ${text(1536,2925,91,'WEAPON')}
      ${text(1536,4250,91,label)}
    </g>
    ${characteristics({color,damage})}
  </svg>`);
}
function slotBacking(left,right) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><radialGradient id="slot"><stop stop-color="#29323b"/><stop offset=".77" stop-color="#131a22"/><stop offset="1" stop-color="#090d13"/></radialGradient></defs>
    <circle cx="${left[0]}" cy="${left[1]}" r="177" fill="url(#slot)"/>
    <circle cx="${right[0]}" cy="${right[1]}" r="177" fill="url(#slot)"/>
  </svg>`);
}
async function imageScene(file) {
  // L'arma intera rimane visibile. Un fondale sfocato riempie il formato del riquadro,
  // mentre la scena nitida sfuma ai bordi, senza stirare o tagliare la testa.
  const blurred = await sharp(file).resize(2900,2265,{fit:'cover'}).blur(30).toBuffer();
  const foreground = await sharp(file).resize(2900,1933,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {data,info} = foreground;
  for(let y=0;y<info.height;y++) {
    const opacity = Math.min(1,y/155,(info.height-1-y)/155);
    for(let x=0;x<info.width;x++) data[(y*info.width+x)*4+3] = Math.round(255*Math.max(0,opacity));
  }
  const art = await sharp(data,{raw:info}).png().toBuffer();
  return sharp({create:{width:W,height:H,channels:4,background:{r:0,g:0,b:0,alpha:0}}})
    .composite([{input:blurred,left:86,top:598},{input:art,left:86,top:764}]).png().toBuffer();
}
async function main() {
  fs.mkdirSync(OUTPUT,{recursive:true});
  const manifest = JSON.parse(fs.readFileSync(path.join(STICKERS,'manifest.json')));
  const arma = await sharp(path.join(STICKERS,'categorie/arma.png')).resize(300,300).toBuffer();
  const metal = await sharp(path.join(STICKERS,'elementi/metallo.png')).resize(300,300).toBuffer();
  const panelMetal = await sharp(path.join(STICKERS,'elementi/metallo.png')).resize(170,170).toBuffer();
  for(const card of cards) {
    const centers=manifest.rendering.centersPxAt3072Frame[card.rarity];
    const scene=await imageScene(path.join(SOURCE,'illustrazioni',card.rarity+'.png'));
    const layer=labels(card);
    // Il testo rimane modificabile e separato dalle quattro sorgenti visive.
    fs.writeFileSync(path.join(SOURCE,`testo-${card.rarity}.svg`),layer);
    const face=await sharp(scene).composite([
      {input:slotBacking(centers.sinistra,centers.destra),left:0,top:0},
      {input:path.join(BASES,card.rarity+'.png'),left:0,top:0},
      {input:arma,left:centers.sinistra[0]-150,top:centers.sinistra[1]-150},
      {input:metal,left:centers.destra[0]-150,top:centers.destra[1]-150},
      {input:layer,left:0,top:0},
      {input:panelMetal,left:612,top:3267}
    ]).png({compressionLevel:9}).toBuffer();
    const target=path.join(OUTPUT,card.id+'.png');
    fs.writeFileSync(target,face);
    console.log(`${card.rarity}: ${target} — ${card.geometry}`);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(config,{force:true}));
