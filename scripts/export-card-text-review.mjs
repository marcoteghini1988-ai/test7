// Esportazioni di lettura: stessi fondi e stessa tipografia della partita.
// L'inglese/italiano sostituisce le stringhe, non l'illustrazione approvata.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {LOCALIZED_WEAPON_CARD_IDS,cardTextSvgContents} from '../src/cardTextPresentation.js';
import {CARD_TEXT_REGIONS} from '../src/cardTextAssets.js';
const root=process.cwd(),out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
const config=path.join(os.tmpdir(),'eclissi-text-review-'+process.pid+'.xml');
fs.writeFileSync(config,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${path.join(root,'docs/riferimenti-carte/font')}</dir><cachedir>${os.tmpdir()}/eclissi-font-cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=config;
const require=createRequire(import.meta.url),sharp=require('sharp');sharp.cache(false);sharp.concurrency(2);
const embedded=[];
for(const id of LOCALIZED_WEAPON_CARD_IDS){
 const original=path.join(root,'public/assets/fleet-weapon-fronts',id+'.png');
 const base=fs.readFileSync(path.join(root,'public/assets/fleet-weapon-fronts',id+'-text-base.png'));
 const reduced=await sharp(base).resize(1024,1536).png({compressionLevel:9}).toBuffer();
 embedded.push({id,base:'data:image/png;base64,'+reduced.toString('base64')});
 for(const lang of ['en','it']){
  const folder=path.join(out,lang);fs.mkdirSync(folder,{recursive:true});
  const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="3072" height="4608">${cardTextSvgContents(id,lang,id)}</svg>`);
  const raw=await sharp(base).composite([{input:svg}]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const approved=await sharp(original).ensureAlpha().raw().toBuffer();
  // Il compositing premoltiplicato non deve arrotondare i pixel della
  // cornice semitrasparente fuori dai riquadri delle scritte.
  for(let y=0;y<4608;y++)for(let x=0;x<3072;x++)if(!CARD_TEXT_REGIONS.some(r=>x>=r.left&&x<r.left+r.width&&y>=r.top&&y<r.top+r.height)){
   const i=(y*3072+x)*4;approved.copy(raw.data,i,i,i+4);
  }
  fs.writeFileSync(path.join(folder,id+'.png'),await sharp(raw.data,{raw:raw.info}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer());
 }
}
const font=fs.readFileSync(path.join(root,'docs/riferimenti-carte/font/EclissiVettore-Regular.ttf')).toString('base64');
const views=Object.fromEntries(['en','it'].map(lang=>[lang,LOCALIZED_WEAPON_CARD_IDS.map(id=>cardTextSvgContents(id,lang,id))]));
const cards=embedded.map((c,i)=>`<div class="card"><img alt="" src="${c.base}"><svg viewBox="0 0 3072 4608" aria-label="${c.id}" data-index="${i}">${views.en[i]}</svg></div>`).join('');
fs.writeFileSync(path.join(out,'nucleo-carte-testi-traducibili.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Growing Thunder Core Cannon — card text</title><style>@font-face{font-family:'Eclissi Vettore';src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;padding:20px;background:#08111c;color:#e8f1fb;font:15px system-ui}h1{font-size:22px;margin:0 0 12px}select{font:inherit;padding:7px}.cards{display:flex;gap:14px;max-width:1200px;margin:16px auto}.card{position:relative;width:33.333%;aspect-ratio:2/3}.card img,.card svg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.note{max-width:900px;line-height:1.5;color:#bdd1e1}@media(max-width:600px){body{padding:10px}.cards{flex-direction:column;align-items:center}.card{width:min(100%,420px)}}</style><h1>Growing Thunder Core Cannon</h1><label>Card language <select id="language"><option value="en">English</option><option value="it">Italiano</option></select></label><p class="note">Same approved artwork and frames. Changing language updates only the vector text. The PNG downloads are reading exports; the game keeps text and graphics separate. The English names and wording are now the default.</p><section class="cards">${cards}</section><script>const views=${JSON.stringify(views).replaceAll('<','\\u003c')};document.getElementById('language').addEventListener('change',e=>{document.documentElement.lang=e.target.value;document.querySelectorAll('.card svg').forEach((svg,i)=>svg.innerHTML=views[e.target.value][i]);});</script></html>`);
fs.rmSync(config,{force:true});console.log(JSON.stringify({cards:embedded.length,locales:['en','it'],out}));
