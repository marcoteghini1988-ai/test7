// Ricompensa reliquia soltanto dopo una vittoria su un boss verificato.
// Conserva la mappa storica e gli ID originali, senza scrivere o cancellare
// salvataggi: la persistenza rimane nel gestore principale dell'app.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';
import {officialBossEncounter} from './officialBossEncounter.js';

export function verifiedBossRelicReward({
 winner=null,mode=null,sectorNumber=null,bossPlanetId=null,bossSectorLevel=null
}={}){
 if(winner!=='player')return null;
 const encounter=officialBossEncounter({mode,sectorNumber,
  planetId:bossPlanetId,sectorLevel:bossSectorLevel});
 if(!encounter)return null;
 return PHASE16A_CAMPAIGN_PLANETS.find(p=>p.id===encounter.planetId)?.relic??null;
}

export function applyVerifiedBossRelic(relics,details){
 if(!relics||typeof relics!=='object'||Array.isArray(relics))
  throw new Error('Salvataggio reliquie non valido, nessuna modifica applicata');
 const relicId=verifiedBossRelicReward(details);
 if(!relicId)return {relics,granted:false,relicId:null};
 if(Boolean(relics[relicId]))return {relics,granted:false,relicId};
 return {relics:{...relics,[relicId]:true},granted:true,relicId};
}
