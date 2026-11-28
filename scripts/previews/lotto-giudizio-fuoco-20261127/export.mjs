// This exported study uses combat events; it is not a StackBlitz match capture.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {batchCases} from './sequence.mjs';
import {drawBatchReview} from './batch-visuals.mjs';
import {batchDuration,batchFramePlan} from './batch-spec.mjs';
import {batchAudioCues,synthesizeBatchAudio} from './batch-audio.mjs';
import {cardWords} from './card-text.mjs';
const require=createRequire(import.meta.url),sharp=require('sharp'),{createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas'),{build}=require('esbuild');
const root=path.resolve('.'),out=path.resolve(process.argv[2]),manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest-carte.json'))),cases=batchCases(),assets={cards:{},hulls:{}},embedded={};
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Eclissi Preview');
async function asset(key,file,size){
 const bytes=await sharp(file).resize(...size,{fit:'inside'}).png().toBuffer();embedded[key]='data:image/png;base64,'+bytes.toString('base64');if(key.startsWith('base:'))return;
 const im=await loadImage(bytes);if(key.startsWith('card:'))assets.cards[key.slice(5)]=im;else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=im;else assets[key]=im;
}
await asset('arena',path.join(root,'public/assets/mathduel/arena_titanio_9x16.webp'),[900,1600]);
await asset('defense',path.join(root,'docs/riferimenti-carte/adesivi-slot-2026-11-24/categorie/difesa.png'),[100,100]);
await asset('energy',path.join(root,'docs/riferimenti-carte/adesivi-slot-2026-11-24/elementi/fuoco.png'),[100,100]);
await asset('magma',path.join(root,'asset-sources/weapon-previews/lotto-giudizio-fuoco-2026-11-27/effects/magma-orb.png'),[512,512]);
for(const c of manifest.cards){await asset('card:'+c.id,path.join(out,'carte-hd',c.id+'.png'),[520,780]);await asset('base:'+c.id,path.join(out,'basi-senza-testo',c.id+'.png'),[620,930]);}
const models=new Set(cases.flatMap(s=>Object.values(s.initial.sides).flatMap(side=>[side.ships[0].id,...side.escorts.map(e=>e.shipModelId)])));
for(const who of ['A','B'])for(const id of models){const base=path.join(root,'public/assets/mathfleet/views',who==='A'?'player_to_enemy':'enemy_to_player',id+'_complete');await asset('hull:'+who+':'+id,fs.existsSync(base+'.png')?base+'.png':base+'.webp',[400,400]);}
const miniSide=s=>({ships:s.ships.map(x=>({id:x.id,hp:x.hp,maxHp:x.maxHp})),escorts:s.escorts.map(x=>({id:x.id,shipModelId:x.shipModelId,hp:x.hp,maxHp:x.maxHp,destroyed:x.destroyed})),energyPile:s.energyPile});
const miniBattle=b=>({ply:b.ply,sides:{A:miniSide(b.sides.A),B:miniSide(b.sides.B)}});
const data={assets:embedded,cases:cases.map(s=>({...s,initial:miniBattle(s.initial),frames:s.frames.map(f=>({...f,initial:miniBattle(f.initial),presentationInitial:miniBattle(f.presentationInitial),battle:undefined}))})),cards:manifest.cards.map(c=>({id:c.id,names:{en:cardWords(c,'en').name,it:cardWords(c,'it').name},text:Object.fromEntries(['en','it'].map(l=>[l,fs.readFileSync(path.join(out,'livelli-testo',l,c.id+'.svg'),'utf8')]))}))};
const bundle=await build({entryPoints:[path.join(root,'scripts/previews/lotto-giudizio-fuoco-20261127/browser.mjs')],bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,write:false});
const font=fs.readFileSync(path.join(root,'docs/riferimenti-carte/font/EclissiVettore-Regular.ttf')).toString('base64');
const html=`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eclissi Stellare — sei Armi</title><style>@font-face{font-family:'Eclissi Vettore';src:url(data:font/ttf;base64,${font}) format('truetype')}*{box-sizing:border-box}body{margin:0;background:#07101b;color:#e4f1fc;font:15px system-ui}main{max-width:1480px;margin:auto;padding:20px}h1{margin:0 0 8px;font-size:25px}p{line-height:1.5;color:#bfd2e6}.layout{display:grid;grid-template-columns:minmax(280px,430px) 1fr;gap:22px}canvas{width:100%;display:block;border-radius:12px}button,select{font:inherit;padding:9px;border-radius:8px;background:#153047;color:#f1f8ff;border:1px solid #658096;margin:4px;max-width:100%}button{cursor:pointer}label{display:inline-block;margin:8px;font-size:13px}#cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.face{position:relative;aspect-ratio:2/3}.face>img{width:100%;height:100%;display:block}.words,.words>svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}#seek{width:100%}.badge{color:#f3d195;font-size:12px}@media(max-width:1000px){.layout{grid-template-columns:1fr}canvas{max-width:430px;margin:auto}#cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:550px){#cards{grid-template-columns:1fr}article{max-width:430px;margin:auto}}</style><main><div class="badge">TRE DIREZIONI APPROVATE · SEI FRONTI DA REVISIONARE</div><h1>Cannone Quervaldissio · Mortaio Magmatico · Turbina Svarquendica</h1><p>Sei carte complete e ${cases.length} sequenze con eventi del motore. È uno studio dell’effetto, distinto dalla partita su StackBlitz.</p><div class="layout"><section><canvas width="900" height="1600" aria-label="Anteprima degli effetti"></canvas><input id="seek" type="range" min="0" max="15600" step="10" value="0" aria-label="Istante dell’animazione"></section><section><select id="case" aria-label="Caso"></select><div><button id="play">Riproduci dall’inizio</button><button id="pause">Pausa</button></div><label><input id="mute" type="checkbox">Silenzioso</label><label>Volume <input id="volume" type="range" min="0" max="1" step=".05" value=".7"></label><label><input id="haptic" type="checkbox">Vibrazione, se supportata</label><p>Quervaldissio: tre anelli, un attacco alla posa. Mortaio: sfere di magma, un colpo base e fino a due extra pagati. Svarquendica: un getto per turno per due turni e Bruciatura soltanto dagli eventi reali. Difesa, danni e cariche seguono la risoluzione effettiva.</p><label>Lingua carte <select id="locale"><option value="en">English</option><option value="it">Italiano</option></select></label><div id="cards"></div><p>La lingua cambia soltanto il livello testo. La vibrazione fisica richiede una verifica su telefono compatibile.</p></section></div></main><script>window.BATCH_REVIEW=${JSON.stringify(data).replaceAll('<','\\u003c')}</script><script type="module">${bundle.outputFiles[0].text.replaceAll('</script','<\\/script')}</script></html>`;
fs.writeFileSync(path.join(out,'sei-armi-anteprima-interattiva.html'),html);
const gridWidth=2160,cellWidth=720,cellHeight=1080;
await sharp({create:{width:gridWidth,height:2160,channels:4,background:'#07101b'}}).composite(await Promise.all(manifest.cards.map(async(c,i)=>({input:await sharp(path.join(out,'carte-hd',c.id+'.png')).resize(cellWidth,cellHeight).toBuffer(),left:i%3*cellWidth,top:Math.floor(i/3)*cellHeight})))).png().toFile(path.join(out,'sei-carte-fronti-completi.png'));
for(const c of manifest.cards)await sharp(path.join(out,'carte-hd',c.id+'.png')).resize(900,1350).png().toFile(path.join(out,c.slug+'-anteprima.png'));
const report={status:'PREVIEW_ONLY_AWAITING_CARD_APPROVAL',directionsApproved:true,frontsApproved:false,inGame:false,actualBattleRecording:false,physicalHapticsVerified:false,
 numericSource:'Strategic direct-hit print candidates; executable locked burn fields. Actual combat events retain existing modifiers.',
 cases:cases.map(s=>({cardId:s.cardId,rarity:s.rarity,who:s.who,mode:s.mode,supportCount:s.supportCount,charges:s.charges,expiration:s.expiration,
  turns:s.frames.map(f=>({stage:f.stage,events:[...f.betweenEvents,...f.events],plan:batchFramePlan(f,s),energyBefore:f.energyBefore,energyAfter:f.energyAfter})),audioHaptics:batchAudioCues(s)}))};
const canvas=createCanvas(720,1280),ctx=canvas.getContext('2d');ctx.scale(1.6,1.6);
for(const [kind,ms]of [['judgment',1900],['mortar',1750],['incinerator',1900]]){
 const s=cases.find(s=>s.kind===kind&&s.rarity==='Leggendaria'&&s.mode==='normal'&&(kind!=='mortar'||s.charges===2));
 drawBatchReview(ctx,s,ms,assets);fs.writeFileSync(path.join(out,kind+'-effetto-volo.png'),canvas.toBuffer('image/png'));
}
if(!process.argv.includes('--stills')){
 const slice=(s,n=1)=>({...s,frames:s.frames.slice(0,n),expiration:n===3?s.expiration:null}),normal=(kind,rarity)=>cases.find(s=>s.kind===kind&&s.rarity===rarity&&s.mode==='normal'&&s.who==='A'&&(kind!=='mortar'||s.charges===2));
 const chosen=[normal('judgment','Leggendaria'),...['Rara','Epica','Leggendaria'].map(r=>slice(normal('mortar',r))),slice(normal('incinerator','Epica'),2),normal('incinerator','Leggendaria'),slice(cases.find(s=>s.kind==='judgment'&&s.who==='B')),slice(cases.find(s=>s.kind==='judgment'&&s.mode==='defense'))];
 const fps=30,silent=path.join(out,'sei-armi-silent.mp4'),encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','720x1280','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18','-pix_fmt','yuv420p',silent],{stdio:['pipe','ignore','inherit']});
 let totalSeconds=0;const cues=[];
 for(const [index,s]of chosen.entries()){
  const seconds=batchDuration(s)/1000,frameCount=Math.round(fps*seconds);
  for(let n=0;n<frameCount;n++){drawBatchReview(ctx,s,n*1000/fps,assets);const px=ctx.getImageData(0,0,720,1280).data;if(!encoder.stdin.write(Buffer.from(px.buffer,px.byteOffset,px.byteLength)))await once(encoder.stdin,'drain');}
  cues.push(...batchAudioCues(s).map(c=>({...c,at:c.at+totalSeconds})));totalSeconds+=frameCount/fps;
  console.log(JSON.stringify({rendered:index+1,total:chosen.length,kind:s.kind,rarity:s.rarity,mode:s.mode,who:s.who}));
 }
 encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error('Encoder failed: '+code);
 const audio=synthesizeBatchAudio(cues,totalSeconds),length=audio.channels[0].length,wav=Buffer.alloc(44+length*4);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(audio.sampleRate,24);wav.writeUInt32LE(audio.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*4,40);
 let peak=0;for(let i=0;i<length;i++)for(let ch=0;ch<2;ch++){const v=audio.channels[ch][i];peak=Math.max(peak,Math.abs(v));wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*4+ch*2);}
 const wavPath=path.join(out,'sei-armi-audio.wav');fs.writeFileSync(wavPath,wav);
 const video=path.join(out,'sei-armi-studio-effetti-con-audio.mp4'),mux=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',silent,'-i',wavPath,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',video],{stdio:'inherit'});if(mux.status)throw Error('Mux failed');
 report.video={file:path.basename(video),duration:totalSeconds,width:720,height:1280,fps,audioChannels:2,audioPeak:peak,actualBattleRecording:false};
}
fs.writeFileSync(path.join(out,'verifica-effetti.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:cases.length,video:report.video,html:true,fronts:manifest.cards.length}));
