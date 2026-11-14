// Guardrail tecnico: un solo gioco 3D ufficiale. Non genera UI o file di prova.
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {PHASE1_CATALOG} from '../src/phase1FleetCatalog.js';
import {MODULE_CARD_TYPES} from '../src/tacticalEquipmentCards.js';
import {supportedLiveSpecial} from '../src/officialLiveDuelEngine.js';
import {LIVE_FX_SPRITES} from '../src/officialLiveCombatVisuals.js';
import {OFFICIAL_NUMERIC_BACK_IDS,officialNumericDeckStackPath} from '../src/officialDeckBackArt.js';

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
 'src/legacyTutorialConfig.js',
 'src/bossMechanicsEngine.js',
 'src/eliteServices.js',
 'src/pvpConnectivity.js',
 'src/weaponsSystem.js',
 'src/App.css', // stile residuo del boilerplate Vite; non importato da React
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

verify(!source.includes('LEGACY_TUTORIALS_ENABLED')&&
 !source.includes('DISCOVERY_TUTORIALS')&&
 !source.includes('SpotlightHomeTour')&&
 !source.includes('FeatureDiscoveryModal')&&
 !source.includes('eclissi_seen_tutorials')&&
 !source.includes('eclissi_tour_completed')&&
 !source.includes('.spotlight-tour-overlay')&&
 !source.includes('.discovery-modal-overlay')&&
 !source.includes('.tactile-chassis')&&
 !source.includes('.modal-backdrop-3d'),
 'Le guide e gli stili della vecchia versione devono restare fuori dalla Home ufficiale');

verify(!source.includes('ResolutionGradeBanner')&&
 !source.includes('MobiusBridgeModal')&&
 !source.includes('NeutonicFusionModal')&&
 !source.includes('RewriteTargetModal')&&
 !source.includes('CosmicVictoryModal')&&
 source.includes('function RiftCollapseModal')&&
 source.includes('function EpicItemsHubScreen'),
 'Non reintrodurre componenti della vecchia battaglia disattivati o eliminare il varco/cripta attivi');

verify(!source.includes('QUANTUM_DICE_B_FACES')&&
 !source.includes('MALUS_POOL')&&
 !source.includes('FIELD_ANOMALIES')&&
 !source.includes('AI_ARCHETYPES')&&
 !source.includes('DEFAULT_TURN_TIME')&&
 !source.includes('PVP_WIN_TROPHIES'),
 'Costanti della vecchia battaglia mai utilizzate non devono riapparire in App.tsx');

verify(!source.includes('createStandardDeck')&&
 !source.includes('scanVectorSolution')&&
 !source.includes('calculateAiTurnVector')&&
 !source.includes('calculateAiTurnTrisStellare')&&
 !source.includes('generateHumanPacing')&&
 !source.includes('resolveConvergenceDuel'),
 'Non reintrodurre i calcolatori isolati della vecchia battaglia in App.tsx');

verify(!source.includes('ARMORY_V2_STORAGE_KEY')&&
 !source.includes('armoryV2')&&
 !source.includes('equippedWeapons')&&
 !source.includes('weaponsLevels')&&
 !source.includes('eclissi_equipped_weapons')&&
 !source.includes('eclissi_weapons_levels')&&
 !source.includes("from './newCombat/phase7Armory.js'"),
 'Il giocatore LIVE non deve leggere la vecchia armeria di carte arma/hardpoint');

verify(!source.includes('const calculateExpressionResult =')&&
 !source.includes('const evaluateTrisStellare =')&&
 !source.includes('const shuffleArray =')&&
 !source.includes('const generateTrisStellareObjectives =')&&
 !source.includes('const calculateAiTurnConvergence ='),
 'I calcolatori isolati del gioco precedente non devono ricomparire in App.tsx');

verify(!source.includes('const getClassicOpDamage =')&&
 !source.includes('const validateClassicPokerPattern =')&&
 !source.includes('const createRandomCard =')&&
 !source.includes('const generateBombTarget =')&&
 !source.includes('const getComputerAbilityForPlanet ='),
 'Il motore LIVE non deve reintegrare helper orfani delle vecchie carte arma/Poker');

verify(!source.includes('const evaluate5CardPokerHand =')&&
 !source.includes('const CLASSIC_POKER_PATTERNS =')&&
 !source.includes('const BOMB_ARCHETYPES =')&&
 !source.includes('const getCardSuit ='),
 'App.tsx non deve contenere i vecchi registri Poker/numero bomba scollegati');

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

verify(battleEntry.includes("import OfficialFleetBattle3D from './OfficialFleetBattle3D.jsx'")&&
 battleEntry.includes("officialCampaignBattleProps(props)")&&
 battleEntry.includes("<OfficialFleetBattle3D {...officialCampaignBattleProps(props)}"),
 'La battaglia ufficiale DEVE riutilizzare la plancia 3D LIVE originale');
const fleetView=read('src/OfficialFleetBattle3D.jsx');
const fleetEngine=read('src/fleetCardEngine.js');
const fleetCss=read('src/OfficialFleetBattle3D.css');
verify(fleetView.includes("readShipCollection")&&fleetView.includes("readFleetInventory")&&
 fleetView.includes("claimOfficialLiveVictoryRewards")&&
 fleetView.includes("resolveFleetNextTurn")&&
 fleetView.includes("<ShipPhysicalVitals")&&fleetView.includes("<MountedWeapons")&&
 fleetView.includes("OfficialLiveBattle3D.css"),
 'Nuove meccaniche: obbligatorio mantenere le navicelle 3D e i vitali fisici originali');
verify(fleetEngine.includes("FLEET_ELEMENTS")&&fleetEngine.includes("FLEET_PARTS")&&
 fleetEngine.includes("selectFleetAiOrder")&&fleetEngine.includes("resolveFleetCardRound"),
 'Il nuovo motore deve conservare elementi, vitali e IA senza numeriche');
verify(fleetView.includes("arena_titanio_9x16.webp")&&
 fleetView.includes("className=\"fleet-ship-wrap complete-ship focused official-mother\"")&&
 !fleetView.includes("import './FleetCardBattle.css'")&&
 fleetCss.includes("OfficialLiveBattle3D.css"),
 'Il renderer della nuova partita deve essere quello 3D originario');

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
 arena.includes('officialNumericDeckStackPath(numericBackId,ASSET_ROOT)')&&
 arena.includes('data-special-back="fixed"'),
 'I mazzi della plancia LIVE devono essere distinti: numerico equipaggiato e speciale con dorso fisso');
verify(arena.includes('className="live-slot-row live-slot-row--player"')&&
 arena.includes('battle.zones.A.traps.map')&&
 arena.includes('battle.zones.A.open.map')&&
 arena.includes('player.special.hand.map('),
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
verify(!exists('public/assets/portal_sequences'),
 'Eliminare le vecchie sequenze WEBP dei portali Poker, non usate dalla LIVE');
for(const fx of LIVE_FX_SPRITES){
 verify(exists(`public/assets/battle-fx/${fx}.png`),
  'Effetto grafico LIVE mancante: '+fx);
}
// Ogni illustrazione ufficiale deve avere il PNG mostrato nel gioco e
// il sorgente SVG da cui rigenerarlo: 66 speciali + 12 boss + 4 terreni.
for(const directory of ['special-cards','boss-characters','terrain-pvp']){
 const files=readdirSync(resolve(root,'public/assets',directory));
 const pngs=new Set(files.filter(f=>f.endsWith('.png')).map(f=>f.slice(0,-4)));
 const svgs=new Set(files.filter(f=>f.endsWith('.svg')).map(f=>f.slice(0,-4)));
 verify(pngs.size>0&&svgs.size>0,
  'Catalogo grafico vuoto o incompleto: '+directory);
 for(const base of pngs)
  verify(svgs.has(base), 'PNG ufficiale privo del suo sorgente SVG: '+directory+'/'+base);
 for(const base of svgs)
  verify(pngs.has(base), 'Sorgente SVG senza PNG di gioco: '+directory+'/'+base);
}

for(const deckId of OFFICIAL_NUMERIC_BACK_IDS){
 verify(exists(`public/assets/deck-backs/${deckId}.png`),
  'Dorso del mazzo numerico ufficiale mancante: '+deckId);
 verify(exists('public'+officialNumericDeckStackPath(deckId)),
  'Pila 3D del mazzo numerico ufficiale mancante: '+deckId);
}

// Le due viste N00 senza suffisso erano anteprime non caricate da ShipArtwork.
for(const side of ['enemy_to_player','player_to_enemy']){
 verify(!exists('public/assets/mathfleet/views/'+side+'/N00.png'),
  'Anteprima N00 non usata ancora presente in '+side);
}
// Le immagini preliminari C01-C04 sono invece gli input dichiarati del
// piano di riparazione: non cancellarle finché il piano le richiede.
const shipRepairManifest=JSON.parse(read('docs/ship-asset-repair.json'));
verify(Array.isArray(shipRepairManifest.assets)&&shipRepairManifest.assets.length===8,
 'Piano di riparazione delle otto viste C01-C04 assente o incompleto');
for(const asset of shipRepairManifest.assets||[]){
 verify(exists(asset.input), 'Sorgente di ripristino navicella mancante: '+asset.input);
 verify(exists(asset.output), 'Vista completa navicella mancante: '+asset.output);
}

// Non reintrodurre helper locali della vecchia simulazione che non avevano
// riferimenti. L'audit conserva invece gli export consumati da test e fallback.
for(const [file,names] of [
 ['src/newCombat/phase16CEpics.js',['OPPOSITE','availableCardIds']],
 ['src/newCombat/phase17Anomalies.js',['clamp']],
 ['src/newCombat/phase15LegacyPassives.js',['other']],
 ['src/newCombat/phase16BCombat.js',['cap']]
]){
 const contents=read(file);
 for(const name of names)
  verify(!new RegExp('\\bconst\\s+'+name+'\\s*=').test(contents),
   'Helper privato obsoleto nuovamente presente: '+file+' '+name);
}

// Radice Mathfleet: conserva solo gli art effettivamente usati dalla Home
// e i motori storici utili a rappresentare i componenti distruttibili.
for(const filename of ["C01.png","C01_player.png","C02.png","C02_player.png","C03.png","C03_player.png","C04.png","N00.png"]){
 verify(!exists('public/assets/mathfleet/'+filename),
  'Doppione nave precedente ancora alla radice di mathfleet: '+filename);
}
verify(home.includes("homePng('mathfleet/N00_player')")&&
 home.includes("homePng('mathfleet/C04_player')")&&
 home.includes("homePng('mathfleet/motor_plus_intact')"),
 'La Home deve conservare i propri tre asset grafici originali');

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
