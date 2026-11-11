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
const battleEntry=read('src/MathDuelBattle.jsx');
const arena=read('src/OfficialBattle3D.jsx');
const liveArena=read('src/OfficialLiveBattle3D.jsx');
const liveEngine=read('src/officialLiveDuelEngine.js');
const bossArena=read('src/BossBattle3D.jsx');
const physicalHull=exists('src/ShipPhysicalVitals.jsx')?read('src/ShipPhysicalVitals.jsx'):'';
const vitalAdapter=exists('src/officialVitalMotorAdapter.js')?read('src/officialVitalMotorAdapter.js'):'';
const css=read('src/MathDuelBattle.css');
const ships=read('src/ShipPresentation.jsx');
const source=read('src/App.tsx');
const shop=read('src/ShopModal.jsx');
const loadout=read('src/PersonalLoadoutModal.jsx');
const legacyPoker=read('src/LegacyPokerBattle.jsx');

verify(app.includes("import App from './App.tsx'")&&app.includes('<App />'),
 'main.tsx deve avviare solo App.tsx');
verify(!app.includes('TacticalDuelPrototype')&&!app.includes('tacticalPreview'),
 'Un ingresso sperimentale e ancora presente');
verify(!exists('src/TacticalDuelPrototype.jsx')&&!exists('src/TacticalDuelPrototype.css'),
 'La schermata prototipo separata non deve esistere');
verify(source.includes('<MathDuelBattle'), 'La campagna deve usare la plancia MathDuelBattle originale');

verify(!source.includes('PROVA FASE 10')&&!source.includes('phase3PreviewOpen')&&
 !source.includes('NewCombatPhase3Preview'),
 'App.tsx non deve avere interfacce di collaudo o ingressi a combattimenti di prova');
verify(!exists('src/SandboxBattleView.jsx')&&
 !exists('src/NewCombatPhase3Preview.jsx')&&
 !exists('src/NewArsenalCatalogPreview.jsx')&&
 !exists('src/newCombat/phase3Preview.css'),
 'I vecchi componenti sandbox e Preview devono essere eliminati dopo la migrazione');
verify(source.includes("import LegacyPokerBattle from './LegacyPokerBattle'")&&
 legacyPoker.includes("import './newCombat/legacyPokerBattle.css'"),
 'Il motore Poker precedente resta disponibile solo come compatibilita, senza preview');
verify(shop.includes('<ShipShopPanel')&&loadout.includes('<ShipHangarPanel'),
 'Negozio e Area Personale devono aprire il catalogo e l’hangar delle navicelle');
verify(!exists('src/ArsenalCatalog.jsx')&&!exists('src/HardpointBattleView.jsx')&&
 !/\bid:\s*['"]weapons['"]/.test(shop)&&!loadout.includes("onOpenShopTab('weapons')"),
 'Negozio e Area Personale devono escludere le vecchie Carte Arma');

verify(battleEntry.includes("import OfficialBattle3D from './OfficialLiveBattle3D.jsx'")&&
 battleEntry.includes("import BossBattle3D from './BossBattle3D.jsx'")&&
 battleEntry.includes("officialCampaignBattleProps(props)")&&
 battleEntry.includes("officialSimultaneousEligibility(battleProps)")&&
 battleEntry.includes("<OfficialBattle3D {...battleProps}")&&
 battleEntry.includes("<BossBattle3D {...battleProps}"),
 'Unico accesso 3D: settori canonici, live alternato e fallback boss coerenti');
verify(liveArena.includes('createOfficialLiveDuel')&&
 liveArena.includes('applyOfficialLiveAction')&&
 liveArena.includes('<ShipPhysicalVitals')&&liveArena.includes('<MountedWeapons')&&
 liveArena.includes('player.numeric.hand.map')&&
 liveArena.includes('player.special.hand.map')&&
 liveEngine.includes('LIVE_TURN_MS=30000')&&
 liveEngine.includes("action.type==='numeric'"),
 'La plancia live deve usare mazzi reali, armi montate, turni 30s e azioni dirette');
verify(arena.includes('MathDuelBattle.css')&&arena.includes('arena_titanio_9x16.webp'),
 'La battaglia ufficiale deve usare il CSS e lo sfondo Titanio 9:16');
verify(arena.includes('<ShipPhysicalVitals')&&
 physicalHull.includes('<ShipSkin')&&physicalHull.includes('<Engine')&&
 bossArena.includes('export function ShipSkin(')&&bossArena.includes('export function Engine(')&&
 arena.includes('<MountedWeapons'),
 'La battaglia simultanea deve riusare la carrozzeria e i motori originali, senza ricostruirli');
verify(!arena.includes('/ship-shells/')&&!bossArena.includes('/ship-shells/'),
 'La plancia non deve piu sovrapporre disegni SVG delle navi ai render raster originali');
verify(!/<g\s+opacity=["']\.30?["']>\s*<ShipArtwork/.test(arena)&&
 !/<g\s+opacity=["']\.30?["']>\s*<ShipArtwork/.test(bossArena),
 'Le immagini 3D delle navi devono essere visibili a piena opacita');
verify(physicalHull.includes('vesselWithPhysicalVitalDamage(')&&
 vitalAdapter.includes("engine:'plus'")&&vitalAdapter.includes("weapons:'minus'")&&
 vitalAdapter.includes("shieldGenerator:'times'")&&vitalAdapter.includes("command:'divide'")&&
 bossArena.includes('<ShipArtwork side={side} vessel={vessel} onLoad=')&&
 bossArena.includes('<ShipArtwork side={side} vessel={vessel}/>'),
 'Le quattro parti vitali devono riusare i quattro motori e la stessa maschera raster originale');
verify(!arena.includes('className="official-targets"')&&
 !physicalHull.includes('physicalVitalSurfaces('),
 'I vecchi riquadri centrali e le coordinate fisiche inventate devono restare rimossi');
verify(ships.includes('/mathfleet/views/')&&ships.includes('weaponMount('),
 'Le prospettive nave e le bocche di fuoco devono restare collegate agli asset');
verify(arena.includes('className="deck left deck-number"')&&
 arena.includes('className="deck left deck-special"'),
 'Servono i due mazzi distinti: numerico e speciale');
verify(arena.includes('className="special-board"')&&
 arena.includes('player.special.hand[i]')&&
 (arena.includes('specialIndices:toggle(d.specialIndices,i,2)')||
 (arena.includes('const chosen=toggle(d.specialIndices,i,2)')&&arena.includes('specialIndices:chosen'))),
 'Le cinque carte speciali reali devono essere accessibili sulla plancia');
verify(arena.includes('[0,1,2,3,4].map(')&&
 arena.includes('player.numeric.hand.map(')&&
 arena.includes('className="formula-target"'),
 'Devono restare 5 speciali, 7 numeriche e il bersaglio separato');
verify(!arena.includes('className="special-card-hand"')&&
 !arena.includes('FLOTTA DI PROVA'),
 'Le interfacce duplicate o la flotta di prova devono essere rimosse');
verify(css.includes('.es-math-scope .special-board')&&css.includes('.deck.deck-special'),
 'La plancia deve posizionare i nuovi comandi senza sovrapporre un secondo gioco');
verify(exists('src/OfficialBattle3D.css')&&arena.includes('officialBattleSetup')&&arena.includes('sealTacticalOrder'),
 'La plancia deve usare il motore simultaneo reale e gli asset ufficiali');
verify(exists('public/assets/mathduel/arena_titanio_9x16.webp'),
 'Manca il render originale 9:16');

const catalog=PHASE1_CATALOG.ships;
verify(catalog.length===17,'Il catalogo ufficiale deve contenere 17 navi');
verify(PHASE1_CATALOG.weapons.length===42,
 'Il catalogo ufficiale deve contenere 42 armi');
for(const ship of catalog){
 const extension=ship.rarita==='Comune'?'png':'webp';
 for(const side of ['enemy_to_player','player_to_enemy']){
  const file=`public/assets/mathfleet/views/${side}/${ship.id}_complete.${extension}`;
  verify(exists(file),`Manca la vista originale ${side} di ${ship.id}`);
  if(exists(file)){
   const bytes=readFileSync(resolve(root,file));
   const isPng=bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   const isWebp=bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
   verify(bytes.length>=50000&&(extension==='png'?isPng:isWebp),
    `Vista ${side} di ${ship.id}: deve essere una vera immagine PNG/WebP, non un segnaposto SVG`);
  }
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
console.log('Arena 3D ufficiale OK: ingresso unico, catalogo navi, hangar, 17 navi raster e 42 armi integrate.');
