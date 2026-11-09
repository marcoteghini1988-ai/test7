// Verifica strutturale 9:16: preserva la disposizione CONCORDATA dei
// componenti mentre si aggiungono avvisi; NON simula il touch di Android
// e NON sostituisce un vero screenshot o un collaudo sul dispositivo.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=readFileSync(new URL('./MathDuelBattle.css',import.meta.url),'utf8');
const official=readFileSync(new URL('./OfficialBattle3D.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('./OfficialBattle3D.jsx',import.meta.url),'utf8');

function rule(text,selector,required=''){
 // I commenti possono precedere i selettori; le regole @media possono
 // duplicarli senza i valori geometrici che stiamo verificando.
 const clean=text.replace(/\/\*[\s\S]*?\*\//g,'');
 const matches=[...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
 const found=matches.filter(x=>x[1].trim()===selector&&x[2].includes(required))
  .map(x=>x[2]);
 assert.ok(found.length,'Selettore atteso: '+selector+' '+required);
 return found.at(-1);
}
function px(text,selector,property){
 const decl=rule(text,selector,property+':');
 const m=decl.match(new RegExp('(?:^|;)\\s*'+property+'\\s*:\\s*([0-9]+)px(?:;|$)'));
 assert.ok(m,'Manca '+property+' di '+selector+': '+decl);
 return Number(m[1]);
}

test('Il renderer approvato resta 450×800 (9:16) e non viene ricreato',()=>{
 const viewport='.es-math-scope .es-root';
 assert.equal(px(base,viewport,'width'),450);
 assert.equal(px(base,viewport,'height'),800);
 assert.match(ui,/className="es-root official-duel-3d"/);
 assert.match(ui,/style=\{\{transform:'translate\(-50%, -50%\) scale\('/);
 assert.match(ui,/Math\.min\(window\.innerWidth\/450,window\.innerHeight\/800\)/);
 assert.match(ui,/arena_titanio_9x16\.webp/);
 assert.match(ui,/<Ship3D side="enemy"/);
 assert.match(ui,/<Ship3D side="player"/);
 assert.match(ui,/<ShipPhysicalVitals/);
});
test('La geometria dei due mazzi, cinque speciali, sette numeriche e comandi non cambia',()=>{
 const b='.es-math-scope .';
 const o='.es-math-scope .official-duel-3d .';
 for(const [selector,top] of [
  ['ship-zone.ship-enemy',88],['ship-zone.ship-player',326],
  ['special-board',528],['hand',572],['official-operations',666],
  ['play-controls',691],['utility-bar',753]
 ]){
  assert.equal(px(official,o+selector,'top'),top,'Elemento spostato: '+selector);
 }
 assert.equal(px(base,b+'special-board','left'),75);
 assert.equal(px(base,b+'special-board','width'),300);
 assert.equal(px(official,o+'special-board','height'),48);
 assert.equal(px(official,o+'hand','left'),64);
 assert.equal(px(official,o+'hand','width'),322);
 assert.equal(px(official,o+'hand','height'),90);
 assert.match(ui,/\[0,1,2,3,4\]\.map\(i=>/);
 assert.match(ui,/player\.numeric\.hand\.map\(\(card,i\)=>/);
});
test('Su schermi mobili il quadrante scalato resta interamente nel viewport',()=>{
 const board={width:450,height:800};
 const boardSlot={left:75,right:75+300};
 const info={left:boardSlot.right+23-21-1,right:boardSlot.right+23+11};
 assert.ok(info.left>=boardSlot.right,'Info non deve rubare tocchi alla quinta carta');
 for(const [width,height] of [[320,640],[360,780],[393,852],[432,920],[450,800]]){
  const scale=Math.max(.3,Math.min(width/board.width,height/board.height));
  assert.ok(board.width*scale<=width+.001,'board piu largo di '+width);
  assert.ok(board.height*scale<=height+.001,'board piu alto di '+height);
  const left=(width-board.width*scale)/2;
  assert.ok(left+info.left*scale>=0);
  assert.ok(left+info.right*scale<=width,
   'Icona info oltre lo schermo: '+width);
 }
});
test('Avviso Io compatto, timer e dettagli accessibili senza cambiare posizione degli slot',()=>{
 assert.match(ui,/officialBossThreatReadout\(battle\)/);
 assert.match(ui,/\{bossReadout\.compact\}/);
 assert.match(ui,/aria-live="polite"/);
 assert.match(ui,/PREP · IO ERUZIONE \+10%/);
 assert.match(ui,/battle\.phase==='resolving'\?'SCONTRO · 8s'/);
 assert.match(ui,/onClick=\{\(\)=>setMenu\('cards'\)\}/);
 assert.match(ui,/Dettagli delle cinque carte speciali e della minaccia boss/);
 assert.match(ui,/aria-pressed=\{draft\.specialIndices\.includes\(i\)\}/);
 assert.match(official,/\.special-board \.special-board-info::after\s*\{[^}]*inset:-8px -11px -8px -1px;/);
 assert.match(official,/\.enemy-status \.official-boss-threat\s*\{[^}]*font-size:10px;/);
 assert.match(ui,/player\.defense\.parts\[id\]\.hp/);
});

test('Pannelli tattici: dopo PRONTO non si possono cambiare le opzioni neppure lasciando il menu aperto',()=>{
 assert.match(ui,/disabled=\{locked\|\|draft\.numericIndices\.includes\(i\)\|\|draft\.escortAmmoIndex===i\}/);
 assert.match(ui,/player\.weapons\.map\(w=><button key=\{w\.id\}\s*disabled=\{locked\}/);
 for(const field of [
  'bombSlot??0','malusChoice??MALUS_CHOICES[0].id',
  'goldenIndex??0',"mutationVitalId??''",'counterVitalId'
 ]){
  assert.ok(ui.includes('<select disabled={locked} value={draft.'+field+'}'),
   'Il controllo '+field+' va bloccato dopo la conferma');
 }
});

test('Le due madri restano al centro reale, anche con animazione attiva o ridotta',()=>{
 const mother=rule(official,'.es-math-scope .official-duel-3d .official-mother','left:50%');
 assert.match(mother,/left:50%/);
 assert.match(mother,/transform:translateX\(-50%\)/);
 assert.match(mother,/animation:officialCenteredFloat/);
 assert.match(official,/@keyframes officialCenteredFloat\{\s*from\{transform:translateX\(-50%\) translateY\(-2px\)\}\s*to\{transform:translateX\(-50%\) translateY\(2px\)\}/);
 assert.match(official,/@media \(prefers-reduced-motion: reduce\)\{[^}]*animation:none;transform:translateX\(-50%\);/);
 assert.match(ui,/style=\{\{left:'50%',top:0,width:316,height:206,zIndex:3\}\}/);
 const width=450,left=width*.5,shipWidth=316;
 assert.equal(left-shipWidth/2+shipWidth/2,width/2);
});
test('Cinque speciali sono carte 47x81 sopra le sette numeriche e si sollevano',()=>{
 const p='.es-math-scope .official-duel-3d .';
 const card=rule(official,p+'special-board-card','width:47px');
 assert.equal(px(official,p+'special-board-card','width'),47);
 assert.equal(px(official,p+'special-board-card','height'),81);
 assert.equal(px(base,'.es-math-scope .number-card','width'),47);
 assert.equal(px(base,'.es-math-scope .number-card','height'),81);
 assert.match(official,/\.special-board:has\(\.special-board-card\.active\)/);
 assert.match(official,/\.special-board-card\.active\{[^}]*translateY\(-62px\)/);
 assert.match(ui,/officialSpecialCardIdentity\(card\?\.type,data\)/);
 assert.match(ui,/official-special-category/);
 assert.match(ui,/official-special-emblem/);
 assert.match(ui,/official-special-effect/);
 assert.match(ui,/official-special-name/);
 assert.match(ui,/player\.special\.hand\[i\]/);
 assert.match(ui,/player\.numeric\.hand\.map/);
});
