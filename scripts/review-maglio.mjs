// Avvio ripetibile con: node scripts/review-maglio.mjs (poi npm run dev).
// La prova monta il renderer ufficiale; nessun ingresso extra nell'app distribuita.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maglio Ferrogravitazionale — plancia ufficiale</title>
<style>.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%;}
.maglio-review-controls{display:flex;justify-content:center;align-items:center;gap:8px;padding:8px;flex-wrap:wrap;color:#dce7ec;font:12px system-ui}
.maglio-art-comparison{box-sizing:border-box;width:min(1200px,100%);margin:auto;padding:20px;color:#ecf3f5;font:16px system-ui;background:#09121b}
.maglio-art-comparison h1{color:#ecf3f5;text-align:center;font-size:22px}.maglio-compare-grid{display:grid;grid-template-columns:280px 1fr 1fr;gap:20px;align-items:center}
.maglio-compare-grid figure{margin:0;text-align:center}.maglio-compare-grid img{display:block;object-fit:contain;width:100%;height:440px}
.maglio-compare-grid figcaption{padding:12px 0;color:#c5d6df}.maglio-compare-grid .maglio-sprite-ref{background:repeating-conic-gradient(#1d2934 0% 25%,#18212a 0% 50%) 50%/24px 24px;border-radius:8px}
@media(max-width:700px){.maglio-compare-grid{grid-template-columns:1fr 1fr}.maglio-compare-grid figure:first-child{grid-column:1/-1}.maglio-compare-grid img{height:260px}}
</style></head>
<body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS,maglioArtwork,maglioVariant} from './src/maglioBattleVisuals.js';
import {cardFacePath} from './src/fleetNext/rules.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './src/fleetNext/weaponRarityEvolutions.js';
import './src/index.css';
function Review(){
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false,cardId:MAGLIO_CARD_ID,supports:false,wounded:false,focus:0});
 const [compare,setCompare]=useState(false);
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle());
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));
  setInitial(createMaglioReviewBattle({...setup,...options}));};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div className="maglio-review-controls" style={{flex:'0 0 auto'}}>
   <label>Rarità Maglio <select aria-label="Rarità Maglio" value={setup.cardId} onChange={e=>reset({cardId:e.target.value})}>
    {MAGLIO_VARIANTS.map(v=><option key={v.id} value={v.id}>{v.rarity}</option>)}
   </select></label>
   <span>{WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.baseDamage} HP nominali</span>
   <label><input type="checkbox" aria-label="Supporti in campo" checked={setup.supports} onChange={e=>reset({supports:e.target.checked,wounded:false})}/>Supporti in campo</label>
   <button onClick={()=>reset({slot:0,blocked:false})}>Riprova slot 1</button>
   <button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button>
   <button onClick={()=>reset({supports:true,wounded:true,focus:1,blocked:false})}>Supporto con 1 HP</button>
   <button onClick={()=>setCompare(c=>!c)}>{compare?'Torna alla plancia':'Confronta carta e dispositivo'}</button>
  </div>
  {compare?<div className="maglio-art-comparison">
   <h1>Maglio Ferrogravitazionale · {maglioVariant(setup.cardId).rarity}</h1>
   <div className="maglio-compare-grid">
    <figure><img src={cardFacePath(setup.cardId)} alt="Carta ufficiale originale"/><figcaption>Carta ufficiale originale</figcaption></figure>
    {['player','enemy'].map(side=><figure key={side}><img className="maglio-sprite-ref" src={maglioArtwork(setup.cardId,side)} alt={'Dispositivo '+side}/><figcaption>{side==='player'?'Vista del giocatore':'Vista dell’avversario'}</figcaption></figure>)}
   </div>
  </div>:<div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}>
   <OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE"
    opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/>
  </div>}
 </div>;
}
createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: apri /.maglio-review.html sul server Vite. Scegli il Maglio e premi ESEGUI; poi lo gioca la vera IA.');
