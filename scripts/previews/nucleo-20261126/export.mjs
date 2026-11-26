// Esporta uno studio isolato, non una registrazione StackBlitz.
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {coreReviewCases} from './sequence.mjs';
import {drawCorePreview,TIMING} from './visuals.mjs';
import {coreCuePlan,synthesizeCoreAudio} from './audio.mjs';
import {CORE_SCENIC_REVISION} from './scenic-core.mjs';
const require=createRequire(import.meta.url),sharp=require(process.env.ECLISSI_SHARP_MODULE||'sharp');
const {createCanvas,loadImage,GlobalFonts}=await import(process.env.ECLISSI_CANVAS_MODULE||'@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Eclissi Preview');
const {build}=await import('esbuild');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const out=path.resolve(process.argv[2]),stills=process.argv.includes('--stills'),audioOnly=process.argv.includes('--audio-only');
const showcase=process.argv.includes('--showcase');
const cardsFolder=process.argv.find(arg=>arg.startsWith('--cards-dir='))?.slice(12)||path.join(out,'carte-hd');
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest-carte.json')));
const all=coreReviewCases();
const titles=c=>c.mode==='broken'?'Epica · ricarica interrotta':c.mode==='old-only'?'Rara · solo Energie precedenti':c.mode==='blocked'?'Rara · colpo bloccato':c.who==='B'?'Rara · lato avversario':c.rarity+' · crescita completa';
for(const c of all){c.title=titles(c);if(c.expires)c.frames.at(-1).expires=true;}
const assets={cards:{},hulls:{}},embedded={};
async function asset(key,file,resize=null){
 let bytes=fs.readFileSync(file);bytes=resize?await sharp(bytes).resize(...resize,{fit:'inside'}).png({compressionLevel:6}).toBuffer():await sharp(bytes).png().toBuffer();
 const mime='image/png';
 embedded[key]='data:'+mime+';base64,'+bytes.toString('base64');
 const im=await loadImage(bytes);if(key.startsWith('card:'))assets.cards[key.slice(5)]=im;
 else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=im;else assets[key]=im;
}
await asset('arena',path.join(root,'public/assets/mathduel/arena_titanio_9x16.webp'));
await asset('lightning',path.join(root,'docs/riferimenti-carte/adesivi-slot-2026-11-24/elementi/fulmine.png'));
await asset('defense',path.join(root,'docs/riferimenti-carte/adesivi-slot-2026-11-24/categorie/difesa.png'));
for(const c of manifest.cards)await asset('card:'+c.id,path.join(cardsFolder,c.id+'.png'),[600,900]);
for(const side of ['A','B'])for(const id of ['N00','R02','C02','C03']){
 const base=path.join(root,'public/assets/mathfleet/views',side==='A'?'player_to_enemy':'enemy_to_player',id+'_complete');
 await asset('hull:'+side+':'+id,fs.existsSync(base+'.webp')?base+'.webp':base+'.png',[400,400]);
}
const miniSide=s=>({ships:s.ships.map(x=>({id:x.id,hp:x.hp,maxHp:x.maxHp})),escorts:s.escorts.map(x=>({id:x.id,shipModelId:x.shipModelId,hp:x.hp,maxHp:x.maxHp}))});
const compactFrame=f=>({...Object.fromEntries(Object.entries(f).filter(([k])=>!['before','after','event','events'].includes(k))),
 before:{sides:{A:miniSide(f.before.sides.A),B:miniSide(f.before.sides.B)}}});
const browserData={cards:manifest.cards.map(c=>({id:c.id,rarity:c.rarity,name:c.name})),assets:embedded,
 cases:all.map(c=>({...Object.fromEntries(Object.entries(c).filter(([k])=>k!=='frames')),frames:c.frames.map(compactFrame)}))};
const compiled=await build({entryPoints:[path.join(root,'scripts/previews/nucleo-20261126/browser.mjs')],bundle:true,format:'esm',platform:'browser',target:'es2022',write:false,minify:true});
const js=compiled.outputFiles[0].text.replaceAll('</script','<\/script');
const payload=JSON.stringify(browserData).replaceAll('<','\\u003c');
const html=`<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nucleo di Folgore Crescente — anteprima</title>
<style>*{box-sizing:border-box}body{margin:0;background:#08111d;color:#e6f1ff;font:15px system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:18px}h1{font-size:25px;margin:0 0 8px}p{line-height:1.5;color:#b6c9dc}.layout{display:grid;grid-template-columns:minmax(280px,450px) 1fr;gap:22px}canvas{display:block;width:100%;height:auto;border:1px solid #49687f;border-radius:14px;background:#07101b}button,select{font:inherit;border:1px solid #58778f;border-radius:8px;background:#14263a;color:#edf7ff;padding:9px;margin:4px 4px 4px 0}button{cursor:pointer}select{max-width:100%}label{display:inline-block;margin:8px 12px 8px 0;font-size:13px}#cards{display:flex;gap:9px;align-items:flex-start}#cards img{width:100%;display:block}#cards a{width:33.33%}#status{display:block;font-size:12px;color:#c2dcf4;min-height:40px;margin:8px 0}.note{padding:12px;border-left:3px solid #d1a558;background:#122033;font-size:13px}ul{padding-left:20px;line-height:1.6}.badge{color:#ffdfa3;font-size:12px}a{color:#a8daff}@media(max-width:750px){.layout{grid-template-columns:1fr}h1{font-size:21px}.controls{order:-1}main{padding:10px}}
</style><main><span class="badge">CARTE APPROVATE · EFFETTO SCENICO 2 DA CONFERMARE</span><h1>Cannone a Nucleo di Folgore Crescente</h1><p>Anteprima isolata con dati del motore reale. Questa pagina e il video non sono registrazioni di una partita StackBlitz e non modificano il gioco.</p><div class="layout"><canvas id="battle" width="900" height="1600" aria-label="Anteprima animata dei tre stadi e delle interazioni"></canvas><section class="controls"><select id="case" aria-label="Sequenza da vedere"></select><div><button id="play">Riproduci sequenza</button><button id="repeat">Ricomincia</button></div><label><input id="mute" type="checkbox"> Silenzioso</label><label><input id="haptic" type="checkbox"> Vibrazione, se supportata</label><output id="status"></output><p class="note">Tre turni propri. Nei turni 2 e 3 serve una nuova Energia Fulmine e si consuma una carica. Se la ricarica manca, il danno resta minimo fino alla scadenza. Le sole Energie precedenti non bastano.</p><div id="cards"></div><ul><li>Rara: semianelli in bronzo.</li><li>Epica: conserva i componenti e aggiunge l'anello d'argento.</li><li>Leggendaria: conserva i precedenti e aggiunge la gabbia prismatica.</li></ul><p>Un colpo e un bersaglio per turno. Le ramificazioni sono parti della stessa scarica. Danni, Difese e consumo delle cariche derivano dagli eventi di combattimento.</p><p>Audio sintetizzato e pattern aptici seguono gli stessi istanti. La vibrazione fisica dipende dal dispositivo e non risulta collaudata sul telefono.</p></section></div></main><script>window.CORE_REVIEW_DATA=${payload}</script><script type="module">${js}</script></html>`;
fs.writeFileSync(path.join(out,'nucleo-folgore-anteprima-scenica-v2.html'),html);
if(process.argv.includes('--html-only')){console.log(JSON.stringify({html:true,reducedMotionSupported:true}));process.exit(0);}
const canvas=createCanvas(900,1600),ctx=canvas.getContext('2d');ctx.scale(2,2);
const folder=path.join(out,'prova-effetto');fs.mkdirSync(folder,{recursive:true});
const frameCount=Math.ceil(TIMING.total/1000*30),duration=frameCount/30;
const videoCases=showcase?all.filter(c=>c.mode==='charged'&&c.who==='A'):all;
const selected=videoCases.flatMap(c=>c.frames.map((f,i)=>({...f,caseTitle:c.title,last:i===c.frames.length-1&&c.expires})));
const report={status:'ANTEPRIMA_ISOLATA_NON_INTEGRATA',canvas:[900,1600],fps:30,frameSeconds:duration,
 createdAt:new Date().toISOString(),sourceRepository:'marcoteghini1988-ai/test7',directionApproved:true,finalVisualApproval:false,
 effectRevision:CORE_SCENIC_REVISION,cardVisualApproval:true,effectVisualApproval:false,
 totalShots:all.reduce((n,c)=>n+c.frames.length,0),videoShots:selected.length,showcase,
 softwareHapticPlan:true,physicalHapticsVerified:false,actualBattleRecording:false,
 cases:all.map(c=>({...c,frames:c.frames.map(f=>({...compactFrame(f),audioAndHaptics:coreCuePlan(f)}))}))};
fs.writeFileSync(path.join(out,'verifica-effetti.json'),JSON.stringify(report,null,2)+'\n');
if(stills){for(const index of [0,1,2,5,8,10,11,15,16].filter(i=>i<selected.length)){
 const f=selected[index];drawCorePreview(ctx,f,TIMING.charge+TIMING.flight*.54,assets,{last:f.last});
 fs.writeFileSync(path.join(folder,'volo-'+index+'.png'),canvas.toBuffer('image/png'));
 drawCorePreview(ctx,f,TIMING.charge+TIMING.flight+90,assets,{last:f.last});
 fs.writeFileSync(path.join(folder,'impatto-'+index+'.png'),canvas.toBuffer('image/png'));
 if(index===8){drawCorePreview(ctx,f,TIMING.charge+TIMING.flight+330,assets,{last:f.last});
  fs.writeFileSync(path.join(folder,'corona-'+index+'.png'),canvas.toBuffer('image/png'));}}
 console.log(JSON.stringify({html:true,stills:18,cases:all.length,shots:selected.length}));process.exit(0);}
const silent=path.join(folder,'silent.mp4');
if(audioOnly&&!fs.existsSync(silent))throw Error('Manca il video già renderizzato per aggiornare soltanto l’audio.');
if(!audioOnly){
const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','900x1600','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',silent],{stdio:['pipe','ignore','inherit']});
for(const [index,f]of selected.entries()){
 for(let n=0;n<frameCount;n++){
  drawCorePreview(ctx,f,n/30*1000,assets,{last:f.last});
  const px=ctx.getImageData(0,0,900,1600).data;
  if(!encoder.stdin.write(Buffer.from(px.buffer,px.byteOffset,px.byteLength)))await once(encoder.stdin,'drain');
 }
 console.log(JSON.stringify({rendered:index+1,total:selected.length,rarity:f.rarity,mode:f.mode,stage:f.stage}));
}
encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error('Encoder video: '+code);
}
const cues=selected.flatMap((f,i)=>coreCuePlan(f).map(c=>({...c,at:c.at+i*duration,pan:c.phase==='impact'?(f.who==='A'?.12:-.12):0})));
const audio=synthesizeCoreAudio(cues,selected.length*duration),length=audio.channels[0].length;
const wav=Buffer.alloc(44+length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(audio.sampleRate,24);wav.writeUInt32LE(audio.sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*4,40);
let peak=0,squares=0;for(let i=0;i<length;i++)for(let ch=0;ch<2;ch++){const v=audio.channels[ch][i];peak=Math.max(peak,Math.abs(v));squares+=v*v;wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*4+ch*2);}
const wavPath=path.join(folder,'audio.wav');fs.writeFileSync(wavPath,wav);
const target=path.join(out,'nucleo-folgore-effetto-scenico-v2.mp4');
const final=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',silent,'-i',wavPath,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-movflags','+faststart','-shortest',target],{stdio:'inherit'});
if(final.status)throw Error('Mux audio/video fallito');
report.audio={sampleRate:audio.sampleRate,channels:2,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(squares/(length*2))};
report.duration=selected.length*duration;report.video=path.basename(target);
fs.writeFileSync(path.join(out,'verifica-effetti.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({video:target,duration:report.duration,shots:selected.length,audio:report.audio}));
