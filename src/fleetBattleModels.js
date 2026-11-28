import {PHASE1_SHIPS} from './fleetNext/shipCore.js';

const shipFormats=new Map([
 ...PHASE1_SHIPS.map(ship=>[ship.id,ship.rarita==='Comune'?'png':'webp']),
 // These three independent supports have artwork, though they are not
 // selectable as mother ships in the current twelve-ship campaign.
 ['C04','png'],['E03','webp'],['L02','webp']
]);

// The formation is built from the battle's equipped units, not from the
// illustration of the arena. Both view directions have their own texture.
export function escortArtwork(escort,side,assetRoot='/assets'){
 const id=escort?.shipModelId||escort?.originShipId;
 const format=shipFormats.get(id);
 if(!format)return escort?.visual||null;
 return `${assetRoot}/mathfleet/views/${side==='enemy'?'enemy_to_player':'player_to_enemy'}/${id}_complete.${format}`;
}

export function fusedEscortArtwork(escort,side,assetRoot='/assets'){
 const id=escort?.fused&&escort?.fusionModelIds?.find(model=>model!==escort.shipModelId);
 const format=shipFormats.get(id);
 return format?`${assetRoot}/mathfleet/views/${side==='enemy'?'enemy_to_player':'player_to_enemy'}/${id}_complete.${format}`:null;
}
