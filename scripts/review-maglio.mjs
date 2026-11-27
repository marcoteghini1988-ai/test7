// Collaudo del Maglio nella partita ufficiale, senza modelli Arma sulla plancia.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Armi Metallo — plancia ufficiale</title><style>
.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%}
.maglio-review-controls{display:flex;justify-content:center;align-items:center;gap:8px;padding:8px;flex-wrap:wrap;color:#dce7ec;font:12px system-ui}
</style></head><body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS} from './src/maglioBattleVisuals.js';
import {METAL_WEAPON_VARIANTS,metalWeaponVariant} from './src/metalWeaponBattleVisuals.js';
import {CHAIN_WEAPON_VARIANTS,chainWeaponVariant} from './src/chainWeaponBattleVisuals.js';
import {PRECISION_WEAPON_VARIANTS,precisionWeaponVariant,CASCADE_ID} from './src/precisionWeaponBattleVisuals.js';
import {OFFICIAL_WEAPON_FRONT_BY_ID} from './src/fleetNext/officialWeaponArt.js';
import {hapticsEnabled,setHapticsEnabled} from './src/weaponHaptics.js';
import {approvedWeaponSalvo} from './src/fleetNext/approvedWeaponSalvos.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './src/fleetNext/weaponRarityEvolutions.js';
import {probeHammerVariant} from './src/probeHammerSpec.js';
import {CORE_FAMILY} from './src/coreThunderSpec.js';
import {useCardTextLocale} from './src/CardTextLayer.jsx';
import {setCardTextLocale} from './src/cardTextLocale.js';
import {cardTextName,hasCardTextLayer,cardTextBasePath} from './src/cardTextPresentation.js';
import WeaponSalvoCardMarks from './src/WeaponSalvoCardMarks.jsx';
import './src/index.css';
function Review(){
 const textLocale=useCardTextLocale(),[showCard,setShowCard]=useState(false);
 const fleets=[
  {name:'Aurora / Lince',shipA:'N00',shipB:'C01',supportModels:['C02','C03']},
  {name:'Binaria / Manta',shipA:'R01',shipB:'R02',supportModels:['C04','E03']},
  {name:'Squalo / Tempesta',shipA:'R04',shipB:'E02',supportModels:['E01','L02']},
  {name:'Regina / Titano',shipA:'L01',shipB:'L03',supportModels:['L04','N00']},
  {name:'Nebula / Arca',shipA:'E01',shipB:'L04',supportModels:['L01','L03']}
 ];
 const capture=useRef(null);
 const [recording,setRecording]=useState(false);
 const [hapticsOn,setHapticsOn]=useState(()=>hapticsEnabled());
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
   session.timer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},360000);
  }catch(error){setRecordStatus(error.message||'Registrazione non avviata.');}
 };
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false,cardId:CASCADE_ID,supports:true,wounded:false,focus:0,fleetPreset:0,secondTurn:false,cascadeMode:'two',energyCards:2,ownStage:1,jawCombo:false});
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle({cardId:CASCADE_ID,supports:true,cascadeMode:'two',energyCards:2}));
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));setInitial(createMaglioReviewBattle({...setup,...options}));};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div className="maglio-review-controls">
   <label>Flotta di prova <select aria-label="Flotta di prova" value={setup.fleetPreset}
    onChange={e=>{const index=Number(e.target.value);reset({...fleets[index],fleetPreset:index,supports:true,fused:false});}}>
    {fleets.map((fleet,index)=><option key={fleet.name} value={index}>{fleet.name}</option>)}
   </select></label>
   <label>Carta Arma <select aria-label="Carta Arma" value={setup.cardId} onChange={e=>reset({cardId:e.target.value,secondTurn:false,supports:!!chainWeaponVariant(e.target.value)||!!precisionWeaponVariant(e.target.value),supportCount:2,cascadeMode:'none',ownStage:1,coreMode:'charged',energyCards:0,withDefense:false,expiredCombo:false,jawCombo:false,wounded:false,blocked:false,slot:0,probeHammerMode:'single'})}>
    {Object.keys(OFFICIAL_WEAPON_FRONT_BY_ID).map(id=><option key={id} value={id}>{cardTextName(WEAPON_NEAR_FINAL_BY_ID[id])+' · '+WEAPON_NEAR_FINAL_BY_ID[id].rarita}</option>)}
   </select></label>
   <span>{WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.baseDamage??WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.weaponProfile?.baseDamage} HP base</span>
   <span>{(()=>{const s=approvedWeaponSalvo(setup.cardId);return !s?'':/ganasce|collassatore/.test(s.familyId)?'1 ganascia · 3 turni · combo unica':s.style==='six-plus-lance'?'6 colpi + 1 lancia finale':s.count+' colpi per salva';})()}</span>
   <label><input type="checkbox" aria-label="Supporti in campo" checked={setup.supports} onChange={e=>reset({supports:e.target.checked,wounded:false})}/>Supporti in campo</label>
   <button onClick={()=>reset({slot:0,blocked:false,expiredCombo:false,wounded:false})}>Riprova slot 1</button>
   <button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button>
   <button onClick={()=>reset({supports:true,wounded:true,focus:1,blocked:false})}>Supporto con 1 HP</button>
   <button onClick={()=>reset({supports:true,fused:true,wounded:false,blocked:false})}>Supporto fuso</button>
   {metalWeaponVariant(setup.cardId)?.kind==='thermal-reclaimer'&&<button onClick={()=>reset({secondTurn:true,blocked:false})}>Secondo turno con recupero reale</button>}
   {chainWeaponVariant(setup.cardId)&&<>
    <button onClick={()=>reset({supports:true,supportCount:1,wounded:false,blocked:false,expiredCombo:false})}>Un supporto e madre</button>
    <button onClick={()=>reset({supports:true,supportCount:2,wounded:false,blocked:false,expiredCombo:false})}>Due supporti vivi</button>
    {chainWeaponVariant(setup.cardId).kind==='alloy-collision'&&<>
     <button onClick={()=>reset({jawCombo:false,expiredCombo:false,ownStage:1,blocked:false})}>B autonoma</button>
     <button onClick={()=>reset({jawCombo:true,expiredCombo:false,ownStage:1,blocked:false})}>Combo A + B</button>
     <button onClick={()=>reset({jawCombo:true,expiredCombo:true,blocked:false})}>Combo scaduta</button>
    </>}
    {chainWeaponVariant(setup.cardId).kind!=='induction'&&<label>Turno proprio <select aria-label="Turno proprio" value={setup.ownStage||1} onChange={e=>reset({ownStage:Number(e.target.value),jawCombo:false,blocked:false})}>
     {[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
    {chainWeaponVariant(setup.cardId).kind==='induction'&&<>
     <label>Energie Metallo <select aria-label="Energie Metallo" value={setup.energyCards||0} onChange={e=>reset({energyCards:Number(e.target.value),withDefense:true,blocked:false})}>
      {[0,1,2].map(n=><option key={n} value={n}>{n}</option>)}
     </select></label>
     <label><input type="checkbox" aria-label="Difesa pubblica" checked={setup.withDefense||false} onChange={e=>reset({withDefense:e.target.checked})}/>Difesa pubblica</label>
    </>}
   </>}
   {precisionWeaponVariant(setup.cardId)&&<>
    <label>Turno proprio <select aria-label="Turno proprio" value={setup.ownStage||1} onChange={e=>reset({ownStage:Number(e.target.value),blocked:false})}>
     {(precisionWeaponVariant(setup.cardId).kind==='cascade-piercer'?[1,2,3]:[1,2]).map(n=><option key={n} value={n}>{n}</option>)}
    </select></label>
    {precisionWeaponVariant(setup.cardId).kind==='cascade-piercer'&&<>
     <label>Energie Metallo <select aria-label="Energie Metallo" value={setup.energyCards||0} onChange={e=>reset({energyCards:Number(e.target.value),ownStage:1,blocked:false})}>
      {[0,1,2].map(n=><option key={n} value={n}>{n}</option>)}
     </select></label>
     <button onClick={()=>reset({supports:true,cascadeMode:'none',ownStage:1,blocked:false})}>Senza eccedenza</button>
     <button onClick={()=>reset({supports:true,cascadeMode:'one',energyCards:1,ownStage:1,blocked:false})}>Un trasferimento</button>
     <button onClick={()=>reset({supports:true,cascadeMode:'two',energyCards:2,ownStage:1,blocked:false})}>Due trasferimenti</button>
    </>}
   </>}
   {probeHammerVariant(setup.cardId)&&<>
    <span>Sonda: segnale su danno · Martello: uno o due impatti reali</span>
    <label>Scenario Sonda / Martello <select aria-label="Scenario Sonda / Martello" value={setup.probeHammerMode||'single'} onChange={e=>reset({probeHammerMode:e.target.value,slot:0,blocked:false,withDefense:false,supports:['marked-dead','first-hit-kills'].includes(e.target.value)})}>
     <option value="single">Arma autonoma</option>
     {probeHammerVariant(setup.cardId).rarity!=='Comune'&&<>
      <option value="combo">Sonda + Martello nello stesso turno</option><option value="next-turn">Segnale dal turno precedente</option>
      <option value="reverse">Martello prima della Sonda</option><option value="expired">Segnale scaduto</option>
      <option value="double-defense">Due fendenti intercettati</option><option value="marked-dead">Bersaglio già distrutto</option>
      <option value="first-hit-kills">Primo fendente letale</option><option value="generator-mark">Segnale sul Generatore</option>
     </>}
    </select></label>
    <label><input type="checkbox" aria-label="Difesa pubblica Sonda Martello" checked={setup.withDefense||false} onChange={e=>reset({withDefense:e.target.checked})}/>Difesa pubblica</label>
   </>}
   {setup.cardId.startsWith(CORE_FAMILY)&&<>
    <span>1 nucleo per turno · tre turni · nuova Energia per crescere</span>
    <label>Turno del Nucleo <select aria-label="Turno del Nucleo" value={setup.ownStage||1} onChange={e=>reset({ownStage:Number(e.target.value),blocked:false})}>
     {[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
    <label>Ricarica Nucleo <select aria-label="Ricarica Nucleo" value={setup.coreMode||'charged'} onChange={e=>reset({coreMode:e.target.value,blocked:false})}>
     <option value="charged">Energia nuova disponibile</option><option value="broken">Salta ricarica T2</option><option value="old-only">Solo Energia vecchia</option>
    </select></label>
    <label><input type="checkbox" aria-label="Difesa pubblica Nucleo" checked={setup.withDefense||false} onChange={e=>reset({withDefense:e.target.checked})}/>Difesa pubblica</label>
   </>}
   {hasCardTextLayer(setup.cardId)&&<>
    <label>Card language <select aria-label="Card language" value={textLocale} onChange={e=>setCardTextLocale(e.target.value)}><option value="en">English</option><option value="it">Italiano</option></select></label>
    <button onClick={()=>setShowCard(v=>!v)}>{showCard?'Close card':'Read card'}</button>
   </>}
   <button aria-pressed={hapticsOn} onClick={()=>setHapticsOn(setHapticsEnabled(!hapticsOn))}>Vibrazione {hapticsOn?'attiva':'disattiva'}</button>
   <button onClick={()=>recording?capture.current?.recorder.stop():recordBattle()}>{recording?'Ferma registrazione':'Registra battaglia'}</button>
   <span role="status">{recordStatus}</span>
   {recordUrl&&<a href={recordUrl} download="armi-metallo-effetti-in-battaglia.webm">Scarica video battaglia</a>}
  </div>
  {showCard&&hasCardTextLayer(setup.cardId)&&<div role="dialog" aria-label="Card preview" style={{position:'fixed',inset:0,zIndex:2147483647,background:'#020812e8',display:'grid',placeItems:'center'}}>
   <div><label>Card language <select aria-label="Preview language" value={textLocale} onChange={e=>setCardTextLocale(e.target.value)}><option value="en">English</option><option value="it">Italiano</option></select></label><button onClick={()=>setShowCard(false)}>Close card</button><span className="weapon-salvo-gallery" style={{width:'min(380px,70vw,52vh)',aspectRatio:'2 / 3',lineHeight:0}}>
    <img src={cardTextBasePath(setup.cardId)||OFFICIAL_WEAPON_FRONT_BY_ID[setup.cardId]} alt={cardTextName(WEAPON_NEAR_FINAL_BY_ID[setup.cardId])} style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}/><WeaponSalvoCardMarks cardId={setup.cardId}/>
   </span></div>
  </div>}
  <div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}>
   <OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE" opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/>
  </div>
 </div>;
}createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: /.maglio-review.html · carte ufficiali, raffiche dai bordi e impatti.');

// Lo studio B precedente resta archiviato; l'avvio carica soltanto la partita ufficiale.
