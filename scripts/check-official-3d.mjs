// Guardrail tecnico: un solo gioco 3D ufficiale. Non genera UI o file di prova.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {PHASE1_CATALOG} from '../src/phase1FleetCatalog.js';
import {MODULE_CARD_TYPES} from '../src/tacticalEquipmentCards.js';
import {supportedLiveSpecial} from '../src/officialLiveDuelEngine.js';

const root=resolve(import.meta.dirname,'..');
const read=file=>readFileSync(resolve(root,file),'utf8');
const errors=[];
const verify=(condition,message)=>{if(!condition)errors.push(message);};
const exists=file=>existsSync(resolve(root,file));
const app=read('src/main.tsx');
const battleEntry=read('src/MathDuelBattle.jsx');
const arena=read('src/OfficialLiveBattle3D.jsx');
const liveEngine=read('src/officialLiveDuelEngine.js');
const bossArena=read('src/BossBattle3D.jsx');
const physicalHull=exists('src/ShipPhysicalVitals.jsx')?read('src/ShipPhysicalVitals.jsx'):'';
const vitalAdapter=exists('src/officialVitalMotorAdapter.js')?read('src/officialVitalMotorAdapter.js'):'';
const css=read('src/OfficialLiveBattle3D.css');
const sharedCss=read('src/OfficialBattle3D.css');
const ships=read('src/ShipPresentation.jsx');
const source=read('src/App.tsx');
const shop=read('src/ShopModal.jsx');
const home=read('src/HomeScreen.jsx');
const loadout=read('src/PersonalLoadoutModal.jsx');
const specialEditor=read('src/SpecialDeckPanel.jsx');

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
verify(!source.includes("import LegacyPokerBattle from './LegacyPokerBattle'")&&
 !source.includes('function GameScreen(')&&
 !source.includes('TERRAIN_CARDS_DATABASE')&&
 !source.includes('equippedTerrainSlots')&&
 !source.includes('unlockedTerrainCards')&&
 !source.includes('!MATH_DUEL_REPLACES_POKER_BATTLES'),
 'Il vecchio motore Poker e il Banco Terreno coperto non devono rientrare nel gioco ufficiale');

verify(!shop.includes("id: 'characters'")&&
 !loadout.includes("onOpenShopTab('characters')")&&
 !home.includes('onOpenDebug')&&
 !source.includes('showDebugModal'),
 'Lo Shop legacy e il pulsante DEBUG di prova non devono ricomparire');
for(const orphan of [
 'src/CombatJuiceOverlay.jsx','src/ProjectilesEngine.js',
 'src/weaponEffects.js','src/uniqueWeaponVFX.js','src/vulnerabilityRift.js',
 'src/newCombat/PokerCombatEffects.jsx','src/newCombat/pokerCombatEffects.css',
 'src/newCombat/pokerVolleyVfx.js',
 'src/newCombat/classicNativeBridge.css','src/newCombat/index.js',
 'src/newCombat/tacticalAnalysis.js','src/newCombat/phase17GProgression.js',
 'src/newCombat/phase17HProgression.js','src/newCombat/pvpOnlineProtocol.js',
 'src/TrisBattleView.jsx','src/DoubleStageBattleView.jsx','src/VectorBattleView.jsx',
 'src/LegacyPokerBattle.jsx','src/ClassicPokerFieldBridge.jsx','src/ClassicBattleView.jsx',
 'src/newCombat/legacyPokerBattle.css',
 'src/OfficialBattle3D.jsx','src/officialMobileLayout.test.js',
 'src/TacticalCombatPlayback.jsx',
 'src/tactical/TacticalStellarApp.jsx','src/tactical/engine.js',
 'src/assets/react.svg','src/assets/vite.svg','src/assets/hero.png'
]){
 verify(!exists(orphan),'File obsoleto ancora presente: '+orphan);
}

verify(!sharedCss.includes('.tdp-'),
 'I CSS del riproduttore di battaglie simultanee non devono tornare nella LIVE');
verify(exists('src/officialLiveMobileLayout.test.js'),
 'Manca la copertura strutturale della plancia mobile LIVE');

verify(shop.includes('<ShipShopPanel')&&loadout.includes('<ShipHangarPanel'),
 'Negozio e Area Personale devono aprire il catalogo e l’hangar delle navicelle');
verify(MODULE_CARD_TYPES.length===35&&MODULE_CARD_TYPES.every(supportedLiveSpecial)&&
 shop.includes('TACTICAL_MODULE_CARDS[moduleCardType(a.id)]')&&
 shop.includes('officialSpecialArtPath(moduleCard.id)')&&
 specialEditor.includes('readSpecialCollection()')&&
 specialEditor.includes('readLegacyModuleLevels()')&&
 specialEditor.includes('isModuleCard(type)'),
 'I 35 Moduli del Bazar devono essere vere Carte Speciali giocabili nel LIVE, acquistate e gestite nell Hangar');
verify(!exists('src/ArsenalCatalog.jsx')&&!exists('src/HardpointBattleView.jsx')&&
 !/\bid:\s*['"](?:weapons|terrain|environments)['"]/.test(shop)&&
 !/onOpenShopTab\(['"](?:weapons|terrain|environments)['"]\)/.test(loadout)&&
 !shop.includes('onSelectAbility')&&!loadout.includes('equippedTerrainSlots'),
 'Bazar e Area Giocatore devono usare l’assetto LIVE e il Mazzo Speciale');

verify(battleEntry.includes("import OfficialLiveBattle3D from './OfficialLiveBattle3D.jsx'")&&
 battleEntry.includes("import BossBattle3D from './BossBattle3D.jsx'")&&
 battleEntry.includes("officialCampaignBattleProps(props)")&&
 battleEntry.includes("officialSimultaneousEligibility(battleProps)")&&
 battleEntry.includes("<OfficialLiveBattle3D {...battleProps}")&&
 battleEntry.includes("<BossBattle3D {...battleProps}"),
 'Unico accesso 3D: settori canonici, live alternato e fallback boss coerenti');
verify(arena.includes('createOfficialLiveDuel')&&
 arena.includes('applyOfficialLiveAction')&&
 arena.includes('<ShipPhysicalVitals')&&arena.includes('<MountedWeapons')&&
 arena.includes('player.numeric.hand.map')&&
 arena.includes('player.special.hand.map')&&
 liveEngine.includes('LIVE_TURN_MS=30000')&&
 liveEngine.includes("action.type==='numeric'"),
 'La plancia live deve usare mazzi reali, armi montate, turni 30s e azioni dirette');
verify(arena.includes('MathDuelBattle.css')&&arena.includes('arena_titanio_9x16.webp'),
 'La battaglia ufficiale deve usare il CSS e lo sfondo Titanio 9:16');
verify(arena.includes('<ShipPhysicalVitals')&&
 physicalHull.includes('<ShipSkin')&&physicalHull.includes('<Engine')&&
 bossArena.includes('export function ShipSkin(')&&bossArena.includes('export function Engine(')&&
 arena.includes('<MountedWeapons'),
 'La battaglia LIVE deve riusare la carrozzeria e i motori originali, senza ricostruirli');
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
verify(arena.includes('className="live-deck live-deck--numeric"')&&
 arena.includes('className="live-deck live-deck--special"')&&
 arena.includes('data-equipped-deck={numericBackId}')&&
 arena.includes('data-special-back="fixed"'),
 'I mazzi della plancia LIVE devono essere distinti: numerico equipaggiato e speciale con dorso fisso');
verify(arena.includes('className="live-slot-row live-slot-row--player"')&&
 arena.includes('battle.zones.A.traps.map')&&
 arena.includes('battle.zones.A.open.map')&&
 arena.includes('player.special.hand.map(card=>'),
 'I cinque slot LIVE (1 personaggio, 2 difese, 2 attacchi/supporti) devono restare giocabili');
verify(arena.includes('aria-label="Cinque carte speciali"')&&
 arena.includes('aria-label="Sette carte numeriche"')&&
 arena.includes('className="live-vital-panel"')&&
 liveEngine.includes('const initialZones=()=>({character:null,traps:[null,null],open:[null,null]})'),
 'La LIVE deve avere cinque speciali, sette numeriche e il pannello numerico vitale');
verify(!arena.includes('className="special-card-hand"')&&
 !arena.includes('FLOTTA DI PROVA'),
 'Le interfacce duplicate o la flotta di prova devono essere rimosse');
verify(css.includes('.es-math-scope .live-root .live-special-hand')&&
 css.includes('.es-math-scope .live-root .live-number-hand')&&
 css.includes('.es-math-scope .live-root .live-deck--special')&&
 css.includes('width:450px;height:800px'),
 'La plancia LIVE deve conservare geometrie, mani e mazzi nel formato 9:16');
verify(exists('src/OfficialLiveBattle3D.css')&&
 exists('src/OfficialBattle3D.css')&&
 arena.includes('officialBattleSetup')&&arena.includes('applyOfficialLiveAction'),
 'La LIVE deve usare CSS in comune col fallback e il motore di azioni immediate');

verify(exists('public/assets/mathduel/arena_titanio_9x16.webp'),
 'Manca il render originale 9:16');

// Niente PNG duplicati alla radice: la plancia usa esclusivamente le prospettive
// canoniche e la Home usa i propri sprite nella cartella mathfleet.
const rootAssetPngs=readdirSync(resolve(root,'public/assets')).filter(name=>/\.png$/i.test(name));
verify(rootAssetPngs.length===0,
 'Immagini duplicate alla radice degli asset: '+rootAssetPngs.join(', '));
for(const file of [
 'public/assets/mathfleet/N00_player.png',
 'public/assets/mathfleet/C04_player.png',
 'public/assets/mathfleet/motor_plus_intact.png',
 'public/assets/deck-backs/neutral_starter.png',
 'public/assets/deck-backs/special_fixed.png'
])verify(exists(file),'Asset in uso mancante: '+file);

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
