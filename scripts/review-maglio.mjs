// Usa gli stessi GLB e lo stesso renderer della partita, anche nel primo piano.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maglio Ferrogravitazionale — plancia ufficiale</title><style>
.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%;}
.maglio-review-controls{display:flex;justify-content:center;align-items:center;gap:8px;padding:8px;flex-wrap:wrap;color:#dce7ec;font:12px system-ui}
.maglio-art-comparison,.maglio-rig-inspector{box-sizing:border-box;width:min(1200px,100%);margin:auto;padding:20px;color:#ecf3f5;font:16px system-ui;background:#09121b}
.maglio-art-comparison h1,.maglio-rig-inspector h1{color:#ecf3f5;text-align:center;font-size:22px}
.maglio-compare-grid{display:grid;grid-template-columns:280px 1fr 1fr;gap:20px;align-items:center}
.maglio-compare-grid figure{margin:0;text-align:center}.maglio-compare-grid img{display:block;object-fit:contain;width:100%;height:440px}
.maglio-compare-grid figcaption{padding:12px 0;color:#c5d6df}.maglio-sprite-ref{position:relative;height:440px;background:#111d28;border-radius:8px}
.maglio-inspector-grid{display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:center}
.maglio-inspector-grid>img{width:100%;height:480px;object-fit:contain}.maglio-inspector-stage{height:560px;position:relative;background:radial-gradient(ellipse at 50% 45%,#243544,#0c1721 75%);border-radius:12px}
.maglio-inspector-actions{display:flex;gap:12px;justify-content:center;padding:12px;flex-wrap:wrap}.maglio-rig-inspector p{text-align:center;color:#b5c9d6;margin:8px}
@media(max-width:700px){.maglio-compare-grid{grid-template-columns:1fr 1fr}.maglio-compare-grid figure:first-child{grid-column:1/-1}.maglio-compare-grid img,.maglio-sprite-ref{height:260px}.maglio-inspector-grid{grid-template-columns:1fr}.maglio-inspector-grid>img{height:220px}.maglio-inspector-stage{height:420px}}
</style></head><body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import MaglioArticulatedModel from './src/MaglioArticulatedModel.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS,maglioVariant} from './src/maglioBattleVisuals.js';
import {cardFacePath} from './src/fleetNext/rules.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './src/fleetNext/weaponRarityEvolutions.js';
import './src/index.css';
function Review(){
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false,cardId:MAGLIO_CARD_ID,supports:false,wounded:false,focus:0});
 const [view,setView]=useState('battle'),[side,setSide]=useState('player'),[angle,setAngle]=useState(45);
 const [aim,setAim]=useState(null),[shot,setShot]=useState(null);
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle());
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));setInitial(createMaglioReviewBattle({...setup,...options}));setShot(null);};
 const fire=x=>{setAim({x,y:1.10,z:side==='player'?-15:15});setShot({fires:true,visualNonce:Date.now(),delayMs:0});};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div className="maglio-review-controls" style={{flex:'0 0 auto'}}>
   <label>Rarità Maglio <select aria-label="Rarità Maglio" value={setup.cardId} onChange={e=>reset({cardId:e.target.value})}>{MAGLIO_VARIANTS.map(v=><option key={v.id} value={v.id}>{v.rarity}</option>)}</select></label>
   <span>{WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.baseDamage} HP nominali</span>
   <label><input type="checkbox" aria-label="Supporti in campo" checked={setup.supports} onChange={e=>reset({supports:e.target.checked,wounded:false})}/>Supporti in campo</label>
   <button onClick={()=>reset({slot:0,blocked:false})}>Riprova slot 1</button><button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button><button onClick={()=>reset({supports:true,wounded:true,focus:1,blocked:false})}>Supporto con 1 HP</button>
   <button onClick={()=>setView(v=>v==='compare'?'battle':'compare')}>{view==='compare'?'Torna alla plancia':'Confronta carta e dispositivo'}</button>
   <button onClick={()=>setView(v=>v==='inspect'?'battle':'inspect')}>{view==='inspect'?'Chiudi primo piano':'Primo piano snodi'}</button>
  </div>
  {view==='compare'?<div className="maglio-art-comparison"><h1>Maglio Ferrogravitazionale · {maglioVariant(setup.cardId).rarity}</h1><div className="maglio-compare-grid">
    <figure><img src={cardFacePath(setup.cardId)} alt="Carta ufficiale originale"/><figcaption>Carta ufficiale originale</figcaption></figure>
    {['player','enemy'].map(s=><figure key={s}><div className="maglio-sprite-ref"><MaglioArticulatedModel cardId={setup.cardId} side={s}/></div><figcaption>{s==='player'?'Vista del giocatore':'Vista dell’avversario'}</figcaption></figure>)}
   </div></div>:view==='inspect'?<div className="maglio-rig-inspector"><h1>Maglio Ferrogravitazionale · {maglioVariant(setup.cardId).rarity}</h1>
   <div className="maglio-inspector-grid"><img src={cardFacePath(setup.cardId)} alt="Carta ufficiale originale"/><div className="maglio-inspector-stage"><MaglioArticulatedModel cardId={setup.cardId} side={side} shot={shot} previewAim={aim} cameraAzimuth={angle} cameraElevation={angle?28:55}/></div></div>
   <div className="maglio-inspector-actions"><button onClick={()=>fire(-9)}>Attacca a sinistra</button><button onClick={()=>fire(0)}>Attacca al centro</button><button onClick={()=>fire(9)}>Attacca a destra</button><button onClick={()=>{setSide(s=>s==='player'?'enemy':'player');setShot(null);}}>Cambia lato</button><button onClick={()=>setAngle(a=>a?0:45)}>Cambia inquadratura</button></div>
   <p>Basamento fisso · Torretta e braccio snodati · Rinculo del pistone</p>
   </div>:<div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}><OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE" opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/></div>}
 </div>;
}createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: /.maglio-review.html · partita ufficiale e primo piano degli stessi GLB.');
