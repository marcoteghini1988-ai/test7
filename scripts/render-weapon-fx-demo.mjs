// Prova delle quattro rarità approvate del Maglio, con impatti del motore reale.
// node scripts/render-weapon-fx-demo.mjs
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolve} from 'node:path';
import {createMaglioReviewBattle} from './maglioReviewBattle.js';
import {resolvePreparedFleetTurn,autoFleetTurn} from '../src/fleetNext/combat.js';
import {MAGLIO_VARIANTS,fleetWeaponShots,weaponEffectProfile,MAGLIO_PROJECTILE_ATLAS,MAGLIO_ATLAS_SIZE}
 from '../src/maglioBattleVisuals.js';

const require=createRequire(import.meta.url),sharp=require('sharp');
const atlasData='data:image/png;base64,'+(await readFile(resolve('public'+MAGLIO_PROJECTILE_ATLAS))).toString('base64');
const out=resolve('docs/collaudi/effetti-2026-11-24');
const aim={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function actualShots(id){
 const b=createMaglioReviewBattle({cardId:id,nowMs:0});
 const player=resolvePreparedFleetTurn(b,'A',aim,1000);
 if(!player.ok)throw Error(id+' non giocabile: '+player.reason);
 const shotA=fleetWeaponShots(player.events).find(s=>s.cardId===id&&s.fires);
 const enemy=resolvePreparedFleetTurn(player.battle,'B',autoFleetTurn(player.battle,'B'),4000);
 if(!enemy.ok)throw Error(id+' IA non giocabile: '+enemy.reason);
 const shotB=fleetWeaponShots(enemy.events).find(s=>s.cardId===id&&s.fires);
 if(!shotA||!shotB)throw Error(id+' senza impatti effettivi su entrambi i lati');
 return {id,profile:weaponEffectProfile(id),shotA,shotB};
}
function projectile(p){
 const c=p.core,g=p.glow,s=p.secondary;
 switch(p.kind){
  case 'gravity-maul':return `<g transform="rotate(-66)"><svg x="${-p.spriteSize*.64}" y="${-p.spriteSize*.54}"
   width="${p.spriteSize}" height="${p.spriteSize*610/MAGLIO_ATLAS_SIZE.cellWidth}"
   viewBox="${p.spriteCell*MAGLIO_ATLAS_SIZE.cellWidth} 175 ${MAGLIO_ATLAS_SIZE.cellWidth} 610" overflow="hidden">
   <image href="${atlasData}" width="${MAGLIO_ATLAS_SIZE.width}" height="${MAGLIO_ATLAS_SIZE.height}"/></svg></g>`;
  case 'arc':return `<path d="M0-26L-8-7L1-9L-6 18L10-3L1-1L9-24Z" fill="${c}" stroke="${g}" stroke-width="2"/>`;
  case 'flame':return `<path d="M0-27C14-10 16 0 8 18C3 26-6 26-10 15C-16 3-6-13 0-27Z" fill="${g}" stroke="${c}" stroke-width="2"/><path d="M1-11Q9 2 2 15Q-6 10 1-11Z" fill="${c}"/>`;
  case 'wave':return `<path d="M0-26C16-7 19 3 11 17Q0 28-11 17C-19 3-16-7 0-26Z" fill="${g}" stroke="${c}" stroke-width="2"/><path d="M-9 6Q0-2 9 6M-8 13Q0 5 8 13" fill="none" stroke="${c}" stroke-width="2"/>`;
  case 'crystal':return `<path d="M0-28L11-5L5 19L0 25L-5 19L-11-5Z" fill="${g}" stroke="${c}" stroke-width="2"/><path d="M0-28V25M-11-5L0 0L11-5" fill="none" stroke="${c}" stroke-width="1.8"/>`;
  case 'vortex':return `<path d="M-14 15Q-23-9 0-22Q19-22 14-7Q10 1-2-3Q-8-7-1-13" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/><circle r="4" fill="${g}"/>`;
  case 'ray':return `<path d="M0-29L8 9L0 25L-8 9Z" fill="${c}" stroke="${g}" stroke-width="2"/><path d="M-15 3H15M-11-12L11 12M11-12L-11 12" stroke="${s}" stroke-width="1.3"/>`;
  case 'rift':return `<ellipse rx="13" ry="23" fill="#151328" stroke="${g}" stroke-width="3"/><path d="M0-24L-4-5L3 2L-2 22" fill="none" stroke="${c}" stroke-width="3"/>`;
  case 'lens':return `<ellipse rx="17" ry="22" fill="#322646" stroke="${g}" stroke-width="2"/><ellipse rx="10" ry="17" fill="none" stroke="${c}" stroke-width="2"/><circle r="5" fill="${c}"/>`;
  default:return `<path d="M0-25L12-4L6 17L0 24L-7 15L-11-6Z" fill="${g}" stroke="${c}" stroke-width="2"/><path d="M0-24L1 20M-11-6L12-4" fill="none" stroke="${s}" stroke-width="1.8"/>`;
 }
}
function movingShot(profile,who,t,start,fromY,toY){
 const age=t-start;if(age<0||age>(profile.flightMs+profile.impactMs)/1000)return '';
 const duration=profile.flightMs/1000,travel=clamp(age/duration,0,1),y=fromY+(toY-fromY)*travel;
 const angle=who==='A'?0:180,head=who==='A'?1:-1;
 const bands=profile.kind==='gravity-maul'?'':Array.from({length:profile.trailBands},(_,i)=>
  `<path d="M${-4-i*3} ${20+i*3}Q0 ${35+i*8} ${4+i*3} ${20+i*3}" fill="none" stroke="${i%2?profile.secondary:profile.glow}" stroke-width="${Math.max(1,2-i*.25)}" opacity="${.78-i*.15}"/>`).join('');
 const flash=age<.26?`<g transform="translate(225 ${who==='A'?696:24})" opacity="${1-age/.26}">
  <ellipse rx="24" ry="9" fill="${profile.glow}"/><ellipse rx="9" ry="4" fill="${profile.core}"/></g>`:'';
 const flight=age<duration?`<g transform="translate(225 ${y}) rotate(${angle}) scale(${profile.scale})" filter="url(#glow)">
  <path d="M0 16V${19+profile.trailBands*12}" stroke="${profile.glow}" stroke-width="5" opacity=".35"/>
  ${bands}${projectile(profile)}</g>`:'';
 const impactAge=age-duration,opacity=clamp(1-impactAge/(profile.impactMs/1000),0,1);
 const impact=impactAge>=0&&opacity>0?`<g transform="translate(225 ${toY}) scale(${profile.impactScale})" opacity="${opacity}">
  <ellipse rx="46" ry="34" fill="${profile.glow}" opacity="${opacity*.22}"/>
  ${Array.from({length:profile.impactRings},(_,i)=>`<ellipse rx="${(20+i*8)*(1+impactAge*.95)}" ry="${(13+i*5)*(1+impactAge*.95)}" fill="none" stroke="${i%2?profile.secondary:profile.core}" stroke-width="${Math.max(1,2.2-i*.25)}"/>`).join('')}
  ${Array.from({length:4+profile.tier*2},(_,i)=>{const a=i*2*Math.PI/(4+profile.tier*2),x=Math.cos(a),yy=Math.sin(a);return `<path d="M${x*14} ${yy*9}L${x*(31+profile.tier*4)} ${yy*(21+profile.tier*3)}" stroke="${i%2?profile.secondary:profile.core}" stroke-width="1.4"/>`;}).join('')}
 </g>`:'';
 return flash+flight+impact;
}
function ship(y,enemy){
 return `<g transform="translate(225 ${y})" opacity=".92"><path d="M0 ${enemy?-28:28}L-38 ${enemy?17:-17}L-13 ${enemy?9:-9}L0 ${enemy?15:-15}L13 ${enemy?9:-9}L38 ${enemy?17:-17}Z" fill="#213848" stroke="#769aa7" stroke-width="2"/>
  <path d="M-8 0L0 ${enemy?11:-11}L8 0" fill="#78d6f0" opacity=".7"/></g>`;
}
function frame(body,width=1600,height=900){
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1280 720">
 <defs><linearGradient id="bg" x2="0" y2="1"><stop stop-color="#07101d"/><stop offset=".5" stop-color="#112334"/><stop offset="1" stop-color="#050b13"/></linearGradient>
 <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
 <rect width="100%" height="100%" fill="#03070d"/>${body}</svg>`;
}
function maglioPanel(example,i,t,thumb){
 const {profile,shotA,shotB}=example,x=i*320;
 const title=t<3.15?'IL TUO COLPO':'COLPO AVVERSARIO';
 const blastA=movingShot(profile,'A',t,1.1,732,184);
 const blastB=movingShot(profile,'B',t,3.4,-12,547);
 return `<g transform="translate(${x} 0)">
  <rect x="5" y="6" width="310" height="708" rx="22" fill="url(#bg)" stroke="${profile.glow}" stroke-width="2"/>
  <path d="M225 0V720" stroke="${profile.glow}" stroke-width="1" stroke-dasharray="3 22" opacity=".22"/>
  <text x="160" y="37" text-anchor="middle" fill="${profile.core}" font-family="sans-serif" font-size="21" font-weight="700">${esc(profile.rarity.toUpperCase())}</text>
  <text x="160" y="62" text-anchor="middle" fill="#adbdca" font-family="sans-serif" font-size="12">${title}</text>
  ${ship(184,true)}${ship(547,false)}
  <text x="225" y="132" text-anchor="middle" fill="#d5e8ed" font-family="sans-serif" font-size="12">NAVE AVVERSARIA</text>
  <text x="225" y="608" text-anchor="middle" fill="#d5e8ed" font-family="sans-serif" font-size="12">LE TUE NAVI</text>
  <image href="${thumb}" x="14" y="347" width="124" height="186"/>
  <text x="76" y="552" text-anchor="middle" fill="${profile.core}" font-family="sans-serif" font-size="12">${t<3.15?shotA.actualDamage:shotB.actualDamage} HP REALI</text>
  <path d="M205 710H245M214 705H236" stroke="${profile.core}" stroke-width="3" stroke-linecap="round"/>
  <path d="M205 10H245M214 15H236" stroke="${profile.core}" stroke-width="3" stroke-linecap="round"/>
  ${blastA}${blastB}
 </g>`;
}
async function png(svg){return sharp(Buffer.from(svg),{density:72}).png().toBuffer();}
async function video(file,duration,draw){
 const fps=12,count=Math.round(duration*fps);
 const ffmpeg=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe',
  '-framerate',String(fps),'-vcodec','png','-i','pipe:0','-c:v','libx264','-preset','medium',
  '-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',file],{stdio:['pipe','ignore','pipe']});
 let errors='';ffmpeg.stderr.on('data',b=>errors+=b);
 for(let n=0;n<count;n++){
  const bytes=await png(draw(n/fps));
  if(!ffmpeg.stdin.write(bytes))await once(ffmpeg.stdin,'drain');
 }
 ffmpeg.stdin.end();const [exit]=await once(ffmpeg,'close');
 if(exit!==0)throw Error('ffmpeg '+exit+': '+errors);
}
await mkdir(out,{recursive:true});
const maglio=MAGLIO_VARIANTS.map(v=>actualShots(v.id));
const thumbs=await Promise.all(maglio.map(async example=>{
 const bytes=await sharp(resolve('public/assets/fleet-weapon-fronts',example.id+'.png'))
  .resize(124,186).jpeg({quality:84}).toBuffer();
 return 'data:image/jpeg;base64,'+bytes.toString('base64');
}));
const maglioDraw=t=>frame(maglio.map((example,i)=>maglioPanel(example,i,t,thumbs[i])).join(''));
await writeFile(out+'/maglio-quattro-rarita-preview.png',await png(maglioDraw(1.48)));
await video(out+'/maglio-quattro-rarita-due-direzioni.mp4',6.1,maglioDraw);
await writeFile(out+'/verifica.json',JSON.stringify({
 maglio:maglio.map(({id,profile,shotA,shotB})=>({id,rarity:profile.rarity,
  visualKind:profile.kind,trailBands:profile.trailBands,impactRings:profile.impactRings,
  actualDamageA:shotA.actualDamage,actualDamageB:shotB.actualDamage}))
},null,2)+'\n');
console.log('Demo creati in '+out);
