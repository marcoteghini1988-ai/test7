// Avvio ripetibile con: node scripts/review-maglio.mjs (poi npm run dev).
// La prova monta il renderer ufficiale; nessun ingresso extra nell'app distribuita.
import {writeFileSync} from 'node:fs';
writeFileSync('.maglio-review.html',`<!doctype html><html lang="it"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Maglio Ferrogravitazionale — plancia ufficiale</title>
<style>.maglio-review-host .es-math-scope.live-viewport{position:absolute;width:100%;height:100%;}</style></head>
<body style="margin:0"><div id="root"></div><script type="module" src="/.maglio-review.jsx"></script></body></html>`);
writeFileSync('.maglio-review.jsx',`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import OfficialFleetBattle3D from './src/OfficialFleetBattle3D.jsx';
import {createMaglioReviewBattle} from './scripts/maglioReviewBattle.js';
import './src/index.css';
function Review(){
 const [setup,setSetup]=useState({serial:0,slot:0,blocked:false});
 const [initial,setInitial]=useState(()=>createMaglioReviewBattle());
 const reset=(options={})=>{setSetup(s=>({...s,...options,serial:s.serial+1}));
  setInitial(createMaglioReviewBattle({...setup,...options}));};
 return <div style={{height:'100dvh',background:'#05090e',display:'flex',flexDirection:'column'}}>
  <div style={{flex:'0 0 auto',display:'flex',justifyContent:'center',gap:8,padding:8,font:'12px system-ui',color:'#dce7ec',flexWrap:'wrap'}}>
   <span style={{alignSelf:'center'}}>MAGLIO · COMUNE · 18 HP nominali</span>
   <button onClick={()=>reset({slot:0,blocked:false})}>Riprova slot 1</button>
   <button onClick={()=>reset({slot:1,blocked:false})}>Riprova slot 2</button>
   <button onClick={()=>reset({slot:0,blocked:true})}>Verifica arma bloccata</button>
  </div>
  <div className="maglio-review-host" style={{position:'relative',flex:1,minHeight:0}}>
   <OfficialFleetBattle3D key={setup.serial} initialBattle={initial} nickname="GIOCATORE"
    opponentNickname="AVVERSARIO" gameMode="pvp" onExit={()=>reset()}/>
  </div>
 </div>;
}
createRoot(document.getElementById('root')).render(<Review/>);`);
console.log('Collaudo pronto: apri /.maglio-review.html sul server Vite. Scegli il Maglio e premi ESEGUI; poi lo gioca la vera IA.');
