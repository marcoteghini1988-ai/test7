// Eclissi Stellare: fronti ufficiali approvati per la famiglia Maglio Ferrogravitazionale.
// La base della carta, le icone originali e le quattro evoluzioni 3D sono già
// incorporate nei PNG HD. Le altre Armi conservano il fronte corrente.
// Nessuna modifica a HP, danni, rarità, costi o meccaniche del combattimento.
// La copia salvata di StackBlitz usa VITE_ASSET_ROOT per leggere gli asset
// pubblici da test7/main; la versione GitHub conserva i PNG nel repository.
const ASSET_ROOT=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export const OFFICIAL_WEAPON_FRONT_BY_ID=Object.freeze({
 'weapon-confirmed-metallic-maglio':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.png`,
 'weapon-confirmed-metallic-maglio-rarity-r':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.png`,
 'weapon-confirmed-metallic-maglio-rarity-e':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.png`,
 'weapon-confirmed-metallic-maglio-rarity-l':`${ASSET_ROOT}/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.png`
});
export const officialWeaponFacePath=id=>OFFICIAL_WEAPON_FRONT_BY_ID[id]||null;
