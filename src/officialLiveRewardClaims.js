// Ingresso unico alle ricompense dopo una VITTORIA nel duello LIVE.
// I tre salvataggi sono gia' idempotenti singolarmente: se il secondo
// fallisce, il giocatore deve poter riprovare e recuperare il terzo.
// Non attribuisce vittorie, prezzi o carte senza il risultato del duello.
import {claimFirstWinSpecialPack} from './specialDeckBuilder.js';
import {claimCampaignShipUnlock} from './shipCampaignRewards.js';
import {claimBossCharacterFromVictory} from './bossCharacterRewards.js';

export async function claimOfficialLiveVictoryRewards({
 winner=null,mode='campaign',sectorNumber=1,
 bossPlanetId=null,bossSectorLevel=null
}={},storage=globalThis.localStorage){
 if(winner!=='player'||!['campaign','adventure'].includes(mode))
  return {eligible:false,pack:null,ship:null,character:null};
 // L'ordine e' ripetibile e intenzionale: un errore interrompe il flusso
 // invece di essere ignorato. Al tentativo successivo i premi gia'
 // registrati rispondono already_claimed/already_owned, senza duplicarsi.
 const pack=claimFirstWinSpecialPack(mode,sectorNumber,storage);
 const ship=await claimCampaignShipUnlock(mode,sectorNumber,storage);
 const character=claimBossCharacterFromVictory({
  winner,mode,sectorNumber,bossPlanetId,bossSectorLevel
 },storage);
 return {eligible:true,pack,ship,character};
}
