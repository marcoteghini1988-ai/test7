// Guardrail tecnico: un solo gioco 3D ufficiale. Non genera UI o file di prova.
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {PHASE1_CATALOG} from '../src/phase1FleetCatalog.js';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const errors=[];
const verify=(condition,message)=>{if(!condition)errors.push(message);};
const exists=file=>existsSync(resolve(root,file));
const app=read('src/main.tsx');
const arena=read('src/MathDuelBattle.jsx');
const css=read('src/MathDuelBattle.css');
const ships=read('src/ShipPresentation.jsx');
const source=read('src/App.tsx');

verify(app.includes("import App from './App.tsx'")&&app.includes('<App />'),
 'main.tsx deve avviare solo App.tsx');
verify(!app.includes('TacticalDuelPrototype')&&!app.includes('tacticalPreview'),
 'Un ingresso sperimentale e ancora presente');
verify(!exists('src/TacticalDuelPrototype.jsx')&&!exists('src/TacticalDuelPrototype.css'),
 'La schermata prototipo separata non deve esistere');
verify(source.includes('<MathDuelBattle'), 'La campagna deve usare la plancia MathDuelBattle originale');
verify(arena.includes('MathDuelBattle.css')&&arena.includes('arena_titanio_9x16.webp'),
 'La battaglia ufficiale deve usare il CSS e lo sfondo Titanio 9:16');
verify(arena.includes('<ShipArtwork')&&arena.includes('<MountedWeapons'),
 'Navi e montaggi delle armi originali non devono essere sostituiti');
verify(ships.includes('/mathfleet/views/')&&ships.includes('weaponMount('),
 'Le prospettive nave e le bocche di fuoco devono restare collegate agli asset');
verify(arena.includes('className="deck left deck-number"')&&
 arena.includes('className="deck left deck-special"'),
 'Servono i due mazzi distinti: numerico e speciale');
verify(arena.includes('className="special-board"')&&
 arena.includes("game.player.specialHand?.[i]")&&
 arena.includes('onClick={()=>playTacticalCard(i)}'),
 'Le cinque carte speciali reali devono essere accessibili sulla plancia');
verify(arena.includes('[0,1,2,3,4].map(')&&
 arena.includes('<Hand cards={game.player.hand}')&&
 arena.includes('className="formula-target"'),
 'Devono restare 5 speciali, 7 numeriche e il bersaglio separato');
verify(!arena.includes('className="special-card-hand"')&&
 !arena.includes('FLOTTA DI PROVA'),
 'Le interfacce duplicate o la flotta di prova devono essere rimosse');
verify(css.includes('.es-math-scope .special-board')&&css.includes('.deck.deck-special'),
 'La plancia deve posizionare i nuovi comandi senza sovrapporre un secondo gioco');
verify(exists('public/assets/mathduel/arena_titanio_9x16.webp'),
 'Manca il render originale 9:16');

const catalog=PHASE1_CATALOG.ships;
verify(catalog.length===17,'Il catalogo ufficiale deve contenere 17 navi');
verify(PHASE1_CATALOG.weapons.length===42,
 'Il catalogo ufficiale deve contenere 42 armi');
for(const ship of catalog){
 const extension=ship.rarita==='Comune'?'png':'webp';
 for(const side of ['enemy_to_player','player_to_enemy']){
  verify(exists(`public/assets/mathfleet/views/${side}/${ship.id}_complete.${extension}`),
   `Manca la vista originale ${side} di ${ship.id}`);
 }
 for(const escort of [1,2]){
  verify(exists(`public/assets/escorts/${ship.id}_escort_${escort}.svg`),
   `Manca la scudiera ${escort} di ${ship.id}`);
 }
}
if(errors.length){
 console.error('Controllo arena 3D fallito:');
 for(const error of errors)console.error(' - '+error);
 process.exit(1);
}
console.log('Arena 3D ufficiale OK: una sola app, 17 navi, 42 armi, 34 viste, 34 scudiere, 2 mazzi e mani separate.');
