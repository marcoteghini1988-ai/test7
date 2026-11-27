// Compone solo anteprime; basi, illustrazioni e testi restano asset separati.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {cardTextSvg,CARD_TEXT_REGIONS} from './card-text.mjs';
const require=createRequire(import.meta.url),root=path.resolve('.'),out=path.resolve(process.argv[2]);
const fc=path.join(os.tmpdir(),'eclissi-batch-font-'+process.pid+'.xml');
fs.writeFileSync(fc,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${root}/docs/riferimenti-carte/font</dir><cachedir>${os.tmpdir()}/eclissi-font-cache</cachedir></fontconfig>`);process.env.FONTCONFIG_FILE=fc;
const sharp=require('sharp');sharp.cache(false);sharp.concurrency(2);
const W=3072,H=4608,refs=path.join(root,'docs/riferimenti-carte'),stickers=path.join(refs,'adesivi-slot-2026-11-24');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest-carte.json'))),slots=JSON.parse(fs.readFileSync(path.join(stickers,'manifest.json'))).rendering.centersPxAt3072Frame;
for(const folder of ['basi-senza-testo','carte-hd','carte-it','livelli-testo/en','livelli-testo/it'])fs.mkdirSync(path.join(out,folder),{recursive:true});
async function scene(c){
 const sky=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2900" height="2265"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#030b16"/><stop offset="1" stop-color="#091527"/></linearGradient></defs><rect width="2900" height="2265" fill="url(#sky)"/></svg>');
 const front=await sharp(c.artPath).resize(2660,1995,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let y=0;y<front.info.height;y++)for(let x=0;x<front.info.width;x++){const fade=Math.min(1,x/28,(front.info.width-1-x)/28,y/28,(front.info.height-1-y)/28);const i=(y*front.info.width+x)*4+3;front.data[i]=Math.round(front.data[i]*Math.max(0,fade));}
 const foreground=await sharp(front.data,{raw:front.info}).png().toBuffer();
 const art=await sharp({create:{width:W,height:H,channels:4,background:'#00000000'}}).composite([{input:sky,left:86,top:598},{input:foreground,left:Math.round((W-front.info.width)/2),top:Math.round(1745-front.info.height/2)}]).png().toBuffer();
 return sharp(art).composite([{input:path.join(out,'maschere',c.raritySlug+'.png'),blend:'dest-in'}]).png().toBuffer();
}
function decoration(c){
 const suffix={Comune:'',Rara:'',Epica:'-rarity-e',Leggendaria:'-rarity-l'}[c.rarity];
 let svg=fs.readFileSync(path.join(root,'asset-sources/card-text/nucleo-folgore/legacy-text/weapon-designed-ionic-nucleo-folgore'+suffix+'.svg'),'utf8').replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,'');
 if(c.rarity==='Comune')for(const [a,b]of [['#fff0d6','#e5edf1'],['#d38c5b','#a9b9c4'],['#f3c393','#d0dce2']])svg=svg.replaceAll(a,b);
 svg=svg.replace('translate(754 3700)','translate(754 3648) scale(.60)');
 return Buffer.from(svg);
}
const category=await sharp(path.join(stickers,'categorie/arma.png')).resize(300,300).toBuffer();
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7);
const cards=manifest.cards.filter(c=>!only||c.kind===only);
if(!cards.length)throw Error('No matching cards');
for(const c of cards){
 if(!c.directionApproved)throw Error('Direction still awaiting approval: '+c.kind);
 if(!fs.existsSync(c.artPath))throw Error('Original illustration missing: '+c.id);
 const icon=c.elementId==='plasma'?'fuoco':'fulmine',element=await sharp(path.join(stickers,'elementi',icon+'.png')).resize(300,300).toBuffer(),statElement=await sharp(path.join(stickers,'elementi',icon+'.png')).resize(170,170).toBuffer();
 const center=slots[c.raritySlug];
 const backing=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="slot"><stop stop-color="#29323b"/><stop offset=".77" stop-color="#131a22"/><stop offset="1" stop-color="#090d13"/></radialGradient></defs>${[center.sinistra,center.destra].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="177" fill="url(#slot)"/>`).join('')}</svg>`);
 const base=await sharp(await scene(c)).composite([{input:backing,left:0,top:0},{input:path.join(refs,'basi-rarita-ufficiali-2026-11-24/arma-rosso',c.raritySlug+'.png'),left:0,top:0},{input:category,left:center.sinistra[0]-150,top:center.sinistra[1]-150},{input:element,left:center.destra[0]-150,top:center.destra[1]-150},{input:decoration(c),left:0,top:0},{input:statElement,left:612,top:3267}]).png({compressionLevel:9}).toBuffer();
 fs.writeFileSync(path.join(out,'basi-senza-testo',c.id+'.png'),base);
 const raw=await sharp(base).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const lang of ['en','it']){
  const svg=cardTextSvg(c,lang);fs.writeFileSync(path.join(out,'livelli-testo',lang,c.id+'.svg'),svg);
  const overlay=await sharp(base).composite([{input:Buffer.from(svg),left:0,top:0}]).ensureAlpha().raw().toBuffer(),pixels=Buffer.from(raw.data);
  for(const r of CARD_TEXT_REGIONS)for(let y=r.top;y<r.top+r.height;y++){const start=(y*W+r.left)*4;overlay.copy(pixels,start,start,start+r.width*4);}
  await sharp(pixels,{raw:raw.info}).png({compressionLevel:9}).toFile(path.join(out,lang==='en'?'carte-hd':'carte-it',c.id+'.png'));
 }
 console.log(JSON.stringify({id:c.id,width:W,height:H,textLayers:['en','it'],default:'en'}));
}
fs.rmSync(fc,{force:true});
