// Eclissi Stellare: nuovo motore tattico, PLANCIA 3D ORIGINALE invariata.
// Usa i medesimi pezzi, hardpoint, scudiere SVG, arena e geometria del
// renderer OfficialLiveBattle3D. NON usa FleetCardBattle.css né cards-site.
import React,{useEffect,useMemo,useState,useRef} from 'react';
import {MagneticGrappleTethers} from './MagneticWeaponEffects.jsx';
import FleetDeckPiles from './FleetDeckPiles.jsx';
import {ASSET_ROOT,MountedWeapons} from './ShipPresentation.jsx';
import {newVessel} from './fleetNext/shipCore.js';
import ShipPhysicalVitals from './ShipPhysicalVitals.jsx';
import {readShipCollection} from './shipCollection.js';
import {nativeMotherRarity,rarityUnlockedAtSector,rarityIndex,
 SHIP_RARITIES,combatLevelForRarity} from './fleetNext/shipRarity.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {isBossCharacterCard} from './bossCharacterCards.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './campaignMotherRival.js';
import {claimOfficialLiveVictoryRewards} from './officialLiveRewardClaims.js';
import {card,cardRole,cardDisplayFacePath as cardFacePath,FLEET_TURN_SECONDS} from './fleetNext/rules.js';
import {cardVisualFamily,cardCategoryLabel} from './fleetNext/cardCategory.js';
import {WEAPON_PRINT_CANDIDATE_BY_ID,WEAPON_STRATEGIC_PRINT_BY_ID}
 from './fleetNext/weaponRarityEvolutions.js';
import {isMaxSupportLevel} from './fleetNext/supportProgression.js';
import {isAuroraModule,installedModule,liveModules,reconfigurationOptions} from './fleetNext/auroraEngine.js';
import {LINCE_BYPASS_ACTIONS,linceMarkedRouteReady} from './fleetNext/linceEngine.js';
import {PRISMA_ATTACK_ACTIONS,livePrismaUnits} from './fleetNext/prismaEngine.js';
import {FALCO_PREP_ACTIONS,falcoUnits,falcoCapacitorActive} from './fleetNext/falcoEngine.js';
import {mantaCapacitorActive,mantaEnergy,mantaForkActive,mantaActiveSupports,
 mantaVisibleProtections,mantaEnemyUnits} from './fleetNext/mantaEngine.js';
import {sharkOperationalUnits,sharkUnits,sharkWoundedSupports,
 sharkWoundedMachines} from './fleetNext/sharkEngine.js';
import {nebulaHiddenSupport,nebulaVisibleSupports,nebulaTargets,
 nebulaModuleActive,nebulaHideReason} from './fleetNext/nebulaEngine.js';
import {stormUnits,stormSupports,stormModuleActive} from './fleetNext/stormEngine.js';
import {royalUnits,royalSupports,royalVisibleProtections,
 royalCapableModule,royalPart} from './fleetNext/royalEngine.js';
import {obsidianFusedEscort,obsidianModuleActive,obsidianPending,
 obsidianSealed,obsidianEnemyUnits} from './fleetNext/obsidianEngine.js';
import {arkModuleActive,arkEscorts,arkFusedEscorts,arkUnfusedEscorts,
 arkEnemyUnits,arkDamagedEscorts,arkModulesInDiscard} from './fleetNext/arkEngine.js';
import {describeEffect,describeEscortEffect,describeBossPassive,effectNeedsOwnTarget,SIMPLE_RULES} from './fleetNext/simpleEffects.js';
import {readFleetInventory,writeFleetInventory,claimFleetReward,fleetRewardForBattle} from './fleetNext/collection.js';
import {hologramDisplayEscorts} from './fleetNext/nextHolographicWeapons.js';
import {createFleetNextBattle,resolvePreparedFleetTurn,autoFleetTurn,timeoutFleetTurn,advanceFleetCombatTime,effectUnavailableReason,defenseCapacityReason,protectingFleetUnits,availableFleetTargets} from './fleetNext/combat.js';
import {generatorCardCount,generatorCoolingOwnTurns} from './fleetNext/motherGeneratorBalance.js';
import {projectFleetSlots,fleetEventText,fleetTurnNotice,projectFleetDefense,projectMachineBerths,FLEET_PHYSICAL_VITALS,campaignFleetShipId} from './fleetNext/battlePresentation.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {HP_SYNC_RULESET,activeSynchronizationPenalty} from './fleetNext/hpSynchronization.js';
import {exclusiveRarityAtLevel} from './fleetNext/exclusiveEvolution.js';
import {activeFleetElements,FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {elementalAbility,chargedElementalEnergy,totalElementalEnergy} from './fleetNext/elementalAbilities.js';
import {dismantleCandidates,dismantleActive} from './fleetNext/dismantleEffects.js';
import {readNextDeckSelection,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {buildCampaignNpcDeck} from './fleetNext/npcDeck.js';
import {readSupportCollection,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {advanceIndependentSupportTime,effectiveSupportEnergyCost,terrainImmunity} from './fleetNext/supportAbilities.js';
import {fleetResolutionFxMs,releaseFleetTurnAfterEffects} from './fleetNext/turnPresentation.js';
import {npcSupportRoster} from './fleetNext/supportCampaign.js';
import {fleetImpactVisual} from './fleetBattleVisuals.js';
import {escortArtwork,fusedEscortArtwork} from './fleetBattleModels.js';
import ProbeHammerMarks from './ProbeHammerMarks.jsx';
import MaglioBattleEffects from './MaglioBattleEffects.jsx';
import {fleetWeaponProjectiles,maglioPresentationBerths} from './maglioBattleVisuals.js';
import WeaponSalvoCardMarks from './WeaponSalvoCardMarks.jsx';
import {cardTextName,cardTextDescription,localizedCardText} from './cardTextPresentation.js';
import {preloadProjectileViews} from './maglioPerspectiveRenderer.js';
import ShipFlightSurface from './ShipFlightSurface.jsx';
import './MathDuelBattle.css';
import './OfficialBattle3D.css';
import './OfficialLiveBattle3D.css';
import './OfficialFleetBattle3D.css';
import './OfficialApprovedBattleHud.css';
import './FleetFlight.css';

const LOADOUT_KEY='eclissi_card_fleet_v1';
const PHYSICAL_LABELS={engine:'Plancia',weapons:'Arsenale',shieldGenerator:'Generatore',command:'Centralina'};
const PHYSICAL_SHORT_LABELS={engine:'PLA',weapons:'ARS',shieldGenerator:'GEN',command:'CEN'};
const VITAL_LABELS={bridge:'Plancia',weapons:'Arsenale',generator:'Generatore',command:'Centralina'};
const pct=(n,d)=>d>0?Math.round(Math.max(0,Math.min(1,n/d))*100):0;
// I valori riportati a schermo devono corrispondere alla scala del nuovo
// motore; il disegno e il file immagine della carta non vengono cambiati.
const displayedCard=(id,modern=false)=>modern?
 (WEAPON_STRATEGIC_PRINT_BY_ID[id]||WEAPON_PRINT_CANDIDATE_BY_ID[id]||card(id)):card(id);
const MODERN_GENERATOR_RULES=Object.freeze([
 'Prepara fino a tre carte. Il turno termina soltanto premendo ESEGUI o allo scadere dei 30 secondi.',
 'La madre non spara gratuitamente. Tocca UNA volta la barra del Generatore per prenotare il colpo quando sono disponibili almeno due Carte Energia fisiche.',
 'Con quattro Carte Energia fisiche il colpo prenotato diventa automaticamente potente. Se non prenoti, il Generatore conserva le Carte Energia.',
 'Le Carte Arma consumano prima la propria Energia. Le carte residue rimangono in pila durante il raffreddamento del Generatore.',
 'Arsenale, Centralina e Plancia consumano 20 secondi strategici per ogni turno proprio, indipendentemente da quanto rapidamente giochi. L\'ultimo si esaurisce dopo 3:30 strategici. Nessun danno automatico da timer.',
 'Arsenale esaurito: danno Carte Arma ridotto del 30% e massimo due slot Strategia. Centralina esaurita: 25% dei colpi ai supporti raggiunge la madre. Plancia esaurita: primo supporto scelto automaticamente, slot Personaggio disattivato.',
 'Quando la mano e\' piena e con ESEGUI non giochi nessuna carta ne\' infliggi danni, scarti una carta reale e la sostituisci con una pescata autentica. Il turno viene consumato.'
]);
const MODERN_OUTDATED_RULE=/PASSA|terza carta|tiro di emergenza|Armi temporanee aumentano|attacchi normali|fine preparazione/iu;
function activeEscort(e){return e.hp>0&&!e.destroyed;}
function findMother(ships){
 const available=new Map(ships.cards.map(card=>[card.shipId,card]));
 let selected=[];
 try{selected=JSON.parse(localStorage.getItem(LOADOUT_KEY)||'[]');}catch{selected=[];}
 const selectedId=Array.isArray(selected)?selected.find(id=>available.has(id)):null;
 const equipped=ships.loadout.map(id=>ships.cards.find(c=>c.instanceId===id)).find(Boolean);
 return equipped||available.get(selectedId)||ships.cards[0]||null;
}
function startSession({mode,sectorNumber,bossPlanetId,bossSectorLevel}){
 try{
  const ships=readShipCollection(),inventory=readFleetInventory(),
   supportCollection=readSupportCollection();
  const owned=findMother(ships);
  if(!owned)throw new Error('Nessuna nave madre posseduta.');
  const boss=officialBossEncounter({mode,sectorNumber,planetId:bossPlanetId,
   sectorLevel:bossSectorLevel});
  const early=officialEarlyCampaignRivalShip({mode,sectorNumber,planetId:bossPlanetId});
  const campaignMother=['campaign','adventure'].includes(mode)?
   campaignFleetShipId({planetId:boss?.planetId??bossPlanetId,sectorNumber}):null;
  const playerRarity=owned.rarita||nativeMotherRarity(owned.shipId);
  const playerLevel=combatLevelForRarity(owned.shipId,playerRarity);
  const motherEnemy=campaignMother||boss?.motherShipId||early||
   chooseCampaignMotherRival(owned.shipId,playerLevel,sectorNumber,bossPlanetId,bossSectorLevel).shipId;
  const stageRarity=rarityUnlockedAtSector(sectorNumber);
  const rivalRarity=SHIP_RARITIES[Math.max(rarityIndex(stageRarity),
   rarityIndex(nativeMotherRarity(motherEnemy)))];
  const levelEnemy=combatLevelForRarity(motherEnemy,rivalRarity);
  // Il mazzo resta di massimo 40 carte, incluse le esclusive della madre.
  // Non importa mai il vecchio inventario/mazzo ritirato.
  const playerDeck=buildNextBaseDeck(inventory,owned.shipId,playerLevel,readNextDeckSelection());
  const supportRoster=equippedSupportRoster(supportCollection);
  const rivalRoster=npcSupportRoster(motherEnemy,mode,sectorNumber,supportCollection.unlockedSlots);
  const battleSeed=Math.floor(Math.random()*0x7fffffff)+1;
  const rivalDeck=buildCampaignNpcDeck(motherEnemy,levelEnemy,rivalRarity,battleSeed);
  return {battle:createFleetNextBattle({
   shipA:owned.shipId,levelA:playerLevel,raritaA:playerRarity,
   shipB:motherEnemy,levelB:levelEnemy,raritaB:rivalRarity,
   deckA:playerDeck.baseDeck,deckB:rivalDeck,
   supportRosterA:supportRoster,supportRosterB:rivalRoster,
   upgradesA:inventory.exclusiveUpgrades,
   mode,bossName:boss?.name||null,bossId:boss?.planetId??null,planetId:bossPlanetId,
   sectorNumber,seed:battleSeed,
   nowMs:Date.now(),ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,
   strategicNoDeterioration:true
  }),error:''};
 }catch(e){return {battle:null,error:e?.message||'Battaglia non disponibile'};}
}
// Questa è esattamente la formazione spaziale 3D precedente:
// nave centrale 316×206 con ShipPhysicalVitals/MountedWeapons,
// scudiere nelle posizioni originali left:45/right:45, stessa arena.
function OriginalFleetFighter({side,unit,selectedVital,onSelectVital,canSelectOwn=false,impact,inspectEscort,
 selectedTarget,onSelectTarget,canTarget=false,chosenCards=[],ply=0,weaponShots=[],resolvedUnit}){
 const player=side==='player';
 const mother=unit.ships[0];
 const vessel=useMemo(()=>newVessel(mother.id,mother.level),[mother.id,mother.level]);
 const defense=useMemo(()=>projectFleetDefense(mother),[mother]);
 const berths=maglioPresentationBerths(unit,chosenCards,ply,weaponShots,resolvedUnit);
 const currentImpact=impact?.escortDamage>0||impact?.machineDamage>0?null:fleetImpactVisual(impact);
 const projection=hologramDisplayEscorts(unit,ply);
 return <div className={'live-fighter live-fighter--'+side} data-fleet-side={player?'A':'B'} data-own-target={canSelectOwn||undefined}>
  <div className="fleet-ship-wrap complete-ship focused official-mother"
   data-flight-alive={mother.hp>0}
   data-vital-weapons={mother.parts.find(p=>p.id==='weapons')?.destroyed?'destroyed':'healthy'}
   style={{left:'50%',top:0,width:316,height:206,zIndex:3,'--flight-phase':player?'-.8s':'-2.4s'}}>
   <ShipFlightSurface shipId={mother.id} side={side} layer="ground" alive={mother.hp>0}/>
   <div className="f3d-craft-hover">
   <ShipPhysicalVitals side={side} vessel={{...vessel,defense}} defense={defense}
    selectedVital={selectedVital==='generator'?'shieldGenerator':selectedVital==='bridge'?'engine':selectedVital}
    canTarget={canTarget||canSelectOwn} allowOwnTarget={canSelectOwn}
    onSelectVital={id=>onSelectVital?.(FLEET_PHYSICAL_VITALS[id])}
    vitalLabels={PHYSICAL_LABELS} vitalShortLabels={PHYSICAL_SHORT_LABELS}
    knownVitals={['engine','weapons','shieldGenerator','command']}
    hideVitalTargets={unit.ruleset===HP_SYNC_RULESET}/>
   <ShipFlightSurface shipId={mother.id} side={side} alive={mother.hp>0}/>
   <MountedWeapons side={side} vessel={vessel} index={0}/>
   {currentImpact&&<img key={(impact?.round||0)+currentImpact.kind}
    className="f3d-impact f3d-impact--mother" src={currentImpact.image}
    alt="" aria-hidden="true"/>}
   </div>
  </div>
  {(projection||unit.escorts).map((escort,i)=>{
   const slot=escort.slot??i;
   const tookHit=impact?.escortSlot===slot&&impact?.escortDamage>0;
   const linked=escort.linked!==false;
   const fusionModel=escort.fused&&escort.fusionModelIds?.find(id=>id!==escort.shipModelId);
   const signature=FLEET_ELEMENTS[escort.element];
   const weaknesses=signature?.weakTo?.map(id=>FLEET_ELEMENTS[id].name).join(' e ');
   return <div key={escort.id} data-combat-id={escort.id} data-combat-kind="escort" className={'live-escort live-escort--'+slot+(projection?' f3d-hologram-position':'')+
    (escort.hp===0?' live-escort--lost':'')+(escort.fused?' f3d-escort--fused':'')+
    ((escort.nebulaHiddenUntilPly||0)>ply&&escort.hp>0&&!escort.destroyed?
     ' f3d-escort--veiled':'')+
    (selectedTarget?.kind==='escort'&&selectedTarget.id===escort.id?' f3d-unit--selected':'')}
    style={{'--flight-phase':(-slot*.9-(player?1.3:2.9))+'s',...(projection?{'--holo-left':(20+slot*30)+'%'}:{})}}
    title={escort.name+' · '+describeEscortEffect(escort)+
     (signature?' · Elemento ereditato: '+signature.name+' · Debole a '+weaknesses:'')}>
    <ShipFlightSurface shipId={escort.shipModelId||escort.originShipId} side={side}
     kind="escort" layer="ground" alive={activeEscort(escort)}/>
    <div className="f3d-craft-hover f3d-escort-visual">
    <img className="f3d-escort-hull" src={escortArtwork(escort,side,ASSET_ROOT)}
     alt={escort.name} draggable={false}/>
    {fusedEscortArtwork(escort,side,ASSET_ROOT)&&<img className="f3d-escort-fusion"
     src={fusedEscortArtwork(escort,side,ASSET_ROOT)} alt="" draggable={false} aria-hidden="true"/>}
    <ShipFlightSurface shipId={escort.shipModelId||escort.originShipId} side={side}
     kind="escort" alive={activeEscort(escort)}/>
    {fusionModel&&<ShipFlightSurface shipId={fusionModel} side={side}
     kind="fusion" alive={activeEscort(escort)}/>}
    </div>
    <span className="f3d-escort-health" aria-label={'Resistenza '+escort.hp+' di '+escort.maxHp}>
     <i style={{width:pct(escort.hp,escort.maxHp)+'%'}}/>
    </span>
    {tookHit&&<img key={impact.round+'-hit-'+i} className="f3d-impact f3d-impact--escort"
     src={ASSET_ROOT+'/battle-fx/shield-contact.png'} alt="" aria-hidden="true"/>}
    {!player&&<button type="button" className="f3d-unit-target"
     disabled={!canTarget||!activeEscort(escort)}
     aria-label={'Attacca '+escort.name+' · '+escort.hp+'/'+escort.maxHp+' punti'}
     aria-pressed={selectedTarget?.kind==='escort'&&selectedTarget.id===escort.id}
     onClick={()=>onSelectTarget?.({kind:'escort',id:escort.id,slot})}/> }
    <small className="f3d-escort-grade">{signature?.symbol||''} {escort.fused?'FUSA · ':''}{escort.supportRarity||'Supporto'}</small>
    <button type="button" className="f3d-escort-info"
     onClick={()=>inspectEscort({escort,mother,linked,player})}
     aria-label={'Abilità della scudiera '+escort.name+(signature?' · '+signature.name+' · vulnerabile a '+weaknesses:'')}>i</button>
   </div>;
  })}
  <div className="f3d-mounted-modules" aria-label={player?'Moduli montati':'Moduli avversari'}>
   {liveModules(unit).map(module=><button type="button" key={module.id}
    data-combat-id={module.id} data-combat-kind="module"
    className={'f3d-mounted-module'+(selectedTarget?.kind==='module'&&selectedTarget.id===module.id?' f3d-unit--selected':'')}
    disabled={!player&&!canTarget}
    title={module.name+' · Integrità '+module.hp+'/'+module.maxHp}
    aria-label={(player?'Consulta ':'Attacca ')+module.name+' · '+module.hp+'/'+module.maxHp}
    onClick={()=>player?inspectEscort?.({module}):onSelectTarget?.({kind:'module',id:module.id,slot:module.slot})}>
     <span>{module.slot==='weapon'?'ARMA':'UTILITÀ'}</span><b>{module.name}</b><small>{module.hp}/{module.maxHp}</small>
    </button>)}
  </div>
  {unit.ships?.[0]?.id==='L04'&&<div className="f3d-ark-status" role="status">
   <span aria-hidden="true">✧</span><b>ARCA ASTRALE</b>
   <small>{'FUSIONI '+(unit.fusionsUsed||0)+'/'+(unit.fusionLimit||0)+
    ' · RISERVE '+(unit.reserveEscorts?.length||0)}</small>
  </div>}
  {unit.ships?.[0]?.id==='L03'&&<div className="f3d-obsidian-status" role="status">
   <span aria-hidden="true">◆</span><b>TITANO OSSIDIANA</b>
   <small>{unit.obsidian?.pending?'COLPO IN PREPARAZIONE':
    unit.escorts?.some(e=>e.obsidianBastion&&e.hp>0&&!e.destroyed)?
    'BASTIONE D’ASSEDIO':'ANCORAGGI E DIFESA'}</small>
  </div>}
  {unit.ships?.[0]?.id==='L01'&&<div className="f3d-royal-status" role="status">
   <span aria-hidden="true">✦</span><b>ECLISSE REALE</b>
   <small>{unit.escorts?.some(e=>e.royalCrown&&e.hp>0&&!e.destroyed)?
    'CORONA UNITA · FUSIONE':'ORDINI REGALI'}</small>
  </div>}
  {unit.ships?.[0]?.id==='E02'&&<div className="f3d-storm-status" role="status">
   <span aria-hidden="true">⚡</span><b>TEMPESTA</b>
   <small>{unit.storm?.charge&&unit.modules?.utility?.cardId==='nx-e02-09'?
    'COLPO PESANTE CARICO':'FULMINI A CATENA'}</small>
  </div>}
  {unit.ships?.[0]?.id==='E01'&&<div className="f3d-nebula-status" role="status">
   <span aria-hidden="true">◈</span><b>NEBULOSA</b>
   <small>{unit.escorts?.some(e=>e.hp>0&&!e.destroyed&&(e.nebulaHiddenUntilPly||0)>ply)?
    'SUPPORTO OCCULTATO':'BRUMA NON ATTIVA'}</small>
  </div>}
  {unit.ships?.[0]?.id==='R04'&&<div className="f3d-shark-status" role="status">
   <span aria-hidden="true">◈</span><b>SQUALO DEL VUOTO</b>
   <small>{unit.shark?.lastEnemyLossPly===ply-1?'RITORSIONE PRONTA':'DIFESA / RITORSIONE'}</small>
  </div>}
  {unit.ships?.[0]?.id==='R02'&&<div className="f3d-manta-energy" role="status"
   title="Energia Manta Ionica">
   <span aria-hidden="true">⚡</span>
   <b>ENERGIA {mantaEnergy(unit)}/2</b>
   <small>{mantaCapacitorActive(unit,ply)?'CAPACITORE ATTIVO':'CAPACITORE ASSENTE'}</small>
  </div>}
  {unit.falco?.pending&&<div className="f3d-falco-charge" role="status"
   title={'Colpo preparato: '+(card(unit.falco.pending.cardId)?.nome||unit.falco.pending.cardId)}>
   <span aria-hidden="true">◉</span>
   <b>{card(unit.falco.pending.cardId)?.nome||'COLPO IN CARICA'}</b>
   <small>{unit.falco.pending.held?'CONSERVATO · ':''}RILASCIO AL PROSSIMO TURNO</small>
  </div>}
  <div className="f3d-machine-berths" aria-label={player?'Le tue due Armi temporanee':'Le due Armi temporanee avversarie'}>
   {berths.map((machine,slot)=>{
    const enabled=machine&&!machine.pending;
    const hit=impact?.machineSlot===slot&&impact?.machineDamage>0;
    const selected=selectedTarget?.kind==='machine'&&selectedTarget.id===machine?.id;
    if(!machine)return null;
    return <button type="button" key={slot} className={'f3d-machine-berth f3d-machine-berth--'+slot+(selected?' f3d-unit--selected':'')+(hit?' f3d-machine--hit':'')+' f3d-machine-occupied'+(machine.pending?' f3d-machine-pending':'')}
     data-weapon-card={machine.sourceCardId||machine.id}
     data-weapon-actor={player?'A':'B'} data-weapon-slot={slot}
     data-combat-id={machine.id} data-combat-kind="machine"
     disabled={!machine||(!player&&(!canTarget||!enabled||unit.ruleset===HP_SYNC_RULESET))}
     aria-label={machine?(unit.ruleset===HP_SYNC_RULESET?(player?'Consulta Arma temporanea ':'Arma temporanea ')+machine.name+' · supporto non bersagliabile':
       (player?'Consulta ':'Attacca ')+machine.name+' · '+machine.hp+'/'+machine.maxHp+' punti'):
       (unit.ruleset===HP_SYNC_RULESET?'Arma temporanea ':'Macchina d’assalto ')+(slot+1)+' · spazio libero'}
     aria-pressed={!player&&selected}
     onClick={()=>player?inspectEscort({machine}):onSelectTarget?.({kind:'machine',id:machine.id,slot})}>
     <span className="f3d-weapon-position-label">{machine.name||''}</span>
    </button>;
   })}
  </div>
  <span className="live-fleet-caption">{mother.name+' · '+
   unit.escorts.filter(activeEscort).length+' supporti'+
   ((unit.reserveEscorts||[]).length?' · '+unit.reserveEscorts.length+' in riserva':'')}</span>
 </div>;
}
const FLEET_RARITY_FRAMES=Object.freeze({
 Comune:'#46c9ec',Rara:'#429bff',Epica:'#b66cff',Leggendaria:'#ffc344',Boss:'#ff815f'
});
const FLEET_VITAL_DESCRIPTIONS=Object.freeze({
 bridge:'Plancia: controlla il sistema Personaggio.',
 weapons:'Arsenale: mantiene operativi gli slot Attacco e il sistema d’armi.',
 generator:'Generatore: alimenta i sistemi difensivi e le trappole.',
 command:'Centralina: coordina i sistemi di flotta e i collegamenti.'
});
function FleetVitalGlyph({type}){
 return <svg className="f3d-vital-glyph" viewBox="0 0 32 28" aria-hidden="true" focusable="false"
  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
  {type==='bridge'?<><path d="M3 22L7 8Q16 3 25 8L29 22ZM8 20L11 9M16 7V21M22 9L25 20M3 24H29"/>
   <path d="M8 11H24" strokeWidth=".8"/></>:type==='weapons'?<><path d="M3 22L10 14L24 5L29 3L27 9L14 20Z"/>
    <path d="M10 14L17 17M24 5L27 9M10 21L10 26L17 21M8 16L3 16L8 11M3 26L7 22"/></>:
   type==='generator'?<><path d="M18 2L8 15H15L13 26L25 11H18Z" fill="currentColor" strokeWidth=".6"/>
    <path d="M9 4A12 12 0 0 0 5 22M23 25A12 12 0 0 0 28 6"/></>:
   <><rect x="9" y="7" width="14" height="14" rx="1.5"/><rect x="12" y="10" width="8" height="8" rx=".5" strokeWidth=".8"/>
    <path d="M12 7V2M20 7V2M12 21V26M20 21V26M9 10H3M9 18H3M23 10H29M23 18H29"/>
    <path d="M3 8V12M3 16V20M29 8V12M29 16V20" strokeWidth=".8"/></>}
 </svg>;
}
function FleetVitalStrip({side,unit,onInspect,consoleMode=false}){
 const parts=unit?.ships?.[0]?.parts||[];
 const types=[
  {id:'bridge',name:'Plancia',symbol:'▱'},
  {id:'weapons',name:'Arsenale',symbol:'⚔'},
  {id:'generator',name:'Generatore',symbol:'ϟ'},
  {id:'command',name:'Centralina',symbol:'▦'}
 ];
 return <div className={'f3d-vital-strip f3d-vital-strip--'+side+(consoleMode?' f3d-vital-strip--console':'')}
  role="group" aria-label={'Stato componenti '+(side==='B'?'avversario':'giocatore')}>
  {types.map(({id,name,symbol})=>{
   const part=parts.find(p=>p.id===id),timer=unit?.componentTimers?.[id];
   const cooling=id==='generator'&&unit?.newGeneratorCombat?
    generatorCoolingOwnTurns(unit):0;
   const status=timer?(timer.expired?'off':'on'):
    id==='generator'&&unit?.newGeneratorCombat?'on':
    !part?'absent':part.hp<=0||part.destroyed||part.dismantled?'off':'on';
   const detail=status==='absent'?'non disponibile':status==='off'?'fuori uso':'attivo';
   const seconds=timer?Math.max(0,Math.ceil(timer.remainingSeconds)):null;
   const timerLabel=seconds!=null?
    (seconds===0?'00:00':String(Math.floor(seconds/60)).padStart(2,'0')+':'+
     String(seconds%60).padStart(2,'0')):
    unit?.newGeneratorCombat&&id==='generator'?(cooling?'PAUSA '+cooling:'PRONTO'):null;
   return <button type="button" className="f3d-vital" key={id} data-status={status}
    title={name+' · '+detail+(timerLabel?' · '+timerLabel:part?' · '+part.hp+'/'+part.maxHp+' integrità':'')}
    aria-label={name+' · '+detail+(timerLabel?' · '+timerLabel:'')}
    onClick={()=>onInspect?.({id,name,part,status,timer,remainingSeconds:seconds})}>
    <span className="f3d-vital-icon" aria-hidden="true">{consoleMode?<FleetVitalGlyph type={id}/>:symbol}</span>
    <span className="f3d-vital-name">{name}</span>
    {timerLabel&&<span className="f3d-vital-countdown" aria-hidden="true">{timerLabel}</span>}
    <i className="f3d-vital-led" aria-hidden="true"/>
   </button>;
  })}
 </div>;
}
function FleetConsoleShell({side}){
 return <svg className="f3d-console-shell" viewBox="16 244 2144 242" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <image href={ASSET_ROOT+'/hud/'+(side==='B'?'opponent':'command')+'-console-shell.webp'} width="2172" height="724"/>
 </svg>;
}
function FleetOpponentConsole({unit,nickname,onInspect,ply}){
 return <div className="f3d-fleet-console f3d-opponent-console" role="group" aria-label="Console avversario">
  <FleetConsoleShell side="B"/>
  <OriginalFleetBar side="B" unit={unit} nickname={nickname} ply={ply}/>
  <FleetVitalStrip side="B" unit={unit} onInspect={onInspect} consoleMode/>
 </div>;
}
function FleetCommandConsole({unit,nickname,onInspect,onLeave,onPass,passDisabled,ended,secondsLeft,turnProgress,ply}){
 return <div className="f3d-fleet-console f3d-command-console" role="group" aria-label="Console di comando">
  <FleetConsoleShell side="A"/>
  <OriginalFleetBar side="A" unit={unit} nickname={nickname} ply={ply}/>
  <button type="button" className="live-abandon" onClick={onLeave} disabled={ended}
   aria-label="Abbandona la battaglia"><span className="f3d-abandon-label">ABBANDONA</span></button>
  <FleetVitalStrip side="A" unit={unit} onInspect={onInspect} consoleMode/>
  <button type="button" className="f3d-approved-pass" aria-label="ESEGUI" disabled={passDisabled} onClick={onPass}>
   <svg className="f3d-pass-chevron" viewBox="0 0 20 22" aria-hidden="true" focusable="false">
    <path d="M2 3L8 11L2 19M10 3L16 11L10 19" fill="none" stroke="currentColor" strokeWidth="3"/>
   </svg><span className="f3d-pass-label">ESEGUI</span>
   <span className="f3d-pass-timer" role="progressbar" aria-label="Tempo rimanente del turno"
    aria-valuemin={0} aria-valuemax={FLEET_TURN_SECONDS} aria-valuenow={secondsLeft}
    aria-valuetext={secondsLeft+' secondi'} data-seconds-left={secondsLeft}>
    <i style={{transform:'scaleX('+turnProgress+')'}}/>
   </span>
  </button>
 </div>;
}
function FleetHullMark({mother=false}){
 return <svg className="f3d-hull-mark" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
  {mother?<><path d="M7 1L8.7 5.3L13 7L8.7 8.7L7 13L5.3 8.7L1 7L5.3 5.3Z" fill="none" stroke="currentColor" strokeWidth="1.3"/>
   <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth=".8"/></>:
   <path d="M2 6L7 2L12 6M2 10L7 6L12 10M2 14L7 10L12 14" fill="none" stroke="currentColor" strokeWidth="1.6"/>}
 </svg>;
}
function OriginalFleetBar({side,unit,nickname,ply=0}){
 const mother=unit.ships[0],escA=unit.escorts?.find(e=>e.slot===0),escB=unit.escorts?.find(e=>e.slot===1);
 const projection=hologramDisplayEscorts(unit,ply);
 const entries=projection?[{ship:mother,mother:true},...projection.map(ship=>({ship,mother:false}))]:
  [escA?{ship:escA,mother:false}:null,{ship:mother,mother:true},escB?{ship:escB,mother:false}:null];
 return <div className={'live-fleet-bar live-fleet-bar--'+side} role="group"
  aria-label={'Integrità flotta '+(side==='B'?'avversario':'giocatore')}>
  <strong className="f3d-player-label" title={nickname||'CPU'}>
   <span>{nickname||'CPU'}</span>
  </strong>
  <div className="live-units">{entries.map((entry,i)=>{
   if(!entry)return <div className="f3d-hp-empty" key={i} aria-label={'Supporto '+(i===0?'A':'B')+' non schierato'}>
    <span className="f3d-ship-name"><FleetHullMark/><span className="f3d-ship-title">{'SUPPORTO '+(i===0?'A':'B')}</span></span>
    <i className="f3d-empty-meter" aria-hidden="true">—</i>
   </div>;
   const {ship,mother:isMother}=entry,max=ship.maxHp||1,hp=Math.max(0,ship.hp||0);
   const rarity=isMother?(ship.rarita||ship.rarity||unit.motherCardRarity):
    (ship.supportRarity||ship.rarity||'Comune');
   const frame=FLEET_RARITY_FRAMES[rarity]||FLEET_RARITY_FRAMES.Comune;
   return <div key={i} className={'live-unit'+(isMother?' live-unit--mother':'')}
    data-rarity={rarity} data-status={hp<=0?'destroyed':hp/max<=.25?'critical':'operational'}
    style={{'--rarity-frame':frame}}
    title={(ship.name||'Navicella')+' · '+hp+'/'+max+' HP · '+rarity}>
    <span className="f3d-ship-name"><FleetHullMark mother={isMother}/><span className="f3d-ship-title">{ship.name||'Navicella'}</span></span>
    <i className="live-unit-health" role="meter" aria-label={'HP '+(ship.name||'Navicella')}
     aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(hp,max)}>
     <b style={{width:pct(hp,max)+'%'}}/><em>{hp}<span aria-hidden="true"> / </span><span className="f3d-hp-max">{max}</span></em>
    </i>
   </div>;
  })}</div>
 </div>;
}
function OriginalSpecialSlots({side,contents,upgrades={},inspectTrap,unit}){
 const labels=['PERSONAGGIO','DIFESA','TRAPPOLA','STRATEGIA','STRATEGIA','ENERGIA'];
 return <div className={'live-slot-row live-slot-row--'+(side==='A'?'player':'enemy')}>
  {contents.map((entry,i)=>{
   const type=entry?.id,covered=!!entry?.hidden;
   const parts=unit?.ships?.[0]?.parts||[];
   const controller=i===0?(parts.some(p=>p.id==='bridge')?'bridge':'generator'):i<=2||i===5?'generator':'weapons';
   const offline=!!unit?.componentTimers?.[controller]?.expired||
    (controller==='bridge'&&!!unit?.componentTimers?.bridge?.expired)||
    parts.some(p=>p.id===controller&&(p.hp<=0||p.destroyed));
   const face=!covered&&type?displayedCard(type,unit?.newGeneratorCombat):null;
   const art=covered?OFFICIAL_SPECIAL_FIXED_BACK:!type?null:card(type)?
     cardFacePath(type,upgrades[type]||1):officialSpecialArtPath(type);
   const title=covered?(side==='A'?'La tua trappola coperta · Tocca per consultarla':'Trappola avversaria coperta'):
    face?(cardTextName(face)||type)+' · '+cardTextDescription(face,describeEffect(face,upgrades[type]||1)):labels[i];
   return <div key={i} className={'live-slot'+(side==='B'?' live-slot--enemy':'')+
    (entry?' live-slot--occupied':'')+(covered?' live-slot--covered':'')+(offline?' live-slot--offline':'')}
    title={title+(offline?' · Sistema distrutto':'')} data-offline={offline||undefined}
    data-fleet-card-slot={side+'-'+i} data-card-id={covered?undefined:type} data-card-source={covered?undefined:unit?.defenses?.find(d=>d.id===type)?.source} data-pending-card={entry?.pending||undefined}
    data-slot-role={i===0?'personaggio':i===1?'difesa':i===2?'trappola':i===5?'energia':'attacco'}
     data-family={covered?'defense':type?(['weapon','strategy'].includes(cardVisualFamily(face,cardRole(type)))?cardVisualFamily(face,cardRole(type)):cardRole(type)):undefined}
     data-rarity={face?exclusiveRarityAtLevel(face,unit?.ships?.[0]?.level):undefined}>
    <svg className="f3d-slot-frame" viewBox="0 0 58 87" preserveAspectRatio="none" aria-hidden="true" focusable="false">
     <path d="M5 1H53L57 5V82L53 86H5L1 82V5Z" fill="none" stroke="#05090e" strokeWidth="2"/>
     <path d="M5 1H53L57 5V82L53 86H5L1 82V5Z" fill="none" stroke="#77818a" strokeWidth=".8"/>
     <path d="M5 2H52L56 6M2 6V81L6 85" fill="none" stroke="#cbd0d0" strokeWidth=".45" opacity=".6"/>
     <path className="f3d-slot-frame-corners" d="M15 3H6L3 6V15M43 3H52L55 6V15M55 72V81L52 84H43M15 84H6L3 81V72"
      fill="none" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
    {art?<><img className="f3d-slot-art" src={art} alt="" draggable={false}/><WeaponSalvoCardMarks cardId={type}/></>:
     face?<span className="f3d-card-fallback">{face.nome||face.name}</span>:
     i===5?<svg className="f3d-slot-energy-symbol" viewBox="0 0 64 42" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M22 3L11 8L5 30L16 38L20 34L11 28L15 12L25 7ZM42 3L53 8L59 30L48 38L44 34L53 28L49 12L39 7Z"/>
      <path d="M24 13H28V30H24ZM31 13H35V30H31ZM38 13H42V30H38Z"/>
     </svg>:<span className="f3d-slot-category-symbol" aria-hidden="true"/>}
    {covered?<>
     <small className="live-slot-role">{entry.pending?'DA POSARE':'COPERTA'}</small>
     {side==='A'&&type&&<button type="button" className="f3d-trap-inspect"
      aria-label="Consulta la tua trappola coperta"
      onClick={()=>inspectTrap?.({trapId:type,pending:entry.pending})}/>}
    </>:!type&&<small className="live-slot-role">{labels[i]}</small>}
     {(entry?.stackCount||0)>1&&<small className="f3d-slot-count" title={'Carte sovrapposte: '+entry.stackCount}>{entry.stackCount}</small>}
   </div>;
  })}
 </div>;
}
function TrapReveal({event}){
 const trap=card(event?.cardId),blocked=card(event?.blockedCardId);
 if(event?.kind!=='trap-reveal'||!trap)return null;
 return <div className="f3d-trap-reveal" role="status" aria-live="polite">
  {cardFacePath(trap.id)?<img src={cardFacePath(trap.id)} alt={trap.nome||trap.name}/>:
  <span className="f3d-trap-icon" aria-hidden="true">◈</span>}
  <div><strong>TRAPPOLA ATTIVATA</strong><b>{trap.nome||trap.name}</b>
   <span>{event.redirected||event.secondaryCancelled?event.text:(blocked?.nome||blocked?.name||'Terreno avversario')+': attivazione annullata.'}</span>
  </div>
 </div>;
}
function OriginalSpecialHandCard({type,index,selected,disabled,onClick,offset,grade=1,motherLevel=1,unavailableReason='',modernBalance=false}){
 const def=displayedCard(type,modernBalance);
 const rarity=exclusiveRarityAtLevel(def,motherLevel);
 const description=def?cardTextDescription(def,describeEffect(def,grade)):'Carta tattica';
 const isEnergy=def?.effectSpec?.type==='energy'||def?.kind==='energy';
 const isTrap=def?.effectSpec?.type==='trap'||def?.kind==='trap';
 const role=isEnergy?'energy':isTrap?'trap':cardVisualFamily(def,cardRole(type));
 const familyGlyph=isEnergy?FLEET_ELEMENTS[def.effectSpec.elementId]?.symbol||'ϟ':
  {weapon:'⚔',strategy:'◎',attack:'◎',defense:'⬡',trap:'◈',character:'♛',terrain:'◈',support:'✚',control:'◎'}[role]||'✦';
 const name=cardTextName(def)||type;
 const categoryLabel=localizedCardText(def)?.category||cardCategoryLabel(def,role);
 const art=type&&def?cardFacePath(type,grade):officialSpecialArtPath(type);
 const fallbackImages={
 weapon:'/assets/special-cards/shot-ion.png',
 strategy:'/assets/special-cards/tactic-suppress.png',
 attack:'/assets/special-cards/shot-ion.png',
 defense:'/assets/special-cards/tactical-cover.png',
 trap:'/assets/special-cards/tactic-reactive.png',
 character:'/assets/special-cards/module-card-planet_char_1.png',
 terrain:'/assets/special-cards/tactic-vulnerability-rift.png',
 energy:'/assets/special-cards/shot-ion.png',
 support:'/assets/special-cards/support-shield-repair.png',
 control:'/assets/special-cards/tactic-suppress.png'
};
 const fallbackArt=fallbackImages[role]||fallbackImages.support;
 const displayArt=isBossCharacterCard(type)?null:art||fallbackArt;
 return <button type="button" disabled={disabled}
  className={'live-hand-special'+(selected?' live-chosen':'')}
  data-fleet-hand-index={index}
  style={{'--special-angle':offset*3+'deg','--special-drop':-(offset**2)*.2+'px'}}
  data-family={role} data-rarity={rarity}
  title={name+' · '+description+(unavailableReason?' · '+unavailableReason:'')}
  aria-label={name+' · '+description+(unavailableReason?' · '+unavailableReason:'')}
  aria-disabled={!!unavailableReason||disabled}
  aria-pressed={selected} onClick={onClick}>
  {displayArt?<img src={displayArt} alt="" draggable={false}
   onError={event=>{
    if(art&&event.currentTarget.getAttribute('src')!==fallbackArt){
     event.currentTarget.src=fallbackArt;
    }
   }}/>:<span className="live-card-pending-art" aria-hidden="true">CARTA IN PREPARAZIONE</span>}
  {art&&<WeaponSalvoCardMarks cardId={type}/>}
  <span className="live-card-emblem">{familyGlyph}</span>
  <span className="live-card-rarity" title={localizedCardText(def)?.rarity||'Rarità '+rarity}>{categoryLabel}</span>
  <span className="live-card-caption"><b>{name}</b>
   <small>{description}</small></span>
 </button>;
}

export default function OfficialFleetBattle3D({
 nickname='Comandante',opponentNickname='',gameMode='campaign',sectorNumber=1,displaySector='',
 bossPlanetId=null,bossSectorLevel=null,onResult,onExit,initialBattle=null
}){
 const opts={mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel};
 useEffect(()=>{preloadProjectileViews();},[]);
 const newSession=()=>initialBattle?{battle:releaseFleetTurnAfterEffects(
  structuredClone(initialBattle),Date.now()),error:''}:startSession(opts);
 const [session,setSession]=useState(newSession);
 const [battle,setBattle]=useState(session.battle);
 const [selectedVital,setSelectedVital]=useState('weapons');
 const [dismantleOptions,setDismantleOptions]=useState({first:'',second:''});
 const [selectedTarget,setSelectedTarget]=useState(null);
 const [selectedOwnVital,setSelectedOwnVital]=useState('');
 const [chosenCards,setChosenCards]=useState([]);
 const [eclipseDelay,setEclipseDelay]=useState('');
 const [eclipseGuess,setEclipseGuess]=useState('');
 const [recoverHandCardIndex,setRecoverHandCardIndex]=useState(0);
 const [preparedSacrifice,setPreparedSacrifice]=useState(null);
 const [fusionSlot,setFusionSlot]=useState(0);
 const [elementalPrepared,setElementalPrepared]=useState(false);
 const [elementalChoice,setElementalChoice]=useState('');
 const [prismaOptions,setPrismaOptions]=useState({
  redirectMachineId:'',trapSelection:'',artisanSelection:'',enemySelection:'',
  secondSelection:'',thirdSelection:''
 });
 const setPrismaOption=(name,value)=>setPrismaOptions(prev=>({...prev,[name]:value}));
 const [corvoOptions,setCorvoOptions]=useState({exchangeCardId:'',bottomTop:false});
 const setCorvoOption=(name,value)=>setCorvoOptions(old=>({...old,[name]:value}));
 const [falcoOptions,setFalcoOptions]=useState({hold:false,target:'',second:'',
  correction:'',gunner:''});
 const setFalcoOption=(name,value)=>setFalcoOptions(old=>({...old,[name]:value}));
 const [mantaOptions,setMantaOptions]=useState({silence:false,fork:false,second:'',screen:'',
  from:'',to:'',recycle:'',repair:true,repairTarget:''});
 const setMantaOption=(name,value)=>setMantaOptions(old=>({...old,[name]:value}));
 const [sharkOptions,setSharkOptions]=useState({armor:'',decoy:'',teethFirst:'',teethSecond:'',
  torpedo:'',shield:'',admiralDiscard:'',admiralEnabled:true,donor:'',receiver:''});
 const setSharkOption=(name,value)=>setSharkOptions(old=>({...old,[name]:value}));
 const [nebulaOptions,setNebulaOptions]=useState({hide:false,hideEscort:'',veil:'',swap:'',
  terrainTrade:false,tradeCard:''});
 const setNebulaOption=(name,value)=>setNebulaOptions(old=>({...old,[name]:value}));
 const [stormOptions,setStormOptions]=useState({second:'',chain:'',front:'',
  captainSwap:false,captainTrade:''});
 const setStormOption=(name,value)=>setStormOptions(old=>({...old,[name]:value}));
 const [royalOptions,setRoyalOptions]=useState({rainMode:'heavy',second:'',guard:'',
  bastion:'',source:'',destination:'',relay:false,relayEscort:'',
  sovereign:false,discard:'',pick:''});
 const setRoyalOption=(name,value)=>setRoyalOptions(old=>({...old,[name]:value}));
 const [obsidianOptions,setObsidianOptions]=useState({part:'',chainMachine:'',
  magisterSwap:false,bastionGuard:false});
 const setObsidianOption=(name,value)=>setObsidianOptions(old=>({...old,[name]:value}));
 const [arkOptions,setArkOptions]=useState({archive:false,archiveDiscard:'',
  recoverModule:'',rayEscort:'',custodyEscort:'',chorusMode:'focus',
  chorusFirst:'',chorusSecond:'',custodian:false,custodianBottom:'',
  fused:'',resonanceEscort:'',second:''});
 const setArkOption=(name,value)=>setArkOptions(old=>({...old,[name]:value}));
 const [linceOptions,setLinceOptions]=useState({
  routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
  linceRecallWeapon:false,radentRecall:false,radentMachineId:''
 });
 const setLinceOption=(name,value)=>setLinceOptions(old=>({...old,[name]:value}));
 const [auroraOptions,setAuroraOptions]=useState({
  deckTopFlip:false,sacrificeSlot:'',exchangeCardId:'',peekPickId:'',
  cartographerPickId:'',reconfigureSelection:'',secondarySelection:''
 });
 const setAuroraOption=(name,value)=>setAuroraOptions(prev=>({...prev,[name]:value}));
 const [scale,setScale]=useState(1);
 const viewportRef=useRef(null);
 const [message,setMessage]=useState('');
 const [resolving,setResolving]=useState(false);
 const [help,setHelp]=useState(null);
 const [lastFx,setLastFx]=useState(null);
 const [trapReveal,setTrapReveal]=useState(null);
 const [busy,setBusy]=useState(false);
 const [showLog,setShowLog]=useState(false);
 const [showBattleCommands,setShowBattleCommands]=useState(false);
 const [rewardDone,setRewardDone]=useState(false);
 const [now,setNow]=useState(()=>Date.now());
 const submitting=useRef(false);
 const preparedTimeout=useRef(null);
 const resolutionInProgress=useRef(false);
 const resolutionTimeout=useRef(null);
 useEffect(()=>()=>window.clearTimeout(resolutionTimeout.current),[]);
 useEffect(()=>{
  const resize=()=>{
   const viewport=viewportRef.current;
   if(viewport?.clientWidth&&viewport.clientHeight)
    setScale(Math.min(viewport.clientWidth/450,viewport.clientHeight/800));
  };
  const observer=new ResizeObserver(resize);
  if(viewportRef.current)observer.observe(viewportRef.current);
  resize();window.addEventListener('resize',resize);
  return ()=>{observer.disconnect();window.removeEventListener('resize',resize);};
 },[]);
 useEffect(()=>{
  const id=window.setInterval(()=>{
  const timestamp=Date.now();
  setNow(timestamp);
  setBattle(current=>{
   if(!current||resolutionInProgress.current)return current;
   const next=advanceFleetCombatTime(current,timestamp);
   return next.changed?next.battle:current;
  });
 },250);
  return ()=>window.clearInterval(id);
 },[]);
 useEffect(()=>{
  if(!trapReveal)return;
  const id=window.setTimeout(()=>setTrapReveal(null),4200);
  return ()=>window.clearTimeout(id);
 },[trapReveal]);
 function showResult(result,selectedIndexes=[]){
  if(resolutionInProgress.current)return;
  resolutionInProgress.current=true;
  setResolving(true);
  const stamp=Date.now();
  const selectedCards=battle.turn==='A'?selectedIndexes.slice(0,3).map(index=>({
   index,id:battle.sides.A.hand[index],grade:battle.sides.A.exclusiveUpgrades?.[battle.sides.A.hand[index]]||1
  })).filter(entry=>entry.id):[];
  setLastFx({nonce:stamp,startedAt:performance.now(),round:battle.round,events:result.events,
   selectedCards,
   weaponShots:fleetWeaponProjectiles(result.events),
   resolvedSides:result.battle.sides});
  // Lascia gli eventi nel Registro senza scritte automatiche sopra le navi.
  setMessage('');
  setShowBattleCommands(false);
  setPreparedSacrifice(null);setSelectedTarget(null);
  const revealed=result.events.find(event=>event.kind==='trap-reveal');
  if(revealed)setTrapReveal({...revealed,nonce:stamp});
  window.clearTimeout(resolutionTimeout.current);
  resolutionTimeout.current=window.setTimeout(()=>{
   setBattle(releaseFleetTurnAfterEffects(result.battle,Date.now()));
   setChosenCards([]);setEclipseDelay('');setEclipseGuess('');setElementalPrepared(false);
   resolutionInProgress.current=false;setResolving(false);
  },Math.max(fleetResolutionFxMs(result.events,selectedCards),selectedIndexes.length?2450:0));
 }
 // Anche il nemico segue l'alternanza dei turni. Nel PvP attuale resta IA simulata.
 useEffect(()=>{
  if(!battle||battle.phase!=='playing'||battle.turn!=='B'||resolving)return;
  const id=window.setTimeout(()=>{
   const ai=autoFleetTurn(battle,'B');
   const result=resolvePreparedFleetTurn(battle,'B',ai,Date.now());
   if(result.ok){
    showResult(result);
   }else setMessage(result.reason);
  },Math.max(680,(battle.sides.B.provisionalHandFrozenUntilMs||0)-Date.now()+30));
  return ()=>window.clearTimeout(id);
 },[battle?.ply,battle?.turn,battle?.phase,resolving]);
 useEffect(()=>{
  if(!battle||battle.phase!=='playing'||resolving)return;
  const id=window.setTimeout(()=>{
   if(battle.turn==='A'){
    // Utilizza la preparazione più recente, non la selezione del primo render.
    preparedTimeout.current?.();
    return;
   }
   const result=timeoutFleetTurn(battle,Date.now());
   if(result.ok)showResult(result);
  },Math.max(50,battle.deadlineMs-Date.now()+60));
  return ()=>window.clearTimeout(id);
 },[battle?.ply,battle?.deadlineMs,battle?.phase,resolving]);
 // Anche dopo la terza carta la preparazione resta aperta:
 // la barra Generatore va prenotata prima di premere ESEGUI.
 function restart(){
  window.clearTimeout(resolutionTimeout.current);
  resolutionInProgress.current=false;setResolving(false);
  const next=newSession();
  setLastFx(null);
  setSession(next);setBattle(next.battle);
  setSelectedVital('weapons');setSelectedTarget(null);setSelectedOwnVital('');setChosenCards([]);setEclipseDelay('');setEclipseGuess('');setRecoverHandCardIndex(0);setPreparedSacrifice(null);setMessage('');
  setElementalPrepared(false);setElementalChoice('');
  setDismantleOptions({first:'',second:''});
  setAuroraOptions({deckTopFlip:false,sacrificeSlot:'',exchangeCardId:'',peekPickId:'',cartographerPickId:'',reconfigureSelection:'',secondarySelection:''});
  setLinceOptions({routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
   linceRecallWeapon:false,radentRecall:false,radentMachineId:''});
  setPrismaOptions({redirectMachineId:'',trapSelection:'',artisanSelection:'',
   enemySelection:'',secondSelection:'',thirdSelection:''});
  setCorvoOptions({exchangeCardId:'',bottomTop:false});
  setFalcoOptions({hold:false,target:'',second:'',correction:'',gunner:''});
  setMantaOptions({silence:false,fork:false,second:'',screen:'',from:'',to:'',
   recycle:'',repair:true,repairTarget:''});
  setSharkOptions({armor:'',decoy:'',teethFirst:'',teethSecond:'',torpedo:'',shield:'',
   admiralDiscard:'',admiralEnabled:true,donor:'',receiver:''});
  setNebulaOptions({hide:false,hideEscort:'',veil:'',swap:'',terrainTrade:false,tradeCard:''});
  setStormOptions({second:'',chain:'',front:'',captainSwap:false,captainTrade:''});
  setRoyalOptions({rainMode:'heavy',second:'',guard:'',bastion:'',source:'',
   destination:'',relay:false,relayEscort:'',sovereign:false,discard:'',pick:''});
  setObsidianOptions({part:'',chainMachine:'',magisterSwap:false,bastionGuard:false});
  setArkOptions({archive:false,archiveDiscard:'',recoverModule:'',rayEscort:'',
   custodyEscort:'',chorusMode:'focus',chorusFirst:'',chorusSecond:'',
   custodian:false,custodianBottom:'',fused:'',resonanceEscort:'',second:''});
  setLastFx(null);setTrapReveal(null);setRewardDone(false);setHelp(null);
  submitting.current=false;
 }
 function unavailable(type,index){
  if(resolutionInProgress.current)return 'Risoluzione in corso';
  if(!battle||battle.phase!=='playing')return 'Partita terminata';
  if(battle.turn!=='A')return 'Attendi il turno avversario';
  const player=battle.sides.A;
  if((player.provisionalHandFrozenUntilMs||0)>Date.now())
   return 'Mano congelata: attendi lo sblocco, il timer continua';
  if(!type||!card(type))return 'Carta non riconosciuta';
  const role=cardRole(type);
  if(role==='character'&&!chosenCards.includes(index)&&
   player.commander?.untilPly>battle.ply)return 'Personaggio già attivo';
  const terrainCode=chosenCards.map(i=>card(player.hand[i])?.effectSpec).find(s=>s?.type==='terrain')?.code;
  const effectReason=effectUnavailableReason(card(type),player,battle,{terrainCode,
   selectedCardIds:chosenCards.map(i=>player.hand[i])});
  if(effectReason)return effectReason;
  if(!chosenCards.includes(index)){
   const due=player.falco?.pending?.releasePly<=battle.ply;
   const cancelling=chosenCards.some(i=>player.hand[i]==='nx-r01-09')||type==='nx-r01-09';
   if(due&&!falcoOptions.hold&&!cancelling&&chosenCards.length>=2)
    return 'Falco: il rilascio occupa una giocata, massimo due altre carte';
   const roles=chosenCards.map(i=>cardRole(player.hand[i]));
   if(chosenCards.length>=3)return 'Puoi giocare al massimo 3 carte per turno';
   if(role==='attack'&&player.componentTimers?.weapons?.expired&&
    roles.filter(x=>x==='attack').length>=2)
    return 'Arsenale esaurito: massimo due Carte Strategia per turno';
   if(role==='defense'&&roles.filter(x=>x==='defense').length>=2)return 'Puoi giocare al massimo 2 Difese per turno';
   if(role==='defense'){
    const selectedDefenses=chosenCards.map(i=>player.hand[i]).filter(id=>cardRole(id)==='defense');
    const capacity=defenseCapacityReason(player,[...selectedDefenses,type],battle.ply);
    if(capacity)return capacity;
   }
   if((role==='character'||role==='terrain')&&roles.includes(role))
    return role==='character'?'Puoi giocare 1 Personaggio per turno':'Puoi giocare 1 Terreno per turno';
  }
  return '';
 }
 function chooseCard(index){
  if(resolutionInProgress.current)return;
  if(chosenCards.includes(index)){setChosenCards(old=>old.filter(i=>i!==index));setMessage('');return;}
  const type=battle.sides.A.hand[index];
  const reason=unavailable(type,index);
  if(reason){setMessage(reason);return;}
  setMessage('');
  if(!chosenCards.includes(index)&&card(type)?.effectSpec?.type==='repair'&&effectNeedsOwnTarget(card(type))){
   const parts=battle.sides.A.ships[0].parts.filter(p=>!p.destroyed&&p.hp>0&&p.hp<p.maxHp);
   if(!parts.some(p=>p.id===selectedOwnVital))setSelectedOwnVital([...parts].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]?.id||'');
  }
  setChosenCards(old=>old.includes(index)?old.filter(i=>i!==index):
   old.length<3?[...old,index]:old);
 }
 function fire({endTurn=false,fromTimeout=false,chosenTarget=null,awaitingTargetSelection=false}={}){
  if(!battle||battle.phase!=='playing'||battle.turn!=='A'||resolutionInProgress.current)return;
  const requiresDelay=chosenCards.some(i=>card(battle.sides.A.hand[i])?.effectSpec?.weaponProfile?.slug==='eclissi-quantistica');
   const requiresGuess=battle.sides.B.nextEclipsePending?.guess===null;
   if(!fromTimeout&&requiresDelay&&!eclipseDelay){setMessage('Scegli segretamente il turno di riapparizione (1–3).');return;}
   if(!fromTimeout&&requiresGuess&&!eclipseGuess){setMessage('Indovina il turno di riapparizione del proiettile nemico (1–3).');return;}
   const target=battle.sides.B.ships[0];
  const partId=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?
   selectedVital:target.parts.find(p=>!p.destroyed)?.id;
  if(!partId){setMessage('Nessun componente disponibile');return;}
  const reconfig=reconfigChoices.find(c=>c.slot+':'+c.cardId===auroraOptions.reconfigureSelection);
  const secondary=forkActive?targetChoices.find(t=>t.kind+':'+t.id===auroraOptions.secondarySelection):null;
  const prismaTrap=prismaTrapChoices.find(t=>t.kind+':'+t.id===prismaOptions.trapSelection);
  const prismaArtisan=prismaTrapChoices.find(t=>t.kind+':'+t.id===prismaOptions.artisanSelection);
  const prismaEnemy=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.enemySelection);
  const prismaSecond=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.secondSelection);
  const prismaThird=prismaUnitTargets.find(t=>t.kind+':'+t.id===prismaOptions.thirdSelection);
  const falcoPrimaryChoice=falcoUnitChoices.find(t=>t.key===falcoOptions.target);
  const falcoSecondChoice=falcoUnitChoices.find(t=>t.key===falcoOptions.second);
  const falcoCorrectionChoice=falcoUnitChoices.find(t=>t.key===falcoOptions.correction);
  const mantaSecondChoice=mantaUnitChoices.find(t=>t.key===mantaOptions.second);
  const sharkArmorChoice=sharkEnemyChoices.find(t=>t.key===sharkOptions.armor);
  const sharkDecoyChoice=sharkOwnChoices.find(t=>t.key===sharkOptions.decoy);
  const sharkTeethFirstChoice=sharkEnemyChoices.find(t=>t.key===sharkOptions.teethFirst);
  const sharkTeethSecondChoice=sharkEnemyChoices.find(t=>t.key===sharkOptions.teethSecond);
  const nebulaVeilChoice=nebulaTargetChoices.find(t=>t.key===nebulaOptions.veil);
  const arkSecondChoice=arkOtherTargets.find(t=>t.key===arkOptions.second);
  const royalSecondChoice=royalOtherTargets.find(t=>t.key===royalOptions.second);
  const stormSecondChoice=stormSecondChoices.find(t=>t.key===stormOptions.second);
  const stormChainChoice=stormSecondChoices.find(t=>t.key===stormOptions.chain);
  const attackTarget=chosenTarget||actualTarget;
  const ability=elementalAbility(battle.sides.A.ships[0].id);
  const element=activeFleetElements(battle.sides.A.ships[0].id,
   battle.sides.A.ships[0].level).includes(elementalChoice)?elementalChoice:battle.sides.A.ships[0].element;
  const preparedOrder=
   {partId,pass:battle.newGeneratorCombat?false:
     (!!(elementalPrepared&&ability?.kind==='effect')||(endTurn&&chosenCards.length===0)),
    awaitingTargetSelection:!!(fromTimeout&&awaitingTargetSelection),
    activateElemental:elementalPrepared,elementalElement:element,
    elementalTargetId:attackTarget?.kind==='escort'?attackTarget.id:undefined,
    targetKind:attackTarget?.kind||'part',targetId:attackTarget?.id||partId,
    escortSlot:attackTarget?.kind==='escort'?attackTarget.slot:undefined,
    machineSlot:attackTarget?.kind==='machine'?attackTarget.slot:undefined,
    moduleSlot:attackTarget?.kind==='module'?attackTarget.slot:undefined,
    ownPartId:actualOwnVital,cards:chosenCards,
     nextEclipseTurn:eclipseDelay?Number(eclipseDelay):undefined,
     nextEclipseGuess:eclipseGuess?Number(eclipseGuess):undefined,
    recoverHandCardIndex:chosenCards.length===0&&battle.strategicNoDeterioration?
     recoverHandCardIndex:undefined,
    sacrificeEscortId:preparedSacrifice||undefined,
    fusionSlot:actualFusionSlot,
    dismantleTargets:chosenCards.some(i=>card(battle.sides.A.hand[i])?.effectSpec?.type==='dismantle')?
     [dismantleOptions.first,dismantleOptions.second].filter(Boolean):undefined,
    deckTopFlip:auroraOptions.deckTopFlip,
    sacrificeSlot:selectedActions.includes('crimson-raid')?linceOptions.sacrificeSlot:auroraOptions.sacrificeSlot,
    exchangeCardId:auroraOptions.exchangeCardId,peekPickId:auroraOptions.peekPickId,
    cartographerPickId:auroraOptions.cartographerPickId,
    reconfigureSlot:reconfig?.slot,reconfigureCardId:reconfig?.cardId,
    secondaryTargetKind:secondary?.kind,secondaryTargetId:secondary?.id,
    routePartId:linceOptions.routePartId||partId,
    heliosTrade:linceOptions.heliosTrade,heliosDiscardId:linceOptions.heliosDiscardId,
    linceRecallWeapon:linceOptions.linceRecallWeapon,
    radentRecall:linceOptions.radentRecall,radentMachineId:linceOptions.radentMachineId,
    prismaRedirectMachineId:prismaOptions.redirectMachineId,
    prismaTrapKind:prismaTrap?.kind,prismaTrapTargetId:prismaTrap?.id,
    prismaArtisanTargetKind:prismaArtisan?.kind,prismaArtisanTargetId:prismaArtisan?.id,
    prismaEnemyKind:prismaEnemy?.kind,prismaEnemyId:prismaEnemy?.id,
    prismaSecondTargetKind:prismaSecond?.kind,prismaSecondTargetId:prismaSecond?.id,
    prismaThirdTargetKind:prismaThird?.kind,prismaThirdTargetId:prismaThird?.id,
    corvoExchangeCardId:corvoOptions.exchangeCardId,corvoBottomTop:corvoOptions.bottomTop,
    falcoHold:falcoOptions.hold,falcoTargetKind:falcoPrimaryChoice?.kind,
    falcoTargetId:falcoPrimaryChoice?.id,falcoSecondTargetKind:falcoSecondChoice?.kind,
    falcoSecondTargetId:falcoSecondChoice?.id,falcoCorrectionKind:falcoCorrectionChoice?.kind,
    falcoCorrectionTargetId:falcoCorrectionChoice?.id,falcoGunnerPickId:falcoOptions.gunner,
    mantaSilence:mantaOptions.silence,mantaFork:mantaOptions.fork,
    mantaSecondTargetKind:mantaSecondChoice?.kind,mantaSecondTargetId:mantaSecondChoice?.id,
    mantaScreenEscortId:mantaOptions.screen,mantaFromEscortId:mantaOptions.from,
    mantaToEscortId:mantaOptions.to,mantaRecycleSource:mantaOptions.recycle,
    mantaRepair:mantaOptions.repair,mantaRepairTargetId:mantaOptions.repairTarget,
    sharkArmorKind:sharkArmorChoice?.kind,sharkArmorId:sharkArmorChoice?.id,
    sharkDecoyKind:sharkDecoyChoice?.kind,sharkDecoyId:sharkDecoyChoice?.id,
    sharkTeethFirstKind:sharkTeethFirstChoice?.kind,sharkTeethFirstId:sharkTeethFirstChoice?.id,
    sharkTeethSecondKind:sharkTeethSecondChoice?.kind,sharkTeethSecondId:sharkTeethSecondChoice?.id,
    sharkTorpedoMachineId:sharkOptions.torpedo,sharkShieldEscortId:sharkOptions.shield,
    sharkAdmiralEnabled:sharkOptions.admiralEnabled,
    sharkAdmiralDiscardId:sharkOptions.admiralDiscard,
    sharkSacrificeEscortId:sharkOptions.donor,sharkRecipientEscortId:sharkOptions.receiver,
    nebulaHide:nebulaOptions.hide&&!selectedActions.includes('wandering-mist'),
    nebulaHideEscortId:nebulaOptions.hideEscort,
    nebulaVeilTargetKind:nebulaVeilChoice?.kind,nebulaVeilTargetId:nebulaVeilChoice?.id,
    nebulaSwapTargetId:nebulaOptions.swap,nebulaTerrainTrade:nebulaOptions.terrainTrade,
    nebulaTradeCardId:nebulaOptions.tradeCard,
    stormSecondKind:stormSecondChoice?.kind,stormSecondId:stormSecondChoice?.id,
    stormChainTargetKind:stormChainChoice?.kind,stormChainTargetId:stormChainChoice?.id,
    stormFrontEscortId:stormOptions.front,stormCaptainSwap:stormOptions.captainSwap,
    stormCaptainTradeId:stormOptions.captainTrade,
    royalRainMode:royalOptions.rainMode,
    royalSecondKind:royalSecondChoice?.kind,royalSecondId:royalSecondChoice?.id,
    royalGuardEscortId:royalOptions.guard,royalBastionEscortId:royalOptions.bastion,
    royalSourceToken:royalOptions.source,royalDestinationEscortId:royalOptions.destination,
    royalRelay:royalRelayEnabled,royalRelayEscortId:royalOptions.relayEscort,
    royalSovereignTrade:royalOptions.sovereign,
    royalDiscardId:royalOptions.discard,royalPickId:royalOptions.pick,
    obsidianPartId:obsidianOptions.part||actualOwnVital,
    obsidianChainMachineId:obsidianOptions.chainMachine,
    obsidianMagisterSwap:obsidianOptions.magisterSwap,
    obsidianGuard:obsidianOptions.bastionGuard,
    arkArchive:arkOptions.archive,arkArchiveDiscardId:arkOptions.archiveDiscard,
    arkRecoverModuleId:arkOptions.recoverModule,
    arkRayEscortId:arkOptions.rayEscort,arkCustodyEscortId:arkOptions.custodyEscort,
    arkChorusMode:arkOptions.chorusMode,arkChorusFirstId:arkOptions.chorusFirst,
    arkChorusSecondId:arkOptions.chorusSecond,
    arkCustodianSwap:arkOptions.custodian,arkCustodianBottomId:arkOptions.custodianBottom,
    arkFusedId:arkOptions.fused,arkResonanceEscortId:arkOptions.resonanceEscort,
    arkSecondKind:arkSecondChoice?.kind,arkSecondId:arkSecondChoice?.id
   };
  const result=fromTimeout?
   timeoutFleetTurn(battle,Math.max(Date.now(),battle.deadlineMs),preparedOrder):
   resolvePreparedFleetTurn(battle,'A',preparedOrder,Date.now());
  if(!result.ok){setMessage(result.reason);return;}
  showResult(result,preparedOrder.cards);
  if(result.invalidPrepared&&result.droppedPreparedCards>0)
   setMessage(result.playedPreparedCards+' carte risolte; '+result.droppedPreparedCards+' escluse perché non valide.');
  setDismantleOptions({first:'',second:''});
  setRecoverHandCardIndex(0);
  setCorvoOptions({exchangeCardId:'',bottomTop:false});
  setFalcoOptions({hold:false,target:'',second:'',correction:'',gunner:''});
  setMantaOptions({silence:false,fork:false,second:'',screen:'',from:'',to:'',
   recycle:'',repair:true,repairTarget:''});
  setSharkOptions({armor:'',decoy:'',teethFirst:'',teethSecond:'',torpedo:'',shield:'',
   admiralDiscard:'',admiralEnabled:true,donor:'',receiver:''});
  setNebulaOptions({hide:false,hideEscort:'',veil:'',swap:'',terrainTrade:false,tradeCard:''});
  setStormOptions({second:'',chain:'',front:'',captainSwap:false,captainTrade:''});
  setRoyalOptions({rainMode:'heavy',second:'',guard:'',bastion:'',source:'',
   destination:'',relay:false,relayEscort:'',sovereign:false,discard:'',pick:''});
  setObsidianOptions({part:'',chainMachine:'',magisterSwap:false,bastionGuard:false});
  setArkOptions({archive:false,archiveDiscard:'',recoverModule:'',rayEscort:'',
   custodyEscort:'',chorusMode:'focus',chorusFirst:'',chorusSecond:'',
   custodian:false,custodianBottom:'',fused:'',resonanceEscort:'',second:''});
  setLinceOptions({routePartId:'',sacrificeSlot:'',heliosTrade:false,heliosDiscardId:'',
   linceRecallWeapon:false,radentRecall:false,radentMachineId:''});
  const nextTarget=result.battle.sides.B.ships[0].parts.find(p=>!p.destroyed);
  if(!result.battle.sides.B.ships[0].parts.some(p=>p.id===partId&&!p.destroyed))
   if(nextTarget)setSelectedVital(nextTarget.id);
 }
 function requestPreparedResolution(endTurn=false){
  if(!battle||battle.phase!=='playing'||battle.turn!=='A'||resolutionInProgress.current)return;
  // Bersaglio scelto sul tavolo o supporto predefinito: nessuna dialog a fine preparazione.
  fire({endTurn});
 }
 function passTurn(){
  requestPreparedResolution(true);
 }
 preparedTimeout.current=()=>fire({endTurn:true,fromTimeout:true});
  async function leave(){
  if(busy||submitting.current)return;
  if(initialBattle){onExit?.();return;}
  if(!battle||battle.phase!=='finished'){
   if(window.confirm('Abbandonare la battaglia senza ricompense?'))onExit?.();
   return;
  }
  submitting.current=true;setBusy(true);
  try{
   const won=battle.winner==='A';
   if(won&&gameMode!=='pvp'){
    await claimOfficialLiveVictoryRewards({
     winner:'player',mode:gameMode,sectorNumber,bossPlanetId,bossSectorLevel});
    const inventory=readFleetInventory();
    const key='sector:'+gameMode+':'+sectorNumber+':'+(bossPlanetId||'none');
    const reward=claimFleetReward(inventory,key,fleetRewardForBattle({
     winner:'A',mode:gameMode,sector:sectorNumber,boss:!!bossPlanetId
    }));
    if(reward.ok)writeFleetInventory(reward.inventory);
   }
   const me=battle.sides.A,op=battle.sides.B;
   const modern=me.ruleset===HP_SYNC_RULESET;
   const max=(modern?me.ships[0].maxHp:
    me.ships[0].parts.reduce((sum,p)=>sum+p.maxHp,0))+
    me.escorts.reduce((sum,e)=>sum+e.maxHp,0);
   const hp=(modern?me.ships[0].hp:
    me.ships[0].parts.reduce((sum,p)=>sum+p.hp,0))+
    me.escorts.reduce((sum,e)=>sum+e.hp,0);
   const health=Math.max(0,Math.min(1,hp/Math.max(1,max)));
   const result=won?'player':battle.winner==='B'?'enemy':'draw';
   const meta={
    turnsElapsed:battle.round,
    activeTimeElapsedMs:Math.max(0,Date.now()-battle.startedAtMs),
    remainingHpPct:health,isPvP:gameMode==='pvp',
    starsEarned:[won,won&&health>=.65,won&&health>=.9],
    matchStats:{
     turnsElapsed:battle.round,sectorNumber,
     damageDealt:modern?op.ships[0].maxHp-op.ships[0].hp:op.ships[0].parts.reduce((sum,p)=>sum+p.maxHp-p.hp,0),
     enemyVitalsDestroyed:op.ships[0].parts.filter(p=>p.destroyed).length,
     bossPlanetId:bossPlanetId??null,bossSectorLevel:bossSectorLevel??null
    }
   };
   setRewardDone(true);
   if(gameMode!=='pvp')onResult?.(result,meta);
   onExit?.();
  }catch(e){submitting.current=false;setMessage('Ricompense non salvate: '+(e.message||'Riprova'));}
  finally{setBusy(false);}
 }
 if(!battle)return <main className="es-math-scope official-start-error">
  <h2>ECLISSI STELLARE</h2><p role="alert">{session.error}</p>
  <button onClick={restart}>RIPROVA</button>
  <button onClick={()=>onExit?.()}>TORNA AL MENU</button>
 </main>;
 const player=battle.sides.A,enemy=battle.sides.B;
 const elementalAbilityDef=elementalAbility(player.ships[0].id);
 const elementalTypes=activeFleetElements(player.ships[0].id,player.ships[0].level);
 const selectedElement=elementalTypes.includes(elementalChoice)?elementalChoice:elementalTypes[0];
 // La barra legge CARTE FISICHE, non la somma delle cariche di rarita'.
 // Si possono giocare le tre carte e PRENOTARE solo dopo, premendo poi ESEGUI.
 const generatorPhysicalCards=generatorCardCount(player)+
  chosenCards.filter(i=>card(player.hand[i])?.effectSpec?.type==='energy').length;
 const generatorCooling=generatorCoolingOwnTurns(player);
 const generatorTier=generatorPhysicalCards>=4?'heavy':generatorPhysicalCards>=2?'quick':null;
 const actualEnergyCost=effectiveSupportEnergyCost(player,elementalAbilityDef,battle.ply);
 const chargesAvailable=chargedElementalEnergy(player,selectedElement)+
  chosenCards.filter(i=>card(player.hand[i])?.effectSpec?.type==='energy'&&
   card(player.hand[i])?.effectSpec?.elementId===selectedElement)
   .reduce((sum,i)=>sum+(card(player.hand[i])?.effectSpec?.charges||0),0);
 const canPrepareElemental=battle.newGeneratorCombat?
  (!!generatorTier&&generatorCooling===0):
  (!!elementalAbilityDef&&chargesAvailable>=actualEnergyCost&&
  !chosenCards.some(i=>cardRole(player.hand[i])==='attack')&&
  (elementalAbilityDef.mode!=='heal'||player.ships[0].hp<player.ships[0].maxHp&&
   (battle.terrain?.id!=='T08'||terrainImmunity(player,battle.ply))));
 const ended=battle.phase==='finished';
 const target=enemy.ships[0];
 const actualVital=target.parts.find(p=>p.id===selectedVital&&!p.destroyed)?.id||
  target.parts.find(p=>!p.destroyed)?.id;
 const chosenTypes=chosenCards.map(i=>player.hand[i]).filter(Boolean);
 const fusionCandidates=player.escorts.filter(e=>e.hp>0&&!e.destroyed&&!e.fused&&
  (e.supportRarity?e.supportRarity==='Leggendaria':isMaxSupportLevel(e.supportLevel)));
 const actualFusionSlot=fusionCandidates.some(e=>e.slot===fusionSlot)?
  fusionSlot:fusionCandidates[0]?.slot??0;
 const fusionSelected=chosenTypes.some(id=>card(id)?.effectSpec?.type==='shipFusion');
 const directBypass=chosenTypes.some(id=>{
  const spec=card(id)?.effectSpec;
  return spec?.type==='bypass'||spec?.type==='lince'&&LINCE_BYPASS_ACTIONS.includes(spec.action)||
   spec?.type==='shark'&&spec.action==='ruthless-response';
 });
 const routePartId=linceMarkedRouteReady(player,battle.ply,player.lince?.route?.partId)?player.lince.route.partId:null;
 const bypass=directBypass||!!routePartId;
 const protectors=protectingFleetUnits(enemy,battle.ply);
 const targetChoices=availableFleetTargets(enemy,battle.ply).filter(t=>!t.blocked||directBypass||
  t.kind==='part'&&t.id===routePartId);
 const obsidianHowitzer=chosenTypes.some(id=>card(id)?.effectSpec?.action==='black-howitzer');
 const actualTarget=(obsidianHowitzer?
  (targetChoices.find(t=>t.kind==='machine'&&selectedTarget?.kind==='machine'&&t.id===selectedTarget.id)||
   targetChoices.find(t=>t.kind==='machine')):null)||
  targetChoices.find(t=>selectedTarget&&t.kind===selectedTarget.kind&&t.id===selectedTarget.id)||
  (bypass||!protectors.length?
   targetChoices.find(t=>t.kind==='part'&&t.id===(routePartId||actualVital)):null)||
  (hologramDisplayEscorts(enemy,battle.ply)?targetChoices.find(t=>t.kind==='escort'):protectors[0])||targetChoices[0];
 const ownTargets=player.ships[0].parts.filter(p=>!p.destroyed&&p.hp>0);
 const actualOwnVital=ownTargets.find(p=>p.id===selectedOwnVital)?.id||
  [...ownTargets].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]?.id;
 const needsOwnTarget=chosenTypes.some(type=>effectNeedsOwnTarget(card(type)));
 const playerSlots=projectFleetSlots(player,chosenTypes,'A');
 const enemySlots=projectFleetSlots(enemy,[],'B');
 const selectedType=chosenCards.length?player.hand[chosenCards.at(-1)]:null;
 const selectedActions=chosenTypes.map(id=>card(id)?.effectSpec?.action).filter(Boolean);
 const dismantleCardChosen=chosenTypes.map(id=>card(id)).find(c=>c?.effectSpec?.type==='dismantle');
 const dismantleChoices=dismantleCandidates(enemy,battle.ply);
 const enemyDismantle=dismantleActive(enemy,battle.ply);
 const arkActive=player.ships[0].id==='L04';
 const arkLiving=player.escorts.filter(e=>e.hp>0&&!e.destroyed);
 const arkReady=arkEscorts(player,battle.ply);
 const arkDamaged=arkDamagedEscorts(player,battle.ply);
 const arkUnfused=arkUnfusedEscorts(player,battle.ply);
 const arkFused=arkFusedEscorts(player,battle.ply);
 const arkTargetChoices=arkEnemyUnits(enemy).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const arkOtherTargets=arkTargetChoices.filter(t=>t.id!==actualTarget?.id);
 const arkArchiveActive=arkActive&&arkModuleActive(player,'nx-l04-01',battle.ply);
 const arkRecoverChoices=arkModulesInDiscard(player);
 const arkHandSpare=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const arkCustodianActive=arkActive&&
  (player.commander?.id==='ex-l04-01'&&player.commander.untilPly>battle.ply||
   selectedActions.includes('astral-keeper'));
 const arkChorusFirst=arkDamaged.find(e=>e.id===arkOptions.chorusFirst)||arkDamaged[0];
 const arkChorusOthers=arkDamaged.filter(e=>e.id!==arkChorusFirst?.id);
 const arkActiveFused=arkFused.find(e=>e.id===arkOptions.fused)||arkFused[0];
 const obsidianActive=player.ships[0].id==='L03';
 const obsidianFused=obsidianFusedEscort(player,battle.ply);
 const obsidianPendingShot=obsidianPending(player);
 const obsidianEnemyMachines=enemy.machines.filter(m=>m.hp>0&&!m.destroyed);
 const obsidianVitalParts=player.ships[0].parts.filter(p=>p.hp>0&&!p.destroyed);
 const obsidianCanGuard=obsidianActive&&!!obsidianFused&&
  !selectedActions.includes('obsidian-fusion');
 const royalActive=player.ships[0].id==='L01';
 const royalSupportsAlive=royalSupports(player,battle.ply);
 const royalProtections=royalVisibleProtections(player,battle.ply);
 const royalSource=royalProtections.find(p=>p.source===royalOptions.source)||royalProtections[0];
 const royalSourceEscort=royalSupportsAlive.find(e=>e.slot===royalSource?.escortSlot);
 const royalDestinationChoices=royalSupportsAlive.filter(e=>e.id!==royalSourceEscort?.id);
 const royalEnemyChoices=royalUnits(enemy,battle.ply).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const royalOtherTargets=royalEnemyChoices.filter(t=>t.id!==actualTarget?.id);
 const royalAttackChosen=selectedActions.some(a=>['royal-rain','coordinated-judgment'].includes(a));
 const royalRelayAvailable=royalActive&&royalCapableModule(player,'nx-l01-01',battle.ply)&&
  royalSupportsAlive.length>0&&royalAttackChosen;
 const royalRelayEnabled=royalRelayAvailable&&(royalOptions.relay||!royalPart(player,'weapons'));
 const royalSovereignActive=royalActive&&royalSupportsAlive.length>=2&&
  (selectedActions.includes('eclipse-sovereign')||
   player.commander?.id==='ex-l01-01'&&player.commander.untilPly>battle.ply);
 const royalDiscardChoices=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const royalTopThree=player.deck.slice(0,3);
 const stormActive=player.ships[0].id==='E02';
 const stormEnemyChoices=stormUnits(enemy,battle.ply).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const stormSecondChoices=stormEnemyChoices.filter(t=>t.id!==actualTarget?.id);
 const stormOwnSupports=stormSupports(player,battle.ply);
 const stormCaptainActive=player.commander?.id==='ex-e02-01'&&
  player.commander.untilPly>battle.ply||selectedActions.includes('storm-captain');
 const stormSpare=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const stormMultiple=selectedActions.some(x=>['rebound-lightning','selective-discharge','storm-quadrant'].includes(x));
 const nebulaActive=player.ships[0].id==='E01';
 const nebulaFog=nebulaHiddenSupport(player,battle.ply);
 const nebulaVisible=nebulaVisibleSupports(player,battle.ply);
 const nebulaTargetChoices=nebulaTargets(player).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const nebulaTerrainSelected=chosenTypes.some(id=>cardRole(id)==='terrain');
 const nebulaArchonActive=(player.commander?.id==='ex-e01-01'&&
  player.commander.untilPly>battle.ply)||selectedActions.includes('mist-archon');
 const nebulaTradeChoices=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const nebulaCanHide=nebulaActive&&!selectedActions.includes('wandering-mist')&&
  !nebulaHideReason(player,battle.ply);
 const sharkActive=player.ships[0].id==='R04';
 const sharkEnemyChoices=sharkUnits(enemy).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const sharkOwnChoices=sharkOperationalUnits(player,battle.ply).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const sharkWounded=sharkWoundedSupports(player,battle.ply);
 const sharkDamagedMachines=sharkWoundedMachines(player,battle.ply);
 const sharkDonors=sharkWounded;
 const sharkTeethPrimary=sharkEnemyChoices.find(t=>t.key===sharkOptions.teethFirst)||sharkEnemyChoices[0];
 const sharkTeethRemaining=sharkEnemyChoices.filter(t=>t.id!==sharkTeethPrimary?.id);
 const sharkDonor=sharkWounded.find(e=>e.id===sharkOptions.donor)||sharkWounded[0];
 const sharkReceivers=sharkWounded.filter(e=>e.id!==sharkDonor?.id);
 const sharkDiscardChoices=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const mantaActive=player.ships[0].id==='R02';
 const mantaSupports=mantaActiveSupports(player,battle.ply);
 const mantaUnitChoices=mantaEnemyUnits(enemy).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const mantaSecondChoices=mantaUnitChoices.filter(t=>t.id!==actualTarget?.id);
 const mantaVisible=mantaVisibleProtections(player,battle.ply);
 const mantaDamaged=mantaSupports.filter(e=>e.hp<e.maxHp);
 const falcoActive=player.ships[0].id==='R01';
 const falcoPending=player.falco?.pending;
 const falcoReleaseDue=!!(falcoPending&&falcoPending.releasePly<=battle.ply);
 const falcoUnitChoices=falcoUnits(enemy).map(({kind,unit})=>({
  kind,id:unit.id,key:kind+':'+unit.id,name:unit.name,
  hp:unit.hp,maxHp:unit.maxHp
 }));
 const falcoPrimary=falcoUnitChoices.find(t=>t.key===falcoOptions.target)||
  falcoUnitChoices.find(t=>t.id===actualTarget?.id)||falcoUnitChoices[0];
 const falcoOtherChoices=falcoUnitChoices.filter(t=>t.id!==falcoPrimary?.id);
 const falcoCorrectionSource=falcoPending?.shots?.[0]?.id||falcoPrimary?.id;
 const falcoCorrectionChoices=falcoUnitChoices.filter(t=>t.id!==falcoCorrectionSource&&
  !falcoPending?.shots?.slice(1).some(x=>x.id===t.id));
 const falcoGunnerChoices=player.deck.slice(0,3).filter(id=>
  cardRole(id)==='defense'&&!['nx-c03-04','nx-c01-04','nx-c02-04'].includes(id));
 const prismaUnitTargets=livePrismaUnits(enemy,battle.ply,false).map(({kind,unit})=>({
  kind,id:unit.id,name:unit.name,hp:unit.hp,maxHp:unit.maxHp
 }));
 const prismaTrapChoices=availableFleetTargets(player,battle.ply,false);
 const prismaMachines=player.machines.filter(m=>m.hp>0&&!m.destroyed&&
  (m.disabledUntilPly||0)<=battle.ply&&(m.jammedUntilPly||0)<=battle.ply);
 const prismaAttack=selectedActions.find(a=>PRISMA_ATTACK_ACTIONS.includes(a));
 const prismaSecondChoices=prismaUnitTargets.filter(t=>t.id!==actualTarget?.id);
 const prismaSelectedSecond=prismaUnitTargets.find(t=>
  t.kind+':'+t.id===prismaOptions.secondSelection);
 const prismaThirdChoices=prismaSecondChoices.filter(t=>t.id!==prismaSelectedSecond?.id);
 const linceMachineChoices=player.machines.filter(m=>m.hp>0&&!m.destroyed&&m.sourceCardId);
 const heliosAvailable=(player.commander?.id==='ex-c01-01'||selectedActions.includes('helios'))&&
  directBypass;
 const heliosDiscardChoices=player.hand.filter((id,i)=>!chosenCards.includes(i));
 const radentReady=installedModule(player,'utility')?.cardId==='nx-c01-01'&&
  linceMachineChoices.length>0&&(directBypass||!!routePartId);
 const linceExtra=heliosAvailable||radentReady;
 const reconfigChoices=reconfigurationOptions(player,card,player.ships[0].level);
 const sacrificeOptions=liveModules(player);
 const adaptationOptions=player.hand.filter((id,i)=>!chosenCards.includes(i)&&card(id)?.shipId==='N00');
 const topThree=player.deck.slice(0,3);
 const cartographerOptions=player.deck.slice(0,4).filter(id=>isAuroraModule(id));
 const opticsActive=selectedActions.some(a=>['optics','piercing-barrel','modular-armor','forked-cannon'].includes(a))&&
  (selectedActions.includes('optics')||installedModule(player,'utility')?.cardId==='nx-n00-01');
 const forkChoices=targetChoices.filter(t=>actualTarget&&t.id!==actualTarget.id);
 const forkActive=installedModule(player,'weapon')?.cardId==='nx-n00-09'&&
  !selectedActions.some(a=>['burst','dismantle'].includes(a));
 const terrain=battle.terrain?.id;
 const boss=battle.bossId?{name:battle.bossName||'BOSS',ability:'ABILITÀ',
  description:describeBossPassive(battle.bossId)}:null;
 const readableTerrain=terrain?TERRAIN_CATALOG[terrain]?.name||'TERRENO':'NEUTRO';
 const remainingTurnMs=ended?0:Math.max(0,Math.min(FLEET_TURN_SECONDS*1000,battle.deadlineMs-now));
 const secondsLeft=Math.ceil(remainingTurnMs/1000);
 const turnProgress=remainingTurnMs/(FLEET_TURN_SECONDS*1000);
 const myTurn=battle.turn==='A';
 const eclipseChosen=chosenTypes.some(id=>card(id)?.effectSpec?.weaponProfile?.slug==='eclissi-quantistica');
 const eclipseNeedsGuess=enemy.nextEclipsePending?.guess===null;
 return <div className="es-math-scope live-viewport" ref={viewportRef} aria-busy={resolving}>
  <div className="es-root official-duel-3d live-root f3d-original-arena f3d-approved-layout"
   style={{transform:'translate(-50%,-50%) scale('+scale+')',
    '--official-category-symbols':'url("'+ASSET_ROOT+'/fleet-ui/category-symbols.png")',
    '--live-special-back':'url("'+OFFICIAL_SPECIAL_FIXED_BACK+'")'}}>
   <div className="space-back metal-arena live-background" aria-hidden="true"
    style={{backgroundImage:'url('+ASSET_ROOT+'/mathduel/arena_titanio_9x16.webp)'}}/>
   {terrain&&TERRAIN_CATALOG[terrain]&&<div className="f3d-terrain-environment"
    key={'terrain-'+terrain} data-terrain={terrain} aria-hidden="true"
    style={{'--f3d-terrain-image':TERRAIN_CATALOG[terrain].kind==='elemental'?
     'radial-gradient(ellipse at center, rgba(43,112,170,.18), transparent 75%)':
     'url("/assets/fleet-terrain-scenes/'+terrain+'.svg")'}}/>}
   <FleetOpponentConsole unit={enemy} ply={battle.ply} nickname={opponentNickname||battle.bossName||enemy.ships?.[0]?.name||'Avversario'}
    onInspect={vital=>setHelp({vital})}/>
   <OriginalFleetFighter side="enemy" unit={enemy} selectedVital={actualTarget?.kind==='part'?actualTarget.id:null}
    weaponShots={resolving?lastFx?.weaponShots?.filter(s=>s.who==='B'):[]}
    resolvedUnit={resolving?lastFx?.resolvedSides?.B:null}
    selectedTarget={actualTarget} onSelectTarget={setSelectedTarget}
    canTarget={!ended&&myTurn&&!resolving} ply={battle.ply}
    onSelectVital={id=>{if(!ended&&myTurn){
     if(protectors.length&&!directBypass&&id!==routePartId){setMessage('Prima elimina i supporti e le macchine, oppure gioca Aggiramento.');return;}
     setSelectedVital(id);setSelectedTarget({kind:'part',id});setMessage('');
    }}}
    impact={resolving&&!lastFx?.weaponShots?.some(s=>s.who==='A'&&s.fires)&&
     lastFx?.events?.find(e=>e.kind==='impact'&&e.who==='A')&&
     {...lastFx.events.find(e=>e.kind==='impact'&&e.who==='A'),round:lastFx.nonce}}
    inspectEscort={setHelp}/>
   <div className="f3d-slot-field">
    <OriginalSpecialSlots side="B" contents={enemySlots} upgrades={enemy.exclusiveUpgrades} unit={enemy}/>
    <OriginalSpecialSlots side="A" contents={playerSlots} upgrades={player.exclusiveUpgrades} inspectTrap={setHelp} unit={player}/>
   </div>
   <OriginalFleetFighter side="player" unit={player} chosenCards={chosenTypes} ply={battle.ply}
    weaponShots={resolving?lastFx?.weaponShots?.filter(s=>s.who==='A'):[]}
    resolvedUnit={resolving?lastFx?.resolvedSides?.A:null}
    selectedVital={needsOwnTarget?actualOwnVital:null} canSelectOwn={needsOwnTarget&&myTurn&&!ended&&!resolving}
    onSelectVital={id=>{if(ownTargets.some(p=>p.id===id)){setSelectedOwnVital(id);setMessage('');}}}
    impact={resolving&&!lastFx?.weaponShots?.some(s=>s.who==='B'&&s.fires)&&
     lastFx?.events?.find(e=>e.kind==='impact'&&e.who==='B')&&
     {...lastFx.events.find(e=>e.kind==='impact'&&e.who==='B'),round:lastFx.nonce}}
    inspectEscort={setHelp}/>
   <MagneticGrappleTethers battle={battle} resolving={resolving} fx={lastFx}/>
   <ProbeHammerMarks battle={battle} resolving={resolving} fx={lastFx}/>
   {resolving&&(lastFx?.weaponShots?.length>0||lastFx?.selectedCards?.length>0||lastFx?.events?.some(e=>['weapon-break-defense','weapon-core-expired'].includes(e.kind)))&&<MaglioBattleEffects
    key={lastFx.nonce} shots={lastFx.weaponShots} selectedCards={lastFx.selectedCards}
    playerSide={player} ply={battle.ply} nonce={lastFx.nonce} events={lastFx.events}
    resolvedSides={lastFx.resolvedSides} startedAt={lastFx.startedAt}/>}
   <FleetDeckPiles side={player}/>
   <div className="f3d-weapon-card-slots" role="group" aria-label="Due slot Carte Arma">
    {projectMachineBerths(player,chosenTypes,battle.ply).map((machine,slot)=>{
     const faceId=machine?.sourceCardId||(machine?.pending?machine.id:null);
     const artwork=faceId?cardFacePath(faceId):null;
     return <button type="button" key={slot} className="f3d-weapon-card" data-fleet-weapon-slot={slot}
      title={machine?(cardTextName(card(faceId))||machine.name||'Arma'):'Slot ARMA '+(slot+1)}
      aria-label={machine?(cardTextName(card(faceId))||machine.name||'Arma'):'Slot ARMA '+(slot+1)}
      onClick={()=>machine&&setHelp({machine})}>
      {artwork?<><img src={artwork} alt="" draggable={false}/><WeaponSalvoCardMarks cardId={faceId}/></>:
       <span className="f3d-weapon-icon" aria-hidden="true">⚔</span>}
      <span className="f3d-weapon-label">ARMA {slot+1}</span>
     </button>;
    })}
   </div>
   <div className="live-special-hand" role="group" aria-label="Sette carte del mazzo"
    data-frozen={(player.provisionalHandFrozenUntilMs||0)>now||undefined}>
    {(player.provisionalHandFrozenUntilMs||0)>now&&<span className="f3d-hand-freeze" role="status">
     Mano congelata · {Math.ceil((player.provisionalHandFrozenUntilMs-now)/1000)} s</span>}
    {player.hand.map((type,index,hand)=><OriginalSpecialHandCard
     key={battle.round+'-'+index+'-'+type} type={type} index={index}
     offset={index-(hand.length-1)/2}
     selected={chosenCards.includes(index)} disabled={ended||!myTurn||resolving||(player.provisionalHandFrozenUntilMs||0)>now}
     grade={player.exclusiveUpgrades?.[type]||1} motherLevel={player.ships[0].level}
     modernBalance={!!player.newGeneratorCombat}
     unavailableReason={unavailable(type,index)}
     onClick={()=>chooseCard(index)}/>)}
   </div>
   {((showBattleCommands&&(selectedType||forkActive||linceExtra||falcoActive||mantaActive||sharkActive||nebulaActive||stormActive||royalActive||obsidianActive||arkActive))||(myTurn&&(eclipseChosen||eclipseNeedsGuess)))&&!ended&&<div className="live-card-inspector" role="group" aria-label="Opzioni avanzate delle carte">
     {myTurn&&eclipseChosen&&<label>Eclissi Quantistica — turno segreto di riapparizione <select aria-label="Turno segreto di riapparizione" value={eclipseDelay} disabled={resolving} onChange={e=>setEclipseDelay(e.target.value)}><option value="">Scegli turno</option>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
     {myTurn&&eclipseNeedsGuess&&<label>Proiettile nemico nascosto — indovina il turno <select aria-label="Previsione turno avversario" value={eclipseGuess} disabled={resolving} onChange={e=>setEclipseGuess(e.target.value)}><option value="">Scegli previsione</option>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></label>}
   {!ended&&fusionSelected&&<label className="f3d-fusion-choice">
    <span>FONDI CON IL SUPPORTO MAX · </span>
    {fusionCandidates.length?<select aria-label="Supporto da fondere" value={actualFusionSlot}
     disabled={!myTurn} onChange={event=>setFusionSlot(Number(event.target.value))}>
     {fusionCandidates.map(escort=><option key={escort.id} value={escort.slot}>
      {escort.name} · {escort.supportRarity||'Supporto al massimo'} · {escort.hp}/{escort.maxHp} HP
     </option>)}
    </select>:<span>Serve un supporto al livello massimo del suo modello.</span>}
   </label>}
    <div className="f3d-selected-effects">{chosenTypes.map((type,i)=><p key={type+'-'+i}>
     <b>{card(type)?.nome||card(type)?.name||type}</b>
     {' — '+describeEffect(displayedCard(type,player.newGeneratorCombat),player.exclusiveUpgrades?.[type]||1)}
    </p>)}</div>
    {enemyDismantle.length>0&&<p>Smontaggio nemico attivo: {enemyDismantle.map(e=>
     e.targets.join(', ')+' · '+e.remainingTurns+' turni').join('; ')}</p>}
    {dismantleCardChosen?.effectSpec?.mode==='components'&&dismantleChoices.length>0&&<>
     <label>Smontaggio Forzato — componente avversario:
      <select value={dismantleOptions.first}
       onChange={e=>setDismantleOptions({first:e.target.value,second:''})}>
       <option value="">Primo componente aggiunto o potenziato</option>
       {dismantleChoices.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
     </label>
     {dismantleCardChosen.effectSpec.count===2&&dismantleChoices.length>1&&
      <label>Secondo componente da smontare (facoltativo):
       <select value={dismantleOptions.second}
        onChange={e=>setDismantleOptions(o=>({...o,second:e.target.value}))}>
        <option value="">Nessun secondo componente</option>
        {dismantleChoices.filter(t=>t.key!==dismantleOptions.first)
         .map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
       </select>
      </label>}
    </>}
    {dismantleCardChosen?.effectSpec?.mode==='base'&&
     <p>Smontaggio Leggendario: riporta la nave avversaria alla configurazione operativa L1 per due turni, senza riparare HP.</p>}
    {needsOwnTarget&&<label className="f3d-own-target">Tuo componente:
     <select value={actualOwnVital||''} onChange={e=>setSelectedOwnVital(e.target.value)} aria-label="Componente da proteggere o riparare">
      {ownTargets.map(p=><option key={p.id} value={p.id}>{VITAL_LABELS[p.id]} · {p.hp}/{p.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('sacrificial-veil')&&<label>Modulo da sacrificare:
     <select value={auroraOptions.sacrificeSlot} onChange={e=>setAuroraOption('sacrificeSlot',e.target.value)}>
      <option value="">Primo modulo operativo</option>
      {sacrificeOptions.map(m=><option key={m.id} value={m.slot}>{m.name} · {m.hp}/2</option>)}
     </select>
    </label>}
    {opticsActive&&player.deck.length>1&&<label>Ottica — ordina le prime due carte:
     <select value={auroraOptions.deckTopFlip?'reverse':'keep'} onChange={e=>setAuroraOption('deckTopFlip',e.target.value==='reverse')}>
      <option value="keep">{player.deck.slice(0,2).map(id=>card(id)?.name||card(id)?.nome||id).join(' → ')}</option>
      <option value="reverse">{player.deck.slice(0,2).reverse().map(id=>card(id)?.name||card(id)?.nome||id).join(' → ')}</option>
     </select>
    </label>}
    {selectedActions.includes('adapt')&&<>
     <label>Esclusiva da mettere sotto il mazzo:
      <select value={auroraOptions.exchangeCardId} onChange={e=>setAuroraOption('exchangeCardId',e.target.value)}>
       <option value="">Prima esclusiva disponibile</option>
       {adaptationOptions.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
      </select>
     </label>
     <label>Scegli fra le prime tre:
      <select value={auroraOptions.peekPickId} onChange={e=>setAuroraOption('peekPickId',e.target.value)}>
       <option value="">Prima carta disponibile</option>
       {topThree.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('cartographer')&&<label>Cartografo — cerca tra quattro carte:
     <select value={auroraOptions.cartographerPickId} onChange={e=>setAuroraOption('cartographerPickId',e.target.value)}>
      <option value="">Primo modulo individuato</option>
      {cartographerOptions.map((id,i)=><option key={id+i} value={id}>{card(id)?.name||card(id)?.nome||id}</option>)}
     </select>
    </label>}
    {selectedActions.includes('reconfigure')&&<label>Riconfigurazione — modulo sostitutivo:
     <select value={auroraOptions.reconfigureSelection} onChange={e=>setAuroraOption('reconfigureSelection',e.target.value)}>
      <option value="">Primo modulo compatibile</option>
      {reconfigChoices.map(c=><option key={c.slot+c.cardId} value={c.slot+':'+c.cardId}>{c.name} · {c.slot}</option>)}
     </select>
    </label>}
    {forkActive&&forkChoices.length>0&&<label>Cannone biforcato — secondo bersaglio:
     <select value={auroraOptions.secondarySelection} onChange={e=>setAuroraOption('secondarySelection',e.target.value)}>
      <option value="">Non dividere il colpo</option>
      {forkChoices.map(t=><option key={t.kind+t.id} value={t.kind+':'+t.id}>{t.name} · {t.hp}/{t.maxHp}</option>)}
     </select>
    </label>}
    {arkActive&&<p className="f3d-ark-readout">
     <b>Arca Astrale</b>{' · '+player.fusionsUsed+'/'+player.fusionLimit+
      ' fusioni · '+player.reserveEscorts.length+' supporti in riserva'}
     {arkFused.length>0&&' · '+arkFused.length+' fusioni operative'}
    </p>}
    {arkActive&&selectedActions.includes('ark-fusion')&&<p className="f3d-ark-readout">
     Fusione dell’Arca: la prima unisce i supporti 1 e 2 e, dal livello 3,
     schiera il terzo. La seconda, al livello 5, fonde il terzo e il quarto
     dalla riserva. Nessun supporto gratuito
    </p>}
    {arkArchiveActive&&arkRecoverChoices.length>0&&arkHandSpare.length>0&&<>
     <label><input type="checkbox" checked={arkOptions.archive}
       onChange={e=>setArkOption('archive',e.target.checked)}/>
      Archivio stellare: scarta una carta per recuperare un vero modulo con 1 integrità
     </label>
     {arkOptions.archive&&<>
      <label>Carta da scartare:
       <select value={arkOptions.archiveDiscard}
        onChange={e=>setArkOption('archiveDiscard',e.target.value)}>
        <option value="">Prima carta non giocata</option>
        {arkHandSpare.map((id,i)=><option key={id+':'+i} value={id}>
         {card(id)?.nome||card(id)?.name||id}</option>)}
       </select>
      </label>
      <label>Modulo da recuperare (non montato):
       <select value={arkOptions.recoverModule}
        onChange={e=>setArkOption('recoverModule',e.target.value)}>
        <option value="">Primo modulo Arca negli scarti</option>
        {arkRecoverChoices.map((id,i)=><option key={id+':'+i} value={id}>
         {card(id)?.nome||card(id)?.name||id}</option>)}
       </select>
      </label>
     </>}
    </>}
    {selectedActions.includes('conserving-ray')&&arkLiving.length>0&&
     <label>Raggio conservativo — supporto da riparare dopo un colpo riuscito:
      <select value={arkOptions.rayEscort}
       onChange={e=>setArkOption('rayEscort',e.target.value)}>
       <option value="">Primo supporto vivo ferito disponibile</option>
       {arkLiving.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('reserve-custody')&&arkUnfused.length>0&&
     <label>Custodia delle riserve — supporto non fuso protetto:
      <select value={arkOptions.custodyEscort}
       onChange={e=>setArkOption('custodyEscort',e.target.value)}>
       <option value="">Primo supporto non fuso</option>
       {arkUnfused.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('repair-chorus')&&arkDamaged.length>0&&<>
     <label>Coro di riparazione — distribuisci due punti:
      <select value={arkOptions.chorusMode}
       onChange={e=>setArkOptions(o=>({...o,chorusMode:e.target.value,chorusSecond:''}))}>
       <option value="focus">Due punti a un supporto</option>
       <option value="split">Un punto a ciascuno di due supporti</option>
      </select>
     </label>
     <label>Primo supporto da riparare:
      <select value={arkOptions.chorusFirst}
       onChange={e=>setArkOptions(o=>({...o,chorusFirst:e.target.value,chorusSecond:''}))}>
       <option value="">Primo supporto ferito</option>
       {arkDamaged.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>
     {arkOptions.chorusMode==='split'&&arkChorusOthers.length>0&&
      <label>Secondo supporto da riparare:
       <select value={arkOptions.chorusSecond}
        onChange={e=>setArkOption('chorusSecond',e.target.value)}>
        <option value="">Primo altro supporto ferito</option>
        {arkChorusOthers.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
       </select>
      </label>}
    </>}
    {arkCustodianActive&&arkHandSpare.length>0&&<>
     <label><input type="checkbox" checked={arkOptions.custodian}
       onChange={e=>setArkOption('custodian',e.target.checked)}/>
      Vegliatore delle Rotte Celesti: scambia una carta soltanto dopo una riparazione reale di almeno 2 HP
     </label>
     {arkOptions.custodian&&<label>Carta da mettere sotto il mazzo:
      <select value={arkOptions.custodianBottom}
       onChange={e=>setArkOption('custodianBottom',e.target.value)}>
       <option value="">Prima carta non giocata</option>
       {arkHandSpare.map((id,i)=><option key={id+':'+i} value={id}>
        {card(id)?.nome||card(id)?.name||id}</option>)}
      </select>
     </label>}
    </>}
    {selectedActions.includes('fleet-resonance')&&arkFused.length>0&&arkUnfused.length>0&&<>
     <label>Risonanza della flotta — fusione da difendere:
      <select value={arkOptions.fused} onChange={e=>setArkOption('fused',e.target.value)}>
       <option value="">Prima fusione operativa</option>
       {arkFused.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>
     <label>Supporto non fuso che riceverà il blocco temporaneo:
      <select value={arkOptions.resonanceEscort}
       onChange={e=>setArkOption('resonanceEscort',e.target.value)}>
       <option value="">Primo supporto non fuso operativo</option>
       {arkUnfused.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('astral-convergence')&&arkOtherTargets.length>0&&
     <label>Convergenza astrale — secondo bersaglio nemico distinto:
      <select value={arkOptions.second} onChange={e=>setArkOption('second',e.target.value)}>
       <option value="">Prima altra unità nemica disponibile</option>
       {arkOtherTargets.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {arkActive&&arkModuleActive(player,'nx-l04-07',battle.ply)&&
     <p className="f3d-ark-readout">
      Lanciatore di stelle {player.ark?.repairedPly===battle.ply?
       'pronto dopo una vera riparazione':'richiede una riparazione reale in questo turno'}
     </p>}
    {obsidianActive&&<p className="f3d-obsidian-readout">
     <b>Titano Ossidiana</b>{' · '+
      (obsidianPendingShot?
       (card(obsidianPendingShot.cardId)?.name||'Colpo preparato')+
       ' su '+(obsidianEnemyUnits(enemy).find(t=>t.unit.id===obsidianPendingShot.id)?.unit.name||
       'bersaglio perduto')+' · '+
       (obsidianPendingShot.releasePly<=battle.ply?'RILASCIO ORA':'prossimo tuo turno'):
       obsidianFused?'Bastione d’Assedio operativo':
       'Difese e preparazioni')}
     {player.fusionLimit>0&&' · Fusioni '+player.fusionsUsed+'/'+player.fusionLimit}
    </p>}
    {obsidianActive&&selectedActions.includes('black-howitzer')&&<p className="f3d-obsidian-readout">
     Tiro d’Assedio Ossidiano: seleziona una macchina nel menu bersagli. Il colpo pesante
     partirà il prossimo turno e potrà ignorare una Difesa scoperta
    </p>}
    {obsidianActive&&selectedActions.includes('titan-verdict')&&<p className="f3d-obsidian-readout">
     Sentenza del Titano: due colpi pesanti preparati contro lo stesso bersaglio.
     Il Bastione fuso deve restare operativo fino al rilascio
    </p>}
    {obsidianActive&&selectedActions.includes('obsidian-bulkhead')&&
     <label>Paratia d’ossidiana — vitale da proteggere dal secondo colpo:
      <select value={obsidianOptions.part}
       onChange={e=>setObsidianOption('part',e.target.value)}>
       <option value="">Componente proprio già selezionato</option>
       {obsidianVitalParts.map(p=><option key={p.id} value={p.id}>
        {VITAL_LABELS[p.id]||p.id} · {p.hp}/{p.maxHp}</option>)}
      </select>
     </label>}
    {obsidianActive&&selectedActions.includes('position-chains')&&obsidianEnemyMachines.length>0&&
     <label>Catene di posizione — macchina da ancorare se il nemico prepara:
      <select value={obsidianOptions.chainMachine}
       onChange={e=>setObsidianOption('chainMachine',e.target.value)}>
       <option value="">Prima macchina nemica viva</option>
       {obsidianEnemyMachines.map(m=><option key={m.id} value={m.id}>
        {m.name} · {m.hp}/{m.maxHp}</option>)}
      </select>
     </label>}
    {obsidianActive&&selectedActions.includes('obsidian-magister')&&
     <label><input type="checkbox" checked={obsidianOptions.magisterSwap}
      onChange={e=>setObsidianOption('magisterSwap',e.target.checked)}/>
      Magistro Ossidiana: inverti l’ordine delle prime due carte quando una Difesa blocca un colpo
     </label>}
    {obsidianCanGuard&&<label>
     <input type="checkbox" checked={obsidianOptions.bastionGuard}
      onChange={e=>setObsidianOption('bastionGuard',e.target.checked)}/>
     Bastione d’Assedio: rinuncia alle passive offensive per limitare a 1
     il primo danno ricevuto nel prossimo turno nemico
    </label>}
    {obsidianActive&&selectedActions.includes('obsidian-fusion')&&
     <p className="f3d-obsidian-readout">
      Fusione Ossidiana: unisce i due supporti nel Bastione d’Assedio.
      Mantiene i danni proporzionali, le passive e non schiera riserve
     </p>}
    {obsidianActive&&obsidianModuleActive(player,'nx-l03-01',battle.ply)&&
     <p className="f3d-obsidian-readout">
      Ancoraggi d’assedio attivi: i colpi preparati non possono essere deviati.
      Il ritiro delle macchine proprie è disabilitato
     </p>}
    {royalActive&&<p className="f3d-royal-readout">
     <b>Eclisse Reale</b>{' · '+
      (player.escorts.some(e=>e.royalCrown&&e.hp>0&&!e.destroyed)?
       'Corona Unita operativa':'Due supporti e ordini coordinati')}
     {player.fusionLimit>0&&' · Fusione '+player.fusionsUsed+'/'+player.fusionLimit}
    </p>}
    {selectedActions.includes('royal-rain')&&<>
     <label>Pioggia reale — modalità dichiarata:
      <select value={royalOptions.rainMode}
       onChange={e=>setRoyalOption('rainMode',e.target.value)}>
       <option value="heavy">Un colpo pesante · 3 danni</option>
       <option value="split">Due colpi leggeri su unità distinte</option>
      </select>
     </label>
     {royalOptions.rainMode==='split'&&royalOtherTargets.length>0&&
      <label>Seconda unità del comando:
       <select value={royalOptions.second} onChange={e=>setRoyalOption('second',e.target.value)}>
        <option value="">Prima unità diversa disponibile</option>
        {royalOtherTargets.map(t=><option key={t.key} value={t.key}>{t.name} · {t.hp}/{t.maxHp}</option>)}
       </select>
      </label>}
    </>}
    {royalRelayAvailable&&<label>
     <input type="checkbox" checked={royalRelayEnabled}
      disabled={!royalPart(player,'weapons')}
      onChange={e=>setRoyalOption('relay',e.target.checked)}/>
     Relè della Corona: lancia il comando da un supporto, senza attacco aggiuntivo
    </label>}
    {royalRelayAvailable&&royalRelayEnabled&&<label>Supporto che esegue il comando:
     <select value={royalOptions.relayEscort}
      onChange={e=>setRoyalOption('relayEscort',e.target.value)}>
      <option value="">Primo supporto operativo</option>
      {royalSupportsAlive.map(e=><option key={e.id} value={e.id}>
       {e.name} · {e.hp}/{e.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('protective-crown')&&royalSupportsAlive.length>0&&
     <label>Corona protettiva — intercettore della Centralina:
      <select value={royalOptions.guard} onChange={e=>setRoyalOption('guard',e.target.value)}>
       <option value="">Primo supporto operativo</option>
       {royalSupportsAlive.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('royal-bastion')&&royalSupportsAlive.length>1&&
     <label>Bastione reale — supporto su cui dividere un colpo:
      <select value={royalOptions.bastion}
       onChange={e=>setRoyalOption('bastion',e.target.value)}>
       <option value="">Primo supporto operativo</option>
       {royalSupportsAlive.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.some(a=>['cross-order','coordinated-judgment'].includes(a))&&
     royalProtections.length>0&&<>
     <label>{selectedActions.includes('cross-order')?
       'Ordine incrociato — Difesa scoperta da trasferire:':
       'Giudizio coordinato — Difesa scoperta da consumare:'}
      <select value={royalOptions.source}
       onChange={e=>setRoyalOptions(o=>({...o,source:e.target.value,destination:''}))}>
       <option value="">Prima Difesa valida</option>
       {royalProtections.map(p=><option key={p.source} value={p.source}>
        {(card(p.id)?.name||'Protezione')+' · '+p.remaining+' cariche · '+
         (royalSupportsAlive.find(e=>e.slot===p.escortSlot)?.name||'Supporto')}
       </option>)}
      </select>
     </label>
     {selectedActions.includes('cross-order')&&royalDestinationChoices.length>0&&
      <label>Ordine incrociato — supporto che riceve la Difesa:
       <select value={royalOptions.destination}
        onChange={e=>setRoyalOption('destination',e.target.value)}>
        <option value="">Primo altro supporto operativo</option>
        {royalDestinationChoices.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
       </select>
      </label>}
    </>}
    {royalSovereignActive&&royalDiscardChoices.length>0&&<>
     <label><input type="checkbox" checked={royalOptions.sovereign}
      onChange={e=>setRoyalOption('sovereign',e.target.checked)}/>
      Sovrano: scarta una carta per sceglierne una tra le prime tre del mazzo
     </label>
     {royalOptions.sovereign&&<>
      <label>Carta reale da scartare:
       <select value={royalOptions.discard} onChange={e=>setRoyalOption('discard',e.target.value)}>
        <option value="">Prima carta non giocata</option>
        {royalDiscardChoices.map((id,i)=><option key={id+':'+i} value={id}>
         {card(id)?.nome||card(id)?.name||id}</option>)}
       </select>
      </label>
      {royalTopThree.length>0&&<label>Carta da prendere tra le tre osservate:
       <select value={royalOptions.pick} onChange={e=>setRoyalOption('pick',e.target.value)}>
        <option value="">Prima carta tra le tre</option>
        {royalTopThree.map((id,i)=><option key={id+':'+i} value={id}>
         {(i+1)+'. '+(card(id)?.nome||card(id)?.name||id)}</option>)}
       </select>
      </label>}
     </>}
    </>}
    {royalActive&&selectedActions.includes('crown-fusion')&&<p className="f3d-royal-readout">
     Fusione della Corona: i due supporti originali diventano Corona Unita;
     non entra alcuna riserva, le passive restano attive
    </p>}
    {stormActive&&<p className="f3d-storm-readout">
     <b>Vortiluce</b>
     {' · '+(player.storm?.charge&&stormModuleActive(player,'nx-e02-09',battle.ply)?
      'Condensatore carico: prossimo colpo pesante':
      'Colpisci unità differenti per caricare il Condensatore')}
     {player.storm?.lastHitsPly===battle.ply-2&&
      ' · '+(player.storm.lastHits?.length||0)+' unità danneggiate nel turno precedente'}
    </p>}
    {stormMultiple&&stormSecondChoices.length>0&&
     <label>Vortiluce — seconda unità distinta:
      <select value={stormOptions.second} onChange={e=>setStormOption('second',e.target.value)}>
       <option value="">Prima unità diversa disponibile</option>
       {stormSecondChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {stormActive&&stormModuleActive(player,'nx-e02-01',battle.ply)&&
     stormSecondChoices.length>0&&<label>
      Bobina a catena — bersaglio del secondo colpo dichiarato:
      <select value={stormOptions.chain} onChange={e=>setStormOption('chain',e.target.value)}>
       <option value="">Prima altra unità disponibile</option>
       {stormSecondChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('storm-front')&&stormOwnSupports.length>0&&
     <label>Fronte di Vortiluce — supporto che intercetterà per la macchina:
      <select value={stormOptions.front} onChange={e=>setStormOption('front',e.target.value)}>
       <option value="">Primo supporto operativo</option>
       {stormOwnSupports.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {stormActive&&stormCaptainActive&&stormSpare.length>0&&<>
     <label><input type="checkbox" checked={stormOptions.captainSwap}
       onChange={e=>setStormOption('captainSwap',e.target.checked)}/>
      Capitano: dopo danni a due unità, scarta una carta e pescane una
     </label>
     {stormOptions.captainSwap&&<label>Carta da scartare:
      <select value={stormOptions.captainTrade}
       onChange={e=>setStormOption('captainTrade',e.target.value)}>
       <option value="">Prima carta non giocata</option>
       {stormSpare.map((id,i)=><option key={id+':'+i} value={id}>
        {card(id)?.nome||card(id)?.name||id}</option>)}
      </select>
     </label>}
    </>}
    {nebulaActive&&<p className="f3d-nebula-readout">
     <b>Nefelarca</b>
     {' · '+(nebulaFog?'Occultato: '+nebulaFog.name:
      nebulaModuleActive(player,'nx-e01-01',battle.ply)?'Proiettore pronto':'Nessun supporto occultato')}
    </p>}
    {nebulaCanHide&&<label>
     <input type="checkbox" checked={nebulaOptions.hide}
      onChange={e=>setNebulaOption('hide',e.target.checked)}/>
     Proiettore di bruma: occulta un supporto (non attacca e non protegge)
    </label>}
    {nebulaCanHide&&nebulaOptions.hide&&nebulaVisible.length>0&&
     <label>Supporto da occultare:
      <select value={nebulaOptions.hideEscort}
       onChange={e=>setNebulaOption('hideEscort',e.target.value)}>
       <option value="">Primo supporto operativo</option>
       {nebulaVisible.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('cryogenic-veil')&&nebulaTargetChoices.length>0&&
     <label>Velo criogenico — unità protetta dalle raffiche:
      <select value={nebulaOptions.veil}
       onChange={e=>setNebulaOption('veil',e.target.value)}>
       <option value="">Prima unità alleata viva</option>
       {nebulaTargetChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('wandering-mist')&&nebulaFog&&nebulaVisible.length>0&&
     <label>Bruma itinerante — occulta il supporto successivo:
      <select value={nebulaOptions.swap}
       onChange={e=>setNebulaOption('swap',e.target.value)}>
       <option value="">Primo altro supporto operativo</option>
       {nebulaVisible.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {nebulaActive&&nebulaArchonActive&&nebulaTerrainSelected&&nebulaTradeChoices.length>0&&<>
     <label><input type="checkbox" checked={nebulaOptions.terrainTrade}
      onChange={e=>setNebulaOption('terrainTrade',e.target.checked)}/>
      Arconte della Bruma: metti una carta sotto il mazzo e pescane una
     </label>
     {nebulaOptions.terrainTrade&&<label>Carta da mettere sotto il mazzo:
      <select value={nebulaOptions.tradeCard}
       onChange={e=>setNebulaOption('tradeCard',e.target.value)}>
       <option value="">Prima carta non giocata</option>
       {nebulaTradeChoices.map((id,i)=><option key={id+':'+i} value={id}>
        {card(id)?.nome||card(id)?.name||id}</option>)}
      </select>
     </label>}
    </>}
    {mantaActive&&<p className="f3d-manta-readout">
     <b>Manta Ionica · Energia {mantaEnergy(player)}/2</b>
     {' · '+(mantaCapacitorActive(player,battle.ply)?'Capacitore operativo':'Capacitore non operativo')}
    </p>}
    {mantaActive&&selectedActions.includes('arc-discharge')&&mantaEnergy(player)>0&&
     mantaCapacitorActive(player,battle.ply)&&<label>
      <input type="checkbox" checked={mantaOptions.silence}
       onChange={e=>setMantaOption('silence',e.target.checked)}/>
      Spendi una energia per silenziare la passiva del bersaglio colpito
     </label>}
    {mantaActive&&mantaForkActive(player,battle.ply)&&mantaCapacitorActive(player,battle.ply)&&
     mantaEnergy(player)>0&&mantaSecondChoices.length>0&&
     !selectedActions.some(x=>['arc-discharge','total-discharge'].includes(x))&&<>
     <label><input type="checkbox" checked={mantaOptions.fork}
      onChange={e=>setMantaOption('fork',e.target.checked)}/>
      Forcella ionica: due colpi leggeri su unità diverse (−1 energia)
     </label>
     {mantaOptions.fork&&<label>Secondo bersaglio Forcella:
      <select value={mantaOptions.second} onChange={e=>setMantaOption('second',e.target.value)}>
       <option value="">Prima unità diversa disponibile</option>
       {mantaSecondChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select></label>}
    </>}
    {sharkActive&&<p className="f3d-shark-readout">
     <b>Squalo del Vuoto</b>
     {' · '+(player.shark?.lastEnemyLossPly===battle.ply-1?
      'Risposta spietata pronta':'Reazioni e difese in attesa')}
    </p>}
    {selectedActions.includes('toothed-armor')&&sharkEnemyChoices.length>0&&
     <label>Corazza dentata — bersaglio pubblico del contrattacco:
      <select value={sharkOptions.armor} onChange={e=>setSharkOption('armor',e.target.value)}>
       <option value="">Prima unità nemica disponibile</option>
       {sharkEnemyChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('abyssal-decoy')&&sharkOwnChoices.length>1&&
     <label>Esca abissale — unità che attirerà il colpo principale:
      <select value={sharkOptions.decoy} onChange={e=>setSharkOption('decoy',e.target.value)}>
       <option value="">Prima unità propria operativa</option>
       {sharkOwnChoices.map(t=><option key={t.key} value={t.key}>
        {t.name} · {t.hp}/{t.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('returning-teeth')&&sharkEnemyChoices.length>1&&<>
     <label>Denti di ritorno — primo bersaglio dell’arpione:
      <select value={sharkOptions.teethFirst}
       onChange={e=>setSharkOptions(old=>({...old,teethFirst:e.target.value,teethSecond:''}))}>
       <option value="">Prima unità nemica disponibile</option>
       {sharkEnemyChoices.map(t=><option key={t.key} value={t.key}>{t.name}</option>)}
      </select>
     </label>
     <label>Denti di ritorno — secondo bersaglio diverso:
      <select value={sharkOptions.teethSecond}
       onChange={e=>setSharkOption('teethSecond',e.target.value)}>
       <option value="">Prima altra unità disponibile</option>
       {sharkTeethRemaining.map(t=><option key={t.key} value={t.key}>{t.name}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('retaliation-torpedo')&&sharkDamagedMachines.length>0&&
     <label>Siluro di ritorsione — macchina ferita da sacrificare:
      <select value={sharkOptions.torpedo} onChange={e=>setSharkOption('torpedo',e.target.value)}>
       <option value="">Prima macchina danneggiata</option>
       {sharkDamagedMachines.map(m=><option key={m.id} value={m.id}>
        {m.name} · {m.hp}/{m.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('predator-shield')&&sharkWounded.length>0&&
     <label>Scudo del predatore — supporto ferito:
      <select value={sharkOptions.shield} onChange={e=>setSharkOption('shield',e.target.value)}>
       <option value="">Primo supporto danneggiato</option>
       {sharkWounded.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('abyssal-admiral')&&<>
     <label><input type="checkbox" checked={sharkOptions.admiralEnabled}
      onChange={e=>setSharkOption('admiralEnabled',e.target.checked)}/>
      Ammiraglio: autorizza lo scarto di una carta per riparare il primo alleato ferito
     </label>
     {sharkOptions.admiralEnabled&&sharkDiscardChoices.length>0&&
      <label>Preferenza di scarto (alla prima ferita del turno nemico):
       <select value={sharkOptions.admiralDiscard}
        onChange={e=>setSharkOption('admiralDiscard',e.target.value)}>
        <option value="">Prima carta ancora in mano</option>
        {sharkDiscardChoices.map((id,i)=><option key={id+':'+i} value={id}>
         {card(id)?.nome||card(id)?.name||id}</option>)}
       </select>
      </label>}
    </>}
    {selectedActions.includes('last-bite')&&sharkDonors.length>1&&<>
     <label>Ultimo morso — supporto ferito da sacrificare:
      <select value={sharkOptions.donor}
       onChange={e=>setSharkOptions(old=>({...old,donor:e.target.value,receiver:''}))}>
       <option value="">Primo supporto ferito</option>
       {sharkDonors.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>
     <label>Ultimo morso — altro supporto da riparare:
      <select value={sharkOptions.receiver}
       onChange={e=>setSharkOption('receiver',e.target.value)}>
       <option value="">Primo supporto diverso ferito</option>
       {sharkReceivers.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('absorption-screen')&&mantaSupports.length>0&&
     <label>Schermo di assorbimento — supporto protetto:
      <select value={mantaOptions.screen} onChange={e=>setMantaOption('screen',e.target.value)}>
       <option value="">Primo supporto operativo</option>
       {mantaSupports.map(e=><option key={e.id} value={e.id}>{e.name} · {e.hp}/{e.maxHp}</option>)}
      </select>
     </label>}
    {selectedActions.includes('reverse-polarity')&&<>
     <label>Polarità inversa — protezione da spostare:
      <select value={mantaOptions.from} onChange={e=>setMantaOption('from',e.target.value)}>
       <option value="">Prima protezione scoperta disponibile</option>
       {mantaVisible.filter(p=>p.target==='escort').map(p=>{
        const escort=mantaSupports.find(e=>e.slot===p.escortSlot);
        return <option key={p.source} value={escort?.id||''}>
         {escort?.name||'Supporto'} · {p.remaining} cariche
        </option>;
       })}
      </select>
     </label>
     <label>Polarità inversa — supporto ricevente:
      <select value={mantaOptions.to} onChange={e=>setMantaOption('to',e.target.value)}>
       <option value="">Primo supporto differente</option>
       {mantaSupports.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
      </select>
     </label>
    </>}
    {selectedActions.includes('dielectric-reserve')&&mantaVisible.length>0&&
     <label>Riserva dielettrica — protezione da convertire:
      <select value={mantaOptions.recycle} onChange={e=>setMantaOption('recycle',e.target.value)}>
       <option value="">Prima protezione scoperta</option>
       {mantaVisible.map(p=><option key={p.source} value={p.source}>
        {(card(p.id)?.nome||card(p.id)?.name||'Difesa')+' · '+p.remaining+' cariche'}
       </option>)}
      </select>
     </label>}
    {mantaActive&&(selectedActions.includes('manta-navigator')||
     player.commander?.id==='ex-r02-01')&&<label>
     <input type="checkbox" checked={mantaOptions.repair}
      onChange={e=>setMantaOption('repair',e.target.checked)}/>
     Navigatrice: ripara un supporto danneggiato a fine turno (−1 energia)
    </label>}
    {mantaActive&&mantaOptions.repair&&(selectedActions.includes('manta-navigator')||
     player.commander?.id==='ex-r02-01')&&mantaDamaged.length>0&&
     <label>Supporto da riparare:
      <select value={mantaOptions.repairTarget}
       onChange={e=>setMantaOption('repairTarget',e.target.value)}>
       <option value="">Supporto più danneggiato</option>
       {mantaDamaged.map(e=><option key={e.id} value={e.id}>
        {e.name} · {e.hp}/{e.maxHp}
       </option>)}
      </select>
     </label>}
    {selectedActions.includes('machine-deflection')&&prismaMachines.length>=2&&
     <label>Prisma di deviazione — macchina che intercetta:
      <select value={prismaOptions.redirectMachineId}
       onChange={e=>setPrismaOption('redirectMachineId',e.target.value)}>
       <option value="">Prima macchina operativa</option>
       {prismaMachines.map(m=><option key={m.id} value={m.id}>{m.name} · {m.hp}/{m.maxHp}</option>)}
      </select></label>}
    {selectedActions.includes('false-reflection')&&<label>Riflesso falso — proteggi questo possibile bersaglio secondario:
     <select value={prismaOptions.trapSelection} onChange={e=>setPrismaOption('trapSelection',e.target.value)}>
      <option value="">Primo bersaglio valido</option>
      {prismaTrapChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {selectedActions.includes('prisma-artisan')&&<label>Artigiana Prisma — destinazione preferita delle cariche:
     <select value={prismaOptions.artisanSelection} onChange={e=>setPrismaOption('artisanSelection',e.target.value)}>
      <option value="">Primo bersaglio compatibile</option>
      {prismaTrapChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {selectedActions.includes('lens-cut')&&<label>Taglio della lente — unità con protezione:
     <select value={prismaOptions.enemySelection} onChange={e=>setPrismaOption('enemySelection',e.target.value)}>
      <option value="">Prima unità con Difesa scoperta</option>
      {prismaUnitTargets.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {prismaAttack&&prismaSecondChoices.length>0&&<label>
     {prismaAttack==='reflected-shard'?'Scheggia riflessa — unità di rimbalzo:':
      'Colpo secondario — altra unità:'}
     <select value={prismaOptions.secondSelection} onChange={e=>setPrismaOption('secondSelection',e.target.value)}>
      <option value="">Prima unità diversa disponibile</option>
      {prismaSecondChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {prismaAttack==='crystal-rose'&&prismaThirdChoices.length>0&&<label>Rosa di cristallo — terza unità:
     <select value={prismaOptions.thirdSelection} onChange={e=>setPrismaOption('thirdSelection',e.target.value)}>
      <option value="">Prima terza unità disponibile</option>
      {prismaThirdChoices.map(t=><option key={t.kind+':'+t.id} value={t.kind+':'+t.id}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {falcoActive&&falcoPending&&<p className="f3d-falco-pending">
     <b>Falco · {card(falcoPending.cardId)?.nome||card(falcoPending.cardId)?.name}</b>
     {' · '+falcoPending.shots.map(x=>
      falcoUnitChoices.find(t=>t.id===x.id)?.name||'Unità non disponibile').join(' + ')}
     {' · '+(falcoPending.releasePly<=battle.ply?'Rilascio in questo turno':'Rilascio nel prossimo tuo turno')}
    </p>}
    {falcoActive&&falcoReleaseDue&&!falcoPending.held&&
     falcoCapacitorActive(player,battle.ply)&&
     !selectedActions.includes('emergency-loader')&&<label>
      <input type="checkbox" checked={falcoOptions.hold}
       onChange={e=>setFalcoOption('hold',e.target.checked)}/>
      Capacitore: rinvia un'unica volta il colpo fino al prossimo tuo turno
     </label>}
    {falcoActive&&selectedActions.some(x=>FALCO_PREP_ACTIONS.includes(x))&&
     falcoUnitChoices.length>0&&<label>Falco · bersaglio del colpo da preparare:
     <select value={falcoOptions.target} onChange={e=>setFalcoOption('target',e.target.value)}>
      <option value="">Automatico: {falcoPrimary?.name}</option>
      {falcoUnitChoices.map(t=><option key={t.key} value={t.key}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {falcoActive&&selectedActions.includes('falcon-triangulation')&&
     falcoOtherChoices.length>0&&<label>Triangolazione · secondo bersaglio:
     <select value={falcoOptions.second} onChange={e=>setFalcoOption('second',e.target.value)}>
      <option value="">Automatico: {falcoOtherChoices[0]?.name}</option>
      {falcoOtherChoices.map(t=><option key={t.key} value={t.key}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {falcoActive&&selectedActions.includes('ballistic-correction')&&
     falcoCorrectionChoices.length>0&&<label>Correzione balistica · nuova unità:
     <select value={falcoOptions.correction} onChange={e=>setFalcoOption('correction',e.target.value)}>
      <option value="">Automatico: {falcoCorrectionChoices[0]?.name}</option>
      {falcoCorrectionChoices.map(t=><option key={t.key} value={t.key}>
       {t.name} · {t.hp}/{t.maxHp}</option>)}
     </select></label>}
    {falcoActive&&(player.commander?.id==='ex-r01-01'||
     selectedActions.includes('binary-gunner'))&&
     selectedActions.some(x=>FALCO_PREP_ACTIONS.includes(x))&&
     falcoGunnerChoices.length>0&&<label>Artigliere Binario · Difesa tra le prime tre carte:
     <select value={falcoOptions.gunner} onChange={e=>setFalcoOption('gunner',e.target.value)}>
      <option value="">Prima Difesa scoperta disponibile</option>
      {falcoGunnerChoices.map((id,i)=><option key={id+':'+i} value={id}>
       {card(id)?.nome||card(id)?.name||id}</option>)}
     </select></label>}
    {selectedActions.includes('frequency-analysis')&&<label>Analisi di frequenza — carta da scartare:
     <select value={corvoOptions.exchangeCardId} onChange={e=>setCorvoOption('exchangeCardId',e.target.value)}>
      <option value="">Prima carta non giocata</option>
      {player.hand.filter((id,i)=>!chosenCards.includes(i)).map((id,i)=>
       <option key={id+':'+i} value={id}>{card(id)?.nome||card(id)?.name||id}</option>)}
     </select>
    </label>}
    {(player.commander?.id==='ex-c03-01'||selectedActions.includes('resonant-commander'))&&
     player.deck.length>0&&<label><input type="checkbox" checked={corvoOptions.bottomTop}
       onChange={e=>setCorvoOption('bottomTop',e.target.checked)}/>
      Comandante Risonante: dopo un silenzio riuscito, sposta la prima carta sotto il mazzo
     </label>}
    {selectedActions.includes('marked-route')&&<label>Rotta marcata — vitale da segnare:
     <select value={linceOptions.routePartId} onChange={e=>setLinceOption('routePartId',e.target.value)}>
      <option value="">Usa il vitale selezionato</option>
      {enemy.ships[0].parts.filter(p=>p.hp>0&&!p.destroyed).map(p=>
       <option key={p.id} value={p.id}>{VITAL_LABELS[p.id]} · {p.hp}/{p.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('crimson-raid')&&<label>Incursione cremisi — modulo da scartare:
     <select value={linceOptions.sacrificeSlot} onChange={e=>setLinceOption('sacrificeSlot',e.target.value)}>
      <option value="">Primo modulo operativo</option>
      {liveModules(player).map(m=><option key={m.id} value={m.slot}>{m.name} · {m.hp}/{m.maxHp}</option>)}
     </select>
    </label>}
    {selectedActions.includes('armed-disengage')&&installedModule(player,'weapon')&&
     <label><input type="checkbox" checked={linceOptions.linceRecallWeapon}
       onChange={e=>setLinceOption('linceRecallWeapon',e.target.checked)}/>
      Riprendi il modulo d’arma dopo il colpo, conservando i danni
     </label>}
    {heliosAvailable&&heliosDiscardChoices.length>0&&<>
     <label><input type="checkbox" checked={linceOptions.heliosTrade}
       onChange={e=>setLinceOption('heliosTrade',e.target.checked)}/>
      Pilota Helios: scarta una carta e pescane una dopo Aggiramento
     </label>
     {linceOptions.heliosTrade&&<label>Carta da scartare:
      <select value={linceOptions.heliosDiscardId} onChange={e=>setLinceOption('heliosDiscardId',e.target.value)}>
       <option value="">Prima carta disponibile</option>
       {heliosDiscardChoices.map((id,i)=><option key={id+i} value={id}>{card(id)?.nome||card(id)?.name||id}</option>)}
      </select>
     </label>}
    </>}
    {radentReady&&<label><input type="checkbox" checked={linceOptions.radentRecall}
      onChange={e=>setLinceOption('radentRecall',e.target.checked)}/>
     Propulsori radenti: richiama una macchina dopo Aggiramento riuscito
    </label>}
    {radentReady&&linceOptions.radentRecall&&<label>Macchina da richiamare:
     <select value={linceOptions.radentMachineId} onChange={e=>setLinceOption('radentMachineId',e.target.value)}>
      <option value="">Prima macchina operativa</option>
      {linceMachineChoices.map(m=><option key={m.id} value={m.id}>{m.name} · {m.hp}/{m.maxHp}</option>)}
     </select>
    </label>}
   </div>}
   {!ended&&battle.newGeneratorCombat&&<div className="f3d-elemental-control" role="group"
    aria-label="Generatore e attacco speciale della nave madre">
    <button type="button" className={'f3d-generator-bar'+(generatorTier?' f3d-generator-bar--'+generatorTier:'')+
     (elementalPrepared?' f3d-generator-bar--reserved':'')}
     aria-label={elementalPrepared?'Attacco prenotato, livello '+(generatorTier==='heavy'?'potente':'rapido'):
      'Generatore '+generatorPhysicalCards+' carte energia, tocca per prenotare'}
     aria-pressed={elementalPrepared}
     disabled={!myTurn||resolving||!canPrepareElemental||elementalPrepared}
     title={elementalPrepared?'Attacco prenotato: alla risoluzione usa automaticamente 4 carte se disponibili, altrimenti 2':
      'Tocca una volta per prenotare. Non spara se non prenotato.'}
     onClick={()=>setElementalPrepared(true)}>
     <span>ϟ {generatorPhysicalCards}/4</span>
     <span>{generatorCooling>0?'RAFFREDDAMENTO '+generatorCooling:
      elementalPrepared?(generatorTier==='heavy'?'POTENTE PRENOTATO':'ATTACCO PRENOTATO'):
      generatorTier==='heavy'?'POTENTE PRONTO':generatorTier==='quick'?'RAPIDO PRONTO':'IN CARICA'}</span>
    </button>
   </div>}
   {!ended&&!battle.newGeneratorCombat&&elementalAbilityDef&&<div className="f3d-elemental-control" role="group"
    aria-label="Reattore e abilità elementale">
    <span>{FLEET_ELEMENTS[selectedElement]?.symbol||'✧'} {chargesAvailable}/{actualEnergyCost}</span>
    {elementalTypes.length>1&&<select aria-label="Elemento del colpo speciale" value={selectedElement}
     disabled={!myTurn||elementalPrepared} onChange={e=>{setElementalChoice(e.target.value);setElementalPrepared(false);}}>
     {elementalTypes.map(id=><option key={id} value={id}>{FLEET_ELEMENTS[id].name}</option>)}
    </select>}
    <button type="button" aria-pressed={elementalPrepared} disabled={!myTurn||!canPrepareElemental}
     title={elementalAbilityDef.name+' · '+elementalAbilityDef.description}
     onClick={()=>setElementalPrepared(x=>!x)}>
     {elementalPrepared?'SPECIALE PRONTA':(elementalAbilityDef.kind==='attack'?'ATTACCO':'EFFETTO')+' SPECIALE'}
    </button>
    <small>{elementalAbilityDef.name}</small>
   </div>}
   {preparedSacrifice&&<div className="f3d-sacrifice-prepared" role="status">
    Sacrificio preparato: {player.escorts.find(e=>e.id===preparedSacrifice)?.name||'supporto'}.
    Non occupa carte e si attiva a fine turno.
    <button type="button" disabled={ended||!myTurn}
     onClick={()=>{setPreparedSacrifice(null);setMessage('Sacrificio annullato');}}>
     ANNULLA SACRIFICIO
    </button>
   </div>}
   <button type="button" className="f3d-commands-toggle"
    aria-label={showBattleCommands?'Chiudi comandi':'Apri comandi'}
    aria-expanded={showBattleCommands} onClick={()=>setShowBattleCommands(value=>!value)}>
    <span aria-hidden="true">⋯</span><small>{chosenCards.length}/3</small>
   </button>
   <div className={'live-actions f3d-actions'+(showBattleCommands?' f3d-actions-open':'')}>
    <span>CARTE {chosenCards.length}/3</span>
    {battle.strategicNoDeterioration&&!ended&&myTurn&&
     player.hand.length>=7&&chosenCards.length===0&&
     <label title="Scegli una carta da scartare. Se confermi ESEGUI senza usare carte e non infliggi danni, ne peschi una reale e consumi il turno.">
      RICAMBIO
      <select aria-label="Carta da scartare per ricambio" value={recoverHandCardIndex}
       onChange={e=>setRecoverHandCardIndex(Number(e.target.value))}>
       {player.hand.map((id,i)=><option key={id+':'+i} value={i}>
        {card(id)?.nome||card(id)?.name||id}
       </option>)}
      </select>
     </label>}
    <button type="button" onClick={()=>setShowLog(v=>!v)}>{showLog?'CHIUDI':'REGISTRO'}</button>
    <button type="button" onClick={()=>setHelp({rules:true,terrain})}>REGOLE</button>
   </div>
   <FleetCommandConsole unit={player} ply={battle.ply} nickname={nickname} onInspect={vital=>setHelp({vital})} onLeave={leave} onPass={passTurn}
    passDisabled={ended||!myTurn||resolving} ended={ended} secondsLeft={secondsLeft} turnProgress={turnProgress}/>
   {resolving&&<div className="f3d-resolution-interlock" aria-hidden="true"/>}
   {message&&<div className="live-action-notice f3d-notice" role="status"
    key={lastFx?.nonce||message}>{message}</div>}
   {trapReveal&&<TrapReveal key={'trap-'+trapReveal.nonce} event={trapReveal}/>}
   {boss&&<button type="button" className="f3d-boss-label" title={boss.description} onClick={()=>setHelp({boss:true})}>
    {boss.name+' · '+boss.ability}
   </button>}
   {showLog&&<div className="official-log f3d-log" role="dialog" aria-label="Registro battaglia">
    <button type="button" onClick={()=>setShowLog(false)}>CHIUDI</button>
    {battle.log.slice(-12).map((e,i)=><p key={i}>{fleetEventText(e)}</p>)}
   </div>}
   {help&&<div className="f3d-escort-overlay" role="dialog" aria-label={help.rules?'Regole delle carte':help.boss?'Abilità del boss':help.trapId?'La tua trappola coperta':help.machine?'Macchina d’assalto':help.module?'Modulo montato':'Abilità scudiera'}>
    <button type="button" onClick={()=>setHelp(null)} aria-label="Chiudi">×</button>
    {help.vital?<>
      <strong>{help.vital.name}</strong>
      <p>{FLEET_VITAL_DESCRIPTIONS[help.vital.id]}</p>
      <small>{help.vital.remainingSeconds!=null?
      (help.vital.status==='off'?'FUORI USO':'TIMER ATTIVO')+' · '+help.vital.remainingSeconds+' secondi':
      help.vital.id==='generator'&&player.newGeneratorCombat?
       'Surriscaldamento: '+generatorCoolingOwnTurns(player)+' turni propri rimanenti':
      help.vital.status==='absent'?'Non installato':
      (help.vital.status==='off'?'FUORI USO':'ATTIVO')+' · '+help.vital.part?.hp+'/'+help.vital.part?.maxHp+' integrità'}</small>
     </>:help.rules?<>
     <strong>Regole delle carte</strong>
     {terrain&&<p><b>{readableTerrain}</b><br/>{TERRAIN_CATALOG[terrain]?.description||TERRAIN_CATALOG[terrain]?.effectText}</p>}
     {(battle.newGeneratorCombat?
      [...MODERN_GENERATOR_RULES,...SIMPLE_RULES.filter(rule=>!MODERN_OUTDATED_RULE.test(rule))]:
      SIMPLE_RULES).map(rule=><p key={rule}>{rule}</p>)}
    </>:help.trapId?<>
     <strong>{card(help.trapId)?.nome||card(help.trapId)?.name}</strong>
     <p>{describeEffect(card(help.trapId),player.exclusiveUpgrades?.[help.trapId]||1)}</p>
     <small>{help.pending?'Conferma il turno per prepararla coperta.':'Resta coperta fino all’attivazione. L’avversario non vede questa carta.'}</small>
    </>:help.boss?<>
     <strong>{boss?.name}</strong><p>{boss?.description}</p>
     {terrain&&<p><b>{readableTerrain}</b><br/>{TERRAIN_CATALOG[terrain]?.description}</p>}
    </>:help.machine?<>
     <strong>{cardTextName(card(help.machine.sourceCardId))||help.machine.name}</strong>
     {player.ruleset===HP_SYNC_RULESET?<>
     <p>{cardTextDescription(displayedCard(help.machine.sourceCardId,player.newGeneratorCombat),describeEffect(displayedCard(help.machine.sourceCardId,player.newGeneratorCombat)))}</p>
     {help.machine.nominalDamage!=null&&<p>Danno nominale attuale: {help.machine.nominalDamage} HP (prima di difese e modificatori).</p>}
     {help.machine.damagePercent!=null&&<p>Danno nominale: {help.machine.damagePercent}% degli HP massimi del bersaglio.</p>}
     {help.machine.damageFormula&&<p>{help.machine.damageFormula}</p>}
     <small>Arma temporanea · non intercetta colpi e non è bersagliabile · slot {help.machine.slot+1}</small>
    </>:<>
     <p>Protegge la madre finché è operativa. Potenza di supporto: {help.machine.power||0}.</p>
     <small>{help.machine.hp}/{help.machine.maxHp} punti · alloggiamento {help.machine.slot+1}</small>
    </>}
    </>:help.module?<>
     <strong>{help.module.name}</strong>
     <p>Modulo {help.module.slot==='weapon'?'d’arma':'di utilità'} installato sulla nave madre.</p>
     <small>Integrità: {help.module.hp}/{help.module.maxHp} · distruggibile durante il combattimento</small>
    </>:<>
     <strong>{help.escort.name}</strong><small>{help.escort.role} · Grado {help.escort.grade||1}{help.escort.fused?' · FUSA':''}</small>
     <p>{describeEscortEffect(help.escort)}</p>
     <small>{help.linked?'COLLEGAMENTO ATTIVO':'COLLEGAMENTO INTERROTTO'}
      {' · '+help.escort.hp+'/'+help.escort.maxHp+' punti'}</small>
     {help.player&&myTurn&&!ended&&help.escort&&
      player.escorts.some(e=>e.id===help.escort.id&&
       (e.supportSkillIds||[e.supportSkillId]).includes('sacrifice')&&
       (preparedSacrifice===e.id||e.hp>0&&e.hp/e.maxHp>=.8))&&
      <button type="button" onClick={()=>{
       const id=help.escort.id;
       const cancelling=preparedSacrifice===id;
       setPreparedSacrifice(cancelling?null:id);
       setMessage(cancelling?'Sacrificio annullato':
        'Sacrificio preparato: verrà eseguito alla risoluzione del turno');
       setHelp(null);
      }}>{preparedSacrifice===help.escort.id?'ANNULLA SACRIFICIO':'PREPARA SACRIFICIO'}</button>}
    </>}
   </div>}
   {ended&&<div className="live-end">
    <h2>{battle.winner==='A'?'VITTORIA':battle.winner==='B'?'SCONFITTA':'PAREGGIO'}</h2>
    <p>Turni {battle.ply} · {battle.bossName||displaySector||'Duello'}</p>
    {battle.finishReason&&<p>{battle.finishReason}</p>}
    <button type="button" disabled={busy||rewardDone} onClick={leave}>
     {busy?'SALVATAGGIO...':'CONFERMA E TORNA'}</button>
    <button type="button" onClick={restart}>RIGIOCA</button>
   </div>}
  </div>
 </div>;
}
