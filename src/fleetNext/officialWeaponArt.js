// Eclissi Stellare: fronti ufficiali approvati per Maglio, Slitta e Recuperatore.
// La base della carta, le icone originali e le quattro evoluzioni 3D sono già
// incorporate nei PNG HD. Le altre Armi conservano il fronte corrente.
// Nessuna modifica a HP, danni, rarità, costi o meccaniche del combattimento.
// La copia salvata di StackBlitz usa VITE_ASSET_ROOT per leggere gli asset
// pubblici da test7/main; la versione GitHub conserva i PNG nel repository.
import {PROBE_HAMMER_CARD_IDS} from '../probeHammerSpec.js';
import redWeaponFronts from './redWeaponFronts.json' with {type:'json'};
const ASSET_ROOT=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
// In StackBlitz è possibile aggiornare i nuovi fronti senza ricaricare tutte
// le pesanti immagini delle navi. Nel repository entrambi restano /assets.
const METAL_FRONT_ROOT=(import.meta.env?.VITE_METAL_FRONT_ROOT||ASSET_ROOT).replace(/\/+$/,'');
const CHAIN_FRONT_ROOT=(import.meta.env?.VITE_CHAIN_FRONT_ROOT||ASSET_ROOT).replace(/\/+$/,'');
const PRECISION_FRONT_ROOT=(import.meta.env?.VITE_PRECISION_FRONT_ROOT||ASSET_ROOT).replace(/\/+$/,'');
export const OFFICIAL_WEAPON_FRONT_BY_ID=Object.freeze({
 ...Object.fromEntries(PROBE_HAMMER_CARD_IDS.map(id=>[id,`/assets/fleet-weapon-fronts/${id}.png`])),
 'weapon-confirmed-metallic-maglio':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.png`,
 'weapon-confirmed-metallic-maglio-rarity-r':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.png`,
 'weapon-confirmed-metallic-maglio-rarity-e':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.png`,
 'weapon-confirmed-metallic-maglio-rarity-l':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.png`,
 ...Object.fromEntries([
  'weapon-confirmed-metallic-slitta',
  'weapon-confirmed-metallic-slitta-rarity-r',
  'weapon-confirmed-metallic-slitta-rarity-e',
  'weapon-confirmed-metallic-slitta-rarity-l',
  'weapon-designed-metallic-recuperatore-termobalistico',
  'weapon-designed-metallic-recuperatore-termobalistico-rarity-l'
 ].map(id=>[id,`${METAL_FRONT_ROOT}/fleet-weapon-fronts/${id}.png`])),
 ...Object.fromEntries([
  'weapon-designed-metallic-ganasce-magnetiche',
  'weapon-designed-metallic-ganasce-magnetiche-rarity-e',
  'weapon-designed-metallic-ganasce-magnetiche-rarity-l',
  'weapon-designed-metallic-collassatore-lega',
  'weapon-designed-metallic-collassatore-lega-rarity-l',
  'weapon-designed-metallic-frantumatore-induzione'
 ].map(id=>[id,`${CHAIN_FRONT_ROOT}/fleet-weapon-fronts/${id}.png`])),
 ...Object.fromEntries([
  'weapon-designed-metallic-frantumatore-induzione-rarity-l',
  'weapon-designed-metallic-perforatore-cascata',
  'weapon-designed-metallic-perforatore-cascata-rarity-l',
  'weapon-designed-metallic-artiglieria-schegge',
  'weapon-designed-metallic-artiglieria-schegge-rarity-e',
  'weapon-designed-metallic-artiglieria-schegge-rarity-l'
 ].map(id=>[id,`${PRECISION_FRONT_ROOT}/fleet-weapon-fronts/${id}.png`])),
 ...Object.fromEntries(["weapon-base-ionic-01", "weapon-base-ionic-01-rarity-r", "weapon-base-ionic-01-rarity-e", "weapon-base-ionic-01-rarity-l", "weapon-base-ionic-02", "weapon-base-ionic-02-rarity-r", "weapon-base-ionic-02-rarity-e", "weapon-base-ionic-02-rarity-l", "weapon-base-ionic-03", "weapon-base-ionic-03-rarity-r", "weapon-base-ionic-03-rarity-e", "weapon-base-ionic-03-rarity-l", "weapon-base-ionic-04", "weapon-base-ionic-04-rarity-e", "weapon-base-ionic-04-rarity-l"].map(id=>[id,`${ASSET_ROOT}/fleet-weapon-fronts/${id}.png`])),
 ...Object.fromEntries(["weapon-designed-ionic-nucleo-folgore", "weapon-designed-ionic-nucleo-folgore-rarity-e", "weapon-designed-ionic-nucleo-folgore-rarity-l"].map(id=>[id,`${ASSET_ROOT}/fleet-weapon-fronts/${id}.png`]))
});
export const officialWeaponFacePath=id=>OFFICIAL_WEAPON_FRONT_BY_ID[id]||null;
// Gli originali restano verificabili; si usa una variante PNG solo dopo che
// la pipeline ha materializzato e verificato il fronte con pannello rosso.
const redFrontIds=new Set(redWeaponFronts);
export const officialWeaponDisplayFacePath=id=>redFrontIds.has(id)&&OFFICIAL_WEAPON_FRONT_BY_ID[id]?
 `${ASSET_ROOT}/fleet-weapon-fronts-red/${id}.png`:officialWeaponFacePath(id);
