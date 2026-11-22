// Eclissi Stellare: fronti ufficiali approvati per la famiglia Maglio Ferrogravitazionale.
// La base della carta, le icone originali e le quattro evoluzioni 3D sono già
// incorporate nei file WebP. Le altre Armi conservano il fronte corrente.
// Nessuna modifica a HP, danni, rarità, costi o meccaniche del combattimento.
export const OFFICIAL_WEAPON_FRONT_BY_ID=Object.freeze({
 'weapon-confirmed-metallic-maglio':'/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio.webp',
 'weapon-confirmed-metallic-maglio-rarity-r':'/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-r.webp',
 'weapon-confirmed-metallic-maglio-rarity-e':'/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-e.webp',
 'weapon-confirmed-metallic-maglio-rarity-l':'/assets/fleet-weapon-fronts/weapon-confirmed-metallic-maglio-rarity-l.webp'
});
export const officialWeaponFacePath=id=>OFFICIAL_WEAPON_FRONT_BY_ID[id]||null;
