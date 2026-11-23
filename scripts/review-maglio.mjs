// Collaudo del Maglio nella partita ufficiale, senza modelli Arma sulla plancia.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maglio Ferrogravitazionale — plancia ufficiale</title><style>
.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%}
.maglio-review-controls{display:flex;justify-content:center;align-items:center;gap:8px;padding:8px;flex-wrap:wrap;color:#dce7ec;font:12px system-ui}
</style></head><body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS} from './src/maglioBattleVisuals.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './src/fleetNext/weaponRarityEvolutions.js';
import './src/index.css';
function Review(){
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false,cardId:MAGLIO_CARD_ID,supports:false,wounded:false,focus:0});
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle());
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));setInitial(createMaglioReviewBattle({...setup,...options}));};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div className="maglio-review-controls">
   <label>Rarità Maglio <select aria-label="Rarità Maglio" value={setup.cardId} onChange={e=>reset({cardId:e.target.value})}>{MAGLIO_VARIANTS.map(v=><option key={v.id} value={v.id}>{v.rarity}</option>)}</select></label>
   <span>{WEAPON_NEAR_FINAL_BY_ID[setup.cardId].effectSpec.baseDamage} HP nominali</span>
   <label><input type="checkbox" aria-label="Supporti in campo" checked={setup.supports} onChange={e=>reset({supports:e.target.checked,wounded:false})}/>Supporti in campo</label>
   <button onClick={()=>reset({slot:0,blocked:false})}>Riprova slot 1</button>
   <button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button>
   <button onClick={()=>reset({supports:true,wounded:true,focus:1,blocked:false})}>Supporto con 1 HP</button>
  </div>
  <div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}>
   <OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE" opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/>
  </div>
 </div>;
}createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: /.maglio-review.html · carte ufficiali, raffiche dai bordi e impatti.');
