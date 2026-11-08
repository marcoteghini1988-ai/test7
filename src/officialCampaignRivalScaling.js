// Curva avversario nel SOLO duello 3D ufficiale della campagna.
// Il livello del nemico non deve aumentare quando il giocatore potenzia
// la propria carta-navicella: altrimenti gli upgrade non danno progressione.
// Cinque gradi distribuiti nei 120 settori già esistenti; mai carte o HP gratis.
export const OFFICIAL_CAMPAIGN_RIVAL_PHASE_SIZE=24;
export function officialCampaignRivalLevel({mode='campaign',sectorNumber=1,playerLevel=1}={}){
 const level=Number.isInteger(playerLevel)?Math.max(1,Math.min(5,playerLevel)):1;
 if(!['campaign','adventure'].includes(mode))return level;
 if(!Number.isInteger(sectorNumber)||sectorNumber<1||sectorNumber>120)return level;
 return Math.min(5,1+Math.floor((sectorNumber-1)/OFFICIAL_CAMPAIGN_RIVAL_PHASE_SIZE));
}
