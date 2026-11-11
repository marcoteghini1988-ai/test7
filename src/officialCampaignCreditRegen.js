// Calcolo puro della rigenerazione passiva in campagna.
// La valuta rimane quella già prevista: 1 credito ogni 180_000 ms.
// Non attribuisce bonus, non supera cap con ricarica; premi di altre
// modalità possono legittimamente avere un saldo oltre cap.
export const LIVE_CREDIT_REGEN_MS=180_000;

export function recoverOfficialCampaignCredits({
 credits, lastMs, nowMs, maxCredits=200
}={}){
 if(!Number.isFinite(nowMs)||nowMs<0)throw new Error('Orologio non valido');
 if(!Number.isSafeInteger(maxCredits)||maxCredits<1)throw new Error('Cap crediti non valido');
 // Uno storage parzialmente scritto NON deve trasformare il saldo in NaN.
 // Il valore storico di primo accesso era maxCredits (200).
 const saved=Number.isSafeInteger(credits)&&credits>=0?credits:maxCredits;
 // Il salvataggio può provenire da un orologio spostato nel futuro.
 const last=Number.isFinite(lastMs)&&lastMs>=0&&lastMs<=nowMs?lastMs:nowMs;
 if(saved>=maxCredits){
  return {credits:saved,lastMs:nowMs,recovered:0,remainingMs:0,full:true};
 }
 const elapsed=nowMs-last;
 const whole=Math.floor(elapsed/LIVE_CREDIT_REGEN_MS);
 const recovered=Math.min(maxCredits-saved,whole);
 const balance=saved+recovered;
 // A cap pieno l'intervallo residuo va azzerato: nessun accumulo passivo
 // occulto durante una permanenza prolungata al cap.
 if(balance>=maxCredits){
  return {credits:balance,lastMs:nowMs,recovered,remainingMs:0,full:true};
 }
 const left=elapsed%LIVE_CREDIT_REGEN_MS;
 return {credits:balance,lastMs:last+whole*LIVE_CREDIT_REGEN_MS,
  recovered,remainingMs:LIVE_CREDIT_REGEN_MS-left,full:false};
}
