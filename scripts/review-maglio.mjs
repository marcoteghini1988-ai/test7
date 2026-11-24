// Collaudo del Maglio nella partita ufficiale, senza modelli Arma sulla plancia.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maglio Ferrogravitazionale — plancia ufficiale</title><style>
.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%}
.maglio-review-controls{display:flex;justify-content:center;align-items:center;gap:8px;padding:8px;flex-wrap:wrap;color:#dce7ec;font:12px system-ui}
</style></head><body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS} from './src/maglioBattleVisuals.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './src/fleetNext/weaponRarityEvolutions.js';
import './src/index.css';
function Review(){
 const fleets=[
  {name:'Aurora / Lince',shipA:'N00',shipB:'C01',supportModels:['C02','C03']},
  {name:'Binaria / Manta',shipA:'R01',shipB:'R02',supportModels:['C04','E03']},
  {name:'Squalo / Tempesta',shipA:'R04',shipB:'E02',supportModels:['E01','L02']},
  {name:'Regina / Titano',shipA:'L01',shipB:'L03',supportModels:['L04','N00']},
  {name:'Nebula / Arca',shipA:'E01',shipB:'L04',supportModels:['L01','L03']}
 ];
 const capture=useRef(null);
 const [recording,setRecording]=useState(false);
 const [recordStatus,setRecordStatus]=useState('');
 const [recordUrl,setRecordUrl]=useState('');
 const recordBattle=async()=>{
  try{
   setRecordStatus('Scegli questa scheda e includi il suo audio.');
   const display=await navigator.mediaDevices.getDisplayMedia({
    video:{displaySurface:'browser',frameRate:30},audio:true,preferCurrentTab:true});
   const video=document.createElement('video');video.muted=true;video.srcObject=display;
   await video.play();
   const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1600;
   const context=canvas.getContext('2d');
   const media=canvas.captureStream(30);
   display.getAudioTracks().forEach(track=>media.addTrack(track));
   const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(type=>MediaRecorder.isTypeSupported(type));
   const recorder=new MediaRecorder(media,{mimeType:mime,videoBitsPerSecond:6000000});
   const chunks=[];
   const session={display,recorder,frame:0,timer:0};capture.current=session;
   const draw=()=>{
    const board=document.querySelector('.f3d-approved-layout');
    const rect=board?.getBoundingClientRect();
    if(rect&&video.videoWidth&&video.videoHeight){
     const x=video.videoWidth/window.innerWidth,y=video.videoHeight/window.innerHeight;
     context.fillStyle='#05090e';context.fillRect(0,0,900,1600);
     context.drawImage(video,rect.left*x,rect.top*y,rect.width*x,rect.height*y,0,0,900,1600);
    }
    session.frame=requestAnimationFrame(draw);
   };
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.onstop=()=>{
    cancelAnimationFrame(session.frame);clearTimeout(session.timer);
    display.getTracks().forEach(track=>track.stop());
    video.srcObject=null;
    setRecordUrl(previous=>{if(previous)URL.revokeObjectURL(previous);
     return URL.createObjectURL(new Blob(chunks,{type:mime}));});
    setRecording(false);setRecordStatus('Video della partita pronto.');capture.current=null;
   };
   display.getVideoTracks()[0].onended=()=>{if(recorder.state==='recording')recorder.stop();};
   draw();recorder.start(250);setRecording(true);
   setRecordStatus(display.getAudioTracks().length?'Registrazione con audio della scheda':'Registrazione senza audio: includilo nella condivisione.');
   session.timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},90000);
  }catch(error){setRecordStatus(error.message||'Registrazione non avviata.');}
 };
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false,cardId:MAGLIO_CARD_ID,supports:false,wounded:false,focus:0,fleetPreset:0});
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle());
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));setInitial(createMaglioReviewBattle({...setup,...options}));};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div className="maglio-review-controls">
   <label>Flotta di prova <select aria-label="Flotta di prova" value={setup.fleetPreset}
    onChange={e=>{const index=Number(e.target.value);reset({...fleets[index],fleetPreset:index,supports:true,fused:false});}}>
    {fleets.map((fleet,index)=><option key={fleet.name} value={index}>{fleet.name}</option>)}
   </select></label>
   <label>Rarità Maglio <select aria-label="Rarità Maglio" value={setup.cardId} onChange={e=>reset({cardId:e.target.value})}>{MAGLIO_VARIANTS.map(v=><option key={v.id} value={v.id}>{v.rarity}</option>)}</select></label>
   <span>{WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.baseDamage} HP nominali</span>
   <label><input type="checkbox" aria-label="Supporti in campo" checked={setup.supports} onChange={e=>reset({supports:e.target.checked,wounded:false})}/>Supporti in campo</label>
   <button onClick={()=>reset({slot:0,blocked:false})}>Riprova slot 1</button>
   <button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button>
   <button onClick={()=>reset({supports:true,wounded:true,focus:1,blocked:false})}>Supporto con 1 HP</button>
   <button onClick={()=>reset({supports:true,fused:true,wounded:false,blocked:false})}>Supporto fuso</button>
   <button onClick={()=>recording?capture.current?.recorder.stop():recordBattle()}>{recording?'Ferma registrazione':'Registra battaglia'}</button>
   <span role="status">{recordStatus}</span>
   {recordUrl&&<a href={recordUrl} download="maglio-quattro-rarita-in-battaglia.webm">Scarica video battaglia</a>}
  </div>
  <div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}>
   <OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE" opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/>
  </div>
 </div>;
}createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: /.maglio-review.html · carte ufficiali, raffiche dai bordi e impatti.');
